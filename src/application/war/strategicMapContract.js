export function requirePlainObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

export function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

export function normalizeCollection(value, fallback, label) {
  if (value === undefined) {
    return [...fallback];
  }

  if (!Array.isArray(value)) {
    throw new TypeError(`${label} must be an array.`);
  }

  return value;
}

export function normalizeTextArray(values, label) {
  if (!Array.isArray(values)) {
    throw new TypeError(`${label} must be an array.`);
  }

  return [...new Set(values.map((value) => requireText(value, label)))].sort();
}

export function clampInteger(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function normalizeInteger(value, label, { min, max, fallback }) {
  const normalizedValue = value === undefined || value === null ? fallback : value;

  if (!Number.isInteger(normalizedValue) || normalizedValue < min || normalizedValue > max) {
    throw new RangeError(`${label} must be an integer between ${min} and ${max}.`);
  }

  return normalizedValue;
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

export function extractGeneratedMapProvinces(generatedMap, label = 'generatedMap') {
  const map = requirePlainObject(generatedMap, label);
  const provinces = firstDefined(
    Array.isArray(map.provinces) ? map.provinces : undefined,
    Array.isArray(map.regions) ? map.regions : undefined,
    map.map && Array.isArray(map.map.provinces) ? map.map.provinces : undefined,
    map.map && Array.isArray(map.map.regions) ? map.map.regions : undefined,
  );

  if (!Array.isArray(provinces)) {
    throw new TypeError(`${label}.provinces must be an array.`);
  }

  return provinces;
}

export function normalizeGeneratedMapProvince(rawProvince, label, { requireOwner = true, requireNeighbors = false } = {}) {
  const province = requirePlainObject(rawProvince, label);
  const id = requireText(province.id ?? province.provinceId ?? province.regionId, `${label} id`);
  const ownerFactionId = firstDefined(province.ownerFactionId, province.factionId);
  const controllingFactionId = firstDefined(province.controllingFactionId, ownerFactionId);
  const neighborIds = firstDefined(province.neighborIds, []);

  if (requireOwner && (ownerFactionId === undefined || ownerFactionId === null)) {
    throw new RangeError(`${label} ownerFactionId is required.`);
  }

  if (requireNeighbors && !Array.isArray(neighborIds)) {
    throw new TypeError(`${label} neighborIds must be an array.`);
  }

  return {
    ...province,
    id,
    provinceId: id,
    regionId: id,
    name: String(province.name ?? province.label ?? id).trim() || id,
    ownerFactionId: ownerFactionId === undefined || ownerFactionId === null
      ? null
      : requireText(ownerFactionId, `${label} ownerFactionId`),
    controllingFactionId: controllingFactionId === undefined || controllingFactionId === null
      ? null
      : requireText(controllingFactionId, `${label} controllingFactionId`),
    supplyLevel: String(province.supplyLevel ?? 'stable').trim().toLowerCase() || 'stable',
    loyalty: normalizeInteger(province.loyalty, `${label} loyalty`, { min: 0, max: 100, fallback: 50 }),
    strategicValue: normalizeInteger(province.strategicValue ?? province.value, `${label} strategicValue`, {
      min: 1,
      max: 10,
      fallback: 1,
    }),
    neighborIds: Array.isArray(neighborIds)
      ? normalizeTextArray(neighborIds, `${label} neighborIds[]`)
      : [],
    contested: Boolean(province.contested),
  };
}

function compactObject(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
}

function centerFromLayout(layout) {
  if (!layout || typeof layout !== 'object' || Array.isArray(layout)) {
    return null;
  }

  const { x, y, w, h } = layout;

  if (![x, y, w, h].every(Number.isFinite)) {
    return null;
  }

  return {
    x: Math.round((x + w / 2) * 10) / 10,
    y: Math.round((y + h / 2) * 10) / 10,
  };
}

export function buildProvincePositionById(blueprints) {
  return Object.fromEntries(
    blueprints
      .map((blueprint) => [blueprint.id, blueprint.center ?? blueprint.position ?? centerFromLayout(blueprint.layout)])
      .filter(([, position]) => position !== null && position !== undefined),
  );
}

export function buildGeneratedMapRegions(provinces, blueprints, provinceGeometryById = {}) {
  const blueprintById = new Map(blueprints.map((blueprint) => [blueprint.id, blueprint]));
  const fallbackProvincePositionById = buildProvincePositionById(blueprints);

  return provinces.map((province) => {
    const snapshot = typeof province.toJSON === 'function' ? province.toJSON() : province;
    const blueprint = blueprintById.get(snapshot.id) ?? {};
    const geometry = provinceGeometryById[snapshot.id] ?? {};
    const position = blueprint.center ?? blueprint.position ?? geometry.center ?? fallbackProvincePositionById[snapshot.id] ?? null;

    return compactObject({
      ...snapshot,
      provinceId: snapshot.id,
      regionId: snapshot.id,
      layout: geometry.layout ? { ...geometry.layout } : blueprint.layout ? { ...blueprint.layout } : undefined,
      polygon: geometry.polygon ?? blueprint.polygon,
      shape: geometry.shape,
      labelLayout: geometry.labelLayout ? { ...geometry.labelLayout } : blueprint.labelLayout ? { ...blueprint.labelLayout } : undefined,
      position,
      center: position,
      biome: blueprint.biome,
      climateBiome: blueprint.climateBiome ?? blueprint.biome,
      terrain: blueprint.terrain,
      terrainType: blueprint.terrainType ?? blueprint.terrain,
      latitude: blueprint.latitude,
      altitudeMeters: blueprint.altitudeMeters,
      coastal: blueprint.coastal,
      hazards: Array.isArray(blueprint.hazards) ? [...blueprint.hazards] : undefined,
      tags: Array.isArray(blueprint.tags) ? [...blueprint.tags] : undefined,
      resourceIds: Array.isArray(blueprint.resourceIds) ? [...blueprint.resourceIds] : undefined,
      resourceDeposits: blueprint.resourceDeposits ? { ...blueprint.resourceDeposits } : undefined,
      cityPosition: blueprint.cityPosition ?? position,
    });
  });
}
