import test from 'node:test';
import assert from 'node:assert/strict';

import { buildIntrigueTurnReportDeltas } from '../../../src/ui/intrigue/buildIntrigueTurnReportDeltas.js';

const province = { provinceId: 'ashlands', label: 'Ashlands' };

function buildIntrigueView(responseOverrides = {}) {
  const response = {
    code: 'contenir',
    label: 'Contenir',
    cooldownTurns: 2,
    heatGenerated: 17,
    escalationProbability: 'moyenne',
    effect: 'cellule compromise: pression sécuritaire immédiate; opération execution ralentie',
    ...responseOverrides,
  };

  return {
    selectedProvince: {
      drillDown: {
        locationId: 'ashlands',
        locationName: 'Ashlands',
        recommendedResponseCode: response.code,
        quickResponses: [response],
        responseAftermath: {
          retaliationRisk: response.escalationProbability === 'élevée' ? 'élevé' : 'modéré',
          summary: 'Plus sûre: Infiltrer; plus efficace: Contenir; représailles modéré.',
        },
      },
    },
    map: { entries: [] },
  };
}

test('buildIntrigueTurnReportDeltas summarizes resolved intrigue action deltas', () => {
  const report = buildIntrigueTurnReportDeltas(province, buildIntrigueView(), { previousActionCode: 'contenir' });

  assert.equal(report.tone, 'improved');
  assert.equal(report.previousAction, 'Action Delta résolue: Contenir sur Ashlands.');
  assert.equal(report.retaliationRisk, 'modéré');
  assert.match(report.summary, /Sabotage évité|Menace contenue/);
  assert.deepEqual(report.deltas.map((delta) => delta.type).sort(), ['cooldown', 'network', 'threat']);
  assert.ok(report.deltas.some((delta) => delta.label === 'Cooldown restant' && /chaleur générée \+17/.test(delta.detail)));
});

test('buildIntrigueTurnReportDeltas marks aggravated and exposed aftermath clearly', () => {
  const report = buildIntrigueTurnReportDeltas(province, buildIntrigueView({
    code: 'exposer',
    label: 'Exposer',
    escalationProbability: 'élevée',
    cooldownTurns: 1,
    heatGenerated: 23,
    effect: 'cellule exposée: preuve rendue exploitable, réseau adverse alerté',
  }));

  assert.equal(report.tone, 'worse');
  assert.equal(report.retaliationRisk, 'élevé');
  assert.equal(report.deltas[0].label, 'Menace aggravée');
  assert.ok(report.deltas.some((delta) => delta.label === 'Réseau exposé'));
});

