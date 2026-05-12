const STATUS_RANK = Object.freeze({ probable: 3, possible: 2, missing: 1 });
const TONE_RANK = Object.freeze({ event: 5, opportunity: 5, risk: 4, research: 3, discovery: 2, identity: 1, neutral: 0 });

function normalizeText(value, fallback = '') {
  return String(value ?? fallback).trim();
}

function reminderTone(hint) {
  if (hint.status === 'missing') {
    return 'warning';
  }

  if (hint.tone === 'risk') {
    return 'risk';
  }

  if (hint.tone === 'research') {
    return 'research';
  }

  return hint.status === 'probable' ? 'opportunity' : 'possible';
}

function reminderLabel(hint) {
  if (hint.status === 'probable') {
    return hint.tone === 'event' || hint.tone === 'opportunity'
      ? 'Prochain repère'
      : 'Déblocage probable';
  }

  if (hint.status === 'possible') {
    return hint.tone === 'research'
      ? 'Recherche à suivre'
      : 'Piste possible';
  }

  return 'Condition à combler';
}

function buildFallbackUrgency(hint, focusTarget) {
  if (hint.urgency) {
    return hint.urgency;
  }

  if (focusTarget.urgency) {
    return focusTarget.urgency;
  }

  if (hint.status === 'probable') {
    return {
      level: 'soon',
      label: 'Expire bientôt',
      window: 'ce tour',
      detail: `${focusTarget.label}: fenêtre courte, à traiter avant de clore le tour.`,
    };
  }

  if (hint.status === 'possible') {
    return {
      level: hint.tone === 'research' || hint.tone === 'discovery' ? 'new' : 'stable',
      label: hint.tone === 'research' || hint.tone === 'discovery' ? 'Nouveau signal' : 'Fenêtre stable',
      window: hint.tone === 'research' || hint.tone === 'discovery' ? 'maintenant' : '2+ tours',
      detail: `${focusTarget.label}: opportunité disponible sans urgence immédiate.`,
    };
  }

  return {
    level: 'stable',
    label: 'À préparer',
    window: 'stable',
    detail: `${focusTarget.label}: signal incomplet, aucune expiration active.`,
  };
}


function buildRecommendedAction(hint, focusTarget, urgency, actionLabel) {
  const timing = urgency.timingLabel ?? urgency.window;
  const source = urgency.sourceLabel ?? focusTarget.label;

  if (hint.status === 'missing') {
    return {
      code: 'accept-risk',
      label: 'Ignorer avec risque assumé',
      summary: `Ignorer ${focusTarget.label} si ${hint.cultureName} peut attendre; ${timing}.`,
      timing,
      source,
    };
  }

  if (hint.tone === 'research') {
    return {
      code: 'accelerate-research',
      label: 'Accélérer la recherche',
      summary: `Accélérer ${source} après ${actionLabel}; fenêtre ${timing}.`,
      timing,
      source,
    };
  }

  if (hint.tone === 'event' || hint.tone === 'opportunity') {
    return {
      code: 'follow-event',
      label: 'Suivre l’événement',
      summary: `Suivre ${source} depuis ${focusTarget.regionId ?? hint.regionId}; fenêtre ${timing}.`,
      timing,
      source,
    };
  }

  if (hint.tone === 'discovery') {
    return {
      code: 'protect-site',
      label: 'Protéger le site',
      summary: `Protéger ${focusTarget.label} pour exploiter ${source}; fenêtre ${timing}.`,
      timing,
      source,
    };
  }

  return {
    code: 'watch-window',
    label: 'Surveiller la fenêtre',
    summary: `Surveiller ${focusTarget.label}: ${source}; fenêtre ${timing}.`,
    timing,
    source,
  };
}


function buildActionTradeoff(hint, recommendedAction, focusTarget, urgency) {
  const window = urgency.timingLabel ?? urgency.window;
  const source = recommendedAction.source ?? urgency.sourceLabel ?? focusTarget.label;

  if (recommendedAction.code === 'follow-event') {
    return {
      benefit: `Protège ${source}`,
      risk: `Événement ignoré si ${urgency.window === 'ce tour' ? 'ce tour passe' : 'la fenêtre glisse'}`,
      window,
      summary: `Gain: repère culturel protégé. Risque: événement ignoré (${window}).`,
    };
  }

  if (recommendedAction.code === 'accelerate-research') {
    return {
      benefit: `Accélère ${source}`,
      risk: `Recherche retardée si l’action reste en attente`,
      window,
      summary: `Gain: recherche accélérée. Risque: retard culturel (${window}).`,
    };
  }

  if (recommendedAction.code === 'protect-site') {
    return {
      benefit: `Protège ${focusTarget.label}`,
      risk: `Site exposé et découverte moins exploitable`,
      window,
      summary: `Gain: site protégé. Risque: découverte exposée (${window}).`,
    };
  }

  if (recommendedAction.code === 'accept-risk') {
    return {
      benefit: `Libère l’action province`,
      risk: `${hint.cultureName} reste sans signal exploitable`,
      window,
      summary: `Gain: action libre. Risque: opportunité culturelle manquée (${window}).`,
    };
  }

  return {
    benefit: `Garde ${focusTarget.label} lisible`,
    risk: `Fenêtre culturelle moins priorisée`,
    window,
    summary: `Gain: fenêtre surveillée. Risque: priorité floue (${window}).`,
  };
}


