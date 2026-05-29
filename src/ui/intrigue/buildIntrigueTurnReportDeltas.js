function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function getResponseTone(response) {
  if (!response) {
    return 'masked';
  }

  if (response.escalationProbability === 'élevée') {
    return 'worse';
  }

  if (['contenir', 'exposer'].includes(response.code)) {
    return 'improved';
  }

  if (response.code === 'infiltrer') {
    return 'watch';
  }

  return 'masked';
}

const TIMING_LABELS = {
  'act-now': 'agir maintenant',
  'short-wait': 'attendre',
};

const TIMING_CAUSE_LABELS = {
  exposition: 'exposition',
  'information-manquante': 'nouvelle information',
  'coût-opportunité': 'dette de chaleur',
  'fenêtre-adverse': 'confiance',
};

function normalizeTimingRecommendation(value) {
  if (value === 'act-now' || value === 'agir-maintenant' || value === 'agir maintenant') {
    return 'act-now';
  }

  if (value === 'short-wait' || value === 'wait' || value === 'attendre' || value === 'attendre-court') {
    return 'short-wait';
  }

  return null;
}

function getEntryForProvince(province, intrigueView) {
  const provinceId = province?.provinceId;
  return (intrigueView?.map?.entries ?? []).find((entry) => entry.locationId === provinceId) ?? null;
}

function getTimingChangeCause(timingComparison) {
  const dominantReason = timingComparison?.dominantReason ?? null;

  if (TIMING_CAUSE_LABELS[dominantReason]) {
    return TIMING_CAUSE_LABELS[dominantReason];
  }

  if (/exposition|budget/i.test(`${timingComparison?.actNow?.risk ?? ''} ${timingComparison?.shortWait?.risk ?? ''}`)) {
    return 'exposition';
  }

  if (/confiance|provenance|information/i.test(`${timingComparison?.summary ?? ''} ${timingComparison?.shortWait?.outcome ?? ''}`)) {
    return 'nouvelle information';
  }

  if (/chaleur|coût|cout|dette/i.test(`${timingComparison?.summary ?? ''} ${timingComparison?.actNow?.outcome ?? ''}`)) {
    return 'dette de chaleur';
  }

  return 'confiance';
}

function getConfidenceCause(timingComparison) {
  const joinedText = [
    timingComparison?.dominantReason,
    timingComparison?.summary,
    timingComparison?.actNow?.risk,
    timingComparison?.actNow?.outcome,
    timingComparison?.shortWait?.risk,
    timingComparison?.shortWait?.outcome,
  ].filter(Boolean).join(' ');

  if (/exposition|budget/i.test(joinedText)) return 'exposition';
  if (/délai|delai|attendre|fenêtre|fenetre|vieilli|périmer|perimer/i.test(joinedText)) return 'délai';
  if (/couverture|agent|relais/i.test(joinedText)) return 'couverture';
  if (/cellule|réseau|reseau/i.test(joinedText)) return 'cellule';
  return 'signal contradictoire';
}

function buildConfidenceShift(currentTiming, currentTimingComparison) {
  const cause = getConfidenceCause(currentTimingComparison);
  const dominantReason = currentTimingComparison?.dominantReason ?? null;
  const variation = currentTiming === 'act-now'
    ? 'baisse'
    : dominantReason === 'information-manquante'
      ? 'reste instable'
      : cause === 'exposition' || cause === 'signal contradictoire'
        ? 'baisse'
        : 'augmente';
  const justification = currentTiming === 'act-now'
    ? 'la perte de confiance rend l’attente plus risquée que l’action immédiate'
    : variation === 'augmente'
      ? 'la confiance remonte assez pour laisser attendre sans perdre le signal visible'
      : 'la confiance fragile justifie d’attendre un signal plus sûr avant d’agir';

  return {
    variation,
    cause,
    justifies: currentTiming,
    label: `${variation}: ${cause}`,
    justification,
  };
}

