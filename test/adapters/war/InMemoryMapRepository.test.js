import test from 'node:test';
import assert from 'node:assert/strict';

import { InMemoryMapRepository } from '../../../src/adapters/war/InMemoryMapRepository.js';
import { MapRepository } from '../../../src/application/war/MapRepository.js';
import { Province } from '../../../src/domain/war/Province.js';

function createProvince(overrides = {}) {
  return new Province({
    id: 'prov-1',
    name: 'Province',
    ownerFactionId: 'faction-a',
    controllingFactionId: 'faction-a',
    supplyLevel: 'stable',
    loyalty: 60,
    strategicValue: 3,
    neighborIds: ['prov-2'],
    ...overrides,
  });
}

test('InMemoryMapRepository extends MapRepository and hydrates plain objects into Province instances', async () => {
  const repository = new InMemoryMapRepository([
    {
      id: ' prov-2 ',
      name: ' River March ',
      ownerFactionId: ' faction-b ',
      supplyLevel: 'strained',
      loyalty: 45,
      strategicValue: 6,
      neighborIds: ['prov-1'],
    },
  ]);

  const province = await repository.requireProvinceById('prov-2');

  assert.equal(repository instanceof MapRepository, true);
  assert.equal(province instanceof Province, true);
  assert.deepEqual(province.toJSON(), {
    id: 'prov-2',
    name: 'River March',
    ownerFactionId: 'faction-b',
    controllingFactionId: 'faction-b',
    supplyLevel: 'strained',
    loyalty: 45,
    strategicValue: 6,
    neighborIds: ['prov-1'],
    contested: false,
    capturedAt: null,
  });
});

test('InMemoryMapRepository lists provinces in stable order and persists saved updates', async () => {
  const provinceA = createProvince({ id: 'prov-a', name: 'A Province' });
  const provinceB = createProvince({ id: 'prov-b', name: 'B Province' });
  const repository = new InMemoryMapRepository([provinceB]);

  await repository.saveProvince(provinceA.withSupplyLevel('secure'));

  const provinceIds = (await repository.listProvinces()).map((province) => province.id);
  assert.deepEqual(provinceIds, ['prov-a', 'prov-b']);
  assert.deepEqual(repository.snapshot(), [
    {
      id: 'prov-a',
      name: 'A Province',
      ownerFactionId: 'faction-a',
      controllingFactionId: 'faction-a',
      supplyLevel: 'secure',
      loyalty: 60,
      strategicValue: 3,
      neighborIds: ['prov-2'],
      contested: false,
      capturedAt: null,
    },
    {
      id: 'prov-b',
      name: 'B Province',
      ownerFactionId: 'faction-a',
      controllingFactionId: 'faction-a',
      supplyLevel: 'stable',
      loyalty: 60,
      strategicValue: 3,
      neighborIds: ['prov-2'],
      contested: false,
      capturedAt: null,
    },
  ]);
});

test('InMemoryMapRepository rejects invalid seed payloads', () => {
  assert.throws(() => new InMemoryMapRepository(null), /provinces must be an array/);
  assert.throws(() => new InMemoryMapRepository([null]), /province record must be a Province or plain object/);
});
