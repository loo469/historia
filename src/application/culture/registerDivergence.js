import { DivergencePoint } from '../../domain/culture/DivergencePoint.js';
import { HistoricalEvent } from '../../domain/culture/HistoricalEvent.js';

function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizeUniqueTexts(values, label) {
  if (!Array.isArray(values)) {
    throw new TypeError(`${label} must be an array.`);
  }

  const normalizedValues = [...new Set(values.map((value) => requireText(value, label)))];
  return normalizedValues.sort();
}

function normalizeDiscoveryIds(historicalEvent, registration) {
  return normalizeUniqueTexts(
    [
      ...historicalEvent.discoveryIds,
      ...(registration.discoveryIds ?? []),
      ...registration.divergencePoint.consequenceIds,
    ],
    'registerDivergence registration.discoveryIds',
  );
}

function normalizeRegistration(registration) {
  if (!registration || typeof registration !== 'object' || Array.isArray(registration)) {
    throw new TypeError('registerDivergence registration must be an object.');
  }

  const divergencePoint =
    registration.divergencePoint instanceof DivergencePoint
      ? registration.divergencePoint
      : new DivergencePoint(registration.divergencePoint);

  return {
    divergencePoint,
    discoveryIds: registration.discoveryIds ?? [],
    triggeredAt: registration.triggeredAt,
  };
}

export function registerDivergence(historicalEventState, registration) {
  const historicalEvent =
    historicalEventState instanceof HistoricalEvent
      ? historicalEventState
      : new HistoricalEvent(historicalEventState);

  const normalizedRegistration = normalizeRegistration(registration);
  const divergencePoint = normalizedRegistration.divergencePoint;

  if (divergencePoint.discovered) {
    throw new RangeError('registerDivergence cannot register an already discovered divergence point.');
  }

  if (
    historicalEvent.divergencePointId !== null &&
    historicalEvent.divergencePointId !== divergencePoint.id
  ) {
    throw new RangeError(
      'registerDivergence cannot overwrite a historical event already linked to another divergence point.',
    );
  }

  const mismatchedCultureIds = divergencePoint.affectedCultureIds.filter(
    (cultureId) => !historicalEvent.affectedCultureIds.includes(cultureId),
  );

  if (mismatchedCultureIds.length > 0) {
    throw new RangeError(
      'registerDivergence divergencePoint affectedCultureIds must be covered by the historical event.',
    );
  }

  const registeredDivergencePoint = divergencePoint.withDiscovery(historicalEvent.id);
  const registeredHistoricalEvent = new HistoricalEvent({
    ...historicalEvent.toJSON(),
    triggeredAt: normalizedRegistration.triggeredAt ?? historicalEvent.triggeredAt,
    divergencePointId: divergencePoint.id,
    discoveryIds: normalizeDiscoveryIds(historicalEvent, normalizedRegistration),
  });

  return {
    divergencePoint: registeredDivergencePoint,
    historicalEvent: registeredHistoricalEvent,
  };
}
