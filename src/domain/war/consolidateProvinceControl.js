import { Province } from './Province.js';

function clampLoyalty(value) {
  return Math.max(0, Math.min(100, value));
}

export function consolidateProvinceControl({ province, loyaltyGain = 10, supplyLevel = null }) {
  if (!(province instanceof Province)) {
    throw new TypeError('consolidateProvinceControl province must be a Province instance.');
  }

  if (!province.isOccupied) {
    return {
      consolidated: false,
      reason: 'not-occupied',
      province,
    };
  }

  if (!Number.isInteger(loyaltyGain) || loyaltyGain < 0) {
    throw new RangeError('consolidateProvinceControl loyaltyGain must be a non-negative integer.');
  }

  const nextSupplyLevel = supplyLevel === null ? province.supplyLevel : String(supplyLevel ?? '').trim();

  if (!nextSupplyLevel) {
    throw new RangeError('consolidateProvinceControl supplyLevel cannot be empty.');
  }

  const consolidatedProvince = new Province({
    ...province.toJSON(),
    loyalty: clampLoyalty(province.loyalty + loyaltyGain),
    contested: false,
    supplyLevel: nextSupplyLevel,
  });

  return {
    consolidated: true,
    reason: 'consolidated',
    province: consolidatedProvince,
  };
}
