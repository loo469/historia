import test from 'node:test';
import assert from 'node:assert/strict';

import { Cellule } from '../../../src/domain/intrigue/Cellule.js';
import { OperationClandestine } from '../../../src/domain/intrigue/OperationClandestine.js';
import { buildIntrigueWebDemo } from '../../../src/ui/intrigue/buildIntrigueWebDemo.js';

test('buildIntrigueWebDemo assembles alert badge, hotspots, and panels for the web demo', () => {
  const demo = buildIntrigueWebDemo({
    alertLevel: 'critique',
    cellules: [
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
    ],
    operations: [
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
        id: 'op-rumor',
        celluleId: 'cell-river-1',
        targetFactionId: 'sun-empire',
        type: 'rumor',
        objective: 'Spread false orders',
        theaterId: 'riverlands',
        assignedAgentIds: ['ag-3'],
        requiredAssetIds: ['asset-3'],
        phase: 'execution',
      }),
    ],
  }, {
    locationNames: {
      ashlands: 'Ashlands',
      riverlands: 'Riverlands',
    },
  });

  assert.equal(demo.title, 'Couches intrigue');
  assert.equal(demo.summary, '1 foyers critiques, 2 sabotages actifs, alerte critique');
  assert.equal(demo.alertBadge.level.code, 'critique');
  assert.equal(demo.map.entries.length, 2);
  assert.deepEqual(demo.hotspots, [
    {
      locationId: 'ashlands',
      locationName: 'Ashlands',
      label: 'Ashlands, présence medium, risque sabotage medium',
      severity: 'critical',
      sabotageRiskScore: 61,
      presenceLevel: 'medium',
      sabotageRiskLevel: 'medium',
      exposedCellCount: 1,
      sleeperCellCount: 1,
      celluleCount: 2,
      operationCount: 1,
      visualCue: '◑ elevated',
    },
    {
      locationId: 'riverlands',
      locationName: 'Riverlands',
      label: 'Riverlands, présence low, risque sabotage low',
      severity: 'watch',
      sabotageRiskScore: 20,
      presenceLevel: 'low',
      sabotageRiskLevel: 'low',
      exposedCellCount: 0,
      sleeperCellCount: 0,
      celluleCount: 1,
      operationCount: 1,
      visualCue: '◔ normal',
    },
  ]);
  assert.deepEqual(demo.panels.cellules[0], {
    celluleId: 'cell-ash-2',
    codename: 'Cinder',
    locationId: 'ashlands',
    locationName: 'Ashlands',
    status: 'active',
    sleeper: true,
    exposure: 74,
    readiness: 43,
    tone: 'danger',
    statusClass: 'compromised',
    statusLabel: 'Compromise',
    statusMarker: '✕',
    badges: ['compromise', 'loyalty:55', 'secrecy:49'],
  });
  assert.deepEqual(demo.panels.operations[0], {
    operationId: 'op-ash-1',
    type: 'sabotage',
    objective: 'Cut the signal towers',
    locationId: 'ashlands',
    locationName: 'Ashlands',
    phase: 'execution',
    progress: 58,
    heat: 44,
    detectionRisk: 20,
    successWindow: 88,
    tone: 'warning',
  });
  assert.deepEqual(demo.metrics, {
    locationCount: 2,
    celluleCount: 3,
    exposedCellCount: 1,
    sleeperCellCount: 1,
    activeOperationCount: 3,
    activeSabotageCount: 2,
    criticalHotspotCount: 1,
  });
});

test('buildIntrigueWebDemo supports plain payloads and option overrides', () => {
  const demo = buildIntrigueWebDemo({
    alertLevel: 2,
    cellules: [{
      id: 'cell-delta-1',
      factionId: 'shadow-league',
      codename: 'Wake',
      locationId: 'delta',
      memberIds: ['ag-1'],
      assetIds: ['asset-1'],
      secrecy: 60,
      loyalty: 60,
      exposure: 10,
    }],
    operations: [{
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
    }],
  }, {
    alertPrefix: 'Sécurité',
    styleByPresence: {
      low: { marker: '✦', color: '#10B981', opacity: 0.7 },
    },
    styleByRisk: {
      high: { stroke: '#111827', fill: '#F59E0B', emphasis: 'critical' },
    },
  });

  assert.equal(demo.alertBadge.text, 'Sécurité Renforcé');
  assert.deepEqual(demo.map.entries[0].style, {
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

test('buildIntrigueWebDemo rejects invalid inputs', () => {
  assert.throws(() => buildIntrigueWebDemo(null), /payload must be an object/);
  assert.throws(() => buildIntrigueWebDemo({ cellules: null, operations: [] }), /payload.cellules must be an array/);
  assert.throws(() => buildIntrigueWebDemo({ cellules: [], operations: null }), /payload.operations must be an array/);
  assert.throws(() => buildIntrigueWebDemo({ cellules: [null], operations: [] }), /Cellule instances or plain objects/);
  assert.throws(() => buildIntrigueWebDemo({ cellules: [], operations: [null] }), /OperationClandestine instances or plain objects/);
  assert.throws(() => buildIntrigueWebDemo({ cellules: [], operations: [] }, null), /options must be an object/);
  assert.throws(() => buildIntrigueWebDemo({ cellules: [], operations: [] }, { locationNames: [] }), /locationNames must be an object/);
});
