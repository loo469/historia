import { Province } from '../../domain/war/Province.js';

function requireProvinceId(provinceId) {
  const normalizedProvinceId = String(provinceId ?? '').trim();

  if (!normalizedProvinceId) {
    throw new RangeError('MapRepository provinceId is required.');
  }

  return normalizedProvinceId;
}

function requireProvince(province) {
  if (!(province instanceof Province)) {
    throw new TypeError('MapRepository province must be a Province instance.');
  }

  return province;
}

export class MapRepository {
  async getProvinceById(_provinceId) {
    throw new Error('MapRepository.getProvinceById must be implemented by an adapter.');
  }

  async listProvinces() {
    throw new Error('MapRepository.listProvinces must be implemented by an adapter.');
  }

  async saveProvince(_province) {
    throw new Error('MapRepository.saveProvince must be implemented by an adapter.');
  }

  async requireProvinceById(provinceId) {
    const normalizedProvinceId = requireProvinceId(provinceId);
    const province = await this.getProvinceById(normalizedProvinceId);

    if (!(province instanceof Province)) {
      throw new RangeError(`MapRepository could not find province ${normalizedProvinceId}.`);
    }

    return province;
  }

  async saveAll(provinces) {
    if (!Array.isArray(provinces)) {
      throw new TypeError('MapRepository provinces must be an array.');
    }

    const savedProvinces = [];

    for (const province of provinces) {
      savedProvinces.push(await this.saveProvince(requireProvince(province)));
    }

    return savedProvinces;
  }
}
