function normalizeText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

export class ExpandTerritory {
  execute({ factionId, sourceProvinceId, targetProvinceId, provinces, capturedAt = new Date() }) {
    const normalizedFactionId = normalizeText(factionId, 'ExpandTerritory factionId');
    const normalizedSourceProvinceId = normalizeText(
      sourceProvinceId,
      'ExpandTerritory sourceProvinceId',
    );
    const normalizedTargetProvinceId = normalizeText(
      targetProvinceId,
      'ExpandTerritory targetProvinceId',
    );

    if (!Array.isArray(provinces)) {
      throw new TypeError('ExpandTerritory provinces must be an array.');
    }

    const provinceById = new Map(provinces.map((province) => [province.id, province]));
    const sourceProvince = provinceById.get(normalizedSourceProvinceId);
    const targetProvince = provinceById.get(normalizedTargetProvinceId);

    if (!sourceProvince) {
      throw new RangeError('ExpandTerritory sourceProvinceId must reference an existing province.');
    }

    if (!targetProvince) {
      throw new RangeError('ExpandTerritory targetProvinceId must reference an existing province.');
    }

    if (sourceProvince.controllingFactionId !== normalizedFactionId) {
      throw new RangeError('ExpandTerritory source province must be controlled by the expanding faction.');
    }

    if (
      !sourceProvince.neighborIds.includes(targetProvince.id) ||
      !targetProvince.neighborIds.includes(sourceProvince.id)
    ) {
      throw new RangeError('ExpandTerritory target province must be adjacent to the source province.');
    }

    if (targetProvince.controllingFactionId === normalizedFactionId) {
      return {
        expanded: false,
        province: targetProvince,
        reason: 'already-controlled',
      };
    }

    return {
      expanded: true,
      province: targetProvince.withControllingFaction(normalizedFactionId, capturedAt),
      reason: 'captured',
    };
  }
}
