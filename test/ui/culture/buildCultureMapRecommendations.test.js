import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCultureMapRecommendations } from '../../../src/ui/culture/buildCultureMapRecommendations.js';

test('buildCultureMapRecommendations prioritizes cluster event and discovery pins', () => {
  const recommendations = buildCultureMapRecommendations({
    selectedRegionId: 'shared-bay',
    selectedCluster: {
      clusterId: 'shared-bay:culture-cluster',
      label: '2 cultures · 2 découvertes',
      summary: 'Delta Scribes, Harbor Compact',
      pins: [
        {
          pinId: 'shared-bay:culture-harbor:discovery:tidal-ledgers',
          kind: 'discovery',
          name: 'tidal-ledgers',
          type: 'Découverte',
          cultureId: 'culture-harbor',
          cultureName: 'Harbor Compact',
          importance: null,
        },
        {
          pinId: 'shared-bay:culture-harbor:event:event-harbor-forum',
          kind: 'event',
          name: 'Harbor Forum',
          type: 'knowledge',
          cultureId: 'culture-harbor',
          cultureName: 'Harbor Compact',
          importance: 4,
        },
      ],
    },
  });

  assert.equal(recommendations.state, 'linked');
  assert.equal(recommendations.summary, '2 cultures · 2 découvertes · 2 pistes liées');
  assert.deepEqual(recommendations.recommendations.map((entry) => entry.title), [
    'Suivre le repère culturel',
    'Exploiter la découverte locale',
  ]);
  assert.equal(recommendations.recommendations[0].sourcePinId, 'shared-bay:culture-harbor:event:event-harbor-forum');
  assert.equal(recommendations.recommendations[0].detail, 'knowledge · Harbor Compact · IMP-4');
});

test('buildCultureMapRecommendations falls back gracefully for empty clusters and quiet markers', () => {
  assert.deepEqual(
    buildCultureMapRecommendations({
      selectedRegionId: 'silent-fen',
      selectedCluster: {
        clusterId: 'silent-fen:culture-cluster',
        label: '2 cultures · 0 découvertes',
        summary: 'Quiet Houses',
        pins: [],
      },
    }).recommendations[0],
    {
      recommendationId: 'silent-fen:silent-fen:culture-cluster:empty',
      tone: 'neutral',
      title: 'Observer le voisinage culturel',
      hook: 'Cluster visible, mais aucun événement ou découverte exploitable pour l’instant.',
      detail: 'Quiet Houses',
      sourcePinId: null,
    },
  );

  const markerRecommendations = buildCultureMapRecommendations({
    selectedRegionId: 'north-watch',
    selectedMarker: {
      overlayId: 'north-watch:culture-aurora',
      cultureName: 'Compact d’Aurora',
      influenceTier: 'strong',
      eventCount: 1,
      discoveries: ['tidal-ledgers'],
      influenceScore: 79,
    },
  });

  assert.equal(markerRecommendations.state, 'marker');
  assert.equal(markerRecommendations.recommendations[0].title, 'Lire le repère historique');
});
