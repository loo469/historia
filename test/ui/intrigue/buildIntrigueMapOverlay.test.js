import test from 'node:test';
import assert from 'node:assert/strict';

import { Cellule } from '../../../src/domain/intrigue/Cellule.js';
import { OperationClandestine } from '../../../src/domain/intrigue/OperationClandestine.js';
import { buildIntrigueMapOverlay } from '../../../src/ui/intrigue/buildIntrigueMapOverlay.js';

test('buildIntrigueMapOverlay merges intrigue presence and active sabotage threat by location', () => {
  const overlay = buildIntrigueMapOverlay([
    new Cellule({
      id: 'cell-ash-1',
      factionId: 'shadow-league',
      codename: 'Veil',
      locationId: 'ashlands',
      memberIds: ['ag-1'],
      assetIds: ['asset-1'],
      secrecy: 72,
      loyalty: 66,
      exposure: 21,
    }),
    new Cellule({
      id: 'cell-ash-2',
      factionId: 'shadow-league',
      codename: 'Cinder',
      locationId: 'ashlands',
      memberIds: ['ag-2'],
      assetIds: ['asset-2'],
      secrecy: 49,
      loyalty: 55,
      exposure: 74,
      sleeper: true,
    }),
    new Cellule({
      id: 'cell-river-1',
      factionId: 'shadow-league',
      codename: 'Mist',
      locationId: 'riverlands',
      memberIds: ['ag-3'],
      assetIds: ['asset-3'],
      secrecy: 61,
      loyalty: 62,
      exposure: 15,
    }),
    new Cellule({
      id: 'cell-old',
      factionId: 'shadow-league',
      codename: 'Ash',
      locationId: 'north-coast',
      memberIds: ['ag-4'],
      assetIds: ['asset-4'],
      status: 'dismantled',
    }),
  ], [
    new OperationClandestine({
      id: 'op-ash-1',
      celluleId: 'cell-ash-1',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Cut the signal towers',
      theaterId: 'ashlands',
      assignedAgentIds: ['ag-1'],
      requiredAssetIds: ['asset-1'],
      detectionRisk: 20,
      progress: 58,
      heat: 44,
      phase: 'execution',
    }),
    new OperationClandestine({
      id: 'op-river-1',
      celluleId: 'cell-river-1',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Poison the ferries',
      theaterId: 'riverlands',
      assignedAgentIds: ['ag-3'],
      requiredAssetIds: ['asset-3'],
      detectionRisk: 70,
      progress: 20,
      heat: 10,
      phase: 'infiltration',
    }),
    new OperationClandestine({
      id: 'op-river-rumor',
      celluleId: 'cell-river-1',
      targetFactionId: 'sun-empire',
      type: 'rumor',
      objective: 'Spread false orders',
      theaterId: 'riverlands',
      assignedAgentIds: ['ag-3'],
      requiredAssetIds: ['asset-3'],
    }),
    new OperationClandestine({
      id: 'op-old',
      celluleId: 'cell-ash-2',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Burn supply cache',
      theaterId: 'north-coast',
      assignedAgentIds: ['ag-2'],
      requiredAssetIds: ['asset-2'],
      phase: 'completed',
    }),
  ], {
    locationNames: {
      ashlands: 'Ashlands',
      riverlands: 'Riverlands',
    },
  });

  assert.deepEqual(overlay, [
    {
      overlayId: 'intrigue:ashlands',
      locationId: 'ashlands',
      locationName: 'Ashlands',
      label: 'Ashlands, présence medium, risque sabotage medium',
      presenceLevel: 'medium',
      sabotageRiskLevel: 'medium',
      sabotageRiskScore: 61,
      celluleIds: ['cell-ash-1', 'cell-ash-2'],
      operationIds: ['op-ash-1'],
      metrics: {
        celluleCount: 2,
        exposedCellCount: 1,
        sleeperCellCount: 1,
        sabotageOperationCount: 1,
      },
      lowExposureSweepConfidencePreview: {
        state: 'guarded-positive',
        recommended: true,
        coverageBefore: 50,
        coverageAfter: 73,
        confidenceDelta: 23,
        exposureAdded: 10,
        unknownsRemaining: 0,
        postSweepGaps: [],
        nextSafeSweep: null,
        secondSweepCandidates: [],
        secondSweepStopCondition: {
          state: 'no-safe-sweep',
          action: 'stop',
          continueNow: false,
          stopSignal: 'Aucun second sweep sûr n’est disponible dans la fenêtre actuelle.',
          explanation: 'Ne pas enchaîner: attendre un signal lisible avant de rouvrir la zone.',
        },
        thirdSweepRecommendation: {
          state: 'do-nothing',
          action: 'none',
          prepareThirdSweep: false,
          marginalExposureAdded: 0,
          expectedConfidenceGain: 0,
          monitoringRationale: {
            state: 'surveillance-active-sufficient',
            monitoringPreferred: true,
            signalFreshness: 'insufficient',
            heatState: 'stable',
            tradeoff: 'Aucun gain de confiance attendu ne compense une nouvelle exposition.',
            monitoringDurationTurns: 1,
            restartTriggers: [
              'Relancer si un signal frais rouvre une fenêtre sûre.',
              'Continuer à surveiller sans nouveau gap lisible.',
            ],
            sweepRestartComparison: 'Surveiller reste préférable tant qu’aucun gain de confiance concret n’apparaît.',
        monitoringChecklistFocus: {
          signal: null,
          state: 'stable-for-now',
          reason: 'Checklist stable pour l’instant: aucun item ne menace de tomber avant un nouveau signal.',
        },
        monitoringDriftForecast: {
          signal: null,
          state: 'stable-for-now',
          direction: 'no-change',
          reason: 'Aucune dérive probable avant le prochain signal: le calendrier de sweep reste inchangé.',
        },
            monitoringChecklistFocus: {
              signal: null,
              state: 'stable-for-now',
              reason: 'Checklist stable pour l’instant: aucun item ne menace de tomber avant un nouveau signal.',
            },
            monitoringDriftForecast: {
              signal: null,
              state: 'stable-for-now',
              direction: 'no-change',
              reason: 'Aucune dérive probable avant le prochain signal: le calendrier de sweep reste inchangé.',
            },
        monitoringChecklist: [
          {
            signal: 'Nouveau gap',
            status: 'à surveiller',
            note: 'Relancer seulement avec un gap fog-safe lisible.',
          },
          {
            signal: 'Fraîcheur signal',
            status: 'à surveiller',
            note: 'Confirmer que le signal n’est pas périmé.',
          },
          {
            signal: 'Exposition',
            status: 'calme',
            note: 'Ne pas ajouter d’exposition sans gain concret.',
          },
        ],
            monitoringChecklist: [
              {
                signal: 'Nouveau gap',
                status: 'à surveiller',
                note: 'Relancer seulement avec un gap fog-safe lisible.',
              },
              {
                signal: 'Fraîcheur signal',
                status: 'à surveiller',
                note: 'Confirmer que le signal n’est pas périmé.',
              },
              {
                signal: 'Exposition',
                status: 'calme',
                note: 'Ne pas ajouter d’exposition sans gain concret.',
              },
            ],
          },
          rationale: 'Aucun troisième sweep à préparer: la seconde passe n’a pas de fenêtre sûre.',
        },
        summary: 'Confiance +23 pts pour +10 exposition; 0 inconnue restante.',
      },
      style: {
        presence: {
          marker: '◑',
          color: '#7C3AED',
          opacity: 0.5,
        },
        risk: {
          stroke: '#D97706',
          fill: '#FCD34D',
          emphasis: 'elevated',
        },
      },
    },
    {
      overlayId: 'intrigue:riverlands',
      locationId: 'riverlands',
      locationName: 'Riverlands',
      label: 'Riverlands, présence low, risque sabotage low',
      presenceLevel: 'low',
      sabotageRiskLevel: 'low',
      sabotageRiskScore: 20,
      celluleIds: ['cell-river-1'],
      operationIds: ['op-river-1'],
      metrics: {
        celluleCount: 1,
        exposedCellCount: 0,
        sleeperCellCount: 0,
        sabotageOperationCount: 1,
      },
      lowExposureSweepConfidencePreview: {
        state: 'low-exposure-positive',
        recommended: true,
        coverageBefore: 0,
        coverageAfter: 31,
        confidenceDelta: 31,
        exposureAdded: 5,
        unknownsRemaining: 0,
        postSweepGaps: [],
        nextSafeSweep: null,
        secondSweepCandidates: [],
        secondSweepStopCondition: {
          state: 'no-safe-sweep',
          action: 'stop',
          continueNow: false,
          stopSignal: 'Aucun second sweep sûr n’est disponible dans la fenêtre actuelle.',
          explanation: 'Ne pas enchaîner: attendre un signal lisible avant de rouvrir la zone.',
        },
        thirdSweepRecommendation: {
          state: 'do-nothing',
          action: 'none',
          prepareThirdSweep: false,
          marginalExposureAdded: 0,
          expectedConfidenceGain: 0,
          monitoringRationale: {
            state: 'surveillance-active-sufficient',
            monitoringPreferred: true,
            signalFreshness: 'insufficient',
            heatState: 'stable',
            tradeoff: 'Aucun gain de confiance attendu ne compense une nouvelle exposition.',
            monitoringDurationTurns: 1,
            restartTriggers: [
              'Relancer si un signal frais rouvre une fenêtre sûre.',
              'Continuer à surveiller sans nouveau gap lisible.',
            ],
            sweepRestartComparison: 'Surveiller reste préférable tant qu’aucun gain de confiance concret n’apparaît.',
        monitoringChecklistFocus: {
          signal: null,
          state: 'stable-for-now',
          reason: 'Checklist stable pour l’instant: aucun item ne menace de tomber avant un nouveau signal.',
        },
        monitoringDriftForecast: {
          signal: null,
          state: 'stable-for-now',
          direction: 'no-change',
          reason: 'Aucune dérive probable avant le prochain signal: le calendrier de sweep reste inchangé.',
        },
            monitoringChecklistFocus: {
              signal: null,
              state: 'stable-for-now',
              reason: 'Checklist stable pour l’instant: aucun item ne menace de tomber avant un nouveau signal.',
            },
            monitoringDriftForecast: {
              signal: null,
              state: 'stable-for-now',
              direction: 'no-change',
              reason: 'Aucune dérive probable avant le prochain signal: le calendrier de sweep reste inchangé.',
            },
        monitoringChecklist: [
          {
            signal: 'Nouveau gap',
            status: 'à surveiller',
            note: 'Relancer seulement avec un gap fog-safe lisible.',
          },
          {
            signal: 'Fraîcheur signal',
            status: 'à surveiller',
            note: 'Confirmer que le signal n’est pas périmé.',
          },
          {
            signal: 'Exposition',
            status: 'calme',
            note: 'Ne pas ajouter d’exposition sans gain concret.',
          },
        ],
            monitoringChecklist: [
              {
                signal: 'Nouveau gap',
                status: 'à surveiller',
                note: 'Relancer seulement avec un gap fog-safe lisible.',
              },
              {
                signal: 'Fraîcheur signal',
                status: 'à surveiller',
                note: 'Confirmer que le signal n’est pas périmé.',
              },
              {
                signal: 'Exposition',
                status: 'calme',
                note: 'Ne pas ajouter d’exposition sans gain concret.',
              },
            ],
          },
          rationale: 'Aucun troisième sweep à préparer: la seconde passe n’a pas de fenêtre sûre.',
        },
        summary: 'Confiance +31 pts pour +5 exposition; 0 inconnue restante.',
      },
      style: {
        presence: {
          marker: '◔',
          color: '#2563EB',
          opacity: 0.35,
        },
        risk: {
          stroke: '#2563EB',
          fill: '#93C5FD',
          emphasis: 'normal',
        },
      },
    },
  ]);
});

