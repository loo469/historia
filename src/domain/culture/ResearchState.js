const DEFAULT_PROGRESS = 0;

function normalizeUniqueTexts(values, label) {
  if (!Array.isArray(values)) {
    throw new TypeError(`${label} must be an array.`);
  }

  const normalizedValues = [...new Set(values.map((value) => String(value).trim()))];

  if (normalizedValues.some((value) => value.length === 0)) {
    throw new RangeError(`${label} cannot contain empty values.`);
  }

  return normalizedValues.sort();
}

export class ResearchState {
  constructor({
    id,
    cultureId,
    topicId,
    status,
    progress = DEFAULT_PROGRESS,
    currentTier = 0,
    discoveredConceptIds = [],
    blockedByIds = [],
    lastAdvancedAt = null,
    completedAt = null,
  }) {
    this.id = ResearchState.#requireText(id, 'ResearchState id');
    this.cultureId = ResearchState.#requireText(cultureId, 'ResearchState cultureId');
    this.topicId = ResearchState.#requireText(topicId, 'ResearchState topicId');
    this.status = ResearchState.#requireStatus(status);
    this.progress = ResearchState.#requireIntegerInRange(progress, 'ResearchState progress', 0, 100);
    this.currentTier = ResearchState.#requireIntegerInRange(
      currentTier,
      'ResearchState currentTier',
      0,
      10,
    );
    this.discoveredConceptIds = normalizeUniqueTexts(
      discoveredConceptIds,
      'ResearchState discoveredConceptIds',
    );
    this.blockedByIds = normalizeUniqueTexts(blockedByIds, 'ResearchState blockedByIds');
    this.lastAdvancedAt = ResearchState.#normalizeDate(lastAdvancedAt, 'ResearchState lastAdvancedAt');
    this.completedAt = ResearchState.#normalizeDate(completedAt, 'ResearchState completedAt');

    if (this.status === 'completed' && this.completedAt === null) {
      throw new RangeError('ResearchState completedAt is required when status is completed.');
    }

    if (this.status !== 'completed' && this.completedAt !== null) {
      throw new RangeError('ResearchState completedAt must be null unless status is completed.');
    }

    if (this.status === 'completed' && this.progress !== 100) {
      throw new RangeError('ResearchState progress must be 100 when status is completed.');
    }
  }

  isBlocked() {
    return this.status === 'blocked' || this.blockedByIds.length > 0;
  }

  canAdvance() {
    return this.status === 'active' && !this.isBlocked() && this.progress < 100;
  }

  withProgress(progress, lastAdvancedAt = new Date()) {
    const normalizedProgress = ResearchState.#requireIntegerInRange(
      progress,
      'ResearchState progress',
      0,
      100,
    );

    if (normalizedProgress === 100) {
      return new ResearchState({
        ...this.toJSON(),
        progress: normalizedProgress,
        status: 'completed',
        lastAdvancedAt,
        completedAt: lastAdvancedAt,
      });
    }

    return new ResearchState({
      ...this.toJSON(),
      progress: normalizedProgress,
      lastAdvancedAt,
    });
  }

  withStatus(status, { blockedByIds = this.blockedByIds, completedAt = this.completedAt } = {}) {
    const normalizedStatus = ResearchState.#requireStatus(status);

    return new ResearchState({
      ...this.toJSON(),
      status: normalizedStatus,
      blockedByIds,
      completedAt: normalizedStatus === 'completed' ? completedAt ?? new Date() : null,
      progress: normalizedStatus === 'completed' ? 100 : this.progress,
    });
  }

  toJSON() {
    return {
      id: this.id,
      cultureId: this.cultureId,
      topicId: this.topicId,
      status: this.status,
      progress: this.progress,
      currentTier: this.currentTier,
      discoveredConceptIds: [...this.discoveredConceptIds],
      blockedByIds: [...this.blockedByIds],
      lastAdvancedAt: this.lastAdvancedAt?.toISOString() ?? null,
      completedAt: this.completedAt?.toISOString() ?? null,
    };
  }

  static #requireText(value, label) {
    const normalizedValue = String(value ?? '').trim();

    if (!normalizedValue) {
      throw new RangeError(`${label} is required.`);
    }

    return normalizedValue;
  }

  static #requireStatus(value) {
    const normalizedValue = ResearchState.#requireText(value, 'ResearchState status');
    const allowedStatuses = new Set(['planned', 'active', 'blocked', 'completed']);

    if (!allowedStatuses.has(normalizedValue)) {
      throw new RangeError('ResearchState status must be one of planned, active, blocked, or completed.');
    }

    return normalizedValue;
  }

  static #requireIntegerInRange(value, label, min, max) {
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new RangeError(`${label} must be an integer between ${min} and ${max}.`);
    }

    return value;
  }

  static #normalizeDate(value, label) {
    if (value === null || value === undefined) {
      return null;
    }

    const normalizedValue = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(normalizedValue.getTime())) {
      throw new RangeError(`${label} must be a valid date.`);
    }

    return normalizedValue;
  }
}
