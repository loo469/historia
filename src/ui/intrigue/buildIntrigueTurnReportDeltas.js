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

function withExpiry(option, expiry = null) {
  if (!expiry) {
    return {
      ...option,
      expiry: {
        state: 'available',
        label: 'reste disponible',
        detail: 'aucune expiration visible avec les signaux actuels',
      },
    };
  }

  return {
    ...option,
    expiry: {
      state: 'expiring',
      ...expiry,
    },
  };
}

function summarizeFollowUpExpiry(options) {
  if (options.length === 0) {
    return 'Aucune suite débloquée: pas d’échéance à signaler.';
  }

  const expiring = options.filter((option) => option.expiry?.state === 'expiring');

  if (expiring.length === 0) {
    return 'Aucune suite ne montre d’expiration visible pour le prochain tour.';
  }

  return `${expiring.length} suite${expiring.length > 1 ? 's' : ''} à traiter vite avant dégradation.`;
}

function scoreExpiringFollowUp(option, principalRisk) {
  const riskTypeScores = {
    'exposition excessive': { defensive: 4, offensive: 2, wait: 1 },
    'timing fragile': { offensive: 4, defensive: 3, wait: 1 },
    'signal contradictoire': { defensive: 4, offensive: 2, wait: 1 },
    'confiance basse': { defensive: 3, offensive: 3, wait: 1 },
  };

  return riskTypeScores[principalRisk]?.[option.type] ?? 1;
}

function buildSafestImmediateFollowUp(options, principalRisk) {
  const expiring = options.filter((option) => option.expiry?.state === 'expiring');

  if (expiring.length === 0) {
    return {
      state: 'none-expiring',
      recommended: false,
      label: 'Aucune suite immédiate prioritaire',
      reason: 'aucune option débloquée ne montre d’expiration visible',
      fallback: true,
    };
  }

  const ranked = expiring
    .map((option) => ({ option, score: scoreExpiringFollowUp(option, principalRisk) }))
    .sort((left, right) => right.score - left.score);
  const [best, second] = ranked;

  if (second && best.score === second.score) {
    return {
      state: 'no-clear-winner',
      recommended: false,
      label: 'Priorité immédiate à confirmer',
      reason: 'plusieurs suites expirent avec le même niveau de sûreté visible',
      candidates: ranked.map(({ option }) => option.label).slice(0, 2),
      fallback: true,
    };
  }

  return {
    state: expiring.length > 1 ? 'recommended' : 'single-expiring',
    recommended: true,
    type: best.option.type,
    label: best.option.label,
    action: best.option.consequence,
    reason: `${best.option.expiry.label}: ${best.option.expiry.detail}`,
    fallback: false,
  };
}

function describeBackupTrigger(primary, backup) {
  if (backup.type === 'wait') {
    return 'à utiliser si l’exposition remonte ou si la suite principale devient indisponible';
  }

  if (backup.type === 'defensive' && primary.type === 'offensive') {
    return 'à utiliser si l’exposition visible monte ou si la fenêtre offensive devient trop exposée';
  }

  return 'à utiliser seulement si le signal visible rend la suite principale trop risquée';
}

function buildBackupFollowUp(options, safestImmediateFollowUp) {
  if (!safestImmediateFollowUp?.recommended) {
    return {
      state: 'no-primary',
      recommended: false,
      label: 'Aucun relais prudent visible',
      reason: 'pas de suite principale sûre à seconder',
      fallback: true,
    };
  }

  const fallbackOrderByPrimary = {
    offensive: ['defensive', 'wait'],
    defensive: ['wait'],
    wait: ['defensive'],
  };
  const fallbackOrder = fallbackOrderByPrimary[safestImmediateFollowUp.type] ?? ['defensive', 'wait'];
  const backup = fallbackOrder
    .map((type) => options.find((option) => option.type === type))
    .find(Boolean);

  if (!backup) {
    return {
      state: 'none-visible',
      recommended: false,
      label: 'Aucun relais prudent visible',
      reason: 'aucune option plus prudente n’est visible sans rouvrir l’analyse',
      fallback: true,
    };
  }

  return {
    state: backup.expiry?.state === 'expiring' ? 'expiring-backup' : 'available-backup',
    recommended: true,
    type: backup.type,
    label: backup.label,
    action: backup.consequence,
    when: describeBackupTrigger(safestImmediateFollowUp, backup),
    urgency: backup.expiry?.label ?? 'reste disponible',
    fallback: false,
  };
}

