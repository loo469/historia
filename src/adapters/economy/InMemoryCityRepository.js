import { CityRepositoryPort } from '../../domain/economy/CityRepositoryPort.js';
import { City } from '../../domain/economy/City.js';

function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizeCity(city) {
  if (city instanceof City) {
    return new City(city.toJSON());
  }

  if (city === null || typeof city !== 'object' || Array.isArray(city)) {
    throw new TypeError('InMemoryCityRepository city must be an object.');
  }

  return new City(city);
}

export class InMemoryCityRepository extends CityRepositoryPort {
  constructor({ cities = [] } = {}) {
    super();

    if (!Array.isArray(cities)) {
      throw new TypeError('InMemoryCityRepository cities must be an array.');
    }

    this.citiesById = new Map();

    for (const city of cities) {
      const normalizedCity = normalizeCity(city);
      this.citiesById.set(normalizedCity.id, normalizedCity);
    }
  }

  async getById(cityId) {
    const normalizedCityId = requireText(cityId, 'CityRepositoryPort cityId');
    const city = this.citiesById.get(normalizedCityId);
    return city ? new City(city.toJSON()) : null;
  }

  async save(city) {
    if (city === null || typeof city !== 'object' || Array.isArray(city)) {
      throw new TypeError('CityRepositoryPort city must be an object.');
    }

    requireText(city.id, 'CityRepositoryPort city.id');

    const normalizedCity = normalizeCity(city);
    this.citiesById.set(normalizedCity.id, normalizedCity);
    return new City(normalizedCity.toJSON());
  }

  async listByRegion(regionId) {
    const normalizedRegionId = requireText(regionId, 'CityRepositoryPort regionId');

    return [...this.citiesById.values()]
      .filter((city) => city.regionId === normalizedRegionId)
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((city) => new City(city.toJSON()));
  }
}
