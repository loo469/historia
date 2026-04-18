import test from 'node:test';
import assert from 'node:assert/strict';

import { collecterRenseignement } from '../../../src/application/intrigue/CollecterRenseignement.js';

test('CollecterRenseignement returns actionable intelligence on success', () => {
  const result = collecterRenseignement({
    operation: {
      id: 'op-silence',
      detectionRisk: 28,
      progress: 42,
      heat: 9,
    },
    agent: {
      id: 'agent-cendre',
      discretion: 82,
      influence: 66,
    },
    target: {
      id: 'faction-aube',
      secrecy: 47,
      stability: 38,
    },
    randomFactor: 21,
    intelTags: ['supply-lines', 'council-rifts', 'border-weakness'],
  });

  assert.deepEqual(result, {
    collected: true,
    outcome: 'intel-collected',
    operation: {
      id: 'op-silence',
      detectionRisk: 28,
      progress: 62,
      heat: 13,
    },
    agent: {
      id: 'agent-cendre',
      discretion: 82,
      influence: 66,
    },
    target: {
      id: 'faction-aube',
      secrecy: 47,
      stability: 38,
    },
    report: {
      credibility: 67,
      intelScore: 55,
      discoveredTags: ['border-weakness', 'council-rifts'],
    },
    summary: 'Collected 2 actionable intelligence tag(s).',
  });
});

test('CollecterRenseignement surfaces compromised intelligence when the sweep fails', () => {
  const result = collecterRenseignement({
    operation: {
      id: 'op-silence',
      detectionRisk: 40,
      progress: 12,
      heat: 11,
    },
    agent: {
      id: 'agent-cendre',
      discretion: 31,
      influence: 28,
    },
    target: {
      id: 'faction-aube',
      secrecy: 80,
      stability: 66,
    },
    randomFactor: 4,
    intelTags: ['supply-lines'],
  });

  assert.deepEqual(result, {
    collected: false,
    outcome: 'intel-compromised',
    operation: {
      id: 'op-silence',
      detectionRisk: 40,
      progress: 22,
      heat: 19,
    },
    agent: {
      id: 'agent-cendre',
      discretion: 31,
      influence: 28,
    },
    target: {
      id: 'faction-aube',
      secrecy: 80,
      stability: 66,
    },
    report: {
      credibility: 0,
      intelScore: 0,
      discoveredTags: [],
    },
    summary: 'The intelligence sweep produced fragmented or compromised information.',
  });
});

test('CollecterRenseignement validates inputs', () => {
  assert.throws(
    () => collecterRenseignement({ operation: null, agent: {}, target: {} }),
    /CollecterRenseignement operation must be an object/,
  );

  assert.throws(
    () =>
      collecterRenseignement({
        operation: { id: 'op-silence', detectionRisk: 10, progress: 0, heat: 0 },
        agent: { id: 'agent-cendre', discretion: 50, influence: 50 },
        target: { id: 'faction-aube', secrecy: 50, stability: 50 },
        randomFactor: 101,
      }),
    /CollecterRenseignement randomFactor must be an integer between 0 and 100/,
  );

  assert.throws(
    () =>
      collecterRenseignement({
        operation: { id: 'op-silence', detectionRisk: 10, progress: 0, heat: 0 },
        agent: { id: 'agent-cendre', discretion: 50, influence: 50 },
        target: { id: 'faction-aube', secrecy: 50, stability: 50 },
        intelTags: ['valid-tag', ''],
      }),
    /CollecterRenseignement intelTags cannot contain empty values/,
  );
});
