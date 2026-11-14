// Fixed crew roles: names, order, and who owns each decision.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

vm.runInThisContext(readFileSync(new URL('../js/crew.js', import.meta.url), 'utf8'));
const { Crew, CrewCopy } = globalThis;

test('players are fixed and never reordered', () => {
  assert.deepEqual(Crew.people(4).map(p => p.id), ['raed', 'zahra', 'breek', 'azoz']);
  assert.deepEqual(Crew.people(2).map(p => p.id), ['raed', 'zahra']);
  assert.deepEqual(Crew.people(3).map(p => p.id), ['raed', 'zahra', 'breek']);
  assert.equal(Crew.person(1).model, 'hero');
  assert.equal(Crew.person(4).model, 'officer');
});

test('2 players: Raed runs the ship, Zahra the mission and science', () => {
  for (const c of ['engine', 'tank', 'power', 'backup', 'shield', 'cabin']) assert.equal(Crew.ownerOfCat(c, 2), 1, c);
  for (const c of ['objective', 'route', 'orbit', 'booster', 'instrument', 'recorder', 'antenna']) assert.equal(Crew.ownerOfCat(c, 2), 2, c);
});

test('3 players: propulsion, ship systems, mission and science', () => {
  assert.equal(Crew.ownerOfCat('engine', 3), 1);
  assert.equal(Crew.ownerOfCat('tank', 3), 1);
  for (const c of ['power', 'backup', 'shield', 'cabin']) assert.equal(Crew.ownerOfCat(c, 3), 2, c);
  for (const c of ['objective', 'route', 'instrument', 'recorder']) assert.equal(Crew.ownerOfCat(c, 3), 3, c);
});

test('4 players: Breek has science and data, Azoz navigation and mission', () => {
  assert.equal(Crew.ownerOfCat('engine', 4), 1);
  assert.equal(Crew.ownerOfCat('power', 4), 2);
  assert.equal(Crew.ownerOfCat('shield', 4), 2);
  for (const c of ['instrument', 'recorder']) assert.equal(Crew.ownerOfCat(c, 4), 3, c);
  for (const c of ['objective', 'route', 'orbit', 'booster']) assert.equal(Crew.ownerOfCat(c, 4), 4, c);
});

test('flight moments follow the same areas', () => {
  assert.equal(Crew.ownerOfMoment('dark', 4), 2);
  assert.equal(Crew.ownerOfMoment('rock', 4), 1);
  assert.equal(Crew.ownerOfMoment('shower', 4), 4);
  assert.equal(Crew.ownerOfMoment('shower', 2), 2);
});

test('solo play: Raed owns every decision', () => {
  for (const c of Object.keys(Crew.DOMAIN_OF)) assert.equal(Crew.ownerOfCat(c, 1), 1, c);
  assert.equal(Crew.ownerOfMoment('shower', 1), 1);
});

test('every role and decision has text in all five languages', () => {
  const keys = Object.keys(CrewCopy.en);
  for (const lang of ['ar', 'eg', 'fr', 'es']) assert.deepEqual(Object.keys(CrewCopy[lang]).sort(), keys.slice().sort(), lang);
  for (const n of [2, 3, 4]) for (let p = 1; p <= n; p++) assert.ok(CrewCopy.en[Crew.roleKey(p, n)], n + '/' + p);
  for (const c of Object.keys(Crew.DOMAIN_OF)) assert.ok(CrewCopy.en['cdec_' + c], c);
  assert.equal(CrewCopy.eg.crewName_azoz, 'عزوز');
  assert.equal(CrewCopy.en.crewName_breek, 'Brick');
  assert.equal(CrewCopy.eg.crewName_zahra, 'زهره');
  assert.equal(CrewCopy.eg.crewName_raed, 'رائد');
});