function buildWaitVerificationRequirement(timingRecommendationChange, lowConfidence) {
  if (!timingRecommendationChange || !lowConfidence) {
    return {
      state: 'not-required',
      mandatory: false,
      reason: 'raison exacte non calculable ou confiance suffisante',
      consequence: 'Attendre ne demande pas de verrouillage supplémentaire avec les signaux visibles.',
      fallback: true,
    };
  }

  const cause = timingRecommendationChange.confidenceShift?.cause ?? timingRecommendationChange.cause;
  const timingFragile = timingRecommendationChange.currentTiming === 'act-now' || cause === 'délai';
  const contradictory = cause === 'signal contradictoire';
  const mandatory = timingFragile || contradictory || timingRecommendationChange.confidenceShift?.variation === 'baisse';
  const reason = contradictory
    ? 'signal contradictoire: attendre sans recouper peut valider le mauvais timing'
    : timingFragile
      ? 'timing fragile: la fenêtre visible peut se refermer avant le prochain tour'
      : 'confiance basse: attendre sans vérifier risque de figer une lecture dégradée';
  const consequence = timingRecommendationChange.currentTiming === 'act-now'
    ? 'Conséquence probable: la réponse immédiate perd sa fenêtre et le prochain recheck coûtera plus cher.'
    : contradictory
      ? 'Conséquence probable: le prochain tour peut partir sur une priorité inversée.'
      : 'Conséquence probable: le signal vieillit et la vérification suivante sera moins fiable.';

  return {
    state: mandatory ? 'mandatory-before-wait' : 'optional-before-wait',
    mandatory,
    reason,
    consequence,
    fallback: false,
  };
}

function buildNextTurnUnlock(principalRisk, fullReviewRequired, timingRecommendationChange) {
  const canWaitNextTurn = timingRecommendationChange?.currentTiming === 'short-wait';

  if (fullReviewRequired) {
    return 'Au prochain tour, elle réduira l’incertitude pour choisir entre agir maintenant ou lancer une revue complète.';
  }

  if (principalRisk === 'timing fragile') {
    return 'Au prochain tour, elle permettra de confirmer si l’action immédiate reste nécessaire ou si attendre redevient sûr.';
  }

  if (canWaitNextTurn) {
    return 'Au prochain tour, elle permettra de choisir plus sûrement entre attendre encore ou agir sans surcharger la revue.';
  }

  return 'Au prochain tour, elle réduira l’incertitude avant de choisir entre agir et attendre.';
}

function buildUnlockedFollowUpOptions(principalRisk, fullReviewRequired, timingRecommendationChange) {
  const canWaitNextTurn = timingRecommendationChange?.currentTiming === 'short-wait';
  const optionsByRisk = {
    'exposition excessive': [
      { type: 'defensive', label: 'Défensif', consequence: 'réduire l’exposition avant toute réponse lourde' },
      { type: 'wait', label: 'Attente', consequence: 'attendre un tour si le seuil visible redevient sûr' },
      { type: 'offensive', label: 'Offensif', consequence: 'agir seulement si l’exposition reste maîtrisée' },
    ],
    'timing fragile': [
      { type: 'offensive', label: 'Offensif', consequence: 'agir vite si la fenêtre visible se ferme' },
      { type: 'wait', label: 'Attente', consequence: 'attendre si le signal reste frais au prochain tour' },
      { type: 'defensive', label: 'Défensif', consequence: 'limiter le coût d’un recheck si la fenêtre est perdue' },
    ],
    'signal contradictoire': [
      { type: 'offensive', label: 'Offensif', consequence: 'agir si les deux indices visibles convergent' },
      { type: 'defensive', label: 'Défensif', consequence: 'basculer en revue complète si le recoupement diverge' },
      { type: 'wait', label: 'Attente', consequence: 'différer seulement si l’incertitude baisse sans contradiction' },
    ],
    'confiance basse': [
      { type: 'defensive', label: 'Défensif', consequence: 'stabiliser la lecture si la confiance reste basse' },
      { type: 'wait', label: 'Attente', consequence: 'attendre si la cause visible n’empire pas' },
      { type: 'offensive', label: 'Offensif', consequence: 'agir si le contrôle confirme un signal exploitable' },
    ],
  };
  const options = optionsByRisk[principalRisk] ?? optionsByRisk['confiance basse'];

  if (fullReviewRequired) {
    return options.slice(0, 2);
  }

  if (!canWaitNextTurn) {
    return options.filter((option) => option.type !== 'wait').slice(0, 2);
  }

  return options.slice(0, 3);
}