function buildRippleEffects(hint, recommendedAction, focusTarget, urgency) {
  if (hint.status === 'missing') {
    return [];
  }

  const source = recommendedAction.source ?? urgency.sourceLabel ?? focusTarget.label;
  const regionId = focusTarget.regionId ?? hint.regionId;
  const baseEffects = [{
    targetId: regionId,
    targetLabel: `Province ${regionId}`,
    cultureName: hint.cultureName,
    tone: urgency.level === 'soon' ? 'positive' : 'uncertain',
    summary: urgency.level === 'soon'
      ? `${source} stabilise l’opportunité culturelle locale.`
      : `${source} garde la fenêtre culturelle ouverte.`,
  }];

  if (recommendedAction.code === 'accelerate-research') {
    baseEffects.push({
      targetId: `${regionId}:research`,
      targetLabel: 'Recherche locale',
      cultureName: hint.cultureName,
      tone: 'positive',
      summary: `Progression de recherche plus lisible au prochain choix.`,
    });
  }

  if (recommendedAction.code === 'protect-site') {
    baseEffects.push({
      targetId: `${regionId}:site`,
      targetLabel: focusTarget.label,
      cultureName: hint.cultureName,
      tone: 'uncertain',
      summary: `Site protégé, mais diffusion encore dépendante du prochain tour.`,
    });
  }

  if (recommendedAction.code === 'follow-event') {
    baseEffects.push({
      targetId: `${regionId}:timeline`,
      targetLabel: 'Timeline locale',
      cultureName: hint.cultureName,
      tone: urgency.level === 'soon' ? 'positive' : 'uncertain',
      summary: `Repère narratif maintenu dans la timeline locale.`,
    });
  }

  if (hint.tone === 'risk') {
    baseEffects.push({
      targetId: `${regionId}:risk`,
      targetLabel: 'Voisinage culturel',
      cultureName: hint.cultureName,
      tone: 'risky',
      summary: `Propagation fragile si l’action est repoussée.`,
    });
  }

  return baseEffects.slice(0, 3);
}



function buildInactionCost(hint, recommendedAction, focusTarget, urgency) {
  const window = urgency.timingLabel ?? urgency.window;
  const source = recommendedAction.source ?? urgency.sourceLabel ?? focusTarget.label;
  const isUrgent = urgency.level === 'soon' || urgency.window === 'ce tour' || hint.status === 'probable';

  if (!isUrgent) {
    return {
      level: 'low',
      label: 'Inaction tolérée',
      source,
      summary: 'Pas de perte culturelle claire si la recommandation attend.',
    };
  }

  if (recommendedAction.code === 'follow-event') {
    return {
      level: 'closing',
      label: 'Se ferme ce tour',
      source,
      summary: `${source} risque de sortir de la timeline locale sans action (${window}).`,
    };
  }

  if (recommendedAction.code === 'accelerate-research') {
    return {
      level: 'degrades',
      label: 'Recherche ralentie',
      source,
      summary: `${source} reste bloquée et perd son avance culturelle (${window}).`,
    };
  }

  if (recommendedAction.code === 'protect-site') {
    return {
      level: 'degrades',
      label: 'Site exposé',
      source: focusTarget.label,
      summary: `${focusTarget.label} peut se dégrader avant d’être exploité (${window}).`,
    };
  }

  if (hint.tone === 'risk') {
    return {
      level: 'risky',
      label: 'Tension culturelle',
      source,
      summary: `${hint.cultureName} garde une tension active si rien n’est mis en file (${window}).`,
    };
  }

  return {
    level: 'blocked',
    label: 'Signal bloqué',
    source,
    summary: `${source} reste bloqué si aucune action culturelle n’est planifiée (${window}).`,
  };
}

