import test from 'node:test';
import assert from 'node:assert/strict';

import { MapRepository } from '../../../src/application/war/MapRepository.js';
import { Province } from '../../../src/domain/war/Province.js';

function createProvince(overrides) {
  return new Province({
    id: 'prov-1',
    name: 'Province',
    ownerFactionId: 'faction-a',
    controllingFactionId: 'faction-a',
    supplyLevel: 'stable',
    neighborIds: [],
    ...overrides,
  });
}

class InMemoryMapRepository extends MapRepository {
  constructor(provinces = []) {
    super();
    this.provinces = new Map(provinces.map((province) => [province.id, province]));
  }

  async getProvinceById(provinceId) {
    return this.provinces.get(provinceId) ?? null;
  }

  async listProvinces() {
    return [...this.provinces.values()];
  }

  async saveProvince(province) {
    this.provinces.set(province.id, province);
    return province;
  }
}

test('MapRepository provides shared helpers for province lookup and batch saving', async () => {
  const provinceA = createProvince({ id: 'prov-a' });
  const provinceB = createProvince({ id: 'prov-b' });
  const repository = new InMemoryMapRepository([provinceA]);

  const foundProvince = await repository.requireProvinceById(' prov-a ');
  const savedProvinces = await repository.saveAll([provinceA, provinceB]);

  assert.equal(foundProvince, provinceA);
  assert.deepEqual(savedProvinces, [provinceA, provinceB]);
  assert.deepEqual(await repository.listProvinces(), [provinceA, provinceB]);
});

test('MapRepository base methods fail fast until an adapter implements them', async () => {
  const repository = new MapRepository();
  const province = createProvince();

  await assert.rejects(() => repository.getProvinceById('prov-1'), /must be implemented by an adapter/);
  await assert.rejects(() => repository.listProvinces(), /must be implemented by an adapter/);
  await assert.rejects(() => repository.saveProvince(province), /must be implemented by an adapter/);
});

test('MapRepository rejects missing provinces and invalid saveAll payloads', async () => {
  const repository = new InMemoryMapRepository();

  await assert.rejects(() => repository.requireProvinceById(''), /provinceId is required/);
  await assert.rejects(() => repository.requireProvinceById('prov-missing'), /could not find province prov-missing/);
  await assert.rejects(() => repository.saveAll(null), /provinces must be an array/);
  await assert.rejects(() => repository.saveAll([{}]), /province must be a Province instance/);
});
