import test from 'node:test';
import assert from 'node:assert/strict';

import { Province } from '../../../src/domain/war/Province.js';
import { buildStrategicMapShell } from '../../../src/ui/war/StrategicMapShell.js';

function createProvince(overrides = {}) {
  return new Province({
    id: 'prov-b',
    name: 'Bastion',
    ownerFactionId: 'faction-a',
    controllingFactionId: 'faction-a',
    supplyLevel: 'stable',
    loyalty: 70,
    strategicValue: 4,
    neighborIds: ['prov-a'],
    contested: false,
    ...overrides,
  });
}

test('StrategicMapShell sorts provinces and derives headline stats', () => {
  const shell = buildStrategicMapShell(
    [
      createProvince({
        id: 'prov-c',
        name: 'Colline rouge',
        controllingFactionId: 'faction-b',
        contested: true,
        supplyLevel: 'strained',
        loyalty: 40,
      }),
      createProvince({ id: 'prov-a', name: 'Avant-poste', loyalty: 82, strategicValue: 2 }),
    ],
    {
      title: 'Théâtre nord',
      paletteByFaction: {
        'faction-a': { fill: '#2563EB', border: '#1E3A8A' },
        'faction-b': { fill: '#DC2626', border: '#7F1D1D' },
      },
    },
  );

  assert.equal(shell.title, 'Théâtre nord');
  assert.equal(shell.subtitle, 'Vue d’ensemble des provinces et lignes de front');
  assert.deepEqual(shell.provinces.map((province) => province.provinceId), ['prov-a', 'prov-c']);
  assert.deepEqual(shell.stats, {
    provinceCount: 2,
    contestedCount: 1,
    occupiedCount: 1,
    averageLoyalty: 61,
  });
  assert.deepEqual(shell.legend, {
    factions: ['faction-a', 'faction-b'],
    states: [
      { code: 'stable', label: 'Contrôle stable' },
      { code: 'occupied', label: 'Occupation' },
      { code: 'contested', label: 'Front contesté' },
    ],
  });
});

test('StrategicMapShell falls back to default title and validates inputs', () => {
  const shell = buildStrategicMapShell([], {});

  assert.equal(shell.title, 'Carte stratégique');
  assert.equal(shell.stats.provinceCount, 0);
  assert.throws(() => buildStrategicMapShell(null), /StrategicMapShell provinces must be an array/);
  assert.throws(() => buildStrategicMapShell([{}]), /StrategicMapShell provinces must contain Province instances/);
  assert.throws(() => buildStrategicMapShell([], null), /StrategicMapShell options must be an object/);
});
