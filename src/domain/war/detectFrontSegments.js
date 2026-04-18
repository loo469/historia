import { BorderSegment } from './BorderSegment.js';
import { Province } from './Province.js';

function requireProvince(province) {
  if (!(province instanceof Province)) {
    throw new TypeError('detectFrontSegments provinces must be Province instances.');
  }

  return province;
}

function buildProvinceMap(provinces) {
  const provinceMap = new Map();

  for (const province of provinces) {
    const normalizedProvince = requireProvince(province);
    provinceMap.set(normalizedProvince.id, normalizedProvince);
  }

  return provinceMap;
}

function buildSegmentId(provinceAId, provinceBId) {
  return [provinceAId, provinceBId].sort().join('::');
}

export function detectFrontSegments(provinces, segmentOptionsByPair = {}) {
  if (!Array.isArray(provinces)) {
    throw new TypeError('detectFrontSegments provinces must be an array.');
  }

  if (!segmentOptionsByPair || typeof segmentOptionsByPair !== 'object' || Array.isArray(segmentOptionsByPair)) {
    throw new TypeError('detectFrontSegments segmentOptionsByPair must be an object.');
  }

  const provinceMap = buildProvinceMap(provinces);
  const segments = [];
  const seenSegmentIds = new Set();

  for (const province of provinceMap.values()) {
    for (const neighborId of province.neighborIds) {
      const neighbor = provinceMap.get(neighborId);

      if (!(neighbor instanceof Province)) {
        continue;
      }

      if (province.controllingFactionId === neighbor.controllingFactionId) {
        continue;
      }

      const segmentId = buildSegmentId(province.id, neighbor.id);

      if (seenSegmentIds.has(segmentId)) {
        continue;
      }

      const options = segmentOptionsByPair[segmentId] ?? {};
      segments.push(
        new BorderSegment({
          provinceAId: province.id,
          provinceBId: neighbor.id,
          terrainType: options.terrainType ?? 'plain',
          pressure: options.pressure ?? 0,
          contested: options.contested ?? true,
          chokepoint: options.chokepoint ?? false,
          length: options.length ?? 1,
          position: options.position ?? 0,
        }),
      );
      seenSegmentIds.add(segmentId);
    }
  }

  return segments.sort((left, right) => left.id.localeCompare(right.id));
}