test('buildIntrigueTurnReportDeltas flags changed timing recommendations fog-safely', () => {
  const view = buildIntrigueView();
  view.selectedProvince.drillDown.postRecapStabilizationChoices = {
    timingComparison: {
      recommendedTiming: 'short-wait',
      dominantReason: 'exposition',
      actNow: { risk: 'exposition visible défavorable' },
      shortWait: { outcome: 'Attendre un tour peut rouvrir une fenêtre moins coûteuse.' },
      summary: 'Temporiser est meilleur maintenant: l’exposition domine la décision visible.',
    },
  };

  const report = buildIntrigueTurnReportDeltas(province, view, {
    previousActionCode: 'contenir',
    previousTimingRecommendation: 'act-now',
  });

  assert.deepEqual(report.timingRecommendationChange, {
    previousTiming: 'act-now',
    currentTiming: 'short-wait',
    direction: 'agir maintenant → attendre',
    cause: 'exposition',
    tone: 'watch',
    label: 'Timing recommandé modifié',
    detail: 'agir maintenant → attendre: cause visible exposition.',
    confidenceShift: {
      variation: 'baisse',
      cause: 'exposition',
      justifies: 'short-wait',
      label: 'baisse: exposition',
      justification: 'la confiance fragile justifie d’attendre un signal plus sûr avant d’agir',
    },
    fogSafe: true,
    minimumVerificationPrompt: {
      state: 'low-confidence',
      confidence: 'baisse',
      cause: 'exposition',
      verification: 'Vérifier le niveau d’exposition visible avant d’engager une réponse lourde.',
      waitLessRisky: true,
      summary: 'Attendre un tour est moins risqué que forcer l’action tant que la confiance reste basse.',
      waitVerificationRequirement: {
        state: 'mandatory-before-wait',
        mandatory: true,
        reason: 'confiance basse: attendre sans vérifier risque de figer une lecture dégradée',
        consequence: 'Conséquence probable: le signal vieillit et la vérification suivante sera moins fiable.',
        fallback: false,
      },
      safestMinimalVerification: {
        state: 'minimal-sufficient',
        recommended: true,
        principalRisk: 'exposition excessive',
        label: 'Contrôle exposition minimal',
        action: 'Comparer seulement le niveau d’exposition visible au seuil sûr avant d’attendre.',
        whyEnough: 'Ce contrôle suffit si l’exposition repasse sous le seuil lisible sans rouvrir la cible masquée.',
        unlockNextTurn: 'Au prochain tour, elle permettra de choisir plus sûrement entre attendre encore ou agir sans surcharger la revue.',
        followUpOptions: [
          {
            type: 'defensive',
            label: 'Défensif',
            consequence: 'réduire l’exposition avant toute réponse lourde',
            expiry: {
              state: 'expiring',
              label: 'à traiter maintenant',
              detail: 'l’exposition peut devenir moins récupérable après le prochain tour',
            },
          },
          {
            type: 'wait',
            label: 'Attente',
            consequence: 'attendre un tour si le seuil visible redevient sûr',
            expiry: {
              state: 'available',
              label: 'reste disponible',
              detail: 'aucune expiration visible avec les signaux actuels',
            },
          },
          {
            type: 'offensive',
            label: 'Offensif',
            consequence: 'agir seulement si l’exposition reste maîtrisée',
            expiry: {
              state: 'available',
              label: 'reste disponible',
              detail: 'aucune expiration visible avec les signaux actuels',
            },
          },
        ],
        followUpExpirySummary: '1 suite à traiter vite avant dégradation.',
        safestImmediateFollowUp: {
          state: 'single-expiring',
          recommended: true,
          type: 'defensive',
          label: 'Défensif',
          action: 'réduire l’exposition avant toute réponse lourde',
          reason: 'à traiter maintenant: l’exposition peut devenir moins récupérable après le prochain tour',
          fallback: false,
        },
        backupFollowUp: {
          state: 'available-backup',
          recommended: true,
          type: 'wait',
          label: 'Attente',
          action: 'attendre un tour si le seuil visible redevient sûr',
          when: 'à utiliser si l’exposition remonte ou si la suite principale devient indisponible',
          urgency: 'reste disponible',
          fallback: false,
        },
        switchToBackupTrigger: {
          state: 'visible-trigger',
          recommended: true,
          label: 'Déclencheur de relais',
          signal: 'basculer si l’exposition visible repasse au-dessus du seuil sûr',
          backup: 'Attente',
          reason: 'signal fog-safe: exposition, confiance, disponibilité ou timing visible seulement',
          fallback: false,
        },
        returnFromBackupCondition: {
          state: 'near',
          recommended: true,
          label: 'Retour au suivi initial',
          condition: 'revenir au suivi initial si l’exposition reste sous le seuil sûr après le contrôle',
          primary: 'Défensif',
          backup: 'Attente',
          detail: 'condition proche si le prochain contrôle confirme le signal visible',
          durability: {
            stability: 'fragile-return',
            label: 'Retour fragile.',
            cause: 'dépendance non vérifiée',
            advice: 'Retour possible mais temporaire: confirmer le signal avant de quitter le backup.',
          },
          stabilizationBeforeReturn: {
            state: 'secure-dependency-before-return',
            label: 'Sécuriser la dépendance',
            action: 'sécuriser la dépendance visible avant de restaurer le suivi initial',
            reason: 'la dépendance non vérifiée est le point le plus susceptible de recréer un backup immédiat',
            recommended: true,
            backup: 'Attente',
            stabilizes: 'stabilise le retour sans révéler de cible ou signal masqué',
            fallback: false,
          },
          fallback: false,
        },
        fullReviewRequired: false,
        fallback: false,
      },
    },
  });
  assert.ok(report.deltas.some((delta) => delta.type === 'timing' && delta.detail === 'agir maintenant → attendre: cause visible exposition.'));
});

