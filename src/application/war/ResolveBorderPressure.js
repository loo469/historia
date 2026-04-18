function clampPressure(value) {
  return Math.max(-100, Math.min(100, value));
}

function computeSupport(province) {
  const occupationPenalty = province.isOccupied ? 15 : 0;
  const contestedPenalty = province.contested ? 10 : 0;

  return province.loyalty + province.strategicValue * 5 - occupationPenalty - contestedPenalty;
}

function computePressure(attackerProvince, defenderProvince) {
  return clampPressure(computeSupport(attackerProvince) - computeSupport(defenderProvince));
}

function selectDominantProvince(leftProvince, rightProvince, pressure) {
  if (pressure === 0) {
    return null;
  }

  return pressure > 0 ? leftProvince.id : rightProvince.id;
}

export class ResolveBorderPressure {
  execute({ leftProvince, rightProvince }) {
    if (!leftProvince || !rightProvince) {
      throw new RangeError('ResolveBorderPressure requires both leftProvince and rightProvince.');
    }

    if (leftProvince.id === rightProvince.id) {
      throw new RangeError('ResolveBorderPressure provinces must be different.');
    }

    if (
      !leftProvince.neighborIds.includes(rightProvince.id) ||
      !rightProvince.neighborIds.includes(leftProvince.id)
    ) {
      throw new RangeError('ResolveBorderPressure provinces must be adjacent neighbors.');
    }

    if (leftProvince.controllingFactionId === rightProvince.controllingFactionId) {
      return {
        borderActive: false,
        pressure: 0,
        dominantProvinceId: null,
        contested: false,
      };
    }

    const pressure = computePressure(leftProvince, rightProvince);

    return {
      borderActive: true,
      pressure,
      dominantProvinceId: selectDominantProvince(leftProvince, rightProvince, pressure),
      contested: Math.abs(pressure) < 20,
    };
  }
}
