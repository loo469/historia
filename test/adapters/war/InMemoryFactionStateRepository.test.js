import test from 'node:test';
import assert from 'node:assert/strict';

import { InMemoryFactionStateRepository } from '../../../src/adapters/war/InMemoryFactionStateRepository.js';
import { FactionStateRepository } from '../../../src/application/war/FactionStateRepository.js';

test('InMemoryFactionStateRepository extends the port and normalizes seeded states', async () => {
  const repository = new InMemoryFactionStateRepository([
    {
      factionId: ' faction-b ',
      occupiedProvinceIds: ['prov-2', ' prov-1 ', 'prov-2'],
      frontPressure: 12,
    },
  ]);

  const state = await repository.requireFactionStateById('faction-b');

  assert.equal(repository instanceof FactionStateRepository, true);
  assert.deepEqual(state, {
    factionId: 'faction-b',
    occupiedProvinceIds: ['prov-1', 'prov-2'],
    frontPressure: 12,
  });
});

test('InMemoryFactionStateRepository lists states in stable order and persists updates', async () => {
  const repository = new InMemoryFactionStateRepository([
    { factionId: 'faction-c', occupiedProvinceIds: ['prov-4'] },
  ]);

  await repository.saveFactionState({
    factionId: 'faction-a',
    occupiedProvinceIds: ['prov-3', 'prov-1'],
    supplyLevel: 'stable',
  });

  const stateIds = (await repository.listFactionStates()).map((state) => state.factionId);
  assert.deepEqual(stateIds, ['faction-a', 'faction-c']);
  assert.deepEqual(repository.snapshot(), [
    {
      factionId: 'faction-a',
      occupiedProvinceIds: ['prov-1', 'prov-3'],
      supplyLevel: 'stable',
    },
    {
      factionId: 'faction-c',
      occupiedProvinceIds: ['prov-4'],
    },
  ]);
});

test('InMemoryFactionStateRepository rejects invalid payloads', async () => {
  assert.throws(() => new InMemoryFactionStateRepository(null), /states must be an array/);
  assert.throws(() => new InMemoryFactionStateRepository([null]), /state must be a plain object/);

  const repository = new InMemoryFactionStateRepository();

  await assert.rejects(
    () => repository.saveFactionState({ factionId: 'faction-a', occupiedProvinceIds: ['prov-1', '   '] }),
    /occupiedProvinceIds cannot contain empty values/,
  );
});
