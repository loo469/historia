import test from 'node:test';
import assert from 'node:assert/strict';

import { Province } from '../../../src/domain/war/Province.js';
import { renderProvince } from '../../../src/ui/war/ProvinceRenderer.js';

function createProvince(overrides = {}) {
  return new Province({
    id: 'prov-a',
    name: 'Marches du Nord',
    ownerFactionId: 'faction-a',
    controllingFactionId: 'faction-a',
    supplyLevel: 'stable',
    loyalty: 68,
    strategicValue: 4,
    neighborIds: ['prov-c', 'prov-b'],
    contested: false,
    ...overrides,
  });
}

test('ProvinceRenderer builds deterministic UI data for a stable province', () => {
  const rendered = renderProvince(
    createProvince(),
    {
      paletteByFaction: {
        'faction-a': { fill: '#2563EB', border: '#1E3A8A' },
      },
    },
  );

  assert.deepEqual(rendered, {
    provinceId: 'prov-a',
    label: 'Marches du Nord',
    ownerFactionId: 'faction-a',
    controllingFactionId: 'faction-a',
    occupied: false,
    contested: false,
    supplyLevel: 'stable',
    supplyTone: 'ready',
    loyalty: 68,
    strategicValue: 4,
    neighborIds: ['prov-b', 'prov-c'],
    style: {
      fill: '#2563EB',
      border: '#1E3A8A',
      borderStyle: 'solid',
      pattern: 'solid',
      accent: 'stable-frame',
    },
    badges: ['supply:stable', 'value:4'],
  });
});

test('ProvinceRenderer highlights contested occupation states and supports supply tone overrides', () => {
  const rendered = renderProvince(
    createProvince({
      controllingFactionId: 'faction-b',
      contested: true,
      supplyLevel: 'disrupted',
      loyalty: 31,
    }),
    {
      paletteByFaction: {
        'faction-a': { fill: '#2563EB', border: '#1E3A8A' },
        'faction-b': { fill: '#DC2626', border: '#7F1D1D' },
      },
      supplyToneByLevel: {
        disrupted: 'breaking',
      },
    },
  );

  assert.deepEqual(rendered.style, {
    fill: '#DC2626',
    border: '#1E3A8A',
    borderStyle: 'dashed',
    pattern: 'occupation-stripes',
    accent: 'contested-glow',
  });
  assert.deepEqual(rendered.badges, ['contested', 'occupied', 'supply:disrupted', 'value:4']);
  assert.equal(rendered.supplyTone, 'breaking');
});

test('ProvinceRenderer rejects invalid inputs', () => {
  assert.throws(() => renderProvince({}, {}), /ProvinceRenderer province must be a Province instance/);
  assert.throws(() => renderProvince(createProvince(), null), /ProvinceRenderer options must be an object/);
  assert.throws(() => renderProvince(createProvince(), { paletteByFaction: [] }), /paletteByFaction must be an object/);
  assert.throws(() => renderProvince(createProvince(), { supplyToneByLevel: [] }), /supplyToneByLevel must be an object/);
});