function buildConfidenceCue(hint, recommendedAction, urgency, rippleEffects) {
  if (hint.status === 'missing') {
    return {
      level: 'risky',
      label: 'Confiance risquée',
      dissent: 'Signal culturel manquant',
      summary: `${hint.cultureName}: recommandation à considérer comme pari assumé.`,
    };
  }

  if (hint.tone === 'risk' || rippleEffects.some((effect) => effect.tone === 'risky')) {
    return {
      level: 'risky',
      label: 'Confiance risquée',
      dissent: urgency.sourceLabel ?? recommendedAction.source ?? 'Propagation fragile',
      summary: `Risque visible: propagation fragile si la file change.`,
    };
  }

  if (hint.status === 'possible' || rippleEffects.some((effect) => effect.tone === 'uncertain')) {
    const dissent = hint.tone === 'research'
      ? 'Recherche encore partielle'
      : urgency.window === '2+ tours'
        ? 'Fenêtre encore lointaine'
        : 'Effet local à confirmer';
    return {
      level: 'mixed',
      label: 'Confiance mixte',
      dissent,
      summary: `${dissent}: garder le signal visible sans sur-prioriser.`,
    };
  }

  return {
    level: 'high',
    label: 'Confiance haute',
    dissent: 'Aucune dissidence majeure',
    summary: `Signal cohérent avec la fenêtre ${urgency.timingLabel ?? urgency.window}.`,
  };
}

function summarizeHint(hint, actionLabel, urgency) {
  const provinceCopy = hint.regionId ? ` (${hint.regionId})` : '';
  const urgencyCopy = ` ${urgency.label.toLowerCase()} · ${urgency.window}.`;

  if (hint.status === 'probable') {
    return `${hint.label}${provinceCopy}: à exploiter après ${actionLabel}.${urgencyCopy}`;
  }

  if (hint.status === 'possible') {
    return `${hint.label}${provinceCopy}: garder en vue avant de clore le tour.${urgencyCopy}`;
  }

  return `${hint.label}${provinceCopy}: ${hint.cultureName} manque encore un signal exploitable.${urgencyCopy}`;
}

function buildReminder(hint, actionLabel) {
  const focusTarget = hint.focusTarget ?? {
    type: 'province',
    id: hint.regionId,
    regionId: hint.regionId,
    label: 'Province liée',
  };
  const urgency = buildFallbackUrgency(hint, focusTarget);
  const focusTargetWithUrgency = {
    ...focusTarget,
    urgency,
  };
  const recommendedAction = buildRecommendedAction(hint, focusTargetWithUrgency, urgency, actionLabel);
  const tradeoff = buildActionTradeoff(hint, recommendedAction, focusTargetWithUrgency, urgency);
  const rippleEffects = buildRippleEffects(hint, recommendedAction, focusTargetWithUrgency, urgency);
  const confidenceCue = buildConfidenceCue(hint, recommendedAction, urgency, rippleEffects);
  const inactionCost = buildInactionCost(hint, recommendedAction, focusTargetWithUrgency, urgency);

  return {
    reminderId: `${hint.status}:${hint.tone}:${hint.regionId}:${hint.label}:${actionLabel}`,
    tone: reminderTone(hint),
    status: hint.status,
    label: reminderLabel(hint),
    summary: summarizeHint(hint, actionLabel, urgency),
    provinceId: hint.regionId,
    cultureName: hint.cultureName,
    actionLabel,
    urgency,
    urgencyCopy: `${urgency.label} · ${urgency.window}`,
    reasonCopy: urgency.reason ?? `${urgency.sourceLabel ?? focusTarget.label} · ${urgency.timingLabel ?? urgency.window}`,
    recommendedAction,
    actionCopy: `${recommendedAction.label} · ${recommendedAction.timing}`,
    tradeoff,
    tradeoffCopy: `${tradeoff.benefit} · ${tradeoff.risk}`,
    rippleEffects,
    rippleCopy: rippleEffects.length > 0
      ? rippleEffects.map((effect) => `${effect.targetLabel}: ${effect.summary}`).join(' | ')
      : 'Aucun effet de propagation culturel en file.',
    confidenceCue,
    confidenceCopy: `${confidenceCue.label} · ${confidenceCue.dissent}`,
    inactionCost,
    inactionCopy: `${inactionCost.label} · ${inactionCost.summary}`,
    focusTarget: focusTargetWithUrgency,
    focusCopy: `${focusTarget.type}: ${focusTarget.label}`,
  };
}


function conflictPriorityScore(reminder) {
  const urgencyScore = reminder.urgency?.level === 'soon' ? 3 : reminder.urgency?.level === 'new' ? 2 : 1;
  const inactionScore = { closing: 4, degrades: 3, risky: 3, blocked: 2, low: 0 }[reminder.inactionCost?.level] ?? 0;
  const confidenceScore = reminder.confidenceCue?.level === 'high' ? 2 : reminder.confidenceCue?.level === 'mixed' ? 1 : 0;
  return urgencyScore + inactionScore + confidenceScore;
}

