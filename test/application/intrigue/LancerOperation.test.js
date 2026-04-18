import test from 'node:test';
import assert from 'node:assert/strict';

import { lancerOperation } from '../../../src/application/intrigue/LancerOperation.js';

test('LancerOperation moves a prepared operation into infiltration', () => {
  const result = lancerOperation({
    cellule: {
      id: 'cellule-ombre',
      status: 'active',
      exposure: 12,
      assetIds: ['safehouse-port', 'forged-seals'],
    },
    operation: {
      id: 'op-cendre',
      assignedAgentIds: ['agent-corbeau', 'agent-brume'],
      requiredAssetIds: ['forged-seals'],
      difficulty: 28,
      detectionRisk: 17,
      progress: 0,
      phase: 'planning',
      heat: 4,
    },
    availableAgentIds: ['agent-corbeau', 'agent-brume', 'agent-echo'],
    alertLevel: 15,
  });

  assert.deepEqual(result, {
    launched: true,
    reason: 'operation-launched',
    readiness: 28,
    blockers: [],
    nextOperation: {
      id: 'op-cendre',
      assignedAgentIds: ['agent-corbeau', 'agent-brume'],
      requiredAssetIds: ['forged-seals'],
      difficulty: 28,
      detectionRisk: 17,
      progress: 10,
      phase: 'infiltration',
      heat: 6,
    },
    events: [
      {
        type: 'intrigue.exposure.assessed',
        operationId: 'op-cendre',
        celluleId: 'cellule-ombre',
        launched: true,
        reason: 'operation-launched',
        readiness: 28,
        celluleExposure: 12,
        detectionRisk: 17,
        alertLevel: 15,
        heatIncrease: 2,
      },
      {
        type: 'intrigue.exposure.risk-detected',
        operationId: 'op-cendre',
        celluleId: 'cellule-ombre',
        readiness: 28,
        celluleExposure: 12,
        detectionRisk: 17,
        alertLevel: 15,
        heatIncrease: 2,
      },
    ],
  });
});

test('LancerOperation reports blockers for unavailable cellule resources', () => {
  const missingAgentsResult = lancerOperation({
    cellule: {
      status: 'active',
      exposure: 22,
      assetIds: ['forged-seals'],
    },
    operation: {
      assignedAgentIds: ['agent-corbeau', 'agent-brume'],
      requiredAssetIds: ['forged-seals'],
      difficulty: 20,
      detectionRisk: 10,
      progress: 0,
      phase: 'planning',
      heat: 0,
    },
    availableAgentIds: ['agent-corbeau'],
    alertLevel: 10,
  });

  assert.deepEqual(missingAgentsResult, {
    launched: false,
    reason: 'missing-agents',
    readiness: 0,
    blockers: [{ agentId: 'agent-brume' }],
    nextOperation: {
      assignedAgentIds: ['agent-corbeau', 'agent-brume'],
      requiredAssetIds: ['forged-seals'],
      difficulty: 20,
      detectionRisk: 10,
      progress: 0,
      phase: 'planning',
      heat: 0,
    },
    events: [
      {
        type: 'intrigue.exposure.assessed',
        operationId: null,
        celluleId: null,
        launched: false,
        reason: 'missing-agents',
        readiness: 0,
        celluleExposure: 22,
        detectionRisk: 10,
        alertLevel: 10,
        heatIncrease: 0,
      },
    ],
  });

  const missingAssetsResult = lancerOperation({
    cellule: {
      status: 'active',
      exposure: 22,
      assetIds: ['safehouse-port'],
    },
    operation: {
      assignedAgentIds: ['agent-corbeau'],
      requiredAssetIds: ['forged-seals'],
      difficulty: 20,
      detectionRisk: 10,
      progress: 0,
      phase: 'planning',
      heat: 0,
    },
    availableAgentIds: ['agent-corbeau'],
    alertLevel: 10,
  });

  assert.deepEqual(missingAssetsResult, {
    launched: false,
    reason: 'missing-assets',
    readiness: 0,
    blockers: [{ assetId: 'forged-seals' }],
    nextOperation: {
      assignedAgentIds: ['agent-corbeau'],
      requiredAssetIds: ['forged-seals'],
      difficulty: 20,
      detectionRisk: 10,
      progress: 0,
      phase: 'planning',
      heat: 0,
    },
    events: [
      {
        type: 'intrigue.exposure.assessed',
        operationId: null,
        celluleId: null,
        launched: false,
        reason: 'missing-assets',
        readiness: 0,
        celluleExposure: 22,
        detectionRisk: 10,
        alertLevel: 10,
        heatIncrease: 0,
      },
    ],
  });
});

