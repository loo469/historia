import { buildCultureLayerPanel } from '../../ui/culture/buildCultureLayerPanel.js';
import { buildCultureMapOverlay } from '../../ui/culture/buildCultureMapOverlay.js';
import { buildStrategicMapShell } from '../../ui/war/StrategicMapShell.js';

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

function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizeTextArray(values, label) {
  if (!Array.isArray(values)) {
    throw new TypeError(`${label} must be an array.`);
  }

  return [...new Set(values.map((value) => requireText(value, label)))].sort();
}

function normalizeCulturePayload(culturePayload = {}) {
  const payload = requireObject(culturePayload, 'GenerateStrategicMap culturePayload');

  return {
    cultures: requireArray(payload.cultures ?? [], 'GenerateStrategicMap culturePayload.cultures'),
    researchStates: requireArray(payload.researchStates ?? [], 'GenerateStrategicMap culturePayload.researchStates'),
    historicalEvents: requireArray(payload.historicalEvents ?? [], 'GenerateStrategicMap culturePayload.historicalEvents'),
  };
}

function normalizeRegionIdsByCulture(cultures, explicitRegionIdsByCulture) {
  const normalizedRegionIdsByCulture = {};
  const rawRegionIdsByCulture = requireObject(
    explicitRegionIdsByCulture ?? {},
    'GenerateStrategicMap regionIdsByCulture',
  );

  for (const [cultureId, regionIds] of Object.entries(rawRegionIdsByCulture)) {
    normalizedRegionIdsByCulture[requireText(cultureId, 'GenerateStrategicMap regionIdsByCulture cultureId')] = normalizeTextArray(
      regionIds,
      `GenerateStrategicMap regionIdsByCulture.${cultureId}`,
    );
  }

  for (const culture of cultures) {
    const cultureId = requireText(culture.id, 'GenerateStrategicMap culture.id');

    if (normalizedRegionIdsByCulture[cultureId]) {
      continue;
    }

    const inferredRegionIds = culture.regionIds ?? culture.provinceIds ?? (
      culture.homeRegionId ? [culture.homeRegionId] : []
    );

    normalizedRegionIdsByCulture[cultureId] = normalizeTextArray(
      inferredRegionIds,
      `GenerateStrategicMap culture ${cultureId} regionIds`,
    );
  }

  return Object.fromEntries(
    Object.entries(normalizedRegionIdsByCulture)
      .filter(([, regionIds]) => regionIds.length > 0)
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

function groupByCultureId(items, label) {
  return items.reduce((groups, item) => {
    const normalizedItem = requireObject(item, `GenerateStrategicMap ${label} item`);
    const cultureId = normalizedItem.cultureId
      ?? normalizedItem.affectedCultureIds?.[0]
      ?? null;

    if (normalizedItem.affectedCultureIds) {
      for (const affectedCultureId of normalizeTextArray(normalizedItem.affectedCultureIds, `GenerateStrategicMap ${label}.affectedCultureIds`)) {
        groups[affectedCultureId] = [...(groups[affectedCultureId] ?? []), normalizedItem];
      }

      return groups;
    }

    if (cultureId) {
      const normalizedCultureId = requireText(cultureId, `GenerateStrategicMap ${label}.cultureId`);
      groups[normalizedCultureId] = [...(groups[normalizedCultureId] ?? []), normalizedItem];
    }

    return groups;
  }, {});
}

function buildCultureSeeds(cultures, regionIdsByCulture, researchStates, historicalEvents) {
  const researchStatesByCulture = groupByCultureId(researchStates, 'researchStates');
  const historicalEventsByCulture = groupByCultureId(historicalEvents, 'historicalEvents');

  return cultures
    .map((culture) => {
      const cultureId = requireText(culture.id, 'GenerateStrategicMap culture.id');
      const regionIds = regionIdsByCulture[cultureId] ?? [];
      const cultureResearchStates = researchStatesByCulture[cultureId] ?? [];
      const cultureHistoricalEvents = historicalEventsByCulture[cultureId] ?? [];

      return {
        cultureId,
        cultureName: String(culture.name ?? cultureId).trim() || cultureId,
        regionIds,
        discoveryIds: [...new Set([
          ...cultureResearchStates.flatMap((researchState) => researchState.discoveredConceptIds ?? []),
          ...cultureHistoricalEvents.flatMap((historicalEvent) => historicalEvent.discoveryIds ?? []),
        ].map((value) => requireText(value, `GenerateStrategicMap culture ${cultureId} discoveryId`)))].sort(),
        historicalEventIds: cultureHistoricalEvents.map((historicalEvent) => requireText(
          historicalEvent.id,
          `GenerateStrategicMap culture ${cultureId} historicalEvent.id`,
        )).sort(),
        researchStateIds: cultureResearchStates.map((researchState) => requireText(
          researchState.id,
          `GenerateStrategicMap culture ${cultureId} researchState.id`,
        )).sort(),
      };
    })
    .filter((seed) => seed.regionIds.length > 0)
    .sort((left, right) => left.cultureId.localeCompare(right.cultureId));
}

export function GenerateStrategicMap({ provinces, culturePayload = {}, options = {} } = {}) {
  const normalizedOptions = requireObject(options, 'GenerateStrategicMap options');
  const normalizedCulturePayload = normalizeCulturePayload(culturePayload);
  const regionIdsByCulture = normalizeRegionIdsByCulture(
    normalizedCulturePayload.cultures,
    normalizedOptions.regionIdsByCulture,
  );
  const shell = buildStrategicMapShell(requireArray(provinces, 'GenerateStrategicMap provinces'), normalizedOptions.shell ?? normalizedOptions);
  const cultureOverlay = buildCultureMapOverlay(normalizedCulturePayload, {
    ...(normalizedOptions.cultureOverlay ?? {}),
    regionIdsByCulture,
  });
  const researchStatesByCulture = groupByCultureId(normalizedCulturePayload.researchStates, 'researchStates');
  const historicalEventsByCulture = groupByCultureId(normalizedCulturePayload.historicalEvents, 'historicalEvents');
  const cultureLayerPanel = buildCultureLayerPanel(cultureOverlay, {
    ...(normalizedOptions.cultureLayerPanel ?? {}),
    selectedRegionId: normalizedOptions.selectedRegionId,
    selectedCultureId: normalizedOptions.selectedCultureId,
    activeFilter: normalizedOptions.activeFilter,
    researchStatesByCulture,
    historicalEventsByCulture,
  });
  const cultureSeeds = buildCultureSeeds(
    normalizedCulturePayload.cultures,
    regionIdsByCulture,
    normalizedCulturePayload.researchStates,
    normalizedCulturePayload.historicalEvents,
  );

  return {
    shell,
    overlays: {
      culture: cultureOverlay,
    },
    panels: {
      culture: cultureLayerPanel,
    },
    businessData: {
      regionIdsByCulture,
      cultureSeeds,
    },
  };
}
