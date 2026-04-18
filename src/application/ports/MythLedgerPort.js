import { Myth } from '../../domain/climate/Myth.js';

function normalizeMyth(myth) {
  if (myth instanceof Myth) {
    return myth;
  }

  return new Myth(myth);
}

export class MythLedgerPort {
  record(myth) {
    throw new Error(`MythLedgerPort.record must be implemented for myth ${myth?.id ?? 'unknown'}.`);
  }

  findByOriginEventId(originEventId) {
    throw new Error(`MythLedgerPort.findByOriginEventId must be implemented for event ${originEventId ?? 'unknown'}.`);
  }

  recordMany(myths) {
    if (!Array.isArray(myths)) {
      throw new RangeError('MythLedgerPort.recordMany myths must be an array.');
    }

    return myths.map((myth) => this.record(normalizeMyth(myth)));
  }

  findManyByOriginEventIds(originEventIds) {
    if (!Array.isArray(originEventIds)) {
      throw new RangeError('MythLedgerPort.findManyByOriginEventIds originEventIds must be an array.');
    }

    return originEventIds.map((originEventId) => this.findByOriginEventId(originEventId));
  }
}
