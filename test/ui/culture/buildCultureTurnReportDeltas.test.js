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
          opportunity: 'Saisir les archives peut déclencher une décision culturelle immédiate.',
          visibleMarkerIds: ['river-gate:culture-aurora:event:event-archive-opening'],
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
  assert.deepEqual(report.momentumLayer, {
    layerId: 'river-gate:cultural-momentum',
    regionId: 'river-gate',
    activeFilter: 'all',
    availableFilters: ['all', 'opportunity', 'tension', 'watch'],
    summary: '1 chaîne découverte → influence → décision.',
    items: [
      {
        momentumId: 'river-gate:momentum:strengthened:1',
        regionId: 'river-gate',
        cultureName: 'Compact d’Aurora',
        level: 'surging',
        filterState: 'opportunity',
        discoveryId: 'archive-routes',
        influenceState: 'strengthened',
        chain: 'archive-routes → influence renforcée → explorer',
        suggestedAction: 'explorer',
        opportunity: 'Saisir les archives peut déclencher une décision culturelle immédiate.',
        risk: null,
        confidence: 'high',
        markerIds: ['river-gate:culture-aurora:event:event-archive-opening'],
      },
    ],
  });
  assert.deepEqual(report.stabilizationRecommendations, {
    activeFilter: 'all',
    summary: '1 recommandation de stabilisation culturelle.',
    recommendations: [
      {
        recommendationId: 'river-gate:momentum:strengthened:1:stabilization',
        regionId: 'river-gate',
        cultureName: 'Compact d’Aurora',
        action: 'amplifier',
        tone: 'opportunity',
        level: 'surging',
        discoveryId: 'archive-routes',
        chain: 'archive-routes → influence renforcée → explorer → amplifier',
        reason: 'archive-routes → surging → amplifier',
        expectedEffect: 'opportunité à saisir: Saisir les archives peut déclencher une décision culturelle immédiate.',
        confidence: 'high',
        markerIds: ['river-gate:culture-aurora:event:event-archive-opening'],
        rank: 1,
      },
    ],
  });
  assert.deepEqual(report.recommendationCoherence, {
    state: 'coherent',
    activeFilter: 'all',
    summary: '1 recommandation sur une trajectoire culturelle cohérente.',
    trajectoryGroups: [
      {
        trajectory: 'expansion',
        count: 1,
        actions: ['amplifier'],
        recommendationIds: ['river-gate:momentum:strengthened:1:stabilization'],
        summary: 'expansion: Compact d’Aurora',
      },
    ],
    tensions: [],
    explanation: 'archive-routes → amplifier → expansion',
    uncertainRecommendationIds: [],
  });
  assert.deepEqual(report.commitmentBundles, {
    state: 'compatible',
    summary: '1 bundle d’engagement culturel, 0 incompatibilité.',
    bundles: [
      {
        bundleId: 'culture-commitment:expansion',
        label: 'expansion prudente',
        trajectory: 'expansion',
        state: 'safe',
        safeRecommendationIds: ['river-gate:momentum:strengthened:1:stabilization'],
        uncertainRecommendationIds: [],
        actions: ['amplifier'],
        markerIds: ['river-gate:culture-aurora:event:event-archive-opening'],
        explanation: 'archive-routes → amplifier → expansion prudente',
        timingWindows: [
          {
            timingId: 'culture-commitment:expansion:timing:river-gate',
            bundleId: 'culture-commitment:expansion',
            clusterLabel: 'Compact d’Aurora',
            regionIds: ['river-gate'],
            status: 'immediate',
            label: 'action immédiate',
            timingLabel: 'agir maintenant conserve le momentum',
            choiceState: 'recommended',
            recommendationIds: ['river-gate:momentum:strengthened:1:stabilization'],
            delayEffect: 'retarder baisse la priorité du bundle et peut donner la main aux signaux concurrents',
          },
        ],
      },
    ],
    incompatibilities: [],
    timingWindows: [
      {
        timingId: 'culture-commitment:expansion:timing:river-gate',
        bundleId: 'culture-commitment:expansion',
        clusterLabel: 'Compact d’Aurora',
        regionIds: ['river-gate'],
        status: 'immediate',
        label: 'action immédiate',
        timingLabel: 'agir maintenant conserve le momentum',
        choiceState: 'recommended',
        recommendationIds: ['river-gate:momentum:strengthened:1:stabilization'],
        delayEffect: 'retarder baisse la priorité du bundle et peut donner la main aux signaux concurrents',
      },
    ],
    timingSummary: '1 fenêtre de timing culturel après bundle.',
    followUpPrompts: {
      state: 'ready',
      summary: '1 prompt de suivi culturel après timing.',
      prompts: [
        {
          promptId: 'culture-commitment:expansion:timing:river-gate:follow-up',
          timingId: 'culture-commitment:expansion:timing:river-gate',
          bundleId: 'culture-commitment:expansion',
          clusterLabel: 'Compact d’Aurora',
          state: 'compatible',
          label: 'Ouvrir le récit d’expansion',
          reasonNow: 'fenêtre recommandée: agir maintenant conserve le momentum; engagement actif expansion prudente',
          nextStep: 'enchaîner avec un suivi narratif court et mesurable',
          riskReason: null,
          recommendationIds: ['river-gate:momentum:strengthened:1:stabilization'],
        },
      ],
    },
    promptChoiceComparison: {
      state: 'ready',
      summary: '1 choix de prompt culturel comparé.',
      entries: [
        {
          comparisonId: 'culture-commitment:expansion:timing:river-gate:follow-up:choice-comparison',
          promptId: 'culture-commitment:expansion:timing:river-gate:follow-up',
          role: 'best-safe',
          label: 'meilleur suivi sûr',
          clusterLabel: 'Compact d’Aurora',
          promptLabel: 'Ouvrir le récit d’expansion',
          narrativeImpact: 'Ouvrir le récit d’expansion garde expansion prudente lisible et transforme Compact d’Aurora en suivi narratif immédiat.',
          lostMomentumRisk: 'ne rien choisir dilue le momentum actif et laisse les signaux concurrents reprendre la priorité',
          recommendationIds: ['river-gate:momentum:strengthened:1:stabilization'],
        },
      ],
      noChoiceRisk: 'ne rien choisir dilue le momentum actif et laisse les signaux concurrents reprendre la priorité',
    },
    dependencyExplanation: 'expansion prudente: archive-routes → amplifier → expansion prudente',
  });
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
    momentumLayer: {
      layerId: 'quiet-field:cultural-momentum',
      regionId: 'quiet-field',
      activeFilter: 'all',
      availableFilters: ['all', 'opportunity', 'tension', 'watch'],
      summary: 'Aucun momentum culturel pour ce filtre.',
      items: [],
    },
    stabilizationRecommendations: {
      activeFilter: 'all',
      summary: 'Aucune recommandation culturelle pour ce filtre.',
      recommendations: [],
    },
    recommendationCoherence: {
      state: 'quiet',
      activeFilter: 'all',
      summary: 'Aucune cohérence culturelle à synthétiser.',
      trajectoryGroups: [],
      tensions: [],
      explanation: 'Aucun signal récent → recommandation → cohérence.',
      uncertainRecommendationIds: [],
    },
    commitmentBundles: {
      state: 'quiet',
      summary: 'Aucun bundle d’engagement culturel disponible.',
      bundles: [],
      incompatibilities: [],
      timingWindows: [],
      timingSummary: 'Aucune fenêtre de timing culturel active.',
      followUpPrompts: {
        state: 'quiet',
        summary: 'Aucun prompt de suivi culturel après timing.',
        prompts: [],
      },
      promptChoiceComparison: {
        state: 'quiet',
        summary: 'Aucun arbitrage de prompt culturel disponible.',
        entries: [],
        noChoiceRisk: 'Aucun momentum culturel à arbitrer.',
      },
      dependencyExplanation: 'Aucune dépendance entre marqueurs culturels.',
    },
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

