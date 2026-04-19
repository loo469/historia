import { Cellule } from '../../domain/intrigue/Cellule.js';
import { OperationClandestine } from '../../domain/intrigue/OperationClandestine.js';

const DEFAULT_STYLE_BY_PRESENCE = Object.freeze({
  none: { marker: '○', color: '#6B7280', opacity: 0.2 },
  low: { marker: '◔', color: '#2563EB', opacity: 0.35 },
  medium: { marker: '◑', color: '#7C3AED', opacity: 0.5 },
  high: { marker: '●', color: '#DC2626', opacity: 0.65 },
});

const DEFAULT_STYLE_BY_RISK = Object.freeze({
  none: { stroke: '#6B7280', fill: '#6B7280', emphasis: 'low' },
  low: { stroke: '#2563EB', fill: '#93C5FD', emphasis: 'normal' },
  medium: { stroke: '#D97706', fill: '#FCD34D', emphasis: 'elevated' },
  high: { stroke: '#DC2626', fill: '#FCA5A5', emphasis: 'high' },
});

function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function normalizeCellule(cellule) {
  if (cellule instanceof Cellule) {
    return cellule;
  }

  if (cellule === null || typeof cellule !== 'object' || Array.isArray(cellule)) {
    throw new TypeError('IntrigueMapOverlay cellules must be Cellule instances or plain objects.');
  }

  return new Cellule(cellule);
}

function normalizeOperation(operation) {
  if (operation instanceof OperationClandestine) {
    return operation;
  }

  if (operation === null || typeof operation !== 'object' || Array.isArray(operation)) {
    throw new TypeError('IntrigueMapOverlay operations must be OperationClandestine instances or plain objects.');
  }

  return new OperationClandestine(operation);
}

function clampPercent(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function resolvePresenceLevel(cellCount) {
  if (cellCount <= 0) {
    return 'none';
  }

  if (cellCount === 1) {
    return 'low';
  }

  if (cellCount === 2) {
    return 'medium';
  }

  return 'high';
}

function resolveRiskLevel(score) {
  if (score <= 0) {
    return 'none';
  }

  if (score < 35) {
    return 'low';
  }

  if (score < 70) {
    return 'medium';
  }

  return 'high';
}

function buildSabotageThreatScore(operation) {
  return clampPercent((operation.progress + operation.heat + (100 - operation.detectionRisk)) / 3);
}

function normalizeStyle(styleMap, key, defaults) {
  const style = styleMap[key] ?? styleMap.default ?? defaults[key] ?? defaults.none;
  const fallback = defaults[key] ?? defaults.none;

  return Object.fromEntries(
    Object.entries({ ...fallback, ...style }).map(([styleKey, styleValue]) => [
      styleKey,
      typeof fallback[styleKey] === 'number'
        ? Number.isFinite(styleValue) ? styleValue : fallback[styleKey]
        : String(styleValue ?? fallback[styleKey]).trim() || fallback[styleKey],
    ]),
  );
}

export function buildIntrigueMapOverlay(cellules, operations = [], options = {}) {
  if (!Array.isArray(cellules)) {
    throw new TypeError('IntrigueMapOverlay cellules must be an array.');
  }

  if (!Array.isArray(operations)) {
    throw new TypeError('IntrigueMapOverlay operations must be an array.');
  }

  const normalizedOptions = requireObject(options, 'IntrigueMapOverlay options');
  const styleByPresence = {
    ...DEFAULT_STYLE_BY_PRESENCE,
    ...requireObject(normalizedOptions.styleByPresence ?? {}, 'IntrigueMapOverlay styleByPresence'),
  };
  const styleByRisk = {
    ...DEFAULT_STYLE_BY_RISK,
    ...requireObject(normalizedOptions.styleByRisk ?? {}, 'IntrigueMapOverlay styleByRisk'),
  };
  const locationNames = requireObject(normalizedOptions.locationNames ?? {}, 'IntrigueMapOverlay locationNames');

  const normalizedCellules = cellules
    .map(normalizeCellule)
    .filter((cellule) => cellule.status !== 'dismantled');
  const normalizedOperations = operations
    .map(normalizeOperation)
    .filter((operation) => operation.type === 'sabotage' && !operation.isResolved);

  const locationIds = new Set([
    ...normalizedCellules.map((cellule) => cellule.locationId),
    ...normalizedOperations.map((operation) => operation.theaterId),
  ]);

  return [...locationIds]
    .sort((left, right) => left.localeCompare(right))
    .map((locationId) => {
      const locationCellules = normalizedCellules
        .filter((cellule) => cellule.locationId === locationId)
        .sort((left, right) => left.id.localeCompare(right.id));
      const locationOperations = normalizedOperations
        .filter((operation) => operation.theaterId === locationId)
        .sort((left, right) => left.id.localeCompare(right.id));
      const sabotageRiskScore = locationOperations.length === 0
        ? 0
        : Math.max(...locationOperations.map(buildSabotageThreatScore));
      const presenceLevel = resolvePresenceLevel(locationCellules.length);
      const riskLevel = resolveRiskLevel(sabotageRiskScore);
      const exposedCellCount = locationCellules.filter((cellule) => cellule.isExposed).length;
      const sleeperCellCount = locationCellules.filter((cellule) => cellule.sleeper).length;
      const locationName = String(locationNames[locationId] ?? locationId).trim() || locationId;

      return {
        overlayId: `intrigue:${locationId}`,
        locationId,
        locationName,
        label: `${locationName}, présence ${presenceLevel}, risque sabotage ${riskLevel}`,
        presenceLevel,
        sabotageRiskLevel: riskLevel,
        sabotageRiskScore,
        celluleIds: locationCellules.map((cellule) => cellule.id),
        operationIds: locationOperations.map((operation) => operation.id),
        metrics: {
          celluleCount: locationCellules.length,
          exposedCellCount,
          sleeperCellCount,
          sabotageOperationCount: locationOperations.length,
        },
        style: {
          presence: normalizeStyle(styleByPresence, presenceLevel, DEFAULT_STYLE_BY_PRESENCE),
          risk: normalizeStyle(styleByRisk, riskLevel, DEFAULT_STYLE_BY_RISK),
        },
      };
    });
}
