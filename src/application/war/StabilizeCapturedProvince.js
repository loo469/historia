import { Province } from '../../domain/war/Province.js';

const SUPPLY_RECOVERY = {
  collapsed: 'disrupted',
  disrupted: 'strained',
  strained: 'stable',
  stable: 'stable',
  secure: 'secure',
};

function clampLoyalty(value) {
  return Math.max(0, Math.min(100, value));
}

export class StabilizeCapturedProvince {
  execute({ province, loyaltyGain = 10, supplyRecovery = true }) {
    if (!(province instanceof Province)) {
      throw new TypeError('StabilizeCapturedProvince province must be a Province instance.');
    }

    if (!province.isOccupied) {
      return {
        stabilized: false,
        reason: 'not-occupied',
        province,
      };
    }

    if (!Number.isInteger(loyaltyGain) || loyaltyGain < 0) {
      throw new RangeError('StabilizeCapturedProvince loyaltyGain must be a non-negative integer.');
    }

    const nextProvince = new Province({
      ...province.toJSON(),
      loyalty: clampLoyalty(province.loyalty + loyaltyGain),
      contested: false,
      supplyLevel: supplyRecovery ? SUPPLY_RECOVERY[province.supplyLevel] ?? province.supplyLevel : province.supplyLevel,
    });

    return {
      stabilized: true,
      reason: 'stabilized',
      province: nextProvince,
    };
  }
}