function buildSafestMinimalVerification(prompt, timingRecommendationChange = null) {
  if (!prompt || prompt.state !== 'low-confidence') {
    return {
      state: 'not-needed',
      recommended: false,
      label: 'Aucune vérification minimale prioritaire',
      action: 'Conserver la recommandation actuelle.',
      whyEnough: 'La confiance visible ne demande pas de déblocage avant attente.',
      unlockNextTurn: 'Aucun choix supplémentaire à débloquer au prochain tour.',
      followUpOptions: [],
      fullReviewRequired: false,
      fallback: true,
    };
  }

  const cause = prompt.cause ?? timingRecommendationChange?.confidenceShift?.cause ?? 'signal contradictoire';
  const principalRisk = cause === 'exposition'
    ? 'exposition excessive'
    : cause === 'délai'
      ? 'timing fragile'
      : cause === 'signal contradictoire'
        ? 'signal contradictoire'
        : 'confiance basse';
  const planByRisk = {
    'exposition excessive': {
      label: 'Contrôle exposition minimal',
      action: 'Comparer seulement le niveau d’exposition visible au seuil sûr avant d’attendre.',
      whyEnough: 'Ce contrôle suffit si l’exposition repasse sous le seuil lisible sans rouvrir la cible masquée.',
      fullReviewRequired: false,
    },
    'timing fragile': {
      label: 'Contrôle fraîcheur du signal',
      action: 'Vérifier que le signal de timing n’a pas vieilli depuis le dernier tour.',
      whyEnough: 'La fraîcheur confirmée suffit à débloquer une attente courte sans refaire toute l’enquête.',
      fullReviewRequired: false,
    },
    'signal contradictoire': {
      label: 'Recoupement fog-safe rapide',
      action: 'Comparer le signal principal avec un second indice visible avant de choisir attendre.',
      whyEnough: 'Un second indice aligné suffit; s’il diverge, une revue complète reste nécessaire.',
      fullReviewRequired: true,
    },
    'confiance basse': {
      label: 'Contrôle confiance minimal',
      action: 'Relire la cause visible de perte de confiance et confirmer qu’elle n’empire pas.',
      whyEnough: 'Cela suffit seulement si la cause reste stable; sinon il faut une revue complète.',
      fullReviewRequired: prompt.confidence === 'reste instable',
    },
  };
  const plan = planByRisk[principalRisk] ?? planByRisk['confiance basse'];

  return {
    state: plan.fullReviewRequired ? 'full-review-needed' : 'minimal-sufficient',
    recommended: true,
    principalRisk,
    label: plan.label,
    action: plan.action,
    whyEnough: plan.whyEnough,
    unlockNextTurn: buildNextTurnUnlock(principalRisk, plan.fullReviewRequired, timingRecommendationChange),
    followUpOptions: buildUnlockedFollowUpOptions(principalRisk, plan.fullReviewRequired, timingRecommendationChange),
    fullReviewRequired: plan.fullReviewRequired,
    fallback: false,
  };
}