test('buildIntrigueTurnReportDeltas explains confidence loss when timing flips to act now', () => {
  const view = buildIntrigueView();
  view.selectedProvince.drillDown.postRecapStabilizationChoices = {
    timingComparison: {
      recommendedTiming: 'act-now',
      dominantReason: 'fenêtre-adverse',
      actNow: { outcome: 'Stabiliser verrouille la fenêtre sûre visible.' },
      shortWait: { risk: 'signal vieilli et délai de recheck plus coûteux' },
      summary: 'Choix urgent: la fenêtre visible se dégrade plus vite que le bénéfice d’attendre.',
    },
  };

  const report = buildIntrigueTurnReportDeltas(province, view, {
    previousActionCode: 'contenir',
    previousTimingRecommendation: 'short-wait',
  });

  assert.equal(report.timingRecommendationChange.direction, 'attendre → agir maintenant');
  assert.deepEqual(report.timingRecommendationChange.confidenceShift, {
    variation: 'baisse',
    cause: 'délai',
    justifies: 'act-now',
    label: 'baisse: délai',
    justification: 'la perte de confiance rend l’attente plus risquée que l’action immédiate',
  });
  assert.deepEqual(report.minimumVerificationPrompt, {
    state: 'low-confidence',
    confidence: 'baisse',
    cause: 'délai',
    verification: 'Confirmer que le signal n’a pas vieilli avant de forcer l’action immédiate.',
    waitLessRisky: false,
    summary: 'Agir maintenant reste indiqué, mais seulement après une vérification minimale du signal visible.',
    waitVerificationRequirement: {
      state: 'mandatory-before-wait',
      mandatory: true,
      reason: 'timing fragile: la fenêtre visible peut se refermer avant le prochain tour',
      consequence: 'Conséquence probable: la réponse immédiate perd sa fenêtre et le prochain recheck coûtera plus cher.',
      fallback: false,
    },
    safestMinimalVerification: {
      state: 'minimal-sufficient',
      recommended: true,
      principalRisk: 'timing fragile',
      label: 'Contrôle fraîcheur du signal',
      action: 'Vérifier que le signal de timing n’a pas vieilli depuis le dernier tour.',
      whyEnough: 'La fraîcheur confirmée suffit à débloquer une attente courte sans refaire toute l’enquête.',
      unlockNextTurn: 'Au prochain tour, elle permettra de confirmer si l’action immédiate reste nécessaire ou si attendre redevient sûr.',
      followUpOptions: [
        {
          type: 'offensive',
          label: 'Offensif',
          consequence: 'agir vite si la fenêtre visible se ferme',
          expiry: {
            state: 'expiring',
            label: 'expire vite',
            detail: 'la fenêtre peut se refermer après ce tour',
          },
        },
        {
          type: 'defensive',
          label: 'Défensif',
          consequence: 'limiter le coût d’un recheck si la fenêtre est perdue',
          expiry: {
            state: 'expiring',
            label: 'fiabilité en baisse',
            detail: 'le recheck devient moins fiable si le signal vieillit',
          },
        },
      ],
      followUpExpirySummary: '2 suites à traiter vite avant dégradation.',
      safestImmediateFollowUp: {
        state: 'recommended',
        recommended: true,
        type: 'offensive',
        label: 'Offensif',
        action: 'agir vite si la fenêtre visible se ferme',
        reason: 'expire vite: la fenêtre peut se refermer après ce tour',
        fallback: false,
      },
      backupFollowUp: {
        state: 'expiring-backup',
        recommended: true,
        type: 'defensive',
        label: 'Défensif',
        action: 'limiter le coût d’un recheck si la fenêtre est perdue',
        when: 'à utiliser si l’exposition visible monte ou si la fenêtre offensive devient trop exposée',
        urgency: 'fiabilité en baisse',
        fallback: false,
      },
      switchToBackupTrigger: {
        state: 'visible-trigger',
        recommended: true,
        label: 'Déclencheur de relais',
        signal: 'basculer si la fenêtre principale n’est plus fraîche ou devient indisponible',
        backup: 'Défensif',
        reason: 'signal fog-safe: exposition, confiance, disponibilité ou timing visible seulement',
        fallback: false,
      },
      returnFromBackupCondition: {
        state: 'unlikely-this-turn',
        recommended: true,
        label: 'Retour au suivi initial',
        condition: 'revenir au suivi initial seulement si la fenêtre redevient fraîche et disponible ce tour-ci',
        primary: 'Offensif',
        backup: 'Défensif',
        detail: 'condition improbable ce tour-ci sans signal visible plus frais',
        durability: {
          stability: 'stay-on-backup-advised',
          label: 'Rester sur backup conseillé.',
          cause: 'timing expirant',
          advice: 'Le retour risque de recréer un backup immédiatement après.',
        },
        stabilizationBeforeReturn: {
          state: 'hold-backup-before-return',
          label: 'Maintenir la sauvegarde',
          action: 'maintenir la sauvegarde jusqu’à une fenêtre de retour fraîche',
          reason: 'le timing expirant peut forcer une nouvelle bascule si le retour est tenté trop tôt',
          recommended: true,
          backup: 'Défensif',
          stabilizes: 'stabilise le retour sans révéler de cible ou signal masqué',
          fallback: false,
        },
        fallback: false,
      },
      fullReviewRequired: false,
      fallback: false,
    },
  });
});

