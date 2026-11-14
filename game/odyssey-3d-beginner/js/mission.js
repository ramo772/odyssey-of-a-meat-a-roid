// Science mission design rules: the Space Apps 2026 "Space Mission Design Game"
// challenge (docs/resources/challenge-2026). Flint's trip home becomes a science
// mission at Uranus: objective → requirements → instruments, recorder, orbit and
// launch booster → simulated operations (data, downlink, power) → score and report.
// Stages follow JPL's Concept Maturity Levels (CML 1–4). Every number here is a
// game rule for playtesting; NASA facts shown to players are cited in the page.
(function (root) {
  // ---- CML 1: science objectives at Uranus ----
  // data: units of science data the user segment needs. match: how well each
  // instrument serves the objective (0 = not viable, greyed out as in NASA's
  // Build It Yourself game).
  const OBJECTIVES = {
    rings: { data: 6, match: { camera: 1, spectrometer: 0.5, magnetometer: 0 }, bestOrbit: 'ringPlane' },
    atmosphere: { data: 8, match: { camera: 0.5, spectrometer: 1, magnetometer: 0 }, bestOrbit: 'polar' },
    moons: { data: 6, match: { camera: 1, spectrometer: 0.5, magnetometer: 0 }, bestOrbit: 'wide' },
    magnetosphere: { data: 4, match: { camera: 0, spectrometer: 0, magnetometer: 1 }, bestOrbit: 'polar' }
  };
  const MAX_OBJECTIVES = { beginner: 1, intermediate: 2, advanced: 3 };
  const MAX_INSTRUMENTS = { beginner: 2, intermediate: 2, advanced: 3 };

  // ---- Payload, recorder, orbit and launch booster ----
  // kg: mass. load: power while observing. rate: data units per second of science pass. cost: credits.
  const INSTRUMENTS = {
    camera: { kg: 40, load: 0.10, rate: 0.38, cost: 2 },
    spectrometer: { kg: 60, load: 0.12, rate: 0.45, cost: 3 },
    magnetometer: { kg: 15, load: 0.04, rate: 0.26, cost: 1 }
  };
  const RECORDERS = {
    small: { capacity: 6, kg: 10, cost: 1 },
    large: { capacity: 12, kg: 25, cost: 2 }
  };
  // coverage: how much of each objective this orbit lets the instruments observe.
  const ORBITS = {
    ringPlane: { coverage: { rings: 1, moons: 0.6, atmosphere: 0.5, magnetosphere: 0.5 }, capacityFactor: 1.0, ringHazard: true },
    polar: { coverage: { rings: 0.5, moons: 0.4, atmosphere: 1, magnetosphere: 1 }, capacityFactor: 0.85, ringHazard: false },
    wide: { coverage: { rings: 0.6, moons: 1, atmosphere: 0.3, magnetosphere: 0.7 }, capacityFactor: 0.9, ringHazard: false }
  };
  // Payload capacity to the science orbit (kg) before the orbit factor. Launch from
  // the fictional Uranus platform is fiction; capacity-versus-orbit is the real trade.
  const BOOSTERS = {
    light: { capacityKg: 1800, cost: 1 },
    medium: { capacityKg: 2400, cost: 2 },
    heavy: { capacityKg: 3200, cost: 3 }
  };
  // The science pass is a timed orbit at Uranus before departure (seconds per
  // orbit), split evenly across the objectives. In the scan mini-game the ship
  // must keep each target inside its scanner circle; aim is the share of time a
  // steady player keeps it there, used for the expected-data forecast.
  const SCIENCE_PASS = { seconds: { ringPlane: 22, polar: 22, wide: 26 }, aim: 0.75, radius: 4.6 };
  // Downlink: data units per second at Uranus distance, rising with the inverse
  // square of distance (NASA Basics of Space Flight, ch. 6), capped near Earth.
  const DOWNLINK = { standard: 0.012, 'high-gain': 0.04, cap: 16, minDistance: 0.25 };
  const LANDING_RECOVERY = 0.5; // data still aboard at landing counts half (game rule)

  function emptyDesign() {
    return { objectives: [], instruments: [], recorder: 'small', orbit: null, booster: null, options: {}, compared: false };
  }
  function cloneDesign(d) { return JSON.parse(JSON.stringify(d)); }

  function toggleObjective(design, id, difficulty) {
    if (!OBJECTIVES[id]) return { ok: false, reason: 'unknown', design: design };
    const next = cloneDesign(design);
    const at = next.objectives.indexOf(id);
    if (at >= 0) { next.objectives.splice(at, 1); return { ok: true, design: next }; }
    const max = MAX_OBJECTIVES[difficulty] || 1;
    if (max === 1) { next.objectives = [id]; return { ok: true, design: next }; }
    if (next.objectives.length >= max) return { ok: false, reason: 'maxObjectives', max: max, design: design };
    next.objectives.push(id);
    return { ok: true, design: next };
  }

  // Best match of an instrument against the chosen objectives (0 = greyed out).
  function instrumentMatch(design, inst) {
    return design.objectives.reduce(function (best, o) { return Math.max(best, OBJECTIVES[o].match[inst] || 0); }, 0);
  }
  function instrumentStatus(design, inst, difficulty) {
    if (!INSTRUMENTS[inst]) return { state: 'unknown' };
    if (design.instruments.indexOf(inst) >= 0) return { state: 'chosen', match: instrumentMatch(design, inst) };
    if (!design.objectives.length) return { state: 'locked', reason: 'noObjective' };
    const m = instrumentMatch(design, inst);
    if (m === 0) return { state: 'locked', reason: 'incompatible' };
    if (design.instruments.length >= (MAX_INSTRUMENTS[difficulty] || 2)) return { state: 'locked', reason: 'maxInstruments' };
    return { state: 'available', match: m };
  }
  function toggleInstrument(design, inst, difficulty) {
    const next = cloneDesign(design);
    const at = next.instruments.indexOf(inst);
    if (at >= 0) { next.instruments.splice(at, 1); return { ok: true, design: next }; }
    const s = instrumentStatus(design, inst, difficulty);
    if (s.state !== 'available') return { ok: false, reason: s.reason, design: design };
    next.instruments.push(inst);
    return { ok: true, design: next };
  }
  // Changing objectives can strand an instrument that no longer matches.
  function pruneInstruments(design) {
    const next = cloneDesign(design);
    next.instruments = next.instruments.filter(function (i) { return instrumentMatch(next, i) > 0; });
    return next;
  }

  // ---- CML 2: requirements derived from the objectives ("begin with the end in mind") ----
  function requirements(design) {
    return design.objectives.map(function (o) {
      const O = OBJECTIVES[o];
      const fits = Object.keys(O.match).filter(function (i) { return O.match[i] === 1; });
      return { objective: o, data: O.data, instruments: fits, bestOrbit: O.bestOrbit };
    });
  }
  function dataNeeded(design) { return design.objectives.reduce(function (s, o) { return s + OBJECTIVES[o].data; }, 0); }

  // Scan rate per objective while its target is in the circle: every instrument
  // serves the objective by its match times the orbit's coverage.
  function passRates(design) {
    const rates = {};
    const orbit = ORBITS[design.orbit];
    design.objectives.forEach(function (o) {
      let r = 0;
      design.instruments.forEach(function (i) { r += INSTRUMENTS[i].rate * (OBJECTIVES[o].match[i] || 0) * (orbit ? orbit.coverage[o] : 0); });
      rates[o] = r;
    });
    return rates;
  }
  function passSeconds(design) { return (design && SCIENCE_PASS.seconds[design.orbit]) || SCIENCE_PASS.seconds.polar; }
  function secondsPerObjective(design) { return passSeconds(design) / Math.max(1, design.objectives.length); }
  // Forecast for a steady player (aim share of the time on target).
  function expectedData(design) {
    const rates = passRates(design), t = secondsPerObjective(design);
    let total = 0; Object.keys(rates).forEach(function (o) { total += rates[o] * t * SCIENCE_PASS.aim; });
    return total;
  }
  // Scanner circle radius (world units): better orbit coverage makes the target easier to hold.
  function targetRadius(design, objective) {
    const orbit = ORBITS[design.orbit];
    const cov = orbit ? orbit.coverage[objective] || 0 : 0;
    return SCIENCE_PASS.radius * (0.45 + 0.55 * cov);
  }

  // ---- Payload mass, power and cost; the Master Equipment List (MEL) ----
  function payloadKg(design) {
    return design.instruments.reduce(function (s, i) { return s + INSTRUMENTS[i].kg; }, 0) + (RECORDERS[design.recorder] ? RECORDERS[design.recorder].kg : 0);
  }
  function payloadLoad(design) { return design.instruments.reduce(function (s, i) { return s + INSTRUMENTS[i].load; }, 0); }
  function missionCost(design) {
    return design.instruments.reduce(function (s, i) { return s + INSTRUMENTS[i].cost; }, 0)
      + (RECORDERS[design.recorder] ? RECORDERS[design.recorder].cost : 0)
      + (BOOSTERS[design.booster] ? BOOSTERS[design.booster].cost : 0);
  }
  function capacityKg(design) {
    const b = BOOSTERS[design.booster], o = ORBITS[design.orbit];
    return b && o ? Math.round(b.capacityKg * o.capacityFactor) : 0;
  }
  // rules: MissionRules. Returns the equipment list rows and every margin the screens show.
  function budget(rules, craft, choices, design, ctx) {
    const lift = rules.liftOff(craft, Object.assign({}, choices, { payloadKg: payloadKg(design) }), ctx.loadedFuel || 0);
    const cap = capacityKg(design);
    const cost = missionCost(design);
    const load = rules.systemLoad(Object.assign({}, choices, { instrumentsOn: true, payloadLoad: payloadLoad(design) }), {});
    // RTG: steady output against the observing load. Solar + battery: sunlight at
    // Uranus is far too weak, so the margin is the battery left after the dark
    // stretch and the extra drain of running instruments through the pass.
    let output, powerMargin;
    if (choices.power === 'rtg') { output = rules.GAME.rtgOutput; powerMargin = output - load; }
    else {
      output = rules.solarFraction(100);
      const f = rules.powerForecast(choices, ctx.startDamage);
      powerMargin = f.left - payloadLoad(design) * rules.GAME.batteryDrainGap * passSeconds(design) - rules.CABIN_RULES.reserve;
    }
    const mel = [];
    design.instruments.forEach(function (i) { mel.push({ item: i, kind: 'instrument', kg: INSTRUMENTS[i].kg, load: INSTRUMENTS[i].load, data: INSTRUMENTS[i].rate, cost: INSTRUMENTS[i].cost }); });
    if (RECORDERS[design.recorder]) mel.push({ item: design.recorder, kind: 'recorder', kg: RECORDERS[design.recorder].kg, load: 0, data: 0, cost: RECORDERS[design.recorder].cost, capacity: RECORDERS[design.recorder].capacity });
    if (BOOSTERS[design.booster]) mel.push({ item: design.booster, kind: 'booster', kg: 0, load: 0, data: 0, cost: BOOSTERS[design.booster].cost, capacity: cap });
    const expected = expectedData(design);
    const storage = RECORDERS[design.recorder] ? RECORDERS[design.recorder].capacity : 0;
    return {
      mel: mel,
      massKg: Math.round(lift.massKg),
      capacityKg: cap,
      massMargin: cap ? (cap - lift.massKg) / cap : -1,
      cost: cost,
      creditsLeft: (ctx.credits || 0) - cost,
      loadObserving: load,
      powerOutput: output,
      powerMargin: powerMargin,
      expectedData: expected,
      dataNeeded: dataNeeded(design),
      storage: storage
    };
  }

  // ---- CML checklist: a concept is at a level when 80% of its items are complete ----
  // (Wessen et al., JPL: "80% of the attributes in that column have been completed").
  const CML_PASS = 0.8;
  function cmlChecklist(design, b) {
    const reqOk = design.objectives.length > 0;
    const covered = design.objectives.every(function (o) { return design.instruments.some(function (i) { return (OBJECTIVES[o].match[i] || 0) > 0; }); });
    const levels = {
      1: [
        { id: 'objective', ok: reqOk },
        { id: 'statement', ok: reqOk }
      ],
      2: [
        { id: 'requirements', ok: reqOk },
        { id: 'instrumentType', ok: reqOk && covered },
        { id: 'boosterChosen', ok: !!design.booster },
        { id: 'orbitChosen', ok: !!design.orbit }
      ],
      3: [
        { id: 'tradeStudy', ok: !!design.compared },
        { id: 'dataEnough', ok: b.expectedData >= b.dataNeeded },
        { id: 'budgetOk', ok: b.creditsLeft >= 0 },
        { id: 'orbitFits', ok: !!design.orbit && design.objectives.some(function (o) { return OBJECTIVES[o].bestOrbit === design.orbit; }) }
      ],
      4: [
        { id: 'massMargin', ok: b.massMargin >= 0.1 },
        { id: 'massFits', ok: b.massMargin >= 0 },
        { id: 'powerMargin', ok: b.powerMargin >= 0 },
        { id: 'storageFits', ok: b.storage >= Math.min(b.expectedData, b.dataNeeded) },
        { id: 'mel', ok: design.instruments.length > 0 && !!design.booster }
      ]
    };
    let level = 0;
    const scores = {};
    [1, 2, 3, 4].forEach(function (n) {
      const items = levels[n];
      const done = items.filter(function (i) { return i.ok; }).length / items.length;
      scores[n] = done;
      if (level === n - 1 && done >= CML_PASS) level = n;
    });
    return { levels: levels, scores: scores, level: level };
  }

  // Launch-vehicle check: mass against the booster's capacity to the chosen orbit.
  function launchCheck(b) {
    if (!b.capacityKg) return { ok: false, reason: 'noBooster' };
    return { ok: b.massKg <= b.capacityKg, reason: b.massKg <= b.capacityKg ? null : 'lvCapacity', massKg: b.massKg, capacityKg: b.capacityKg };
  }

  // ---- Operations: collect during the science pass, downlink, protect stored data ----
  function newScience(design) {
    const zero = {};
    design.objectives.forEach(function (o) { zero[o] = 0; });
    return { stored: Object.assign({}, zero), delivered: Object.assign({}, zero), recovered: Object.assign({}, zero), lost: 0, corrupted: 0, collected: 0, passDone: false };
  }
  function sum(obj) { return Object.keys(obj).reduce(function (s, k) { return s + obj[k]; }, 0); }
  // Scan one objective while its target is inside the circle; the recorder keeps
  // what fits and anything beyond its capacity is lost.
  function collect(sci, design, objective, dt, onTarget) {
    if (!onTarget || !(objective in sci.stored)) return sci;
    const next = JSON.parse(JSON.stringify(sci));
    const add = (passRates(design)[objective] || 0) * dt, room = Math.max(0, RECORDERS[design.recorder].capacity - sum(next.stored));
    const kept = Math.min(add, room);
    next.stored[objective] += kept; next.collected += add; next.lost += add - kept;
    return next;
  }
  function downlinkRate(comms, distancePct) {
    const d = Math.max(DOWNLINK.minDistance, Math.min(1, distancePct / 100));
    return (DOWNLINK[comms] || DOWNLINK.standard) * Math.min(DOWNLINK.cap, 1 / (d * d));
  }
  // Downlink spreads over the objectives in proportion to what is stored.
  function downlink(sci, comms, distancePct, dt, powered) {
    if (!powered) return sci;
    const total = sum(sci.stored);
    if (total <= 0) return sci;
    const next = JSON.parse(JSON.stringify(sci));
    const send = Math.min(total, downlinkRate(comms, distancePct) * dt);
    Object.keys(next.stored).forEach(function (o) {
      const part = send * (sci.stored[o] / total);
      next.stored[o] -= part; next.delivered[o] += part;
    });
    return next;
  }
  // An absorbed hit damages the recorder and corrupts one stored unit (game rule).
  function corrupt(sci) {
    const next = JSON.parse(JSON.stringify(sci));
    const keys = Object.keys(next.stored).sort(function (a, b) { return next.stored[b] - next.stored[a]; });
    if (!keys.length || next.stored[keys[0]] <= 0) return next;
    const loss = Math.min(1, next.stored[keys[0]]);
    next.stored[keys[0]] -= loss; next.corrupted += loss;
    return next;
  }
  // At landing, the recorder is read out; that data counts half (it arrives late).
  function land(sci) {
    const next = JSON.parse(JSON.stringify(sci));
    Object.keys(next.stored).forEach(function (o) { next.recovered[o] = next.stored[o]; next.stored[o] = 0; });
    return next;
  }
  function scienceValue(sci, design) {
    return design.objectives.map(function (o) {
      const got = sci.delivered[o] + LANDING_RECOVERY * sci.recovered[o];
      return { objective: o, need: OBJECTIVES[o].data, got: got, frac: Math.min(1, got / OBJECTIVES[o].data) };
    });
  }

  // ---- Score: mission success, science value, resource efficiency, teamwork ----
  // (challenge: "reward mission success, scientific value, efficient use of
  // resources, and effective decision making").
  function scoreMission(r) {
    const success = r.home ? 40 : 0;
    const sv = scienceValue(r.science, r.design);
    const fracAvg = sv.length ? sv.reduce(function (s, x) { return s + x.frac; }, 0) / sv.length : 0;
    const science = Math.round(30 * fracAvg);
    let efficiency = 0;
    efficiency += r.massMargin >= 0.1 ? 5 : r.massMargin >= 0 ? 3 : 0;
    efficiency += r.creditsLeft >= 10 ? 5 : r.creditsLeft >= 0 ? 3 : 0;
    efficiency += r.brownout ? 0 : 5;
    let teamwork = 0;
    teamwork += r.planFirstTry ? 5 : 2;
    teamwork += r.deadlocks ? 2 : 5;
    teamwork += r.repeatedFailures ? 1 : 5;
    const total = success + science + efficiency + teamwork;
    const grade = total >= 85 ? 'A' : total >= 70 ? 'B' : total >= 55 ? 'C' : 'D';
    return { success: success, science: science, efficiency: efficiency, teamwork: teamwork, total: total, grade: grade, objectives: sv };
  }

  // Real NASA missions with similar characteristics (the report names them, like
  // NASA's Build It Yourself game).
  function closestMissions(design) {
    const out = ['voyager2u'];
    const has = function (o) { return design.objectives.indexOf(o) >= 0; };
    if (has('rings') && design.orbit === 'ringPlane') out.push('cassini');
    if ((has('atmosphere') || has('magnetosphere')) && design.orbit === 'polar') out.push('juno');
    if (has('rings') && design.instruments.indexOf('camera') >= 0) out.push('webbUranus');
    out.push('uop');
    return out;
  }

  // Design comparison (trade space): the numbers a team compares between options A and B.
  function summarize(b, design) {
    return { objectives: design.objectives.slice(), instruments: design.instruments.slice(), orbit: design.orbit, booster: design.booster, recorder: design.recorder,
      expected: Math.round(b.expectedData * 10) / 10, needed: b.dataNeeded, cost: b.cost, massKg: b.massKg, capacityKg: b.capacityKg, powerMargin: Math.round(b.powerMargin * 100) / 100 };
  }

  root.MissionDesign = {
    OBJECTIVES: OBJECTIVES, MAX_OBJECTIVES: MAX_OBJECTIVES, MAX_INSTRUMENTS: MAX_INSTRUMENTS,
    INSTRUMENTS: INSTRUMENTS, RECORDERS: RECORDERS, ORBITS: ORBITS, BOOSTERS: BOOSTERS,
    SCIENCE_PASS: SCIENCE_PASS, DOWNLINK: DOWNLINK, LANDING_RECOVERY: LANDING_RECOVERY, CML_PASS: CML_PASS,
    emptyDesign: emptyDesign, cloneDesign: cloneDesign, toggleObjective: toggleObjective,
    instrumentMatch: instrumentMatch, instrumentStatus: instrumentStatus, toggleInstrument: toggleInstrument, pruneInstruments: pruneInstruments,
    requirements: requirements, dataNeeded: dataNeeded, passRates: passRates, passSeconds: passSeconds, secondsPerObjective: secondsPerObjective, expectedData: expectedData, targetRadius: targetRadius,
    payloadKg: payloadKg, payloadLoad: payloadLoad, missionCost: missionCost, capacityKg: capacityKg, budget: budget,
    cmlChecklist: cmlChecklist, launchCheck: launchCheck,
    newScience: newScience, collect: collect, downlinkRate: downlinkRate, downlink: downlink, corrupt: corrupt, land: land, scienceValue: scienceValue,
    scoreMission: scoreMission, closestMissions: closestMissions, summarize: summarize, sumData: sum
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
