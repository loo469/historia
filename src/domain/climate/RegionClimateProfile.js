const VALID_BIOMES = ['temperate', 'arid', 'tropical', 'continental', 'polar', 'coastal', 'highland'];
const VALID_RISK_LEVELS = ['low', 'moderate', 'high', 'extreme'];
const VALID_SEASONS = ['spring', 'summer', 'autumn', 'winter'];

function normalizeSeasonalAverages(seasonalAverages) {
  if (seasonalAverages === null || typeof seasonalAverages !== 'object' || Array.isArray(seasonalAverages)) {
    throw new RangeError('RegionClimateProfile seasonalAverages must be an object.');
  }

  const normalized = {};

  for (const season of Object.keys(seasonalAverages)) {
    if (!VALID_SEASONS.includes(season)) {
      throw new RangeError(`RegionClimateProfile seasonalAverages season must be one of: ${VALID_SEASONS.join(', ')}.`);
    }

    const snapshot = seasonalAverages[season];

    if (snapshot === null || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
      throw new RangeError('RegionClimateProfile seasonalAverages values must be objects.');
    }

    const averageTemperatureC = RegionClimateProfile.requireFiniteNumber(
      snapshot.averageTemperatureC,
      `RegionClimateProfile ${season} averageTemperatureC`,
    );
    const averagePrecipitationLevel = RegionClimateProfile.requireFiniteNumberInRange(
      snapshot.averagePrecipitationLevel,
      `RegionClimateProfile ${season} averagePrecipitationLevel`,
      0,
      100,
    );

    normalized[season] = {
      averageTemperatureC,
      averagePrecipitationLevel,
    };
  }

  if (Object.keys(normalized).length === 0) {
    throw new RangeError('RegionClimateProfile seasonalAverages cannot be empty.');
  }

  return normalized;
}

function normalizeCatastropheRisks(catastropheRisks) {
  if (catastropheRisks === null || typeof catastropheRisks !== 'object' || Array.isArray(catastropheRisks)) {
    throw new RangeError('RegionClimateProfile catastropheRisks must be an object.');
  }

  const normalized = {};

  for (const [type, riskLevel] of Object.entries(catastropheRisks)) {
    const normalizedType = RegionClimateProfile.requireText(type, 'RegionClimateProfile catastrophe risk type');
    normalized[normalizedType] = RegionClimateProfile.requireChoice(
      riskLevel,
      `RegionClimateProfile catastrophe risk ${normalizedType}`,
      VALID_RISK_LEVELS,
    );
  }

  return normalized;
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) {
    throw new RangeError('RegionClimateProfile tags must be an array.');
  }

  return [...new Set(tags.map((tag) => RegionClimateProfile.requireText(tag, 'RegionClimateProfile tag')))].sort();
}

export class RegionClimateProfile {
  constructor({
    regionId,
    biome,
    altitudeMeters = 0,
    coastal = false,
    seasonalAverages,
    catastropheRisks = {},
    tags = [],
  }) {
    this.regionId = RegionClimateProfile.requireText(regionId, 'RegionClimateProfile regionId');
    this.biome = RegionClimateProfile.requireChoice(biome, 'RegionClimateProfile biome', VALID_BIOMES);
    this.altitudeMeters = RegionClimateProfile.requireFiniteNumber(altitudeMeters, 'RegionClimateProfile altitudeMeters');
    this.coastal = Boolean(coastal);
    this.seasonalAverages = normalizeSeasonalAverages(seasonalAverages);
    this.catastropheRisks = normalizeCatastropheRisks(catastropheRisks);
    this.tags = normalizeTags(tags);
  }

  riskLevelFor(catastropheType) {
    const normalizedType = String(catastropheType ?? '').trim();
    return this.catastropheRisks[normalizedType] ?? 'low';
  }

  averageForSeason(season) {
    const normalizedSeason = String(season ?? '').trim();
    const average = this.seasonalAverages[normalizedSeason];

    if (!average) {
      throw new RangeError(`RegionClimateProfile has no average for season ${normalizedSeason}.`);
    }

    return { ...average };
  }

  withRisk(catastropheType, riskLevel) {
    const normalizedType = RegionClimateProfile.requireText(catastropheType, 'RegionClimateProfile catastrophe risk type');

    return new RegionClimateProfile({
      ...this.toJSON(),
      catastropheRisks: {
        ...this.catastropheRisks,
        [normalizedType]: riskLevel,
      },
    });
  }

  addTag(tag) {
    return new RegionClimateProfile({
      ...this.toJSON(),
      tags: [...this.tags, tag],
    });
  }

  toJSON() {
    return {
      regionId: this.regionId,
      biome: this.biome,
      altitudeMeters: this.altitudeMeters,
      coastal: this.coastal,
      seasonalAverages: Object.fromEntries(
        Object.entries(this.seasonalAverages).map(([season, average]) => [season, { ...average }]),
      ),
      catastropheRisks: { ...this.catastropheRisks },
      tags: [...this.tags],
    };
  }

  static requireText(value, label) {
    const normalizedValue = String(value ?? '').trim();

    if (!normalizedValue) {
      throw new RangeError(`${label} is required.`);
    }

    return normalizedValue;
  }

  static requireChoice(value, label, validValues) {
    const normalizedValue = RegionClimateProfile.requireText(value, label);

    if (!validValues.includes(normalizedValue)) {
      throw new RangeError(`${label} must be one of: ${validValues.join(', ')}.`);
    }

    return normalizedValue;
  }

  static requireFiniteNumber(value, label) {
    if (!Number.isFinite(value)) {
      throw new RangeError(`${label} must be a finite number.`);
    }

    return value;
  }

  static requireFiniteNumberInRange(value, label, min, max) {
    if (!Number.isFinite(value) || value < min || value > max) {
      throw new RangeError(`${label} must be a finite number between ${min} and ${max}.`);
    }

    return value;
  }
}
