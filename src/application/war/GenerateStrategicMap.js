import { Province } from '../../domain/war/Province.js';
import { buildCultureLayerPanel } from '../../ui/culture/buildCultureLayerPanel.js';
import { buildCultureMapOverlay } from '../../ui/culture/buildCultureMapOverlay.js';

const DEFAULT_SEED = 'historia-alpha-strategic-map-v1';
const DEFAULT_WIDTH = 100;
const DEFAULT_HEIGHT = 100;

const DEFAULT_FACTIONS = Object.freeze([
  { id: 'aurora', label: 'Alliance d’Aurora', fill: '#2F6BFF', border: '#8FB3FF', homeColumn: 0 },
  { id: 'ember', label: 'Ligue d’Ember', fill: '#E8572A', border: '#FFB394', homeColumn: 2 },
  { id: 'neutral', label: 'Marches neutres', fill: '#64748B', border: '#CBD5E1', homeColumn: 1 },
]);

const DEFAULT_PROVINCE_BLUEPRINTS = Object.freeze([
  {
    id: 'north-watch',
    name: 'Veille du Nord',
    grid: { col: 0, row: 0 },
    layout: { x: 15, y: 18, w: 20, h: 18 },
    polygon: '8,24 24,12 39,10 47,18 46,36 34,42 18,40 8,32',
    ownerFactionId: 'aurora',
    controllingFactionId: 'aurora',
    supplyLevel: 'stable',
    loyalty: 84,
    strategicValue: 5,
  },
  {
    id: 'crown-heart',
    name: 'Coeur de Couronne',
    grid: { col: 1, row: 0 },
    layout: { x: 38, y: 18, w: 23, h: 20 },
    polygon: '24,18 40,12 58,14 64,24 58,40 40,46 26,38 22,28',
    ownerFactionId: 'aurora',
    controllingFactionId: 'aurora',
    supplyLevel: 'stable',
    loyalty: 78,
    strategicValue: 8,
  },
  {
    id: 'red-ridge',
    name: 'Crête Rouge',
    grid: { col: 2, row: 0 },
    layout: { x: 64, y: 16, w: 21, h: 22 },
    polygon: '58,16 73,10 88,18 90,34 80,44 64,42 54,32 52,22',
    ownerFactionId: 'ember',
    controllingFactionId: 'ember',
    supplyLevel: 'strained',
    loyalty: 58,
    strategicValue: 6,
  },
  {
    id: 'river-gate',
    name: 'Porte du Fleuve',
    grid: { col: 0, row: 1 },
    layout: { x: 22, y: 46, w: 24, h: 20 },
    polygon: '38,38 54,34 66,40 68,54 56,66 40,64 32,52 34,42',
    ownerFactionId: 'aurora',
    controllingFactionId: 'ember',
    supplyLevel: 'disrupted',
    loyalty: 39,
    strategicValue: 7,
    contested: true,
  },
  {
    id: 'iron-plain',
    name: 'Plaine de Fer',
    grid: { col: 1, row: 1 },
    layout: { x: 50, y: 46, w: 26, h: 22 },
    polygon: '60,44 78,42 90,52 88,68 72,78 56,72 54,56',
    ownerFactionId: 'ember',
    controllingFactionId: 'ember',
    supplyLevel: 'strained',
    loyalty: 61,
    strategicValue: 4,
  },
  {
    id: 'southern-reach',
    name: 'Basses Marches',
    grid: { col: 0, row: 2 },
    layout: { x: 33, y: 72, w: 28, h: 18 },
    polygon: '24,58 42,54 58,58 64,74 48,88 28,86 16,72',
    ownerFactionId: 'neutral',
    controllingFactionId: 'aurora',
    supplyLevel: 'collapsed',
    loyalty: 44,
    strategicValue: 3,
  },
]);

