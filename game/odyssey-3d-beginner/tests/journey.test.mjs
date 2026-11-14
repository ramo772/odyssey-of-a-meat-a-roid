import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Same pattern as mission-rules.test.mjs: run the browser scripts in this realm.
vm.runInThisContext(fs.readFileSync(new URL('../js/mission-rules.js', import.meta.url), 'utf8'));
vm.runInThisContext(fs.readFileSync(new URL('../js/journey.js', import.meta.url), 'utf8'));
const rules = globalThis.MissionRules;
const J = globalThis.Journey;

const choices = over => Object.assign({ power: 'solar-battery', communications: 'standard', trajectory: 'balanced', redundancy: 'single' }, over);
const craft = { engine: 'medium', tank: 'medium', shield: 'basic', cabin: 'compact' };
const inv = over => Object.assign({ water: 4, fuel: 6, oxygen: 3, shield: 4 }, over);

// Walkthrough §8: spend on the same stat at two successive checkpoints.
test('the same stat bought at two checkpoints deducts each cost once and persists', () => {
  let p = J.newProgress('intermediate');
  assert.equal(p.credits, 9);
  p = Object.assign(p, { credits: 40 });
  const a = J.buyUpgrade(p, 'resilience', 'uranus');
  assert.ok(a.ok); assert.equal(a.cost, 6); assert.equal(a.prog.credits, 34); assert.equal(a.prog.stats.resilience, 1);
  p = J.awardLeg(a.prog, { legId: 'leg1', reward: 8, lost: 30 });
  const b = J.buyUpgrade(p, 'resilience', 'moon');
  assert.ok(b.ok); assert.equal(b.cost, 9); assert.equal(b.prog.credits, 34 + 8 - 9); assert.equal(b.prog.stats.resilience, 2);
  // The original object is untouched, so a refused or previewed change keeps state.
  assert.equal(a.prog.stats.resilience, 1);
});

test('accumulated resilience changes a usable flight capability', () => {
  const base = rules.shipProfile(craft, choices());
  const ranked = rules.shipProfile(craft, choices({ stats: { resilience: 2 } }));
  assert.ok(ranked.protection > base.protection);
  const ship = rules.freshShip(base, choices(), 4, {});
  assert.ok(rules.absorbDamage(ranked, ship, 'beginner') < rules.absorbDamage(base, ship, 'beginner'));
  const fast = rules.shipProfile(craft, choices({ stats: { handling: 2 } }));
  assert.ok(fast.handling > base.handling);
  const big = rules.shipProfile(craft, choices({ stats: { storage: 1 } }));
  assert.equal(big.tankCapacity, base.tankCapacity + 1);
});

test('star upgrades at the Moon base cost 2 stars, apply once, and refuse when short', () => {
  let p = J.newProgress('beginner');
  assert.equal(p.credits, 10);
  const plate = J.buyStarUpgrade(p, 'plate');
  assert.ok(plate.ok); assert.equal(plate.prog.credits, 8); assert.equal(plate.prog.stats.resilience, 1);
  const sensor = J.buyStarUpgrade(plate.prog, 'sensor');
  assert.ok(sensor.ok); assert.ok(sensor.prog.modules.includes('sensor'));
  assert.equal(J.starUpgradeStatus(sensor.prog, 'sensor').state, 'owned');
  const poor = Object.assign(J.cloneProgress(p), { credits: 1 });
  assert.equal(J.buyStarUpgrade(poor, 'engine').reason, 'short');
  assert.equal(poor.stats.handling, 0);
});

test('leg stars: 3 for a clean leg, 2 for a scuffed one, 1 otherwise', () => {
  assert.equal(J.legOutcome({ legId: 'leg1', hullStart: 100, hullEnd: 90 }).reward, 3);
  assert.equal(J.legOutcome({ legId: 'leg1', hullStart: 100, hullEnd: 60 }).reward, 2);
  assert.equal(J.legOutcome({ legId: 'leg1', hullStart: 100, hullEnd: 30 }).reward, 1);
});