test('buildCultureTurnReportDeltas filters fragile cultural momentum for tension decisions', () => {
  const report = buildCultureTurnReportDeltas({
    selectedRegionId: 'mist-hills',
    momentumFilter: 'tension',
    selectedMarker: {
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
        reason: 'Aucun signal critique: attendre le prochain repère culturel.',
        consequencePreview: {
          confidence: 'low',
          tradeoff: 'risque de laisser passer un signal faible',
          summary: 'attendre: intel culturel incomplet.',
          visibleMarkerIds: ['mist-hills:culture-mist'],
        },
      },
    },
    previousMarker: {
      overlayId: 'mist-hills:culture-mist',
      regionId: 'mist-hills',
      cultureName: 'Mist Circle',
      influenceTier: 'faint',
      influenceScore: 42,
      discoveries: ['fog-index'],
    },
  });

  assert.equal(report.momentumLayer.activeFilter, 'tension');
  assert.deepEqual(report.momentumLayer.items.map((item) => [item.level, item.filterState, item.discoveryId, item.suggestedAction, item.confidence]), [
    ['fragile', 'tension', 'fog-index', 'attendre', 'low'],
  ]);
  assert.match(report.momentumLayer.items[0].risk, /signal faible/);
  assert.deepEqual(report.stabilizationRecommendations.recommendations.map((recommendation) => [
    recommendation.action,
    recommendation.tone,
    recommendation.reason,
    recommendation.expectedEffect,
  ]), [
    ['enquêter', 'tension', 'fog-index → fragile → enquêter', 'tension à calmer: risque de laisser passer un signal faible'],
  ]);
});

