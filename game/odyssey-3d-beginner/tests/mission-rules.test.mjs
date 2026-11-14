import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Run the browser script in this test's own realm, so objects it returns share
// Object.prototype with the expected values and deepEqual stays strict.
const code = fs.readFileSync(new URL('../js/mission-rules.js', import.meta.url), 'utf8');
vm.runInThisContext(code);
const rules = globalThis.MissionRules;

const stock = { water: 8, fuel: 10, oxygen: 6, shield: 4 };
const noDamage = () => ({ thermal: false, propulsion: false, life: false, power: false });

function choices(over) {
  return Object.assign({
    power: 'solar-battery',
    communications: 'standard',
    trajectory: 'balanced',
    redundancy: 'single'
  }, over);
}

const lightCraft = { engine: 'small', tank: 'small', shield: 'basic', cabin: 'compact' };
const heavyCraft = { engine: 'medium', tank: 'large', shield: 'advanced', cabin: 'comfort' };
const mediumCraft = { engine: 'medium', tank: 'medium', shield: 'basic', cabin: 'compact' };

test('a heavier protected ship turns slower than a light ship', () => {
  const light = rules.shipProfile(lightCraft, choices());
  const heavy = rules.shipProfile(heavyCraft, choices({ power: 'rtg', redundancy: 'redundant', communications: 'high-gain' }));
  assert.ok(heavy.protection > light.protection);
  assert.ok(heavy.handling < light.handling);
  assert.ok(heavy.mass > light.mass);
  assert.ok(rules.steerSpeed(light.handling) > rules.steerSpeed(heavy.handling));
});

test('a large fast engine spends more fuel per second of steering than a small efficient one', () => {
  const small = rules.shipProfile(lightCraft, choices({ trajectory: 'fuel-efficient' }));
  const large = rules.shipProfile(
    { engine: 'large', tank: 'small', shield: 'basic', cabin: 'compact' },
    choices({ trajectory: 'fast' })
  );
  assert.ok(rules.maneuverFuelPerSecond(large, choices({ trajectory: 'fast' }))
    > rules.maneuverFuelPerSecond(small, choices({ trajectory: 'fuel-efficient' })));
});

test('sunlight uses the fact-sheet endpoints and stays at the Uranus value until the recovery knee', () => {
  const ratio = rules.URANUS_SOLAR_WM2 / rules.EARTH_SOLAR_WM2;
  assert.equal(rules.URANUS_SOLAR_WM2, 3.69);
  assert.equal(rules.EARTH_SOLAR_WM2, 1361.0);
  assert.equal(Number(ratio.toFixed(4)), 0.0027);
  assert.ok(Math.abs(rules.solarFraction(100) - ratio) < 1e-12);
  assert.equal(rules.solarFraction(40), rules.solarFraction(100));
  assert.equal(rules.solarFraction(0), 1);
  assert.ok(rules.solarFraction(10) > rules.solarFraction(100));
  assert.ok(rules.solarFraction(10) < 1);
  assert.ok(rules.solarFraction(100) < rules.systemLoad(choices(), noDamage()));
});

test('the battery drains while sunlight is short, steering spends fuel, and the RTG does not drain', () => {
  const farShip = { battery: 5, flightFuel: 3, damage: noDamage() };
  const empty = Object.assign({}, farShip, { battery: 0 });
  const solarFar = rules.powerState(choices(), 100, farShip);
  assert.equal(solarFar.solarShort, true);
  assert.equal(solarFar.brownout, false);
  assert.ok(solarFar.batteryDrainPerSecond > 0);
  assert.equal(rules.powerState(choices(), 0, empty).batteryDrainPerSecond, 0);
  assert.equal(rules.powerState(choices(), 100, empty).brownout, true);
  const rtgFar = rules.powerState(choices({ power: 'rtg' }), 100, empty);
  assert.equal(rtgFar.batteryDrainPerSecond, 0);
  assert.equal(rtgFar.output, rules.powerState(choices({ power: 'rtg' }), 0, empty).output);
  assert.equal(rtgFar.brownout, false);
  const launched = rules.launchFrom(lightCraft, choices(), stock);
  const coasting = rules.stepCruise(launched.profile, choices(), launched.ship, launched.inventory, 100, 2, false);
  assert.ok(coasting.ship.battery < launched.ship.battery);
  assert.equal(coasting.ship.flightFuel, launched.ship.flightFuel);
  const steered = rules.stepCruise(launched.profile, choices(), launched.ship, launched.inventory, 100, 1, true);
  assert.ok(steered.ship.flightFuel < launched.ship.flightFuel);
});

