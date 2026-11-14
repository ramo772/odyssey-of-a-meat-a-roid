// Mission rules for the Flint 3D flight.
// NASA facts used as endpoints are named in SCIENCE_AND_ASSET_SOURCES.md.
// Every other number in this file is a simplified game rule.
(function (root) {
  const URANUS_SOLAR_WM2 = 3.69;
  const EARTH_SOLAR_WM2 = 1361.0;
  const GAME = {
    solarKnee: 0.30,
    loadBase: 0.30,
    loadHighGain: 0.22,
    loadRedundant: 0.12,
    loadPowerDamage: 0.18,
    batteryStart: 3,
    batteryDrainBase: 0.06,
    batteryDrainGap: 0.12,
    rtgOutput: 1,
    rtgDamagedFactor: 0.4,
    rtgMass: 2,
    maneuverScale: 0.12,
    shieldRelief: 8,
    crackedExtra: 6,
    lifeInterval: 10,
    lifeHull: 5,
    stabilizeHealth: 40,
    rescueHealth: 30,
    faultShock: 10,
    moonLandingFuel: 1,
    hullRepair: 35,
    absorb: { beginner: 18, intermediate: 22, advanced: 28 },
    lowPowerSave: 0.08,
    transmitLoad: 0.06,
    lowPowerHandling: 0.8,
    spareBattery: 1,
    progress: { fast: 3.35, 'fuel-efficient': 2.2, balanced: 2.8 },
    trajectoryFuel: { fast: 1.45, 'fuel-efficient': 0.7, balanced: 1 }
  };

  const ENGINE = {
    small: { power: 2, burn: 1, cost: { fuel: 1 } },
    medium: { power: 3, burn: 2, cost: { fuel: 1 } },
    large: { power: 4, burn: 3, cost: { fuel: 2, oxygen: 1 } }
  };
  const TANK = {
    small: { capacity: 4, drag: 0, cost: { fuel: 1 } },
    medium: { capacity: 6, drag: 1, cost: { fuel: 1, water: 1 } },
    large: { capacity: 8, drag: 2, cost: { fuel: 2, water: 2 } }
  };
  const SHIELD = {
    basic: { protection: 1, cost: { shield: 1 } },
    advanced: { protection: 2, cost: { shield: 1, oxygen: 1 } }
  };
  const CABIN = {
    compact: { comfort: 1, cost: { water: 1 } },
    comfort: { comfort: 2, cost: { water: 2, oxygen: 1 } }
  };
  const RESOURCE_IDS = ['water', 'fuel', 'oxygen', 'shield'];
  // Supply used to patch each flight system. Power uses a battery charge on a
  // solar ship and cannot be patched in flight on an RTG ship.
  const SYSTEMS = {
    thermal: 'shield',
    propulsion: 'fuel',
    life: 'oxygen',
    power: null
  };

  function emptyDamage() {
    return { thermal: false, propulsion: false, life: false, power: false };
  }

  function addCost(costs, part) {
    Object.entries(part || {}).forEach(function (entry) {
      costs[entry[0]] = (costs[entry[0]] || 0) + entry[1];
    });
  }

  function installCosts(craft) {
    const costs = { water: 0, fuel: 0, oxygen: 0, shield: 0 };
    addCost(costs, ENGINE[craft.engine].cost);
    addCost(costs, TANK[craft.tank].cost);
    addCost(costs, SHIELD[craft.shield].cost);
    addCost(costs, CABIN[craft.cabin].cost);
    return costs;
  }

  function canAfford(inventory, costs) {
    return RESOURCE_IDS.every(function (id) {
      return (inventory[id] || 0) >= (costs[id] || 0);
    });
  }

  function spend(inventory, costs) {
    const next = Object.assign({}, inventory);
    RESOURCE_IDS.forEach(function (id) {
      next[id] = Math.max(0, (next[id] || 0) - (costs[id] || 0));
    });
    return next;
  }

  // Ship upgrades from the station checkpoints (js/journey.js) ride along in
  // choices.stats and choices.modules. Without them the profile is unchanged.
  const STAT_BONUS = { handling: 0.3, resilience: 0.5, storage: 1 };
  const MODULE_SPEC = {
    sensor: { mass: 0.5, kg: 60, protection: 0 },
    battery: { mass: 0.5, kg: 80, protection: 0 },
    plating: { mass: 1, kg: 120, protection: 0.75 }
  };
  function moduleList(choices) {
    return (choices && choices.modules || []).filter(function (id) { return MODULE_SPEC[id]; });
  }
  function shipProfile(craft, choices) {
    const engine = ENGINE[craft.engine];
    const tank = TANK[craft.tank];
    const shield = SHIELD[craft.shield];
    const cabin = CABIN[craft.cabin];
    const stats = (choices && choices.stats) || {};
    const modules = moduleList(choices);
    const moduleMass = modules.reduce(function (sum, id) { return sum + MODULE_SPEC[id].mass; }, 0);
    const moduleProtection = modules.reduce(function (sum, id) { return sum + MODULE_SPEC[id].protection; }, 0);
    const mass = tank.drag
      + Math.max(0, shield.protection - 1)
      + (choices.redundancy === 'redundant' ? 1 : 0)
      + (choices.communications === 'high-gain' ? 1 : 0)
      + Math.max(0, cabin.comfort - 1)
      + (choices.power === 'rtg' ? GAME.rtgMass : 0)
      + moduleMass;
    return {
      handling: Math.max(0.4, engine.power - mass + (stats.handling || 0) * STAT_BONUS.handling),
      burn: engine.burn,
      protection: shield.protection + (stats.resilience || 0) * STAT_BONUS.resilience + moduleProtection,
      tankCapacity: tank.capacity + (stats.storage || 0) * STAT_BONUS.storage,
      mass: mass
    };
  }

  // Endpoints: NASA Uranus fact sheet, solar irradiance 3.69 and 1,361.0 W/m².
  // The blend after the knee is a game rule. The route bar is not a distance in AU.
  function solarFraction(distanceRemaining) {
    const far = Math.max(0, Math.min(100, distanceRemaining)) / 100;
    const ratio = URANUS_SOLAR_WM2 / EARTH_SOLAR_WM2;
    if (far >= GAME.solarKnee) return ratio;
    const blend = 1 - far / GAME.solarKnee;
    return ratio + (1 - ratio) * blend;
  }

  function systemLoad(choices, damage) {
    let load = GAME.loadBase;
    if (choices.communications === 'high-gain') load += GAME.loadHighGain;
    if (choices.redundancy === 'redundant') load += GAME.loadRedundant;
    if (damage && damage.power) load += GAME.loadPowerDamage;
    // Science instruments draw power while they observe (js/mission.js).
    if (choices.instrumentsOn) load += choices.payloadLoad || 0;
    // Sending data home keeps the transmitter on (game rule).
    if (choices.transmitting) load += GAME.transmitLoad;
    // Low-power cruise: heaters and instruments run lean through the dark.
    if (choices.lowPower) load = Math.max(0.05, load - GAME.lowPowerSave);
    return load;
  }

  function powerState(choices, distanceRemaining, ship) {
    const solar = solarFraction(distanceRemaining);
    const load = systemLoad(choices, ship.damage);
    if (choices.power === 'rtg') {
      // A damaged power system cuts the RTG's usable output until it is fixed.
      const output = ship.damage && ship.damage.power
        ? GAME.rtgOutput * GAME.rtgDamagedFactor
        : GAME.rtgOutput;
      return {
        solar: solar,
        load: load,
        source: 'rtg',
        output: output,
        solarShort: false,
        brownout: output < load,
        batteryDrainPerSecond: 0
      };
    }
    const solarShort = solar < load;
    const drain = ship.battery > 0 && solarShort
      ? GAME.batteryDrainBase + (load - solar) * GAME.batteryDrainGap
      : 0;
    return {
      solar: solar,
      load: load,
      source: 'solar-battery',
      output: solar,
      solarShort: solarShort,
      brownout: solarShort && ship.battery <= 0,
      batteryDrainPerSecond: drain
    };
  }

  function flightPerformance(profile, choices, distanceRemaining, ship) {
    const power = powerState(choices, distanceRemaining, ship);
    let handling = profile.handling;
    if (power.brownout) handling *= 0.55;
    if (ship.damage.propulsion) handling *= 0.7;
    if (choices.lowPower) handling *= GAME.lowPowerHandling;
    return {
      handling: Math.max(0.4, handling),
      canSteer: ship.flightFuel > 0,
      brownout: power.brownout,
      solarShort: power.solarShort,
      source: power.source,
      batteryDrainPerSecond: power.batteryDrainPerSecond,
      power: power.output,
      load: power.load
    };
  }

  function steerSpeed(handling) {
    return 7 + handling * 3.2;
  }

  function trajectoryFactor(choices) {
    return GAME.trajectoryFuel[choices.trajectory] || 1;
  }

  function maneuverFuelPerSecond(profile, choices) {
    return profile.burn * trajectoryFactor(choices) * GAME.maneuverScale;
  }

  function progressPerSecond(choices) {
    return GAME.progress[choices.trajectory] || GAME.progress.balanced;
  }

  function propellantLoaded(profile, inventoryAfterInstall) {
    return Math.min(profile.tankCapacity, Math.max(0, inventoryAfterInstall.fuel || 0));
  }

  function freshShip(profile, choices, loadedFuel, startDamage) {
    return {
      hull: 100,
      flightFuel: loadedFuel,
      flightFuelMax: profile.tankCapacity,
      battery: choices.power === 'solar-battery'
        ? GAME.batteryStart + (moduleList(choices).indexOf('battery') >= 0 ? GAME.spareBattery : 0)
        : 0,
      backupLeft: choices.redundancy === 'redundant' ? 1 : 0,
      lifeTimer: 0,
      damage: Object.assign(emptyDamage(), startDamage || {})
    };
  }

  function absorbDamage(profile, ship, difficulty) {
    const base = GAME.absorb[difficulty] || GAME.absorb.intermediate;
    let amount = base - (profile.protection - 1) * GAME.shieldRelief;
    if (ship.damage.thermal) amount += GAME.crackedExtra;
    return amount;
  }

  function cloneShip(ship) {
    return Object.assign({}, ship, { damage: Object.assign({}, ship.damage) });
  }

  function patchOption(choices, ship, inventory, system) {
    if (system === 'power') {
      if (choices.power === 'rtg') return null;
      if ((ship.battery || 0) >= 1) return { id: 'patch', resource: 'battery', cost: 1 };
      return null;
    }
    const resource = SYSTEMS[system];
    if (resource && (inventory[resource] || 0) >= 1) return { id: 'patch', resource: resource, cost: 1 };
    return null;
  }

  function listResponses(profile, choices, ship, inventory, system, difficulty) {
    const responses = [];
    const patch = patchOption(choices, ship, inventory, system);
    if (patch) responses.push(patch);
    if (ship.backupLeft > 0) responses.push({ id: 'backup', resource: null, cost: 0 });
    responses.push({ id: 'absorb', resource: null, cost: 0, hullLoss: absorbDamage(profile, ship, difficulty) });
    return responses;
  }

  function applyResponse(id, profile, choices, ship, inventory, system, difficulty) {
    const nextShip = cloneShip(ship);
    const nextInv = Object.assign({}, inventory);
    if (id === 'patch') {
      const option = patchOption(choices, ship, inventory, system);
      if (!option) return { ok: false, ship: ship, inventory: inventory, hullLoss: 0 };
      if (option.resource === 'battery') nextShip.battery -= 1;
      else nextInv[option.resource] -= 1;
      nextShip.damage[system] = false;
      return { ok: true, ship: nextShip, inventory: nextInv, hullLoss: 0 };
    }
    if (id === 'backup') {
      if (nextShip.backupLeft < 1) return { ok: false, ship: ship, inventory: inventory, hullLoss: 0 };
      nextShip.backupLeft -= 1;
      return { ok: true, ship: nextShip, inventory: nextInv, hullLoss: 0 };
    }
    if (id === 'absorb') {
      const loss = absorbDamage(profile, nextShip, difficulty);
      nextShip.hull = Math.max(0, nextShip.hull - loss);
      nextShip.damage[system] = true;
      return { ok: true, ship: nextShip, inventory: nextInv, hullLoss: loss };
    }
    return { ok: false, ship: ship, inventory: inventory, hullLoss: 0 };
  }

  // Moon repair for a damaged system: the matching supply, a battery charge on
  // a solar ship, or one spare shield part to rewire an RTG ship's power.
  function moonFixCost(system, ship, inventory, choices) {
    if (system === 'power') {
      if (choices && choices.power === 'rtg') {
        return (inventory.shield || 0) >= 1 ? { resource: 'shield' } : null;
      }
      return (ship.battery || 0) >= 1 ? { resource: 'battery' } : null;
    }
    const resource = SYSTEMS[system];
    return resource && (inventory[resource] || 0) >= 1 ? { resource: resource } : null;
  }

  function stationOptions(profile, ship, inventory, choices) {
    const options = [];
    if (ship.hull < 100 && inventory.shield > 0) options.push({ id: 'hull' });
    if (ship.flightFuel < profile.tankCapacity && inventory.fuel > 0) options.push({ id: 'fuel' });
    Object.keys(SYSTEMS).forEach(function (system) {
      if (ship.damage[system] && moonFixCost(system, ship, inventory, choices)) options.push({ id: 'fix:' + system });
    });
    return options;
  }

  function applyStation(id, profile, ship, inventory, choices) {
    const nextShip = cloneShip(ship);
    const nextInv = Object.assign({}, inventory);
    const refused = { ok: false, ship: ship, inventory: inventory };
    if (id === 'hull') {
      if (nextInv.shield < 1 || nextShip.hull >= 100) return refused;
      nextInv.shield -= 1;
      nextShip.hull = Math.min(100, nextShip.hull + GAME.hullRepair);
      return { ok: true, ship: nextShip, inventory: nextInv };
    }
    if (id === 'fuel') {
      if (nextInv.fuel < 1 || nextShip.flightFuel >= profile.tankCapacity) return refused;
      nextInv.fuel -= 1;
      nextShip.flightFuel = Math.min(profile.tankCapacity, nextShip.flightFuel + 1);
      return { ok: true, ship: nextShip, inventory: nextInv };
    }
    if (id.indexOf('fix:') === 0) {
      const system = id.slice(4);
      const cost = nextShip.damage[system] ? moonFixCost(system, ship, inventory, choices) : null;
      if (!cost) return refused;
      if (cost.resource === 'battery') nextShip.battery -= 1;
      else nextInv[cost.resource] -= 1;
      nextShip.damage[system] = false;
      return { ok: true, ship: nextShip, inventory: nextInv };
    }
    return refused;
  }

  // Landing on the Moon and lifting off again costs maneuver fuel.
  function moonLanding(ship) {
    if ((ship.flightFuel || 0) < GAME.moonLandingFuel) return { ok: false, reason: 'fuel', ship: ship };
    const next = cloneShip(ship);
    next.flightFuel = Math.max(0, next.flightFuel - GAME.moonLandingFuel);
    return { ok: true, ship: next };
  }

  function designForecast(craft, choices, inventory, difficulty, startDamage) {
    const costs = installCosts(craft);
    const affordable = canAfford(inventory, costs);
    const after = affordable ? spend(inventory, costs) : Object.assign({}, inventory);
    const profile = shipProfile(craft, choices);
    const loaded = affordable ? propellantLoaded(profile, after) : 0;
    const ship = freshShip(profile, choices, loaded, startDamage);
    return {
      costs: costs,
      affordable: affordable,
      profile: profile,
      loaded: loaded,
      maneuver: maneuverFuelPerSecond(profile, choices),
      hit: absorbDamage(profile, ship, difficulty || 'intermediate'),
      depart: flightPerformance(profile, choices, 100, ship),
      arrive: flightPerformance(profile, choices, 0, ship),
      liftoff: liftOff(craft, choices, loaded),
      power: powerForecast(choices, startDamage)
    };
  }

  function launchFrom(craft, choices, inventory, startDamage) {
    const costs = installCosts(craft);
    if (!canAfford(inventory, costs)) return { ok: false, reason: 'cost' };
    const afterInstall = spend(inventory, costs);
    const profile = shipProfile(craft, choices);
    const loaded = propellantLoaded(profile, afterInstall);
    const lift = liftOff(craft, choices, loaded);
    if (!lift.ok) return { ok: false, reason: 'liftoff', liftoff: lift };
    const inventoryAfter = Object.assign({}, afterInstall, { fuel: afterInstall.fuel - loaded });
    return {
      ok: true,
      profile: profile,
      inventory: inventoryAfter,
      ship: freshShip(profile, choices, loaded, startDamage)
    };
  }

  // ---- Balance checks (DEC-016) ----
  // Lift-off: the engine must push harder than the ship weighs on the platform.
  // NASA fact: acceleration at Uranus's 1-bar level is 8.69 m/s² (NSSDCA fact
  // sheet, DATA-041). The platform is fiction, and lifting off it is a simplified
  // check, not orbital mechanics (NASA lists Uranus's escape velocity as 21.3 km/s).
  // Masses and thrusts below are game rules.
  const URANUS_G = 8.69;
  const MASS_KG = {
    structure: 500,
    engine: { small: 150, medium: 250, large: 400 },
    tank: { small: 120, medium: 220, large: 350 },
    shield: { basic: 150, advanced: 320 },
    cabin: { compact: 120, comfort: 300 },
    power: { 'solar-battery': 90, rtg: 280 },
    communications: { standard: 10, 'high-gain': 70 },
    redundancy: { single: 0, redundant: 110 },
    propellantPerUnit: 60
  };
  const THRUST_N = { small: 14000, medium: 22000, large: 34000 };

  function liftOff(craft, choices, loadedFuel) {
    const massKg = MASS_KG.structure
      + MASS_KG.engine[craft.engine] + MASS_KG.tank[craft.tank]
      + MASS_KG.shield[craft.shield] + MASS_KG.cabin[craft.cabin]
      + MASS_KG.power[choices.power] + MASS_KG.communications[choices.communications]
      + MASS_KG.redundancy[choices.redundancy]
      + moduleList(choices).reduce(function (sum, id) { return sum + MODULE_SPEC[id].kg; }, 0)
      + (choices.payloadKg || 0)
      + (loadedFuel || 0) * MASS_KG.propellantPerUnit;
    const weightN = massKg * URANUS_G;
    const thrustN = THRUST_N[craft.engine];
    const twr = thrustN / weightN;
    return { massKg: massKg, weightN: weightN, thrustN: thrustN, twr: twr, ok: twr > 1 };
  }

  // Power through the dark: far from the Sun a solar ship lives on its battery
  // until sunlight recovers (NASA: 3.69 W/m² at Uranus, DATA-030). This predicts
  // the battery left when sunlight returns, before any cabin use or damage.
  function darkSeconds(choices) {
    return 100 * (1 - GAME.solarKnee) / progressPerSecond(choices);
  }
  function powerForecast(choices, startDamage) {
    if (choices.power === 'rtg') return { source: 'rtg', ok: true, left: null, needed: 0 };
    const ship = { battery: GAME.batteryStart, damage: Object.assign(emptyDamage(), startDamage || {}) };
    const drain = powerState(choices, 100, ship).batteryDrainPerSecond;
    const needed = drain * darkSeconds(choices);
    const left = GAME.batteryStart - needed;
    return { source: 'solar-battery', ok: left > CABIN_RULES.reserve, dark: left <= 0, left: left, needed: needed, capacity: GAME.batteryStart, reserve: CABIN_RULES.reserve };
  }

  // One step of cruise. Steering spends maneuver fuel. A short solar ship drains
  // its battery. Damaged life support uses one oxygen every lifeInterval
  // seconds, and costs hull instead when the oxygen runs out.
  function stepCruise(profile, choices, ship, inventory, distanceRemaining, dt, steering) {
    const power = powerState(choices, distanceRemaining, ship);
    const next = cloneShip(ship);
    let inv = inventory;
    let lifeEvent = null;
    if (power.batteryDrainPerSecond > 0) {
      next.battery = Math.max(0, next.battery - power.batteryDrainPerSecond * dt);
    }
    if (choices.power !== 'rtg' && power.solarShort && next.battery <= 0) next.blackout = true;
    const moving = !!steering && next.flightFuel > 0;
    if (moving) {
      next.flightFuel = Math.max(0, next.flightFuel - maneuverFuelPerSecond(profile, choices) * dt);
    }
    if (next.damage.life) {
      next.lifeTimer = (next.lifeTimer || 0) + dt;
      if (next.lifeTimer >= GAME.lifeInterval) {
        next.lifeTimer -= GAME.lifeInterval;
        if ((inventory.oxygen || 0) >= 1) {
          inv = Object.assign({}, inventory, { oxygen: inventory.oxygen - 1 });
          lifeEvent = 'oxygen';
        } else {
          next.hull = Math.max(0, next.hull - GAME.lifeHull);
          lifeEvent = 'hull';
        }
      }
    }
    return { ship: next, inventory: inv, power: power, steered: moving, lifeEvent: lifeEvent };
  }

  function arrival(ship) {
    if (ship.blackout) return { ok: false, reason: 'power' };
    if (ship.hull <= 0) return { ok: false, reason: 'hull' };
    return { ok: true, coasted: ship.flightFuel <= 0 };
  }

  // A downed explorer can spend oxygen to get up where they fell.
  function stabilize(inventory, health) {
    if (health > 0) return { ok: false, reason: 'up', inventory: inventory, health: health };
    if ((inventory.oxygen || 0) < 1) return { ok: false, reason: 'oxygen', inventory: inventory, health: health };
    const next = Object.assign({}, inventory, { oxygen: inventory.oxygen - 1 });
    return { ok: true, inventory: next, health: GAME.stabilizeHealth };
  }

  // Or be carried back to the crash site with less health, at no supply cost.
  function rescue(health) {
    if (health > 0) return { ok: false, reason: 'up', health: health };
    return { ok: true, health: GAME.rescueHealth };
  }

  function windDamage(shieldParts, target) {
    if (shieldParts >= target) return 0;
    if (shieldParts <= 0) return 7;
    return 3;
  }

  // Repairs at the wreck. Each panel shows readings; the player finds the fault.
  // A wrong guess costs: power gives Flint a shock, the fuel line spills fuel,
  // life support vents oxygen. A quick patch is free but the system starts the
  // flight damaged. The faults and readings are fiction.
  const REPAIR_SYSTEMS = ['power', 'propulsion', 'life'];
  const FAULTS = {
    power: ['main', 'junctionA', 'junctionB'],
    propulsion: ['leak1', 'leak2', 'leak3'],
    life: ['valve', 'fan', 'filter']
  };

  function makeFault(system, index) {
    const options = FAULTS[system];
    const answer = options[((index % options.length) + options.length) % options.length];
    let readings;
    if (system === 'power') {
      const darkA = answer === 'main' || answer === 'junctionA';
      const darkB = answer === 'main' || answer === 'junctionB';
      readings = [
        { id: 'lights', value: darkA ? 'off' : 'on' },
        { id: 'radio', value: darkA ? 'off' : 'on' },
        { id: 'heater', value: darkB ? 'off' : 'on' },
        { id: 'engineControl', value: darkB ? 'off' : 'on' }
      ];
    } else if (system === 'propulsion') {
      const leakAfter = Number(answer.slice(4));
      readings = [1, 2, 3, 4].map(function (gauge) {
        return { id: 'gauge' + gauge, value: gauge <= leakAfter ? 100 : 40 };
      });
    } else {
      readings = [
        { id: 'oxygenFlow', value: answer === 'valve' ? 'none' : 'normal' },
        { id: 'airflow', value: answer === 'fan' ? 'none' : 'normal' },
        { id: 'co2', value: answer === 'filter' ? 'high' : 'normal' }
      ];
    }
    return { system: system, answer: answer, options: options.slice(), readings: readings };
  }

  function wrongGuessCost(system, inventory, health) {
    if (system === 'power') {
      return { inventory: inventory, health: Math.max(0, health - GAME.faultShock) };
    }
    const resource = system === 'propulsion' ? 'fuel' : 'oxygen';
    const next = Object.assign({}, inventory);
    next[resource] = Math.max(0, (next[resource] || 0) - 1);
    return { inventory: next, health: health };
  }

  function resolveRepair(fault, choice, inventory, health) {
    if (choice === 'patch') {
      return { result: 'patched', inventory: inventory, health: health };
    }
    if (choice === fault.answer) {
      return { result: 'fixed', inventory: inventory, health: health };
    }
    const cost = wrongGuessCost(fault.system, inventory, health);
    return { result: 'wrong', inventory: cost.inventory, health: cost.health };
  }

  // Systems left patched at the wreck start the flight damaged.
  function launchDamage(repairs) {
    const damage = {};
    REPAIR_SYSTEMS.forEach(function (system) {
      if (repairs[system] === 'patched') damage[system] = true;
    });
    return damage;
  }

  function preferredResponse(profile, choices, ship, inventory, system, difficulty) {
    const ids = listResponses(profile, choices, ship, inventory, system, difficulty)
      .map(function (option) { return option.id; });
    if (ids.indexOf('patch') >= 0) return 'patch';
    if (ids.indexOf('backup') >= 0) return 'backup';
    return 'absorb';
  }

  // Test helper: fly one leg without steering, with scripted hits.
  function simulateLeg(craft, choices, inventory, difficulty, hits, startDamage) {
    const launched = launchFrom(craft, choices, inventory, startDamage);
    if (!launched.ok) return { ok: false, reason: launched.reason || 'cost' };
    let ship = launched.ship;
    let inv = launched.inventory;
    const profile = launched.profile;
    let distance = 100;
    let time = 0;
    let hitIndex = 0;
    while (distance > 0 && time < 180 && ship.hull > 0 && !ship.blackout) {
      const dt = 0.5;
      time += dt;
      const step = stepCruise(profile, choices, ship, inv, distance, dt, false);
      ship = step.ship;
      inv = step.inventory;
      distance = Math.max(0, distance - progressPerSecond(choices) * dt);
      while (hitIndex < hits.length && time + 1e-6 >= hits[hitIndex].at) {
        const hit = hits[hitIndex];
        hitIndex += 1;
        const choice = hit.response || preferredResponse(profile, choices, ship, inv, hit.system, difficulty);
        let applied = applyResponse(choice, profile, choices, ship, inv, hit.system, difficulty);
        if (!applied.ok) applied = applyResponse('absorb', profile, choices, ship, inv, hit.system, difficulty);
        ship = applied.ship;
        inv = applied.inventory;
      }
    }
    return { ok: ship.hull > 0 && !ship.blackout && distance <= 0, reason: ship.blackout ? 'power' : ship.hull <= 0 ? 'hull' : null, ship: ship, inventory: inv, distance: distance, time: time };
  }

  // ---- Hands-on repair steps (first versions by Rana Emad) ----

  // Power bay: after the fault is found, only the circuits that went dark need
  // their cables reconnected.
  const CIRCUITS = ['lights', 'radio', 'heater', 'engineControl'];

  function deadCircuits(fault) {
    return fault.readings.filter(function (r) { return r.value === 'off'; })
      .map(function (r) { return r.id; });
  }

  function shuffled(list, rng) {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }

  // The wiring card gives each circuit a cable colour. Sockets show circuit
  // names only, so the player reads the card instead of matching colours.
  function cableTask(fault, rng) {
    const colours = shuffled([0, 1, 2, 3], rng);
    const colourOf = {};
    CIRCUITS.forEach(function (circuit, i) { colourOf[circuit] = colours[i]; });
    return { loose: deadCircuits(fault), colourOf: colourOf, sockets: shuffled(CIRCUITS, rng) };
  }

  // Fuel line: after the leak is found, the crash has mixed the propellant
  // canisters. Each tank must hold one propellant before the line is sealed.
  const PROPELLANTS = ['hydrolox', 'methalox', 'kerolox', 'xenon', 'hydrazine'];
  const TANK_SIZE = 4;
  const SORT_TANKS = 7;

  function tanksSorted(tanks) {
    return tanks.every(function (tank) {
      return tank.length === 0 || (tank.length === TANK_SIZE && tank.every(function (v) { return v === tank[0]; }));
    });
  }

  function makeTanks(rng) {
    let tanks;
    do {
      const units = shuffled([].concat.apply([], PROPELLANTS.map(function (id) {
        return [id, id, id, id];
      })), rng);
      tanks = [];
      for (let i = 0; i < SORT_TANKS; i++) {
        tanks.push(i < PROPELLANTS.length ? units.slice(i * TANK_SIZE, (i + 1) * TANK_SIZE) : []);
      }
    } while (tanksSorted(tanks));
    return tanks;
  }

  // Pour the top run of one propellant onto the same propellant or an empty tank.
  function pourTop(tanks, from, to) {
    const src = tanks[from];
    const dst = tanks[to];
    if (from === to || !src || !dst || !src.length || dst.length >= TANK_SIZE) return { ok: false, tanks: tanks, moved: 0 };
    const top = src[src.length - 1];
    if (dst.length && dst[dst.length - 1] !== top) return { ok: false, tanks: tanks, moved: 0 };
    const next = tanks.map(function (tank) { return tank.slice(); });
    let moved = 0;
    while (next[from].length && next[from][next[from].length - 1] === top && next[to].length < TANK_SIZE) {
      next[to].push(next[from].pop());
      moved += 1;
    }
    return { ok: true, tanks: next, moved: moved };
  }

  // ---- Cabin emergency in flight (first version by Rana Emad) ----
  // One emergency starts on every flight once distance-to-Earth reaches
  // scheduleAt, still inside the dark stretch. Another starts later if life
  // support is damaged. The oxygen valve spends 1 oxygen supply. Heater and
  // CO₂ filter spend electricity. A solar ship's electricity comes from its
  // battery, an RTG's from steady output. Every number here is a game rule.
  const CABIN_RULES = {
    seconds: 25,
    scheduleAt: 60,      // route bar % at which the flight's cabin emergency starts
    damagedDrain: 1.5,   // alarms drain faster while life support is damaged
    firstEvent: 1.5,
    eventGap: 3.5,
    drain: { leak: 8, cold: 7, hot: 7, co2: 6 },
    critical: 25,
    crewDrain: 3,
    fix: { leak: 45, temp: 38, co2: 8 },
    powerCost: 5,
    reserve: 0.3,        // battery a solar ship should keep for cabin alarms (2 controls ≈ 0.3)
    rtgStart: 60,
    rtgRegen: 4,
    solarRegen: 4,
    failHull: 12,
    cooldown: 15,
    delay: 6
  };
  const CABIN_EVENTS = ['leak', 'cold', 'hot', 'co2'];

  function cabinStart(choices, ship, distanceRemaining) {
    let power;
    let regen;
    if (choices.power === 'rtg') {
      power = CABIN_RULES.rtgStart;
      regen = CABIN_RULES.rtgRegen * (ship.damage && ship.damage.power ? GAME.rtgDamagedFactor : 1);
    } else {
      power = Math.min(100, (ship.battery || 0) / GAME.batteryStart * 100);
      regen = CABIN_RULES.solarRegen * solarFraction(distanceRemaining);
    }
    return {
      time: CABIN_RULES.seconds, oxygen: 100, temp: 100, crew: 100,
      power: power, regen: regen, event: null, eventClock: CABIN_RULES.firstEvent,
      drainScale: ship.damage && ship.damage.life ? CABIN_RULES.damagedDrain : 1,
      done: false, survived: false
    };
  }

  function clampBar(v) { return Math.max(0, Math.min(100, v)); }

  // pickEvent() returns one of CABIN_EVENTS; tests pass a fixed sequence.
  function cabinTick(cabin, dt, pickEvent) {
    if (cabin.done) return cabin;
    const next = Object.assign({}, cabin);
    next.time -= dt;
    next.power = clampBar(next.power + next.regen * dt);
    const k = next.drainScale || 1;
    if (next.event === 'leak') next.oxygen -= CABIN_RULES.drain.leak * k * dt;
    if (next.event === 'cold' || next.event === 'hot') next.temp -= CABIN_RULES.drain[next.event] * k * dt;
    if (next.event === 'co2') next.crew -= CABIN_RULES.drain.co2 * k * dt;
    if (next.oxygen < CABIN_RULES.critical || next.temp < CABIN_RULES.critical) next.crew -= CABIN_RULES.crewDrain * dt;
    next.oxygen = clampBar(next.oxygen);
    next.temp = clampBar(next.temp);
    next.crew = clampBar(next.crew);
    next.eventClock -= dt;
    if (!next.event && next.eventClock <= 0) {
      next.event = pickEvent();
      next.eventClock = CABIN_RULES.eventGap;
    }
    if (next.oxygen <= 0 || next.temp <= 0 || next.crew <= 0) {
      next.done = true;
      next.survived = false;
    } else if (next.time <= 0) {
      next.done = true;
      next.survived = next.oxygen > CABIN_RULES.critical && next.temp > CABIN_RULES.critical && next.crew > CABIN_RULES.critical;
    }
    return next;
  }

  // kind: 'oxygen', 'temp' or 'filter'. A control used with no matching alarm
  // still spends its cost.
  function cabinAct(cabin, kind, inventory) {
    const next = Object.assign({}, cabin);
    let inv = inventory;
    if (cabin.done) return { cabin: cabin, inventory: inventory, result: 'done' };
    if (kind === 'oxygen') {
      if ((inventory.oxygen || 0) < 1) return { cabin: cabin, inventory: inventory, result: 'no-oxygen' };
      inv = Object.assign({}, inventory, { oxygen: inventory.oxygen - 1 });
    } else {
      if (next.power < CABIN_RULES.powerCost) return { cabin: cabin, inventory: inventory, result: 'no-power' };
      next.power -= CABIN_RULES.powerCost;
    }
    const matches = (kind === 'oxygen' && next.event === 'leak')
      || (kind === 'temp' && (next.event === 'cold' || next.event === 'hot'))
      || (kind === 'filter' && next.event === 'co2');
    if (!matches) return { cabin: next, inventory: inv, result: 'wasted' };
    if (kind === 'oxygen') next.oxygen = clampBar(next.oxygen + CABIN_RULES.fix.leak);
    if (kind === 'temp') next.temp = clampBar(next.temp + CABIN_RULES.fix.temp);
    if (kind === 'filter') next.crew = clampBar(next.crew + CABIN_RULES.fix.co2);
    next.event = null;
    return { cabin: next, inventory: inv, result: 'fixed' };
  }

  // Surviving clears the life-support damage. Failing costs hull and the damage
  // stays. A solar ship keeps the battery it has left; it never gains charge here.
  function cabinFinish(cabin, ship, choices) {
    const next = cloneShip(ship);
    if (choices.power !== 'rtg') {
      next.battery = Math.max(0, Math.min(ship.battery || 0, cabin.power / 100 * GAME.batteryStart));
    }
    if (cabin.survived) next.damage.life = false;
    else next.hull = Math.max(0, next.hull - CABIN_RULES.failHull);
    return { ship: next, survived: cabin.survived };
  }

  root.MissionRules = {
    URANUS_SOLAR_WM2: URANUS_SOLAR_WM2,
    EARTH_SOLAR_WM2: EARTH_SOLAR_WM2,
    GAME: GAME,
    ENGINE: ENGINE,
    TANK: TANK,
    SHIELD: SHIELD,
    CABIN: CABIN,
    RESOURCE_IDS: RESOURCE_IDS,
    SYSTEMS: SYSTEMS,
    REPAIR_SYSTEMS: REPAIR_SYSTEMS,
    installCosts: installCosts,
    canAfford: canAfford,
    spend: spend,
    shipProfile: shipProfile,
    STAT_BONUS: STAT_BONUS,
    MODULE_SPEC: MODULE_SPEC,
    solarFraction: solarFraction,
    systemLoad: systemLoad,
    powerState: powerState,
    flightPerformance: flightPerformance,
    steerSpeed: steerSpeed,
    maneuverFuelPerSecond: maneuverFuelPerSecond,
    progressPerSecond: progressPerSecond,
    propellantLoaded: propellantLoaded,
    freshShip: freshShip,
    absorbDamage: absorbDamage,
    listResponses: listResponses,
    applyResponse: applyResponse,
    stationOptions: stationOptions,
    applyStation: applyStation,
    moonFixCost: moonFixCost,
    moonLanding: moonLanding,
    designForecast: designForecast,
    launchFrom: launchFrom,
    stepCruise: stepCruise,
    arrival: arrival,
    stabilize: stabilize,
    rescue: rescue,
    windDamage: windDamage,
    makeFault: makeFault,
    resolveRepair: resolveRepair,
    launchDamage: launchDamage,
    preferredResponse: preferredResponse,
    simulateLeg: simulateLeg,
    wrongGuessCost: wrongGuessCost,
    CIRCUITS: CIRCUITS,
    deadCircuits: deadCircuits,
    cableTask: cableTask,
    PROPELLANTS: PROPELLANTS,
    TANK_SIZE: TANK_SIZE,
    makeTanks: makeTanks,
    pourTop: pourTop,
    tanksSorted: tanksSorted,
    CABIN_RULES: CABIN_RULES,
    CABIN_EVENTS: CABIN_EVENTS,
    cabinStart: cabinStart,
    cabinTick: cabinTick,
    cabinAct: cabinAct,
    cabinFinish: cabinFinish,
    URANUS_G: URANUS_G,
    MASS_KG: MASS_KG,
    THRUST_N: THRUST_N,
    liftOff: liftOff,
    darkSeconds: darkSeconds,
    powerForecast: powerForecast
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