function buildSwitchToBackupTrigger(safestImmediateFollowUp, backupFollowUp, principalRisk) {
  if (!safestImmediateFollowUp?.recommended || !backupFollowUp?.recommended) {
    return {
      state: 'no-trigger',
      recommended: false,
      label: 'Aucun déclencheur fiable visible',
      reason: 'pas assez de signaux visibles pour recommander une bascule sans rouvrir l’analyse',
      fallback: true,
    };
  }

  const triggerByRisk = {
    'exposition excessive': 'basculer si l’exposition visible repasse au-dessus du seuil sûr',
    'timing fragile': 'basculer si la fenêtre principale n’est plus fraîche ou devient indisponible',
    'signal contradictoire': 'basculer si le second indice visible ne confirme pas la suite principale',
    'confiance basse': 'basculer si la confiance baisse encore ou si le signal exploitable disparaît',
  };

  return {
    state: 'visible-trigger',
    recommended: true,
    label: 'Déclencheur de relais',
    signal: triggerByRisk[principalRisk] ?? triggerByRisk['confiance basse'],
    backup: backupFollowUp.label,
    reason: 'signal fog-safe: exposition, confiance, disponibilité ou timing visible seulement',
    fallback: false,
  };
}

function buildReturnDurabilityHint(selected, principalRisk) {
  const causeByRisk = {
    'exposition excessive': 'dépendance non vérifiée',
    'timing fragile': 'timing expirant',
    'signal contradictoire': 'dépendance non vérifiée',
    'confiance basse': 'information manquante',
  };
  const cause = causeByRisk[principalRisk] ?? 'information manquante';

  if (selected.state === 'already-met') {
    return {
      stability: 'stable-return',
      label: 'Retour stable.',
      cause,
      advice: 'Le suivi initial peut tenir sans forcer un nouveau backup immédiat.',
    };
  }

  if (selected.state === 'near') {
    return {
      stability: 'fragile-return',
      label: 'Retour fragile.',
      cause,
      advice: 'Retour possible mais temporaire: confirmer le signal avant de quitter le backup.',
    };
  }

  return {
    stability: 'stay-on-backup-advised',
    label: 'Rester sur backup conseillé.',
    cause,
    advice: 'Le retour risque de recréer un backup immédiatement après.',
  };
}

function buildSkippedStabilizationRisk(durability, stabilizationBeforeReturn, principalRisk) {
  if (!stabilizationBeforeReturn?.recommended) {
    return {
      state: 'unknown-risk',
      recommended: false,
      label: 'Risque si stabilisation sautée non lisible',
      category: 'risque non confirmé',
      consequence: 'le risque exact de retour direct n’est pas lisible avec les signaux actuels',
      whyStabilizationHelps: 'garder la stabilisation proposée évite de supposer une information masquée',
      fallback: true,
    };
  }

  const riskByPrincipalRisk = {
    'exposition excessive': {
      state: 'exposure-risk',
      label: 'Exposition ravivée',
      category: 'exposition',
      consequence: 'le retour direct peut raviver l’exposition avant que le suivi initial tienne seul',
      whyStabilizationHelps: 'la stabilisation réduit d’abord le point visible qui forcerait un nouveau backup',
    },
    'timing fragile': {
      state: 'option-degrades',
      label: 'Option qui se dégrade',
      category: 'option qui se dégrade',
      consequence: 'la fenêtre fraîche peut se fermer et rendre le prochain contrôle moins fiable',
      whyStabilizationHelps: 'maintenir le backup protège la fenêtre jusqu’à un retour plus durable',
    },
    'signal contradictoire': {
      state: 'chain-failure-risk',
      label: 'Échec de chaîne possible',
      category: 'échec de chaîne',
      consequence: 'la chaîne de suivi peut repartir sur deux signaux visibles incompatibles',
      whyStabilizationHelps: 'sécuriser la dépendance évite de restaurer un suivi qui casse au premier recoupement',
    },
    'confiance basse': {
      state: 'information-loss-risk',
      label: 'Perte d’information',
      category: 'perte d’information',
      consequence: 'le signal utile peut redevenir trop incomplet pour justifier le suivi initial',
      whyStabilizationHelps: 'la vérification courte garde assez d’information visible pour un retour durable',
    },
  };
  const selected = riskByPrincipalRisk[principalRisk];

  if (!selected) {
    return {
      state: 'unknown-risk',
      recommended: true,
      label: 'Risque si stabilisation sautée prudent',
      category: durability?.cause ?? 'risque non confirmé',
      consequence: 'le retour direct peut recréer une fragilité non classable sans nouvelle donnée visible',
      whyStabilizationHelps: 'la stabilisation limite ce risque sans révéler de donnée masquée',
      fallback: true,
    };
  }

  return {
    ...selected,
    recommended: true,
    fallback: false,
  };
}