test('a phase-locked rank and an unaffordable rank each explain why and keep credits', () => {
  let p = Object.assign(J.newProgress('advanced'), { credits: 20 }); // most funds already spent on the payload
  p = J.buyUpgrade(p, 'handling', 'uranus').prog;
  p = J.buyUpgrade(p, 'handling', 'uranus').prog; // 6 + 9 = 15, 5 left
  const locked = J.upgradeStatus(p, 'handling', 3, 'uranus');
  assert.equal(locked.state, 'locked'); assert.equal(locked.reason, 'phase');
  const poor = J.upgradeStatus(p, 'storage', 1, 'uranus');
  assert.equal(poor.state, 'unaffordable'); assert.equal(poor.short, 1);
  const refused = J.buyUpgrade(p, 'storage', 'uranus');
  assert.equal(refused.ok, false); assert.equal(refused.prog.credits, 5);
  assert.equal(J.upgradeStatus(p, 'resilience', 2, 'uranus').reason, 'prereq');
});

test('a specialized and a mixed build fit the same budget and differ in flight', () => {
  const start = Object.assign(J.newProgress('intermediate'), { credits: 40 });
  let s = J.buyUpgrade(start, 'resilience', 'uranus').prog;
  s = J.buyUpgrade(s, 'resilience', 'uranus').prog;
  let m = J.buyUpgrade(start, 'resilience', 'uranus').prog;
  m = J.buyUpgrade(m, 'handling', 'uranus').prog;
  m = J.buyUpgrade(m, 'storage', 'uranus').prog;
  assert.ok(s.credits >= 0 && m.credits >= 0);
  const ps = rules.shipProfile(craft, choices({ stats: s.stats }));
  const pm = rules.shipProfile(craft, choices({ stats: m.stats }));
  assert.ok(ps.protection > pm.protection);
  assert.ok(pm.handling > ps.handling);
  assert.ok(pm.tankCapacity > ps.tankCapacity);
});

test('crafting needs a slot and the prerequisite, and consumes the inputs once', () => {
  let p = J.newProgress('beginner');
  assert.equal(J.moduleStatus(p, 'sensor', inv()).state, 'locked');
  p = J.buyUpgrade(p, 'capacity', 'uranus').prog;
  const made = J.craftModule(p, 'sensor', inv());
  assert.ok(made.ok);
  assert.deepEqual(made.inventory, { water: 4, fuel: 6, oxygen: 2, shield: 3 });
  const again = J.craftModule(made.prog, 'sensor', made.inventory);
  assert.equal(again.ok, false);
  assert.equal(J.moduleStatus(made.prog, 'battery', made.inventory).reason, 'slots');
  assert.equal(J.moduleStatus(made.prog, 'plating', made.inventory).reason, 'prereq');
  const short = J.craftModule(p, 'plating', inv({ shield: 1 }));
  assert.equal(short.ok, false);
});

test('a module adds mass, and the spare battery adds a charge to a solar ship', () => {
  const base = rules.shipProfile(craft, choices());
  const withMod = rules.shipProfile(craft, choices({ modules: ['battery'] }));
  assert.ok(withMod.mass > base.mass);
  assert.equal(rules.freshShip(withMod, choices({ modules: ['battery'] }), 3, {}).battery, rules.GAME.batteryStart + 1);
  assert.equal(rules.freshShip(withMod, choices({ power: 'rtg', modules: ['battery'] }), 3, {}).battery, 0);
});

test('a trade consumes the displayed inputs once and respects station stock', () => {
  let p = J.newProgress('beginner');
  let stock = { water: 1, fuel: 0, oxygen: 0, shield: 0 };
  const buy = J.trade(p, inv(), stock, 'buy', 'water');
  assert.ok(buy.ok); assert.equal(buy.prog.credits, p.credits - J.TRADE.buy); assert.equal(buy.inventory.water, 5); assert.equal(buy.stock.water, 0);
  assert.equal(J.trade(buy.prog, buy.inventory, buy.stock, 'buy', 'water').reason, 'stock');
  const sell = J.trade(buy.prog, buy.inventory, buy.stock, 'sell', 'fuel');
  assert.ok(sell.ok); assert.equal(sell.inventory.fuel, 5); assert.equal(sell.prog.credits, buy.prog.credits + J.TRADE.sell);
});

