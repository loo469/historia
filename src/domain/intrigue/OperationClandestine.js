const DEFAULT_DIFFICULTY = 50;
const DEFAULT_DETECTION_RISK = 25;
const DEFAULT_PROGRESS = 0;
const DEFAULT_PHASE = 'planning';
const ALLOWED_PHASES = new Set(['planning', 'infiltration', 'execution', 'exfiltration', 'completed', 'failed']);
const ALLOWED_TYPES = new Set(['sabotage', 'rumor', 'intelligence', 'assassination', 'subversion']);

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

export class OperationClandestine {
  constructor({
    id,
    celluleId,
    targetFactionId,
    type,
    objective,
    theaterId,
    assignedAgentIds = [],
    requiredAssetIds = [],
    difficulty = DEFAULT_DIFFICULTY,
    detectionRisk = DEFAULT_DETECTION_RISK,
    progress = DEFAULT_PROGRESS,
    phase = DEFAULT_PHASE,
    heat = 0,
  }) {
    this.id = OperationClandestine.#requireText(id, 'OperationClandestine id');
    this.celluleId = OperationClandestine.#requireText(celluleId, 'OperationClandestine celluleId');
    this.targetFactionId = OperationClandestine.#requireText(
      targetFactionId,
      'OperationClandestine targetFactionId',
    );
    this.type = OperationClandestine.#normalizeType(type);
    this.objective = OperationClandestine.#requireText(objective, 'OperationClandestine objective');
    this.theaterId = OperationClandestine.#requireText(theaterId, 'OperationClandestine theaterId');
    this.assignedAgentIds = normalizeUniqueTexts(
      assignedAgentIds,
      'OperationClandestine assignedAgentIds',
    );
    this.requiredAssetIds = normalizeUniqueTexts(
      requiredAssetIds,
      'OperationClandestine requiredAssetIds',
    );
    this.difficulty = OperationClandestine.#requireIntegerInRange(
      difficulty,
      'OperationClandestine difficulty',
      0,
      100,
    );
    this.detectionRisk = OperationClandestine.#requireIntegerInRange(
      detectionRisk,
      'OperationClandestine detectionRisk',
      0,
      100,
    );
    this.progress = OperationClandestine.#requireIntegerInRange(
      progress,
      'OperationClandestine progress',
      0,
      100,
    );
    this.phase = OperationClandestine.#normalizePhase(phase);
    this.heat = OperationClandestine.#requireIntegerInRange(
      heat,
      'OperationClandestine heat',
      0,
      100,
    );
  }

  get successWindow() {
    return Math.max(0, 100 - this.difficulty - this.detectionRisk + this.progress);
  }

  get isResolved() {
    return this.phase === 'completed' || this.phase === 'failed';
  }

  advance({ phase = this.phase, progress = this.progress, detectionRisk = this.detectionRisk, heat = this.heat }) {
    return new OperationClandestine({
      ...this.toJSON(),
      phase,
      progress,
      detectionRisk,
      heat,
    });
  }

  assignAgent(agentId) {
    return new OperationClandestine({
      ...this.toJSON(),
      assignedAgentIds: [...this.assignedAgentIds, agentId],
    });
  }

  toJSON() {
    return {
      id: this.id,
      celluleId: this.celluleId,
      targetFactionId: this.targetFactionId,
      type: this.type,
      objective: this.objective,
      theaterId: this.theaterId,
      assignedAgentIds: [...this.assignedAgentIds],
      requiredAssetIds: [...this.requiredAssetIds],
      difficulty: this.difficulty,
      detectionRisk: this.detectionRisk,
      progress: this.progress,
      phase: this.phase,
      heat: this.heat,
    };
  }

  static #requireText(value, label) {
    const normalizedValue = String(value ?? '').trim();

    if (!normalizedValue) {
      throw new RangeError(`${label} is required.`);
    }

    return normalizedValue;
  }

  static #requireIntegerInRange(value, label, min, max) {
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new RangeError(`${label} must be an integer between ${min} and ${max}.`);
    }

    return value;
  }

  static #normalizeType(value) {
    const normalizedValue = OperationClandestine.#requireText(value, 'OperationClandestine type');

    if (!ALLOWED_TYPES.has(normalizedValue)) {
      throw new RangeError(`OperationClandestine type must be one of: ${[...ALLOWED_TYPES].join(', ')}.`);
    }

    return normalizedValue;
  }

  static #normalizePhase(value) {
    const normalizedValue = OperationClandestine.#requireText(value, 'OperationClandestine phase');

    if (!ALLOWED_PHASES.has(normalizedValue)) {
      throw new RangeError(`OperationClandestine phase must be one of: ${[...ALLOWED_PHASES].join(', ')}.`);
    }

    return normalizedValue;
  }
}