test('solar power alone is short at departure and covers the ship near Earth', () => {
  const forecast = rules.designForecast(lightCraft, choices({ communications: 'high-gain' }), stock, 'advanced');
  assert.equal(forecast.depart.solarShort, true);
  assert.equal(forecast.depart.brownout, false);
  assert.equal(forecast.arrive.solarShort, false);
  const rtg = rules.designForecast(lightCraft, choices({ power: 'rtg', communications: 'high-gain' }), stock, 'advanced');
  assert.ok(rtg.profile.handling < forecast.profile.handling);
  assert.equal(rtg.depart.brownout, false);
  assert.equal(rtg.depart.source, 'rtg');
});

test('the advanced shield takes less damage than the basic shield on every difficulty', () => {
  const basic = rules.shipProfile(lightCraft, choices());
  const advanced = rules.shipProfile({ engine: 'medium', tank: 'medium', shield: 'advanced', cabin: 'compact' }, choices());
  const ship = { damage: noDamage() };
  for (const level of ['beginner', 'intermediate', 'advanced']) {
    assert.ok(rules.absorbDamage(advanced, ship, level) < rules.absorbDamage(basic, ship, level));
  }
});

test('patch spends the matching resource and a solar power patch spends a battery charge', () => {
  const plan = choices();
  const launched = rules.launchFrom(mediumCraft, plan, stock);
  const thermal = rules.applyResponse('patch', launched.profile, plan, launched.ship, launched.inventory, 'thermal', 'intermediate');
  assert.equal(thermal.ok, true);
  assert.equal(thermal.ship.hull, 100);
  assert.equal(thermal.inventory.shield, launched.inventory.shield - 1);
  const power = rules.applyResponse('patch', launched.profile, plan, launched.ship, launched.inventory, 'power', 'intermediate');
  assert.equal(power.ok, true);
  assert.equal(power.ship.battery, launched.ship.battery - 1);
  assert.deepEqual(power.inventory, launched.inventory);
});

test('a power hit on an RTG ship has no free patch and browns the ship out until fixed', () => {
  const plan = choices({ power: 'rtg' });
  const launched = rules.launchFrom({ engine: 'large', tank: 'medium', shield: 'basic', cabin: 'compact' }, plan, stock);
  const ids = rules.listResponses(launched.profile, plan, launched.ship, launched.inventory, 'power', 'beginner').map(o => o.id);
  assert.deepEqual(ids, ['absorb']);
  const hit = rules.applyResponse('absorb', launched.profile, plan, launched.ship, launched.inventory, 'power', 'beginner');
  assert.equal(hit.ship.damage.power, true);
  const live = rules.flightPerformance(launched.profile, plan, 50, hit.ship);
  assert.equal(live.brownout, true);
  assert.ok(live.handling < rules.flightPerformance(launched.profile, plan, 50, launched.ship).handling);
  const fixed = rules.applyStation('fix:power', launched.profile, hit.ship, hit.inventory, plan);
  assert.equal(fixed.ok, true);
  assert.equal(fixed.inventory.shield, hit.inventory.shield - 1);
  assert.equal(rules.flightPerformance(launched.profile, plan, 50, fixed.ship).brownout, false);
});

test('absorb persists damage, and a later station repair clears it once', () => {
  const plan = choices();
  const launched = rules.launchFrom(heavyCraft, plan, stock);
  const hit = rules.applyResponse('absorb', launched.profile, plan, launched.ship, launched.inventory, 'thermal', 'advanced');
  assert.ok(hit.ship.hull < 100);
  assert.equal(hit.ship.damage.thermal, true);
  const again = rules.applyStation('fix:thermal', launched.profile, hit.ship, hit.inventory, plan);
  assert.equal(again.ok, true);
  assert.equal(again.ship.damage.thermal, false);
  assert.equal(again.inventory.shield, hit.inventory.shield - 1);
  const twice = rules.applyStation('fix:thermal', launched.profile, again.ship, again.inventory, plan);
  assert.equal(twice.ok, false);
  assert.deepEqual(twice.inventory, again.inventory);
});