test('a deliberate downgrade then a compatible refit keeps ranks and moves supplies', () => {
  let p = J.newProgress('beginner');
  p = J.buyUpgrade(p, 'handling', 'uranus').prog;
  const ch = choices({ stats: p.stats });
  const heavy = { engine: 'medium', tank: 'large', shield: 'advanced', cabin: 'compact' };
  const ship = rules.freshShip(rules.shipProfile(heavy, ch), ch, 8, {});
  const light = Object.assign({}, heavy, { shield: 'basic', tank: 'small' });
  const down = J.applyRefit(rules, heavy, light, inv(), ch, ship);
  assert.ok(down.ok);
  assert.ok(down.preview.after.handling > down.preview.before.handling);
  assert.ok(down.preview.after.protection < down.preview.before.protection);
  // The small tank holds 4 (+0 storage); the extra 4 propellant returns to supplies.
  assert.equal(down.ship.flightFuel, 4);
  const up = J.applyRefit(rules, light, Object.assign({}, light, { tank: 'medium' }), down.inventory, ch, down.ship);
  assert.ok(up.ok);
  assert.equal(p.stats.handling, 1);
  assert.equal(J.applyRefit(rules, light, light, inv(), ch, ship).ok, false);
});

test('leg rewards fall with damage and severe damage offers a checkpoint retry', () => {
  const clean = J.legOutcome({ legId: 'leg1', hullStart: 100, hullEnd: 82 });
  const worse = J.legOutcome({ legId: 'leg1', hullStart: 100, hullEnd: 50 });
  assert.ok(clean.reward > worse.reward);
  assert.equal(clean.severe, false);
  assert.equal(J.legOutcome({ legId: 'leg1', hullStart: 100, hullEnd: 33 }).severe, true);
  assert.equal(J.legOutcome({ legId: 'leg2', hullStart: 90, hullEnd: 80, waited: true }).bonus, 0);
});

test('the guide stays out of a clean leg and appears once for a warned loss', () => {
  const clean = J.legOutcome({ legId: 'leg2', hullStart: 100, hullEnd: 90, damageStart: {}, damageEnd: {} });
  assert.equal(J.guideTrigger('leg', { legId: 'leg2', outcome: clean }, {}), null);
  const hurt = J.legOutcome({ legId: 'leg2', hullStart: 100, hullEnd: 70, damageStart: {}, damageEnd: { thermal: true } });
  assert.equal(hurt.lostCapability, true);
  assert.equal(J.guideTrigger('leg', { legId: 'leg2', outcome: hurt }, {}), 'lostCapability');
  assert.equal(J.guideTrigger('leg', { legId: 'leg2', outcome: hurt }, { leg2: true }), null);
  assert.equal(J.guideTrigger('plan', { legId: 'leg1', problems: [{ id: 'overBudget' }] }, {}), 'planInvalid');
  assert.equal(J.guideTrigger('repeat', { legId: 'leg1', sameFailure: true }, {}), 'repeated');
});

test('every role owns a shared decision in 4, 3, 2 and solo layouts', () => {
  for (const n of [1, 2, 3, 4]) {
    const l = J.layout(n);
    assert.equal(l.length, n);
    assert.deepEqual([].concat(...l).sort(), [...J.ROLES].sort());
    for (let i = 0; i < n; i++) assert.ok(J.decisionsOwnedBy(n, i).length > 0);
  }
  // Each named role owns at least one encounter decision that changes the outcome.
  const encounter = Object.keys(J.DECISIONS);
  for (const role of J.ROLES) {
    const owned = J.OWNS[role];
    assert.ok(owned.some(d => encounter.includes(d)) || owned.includes('build') || owned.includes('craft'), role);
  }
  assert.equal(J.playerForRole(3, 'sci'), 0);
  assert.equal(J.playerForRole(2, 'pilot'), 1);
});

