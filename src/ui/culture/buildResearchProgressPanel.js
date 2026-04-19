import { ResearchState } from '../../domain/culture/ResearchState.js';

function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizeResearchState(researchState, index) {
  if (researchState instanceof ResearchState) {
    return researchState;
  }

  if (researchState === null || typeof researchState !== 'object' || Array.isArray(researchState)) {
    throw new TypeError(`ResearchProgressPanel researchStates[${index}] must be a ResearchState instance or plain object.`);
  }

  return new ResearchState(researchState);
}

function normalizeResearchStates(researchStates) {
  if (!Array.isArray(researchStates)) {
    throw new TypeError('ResearchProgressPanel researchStates must be an array.');
  }

  return researchStates.map(normalizeResearchState);
}

function buildStatusTone(researchState) {
  if (researchState.status === 'completed') {
    return 'success';
  }

  if (researchState.status === 'blocked' || researchState.blockedByIds.length > 0) {
    return 'warning';
  }

  if (researchState.status === 'active') {
    return 'info';
  }

  return 'muted';
}

function buildStatusLabel(researchState) {
  if (researchState.status === 'completed') {
    return 'Terminée';
  }

  if (researchState.status === 'blocked' || researchState.blockedByIds.length > 0) {
    return 'Bloquée';
  }

  if (researchState.status === 'active') {
    return 'Active';
  }

  return 'Planifiée';
}

function buildProgressLabel(researchState) {
  if (researchState.status === 'completed') {
    return 'Terminée';
  }

  if (researchState.status === 'blocked' || researchState.blockedByIds.length > 0) {
    return `${researchState.progress}% bloqué`;
  }

  if (researchState.status === 'planned') {
    return `${researchState.progress}% planifié`;
  }

  return `${researchState.progress}% en cours`;
}

export function buildResearchProgressPanel(researchStates, options = {}) {
  const normalizedResearchStates = normalizeResearchStates(researchStates);
  const normalizedOptions = requireObject(options, 'ResearchProgressPanel options');
  const cultureId = requireText(normalizedOptions.cultureId, 'ResearchProgressPanel options.cultureId');
  const title = String(normalizedOptions.title ?? 'Recherches').trim() || 'Recherches';

  const rows = normalizedResearchStates
    .filter((researchState) => researchState.cultureId === cultureId)
    .sort((left, right) => {
      const statusRank = {
        active: 0,
        blocked: 1,
        completed: 2,
        planned: 3,
      };
      const rankComparison = (statusRank[left.status] ?? 9) - (statusRank[right.status] ?? 9);

      if (rankComparison !== 0) {
        return rankComparison;
      }

      const progressComparison = right.progress - left.progress;

      if (progressComparison !== 0) {
        return progressComparison;
      }

      return left.topicId.localeCompare(right.topicId);
    })
    .map((researchState) => ({
      researchId: researchState.id,
      topicId: researchState.topicId,
      status: researchState.status,
      statusLabel: buildStatusLabel(researchState),
      tone: buildStatusTone(researchState),
      progress: researchState.progress,
      currentTier: researchState.currentTier,
      progressLabel: buildProgressLabel(researchState),
      blockedByIds: [...researchState.blockedByIds],
      discoveredConceptCount: researchState.discoveredConceptIds.length,
      lastAdvancedAt: researchState.lastAdvancedAt?.toISOString() ?? null,
      completedAt: researchState.completedAt?.toISOString() ?? null,
    }));

  const activeCount = rows.filter((row) => row.status === 'active').length;
  const blockedCount = rows.filter((row) => row.status === 'blocked' || row.blockedByIds.length > 0).length;
  const completedCount = rows.filter((row) => row.status === 'completed').length;

  return {
    cultureId,
    title,
    summary: `${activeCount} actives, ${blockedCount} bloquées, ${completedCount} terminées`,
    rows,
    metrics: {
      researchCount: rows.length,
      activeCount,
      blockedCount,
      completedCount,
      averageProgress: rows.length === 0 ? 0 : Math.round(rows.reduce((sum, row) => sum + row.progress, 0) / rows.length),
    },
  };
}
