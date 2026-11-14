import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

vm.runInThisContext(fs.readFileSync(new URL('../js/mission-rules.js', import.meta.url), 'utf8'));
vm.runInThisContext(fs.readFileSync(new URL('../js/journey.js', import.meta.url), 'utf8'));
vm.runInThisContext(fs.readFileSync(new URL('../js/mission.js', import.meta.url), 'utf8'));
const rules = globalThis.MissionRules, J = globalThis.Journey, M = globalThis.MissionDesign;

const choices = over => Object.assign({ power: 'rtg', communications: 'high-gain', trajectory: 'balanced', redundancy: 'single' }, over);
const craft = { engine: 'medium', tank: 'medium', shield: 'basic', cabin: 'compact' };
function design(over) {
  let d = M.emptyDesign();
  d = M.toggleObjective(d, 'rings', 'beginner').design;
  d = M.toggleInstrument(d, 'camera', 'beginner').design;
  return Object.assign(d, { orbit: 'ringPlane', booster: 'medium', recorder: 'large', compared: true }, over);
}

test('CML 1: one objective on Beginner, up to three on Advanced', () => {
  let d = M.emptyDesign();
  d = M.toggleObjective(d, 'rings', 'beginner').design;
  d = M.toggleObjective(d, 'moons', 'beginner').design;
  assert.deepEqual(d.objectives, ['moons']);
  let a = M.emptyDesign();
  for (const o of ['rings', 'moons', 'atmosphere']) a = M.toggleObjective(a, o, 'advanced').design;
  assert.equal(a.objectives.length, 3);
  assert.equal(M.toggleObjective(a, 'magnetosphere', 'advanced').reason, 'maxObjectives');
});

test('instruments that cannot serve the objective are greyed out with a reason', () => {
  let d = M.toggleObjective(M.emptyDesign(), 'magnetosphere', 'beginner').design;
  assert.equal(M.instrumentStatus(d, 'camera', 'beginner').reason, 'incompatible');
  assert.equal(M.instrumentStatus(d, 'magnetometer', 'beginner').state, 'available');
  assert.equal(M.instrumentStatus(M.emptyDesign(), 'camera', 'beginner').reason, 'noObjective');
  // Switching the objective drops instruments that no longer match.
  d = M.toggleInstrument(d, 'magnetometer', 'beginner').design;
  d = M.pruneInstruments(M.toggleObjective(d, 'rings', 'beginner').design);
  assert.deepEqual(d.instruments, []);
});

test('CML 2 requirements come from the objective (begin with the end in mind)', () => {
  const r = M.requirements(design());
  assert.equal(r[0].data, 6); assert.deepEqual(r[0].instruments, ['camera']); assert.equal(r[0].bestOrbit, 'ringPlane');
});

test('every instrument has a consequence: mass, power, data and cost all rise', () => {
  const one = design(), two = M.toggleInstrument(design(), 'spectrometer', 'beginner').design;
  assert.ok(M.payloadKg(two) > M.payloadKg(one));
  assert.ok(M.payloadLoad(two) > M.payloadLoad(one));
  assert.ok(M.missionCost(two) > M.missionCost(one));
  assert.ok(M.expectedData(two, 2.8) > M.expectedData(one, 2.8));
});

test('scan mini-game: data only flows while the target is in the circle; good orbits make the circle bigger', () => {
  const d = design();
  const s0 = M.newScience(d);
  assert.equal(M.collect(s0, d, 'rings', 1, false), s0);
  assert.ok(M.collect(s0, d, 'rings', 1, true).stored.rings > 0);
  assert.equal(M.collect(s0, d, 'moons', 1, true), s0);
  assert.ok(M.targetRadius(design({ orbit: 'ringPlane' }), 'rings') > M.targetRadius(design({ orbit: 'polar' }), 'rings'));
  // A steady player with the right build meets the need; the forecast assumes 75% aim.
  assert.ok(M.expectedData(d) >= M.OBJECTIVES.rings.data);
  assert.equal(M.passSeconds(design({ orbit: 'wide' })), 26);
});

test('the orbit decides coverage: the right orbit returns more science', () => {
  assert.ok(M.expectedData(design({ orbit: 'ringPlane' }), 2.8) > M.expectedData(design({ orbit: 'polar' }), 2.8));
});

test('launch vehicle: capacity depends on booster and orbit, and mass must fit', () => {
  assert.ok(M.capacityKg(design({ orbit: 'polar' })) < M.capacityKg(design({ orbit: 'ringPlane' })));
  const ok = M.budget(rules, craft, choices(), design({ booster: 'heavy' }), { loadedFuel: 4, credits: 45 });
  assert.ok(M.launchCheck(ok).ok);
  const heavyShip = { engine: 'large', tank: 'large', shield: 'advanced', cabin: 'comfort' };
  const tight = M.budget(rules, heavyShip, choices(), design({ booster: 'light', orbit: 'polar' }), { loadedFuel: 8, credits: 45 });
  assert.equal(M.launchCheck(tight).reason, 'lvCapacity');
});

