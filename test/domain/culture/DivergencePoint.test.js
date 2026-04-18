import test from 'node:test';
import assert from 'node:assert/strict';

import { DivergencePoint } from '../../../src/domain/culture/DivergencePoint.js';

test('DivergencePoint keeps normalized alternate history fields', () => {
  const divergencePoint = new DivergencePoint({
    id: ' divergence-fork-01 ',
    title: ' The Silent Armada ',
    era: ' late-antiquity ',
    baselineSummary: ' Maritime trade routes remain stable across the inner sea. ',
    divergenceSummary: ' A volcanic winter strands the western fleets for a generation. ',
    affectedCultureIds: ['culture-west', ' culture-east ', 'culture-west'],
    consequenceIds: ['grain-shortage', ' naval-reform ', 'grain-shortage'],
    severity: 4,
    discovered: false,
    registeredAt: '2026-04-18T12:10:00.000Z',
  });

  assert.deepEqual(divergencePoint.toJSON(), {
    id: 'divergence-fork-01',
    title: 'The Silent Armada',
    era: 'late-antiquity',
    baselineSummary: 'Maritime trade routes remain stable across the inner sea.',
    divergenceSummary: 'A volcanic winter strands the western fleets for a generation.',
    affectedCultureIds: ['culture-east', 'culture-west'],
    consequenceIds: ['grain-shortage', 'naval-reform'],
    severity: 4,
    discovered: false,
    registeredAt: '2026-04-18T12:10:00.000Z',
    triggeredEventId: null,
  });

  assert.equal(divergencePoint.impactsCulture('culture-east'), true);
  assert.equal(divergencePoint.impactsCulture('culture-south'), false);
});

test('DivergencePoint can be discovered immutably and linked to an event', () => {
  const divergencePoint = new DivergencePoint({
    id: 'divergence-fork-01',
    title: 'The Silent Armada',
    era: 'late-antiquity',
    baselineSummary: 'Maritime trade routes remain stable across the inner sea.',
    divergenceSummary: 'A volcanic winter strands the western fleets for a generation.',
    affectedCultureIds: ['culture-west'],
    severity: 3,
    registeredAt: '2026-04-18T12:10:00.000Z',
  });

  const discoveredDivergencePoint = divergencePoint.withDiscovery('event-ashen-harbors');

  assert.notEqual(discoveredDivergencePoint, divergencePoint);
  assert.equal(discoveredDivergencePoint.discovered, true);
  assert.equal(discoveredDivergencePoint.triggeredEventId, 'event-ashen-harbors');
  assert.equal(divergencePoint.discovered, false);
  assert.equal(divergencePoint.triggeredEventId, null);
});

test('DivergencePoint can refresh consequence ids immutably', () => {
  const divergencePoint = new DivergencePoint({
    id: 'divergence-fork-01',
    title: 'The Silent Armada',
    era: 'late-antiquity',
    baselineSummary: 'Maritime trade routes remain stable across the inner sea.',
    divergenceSummary: 'A volcanic winter strands the western fleets for a generation.',
    severity: 2,
    registeredAt: '2026-04-18T12:10:00.000Z',
  });

  const updatedDivergencePoint = divergencePoint.withConsequences([
    ' port-migrations ',
    'grain-shortage',
    'grain-shortage',
  ]);

  assert.notEqual(updatedDivergencePoint, divergencePoint);
  assert.deepEqual(updatedDivergencePoint.consequenceIds, ['grain-shortage', 'port-migrations']);
  assert.deepEqual(divergencePoint.consequenceIds, []);
});

test('DivergencePoint rejects invalid identifiers, severity, and dates', () => {
  assert.throws(
    () =>
      new DivergencePoint({
        id: '',
        title: 'The Silent Armada',
        era: 'late-antiquity',
        baselineSummary: 'Baseline',
        divergenceSummary: 'Divergence',
        severity: 3,
        registeredAt: '2026-04-18T12:10:00.000Z',
      }),
    /DivergencePoint id is required/,
  );

  assert.throws(
    () =>
      new DivergencePoint({
        id: 'divergence-fork-01',
        title: 'The Silent Armada',
        era: 'late-antiquity',
        baselineSummary: 'Baseline',
        divergenceSummary: 'Divergence',
        severity: 8,
        registeredAt: '2026-04-18T12:10:00.000Z',
      }),
    /DivergencePoint severity must be an integer between 1 and 5/,
  );

  assert.throws(
    () =>
      new DivergencePoint({
        id: 'divergence-fork-01',
        title: 'The Silent Armada',
        era: 'late-antiquity',
        baselineSummary: 'Baseline',
        divergenceSummary: 'Divergence',
        severity: 3,
      }),
    /DivergencePoint registeredAt is required/,
  );

  assert.throws(
    () =>
      new DivergencePoint({
        id: 'divergence-fork-01',
        title: 'The Silent Armada',
        era: 'late-antiquity',
        baselineSummary: 'Baseline',
        divergenceSummary: 'Divergence',
        severity: 3,
        registeredAt: 'not-a-date',
      }),
    /DivergencePoint registeredAt must be a valid date/,
  );
});