test('after a hit the choices are patch, backup and absorb', () => {
  const plan = choices({ redundancy: 'redundant' });
  const launched = rules.launchFrom(lightCraft, plan, stock);
  const options = rules.listResponses(launched.profile, plan, launched.ship, launched.inventory, 'life', 'beginner');
  assert.deepEqual(options.map(option => option.id), ['patch', 'backup', 'absorb']);
  assert.equal(options[0].cost, 1);
  assert.equal(options[2].hullLoss, rules.absorbDamage(launched.profile, launched.ship, 'beginner'));
  const dry = rules.listResponses(launched.profile, choices(), launched.ship, { water: 0, fuel: 0, oxygen: 0, shield: 0 }, 'thermal', 'beginner');
  assert.deepEqual(dry.map(option => option.id), ['backup', 'absorb']);
});

test('a backup covers the first hit only', () => {
  const plan = choices({ redundancy: 'redundant' });
  const launched = rules.launchFrom(mediumCraft, plan, stock);
  const first = rules.applyResponse('backup', launched.profile, plan, launched.ship, launched.inventory, 'life', 'advanced');
  assert.equal(first.ok, true);
  assert.equal(first.ship.hull, 100);
  assert.equal(first.ship.backupLeft, 0);
  const second = rules.applyResponse('backup', launched.profile, plan, first.ship, first.inventory, 'life', 'advanced');
  assert.equal(second.ok, false);
});

test('damaged life support uses oxygen every interval, then hull when oxygen runs out', () => {
  const plan = choices();
  const launched = rules.launchFrom(lightCraft, plan, stock, { life: true });
  const half = rules.GAME.lifeInterval / 2;
  const a = rules.stepCruise(launched.profile, plan, launched.ship, launched.inventory, 80, half, false);
  assert.equal(a.lifeEvent, null);
  const b = rules.stepCruise(launched.profile, plan, a.ship, a.inventory, 80, half, false);
  assert.equal(b.lifeEvent, 'oxygen');
  assert.equal(b.inventory.oxygen, launched.inventory.oxygen - 1);
  assert.equal(b.ship.hull, 100);
  const dry = Object.assign({}, b.inventory, { oxygen: 0 });
  const c = rules.stepCruise(launched.profile, plan, b.ship, dry, 80, rules.GAME.lifeInterval, false);
  assert.equal(c.lifeEvent, 'hull');
  assert.equal(c.ship.hull, 100 - rules.GAME.lifeHull);
  const clean = rules.launchFrom(lightCraft, plan, stock);
  const healthy = rules.stepCruise(clean.profile, plan, clean.ship, clean.inventory, 80, 30, false);
  assert.equal(healthy.lifeEvent, null);
});

test('landing on the Moon costs maneuver fuel and an empty tank cannot land', () => {
  const launched = rules.launchFrom(mediumCraft, choices(), stock);
  const landed = rules.moonLanding(launched.ship);
  assert.equal(landed.ok, true);
  assert.equal(landed.ship.flightFuel, launched.ship.flightFuel - rules.GAME.moonLandingFuel);
  const empty = rules.moonLanding(Object.assign({}, launched.ship, { flightFuel: 0.5 }));
  assert.equal(empty.ok, false);
  assert.equal(empty.reason, 'fuel');
});

test('running out of fuel does not slow the route', () => {
  const full = rules.simulateLeg(lightCraft, choices(), stock, 'beginner', []);
  const dry = rules.simulateLeg(lightCraft, choices(), Object.assign({}, stock, { fuel: 2 }), 'beginner', []);
  assert.ok(full.ship.flightFuel > 0);
  assert.equal(dry.ship.flightFuel, 0);
  assert.equal(full.ok, true);
  assert.equal(dry.ok, true);
  assert.equal(dry.time, full.time);
});

