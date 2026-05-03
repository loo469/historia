import test from 'node:test';
import assert from 'node:assert/strict';

import { buildLauncherMapSelection } from '../../../src/ui/launcher/buildLauncherMapSelection.js';

test('buildLauncherMapSelection selects the requested playable map', () => {
  const selection = buildLauncherMapSelection([
    {
      id: 'continental-prototype',
      title: 'Pax Historia prototype',
      subtitle: 'Théâtre continental',
      stats: { provinces: 6, routes: 3 },
      recommended: true,
    },
    {
      id: 'river-crisis',
      title: 'Crise de la Porte du Fleuve',
      playable: true,
      stats: { provinces: '6', disabled: Number.NaN },
    },
  ], 'river-crisis');

  assert.equal(selection.canLaunch, true);
  assert.equal(selection.selectedMap.id, 'river-crisis');
  assert.equal(selection.headline, 'Carte sélectionnée: Crise de la Porte du Fleuve');
  assert.deepEqual(selection.maps.map((map) => [map.id, map.selected]), [
    ['continental-prototype', false],
    ['river-crisis', true],
  ]);
  assert.deepEqual(selection.selectedMap.stats, { provinces: 6 });
});

test('buildLauncherMapSelection falls back to the recommended playable map', () => {
  const selection = buildLauncherMapSelection([
    { id: 'future-map', title: 'Carte future', playable: false },
    { id: 'prototype', title: 'Prototype', recommended: true },
  ], 'future-map');

  assert.equal(selection.selectedMap.id, 'prototype');
  assert.equal(selection.maps[0].selected, false);
  assert.equal(selection.maps[1].selected, true);
});

test('buildLauncherMapSelection reports no launch when no playable map exists', () => {
  const selection = buildLauncherMapSelection([
    { id: 'locked', title: 'Verrouillée', playable: false },
  ], 'locked');

  assert.equal(selection.canLaunch, false);
  assert.equal(selection.selectedMap, null);
  assert.equal(selection.headline, 'Aucune carte jouable disponible');
});

test('buildLauncherMapSelection validates inputs', () => {
  assert.throws(() => buildLauncherMapSelection(null), /must be an array/);
  assert.throws(() => buildLauncherMapSelection([null]), /must contain objects/);
  assert.throws(() => buildLauncherMapSelection([{ stats: [] }]), /stats must be an object/);
});
