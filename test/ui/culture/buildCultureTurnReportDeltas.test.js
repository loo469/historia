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
    promptHistoryDrawer: {
      state: 'ready',
      summary: '1 groupe d’historique culturel limité à comparer.',
      displayLimit: 5,
      regionId: 'river-gate',
      currentEntries: [
        {
          promptId: 'culture-commitment:expansion:timing:river-gate:follow-up',
          promptLabel: 'Ouvrir le récit d’expansion',
          clusterLabel: 'Compact d’Aurora',
          role: 'best-safe',
          repeatState: 'new',
          repeatReason: 'aucune décision récente similaire dans la limite affichée',
          rotation: {
            confirm: 'confirmer si le contexte narratif a changé',
            defer: 'différer si aucun nouveau signal ne justifie ce prompt',
            replace: 'aucune alternative plus fraîche visible',
          },
          narrativeImpact: 'Ouvrir le récit d’expansion garde expansion prudente lisible et transforme Compact d’Aurora en suivi narratif immédiat.',
        },
      ],
      groups: [
        {
          groupId: 'culture-prompt-history:Compact d’Aurora:Ouvrir le récit d’expansion',
          clusterLabel: 'Compact d’Aurora',
          theme: 'Ouvrir le récit d’expansion',
          entries: [
            {
              promptId: 'culture-commitment:expansion:timing:river-gate:follow-up',
              promptLabel: 'Ouvrir le récit d’expansion',
              clusterLabel: 'Compact d’Aurora',
              role: 'best-safe',
              repeatState: 'new',
              repeatReason: 'aucune décision récente similaire dans la limite affichée',
              rotation: {
                confirm: 'confirmer si le contexte narratif a changé',
                defer: 'différer si aucun nouveau signal ne justifie ce prompt',
                replace: 'aucune alternative plus fraîche visible',
              },
              narrativeImpact: 'Ouvrir le récit d’expansion garde expansion prudente lisible et transforme Compact d’Aurora en suivi narratif immédiat.',
              source: 'current',
              theme: 'Ouvrir le récit d’expansion',
            },
          ],
          hasRepeat: false,
        },
      ],
      repetitionSafeguard: 'Aucune répétition récente détectée: garder les prompts frais en priorité.',
      emptyHint: 'Historique léger: comparer seulement les prompts actuels et commencer à mémoriser les décisions.',
    },
    promptFreshnessFilter: {
      state: 'fresh',
      summary: '1 recommandation culturelle classée par fraîcheur.',
      preferredPromptId: 'culture-commitment:expansion:timing:river-gate:follow-up',
      entries: [
        {
          freshnessId: 'culture-commitment:expansion:timing:river-gate:follow-up:freshness',
          promptId: 'culture-commitment:expansion:timing:river-gate:follow-up',
          promptLabel: 'Ouvrir le récit d’expansion',
          clusterLabel: 'Compact d’Aurora',
          role: 'best-safe',
          freshnessState: 'fresh',
          score: 5,
          explanation: 'recommandation fraîche: aucun choix récent similaire dans l’historique lisible',
          rotation: {
            confirm: 'confirmer si le contexte narratif a changé',
            defer: 'différer si aucun nouveau signal ne justifie ce prompt',
            replace: 'aucune alternative plus fraîche visible',
          },
        },
      ],
      fallback: 'Historique court ou ambigu: conserver le classement stable et expliquer la fraîcheur sans masquer les prompts.',
    },
    recommendationRotationPreview: {
      state: 'ready',
      summary: '1 recommandation culturelle planifiée pour rotation.',
      entries: [
        {
          previewId: 'culture-commitment:expansion:timing:river-gate:follow-up:rotation-preview',
          promptId: 'culture-commitment:expansion:timing:river-gate:follow-up',
          promptLabel: 'Ouvrir le récit d’expansion',
          clusterLabel: 'Compact d’Aurora',
          rotationState: 'available-now',
          factor: 'compatibilité',
          factorExplanation: 'Compact d’Aurora: compatible maintenant et sans répétition récente.',
          alternativePromptId: null,
          alternativeLabel: null,
        },
      ],
      fallback: 'Fallback stable: historique court ou ambigu, conserver les prompts visibles sans forcer la rotation.',
    },
    rotationCommitmentSummary: {
      state: 'ready',
      summary: 'Ouvrir le récit d’expansion: 1 à 2 tours de suivi culturel; expansion prudente: verrouille le bénéfice culturel principal autour de Compact d’Aurora.',
      selectedPromptId: 'culture-commitment:expansion:timing:river-gate:follow-up',
      entries: [
        {
          summaryId: 'culture-commitment:expansion:timing:river-gate:follow-up:commitment-summary',
          promptId: 'culture-commitment:expansion:timing:river-gate:follow-up',
          promptLabel: 'Ouvrir le récit d’expansion',
          clusterLabel: 'Compact d’Aurora',
          rotationState: 'available-now',
          duration: '1 à 2 tours de suivi culturel',
          benefit: 'expansion prudente: verrouille le bénéfice culturel principal autour de Compact d’Aurora',
          opportunityCost: 'coût narratif/recherche modéré: les autres thèmes restent en file de rotation',
          dependencyWarning: 'aucune dépendance bloquante visible avant engagement',
          hasUnresolvedDependencies: false,
          repeatPolicy: 'non répété récemment: peut rester prioritaire',
          alternativeLabel: null,
        },
      ],
    },
    commitmentFollowThroughReminder: {
      state: 'fallback',
      reminderId: 'culture-commitment:follow-through:fallback',
      summary: 'Aucun engagement culturel récent traçable: afficher le prochain choix recommandé sans inventer de promesse passée.',
      sourcePromptLabel: null,
      clusterLabel: 'Compact d’Aurora',
      lastTurn: null,
      agePriority: {
        state: 'next-choice',
        label: 'nouvelle priorité',
        ageTurns: 0,
        priority: 1,
        relevance: 'orienter le prochain choix sans masquer les nouvelles opportunités',
        almostExpired: false,
        stale: false,
      },
      priorityLabel: 'nouvelle priorité · priorité 1/4',
      nextCheck: 'Vérifier si Compact d’Aurora peut encore suivre Ouvrir le récit d’expansion.',
      expectedAction: 'attendre un engagement culturel explicite avant de rappeler une promesse',
    },
    followThroughBundlePlan: {
      state: 'ready',
      summary: '1 plan de suivi culturel groupé; premier: Compact d’Aurora.',
      bestBundleId: 'culture-prompt-history:Compact d’Aurora:Ouvrir le récit d’expansion:follow-through-bundle',
      groups: [
        {
          bundleId: 'culture-prompt-history:Compact d’Aurora:Ouvrir le récit d’expansion:follow-through-bundle',
          clusterLabel: 'Compact d’Aurora',
          theme: 'Ouvrir le récit d’expansion',
          state: 'ready',
          summary: 'Compact d’Aurora: 1 suivi regroupé sur Ouvrir le récit d’expansion.',
          groupingReason: 'Même enjeu culturel: garder le contexte visible sans grossir la file.',
          unlockScore: 4,
          bestFirstFollowUp: 'Ouvrir le récit d’expansion — expansion prudente: verrouille le bénéfice culturel principal autour de Compact d’Aurora',
          avoidedLoss: 'expansion prudente: verrouille le bénéfice culturel principal autour de Compact d’Aurora',
          detailCount: 1,
          details: [
            {
              detailId: 'culture-commitment:expansion:timing:river-gate:follow-up',
              source: 'current',
              promptLabel: 'Ouvrir le récit d’expansion',
              clusterLabel: 'Compact d’Aurora',
              state: 'best-safe',
              note: 'aucune décision récente similaire dans la limite affichée',
            },
          ],
        },
      ],
      cleanupPrompts: [
        {
          cleanupId: 'culture-prompt-history:Compact d’Aurora:Ouvrir le récit d’expansion:follow-through-bundle:cleanup-prompt',
          bundleId: 'culture-prompt-history:Compact d’Aurora:Ouvrir le récit d’expansion:follow-through-bundle',
          clusterLabel: 'Compact d’Aurora',
          state: 'risk-persists',
          action: 'conserver: risque culturel encore actif',
          reason: 'Compact d’Aurora: expansion prudente: verrouille le bénéfice culturel principal autour de Compact d’Aurora; Vérifier si Compact d’Aurora peut encore suivre Ouvrir le récit d’expansion.',
          safeguard: 'Aucune répétition récente détectée: garder les prompts frais en priorité.',
          replacesPromptLabel: null,
        },
      ],
      cleanupSummary: '1 prompt de nettoyage: Compact d’Aurora → conserver: risque culturel encore actif.',
      falloutPreview: {
        state: 'action-needed',
        summary: 'Compact d’Aurora: tension culturelle maintenue si le nettoyage est ignoré. Cleanup minimal: conserver: risque culturel encore actif.',
        priorityBundleId: 'culture-prompt-history:Compact d’Aurora:Ouvrir le récit d’expansion:follow-through-bundle',
        affectedCulture: 'Compact d’Aurora',
        consequenceType: 'tension',
        consequence: 'Compact d’Aurora: tension culturelle maintenue si le nettoyage est ignoré.',
        severity: 2,
        minimalCleanupAction: 'conserver: risque culturel encore actif',
        entries: [
          {
            falloutId: 'culture-prompt-history:Compact d’Aurora:Ouvrir le récit d’expansion:follow-through-bundle:cleanup-prompt:fallout-preview',
            bundleId: 'culture-prompt-history:Compact d’Aurora:Ouvrir le récit d’expansion:follow-through-bundle',
            clusterLabel: 'Compact d’Aurora',
            cleanupState: 'risk-persists',
            consequenceType: 'tension',
            consequence: 'Compact d’Aurora: tension culturelle maintenue si le nettoyage est ignoré.',
            severity: 2,
            exceedsThreshold: true,
            minimalCleanupAction: 'conserver: risque culturel encore actif',
          },
        ],
      },
      replacementRecommendations: {
        state: 'replan',
        summary: 'Compact d’Aurora: #1 replanifier après cleanup du risque — haute urgence · payoff moyen · évite une perte; évite Compact d’Aurora: tension culturelle maintenue si le nettoyage est ignoré.',
        primaryReplacementId: 'culture-prompt-history:Compact d’Aurora:Ouvrir le récit d’expansion:follow-through-bundle:cleanup-prompt:replacement',
        skipConsequenceSummary: 'Compact d’Aurora: perte évitée non traitée au prochain tour si replanifier après cleanup du risque est ignoré.',
        nextReviewWindow: 'début du prochain tour culturel',
        rankingFallback: 'Classement par urgence du fallout, payoff du remplacement, puis type défensif/opportuniste.',
        entries: [
          {
            replacementId: 'culture-prompt-history:Compact d’Aurora:Ouvrir le récit d’expansion:follow-through-bundle:cleanup-prompt:replacement',
            bundleId: 'culture-prompt-history:Compact d’Aurora:Ouvrir le récit d’expansion:follow-through-bundle',
            clusterLabel: 'Compact d’Aurora',
            state: 'replan',
            action: 'replanifier après cleanup du risque',
            replacementPromptLabel: 'Ouvrir le récit d’expansion',
            avoidedConsequence: 'Compact d’Aurora: tension culturelle maintenue si le nettoyage est ignoré.',
            urgency: 'haute',
            urgencyScore: 2,
            payoff: 'moyen',
            payoffScore: 2,
            mode: 'defensive',
            rankReason: 'haute urgence · payoff moyen · évite une perte',
            skipConsequenceType: 'unhandled-loss',
            skipConsequence: 'Compact d’Aurora: perte évitée non traitée au prochain tour si replanifier après cleanup du risque est ignoré.',
            skipAcceptable: false,
            nextReviewWindow: 'début du prochain tour culturel',
            reason: 'Compact d’Aurora: expansion prudente: verrouille le bénéfice culturel principal autour de Compact d’Aurora; Vérifier si Compact d’Aurora peut encore suivre Ouvrir le récit d’expansion. Alternative compacte: replanifier après cleanup du risque.',
            priority: 6,
            rank: 1,
            recommended: true,
          },
        ],
      },
      safeToDeferBundles: {
        state: 'none',
        summary: 'Aucun bundle culturel sûr à reporter ce tour.',
        primaryDeferId: null,
        primaryMissedWindowConsequence: null,
        primaryMinimalSafeAction: null,
        primaryMinimalActionThreshold: null,
        minimalSafeActionFallback: 'Fallback: aucune action minimale sûre connue pour conserver ce report.',
        missedWindowFallback: 'Fallback: aucune conséquence de fenêtre manquée à afficher sans action reportée prioritaire.',
        priorityFallback: 'Fallback: aucune fenêtre de délai calculable, garder l’ordre stable par risque faible puis culture.',
        entries: [],
      },
      detailMode: 'Ouvrir les détails pour vérifier chaque suivi individuel du groupe.',
    },
    dependencyExplanation: 'expansion prudente: archive-routes → amplifier → expansion prudente',
  });
});