function buildStabilizationBeforeReturn(durability, backupFollowUp, principalRisk) {
  if (!durability || durability.stability === 'stable-return') {
    return {
      state: 'not-needed',
      recommended: false,
      label: 'Aucune stabilisation préalable requise',
      action: 'revenir au suivi initial avec les signaux visibles actuels',
      reason: 'le retour est déjà stable sans relais supplémentaire lisible',
      skippedRisk: buildSkippedStabilizationRisk(durability, null, principalRisk),
      fallback: true,
    };
  }

  const adviceByCause = {
    'information manquante': {
      state: 'verify-before-return',
      label: 'Vérifier avant retour',
      action: 'vérifier le signal visible minimal avant de quitter le backup',
      reason: 'l’information manquante est la seule pièce à stabiliser sans rouvrir l’enquête masquée',
    },
    'timing expirant': {
      state: 'hold-backup-before-return',
      label: 'Maintenir la sauvegarde',
      action: 'maintenir la sauvegarde jusqu’à une fenêtre de retour fraîche',
      reason: 'le timing expirant peut forcer une nouvelle bascule si le retour est tenté trop tôt',
    },
    'dépendance non vérifiée': {
      state: 'secure-dependency-before-return',
      label: 'Sécuriser la dépendance',
      action: 'sécuriser la dépendance visible avant de restaurer le suivi initial',
      reason: 'la dépendance non vérifiée est le point le plus susceptible de recréer un backup immédiat',
    },
  };
  const selected = adviceByCause[durability.cause] ?? adviceByCause['information manquante'];

  const base = {
    ...selected,
    recommended: true,
    backup: backupFollowUp?.label ?? 'Backup',
    stabilizes: 'stabilise le retour sans révéler de cible ou signal masqué',
    fallback: false,
  };

  return {
    ...base,
    skippedRisk: buildSkippedStabilizationRisk(durability, base, principalRisk),
  };
}

function buildBackupLadderStabilizationReason(durability = null, stabilizationBeforeReturn = null, skippedRisk = null) {
  if (!stabilizationBeforeReturn?.recommended || !durability) {
    return {
      state: 'no-safe-stabilization',
      recommended: false,
      label: 'Aucune stabilisation sûre proposée',
      summary: 'Aucune stabilisation sûre n’est lisible avant retour avec les signaux visibles actuels.',
      drivers: [],
      fallback: true,
    };
  }

  const drivers = [];
  if (durability.cause === 'dépendance non vérifiée' || skippedRisk?.state === 'chain-failure-risk') {
    drivers.push('risque sabotage: dépendance visible à sécuriser avant retour');
  }
  if (durability.cause === 'information manquante') {
    drivers.push('présence: confirmer le signal visible minimal avant de quitter le backup');
  }
  if (durability.cause === 'timing expirant') {
    drivers.push('présence: garder le backup jusqu’à une fenêtre de retour fraîche');
  }
  if (skippedRisk?.state === 'exposure-risk') {
    drivers.push('exposition ajoutée: le retour direct peut raviver l’exposition visible');
  }
  if (skippedRisk?.recommended && !skippedRisk.fallback) {
    drivers.push(`risque de skip: ${skippedRisk.category}`);
  }

  if (!drivers.length) {
    drivers.push(`${durability.cause}: ${stabilizationBeforeReturn.reason}`);
  }

  return {
    state: stabilizationBeforeReturn.state,
    recommended: true,
    label: `Pourquoi ${stabilizationBeforeReturn.label.toLowerCase()}`,
    summary: drivers.join(' · '),
    drivers,
    fallback: false,
  };
}






