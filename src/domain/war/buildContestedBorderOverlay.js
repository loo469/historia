import { BorderSegment } from './BorderSegment.js';

function requireSegment(segment) {
  if (!(segment instanceof BorderSegment)) {
    throw new TypeError('buildContestedBorderOverlay segments must be BorderSegment instances.');
  }

  return segment;
}

function normalizeStyle(styleByTerrain, terrainType) {
  const terrainStyle = styleByTerrain[terrainType] ?? styleByTerrain.default ?? {};

  return {
    stroke: String(terrainStyle.stroke ?? 'amber').trim() || 'amber',
    width: Number.isInteger(terrainStyle.width) && terrainStyle.width > 0 ? terrainStyle.width : 2,
    pattern: String(terrainStyle.pattern ?? 'solid').trim() || 'solid',
  };
}

export function buildContestedBorderOverlay(segments, styleByTerrain = {}) {
  if (!Array.isArray(segments)) {
    throw new TypeError('buildContestedBorderOverlay segments must be an array.');
  }

  if (!styleByTerrain || typeof styleByTerrain !== 'object' || Array.isArray(styleByTerrain)) {
    throw new TypeError('buildContestedBorderOverlay styleByTerrain must be an object.');
  }

  return segments
    .map(requireSegment)
    .filter((segment) => segment.contested)
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((segment) => ({
      segmentId: segment.id,
      provinces: [segment.provinceAId, segment.provinceBId],
      pressure: segment.pressure,
      dominantProvinceId: segment.dominantProvinceId,
      terrainType: segment.terrainType,
      chokepoint: segment.chokepoint,
      style: normalizeStyle(styleByTerrain, segment.terrainType),
    }));
}
