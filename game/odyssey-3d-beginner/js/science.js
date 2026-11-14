// NASA numbers used by the level science cards, and the Advanced equations
// built from them. Every value below is printed on a NASA page listed in
// SCIENCE_AND_ASSET_SOURCES.md (DATA-030 to DATA-040). The only other number
// is the speed of light, which is exact by SI definition.
(function (root) {
  const NASA = {
    // NSSDCA Uranus fact sheet (DATA-030, DATA-038)
    irradianceUranus: 3.69,        // W/m²
    irradianceEarth: 1361.0,       // W/m²
    auUranus: 19.19126393,         // semimajor axis, AU
    distanceUranusKm: 2867.043e6,  // semimajor axis, km
    windSheetMaxMs: 250,           // "Wind speeds: 0-250 m/s"
    accelerationUranus: 8.69,      // m/s², "Acceleration (eq., 1 bar)" (DATA-041)
    accelerationEarth: 9.78,       // m/s², same row
    escapeVelocityUranus: 21.3,    // km/s (DATA-041)
    // NASA Uranus facts page (DATA-032, DATA-039)
    minTempK: 49,
    minTempC: -224.2,
    windKmh: 900,
    sunlightMinutes: 2 * 60 + 40,  // "2 hours and 40 minutes"
    // NASA Dawn ion propulsion page (DATA-033)
    dawnThrustN: 0.091,            // 91 millinewtons per engine, maximum
    dawnFlowKgS: 3.25e-6,          // 3.25 mg of xenon per second at maximum thrust
    dawnXenonKg: 425,
    // NASA Voyager RTG pages (DATA-031, DATA-040)
    rtgPerVoyager: 3,
    rtgWattsEach: 158              // watts electric at the beginning of the mission
  };
  const SPEED_OF_LIGHT_KM_S = 299792.458;

  const EXAMPLE_SHIP_KG = 1700;   // a game-rule ship mass used in the gravity example
  const solve = {
    gravity: () => EXAMPLE_SHIP_KG * NASA.accelerationUranus,                // N
    climate: () => NASA.windKmh / 3.6,                                       // m/s
    sun: () => NASA.irradianceEarth / (NASA.auUranus * NASA.auUranus),       // W/m²
    rtg: () => NASA.rtgPerVoyager * NASA.rtgWattsEach,                       // W
    signal: () => NASA.distanceUranusKm / SPEED_OF_LIGHT_KM_S / 60,          // minutes
    ion: () => NASA.dawnThrustN / NASA.dawnFlowKgS                            // m/s
  };
  const TOPICS = ['gravity', 'climate', 'sun', 'rtg', 'signal', 'ion'];

  function kelvinToCelsius(k) { return k - 273.15; }

  // Reads the first number in what the player typed ("3,7", "474 W", "28 000").
  function readNumber(text) {
    const cleaned = String(text || '').replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660))
      .replace(/(\d)[\s ,](?=\d{3}\b)/g, '$1').replace(',', '.');
    const match = cleaned.match(/-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : NaN;
  }

  // Within 5% of the exact working counts as right.
  function checkAnswer(topic, text) {
    const expected = solve[topic]();
    const value = readNumber(text);
    if (!Number.isFinite(value)) return { ok: false, value: value, expected: expected };
    return { ok: Math.abs(value - expected) <= Math.abs(expected) * 0.05, value: value, expected: expected };
  }

  // Practice problems use round numbers so the steps can be checked by hand.
  // They are not Uranus distances and they do not replace the NASA values above.
  // signal: 600,000 / 300,000 = 2 s, and 1,200,000 / 300,000 = 4 s.
  // gravity: 1,000 * 8.69 = 8,690 N, and 2,000 * 8.69 = 17,380 N. 8.69 is NASA's g.
  // climate: 180 / 3.6 = 50 m/s, and 360 / 3.6 = 100 m/s. NASA's 900 km/h is 250 m/s.
  // sun: 1,361 / 2^2 = 340.25, and 1,361 / 4^2 = 85.0625. Uranus is 19.191 AU, not 2 or 4.
  // rtg: 2 * 100 = 200 W, and 4 * 100 = 400 W. Voyager's real product is 3 * 158 = 474 W.
  // ion: 0.050 / 2.5e-6 = 20,000 m/s, and 0.060 / 2.0e-6 = 30,000 m/s.
  // Dawn's real quotient is 0.091 / 3.25e-6 = 28,000 m/s.
  const PRACTICE = {
    gravity: { ask: 17380 },
    climate: { ask: 100 },
    sun: { ask: 85.0625 },
    rtg: { ask: 400 },
    signal: { ask: 4 },
    ion: { ask: 30000 }
  };

  function checkPractice(topic, text) {
    const expected = PRACTICE[topic] ? PRACTICE[topic].ask : NaN;
    const value = readNumber(text);
    if (!Number.isFinite(value) || !Number.isFinite(expected)) return { ok: false, value: value, expected: expected };
    return { ok: Math.abs(value - expected) <= Math.abs(expected) * 0.05, value: value, expected: expected };
  }

  root.Science = {
    NASA: NASA,
    SPEED_OF_LIGHT_KM_S: SPEED_OF_LIGHT_KM_S,
    TOPICS: TOPICS,
    solve: solve,
    PRACTICE: PRACTICE,
    kelvinToCelsius: kelvinToCelsius,
    readNumber: readNumber,
    checkAnswer: checkAnswer,
    checkPractice: checkPractice
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