test('buildIntrigueTurnReportDeltas requires full review when minimal verification finds a contradictory signal', () => {
  const view = buildIntrigueView();
  view.selectedProvince.drillDown.postRecapStabilizationChoices = {
    timingComparison: {
      recommendedTiming: 'short-wait',
      dominantReason: 'priorité inversée',
      actNow: { risk: 'indice A pousse à agir' },
      shortWait: { outcome: 'indice B pousse à temporiser' },
      summary: 'Les indices visibles ne pointent pas dans le même sens.',
    },
  };

  const report = buildIntrigueTurnReportDeltas(province, view, {
    previousActionCode: 'contenir',
    previousTimingRecommendation: 'act-now',
  });

  assert.equal(report.minimumVerificationPrompt.cause, 'signal contradictoire');
  assert.deepEqual(report.minimumVerificationPrompt.safestMinimalVerification, {
    state: 'full-review-needed',
    recommended: true,
    principalRisk: 'signal contradictoire',
    label: 'Recoupement fog-safe rapide',
    action: 'Comparer le signal principal avec un second indice visible avant de choisir attendre.',
    whyEnough: 'Un second indice aligné suffit; s’il diverge, une revue complète reste nécessaire.',
    unlockNextTurn: 'Au prochain tour, elle réduira l’incertitude pour choisir entre agir maintenant ou lancer une revue complète.',
    followUpOptions: [
      {
        type: 'offensive',
        label: 'Offensif',
        consequence: 'agir si les deux indices visibles convergent',
        expiry: {
          state: 'available',
          label: 'reste disponible',
          detail: 'aucune expiration visible avec les signaux actuels',
        },
      },
      {
        type: 'defensive',
        label: 'Défensif',
        consequence: 'basculer en revue complète si le recoupement diverge',
        expiry: {
          state: 'expiring',
          label: 'à recouper vite',
          detail: 'la contradiction devient moins lisible si elle attend',
        },
      },
    ],
    followUpExpirySummary: '1 suite à traiter vite avant dégradation.',
    safestImmediateFollowUp: {
      state: 'single-expiring',
      recommended: true,
      type: 'defensive',
      label: 'Défensif',
      action: 'basculer en revue complète si le recoupement diverge',
      reason: 'à recouper vite: la contradiction devient moins lisible si elle attend',
      fallback: false,
    },
    backupFollowUp: {
      state: 'none-visible',
      recommended: false,
      label: 'Aucun relais prudent visible',
      reason: 'aucune option plus prudente n’est visible sans rouvrir l’analyse',
      fallback: true,
    },
    switchToBackupTrigger: {
      state: 'no-trigger',
      recommended: false,
      label: 'Aucun déclencheur fiable visible',
      reason: 'pas assez de signaux visibles pour recommander une bascule sans rouvrir l’analyse',
      fallback: true,
    },
    returnFromBackupCondition: {
      state: 'no-return-signal',
      recommended: false,
      label: 'Retour au suivi initial non lisible',
      condition: 'aucun backup actif ou suivi initial fiable à restaurer',
      fallback: true,
    },
    fullReviewRequired: true,
    fallback: false,
  });
});

