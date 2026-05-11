import { seedEconomyFromStrategicMap } from './SeedEconomyFromStrategicMap.js';

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

function normalizePosition(value, label) {
  const position = requireObject(value, label);

  if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) {
    throw new RangeError(`${label} must expose finite x and y coordinates.`);
  }

  return { ...position, x: position.x, y: position.y };
}

function centerPositionFromLayout(layout, label) {
  const normalizedLayout = requireObject(layout, label);

  if (![normalizedLayout.x, normalizedLayout.y, normalizedLayout.w, normalizedLayout.h].every(Number.isFinite)) {
    throw new RangeError(`${label} must expose finite x, y, w and h coordinates.`);
  }

  return {
    x: normalizedLayout.x + (normalizedLayout.w / 2),
    y: normalizedLayout.y + (normalizedLayout.h / 2),
  };
}

function listMapProvinces(generatedMap) {
  if (!Array.isArray(generatedMap.provinces)) {
    throw new TypeError('BuildEconomySeedFromStrategicMap generatedMap.provinces must be an array.');
  }

  return generatedMap.provinces.map((province) => requireObject(province, 'BuildEconomySeedFromStrategicMap province'));
}

export function buildProvincePositionById(generatedMap, explicitProvincePositionById = {}) {
  const map = requireObject(generatedMap, 'BuildEconomySeedFromStrategicMap generatedMap');
  const explicitPositions = requireObject(explicitProvincePositionById, 'BuildEconomySeedFromStrategicMap explicitProvincePositionById');
  const existingPositions = requireObject(map.provincePositionById ?? {}, 'BuildEconomySeedFromStrategicMap provincePositionById');
  const provinceLayouts = requireObject(map.provinceLayouts ?? {}, 'BuildEconomySeedFromStrategicMap provinceLayouts');
  const provincePositionById = {};

  for (const province of listMapProvinces(map).sort((left, right) => String(left.id).localeCompare(String(right.id)))) {
    const provinceId = requireText(province.id, 'BuildEconomySeedFromStrategicMap province.id');
    const explicitPosition = explicitPositions[provinceId];
    const existingPosition = existingPositions[provinceId];
    const layout = provinceLayouts[provinceId];

    if (explicitPosition !== undefined) {
      provincePositionById[provinceId] = normalizePosition(explicitPosition, `BuildEconomySeedFromStrategicMap explicitProvincePositionById.${provinceId}`);
      continue;
    }

    if (existingPosition !== undefined) {
      provincePositionById[provinceId] = normalizePosition(existingPosition, `BuildEconomySeedFromStrategicMap provincePositionById.${provinceId}`);
      continue;
    }

    if (layout !== undefined) {
      provincePositionById[provinceId] = centerPositionFromLayout(layout, `BuildEconomySeedFromStrategicMap provinceLayouts.${provinceId}`);
    }
  }

  return provincePositionById;
}

export function buildEconomySeedFromStrategicMap(generatedMap, options = {}) {
  const map = requireObject(generatedMap, 'BuildEconomySeedFromStrategicMap generatedMap');
  const normalizedOptions = requireObject(options, 'BuildEconomySeedFromStrategicMap options');
  const provincePositionById = buildProvincePositionById(
    map,
    normalizedOptions.provincePositionById ?? {},
  );
  const seedOptions = { ...normalizedOptions };
  delete seedOptions.provincePositionById;

  return seedEconomyFromStrategicMap(
    {
      ...map,
      provincePositionById,
    },
    seedOptions,
  );
}