function summarizePriorityConflict(left, right) {
  const sameAction = left.actionLabel === right.actionLabel;
  const sameWindow = left.urgency?.window === right.urgency?.window;
  const sameRegion = left.provinceId === right.provinceId;
  const hasRiskyRipple = [...(left.rippleEffects ?? []), ...(right.rippleEffects ?? [])]
    .some((effect) => effect.tone === 'risky');

  if (!sameAction && !sameWindow && !sameRegion && !hasRiskyRipple) {
    return null;
  }

  const primary = conflictPriorityScore(left) >= conflictPriorityScore(right) ? left : right;
  const secondary = primary === left ? right : left;
  const reason = primary.inactionCost?.level !== 'low'
    ? primary.inactionCost.summary
    : (primary.rippleEffects?.[0]?.summary ?? primary.reasonCopy);
  const level = primary.inactionCost?.level === 'closing' || hasRiskyRipple ? 'urgent' : sameAction || sameWindow ? 'shared' : 'watch';
  const recommendation = level === 'urgent'
    ? 'Agir maintenant'
    : sameAction
      ? 'Combiner si possible'
      : 'Attendre le signal le plus faible';

  return {
    conflictId: `${left.reminderId}|${right.reminderId}`,
    level,
    label: sameAction ? 'Même action en file' : sameWindow ? 'Même fenêtre culturelle' : hasRiskyRipple ? 'Ripple opposé' : 'Région partagée',
    primaryReminderId: primary.reminderId,
    secondaryReminderId: secondary.reminderId,
    cultures: [primary.cultureName, secondary.cultureName],
    recommendation,
    reason,
    summary: `${recommendation}: prioriser ${primary.cultureName} avant ${secondary.cultureName}. ${reason}`,
  };
}

function buildPriorityConflicts(reminders) {
  const conflicts = [];

  for (let index = 0; index < reminders.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < reminders.length; nextIndex += 1) {
      const conflict = summarizePriorityConflict(reminders[index], reminders[nextIndex]);
      if (conflict) {
        conflicts.push(conflict);
      }
    }
  }

  return conflicts
    .sort((left, right) => {
      const rank = { urgent: 3, shared: 2, watch: 1 };
      return rank[right.level] - rank[left.level] || left.label.localeCompare(right.label);
    })
    .slice(0, 2);
}

function dedupeAndSort(reminders) {
  const remindersByKey = new Map();

  for (const reminder of reminders) {
    const key = `${reminder.status}:${reminder.label}:${reminder.provinceId}:${reminder.cultureName}`;
    const existingReminder = remindersByKey.get(key);

    if (!existingReminder || STATUS_RANK[reminder.status] > STATUS_RANK[existingReminder.status]) {
      remindersByKey.set(key, reminder);
    }
  }

  return [...remindersByKey.values()]
    .sort((left, right) => STATUS_RANK[right.status] - STATUS_RANK[left.status]
      || TONE_RANK[right.tone] - TONE_RANK[left.tone]
      || left.label.localeCompare(right.label))
    .slice(0, 3);
}

export function buildCultureOpportunityReminders({
  province = null,
  actionQueue = [],
  unlockHintsByAction = [],
} = {}) {
  const actionLabels = actionQueue.length > 0
    ? actionQueue.map((entry) => normalizeText(entry.label, entry.actionCode ?? 'action planifiée'))
    : ['plan actuel'];
  const hints = unlockHintsByAction.flatMap((entry, index) => {
    const actionLabel = normalizeText(entry.action?.label ?? entry.action?.title, actionLabels[index] ?? actionLabels[0]);
    return (entry.hints ?? []).map((hint) => buildReminder(hint, actionLabel));
  });
  const reminders = dedupeAndSort(hints);
  const provinceLabel = normalizeText(province?.label, province?.provinceId ?? 'province');

  if (reminders.length === 0) {
    return {
      state: 'quiet',
      provinceLabel,
      summary: `${provinceLabel}: aucune opportunité culturelle nouvelle dans le plan de fin de tour.`,
      reminders: [],
    };
  }

  const probableCount = reminders.filter((reminder) => reminder.status === 'probable').length;
  const missingCount = reminders.filter((reminder) => reminder.status === 'missing').length;
  const priorityConflicts = buildPriorityConflicts(reminders);

  return {
    state: 'active',
    provinceLabel,
    summary: `${provinceLabel}: ${probableCount} opportunité${probableCount > 1 ? 's' : ''} probable${probableCount > 1 ? 's' : ''}, ${missingCount} condition${missingCount > 1 ? 's' : ''} à surveiller.`,
    reminders,
    priorityConflicts,
  };
}