test('buildCultureTurnReportDeltas recommends apaiser and attendre for volatile or observing momentum', () => {
  const volatileReport = buildCultureTurnReportDeltas({
    selectedRegionId: 'ember-ford',
    momentumFilter: 'tension',
    selectedMarker: {
      overlayId: 'ember-ford:culture-ember',
      regionId: 'ember-ford',
      cultureName: 'Ember Guild',
      influenceTier: 'strong',
      influenceScore: 44,
      discoveries: ['ash-treaty'],
      activeResearchCount: 0,
      unlockedResearchIds: [],
      narrativePriority: {
        state: 'tension',
        microAction: 'apaiser',
        consequencePreview: {
          confidence: 'medium',
          tradeoff: 'médiation requise avant amplification',
          summary: 'apaiser: tension de mémoire locale.',
        },
      },
    },
    previousMarker: {
      overlayId: 'ember-ford:culture-ember',
      regionId: 'ember-ford',
      cultureName: 'Ember Guild',
      influenceTier: 'strong',
      influenceScore: 58,
      discoveries: ['ash-treaty'],
    },
  });
  assert.deepEqual(volatileReport.stabilizationRecommendations.recommendations.map((recommendation) => [recommendation.action, recommendation.tone, recommendation.level]), [
    ['apaiser', 'tension', 'volatile'],
  ]);

  const watchReport = buildCultureTurnReportDeltas({
    selectedRegionId: 'plain-watch',
    momentumFilter: 'watch',
    selectedMarker: {
      overlayId: 'plain-watch:culture-watch',
      regionId: 'plain-watch',
      cultureName: 'Plain Watch',
      influenceTier: 'emerging',
      influenceScore: 35,
      discoveries: ['quiet-marker'],
      activeResearchCount: 0,
      unlockedResearchIds: [],
      narrativePriority: {
        state: 'watch',
        microAction: 'attendre',
        consequencePreview: {
          confidence: 'medium',
          summary: 'attendre: aucun basculement immédiat.',
        },
      },
    },
    previousMarker: {
      overlayId: 'plain-watch:culture-watch',
      regionId: 'plain-watch',
      cultureName: 'Plain Watch',
      influenceTier: 'emerging',
      influenceScore: 35,
      discoveries: ['quiet-marker'],
    },
  });
  assert.deepEqual(watchReport.stabilizationRecommendations.recommendations.map((recommendation) => [recommendation.action, recommendation.tone, recommendation.level]), [
    ['attendre', 'watch', 'observing'],
  ]);
});

