import { Cellule } from '../../domain/intrigue/Cellule.js';
import { OperationClandestine } from '../../domain/intrigue/OperationClandestine.js';
import { buildAlertLevelBadge } from './AlertLevelBadge.js';
import { buildIntrigueMapOverlay } from './buildIntrigueMapOverlay.js';

function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function requireArray(value, label) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${label} must be an array.`);
  }

  return value;
}

function normalizeCellule(cellule) {
  if (cellule instanceof Cellule) {
    return cellule;
  }

  if (cellule === null || typeof cellule !== 'object' || Array.isArray(cellule)) {
    throw new TypeError('IntrigueWebDemo cellules must be Cellule instances or plain objects.');
  }

  return new Cellule(cellule);
}

function normalizeOperation(operation) {
  if (operation instanceof OperationClandestine) {
    return operation;
  }

  if (operation === null || typeof operation !== 'object' || Array.isArray(operation)) {
    throw new TypeError('IntrigueWebDemo operations must be OperationClandestine instances or plain objects.');
  }

  return new OperationClandestine(operation);
}

function compareHotspots(left, right) {
  if (right.sabotageRiskScore !== left.sabotageRiskScore) {
    return right.sabotageRiskScore - left.sabotageRiskScore;
  }

  if (right.metrics.exposedCellCount !== left.metrics.exposedCellCount) {
    return right.metrics.exposedCellCount - left.metrics.exposedCellCount;
  }

  return left.locationId.localeCompare(right.locationId);
}

function buildHotspotEntry(entry) {
  return {
    locationId: entry.locationId,
    locationName: entry.locationName,
    label: entry.label,
    severity: entry.sabotageRiskLevel === 'high' || entry.metrics.exposedCellCount > 0
      ? 'critical'
      : entry.sabotageRiskLevel === 'medium' || entry.presenceLevel === 'high'
        ? 'warning'
        : 'watch',
    sabotageRiskScore: entry.sabotageRiskScore,
    presenceLevel: entry.presenceLevel,
    sabotageRiskLevel: entry.sabotageRiskLevel,
    exposedCellCount: entry.metrics.exposedCellCount,
    sleeperCellCount: entry.metrics.sleeperCellCount,
    celluleCount: entry.metrics.celluleCount,
    operationCount: entry.metrics.sabotageOperationCount,
    visualCue: `${entry.style.presence.marker} ${entry.style.risk.emphasis}`,
  };
}

function buildCellulesPanel(cellules, locationNames) {
  return cellules
    .slice()
    .sort((left, right) => {
      if (right.exposure !== left.exposure) {
        return right.exposure - left.exposure;
      }

      return left.id.localeCompare(right.id);
    })
    .map((cellule) => {
      const compromised = cellule.status === 'compromised' || cellule.exposure >= 70;
      const statusClass = compromised
        ? 'compromised'
        : cellule.sleeper || cellule.status === 'dormant'
          ? 'sleeper'
          : cellule.isExposed
            ? 'exposed'
            : 'active';
      const statusLabel = compromised
        ? 'Compromise'
        : cellule.sleeper || cellule.status === 'dormant'
          ? 'Dormante'
          : cellule.isExposed
            ? 'Exposee'
            : 'Active';

      return {
        celluleId: cellule.id,
        codename: cellule.codename,
        locationId: cellule.locationId,
        locationName: locationNames[cellule.locationId] ?? cellule.locationId,
        status: cellule.status,
        sleeper: cellule.sleeper,
        exposure: cellule.exposure,
        readiness: cellule.operationalReadiness,
        tone: compromised ? 'danger' : cellule.sleeper ? 'muted' : cellule.isExposed ? 'warning' : 'normal',
        statusClass,
        statusLabel,
        statusMarker: compromised ? '✕' : statusClass === 'sleeper' ? '◌' : statusClass === 'exposed' ? '◐' : '●',
        badges: [
          statusLabel.toLowerCase(),
          `loyalty:${cellule.loyalty}`,
          `secrecy:${cellule.secrecy}`,
        ].filter(Boolean),
      };
    });
}

function buildOperationsPanel(operations, locationNames) {
  return operations
    .filter((operation) => !operation.isResolved)
    .slice()
    .sort((left, right) => {
      if (right.heat !== left.heat) {
        return right.heat - left.heat;
      }

      if (right.progress !== left.progress) {
        return right.progress - left.progress;
      }

      return left.id.localeCompare(right.id);
    })
    .map((operation) => ({
      operationId: operation.id,
      type: operation.type,
      objective: operation.objective,
      locationId: operation.theaterId,
      locationName: locationNames[operation.theaterId] ?? operation.theaterId,
      phase: operation.phase,
      progress: operation.progress,
      heat: operation.heat,
      detectionRisk: operation.detectionRisk,
      successWindow: operation.successWindow,
      tone: operation.type === 'sabotage' && operation.heat >= 50 ? 'danger' : 'warning',
    }));
}

export function buildIntrigueWebDemo(payload, options = {}) {
  const normalizedPayload = requireObject(payload, 'IntrigueWebDemo payload');
  const normalizedOptions = requireObject(options, 'IntrigueWebDemo options');
  const locationNames = requireObject(normalizedOptions.locationNames ?? {}, 'IntrigueWebDemo locationNames');
  const rawCellules = normalizedPayload.cellules === undefined ? [] : normalizedPayload.cellules;
  const rawOperations = normalizedPayload.operations === undefined ? [] : normalizedPayload.operations;
  const cellules = requireArray(rawCellules, 'IntrigueWebDemo payload.cellules').map(normalizeCellule);
  const operations = requireArray(rawOperations, 'IntrigueWebDemo payload.operations').map(normalizeOperation);
  const mapOverlay = buildIntrigueMapOverlay(cellules, operations, {
    locationNames,
    styleByPresence: normalizedOptions.styleByPresence ?? {},
    styleByRisk: normalizedOptions.styleByRisk ?? {},
  });
  const alertBadge = buildAlertLevelBadge(normalizedPayload.alertLevel ?? 0, {
    prefix: normalizedOptions.alertPrefix ?? 'Alerte',
  });
  const hotspots = mapOverlay.map(buildHotspotEntry).sort(compareHotspots);
  const exposedCellCount = cellules.filter((cellule) => cellule.isExposed).length;
  const sleeperCellCount = cellules.filter((cellule) => cellule.sleeper).length;
  const activeSabotageCount = operations.filter((operation) => operation.type === 'sabotage' && !operation.isResolved).length;
  const criticalHotspotCount = hotspots.filter((hotspot) => hotspot.severity === 'critical').length;
  const topHotspots = hotspots.slice(0, 3);
  const alertDrivers = [
    criticalHotspotCount > 0 ? `${criticalHotspotCount} foyer${criticalHotspotCount > 1 ? 's' : ''} critique${criticalHotspotCount > 1 ? 's' : ''}` : null,
    exposedCellCount > 0 ? `${exposedCellCount} cellule${exposedCellCount > 1 ? 's' : ''} exposée${exposedCellCount > 1 ? 's' : ''}` : null,
    activeSabotageCount > 0 ? `${activeSabotageCount} sabotage${activeSabotageCount > 1 ? 's' : ''} actif${activeSabotageCount > 1 ? 's' : ''}` : null,
  ].filter(Boolean);
  const watchZones = topHotspots.map((hotspot) => ({
    locationId: hotspot.locationId,
    locationName: hotspot.locationName,
    reason: hotspot.sabotageRiskLevel === 'high'
      ? 'Risque critique de sabotage'
      : hotspot.exposedCellCount > 0
        ? 'Cellules exposées à surveiller'
        : hotspot.operationCount > 0
          ? 'Opérations actives à suivre'
          : 'Présence clandestine à observer',
    severity: hotspot.severity,
  }));

  return {
    title: 'Couches intrigue',
    summary: `${criticalHotspotCount} foyers critiques, ${activeSabotageCount} sabotages actifs, alerte ${alertBadge.level.label.toLowerCase()}`,
    alertBadge,
    alertPanel: {
      title: `Niveau ${alertBadge.level.label}`,
      tone: alertBadge.tone,
      icon: alertBadge.icon,
      summary: alertDrivers[0] ?? 'Aucun foyer critique détecté',
      guidance: alertBadge.level.isCritical
        ? 'Concentrez la lecture sur les foyers rouges, les cellules exposées et les sabotages en cours.'
        : alertBadge.level.code === 'renforce'
          ? 'Surveillez les provinces où le risque monte et anticipez les chaînes de sabotage.'
          : 'Le réseau reste contenu, mais les foyers actifs doivent rester visibles.',
      drivers: alertDrivers.length > 0 ? alertDrivers : ['aucun signal fort pour le moment'],
      watchZones,
    },
    map: {
      title: 'Couche intrigue',
      entries: mapOverlay,
      legend: {
        presenceLevels: [
          { code: 'low', label: 'Présence faible', marker: '◔' },
          { code: 'medium', label: 'Présence moyenne', marker: '◑' },
          { code: 'high', label: 'Présence forte', marker: '●' },
        ],
        riskLevels: [
          { code: 'low', label: 'Risque faible', emphasis: 'normal' },
          { code: 'medium', label: 'Risque sensible', emphasis: 'elevated' },
          { code: 'high', label: 'Risque critique', emphasis: 'high' },
        ],
      },
    },
    hotspots,
    panels: {
      cellules: buildCellulesPanel(cellules, locationNames),
      operations: buildOperationsPanel(operations, locationNames),
    },
    metrics: {
      locationCount: mapOverlay.length,
      celluleCount: cellules.length,
      exposedCellCount,
      sleeperCellCount,
      activeOperationCount: operations.filter((operation) => !operation.isResolved).length,
      activeSabotageCount,
      criticalHotspotCount,
    },
  };
}