test('buildCultureTurnReportDeltas marks stale cultural follow-through reminders behind fresher opportunities', () => {
  const report = buildCultureTurnReportDeltas({
    turn: 12,
    selectedRegionId: 'harbor',
    selectedMarker: {
      overlayId: 'harbor:culture-aurora',
      regionId: 'harbor',
      cultureName: 'Harbor Compact',
      influenceTier: 'strong',
      influenceScore: 78,
      discoveries: ['harbor-forum'],
      activeResearchCount: 0,
      unlockedResearchIds: [],
      narrativePriority: {
        state: 'opportunity',
        microAction: 'amplifier',
        consequencePreview: {
          confidence: 'high',
          opportunity: 'forum portuaire prêt',
          summary: 'amplifier: forum portuaire prêt.',
          visibleMarkerIds: ['harbor:culture-aurora:event:forum'],
        },
      },
    },
    promptHistory: [
      {
        decisionId: 'turn-8-aurora-expansion',
        turn: 8,
        regionId: 'river-gate',
        clusterLabel: 'Compact d’Aurora',
        theme: 'Ouvrir le récit d’expansion',
        promptLabel: 'Ouvrir le récit d’expansion',
        choiceState: 'chosen',
        outcome: 'forum ancien à confirmer',
      },
    ],
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
        supportKey: 'amplifier',
        markerIds: ['harbor-marker'],
        rank: 1,
      },
    ],
  });

  assert.equal(report.commitmentBundles.commitmentFollowThroughReminder.state, 'stale');
  assert.deepEqual(report.commitmentBundles.commitmentFollowThroughReminder.agePriority, {
    state: 'stale',
    label: 'pertinence perdue',
    ageTurns: 4,
    priority: 1,
    relevance: 'ne pas laisser cet ancien rappel masquer les opportunités fraîches',
    almostExpired: true,
    stale: true,
  });
  assert.match(report.commitmentBundles.commitmentFollowThroughReminder.nextCheck, /Remplacer ou reconfirmer/);
  assert.match(report.commitmentBundles.commitmentFollowThroughReminder.expectedAction, /opportunités fraîches/);
  assert.equal(report.commitmentBundles.followThroughBundlePlan.state, 'actionable');
  assert.equal(report.commitmentBundles.followThroughBundlePlan.groups[0].clusterLabel, 'Compact d’Aurora');
  assert.match(report.commitmentBundles.followThroughBundlePlan.groups[0].groupingReason, /Même enjeu culturel|Même thème/);
  assert.match(report.commitmentBundles.followThroughBundlePlan.groups[0].avoidedLoss, /opportunité fraîche/);
  assert.deepEqual(report.commitmentBundles.followThroughBundlePlan.cleanupPrompts.map((prompt) => [
    prompt.clusterLabel,
    prompt.state,
    prompt.action,
  ]), [
    ['Compact d’Aurora', 'obsolete', 'remplacer par Ouvrir le récit d’expansion'],
    ['Harbor Compact', 'risk-persists', 'conserver: risque culturel encore actif'],
  ]);
  assert.match(report.commitmentBundles.followThroughBundlePlan.cleanupPrompts[0].reason, /opportunités fraîches/);
  assert.equal(report.commitmentBundles.followThroughBundlePlan.cleanupPrompts[0].replacesPromptLabel, 'Ouvrir le récit d’expansion');
  assert.match(report.commitmentBundles.followThroughBundlePlan.cleanupPrompts[0].safeguard, /Rotation courte|Aucune répétition/);
  assert.equal(report.commitmentBundles.followThroughBundlePlan.falloutPreview.state, 'action-needed');
  assert.equal(report.commitmentBundles.followThroughBundlePlan.falloutPreview.affectedCulture, 'Compact d’Aurora');
  assert.equal(report.commitmentBundles.followThroughBundlePlan.falloutPreview.consequenceType, 'opportunity-lost');
  assert.match(report.commitmentBundles.followThroughBundlePlan.falloutPreview.consequence, /opportunité fraîche masquée/);
  assert.equal(report.commitmentBundles.followThroughBundlePlan.falloutPreview.minimalCleanupAction, 'remplacer par Ouvrir le récit d’expansion');
  assert.deepEqual(report.commitmentBundles.followThroughBundlePlan.replacementRecommendations.entries.map((entry) => [
    entry.clusterLabel,
    entry.state,
    entry.action,
    entry.replacementPromptLabel,
  ]), [
    ['Compact d’Aurora', 'renew', 'renouveler via Ouvrir le récit d’expansion', 'Ouvrir le récit d’expansion'],
    ['Harbor Compact', 'replan', 'replanifier après cleanup du risque', 'Ouvrir le récit d’expansion'],
  ]);
  assert.match(report.commitmentBundles.followThroughBundlePlan.replacementRecommendations.entries[0].avoidedConsequence, /opportunité fraîche masquée/);
});

