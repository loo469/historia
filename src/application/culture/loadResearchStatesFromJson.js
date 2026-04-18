function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
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

function normalizeTextArray(value, label) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${label} must be an array.`);
  }

  return [...new Set(value.map((item) => requireText(item, label)))].sort();
}

function normalizeResearchState(researchState, index) {
  const normalizedResearchState = requireObject(
    researchState,
    `loadResearchStatesFromJson researchState[${index}]`,
  );

  return {
    id: requireText(
      normalizedResearchState.id,
      `loadResearchStatesFromJson researchState[${index}].id`,
    ),
    cultureId: requireText(
      normalizedResearchState.cultureId,
      `loadResearchStatesFromJson researchState[${index}].cultureId`,
    ),
    focusIds: normalizeTextArray(
      normalizedResearchState.focusIds ?? [],
      `loadResearchStatesFromJson researchState[${index}].focusIds`,
    ),
    unlockedResearchIds: normalizeTextArray(
      normalizedResearchState.unlockedResearchIds ?? [],
      `loadResearchStatesFromJson researchState[${index}].unlockedResearchIds`,
    ),
    activeProjectId:
      normalizedResearchState.activeProjectId === null ||
      normalizedResearchState.activeProjectId === undefined
        ? null
        : requireText(
            normalizedResearchState.activeProjectId,
            `loadResearchStatesFromJson researchState[${index}].activeProjectId`,
          ),
    knowledgePoints: Number.isFinite(normalizedResearchState.knowledgePoints)
      ? normalizedResearchState.knowledgePoints
      : 0,
  };
}

export function loadResearchStatesFromJson(jsonText) {
  const normalizedJsonText = requireText(jsonText, 'loadResearchStatesFromJson jsonText');

  let parsed;
  try {
    parsed = JSON.parse(normalizedJsonText);
  } catch (error) {
    throw new SyntaxError(`loadResearchStatesFromJson could not parse JSON: ${error.message}`);
  }

  const root = requireObject(parsed, 'loadResearchStatesFromJson root');
  const rawResearchStates = root.researchStates;

  if (!Array.isArray(rawResearchStates)) {
    throw new TypeError('loadResearchStatesFromJson root.researchStates must be an array.');
  }

  return rawResearchStates.map((researchState, index) =>
    normalizeResearchState(researchState, index),
  );
}