function buildEarliestResidualClear(clearAction = null) {
  if (!clearAction || clearAction.fallback) {
    return {
      state: 'no-clear-path',
      available: false,
      label: 'Clear non lisible',
      action: 'aucune action sûre de nettoyage n’est visible',
      reason: 'la trace ne dispose pas encore d’un levier de clear fog-safe',
      fallback: true,
    };
  }

  if (clearAction.state === 'clearable-next-safe-read') {
    return {
      state: 'earliest-safe-read',
      available: true,
      label: 'Premier clear: relecture sûre',
      action: clearAction.action,
      reason: clearAction.result,
      fallback: false,
    };
  }

  if (clearAction.state === 'watch-until-quiet') {
    return {
      state: 'wait-for-safe-action',
      available: false,
      label: 'Clear après signal calme',
      action: clearAction.action,
      reason: 'attendre un signal sûr sans heat ni fragilité visible avant nettoyage',
      fallback: false,
    };
  }

  return {
    state: 'already-clear',
    available: false,
    label: 'Déjà archivée',
    action: clearAction.action,
    reason: clearAction.result,
    fallback: false,
  };
}

function buildResidualTraceClearAction(durability = null) {
  const cause = durability?.cause ?? 'signal résiduel';

  if (/information/i.test(cause)) {
    return {
      state: 'clearable-next-safe-read',
      clearableNow: true,
      label: 'Nettoyable par relecture sûre',
      action: 'confirmer une lecture de confiance visible stable au prochain passage',
      result: 'sortir la trace de la watchlist sans rouvrir le backup',
      nextCheck: 'lecture de confiance stable visible',
      fallback: false,
    };
  }

  if (/chaleur|heat|exposition|fragil/i.test(cause)) {
    return {
      state: 'watch-until-quiet',
      clearableNow: false,
      label: 'À surveiller avant nettoyage',
      action: 'attendre que la heat ou la fragilité visible reste absente sur le prochain signal sûr',
      result: 'réduire la trace en archive passive si aucun retour de risque visible n’apparaît',
      nextCheck: 'absence de heat ou fragilité visible sur le prochain signal sûr',
      fallback: false,
    };
  }

  return {
    state: 'no-safe-action-needed',
    clearableNow: false,
    label: 'Aucun geste sûr requis',
    action: 'conserver la trace en archive informative',
    result: 'aucune attention supplémentaire à nettoyer',
    nextCheck: 'aucun check supplémentaire requis',
    fallback: false,
  };
}


function buildResidualClearDeferralConsequence(clearAction = null, earliestClear = null) {
  if (!clearAction || clearAction.fallback || !earliestClear || earliestClear.fallback) {
    return {
      state: 'no-residual-consequence',
      severity: 'none',
      label: 'Aucune conséquence lisible',
      summary: 'aucune trace résiduelle visible ne permet de qualifier un report de nettoyage',
      fallback: true,
    };
  }

  if (earliestClear.state === 'earliest-safe-read') {
    return {
      state: 'stable-but-recheck-blocked',
      severity: 'watch',
      label: 'Report stable, recheck maintenu',
      summary: 'différer garde la trace stable mais conserve le recheck léger au prochain passage',
      fallback: false,
    };
  }

  if (earliestClear.state === 'wait-for-safe-action') {
    return {
      state: 'can-worsen-if-risk-returns',
      severity: 'risk',
      label: 'Report sous veille',
      summary: 'différer ne bloque pas le plan, mais la trace peut redevenir active si heat ou fragilité visible revient',
      fallback: false,
    };
  }

  return {
    state: 'no-extra-consequence',
    severity: 'safe',
    label: 'Report sans effet attendu',
    summary: 'aucun nettoyage actif n’est requis; la trace reste archivée sans contrôle bloqué',
    fallback: false,
  };
}

