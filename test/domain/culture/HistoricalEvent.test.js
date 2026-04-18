import test from 'node:test';
import assert from 'node:assert/strict';

import { HistoricalEvent } from '../../../src/domain/culture/HistoricalEvent.js';

test('HistoricalEvent keeps normalized alternate history event fields', () => {
  const historicalEvent = new HistoricalEvent({
    id: ' event-ashen-harbors ',
    title: ' Ashen Harbors ',
    category: ' catastrophe ',
    summary: ' Coastal ports close after a season of volcanic ash and failed harvests. ',
    era: ' late-antiquity ',
    importance: 4,
    triggeredAt: '2026-04-18T12:20:00.000Z',
    affectedCultureIds: ['culture-west', ' culture-east ', 'culture-west'],
    divergencePointId: ' divergence-fork-01 ',
    discoveryIds: ['ash-navigation', ' harbor-rationing ', 'ash-navigation'],
    tags: ['maritime', ' crisis ', 'maritime'],
  });

  assert.deepEqual(historicalEvent.toJSON(), {
    id: 'event-ashen-harbors',
    title: 'Ashen Harbors',
    category: 'catastrophe',
    summary: 'Coastal ports close after a season of volcanic ash and failed harvests.',
    era: 'late-antiquity',
    importance: 4,
    triggeredAt: '2026-04-18T12:20:00.000Z',
    affectedCultureIds: ['culture-east', 'culture-west'],
    divergencePointId: 'divergence-fork-01',
    discoveryIds: ['ash-navigation', 'harbor-rationing'],
    tags: ['crisis', 'maritime'],
    resolved: false,
    resolvedAt: null,
  });

  assert.equal(historicalEvent.affectsCulture('culture-east'), true);
  assert.equal(historicalEvent.affectsCulture('culture-south'), false);
});

test('HistoricalEvent can refresh discoveries immutably', () => {
  const historicalEvent = new HistoricalEvent({
    id: 'event-ashen-harbors',
    title: 'Ashen Harbors',
    category: 'catastrophe',
    summary: 'Coastal ports close after a season of volcanic ash and failed harvests.',
    era: 'late-antiquity',
    importance: 4,
    triggeredAt: '2026-04-18T12:20:00.000Z',
  });

  const updatedHistoricalEvent = historicalEvent.withDiscoveries([
    'ash-navigation',
    ' harbor-rationing ',
    'ash-navigation',
  ]);

  assert.notEqual(updatedHistoricalEvent, historicalEvent);
  assert.deepEqual(updatedHistoricalEvent.discoveryIds, ['ash-navigation', 'harbor-rationing']);
  assert.deepEqual(historicalEvent.discoveryIds, []);
});

test('HistoricalEvent can resolve immutably with a resolution timestamp', () => {
  const historicalEvent = new HistoricalEvent({
    id: 'event-ashen-harbors',
    title: 'Ashen Harbors',
    category: 'catastrophe',
    summary: 'Coastal ports close after a season of volcanic ash and failed harvests.',
    era: 'late-antiquity',
    importance: 4,
    triggeredAt: '2026-04-18T12:20:00.000Z',
  });
  const resolvedAt = new Date('2026-04-18T12:30:00.000Z');

  const resolvedHistoricalEvent = historicalEvent.resolve(resolvedAt);

  assert.notEqual(resolvedHistoricalEvent, historicalEvent);
  assert.equal(resolvedHistoricalEvent.resolved, true);
  assert.equal(resolvedHistoricalEvent.resolvedAt?.toISOString(), resolvedAt.toISOString());
  assert.equal(historicalEvent.resolved, false);
  assert.equal(historicalEvent.resolvedAt, null);
});

test('HistoricalEvent rejects invalid identifiers, importance, and resolution invariants', () => {
  assert.throws(
    () =>
      new HistoricalEvent({
        id: '',
        title: 'Ashen Harbors',
        category: 'catastrophe',
        summary: 'Summary',
        era: 'late-antiquity',
        importance: 4,
        triggeredAt: '2026-04-18T12:20:00.000Z',
      }),
    /HistoricalEvent id is required/,
  );

  assert.throws(
    () =>
      new HistoricalEvent({
        id: 'event-ashen-harbors',
        title: 'Ashen Harbors',
        category: 'catastrophe',
        summary: 'Summary',
        era: 'late-antiquity',
        importance: 0,
        triggeredAt: '2026-04-18T12:20:00.000Z',
      }),
    /HistoricalEvent importance must be an integer between 1 and 5/,
  );

  assert.throws(
    () =>
      new HistoricalEvent({
        id: 'event-ashen-harbors',
        title: 'Ashen Harbors',
        category: 'catastrophe',
        summary: 'Summary',
        era: 'late-antiquity',
        importance: 4,
        triggeredAt: 'not-a-date',
      }),
    /HistoricalEvent triggeredAt must be a valid date/,
  );

  assert.throws(
    () =>
      new HistoricalEvent({
        id: 'event-ashen-harbors',
        title: 'Ashen Harbors',
        category: 'catastrophe',
        summary: 'Summary',
        era: 'late-antiquity',
        importance: 4,
        triggeredAt: '2026-04-18T12:20:00.000Z',
        resolved: true,
      }),
    /HistoricalEvent resolvedAt is required when event is resolved/,
  );
});
