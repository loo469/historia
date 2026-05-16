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
        preventiveAction: {
          action: 'hold-monitoring',
          targetSignal: null,
          windowEffect: 'maintains-safe-window',
          reason: 'Aucune micro-action requise: la checklist reste stable avant le prochain signal.',
        },
        preventiveRecoveryState: {
          state: 'monitor-only',
          targetSignal: null,
          nextDecision: 'continue-monitoring',
          reason: 'La checklist reste stable: maintenir le monitoring sans nouvelle exposition.',
        },
        postRecoverySafetyMargin: {
          level: 'insufficient-data',
          fastestConsumingSignal: null,
          nextAction: 'reinforce-monitoring',
          reason: 'Données de dérive insuffisantes: renforcer le monitoring avant de mesurer une vraie marge.',
        },
        postRecoveryMarginDecay: {
          state: 'insufficient-data',
          responsibleSignal: null,
          trend: 'unknown',
          recommendedAction: 'postpone',
          reason: 'Dérive insuffisamment lisible: reporter le sweep et garder le monitoring actif.',
        },
        monitoringMarginResponsePriority: {
          response: 'postpone-neutral',
          priorityFactor: 'Données insuffisantes',
          label: 'Priorité: reporter sans urgence.',
          reason: 'Marge non exploitable maintenant; maintenir le monitoring sans révéler de cible.',
        },
        monitoringSafeCadence: {
          cadence: 'wait-no-urgency',
          cadenceFactor: 'Données insuffisantes',
          label: 'Cadence: attendre sans urgence.',
          reason: 'Aucune fenêtre sûre immédiate: maintenir la surveillance sans forcer le rythme.',
        },
        monitoringMinimalResumeSignal: {
          prerequisite: 'sufficient-margin',
          visibleFactor: 'Données insuffisantes',
          action: 'maintain-surveillance',
          label: 'Signal minimal: marge suffisante.',
          reason: 'Maintenir la surveillance jusqu’à une marge lisible, sans forcer la reprise.',
        },
        resumedConstrainedSweepResult: {
          result: 'fragile-resume',
          visibleFactor: 'Données insuffisantes',
          action: 'maintain-surveillance',
          label: 'Résultat: reprise fragile.',
          reason: 'La marge reste trop peu lisible: maintenir la surveillance avant une nouvelle passe.',
        },
        followUpHeatDebt: {
          debt: 'next-follow-up-blocked',
          visibleFactor: 'Marge restante',
          action: 'maintain-surveillance',
          label: 'Dette heat: suivi bloqué.',
          reason: 'Marge restante trop peu lisible: maintenir la surveillance avant d’ajouter du heat.',
        },
        followUpCoolingWindow: {
          window: 'mandatory-cooling',
          visibleFactor: 'Marge restante',
          action: 'refresh-signal',
          label: 'Refroidissement: obligatoire.',
          reason: 'La fenêtre reste illisible: rafraîchir le signal visible avant le prochain suivi.',
        },
        activeObservationResumeSignal: {
          timing: 'resume-later-information-risk',
          visibleFactor: 'Marge restante',
          action: 'refresh-signal',
          label: 'Observation: reprendre plus tard.',
          reason: 'Attendre protège la fenêtre, mais le signal peut perdre en fraîcheur: rafraîchir avant reprise.',
        },
        firstSafeObservationTarget: {
          target: 'no-safe-target',
          visibleFactor: 'Zone brouillée',
          action: 'refresh-signal',
          label: 'Cible observation: aucune sûre.',
          reason: 'La zone reste brouillée: rafraîchir le signal avant de choisir une première cible active.',
        },
        observationBroadeningSignal: {
          broadening: 'stay-limited-target',
          visibleConstraint: 'Zone brouillée',
          action: 'refresh-signal',
          label: 'Élargissement: rester limité.',
          reason: 'La zone brouillée rend l’extension trop large: rafraîchir le signal avant tout élargissement.',
        },
        observationBroadeningTradeoff: {
          tradeoff: 'exposure-too-high',
          visibleFactor: 'Zone brouillée',
          action: 'wait-for-clearer-coverage',
          label: 'Compromis: attendre.',
          message: 'Attendre: la zone brouillée ajouterait de l’exposition sans couverture fiable.',
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
            preventiveAction: {
              action: 'hold-monitoring',
              targetSignal: null,
              windowEffect: 'maintains-safe-window',
              reason: 'Aucune micro-action requise: la checklist reste stable avant le prochain signal.',
            },
            preventiveRecoveryState: {
              state: 'monitor-only',
              targetSignal: null,
              nextDecision: 'continue-monitoring',
              reason: 'La checklist reste stable: maintenir le monitoring sans nouvelle exposition.',
            },
            postRecoverySafetyMargin: {
              level: 'insufficient-data',
              fastestConsumingSignal: null,
              nextAction: 'reinforce-monitoring',
              reason: 'Données de dérive insuffisantes: renforcer le monitoring avant de mesurer une vraie marge.',
            },
            postRecoveryMarginDecay: {
              state: 'insufficient-data',
              responsibleSignal: null,
              trend: 'unknown',
              recommendedAction: 'postpone',
              reason: 'Dérive insuffisamment lisible: reporter le sweep et garder le monitoring actif.',
            },
            monitoringMarginResponsePriority: {
              response: 'postpone-neutral',
              priorityFactor: 'Données insuffisantes',
              label: 'Priorité: reporter sans urgence.',
              reason: 'Marge non exploitable maintenant; maintenir le monitoring sans révéler de cible.',
            },
            monitoringSafeCadence: {
              cadence: 'wait-no-urgency',
              cadenceFactor: 'Données insuffisantes',
              label: 'Cadence: attendre sans urgence.',
              reason: 'Aucune fenêtre sûre immédiate: maintenir la surveillance sans forcer le rythme.',
            },
            monitoringMinimalResumeSignal: {
              prerequisite: 'sufficient-margin',
              visibleFactor: 'Données insuffisantes',
              action: 'maintain-surveillance',
              label: 'Signal minimal: marge suffisante.',
              reason: 'Maintenir la surveillance jusqu’à une marge lisible, sans forcer la reprise.',
            },
            resumedConstrainedSweepResult: {
              result: 'fragile-resume',
              visibleFactor: 'Données insuffisantes',
              action: 'maintain-surveillance',
              label: 'Résultat: reprise fragile.',
              reason: 'La marge reste trop peu lisible: maintenir la surveillance avant une nouvelle passe.',
            },
            followUpHeatDebt: {
              debt: 'next-follow-up-blocked',
              visibleFactor: 'Marge restante',
              action: 'maintain-surveillance',
              label: 'Dette heat: suivi bloqué.',
              reason: 'Marge restante trop peu lisible: maintenir la surveillance avant d’ajouter du heat.',
            },
            followUpCoolingWindow: {
              window: 'mandatory-cooling',
              visibleFactor: 'Marge restante',
              action: 'refresh-signal',
              label: 'Refroidissement: obligatoire.',
              reason: 'La fenêtre reste illisible: rafraîchir le signal visible avant le prochain suivi.',
            },
            activeObservationResumeSignal: {
              timing: 'resume-later-information-risk',
              visibleFactor: 'Marge restante',
              action: 'refresh-signal',
              label: 'Observation: reprendre plus tard.',
              reason: 'Attendre protège la fenêtre, mais le signal peut perdre en fraîcheur: rafraîchir avant reprise.',
            },
            firstSafeObservationTarget: {
              target: 'no-safe-target',
              visibleFactor: 'Zone brouillée',
              action: 'refresh-signal',
              label: 'Cible observation: aucune sûre.',
              reason: 'La zone reste brouillée: rafraîchir le signal avant de choisir une première cible active.',
            },
            observationBroadeningSignal: {
              broadening: 'stay-limited-target',
              visibleConstraint: 'Zone brouillée',
              action: 'refresh-signal',
              label: 'Élargissement: rester limité.',
              reason: 'La zone brouillée rend l’extension trop large: rafraîchir le signal avant tout élargissement.',
            },
            observationBroadeningTradeoff: {
              tradeoff: 'exposure-too-high',
              visibleFactor: 'Zone brouillée',
              action: 'wait-for-clearer-coverage',
              label: 'Compromis: attendre.',
              message: 'Attendre: la zone brouillée ajouterait de l’exposition sans couverture fiable.',
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
        preventiveAction: {
          action: 'hold-monitoring',
          targetSignal: null,
          windowEffect: 'maintains-safe-window',
          reason: 'Aucune micro-action requise: la checklist reste stable avant le prochain signal.',
        },
        preventiveRecoveryState: {
          state: 'monitor-only',
          targetSignal: null,
          nextDecision: 'continue-monitoring',
          reason: 'La checklist reste stable: maintenir le monitoring sans nouvelle exposition.',
        },
        postRecoverySafetyMargin: {
          level: 'insufficient-data',
          fastestConsumingSignal: null,
          nextAction: 'reinforce-monitoring',
          reason: 'Données de dérive insuffisantes: renforcer le monitoring avant de mesurer une vraie marge.',
        },
        postRecoveryMarginDecay: {
          state: 'insufficient-data',
          responsibleSignal: null,
          trend: 'unknown',
          recommendedAction: 'postpone',
          reason: 'Dérive insuffisamment lisible: reporter le sweep et garder le monitoring actif.',
        },
        monitoringMarginResponsePriority: {
          response: 'postpone-neutral',
          priorityFactor: 'Données insuffisantes',
          label: 'Priorité: reporter sans urgence.',
          reason: 'Marge non exploitable maintenant; maintenir le monitoring sans révéler de cible.',
        },
        monitoringSafeCadence: {
          cadence: 'wait-no-urgency',
          cadenceFactor: 'Données insuffisantes',
          label: 'Cadence: attendre sans urgence.',
          reason: 'Aucune fenêtre sûre immédiate: maintenir la surveillance sans forcer le rythme.',
        },
        monitoringMinimalResumeSignal: {
          prerequisite: 'sufficient-margin',
          visibleFactor: 'Données insuffisantes',
          action: 'maintain-surveillance',
          label: 'Signal minimal: marge suffisante.',
          reason: 'Maintenir la surveillance jusqu’à une marge lisible, sans forcer la reprise.',
        },
        resumedConstrainedSweepResult: {
          result: 'fragile-resume',
          visibleFactor: 'Données insuffisantes',
          action: 'maintain-surveillance',
          label: 'Résultat: reprise fragile.',
          reason: 'La marge reste trop peu lisible: maintenir la surveillance avant une nouvelle passe.',
        },
        followUpHeatDebt: {
          debt: 'next-follow-up-blocked',
          visibleFactor: 'Marge restante',
          action: 'maintain-surveillance',
          label: 'Dette heat: suivi bloqué.',
          reason: 'Marge restante trop peu lisible: maintenir la surveillance avant d’ajouter du heat.',
        },
        followUpCoolingWindow: {
          window: 'mandatory-cooling',
          visibleFactor: 'Marge restante',
          action: 'refresh-signal',
          label: 'Refroidissement: obligatoire.',
          reason: 'La fenêtre reste illisible: rafraîchir le signal visible avant le prochain suivi.',
        },
        activeObservationResumeSignal: {
          timing: 'resume-later-information-risk',
          visibleFactor: 'Marge restante',
          action: 'refresh-signal',
          label: 'Observation: reprendre plus tard.',
          reason: 'Attendre protège la fenêtre, mais le signal peut perdre en fraîcheur: rafraîchir avant reprise.',
        },
        firstSafeObservationTarget: {
          target: 'no-safe-target',
          visibleFactor: 'Zone brouillée',
          action: 'refresh-signal',
          label: 'Cible observation: aucune sûre.',
          reason: 'La zone reste brouillée: rafraîchir le signal avant de choisir une première cible active.',
        },
        observationBroadeningSignal: {
          broadening: 'stay-limited-target',
          visibleConstraint: 'Zone brouillée',
          action: 'refresh-signal',
          label: 'Élargissement: rester limité.',
          reason: 'La zone brouillée rend l’extension trop large: rafraîchir le signal avant tout élargissement.',
        },
        observationBroadeningTradeoff: {
          tradeoff: 'exposure-too-high',
          visibleFactor: 'Zone brouillée',
          action: 'wait-for-clearer-coverage',
          label: 'Compromis: attendre.',
          message: 'Attendre: la zone brouillée ajouterait de l’exposition sans couverture fiable.',
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
            preventiveAction: {
              action: 'hold-monitoring',
              targetSignal: null,
              windowEffect: 'maintains-safe-window',
              reason: 'Aucune micro-action requise: la checklist reste stable avant le prochain signal.',
            },
            preventiveRecoveryState: {
              state: 'monitor-only',
              targetSignal: null,
              nextDecision: 'continue-monitoring',
              reason: 'La checklist reste stable: maintenir le monitoring sans nouvelle exposition.',
            },
            postRecoverySafetyMargin: {
              level: 'insufficient-data',
              fastestConsumingSignal: null,
              nextAction: 'reinforce-monitoring',
              reason: 'Données de dérive insuffisantes: renforcer le monitoring avant de mesurer une vraie marge.',
            },
            postRecoveryMarginDecay: {
              state: 'insufficient-data',
              responsibleSignal: null,
              trend: 'unknown',
              recommendedAction: 'postpone',
              reason: 'Dérive insuffisamment lisible: reporter le sweep et garder le monitoring actif.',
            },
            monitoringMarginResponsePriority: {
              response: 'postpone-neutral',
              priorityFactor: 'Données insuffisantes',
              label: 'Priorité: reporter sans urgence.',
              reason: 'Marge non exploitable maintenant; maintenir le monitoring sans révéler de cible.',
            },
            monitoringSafeCadence: {
              cadence: 'wait-no-urgency',
              cadenceFactor: 'Données insuffisantes',
              label: 'Cadence: attendre sans urgence.',
              reason: 'Aucune fenêtre sûre immédiate: maintenir la surveillance sans forcer le rythme.',
            },
            monitoringMinimalResumeSignal: {
              prerequisite: 'sufficient-margin',
              visibleFactor: 'Données insuffisantes',
              action: 'maintain-surveillance',
              label: 'Signal minimal: marge suffisante.',
              reason: 'Maintenir la surveillance jusqu’à une marge lisible, sans forcer la reprise.',
            },
            resumedConstrainedSweepResult: {
              result: 'fragile-resume',
              visibleFactor: 'Données insuffisantes',
              action: 'maintain-surveillance',
              label: 'Résultat: reprise fragile.',
              reason: 'La marge reste trop peu lisible: maintenir la surveillance avant une nouvelle passe.',
            },
            followUpHeatDebt: {
              debt: 'next-follow-up-blocked',
              visibleFactor: 'Marge restante',
              action: 'maintain-surveillance',
              label: 'Dette heat: suivi bloqué.',
              reason: 'Marge restante trop peu lisible: maintenir la surveillance avant d’ajouter du heat.',
            },
            followUpCoolingWindow: {
              window: 'mandatory-cooling',
              visibleFactor: 'Marge restante',
              action: 'refresh-signal',
              label: 'Refroidissement: obligatoire.',
              reason: 'La fenêtre reste illisible: rafraîchir le signal visible avant le prochain suivi.',
            },
            activeObservationResumeSignal: {
              timing: 'resume-later-information-risk',
              visibleFactor: 'Marge restante',
              action: 'refresh-signal',
              label: 'Observation: reprendre plus tard.',
              reason: 'Attendre protège la fenêtre, mais le signal peut perdre en fraîcheur: rafraîchir avant reprise.',
            },
            firstSafeObservationTarget: {
              target: 'no-safe-target',
              visibleFactor: 'Zone brouillée',
              action: 'refresh-signal',
              label: 'Cible observation: aucune sûre.',
              reason: 'La zone reste brouillée: rafraîchir le signal avant de choisir une première cible active.',
            },
            observationBroadeningSignal: {
              broadening: 'stay-limited-target',
              visibleConstraint: 'Zone brouillée',
              action: 'refresh-signal',
              label: 'Élargissement: rester limité.',
              reason: 'La zone brouillée rend l’extension trop large: rafraîchir le signal avant tout élargissement.',
            },
            observationBroadeningTradeoff: {
              tradeoff: 'exposure-too-high',
              visibleFactor: 'Zone brouillée',
              action: 'wait-for-clearer-coverage',
              label: 'Compromis: attendre.',
              message: 'Attendre: la zone brouillée ajouterait de l’exposition sans couverture fiable.',
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
        preventiveAction: {
          action: 'hold-monitoring',
          targetSignal: null,
          windowEffect: 'maintains-safe-window',
          reason: 'Aucune micro-action requise: la checklist reste stable avant le prochain signal.',
        },
        preventiveRecoveryState: {
          state: 'monitor-only',
          targetSignal: null,
          nextDecision: 'continue-monitoring',
          reason: 'La checklist reste stable: maintenir le monitoring sans nouvelle exposition.',
        },
        postRecoverySafetyMargin: {
          level: 'insufficient-data',
          fastestConsumingSignal: null,
          nextAction: 'reinforce-monitoring',
          reason: 'Données de dérive insuffisantes: renforcer le monitoring avant de mesurer une vraie marge.',
        },
        postRecoveryMarginDecay: {
          state: 'insufficient-data',
          responsibleSignal: null,
          trend: 'unknown',
          recommendedAction: 'postpone',
          reason: 'Dérive insuffisamment lisible: reporter le sweep et garder le monitoring actif.',
        },
        monitoringMarginResponsePriority: {
          response: 'postpone-neutral',
          priorityFactor: 'Données insuffisantes',
          label: 'Priorité: reporter sans urgence.',
          reason: 'Marge non exploitable maintenant; maintenir le monitoring sans révéler de cible.',
        },
        monitoringSafeCadence: {
          cadence: 'wait-no-urgency',
          cadenceFactor: 'Données insuffisantes',
          label: 'Cadence: attendre sans urgence.',
          reason: 'Aucune fenêtre sûre immédiate: maintenir la surveillance sans forcer le rythme.',
        },
        monitoringMinimalResumeSignal: {
          prerequisite: 'sufficient-margin',
          visibleFactor: 'Données insuffisantes',
          action: 'maintain-surveillance',
          label: 'Signal minimal: marge suffisante.',
          reason: 'Maintenir la surveillance jusqu’à une marge lisible, sans forcer la reprise.',
        },
        resumedConstrainedSweepResult: {
          result: 'fragile-resume',
          visibleFactor: 'Données insuffisantes',
          action: 'maintain-surveillance',
          label: 'Résultat: reprise fragile.',
          reason: 'La marge reste trop peu lisible: maintenir la surveillance avant une nouvelle passe.',
        },
        followUpHeatDebt: {
          debt: 'next-follow-up-blocked',
          visibleFactor: 'Marge restante',
          action: 'maintain-surveillance',
          label: 'Dette heat: suivi bloqué.',
          reason: 'Marge restante trop peu lisible: maintenir la surveillance avant d’ajouter du heat.',
        },
        followUpCoolingWindow: {
          window: 'mandatory-cooling',
          visibleFactor: 'Marge restante',
          action: 'refresh-signal',
          label: 'Refroidissement: obligatoire.',
          reason: 'La fenêtre reste illisible: rafraîchir le signal visible avant le prochain suivi.',
        },
        activeObservationResumeSignal: {
          timing: 'resume-later-information-risk',
          visibleFactor: 'Marge restante',
          action: 'refresh-signal',
          label: 'Observation: reprendre plus tard.',
          reason: 'Attendre protège la fenêtre, mais le signal peut perdre en fraîcheur: rafraîchir avant reprise.',
        },
        firstSafeObservationTarget: {
          target: 'no-safe-target',
          visibleFactor: 'Zone brouillée',
          action: 'refresh-signal',
          label: 'Cible observation: aucune sûre.',
          reason: 'La zone reste brouillée: rafraîchir le signal avant de choisir une première cible active.',
        },
        observationBroadeningSignal: {
          broadening: 'stay-limited-target',
          visibleConstraint: 'Zone brouillée',
          action: 'refresh-signal',
          label: 'Élargissement: rester limité.',
          reason: 'La zone brouillée rend l’extension trop large: rafraîchir le signal avant tout élargissement.',
        },
        observationBroadeningTradeoff: {
          tradeoff: 'exposure-too-high',
          visibleFactor: 'Zone brouillée',
          action: 'wait-for-clearer-coverage',
          label: 'Compromis: attendre.',
          message: 'Attendre: la zone brouillée ajouterait de l’exposition sans couverture fiable.',
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
      preventiveAction: {
        action: 'wait-fresh-signal',
        targetSignal: 'Gain confiance',
        windowEffect: 'advances-safe-window',
        reason: 'Attendre des signaux frais peut transformer un gain marginal en reprise sûre.',
      },
      preventiveRecoveryState: {
        state: 'monitor-only',
        targetSignal: 'Gain confiance',
        nextDecision: 'wait-fresh-signal',
        reason: 'La reprise reste surveillable seulement: attendre un signal frais avant tout sweep.',
      },
      postRecoverySafetyMargin: {
        level: 'narrow',
        fastestConsumingSignal: 'Gain confiance',
        nextAction: 'wait-confirmation',
        reason: 'Gain confiance laisse une marge surveillable mais pas suffisante pour lancer tout de suite.',
      },
      postRecoveryMarginDecay: {
        state: 'narrow-watch',
        responsibleSignal: 'Gain confiance',
        trend: 'needs-confirmation',
        recommendedAction: 'refresh-signal',
        reason: 'Gain confiance garde une marge étroite: rafraîchir le signal avant de relancer.',
      },
      monitoringMarginResponsePriority: {
        response: 'refresh-signal',
        priorityFactor: 'Gain confiance',
        label: 'Priorité: rafraîchir le signal.',
        reason: 'Qualité du signal fragile; confirmer avant toute relance.',
      },
      monitoringSafeCadence: {
        cadence: 'refresh-then-sweep',
        cadenceFactor: 'Gain confiance',
        label: 'Cadence: rafraîchir puis sweep.',
        reason: 'Qualité du signal pilote le tempo: confirmer, puis relancer court.',
      },
      monitoringMinimalResumeSignal: {
        prerequisite: 'fresh-signal-required',
        visibleFactor: 'Gain confiance',
        action: 'wait-signal',
        label: 'Signal minimal: donnée fraîche.',
        reason: 'Attendre une confirmation fraîche avant de reprendre le sweep contraint.',
      },
      resumedConstrainedSweepResult: {
        result: 'fragile-resume',
        visibleFactor: 'Gain confiance',
        action: 'maintain-surveillance',
        label: 'Résultat: reprise fragile.',
        reason: 'La qualité du signal suffit à reprendre, mais pas à enchaîner sans surveillance.',
      },
      followUpHeatDebt: {
        debt: 'heat-to-absorb',
        visibleFactor: 'Gain confiance',
        action: 'refresh-signal',
        label: 'Dette heat: à absorber.',
        reason: 'Le suivi reste possible, mais dépend d’un signal rafraîchi avant d’ajouter du heat.',
      },
      followUpCoolingWindow: {
        window: 'short-pause-sufficient',
        visibleFactor: 'Gain confiance',
        action: 'wait-one-turn',
        label: 'Refroidissement: pause courte.',
        reason: 'Une pause courte suffit à stabiliser le suivi avant de rafraîchir le signal visible.',
      },
      activeObservationResumeSignal: {
        timing: 'wait-before-resume',
        visibleFactor: 'Gain confiance',
        action: 'wait-one-turn',
        label: 'Observation: attendre un tour.',
        reason: 'La pause courte stabilise le signal visible avant de rouvrir l’observation active.',
      },
      firstSafeObservationTarget: {
        target: 'limited-recommended',
        visibleFactor: 'Couverture partielle',
        action: 'observe-limited',
        label: 'Cible observation: limitée recommandée.',
        reason: 'Commencer par une cible limitée évite de rouvrir trop large pendant la stabilisation visible.',
      },
      observationBroadeningSignal: {
        broadening: 'cautious-broadening-possible',
        visibleConstraint: 'Dette d’observation',
        action: 'broaden-one-step',
        label: 'Élargissement: prudent possible.',
        reason: 'La cible limitée absorbe la dette d’observation: élargir d’un cran seulement tant que la couverture partielle tient.',
      },
      observationBroadeningTradeoff: {
        tradeoff: 'coverage-justifies-broadening',
        visibleFactor: 'Dette d’observation',
        action: 'broaden-one-step',
        label: 'Compromis: élargissement utile.',
        message: 'Le gain de couverture justifie un cran d’observation, pas une extension complète.',
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
      preventiveAction: {
        action: 'secure-exposure',
        targetSignal: 'Fenêtre sûre',
        windowEffect: 'maintains-safe-window',
        reason: 'Sécuriser l’exposition maintenant garde la fenêtre sûre ouverte sans révéler de cible.',
      },
      preventiveRecoveryState: {
        state: 'sweep-safe-again',
        targetSignal: 'Fenêtre sûre',
        nextDecision: 'resume-sweep',
        reason: 'L’exposition sécurisée maintient la fenêtre sûre: le sweep peut reprendre si le signal reste lisible.',
      },
      postRecoverySafetyMargin: {
        level: 'comfortable',
        fastestConsumingSignal: 'Fenêtre sûre',
        nextAction: 'launch-sweep',
        reason: 'Fenêtre sûre consomme encore la marge, mais la fenêtre reste assez protégée pour lancer le sweep.',
      },
      postRecoveryMarginDecay: {
        state: 'comfortable-stable',
        responsibleSignal: 'Fenêtre sûre',
        trend: 'holds-until-next-sweep',
        recommendedAction: 'launch-now',
        reason: 'Fenêtre sûre peut encore peser, mais la marge devrait tenir jusqu’au prochain sweep sûr.',
      },
      monitoringMarginResponsePriority: {
        response: 'launch-now',
        priorityFactor: 'Fenêtre sûre',
        label: 'Priorité: lancer maintenant.',
        reason: 'Fenêtre de sweep encore lisible; ne pas laisser la marge se fermer.',
      },
      monitoringSafeCadence: {
        cadence: 'sweep-now',
        cadenceFactor: 'Fenêtre sûre',
        label: 'Cadence: sweep maintenant.',
        reason: 'Fenêtre visible encore ouverte: lancer avant le prochain tick de dérive.',
      },
      monitoringMinimalResumeSignal: {
        prerequisite: 'already-safe',
        visibleFactor: 'Fenêtre sûre',
        action: 'resume-sweep',
        label: 'Signal minimal: reprise sûre.',
        reason: 'La fenêtre visible suffit déjà: reprendre sans ajouter de révélation cachée.',
      },
      resumedConstrainedSweepResult: {
        result: 'margin-restored',
        visibleFactor: 'Fenêtre sûre',
        action: 'chain-sweep',
        label: 'Résultat: marge restaurée.',
        reason: 'La reprise laisse une marge lisible: enchaîner seulement si la fenêtre reste visible.',
      },
      followUpHeatDebt: {
        debt: 'heat-stable',
        visibleFactor: 'Fenêtre sûre',
        action: 'chain-sweep',
        label: 'Dette heat: stable.',
        reason: 'La fenêtre de sweep reste lisible: enchaîner seulement si le heat visible ne remonte pas.',
      },
      followUpCoolingWindow: {
        window: 'cooling-not-needed',
        visibleFactor: 'Fenêtre sûre',
        action: 'chain-sweep',
        label: 'Refroidissement: inutile.',
        reason: 'La fenêtre de sweep reste ouverte: aucun tour de refroidissement requis tant que le heat reste stable.',
      },
      activeObservationResumeSignal: {
        timing: 'resume-now',
        visibleFactor: 'Fenêtre sûre',
        action: 'resume-observation',
        label: 'Observation: reprendre maintenant.',
        reason: 'La fenêtre visible reste ouverte: reprendre l’observation active sans attendre un refroidissement caché.',
      },
      firstSafeObservationTarget: {
        target: 'primary-safe',
        visibleFactor: 'Couverture partielle',
        action: 'observe-primary',
        label: 'Cible observation: principale sûre.',
        reason: 'La reprise active peut viser la cible principale sans élargir le sweep au-delà de la couverture lisible.',
      },
      observationBroadeningSignal: {
        broadening: 'primary-coverage-safe',
        visibleConstraint: 'Menace confirmée',
        action: 'broaden-main-coverage',
        label: 'Élargissement: couverture principale sûre.',
        reason: 'La première cible confirme une menace lisible: élargir vers la couverture principale sans ouvrir de zone brouillée.',
      },
      observationBroadeningTradeoff: {
        tradeoff: 'coverage-justifies-broadening',
        visibleFactor: 'Menace confirmée',
        action: 'broaden-main-coverage',
        label: 'Compromis: couverture utile.',
        message: 'La couverture principale vaut l’exposition ajoutée: élargir sans ouvrir de zone brouillée.',
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
    preventiveAction: {
      action: 'wait-fresh-signal',
      targetSignal: 'Fraîcheur signal',
      windowEffect: 'delays-safe-window',
      reason: 'Attendre un signal frais évite de relancer sur une information qui dérive.',
    },
    preventiveRecoveryState: {
      state: 'monitor-only',
      targetSignal: 'Fraîcheur signal',
      nextDecision: 'wait-fresh-signal',
      reason: 'La reprise reste surveillable seulement: attendre un signal frais avant tout sweep.',
    },
    postRecoverySafetyMargin: {
      level: 'narrow',
      fastestConsumingSignal: 'Fraîcheur signal',
      nextAction: 'wait-confirmation',
      reason: 'Fraîcheur signal laisse une marge surveillable mais pas suffisante pour lancer tout de suite.',
    },
    postRecoveryMarginDecay: {
      state: 'expiring-before-next-sweep',
      responsibleSignal: 'Fraîcheur signal',
      trend: 'decays-before-next-sweep',
      recommendedAction: 'refresh-signal',
      reason: 'Fraîcheur signal peut dégrader la marge avant la prochaine fenêtre: agir sans révéler de cible cachée.',
    },
    monitoringMarginResponsePriority: {
      response: 'refresh-signal',
      priorityFactor: 'Fraîcheur signal',
      label: 'Priorité: rafraîchir le signal.',
      reason: 'Qualité du signal fragile; confirmer avant toute relance.',
    },
    monitoringSafeCadence: {
      cadence: 'refresh-then-sweep',
      cadenceFactor: 'Fraîcheur signal',
      label: 'Cadence: rafraîchir puis sweep.',
      reason: 'Qualité du signal pilote le tempo: confirmer, puis relancer court.',
    },
    monitoringMinimalResumeSignal: {
      prerequisite: 'fresh-signal-required',
      visibleFactor: 'Fraîcheur signal',
      action: 'wait-signal',
      label: 'Signal minimal: donnée fraîche.',
      reason: 'Attendre une confirmation fraîche avant de reprendre le sweep contraint.',
    },
    resumedConstrainedSweepResult: {
      result: 'fragile-resume',
      visibleFactor: 'Fraîcheur signal',
      action: 'maintain-surveillance',
      label: 'Résultat: reprise fragile.',
      reason: 'La qualité du signal suffit à reprendre, mais pas à enchaîner sans surveillance.',
    },
    followUpHeatDebt: {
      debt: 'heat-to-absorb',
      visibleFactor: 'Fraîcheur signal',
      action: 'refresh-signal',
      label: 'Dette heat: à absorber.',
      reason: 'Le suivi reste possible, mais dépend d’un signal rafraîchi avant d’ajouter du heat.',
    },
    followUpCoolingWindow: {
      window: 'short-pause-sufficient',
      visibleFactor: 'Fraîcheur signal',
      action: 'wait-one-turn',
      label: 'Refroidissement: pause courte.',
      reason: 'Une pause courte suffit à stabiliser le suivi avant de rafraîchir le signal visible.',
    },
    activeObservationResumeSignal: {
      timing: 'wait-before-resume',
      visibleFactor: 'Fraîcheur signal',
      action: 'wait-one-turn',
      label: 'Observation: attendre un tour.',
      reason: 'La pause courte stabilise le signal visible avant de rouvrir l’observation active.',
    },
    firstSafeObservationTarget: {
      target: 'limited-recommended',
      visibleFactor: 'Couverture partielle',
      action: 'observe-limited',
      label: 'Cible observation: limitée recommandée.',
      reason: 'Commencer par une cible limitée évite de rouvrir trop large pendant la stabilisation visible.',
    },
    observationBroadeningSignal: {
      broadening: 'cautious-broadening-possible',
      visibleConstraint: 'Dette d’observation',
      action: 'broaden-one-step',
      label: 'Élargissement: prudent possible.',
      reason: 'La cible limitée absorbe la dette d’observation: élargir d’un cran seulement tant que la couverture partielle tient.',
    },
    observationBroadeningTradeoff: {
      tradeoff: 'coverage-justifies-broadening',
      visibleFactor: 'Dette d’observation',
      action: 'broaden-one-step',
      label: 'Compromis: élargissement utile.',
      message: 'Le gain de couverture justifie un cran d’observation, pas une extension complète.',
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
  assert.deepEqual(tooExposed.thirdSweepRecommendation.monitoringRationale.postRecoverySafetyMargin, {
    level: 'absent',
    fastestConsumingSignal: 'Heat',
    nextAction: 'reinforce-monitoring',
    reason: 'Heat consomme toute la marge: renforcer le monitoring avant tout sweep.',
  });
  assert.deepEqual(tooExposed.thirdSweepRecommendation.monitoringRationale.postRecoveryMarginDecay, {
    state: 'expiring-before-next-sweep',
    responsibleSignal: 'Heat',
    trend: 'decays-before-next-sweep',
    recommendedAction: 'reduce-heat',
    reason: 'Le heat consomme la marge avant la prochaine fenêtre sûre: réduire la pression visible.',
  });
  assert.deepEqual(tooExposed.thirdSweepRecommendation.monitoringRationale.monitoringMarginResponsePriority, {
    response: 'reduce-heat',
    priorityFactor: 'Heat',
    label: 'Priorité: réduire heat.',
    reason: 'Heat visible trop haut; baisser la pression avant reprise.',
  });
  assert.deepEqual(tooExposed.thirdSweepRecommendation.monitoringRationale.monitoringSafeCadence, {
    cadence: 'space-for-heat',
    cadenceFactor: 'Heat',
    label: 'Cadence: espacer pour heat.',
    reason: 'Espacer les sweeps laisse la pression visible retomber avant reprise.',
  });
  assert.deepEqual(tooExposed.thirdSweepRecommendation.monitoringRationale.monitoringMinimalResumeSignal, {
    prerequisite: 'heat-reduction-required',
    visibleFactor: 'Heat',
    action: 'reduce-heat',
    label: 'Signal minimal: heat réduit.',
    reason: 'Réduire le heat visible avant toute reprise de sweep.',
  });
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

test('buildIntrigueMapOverlay exposes safe-map heat decay playback and redacted labels', () => {
  const overlay = buildIntrigueMapOverlay([
    new Cellule({
      id: 'cell-active',
      factionId: 'shadow-league',
      codename: 'Ember',
      locationId: 'ashlands',
      memberIds: ['ag-1'],
      assetIds: ['asset-1'],
      exposure: 42,
    }),
    new Cellule({
      id: 'cell-masked',
      factionId: 'shadow-league',
      codename: 'Still',
      locationId: 'quiet-plains',
      memberIds: ['ag-2'],
      assetIds: ['asset-2'],
      exposure: 0,
    }),
  ], [
    new OperationClandestine({
      id: 'op-active',
      celluleId: 'cell-active',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Disrupt road watches',
      theaterId: 'ashlands',
      assignedAgentIds: ['ag-1'],
      requiredAssetIds: ['asset-1'],
      detectionRisk: 15,
      progress: 80,
      heat: 82,
      phase: 'execution',
    }),
  ], {
    safeMapMode: true,
    locationNames: { ashlands: 'Ashlands', 'quiet-plains': 'Quiet Plains' },
  });

  const active = overlay.find((entry) => entry.locationId === 'ashlands');
  const masked = overlay.find((entry) => entry.locationId === 'quiet-plains');

  assert.equal(active.suspicionHeatDecayPlayback.state, 'active-risk');
  assert.deepEqual(active.suspicionHeatDecayPlayback.frames.map((frame) => frame.state), [
    'active-risk',
    'decaying-risk',
    'decaying-risk',
    'decaying-risk',
  ]);
  assert.deepEqual(active.suspicionHeatDecayPlayback.frames.map((frame) => frame.projectedHeat), [82, 70, 58, 46]);
  assert.equal(active.safeMapMasking.redactedLabel, 'Risque actif visible');
  assert.equal(active.safeMapMasking.safeLabel, 'Indice intrigue low, risque high: détails sensibles expurgés.');
  assert.deepEqual(active.safeMapMasking.maskedDetails, ['identité cellule', 'relais opérationnel', 'objectif précis']);

  assert.equal(masked.suspicionHeatDecayPlayback.state, 'masked');
  assert.deepEqual(masked.suspicionHeatDecayPlayback.frames.map((frame) => frame.label), [
    'T+0: information masquée',
    'T+1: information masquée',
    'T+2: information masquée',
    'T+3: information masquée',
  ]);
  assert.equal(masked.safeMapMasking.redactedLabel, 'Information masquée');
  assert.match(masked.safeMapMasking.safeLabel, /données absentes ou confidentielles/);
  assert.deepEqual(masked.safeMapMasking.maskedDetails, ['identité cellule', 'relais opérationnel', 'objectif précis', 'cause du signal']);
});

test('buildIntrigueMapOverlay exposes fog-safe confidence states and verification hints', () => {
  const overlay = buildIntrigueMapOverlay([
    new Cellule({
      id: 'cell-confirmed',
      factionId: 'shadow-league',
      codename: 'Torch',
      locationId: 'confirmed-zone',
      memberIds: ['ag-1'],
      assetIds: ['asset-1'],
      exposure: 74,
    }),
    new Cellule({
      id: 'cell-suspected',
      factionId: 'shadow-league',
      codename: 'Lantern',
      locationId: 'suspected-zone',
      memberIds: ['ag-2'],
      assetIds: ['asset-2'],
      exposure: 0,
    }),
    new Cellule({
      id: 'cell-stale',
      factionId: 'shadow-league',
      codename: 'Ash',
      locationId: 'stale-zone',
      memberIds: ['ag-3'],
      assetIds: ['asset-3'],
      exposure: 18,
    }),
    new Cellule({
      id: 'cell-masked-confidence',
      factionId: 'shadow-league',
      codename: 'Blank',
      locationId: 'masked-zone',
      memberIds: ['ag-4'],
      assetIds: ['asset-4'],
      exposure: 0,
    }),
  ], [
    new OperationClandestine({
      id: 'op-suspected',
      celluleId: 'cell-suspected',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Probe patrol timings',
      theaterId: 'suspected-zone',
      assignedAgentIds: ['ag-2'],
      requiredAssetIds: ['asset-2'],
      detectionRisk: 80,
      progress: 5,
      heat: 10,
      phase: 'planning',
    }),
  ], { safeMapMode: true });
  const byLocation = new Map(overlay.map((entry) => [entry.locationId, entry]));

  assert.equal(byLocation.get('confirmed-zone').confidenceState.state, 'confirmed');
  assert.equal(byLocation.get('confirmed-zone').safeVerificationHint.action, 'observe-locally');
  assert.match(byLocation.get('confirmed-zone').safeVerificationHint.safeMapLabel, /danger non confirmé/);

  assert.equal(byLocation.get('suspected-zone').confidenceState.state, 'suspected');
  assert.equal(byLocation.get('suspected-zone').safeVerificationHint.action, 'limit-coverage');
  assert.match(byLocation.get('suspected-zone').confidenceState.safeCopy, /danger réel non confirmé/);

  assert.equal(byLocation.get('stale-zone').confidenceState.state, 'stale');
  assert.equal(byLocation.get('stale-zone').safeVerificationHint.action, 'wait');
  assert.equal(byLocation.get('stale-zone').confidenceState.dangerInterpretation, 'incertitude élevée, pas danger faible');

  assert.equal(byLocation.get('masked-zone').confidenceState.state, 'masked');
  assert.equal(byLocation.get('masked-zone').safeVerificationHint.action, 'ignore');
  assert.match(byLocation.get('masked-zone').safeVerificationHint.reason, /ne pas transformer l’absence de données/);
});

test('buildIntrigueMapOverlay previews fog-safe verification paths with costs and unsafe fallback', () => {
  const overlay = buildIntrigueMapOverlay([
    new Cellule({
      id: 'cell-confirmed-path',
      factionId: 'shadow-league',
      codename: 'Torch',
      locationId: 'confirmed-path',
      memberIds: ['ag-1'],
      assetIds: ['asset-1'],
      exposure: 76,
    }),
    new Cellule({
      id: 'cell-uncertain-path',
      factionId: 'shadow-league',
      codename: 'Lantern',
      locationId: 'uncertain-path',
      memberIds: ['ag-2'],
      assetIds: ['asset-2'],
      exposure: 0,
    }),
    new Cellule({
      id: 'cell-masked-path',
      factionId: 'shadow-league',
      codename: 'Blank',
      locationId: 'masked-path',
      memberIds: ['ag-3'],
      assetIds: ['asset-3'],
      exposure: 0,
    }),
  ], [
    new OperationClandestine({
      id: 'op-confirmed-hot',
      celluleId: 'cell-confirmed-path',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Stress gate watches',
      theaterId: 'confirmed-path',
      assignedAgentIds: ['ag-1'],
      requiredAssetIds: ['asset-1'],
      detectionRisk: 12,
      progress: 84,
      heat: 86,
      phase: 'execution',
    }),
    new OperationClandestine({
      id: 'op-uncertain-probe',
      celluleId: 'cell-uncertain-path',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Probe road rumor',
      theaterId: 'uncertain-path',
      assignedAgentIds: ['ag-2'],
      requiredAssetIds: ['asset-2'],
      detectionRisk: 80,
      progress: 5,
      heat: 10,
      phase: 'planning',
    }),
  ], { safeMapMode: true });
  const byLocation = new Map(overlay.map((entry) => [entry.locationId, entry]));
  const confirmedPaths = byLocation.get('confirmed-path').verificationPathPreviews;
  const uncertainPaths = byLocation.get('uncertain-path').verificationPathPreviews;
  const maskedPaths = byLocation.get('masked-path').verificationPathPreviews;

  assert.equal(confirmedPaths[0].pathId, 'observe-local-confirmation');
  assert.equal(confirmedPaths[0].recommended, true);
  assert.equal(confirmedPaths[0].costCue, 'coût modéré');
  assert.match(confirmedPaths[0].heatDecayContext, /Chaleur active/);
  assert.match(confirmedPaths[0].fogSafeCopy, /sans nommer source ni cible/);
  assert.deepEqual(confirmedPaths.filter((path) => path.unsafe).map((path) => path.saferFallbackAction), ['observe-locally']);
  assert.match(confirmedPaths.find((path) => path.unsafe).fogSafeCopy, /ne révèle aucun relais, cellule ou cible/);

  assert.equal(uncertainPaths[0].pathId, 'limited-coverage-check');
  assert.equal(uncertainPaths[0].unsafe, false);
  assert.equal(uncertainPaths[0].costCue, 'coût bas');
  assert.match(uncertainPaths[0].fogSafeCopy, /danger réel non confirmé/);
  assert.match(uncertainPaths[0].evidenceNeeded, /pas une identité cachée/);

  assert.equal(maskedPaths[0].pathId, 'ignore-masked-signal');
  assert.equal(maskedPaths[0].exposureCost, 0);
  assert.match(maskedPaths[0].fogSafeCopy, /l’absence de signal ne prouve pas un danger faible/);
});

test('buildIntrigueMapOverlay replays fog-safe incidents and evidence trail markers', () => {
  const overlay = buildIntrigueMapOverlay([
    new Cellule({
      id: 'cell-confirmed-replay',
      factionId: 'shadow-league',
      codename: 'Torch',
      locationId: 'confirmed-replay',
      memberIds: ['ag-1'],
      assetIds: ['asset-1'],
      exposure: 76,
    }),
    new Cellule({
      id: 'cell-suspected-replay',
      factionId: 'shadow-league',
      codename: 'Lantern',
      locationId: 'suspected-replay',
      memberIds: ['ag-2'],
      assetIds: ['asset-2'],
      exposure: 0,
    }),
    new Cellule({
      id: 'cell-masked-replay',
      factionId: 'shadow-league',
      codename: 'Blank',
      locationId: 'masked-replay',
      memberIds: ['ag-3'],
      assetIds: ['asset-3'],
      exposure: 0,
    }),
  ], [
    new OperationClandestine({
      id: 'op-confirmed-replay',
      celluleId: 'cell-confirmed-replay',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Stress gate watches',
      theaterId: 'confirmed-replay',
      assignedAgentIds: ['ag-1'],
      requiredAssetIds: ['asset-1'],
      detectionRisk: 12,
      progress: 84,
      heat: 86,
      phase: 'execution',
    }),
    new OperationClandestine({
      id: 'op-suspected-replay',
      celluleId: 'cell-suspected-replay',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Probe road rumor',
      theaterId: 'suspected-replay',
      assignedAgentIds: ['ag-2'],
      requiredAssetIds: ['asset-2'],
      detectionRisk: 80,
      progress: 5,
      heat: 10,
      phase: 'planning',
    }),
  ], {
    safeMapMode: true,
    locationNames: {
      'confirmed-replay': 'Confirmed Replay',
      'suspected-replay': 'Suspected Replay',
      'masked-replay': 'Masked Replay',
    },
  });
  const byLocation = new Map(overlay.map((entry) => [entry.locationId, entry]));
  const confirmed = byLocation.get('confirmed-replay');
  const suspected = byLocation.get('suspected-replay');
  const masked = byLocation.get('masked-replay');

  assert.equal(confirmed.incidentReplay.state, 'confirmed-trail');
  assert.deepEqual(confirmed.incidentReplay.frames.map((frame) => frame.incidentType), [
    'verification-in-progress',
    'verification-in-progress',
    'confirmed-trail',
  ]);
  assert.match(confirmed.incidentReplay.frames[0].safeCopy, /aucune source, cible ou cause cachée/);
  assert.equal(confirmed.evidenceTrailMarkers[0].state, 'confirmed-evidence');
  assert.equal(confirmed.evidenceTrailMarkers[0].toLocationId, 'masked-replay');
  assert.match(confirmed.evidenceTrailMarkers[0].reason, /relais, cellule et objectif restent masqués/);

  assert.equal(suspected.incidentReplay.state, 'suspected-sabotage');
  assert.equal(suspected.incidentReplay.frames.at(-1).confidenceTrend, 'up');
  assert.equal(suspected.evidenceTrailMarkers[0].state, 'suspected-evidence');
  assert.match(suspected.evidenceTrailMarkers[0].label, /piste suspect/);

  assert.equal(masked.incidentReplay.state, 'false-alert-or-masked');
  assert.equal(masked.incidentReplay.frames.at(-1).confidenceTrend, 'masked');
  assert.deepEqual(masked.evidenceTrailMarkers, [{
    markerId: 'evidence:masked-replay:masked',
    state: 'masked',
    fromLocationId: 'masked-replay',
    toLocationId: null,
    label: 'Masked Replay: piste masquée',
    reason: 'Mode sûr: lien de preuve non affiché car les données sont absentes ou confidentielles.',
  }]);
});

test('buildIntrigueMapOverlay exposes fog-safe intelligence provenance panels', () => {
  const overlay = buildIntrigueMapOverlay([
    new Cellule({
      id: 'cell-observed-prov',
      factionId: 'shadow-league',
      codename: 'Torch',
      locationId: 'observed-prov',
      memberIds: ['ag-1'],
      assetIds: ['asset-1'],
      exposure: 78,
    }),
    new Cellule({
      id: 'cell-inferred-prov',
      factionId: 'shadow-league',
      codename: 'Lantern',
      locationId: 'inferred-prov',
      memberIds: ['ag-2'],
      assetIds: ['asset-2'],
      exposure: 0,
    }),
    new Cellule({
      id: 'cell-rumor-prov',
      factionId: 'shadow-league',
      codename: 'Ash',
      locationId: 'rumor-prov',
      memberIds: ['ag-3'],
      assetIds: ['asset-3'],
      exposure: 18,
    }),
    new Cellule({
      id: 'cell-unknown-prov',
      factionId: 'shadow-league',
      codename: 'Blank',
      locationId: 'unknown-prov',
      memberIds: ['ag-4'],
      assetIds: ['asset-4'],
      exposure: 0,
    }),
  ], [
    new OperationClandestine({
      id: 'op-inferred-prov',
      celluleId: 'cell-inferred-prov',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Probe road rumor',
      theaterId: 'inferred-prov',
      assignedAgentIds: ['ag-2'],
      requiredAssetIds: ['asset-2'],
      detectionRisk: 80,
      progress: 5,
      heat: 10,
      phase: 'planning',
    }),
  ], { safeMapMode: true });
  const byLocation = new Map(overlay.map((entry) => [entry.locationId, entry.intelligenceProvenancePanel]));

  assert.equal(byLocation.get('observed-prov').provenanceType, 'observed');
  assert.equal(byLocation.get('observed-prov').sourceLabel, 'Observation directe expurgée');
  assert.equal(byLocation.get('observed-prov').confirmationMethod, 'exposition visible confirmée');
  assert.equal(byLocation.get('observed-prov').nextVerificationStep.action, 'observe-locally');
  assert.match(byLocation.get('observed-prov').hiddenDetailPolicy, /Ne révèle jamais cellule, relais, cible/);

  assert.equal(byLocation.get('inferred-prov').provenanceType, 'inferred');
  assert.equal(byLocation.get('inferred-prov').sourceLabel, 'Déduction par signaux visibles');
  assert.equal(byLocation.get('inferred-prov').confirmationMethod, 'corrélation chaleur/progression visible');
  assert.equal(byLocation.get('inferred-prov').nextVerificationStep.action, 'limit-coverage');
  assert.deepEqual(byLocation.get('inferred-prov').evidenceStates, ['suspected-evidence']);

  assert.equal(byLocation.get('rumor-prov').provenanceType, 'rumor');
  assert.equal(byLocation.get('rumor-prov').sourceLabel, 'Rumeur ou indice ancien');
  assert.equal(byLocation.get('rumor-prov').nextVerificationStep.action, 'wait');
  assert.match(byLocation.get('rumor-prov').credibilityReason, /indice à revérifier/);

  assert.equal(byLocation.get('unknown-prov').provenanceType, 'unknown');
  assert.equal(byLocation.get('unknown-prov').sourceLabel, 'Source inconnue ou confidentielle');
  assert.equal(byLocation.get('unknown-prov').confirmationMethod, 'aucune méthode affichable en mode sûr');
  assert.equal(byLocation.get('unknown-prov').nextVerificationStep.action, 'ignore');
  assert.match(byLocation.get('unknown-prov').safeMapSummary, /Provenance généralisée/);
});

test('buildIntrigueMapOverlay exposes fog-safe verification audit trails', () => {
  const overlay = buildIntrigueMapOverlay([
    new Cellule({
      id: 'cell-confirmed-audit',
      factionId: 'shadow-league',
      codename: 'Beacon',
      locationId: 'confirmed-audit',
      memberIds: ['ag-1'],
      assetIds: ['asset-1'],
      exposure: 82,
    }),
    new Cellule({
      id: 'cell-suspected-audit',
      factionId: 'shadow-league',
      codename: 'Needle',
      locationId: 'suspected-audit',
      memberIds: ['ag-2'],
      assetIds: ['asset-2'],
      exposure: 0,
    }),
    new Cellule({
      id: 'cell-stale-audit',
      factionId: 'shadow-league',
      codename: 'Ember',
      locationId: 'stale-audit',
      memberIds: ['ag-3'],
      assetIds: ['asset-3'],
      exposure: 20,
    }),
    new Cellule({
      id: 'cell-masked-audit',
      factionId: 'shadow-league',
      codename: 'Curtain',
      locationId: 'masked-audit',
      memberIds: ['ag-4'],
      assetIds: ['asset-4'],
      exposure: 0,
    }),
  ], [
    new OperationClandestine({
      id: 'op-suspected-audit',
      celluleId: 'cell-suspected-audit',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Probe route rumor',
      theaterId: 'suspected-audit',
      assignedAgentIds: ['ag-2'],
      requiredAssetIds: ['asset-2'],
      detectionRisk: 82,
      progress: 8,
      heat: 12,
      phase: 'planning',
    }),
  ], { safeMapMode: true });
  const byLocation = new Map(overlay.map((entry) => [entry.locationId, entry.verificationAuditTrail]));

  assert.equal(byLocation.get('confirmed-audit').state, 'visible-audit');
  assert.deepEqual(byLocation.get('confirmed-audit').steps.map((step) => step.stepId), ['local-observation', 'cross-check']);
  assert.equal(byLocation.get('confirmed-audit').steps[0].change, 'confidence-up');
  assert.equal(byLocation.get('confirmed-audit').lastChange, 'residual-risk');
  assert.equal(byLocation.get('confirmed-audit').nextUsefulCheck.action, 'observe-locally');
  assert.match(byLocation.get('confirmed-audit').steps[0].fogSafeCopy, /Aucun détail de cellule, cible, relais ou cause cachée/);

  assert.equal(byLocation.get('suspected-audit').state, 'visible-audit');
  assert.deepEqual(byLocation.get('suspected-audit').steps.map((step) => step.label), ['Source indirecte', 'Confirmation partielle']);
  assert.equal(byLocation.get('suspected-audit').steps[0].evidenceState, 'suspected-evidence');
  assert.equal(byLocation.get('suspected-audit').nextUsefulCheck.action, 'limit-coverage');
  assert.match(byLocation.get('suspected-audit').incidentContext, /Sabotage suspecté/);

  assert.equal(byLocation.get('stale-audit').state, 'visible-audit');
  assert.deepEqual(byLocation.get('stale-audit').steps.map((step) => step.change), ['confidence-down', 'trail-dismissed']);
  assert.equal(byLocation.get('stale-audit').nextUsefulCheck.action, 'wait');
  assert.match(byLocation.get('stale-audit').summary, /Recoupement, Impasse/);

  assert.equal(byLocation.get('masked-audit').state, 'redacted-audit');
  assert.deepEqual(byLocation.get('masked-audit').steps.map((step) => step.stepId), ['dead-end']);
  assert.equal(byLocation.get('masked-audit').lastChange, 'masked');
  assert.equal(byLocation.get('masked-audit').nextUsefulCheck.action, 'ignore');
  assert.match(byLocation.get('masked-audit').safeMapPolicy, /masquées ou généralisées/);
});

test('buildIntrigueMapOverlay exposes fog-safe intrigue signal triage queues', () => {
  const overlay = buildIntrigueMapOverlay([
    new Cellule({
      id: 'cell-verify-triage',
      factionId: 'shadow-league',
      codename: 'Signal',
      locationId: 'verify-triage',
      memberIds: ['ag-1'],
      assetIds: ['asset-1'],
      exposure: 86,
    }),
    new Cellule({
      id: 'cell-monitor-triage',
      factionId: 'shadow-league',
      codename: 'Watcher',
      locationId: 'monitor-triage',
      memberIds: ['ag-2'],
      assetIds: ['asset-2'],
      exposure: 0,
    }),
    new Cellule({
      id: 'cell-dismiss-triage',
      factionId: 'shadow-league',
      codename: 'Old Echo',
      locationId: 'dismiss-triage',
      memberIds: ['ag-3'],
      assetIds: ['asset-3'],
      exposure: 19,
    }),
    new Cellule({
      id: 'cell-masked-triage',
      factionId: 'shadow-league',
      codename: 'Curtain',
      locationId: 'masked-triage',
      memberIds: ['ag-4'],
      assetIds: ['asset-4'],
      exposure: 0,
    }),
  ], [
    new OperationClandestine({
      id: 'op-monitor-triage',
      celluleId: 'cell-monitor-triage',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Probe route rumor',
      theaterId: 'monitor-triage',
      assignedAgentIds: ['ag-2'],
      requiredAssetIds: ['asset-2'],
      detectionRisk: 76,
      progress: 7,
      heat: 10,
      phase: 'planning',
    }),
  ], { safeMapMode: true });
  const byLocation = new Map(overlay.map((entry) => [entry.locationId, entry.intrigueSignalTriageQueue[0]]));

  assert.equal(byLocation.get('verify-triage').triageClass, 'verify-now');
  assert.equal(byLocation.get('verify-triage').priority, 1);
  assert.equal(byLocation.get('verify-triage').nextLeastExposureCheck.action, 'observe-locally');
  assert.equal(byLocation.get('verify-triage').residualRisk, 'visible-residual-risk');
  assert.match(byLocation.get('verify-triage').rationale, /Source observation directe expurgée/);

  assert.equal(byLocation.get('monitor-triage').triageClass, 'monitor');
  assert.equal(byLocation.get('monitor-triage').label, 'Surveiller');
  assert.equal(byLocation.get('monitor-triage').nextLeastExposureCheck.action, 'limit-coverage');
  assert.equal(byLocation.get('monitor-triage').provenanceType, 'inferred');

  assert.equal(byLocation.get('dismiss-triage').triageClass, 'dismiss-provisionally');
  assert.equal(byLocation.get('dismiss-triage').nextLeastExposureCheck, null);
  assert.match(byLocation.get('dismiss-triage').rationale, /attendre un signal frais/);

  assert.equal(byLocation.get('masked-triage').triageClass, 'keep-masked');
  assert.equal(byLocation.get('masked-triage').priority, 5);
  assert.equal(byLocation.get('masked-triage').nextLeastExposureCheck, null);
  assert.match(byLocation.get('masked-triage').fogSafeCopy, /aucune cellule, relais, cible, méthode sensible ou cause cachée/);
});

test('buildIntrigueMapOverlay exposes fog-safe exposure budgets for priority verifications', () => {
  const overlay = buildIntrigueMapOverlay([
    new Cellule({
      id: 'cell-budget-priority',
      factionId: 'shadow-league',
      codename: 'Budget',
      locationId: 'budget-priority',
      memberIds: ['ag-1'],
      assetIds: ['asset-1'],
      exposure: 88,
    }),
    new Cellule({
      id: 'cell-budget-masked',
      factionId: 'shadow-league',
      codename: 'Curtain',
      locationId: 'budget-masked',
      memberIds: ['ag-2'],
      assetIds: ['asset-2'],
      exposure: 0,
    }),
  ], [
    new OperationClandestine({
      id: 'op-budget-priority',
      celluleId: 'cell-budget-priority',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Pressure visible checkpoint',
      theaterId: 'budget-priority',
      assignedAgentIds: ['ag-1'],
      requiredAssetIds: ['asset-1'],
      detectionRisk: 88,
      progress: 72,
      heat: 76,
      phase: 'execution',
    }),
  ], { safeMapMode: true });
  const byLocation = new Map(overlay.map((entry) => [entry.locationId, entry.exposureBudgetForPriorityVerifications]));
  const priorityBudget = byLocation.get('budget-priority');
  const maskedBudget = byLocation.get('budget-masked');

  assert.equal(priorityBudget.state, 'visible-budget');
  assert.equal(priorityBudget.triageClass, 'verify-now');
  assert.equal(priorityBudget.nextLeastExposureCheck.action, 'observe-locally');
  assert.equal(priorityBudget.nextLeastExposureCheck.exposureBand, 'medium');
  assert.equal(priorityBudget.residualRisk, 'visible-residual-risk');
  assert.deepEqual(priorityBudget.entries.map((entry) => entry.relationship), ['compatible', 'mutually-risky']);
  assert.match(priorityBudget.comparisonSummary, /augmente mutuellement le risque/);
  assert.match(priorityBudget.safeMapPolicy, /ne révèle jamais cible, relais, méthode sensible ou vérité cachée/);

  assert.equal(maskedBudget.state, 'masked-budget');
  assert.deepEqual(maskedBudget.entries, []);
  assert.equal(maskedBudget.nextLeastExposureCheck, undefined);
  assert.match(maskedBudget.summary, /données de provenance ou de confiance insuffisantes/);
});

test('buildIntrigueMapOverlay resolves fog-safe verification exposure conflicts', () => {
  const overlay = buildIntrigueMapOverlay([
    new Cellule({
      id: 'cell-conflict-resolver',
      factionId: 'shadow-league',
      codename: 'Resolver',
      locationId: 'conflict-resolver',
      memberIds: ['ag-1'],
      assetIds: ['asset-1'],
      exposure: 90,
    }),
    new Cellule({
      id: 'cell-masked-resolver',
      factionId: 'shadow-league',
      codename: 'Unknown',
      locationId: 'masked-resolver',
      memberIds: ['ag-2'],
      assetIds: ['asset-2'],
      exposure: 0,
    }),
  ], [
    new OperationClandestine({
      id: 'op-conflict-resolver',
      celluleId: 'cell-conflict-resolver',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Contest a visible route',
      theaterId: 'conflict-resolver',
      assignedAgentIds: ['ag-1'],
      requiredAssetIds: ['asset-1'],
      detectionRisk: 90,
      progress: 78,
      heat: 82,
      phase: 'execution',
    }),
  ], { safeMapMode: true });
  const byLocation = new Map(overlay.map((entry) => [entry.locationId, entry.verificationConflictResolver]));
  const conflict = byLocation.get('conflict-resolver');
  const masked = byLocation.get('masked-resolver');

  assert.equal(conflict.state, 'conflict-detected');
  assert.equal(conflict.launchNow.checkId, 'observe-local-confirmation');
  assert.equal(conflict.defer.checkId, 'broad-coverage-now');
  assert.equal(conflict.defer.exposureBand, 'high');
  assert.equal(conflict.abandonIfNeeded, null);
  assert.equal(conflict.provenanceLink, 'observed:residual-risk');
  assert.match(conflict.consequence, /priorité à la vérification la moins exposée/);
  assert.match(conflict.safeMapPolicy, /ne révèle jamais cible, relais, méthode sensible ou vérité cachée/);

  assert.equal(masked.state, 'masked-conflict');
  assert.equal(masked.launchNow, null);
  assert.equal(masked.defer, null);
  assert.match(masked.summary, /budget ou provenance insuffisant/);
  assert.match(masked.safeMapPolicy, /Aucune cible, relais, méthode sensible ou vérité cachée/);
});

test('buildIntrigueMapOverlay recaps verification resolver outcomes without leaking fog-of-war details', () => {
  const overlay = buildIntrigueMapOverlay([
    new Cellule({
      id: 'cell-outcome-recap',
      factionId: 'shadow-league',
      codename: 'Outcome',
      locationId: 'outcome-recap',
      memberIds: ['ag-1'],
      assetIds: ['asset-1'],
      exposure: 92,
    }),
    new Cellule({
      id: 'cell-outcome-masked',
      factionId: 'shadow-league',
      codename: 'Hidden',
      locationId: 'outcome-masked',
      memberIds: ['ag-2'],
      assetIds: ['asset-2'],
      exposure: 0,
    }),
  ], [
    new OperationClandestine({
      id: 'op-outcome-recap',
      celluleId: 'cell-outcome-recap',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Verify visible aftermath',
      theaterId: 'outcome-recap',
      assignedAgentIds: ['ag-1'],
      requiredAssetIds: ['asset-1'],
      detectionRisk: 92,
      progress: 80,
      heat: 86,
      phase: 'execution',
    }),
  ], { safeMapMode: true });
  const byLocation = new Map(overlay.map((entry) => [entry.locationId, entry.verificationOutcomeRecap]));
  const recap = byLocation.get('outcome-recap');
  const masked = byLocation.get('outcome-masked');

  assert.equal(recap.state, 'resolved-with-deferrals');
  assert.equal(recap.sourceResolverState, 'conflict-detected');
  assert.equal(recap.retainedVerifications[0].checkId, 'observe-local-confirmation');
  assert.equal(recap.retainedVerifications[0].outcome, 'retained');
  assert.equal(recap.delayedVerifications[0].checkId, 'broad-coverage-now');
  assert.equal(recap.delayedVerifications[0].outcome, 'delayed');
  assert.equal(recap.exposureConsumed, 8);
  assert.equal(recap.exposureBudgetRemaining, 4);
  assert.equal(recap.nextSafeVerification.checkId, 'observe-local-confirmation');
  assert.match(recap.remainingUncertainties.join(' '), /cause précise et les relais restent masqués/);
  assert.match(recap.safeMapPolicy, /sans révéler cellule, relais, cible, méthode sensible ou cause cachée/);

  assert.equal(masked.state, 'masked-recap');
  assert.deepEqual(masked.retainedVerifications, []);
  assert.equal(masked.exposureBudgetRemaining, null);
  assert.equal(masked.nextSafeVerification, null);
  assert.match(masked.remainingUncertainties.join(' '), /Provenance insuffisante/);
});

test('buildIntrigueMapOverlay plans fog-safe recheck queues for unresolved intrigue uncertainties', () => {
  const overlay = buildIntrigueMapOverlay([
    new Cellule({
      id: 'cell-recheck-queue',
      factionId: 'shadow-league',
      codename: 'Queue',
      locationId: 'recheck-queue',
      memberIds: ['ag-1'],
      assetIds: ['asset-1'],
      exposure: 92,
    }),
    new Cellule({
      id: 'cell-recheck-masked',
      factionId: 'shadow-league',
      codename: 'Masked Queue',
      locationId: 'recheck-masked',
      memberIds: ['ag-2'],
      assetIds: ['asset-2'],
      exposure: 0,
    }),
  ], [
    new OperationClandestine({
      id: 'op-recheck-queue',
      celluleId: 'cell-recheck-queue',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Keep uncertainty visible',
      theaterId: 'recheck-queue',
      assignedAgentIds: ['ag-1'],
      requiredAssetIds: ['asset-1'],
      detectionRisk: 92,
      progress: 80,
      heat: 86,
      phase: 'execution',
    }),
  ], { safeMapMode: true });
  const byLocation = new Map(overlay.map((entry) => [entry.locationId, entry.intrigueRecheckQueue]));
  const queue = byLocation.get('recheck-queue');
  const masked = byLocation.get('recheck-masked');

  assert.equal(queue.state, 'rechecks-planned');
  assert.equal(queue.budgetRemaining, 4);
  assert.equal(queue.budgetLink, 'visible-budget');
  assert.equal(queue.provenanceLink, 'observed:residual-risk');
  assert.equal(queue.entries[0].status, 'queued-for-safe-window');
  assert.equal(queue.entries[0].safeWindow, 'prochain créneau de faible exposition');
  assert.equal(queue.entries[0].recommendedCheck.checkId, 'observe-local-confirmation');
  assert.match(queue.entries[0].triggerCondition, /risque résiduel reste visible/);
  assert.equal(queue.blockedRechecks[0].checkId, 'broad-coverage-now');
  assert.match(queue.blockedRechecks[0].reason, /augmente trop l’exposition/);
  assert.deepEqual(queue.retainedResultIds, ['observe-local-confirmation']);
  assert.deepEqual(queue.delayedResultIds, ['broad-coverage-now']);
  assert.match(queue.safeMapPolicy, /budget restant et de la provenance visible/);

  assert.equal(masked.state, 'masked-recheck-queue');
  assert.deepEqual(masked.entries, []);
  assert.equal(masked.blockedRechecks.length, 1);
  assert.match(masked.blockedRechecks[0].triggerCondition, /provenance visible/);
  assert.match(masked.safeMapPolicy, /aucune cellule, relais, cible, méthode sensible ou cause cachée/);
});

test('buildIntrigueMapOverlay marks ageing priority for fog-safe recheck queue uncertainties', () => {
  const overlay = buildIntrigueMapOverlay([
    new Cellule({
      id: 'cell-ageing-urgent',
      factionId: 'shadow-league',
      codename: 'Ageing',
      locationId: 'ageing-urgent',
      memberIds: ['ag-1'],
      assetIds: ['asset-1'],
      exposure: 92,
    }),
    new Cellule({
      id: 'cell-ageing-watch',
      factionId: 'shadow-league',
      codename: 'Budget Watch',
      locationId: 'ageing-watch',
      memberIds: ['ag-2'],
      assetIds: ['asset-2'],
      exposure: 99,
    }),
  ], [
    new OperationClandestine({
      id: 'op-ageing-urgent',
      celluleId: 'cell-ageing-urgent',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Age visible uncertainty',
      theaterId: 'ageing-urgent',
      assignedAgentIds: ['ag-1'],
      requiredAssetIds: ['asset-1'],
      detectionRisk: 92,
      progress: 80,
      heat: 86,
      phase: 'execution',
    }),
    new OperationClandestine({
      id: 'op-ageing-watch',
      celluleId: 'cell-ageing-watch',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Consume visible budget',
      theaterId: 'ageing-watch',
      assignedAgentIds: ['ag-2'],
      requiredAssetIds: ['asset-2'],
      detectionRisk: 99,
      progress: 94,
      heat: 99,
      phase: 'execution',
    }),
  ], { safeMapMode: true });
  const byLocation = new Map(overlay.map((entry) => [entry.locationId, entry.intrigueRecheckQueue]));
  const urgentQueue = byLocation.get('ageing-urgent');
  assert.equal(byLocation.get('ageing-watch').entries[0].ageIndicator.state, 'urgent');

  assert.equal(urgentQueue.entries[0].ageIndicator.state, 'urgent');
  assert.equal(urgentQueue.entries[0].priorityLabel, 'Urgent');
  assert.equal(urgentQueue.entries[0].ageIndicator.origin, 'unknown-origin');
  assert.match(urgentQueue.entries[0].ageIndicator.fallback, /Origine non datée/);
  assert.match(urgentQueue.entries[0].ageIndicator.reliabilityCue, /re-vérification prochaine/);
  assert.match(urgentQueue.ageingSummary, /Urgent:/);

  assert.equal(urgentQueue.entries[1].ageIndicator.state, 'watch');
  assert.equal(urgentQueue.entries[1].priorityLabel, 'À surveiller');
  assert.match(urgentQueue.entries[1].ageIndicator.reliabilityCue, /attendre un créneau sûr/);
  assert.match(urgentQueue.entries[1].ageIndicator.fallback, /vieillissement affiché comme surveillance prudente/);
});

test('buildIntrigueMapOverlay proposes fog-safe escalation prompts for ageing intrigue uncertainties', () => {
  const overlay = buildIntrigueMapOverlay([
    new Cellule({
      id: 'cell-escalate-now',
      factionId: 'shadow-league',
      codename: 'Escalate',
      locationId: 'escalate-now',
      memberIds: ['ag-1'],
      assetIds: ['asset-1'],
      exposure: 92,
    }),
    new Cellule({
      id: 'cell-escalate-budget',
      factionId: 'shadow-league',
      codename: 'Budget Hold',
      locationId: 'escalate-budget',
      memberIds: ['ag-2'],
      assetIds: ['asset-2'],
      exposure: 99,
    }),
    new Cellule({
      id: 'cell-escalate-masked',
      factionId: 'shadow-league',
      codename: 'Masked Escalation',
      locationId: 'escalate-masked',
      memberIds: ['ag-3'],
      assetIds: ['asset-3'],
      exposure: 0,
    }),
  ], [
    new OperationClandestine({
      id: 'op-escalate-now',
      celluleId: 'cell-escalate-now',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Age into escalation',
      theaterId: 'escalate-now',
      assignedAgentIds: ['ag-1'],
      requiredAssetIds: ['asset-1'],
      detectionRisk: 92,
      progress: 80,
      heat: 86,
      phase: 'execution',
    }),
    new OperationClandestine({
      id: 'op-escalate-budget',
      celluleId: 'cell-escalate-budget',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Drain recheck budget',
      theaterId: 'escalate-budget',
      assignedAgentIds: ['ag-2'],
      requiredAssetIds: ['asset-2'],
      detectionRisk: 99,
      progress: 94,
      heat: 99,
      phase: 'execution',
    }),
  ], { safeMapMode: true });
  const byLocation = new Map(overlay.map((entry) => [entry.locationId, entry.intrigueEscalationPrompts]));
  const urgent = byLocation.get('escalate-now');
  const budget = byLocation.get('escalate-budget');
  const masked = byLocation.get('escalate-masked');

  assert.equal(urgent.state, 'escalation-needed');
  assert.equal(urgent.prompts[0].action, 'verify-now');
  assert.equal(urgent.prompts[0].label, 'Vérifier maintenant');
  assert.match(urgent.prompts[0].reason, /Attendre devient plus risqué/);
  assert.match(urgent.prompts[0].exposureCostCue, /budget restant 4/);
  assert.match(urgent.prompts[0].originFallback, /Origine non datée/);
  assert.equal(urgent.blockedPrompts[0].action, 'abandon-provisionally');
  assert.match(urgent.safeMapPolicy, /ne révèlent jamais cible, cellule, relais, cause ou vérité cachée/);

  assert.equal(budget.state, 'escalation-needed');
  assert.equal(urgent.prompts[1].action, 'wait-for-budget');
  assert.equal(urgent.prompts[1].label, 'Budget insuffisant');
  assert.match(urgent.prompts[1].exposureCostCue, /relance différée/);

  assert.equal(masked.state, 'masked-escalation');
  assert.deepEqual(masked.prompts, []);
  assert.equal(masked.blockedPrompts[0].action, 'do-not-escalate');
  assert.match(masked.summary, /attendre une provenance visible/);
});

test('buildIntrigueMapOverlay recaps fog-safe outcomes for escalation prompt choices', () => {
  const overlay = buildIntrigueMapOverlay([
    new Cellule({
      id: 'cell-outcome-now',
      factionId: 'shadow-league',
      codename: 'Outcome Now',
      locationId: 'outcome-now',
      memberIds: ['ag-1'],
      assetIds: ['asset-1'],
      exposure: 92,
    }),
    new Cellule({
      id: 'cell-outcome-budget',
      factionId: 'shadow-league',
      codename: 'Outcome Budget',
      locationId: 'outcome-budget',
      memberIds: ['ag-2'],
      assetIds: ['asset-2'],
      exposure: 99,
    }),
    new Cellule({
      id: 'cell-outcome-masked',
      factionId: 'shadow-league',
      codename: 'Outcome Masked',
      locationId: 'outcome-masked',
      memberIds: ['ag-3'],
      assetIds: ['asset-3'],
      exposure: 0,
    }),
  ], [
    new OperationClandestine({
      id: 'op-outcome-now',
      celluleId: 'cell-outcome-now',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Escalation outcome recap',
      theaterId: 'outcome-now',
      assignedAgentIds: ['ag-1'],
      requiredAssetIds: ['asset-1'],
      detectionRisk: 92,
      progress: 80,
      heat: 86,
      phase: 'execution',
    }),
    new OperationClandestine({
      id: 'op-outcome-budget',
      celluleId: 'cell-outcome-budget',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Blocked budget outcome recap',
      theaterId: 'outcome-budget',
      assignedAgentIds: ['ag-2'],
      requiredAssetIds: ['asset-2'],
      detectionRisk: 99,
      progress: 94,
      heat: 99,
      phase: 'execution',
    }),
  ], { safeMapMode: true });
  const byLocation = new Map(overlay.map((entry) => [entry.locationId, entry.intrigueEscalationOutcomeRecap]));
  const active = byLocation.get('outcome-now');
  const budget = byLocation.get('outcome-budget');
  const masked = byLocation.get('outcome-masked');

  assert.equal(active.state, 'budget-blocked-outcomes');
  assert.equal(active.choices[0].action, 'verify-now');
  assert.match(active.choices[0].expectedEffect, /Résout ou réduit l’incertitude/);
  assert.match(active.choices[0].priorityEffect, /priorité baisse/);
  assert.match(active.choices[0].ageEffect, /remis à zéro/);
  assert.match(active.choices[0].budgetEffect, /budget restant 4/);
  assert.match(active.choices[0].confidenceEffect, /sans confirmer de vérité cachée/);
  assert.equal(active.choices[1].action, 'wait-for-budget');
  assert.equal(active.choices[1].blockedBy, 'insufficient-budget');
  assert.match(active.blockedChoices[0].expectedEffect, /Abandon provisoire/);
  assert.equal(active.blockedChoices[0].blockedBy, 'over-exposure-risk');
  assert.match(active.safeMapPolicy, /ne révèle jamais cible, cellule, relais, cause, méthode ou vérité cachée/);

  assert.equal(budget.state, 'budget-blocked-outcomes');
  assert.ok(budget.choices.some((choice) => choice.blockedBy === 'insufficient-budget'));
  assert.match(budget.summary, /bloquées par budget/);

  assert.equal(masked.state, 'masked-outcome-recap');
  assert.deepEqual(masked.choices, []);
  assert.equal(masked.blockedChoices[0].blockedBy, 'unknown-provenance');
  assert.match(masked.summary, /provenance reste insuffisante/);
});