function buildMinimumVerificationPrompt(timingRecommendationChange) {
  if (!timingRecommendationChange) {
    const waitVerificationRequirement = buildWaitVerificationRequirement(null, false);
    const prompt = {
      state: 'sufficient-confidence',
      confidence: 'suffisante',
      cause: 'aucun changement de timing confirmé',
      verification: 'Aucune vérification minimale requise avant l’action recommandée.',
      waitLessRisky: false,
      summary: 'Confiance suffisante: garder la recommandation actuelle sans étape de vérification supplémentaire.',
      waitVerificationRequirement,
    };

    return {
      ...prompt,
      safestMinimalVerification: buildSafestMinimalVerification(prompt),
    };
  }

  const confidenceShift = timingRecommendationChange.confidenceShift;
  const lowConfidence = confidenceShift?.variation === 'baisse' || confidenceShift?.variation === 'reste instable';
  const waitVerificationRequirement = buildWaitVerificationRequirement(timingRecommendationChange, lowConfidence);
  const verificationByCause = {
    exposition: 'Vérifier le niveau d’exposition visible avant d’engager une réponse lourde.',
    délai: 'Confirmer que le signal n’a pas vieilli avant de forcer l’action immédiate.',
    couverture: 'Contrôler qu’une couverture minimale reste disponible avant d’exposer un agent.',
    cellule: 'Recouper l’état public de la cellule avant de transformer le timing en ordre.',
    'signal contradictoire': 'Comparer le signal principal avec un second indice fog-safe avant action.',
  };

  if (!lowConfidence) {
    const prompt = {
      state: 'sufficient-confidence',
      confidence: 'suffisante',
      cause: confidenceShift?.cause ?? timingRecommendationChange.cause,
      verification: 'Aucune vérification minimale requise avant l’action recommandée.',
      waitLessRisky: false,
      summary: 'Confiance suffisante: la variation soutient le timing recommandé sans étape supplémentaire.',
      waitVerificationRequirement,
    };

    return {
      ...prompt,
      safestMinimalVerification: buildSafestMinimalVerification(prompt, timingRecommendationChange),
    };
  }

  const waitLessRisky = timingRecommendationChange.currentTiming === 'short-wait';
  const prompt = {
    state: 'low-confidence',
    confidence: confidenceShift.variation,
    cause: confidenceShift.cause,
    verification: verificationByCause[confidenceShift.cause] ?? verificationByCause['signal contradictoire'],
    waitLessRisky,
    summary: waitLessRisky
      ? 'Attendre un tour est moins risqué que forcer l’action tant que la confiance reste basse.'
      : 'Agir maintenant reste indiqué, mais seulement après une vérification minimale du signal visible.',
    waitVerificationRequirement,
  };

  return {
    ...prompt,
    safestMinimalVerification: buildSafestMinimalVerification(prompt, timingRecommendationChange),
  };
}

function buildTimingRecommendationChange({ previousTimingRecommendation, currentTimingComparison }) {
  const previous = normalizeTimingRecommendation(previousTimingRecommendation);
  const current = normalizeTimingRecommendation(currentTimingComparison?.recommendedTiming);

  if (!previous || !current || previous === current) {
    return null;
  }

  const direction = `${TIMING_LABELS[previous]} → ${TIMING_LABELS[current]}`;
  const cause = getTimingChangeCause(currentTimingComparison);
  const confidenceShift = buildConfidenceShift(current, currentTimingComparison);

  const timingRecommendationChange = {
    previousTiming: previous,
    currentTiming: current,
    direction,
    cause,
    tone: current === 'act-now' ? 'worse' : 'watch',
    label: 'Timing recommandé modifié',
    detail: `${direction}: cause visible ${cause}.`,
    confidenceShift,
    fogSafe: true,
  };

  return {
    ...timingRecommendationChange,
    minimumVerificationPrompt: buildMinimumVerificationPrompt(timingRecommendationChange),
  };
}

function buildResponseDeltas(response, fallbackSummary) {
  if (!response) {
    return [];
  }

  const threatLabel = response.code === 'surveiller'
    ? 'Menace masquée'
    : response.escalationProbability === 'élevée'
      ? 'Menace aggravée'
      : 'Menace contenue';
  const sabotageLabel = response.code === 'contenir'
    ? 'Sabotage évité'
    : response.code === 'exposer'
      ? 'Réseau exposé'
      : response.code === 'infiltrer'
        ? 'Réseau stabilisé'
        : 'Signal surveillé';

  return [
    {
      type: 'threat',
      tone: getResponseTone(response),
      label: threatLabel,
      detail: fallbackSummary ?? response.effect,
      score: response.escalationProbability === 'élevée' ? 120 : 90,
    },
    {
      type: 'cooldown',
      tone: response.cooldownTurns > 0 ? 'watch' : 'improved',
      label: response.cooldownTurns > 0 ? 'Cooldown restant' : 'Cooldown nul',
      detail: `${response.cooldownTurns} tour${response.cooldownTurns > 1 ? 's' : ''} avant réponse lourde; chaleur générée +${response.heatGenerated}.`,
      score: 80 + response.cooldownTurns,
    },
    {
      type: 'network',
      tone: response.code === 'surveiller' ? 'masked' : response.code === 'exposer' ? 'improved' : 'watch',
      label: sabotageLabel,
      detail: response.effect,
      score: response.code === 'contenir' ? 100 : response.code === 'exposer' ? 95 : 70,
    },
  ];
}

