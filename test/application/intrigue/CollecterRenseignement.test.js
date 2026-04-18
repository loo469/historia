import test from 'node:test';
import assert from 'node:assert/strict';

import { collecterRenseignement } from '../../../src/application/intrigue/CollecterRenseignement.js';

test('CollecterRenseignement returns explicit intel gains on success', () => {
  const result = collecterRenseignement({
    operation: {
      id: 'op-verre',
      readiness: 72,
      heat: 14,
      phase: 'infiltration',
      progress: 40,
    },
    target: {
      id: 'faction-aurora',
      security: 39,
      secrecy: 44,
      awareness: 16,
    },
    intelChannelIds: ['court-ledger', 'dock-clerks', 'messenger-chain'],
    randomFactor: 18,
  });

  assert.deepEqual(result, {
    collected: true,
    outcome: 'intel-collected',
    operation: {
      id: 'op-verre',
      readiness: 72,
      heat: 20,
      phase: 'resolved',
      progress: 100,
    },
    target: {
      id: 'faction-aurora',
      security: 39,
      secrecy: 44,
      awareness: 24,
      compromisedChannelIds: ['court-ledger', 'dock-clerks'],
    },
    summary: 'Collected intelligence through 2 channel(s).',
    intel: {
      intelPoints: 24,
      insightLevel: 32,
      heatIncrease: 6,
      compromisedChannelIds: ['court-ledger', 'dock-clerks'],
    },
  });
});

test('CollecterRenseignement reports denied collection explicitly', () => {
  const result = collecterRenseignement({
    operation: {
      id: 'op-verre',
      readiness: 24,
      heat: 21,
      phase: 'infiltration',
      progress: 40,
    },
    target: {
      id: 'faction-aurora',
      security: 63,
      secrecy: 59,
      awareness: 16,
    },
    intelChannelIds: ['court-ledger', 'dock-clerks'],
    randomFactor: 7,
  });

  assert.deepEqual(result, {
    collected: true,
    outcome: 'intel-denied',
    operation: {
      id: 'op-verre',
      readiness: 24,
      heat: 30,
      phase: 'resolved',
      progress: 100,
    },
    target: {
      id: 'faction-aurora',
      security: 63,
      secrecy: 59,
      awareness: 18,
      compromisedChannelIds: [],
    },
    summary: 'Target security denied meaningful intelligence collection.',
    intel: {
      intelPoints: 0,
      insightLevel: 0,
      heatIncrease: 9,
      compromisedChannelIds: [],
    },
  });
});

test('CollecterRenseignement validates inputs and handles missing channels', () => {
  assert.throws(
    () => collecterRenseignement({ operation: null, target: {} }),
    /CollecterRenseignement operation must be an object/,
  );

  assert.throws(
    () =>
      collecterRenseignement({
        operation: { id: 'op-verre', readiness: 55, heat: 10 },
        target: { id: 'faction-aurora', security: 39, secrecy: 44, awareness: 16 },
        randomFactor: 120,
      }),
    /CollecterRenseignement randomFactor must be an integer between 0 and 100/,
  );

  const result = collecterRenseignement({
    operation: {
      id: 'op-verre',
      readiness: 60,
      heat: 9,
      phase: 'infiltration',
      progress: 40,
    },
    target: {
      id: 'faction-aurora',
      security: 39,
      secrecy: 44,
      awareness: 16,
    },
    intelChannelIds: [],
  });

  assert.deepEqual(result, {
    collected: false,
    outcome: 'no-intel-channels',
    operation: {
      id: 'op-verre',
      readiness: 60,
      heat: 9,
      phase: 'infiltration',
      progress: 40,
    },
    target: {
      id: 'faction-aurora',
      security: 39,
      secrecy: 44,
      awareness: 16,
    },
    summary: 'No intelligence channel was available.',
    intel: {
      intelPoints: 0,
      insightLevel: 0,
      heatIncrease: 0,
      compromisedChannelIds: [],
    },
  });
});
