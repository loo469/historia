import { MythLedgerPort } from '../../application/ports/MythLedgerPort.js';
import { Myth } from '../../domain/climate/Myth.js';

function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizeMyth(myth) {
  if (myth instanceof Myth) {
    return new Myth(myth.toJSON());
  }

  if (myth === null || typeof myth !== 'object' || Array.isArray(myth)) {
    throw new TypeError('InMemoryMythLedger myth must be a Myth or plain object.');
  }

  return new Myth(myth);
}

export class InMemoryMythLedger extends MythLedgerPort {
  constructor(seed = []) {
    super();

    if (!Array.isArray(seed)) {
      throw new TypeError('InMemoryMythLedger seed must be an array.');
    }

    this.mythsById = new Map();
    this.mythIdsByOriginEventId = new Map();

    for (const myth of seed) {
      this.record(myth);
    }
  }

  record(myth) {
    const normalizedMyth = normalizeMyth(myth);
    this.mythsById.set(normalizedMyth.id, normalizedMyth);

    for (const originEventId of normalizedMyth.originEventIds) {
      const mythIds = this.mythIdsByOriginEventId.get(originEventId) ?? [];
      this.mythIdsByOriginEventId.set(originEventId, [...new Set([...mythIds, normalizedMyth.id])]);
    }

    return new Myth(normalizedMyth.toJSON());
  }

  findByOriginEventId(originEventId) {
    const normalizedOriginEventId = requireText(originEventId, 'InMemoryMythLedger.findByOriginEventId originEventId');
    const mythIds = this.mythIdsByOriginEventId.get(normalizedOriginEventId) ?? [];
    return mythIds.map((mythId) => new Myth(this.mythsById.get(mythId).toJSON()));
  }

  findByMythId(mythId) {
    const normalizedMythId = requireText(mythId, 'InMemoryMythLedger.findByMythId mythId');
    const myth = this.mythsById.get(normalizedMythId);
    return myth ? new Myth(myth.toJSON()) : null;
  }

  snapshot() {
    return [...this.mythsById.values()]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((myth) => myth.toJSON());
  }
}
