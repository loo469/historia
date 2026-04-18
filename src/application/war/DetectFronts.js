function pairKey(leftFactionId, rightFactionId) {
  return [String(leftFactionId).trim(), String(rightFactionId).trim()].sort().join('::');
}

function segmentId(leftProvinceId, rightProvinceId) {
  return [String(leftProvinceId).trim(), String(rightProvinceId).trim()].sort().join('::');
}

export class DetectFronts {
  execute({ provinces }) {
    if (!Array.isArray(provinces)) {
      throw new TypeError('DetectFronts provinces must be an array.');
    }

    const provinceById = new Map(provinces.map((province) => [province.id, province]));
    const frontMap = new Map();
    const seenSegments = new Set();

    for (const province of provinces) {
      for (const neighborId of province.neighborIds) {
        const neighbor = provinceById.get(neighborId);

        if (!neighbor) {
          continue;
        }

        const currentSegmentId = segmentId(province.id, neighbor.id);

        if (seenSegments.has(currentSegmentId)) {
          continue;
        }

        seenSegments.add(currentSegmentId);

        if (province.controllingFactionId === neighbor.controllingFactionId) {
          continue;
        }

        const currentPairKey = pairKey(
          province.controllingFactionId,
          neighbor.controllingFactionId,
        );
        const existingFront = frontMap.get(currentPairKey) ?? {
          id: currentPairKey,
          factionIds: currentPairKey.split('::'),
          provinceIds: [],
          segmentIds: [],
          contestedProvinceIds: [],
        };

        existingFront.segmentIds = [...new Set([...existingFront.segmentIds, currentSegmentId])].sort();
        existingFront.provinceIds = [...new Set([...existingFront.provinceIds, province.id, neighbor.id])].sort();

        if (province.contested) {
          existingFront.contestedProvinceIds = [
            ...new Set([...existingFront.contestedProvinceIds, province.id]),
          ].sort();
        }

        if (neighbor.contested) {
          existingFront.contestedProvinceIds = [
            ...new Set([...existingFront.contestedProvinceIds, neighbor.id]),
          ].sort();
        }

        frontMap.set(currentPairKey, existingFront);
      }
    }

    return [...frontMap.values()]
      .map((front) => ({
        ...front,
        pressure: front.contestedProvinceIds.length,
      }))
      .sort((left, right) => left.id.localeCompare(right.id));
  }
}
