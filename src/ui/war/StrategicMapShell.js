import { Province } from '../../domain/war/Province.js';
import { renderProvince } from './ProvinceRenderer.js';

const DEFAULT_OVERLAY_SLOTS = Object.freeze([
  'climate-overlay',
  'culture-overlay',
  'economy-overlay',
  'intrigue-overlay',
]);

function requireOptions(options) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('StrategicMapShell options must be an object.');
  }

  return options;
}

function requireProvinceList(provinces) {
  if (!Array.isArray(provinces)) {
    throw new TypeError('StrategicMapShell provinces must be an array.');
  }

  return provinces.map((province) => {
    if (!(province instanceof Province)) {
      throw new TypeError('StrategicMapShell provinces must contain Province instances.');
    }

    return province;
  });
}

function normalizeTextMap(value, label) {
  if (value === undefined) {
    return {};
  }

  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function normalizeGeometryMap(value) {
  if (value === undefined) {
    return {};
  }

  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('StrategicMapShell provinceGeometryById must be an object.');
  }

  return value;
}

function normalizeOverlaySlots(overlaySlots) {
  if (overlaySlots === undefined) {
    return [...DEFAULT_OVERLAY_SLOTS];
  }

  if (!Array.isArray(overlaySlots)) {
    throw new TypeError('StrategicMapShell overlaySlots must be an array.');
  }

  return [...new Set(overlaySlots.map((slot) => String(slot).trim()).filter(Boolean))];
}

function normalizeCleanupInput(value, label) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new TypeError(`${label} must be an array.`);
  }

  return value.filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry));
}

function getRiskLocationId(riskKey) {
  const [, locationId = null] = String(riskKey ?? '').split(':');

  return locationId && locationId.trim() ? locationId.trim() : null;
}

export function buildFirstCleanupPayoff(cleanupOrders = [], residualRisks = []) {
  const normalizedOrders = normalizeCleanupInput(cleanupOrders, 'StrategicMapShell cleanupOrders');
  const normalizedRisks = normalizeCleanupInput(residualRisks, 'StrategicMapShell residualRisks');
  const firstOrder = normalizedOrders[0] ?? null;

  if (!firstOrder) {
    return null;
  }

  const residualRiskKey = String(firstOrder.residualRiskKey ?? '').trim();
  const targetedRisk = normalizedRisks.find((risk) => String(risk.key ?? '').trim() === residualRiskKey) ?? null;
  const remainingRisks = normalizedRisks
    .filter((risk) => String(risk.key ?? '').trim() !== residualRiskKey)
    .map((risk) => ({
      key: String(risk.key ?? '').trim(),
      label: String(risk.label ?? 'risque restant').trim() || 'risque restant',
      reason: String(risk.reason ?? '').trim() || null,
    }));

  return {
    cleanupOrderId: String(firstOrder.id ?? '').trim() || null,
    cleanupOrderLabel: String(firstOrder.label ?? 'Ordre de nettoyage').trim() || 'Ordre de nettoyage',
    residualRiskKey,
    targetId: getRiskLocationId(residualRiskKey),
    riskReduced: String(firstOrder.riskReduced ?? targetedRisk?.label ?? 'risque résiduel').trim() || 'risque résiduel',
    priorityReason: String(firstOrder.reason ?? targetedRisk?.reason ?? 'premier ordre recommandé').trim()
      || 'premier ordre recommandé',
    currentRiskReason: String(targetedRisk?.reason ?? '').trim() || null,
    expectedEffect: String(firstOrder.expectedEffect ?? `réduit ${firstOrder.riskReduced ?? targetedRisk?.label ?? 'le risque ciblé'}`).trim(),
    remainingRiskState: remainingRisks.length === 0 ? 'no-visible-risk' : 'residual-risk-remains',
    remainingRiskCount: remainingRisks.length,
    remainingRisks,
  };
}

export function buildFollowUpCleanupChoices(cleanupOrders = [], residualRisks = [], firstCleanupPayoff = null) {
  const normalizedOrders = normalizeCleanupInput(cleanupOrders, 'StrategicMapShell cleanupOrders');
  const normalizedRisks = normalizeCleanupInput(residualRisks, 'StrategicMapShell residualRisks');
  const skippedOrderId = String(firstCleanupPayoff?.cleanupOrderId ?? normalizedOrders[0]?.id ?? '').trim();
  const skippedRiskKey = String(firstCleanupPayoff?.residualRiskKey ?? normalizedOrders[0]?.residualRiskKey ?? '').trim();

  return normalizedOrders
    .filter((order) => {
      const orderId = String(order.id ?? '').trim();
      const residualRiskKey = String(order.residualRiskKey ?? '').trim();

      return orderId !== skippedOrderId && residualRiskKey !== skippedRiskKey;
    })
    .map((order) => {
      const residualRiskKey = String(order.residualRiskKey ?? '').trim();
      const matchingRisk = normalizedRisks.find((risk) => String(risk.key ?? '').trim() === residualRiskKey) ?? null;
      const riskCovered = String(order.riskReduced ?? matchingRisk?.label ?? 'risque résiduel').trim() || 'risque résiduel';

      return {
        rank: 0,
        cleanupOrderId: String(order.id ?? '').trim() || null,
        cleanupOrderLabel: String(order.label ?? 'Ordre de suivi').trim() || 'Ordre de suivi',
        residualRiskKey,
        targetId: getRiskLocationId(residualRiskKey),
        riskCovered,
        expectedBenefit: String(order.expectedBenefit ?? order.expectedEffect ?? `réduit ${riskCovered}`).trim(),
        rankReason: String(order.reason ?? matchingRisk?.reason ?? 'meilleur suivi restant').trim() || 'meilleur suivi restant',
        safetyScore: Number.isFinite(order.safetyScore) ? order.safetyScore : 0,
      };
    })
    .sort((left, right) => right.safetyScore - left.safetyScore
      || left.residualRiskKey.localeCompare(right.residualRiskKey)
      || String(left.cleanupOrderId ?? '').localeCompare(String(right.cleanupOrderId ?? '')))
    .slice(0, 3)
    .map((choice, index) => ({ ...choice, rank: index + 1 }));
}