test('buildCultureTurnReportDeltas marks resolved cultural bundles safe to defer', () => {
  const report = buildCultureTurnReportDeltas({
    turn: 9,
    selectedRegionId: 'river-gate',
    localTimeline: {
      items: [
        {
          timelineId: 'river-gate:event:quiet-followup',
          kind: 'event',
          signal: 'watch',
          title: 'Suivi calme',
          summary: 'Risque stabilisé.',
          regionId: 'river-gate',
          cultureName: 'Compact d’Aurora',
        },
      ],
    },
    promptHistory: [
      {
        decisionId: 'turn-8-aurora-expansion',
        turn: 8,
        regionId: 'river-gate',
        clusterLabel: 'Compact d’Aurora',
        theme: 'Ouvrir le récit d’expansion',
        promptLabel: 'Ouvrir le récit d’expansion',
        choiceState: 'deferred',
        outcome: 'soutien actif confirmé',
      },
    ],
  });

  assert.deepEqual(report.commitmentBundles.followThroughBundlePlan.safeToDeferBundles.entries.map((entry) => [
    entry.clusterLabel,
    entry.label,
    entry.condition,
    entry.turningSignal,
    entry.riskThreshold,
    entry.deadlineHint,
    entry.deadlineStatus,
    entry.nextReviewWindow,
  ]), [
    [
      'Compact d’Aurora',
      'Peut attendre',
      'risque stabilisé par l’historique lisible',
      'fallout en hausse',
      'Devient risqué si le fallout dépasse le niveau faible avant la prochaine rotation culturelle.',
      'sûr ce tour',
      'safe-this-turn',
      'prochaine rotation culturelle',
    ],
  ]);
  assert.match(report.commitmentBundles.followThroughBundlePlan.safeToDeferBundles.summary, /sûr ce tour/);
  assert.equal(report.commitmentBundles.followThroughBundlePlan.replacementRecommendations.entries.some((entry) => entry.clusterLabel === 'Compact d’Aurora'), false);
});