const DEFAULT_LINKS = Object.freeze([
  ['north-watch', 'crown-heart'],
  ['north-watch', 'river-gate'],
  ['crown-heart', 'red-ridge'],
  ['crown-heart', 'river-gate'],
  ['crown-heart', 'iron-plain'],
  ['red-ridge', 'iron-plain'],
  ['river-gate', 'iron-plain'],
  ['river-gate', 'southern-reach'],
  ['iron-plain', 'southern-reach'],
]);

function requireOptions(options) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('GenerateStrategicMap options must be an object.');
  }

  return options;
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
  const payload = requireOptions(culturePayload);

  return {
    cultures: normalizeCollection(payload.cultures, [], 'GenerateStrategicMap culturePayload.cultures'),
    researchStates: normalizeCollection(payload.researchStates, [], 'GenerateStrategicMap culturePayload.researchStates'),
    historicalEvents: normalizeCollection(payload.historicalEvents, [], 'GenerateStrategicMap culturePayload.historicalEvents'),
  };
}

function normalizeRegionIdsByCulture(cultures, explicitRegionIdsByCulture) {
  const regionIdsByCulture = {};
  const rawRegionIdsByCulture = requireOptions(explicitRegionIdsByCulture ?? {});

  for (const [cultureId, regionIds] of Object.entries(rawRegionIdsByCulture)) {
    regionIdsByCulture[requireText(cultureId, 'GenerateStrategicMap regionIdsByCulture cultureId')] = normalizeTextArray(
      regionIds,
      `GenerateStrategicMap regionIdsByCulture.${cultureId}`,
    );
  }

  for (const culture of cultures) {
    const cultureId = requireText(culture.id, 'GenerateStrategicMap culture id');

    if (regionIdsByCulture[cultureId]) {
      continue;
    }

    const inferredRegionIds = culture.regionIds ?? culture.provinceIds ?? (culture.homeRegionId ? [culture.homeRegionId] : []);
    regionIdsByCulture[cultureId] = normalizeTextArray(
      inferredRegionIds,
      `GenerateStrategicMap ${cultureId} regionIds`,
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
    const normalizedItem = requireOptions(item);
    const affectedCultureIds = normalizedItem.affectedCultureIds;

    if (affectedCultureIds !== undefined) {
      for (const cultureId of normalizeTextArray(affectedCultureIds, `GenerateStrategicMap ${label}.affectedCultureIds`)) {
        groups[cultureId] = [...(groups[cultureId] ?? []), normalizedItem];
      }

      return groups;
    }

    if (normalizedItem.cultureId !== undefined) {
      const cultureId = requireText(normalizedItem.cultureId, `GenerateStrategicMap ${label}.cultureId`);
      groups[cultureId] = [...(groups[cultureId] ?? []), normalizedItem];
    }

    return groups;
  }, {});
}

function buildCultureSeeds(cultures, regionIdsByCulture, researchStatesByCulture, historicalEventsByCulture) {
  return cultures
    .map((culture) => {
      const cultureId = requireText(culture.id, 'GenerateStrategicMap culture id');
      const cultureResearchStates = researchStatesByCulture[cultureId] ?? [];
      const cultureHistoricalEvents = historicalEventsByCulture[cultureId] ?? [];

      return {
        cultureId,
        cultureName: String(culture.name ?? cultureId).trim() || cultureId,
        regionIds: regionIdsByCulture[cultureId] ?? [],
        discoveryIds: [...new Set([
          ...cultureResearchStates.flatMap((researchState) => researchState.discoveredConceptIds ?? []),
          ...cultureHistoricalEvents.flatMap((historicalEvent) => historicalEvent.discoveryIds ?? []),
        ].map((discoveryId) => requireText(discoveryId, `GenerateStrategicMap ${cultureId} discoveryId`)))].sort(),
        researchStateIds: cultureResearchStates.map((researchState) => requireText(
          researchState.id,
          `GenerateStrategicMap ${cultureId} researchState id`,
        )).sort(),
        historicalEventIds: cultureHistoricalEvents.map((historicalEvent) => requireText(
          historicalEvent.id,
          `GenerateStrategicMap ${cultureId} historicalEvent id`,
        )).sort(),
      };
    })
    .filter((seed) => seed.regionIds.length > 0)
    .sort((left, right) => left.cultureId.localeCompare(right.cultureId));
}

