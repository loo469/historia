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

function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function ensureFactionSnapshot(snapshot) {
  const normalizedSnapshot = requireObject(snapshot, 'FactionReadPort snapshot');

  return {
    ...normalizedSnapshot,
    factionId: requireText(normalizedSnapshot.factionId, 'FactionReadPort snapshot.factionId'),
  };
}

export function createFactionReadPort({ readFaction }) {
  const normalizedReadFaction = requireFunction(readFaction, 'FactionReadPort readFaction');

  return {
    readFaction(query = {}) {
      const normalizedQuery = requireObject(query, 'FactionReadPort query');
      return ensureFactionSnapshot(normalizedReadFaction({ ...normalizedQuery }));
    },
  };
}

export function assertFactionReadPort(port) {
  const normalizedPort = requireObject(port, 'FactionReadPort');
  const readFaction = requireFunction(normalizedPort.readFaction, 'FactionReadPort readFaction');

  return {
    readFaction(query = {}) {
      const normalizedQuery = requireObject(query, 'FactionReadPort query');
      return ensureFactionSnapshot(readFaction.call(normalizedPort, { ...normalizedQuery }));
    },
  };
}