test('LancerOperation detection risk lowers readiness without changing launch semantics', () => {
  const lowRiskResult = lancerOperation({
    cellule: {
      status: 'active',
      exposure: 8,
      assetIds: ['forged-seals'],
    },
    operation: {
      id: 'op-brume',
      assignedAgentIds: ['agent-corbeau'],
      requiredAssetIds: ['forged-seals'],
      difficulty: 20,
      detectionRisk: 10,
      progress: 0,
      phase: 'planning',
      heat: 2,
    },
    availableAgentIds: ['agent-corbeau'],
    alertLevel: 10,
  });

  const highRiskResult = lancerOperation({
    cellule: {
      status: 'active',
      exposure: 8,
      assetIds: ['forged-seals'],
    },
    operation: {
      id: 'op-brume',
      assignedAgentIds: ['agent-corbeau'],
      requiredAssetIds: ['forged-seals'],
      difficulty: 20,
      detectionRisk: 45,
      progress: 0,
      phase: 'planning',
      heat: 2,
    },
    availableAgentIds: ['agent-corbeau'],
    alertLevel: 10,
  });

  assert.equal(lowRiskResult.launched, true);
  assert.equal(highRiskResult.launched, true);
  assert.equal(lowRiskResult.reason, 'operation-launched');
  assert.equal(highRiskResult.reason, 'operation-launched');
  assert.equal(lowRiskResult.readiness, 52);
  assert.equal(highRiskResult.readiness, 17);
  assert.ok(highRiskResult.readiness < lowRiskResult.readiness);
  assert.deepEqual(highRiskResult.nextOperation, {
    id: 'op-brume',
    assignedAgentIds: ['agent-corbeau'],
    requiredAssetIds: ['forged-seals'],
    difficulty: 20,
    detectionRisk: 45,
    progress: 10,
    phase: 'infiltration',
    heat: 3,
  });
  assert.deepEqual(highRiskResult.events, [
    {
      type: 'intrigue.exposure.assessed',
      operationId: 'op-brume',
      celluleId: null,
      launched: true,
      reason: 'operation-launched',
      readiness: 17,
      celluleExposure: 8,
      detectionRisk: 45,
      alertLevel: 10,
      heatIncrease: 1,
    },
    {
      type: 'intrigue.exposure.risk-detected',
      operationId: 'op-brume',
      celluleId: null,
      readiness: 17,
      celluleExposure: 8,
      detectionRisk: 45,
      alertLevel: 10,
      heatIncrease: 1,
    },
  ]);
});

test('LancerOperation rejects invalid inputs and blocks unavailable cellules', () => {
  assert.throws(
    () => lancerOperation({ cellule: null, operation: {} }),
    /LancerOperation cellule must be an object/,
  );

  assert.throws(
    () =>
      lancerOperation({
        cellule: { status: 'active', exposure: 0 },
        operation: { assignedAgentIds: ['agent-corbeau'], difficulty: 10, detectionRisk: 5 },
        alertLevel: 101,
      }),
    /LancerOperation alertLevel must be an integer between 0 and 100/,
  );

  assert.throws(
    () =>
      lancerOperation({
        cellule: { status: 'active', exposure: 0, assetIds: ['forged-seals'] },
        operation: { assignedAgentIds: ['agent-corbeau'], requiredAssetIds: [], difficulty: 10, detectionRisk: -1 },
        availableAgentIds: ['agent-corbeau'],
        alertLevel: 10,
      }),
    /LancerOperation operation detectionRisk must be an integer between 0 and 100/,
  );

  const unavailableCellule = lancerOperation({
    cellule: {
      status: 'compromised',
      exposure: 71,
      assetIds: ['forged-seals'],
    },
    operation: {
      assignedAgentIds: ['agent-corbeau'],
      requiredAssetIds: [],
      difficulty: 10,
      detectionRisk: 5,
      progress: 0,
      phase: 'planning',
      heat: 0,
    },
    availableAgentIds: ['agent-corbeau'],
    alertLevel: 20,
  });

  assert.deepEqual(unavailableCellule, {
    launched: false,
    reason: 'cellule-unavailable',
    readiness: 0,
    blockers: [{ status: 'compromised' }],
    nextOperation: {
      assignedAgentIds: ['agent-corbeau'],
      requiredAssetIds: [],
      difficulty: 10,
      detectionRisk: 5,
      progress: 0,
      phase: 'planning',
      heat: 0,
    },
    events: [
      {
        type: 'intrigue.exposure.assessed',
        operationId: null,
        celluleId: null,
        launched: false,
        reason: 'cellule-unavailable',
        readiness: 0,
        celluleExposure: 71,
        detectionRisk: 5,
        alertLevel: 20,
        heatIncrease: 0,
      },
      {
        type: 'intrigue.exposure.cellule-blocked',
        operationId: null,
        celluleId: null,
        celluleStatus: 'compromised',
        celluleExposure: 71,
      },
    ],
  });
});
