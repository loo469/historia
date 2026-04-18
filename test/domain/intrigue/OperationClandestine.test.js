import test from 'node:test';
import assert from 'node:assert/strict';

import { OperationClandestine } from '../../../src/domain/intrigue/OperationClandestine.js';

test('OperationClandestine normalizes operation planning fields', () => {
  const operation = new OperationClandestine({
    id: ' op-cendre ',
    celluleId: ' cellule-ombre ',
    targetFactionId: ' faction-aube ',
    type: 'sabotage',
    objective: ' saboter les arsenaux côtiers ',
    theaterId: ' port-nord ',
    assignedAgentIds: ['agent-b', ' agent-a ', 'agent-b'],
    requiredAssetIds: ['asset-dock', ' asset-guild ', 'asset-dock'],
    difficulty: 63,
    detectionRisk: 28,
    progress: 17,
    phase: 'planning',
    heat: 12,
  });

  assert.deepEqual(operation.toJSON(), {
    id: 'op-cendre',
    celluleId: 'cellule-ombre',
    targetFactionId: 'faction-aube',
    type: 'sabotage',
    objective: 'saboter les arsenaux côtiers',
    theaterId: 'port-nord',
    assignedAgentIds: ['agent-a', 'agent-b'],
    requiredAssetIds: ['asset-dock', 'asset-guild'],
    difficulty: 63,
    detectionRisk: 28,
    progress: 17,
    phase: 'planning',
    heat: 12,
  });

  assert.equal(operation.successWindow, 26);
  assert.equal(operation.isResolved, false);
});

test('OperationClandestine supports immutable phase and staffing updates', () => {
  const operation = new OperationClandestine({
    id: 'op-cendre',
    celluleId: 'cellule-ombre',
    targetFactionId: 'faction-aube',
    type: 'intelligence',
    objective: 'cartographier le réseau de messagers',
    theaterId: 'port-nord',
    phase: 'infiltration',
    progress: 24,
    detectionRisk: 34,
    heat: 9,
  });

  const staffedOperation = operation.assignAgent('agent-corbeau');
  const advancedOperation = staffedOperation.advance({
    phase: 'execution',
    progress: 61,
    detectionRisk: 47,
    heat: 31,
  });

  assert.notEqual(staffedOperation, operation);
  assert.notEqual(advancedOperation, staffedOperation);
  assert.deepEqual(staffedOperation.assignedAgentIds, ['agent-corbeau']);
  assert.equal(advancedOperation.phase, 'execution');
  assert.equal(advancedOperation.progress, 61);
  assert.equal(advancedOperation.detectionRisk, 47);
  assert.equal(advancedOperation.heat, 31);
  assert.equal(operation.phase, 'infiltration');
  assert.deepEqual(operation.assignedAgentIds, []);
});

test('OperationClandestine rejects invalid planning invariants', () => {
  assert.throws(
    () =>
      new OperationClandestine({
        id: '',
        celluleId: 'cellule-ombre',
        targetFactionId: 'faction-aube',
        type: 'sabotage',
        objective: 'saboter les arsenaux côtiers',
        theaterId: 'port-nord',
      }),
    /OperationClandestine id is required/,
  );

  assert.throws(
    () =>
      new OperationClandestine({
        id: 'op-cendre',
        celluleId: 'cellule-ombre',
        targetFactionId: 'faction-aube',
        type: 'espionage',
        objective: 'saboter les arsenaux côtiers',
        theaterId: 'port-nord',
      }),
    /OperationClandestine type must be one of: sabotage, rumor, intelligence, assassination, subversion/,
  );

  assert.throws(
    () =>
      new OperationClandestine({
        id: 'op-cendre',
        celluleId: 'cellule-ombre',
        targetFactionId: 'faction-aube',
        type: 'sabotage',
        objective: 'saboter les arsenaux côtiers',
        theaterId: 'port-nord',
        assignedAgentIds: ['agent-a', ''],
      }),
    /OperationClandestine assignedAgentIds cannot contain empty values/,
  );

  assert.throws(
    () =>
      new OperationClandestine({
        id: 'op-cendre',
        celluleId: 'cellule-ombre',
        targetFactionId: 'faction-aube',
        type: 'sabotage',
        objective: 'saboter les arsenaux côtiers',
        theaterId: 'port-nord',
        phase: 'escaping',
      }),
    /OperationClandestine phase must be one of: planning, infiltration, execution, exfiltration, completed, failed/,
  );
});
