import { BorderSegment } from './BorderSegment.js';

function requireSegment(segment) {
  if (!(segment instanceof BorderSegment)) {
    throw new TypeError('buildFrontPressureIndicators segments must be BorderSegment instances.');
  }

  return segment;
}

function normalizeThreshold(value, fallback, label) {
  if (value === undefined) {
    return fallback;
  }

  if (!Number.isInteger(value) || value < 1 || value > 100) {
    throw new RangeError(`${label} must be an integer between 1 and 100.`);
  }

  return value;
}

function normalizeOptions(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('buildFrontPressureIndicators options must be an object.');
  }

  const mediumThreshold = normalizeThreshold(options.mediumThreshold, 25, 'buildFrontPressureIndicators mediumThreshold');
  const highThreshold = normalizeThreshold(options.highThreshold, 60, 'buildFrontPressureIndicators highThreshold');

  if (mediumThreshold >= highThreshold) {
    throw new RangeError('buildFrontPressureIndicators mediumThreshold must be lower than highThreshold.');
  }

  const appearanceByIntensity = options.appearanceByIntensity ?? {};

  if (!appearanceByIntensity || typeof appearanceByIntensity !== 'object' || Array.isArray(appearanceByIntensity)) {
    throw new TypeError('buildFrontPressureIndicators appearanceByIntensity must be an object.');
  }

  return {
    mediumThreshold,
    highThreshold,
    appearanceByIntensity,
  };
}

function getIntensity(pressureValue, thresholds) {
  if (pressureValue >= thresholds.highThreshold) {
    return 'high';
  }

  if (pressureValue >= thresholds.mediumThreshold) {
    return 'medium';
  }

  return 'low';
}

function normalizeAppearance(appearanceByIntensity, intensity) {
  const appearance = appearanceByIntensity[intensity] ?? {};

  return {
    icon: String(appearance.icon ?? 'pressure').trim() || 'pressure',
    color: String(appearance.color ?? 'amber').trim() || 'amber',
    scale: Number.isInteger(appearance.scale) && appearance.scale > 0 ? appearance.scale : 1,
  };
}

export function buildFrontPressureIndicators(segments, options = {}) {
  if (!Array.isArray(segments)) {
    throw new TypeError('buildFrontPressureIndicators segments must be an array.');
  }

  const normalizedOptions = normalizeOptions(options);

  return segments
    .map(requireSegment)
    .filter((segment) => segment.pressure !== 0)
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((segment) => {
      const pressureValue = Math.abs(segment.pressure);
      const intensity = getIntensity(pressureValue, normalizedOptions);

      return {
        segmentId: segment.id,
        provinces: [segment.provinceAId, segment.provinceBId],
        dominantProvinceId: segment.dominantProvinceId,
        pressure: segment.pressure,
        pressureValue,
        intensity,
        anchor: {
          position: segment.position,
          length: segment.length,
        },
        appearance: normalizeAppearance(normalizedOptions.appearanceByIntensity, intensity),
      };
    });
}
