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

function normalizeNumericMap(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, amount]) => [
      requireText(key, `${label} key`),
      requireFiniteNumber(amount, `${label}.${key}`),
    ]),
  );
}

function normalizeCultureState(cultureState) {
  if (!cultureState || typeof cultureState !== 'object' || Array.isArray(cultureState)) {
    throw new TypeError('evaluateCulturalDrift cultureState must be an object.');
  }

  return {
    ...cultureState,
    id: requireText(cultureState.id, 'evaluateCulturalDrift cultureState.id'),
    cultureId: requireText(cultureState.cultureId, 'evaluateCulturalDrift cultureState.cultureId'),
    stability: requireFiniteNumber(
      cultureState.stability ?? 0,
      'evaluateCulturalDrift cultureState.stability',
    ),
    values: normalizeNumericMap(
      cultureState.values ?? {},
      'evaluateCulturalDrift cultureState.values',
    ),
  };
}

function normalizeDriftInputs(driftInputs) {
  if (!driftInputs || typeof driftInputs !== 'object' || Array.isArray(driftInputs)) {
    throw new TypeError('evaluateCulturalDrift driftInputs must be an object.');
  }

  return {
    pressure: normalizeNumericMap(
      driftInputs.pressure ?? {},
      'evaluateCulturalDrift driftInputs.pressure',
    ),
    contact: normalizeNumericMap(
      driftInputs.contact ?? {},
      'evaluateCulturalDrift driftInputs.contact',
    ),
    resilience: requireFiniteNumber(
      driftInputs.resilience ?? 0,
      'evaluateCulturalDrift driftInputs.resilience',
    ),
  };
}

function roundToThreeDecimals(value) {
  return Math.round(value * 1000) / 1000;
}

export function evaluateCulturalDrift(cultureState, driftInputs) {
  const normalizedCultureState = normalizeCultureState(cultureState);
  const normalizedDriftInputs = normalizeDriftInputs(driftInputs);

  const nextValues = { ...normalizedCultureState.values };
  const appliedDrift = {};
  const allAxes = new Set([
    ...Object.keys(normalizedCultureState.values),
    ...Object.keys(normalizedDriftInputs.pressure),
    ...Object.keys(normalizedDriftInputs.contact),
  ]);

  for (const axis of allAxes) {
    const currentValue = normalizedCultureState.values[axis] ?? 0;
    const pressureDelta = normalizedDriftInputs.pressure[axis] ?? 0;
    const contactDelta = normalizedDriftInputs.contact[axis] ?? 0;
    const driftDelta = roundToThreeDecimals(
      pressureDelta + contactDelta - normalizedDriftInputs.resilience,
    );

    nextValues[axis] = roundToThreeDecimals(currentValue + driftDelta);
    appliedDrift[axis] = driftDelta;
  }

  const totalDrift = Object.values(appliedDrift).reduce((sum, value) => sum + Math.abs(value), 0);
  const nextStability = roundToThreeDecimals(normalizedCultureState.stability - totalDrift * 0.1);

  return {
    ...normalizedCultureState,
    values: nextValues,
    appliedDrift,
    stability: nextStability,
  };
}