test('buildIntrigueMapOverlay supports plain payloads and style overrides', () => {
  const overlay = buildIntrigueMapOverlay([
    {
      id: 'cell-delta-1',
      factionId: 'shadow-league',
      codename: 'Wake',
      locationId: 'delta',
      memberIds: ['ag-1'],
      assetIds: ['asset-1'],
      secrecy: 60,
      loyalty: 60,
      exposure: 10,
    },
  ], [
    {
      id: 'op-delta-1',
      celluleId: 'cell-delta-1',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Disable the sluice gates',
      theaterId: 'delta',
      assignedAgentIds: ['ag-1'],
      requiredAssetIds: ['asset-1'],
      detectionRisk: 5,
      progress: 90,
      heat: 30,
      phase: 'execution',
    },
  ], {
    styleByPresence: {
      low: { marker: '✦', color: '#10B981', opacity: 0.7 },
    },
    styleByRisk: {
      high: { stroke: '#111827', fill: '#F59E0B', emphasis: 'critical' },
    },
  });

  assert.deepEqual(overlay[0].style, {
    presence: {
      marker: '✦',
      color: '#10B981',
      opacity: 0.7,
    },
    risk: {
      stroke: '#111827',
      fill: '#F59E0B',
      emphasis: 'critical',
    },
  });
});

