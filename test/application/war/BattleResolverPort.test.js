import test from 'node:test';
import assert from 'node:assert/strict';

import { BattleResolverPort } from '../../../src/application/war/BattleResolverPort.js';

class FixedBattleResolverPort extends BattleResolverPort {
  constructor(outcome) {
    super();
    this.outcome = outcome;
    this.calls = [];
  }

  async resolveBattle(context) {
    this.calls.push(context);
    return this.outcome;
  }
}

test('BattleResolverPort normalizes battle context before delegating to an adapter', async () => {
  const resolver = new FixedBattleResolverPort({
    winnerFactionId: 'faction-a',
    pressureDelta: 18,
    casualties: { attacker: 12, defender: 20 },
  });

  const outcome = await resolver.requireResolvedBattle({
    attackerFactionId: ' faction-a ',
    defenderFactionId: ' faction-b ',
    frontId: ' front-north ',
    terrainType: 'forest',
  });

  assert.deepEqual(resolver.calls, [
    {
      attackerFactionId: 'faction-a',
      defenderFactionId: 'faction-b',
      frontId: 'front-north',
      terrainType: 'forest',
    },
  ]);

  assert.deepEqual(outcome, {
    winnerFactionId: 'faction-a',
    pressureDelta: 18,
    casualties: { attacker: 12, defender: 20 },
  });
});

test('BattleResolverPort base adapter method fails fast until implemented', async () => {
  const resolver = new BattleResolverPort();

  await assert.rejects(
    () =>
      resolver.resolveBattle({
        attackerFactionId: 'faction-a',
        defenderFactionId: 'faction-b',
        frontId: 'front-north',
      }),
    /must be implemented by an adapter/,
  );
});

test('BattleResolverPort rejects invalid battle contexts and invalid outcomes', async () => {
  const invalidOutcomeResolver = new FixedBattleResolverPort({ pressureDelta: 1 });

  await assert.rejects(() => invalidOutcomeResolver.requireResolvedBattle(null), /context must be an object/);
  await assert.rejects(
    () => invalidOutcomeResolver.requireResolvedBattle({ attackerFactionId: '', defenderFactionId: 'faction-b', frontId: 'front' }),
    /attackerFactionId is required/,
  );
  await assert.rejects(
    () => invalidOutcomeResolver.requireResolvedBattle({ attackerFactionId: 'faction-a', defenderFactionId: 'faction-b', frontId: 'front' }),
    /winnerFactionId is required/,
  );

  const invalidPressureResolver = new FixedBattleResolverPort({ winnerFactionId: 'faction-a', pressureDelta: 1.5 });

  await assert.rejects(
    () => invalidPressureResolver.requireResolvedBattle({ attackerFactionId: 'faction-a', defenderFactionId: 'faction-b', frontId: 'front' }),
    /pressureDelta must be an integer/,
  );
});
