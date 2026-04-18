import test from 'node:test';
import assert from 'node:assert/strict';

import { FactionStateRepository } from '../../../src/application/war/FactionStateRepository.js';

class InMemoryFactionStateRepository extends FactionStateRepository {
  constructor(states = []) {
    super();
    this.states = new Map(states.map((state) => [state.factionId, state]));
  }

  async getFactionStateById(factionId) {
    return this.states.get(factionId) ?? null;
  }

  async listFactionStates() {
    return [...this.states.values()];
  }

  async saveFactionState(state) {
    this.states.set(state.factionId, state);
    return state;
  }
}

test('FactionStateRepository provides shared helpers for faction state lookup and batch saving', async () => {
  const stateA = { factionId: 'faction-a', occupiedProvinceIds: ['prov-1'] };
  const stateB = { factionId: 'faction-b', occupiedProvinceIds: [] };
  const repository = new InMemoryFactionStateRepository([stateA]);

  const foundState = await repository.requireFactionStateById(' faction-a ');
  const savedStates = await repository.saveAll([stateA, stateB]);

  assert.equal(foundState, stateA);
  assert.deepEqual(savedStates, [stateA, stateB]);
  assert.deepEqual(await repository.listFactionStates(), [stateA, stateB]);
});

test('FactionStateRepository base methods fail fast until an adapter implements them', async () => {
  const repository = new FactionStateRepository();
  const state = { factionId: 'faction-a' };

  await assert.rejects(
    () => repository.getFactionStateById('faction-a'),
    /must be implemented by an adapter/,
  );
  await assert.rejects(() => repository.listFactionStates(), /must be implemented by an adapter/);
  await assert.rejects(
    () => repository.saveFactionState(state),
    /must be implemented by an adapter/,
  );
});

test('FactionStateRepository rejects missing states and invalid saveAll payloads', async () => {
  const repository = new InMemoryFactionStateRepository();

  await assert.rejects(() => repository.requireFactionStateById(''), /factionId is required/);
  await assert.rejects(
    () => repository.requireFactionStateById('faction-missing'),
    /could not find faction state faction-missing/,
  );
  await assert.rejects(() => repository.saveAll(null), /states must be an array/);
  await assert.rejects(() => repository.saveAll([null]), /state must be an object/);
  await assert.rejects(() => repository.saveAll([{ factionId: '   ' }]), /factionId is required/);
});