test('buildCultureTurnReportDeltas escalates safe defer deadline when current support must be reviewed soon', () => {
  const report = buildCultureTurnReportDeltas({
    turn: 9,
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
      },
    },
    promptHistory: [
      {
        decisionId: 'turn-8-aurora-expansion',
        turn: 8,
        regionId: 'river-gate',
        clusterLabel: 'Compact d’Aurora',
        theme: 'Ouvrir le récit d’expansion',
        promptLabel: 'Ouvrir le récit d’expansion',
        choiceState: 'deferred',
        outcome: 'soutien actif confirmé',
      },
    ],
  });

  assert.deepEqual(report.commitmentBundles.followThroughBundlePlan.safeToDeferBundles.entries.map((entry) => [
    entry.clusterLabel,
    entry.condition,
    entry.turningSignal,
    entry.deadlineHint,
    entry.deadlineStatus,
  ]), [
    [
      'Compact d’Aurora',
      'soutien actif déjà visible dans la rotation culturelle',
      'perte du soutien actif',
      'à revoir dès le prochain tour',
      'near-deadline',
    ],
  ]);
});

test('buildCultureTurnReportDeltas prioritizes safe defer entries by deadline pressure before payoff', () => {
  const report = buildCultureTurnReportDeltas({
    turn: 9,
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
        microAction: 'amplifier',
      },
    },
    localTimeline: {
      items: [
        {
          timelineId: 'harbor:event:quiet-followup',
          kind: 'event',
          signal: 'watch',
          title: 'Suivi calme',
          summary: 'Risque stabilisé.',
          regionId: 'harbor',
          cultureName: 'Harbor Compact',
        },
      ],
    },
    promptHistory: [
      {
        decisionId: 'turn-8-aurora-expansion',
        turn: 8,
        regionId: 'river-gate',
        clusterLabel: 'Compact d’Aurora',
        theme: 'Ouvrir le récit d’expansion',
        promptLabel: 'Ouvrir le récit d’expansion',
        choiceState: 'deferred',
        outcome: 'soutien actif confirmé',
      },
      {
        decisionId: 'turn-8-harbor-calm',
        turn: 8,
        regionId: 'harbor',
        clusterLabel: 'Harbor Compact',
        theme: 'Calmer le port',
        promptLabel: 'Calmer le port',
        choiceState: 'deferred',
        outcome: 'risque stabilisé',
      },
    ],
  });

  const safeToDefer = report.commitmentBundles.followThroughBundlePlan.safeToDeferBundles;
  assert.equal(safeToDefer.priorityFallback, 'Priorité par pression de délai, puis payoff culturel.');
  assert.deepEqual(safeToDefer.entries.map((entry) => [
    entry.clusterLabel,
    entry.deadlineStatus,
    entry.revisitRank,
    entry.revisitPriority,
  ]), [
    ['Compact d’Aurora', 'near-deadline', 1, 'next'],
    ['Harbor Compact', 'safe-this-turn', 2, 'later'],
  ]);
  assert.equal(safeToDefer.primaryDeferId, safeToDefer.entries[0].deferId);
});

test('buildCultureTurnReportDeltas shows the consequence of missing the next deferred revisit', () => {
  const report = buildCultureTurnReportDeltas({
    turn: 9,
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
        microAction: 'amplifier',
      },
    },
    localTimeline: {
      items: [
        {
          timelineId: 'harbor:event:quiet-followup',
          kind: 'event',
          signal: 'watch',
          title: 'Suivi calme',
          summary: 'Risque stabilisé.',
          regionId: 'harbor',
          cultureName: 'Harbor Compact',
        },
      ],
    },
    promptHistory: [
      {
        decisionId: 'turn-8-aurora-expansion',
        turn: 8,
        regionId: 'river-gate',
        clusterLabel: 'Compact d’Aurora',
        theme: 'Ouvrir le récit d’expansion',
        promptLabel: 'Ouvrir le récit d’expansion',
        choiceState: 'deferred',
        outcome: 'soutien actif confirmé',
      },
      {
        decisionId: 'turn-8-harbor-calm',
        turn: 8,
        regionId: 'harbor',
        clusterLabel: 'Harbor Compact',
        theme: 'Calmer le port',
        promptLabel: 'Calmer le port',
        choiceState: 'deferred',
        outcome: 'risque stabilisé',
      },
    ],
  });

  const safeToDefer = report.commitmentBundles.followThroughBundlePlan.safeToDeferBundles;
  assert.equal(safeToDefer.primaryMissedWindowConsequence, 'Compact d’Aurora: consolidation retardée d’un tour si le bundle n’est pas réévalué.');
  assert.equal(safeToDefer.primaryMinimalSafeAction, 'confirmer Ouvrir le récit d’expansion');
  assert.equal(safeToDefer.primaryMinimalActionThreshold, 'prochaine rotation culturelle');
  assert.equal(safeToDefer.missedWindowFallback, 'Conséquence calculée depuis le fallout/payoff existant du bundle reporté.');
  assert.equal(safeToDefer.minimalSafeActionFallback, 'Action minimale calculée depuis le suivi courant du bundle reporté.');
  assert.deepEqual(safeToDefer.entries.map((entry) => [
    entry.clusterLabel,
    entry.revisitPriority,
    entry.missedWindowConsequence,
    entry.missedWindowConsequenceType,
    entry.missedWindowSeverity,
    entry.minimalSafeAction,
    entry.preventedConsequence,
    entry.minimalActionAcceptableUntil,
    entry.recommendedAction,
    entry.lateRiskyAction,
    entry.minimalActionThresholdReason,
  ]), [
    [
      'Compact d’Aurora',
      'next',
      'Compact d’Aurora: consolidation retardée d’un tour si le bundle n’est pas réévalué.',
      'consolidation-delay',
      1,
      'confirmer Ouvrir le récit d’expansion',
      'évite une consolidation retardée',
      'prochaine rotation culturelle',
      'revoir Compact d’Aurora avant prochaine rotation culturelle',
      'agir après prochaine rotation culturelle avec perte du soutien actif',
      'à revoir dès le prochain tour: la petite action cesse de suffire si perte du soutien actif.',
    ],
    ['Harbor Compact', 'later', null, null, 0, null, null, null, null, null, null],
  ]);
});

