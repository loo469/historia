import test from 'node:test';
import assert from 'node:assert/strict';

import { registerDivergence } from '../../../src/application/culture/registerDivergence.js';
import { DivergencePoint } from '../../../src/domain/culture/DivergencePoint.js';
import { HistoricalEvent } from '../../../src/domain/culture/HistoricalEvent.js';

test('registerDivergence links a divergence point to a historical event immutably', () => {
  const divergencePoint = new DivergencePoint({
    id: 'divergence-fork-01',
    title: 'The Silent Armada',
    era: 'late-antiquity',
    baselineSummary: 'Maritime trade routes remain stable across the inner sea.',
    divergenceSummary: 'A volcanic winter strands the western fleets for a generation.',
    affectedCultureIds: ['culture-east', 'culture-west'],
    consequenceIds: ['grain-shortage'],
    severity: 4,
    registeredAt: '2026-04-18T12:10:00.000Z',
  });

  const historicalEvent = new HistoricalEvent({
    id: 'event-ashen-harbors',
    title: 'Ashen Harbors',
    category: 'catastrophe',
    summary: 'Coastal ports close after a season of volcanic ash and failed harvests.',
    era: 'late-antiquity',
    importance: 4,
    triggeredAt: '2026-04-18T12:20:00.000Z',
    affectedCultureIds: ['culture-west', 'culture-east'],
    discoveryIds: ['ash-navigation'],
  });

  const registered = registerDivergence(historicalEvent, {
    divergencePoint,
    discoveryIds: ['harbor-rationing', ' grain-shortage '],
  });

  assert.notEqual(registered.divergencePoint, divergencePoint);
  assert.notEqual(registered.historicalEvent, historicalEvent);
  assert.equal(registered.divergencePoint.discovered, true);
  assert.equal(registered.divergencePoint.triggeredEventId, 'event-ashen-harbors');
  assert.equal(registered.historicalEvent.divergencePointId, 'divergence-fork-01');
  assert.equal(
    registered.historicalEvent.triggeredAt?.toISOString(),
    '2026-04-18T12:20:00.000Z',
  );
  assert.deepEqual(registered.historicalEvent.discoveryIds, [
    'ash-navigation',
    'grain-shortage',
    'harbor-rationing',
  ]);

  assert.equal(divergencePoint.discovered, false);
  assert.equal(historicalEvent.divergencePointId, null);
  assert.deepEqual(historicalEvent.discoveryIds, ['ash-navigation']);
});

test('registerDivergence accepts plain payloads and explicit triggeredAt overrides', () => {
  const registered = registerDivergence(
    {
      id: 'event-copper-schism',
      title: 'Copper Schism',
      category: 'political',
      summary: 'Guild rivalries split control of metallurgical rites.',
      era: 'early-iron-age',
      importance: 3,
      triggeredAt: '2026-04-18T12:40:00.000Z',
      affectedCultureIds: ['culture-delta'],
      discoveryIds: [],
    },
    {
      divergencePoint: {
        id: 'divergence-fork-02',
        title: 'The Copper Schism',
        era: 'early-iron-age',
        baselineSummary: 'Guild reforms remain unified.',
        divergenceSummary: 'Regional guilds secede and hoard furnace techniques.',
        affectedCultureIds: ['culture-delta'],
        severity: 2,
        registeredAt: '2026-04-18T12:35:00.000Z',
      },
      discoveryIds: ['ritual-metallurgy'],
      triggeredAt: '2026-04-18T12:45:00.000Z',
    },
  );

  assert.equal(registered.divergencePoint.triggeredEventId, 'event-copper-schism');
  assert.equal(
    registered.historicalEvent.triggeredAt?.toISOString(),
    '2026-04-18T12:45:00.000Z',
  );
  assert.deepEqual(registered.historicalEvent.discoveryIds, ['ritual-metallurgy']);
});

test('registerDivergence rejects invalid or conflicting registrations', () => {
  const historicalEvent = new HistoricalEvent({
    id: 'event-ashen-harbors',
    title: 'Ashen Harbors',
    category: 'catastrophe',
    summary: 'Coastal ports close after a season of volcanic ash and failed harvests.',
    era: 'late-antiquity',
    importance: 4,
    triggeredAt: '2026-04-18T12:20:00.000Z',
    affectedCultureIds: ['culture-west'],
  });

  const discoveredDivergence = new DivergencePoint({
    id: 'divergence-fork-01',
    title: 'The Silent Armada',
    era: 'late-antiquity',
    baselineSummary: 'Baseline',
    divergenceSummary: 'Divergence',
    affectedCultureIds: ['culture-west'],
    severity: 4,
    discovered: true,
    registeredAt: '2026-04-18T12:10:00.000Z',
    triggeredEventId: 'event-old',
  });

  assert.throws(
    () => registerDivergence(historicalEvent, { divergencePoint: discoveredDivergence }),
    /registerDivergence cannot register an already discovered divergence point/,
  );

  assert.throws(
    () =>
      registerDivergence(
        {
          ...historicalEvent.toJSON(),
          divergencePointId: 'divergence-other',
        },
        {
          divergencePoint: {
            id: 'divergence-fork-01',
            title: 'The Silent Armada',
            era: 'late-antiquity',
            baselineSummary: 'Baseline',
            divergenceSummary: 'Divergence',
            affectedCultureIds: ['culture-west'],
            severity: 4,
            registeredAt: '2026-04-18T12:10:00.000Z',
          },
        },
      ),
    /registerDivergence cannot overwrite a historical event already linked to another divergence point/,
  );

  assert.throws(
    () =>
      registerDivergence(historicalEvent, {
        divergencePoint: {
          id: 'divergence-fork-03',
          title: 'Southern Break',
          era: 'late-antiquity',
          baselineSummary: 'Baseline',
          divergenceSummary: 'Divergence',
          affectedCultureIds: ['culture-south'],
          severity: 3,
          registeredAt: '2026-04-18T12:10:00.000Z',
        },
      }),
    /registerDivergence divergencePoint affectedCultureIds must be covered by the historical event/,
  );

  assert.throws(
    () => registerDivergence(historicalEvent, null),
    /registerDivergence registration must be an object/,
  );
});