function buildResidualTraceAttention(durability = null) {
  const cause = durability?.cause ?? 'signal résiduel';
  const clearAction = buildResidualTraceClearAction(durability);
  const earliestClear = buildEarliestResidualClear(clearAction);
  const deferralConsequence = buildResidualClearDeferralConsequence(clearAction, earliestClear);

  if (/information/i.test(cause)) {
    return {
      state: 'later-recheck-needed',
      needsAttention: true,
      label: 'Recheck léger plus tard',
      summary: 'garder la trace pour une relecture courte au prochain passage, sans alerte active',
      clearAction,
      earliestClear,
      deferralConsequence,
      fallback: false,
    };
  }

  if (/chaleur|heat|exposition|fragil/i.test(cause)) {
    return {
      state: 'passive-watch',
      needsAttention: true,
      label: 'Veille passive',
      summary: 'surveiller seulement si la heat ou la fragilité visible réapparaît',
      clearAction,
      earliestClear,
      deferralConsequence,
      fallback: false,
    };
  }

  return {
    state: 'harmless-record',
    needsAttention: false,
    label: 'Archive sans action',
    summary: 'conserver comme trace informative; aucune attention de suivi requise',
    clearAction,
    earliestClear,
    deferralConsequence,
    fallback: false,
  };
}

function buildResidualIntrigueTrace(returnCondition = null, durability = null) {
  if (!returnCondition?.recommended || durability?.stability !== 'stable-return') {
    return {
      state: 'not-applicable',
      informative: false,
      label: 'Aucune trace résiduelle à lire',
      summary: 'la sortie sûre n’est pas encore atteinte ou aucun retour fiable n’est visible',
      attention: {
        state: 'not-applicable',
        needsAttention: false,
        label: 'Aucun suivi de trace',
        summary: 'aucune sortie sûre ne permet de qualifier une trace résiduelle',
        fallback: true,
      },
      fallback: true,
    };
  }

  if (durability.cause === 'information manquante') {
    return {
      state: 'light-reread-advised',
      informative: true,
      label: 'Clos avec trace légère',
      summary: 'relire légèrement la confiance visible au prochain passage, sans rouvrir le backup',
      signal: 'trace de confiance ou information encore utile mais non bloquante',
      attention: buildResidualTraceAttention(durability),
      fallback: false,
    };
  }

  return {
    state: 'fully-clear',
    informative: false,
    label: 'Clos sans trace utile',
    summary: 'aucune heat ou fragilité visible ne demande de relecture après la sortie sûre',
    signal: durability.cause,
    attention: buildResidualTraceAttention(durability),
    fallback: false,
  };
}

function buildPostReturnExitCondition(returnCondition = null, durability = null, stabilizationBeforeReturn = null, skippedRisk = null) {
  if (!returnCondition?.recommended || !durability) {
    return {
      state: 'no-post-return-signal',
      watchRequired: false,
      label: 'Après-retour non lisible',
      condition: 'aucune condition de clôture sûre n’est visible après retour au plan original',
      reason: 'pas de retour backup fiable à prolonger en condition de sortie',
      fallback: true,
    };
  }

  if (durability.stability === 'stable-return') {
    return {
      state: 'backup-closed',
      watchRequired: false,
      label: 'Backup vraiment clos',
      condition: 'arrêter la surveillance backup si aucun signal visible ne force une nouvelle bascule après retour au plan',
      reason: durability.advice,
      residualTrace: buildResidualIntrigueTrace(returnCondition, durability),
      fallback: false,
    };
  }

  const risk = skippedRisk?.recommended && !skippedRisk.fallback
    ? skippedRisk.category
    : durability.cause;
  const action = stabilizationBeforeReturn?.recommended
    ? stabilizationBeforeReturn.action
    : 'confirmer un signal visible frais';

  return {
    state: 'watch-after-return',
    watchRequired: true,
    label: 'Retour sous surveillance',
    condition: `garder un œil après retour tant que ${risk} reste visible`,
    reason: `${action}: ${durability.advice}`,
    fallback: false,
  };
}