test('buildIntrigueMapOverlay exposes bounded low-exposure confidence deltas and neutral states', () => {
  const overlay = buildIntrigueMapOverlay([
    {
      id: 'cell-covered',
      factionId: 'shadow-league',
      codename: 'Covered',
      locationId: 'covered',
      memberIds: ['ag-1'],
      assetIds: ['asset-1'],
      exposure: 80,
    },
    {
      id: 'cell-hot-1',
      factionId: 'shadow-league',
      codename: 'Hot one',
      locationId: 'hot',
      memberIds: ['ag-2'],
      assetIds: ['asset-2'],
      sleeper: true,
      exposure: 20,
    },
    {
      id: 'cell-hot-2',
      factionId: 'shadow-league',
      codename: 'Hot two',
      locationId: 'hot',
      memberIds: ['ag-3'],
      assetIds: ['asset-3'],
      exposure: 20,
    },
  ], [
    {
      id: 'op-covered',
      celluleId: 'cell-covered',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Probe visible route',
      theaterId: 'covered',
      assignedAgentIds: ['ag-1'],
      requiredAssetIds: ['asset-1'],
      detectionRisk: 80,
      progress: 0,
      heat: 0,
    },
    {
      id: 'op-hot',
      celluleId: 'cell-hot-1',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Mask hot cache',
      theaterId: 'hot',
      assignedAgentIds: ['ag-2'],
      requiredAssetIds: ['asset-2'],
      detectionRisk: 5,
      progress: 100,
      heat: 100,
    },
  ]);

  const covered = overlay.find((entry) => entry.locationId === 'covered');
  const hot = overlay.find((entry) => entry.locationId === 'hot');

  assert.deepEqual(covered.lowExposureSweepConfidencePreview, {
    state: 'neutral',
    recommended: false,
    coverageBefore: 0,
    coverageAfter: 0,
    confidenceDelta: 0,
    exposureAdded: 0,
    unknownsRemaining: 0,
    postSweepGaps: [],
    nextSafeSweep: null,
    secondSweepCandidates: [],
    secondSweepStopCondition: {
      state: 'no-safe-sweep',
      action: 'stop',
      continueNow: false,
      stopSignal: 'Aucun second sweep sûr n’est disponible dans la fenêtre actuelle.',
      explanation: 'Ne pas enchaîner: attendre un signal lisible avant de rouvrir la zone.',
    },
    thirdSweepRecommendation: {
      state: 'do-nothing',
      action: 'none',
      prepareThirdSweep: false,
      marginalExposureAdded: 0,
      expectedConfidenceGain: 0,
      monitoringRationale: {
        state: 'surveillance-active-sufficient',
        monitoringPreferred: true,
        signalFreshness: 'insufficient',
        heatState: 'stable',
        tradeoff: 'Aucun gain de confiance attendu ne compense une nouvelle exposition.',
        monitoringDurationTurns: 1,
        restartTriggers: [
          'Relancer si un signal frais rouvre une fenêtre sûre.',
          'Continuer à surveiller sans nouveau gap lisible.',
        ],
        sweepRestartComparison: 'Surveiller reste préférable tant qu’aucun gain de confiance concret n’apparaît.',
        monitoringChecklistFocus: {
          signal: null,
          state: 'stable-for-now',
          reason: 'Checklist stable pour l’instant: aucun item ne menace de tomber avant un nouveau signal.',
        },
        monitoringDriftForecast: {
          signal: null,
          state: 'stable-for-now',
          direction: 'no-change',
          reason: 'Aucune dérive probable avant le prochain signal: le calendrier de sweep reste inchangé.',
        },
        monitoringChecklist: [
          {
            signal: 'Nouveau gap',
            status: 'à surveiller',
            note: 'Relancer seulement avec un gap fog-safe lisible.',
          },
          {
            signal: 'Fraîcheur signal',
            status: 'à surveiller',
            note: 'Confirmer que le signal n’est pas périmé.',
          },
          {
            signal: 'Exposition',
            status: 'calme',
            note: 'Ne pas ajouter d’exposition sans gain concret.',
          },
        ],
      },
      rationale: 'Aucun troisième sweep à préparer: la seconde passe n’a pas de fenêtre sûre.',
    },
    summary: 'Aucun sweep low-exposure recommandé: signal insuffisant ou couverture déjà lisible.',
  });
  assert.equal(hot.lowExposureSweepConfidencePreview.state, 'watch-exposure');
  assert.equal(hot.lowExposureSweepConfidencePreview.recommended, true);
  assert.equal(hot.lowExposureSweepConfidencePreview.coverageBefore, 0);
  assert.equal(hot.lowExposureSweepConfidencePreview.coverageAfter, 26);
  assert.equal(hot.lowExposureSweepConfidencePreview.confidenceDelta, 26);
  assert.equal(hot.lowExposureSweepConfidencePreview.exposureAdded, 12);
  assert.equal(hot.lowExposureSweepConfidencePreview.unknownsRemaining, 1);
  assert.deepEqual(hot.lowExposureSweepConfidencePreview.postSweepGaps, [
    {
      key: 'unconfirmed-presence',
      label: 'Présence non confirmée',
      reason: '1 signal restera à qualifier après le sweep.',
    },
    {
      key: 'sleeper-uncertainty',
      label: 'Dormance encore possible',
      reason: 'Le sweep bas-risque peut confirmer la zone sans lever toute ambiguïté dormante.',
    },
    {
      key: 'residual-sabotage-pressure',
      label: 'Pression sabotage résiduelle',
      reason: 'Le risque visible reste élevé; éviter toute attribution ou cible cachée après la passe.',
    },
  ]);
  assert.deepEqual(hot.lowExposureSweepConfidencePreview.nextSafeSweep, {
    targetGapKey: 'sleeper-uncertainty',
    targetGapLabel: 'Dormance encore possible',
    coverageValue: 1,
    estimatedExposureAdded: 8,
    estimatedHeat: 12,
    safetyReason: 'Passe courte centrée sur la dormance: couverture limitée mais exposition minimale.',
  });
  assert.deepEqual(hot.lowExposureSweepConfidencePreview.secondSweepStopCondition, {
    state: 'continue-now',
    action: 'continue',
    continueNow: true,
    stopSignal: 'Continuer tant que l’exposition ajoutée reste ≤ 8 et le heat ≤ 12.',
    explanation: 'Le second sweep recommandé couvre le gap prioritaire avec une exposition contenue.',
  });
  assert.deepEqual(hot.lowExposureSweepConfidencePreview.thirdSweepRecommendation, {
    state: 'stop-after-second',
    action: 'stop',
    prepareThirdSweep: false,
    marginalExposureAdded: 9,
    expectedConfidenceGain: 3,
    monitoringRationale: {
      state: 'low-confidence-gain',
      monitoringPreferred: true,
      signalFreshness: 'weak',
      heatState: 'contained',
      tradeoff: 'Le gain de confiance restant est inférieur au coût d’exposition marginal.',
      monitoringDurationTurns: 2,
      restartTriggers: [
        'Relancer si deux signaux frais augmentent le gain attendu.',
        'Continuer à surveiller tant que le gain reste marginal.',
      ],
      sweepRestartComparison: 'Surveiller bat la relance: +3 confiance attendue reste trop faible pour +9 exposition.',
      monitoringChecklistFocus: {
        signal: 'Signaux frais',
        state: 'earliest-fragile',
        reason: 'Dépendance non sécurisée: sans signaux convergents, le gain reste marginal.',
      },
      monitoringDriftForecast: {
        signal: 'Gain confiance',
        state: 'drift-risk',
        direction: 'advances-next-sweep',
        reason: 'Des signaux frais peuvent faire passer le gain attendu au-dessus de +3.',
      },
      monitoringChecklist: [
        {
          signal: 'Gain confiance',
          status: 'à surveiller',
          note: 'Relancer si le gain dépasse +3.',
        },
        {
          signal: 'Signaux frais',
          status: 'déclencheur potentiel',
          note: 'Deux signaux convergents peuvent rouvrir une sweep.',
        },
        {
          signal: 'Heat',
          status: 'calme',
          note: 'Surveillance suffisante tant que le heat reste contenu.',
        },
      ],
    },
    rationale: 'Arrêter après la seconde passe: le gain restant serait trop faible par rapport à l’exposition marginale.',
  });
  assert.deepEqual(hot.lowExposureSweepConfidencePreview.secondSweepCandidates, [
    {
      targetGapKey: 'residual-sabotage-pressure',
      targetGapLabel: 'Pression sabotage résiduelle',
      coverageValue: 2,
      estimatedExposureAdded: 12,
      estimatedHeat: 18,
      coveragePerExposureScore: 6.7,
      recommended: false,
      reason: 'Vérifie la pression sabotage visible sans attribuer de cible cachée.',
    },
    {
      targetGapKey: 'sleeper-uncertainty',
      targetGapLabel: 'Dormance encore possible',
      coverageValue: 1,
      estimatedExposureAdded: 8,
      estimatedHeat: 12,
      coveragePerExposureScore: 5,
      recommended: true,
      reason: 'Passe courte centrée sur la dormance: couverture limitée mais exposition minimale.',
    },
    {
      targetGapKey: 'unconfirmed-presence',
      targetGapLabel: 'Présence non confirmée',
      coverageValue: 1,
      estimatedExposureAdded: 10,
      estimatedHeat: 15,
      coveragePerExposureScore: 4,
      recommended: false,
      reason: "Qualifie 1 signal restant sans élargir la fenêtre d'exposition.",
    },
  ]);
  assert.match(hot.lowExposureSweepConfidencePreview.summary, /Confiance \+26 pts pour \+12 exposition/);
});