test('buildCultureTurnReportDeltas explains the benefit of acting beyond the cultural minimum', () => {
  const report = buildCultureTurnReportDeltas({
    turn: 9,
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
        microAction: 'amplifier',
      },
    },
    localTimeline: {
      items: [
        {
          timelineId: 'harbor:event:quiet-followup',
          kind: 'event',
          signal: 'watch',
          title: 'Suivi calme',
          summary: 'Risque stabilisé.',
          regionId: 'harbor',
          cultureName: 'Harbor Compact',
        },
      ],
    },
    promptHistory: [
      {
        decisionId: 'turn-8-aurora-expansion',
        turn: 8,
        regionId: 'river-gate',
        clusterLabel: 'Compact d’Aurora',
        theme: 'Ouvrir le récit d’expansion',
        promptLabel: 'Ouvrir le récit d’expansion',
        choiceState: 'deferred',
        outcome: 'soutien actif confirmé',
      },
      {
        decisionId: 'turn-8-harbor-calm',
        turn: 8,
        regionId: 'harbor',
        clusterLabel: 'Harbor Compact',
        theme: 'Calmer le port',
        promptLabel: 'Calmer le port',
        choiceState: 'deferred',
        outcome: 'risque stabilisé',
      },
    ],
  });

  const safeToDefer = report.commitmentBundles.followThroughBundlePlan.safeToDeferBundles;
  assert.deepEqual(safeToDefer.entries.map((entry) => [
    entry.clusterLabel,
    entry.revisitPriority,
    entry.recommendedBeyondMinimumBenefit?.recommendedAction ?? null,
    entry.recommendedBeyondMinimumBenefit?.concreteGain ?? null,
    entry.recommendedBeyondMinimumBenefit?.nextTurnAvoidance ?? null,
    entry.recommendedBeyondMinimumBenefit?.avoids ?? null,
    entry.immediateSynergy?.label ?? null,
    entry.immediateSynergy?.sourceType ?? null,
    entry.immediateSynergy?.sourceLabel ?? null,
    entry.immediateSynergy?.benefit ?? null,
    entry.immediateSynergy?.avoidedRisk ?? null,
    entry.immediateSynergy?.expiryWarning?.label ?? null,
    entry.immediateSynergy?.expiryWarning?.reviewWindow ?? null,
    entry.immediateSynergy?.expiryWarning?.lostBenefit ?? null,
    entry.deferLadderSummary?.state ?? null,
    entry.deferLadderSummary?.label ?? null,
    entry.deferLadderSummary?.summary ?? null,
    entry.deferLadderSummary?.firstFollowUpReason?.summary ?? null,
  ]), [
    [
      'Compact d’Aurora',
      'next',
      'traiter Compact d’Aurora maintenant',
      'gain concret: sécurise payoff 5 sans attendre la bascule',
      'évite une urgence de consolidation au prochain tour',
      'Compact d’Aurora: consolidation retardée d’un tour si le bundle n’est pas réévalué.',
      'Synergie ce tour',
      'discovery',
      'archive-routes',
      'archive-routes renforce amplifier avec Compact d’Aurora',
      'évite de séparer la découverte du suivi reporté: Compact d’Aurora: consolidation retardée d’un tour si le bundle n’est pas réévalué.',
      null,
      null,
      null,
      'minimum-sufficient',
      'Minimum suffisant',
      'Minimum suffisant: confirmer Ouvrir le récit d’expansion; synergie ce tour: archive-routes + Compact d’Aurora; amplifier sécurisé.',
      'synergie ce tour: archive-routes + Compact d’Aurora; amplifier sécurisé.; expiration: aucune expiration visible; piste différée: confirmer Ouvrir le récit d’expansion; signal local: perte du soutien actif.',
    ],
    ['Harbor Compact', 'later', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  ]);
});


test('buildCultureTurnReportDeltas warns when immediate cultural synergy expires before review', () => {
  const report = buildCultureTurnReportDeltas({
    turn: 9,
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
        microAction: 'amplifier',
      },
    },
    activeRecommendations: [
      {
        recommendationId: 'river-gate:aurora:expiring-discovery',
        regionId: 'river-gate',
        cultureName: 'Compact d’Aurora',
        action: 'amplifier',
        tone: 'opportunity',
        level: 'surging',
        discoveryId: 'archive-routes',
        confidence: 'high',
        supportKey: 'amplifier',
        markerIds: ['aurora-marker'],
        rank: 1,
        expiresSoon: true,
        timingLabel: 'expire avant la prochaine revue',
      },
    ],
    localTimeline: {
      items: [
        {
          timelineId: 'harbor:event:quiet-followup',
          kind: 'event',
          signal: 'watch',
          title: 'Suivi calme',
          summary: 'Risque stabilisé.',
          regionId: 'harbor',
          cultureName: 'Harbor Compact',
        },
      ],
    },
    promptHistory: [
      {
        decisionId: 'turn-8-aurora-expansion',
        turn: 8,
        regionId: 'river-gate',
        clusterLabel: 'Compact d’Aurora',
        theme: 'Ouvrir le récit d’expansion',
        promptLabel: 'Ouvrir le récit d’expansion',
        choiceState: 'deferred',
        outcome: 'soutien actif confirmé',
      },
      {
        decisionId: 'turn-8-harbor-calm',
        turn: 8,
        regionId: 'harbor',
        clusterLabel: 'Harbor Compact',
        theme: 'Calmer le port',
        promptLabel: 'Calmer le port',
        choiceState: 'deferred',
        outcome: 'risque stabilisé',
      },
    ],
  });

  const expiringEntry = report.commitmentBundles.followThroughBundlePlan.safeToDeferBundles.entries[0];
  const expiringSynergy = expiringEntry.immediateSynergy;
  assert.deepEqual(expiringSynergy.expiryWarning, {
    state: 'expires-before-review',
    label: 'expire avant revue',
    reviewWindow: 'prochaine rotation culturelle',
    expiryCause: 'expire avant la prochaine revue',
    lostBenefit: 'archive-routes ne renforcera plus Compact d’Aurora de façon sûre',
    summary: 'expire avant revue: expire avant la prochaine revue; agir maintenant capture archive-routes.',
  });
  assert.deepEqual(expiringEntry.deferLadderSummary, {
    state: 'act-now',
    label: 'Agir maintenant',
    decision: 'agir maintenant pour capturer la synergie avant expiration',
    summary: 'Agir maintenant: expire avant revue: expire avant la prochaine revue; agir maintenant capture archive-routes.',
    firstFollowUpReason: {
      state: 'expiry-driven',
      label: 'Pourquoi ce suivi',
      synergy: 'synergie ce tour: archive-routes + Compact d’Aurora; amplifier sécurisé.',
      expiryCue: 'expiration: expire avant revue: expire avant la prochaine revue; agir maintenant capture archive-routes.',
      deferredTrack: 'piste différée: confirmer Ouvrir le récit d’expansion',
      localSignal: 'signal local: perte du soutien actif',
      summary: 'synergie ce tour: archive-routes + Compact d’Aurora; amplifier sécurisé.; expiration: expire avant revue: expire avant la prochaine revue; agir maintenant capture archive-routes.; piste différée: confirmer Ouvrir le récit d’expansion; signal local: perte du soutien actif.',
      payoffCue: 'gain concret: sécurise payoff 3 sans attendre la bascule',
    },
    followUpRobustness: {
      state: 'fragile-before-review',
      label: 'Fragile avant revue',
      reviewWindow: 'prochaine rotation culturelle',
      reason: 'expire avant la prochaine revue',
      summary: 'Fragile avant revue: expire avant la prochaine revue; archive-routes expire avant prochaine rotation culturelle.',
    },
    reviewExitSignal: null,
    reviewReopenSignal: null,
  });
});