function buildBackupReturnReadiness(returnCondition = null, durability = null, stabilizationBeforeReturn = null, stabilizationReason = null, skippedRisk = null) {
  if (!returnCondition?.recommended || !durability) {
    return {
      state: 'no-return-window',
      ready: false,
      label: 'Sortie backup non lisible',
      summary: 'Aucun état de sortie fiable vers le follow-up original n’est visible pour ce backup.',
      nextStep: stabilizationReason?.summary ?? 'rester sur les signaux visibles avant de conclure un retour',
      fallback: true,
    };
  }

  if (durability.stability === 'stable-return') {
    return {
      state: 'return-ready',
      ready: true,
      label: 'Retour au follow-up original possible',
      summary: `Sortie prête vers ${returnCondition.primary}: la durabilité visible est stable.`,
      nextStep: returnCondition.condition,
      postReturnExitCondition: buildPostReturnExitCondition(returnCondition, durability, stabilizationBeforeReturn, skippedRisk),
      fallback: false,
    };
  }

  return {
    state: 'stabilization-required',
    ready: false,
    label: 'Stabilisation encore requise',
    summary: `${stabilizationBeforeReturn?.label ?? 'Stabilisation'} reste nécessaire avant de revenir vers ${returnCondition.primary}.`,
    nextStep: stabilizationReason?.summary ?? stabilizationBeforeReturn?.reason ?? durability.advice,
    postReturnExitCondition: buildPostReturnExitCondition(returnCondition, durability, stabilizationBeforeReturn, skippedRisk),
    fallback: false,
  };
}

function buildBackupLadderSummary(returnCondition, durability = null, stabilizationBeforeReturn = null) {
  if (!returnCondition?.recommended || !durability) {
    const stabilizationReason = buildBackupLadderStabilizationReason(durability, stabilizationBeforeReturn);
    return {
      state: 'no-reliable-ladder',
      recommended: false,
      decision: 'fallback-without-signal',
      label: 'Boucle backup non synthétisable',
      summary: 'Aucune boucle backup → stabilisation → retour fiable à condenser avec les signaux visibles.',
      risk: null,
      stabilizationReason,
      returnReadiness: buildBackupReturnReadiness(returnCondition, durability, stabilizationBeforeReturn, stabilizationReason),
      fallback: true,
    };
  }

  const skippedRisk = stabilizationBeforeReturn?.skippedRisk;
  const visibleRisk = skippedRisk?.recommended && !skippedRisk.fallback
    ? skippedRisk.category
    : durability.cause;
  const stabilizationReason = buildBackupLadderStabilizationReason(durability, stabilizationBeforeReturn, skippedRisk);
  const returnReadiness = buildBackupReturnReadiness(
    returnCondition,
    durability,
    stabilizationBeforeReturn,
    stabilizationReason,
    skippedRisk,
  );

  if (durability.stability === 'stable-return') {
    return {
      state: 'return-now',
      recommended: true,
      decision: 'return-now',
      label: 'Revenir maintenant',
      summary: `Revenir au suivi initial: ${durability.advice}`,
      risk: visibleRisk,
      stabilizationReason,
      returnReadiness,
      fallback: false,
    };
  }

  if (durability.stability === 'stay-on-backup-advised') {
    return {
      state: 'stay-on-backup',
      recommended: true,
      decision: 'stay-on-backup',
      label: 'Rester sur backup',
      summary: `Rester sur ${returnCondition.backup}: ${durability.advice}`,
      risk: visibleRisk,
      stabilizationReason,
      returnReadiness,
      fallback: false,
    };
  }

  if (stabilizationBeforeReturn?.recommended) {
    return {
      state: 'stabilize-before-return',
      recommended: true,
      decision: 'stabilize-before-return',
      label: 'Stabiliser avant retour',
      summary: `${stabilizationBeforeReturn.label}: ${stabilizationBeforeReturn.action}. Retour ensuite vers ${returnCondition.primary}.`,
      risk: visibleRisk,
      stabilizationReason,
      returnReadiness,
      fallback: false,
    };
  }

  return {
    state: 'no-reliable-ladder',
    recommended: false,
    decision: 'fallback-without-signal',
    label: 'Boucle backup non synthétisable',
    summary: 'Les signaux visibles ne suffisent pas à choisir entre backup, stabilisation et retour.',
    risk: null,
    stabilizationReason,
    returnReadiness,
    fallback: true,
  };
}