test('absorbing the same hits fails a basic-shield ship and a better-protected ship survives', () => {
  const hits = [2, 4, 6, 8].map(at => ({ at, system: 'propulsion', response: 'absorb' }));
  const basic = rules.simulateLeg(mediumCraft, choices(), stock, 'advanced', hits);
  const armored = rules.simulateLeg({ engine: 'medium', tank: 'medium', shield: 'advanced', cabin: 'compact' }, choices(), stock, 'advanced', hits);
  assert.equal(basic.ok, false);
  assert.equal(basic.ship.hull, 0);
  assert.equal(armored.ok, true);
  assert.equal(armored.ship.hull, 100 - 4 * rules.absorbDamage(rules.shipProfile({ engine: 'medium', tank: 'medium', shield: 'advanced', cabin: 'compact' }, choices()), { damage: noDamage() }, 'advanced'));
});

test('a solar build and an RTG build both finish, at different costs', () => {
  const hits = [{ at: 6, system: 'thermal' }, { at: 14, system: 'power' }];
  // A solar ship on the fast route takes the thermal hit; it keeps its battery for the dark.
  const solar = rules.simulateLeg(lightCraft, choices({ trajectory: 'fast' }), stock, 'advanced', [hits[0]]);
  const rtg = rules.simulateLeg({ engine: 'large', tank: 'medium', shield: 'basic', cabin: 'compact' }, choices({ power: 'rtg' }), stock, 'advanced', hits);
  assert.equal(solar.ok, true);
  assert.equal(rtg.ok, true);
  assert.equal(solar.ship.hull, 100);
  assert.equal(solar.ship.damage.power, false);
  assert.ok(rtg.ship.hull < 100);
  assert.equal(rtg.ship.damage.power, true);
});

test('hull loss fails arrival, and coasting in with hull left still arrives', () => {
  assert.deepEqual(rules.arrival({ hull: 0, flightFuel: 3 }), { ok: false, reason: 'hull' });
  assert.deepEqual(rules.arrival({ hull: 40, flightFuel: 0 }), { ok: true, coasted: true });
  assert.deepEqual(rules.arrival({ hull: 40, flightFuel: 1.2 }), { ok: true, coasted: false });
});

test('a downed explorer can spend oxygen to stand, or be carried back at no supply cost', () => {
  const up = rules.stabilize({ water: 1, fuel: 1, oxygen: 2, shield: 1 }, 0);
  assert.equal(up.ok, true);
  assert.equal(up.health, rules.GAME.stabilizeHealth);
  assert.equal(up.inventory.oxygen, 1);
  assert.deepEqual(rules.stabilize({ water: 1, fuel: 1, oxygen: 0, shield: 1 }, 0), {
    ok: false,
    reason: 'oxygen',
    inventory: { water: 1, fuel: 1, oxygen: 0, shield: 1 },
    health: 0
  });
  assert.deepEqual(rules.rescue(0), { ok: true, health: rules.GAME.rescueHealth });
  assert.ok(rules.GAME.rescueHealth < rules.GAME.stabilizeHealth);
  assert.equal(rules.rescue(20).ok, false);
});

test('fault readings point to exactly the fault they were built from', () => {
  for (const system of rules.REPAIR_SYSTEMS) {
    const answers = new Set();
    for (let i = 0; i < 3; i++) {
      const fault = rules.makeFault(system, i);
      assert.ok(fault.options.includes(fault.answer));
      answers.add(JSON.stringify(fault.readings));
    }
    assert.equal(answers.size, 3, system + ' faults must look different');
  }
  assert.deepEqual(rules.makeFault('propulsion', 1).readings.map(r => r.value), [100, 100, 40, 40]);
  assert.deepEqual(rules.makeFault('power', 0).readings.map(r => r.value), ['off', 'off', 'off', 'off']);
  assert.deepEqual(rules.makeFault('power', 2).readings.map(r => r.value), ['on', 'on', 'off', 'off']);
  assert.deepEqual(rules.makeFault('life', 2).readings.map(r => r.value), ['normal', 'normal', 'high']);
});

