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

function summarizeHint(hint, actionLabel) {
  const provinceCopy = hint.regionId ? ` (${hint.regionId})` : '';

  if (hint.status === 'probable') {
    return `${hint.label}${provinceCopy}: à exploiter après ${actionLabel}.`;
  }

  if (hint.status === 'possible') {
    return `${hint.label}${provinceCopy}: garder en vue avant de clore le tour.`;
  }

  return `${hint.label}${provinceCopy}: ${hint.cultureName} manque encore un signal exploitable.`;
}

function buildReminder(hint, actionLabel) {
  const focusTarget = hint.focusTarget ?? {
    type: 'province',
    id: hint.regionId,
    regionId: hint.regionId,
    label: 'Province liée',
  };

  return {
    reminderId: `${hint.status}:${hint.tone}:${hint.regionId}:${hint.label}:${actionLabel}`,
    tone: reminderTone(hint),
    status: hint.status,
    label: reminderLabel(hint),
    summary: summarizeHint(hint, actionLabel),
    provinceId: hint.regionId,
    cultureName: hint.cultureName,
    actionLabel,
    focusTarget,
    focusCopy: `${focusTarget.type}: ${focusTarget.label}`,
  };
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

  return {
    state: 'active',
    provinceLabel,
    summary: `${provinceLabel}: ${probableCount} opportunité${probableCount > 1 ? 's' : ''} probable${probableCount > 1 ? 's' : ''}, ${missingCount} condition${missingCount > 1 ? 's' : ''} à surveiller.`,
    reminders,
  };
}