test('buildCultureTurnReportDeltas summarizes a safe defer ladder without expiring synergy', () => {
  const report = buildCultureTurnReportDeltas({
    turn: 9,
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
        microAction: 'amplifier',
      },
    },
    activeRecommendations: [
      {
        recommendationId: 'river-gate:aurora:stable-discovery',
        regionId: 'river-gate',
        cultureName: 'Compact d’Aurora',
        action: 'amplifier',
        tone: 'opportunity',
        level: 'surging',
        discoveryId: 'archive-routes',
        confidence: 'high',
        supportKey: 'amplifier',
        markerIds: ['aurora-marker'],
        rank: 1,
      },
    ],
    promptHistory: [
      {
        decisionId: 'turn-8-aurora-expansion',
        turn: 8,
        regionId: 'river-gate',
        clusterLabel: 'Compact d’Aurora',
        theme: 'Ouvrir le récit',
        promptLabel: 'Ouvrir le récit',
        choiceState: 'deferred',
        outcome: 'risque stabilisé',
      },
      {
        decisionId: 'turn-8-harbor-calm',
        turn: 8,
        regionId: 'harbor',
        clusterLabel: 'Harbor Compact',
        theme: 'Calmer le port',
        promptLabel: 'Calmer le port',
        choiceState: 'deferred',
        outcome: 'risque stabilisé',
      },
    ],
  });

  const safeEntry = report.commitmentBundles.followThroughBundlePlan.safeToDeferBundles.entries[0];
  assert.equal(safeEntry.deadlineStatus, 'safe-this-turn');
  assert.equal(safeEntry.immediateSynergy.expiryWarning, null);
  assert.deepEqual(safeEntry.deferLadderSummary, {
    state: 'safe-defer',
    label: 'Report sûr',
    decision: 'reporter sans perdre la synergie visible',
    summary: 'Report sûr: sûr ce tour; synergie ce tour: archive-routes + Compact d’Aurora; amplifier sécurisé.',
    firstFollowUpReason: {
      state: 'safe-this-turn',
      label: 'Pourquoi ce suivi',
      synergy: 'synergie ce tour: archive-routes + Compact d’Aurora; amplifier sécurisé.',
      expiryCue: 'expiration: aucune expiration visible',
      deferredTrack: 'piste différée: risque stabilisé par l’historique lisible',
      localSignal: 'signal local: fallout en hausse',
      summary: 'synergie ce tour: archive-routes + Compact d’Aurora; amplifier sécurisé.; expiration: aucune expiration visible; piste différée: risque stabilisé par l’historique lisible; signal local: fallout en hausse.',
      payoffCue: 'gain concret: sécurise payoff 2 sans attendre la bascule',
    },
    followUpRobustness: {
      state: 'stable-until-review',
      label: 'Stable jusqu’à la prochaine revue',
      reviewWindow: 'prochaine rotation culturelle',
      reason: 'sûr ce tour',
      summary: 'Stable jusqu’à la prochaine revue: prochaine rotation culturelle; aucune expiration de synergie visible.',
    },
    reviewExitSignal: {
      state: 'exit-on-stable-signal',
      label: 'Sortie de revue',
      reviewWindow: 'prochaine rotation culturelle',
      signal: 'amplifier reste visible sans expiration',
      localAnchor: 'risque stabilisé par l’historique lisible',
      summary: 'Sortie de revue: amplifier reste visible sans expiration jusqu’à prochaine rotation culturelle; risque stabilisé par l’historique lisible.',
    },
    reviewReopenSignal: {
      state: 'reopen-on-synergy-change',
      label: 'Réouvrir la revue',
      trigger: 'amplifier ne reste plus aligné avec archive-routes',
      reviewWindow: 'prochaine rotation culturelle',
      reviewQuestionPreview: {
        state: 'preview-reopened-review',
        label: 'Si réouvert',
        question: 'vérifier si archive-routes justifie encore amplifier',
        anchor: 'risque stabilisé par l’historique lisible',
        outcomeThreshold: {
          state: 'stable-if-synergy-still-supports-anchor',
          label: 'Seuil stable',
          criterion: 'archive-routes soutient encore amplifier sans contredire risque stabilisé par l’historique lisible',
          fallback: 'si ce seuil n’est pas lisible, garder risque stabilisé par l’historique lisible comme repère calme',
          notActionableYet: {
            state: 'visible-below-action-threshold',
            label: 'Pas encore actionnable',
            missingThreshold: 'archive-routes soutient encore amplifier sans contredire risque stabilisé par l’historique lisible',
            margin: 'marge à confirmer avant prochaine rotation culturelle',
            actionableAfter: {
              state: 'actionable-after-synergy-confirmation',
              label: 'Devient actionnable après',
              stepType: 'synergy-prerequisite',
              firstStep: 'confirmer archive-routes avec amplifier',
              waitWindow: 'prochaine rotation culturelle',
              summary: 'Devient actionnable après confirmation de archive-routes avec amplifier; sinon attendre prochaine rotation culturelle.',
            },
            summary: 'Pas encore actionnable: attendre que archive-routes soutient encore amplifier sans contredire risque stabilisé par l’historique lisible; marge à confirmer avant prochaine rotation culturelle.',
          },
          summary: 'Stable si archive-routes soutient encore amplifier sans contredire risque stabilisé par l’historique lisible; sinon revoir activement.',
        },
        summary: 'Si réouvert: vérifier si archive-routes justifie encore amplifier, puis comparer avec risque stabilisé par l’historique lisible.',
      },
      summary: 'Réouvrir la revue: amplifier ne reste plus aligné avec archive-routes, expire, ou contredit risque stabilisé par l’historique lisible.',
    },
  });
});

