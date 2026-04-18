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
  const normalizedSnapshot = requireObject(snapshot, 'FactionReadPort snapshot');

  if (!('factionId' in normalizedSnapshot)) {
    throw new RangeError('FactionReadPort snapshot.factionId is required.');
  }

  return { ...normalizedSnapshot };
}

export function createFactionReadPort({ readFaction }) {
  const normalizedReadFaction = requireFunction(readFaction, 'FactionReadPort readFaction');

  return {
    readFaction(query = {}) {
      requireObject(query, 'FactionReadPort query');
      return ensureSnapshot(normalizedReadFaction({ ...query }));
    },
  };
}

export function assertFactionReadPort(port) {
  const normalizedPort = requireObject(port, 'FactionReadPort');
  const readFaction = requireFunction(normalizedPort.readFaction, 'FactionReadPort readFaction');

  return {
    readFaction(query = {}) {
      requireObject(query, 'FactionReadPort query');
      return ensureSnapshot(readFaction.call(normalizedPort, { ...query }));
    },
  };
}
