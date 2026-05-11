import { buildGeneratedMapCultureData } from '../culture/buildGeneratedMapCultureData.js';
import { Province } from '../../domain/war/Province.js';
import {
  DEFAULT_STRATEGIC_MAP_FACTIONS,
  DEFAULT_STRATEGIC_MAP_HEIGHT,
  DEFAULT_STRATEGIC_MAP_LINKS,
  DEFAULT_STRATEGIC_MAP_PROVINCES,
  DEFAULT_STRATEGIC_MAP_SEED,
  DEFAULT_STRATEGIC_MAP_WIDTH,
} from './defaultStrategicMap.js';
import {
  buildGeneratedMapRegions,
  clampInteger,
  normalizeCollection,
  requirePlainObject,
  requireText,
} from './strategicMapContract.js';

function requireOptions(options, label = 'GenerateStrategicMap options') {
  return requirePlainObject(options, label);
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

function assertUniqueIds(ids, label) {
  const seen = new Set();

  for (const id of ids) {
    if (seen.has(id)) {
      throw new RangeError(`${label} contains duplicate id ${id}.`);
    }

    seen.add(id);
  }
}

function normalizeFactions(factions) {
  const normalizedFactions = factions.map((faction) => {
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

  assertUniqueIds(normalizedFactions.map((faction) => faction.id), 'GenerateStrategicMap factions');
  return normalizedFactions;
}

function normalizeBlueprints(blueprints) {
  const normalizedBlueprints = blueprints.map((blueprint) => {
    if (blueprint === null || typeof blueprint !== 'object' || Array.isArray(blueprint)) {
      throw new TypeError('GenerateStrategicMap provinceBlueprints must contain objects.');
    }

    return {
      ...blueprint,
      id: requireText(blueprint.id, 'GenerateStrategicMap province id'),
      name: requireText(blueprint.name, 'GenerateStrategicMap province name'),
    };
  });

  assertUniqueIds(normalizedBlueprints.map((blueprint) => blueprint.id), 'GenerateStrategicMap provinceBlueprints');
  return normalizedBlueprints;
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

    if (leftId === rightId) {
      throw new RangeError('GenerateStrategicMap links cannot connect a province to itself.');
    }

    neighborIdsByProvinceId.get(leftId).add(rightId);
    neighborIdsByProvinceId.get(rightId).add(leftId);
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

function requireNumber(value, label) {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${label} must be a finite number.`);
  }

  return value;
}

function normalizeLayout(layout, blueprint) {
  if (layout === undefined) {
    const col = Number.isInteger(blueprint.grid?.col) ? blueprint.grid.col : 0;
    const row = Number.isInteger(blueprint.grid?.row) ? blueprint.grid.row : 0;

    return {
      x: 10 + col * 28,
      y: 12 + row * 24,
      w: 22,
      h: 18,
    };
  }

  const normalizedLayout = requireOptions(layout);

  return {
    x: requireNumber(normalizedLayout.x, `GenerateStrategicMap ${blueprint.id} layout.x`),
    y: requireNumber(normalizedLayout.y, `GenerateStrategicMap ${blueprint.id} layout.y`),
    w: requireNumber(normalizedLayout.w, `GenerateStrategicMap ${blueprint.id} layout.w`),
    h: requireNumber(normalizedLayout.h, `GenerateStrategicMap ${blueprint.id} layout.h`),
  };
}

function buildRectanglePolygon(layout) {
  return `${layout.x},${layout.y} ${layout.x + layout.w},${layout.y} ${layout.x + layout.w},${layout.y + layout.h} ${layout.x},${layout.y + layout.h}`;
}

function tokenizePolygonPoints(polygon, label) {
  const points = requireText(polygon, label).split(/\s+/);

  if (points.some((point) => !/^[-]?\d+(?:\.\d+)?,[-]?\d+(?:\.\d+)?$/.test(point))) {
    throw new RangeError(`${label} must contain x,y point pairs.`);
  }

  return points;
}

function normalizePolygon(polygon, layout, blueprint) {
  const polygonSource = polygon === undefined ? buildRectanglePolygon(layout) : polygon;

  return tokenizePolygonPoints(
    polygonSource,
    `GenerateStrategicMap ${blueprint.id} polygon`,
  ).join(' ');
}

function polygonToCssClipPath(polygon) {
  return `polygon(${tokenizePolygonPoints(polygon, 'GenerateStrategicMap polygon').map((point) => point.split(',').join('% ')).join('%, ') }%)`;
}

function normalizeLabelLayout(labelLayout, layout, blueprint) {
  if (labelLayout === undefined) {
    return {
      x: layout.x + (layout.w / 2),
      y: layout.y + (layout.h / 2),
      align: 'middle',
      tone: 'standard',
    };
  }

  const normalizedLabelLayout = requireOptions(labelLayout);

  return {
    x: requireNumber(normalizedLabelLayout.x, `GenerateStrategicMap ${blueprint.id} labelLayout.x`),
    y: requireNumber(normalizedLabelLayout.y, `GenerateStrategicMap ${blueprint.id} labelLayout.y`),
    align: String(normalizedLabelLayout.align ?? 'middle').trim() || 'middle',
    tone: String(normalizedLabelLayout.tone ?? 'standard').trim() || 'standard',
  };
}

function buildProvinceGeometry(blueprint) {
  const layout = normalizeLayout(blueprint.layout, blueprint);
  const polygon = normalizePolygon(blueprint.polygon, layout, blueprint);

  return {
    layout,
    center: {
      x: layout.x + (layout.w / 2),
      y: layout.y + (layout.h / 2),
    },
    polygon,
    shape: polygonToCssClipPath(polygon),
    labelLayout: normalizeLabelLayout(blueprint.labelLayout, layout, blueprint),
  };
}

export class GenerateStrategicMap {
  execute(options = {}) {
    const normalizedOptions = requireOptions(options);
    const seed = String(normalizedOptions.seed ?? DEFAULT_STRATEGIC_MAP_SEED).trim() || DEFAULT_STRATEGIC_MAP_SEED;
    const random = createRandom(seed);
    const factions = normalizeFactions(normalizeCollection(normalizedOptions.factions, DEFAULT_STRATEGIC_MAP_FACTIONS, 'GenerateStrategicMap factions'));
    const blueprints = normalizeBlueprints(
      normalizeCollection(normalizedOptions.provinceBlueprints, DEFAULT_STRATEGIC_MAP_PROVINCES, 'GenerateStrategicMap provinceBlueprints'),
    );
    const links = normalizeCollection(normalizedOptions.links, DEFAULT_STRATEGIC_MAP_LINKS, 'GenerateStrategicMap links');
    const neighborIdsByProvinceId = buildNeighborIds(blueprints, links);
    const provinceGeometryById = Object.fromEntries(blueprints.map((blueprint) => [blueprint.id, buildProvinceGeometry(blueprint)]));
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

    const culture = buildGeneratedMapCultureData(normalizedOptions.culturePayload, normalizedOptions);
    const provincePositionById = Object.fromEntries(Object.entries(provinceGeometryById).map(([provinceId, geometry]) => [provinceId, { ...geometry.center }]));
    const regions = buildGeneratedMapRegions(provinces, blueprints, provinceGeometryById);

    return {
      seed,
      width: normalizedOptions.width ?? DEFAULT_STRATEGIC_MAP_WIDTH,
      height: normalizedOptions.height ?? DEFAULT_STRATEGIC_MAP_HEIGHT,
      provinces,
      regions,
      provinceGeometryById,
      provinceLayouts: Object.fromEntries(Object.entries(provinceGeometryById).map(([provinceId, geometry]) => [provinceId, { ...geometry.layout }])),
      provincePolygons: Object.fromEntries(Object.entries(provinceGeometryById).map(([provinceId, geometry]) => [provinceId, geometry.polygon])),
      provinceLabelLayouts: Object.fromEntries(Object.entries(provinceGeometryById).map(([provinceId, geometry]) => [provinceId, { ...geometry.labelLayout }])),
      provincePositionById,
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