function buildReturnFromBackupCondition(safestImmediateFollowUp, backupFollowUp, principalRisk) {
  if (!safestImmediateFollowUp?.recommended || !backupFollowUp?.recommended) {
    const fallback = {
      state: 'no-return-signal',
      recommended: false,
      label: 'Retour au suivi initial non lisible',
      condition: 'aucun backup actif ou suivi initial fiable à restaurer',
      fallback: true,
    };
    return {
      ...fallback,
      backupLadderSummary: buildBackupLadderSummary(fallback),
    };
  }

  const conditionByRisk = {
    'exposition excessive': {
      state: backupFollowUp.type === 'wait' ? 'near' : 'unlikely-this-turn',
      condition: 'revenir au suivi initial si l’exposition reste sous le seuil sûr après le contrôle',
    },
    'timing fragile': {
      state: 'unlikely-this-turn',
      condition: 'revenir au suivi initial seulement si la fenêtre redevient fraîche et disponible ce tour-ci',
    },
    'signal contradictoire': {
      state: 'near',
      condition: 'revenir au suivi initial si le second indice visible confirme la même direction',
    },
    'confiance basse': {
      state: backupFollowUp.state === 'available-backup' ? 'already-met' : 'near',
      condition: 'revenir au suivi initial si la confiance visible se stabilise sans nouveau signal contraire',
    },
  };
  const selected = conditionByRisk[principalRisk] ?? conditionByRisk['confiance basse'];
  const durability = buildReturnDurabilityHint(selected, principalRisk);
  const stabilizationBeforeReturn = buildStabilizationBeforeReturn(durability, backupFollowUp, principalRisk);

  const returnCondition = {
    ...selected,
    recommended: true,
    durability,
    stabilizationBeforeReturn,
    label: 'Retour au suivi initial',
    primary: safestImmediateFollowUp.label,
    backup: backupFollowUp.label,
    detail: selected.state === 'already-met'
      ? 'condition déjà remplie avec les signaux visibles'
      : selected.state === 'near'
        ? 'condition proche si le prochain contrôle confirme le signal visible'
        : 'condition improbable ce tour-ci sans signal visible plus frais',
    fallback: false,
  };

  return {
    ...returnCondition,
    backupLadderSummary: buildBackupLadderSummary(returnCondition, durability, stabilizationBeforeReturn),
  };
}