test('buildIntrigueMapOverlay keeps post-sweep gap explanations stable and neutral when complete', () => {
  const overlay = buildIntrigueMapOverlay([
    {
      id: 'cell-calm-1',
      factionId: 'shadow-league',
      codename: 'Calm',
      locationId: 'calm',
      memberIds: ['ag-1'],
      assetIds: ['asset-1'],
      exposure: 10,
    },
    {
      id: 'cell-calm-2',
      factionId: 'shadow-league',
      codename: 'Clear',
      locationId: 'calm',
      memberIds: ['ag-2'],
      assetIds: ['asset-2'],
      exposure: 80,
    },
  ], [
    {
      id: 'op-calm',
      celluleId: 'cell-calm-1',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Probe safe lane',
      theaterId: 'calm',
      assignedAgentIds: ['ag-1'],
      requiredAssetIds: ['asset-1'],
      detectionRisk: 70,
      progress: 20,
      heat: 10,
    },
  ]);

  assert.deepEqual(overlay[0].lowExposureSweepConfidencePreview.postSweepGaps, []);
  assert.equal(overlay[0].lowExposureSweepConfidencePreview.nextSafeSweep, null);
  assert.deepEqual(overlay[0].lowExposureSweepConfidencePreview.secondSweepCandidates, []);
  assert.equal(overlay[0].lowExposureSweepConfidencePreview.secondSweepStopCondition.state, 'no-safe-sweep');
  assert.equal(overlay[0].lowExposureSweepConfidencePreview.thirdSweepRecommendation.state, 'do-nothing');
  assert.equal(overlay[0].lowExposureSweepConfidencePreview.unknownsRemaining, 0);
});

