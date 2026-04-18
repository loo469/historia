import test from 'node:test';
import assert from 'node:assert/strict';

import {
  triggerHistoricalEvent,
  triggerHistoricalEventAtCurrentTime,
} from '../../../src/application/culture/triggerHistoricalEvent.js';

class FixedClock {
  constructor(value) {
    this.value = value;
  }

  async requireNow() {
    return this.value;
  }
}

test('triggerHistoricalEventAtCurrentTime uses Clock integration for trigger timestamps', async () => {
  const triggeredEvent = await triggerHistoricalEventAtCurrentTime(
    {
      id: 'event-court-reckoning',
      title: 'Court Reckoning',
      era: 'early-modern',
      summary: 'The court reorders its chronicles after a public scandal.',
      affectedCultureIds: ['culture-east'],
      consequenceIds: ['archive-census'],
      unlockedResearchIds: ['statecraft'],
      repeatable: true,
      triggerCount: 0,
      lastTriggeredAt: null,
      divergenceId: null,
    },
    {
      triggeredBy: 'gamma-council',
      consequenceIds: ['public-ledger'],
    },
    new FixedClock('2026-04-18T14:08:00.000Z'),
  );

  assert.equal(triggeredEvent.lastTriggeredAt, '2026-04-18T14:08:00.000Z');
  assert.equal(triggeredEvent.lastTriggeredBy, 'gamma-council');
  assert.deepEqual(triggeredEvent.consequenceIds, ['archive-census', 'public-ledger']);
});

test('triggerHistoricalEventAtCurrentTime rejects invalid clocks', async () => {
  await assert.rejects(
    () => triggerHistoricalEventAtCurrentTime({
      id: 'event-court-reckoning',
      title: 'Court Reckoning',
      era: 'early-modern',
      summary: 'The court reorders its chronicles after a public scandal.',
      affectedCultureIds: ['culture-east'],
      consequenceIds: [],
      unlockedResearchIds: [],
      repeatable: true,
      triggerCount: 0,
      lastTriggeredAt: null,
      divergenceId: null,
    }, {}, null),
    /triggerHistoricalEventAtCurrentTime clock must expose requireNow\(\)/,
  );
});

test('triggerHistoricalEvent merges consequences and unlocked research immutably', () => {
  const historicalEvent = {
    id: 'event-library-revolt',
    title: 'Library Revolt',
    era: 'late-medieval',
    summary: 'Scribes force the court to open its archives to guild schools.',
    affectedCultureIds: ['culture-north'],
    consequenceIds: ['archive-reform'],
    unlockedResearchIds: ['paper-ledgers'],
    repeatable: true,
    triggerCount: 0,
    lastTriggeredAt: null,
    divergenceId: null,
  };

  const triggeredEvent = triggerHistoricalEvent(historicalEvent, {
    triggeredAt: '2026-04-18T13:15:00.000Z',
    triggeredBy: 'gamma-simulation',
    consequenceIds: ['public-archives', 'archive-reform'],
    unlockedResearchIds: ['paper-ledgers', 'civic-literacy'],
    divergenceId: 'divergence-open-archives',
  });

  assert.notEqual(triggeredEvent, historicalEvent);
  assert.deepEqual(triggeredEvent.consequenceIds, ['archive-reform', 'public-archives']);
  assert.deepEqual(triggeredEvent.unlockedResearchIds, ['civic-literacy', 'paper-ledgers']);
  assert.equal(triggeredEvent.divergenceId, 'divergence-open-archives');
  assert.equal(triggeredEvent.triggerCount, 1);
  assert.equal(triggeredEvent.lastTriggeredAt, '2026-04-18T13:15:00.000Z');
  assert.equal(triggeredEvent.lastTriggeredBy, 'gamma-simulation');
  assert.deepEqual(historicalEvent.consequenceIds, ['archive-reform']);
  assert.deepEqual(historicalEvent.unlockedResearchIds, ['paper-ledgers']);
});