test('buildCultureTurnReportDeltas explains when observing is the first cultural follow-up', () => {
  const report = buildCultureTurnReportDeltas({
    turn: 9,
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
        state: 'watch',
        microAction: 'attendre',
      },
    },
    activeRecommendations: [
      {
        recommendationId: 'river-gate:aurora:observe',
        regionId: 'river-gate',
        cultureName: 'Compact d’Aurora',
        action: 'attendre',
        tone: 'watch',
        level: 'steady',
        discoveryId: 'archive-routes',
        confidence: 'high',
        supportKey: 'attendre',
        markerIds: ['aurora-marker'],
        rank: 1,
      },
    ],
    localTimeline: {
      items: [
        {
          timelineId: 'harbor:event:quiet-followup',
          kind: 'event',
          signal: 'watch',
          title: 'Suivi calme',
          summary: 'Risque stabilisé.',
          regionId: 'harbor',
          cultureName: 'Harbor Compact',
        },
      ],
    },
    promptHistory: [
      {
        decisionId: 'turn-8-aurora-expansion',
        turn: 8,
        regionId: 'river-gate',
        clusterLabel: 'Compact d’Aurora',
        theme: 'Ouvrir le récit d’expansion',
        promptLabel: 'Ouvrir le récit d’expansion',
        choiceState: 'deferred',
        outcome: 'soutien actif confirmé',
      },
      {
        decisionId: 'turn-8-harbor-calm',
        turn: 8,
        regionId: 'harbor',
        clusterLabel: 'Harbor Compact',
        theme: 'Calmer le port',
        promptLabel: 'Calmer le port',
        choiceState: 'deferred',
        outcome: 'risque stabilisé',
      },
    ],
  });

  const observeEntry = report.commitmentBundles.followThroughBundlePlan.safeToDeferBundles.entries[0];
  assert.equal(observeEntry.deferLadderSummary.state, 'observe-first');
  assert.equal(observeEntry.deferLadderSummary.label, 'Observer');
  assert.equal(observeEntry.deferLadderSummary.decision, 'attendre/observer reste le meilleur premier suivi visible');
  assert.equal(observeEntry.deferLadderSummary.firstFollowUpReason.summary, 'synergie ce tour: archive-routes + Compact d’Aurora; attendre sécurisé.; expiration: aucune expiration visible; piste différée: risque stabilisé par l’historique lisible; signal local: fallout en hausse.');
});

test('buildCultureTurnReportDeltas breaks safe defer deadline ties by cultural payoff', () => {
  const report = buildCultureTurnReportDeltas({
    turn: 9,
    selectedRegionId: 'river-gate',
    selectedMarker: {
      overlayId: 'river-gate:culture-marker',
      regionId: 'river-gate',
      cultureName: 'Map Marker Culture',
      influenceTier: 'strong',
      influenceScore: 80,
      discoveries: ['archive-routes'],
      activeResearchCount: 0,
      unlockedResearchIds: [],
      narrativePriority: {
        state: 'opportunity',
        microAction: 'amplifier',
      },
    },
    activeRecommendations: [
      {
        recommendationId: 'river-gate:aurora:amplify',
        regionId: 'river-gate',
        cultureName: 'Compact d’Aurora',
        action: 'amplifier',
        tone: 'opportunity',
        level: 'surging',
        discoveryId: 'aurora-forum',
        confidence: 'high',
        supportKey: 'amplifier',
        markerIds: ['aurora-marker'],
        rank: 1,
      },
      {
        recommendationId: 'harbor:compact:support',
        regionId: 'harbor',
        cultureName: 'Harbor Compact',
        action: 'soutenir',
        tone: 'opportunity',
        level: 'surging',
        discoveryId: 'harbor-forum',
        confidence: 'high',
        supportKey: 'soutenir',
        markerIds: ['harbor-marker'],
        rank: 2,
      },
    ],
    promptHistory: [
      {
        decisionId: 'turn-8-aurora-expansion',
        turn: 8,
        regionId: 'river-gate',
        clusterLabel: 'Compact d’Aurora',
        theme: 'Ouvrir le récit d’expansion',
        promptLabel: 'Ouvrir le récit d’expansion',
        choiceState: 'deferred',
        outcome: 'soutien actif confirmé',
      },
      {
        decisionId: 'turn-8-harbor-support',
        turn: 8,
        regionId: 'harbor',
        clusterLabel: 'Harbor Compact',
        theme: 'Ancrer le soutien régional',
        promptLabel: 'Ancrer le soutien régional',
        choiceState: 'deferred',
        outcome: 'soutien actif confirmé',
      },
    ],
  });

  assert.deepEqual(report.commitmentBundles.followThroughBundlePlan.safeToDeferBundles.entries.map((entry) => [
    entry.clusterLabel,
    entry.deadlineStatus,
    entry.payoffScore,
    entry.revisitRank,
    entry.revisitPriority,
  ]), [
    ['Harbor Compact', 'near-deadline', 5, 1, 'next'],
    ['Compact d’Aurora', 'near-deadline', 2, 2, 'later'],
  ]);
});