test('buildIntrigueMapOverlay recommends preparing a third sweep only when residual value beats marginal exposure', () => {
  const preview = buildIntrigueMapOverlay([
    ...Array.from({ length: 4 }, (_, index) => ({
      id: `cell-wide-${index}`,
      factionId: 'shadow-league',
      codename: `Wide ${index}`,
      locationId: 'wide',
      memberIds: [`ag-${index}`],
      assetIds: [`asset-${index}`],
      exposure: 10,
    })),
  ], [
    {
      id: 'op-wide',
      celluleId: 'cell-wide-0',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Probe wide residuals',
      theaterId: 'wide',
      assignedAgentIds: ['ag-1'],
      requiredAssetIds: ['asset-1'],
      detectionRisk: 20,
      progress: 80,
      heat: 80,
    },
  ])[0].lowExposureSweepConfidencePreview;

  assert.equal(preview.secondSweepStopCondition.state, 'continue-now');
  assert.deepEqual(preview.thirdSweepRecommendation, {
    state: 'prepare-third-safe-sweep',
    action: 'prepare',
    prepareThirdSweep: true,
    marginalExposureAdded: 9,
    expectedConfidenceGain: 14,
    monitoringRationale: {
      state: 'safe-action-available',
      monitoringPreferred: false,
      signalFreshness: 'fresh-enough',
      heatState: 'contained',
      tradeoff: 'Le gain de confiance attendu dépasse l’exposition marginale; ne pas rester inactif.',
      monitoringDurationTurns: 0,
      restartTriggers: [
        'Relancer maintenant si la fenêtre reste sûre.',
        'Basculer en surveillance si le heat remonte avant l’ordre.',
      ],
      sweepRestartComparison: 'Relancer bat la surveillance: +14 confiance attendue pour +9 exposition.',
      monitoringChecklistFocus: {
        signal: 'Fenêtre sûre',
        state: 'earliest-fragile',
        reason: 'Seuil proche: si la fenêtre se ferme, la relance sûre disparaît en premier.',
      },
      monitoringDriftForecast: {
        signal: 'Fenêtre sûre',
        state: 'drift-risk',
        direction: 'retards-next-sweep',
        reason: 'Si la fenêtre sûre se referme, le prochain sweep doit attendre un nouveau créneau low-risk.',
      },
      monitoringChecklist: [
        {
          signal: 'Fenêtre sûre',
          status: 'déclencheur potentiel',
          note: 'Relancer si elle reste stable.',
        },
        {
          signal: 'Heat',
          status: 'calme',
          note: 'Basculer en surveillance si le heat remonte.',
        },
        {
          signal: 'Gain confiance',
          status: 'déclencheur potentiel',
          note: '+14 attendu dépasse +9 exposition.',
        },
      ],
    },
    rationale: 'Préparer une troisième passe prudente: 2 inconnues resteraient et le gain de confiance attendu dépasse l’exposition marginale.',
  });
});

