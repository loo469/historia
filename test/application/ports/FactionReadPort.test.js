import test from 'node:test';
import assert from 'node:assert/strict';

import { assertFactionReadPort, createFactionReadPort } from '../../../src/application/ports/FactionReadPort.js';

test('createFactionReadPort wraps a reader and returns immutable snapshots', () => {
  const receivedQueries = [];
  const port = createFactionReadPort({
    readFaction(query) {
      receivedQueries.push(query);
      return {
        factionId: 'faction-delta',
        alertLevel: 2,
        celluleIds: ['cellule-ombre'],
      };
    },
  });

  const snapshot = port.readFaction({ factionId: 'faction-delta' });
  snapshot.alertLevel = 99;

  assert.deepEqual(receivedQueries, [{ factionId: 'faction-delta' }]);
  assert.deepEqual(port.readFaction({ factionId: 'faction-delta', tick: 8 }), {
    factionId: 'faction-delta',
    alertLevel: 2,
    celluleIds: ['cellule-ombre'],
  });
});

test('assertFactionReadPort validates the contract and preserves context', () => {
  const port = {
    prefix: 'faction',
    readFaction(query) {
      return {
        factionId: `${this.prefix}-${query.code}`,
        code: query.code,
      };
    },
  };

  const validatedPort = assertFactionReadPort(port);

  assert.deepEqual(validatedPort.readFaction({ code: 'delta' }), {
    factionId: 'faction-delta',
    code: 'delta',
  });

  assert.throws(() => assertFactionReadPort({}), /FactionReadPort readFaction must be a function/);
  assert.throws(() => validatedPort.readFaction(null), /FactionReadPort query must be an object/);
});

test('FactionReadPort rejects invalid snapshots', () => {
  const port = createFactionReadPort({
    readFaction() {
      return { alertLevel: 2 };
    },
  });

  assert.throws(() => port.readFaction({}), /FactionReadPort snapshot.factionId is required/);
  assert.throws(
    () => createFactionReadPort({ readFaction: 'nope' }),
    /FactionReadPort readFaction must be a function/,
  );
});