function buildCultureMapBusinessData(culturePayload, options) {
  const normalizedCulturePayload = normalizeCulturePayload(culturePayload);
  const regionIdsByCulture = normalizeRegionIdsByCulture(
    normalizedCulturePayload.cultures,
    options.regionIdsByCulture,
  );
  const overlay = buildCultureMapOverlay(normalizedCulturePayload, {
    ...(options.cultureOverlay ?? {}),
    regionIdsByCulture,
  });
  const researchStatesByCulture = groupByCultureId(normalizedCulturePayload.researchStates, 'researchStates');
  const historicalEventsByCulture = groupByCultureId(normalizedCulturePayload.historicalEvents, 'historicalEvents');
  const panel = buildCultureLayerPanel(overlay, {
    ...(options.cultureLayerPanel ?? {}),
    selectedRegionId: options.selectedRegionId,
    selectedCultureId: options.selectedCultureId,
    activeFilter: options.activeFilter,
    researchStatesByCulture,
    historicalEventsByCulture,
  });

  return {
    regionIdsByCulture,
    overlay,
    panel,
    seeds: buildCultureSeeds(
      normalizedCulturePayload.cultures,
      regionIdsByCulture,
      researchStatesByCulture,
      historicalEventsByCulture,
    ),
  };
}

function hashSeed(seed) {
  let hash = 2166136261;
  const text = requireText(seed, 'GenerateStrategicMap seed');

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createRandom(seed) {
  let state = hashSeed(seed) || 1;

  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function jitterInteger(base, amplitude, random) {
  if (amplitude <= 0) {
    return base;
  }

  return base + Math.round((random() * (amplitude * 2)) - amplitude);
}

function clampInteger(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeFactions(factions) {
  return factions.map((faction) => {
    if (faction === null || typeof faction !== 'object' || Array.isArray(faction)) {
      throw new TypeError('GenerateStrategicMap factions must contain objects.');
    }

    const id = requireText(faction.id, 'GenerateStrategicMap faction id');

    return {
      id,
      label: String(faction.label ?? id).trim() || id,
      fill: String(faction.fill ?? '#94A3B8').trim() || '#94A3B8',
      border: String(faction.border ?? '#334155').trim() || '#334155',
      homeColumn: Number.isInteger(faction.homeColumn) ? faction.homeColumn : null,
    };
  });
}

function normalizeBlueprints(blueprints) {
  return blueprints.map((blueprint) => {
    if (blueprint === null || typeof blueprint !== 'object' || Array.isArray(blueprint)) {
      throw new TypeError('GenerateStrategicMap provinceBlueprints must contain objects.');
    }

    return {
      ...blueprint,
      id: requireText(blueprint.id, 'GenerateStrategicMap province id'),
      name: requireText(blueprint.name, 'GenerateStrategicMap province name'),
    };
  });
}

function buildNeighborIds(blueprints, links) {
  const blueprintIds = new Set(blueprints.map((blueprint) => blueprint.id));
  const neighborIdsByProvinceId = new Map(blueprints.map((blueprint) => [blueprint.id, new Set()]));

  for (const link of links) {
    if (!Array.isArray(link) || link.length !== 2) {
      throw new TypeError('GenerateStrategicMap links must be [leftProvinceId, rightProvinceId] pairs.');
    }

    const [leftId, rightId] = link.map((provinceId) => requireText(provinceId, 'GenerateStrategicMap link provinceId'));

    if (!blueprintIds.has(leftId) || !blueprintIds.has(rightId)) {
      throw new RangeError('GenerateStrategicMap links must reference generated provinces.');
    }

    if (leftId !== rightId) {
      neighborIdsByProvinceId.get(leftId).add(rightId);
      neighborIdsByProvinceId.get(rightId).add(leftId);
    }
  }

  return neighborIdsByProvinceId;
}

function chooseFactionForBlueprint(blueprint, factions) {
  if (blueprint.ownerFactionId) {
    return requireText(blueprint.ownerFactionId, `GenerateStrategicMap ${blueprint.id} ownerFactionId`);
  }

  const column = blueprint.grid?.col;
  const faction = factions.find((candidate) => candidate.homeColumn === column) ?? factions[0];
  return faction.id;
}

export class GenerateStrategicMap {
  execute(options = {}) {
    const normalizedOptions = requireOptions(options);
    const seed = String(normalizedOptions.seed ?? DEFAULT_SEED).trim() || DEFAULT_SEED;
    const random = createRandom(seed);
    const factions = normalizeFactions(normalizeCollection(normalizedOptions.factions, DEFAULT_FACTIONS, 'GenerateStrategicMap factions'));
    const blueprints = normalizeBlueprints(
      normalizeCollection(normalizedOptions.provinceBlueprints, DEFAULT_PROVINCE_BLUEPRINTS, 'GenerateStrategicMap provinceBlueprints'),
    );
    const links = normalizeCollection(normalizedOptions.links, DEFAULT_LINKS, 'GenerateStrategicMap links');
    const neighborIdsByProvinceId = buildNeighborIds(blueprints, links);
    const loyaltyJitter = Number.isInteger(normalizedOptions.loyaltyJitter) ? normalizedOptions.loyaltyJitter : 0;
    const strategicValueJitter = Number.isInteger(normalizedOptions.strategicValueJitter) ? normalizedOptions.strategicValueJitter : 0;

    const provinces = blueprints.map((blueprint) => {
      const ownerFactionId = chooseFactionForBlueprint(blueprint, factions);
      const controllingFactionId = String(blueprint.controllingFactionId ?? ownerFactionId).trim() || ownerFactionId;

      return new Province({
        id: blueprint.id,
        name: blueprint.name,
        ownerFactionId,
        controllingFactionId,
        supplyLevel: blueprint.supplyLevel ?? 'stable',
        loyalty: clampInteger(jitterInteger(blueprint.loyalty ?? 60, loyaltyJitter, random), 0, 100),
        strategicValue: clampInteger(jitterInteger(blueprint.strategicValue ?? 3, strategicValueJitter, random), 1, 10),
        neighborIds: [...neighborIdsByProvinceId.get(blueprint.id)],
        contested: Boolean(blueprint.contested),
        capturedAt: blueprint.capturedAt ?? null,
      });
    }).sort((left, right) => left.id.localeCompare(right.id));

    const culture = buildCultureMapBusinessData(normalizedOptions.culturePayload, normalizedOptions);

    return {
      seed,
      width: normalizedOptions.width ?? DEFAULT_WIDTH,
      height: normalizedOptions.height ?? DEFAULT_HEIGHT,
      provinces,
      provinceLayouts: Object.fromEntries(blueprints.map((blueprint) => [blueprint.id, { ...blueprint.layout }])),
      provincePolygons: Object.fromEntries(blueprints.map((blueprint) => [blueprint.id, blueprint.polygon])),
      paletteByFaction: Object.fromEntries(factions.map((faction) => [faction.id, {
        fill: faction.fill,
        border: faction.border,
      }])),
      factionMetaById: Object.fromEntries(factions.map((faction) => [faction.id, {
        label: faction.label,
      }])),
      overlays: {
        culture: culture.overlay,
      },
      panels: {
        culture: culture.panel,
      },
      businessData: {
        regionIdsByCulture: culture.regionIdsByCulture,
        cultureSeeds: culture.seeds,
      },
    };
  }
}
