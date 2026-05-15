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
      narrativePriority: {
        state: 'opportunity',
        microAction: 'explorer',
        consequencePreview: {
          confidence: 'high',
          summary: 'explorer: archives ouvertes; tradeoff: retarde apaisement.',
        },
      },
    },
    previousMarker: {
      overlayId: 'river-gate:culture-aurora',
      regionId: 'river-gate',
      cultureName: 'Compact d’Aurora',
      influenceTier: 'emerging',
      influenceScore: 70,
      discoveries: ['archive-routes'],
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
  assert.equal(report.summary, 'Tour 4: 4 deltas culture/découverte à vérifier, 1 diff d’influence.');
  assert.deepEqual(report.deltas.map((delta) => [delta.tone, delta.label, delta.value]), [
    ['risk', 'Tension culturelle', 'Tension mémorielle'],
    ['opportunity', 'Événement déclenché', 'Ouverture des archives'],
    ['opportunity', 'Influence culturelle', 'Compact d’Aurora · 82'],
    ['research', 'Recherche culturelle', '1 active'],
  ]);
  assert.deepEqual(report.timelineRecap, [
    {
      recapId: 'river-gate:recap:river-gate:event:event-archive-opening',
      order: 'turn-order-1',
      kind: 'event',
      title: 'Ouverture des archives',
      changeState: 'investigate',
      summary: 'explorer: archives ouvertes; tradeoff: retarde apaisement.',
      linkedPriority: {
        state: 'opportunity',
        microAction: 'explorer',
        confidence: 'high',
      },
    },
  ]);
  assert.deepEqual(report.influenceDiffs, [
    {
      diffId: 'river-gate:influence-diff:river-gate:culture-aurora',
      regionId: 'river-gate',
      cultureName: 'Compact d’Aurora',
      previousScore: 70,
      currentScore: 82,
      changeState: 'strengthened',
      label: 'influence renforcée',
      reason: 'explorer: archives ouvertes; tradeoff: retarde apaisement.',
      linkedPriority: {
        state: 'opportunity',
        microAction: 'explorer',
        confidence: 'high',
      },
    },
  ]);
});

test('buildCultureTurnReportDeltas returns compact quiet state without culture signals', () => {
  assert.deepEqual(buildCultureTurnReportDeltas({ turn: 2, selectedRegionId: 'quiet-field' }), {
    state: 'quiet',
    turn: 2,
    regionId: 'quiet-field',
    summary: 'Aucun delta culture/découverte visible ce tour.',
    deltas: [],
    timelineRecap: [],
    influenceDiffs: [],
  });
});

test('buildCultureTurnReportDeltas classifies new, weakened, masked, and investigate influence diffs', () => {
  const baseMarker = {
    overlayId: 'mist-hills:culture-mist',
    regionId: 'mist-hills',
    cultureName: 'Mist Circle',
    influenceTier: 'faint',
    influenceScore: 42,
    discoveries: ['fog-index'],
    activeResearchCount: 0,
    unlockedResearchIds: [],
    narrativePriority: {
      state: 'watch',
      microAction: 'attendre',
      consequencePreview: {
        confidence: 'low',
        summary: 'attendre: intel culturel incomplet.',
      },
    },
  };

  assert.equal(buildCultureTurnReportDeltas({ selectedRegionId: 'mist-hills', selectedMarker: baseMarker }).influenceDiffs[0].changeState, 'new');
  assert.equal(buildCultureTurnReportDeltas({
    selectedRegionId: 'mist-hills',
    selectedMarker: { ...baseMarker, influenceScore: 30, discoveries: ['fog-index'] },
    previousMarker: { ...baseMarker, influenceScore: 48, discoveries: ['fog-index'] },
  }).influenceDiffs[0].changeState, 'weakened');
  assert.equal(buildCultureTurnReportDeltas({
    selectedRegionId: 'mist-hills',
    selectedMarker: { ...baseMarker, masked: true },
    previousMarker: { ...baseMarker, influenceScore: 42, discoveries: ['fog-index'] },
  }).influenceDiffs[0].changeState, 'masked');
  assert.equal(buildCultureTurnReportDeltas({
    selectedRegionId: 'mist-hills',
    selectedMarker: baseMarker,
    previousMarker: { ...baseMarker, influenceScore: 42, discoveries: ['fog-index'] },
  }).influenceDiffs[0].changeState, 'investigate');
});
