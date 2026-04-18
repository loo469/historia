import test from 'node:test';
import assert from 'node:assert/strict';

import { resoudreSabotage } from '../../../src/application/intrigue/ResoudreSabotage.js';

test('ResoudreSabotage produces explicit damage on success', () => {
  const result = resoudreSabotage({
    operation: {
      id: 'op-cendre',
      readiness: 78,
      heat: 12,
      phase: 'infiltration',
      progress: 60,
    },
    target: {
      id: 'city-aster-port',
      industry: 70,
      stability: 62,
      security: 34,
    },
    infrastructureIds: ['rail-hub', 'arsenal', 'signal-yard'],
    randomFactor: 19,
  });

  assert.deepEqual(result, {
    resolved: true,
    outcome: 'sabotage-succeeded',
    operation: {
      id: 'op-cendre',
      readiness: 78,
      heat: 22,
      phase: 'resolved',
      progress: 100,
    },
    target: {
      id: 'city-aster-port',
      industry: 54,
      stability: 50,
      security: 34,
      disruptedInfrastructureIds: ['arsenal', 'rail-hub'],
    },
    summary: 'Sabotage disrupted 2 infrastructure target(s).',
    damage: {
      industryLoss: 16,
      stabilityLoss: 12,
      heatIncrease: 10,
      disruptedInfrastructureIds: ['arsenal', 'rail-hub'],
    },
  });
});

test('ResoudreSabotage keeps failure outcomes explicit', () => {
  const result = resoudreSabotage({
    operation: {
      id: 'op-cendre',
      readiness: 24,
      heat: 33,
      phase: 'infiltration',
      progress: 60,
    },
    target: {
      id: 'city-aster-port',
      industry: 70,
      stability: 62,
      security: 58,
    },
    infrastructureIds: ['rail-hub', 'arsenal'],
    randomFactor: 6,
  });

  assert.deepEqual(result, {
    resolved: true,
    outcome: 'sabotage-failed',
    operation: {
      id: 'op-cendre',
      readiness: 24,
      heat: 47,
      phase: 'resolved',
      progress: 100,
    },
    target: {
      id: 'city-aster-port',
      industry: 70,
      stability: 62,
      security: 58,
      disruptedInfrastructureIds: [],
    },
    summary: 'Sabotage failed to create lasting damage.',
    damage: {
      industryLoss: 0,
      stabilityLoss: 0,
      heatIncrease: 14,
      disruptedInfrastructureIds: [],
    },
  });
});

test('ResoudreSabotage validates inputs and handles missing infrastructure', () => {
  assert.throws(
    () => resoudreSabotage({ operation: null, target: {} }),
    /ResoudreSabotage operation must be an object/,
  );

  assert.throws(
    () =>
      resoudreSabotage({
        operation: { id: 'op-cendre', readiness: 20, heat: 0 },
        target: { id: 'city-aster-port', industry: 50, stability: 50, security: 50 },
        randomFactor: 120,
      }),
    /ResoudreSabotage randomFactor must be an integer between 0 and 100/,
  );

  const result = resoudreSabotage({
    operation: {
      id: 'op-cendre',
      readiness: 65,
      heat: 10,
      phase: 'infiltration',
      progress: 50,
    },
    target: {
      id: 'city-aster-port',
      industry: 52,
      stability: 48,
      security: 45,
    },
    infrastructureIds: [],
    randomFactor: 10,
  });

  assert.deepEqual(result, {
    resolved: false,
    outcome: 'no-target-infrastructure',
    operation: {
      id: 'op-cendre',
      readiness: 65,
      heat: 10,
      phase: 'infiltration',
      progress: 50,
    },
    target: {
      id: 'city-aster-port',
      industry: 52,
      stability: 48,
      security: 45,
    },
    summary: 'No sabotage target was available.',
    damage: {
      industryLoss: 0,
      stabilityLoss: 0,
      heatIncrease: 0,
      disruptedInfrastructureIds: [],
    },
  });
});