test('the MEL lists every payload item and the budget subtracts its cost', () => {
  const b = M.budget(rules, craft, choices(), design(), { loadedFuel: 4, credits: 45 });
  assert.deepEqual(b.mel.map(r => r.kind), ['instrument', 'recorder', 'booster']);
  assert.equal(b.cost, 2 + 2 + 2);
  assert.equal(b.creditsLeft, 45 - 6);
  assert.ok(b.massKg > 0 && b.capacityKg === 2400);
});

test('a solar ship has a much smaller power margin for instruments than an RTG ship', () => {
  const rtg = M.budget(rules, craft, choices(), design(), { loadedFuel: 4, credits: 45 });
  const solar = M.budget(rules, craft, choices({ power: 'solar-battery' }), design(), { loadedFuel: 4, credits: 45 });
  assert.ok(rtg.powerMargin > solar.powerMargin);
  assert.ok(rtg.powerMargin >= 0);
});

test('CML levels advance only when 80% of each checklist is complete, in order', () => {
  const empty = M.cmlChecklist(M.emptyDesign(), M.budget(rules, craft, choices(), M.emptyDesign(), { credits: 45 }));
  assert.equal(empty.level, 0);
  const noTrade = design({ compared: false });
  const lvl3 = M.cmlChecklist(noTrade, M.budget(rules, craft, choices(), noTrade, { loadedFuel: 4, credits: 45 }));
  assert.ok(lvl3.scores[3] < 1);
  const full = M.cmlChecklist(design(), M.budget(rules, craft, choices(), design(), { loadedFuel: 4, credits: 45 }));
  assert.equal(full.level, 4);
});

test('data: the recorder overflows, downlink grows as Earth gets closer, hits corrupt stored data', () => {
  const d = design({ recorder: 'small' });
  let s = M.newScience(d);
  for (let t = 0; t < 80; t++) s = M.collect(s, d, 'rings', 0.5, true);
  assert.ok(M.sumData(s.stored) <= M.RECORDERS.small.capacity + 1e-9);
  assert.ok(s.lost > 0);
  assert.ok(M.downlinkRate('high-gain', 30) > M.downlinkRate('high-gain', 100));
  assert.ok(M.downlinkRate('high-gain', 50) > M.downlinkRate('standard', 50));
  const sent = M.downlink(s, 'high-gain', 50, 1, true);
  assert.ok(M.sumData(sent.delivered) > 0);
  assert.equal(M.downlink(s, 'high-gain', 50, 1, false), s);
  const hit = M.corrupt(s);
  assert.ok(M.sumData(hit.stored) < M.sumData(s.stored));
  const landed = M.land(sent);
  assert.equal(M.sumData(landed.stored), 0);
  const v = M.scienceValue(landed, d)[0];
  assert.ok(Math.abs(v.got - (landed.delivered.rings + M.LANDING_RECOVERY * landed.recovered.rings)) < 1e-9);
});

test('score rewards success, science, efficiency and teamwork; a failed mission scores lower', () => {
  const d = design();
  const sci = Object.assign(M.newScience(d), { delivered: { rings: 6 } });
  const good = M.scoreMission({ home: true, science: sci, design: d, massMargin: 0.2, creditsLeft: 12, brownout: false, planFirstTry: true, deadlocks: 0, repeatedFailures: 0 });
  assert.equal(good.total, 100); assert.equal(good.grade, 'A');
  const bad = M.scoreMission({ home: false, science: M.newScience(d), design: d, massMargin: -0.1, creditsLeft: -1, brownout: true, planFirstTry: false, deadlocks: 1, repeatedFailures: 1 });
  assert.ok(bad.total < 30);
});

test('the report names real NASA missions with similar characteristics', () => {
  assert.deepEqual(M.closestMissions(design()), ['voyager2u', 'cassini', 'webbUranus', 'uop']);
  let polar = M.toggleObjective(M.emptyDesign(), 'magnetosphere', 'beginner').design;
  polar = Object.assign(polar, { orbit: 'polar' });
  assert.ok(M.closestMissions(polar).includes('juno'));
});

test('the plan check blocks launch below CML 4, over budget, or beyond booster capacity', () => {
  const prog = J.newProgress('beginner');
  const plan = { route: 'balanced', reserve: 'none', powerMode: 'normal' };
  const base = { legId: 'leg1', plan, prog, inventory: { water: 3, fuel: 4, oxygen: 3, shield: 3 }, fuelAboard: 4, margin: 2 };
  assert.ok(J.validatePlan(Object.assign({}, base, { mission: { cmlLevel: 4, lvOk: true, cost: 6 } })).ok);
  const bad = J.validatePlan(Object.assign({}, base, { mission: { cmlLevel: 3, lvOk: false, cost: 99 } }));
  assert.deepEqual(bad.problems.map(p => p.id).sort(), ['cmlLow', 'lvCapacity', 'overBudget']);
});

test('instruments add power load only while observing, and payload adds launch mass', () => {
  const base = rules.systemLoad(choices(), {});
  assert.equal(rules.systemLoad(choices({ payloadLoad: 0.2 }), {}), base);
  assert.ok(rules.systemLoad(choices({ payloadLoad: 0.2, instrumentsOn: true }), {}) > base);
  assert.ok(rules.liftOff(craft, choices({ payloadKg: 100 }), 4).massKg === rules.liftOff(craft, choices(), 4).massKg + 100);
});
