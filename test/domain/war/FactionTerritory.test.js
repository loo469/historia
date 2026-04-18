import test from 'node:test';
import assert from 'node:assert/strict';

import { FactionTerritory } from '../../../src/domain/war/FactionTerritory.js';

test('FactionTerritory builds a normalized territory snapshot', () => {
  const territory = new FactionTerritory({
    factionId: ' faction-a ',
    provinceIds: ['prov-03', ' prov-01 ', 'prov-02', 'prov-02'],
    occupiedProvinceIds: ['prov-03'],
    contestedProvinceIds: ['prov-02'],
    frontlineProvinceIds: ['prov-02', 'prov-03'],
    capitalProvinceId: 'prov-01',
    totalStrategicValue: 9,
  });

  assert.deepEqual(territory.toJSON(), {
    factionId: 'faction-a',
    provinceIds: ['prov-01', 'prov-02', 'prov-03'],
    occupiedProvinceIds: ['prov-03'],
    contestedProvinceIds: ['prov-02'],
    frontlineProvinceIds: ['prov-02', 'prov-03'],
    capitalProvinceId: 'prov-01',
    provinceCount: 3,
    occupiedProvinceCount: 1,
    contestedProvinceCount: 1,
    frontlineProvinceCount: 2,
    totalStrategicValue: 9,
    controlRatio: 2 / 3,
    updatedAt: null,
  });

  assert.equal(territory.hasProvince('prov-02'), true);
  assert.equal(territory.hasProvince('prov-99'), false);
});

test('FactionTerritory updates snapshots immutably and derives default strategic value', () => {
  const territory = new FactionTerritory({
    factionId: 'faction-a',
    provinceIds: ['prov-01', 'prov-02'],
    capitalProvinceId: 'prov-01',
  });
  const updatedAt = new Date('2026-04-18T12:15:00.000Z');

  const updatedTerritory = territory.withProvinceSnapshot({
    provinceIds: ['prov-01', 'prov-02', 'prov-03'],
    contestedProvinceIds: ['prov-03'],
    frontlineProvinceIds: ['prov-02', 'prov-03'],
    updatedAt,
  });

  assert.notEqual(updatedTerritory, territory);
  assert.equal(updatedTerritory.provinceCount, 3);
  assert.equal(updatedTerritory.totalStrategicValue, 3);
  assert.equal(updatedTerritory.contestedProvinceCount, 1);
  assert.equal(updatedTerritory.frontlineProvinceCount, 2);
  assert.equal(updatedTerritory.updatedAt?.toISOString(), updatedAt.toISOString());

  assert.equal(territory.provinceCount, 2);
  assert.equal(territory.updatedAt, null);
});

test('FactionTerritory rejects invalid subsets and invalid aggregate values', () => {
  assert.throws(
    () =>
      new FactionTerritory({
        factionId: 'faction-a',
        provinceIds: ['prov-01'],
        occupiedProvinceIds: ['prov-02'],
      }),
    /FactionTerritory occupiedProvinceIds must be a subset of provinceIds/,
  );

  assert.throws(
    () =>
      new FactionTerritory({
        factionId: 'faction-a',
        provinceIds: ['prov-01'],
        capitalProvinceId: 'prov-02',
      }),
    /FactionTerritory capitalProvinceId must belong to provinceIds/,
  );

  assert.throws(
    () =>
      new FactionTerritory({
        factionId: 'faction-a',
        provinceIds: ['prov-01'],
        totalStrategicValue: -1,
      }),
    /FactionTerritory totalStrategicValue must be a non-negative integer/,
  );
});
