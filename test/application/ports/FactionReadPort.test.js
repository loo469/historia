import test from 'node:test';
import assert from 'node:assert/strict';

import { assertFactionReadPort, createFactionReadPort } from '../../../src/application/ports/FactionReadPort.js';

test('createFactionReadPort wraps a reader and returns normalized faction snapshots', () => {
  const receivedQueries = [];
  const port = createFactionReadPort({
    readFaction(query) {
      receivedQueries.push(query);
      return {
        factionId: 'delta-league',
        stability: 61,
        influence: 47,
      };
    },
  });

  const snapshot = port.readFaction({ factionId: 'delta-league' });
  snapshot.stability = 0;

  assert.deepEqual(receivedQueries, [{ factionId: 'delta-league' }]);
  assert.deepEqual(port.readFaction({ factionId: 'delta-league' }), {
    factionId: 'delta-league',
    stability: 61,
    influence: 47,
  });
});

test('assertFactionReadPort validates the contract and preserves context', () => {
  const port = {
    suffix: 'league',
    readFaction(query) {
      return {
        factionId: `${query.prefix}-${this.suffix}`,
        legitimacy: 72,
      };
    },
  };

  const validatedPort = assertFactionReadPort(port);

  assert.deepEqual(validatedPort.readFaction({ prefix: 'delta' }), {
    factionId: 'delta-league',
    legitimacy: 72,
  });

  assert.throws(() => assertFactionReadPort({}), /FactionReadPort readFaction must be a function/);
  assert.throws(() => validatedPort.readFaction(null), /FactionReadPort query must be an object/);
});

test('FactionReadPort rejects invalid snapshots', () => {
  const port = createFactionReadPort({
    readFaction() {
      return { stability: 42 };
    },
  });

  assert.throws(() => port.readFaction({}), /FactionReadPort snapshot.factionId is required/);
  assert.throws(
    () => createFactionReadPort({ readFaction: 42 }),
    /FactionReadPort readFaction must be a function/,
  );
});
