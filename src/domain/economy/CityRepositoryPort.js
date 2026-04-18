function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

export class CityRepositoryPort {
  async getById(cityId) {
    requireText(cityId, 'CityRepositoryPort cityId');
    throw new Error('CityRepositoryPort.getById must be implemented by an adapter.');
  }

  async save(city) {
    if (city === null || typeof city !== 'object' || Array.isArray(city)) {
      throw new TypeError('CityRepositoryPort city must be an object.');
    }

    requireText(city.id, 'CityRepositoryPort city.id');
    throw new Error('CityRepositoryPort.save must be implemented by an adapter.');
  }

  async listByRegion(regionId) {
    requireText(regionId, 'CityRepositoryPort regionId');
    throw new Error('CityRepositoryPort.listByRegion must be implemented by an adapter.');
  }
}
