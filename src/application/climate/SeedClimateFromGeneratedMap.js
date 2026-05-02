import { Catastrophe } from '../../domain/climate/Catastrophe.js';
import { ClimateState } from '../../domain/climate/ClimateState.js';
import { Myth } from '../../domain/climate/Myth.js';
import { RegionClimateProfile } from '../../domain/climate/RegionClimateProfile.js';

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const VALID_BIOMES = ['temperate', 'arid', 'tropical', 'continental', 'polar', 'coastal', 'highland'];
const RISK_SCORE_BY_LEVEL = { low: 1, moderate: 2, high: 3, extreme: 4 };
const RISK_LEVEL_BY_SCORE = ['low', 'moderate', 'high', 'extreme'];

const BIOME_BASELINES = {
  temperate: { temperatureC: 12, precipitationLevel: 56, droughtIndex: 24, risks: { flood: 'moderate', storm: 'moderate' } },
  arid: { temperatureC: 25, precipitationLevel: 14, droughtIndex: 78, risks: { drought: 'high', heatwave: 'high' } },
  tropical: { temperatureC: 27, precipitationLevel: 82, droughtIndex: 18, risks: { flood: 'high', disease: 'moderate', storm: 'moderate' } },
  continental: { temperatureC: 8, precipitationLevel: 42, droughtIndex: 34, risks: { drought: 'moderate', blizzard: 'moderate' } },
  polar: { temperatureC: -8, precipitationLevel: 24, droughtIndex: 36, risks: { blizzard: 'high', famine: 'moderate' } },
  coastal: { temperatureC: 15, precipitationLevel: 68, droughtIndex: 18, risks: { flood: 'moderate', storm: 'high' } },
  highland: { temperatureC: 5, precipitationLevel: 48, droughtIndex: 30, risks: { landslide: 'high', blizzard: 'moderate' } },
};

const SEASON_SHIFT_BY_BIOME = {
  temperate: { spring: { t: 1, p: 8 }, summer: { t: 8, p: -4 }, autumn: { t: 0, p: 5 }, winter: { t: -9, p: -8 } },
  arid: { spring: { t: 3, p: 2 }, summer: { t: 10, p: -8 }, autumn: { t: 1, p: 1 }, winter: { t: -8, p: 4 } },
  tropical: { spring: { t: 0, p: 4 }, summer: { t: 2, p: 10 }, autumn: { t: 1, p: 8 }, winter: { t: -2, p: -12 } },
  continental: { spring: { t: 4, p: 5 }, summer: { t: 12, p: 2 }, autumn: { t: 0, p: 2 }, winter: { t: -14, p: -10 } },
  polar: { spring: { t: 4, p: 2 }, summer: { t: 10, p: 5 }, autumn: { t: -2, p: 0 }, winter: { t: -14, p: -6 } },
  coastal: { spring: { t: 1, p: 7 }, summer: { t: 5, p: -2 }, autumn: { t: 1, p: 10 }, winter: { t: -5, p: 5 } },
  highland: { spring: { t: 2, p: 6 }, summer: { t: 8, p: 5 }, autumn: { t: -1, p: 3 }, winter: { t: -10, p: -6 } },
};

function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new RangeError(`${label} must be an object.`);
  }

  return value;
}