test('a correct repair is free, a wrong guess costs, and a quick patch starts the flight damaged', () => {
  const fuelFault = rules.makeFault('propulsion', 0);
  assert.deepEqual(rules.resolveRepair(fuelFault, fuelFault.answer, stock, 100), { result: 'fixed', inventory: stock, health: 100 });
  const wrongFuel = rules.resolveRepair(fuelFault, 'leak3', stock, 100);
  assert.equal(wrongFuel.result, 'wrong');
  assert.equal(wrongFuel.inventory.fuel, stock.fuel - 1);
  const wrongPower = rules.resolveRepair(rules.makeFault('power', 0), 'junctionA', stock, 100);
  assert.equal(wrongPower.health, 100 - rules.GAME.faultShock);
  assert.deepEqual(wrongPower.inventory, stock);
  const wrongLife = rules.resolveRepair(rules.makeFault('life', 0), 'fan', { water: 0, fuel: 0, oxygen: 0, shield: 0 }, 100);
  assert.equal(wrongLife.inventory.oxygen, 0);
  assert.equal(rules.resolveRepair(fuelFault, 'patch', stock, 100).result, 'patched');
  const damage = rules.launchDamage({ power: 'fixed', propulsion: 'patched', life: 'patched' });
  assert.deepEqual(damage, { propulsion: true, life: true });
  const launched = rules.launchFrom(mediumCraft, choices(), stock, damage);
  assert.equal(launched.ship.damage.propulsion, true);
  assert.equal(launched.ship.damage.life, true);
  assert.equal(launched.ship.damage.power, false);
  const clean = rules.launchFrom(mediumCraft, choices(), stock);
  assert.ok(rules.flightPerformance(launched.profile, choices(), 50, launched.ship).handling
    < rules.flightPerformance(clean.profile, choices(), 50, clean.ship).handling);
});

test('surface wind damage follows collected shield parts', () => {
  assert.equal(rules.windDamage(0, 3), 7);
  assert.equal(rules.windDamage(1, 3), 3);
  assert.equal(rules.windDamage(3, 3), 0);
});

// ---- Hands-on repairs and the cabin emergency (Rana Emad's mini-games) ----

function seeded(seed) {
  let s = seed;
  return () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
}

test('the cable step only asks for the circuits the fault left dark', () => {
  assert.deepEqual(rules.deadCircuits(rules.makeFault('power', 0)), ['lights', 'radio', 'heater', 'engineControl']);
  assert.deepEqual(rules.deadCircuits(rules.makeFault('power', 1)), ['lights', 'radio']);
  assert.deepEqual(rules.deadCircuits(rules.makeFault('power', 2)), ['heater', 'engineControl']);
  const task = rules.cableTask(rules.makeFault('power', 1), seeded(7));
  assert.deepEqual(task.loose, ['lights', 'radio']);
  assert.deepEqual(Object.values(task.colourOf).sort(), [0, 1, 2, 3]);
  assert.deepEqual([...task.sockets].sort(), [...rules.CIRCUITS].sort());
});

test('propellant tanks start mixed and pouring follows the same-propellant rule', () => {
  const tanks = rules.makeTanks(seeded(3));
  assert.equal(tanks.length, 7);
  assert.equal(rules.tanksSorted(tanks), false);
  const counts = {};
  tanks.flat().forEach(id => { counts[id] = (counts[id] || 0) + 1; });
  rules.PROPELLANTS.forEach(id => assert.equal(counts[id], 4));
  const custom = [['xenon', 'hydrazine'], ['hydrazine'], [], ['xenon', 'xenon', 'xenon', 'xenon']];
  assert.equal(rules.pourTop(custom, 0, 3).ok, false, 'a full tank takes nothing');
  assert.equal(rules.pourTop(custom, 1, 0).ok, true, 'same propellant on top');
  const poured = rules.pourTop(custom, 0, 1);
  assert.equal(poured.moved, 1);
  assert.deepEqual(poured.tanks[1], ['hydrazine', 'hydrazine']);
  assert.deepEqual(custom[1], ['hydrazine'], 'the input is not changed');
  assert.equal(rules.pourTop([['xenon'], ['hydrazine']], 0, 1).ok, false, 'no mixing');
  assert.equal(rules.tanksSorted([['xenon', 'xenon', 'xenon', 'xenon'], []]), true);
});

