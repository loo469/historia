function requireFunction(value, label) {
  if (typeof value !== 'function') {
    throw new TypeError(`${label} must be a function.`);
  }

  return value;
}

function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function ensureRollResult(result) {
  const normalizedResult = requireObject(result, 'RandomPort roll result');

  if (!Number.isInteger(normalizedResult.value)) {
    throw new RangeError('RandomPort roll result.value must be an integer.');
  }

  if (!Number.isInteger(normalizedResult.min)) {
    throw new RangeError('RandomPort roll result.min must be an integer.');
  }

  if (!Number.isInteger(normalizedResult.max)) {
    throw new RangeError('RandomPort roll result.max must be an integer.');
  }

  if (normalizedResult.min > normalizedResult.max) {
    throw new RangeError('RandomPort roll result.min must be less than or equal to max.');
  }

  if (normalizedResult.value < normalizedResult.min || normalizedResult.value > normalizedResult.max) {
    throw new RangeError('RandomPort roll result.value must be between min and max.');
  }

  return { ...normalizedResult };
}

function normalizeBounds(bounds = {}) {
  const normalizedBounds = requireObject(bounds, 'RandomPort bounds');
  const min = normalizedBounds.min ?? 0;
  const max = normalizedBounds.max ?? 100;

  if (!Number.isInteger(min)) {
    throw new RangeError('RandomPort bounds.min must be an integer.');
  }

  if (!Number.isInteger(max)) {
    throw new RangeError('RandomPort bounds.max must be an integer.');
  }

  if (min > max) {
    throw new RangeError('RandomPort bounds.min must be less than or equal to max.');
  }

  return { min, max };
}

export function createRandomPort({ roll }) {
  const normalizedRoll = requireFunction(roll, 'RandomPort roll');

  return {
    roll(bounds = {}) {
      const normalizedBounds = normalizeBounds(bounds);
      return ensureRollResult(normalizedRoll({ ...normalizedBounds }));
    },
  };
}

export function assertRandomPort(port) {
  const normalizedPort = requireObject(port, 'RandomPort');
  const roll = requireFunction(normalizedPort.roll, 'RandomPort roll');

  return {
    roll(bounds = {}) {
      const normalizedBounds = normalizeBounds(bounds);
      return ensureRollResult(roll.call(normalizedPort, { ...normalizedBounds }));
    },
  };
}