test('votes: majority commits, first tie re-votes, second tie needs a fallback', () => {
  assert.equal(J.tally({ 0: 'now', 1: 'now', 2: 'wait' }, 3).option, 'now');
  assert.equal(J.tally({ 0: 'now' }, 2).status, 'missing');
  const tie = J.tally({ 0: 'now', 1: 'wait' }, 2);
  assert.equal(tie.status, 'tie');
  const first = J.voteRound(0, tie);
  assert.equal(first.action, 'revote');
  assert.equal(J.voteRound(first.ties, tie).action, 'deadlock');
  assert.equal(J.tally({ 0: 'ride' }, 1).option, 'ride');
});

test('an invalid plan reports each problem; a valid one applies its costs once', () => {
  const prog = J.newProgress('beginner');
  const bad = J.validatePlan({ legId: 'leg2', plan: { depart: 'wait', stance: 'reorient', reserve: 'reserve' }, prog, inventory: inv({ oxygen: 0 }), fuelAboard: 1, margin: 0, buildAffordable: true });
  assert.equal(bad.ok, false);
  assert.deepEqual(bad.problems.map(p => p.id).sort(), ['reserveFuel', 'waitMargin', 'waitOxygen']);
  assert.equal(J.validatePlan({ legId: 'leg1', plan: { route: 'fast' }, prog, inventory: inv(), fuelAboard: 4, margin: 2 }).problems[0].id, 'undecided');
  const ship = rules.freshShip(rules.shipProfile(craft, choices()), choices(), 5, {});
  const plan = { depart: 'wait', stance: 'reorient', reserve: 'reserve' };
  assert.ok(J.validatePlan({ legId: 'leg2', plan, prog, inventory: inv(), fuelAboard: 5, margin: 2 }).ok);
  const out = J.applyPlan({ plan, ship, inventory: inv(), margin: 2 });
  assert.equal(out.ship.reserve, 1); assert.equal(out.ship.flightFuel, 4);
  assert.equal(out.inventory.oxygen, 2); assert.equal(out.margin, 1);
  assert.equal(out.flags.showerSkipped, true);
  const dodged = J.avoidanceBurn(out.ship);
  assert.equal(dodged.reserve, 0);
  assert.equal(J.avoidanceBurn(dodged), null);
  assert.equal(J.releaseReserve(out.ship).flightFuel, 5);
});

test('two viable leg-2 plans leave different states for the final approach', () => {
  const ship = rules.freshShip(rules.shipProfile(craft, choices()), choices(), 5, {});
  const wait = J.applyPlan({ plan: { depart: 'wait', stance: 'ride', reserve: 'none' }, ship, inventory: inv(), margin: 2 });
  const go = J.applyPlan({ plan: { depart: 'now', stance: 'reorient', reserve: 'reserve' }, ship, inventory: inv(), margin: 2 });
  assert.ok(wait.margin < go.margin);
  assert.ok(wait.ship.flightFuel > go.ship.flightFuel);
  assert.equal(J.showerPhase(30, wait.flags, false), 'none');
  assert.equal(J.showerPhase(30, go.flags, false), 'active');
  assert.equal(J.showerPhase(35, go.flags, false), 'warning');
  assert.equal(J.showerPhase(40, go.flags, false), 'none');
  assert.equal(J.showerPhase(40, go.flags, true), 'warning');
});

test('reorienting in the stream trades handling for protection', () => {
  const p = rules.shipProfile(craft, choices());
  const r = J.streamProfile(p, 'reorient');
  assert.ok(r.protection > p.protection && r.handling < p.handling);
  assert.equal(J.streamProfile(p, 'ride'), p);
});

test('low-power cruise saves battery through the dark and costs handling', () => {
  const ship = { battery: 3, damage: {} };
  const normal = rules.powerState(choices(), 100, ship).batteryDrainPerSecond;
  const low = rules.powerState(choices({ lowPower: true }), 100, ship).batteryDrainPerSecond;
  assert.ok(low < normal);
  const p = rules.shipProfile(craft, choices());
  const s = rules.freshShip(p, choices(), 4, {});
  assert.ok(rules.flightPerformance(p, choices({ lowPower: true }), 50, s).handling < rules.flightPerformance(p, choices(), 50, s).handling);
});
