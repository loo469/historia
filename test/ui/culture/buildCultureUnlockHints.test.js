import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCultureUnlockHints } from '../../../src/ui/culture/buildCultureUnlockHints.js';

test('buildCultureUnlockHints ranks probable, possible, and missing unlock signals', () => {
  const hints = buildCultureUnlockHints({
    province: { provinceId: 'river-gate' },
    action: { title: 'Préparer la manœuvre' },
    selectedMarker: {
      overlayId: 'river-gate:culture-aurora',
      regionId: 'river-gate',
      cultureName: 'Compact d’Aurora',
      activeResearchCount: 1,
      unlockedResearchIds: ['tidal-ledgers'],
      discoveries: ['archive-routes'],
    },
    selectedCluster: {
      clusterId: 'river-gate:culture-cluster',
      summary: 'Compact d’Aurora, Ligues des Forges',
      regionIds: ['river-gate'],
      pins: [
        {
          pinId: 'river-gate:culture-aurora:event:archives-open',
          kind: 'event',
          name: 'Ouverture des archives',
          cultureName: 'Compact d’Aurora',
          importance: 4,
        },
        {
          pinId: 'river-gate:culture-aurora:discovery:archive-routes',
          kind: 'discovery',
          name: 'archive-routes',
          cultureName: 'Compact d’Aurora',
        },
      ],
    },
    localTimeline: {
      items: [
        {
          timelineId: 'river-gate:event:archives-open',
          kind: 'event',
          signal: 'opportunity',
          title: 'Ouverture des archives',
          regionId: 'river-gate',
          cultureName: 'Compact d’Aurora',
        },
        {
          timelineId: 'river-gate:discovery:archive-routes',
          kind: 'discovery',
          signal: 'research',
          title: 'archive-routes',
          regionId: 'river-gate',
          cultureName: 'Compact d’Aurora',
        },
      ],
    },
  });

  assert.deepEqual(hints.map((hint) => [hint.status, hint.label, hint.tone]), [
    ['probable', 'Débloque repère', 'opportunity'],
    ['probable', 'Événement cluster', 'event'],
    ['probable', 'Recherche culture', 'research'],
  ]);
  assert.equal(hints[0].explanation, 'Ouverture des archives peut suivre “Préparer la manœuvre”.');
  assert.deepEqual(hints.map((hint) => hint.focusTarget.type), ['timeline', 'cluster', 'marker']);
  assert.deepEqual(hints[0].focusTarget, {
    type: 'timeline',
    id: 'river-gate:event:archives-open',
    regionId: 'river-gate',
    label: 'Ouverture des archives',
  });
});

test('buildCultureUnlockHints returns readable missing-condition fallbacks', () => {
  assert.deepEqual(buildCultureUnlockHints({
    province: { provinceId: 'quiet-field' },
    action: { title: 'Garder en observation' },
  }), [
    {
      hintId: 'missing:quiet-field:Aucun signal:Aucun unlock culture:Garder en observation',
      status: 'missing',
      tone: 'neutral',
      label: 'Aucun unlock culture',
      explanation: 'Ajoutez découverte, repère ou cluster actif avant d’attendre un gain culturel.',
      regionId: 'quiet-field',
      cultureName: 'Aucun signal',
      sourceId: 'Garder en observation',
      focusTarget: {
        type: 'province',
        id: 'quiet-field',
        regionId: 'quiet-field',
        label: 'Province sans unlock',
      },
    },
  ]);

  assert.deepEqual(buildCultureUnlockHints({
    province: { provinceId: 'shared-bay' },
    action: { title: 'Stabiliser l’occupation' },
    selectedCluster: {
      clusterId: 'shared-bay:culture-cluster',
      summary: 'Delta Scribes, Harbor Compact',
      regionIds: ['shared-bay'],
      pins: [],
    },
  })[0], {
    hintId: 'missing:shared-bay:Delta Scribes, Harbor Compact:Condition manquante:shared-bay:culture-cluster',
    status: 'missing',
    tone: 'identity',
    label: 'Condition manquante',
    explanation: 'Cluster visible, mais aucun pin découverte/événement ne justifie encore un unlock.',
    regionId: 'shared-bay',
    cultureName: 'Delta Scribes, Harbor Compact',
    sourceId: 'shared-bay:culture-cluster',
    focusTarget: {
      type: 'cluster',
      id: 'shared-bay:culture-cluster',
      regionId: 'shared-bay',
      label: 'Delta Scribes, Harbor Compact',
    },
  });
});
