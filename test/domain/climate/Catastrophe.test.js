import test from 'node:test';
import assert from 'node:assert/strict';

import { Catastrophe } from '../../../src/domain/climate/Catastrophe.js';

test('Catastrophe keeps normalized disaster metadata', () => {
  const catastrophe = new Catastrophe({
    id: ' storm-001 ',
    type: 'great-storm',
    severity: 'major',
    regionIds: ['north-coast', ' north-coast ', 'riverlands'],
    startedAt: '2026-04-18T12:00:00.000Z',
    expectedEndAt: '2026-04-20T12:00:00.000Z',
    impact: { harvest: -25, morale: -10 },
    description: ' Gale-force rain and floods ',
  });

  assert.deepEqual(catastrophe.toJSON(), {
    id: 'storm-001',
    type: 'great-storm',
    severity: 'major',
    status: 'warning',
    regionIds: ['north-coast', 'riverlands'],
    startedAt: '2026-04-18T12:00:00.000Z',
    expectedEndAt: '2026-04-20T12:00:00.000Z',
    resolvedAt: null,
    impact: { harvest: -25, morale: -10 },
    description: 'Gale-force rain and floods',
  });

  assert.equal(catastrophe.affectsRegion('riverlands'), true);
  assert.equal(catastrophe.isActive, false);
});

test('Catastrophe transitions from warning to active to resolved immutably', () => {
  const warning = new Catastrophe({
    id: 'quake-002',
    type: 'earthquake',
    severity: 'critical',
    regionIds: ['highlands'],
    startedAt: '2026-04-18T09:00:00.000Z',
    impact: { infrastructure: -55 },
  });

  const active = warning.activate().withImpact({ population: -12 });
  const resolved = active.resolve('2026-04-19T09:00:00.000Z');

  assert.equal(warning.status, 'warning');
  assert.equal(active.status, 'active');
  assert.equal(active.isActive, true);
  assert.deepEqual(active.impact, { infrastructure: -55, population: -12 });
  assert.equal(resolved.status, 'resolved');
  assert.equal(resolved.isResolved, true);
  assert.equal(resolved.resolvedAt?.toISOString(), '2026-04-19T09:00:00.000Z');
});

test('Catastrophe keeps expected end dates and sorts triggered regions after activation', () => {
  const warning = new Catastrophe({
    id: 'locust-003',
    type: 'locusts',
    severity: 'major',
    regionIds: ['delta', 'ashlands', 'delta'],
    startedAt: '2026-04-18T05:00:00.000Z',
    expectedEndAt: '2026-04-22T05:00:00.000Z',
    impact: { harvest: -33 },
  });

  const active = warning.activate();

  assert.equal(active.expectedEndAt?.toISOString(), '2026-04-22T05:00:00.000Z');
  assert.deepEqual(active.regionIds, ['ashlands', 'delta']);
  assert.equal(active.affectsRegion('ashlands'), true);
  assert.equal(active.affectsRegion('delta'), true);
  assert.equal(active.affectsRegion('riverlands'), false);
  assert.equal(warning.status, 'warning');
});

test('Catastrophe rejects invalid values and timelines', () => {
  assert.throws(
    () => new Catastrophe({ id: '', type: 'storm', severity: 'major', regionIds: ['north'], startedAt: new Date(), impact: {} }),
    /Catastrophe id is required/,
  );

  assert.throws(
    () => new Catastrophe({ id: 'c1', type: 'storm', severity: 'extreme', regionIds: ['north'], startedAt: new Date(), impact: {} }),
    /Catastrophe severity must be one of/,
  );

  assert.throws(
    () => new Catastrophe({ id: 'c1', type: 'storm', severity: 'major', regionIds: [], startedAt: new Date(), impact: {} }),
    /regionIds must be a non-empty array/,
  );

  assert.throws(
    () => new Catastrophe({ id: 'c1', type: 'storm', severity: 'major', status: 'resolved', regionIds: ['north'], startedAt: '2026-04-18T12:00:00.000Z', impact: {} }),
    /resolved status requires resolvedAt/,
  );

  assert.throws(
    () => new Catastrophe({ id: 'c1', type: 'storm', severity: 'major', regionIds: ['north'], startedAt: '2026-04-18T12:00:00.000Z', resolvedAt: '2026-04-17T12:00:00.000Z', impact: {} }),
    /resolvedAt cannot be earlier than startedAt/,
  );

  assert.throws(
    () => new Catastrophe({ id: 'c1', type: 'storm', severity: 'major', regionIds: ['north'], startedAt: 'not-a-date', impact: {} }),
    /startedAt must be a valid date/,
  );

  assert.throws(
    () => new Catastrophe({ id: 'c1', type: 'storm', severity: 'major', regionIds: ['north'], startedAt: '2026-04-18T12:00:00.000Z', impact: { harvest: Number.NaN } }),
    /impact harvest must be a finite number/,
  );
});