test('buildIntrigueTurnReportDeltas falls back when expiring follow-ups have no clear safest winner', () => {
  const view = buildIntrigueView();
  view.selectedProvince.drillDown.postRecapStabilizationChoices = {
    timingComparison: {
      recommendedTiming: 'act-now',
      dominantReason: 'information-manquante',
      actNow: { risk: 'couverture visible encore fragile' },
      shortWait: { outcome: 'temporiser peut réduire le doute si la couverture tient' },
      summary: 'Confiance fragile: la couverture visible doit être stabilisée pour choisir.',
    },
  };

  const report = buildIntrigueTurnReportDeltas(province, view, {
    previousActionCode: 'contenir',
    previousTimingRecommendation: 'short-wait',
  });

  assert.equal(report.minimumVerificationPrompt.safestMinimalVerification.principalRisk, 'confiance basse');
  assert.deepEqual(report.minimumVerificationPrompt.safestMinimalVerification.safestImmediateFollowUp, {
    state: 'no-clear-winner',
    recommended: false,
    label: 'Priorité immédiate à confirmer',
    reason: 'plusieurs suites expirent avec le même niveau de sûreté visible',
    candidates: ['Défensif', 'Offensif'],
    fallback: true,
  });
  assert.deepEqual(report.minimumVerificationPrompt.safestMinimalVerification.backupFollowUp, {
    state: 'no-primary',
    recommended: false,
    label: 'Aucun relais prudent visible',
    reason: 'pas de suite principale sûre à seconder',
    fallback: true,
  });
  assert.deepEqual(report.minimumVerificationPrompt.safestMinimalVerification.switchToBackupTrigger, {
    state: 'no-trigger',
    recommended: false,
    label: 'Aucun déclencheur fiable visible',
    reason: 'pas assez de signaux visibles pour recommander une bascule sans rouvrir l’analyse',
    fallback: true,
  });
  assert.deepEqual(report.minimumVerificationPrompt.safestMinimalVerification.returnFromBackupCondition, {
    state: 'no-return-signal',
    recommended: false,
    label: 'Retour au suivi initial non lisible',
    condition: 'aucun backup actif ou suivi initial fiable à restaurer',
    fallback: true,
  });
});


