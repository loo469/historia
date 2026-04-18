import test from 'node:test';
import assert from 'node:assert/strict';

import { registerDivergence } from '../../../src/application/culture/registerDivergence.js';

test('registerDivergence merges consequence ids and refreshes registration time immutably', () => {
  const divergencePoint = {
    id: 'divergence-fork-01',
    title: 'The Silent Armada',
    era: 'late-antiquity',
    baselineSummary: 'Maritime trade routes remain stable across the inner sea.',
    divergenceSummary: 'A volcanic winter strands the western fleets for a generation.',
    affectedCultureIds: ['culture-west'],
    consequenceIds: ['grain-shortage'],
    severity: 4,
    discovered: false,
    registeredAt: '2026-04-18T12:10:00.000Z',
    triggeredEventId: null,
  };

  const registeredDivergence = registerDivergence(divergencePoint, {
    consequenceIds: [' harbor-rationing ', 'grain-shortage'],
    registeredAt: '2026-04-18T12:50:00.000Z',
  });

  assert.notEqual(registeredDivergence, divergencePoint);
  assert.deepEqual(registeredDivergence.consequenceIds, ['grain-shortage', 'harbor-rationing']);
  assert.equal(registeredDivergence.registeredAt, '2026-04-18T12:50:00.000Z');
  assert.equal(registeredDivergence.discovered, false);
  assert.equal(registeredDivergence.triggeredEventId, null);
  assert.deepEqual(divergencePoint.consequenceIds, ['grain-shortage']);
});

test('registerDivergence can mark a divergence as discovered with a triggering event', () => {
  const registeredDivergence = registerDivergence(
    {
      id: 'divergence-fork-01',
      title: 'The Silent Armada',
      era: 'late-antiquity',
      baselineSummary: 'Maritime trade routes remain stable across the inner sea.',
      divergenceSummary: 'A volcanic winter strands the western fleets for a generation.',
      affectedCultureIds: ['culture-west'],
      consequenceIds: [],
      severity: 4,
      discovered: false,
      registeredAt: '2026-04-18T12:10:00.000Z',
      triggeredEventId: null,
    },
    {
      discovered: true,
      triggeredEventId: 'event-ashen-harbors',
      registeredAt: '2026-04-18T12:51:00.000Z',
    },
  );

  assert.equal(registeredDivergence.discovered, true);
  assert.equal(registeredDivergence.triggeredEventId, 'event-ashen-harbors');
  assert.equal(registeredDivergence.registeredAt, '2026-04-18T12:51:00.000Z');
});

test('registerDivergence preserves prior discovery linkage when adding later consequences', () => {
  const registeredDivergence = registerDivergence(
    {
      id: 'divergence-fork-01',
      title: 'The Silent Armada',
      era: 'late-antiquity',
      baselineSummary: 'Maritime trade routes remain stable across the inner sea.',
      divergenceSummary: 'A volcanic winter strands the western fleets for a generation.',
      affectedCultureIds: ['culture-west'],
      consequenceIds: ['grain-shortage'],
      severity: 4,
      discovered: true,
      registeredAt: '2026-04-18T12:10:00.000Z',
      triggeredEventId: 'event-ashen-harbors',
    },
    {
      consequenceIds: ['port-migrations'],
      registeredAt: '2026-04-18T12:52:00.000Z',
    },
  );

  assert.equal(registeredDivergence.discovered, true);
  assert.equal(registeredDivergence.triggeredEventId, 'event-ashen-harbors');
  assert.deepEqual(registeredDivergence.consequenceIds, ['grain-shortage', 'port-migrations']);
});

test('registerDivergence rejects inconsistent discovery and invalid payloads', () => {
  assert.throws(
    () =>
      registerDivergence(
        {
          id: 'divergence-fork-01',
          title: 'The Silent Armada',
          era: 'late-antiquity',
          baselineSummary: 'Maritime trade routes remain stable across the inner sea.',
          divergenceSummary: 'A volcanic winter strands the western fleets for a generation.',
          affectedCultureIds: ['culture-west'],
          consequenceIds: [],
          severity: 4,
          discovered: false,
          registeredAt: '2026-04-18T12:10:00.000Z',
          triggeredEventId: null,
        },
        {
          discovered: true,
          registeredAt: '2026-04-18T12:51:00.000Z',
        },
      ),
    /registerDivergence requires a triggeredEventId when a divergence is marked as discovered/,
  );

  assert.throws(
    () =>
      registerDivergence(
        {
          id: 'divergence-fork-01',
          title: 'The Silent Armada',
          era: 'late-antiquity',
          baselineSummary: 'Maritime trade routes remain stable across the inner sea.',
          divergenceSummary: 'A volcanic winter strands the western fleets for a generation.',
          affectedCultureIds: ['culture-west'],
          consequenceIds: [],
          severity: 4,
          discovered: false,
          registeredAt: '2026-04-18T12:10:00.000Z',
          triggeredEventId: null,
        },
        {
          triggeredEventId: 'event-ashen-harbors',
        },
      ),
    /registerDivergence cannot attach a triggeredEventId while the divergence is undiscovered/,
  );

  assert.throws(
    () =>
      registerDivergence(
        {
          id: 'divergence-fork-01',
          title: 'The Silent Armada',
          era: 'late-antiquity',
          baselineSummary: 'Maritime trade routes remain stable across the inner sea.',
          divergenceSummary: 'A volcanic winter strands the western fleets for a generation.',
          affectedCultureIds: ['culture-west'],
          consequenceIds: [],
          severity: 9,
          discovered: false,
          registeredAt: '2026-04-18T12:10:00.000Z',
          triggeredEventId: null,
        },
      ),
    /registerDivergence divergencePoint.severity must be an integer between 1 and 5/,
  );

  assert.throws(
    () =>
      registerDivergence(
        {
          id: 'divergence-fork-01',
          title: 'The Silent Armada',
          era: 'late-antiquity',
          baselineSummary: 'Maritime trade routes remain stable across the inner sea.',
          divergenceSummary: 'A volcanic winter strands the western fleets for a generation.',
          affectedCultureIds: ['culture-west'],
          consequenceIds: [],
          severity: 4,
          discovered: false,
          registeredAt: 'not-a-date',
          triggeredEventId: null,
        },
      ),
    /registerDivergence divergencePoint.registeredAt must be a valid date/,
  );
});
