import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

vm.runInThisContext(fs.readFileSync(new URL('../js/science.js', import.meta.url), 'utf8'));
const { NASA, solve, kelvinToCelsius, readNumber, checkAnswer, TOPICS } = globalThis.Science;

// Each Advanced equation must reproduce a figure NASA itself prints.
test('inverse-square law reproduces the fact sheet irradiance at Uranus', () => {
  assert.ok(Math.abs(solve.sun() - NASA.irradianceUranus) / NASA.irradianceUranus < 0.01, solve.sun());
  assert.ok(Math.abs(NASA.irradianceUranus / NASA.irradianceEarth - 0.0027) < 0.00005);
});

test('light travel time over the fact sheet distance matches NASA’s 2 h 40 min', () => {
  assert.ok(Math.abs(solve.signal() - NASA.sunlightMinutes) < 2, solve.signal());
});

test('kelvin to celsius matches the facts page and the wind units agree across both pages', () => {
  assert.ok(Math.abs(kelvinToCelsius(NASA.minTempK) - NASA.minTempC) < 0.1);
  assert.ok(Math.abs(solve.climate() - NASA.windSheetMaxMs) < 0.5);
});

test('weight on Uranus uses the fact sheet acceleration', () => {
  assert.equal(NASA.accelerationUranus, 8.69);
  assert.ok(Math.abs(solve.gravity() - 14773) < 1);
  assert.ok(Math.abs(NASA.accelerationUranus / NASA.accelerationEarth - 0.889) < 0.001, 'matches the printed ratio');
});

test('Dawn exhaust speed and Voyager launch power come only from NASA numbers', () => {
  assert.ok(Math.abs(solve.ion() - 28000) < 50, solve.ion());
  assert.equal(solve.rtg(), 474);
});

test('answers within 5% count, typed in common formats', () => {
  assert.equal(readNumber('3,7'), 3.7);
  assert.equal(readNumber('474 W'), 474);
  assert.equal(readNumber('28 000'), 28000);
  assert.equal(readNumber('28,000 m/s'), 28000);
  assert.equal(readNumber('٢٥٠'), 250);
  assert.equal(checkAnswer('sun', '3.7').ok, true);
  assert.equal(checkAnswer('sun', '4.5').ok, false);
  assert.equal(checkAnswer('signal', '159').ok, true);
  assert.equal(checkAnswer('ion', 'twenty').ok, false);
  TOPICS.forEach(t => assert.equal(checkAnswer(t, String(solve[t]())).ok, true, t));
});
