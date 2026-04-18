function requireBattleContext(context) {
  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    throw new TypeError('BattleResolverPort context must be an object.');
  }

  const attackerFactionId = String(context.attackerFactionId ?? '').trim();
  const defenderFactionId = String(context.defenderFactionId ?? '').trim();
  const frontId = String(context.frontId ?? '').trim();

  if (!attackerFactionId) {
    throw new RangeError('BattleResolverPort attackerFactionId is required.');
  }

  if (!defenderFactionId) {
    throw new RangeError('BattleResolverPort defenderFactionId is required.');
  }

  if (!frontId) {
    throw new RangeError('BattleResolverPort frontId is required.');
  }

  return {
    ...context,
    attackerFactionId,
    defenderFactionId,
    frontId,
  };
}

function requireBattleOutcome(outcome) {
  if (!outcome || typeof outcome !== 'object' || Array.isArray(outcome)) {
    throw new TypeError('BattleResolverPort outcome must be an object.');
  }

  const winnerFactionId = String(outcome.winnerFactionId ?? '').trim();
  const pressureDelta = outcome.pressureDelta;

  if (!winnerFactionId) {
    throw new RangeError('BattleResolverPort winnerFactionId is required.');
  }

  if (!Number.isInteger(pressureDelta)) {
    throw new RangeError('BattleResolverPort pressureDelta must be an integer.');
  }

  return {
    ...outcome,
    winnerFactionId,
    pressureDelta,
  };
}

export class BattleResolverPort {
  async resolveBattle(_context) {
    throw new Error('BattleResolverPort.resolveBattle must be implemented by an adapter.');
  }

  async requireResolvedBattle(context) {
    const normalizedContext = requireBattleContext(context);
    const outcome = await this.resolveBattle(normalizedContext);

    return requireBattleOutcome(outcome);
  }
}