function buildUnlockedFollowUpOptions(principalRisk, fullReviewRequired, timingRecommendationChange) {
  const canWaitNextTurn = timingRecommendationChange?.currentTiming === 'short-wait';
  const optionsByRisk = {
    'exposition excessive': [
      withExpiry(
        { type: 'defensive', label: 'Défensif', consequence: 'réduire l’exposition avant toute réponse lourde' },
        { label: 'à traiter maintenant', detail: 'l’exposition peut devenir moins récupérable après le prochain tour' },
      ),
      withExpiry({ type: 'wait', label: 'Attente', consequence: 'attendre un tour si le seuil visible redevient sûr' }),
      withExpiry({ type: 'offensive', label: 'Offensif', consequence: 'agir seulement si l’exposition reste maîtrisée' }),
    ],
    'timing fragile': [
      withExpiry(
        { type: 'offensive', label: 'Offensif', consequence: 'agir vite si la fenêtre visible se ferme' },
        { label: 'expire vite', detail: 'la fenêtre peut se refermer après ce tour' },
      ),
      withExpiry({ type: 'wait', label: 'Attente', consequence: 'attendre si le signal reste frais au prochain tour' }),
      withExpiry(
        { type: 'defensive', label: 'Défensif', consequence: 'limiter le coût d’un recheck si la fenêtre est perdue' },
        { label: 'fiabilité en baisse', detail: 'le recheck devient moins fiable si le signal vieillit' },
      ),
    ],
    'signal contradictoire': [
      withExpiry({ type: 'offensive', label: 'Offensif', consequence: 'agir si les deux indices visibles convergent' }),
      withExpiry(
        { type: 'defensive', label: 'Défensif', consequence: 'basculer en revue complète si le recoupement diverge' },
        { label: 'à recouper vite', detail: 'la contradiction devient moins lisible si elle attend' },
      ),
      withExpiry({ type: 'wait', label: 'Attente', consequence: 'différer seulement si l’incertitude baisse sans contradiction' }),
    ],
    'confiance basse': [
      withExpiry(
        { type: 'defensive', label: 'Défensif', consequence: 'stabiliser la lecture si la confiance reste basse' },
        { label: 'lecture fragile', detail: 'la confiance peut dériver si elle n’est pas stabilisée' },
      ),
      withExpiry({ type: 'wait', label: 'Attente', consequence: 'attendre si la cause visible n’empire pas' }),
      withExpiry(
        { type: 'offensive', label: 'Offensif', consequence: 'agir si le contrôle confirme un signal exploitable' },
        { label: 'signal fragile', detail: 'l’opportunité peut perdre en fiabilité au prochain tour' },
      ),
    ],
  };
  const options = optionsByRisk[principalRisk] ?? optionsByRisk['confiance basse'];
  const selectedOptions = fullReviewRequired
    ? options.slice(0, 2)
    : !canWaitNextTurn
      ? options.filter((option) => option.type !== 'wait').slice(0, 2)
      : options.slice(0, 3);

  return {
    options: selectedOptions,
    expirySummary: summarizeFollowUpExpiry(selectedOptions),
  };
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
      followUpExpirySummary: 'Aucune suite débloquée: pas d’échéance à signaler.',
      safestImmediateFollowUp: buildSafestImmediateFollowUp([], 'confiance basse'),
      backupFollowUp: buildBackupFollowUp([], buildSafestImmediateFollowUp([], 'confiance basse')),
      switchToBackupTrigger: buildSwitchToBackupTrigger(
        buildSafestImmediateFollowUp([], 'confiance basse'),
        buildBackupFollowUp([], buildSafestImmediateFollowUp([], 'confiance basse')),
        'confiance basse',
      ),
      returnFromBackupCondition: buildReturnFromBackupCondition(
        buildSafestImmediateFollowUp([], 'confiance basse'),
        buildBackupFollowUp([], buildSafestImmediateFollowUp([], 'confiance basse')),
        'confiance basse',
      ),
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
  const followUp = buildUnlockedFollowUpOptions(principalRisk, plan.fullReviewRequired, timingRecommendationChange);
  const safestImmediateFollowUp = buildSafestImmediateFollowUp(followUp.options, principalRisk);
  const backupFollowUp = buildBackupFollowUp(followUp.options, safestImmediateFollowUp);

  return {
    state: plan.fullReviewRequired ? 'full-review-needed' : 'minimal-sufficient',
    recommended: true,
    principalRisk,
    label: plan.label,
    action: plan.action,
    whyEnough: plan.whyEnough,
    unlockNextTurn: buildNextTurnUnlock(principalRisk, plan.fullReviewRequired, timingRecommendationChange),
    followUpOptions: followUp.options,
    followUpExpirySummary: followUp.expirySummary,
    safestImmediateFollowUp,
    backupFollowUp,
    switchToBackupTrigger: buildSwitchToBackupTrigger(safestImmediateFollowUp, backupFollowUp, principalRisk),
    returnFromBackupCondition: buildReturnFromBackupCondition(safestImmediateFollowUp, backupFollowUp, principalRisk),
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
