import { MythLedgerPort } from '../../application/ports/MythLedgerPort.js';
import { Myth } from '../../domain/climate/Myth.js';

function normalizeMyth(myth) {
  if (myth instanceof Myth) {
    return myth;
  }

  return new Myth(myth);
}

export class InMemoryMythLedger extends MythLedgerPort {
  constructor(seed = []) {
    super();
    this.mythsById = new Map();
    this.mythIdsByOriginEventId = new Map();

    this.recordMany(seed);
  }

  record(myth) {
    const normalizedMyth = normalizeMyth(myth);
    this.mythsById.set(normalizedMyth.id, normalizedMyth);

    for (const originEventId of normalizedMyth.originEventIds) {
      const mythIds = this.mythIdsByOriginEventId.get(originEventId) ?? [];
      this.mythIdsByOriginEventId.set(originEventId, [...new Set([...mythIds, normalizedMyth.id])]);
    }

    return normalizedMyth;
  }

  findByOriginEventId(originEventId) {
    const normalizedOriginEventId = String(originEventId ?? '').trim();

    if (!normalizedOriginEventId) {
      throw new RangeError('InMemoryMythLedger.findByOriginEventId originEventId is required.');
    }

    const mythIds = this.mythIdsByOriginEventId.get(normalizedOriginEventId) ?? [];
    return mythIds.map((mythId) => this.mythsById.get(mythId));
  }

  findByMythId(mythId) {
    const normalizedMythId = String(mythId ?? '').trim();

    if (!normalizedMythId) {
      throw new RangeError('InMemoryMythLedger.findByMythId mythId is required.');
    }

    return this.mythsById.get(normalizedMythId) ?? null;
  }

  snapshot() {
    return [...this.mythsById.values()].map((myth) => myth.toJSON());
  }
}
