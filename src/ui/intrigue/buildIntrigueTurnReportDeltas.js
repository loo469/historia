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

function buildTimingRecommendationChange({ previousTimingRecommendation, currentTimingComparison }) {
  const previous = normalizeTimingRecommendation(previousTimingRecommendation);
  const current = normalizeTimingRecommendation(currentTimingComparison?.recommendedTiming);

  if (!previous || !current || previous === current) {
    return null;
  }

  const direction = `${TIMING_LABELS[previous]} → ${TIMING_LABELS[current]}`;
  const cause = getTimingChangeCause(currentTimingComparison);
  const confidenceShift = buildConfidenceShift(current, currentTimingComparison);

  return {
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
  };
}
