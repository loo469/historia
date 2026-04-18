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

function requireFiniteNumber(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite number.`);
  }

  return value;
}

function ensureRoll(value, label) {
  const normalizedValue = requireFiniteNumber(value, label);

  if (normalizedValue < 0 || normalizedValue > 1) {
    throw new RangeError(`${label} must be between 0 and 1.`);
  }

  return normalizedValue;
}

export function createRandomPort({ nextFloat }) {
  const normalizedNextFloat = requireFunction(nextFloat, 'RandomPort nextFloat');

  return {
    nextFloat(options = {}) {
      requireObject(options, 'RandomPort options');
      return ensureRoll(normalizedNextFloat({ ...options }), 'RandomPort roll');
    },
  };
}

export function assertRandomPort(port) {
  const normalizedPort = requireObject(port, 'RandomPort');
  const nextFloat = requireFunction(normalizedPort.nextFloat, 'RandomPort nextFloat');

  return {
    nextFloat(options = {}) {
      requireObject(options, 'RandomPort options');
      return ensureRoll(nextFloat.call(normalizedPort, { ...options }), 'RandomPort roll');
    },
  };
}