test('buildIntrigueMapOverlay marks second sweep stop conditions for signal and exposure limits', () => {
  const needsSignal = buildIntrigueMapOverlay([
    {
      id: 'cell-pressure-1',
      factionId: 'shadow-league',
      codename: 'Pressure',
      locationId: 'pressure',
      memberIds: ['ag-1'],
      assetIds: ['asset-1'],
      exposure: 10,
    },
  ], [
    {
      id: 'op-pressure',
      celluleId: 'cell-pressure-1',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Probe pressure',
      theaterId: 'pressure',
      assignedAgentIds: ['ag-1'],
      requiredAssetIds: ['asset-1'],
      detectionRisk: 5,
      progress: 100,
      heat: 100,
    },
  ])[0].lowExposureSweepConfidencePreview;

  assert.equal(needsSignal.nextSafeSweep.targetGapKey, 'residual-sabotage-pressure');
  assert.deepEqual(needsSignal.secondSweepStopCondition, {
    state: 'needs-fresh-signal',
    action: 'wait-for-signal',
    continueNow: false,
    stopSignal: 'Stop tant qu’aucun nouveau signal bas-risque ne justifie de rouvrir la pression sabotage.',
    explanation: 'La couverture utile est déjà lisible; attendre un signal frais évite une exposition gratuite.',
  });
  assert.equal(needsSignal.thirdSweepRecommendation.state, 'monitor-only');
  assert.deepEqual(needsSignal.thirdSweepRecommendation.monitoringRationale, {
    state: 'await-fresh-signal',
    monitoringPreferred: true,
    signalFreshness: 'needs-refresh',
    heatState: 'contained',
    tradeoff: 'Sans signal frais, une nouvelle sweep ajouterait de l’exposition sans gain fiable.',
    monitoringDurationTurns: 2,
    restartTriggers: [
      'Relancer si un signal frais confirme un gap low-risk.',
      'Continuer à surveiller si la fraîcheur reste insuffisante.',
    ],
    sweepRestartComparison: 'Surveiller bat la relance: le signal est trop ancien pour justifier une nouvelle exposition.',
    monitoringChecklistFocus: {
      signal: 'Fraîcheur signal',
      state: 'earliest-fragile',
      reason: 'Durée restante: le signal périme avant que la fenêtre low-risk soit confirmée.',
    },
    monitoringDriftForecast: {
      signal: 'Fraîcheur signal',
      state: 'drift-risk',
      direction: 'retards-next-sweep',
      reason: 'Le signal risque de périmer avant confirmation, ce qui retarde la prochaine relance sûre.',
    },
    monitoringChecklist: [
      {
        signal: 'Fraîcheur signal',
        status: 'à surveiller',
        note: 'Attendre un signal récent avant reprise.',
      },
      {
        signal: 'Fenêtre low-risk',
        status: 'à surveiller',
        note: 'Relancer seulement si un gap lisible réapparaît.',
      },
      {
        signal: 'Exposition',
        status: 'calme',
        note: 'Rester sous +8 exposition marginale.',
      },
    ],
  });

  const tooExposed = buildIntrigueMapOverlay([
    ...Array.from({ length: 6 }, (_, index) => ({
      id: `cell-burn-${index}`,
      factionId: 'shadow-league',
      codename: `Burn ${index}`,
      locationId: 'burn',
      memberIds: [`ag-${index}`],
      assetIds: [`asset-${index}`],
      sleeper: index < 4,
      exposure: 10,
    })),
  ], [
    {
      id: 'op-burn',
      celluleId: 'cell-burn-0',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Probe burn limit',
      theaterId: 'burn',
      assignedAgentIds: ['ag-1'],
      requiredAssetIds: ['asset-1'],
      detectionRisk: 5,
      progress: 100,
      heat: 100,
    },
  ])[0].lowExposureSweepConfidencePreview;

  assert.equal(tooExposed.secondSweepStopCondition.state, 'exposure-too-high');
  assert.equal(tooExposed.secondSweepStopCondition.continueNow, false);
  assert.match(tooExposed.secondSweepStopCondition.stopSignal, /Stop si le second sweep ajoute/);
  assert.equal(tooExposed.thirdSweepRecommendation.state, 'stop-after-second');
  assert.equal(tooExposed.thirdSweepRecommendation.monitoringRationale.state, 'heat-too-high');
});

test('buildIntrigueMapOverlay rejects invalid inputs', () => {
  assert.throws(() => buildIntrigueMapOverlay(null), /cellules must be an array/);
  assert.throws(() => buildIntrigueMapOverlay([], null), /operations must be an array/);
  assert.throws(() => buildIntrigueMapOverlay([null]), /Cellule instances or plain objects/);
  assert.throws(() => buildIntrigueMapOverlay([], [null]), /OperationClandestine instances or plain objects/);
  assert.throws(() => buildIntrigueMapOverlay([], [], null), /options must be an object/);
  assert.throws(() => buildIntrigueMapOverlay([], [], { styleByPresence: [] }), /styleByPresence must be an object/);
  assert.throws(() => buildIntrigueMapOverlay([], [], { styleByRisk: [] }), /styleByRisk must be an object/);
  assert.throws(() => buildIntrigueMapOverlay([], [], { locationNames: [] }), /locationNames must be an object/);
});
