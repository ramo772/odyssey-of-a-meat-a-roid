// Journey rules: the station-to-station loop from docs/design/gameplay-walkthrough.md
// (PR #79 walkthrough, roles, guide and monkey; PR #48 mission history).
// Every number in this file is a game rule for playtesting, not a NASA value.
// The page (index.html) owns the 3D scenes and screens; this file owns the
// decisions, so tests can check them without a browser.
(function (root) {
  const RES = ['water', 'fuel', 'oxygen', 'shield'];

  // ---- Route: stations are checkpoints, legs test the build ----
  const STATIONS = {
    uranus: { id: 'uranus', phase: 1, maxRank: 2, services: ['upgrade', 'craft', 'build'], stock: null },
    moon: { id: 'moon', phase: 2, maxRank: 3, services: ['upgrade', 'craft', 'repair', 'refuel', 'refit', 'trade', 'land'], stock: { water: 2, fuel: 3, oxygen: 2, shield: 2 } }
  };
  // Route bar runs 100 (Uranus) to 0 (Earth). The bar is not a distance in AU.
  const LEGS = [
    { id: 'leg1', from: 'uranus', to: 'moon', endPct: 45, hazard: 'sporadic', briefed: ['hull', 'power'], decisions: ['route', 'reserve', 'powerMode'] },
    { id: 'leg2', from: 'moon', to: 'earth', endPct: 0, hazard: 'shower', briefed: ['hull', 'thermal'], decisions: ['depart', 'stance', 'reserve'],
      shower: { start: 32, end: 16, lead: 5, sensorLead: 11, spawnScale: 0.45 } }
  ];
  function leg(id) { return LEGS.filter(function (l) { return l.id === id; })[0] || null; }
  function legIndex(id) { return LEGS.map(function (l) { return l.id; }).indexOf(id); }

  // ---- Credits and persistent stat levels ----
  // Shared mission funds, shown to players as stars: they pay for the science
  // payload and launch booster (js/mission.js) and for upgrades at the Moon base.
  const START_CREDITS = { beginner: 10, intermediate: 9, advanced: 8 };
  const PATHS = ['resilience', 'handling', 'storage', 'capacity'];
  const MAX_RANK = 3;
  const RANK_COST = [6, 9, 12];

  function newProgress(difficulty) {
    return {
      credits: START_CREDITS[difficulty] || START_CREDITS.intermediate,
      stats: { resilience: 0, handling: 0, storage: 0, capacity: 0 },
      modules: [],
      spent: 0,
      earned: 0,
      log: []
    };
  }
  function cloneProgress(p) {
    return { credits: p.credits, stats: Object.assign({}, p.stats), modules: p.modules.slice(), spent: p.spent, earned: p.earned, log: p.log.slice() };
  }

  // State of one rank on a path at a station: purchased, available,
  // unaffordable (with the shortfall) or locked (with the reason).
  function upgradeStatus(prog, path, rank, stationId) {
    const cur = prog.stats[path] || 0;
    const station = STATIONS[stationId];
    const cost = RANK_COST[rank - 1];
    if (rank <= cur) return { state: 'purchased', cost: cost };
    if (rank > cur + 1) return { state: 'locked', reason: 'prereq', need: rank - 1, cost: cost };
    if (!station || rank > station.maxRank) return { state: 'locked', reason: 'phase', phase: rank === 3 ? 2 : 1, cost: cost };
    if (prog.credits < cost) return { state: 'unaffordable', reason: 'credits', cost: cost, short: cost - prog.credits };
    return { state: 'available', cost: cost };
  }

  // Each purchase is applied once: it deducts its displayed cost and raises one rank.
  function buyUpgrade(prog, path, stationId) {
    if (PATHS.indexOf(path) < 0) return { ok: false, reason: 'path', prog: prog };
    const rank = (prog.stats[path] || 0) + 1;
    if (rank > MAX_RANK) return { ok: false, reason: 'max', prog: prog };
    const status = upgradeStatus(prog, path, rank, stationId);
    if (status.state !== 'available') return { ok: false, reason: status.reason, status: status, prog: prog };
    const next = cloneProgress(prog);
    next.credits -= status.cost;
    next.spent += status.cost;
    next.stats[path] = rank;
    next.log.push({ kind: 'upgrade', path: path, rank: rank, cost: status.cost, station: stationId });
    return { ok: true, prog: next, cost: status.cost, rank: rank };
  }

  // ---- Modules: crafted from supplies, mounted in capacity slots ----
  const MODULES = {
    sensor: { recipe: { shield: 1, oxygen: 1 }, requires: { capacity: 1 } },
    battery: { recipe: { water: 1, shield: 1 }, requires: { capacity: 1 } },
    plating: { recipe: { shield: 2 }, requires: { capacity: 1, resilience: 2 } }
  };
  function slots(prog) { return prog.stats.capacity || 0; }
  function hasAll(inv, cost) { return RES.every(function (id) { return (inv[id] || 0) >= (cost[id] || 0); }); }
  function minus(inv, cost) { const n = Object.assign({}, inv); RES.forEach(function (id) { n[id] = (n[id] || 0) - (cost[id] || 0); }); return n; }
  function plus(inv, gain) { const n = Object.assign({}, inv); RES.forEach(function (id) { n[id] = (n[id] || 0) + (gain[id] || 0); }); return n; }

  function moduleStatus(prog, id, inventory) {
    const m = MODULES[id];
    if (!m) return { state: 'unknown' };
    if (prog.modules.indexOf(id) >= 0) return { state: 'installed' };
    const unmet = Object.keys(m.requires).filter(function (path) { return (prog.stats[path] || 0) < m.requires[path]; });
    if (unmet.length) return { state: 'locked', reason: 'prereq', unmet: unmet.map(function (p) { return { path: p, rank: m.requires[p] }; }) };
    if (prog.modules.length >= slots(prog)) return { state: 'locked', reason: 'slots' };
    if (!hasAll(inventory, m.recipe)) return { state: 'short', reason: 'materials', recipe: m.recipe };
    return { state: 'available', recipe: m.recipe };
  }
  function craftModule(prog, id, inventory) {
    const status = moduleStatus(prog, id, inventory);
    if (status.state !== 'available') return { ok: false, reason: status.reason || status.state, prog: prog, inventory: inventory };
    const next = cloneProgress(prog);
    next.modules.push(id);
    next.log.push({ kind: 'craft', module: id });
    return { ok: true, prog: next, inventory: minus(inventory, MODULES[id].recipe) };
  }
  // Removing a module frees its slot and recovers half its materials, rounded down.
  function removeModule(prog, id, inventory) {
    if (prog.modules.indexOf(id) < 0) return { ok: false, reason: 'missing', prog: prog, inventory: inventory };
    const next = cloneProgress(prog);
    next.modules.splice(next.modules.indexOf(id), 1);
    const back = {};
    Object.keys(MODULES[id].recipe).forEach(function (r) { back[r] = Math.floor(MODULES[id].recipe[r] / 2); });
    next.log.push({ kind: 'remove', module: id });
    return { ok: true, prog: next, inventory: plus(inventory, back), recovered: back };
  }

  // ---- Star upgrades at the Moon base: physical items carried to the ship ----
  const STAR_UPGRADES = {
    plate: { path: 'resilience', cost: 2 },
    tank: { path: 'storage', cost: 2 },
    engine: { path: 'handling', cost: 2 },
    sensor: { module: 'sensor', cost: 2 }
  };
  function starUpgradeStatus(prog, id) {
    const u = STAR_UPGRADES[id];
    if (!u) return { state: 'unknown' };
    if (u.module && prog.modules.indexOf(u.module) >= 0) return { state: 'owned' };
    if (u.path && (prog.stats[u.path] || 0) >= MAX_RANK) return { state: 'owned' };
    if (prog.credits < u.cost) return { state: 'short', short: u.cost - prog.credits, cost: u.cost };
    return { state: 'available', cost: u.cost };
  }
  function buyStarUpgrade(prog, id) {
    const s = starUpgradeStatus(prog, id);
    if (s.state !== 'available') return { ok: false, reason: s.state, prog: prog };
    const u = STAR_UPGRADES[id], next = cloneProgress(prog);
    next.credits -= u.cost; next.spent += u.cost;
    if (u.path) next.stats[u.path] = (next.stats[u.path] || 0) + 1;
    if (u.module) next.modules.push(u.module);
    next.log.push({ kind: 'star', id: id, cost: u.cost });
    return { ok: true, prog: next, cost: u.cost };
  }

  // ---- Station trading ----
  const TRADE = { buy: 3, sell: 1 };
  function trade(prog, inventory, stock, kind, resource) {
    if (RES.indexOf(resource) < 0) return { ok: false, reason: 'resource' };
    if (kind === 'buy') {
      if (!stock || (stock[resource] || 0) < 1) return { ok: false, reason: 'stock' };
      if (prog.credits < TRADE.buy) return { ok: false, reason: 'credits' };
      const next = cloneProgress(prog); next.credits -= TRADE.buy; next.spent += TRADE.buy;
      const s = Object.assign({}, stock); s[resource] -= 1;
      const inv = Object.assign({}, inventory); inv[resource] = (inv[resource] || 0) + 1;
      return { ok: true, prog: next, inventory: inv, stock: s };
    }
    if (kind === 'sell') {
      if ((inventory[resource] || 0) < 1) return { ok: false, reason: 'none' };
      const next = cloneProgress(prog); next.credits += TRADE.sell;
      const s = Object.assign({}, stock || {}); s[resource] = (s[resource] || 0) + 1;
      const inv = Object.assign({}, inventory); inv[resource] -= 1;
      return { ok: true, prog: next, inventory: inv, stock: s };
    }
    return { ok: false, reason: 'kind' };
  }

  // ---- Refit: swap installed parts at a station that supports it ----
  // rules is MissionRules. New parts cost their install supplies; removed parts
  // return half their supplies, rounded down. Ranks and phase unlocks persist.
  const PART_KEYS = ['engine', 'tank', 'shield', 'cabin'];
  function partCost(rules, key, id) {
    const table = { engine: rules.ENGINE, tank: rules.TANK, shield: rules.SHIELD, cabin: rules.CABIN }[key];
    return Object.assign({}, table[id].cost);
  }
  function refitPreview(rules, oldCraft, newCraft, choices) {
    const costs = {}, recovered = {};
    const changed = PART_KEYS.filter(function (k) { return oldCraft[k] !== newCraft[k]; });
    changed.forEach(function (k) {
      const add = partCost(rules, k, newCraft[k]);
      Object.keys(add).forEach(function (r) { costs[r] = (costs[r] || 0) + add[r]; });
      const old = partCost(rules, k, oldCraft[k]);
      Object.keys(old).forEach(function (r) { recovered[r] = (recovered[r] || 0) + Math.floor(old[r] / 2); });
    });
    return {
      changed: changed,
      costs: costs,
      recovered: recovered,
      before: rules.shipProfile(oldCraft, choices),
      after: rules.shipProfile(newCraft, choices)
    };
  }
  function applyRefit(rules, oldCraft, newCraft, inventory, choices, ship) {
    const preview = refitPreview(rules, oldCraft, newCraft, choices);
    if (!preview.changed.length) return { ok: false, reason: 'same' };
    const afterRecovery = plus(inventory, preview.recovered);
    if (!hasAll(afterRecovery, preview.costs)) return { ok: false, reason: 'materials', preview: preview };
    let inv = minus(afterRecovery, preview.costs);
    const nextShip = Object.assign({}, ship, { damage: Object.assign({}, ship.damage) });
    nextShip.flightFuelMax = preview.after.tankCapacity;
    // A smaller tank cannot hold the extra propellant; it goes back to supplies.
    if (nextShip.flightFuel > preview.after.tankCapacity) {
      const extra = Math.floor(nextShip.flightFuel - preview.after.tankCapacity);
      inv = plus(inv, { fuel: extra });
      nextShip.flightFuel = preview.after.tankCapacity;
    }
    return { ok: true, craft: Object.assign({}, newCraft), inventory: inv, ship: nextShip, preview: preview };
  }

  // ---- Leg outcome, rewards and checkpoint retry ----
  // Stars earned per leg: 3 for a clean leg, 2 for a scuffed one, 1 otherwise.
  const REWARD = [{ upTo: 20, credits: 3 }, { upTo: 45, credits: 2 }, { upTo: 101, credits: 1 }];
  const SCHEDULE_BONUS = 0;
  const SEVERE_HULL = 35; // hull at or below this (65% or more lost) offers a checkpoint retry
  function legOutcome(info) {
    const lost = Math.max(0, Math.round((info.hullStart || 100) - (info.hullEnd || 0)));
    let base = REWARD[REWARD.length - 1].credits;
    for (let i = 0; i < REWARD.length; i++) { if (lost <= REWARD[i].upTo) { base = REWARD[i].credits; break; } }
    const bonus = info.waited ? 0 : SCHEDULE_BONUS;
    const start = info.damageStart || {}, end = info.damageEnd || {};
    const newDamage = Object.keys(end).filter(function (s) { return end[s] && !start[s]; });
    const briefed = (leg(info.legId) || { briefed: [] }).briefed;
    const lostCapability = newDamage.some(function (s) { return briefed.indexOf(s) >= 0; }) || !!info.powerLow;
    const grade = lost <= 20 ? 'clean' : lost <= 35 ? 'scuffed' : lost <= 50 ? 'heavy' : 'severe';
    return {
      legId: info.legId,
      lost: lost,
      reward: base + bonus,
      base: base,
      bonus: bonus,
      grade: grade,
      severe: (info.hullEnd || 0) <= SEVERE_HULL,
      newDamage: newDamage,
      lostCapability: lostCapability
    };
  }
  function awardLeg(prog, outcome) {
    const next = cloneProgress(prog);
    next.credits += outcome.reward;
    next.earned += outcome.reward;
    next.log.push({ kind: 'reward', leg: outcome.legId, credits: outcome.reward, lost: outcome.lost });
    return next;
  }

  // ---- The guide: rule-driven appearances, at most once per leg ----
  // kind: 'leg' (leg resolved), 'plan' (a committed plan failed its check),
  // 'repeat' (the same failed choice again). Never during active flight: the
  // page queues anything raised in flight for the next pause or station.
  function guideTrigger(kind, info, shown) {
    if (shown && shown[info.legId]) return null;
    if (kind === 'leg') {
      if (info.outcome.lostCapability) return 'lostCapability';
      if (info.outcome.lost >= 50) return 'heavyDamage';
      return null;
    }
    if (kind === 'plan') return info.problems && info.problems.length ? 'planInvalid' : null;
    if (kind === 'repeat') return info.sameFailure ? 'repeated' : null;
    return null;
  }
  // How much the guide says depends on difficulty (a design assumption).
  const GUIDE_DEPTH = { beginner: ['condition', 'signal', 'system', 'response', 'cost'], intermediate: ['condition', 'system', 'response'], advanced: ['condition', 'system'] };

  // ---- Team Mode: four roles, merged below four players ----
  const ROLES = ['nav', 'eng', 'sci', 'pilot'];
  const LAYOUTS = {
    1: [['nav', 'eng', 'sci', 'pilot']],
    2: [['nav', 'sci'], ['eng', 'pilot']],
    3: [['nav', 'sci'], ['eng'], ['pilot']],
    4: [['nav'], ['eng'], ['sci'], ['pilot']]
  };
  // What each role owns. Every role owns at least one decision that changes
  // the shared outcome; merged roles keep their decisions.
  const OWNS = {
    nav: ['route', 'depart', 'orbit', 'booster'],
    eng: ['build', 'power', 'resilience', 'storage', 'repair', 'refit', 'powerMode', 'mel'],
    sci: ['comms', 'capacity', 'craft', 'trade', 'stance', 'objective', 'instruments', 'recorder'],
    pilot: ['redundancy', 'handling', 'reserve']
  };
  function layout(players) { return LAYOUTS[Math.max(1, Math.min(4, players | 0))] || LAYOUTS[1]; }
  function playerForRole(players, role) {
    const l = layout(players);
    for (let i = 0; i < l.length; i++) if (l[i].indexOf(role) >= 0) return i;
    return 0;
  }
  function ownerOf(item) {
    for (let i = 0; i < ROLES.length; i++) if (OWNS[ROLES[i]].indexOf(item) >= 0) return ROLES[i];
    return null;
  }
  function decisionsOwnedBy(players, playerIndex) {
    const roles = layout(players)[playerIndex] || [];
    return [].concat.apply([], roles.map(function (r) { return OWNS[r]; }));
  }

  // ---- Encounter plan: three shared decisions per leg ----
  const DECISIONS = {
    route: { owner: 'nav', options: ['balanced', 'fuel-efficient', 'fast'], fallback: 'balanced' },
    reserve: { owner: 'pilot', options: ['reserve', 'none'], fallback: 'reserve' },
    powerMode: { owner: 'eng', options: ['normal', 'low'], fallback: 'low' },
    depart: { owner: 'nav', options: ['now', 'wait'], fallback: 'now' },
    stance: { owner: 'sci', options: ['reorient', 'ride'], fallback: 'reorient' }
  };
  const RESERVE_FUEL = 1;
  const WAIT_COST = { oxygen: 1 };

  // votes: {playerIndex: optionId}. One vote per player; a majority of
  // participants decides. Solo is a single vote.
  function tally(votes, players) {
    const n = Math.max(1, players | 0);
    const missing = [];
    const count = {};
    for (let i = 0; i < n; i++) {
      const v = votes && votes[i];
      if (v == null) missing.push(i); else count[v] = (count[v] || 0) + 1;
    }
    if (missing.length) return { status: 'missing', missing: missing, count: count };
    const best = Math.max.apply(null, Object.keys(count).map(function (k) { return count[k]; }));
    const top = Object.keys(count).filter(function (k) { return count[k] === best; });
    if (top.length === 1 && best > n / 2) return { status: 'decided', option: top[0], count: count };
    return { status: 'tie', options: top, count: count };
  }
  // First tie: neutral hint and a re-vote. Second tie: the crew revises the
  // options or explicitly agrees on a fallback before departure.
  function voteRound(prevTies, result) {
    if (result.status !== 'tie') return { action: result.status === 'decided' ? 'commit' : 'wait', ties: prevTies };
    if (prevTies >= 1) return { action: 'deadlock', ties: prevTies + 1 };
    return { action: 'revote', ties: prevTies + 1 };
  }

  // Check the combined plan against budget, compatibility and station state.
  // ctx: {legId, plan, prog, inventory, fuelAboard, margin, buildAffordable}
  function validatePlan(ctx) {
    const problems = [];
    const l = leg(ctx.legId);
    (l ? l.decisions : []).forEach(function (d) {
      if (!ctx.plan || ctx.plan[d] == null) problems.push({ id: 'undecided', decision: d });
    });
    // ctx.mission (leg 1 only): the science design must reach CML 4 (Point
    // Design) and its launch booster must lift the ship to the chosen orbit.
    const missionCost = ctx.mission ? ctx.mission.cost : 0;
    if (ctx.prog.credits - missionCost < 0) problems.push({ id: 'overBudget' });
    if (ctx.mission && ctx.mission.cmlLevel < 4) problems.push({ id: 'cmlLow' });
    if (ctx.mission && !ctx.mission.lvOk) problems.push({ id: 'lvCapacity' });
    if (ctx.buildAffordable === false) problems.push({ id: 'buildCost' });
    if (ctx.prog.modules.length > slots(ctx.prog)) problems.push({ id: 'incompatible', what: 'slots' });
    if (ctx.plan && ctx.plan.reserve === 'reserve' && (ctx.fuelAboard || 0) < RESERVE_FUEL + 1) problems.push({ id: 'reserveFuel' });
    if (ctx.plan && ctx.plan.depart === 'wait') {
      if ((ctx.margin || 0) < 1) problems.push({ id: 'waitMargin' });
      if (!hasAll(ctx.inventory, WAIT_COST)) problems.push({ id: 'waitOxygen' });
    }
    return { ok: problems.length === 0, problems: problems };
  }

  // Effects the plan has when the leg starts. Returns a new ship, inventory,
  // margin and flight flags. The page applies them only after validatePlan passes.
  function applyPlan(ctx) {
    const ship = Object.assign({}, ctx.ship, { damage: Object.assign({}, ctx.ship.damage) });
    let inv = Object.assign({}, ctx.inventory);
    let margin = ctx.margin;
    const flags = { lowPower: ctx.plan.powerMode === 'low', stance: ctx.plan.stance || null, waited: false, showerSkipped: false };
    ship.reserve = 0;
    if (ctx.plan.reserve === 'reserve' && ship.flightFuel >= RESERVE_FUEL + 1) {
      ship.flightFuel -= RESERVE_FUEL;
      ship.reserve = RESERVE_FUEL;
    }
    if (ctx.plan.depart === 'wait') {
      margin -= 1;
      inv = minus(inv, WAIT_COST);
      flags.waited = true;
      flags.showerSkipped = true;
    }
    return { ship: ship, inventory: inv, margin: margin, flags: flags };
  }
  // An unused reserve returns to the tank at the end of the leg.
  function releaseReserve(ship) {
    const next = Object.assign({}, ship, { damage: Object.assign({}, ship.damage) });
    next.flightFuel = Math.min(next.flightFuelMax || Infinity, (next.flightFuel || 0) + (next.reserve || 0));
    next.reserve = 0;
    return next;
  }
  // A rock that would hit is dodged by an emergency avoidance burn when a
  // reserve is aboard. Returns null when no reserve is left.
  function avoidanceBurn(ship) {
    if (!(ship.reserve > 0)) return null;
    const next = Object.assign({}, ship, { damage: Object.assign({}, ship.damage) });
    next.reserve -= 1;
    return next;
  }

  // Shower phase for a route-bar value. warning: forecast is live; active:
  // inside the stream. The sensor module doubles the warning.
  function showerPhase(pct, flags, hasSensor) {
    const l = LEGS[1].shower;
    // Skipped by waiting, or already behind the ship (stream passed or burned through).
    if (!flags || flags.showerSkipped || flags.showerDone) return 'none';
    const lead = hasSensor ? l.sensorLead : l.lead;
    if (pct <= l.start && pct > l.end) return 'active';
    if (pct > l.start && pct <= l.start + lead) return 'warning';
    return 'none';
  }
  // During the stream, reorienting puts the shielded side to the radiant: more
  // protection, slower handling. A game rule inspired by NASA's documented
  // operational mitigations (reorienting, panels edge-on, closing shutters).
  function streamProfile(profile, stance) {
    if (stance !== 'reorient') return profile;
    return Object.assign({}, profile, { protection: profile.protection + 1, handling: Math.max(0.4, profile.handling * 0.7) });
  }

  // ---- Checkpoint snapshots ----
  function snapshot(data) { return JSON.parse(JSON.stringify(data)); }

  root.Journey = {
    STATIONS: STATIONS, LEGS: LEGS, leg: leg, legIndex: legIndex,
    START_CREDITS: START_CREDITS, PATHS: PATHS, MAX_RANK: MAX_RANK, RANK_COST: RANK_COST,
    newProgress: newProgress, cloneProgress: cloneProgress, upgradeStatus: upgradeStatus, buyUpgrade: buyUpgrade,
    MODULES: MODULES, slots: slots, moduleStatus: moduleStatus, craftModule: craftModule, removeModule: removeModule,
    TRADE: TRADE, trade: trade, STAR_UPGRADES: STAR_UPGRADES, starUpgradeStatus: starUpgradeStatus, buyStarUpgrade: buyStarUpgrade,
    PART_KEYS: PART_KEYS, refitPreview: refitPreview, applyRefit: applyRefit,
    REWARD: REWARD, SCHEDULE_BONUS: SCHEDULE_BONUS, SEVERE_HULL: SEVERE_HULL, legOutcome: legOutcome, awardLeg: awardLeg,
    guideTrigger: guideTrigger, GUIDE_DEPTH: GUIDE_DEPTH,
    ROLES: ROLES, LAYOUTS: LAYOUTS, OWNS: OWNS, layout: layout, playerForRole: playerForRole, ownerOf: ownerOf, decisionsOwnedBy: decisionsOwnedBy,
    DECISIONS: DECISIONS, RESERVE_FUEL: RESERVE_FUEL, WAIT_COST: WAIT_COST,
    tally: tally, voteRound: voteRound, validatePlan: validatePlan, applyPlan: applyPlan,
    releaseReserve: releaseReserve, avoidanceBurn: avoidanceBurn,
    showerPhase: showerPhase, streamProfile: streamProfile,
    snapshot: snapshot
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
