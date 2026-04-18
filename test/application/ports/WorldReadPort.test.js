import test from 'node:test';
import assert from 'node:assert/strict';

import { assertWorldReadPort, createWorldReadPort } from '../../../src/application/ports/WorldReadPort.js';

test('createWorldReadPort wraps a reader and returns immutable snapshots', () => {
  const receivedQueries = [];
  const port = createWorldReadPort({
    readWorld(query) {
      receivedQueries.push(query);
      return {
        worldId: 'world-historia',
        tick: 42,
        regionIds: ['north', 'delta'],
      };
    },
  });

  const snapshot = port.readWorld({ tick: 42, regionId: 'delta' });
  snapshot.tick = 99;

  assert.deepEqual(receivedQueries, [{ tick: 42, regionId: 'delta' }]);
  assert.deepEqual(port.readWorld({ tick: 43 }), {
    worldId: 'world-historia',
    tick: 42,
    regionIds: ['north', 'delta'],
  });
});

test('assertWorldReadPort validates the contract and preserves context', () => {
  const port = {
    prefix: 'world',
    readWorld(query) {
      return {
        worldId: `${this.prefix}-${query.tick}`,
        tick: query.tick,
      };
    },
  };

  const validatedPort = assertWorldReadPort(port);

  assert.deepEqual(validatedPort.readWorld({ tick: 7 }), {
    worldId: 'world-7',
    tick: 7,
  });

  assert.throws(() => assertWorldReadPort({}), /WorldReadPort readWorld must be a function/);
  assert.throws(
    () => validatedPort.readWorld(null),
    /WorldReadPort query must be an object/,
  );
});

test('WorldReadPort rejects invalid snapshots', () => {
  const port = createWorldReadPort({
    readWorld() {
      return { tick: 42 };
    },
  });

  assert.throws(() => port.readWorld({}), /WorldReadPort snapshot.worldId is required/);
  assert.throws(
    () =>
      createWorldReadPort({
        readWorld: 'nope',
      }),
    /WorldReadPort readWorld must be a function/,
  );
});