function buildLegend(renderedProvinces, options) {
  const factionMetaById = normalizeTextMap(options.factionMetaById, 'StrategicMapShell factionMetaById');
  const paletteByFaction = normalizeTextMap(options.paletteByFaction, 'StrategicMapShell paletteByFaction');
  const controllingFactionIds = [...new Set(renderedProvinces.map((province) => province.controllingFactionId))].sort();

  return {
    factions: controllingFactionIds.map((factionId) => ({
      factionId,
      label: String(factionMetaById[factionId]?.label ?? factionId).trim() || factionId,
      color: String(paletteByFaction[factionId]?.fill ?? '#94A3B8').trim() || '#94A3B8',
      border: String(paletteByFaction[factionId]?.border ?? '#334155').trim() || '#334155',
    })),
    states: [
      { code: 'stable', label: 'Contrôle stable' },
      { code: 'occupied', label: 'Occupation' },
      { code: 'contested', label: 'Front contesté' },
    ],
  };
}

function enhanceProvince(renderedProvince, options, provinceGeometryById) {
  const selectedProvinceId = String(options.selectedProvinceId ?? '').trim();
  const focusedProvinceId = String(options.focusedProvinceId ?? '').trim();
  const hoveredProvinceId = String(options.hoveredProvinceId ?? '').trim();
  const geometry = provinceGeometryById[renderedProvince.provinceId] ?? {};

  return {
    ...renderedProvince,
    geometry: {
      layout: geometry.layout ?? null,
      center: geometry.center ?? null,
      polygon: geometry.polygon ?? null,
      shape: geometry.shape ?? null,
      labelLayout: geometry.labelLayout ?? null,
    },
    selectionState: {
      selected: renderedProvince.provinceId === selectedProvinceId,
      focused: renderedProvince.provinceId === focusedProvinceId,
      hovered: renderedProvince.provinceId === hoveredProvinceId,
    },
  };
}

export function buildStrategicMapShell(provinces, options = {}) {
  const normalizedProvinces = requireProvinceList(provinces);
  const normalizedOptions = requireOptions(options);
  const title = String(normalizedOptions.title ?? 'Carte stratégique').trim() || 'Carte stratégique';
  const subtitle = String(normalizedOptions.subtitle ?? 'Vue d’ensemble des provinces et lignes de front').trim()
    || 'Vue d’ensemble des provinces et lignes de front';
  const overlaySlots = normalizeOverlaySlots(normalizedOptions.overlaySlots);
  const provinceGeometryById = normalizeGeometryMap(normalizedOptions.provinceGeometryById);
  const firstCleanupPayoff = buildFirstCleanupPayoff(normalizedOptions.cleanupOrders, normalizedOptions.residualRisks);
  const followUpCleanupChoices = buildFollowUpCleanupChoices(
    normalizedOptions.cleanupOrders,
    normalizedOptions.residualRisks,
    firstCleanupPayoff,
  );

  const renderedProvinces = normalizedProvinces
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((province) => enhanceProvince(renderProvince(province, normalizedOptions), normalizedOptions, provinceGeometryById));

  const stats = renderedProvinces.reduce(
    (summary, province) => ({
      provinceCount: summary.provinceCount + 1,
      contestedCount: summary.contestedCount + (province.contested ? 1 : 0),
      occupiedCount: summary.occupiedCount + (province.occupied ? 1 : 0),
      averageLoyalty: summary.averageLoyalty + province.loyalty,
    }),
    {
      provinceCount: 0,
      contestedCount: 0,
      occupiedCount: 0,
      averageLoyalty: 0,
    },
  );

  return {
    title,
    subtitle,
    provinces: renderedProvinces,
    stats: {
      provinceCount: stats.provinceCount,
      contestedCount: stats.contestedCount,
      occupiedCount: stats.occupiedCount,
      averageLoyalty: stats.provinceCount === 0 ? 0 : Math.round(stats.averageLoyalty / stats.provinceCount),
    },
    legend: buildLegend(renderedProvinces, normalizedOptions),
    overlays: {
      slots: overlaySlots.map((slotId) => ({
        slotId,
        label: slotId.replace(/-/g, ' '),
        enabled: true,
      })),
    },
    firstCleanupPayoff,
    followUpCleanupChoices,
    activeProvince: renderedProvinces.find(
      (province) => province.selectionState.selected || province.selectionState.focused || province.selectionState.hovered,
    ) ?? null,
  };
}
