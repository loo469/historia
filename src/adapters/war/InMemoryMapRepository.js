import { MapRepository } from '../../application/war/MapRepository.js';
import { Province } from '../../domain/war/Province.js';

function requireProvinceRecord(record) {
  if (record instanceof Province) {
    return record;
  }

  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new TypeError('InMemoryMapRepository province record must be a Province or plain object.');
  }

  return new Province(record);
}

export class InMemoryMapRepository extends MapRepository {
  constructor(provinces = []) {
    super();
    this.provinces = new Map();
    this.seed(provinces);
  }

  seed(provinces) {
    if (!Array.isArray(provinces)) {
      throw new TypeError('InMemoryMapRepository provinces must be an array.');
    }

    for (const provinceRecord of provinces) {
      const province = requireProvinceRecord(provinceRecord);
      this.provinces.set(province.id, province);
    }

    return this;
  }

  async getProvinceById(provinceId) {
    return this.provinces.get(String(provinceId).trim()) ?? null;
  }

  async listProvinces() {
    return [...this.provinces.values()].sort((left, right) => left.id.localeCompare(right.id));
  }

  async saveProvince(province) {
    const normalizedProvince = requireProvinceRecord(province);
    this.provinces.set(normalizedProvince.id, normalizedProvince);
    return normalizedProvince;
  }

  snapshot() {
    return [...this.provinces.values()]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((province) => province.toJSON());
  }
}
