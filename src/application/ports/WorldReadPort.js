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

function ensureSnapshot(snapshot) {
  const normalizedSnapshot = requireObject(snapshot, 'WorldReadPort snapshot');

  if (!('worldId' in normalizedSnapshot)) {
    throw new RangeError('WorldReadPort snapshot.worldId is required.');
  }

  return { ...normalizedSnapshot };
}

export function createWorldReadPort({ readWorld }) {
  const normalizedReadWorld = requireFunction(readWorld, 'WorldReadPort readWorld');

  return {
    readWorld(query = {}) {
      requireObject(query, 'WorldReadPort query');
      return ensureSnapshot(normalizedReadWorld({ ...query }));
    },
  };
}

export function assertWorldReadPort(port) {
  const normalizedPort = requireObject(port, 'WorldReadPort');
  const readWorld = requireFunction(normalizedPort.readWorld, 'WorldReadPort readWorld');

  return {
    readWorld(query = {}) {
      requireObject(query, 'WorldReadPort query');
      return ensureSnapshot(readWorld.call(normalizedPort, { ...query }));
    },
  };
}
