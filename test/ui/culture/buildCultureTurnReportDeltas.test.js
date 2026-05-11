import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCultureTurnReportDeltas } from '../../../src/ui/culture/buildCultureTurnReportDeltas.js';

test('buildCultureTurnReportDeltas summarizes selected culture event, research, and consequence deltas', () => {
  const report = buildCultureTurnReportDeltas({
    turn: 4,
    selectedRegionId: 'river-gate',
    selectedMarker: {
      overlayId: 'river-gate:culture-aurora',
      regionId: 'river-gate',
      cultureName: 'Compact d’Aurora',
      influenceTier: 'strong',
      influenceScore: 82,
      discoveries: ['archive-routes', 'tidal-ledgers'],
      activeResearchCount: 1,
      unlockedResearchIds: ['tidal-ledgers'],
    },
    localTimeline: {
      items: [
        {
          timelineId: 'river-gate:event:event-archive-opening',
          kind: 'event',
          signal: 'opportunity',
          title: 'Ouverture des archives',
          summary: 'Opportunité culturelle à exploiter maintenant.',
          regionId: 'river-gate',
          cultureName: 'Compact d’Aurora',
        },
      ],
    },
    consequenceChips: [
      {
        chipId: 'risk:river-gate:Compact d’Aurora:Tension mémorielle:event-risk',
        tone: 'risk',
        label: 'Tension mémorielle',
        explanation: 'Un souvenir conflictuel colore le choix.',
        regionId: 'river-gate',
        cultureName: 'Compact d’Aurora',
      },
    ],
  });

  assert.equal(report.state, 'active');
  assert.equal(report.summary, 'Tour 4: 4 deltas culture/découverte à vérifier.');
  assert.deepEqual(report.deltas.map((delta) => [delta.tone, delta.label, delta.value]), [
    ['risk', 'Tension culturelle', 'Tension mémorielle'],
    ['opportunity', 'Événement déclenché', 'Ouverture des archives'],
    ['opportunity', 'Influence culturelle', 'Compact d’Aurora · 82'],
    ['research', 'Recherche culturelle', '1 active'],
  ]);
});

test('buildCultureTurnReportDeltas returns compact quiet state without culture signals', () => {
  assert.deepEqual(buildCultureTurnReportDeltas({ turn: 2, selectedRegionId: 'quiet-field' }), {
    state: 'quiet',
    turn: 2,
    regionId: 'quiet-field',
    summary: 'Aucun delta culture/découverte visible ce tour.',
    deltas: [],
  });
});