test('buildCultureTurnReportDeltas keeps a no-deadline safe defer fallback stable', () => {
  const report = buildCultureTurnReportDeltas({ turn: 2, selectedRegionId: 'quiet-field' });

  assert.deepEqual(report.commitmentBundles.followThroughBundlePlan.safeToDeferBundles, {
    state: 'none',
    summary: 'Aucun bundle culturel sûr à reporter ce tour.',
    primaryDeferId: null,
    primaryMissedWindowConsequence: null,
    primaryMinimalSafeAction: null,
    primaryMinimalActionThreshold: null,
    minimalSafeActionFallback: 'Fallback: aucune action minimale sûre connue pour conserver ce report.',
    missedWindowFallback: 'Fallback: aucune conséquence de fenêtre manquée à afficher sans action reportée prioritaire.',
    priorityFallback: 'Fallback: aucune fenêtre de délai calculable, garder l’ordre stable par risque faible puis culture.',
    entries: [],
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
      promptHistoryDrawer: {
        state: 'quiet',
        summary: 'Aucun historique de prompt culturel à afficher.',
        displayLimit: 5,
        regionId: 'quiet-field',
        currentEntries: [],
        groups: [],
        repetitionSafeguard: 'Aucun prompt courant à protéger contre la répétition.',
        emptyHint: 'Historique léger: comparer seulement les prompts actuels et commencer à mémoriser les décisions.',
      },
      promptFreshnessFilter: {
        state: 'quiet',
        summary: 'Aucun filtre de fraîcheur culturel actif.',
        preferredPromptId: null,
        entries: [],
        fallback: 'Historique court ou ambigu: conserver le classement stable et expliquer la fraîcheur sans masquer les prompts.',
      },
      recommendationRotationPreview: {
        state: 'quiet',
        summary: 'Aucun aperçu de rotation culturelle disponible.',
        entries: [],
        fallback: 'Fallback stable: historique court ou ambigu, conserver les prompts visibles sans forcer la rotation.',
      },
      rotationCommitmentSummary: {
        state: 'quiet',
        summary: 'Aucun résumé d’engagement culturel disponible.',
        selectedPromptId: null,
        entries: [],
      },
      commitmentFollowThroughReminder: {
        state: 'fallback',
        reminderId: 'culture-commitment:follow-through:fallback',
        summary: 'Aucun engagement culturel récent traçable: afficher le prochain choix recommandé sans inventer de promesse passée.',
        sourcePromptLabel: null,
        clusterLabel: null,
        lastTurn: null,
        agePriority: {
          state: 'none',
          label: 'aucun engagement actif',
          ageTurns: 0,
          priority: 0,
          relevance: 'aucune promesse culturelle active à vieillir',
          almostExpired: false,
          stale: false,
        },
        priorityLabel: 'aucun engagement actif · priorité 0/4',
        nextCheck: 'Continuer à surveiller les signaux culturels visibles avant d’annoncer un suivi.',
        expectedAction: 'attendre un engagement culturel explicite avant de rappeler une promesse',
      },
      followThroughBundlePlan: {
        state: 'quiet',
        summary: 'Aucun plan de suivi culturel groupé.',
        bestBundleId: null,
        groups: [],
        cleanupPrompts: [],
        cleanupSummary: 'Aucun prompt de nettoyage culturel à proposer.',
        falloutPreview: {
          state: 'quiet',
          summary: 'Aucun fallout culturel si les bundles restent en place ce tour.',
          priorityBundleId: null,
          affectedCulture: null,
          consequenceType: 'none',
          consequence: 'Aucun fallout immédiat détecté.',
          severity: 0,
          minimalCleanupAction: null,
          entries: [],
        },
        replacementRecommendations: {
          state: 'quiet',
          summary: 'Aucun remplacement culturel nécessaire ce tour.',
          primaryReplacementId: null,
          skipConsequenceSummary: 'Fallback: conséquence au prochain tour non calculable.',
          nextReviewWindow: null,
          rankingFallback: 'Fallback: aucun score disponible, garder les bundles dans l’ordre actuel.',
          entries: [],
        },
        safeToDeferBundles: {
          state: 'none',
          summary: 'Aucun bundle culturel sûr à reporter ce tour.',
          primaryDeferId: null,
          primaryMissedWindowConsequence: null,
          primaryMinimalSafeAction: null,
          primaryMinimalActionThreshold: null,
          minimalSafeActionFallback: 'Fallback: aucune action minimale sûre connue pour conserver ce report.',
          missedWindowFallback: 'Fallback: aucune conséquence de fenêtre manquée à afficher sans action reportée prioritaire.',
          priorityFallback: 'Fallback: aucune fenêtre de délai calculable, garder l’ordre stable par risque faible puis culture.',
          entries: [],
        },
        detailMode: 'Aucun détail individuel à ouvrir.',
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
    turn: 8,
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
    promptHistory: [
      {
        decisionId: 'turn-7-aurora-expansion',
        turn: 7,
        regionId: 'river-gate',
        clusterLabel: 'Compact d’Aurora',
        theme: 'Ouvrir le récit d’expansion',
        promptLabel: 'Ouvrir le récit d’expansion',
        choiceState: 'chosen',
        outcome: 'forum culturel déjà lancé',
      },
    ],
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
  assert.equal(report.commitmentBundles.promptHistoryDrawer.state, 'repeat-warning');
  assert.equal(report.commitmentBundles.promptHistoryDrawer.displayLimit, 5);
  assert.deepEqual(report.commitmentBundles.promptHistoryDrawer.currentEntries.map((entry) => [entry.clusterLabel, entry.repeatState]), [
    ['Compact d’Aurora', 'repeated'],
    ['Harbor Compact', 'near-repeat'],
    ['Ember Guild', 'new'],
  ]);
  assert.match(report.commitmentBundles.promptHistoryDrawer.currentEntries[0].repeatReason, /tour 7/);
  assert.match(report.commitmentBundles.promptHistoryDrawer.currentEntries[0].rotation.defer, /fatigue/);
  assert.match(report.commitmentBundles.promptHistoryDrawer.currentEntries[1].rotation.replace, /Ember Guild/);
  assert.match(report.commitmentBundles.promptHistoryDrawer.repetitionSafeguard, /Rotation courte/);
  assert.equal(report.commitmentBundles.promptHistoryDrawer.groups[0].hasRepeat, true);
  assert.equal(report.commitmentBundles.promptFreshnessFilter.state, 'fresh');
  assert.deepEqual(report.commitmentBundles.promptFreshnessFilter.entries.map((entry) => [entry.clusterLabel, entry.freshnessState]), [
    ['Ember Guild', 'fresh'],
    ['Harbor Compact', 'defer'],
    ['Compact d’Aurora', 'seen'],
  ]);
  assert.match(report.commitmentBundles.promptFreshnessFilter.entries[0].explanation, /fraîche/);
  assert.match(report.commitmentBundles.promptFreshnessFilter.fallback, /Historique suffisant|Historique court/);
  assert.equal(report.commitmentBundles.recommendationRotationPreview.state, 'ready');
  assert.deepEqual(report.commitmentBundles.recommendationRotationPreview.entries.map((entry) => [entry.clusterLabel, entry.rotationState, entry.factor]), [
    ['Ember Guild', 'available-now', 'compatibilité'],
    ['Harbor Compact', 'deferred-freshness', 'historique récent'],
    ['Compact d’Aurora', 'review-soon', 'thème'],
  ]);
  assert.match(report.commitmentBundles.recommendationRotationPreview.entries[1].alternativeLabel, /Préparer|Ouvrir|Renforcer|Observer/);
  assert.match(report.commitmentBundles.recommendationRotationPreview.fallback, /alternative fraîche|Fallback stable/);
  assert.equal(report.commitmentBundles.rotationCommitmentSummary.state, 'caution');
  assert.deepEqual(report.commitmentBundles.rotationCommitmentSummary.entries.map((entry) => [entry.clusterLabel, entry.rotationState, entry.hasUnresolvedDependencies]), [
    ['Ember Guild', 'available-now', true],
    ['Harbor Compact', 'deferred-freshness', true],
    ['Compact d’Aurora', 'review-soon', true],
  ]);
  assert.match(report.commitmentBundles.rotationCommitmentSummary.entries[0].duration, /1 à 2 tours/);
  assert.match(report.commitmentBundles.rotationCommitmentSummary.entries[0].benefit, /verrouille/);
  assert.match(report.commitmentBundles.rotationCommitmentSummary.entries[0].opportunityCost, /narratif\/recherche/);
  assert.match(report.commitmentBundles.rotationCommitmentSummary.entries[1].repeatPolicy, /dépriorisé/);
  assert.equal(report.commitmentBundles.commitmentFollowThroughReminder.state, 'watch');
  assert.match(report.commitmentBundles.commitmentFollowThroughReminder.summary, /engagement à suivre au tour 8/);
  assert.deepEqual(report.commitmentBundles.commitmentFollowThroughReminder.agePriority, {
    state: 'expiring',
    label: 'presque périmé',
    ageTurns: 1,
    priority: 3,
    relevance: 'valider maintenant ou remplacer par une opportunité plus fraîche',
    almostExpired: true,
    stale: false,
  });
  assert.match(report.commitmentBundles.commitmentFollowThroughReminder.priorityLabel, /presque périmé · 1 tour · priorité 3\/4/);
  assert.match(report.commitmentBundles.commitmentFollowThroughReminder.nextCheck, /Décider ce tour/);
  assert.match(report.commitmentBundles.commitmentFollowThroughReminder.expectedAction, /opportunité plus fraîche/);
});
