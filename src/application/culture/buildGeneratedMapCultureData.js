import { buildCultureLayerPanel } from '../../ui/culture/buildCultureLayerPanel.js';
import { buildCultureMapOverlay } from '../../ui/culture/buildCultureMapOverlay.js';

function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
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

function normalizeCollection(value, fallback, label) {
  if (value === undefined) {
    return [...fallback];
  }

  if (!Array.isArray(value)) {
    throw new TypeError(`${label} must be an array.`);
  }

  return value;
}

function normalizeTextArray(values, label) {
  if (!Array.isArray(values)) {
    throw new TypeError(`${label} must be an array.`);
  }

  return [...new Set(values.map((value) => requireText(value, label)))].sort();
}

function normalizeCulturePayload(culturePayload = {}) {
  const payload = requireObject(culturePayload, 'GeneratedMapCultureData culturePayload');

  return {
    cultures: normalizeCollection(payload.cultures, [], 'GeneratedMapCultureData culturePayload.cultures'),
    researchStates: normalizeCollection(payload.researchStates, [], 'GeneratedMapCultureData culturePayload.researchStates'),
    historicalEvents: normalizeCollection(payload.historicalEvents, [], 'GeneratedMapCultureData culturePayload.historicalEvents'),
  };
}

function inferCultureRegionIds(culture) {
  return culture.regionIds ?? culture.provinceIds ?? (culture.homeRegionId ? [culture.homeRegionId] : []);
}

export function buildRegionIdsByCulture(cultures, explicitRegionIdsByCulture = {}) {
  if (!Array.isArray(cultures)) {
    throw new TypeError('GeneratedMapCultureData cultures must be an array.');
  }

  const regionIdsByCulture = {};
  const rawRegionIdsByCulture = requireObject(
    explicitRegionIdsByCulture ?? {},
    'GeneratedMapCultureData regionIdsByCulture',
  );

  for (const [cultureId, regionIds] of Object.entries(rawRegionIdsByCulture)) {
    regionIdsByCulture[requireText(cultureId, 'GeneratedMapCultureData regionIdsByCulture cultureId')] = normalizeTextArray(
      regionIds,
      `GeneratedMapCultureData regionIdsByCulture.${cultureId}`,
    );
  }

  for (const culture of cultures) {
    const normalizedCulture = requireObject(culture, 'GeneratedMapCultureData culture');
    const cultureId = requireText(normalizedCulture.id, 'GeneratedMapCultureData culture id');

    if (regionIdsByCulture[cultureId]) {
      continue;
    }

    regionIdsByCulture[cultureId] = normalizeTextArray(
      inferCultureRegionIds(normalizedCulture),
      `GeneratedMapCultureData ${cultureId} regionIds`,
    );
  }

  return Object.fromEntries(
    Object.entries(regionIdsByCulture)
      .filter(([, regionIds]) => regionIds.length > 0)
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

function groupByCultureId(items, label) {
  return items.reduce((groups, item) => {
    const normalizedItem = requireObject(item, `GeneratedMapCultureData ${label} item`);
    const affectedCultureIds = normalizedItem.affectedCultureIds;

    if (affectedCultureIds !== undefined) {
      for (const cultureId of normalizeTextArray(affectedCultureIds, `GeneratedMapCultureData ${label}.affectedCultureIds`)) {
        groups[cultureId] = [...(groups[cultureId] ?? []), normalizedItem];
      }

      return groups;
    }

    if (normalizedItem.cultureId !== undefined) {
      const cultureId = requireText(normalizedItem.cultureId, `GeneratedMapCultureData ${label}.cultureId`);
      groups[cultureId] = [...(groups[cultureId] ?? []), normalizedItem];
    }

    return groups;
  }, {});
}

export function buildCultureMapSeeds(cultures, regionIdsByCulture, researchStatesByCulture, historicalEventsByCulture) {
  return cultures
    .map((culture) => {
      const cultureId = requireText(culture.id, 'GeneratedMapCultureData culture id');
      const cultureResearchStates = researchStatesByCulture[cultureId] ?? [];
      const cultureHistoricalEvents = historicalEventsByCulture[cultureId] ?? [];

      return {
        cultureId,
        cultureName: String(culture.name ?? cultureId).trim() || cultureId,
        regionIds: regionIdsByCulture[cultureId] ?? [],
        discoveryIds: [...new Set([
          ...cultureResearchStates.flatMap((researchState) => researchState.discoveredConceptIds ?? []),
          ...cultureHistoricalEvents.flatMap((historicalEvent) => historicalEvent.discoveryIds ?? []),
        ].map((discoveryId) => requireText(discoveryId, `GeneratedMapCultureData ${cultureId} discoveryId`)))].sort(),
        researchStateIds: cultureResearchStates.map((researchState) => requireText(
          researchState.id,
          `GeneratedMapCultureData ${cultureId} researchState id`,
        )).sort(),
        historicalEventIds: cultureHistoricalEvents.map((historicalEvent) => requireText(
          historicalEvent.id,
          `GeneratedMapCultureData ${cultureId} historicalEvent id`,
        )).sort(),
      };
    })
    .filter((seed) => seed.regionIds.length > 0)
    .sort((left, right) => left.cultureId.localeCompare(right.cultureId));
}

export function buildGeneratedMapCultureData(culturePayload = {}, options = {}) {
  const normalizedOptions = requireObject(options, 'GeneratedMapCultureData options');
  const normalizedCulturePayload = normalizeCulturePayload(culturePayload);
  const regionIdsByCulture = buildRegionIdsByCulture(
    normalizedCulturePayload.cultures,
    normalizedOptions.regionIdsByCulture,
  );
  const overlay = buildCultureMapOverlay(normalizedCulturePayload, {
    ...(normalizedOptions.cultureOverlay ?? {}),
    regionIdsByCulture,
  });
  const researchStatesByCulture = groupByCultureId(normalizedCulturePayload.researchStates, 'researchStates');
  const historicalEventsByCulture = groupByCultureId(normalizedCulturePayload.historicalEvents, 'historicalEvents');
  const panel = buildCultureLayerPanel(overlay, {
    ...(normalizedOptions.cultureLayerPanel ?? {}),
    selectedRegionId: normalizedOptions.selectedRegionId,
    selectedCultureId: normalizedOptions.selectedCultureId,
    activeFilter: normalizedOptions.activeFilter,
    researchStatesByCulture,
    historicalEventsByCulture,
  });

  return {
    regionIdsByCulture,
    overlay,
    panel,
    seeds: buildCultureMapSeeds(
      normalizedCulturePayload.cultures,
      regionIdsByCulture,
      researchStatesByCulture,
      historicalEventsByCulture,
    ),
  };
}
