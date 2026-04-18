import test from 'node:test';
import assert from 'node:assert/strict';

import { InMemoryIntrigueRepository } from '../../../src/adapters/intrigue/InMemoryIntrigueRepository.js';
import { Cellule } from '../../../src/domain/intrigue/Cellule.js';
import { OperationClandestine } from '../../../src/domain/intrigue/OperationClandestine.js';

test('InMemoryIntrigueRepository loads intrigue state and returns defensive copies', async () => {
  const repository = new InMemoryIntrigueRepository({
    cellules: [
      {
        id: ' cellule-brume ',
        factionId: ' faction-delta ',
        codename: ' Brume ',
        locationId: ' port-nord ',
        memberIds: ['agent-2', ' agent-1 '],
        assetIds: ['safehouse-port'],
      },
    ],
    operations: [
      {
        id: ' op-cendre ',
        celluleId: ' cellule-brume ',
        targetFactionId: ' faction-rivale ',
        type: 'sabotage',
        objective: ' Couper le ravitaillement ',
        theaterId: ' port-nord ',
        assignedAgentIds: ['agent-2', ' agent-1 '],
        requiredAssetIds: ['safehouse-port'],
      },
    ],
  });

  const cellule = await repository.getCelluleById('cellule-brume');
  const operation = await repository.getOperationById('op-cendre');

  assert.equal(cellule instanceof Cellule, true);
  assert.equal(operation instanceof OperationClandestine, true);
  assert.deepEqual(cellule?.toJSON(), {
    id: 'cellule-brume',
    factionId: 'faction-delta',
    codename: 'Brume',
    locationId: 'port-nord',
    memberIds: ['agent-1', 'agent-2'],
    assetIds: ['safehouse-port'],
    operationIds: [],
    secrecy: 50,
    loyalty: 50,
    exposure: 0,
    status: 'active',
    sleeper: false,
  });
  assert.deepEqual(operation?.toJSON(), {
    id: 'op-cendre',
    celluleId: 'cellule-brume',
    targetFactionId: 'faction-rivale',
    type: 'sabotage',
    objective: 'Couper le ravitaillement',
    theaterId: 'port-nord',
    assignedAgentIds: ['agent-1', 'agent-2'],
    requiredAssetIds: ['safehouse-port'],
    difficulty: 50,
    detectionRisk: 25,
    progress: 0,
    phase: 'planning',
    heat: 0,
  });

  cellule.memberIds.push('mutated');
  operation.assignedAgentIds.push('mutated');

  assert.deepEqual((await repository.getCelluleById('cellule-brume'))?.memberIds, ['agent-1', 'agent-2']);
  assert.deepEqual((await repository.getOperationById('op-cendre'))?.assignedAgentIds, ['agent-1', 'agent-2']);
});

test('InMemoryIntrigueRepository saves and lists cellules and operations in stable order', async () => {
  const repository = new InMemoryIntrigueRepository();

  await repository.saveCellule({
    id: 'cellule-zeta',
    factionId: 'faction-delta',
    codename: 'Zeta',
    locationId: 'front-est',
    memberIds: ['agent-z'],
  });

  await repository.saveCellule({
    id: 'cellule-alpha',
    factionId: 'faction-delta',
    codename: 'Alpha',
    locationId: 'port-nord',
    memberIds: ['agent-a'],
  });

  await repository.saveOperation({
    id: 'op-2',
    celluleId: 'cellule-alpha',
    targetFactionId: 'faction-rivale',
    type: 'intelligence',
    objective: 'Observer le port',
    theaterId: 'port-nord',
  });

  await repository.saveOperation({
    id: 'op-1',
    celluleId: 'cellule-alpha',
    targetFactionId: 'faction-rivale',
    type: 'rumor',
    objective: 'Semer le doute',
    theaterId: 'port-nord',
  });

  const celluleIds = (await repository.listCellulesByFaction('faction-delta')).map((cellule) => cellule.id);
  const operationIds = (await repository.listOperationsByCellule('cellule-alpha')).map((operation) => operation.id);

  assert.deepEqual(celluleIds, ['cellule-alpha', 'cellule-zeta']);
  assert.deepEqual(operationIds, ['op-1', 'op-2']);
  assert.deepEqual(repository.snapshot(), {
    cellules: [
      {
        id: 'cellule-alpha',
        factionId: 'faction-delta',
        codename: 'Alpha',
        locationId: 'port-nord',
        memberIds: ['agent-a'],
        assetIds: [],
        operationIds: [],
        secrecy: 50,
        loyalty: 50,
        exposure: 0,
        status: 'active',
        sleeper: false,
      },
      {
        id: 'cellule-zeta',
        factionId: 'faction-delta',
        codename: 'Zeta',
        locationId: 'front-est',
        memberIds: ['agent-z'],
        assetIds: [],
        operationIds: [],
        secrecy: 50,
        loyalty: 50,
        exposure: 0,
        status: 'active',
        sleeper: false,
      },
    ],
    operations: [
      {
        id: 'op-1',
        celluleId: 'cellule-alpha',
        targetFactionId: 'faction-rivale',
        type: 'rumor',
        objective: 'Semer le doute',
        theaterId: 'port-nord',
        assignedAgentIds: [],
        requiredAssetIds: [],
        difficulty: 50,
        detectionRisk: 25,
        progress: 0,
        phase: 'planning',
        heat: 0,
      },
      {
        id: 'op-2',
        celluleId: 'cellule-alpha',
        targetFactionId: 'faction-rivale',
        type: 'intelligence',
        objective: 'Observer le port',
        theaterId: 'port-nord',
        assignedAgentIds: [],
        requiredAssetIds: [],
        difficulty: 50,
        detectionRisk: 25,
        progress: 0,
        phase: 'planning',
        heat: 0,
      },
    ],
  });
});

test('InMemoryIntrigueRepository rejects invalid constructor and save payloads', async () => {
  assert.throws(() => new InMemoryIntrigueRepository({ cellules: null }), /cellules must be an array/);
  assert.throws(() => new InMemoryIntrigueRepository({ operations: null }), /operations must be an array/);
  assert.throws(() => new InMemoryIntrigueRepository({ cellules: [null] }), /cellule must be an object/);
  assert.throws(() => new InMemoryIntrigueRepository({ operations: [null] }), /operation must be an object/);

  const repository = new InMemoryIntrigueRepository();

  await assert.rejects(
    () => repository.saveCellule({ factionId: 'faction-delta', codename: 'Brume', locationId: 'port-nord' }),
    /Cellule id is required/,
  );

  await assert.rejects(
    () =>
      repository.saveOperation({
        id: 'op-cendre',
        celluleId: 'cellule-brume',
        targetFactionId: 'faction-rivale',
        type: 'sabotage',
        objective: 'Couper le ravitaillement',
      }),
    /OperationClandestine theaterId is required/,
  );
});