function requireText(value, label) {
  const normalized = String(value ?? '').trim();

  if (!normalized) {
    throw new RangeError(`${label} is required.`);
  }

  return normalized;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeBiome(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  return VALID_BIOMES.includes(normalized) ? normalized : 'temperate';
}

function normalizeSeason(value, label) {
  const normalized = requireText(value, label).toLowerCase();

  if (!SEASONS.includes(normalized)) {
    throw new RangeError(`${label} must be one of: ${SEASONS.join(', ')}.`);
  }

  return normalized;
}

function normalizeRiskLevel(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  return RISK_SCORE_BY_LEVEL[normalized] ? normalized : 'low';
}

function maxRisk(left, right) {
  return RISK_SCORE_BY_LEVEL[normalizeRiskLevel(left)] >= RISK_SCORE_BY_LEVEL[normalizeRiskLevel(right)]
    ? normalizeRiskLevel(left)
    : normalizeRiskLevel(right);
}

function scoreToRisk(score) {
  return RISK_LEVEL_BY_SCORE[clamp(Math.ceil(score), 1, 4) - 1];
}

function normalizeMapRegions(generatedMap) {
  const map = requireObject(generatedMap, 'SeedClimateFromGeneratedMap generatedMap');
  const regions = map.regions ?? map.provinces;

  if (!Array.isArray(regions)) {
    throw new RangeError('SeedClimateFromGeneratedMap generatedMap.regions must be an array.');
  }

  return regions.map((region) => requireObject(region, 'SeedClimateFromGeneratedMap region'));
}

function deriveSeason(region, defaultSeason) {
  if (region.season !== undefined) {
    return normalizeSeason(region.season, 'SeedClimateFromGeneratedMap region season');
  }

  const latitude = Number.isFinite(region.latitude) ? region.latitude : null;
  if (latitude !== null && latitude < 0) {
    const opposite = { spring: 'autumn', summer: 'winter', autumn: 'spring', winter: 'summer' };
    return opposite[defaultSeason];
  }

  return defaultSeason;
}

function deriveProfile(region) {
  const regionId = requireText(region.id ?? region.regionId ?? region.provinceId, 'SeedClimateFromGeneratedMap region id');
  const biome = normalizeBiome(region.biome ?? region.climateBiome ?? region.terrain);
  const baseline = BIOME_BASELINES[biome];
  const altitudeMeters = Number.isFinite(region.altitudeMeters) ? region.altitudeMeters : Number.isFinite(region.elevationMeters) ? region.elevationMeters : 0;
  const coastal = Boolean(region.coastal ?? region.isCoastal ?? biome === 'coastal');
  const aridity = Number.isFinite(region.aridity) ? clamp(region.aridity, 0, 100) : null;
  const moisture = Number.isFinite(region.moisture) ? clamp(region.moisture, 0, 100) : null;
  const temperatureOffset = Number.isFinite(region.temperatureOffsetC) ? region.temperatureOffsetC : 0;
  const altitudeCooling = Math.round((altitudeMeters / 1000) * 6 * 10) / 10;
  const precipitationOffset = (moisture === null ? 0 : (moisture - 50) * 0.6) - (aridity === null ? 0 : aridity * 0.35);
  const seasonalAverages = Object.fromEntries(SEASONS.map((season) => {
    const shift = SEASON_SHIFT_BY_BIOME[biome][season];
    return [season, {
      averageTemperatureC: Math.round((baseline.temperatureC + shift.t + temperatureOffset - altitudeCooling) * 10) / 10,
      averagePrecipitationLevel: clamp(Math.round(baseline.precipitationLevel + shift.p + precipitationOffset), 0, 100),
    }];
  }));
  const catastropheRisks = { ...baseline.risks };

  if (coastal) {
    catastropheRisks.storm = maxRisk(catastropheRisks.storm, 'moderate');
    catastropheRisks.flood = maxRisk(catastropheRisks.flood, 'moderate');
  }
  if (altitudeMeters >= 1400) {
    catastropheRisks.landslide = maxRisk(catastropheRisks.landslide, 'high');
    catastropheRisks.blizzard = maxRisk(catastropheRisks.blizzard, 'moderate');
  }
  if (aridity !== null && aridity >= 70) {
    catastropheRisks.drought = maxRisk(catastropheRisks.drought, scoreToRisk(aridity / 25));
    catastropheRisks.heatwave = maxRisk(catastropheRisks.heatwave, 'high');
  }
  if (moisture !== null && moisture >= 72) {
    catastropheRisks.flood = maxRisk(catastropheRisks.flood, scoreToRisk(moisture / 25));
  }

  for (const hazard of Array.isArray(region.hazards) ? region.hazards : []) {
    const hazardType = requireText(typeof hazard === 'string' ? hazard : hazard.type, 'SeedClimateFromGeneratedMap hazard type');
    const riskLevel = typeof hazard === 'string' ? 'high' : normalizeRiskLevel(hazard.riskLevel ?? hazard.risk ?? hazard.severity);
    catastropheRisks[hazardType] = maxRisk(catastropheRisks[hazardType], riskLevel);
  }

  const tags = [biome, coastal ? 'coastal' : null, altitudeMeters >= 1400 ? 'high-altitude' : null, ...(Array.isArray(region.tags) ? region.tags : [])].filter(Boolean);

  return new RegionClimateProfile({
    regionId,
    biome,
    altitudeMeters,
    coastal,
    seasonalAverages,
    catastropheRisks,
    tags,
  });
}

function deriveAnomaly(profile, season, region) {
  if (region.anomaly !== undefined && region.anomaly !== null) {
    return requireText(region.anomaly, 'SeedClimateFromGeneratedMap region anomaly');
  }

  const average = profile.averageForSeason(season);
  const droughtRisk = RISK_SCORE_BY_LEVEL[profile.riskLevelFor('drought')];
  const floodRisk = RISK_SCORE_BY_LEVEL[profile.riskLevelFor('flood')];
  const stormRisk = RISK_SCORE_BY_LEVEL[profile.riskLevelFor('storm')];
  const blizzardRisk = RISK_SCORE_BY_LEVEL[profile.riskLevelFor('blizzard')];

  if (average.averagePrecipitationLevel <= 18 || (season === 'summer' && droughtRisk >= 3)) return 'drought-watch';
  if (average.averageTemperatureC >= 30 && profile.riskLevelFor('heatwave') !== 'low') return 'heatwave';
  if (average.averagePrecipitationLevel >= 82 || floodRisk >= 4) return 'flood-surge';
  if (season === 'winter' && blizzardRisk >= 3) return 'whiteout';
  if (stormRisk >= 4) return 'storm-front';
  return null;
}

function deriveClimateState(profile, season, region, seededAt) {
  const average = profile.averageForSeason(season);
  const droughtRiskScore = RISK_SCORE_BY_LEVEL[profile.riskLevelFor('drought')];
  const droughtIndex = clamp(Math.round(100 - average.averagePrecipitationLevel + (droughtRiskScore - 1) * 12), 0, 100);

  return new ClimateState({
    regionId: profile.regionId,
    season,
    temperatureC: average.averageTemperatureC,
    precipitationLevel: average.averagePrecipitationLevel,
    droughtIndex,
    anomaly: deriveAnomaly(profile, season, region),
    activeCatastropheIds: [],
    updatedAt: seededAt,
  });
}

function catastropheSeverity(riskLevel) {
  if (riskLevel === 'extreme') return 'critical';
  if (riskLevel === 'high') return 'major';
  return 'minor';
}

function catastropheImpact(type, riskLevel) {
  const score = RISK_SCORE_BY_LEVEL[riskLevel];
  const impact = {
    stabilityDelta: -score * 4,
    resourceYieldDelta: -score * 6,
  };

  if (type === 'drought' || type === 'heatwave') impact.waterAvailabilityDelta = -score * 8;
  if (type === 'flood' || type === 'storm') impact.infrastructureDelta = -score * 7;
  if (type === 'blizzard') impact.mobilityDelta = -score * 8;
  if (type === 'landslide') impact.routeCapacityDelta = -score * 7;

  return impact;
}

function buildCatastrophes(profiles, seededAt) {
  const startedAt = new Date(seededAt);
  const expectedEndAt = new Date(startedAt.getTime() + 1000 * 60 * 60 * 24 * 30);
  const candidates = [];

  profiles.forEach((profile) => {
    Object.entries(profile.catastropheRisks).forEach(([type, riskLevel]) => {
      if (RISK_SCORE_BY_LEVEL[riskLevel] >= 3) {
        candidates.push({ type, riskLevel, regionId: profile.regionId });
      }
    });
  });

  const grouped = new Map();
  candidates.forEach((candidate) => {
    const current = grouped.get(candidate.type) ?? { type: candidate.type, riskLevel: 'low', regionIds: [] };
    current.riskLevel = maxRisk(current.riskLevel, candidate.riskLevel);
    current.regionIds.push(candidate.regionId);
    grouped.set(candidate.type, current);
  });

  return [...grouped.values()]
    .sort((left, right) => left.type.localeCompare(right.type))
    .map((candidate) => new Catastrophe({
      id: `seeded-${candidate.type}-${candidate.regionIds.sort().join('-')}`,
      type: candidate.type,
      severity: catastropheSeverity(candidate.riskLevel),
      status: candidate.riskLevel === 'extreme' ? 'active' : 'warning',
      regionIds: candidate.regionIds,
      startedAt,
      expectedEndAt,
      impact: catastropheImpact(candidate.type, candidate.riskLevel),
      description: `Risque ${candidate.riskLevel} issu de la carte générée (${candidate.regionIds.length} région${candidate.regionIds.length > 1 ? 's' : ''}).`,
    }));
}

function buildMyths(catastrophes, seededAt) {
  return catastrophes.map((catastrophe) => new Myth({
    id: `myth-${catastrophe.id}`,
    title: `Présage de ${catastrophe.type}`,
    category: catastrophe.type === 'drought' || catastrophe.type === 'flood' ? 'catastrophe' : 'omen',
    originEventIds: [catastrophe.id],
    summary: `Les chroniqueurs relient les premiers signes de ${catastrophe.type} à la naissance de la carte stratégique.`,
    credibility: catastrophe.severity === 'critical' ? 72 : catastrophe.severity === 'major' ? 61 : 48,
    regions: catastrophe.regionIds,
    tags: ['generated-map', catastrophe.type, catastrophe.severity],
    createdAt: seededAt,
  }));
}

export class SeedClimateFromGeneratedMap {
  execute({ generatedMap, season = 'spring', seededAt = new Date().toISOString() } = {}) {
    const defaultSeason = normalizeSeason(season, 'SeedClimateFromGeneratedMap season');
    const regions = normalizeMapRegions(generatedMap);
    const profiles = regions.map(deriveProfile);
    const climateStates = profiles.map((profile, index) => deriveClimateState(profile, deriveSeason(regions[index], defaultSeason), regions[index], seededAt));
    const catastrophes = buildCatastrophes(profiles, seededAt);
    const catastropheIdsByRegion = new Map();

    catastrophes.forEach((catastrophe) => {
      catastrophe.regionIds.forEach((regionId) => {
        catastropheIdsByRegion.set(regionId, [...(catastropheIdsByRegion.get(regionId) ?? []), catastrophe.id]);
      });
    });

    const regionalStates = climateStates.map((state) => new ClimateState({
      ...state.toJSON(),
      activeCatastropheIds: catastropheIdsByRegion.get(state.regionId) ?? [],
    }));
    const myths = buildMyths(catastrophes, seededAt);

    return {
      profiles,
      regionalStates,
      catastrophes,
      myths,
      summary: `${regionalStates.length} régions climatiques, ${regionalStates.filter((state) => state.anomaly !== null).length} anomalies, ${catastrophes.length} catastrophes semées`,
    };
  }
}
