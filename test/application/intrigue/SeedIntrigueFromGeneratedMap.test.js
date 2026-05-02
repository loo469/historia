import test from 'node:test';
import assert from 'node:assert/strict';

import { Cellule } from '../../../src/domain/intrigue/Cellule.js';
import { OperationClandestine } from '../../../src/domain/intrigue/OperationClandestine.js';
import { NiveauAlerte } from '../../../src/domain/intrigue/NiveauAlerte.js';
import { seedIntrigueFromGeneratedMap } from '../../../src/application/intrigue/SeedIntrigueFromGeneratedMap.js';

test('seedIntrigueFromGeneratedMap derives cells, sabotage operations, risk profiles and alert level', () => {
  const result = seedIntrigueFromGeneratedMap({
    provinces: [
      {
        id: 'ash-front',
        name: 'Front des Cendres',
        ownerFactionId: 'sun-empire',
        controllingFactionId: 'moon-league',
        loyalty: 28,
        strategicValue: 9,
        supplyLevel: 'critical',
        contested: true,
      },
      {
        id: 'delta-port',
        name: 'Port du Delta',
        ownerFactionId: 'sun-empire',
        loyalty: 62,
        strategicValue: 6,
        supplyLevel: 'low',
      },
      {
        id: 'quiet-hills',
        name: 'Collines Calmes',
        ownerFactionId: 'sun-empire',
        loyalty: 82,
        strategicValue: 2,
        supplyLevel: 'stable',
      },
    ],
  }, { networkFactionId: 'delta-web' });

  assert.equal(result.cellules.length, 2);
  assert.ok(result.cellules.every((cellule) => cellule instanceof Cellule));
  assert.equal(result.operations.length, 1);
  assert.ok(result.operations[0] instanceof OperationClandestine);
  assert.ok(result.alertLevel instanceof NiveauAlerte);

  assert.deepEqual(result.riskProfiles, [
    {
      provinceId: 'ash-front',
      provinceName: 'Front des Cendres',
      controllingFactionId: 'moon-league',
      sabotageRiskScore: 100,
      riskLevel: 'critical',
      drivers: ['strategic-value', 'low-loyalty', 'contested', 'occupied', 'supply-stress'],
    },
    {
      provinceId: 'delta-port',
      provinceName: 'Port du Delta',
      controllingFactionId: 'sun-empire',
      sabotageRiskScore: 61,
      riskLevel: 'watch',
      drivers: ['supply-stress'],
    },
    {
      provinceId: 'quiet-hills',
      provinceName: 'Collines Calmes',
      controllingFactionId: 'sun-empire',
      sabotageRiskScore: 18,
      riskLevel: 'latent',
      drivers: [],
    },
  ]);

  assert.deepEqual(result.cellules.map((cellule) => cellule.toJSON()), [
    {
      id: 'cell-ash-front',
      factionId: 'delta-web',
      codename: 'Réseau Front des Cendres',
      locationId: 'ash-front',
      memberIds: ['agent-ash-front'],
      assetIds: ['asset-ash-front'],
      operationIds: [],
      secrecy: 49,
      loyalty: 78,
      exposure: 75,
      status: 'active',
      sleeper: false,
    },
    {
      id: 'cell-delta-port',
      factionId: 'delta-web',
      codename: 'Réseau Port du Delta',
      locationId: 'delta-port',
      memberIds: ['agent-delta-port'],
      assetIds: ['asset-delta-port'],
      operationIds: [],
      secrecy: 62,
      loyalty: 66,
      exposure: 36,
      status: 'dormant',
      sleeper: true,
    },
  ]);

  assert.deepEqual(result.operations[0].toJSON(), {
    id: 'op-sabotage-ash-front',
    celluleId: 'cell-ash-front',
    targetFactionId: 'moon-league',
    type: 'sabotage',
    objective: 'Déstabiliser Front des Cendres',
    theaterId: 'ash-front',
    assignedAgentIds: ['agent-ash-front'],
    requiredAssetIds: ['asset-ash-front'],
    difficulty: 76,
    detectionRisk: 78,
    progress: 70,
    phase: 'infiltration',
    heat: 80,
  });

  assert.deepEqual(result.alertLevel.toJSON(), {
    value: 4,
    code: 'verrouille',
    label: 'Verrouillé',
    surveillanceIntensity: 100,
  });
  assert.deepEqual(result.summary, {
    provinceCount: 3,
    seededCelluleCount: 2,
    seededSabotageOperationCount: 1,
    maxSabotageRiskScore: 100,
    alertCode: 'verrouille',
  });
});

test('seedIntrigueFromGeneratedMap supports generated regions and nested map payloads', () => {
  assert.equal(seedIntrigueFromGeneratedMap({
    regions: [{ id: 'border-march', ownerFactionId: 'north', loyalty: 40, strategicValue: 5 }],
  }).summary.seededCelluleCount, 1);

  assert.equal(seedIntrigueFromGeneratedMap({
    map: { provinces: [{ id: 'safe-core', ownerFactionId: 'north', loyalty: 90, strategicValue: 1 }] },
  }).summary.seededCelluleCount, 0);
});

test('seedIntrigueFromGeneratedMap validates payloads', () => {
  assert.throws(() => seedIntrigueFromGeneratedMap(null), /generatedMap must be an object/);
  assert.throws(() => seedIntrigueFromGeneratedMap({ provinces: null }), /generatedMap.provinces must be an array/);
  assert.throws(
    () => seedIntrigueFromGeneratedMap({ provinces: [{ id: 'x', ownerFactionId: 'north', loyalty: 101 }] }),
    /province loyalty must be an integer between 0 and 100/,
  );
  assert.throws(
    () => seedIntrigueFromGeneratedMap({ provinces: [] }, { networkFactionId: ' ' }),
    /networkFactionId is required/,
  );
});