test('triggerHistoricalEvent preserves an attached divergence id when execution omits it', () => {
  const triggeredEvent = triggerHistoricalEvent(
    {
      id: 'event-court-translation-drive',
      title: 'Court Translation Drive',
      era: 'early-modern',
      summary: 'A royal bureau sponsors translations of rival chronicles.',
      affectedCultureIds: ['culture-east'],
      consequenceIds: [],
      unlockedResearchIds: ['linguistics'],
      repeatable: true,
      triggerCount: 1,
      lastTriggeredAt: '2026-04-18T12:00:00.000Z',
      divergenceId: 'divergence-shared-canon',
    },
    {
      triggeredAt: '2026-04-18T13:20:00.000Z',
      triggeredBy: 'council-gamma',
      consequenceIds: ['canon-debate'],
    },
  );

  assert.equal(triggeredEvent.divergenceId, 'divergence-shared-canon');
  assert.equal(triggeredEvent.triggerCount, 2);
  assert.equal(triggeredEvent.lastTriggeredBy, 'council-gamma');
});

test('triggerHistoricalEvent rejects re-triggering a non-repeatable event', () => {
  assert.throws(
    () =>
      triggerHistoricalEvent(
        {
          id: 'event-broken-seal',
          title: 'Broken Seal',
          era: 'classical',
          summary: 'An imperial seal is broken and reveals forbidden annals.',
          affectedCultureIds: ['culture-south'],
          consequenceIds: [],
          unlockedResearchIds: [],
          repeatable: false,
          triggerCount: 1,
          lastTriggeredAt: '2026-04-18T12:00:00.000Z',
          divergenceId: null,
        },
        {
          triggeredAt: '2026-04-18T13:25:00.000Z',
        },
      ),
    /triggerHistoricalEvent cannot re-trigger a non-repeatable event once it has already fired/,
  );
});

test('triggerHistoricalEvent rejects mismatched divergence ids and invalid payloads', () => {
  assert.throws(
    () =>
      triggerHistoricalEvent(
        {
          id: 'event-broken-seal',
          title: 'Broken Seal',
          era: 'classical',
          summary: 'An imperial seal is broken and reveals forbidden annals.',
          affectedCultureIds: ['culture-south'],
          consequenceIds: [],
          unlockedResearchIds: [],
          repeatable: true,
          triggerCount: 0,
          lastTriggeredAt: null,
          divergenceId: 'divergence-sealed-archives',
        },
        {
          triggeredAt: '2026-04-18T13:25:00.000Z',
          divergenceId: 'divergence-rival-archives',
        },
      ),
    /triggerHistoricalEvent execution.divergenceId must match the event divergenceId when one is already attached/,
  );

  assert.throws(
    () =>
      triggerHistoricalEvent(
        {
          id: 'event-broken-seal',
          title: 'Broken Seal',
          era: 'classical',
          summary: 'An imperial seal is broken and reveals forbidden annals.',
          affectedCultureIds: ['culture-south'],
          consequenceIds: [],
          unlockedResearchIds: [],
          repeatable: 'no',
          triggerCount: 0,
          lastTriggeredAt: null,
          divergenceId: null,
        },
        {
          triggeredAt: '2026-04-18T13:25:00.000Z',
        },
      ),
    /triggerHistoricalEvent historicalEvent.repeatable must be a boolean/,
  );

  assert.throws(
    () =>
      triggerHistoricalEvent(
        {
          id: 'event-broken-seal',
          title: 'Broken Seal',
          era: 'classical',
          summary: 'An imperial seal is broken and reveals forbidden annals.',
          affectedCultureIds: ['culture-south'],
          consequenceIds: [],
          unlockedResearchIds: [''],
          repeatable: true,
          triggerCount: 0,
          lastTriggeredAt: null,
          divergenceId: null,
        },
        {
          triggeredAt: '2026-04-18T13:25:00.000Z',
        },
      ),
    /triggerHistoricalEvent historicalEvent.unlockedResearchIds cannot contain empty values/,
  );
});
