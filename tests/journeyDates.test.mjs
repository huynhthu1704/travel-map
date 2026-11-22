// TC-034 — Hành trình hiện ngày theo lịch trình (REQ-017)
import test from 'node:test';
import assert from 'node:assert/strict';
import { journeyStops } from '../src/lib/tripAccess.js';

const bugis = { id: 'bugis' }, merlion = { id: 'merlion' }, extra = { id: 'extra' };
const plan = [
  { place: bugis, date: '2026-11-18' },
  { place: merlion, date: '2026-11-18' },
];
const stops = [
  { id: 's1', place: bugis, kind: 'place', date: '2026-11-22', createdAt: Date.parse('2026-11-22T10:00:00Z') },
  { id: 's2', place: merlion, kind: 'memory', date: '2026-11-17', createdAt: Date.parse('2026-11-22T09:00:00Z') },
  { id: 's3', place: extra, kind: 'place', createdAt: Date.parse('2026-11-19T09:00:00Z') },
];

test('TC-034: a place marked visited shows its plan date, not the day it was ticked', () => {
  const out = journeyStops(stops, plan);
  assert.equal(out.find((s) => s.id === 's1').shownDate, '2026-11-18');
});

test('TC-034: a check-in memory keeps its own date; stops outside the plan keep theirs', () => {
  const out = journeyStops(stops, plan);
  assert.equal(out.find((s) => s.id === 's2').shownDate, '2026-11-17');
  assert.equal(out.find((s) => s.id === 's3').shownDate, stops[2].createdAt);
});

test('TC-034: the journey is ordered by the shown date, newest first', () => {
  assert.deepEqual(journeyStops(stops, plan).map((s) => s.id), ['s3', 's1', 's2']);
});