test('a solar ship brings its battery into the cabin emergency, an RTG brings steady output', () => {
  const ship = rules.freshShip(rules.shipProfile(mediumCraft, choices()), choices(), 4);
  const solar = rules.cabinStart(choices(), ship, 100);
  assert.equal(solar.power, 100);
  assert.ok(solar.regen < 0.02, 'almost no sunlight to recharge far from the Sun');
  const drained = rules.cabinStart(choices(), Object.assign({}, ship, { battery: 0.6 }), 100);
  assert.ok(Math.abs(drained.power - 20) < 1e-9);
  const rtgShip = rules.freshShip(rules.shipProfile(mediumCraft, choices({ power: 'rtg' })), choices({ power: 'rtg' }), 4);
  const rtg = rules.cabinStart(choices({ power: 'rtg' }), rtgShip, 100);
  assert.equal(rtg.regen, rules.CABIN_RULES.rtgRegen);
});

test('cabin controls cost oxygen or electricity, and only the matching control clears an alarm', () => {
  let cabin = Object.assign(rules.cabinStart(choices(), { battery: 5, damage: noDamage() }, 100), { event: 'leak', oxygen: 50 });
  const noGas = rules.cabinAct(cabin, 'oxygen', { oxygen: 0 });
  assert.equal(noGas.result, 'no-oxygen');
  const wrong = rules.cabinAct(cabin, 'temp', { oxygen: 2 });
  assert.equal(wrong.result, 'wasted');
  assert.equal(wrong.cabin.power, 100 - rules.CABIN_RULES.powerCost);
  assert.equal(wrong.cabin.event, 'leak');
  const right = rules.cabinAct(cabin, 'oxygen', { oxygen: 2 });
  assert.equal(right.result, 'fixed');
  assert.equal(right.inventory.oxygen, 1);
  assert.equal(right.cabin.oxygen, 95);
  assert.equal(right.cabin.event, null);
  cabin = Object.assign({}, cabin, { power: rules.CABIN_RULES.powerCost - 1, event: 'co2' });
  assert.equal(rules.cabinAct(cabin, 'filter', { oxygen: 2 }).result, 'no-power');
});

test('ignoring cabin alarms fails, answering them survives, and each outcome reaches the ship', () => {
  const ship = Object.assign(rules.freshShip(rules.shipProfile(mediumCraft, choices()), choices(), 4, { life: true }), { battery: 5 });
  const always = id => () => id;
  let ignored = rules.cabinStart(choices(), ship, 100);
  while (!ignored.done) ignored = rules.cabinTick(ignored, 0.25, always('leak'));
  assert.equal(ignored.survived, false);
  const failed = rules.cabinFinish(ignored, ship, choices());
  assert.equal(failed.ship.hull, 100 - rules.CABIN_RULES.failHull);
  assert.equal(failed.ship.damage.life, true);

  let handled = rules.cabinStart(choices(), ship, 100);
  let inv = { oxygen: 10 };
  while (!handled.done) {
    handled = rules.cabinTick(handled, 0.25, always('leak'));
    if (handled.event === 'leak' && handled.oxygen < 70) {
      const acted = rules.cabinAct(handled, 'oxygen', inv);
      handled = acted.cabin; inv = acted.inventory;
    }
  }
  assert.equal(handled.survived, true);
  assert.ok(inv.oxygen < 10, 'surviving spent oxygen supplies');
  const fixed = rules.cabinFinish(handled, ship, choices());
  assert.equal(fixed.ship.damage.life, false);
  assert.equal(fixed.ship.hull, 100);
});

test('electricity spent in the cabin leaves a solar ship with less battery, never more', () => {
  const ship = Object.assign(rules.freshShip(rules.shipProfile(mediumCraft, choices()), choices(), 4), { battery: 3 });
  const spent = rules.cabinFinish({ power: 20, survived: true }, ship, choices());
  assert.ok(Math.abs(spent.ship.battery - 0.6) < 1e-9);
  const full = rules.cabinFinish({ power: 100, survived: true }, ship, choices());
  assert.equal(full.ship.battery, 3);
});


