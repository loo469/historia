export const CLIMATE_SEASONS = Object.freeze(['spring', 'summer', 'autumn', 'winter']);
export const CLIMATE_BIOMES = Object.freeze(['temperate', 'arid', 'tropical', 'continental', 'polar', 'coastal', 'highland']);
export const CLIMATE_RISK_LEVELS = Object.freeze(['low', 'moderate', 'high', 'extreme']);

export const CLIMATE_RISK_SCORE_BY_LEVEL = Object.freeze({
  low: 1,
  moderate: 2,
  high: 3,
  extreme: 4,
});

export const CLIMATE_RISK_LEVEL_BY_SCORE = CLIMATE_RISK_LEVELS;

export function normalizeClimateSeason(value, label = 'season') {
  const normalized = String(value ?? '').trim().toLowerCase();

  if (!normalized) {
    throw new RangeError(`${label} is required.`);
  }

  if (!CLIMATE_SEASONS.includes(normalized)) {
    throw new RangeError(`${label} must be one of: ${CLIMATE_SEASONS.join(', ')}.`);
  }

  return normalized;
}

export function normalizeClimateBiome(value, fallback = 'temperate') {
  const normalized = String(value ?? '').trim().toLowerCase();
  return CLIMATE_BIOMES.includes(normalized) ? normalized : fallback;
}

export function normalizeClimateRiskLevel(value, fallback = 'low') {
  const normalized = String(value ?? '').trim().toLowerCase();
  return CLIMATE_RISK_SCORE_BY_LEVEL[normalized] ? normalized : fallback;
}
