import test from 'node:test';
import assert from 'node:assert/strict';

import { diffuserRumeur } from '../../../src/application/intrigue/DiffuserRumeur.js';

test('DiffuserRumeur applies legitimacy and panic effects on success', () => {
  const result = diffuserRumeur({
    operation: {
      id: 'op-voile',
      readiness: 74,
      heat: 16,
      phase: 'infiltration',
      progress: 45,
    },
    rumor: {
      id: 'rumor-succession',
      credibility: 68,
      spread: 61,
    },
    target: {
      id: 'court-aurelia',
      legitimacy: 72,
      stability: 57,
      panic: 9,
    },
    alertLevel: 18,
    channelIds: ['court-whispers', 'market-gossip', 'river-barges'],
  });

  assert.deepEqual(result, {
    propagated: true,
    outcome: 'rumor-spread',
    operation: {
      id: 'op-voile',
      readiness: 74,
      heat: 23,
      phase: 'resolved',
      progress: 100,
    },
    rumor: {
      id: 'rumor-succession',
      credibility: 68,
      spread: 61,
      channelIds: ['court-whispers', 'market-gossip', 'river-barges'],
      lastOutcome: 'spread',
    },
    target: {
      id: 'court-aurelia',
      legitimacy: 29,
      stability: 31,
      panic: 73,
    },
    summary: 'Rumor spread through 3 channel(s).',
    effect: {
      legitimacyLoss: 43,
      stabilityLoss: 26,
      panicGain: 64,
      reachedChannelIds: ['court-whispers', 'market-gossip', 'river-barges'],
    },
  });
});

test('DiffuserRumeur reports contained rumors explicitly', () => {
  const result = diffuserRumeur({
    operation: {
      id: 'op-voile',
      readiness: 28,
      heat: 22,
      phase: 'infiltration',
      progress: 45,
    },
    rumor: {
      id: 'rumor-succession',
      credibility: 34,
      spread: 27,
    },
    target: {
      id: 'court-aurelia',
      legitimacy: 72,
      stability: 63,
      panic: 11,
    },
    alertLevel: 39,
    channelIds: ['court-whispers', 'market-gossip'],
  });

  assert.deepEqual(result, {
    propagated: true,
    outcome: 'rumor-contained',
    operation: {
      id: 'op-voile',
      readiness: 28,
      heat: 32,
      phase: 'resolved',
      progress: 100,
    },
    rumor: {
      id: 'rumor-succession',
      credibility: 34,
      spread: 27,
      channelIds: ['court-whispers'],
      lastOutcome: 'contained',
    },
    target: {
      id: 'court-aurelia',
      legitimacy: 72,
      stability: 63,
      panic: 14,
    },
    summary: 'Rumor was contained before it caused lasting damage.',
    effect: {
      legitimacyLoss: 0,
      stabilityLoss: 0,
      panicGain: 3,
      reachedChannelIds: ['court-whispers'],
    },
  });
});

test('DiffuserRumeur validates inputs and handles missing channels', () => {
  assert.throws(
    () => diffuserRumeur({ operation: null, rumor: {}, target: {} }),
    /DiffuserRumeur operation must be an object/,
  );

  assert.throws(
    () =>
      diffuserRumeur({
        operation: { id: 'op-voile', readiness: 25, heat: 10 },
        rumor: { id: 'rumor-succession', credibility: 110, spread: 15 },
        target: { id: 'court-aurelia', legitimacy: 72, stability: 63 },
      }),
    /DiffuserRumeur rumor credibility must be an integer between 0 and 100/,
  );

  const result = diffuserRumeur({
    operation: {
      id: 'op-voile',
      readiness: 60,
      heat: 12,
      phase: 'infiltration',
      progress: 45,
    },
    rumor: {
      id: 'rumor-succession',
      credibility: 55,
      spread: 40,
    },
    target: {
      id: 'court-aurelia',
      legitimacy: 72,
      stability: 63,
      panic: 8,
    },
    channelIds: [],
  });

  assert.deepEqual(result, {
    propagated: false,
    outcome: 'no-rumor-channels',
    operation: {
      id: 'op-voile',
      readiness: 60,
      heat: 12,
      phase: 'infiltration',
      progress: 45,
    },
    rumor: {
      id: 'rumor-succession',
      credibility: 55,
      spread: 40,
    },
    target: {
      id: 'court-aurelia',
      legitimacy: 72,
      stability: 63,
      panic: 8,
    },
    summary: 'No rumor channel was available.',
    effect: {
      legitimacyLoss: 0,
      stabilityLoss: 0,
      panicGain: 0,
      reachedChannelIds: [],
    },
  });
});
