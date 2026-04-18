function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function requireFiniteNumber(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new RangeError(`${label} must be a finite number.`);
  }

  return value;
}

function normalizeUniqueTexts(values, label) {
  if (!Array.isArray(values)) {
    throw new TypeError(`${label} must be an array.`);
  }

  return [...new Set(values.map((value) => requireText(value, label)))].sort();
}

function normalizeResearchState(researchState) {
  if (!researchState || typeof researchState !== 'object' || Array.isArray(researchState)) {
    throw new TypeError('evaluateResearchUnlocks researchState must be an object.');
  }

  return {
    ...researchState,
    id: requireText(researchState.id, 'evaluateResearchUnlocks researchState.id'),
    cultureId: requireText(researchState.cultureId, 'evaluateResearchUnlocks researchState.cultureId'),
    focusIds: normalizeUniqueTexts(
      researchState.focusIds ?? [],
      'evaluateResearchUnlocks researchState.focusIds',
    ),
    unlockedResearchIds: normalizeUniqueTexts(
      researchState.unlockedResearchIds ?? [],
      'evaluateResearchUnlocks researchState.unlockedResearchIds',
    ),
    activeProjectId:
      researchState.activeProjectId === null || researchState.activeProjectId === undefined
        ? null
        : requireText(
            researchState.activeProjectId,
            'evaluateResearchUnlocks researchState.activeProjectId',
          ),
    knowledgePoints: requireFiniteNumber(
      researchState.knowledgePoints ?? 0,
      'evaluateResearchUnlocks researchState.knowledgePoints',
    ),
  };
}

function normalizeResearchProject(researchProject, index) {
  if (!researchProject || typeof researchProject !== 'object' || Array.isArray(researchProject)) {
    throw new TypeError(`evaluateResearchUnlocks researchProjects[${index}] must be an object.`);
  }

  return {
    ...researchProject,
    id: requireText(researchProject.id, `evaluateResearchUnlocks researchProjects[${index}].id`),
    requiredKnowledgePoints: requireFiniteNumber(
      researchProject.requiredKnowledgePoints,
      `evaluateResearchUnlocks researchProjects[${index}].requiredKnowledgePoints`,
    ),
  };
}

export function evaluateResearchUnlocks(researchState, researchProjects) {
  const normalizedResearchState = normalizeResearchState(researchState);

  if (!Array.isArray(researchProjects)) {
    throw new TypeError('evaluateResearchUnlocks researchProjects must be an array.');
  }

  const normalizedResearchProjects = researchProjects.map((researchProject, index) =>
    normalizeResearchProject(researchProject, index),
  );

  const unlockedResearchIds = new Set(normalizedResearchState.unlockedResearchIds);
  const newlyUnlockedResearchIds = [];

  for (const researchProject of normalizedResearchProjects) {
    if (
      normalizedResearchState.knowledgePoints >= researchProject.requiredKnowledgePoints &&
      !unlockedResearchIds.has(researchProject.id)
    ) {
      unlockedResearchIds.add(researchProject.id);
      newlyUnlockedResearchIds.push(researchProject.id);
    }
  }

  return {
    ...normalizedResearchState,
    unlockedResearchIds: [...unlockedResearchIds].sort(),
    newlyUnlockedResearchIds: newlyUnlockedResearchIds.sort(),
  };
}