// ---- Balance checks (DEC-016): lift-off, power through the dark, cabin pressure ----

test('lift-off needs thrust above the ship’s weight at Uranus’s 8.69 m/s²', () => {
  assert.equal(rules.URANUS_G, 8.69);
  const light = rules.liftOff(lightCraft, choices(), 4);
  assert.ok(light.ok && light.twr > 1);
  assert.ok(Math.abs(light.weightN - light.massKg * 8.69) < 1e-6);
  const smallFullLarge = rules.liftOff({ engine: 'small', tank: 'large', shield: 'basic', cabin: 'compact' }, choices(), 8);
  assert.equal(smallFullLarge.ok, false, 'a small engine cannot lift a full large tank');
  assert.equal(rules.liftOff({ engine: 'small', tank: 'large', shield: 'basic', cabin: 'compact' }, choices(), 2).ok, true, 'the same ship lifts off with less propellant');
  const heavy = { engine: 'medium', tank: 'large', shield: 'advanced', cabin: 'comfort' };
  const heavyPlan = choices({ power: 'rtg', communications: 'high-gain', redundancy: 'redundant' });
  assert.equal(rules.liftOff(heavy, heavyPlan, 8).ok, false);
  assert.equal(rules.liftOff(Object.assign({}, heavy, { engine: 'large' }), heavyPlan, 8).ok, true, 'a bigger engine fixes it');
});

test('a launch that cannot lift off is refused and spends nothing', () => {
  const inv = { water: 8, fuel: 12, oxygen: 6, shield: 4 };
  const out = rules.launchFrom({ engine: 'small', tank: 'large', shield: 'basic', cabin: 'compact' }, choices(), inv);
  assert.equal(out.ok, false);
  assert.equal(out.reason, 'liftoff');
  assert.ok(out.liftoff.twr < 1);
  assert.deepEqual(inv, { water: 8, fuel: 12, oxygen: 6, shield: 4 });
});

test('power through the dark: several solar builds work, the slow route needs an RTG', () => {
  const ok = plan => rules.powerForecast(choices(plan)).ok;
  assert.equal(ok({}), true);
  assert.equal(ok({ trajectory: 'fast', communications: 'high-gain' }), true);
  assert.equal(ok({ communications: 'high-gain' }), false, 'high-gain on the balanced route goes dark');
  assert.equal(ok({ trajectory: 'fuel-efficient' }), false, 'the slow route stays in the dark too long');
  assert.equal(ok({ trajectory: 'fuel-efficient', power: 'rtg' }), true);
  assert.equal(ok({ communications: 'high-gain', power: 'rtg' }), true);
  assert.ok(rules.powerForecast(choices()).left < rules.GAME.batteryStart);
});

test('a solar ship that runs out of battery in the dark goes dark and the journey fails', () => {
  const dark = rules.simulateLeg(lightCraft, choices({ communications: 'high-gain', redundancy: 'redundant' }), stock, 'beginner', []);
  assert.equal(dark.ok, false);
  assert.equal(dark.reason, 'power');
  assert.equal(rules.arrival(dark.ship).reason, 'power');
  const fine = rules.simulateLeg(lightCraft, choices(), stock, 'beginner', []);
  assert.equal(fine.ok, true);
  const rtg = rules.simulateLeg(mediumCraft, choices({ power: 'rtg', communications: 'high-gain', redundancy: 'redundant', trajectory: 'fuel-efficient' }), stock, 'beginner', []);
  assert.equal(rtg.ok, true, 'an RTG never goes dark');
});

test('cabin alarms drain faster while life support is damaged', () => {
  const ship = rules.freshShip(rules.shipProfile(mediumCraft, choices()), choices(), 4);
  const run = damage => {
    let c = Object.assign(rules.cabinStart(choices(), Object.assign({}, ship, { damage: Object.assign(noDamage(), damage) }), 100), { event: 'leak', eventClock: 99 });
    for (let i = 0; i < 8; i++) c = rules.cabinTick(c, 0.25, () => 'leak');
    return c.oxygen;
  };
  assert.ok(run({ life: true }) < run({}));
});