function findSelectedDrillDown(province, intrigueView) {
  const provinceId = province?.provinceId;
  const selectedDrillDown = intrigueView?.selectedProvince?.drillDown ?? null;

  if (selectedDrillDown?.locationId === provinceId) {
    return selectedDrillDown;
  }

  return (intrigueView?.map?.entries ?? [])
    .find((entry) => entry.locationId === provinceId)?.drillDown ?? null;
}

export function buildIntrigueTurnReportDeltas(province, intrigueView, options = {}) {
  const normalizedOptions = requireObject(options, 'IntrigueTurnReportDeltas options');
  const previousActionCode = normalizedOptions.previousActionCode ?? null;

  if (!province || !intrigueView) {
    return {
      tone: 'masked',
      summary: 'Rapport intrigue masqué: aucune donnée fiable pour ce tour.',
      previousAction: null,
      deltas: [],
    };
  }

  const drillDown = findSelectedDrillDown(province, intrigueView);
  const entry = getEntryForProvince(province, intrigueView);

  if (!drillDown) {
    return {
      tone: 'masked',
      summary: `Renseignement discret sur ${province.label ?? province.provinceId}: aucun delta confirmé ou volontairement masqué.`,
      previousAction: previousActionCode ? `Action Delta précédente: ${previousActionCode}; résultat non confirmé.` : null,
      deltas: [],
    };
  }

  const response = drillDown.quickResponses?.find((candidate) => candidate.code === previousActionCode)
    ?? drillDown.quickResponses?.find((candidate) => candidate.code === drillDown.recommendedResponseCode)
    ?? drillDown.quickResponses?.[0]
    ?? null;
  const timingComparison = drillDown.postRecapStabilizationChoices?.timingComparison
    ?? entry?.postRecapStabilizationChoices?.timingComparison
    ?? null;
  const timingRecommendationChange = buildTimingRecommendationChange({
    previousTimingRecommendation: normalizedOptions.previousTimingRecommendation
      ?? drillDown.previousTimingRecommendation
      ?? entry?.previousTimingRecommendation
      ?? entry?.lastTurn?.timingRecommendation
      ?? null,
    currentTimingComparison: timingComparison,
  });
  const minimumVerificationPrompt = timingRecommendationChange?.minimumVerificationPrompt
    ?? buildMinimumVerificationPrompt(null);
  const deltas = [
    ...buildResponseDeltas(response, drillDown.responseAftermath?.summary),
    ...(timingRecommendationChange ? [{
      type: 'timing',
      tone: timingRecommendationChange.tone,
      label: timingRecommendationChange.label,
      detail: timingRecommendationChange.detail,
      score: 110,
    }] : []),
  ]
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label))
    .slice(0, 4);
  const worseCount = deltas.filter((delta) => delta.tone === 'worse').length;
  const improvedCount = deltas.filter((delta) => delta.tone === 'improved').length;
  const tone = worseCount > 0 ? 'worse' : improvedCount > 0 ? 'improved' : deltas.length > 0 ? 'watch' : 'masked';
  const lead = deltas[0] ?? null;
  const actionLabel = response?.label ?? previousActionCode ?? 'inaction';

  return {
    tone,
    summary: lead
      ? `${lead.label}: ${lead.detail}`
      : `Renseignement discret sur ${drillDown.locationName}: aucun delta confirmé.`,
    previousAction: `Action Delta résolue: ${actionLabel} sur ${drillDown.locationName}.`,
    deltas,
    retaliationRisk: drillDown.responseAftermath?.retaliationRisk ?? 'inconnu',
    timingRecommendationChange,
    minimumVerificationPrompt,
  };
}