test('buildIntrigueTurnReportDeltas marks stable return when backup can safely hand back to the initial follow-up', () => {
  const view = buildIntrigueView();
  view.selectedProvince.drillDown.postRecapStabilizationChoices = {
    timingComparison: {
      recommendedTiming: 'short-wait',
      dominantReason: 'information-manquante',
      actNow: { risk: 'couverture visible encore fragile' },
      shortWait: { outcome: 'la couverture visible se consolide sans nouveau bruit' },
      summary: 'Confiance basse: la couverture visible peut se stabiliser.',
    },
  };

  const report = buildIntrigueTurnReportDeltas(province, view, {
    previousActionCode: 'contenir',
    previousTimingRecommendation: 'act-now',
  });

  assert.deepEqual(report.minimumVerificationPrompt.safestMinimalVerification.returnFromBackupCondition.durability, {
    stability: 'stable-return',
    label: 'Retour stable.',
    cause: 'information manquante',
    advice: 'Le suivi initial peut tenir sans forcer un nouveau backup immédiat.',
  });
});

test('buildIntrigueTurnReportDeltas returns a neutral prompt when confidence is sufficient', () => {
  const report = buildIntrigueTurnReportDeltas(province, buildIntrigueView(), { previousActionCode: 'contenir' });

  assert.deepEqual(report.minimumVerificationPrompt, {
    state: 'sufficient-confidence',
    confidence: 'suffisante',
    cause: 'aucun changement de timing confirmé',
    verification: 'Aucune vérification minimale requise avant l’action recommandée.',
    waitLessRisky: false,
    summary: 'Confiance suffisante: garder la recommandation actuelle sans étape de vérification supplémentaire.',
    waitVerificationRequirement: {
      state: 'not-required',
      mandatory: false,
      reason: 'raison exacte non calculable ou confiance suffisante',
      consequence: 'Attendre ne demande pas de verrouillage supplémentaire avec les signaux visibles.',
      fallback: true,
    },
    safestMinimalVerification: {
      state: 'not-needed',
      recommended: false,
      label: 'Aucune vérification minimale prioritaire',
      action: 'Conserver la recommandation actuelle.',
      whyEnough: 'La confiance visible ne demande pas de déblocage avant attente.',
      unlockNextTurn: 'Aucun choix supplémentaire à débloquer au prochain tour.',
      followUpOptions: [],
      followUpExpirySummary: 'Aucune suite débloquée: pas d’échéance à signaler.',
      safestImmediateFollowUp: {
        state: 'none-expiring',
        recommended: false,
        label: 'Aucune suite immédiate prioritaire',
        reason: 'aucune option débloquée ne montre d’expiration visible',
        fallback: true,
      },
      backupFollowUp: {
        state: 'no-primary',
        recommended: false,
        label: 'Aucun relais prudent visible',
        reason: 'pas de suite principale sûre à seconder',
        fallback: true,
      },
      switchToBackupTrigger: {
        state: 'no-trigger',
        recommended: false,
        label: 'Aucun déclencheur fiable visible',
        reason: 'pas assez de signaux visibles pour recommander une bascule sans rouvrir l’analyse',
        fallback: true,
      },
      returnFromBackupCondition: {
        state: 'no-return-signal',
        recommended: false,
        label: 'Retour au suivi initial non lisible',
        condition: 'aucun backup actif ou suivi initial fiable à restaurer',
        fallback: true,
      },
      fullReviewRequired: false,
      fallback: true,
    },
  });
});

test('buildIntrigueTurnReportDeltas keeps unknown intelligence discreet', () => {
  assert.deepEqual(buildIntrigueTurnReportDeltas(province, null), {
    tone: 'masked',
    summary: 'Rapport intrigue masqué: aucune donnée fiable pour ce tour.',
    previousAction: null,
    deltas: [],
  });

  const report = buildIntrigueTurnReportDeltas(province, { map: { entries: [] } }, { previousActionCode: 'surveiller' });
  assert.equal(report.tone, 'masked');
  assert.match(report.summary, /aucun delta confirmé/);
  assert.equal(report.previousAction, 'Action Delta précédente: surveiller; résultat non confirmé.');
  assert.deepEqual(report.deltas, []);
});

test('buildIntrigueTurnReportDeltas validates options', () => {
  assert.throws(() => buildIntrigueTurnReportDeltas(province, buildIntrigueView(), null), /options must be an object/);
});
