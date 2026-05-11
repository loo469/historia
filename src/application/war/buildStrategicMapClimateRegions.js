function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizeClimateFacet(region) {
  const climate = region.climate ?? {};

  if (climate === null || typeof climate !== 'object' || Array.isArray(climate)) {
    throw new TypeError(`GenerateStrategicMap ${region.id} climate must be an object.`);
  }

  return climate;
}

function copyNumber(value) {
  return Number.isFinite(value) ? value : undefined;
}

function copyBoolean(value) {
  return value === undefined ? undefined : Boolean(value);
}

function copyHazards(hazards) {
  if (hazards === undefined) {
    return undefined;
  }

  if (!Array.isArray(hazards)) {
    throw new TypeError('GenerateStrategicMap climate hazards must be an array.');
  }

  return hazards.map((hazard) => {
    if (typeof hazard === 'string') {
      return requireText(hazard, 'GenerateStrategicMap climate hazard');
    }

    if (hazard === null || typeof hazard !== 'object' || Array.isArray(hazard)) {
      throw new TypeError('GenerateStrategicMap climate hazards must contain strings or objects.');
    }

    return { ...hazard };
  });
}

function copyTags(tags) {
  if (tags === undefined) {
    return undefined;
  }

  if (!Array.isArray(tags)) {
    throw new TypeError('GenerateStrategicMap climate tags must be an array.');
  }

  return [...new Set(tags.map((tag) => requireText(tag, 'GenerateStrategicMap climate tag')))];
}

export function buildStrategicMapClimateRegions(regions) {
  return regions
    .map((region) => {
      const id = requireText(region.id ?? region.provinceId ?? region.regionId, 'GenerateStrategicMap province id');
      const climate = normalizeClimateFacet({ ...region, id });
      const biome = String(climate.biome ?? region.biome ?? region.climateBiome ?? region.terrain ?? 'temperate').trim().toLowerCase() || 'temperate';
      const climateRegion = {
        ...region,
        id,
        provinceId: id,
        regionId: id,
        name: requireText(region.name ?? region.label ?? id, `GenerateStrategicMap ${id} province name`),
        biome,
        climateBiome: String(climate.climateBiome ?? climate.biome ?? region.climateBiome ?? biome).trim().toLowerCase() || biome,
        altitudeMeters: copyNumber(climate.altitudeMeters ?? region.altitudeMeters ?? region.elevationMeters),
        elevationMeters: copyNumber(climate.elevationMeters ?? region.elevationMeters),
        latitude: copyNumber(climate.latitude ?? region.latitude),
        coastal: copyBoolean(climate.coastal ?? climate.isCoastal ?? region.coastal ?? region.isCoastal),
        aridity: copyNumber(climate.aridity ?? region.aridity),
        moisture: copyNumber(climate.moisture ?? region.moisture),
        temperatureOffsetC: copyNumber(climate.temperatureOffsetC ?? region.temperatureOffsetC),
        season: climate.season ?? region.season,
        anomaly: climate.anomaly ?? region.anomaly,
        hazards: copyHazards(climate.hazards ?? region.hazards),
        tags: copyTags(climate.tags ?? region.tags),
      };

      return Object.fromEntries(Object.entries(climateRegion).filter(([, value]) => value !== undefined));
    })
    .sort((left, right) => left.id.localeCompare(right.id));
}