test('buildCultureTurnReportDeltas summarizes coherence tensions between active cultural recommendations', () => {
  const report = buildCultureTurnReportDeltas({
    selectedRegionId: 'river-gate',
    selectedMarker: {
      overlayId: 'river-gate:culture-aurora',
      regionId: 'river-gate',
      cultureName: 'Compact d’Aurora',
      influenceTier: 'strong',
      influenceScore: 82,
      discoveries: ['archive-routes'],
      activeResearchCount: 0,
      unlockedResearchIds: [],
      narrativePriority: {
        state: 'opportunity',
        microAction: 'explorer',
        consequencePreview: {
          confidence: 'high',
          opportunity: 'archives ouvertes',
          summary: 'explorer: archives ouvertes.',
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
    activeRecommendations: [
      {
        recommendationId: 'harbor:momentum:surge:stabilization',
        regionId: 'harbor',
        cultureName: 'Harbor Compact',
        action: 'amplifier',
        tone: 'opportunity',
        level: 'surging',
        discoveryId: 'harbor-forum',
        confidence: 'high',
        chain: 'harbor-forum → influence renforcée → amplifier',
        rank: 2,
      },
      {
        recommendationId: 'mist:momentum:fragile:stabilization',
        regionId: 'mist-hills',
        cultureName: 'Mist Circle',
        action: 'enquêter',
        tone: 'tension',
        level: 'fragile',
        discoveryId: 'fog-index',
        confidence: 'low',
        chain: 'fog-index → fragile → enquêter',
        rank: 3,
      },
      {
        recommendationId: 'ember:momentum:volatile:stabilization',
        regionId: 'ember-ford',
        cultureName: 'Ember Guild',
        action: 'apaiser',
        tone: 'tension',
        level: 'volatile',
        discoveryId: 'ash-treaty',
        confidence: 'medium',
        chain: 'ash-treaty → volatile → apaiser',
        rank: 4,
      },
    ],
  });

  assert.equal(report.recommendationCoherence.state, 'conflict');
  assert.deepEqual(report.recommendationCoherence.trajectoryGroups.map((group) => [group.trajectory, group.count]), [
    ['expansion', 2],
    ['apaisement', 1],
    ['enquête', 1],
  ]);
  assert.deepEqual(report.recommendationCoherence.tensions.map((tension) => [tension.label, tension.level]), [
    ['enquête incertaine', 'uncertain'],
    ['opportunités concurrentes', 'conflict'],
    ['apaisement tardif', 'warning'],
  ]);
  assert.match(report.recommendationCoherence.explanation, /archive-routes → amplifier → expansion/);
  assert.deepEqual(report.recommendationCoherence.uncertainRecommendationIds, ['mist:momentum:fragile:stabilization']);
});

test('buildCultureTurnReportDeltas groups compatible and incompatible cultural commitment bundles', () => {
  const report = buildCultureTurnReportDeltas({
    selectedRegionId: 'river-gate',
    selectedMarker: {
      overlayId: 'river-gate:culture-aurora',
      regionId: 'river-gate',
      cultureName: 'Compact d’Aurora',
      influenceTier: 'strong',
      influenceScore: 82,
      discoveries: ['archive-routes'],
      activeResearchCount: 0,
      unlockedResearchIds: [],
      narrativePriority: {
        state: 'opportunity',
        microAction: 'explorer',
        consequencePreview: {
          confidence: 'high',
          opportunity: 'archives ouvertes',
          summary: 'explorer: archives ouvertes.',
          visibleMarkerIds: ['river-gate:culture-aurora:event:event-archive-opening'],
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
    activeRecommendations: [
      {
        recommendationId: 'ember:momentum:volatile:stabilization',
        regionId: 'ember-ford',
        cultureName: 'Ember Guild',
        action: 'apaiser',
        tone: 'tension',
        level: 'volatile',
        discoveryId: 'ash-treaty',
        confidence: 'medium',
        supportKey: 'envoy',
        markerIds: ['ember-marker'],
        rank: 2,
      },
      {
        recommendationId: 'mist:momentum:fragile:stabilization',
        regionId: 'mist-hills',
        cultureName: 'Mist Circle',
        action: 'enquêter',
        tone: 'tension',
        level: 'fragile',
        discoveryId: 'fog-index',
        confidence: 'low',
        supportKey: 'survey-team',
        markerIds: ['mist-marker'],
        rank: 3,
      },
      {
        recommendationId: 'harbor:momentum:surge:stabilization',
        regionId: 'harbor',
        cultureName: 'Harbor Compact',
        action: 'amplifier',
        tone: 'opportunity',
        level: 'surging',
        discoveryId: 'harbor-forum',
        confidence: 'high',
        supportKey: 'amplifier',
        expiresSoon: true,
        markerIds: ['harbor-marker'],
        rank: 4,
      },
    ],
  });

  assert.equal(report.commitmentBundles.state, 'needs-choice');
  assert.deepEqual(report.commitmentBundles.bundles.map((bundle) => [bundle.label, bundle.state, bundle.actions]), [
    ['apaisement local', 'safe', ['apaiser']],
    ['enquête', 'uncertain', ['enquêter']],
    ['expansion prudente', 'safe', ['amplifier']],
  ]);
  assert.deepEqual(report.commitmentBundles.incompatibilities.map((incompatibility) => [incompatibility.type, incompatibility.severity]), [
    ['same-support-required', 'choice'],
    ['contradictory-narrative-timing', 'sequence'],
    ['low-confidence', 'uncertain'],
    ['expiring-opportunity', 'urgent'],
  ]);
  assert.match(report.commitmentBundles.dependencyExplanation, /apaisement local: ash-treaty → apaiser/);
  assert.deepEqual(report.commitmentBundles.bundles[1].uncertainRecommendationIds, ['mist:momentum:fragile:stabilization']);
  assert.deepEqual(report.commitmentBundles.timingWindows.map((window) => [window.clusterLabel, window.status, window.label]), [
    ['Harbor Compact', 'soon-lost', 'fenêtre bientôt perdue'],
    ['Compact d’Aurora', 'immediate', 'action immédiate'],
    ['Ember Guild', 'wait', 'attendre'],
    ['Mist Circle', 'wait', 'attendre'],
  ]);
  assert.match(report.commitmentBundles.timingWindows[0].delayEffect, /perdre le momentum/);
  assert.equal(report.commitmentBundles.followUpPrompts.state, 'mixed');
  assert.deepEqual(report.commitmentBundles.followUpPrompts.prompts.map((prompt) => [prompt.clusterLabel, prompt.state, prompt.label]), [
    ['Compact d’Aurora', 'risky', 'Ouvrir le récit d’expansion'],
    ['Harbor Compact', 'risky', 'Ouvrir le récit d’expansion'],
    ['Ember Guild', 'premature', 'Préparer la médiation locale'],
  ]);
  assert.match(report.commitmentBundles.followUpPrompts.prompts[0].reasonNow, /fenêtre recommandée/);
  assert.match(report.commitmentBundles.followUpPrompts.prompts[2].riskReason, /conditions culturelles|timing narratif/);
  assert.equal(report.commitmentBundles.promptChoiceComparison.state, 'risky');
  assert.deepEqual(report.commitmentBundles.promptChoiceComparison.entries.map((entry) => [entry.clusterLabel, entry.role, entry.label]), [
    ['Compact d’Aurora', 'risky-useful', 'suivi risqué mais utile'],
    ['Harbor Compact', 'risky-useful', 'suivi risqué mais utile'],
    ['Ember Guild', 'wait', 'suivi à attendre'],
  ]);
  assert.match(report.commitmentBundles.promptChoiceComparison.entries[0].narrativeImpact, /préserver le momentum/);
  assert.match(report.commitmentBundles.promptChoiceComparison.noChoiceRisk, /momentum|fenêtre/);
});
