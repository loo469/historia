import test from 'node:test';
import assert from 'node:assert/strict';

import { Cellule } from '../../../src/domain/intrigue/Cellule.js';
import { OperationClandestine } from '../../../src/domain/intrigue/OperationClandestine.js';
import { buildIntrigueMapOverlay } from '../../../src/ui/intrigue/buildIntrigueMapOverlay.js';

test('buildIntrigueMapOverlay merges intrigue presence and active sabotage threat by location', () => {
  const overlay = buildIntrigueMapOverlay([
    new Cellule({
      id: 'cell-ash-1',
      factionId: 'shadow-league',
      codename: 'Veil',
      locationId: 'ashlands',
      memberIds: ['ag-1'],
      assetIds: ['asset-1'],
      secrecy: 72,
      loyalty: 66,
      exposure: 21,
    }),
    new Cellule({
      id: 'cell-ash-2',
      factionId: 'shadow-league',
      codename: 'Cinder',
      locationId: 'ashlands',
      memberIds: ['ag-2'],
      assetIds: ['asset-2'],
      secrecy: 49,
      loyalty: 55,
      exposure: 74,
      sleeper: true,
    }),
    new Cellule({
      id: 'cell-river-1',
      factionId: 'shadow-league',
      codename: 'Mist',
      locationId: 'riverlands',
      memberIds: ['ag-3'],
      assetIds: ['asset-3'],
      secrecy: 61,
      loyalty: 62,
      exposure: 15,
    }),
    new Cellule({
      id: 'cell-old',
      factionId: 'shadow-league',
      codename: 'Ash',
      locationId: 'north-coast',
      memberIds: ['ag-4'],
      assetIds: ['asset-4'],
      status: 'dismantled',
    }),
  ], [
    new OperationClandestine({
      id: 'op-ash-1',
      celluleId: 'cell-ash-1',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Cut the signal towers',
      theaterId: 'ashlands',
      assignedAgentIds: ['ag-1'],
      requiredAssetIds: ['asset-1'],
      detectionRisk: 20,
      progress: 58,
      heat: 44,
      phase: 'execution',
    }),
    new OperationClandestine({
      id: 'op-river-1',
      celluleId: 'cell-river-1',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Poison the ferries',
      theaterId: 'riverlands',
      assignedAgentIds: ['ag-3'],
      requiredAssetIds: ['asset-3'],
      detectionRisk: 70,
      progress: 20,
      heat: 10,
      phase: 'infiltration',
    }),
    new OperationClandestine({
      id: 'op-river-rumor',
      celluleId: 'cell-river-1',
      targetFactionId: 'sun-empire',
      type: 'rumor',
      objective: 'Spread false orders',
      theaterId: 'riverlands',
      assignedAgentIds: ['ag-3'],
      requiredAssetIds: ['asset-3'],
    }),
    new OperationClandestine({
      id: 'op-old',
      celluleId: 'cell-ash-2',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Burn supply cache',
      theaterId: 'north-coast',
      assignedAgentIds: ['ag-2'],
      requiredAssetIds: ['asset-2'],
      phase: 'completed',
    }),
  ], {
    locationNames: {
      ashlands: 'Ashlands',
      riverlands: 'Riverlands',
    },
  });

  assert.deepEqual(overlay, [
    {
      overlayId: 'intrigue:ashlands',
      locationId: 'ashlands',
      locationName: 'Ashlands',
      label: 'Ashlands, présence medium, risque sabotage medium',
      presenceLevel: 'medium',
      sabotageRiskLevel: 'medium',
      sabotageRiskScore: 61,
      celluleIds: ['cell-ash-1', 'cell-ash-2'],
      operationIds: ['op-ash-1'],
      metrics: {
        celluleCount: 2,
        exposedCellCount: 1,
        sleeperCellCount: 1,
        sabotageOperationCount: 1,
      },
      style: {
        presence: {
          marker: '◑',
          color: '#7C3AED',
          opacity: 0.5,
        },
        risk: {
          stroke: '#D97706',
          fill: '#FCD34D',
          emphasis: 'elevated',
        },
      },
    },
    {
      overlayId: 'intrigue:riverlands',
      locationId: 'riverlands',
      locationName: 'Riverlands',
      label: 'Riverlands, présence low, risque sabotage low',
      presenceLevel: 'low',
      sabotageRiskLevel: 'low',
      sabotageRiskScore: 20,
      celluleIds: ['cell-river-1'],
      operationIds: ['op-river-1'],
      metrics: {
        celluleCount: 1,
        exposedCellCount: 0,
        sleeperCellCount: 0,
        sabotageOperationCount: 1,
      },
      style: {
        presence: {
          marker: '◔',
          color: '#2563EB',
          opacity: 0.35,
        },
        risk: {
          stroke: '#2563EB',
          fill: '#93C5FD',
          emphasis: 'normal',
        },
      },
    },
  ]);
});

test('buildIntrigueMapOverlay supports plain payloads and style overrides', () => {
  const overlay = buildIntrigueMapOverlay([
    {
      id: 'cell-delta-1',
      factionId: 'shadow-league',
      codename: 'Wake',
      locationId: 'delta',
      memberIds: ['ag-1'],
      assetIds: ['asset-1'],
      secrecy: 60,
      loyalty: 60,
      exposure: 10,
    },
  ], [
    {
      id: 'op-delta-1',
      celluleId: 'cell-delta-1',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Disable the sluice gates',
      theaterId: 'delta',
      assignedAgentIds: ['ag-1'],
      requiredAssetIds: ['asset-1'],
      detectionRisk: 5,
      progress: 90,
      heat: 30,
      phase: 'execution',
    },
  ], {
    styleByPresence: {
      low: { marker: '✦', color: '#10B981', opacity: 0.7 },
    },
    styleByRisk: {
      high: { stroke: '#111827', fill: '#F59E0B', emphasis: 'critical' },
    },
  });

  assert.deepEqual(overlay[0].style, {
    presence: {
      marker: '✦',
      color: '#10B981',
      opacity: 0.7,
    },
    risk: {
      stroke: '#111827',
      fill: '#F59E0B',
      emphasis: 'critical',
    },
  });
});

test('buildIntrigueMapOverlay rejects invalid inputs', () => {
  assert.throws(() => buildIntrigueMapOverlay(null), /cellules must be an array/);
  assert.throws(() => buildIntrigueMapOverlay([], null), /operations must be an array/);
  assert.throws(() => buildIntrigueMapOverlay([null]), /Cellule instances or plain objects/);
  assert.throws(() => buildIntrigueMapOverlay([], [null]), /OperationClandestine instances or plain objects/);
  assert.throws(() => buildIntrigueMapOverlay([], [], null), /options must be an object/);
  assert.throws(() => buildIntrigueMapOverlay([], [], { styleByPresence: [] }), /styleByPresence must be an object/);
  assert.throws(() => buildIntrigueMapOverlay([], [], { styleByRisk: [] }), /styleByRisk must be an object/);
  assert.throws(() => buildIntrigueMapOverlay([], [], { locationNames: [] }), /locationNames must be an object/);
});
