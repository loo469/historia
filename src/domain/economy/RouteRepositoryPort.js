function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

export class RouteRepositoryPort {
  async getById(routeId) {
    requireText(routeId, 'RouteRepositoryPort routeId');
    throw new Error('RouteRepositoryPort.getById must be implemented by an adapter.');
  }

  async save(route) {
    if (route === null || typeof route !== 'object' || Array.isArray(route)) {
      throw new TypeError('RouteRepositoryPort route must be an object.');
    }

    requireText(route.id, 'RouteRepositoryPort route.id');
    throw new Error('RouteRepositoryPort.save must be implemented by an adapter.');
  }

  async listByCity(cityId) {
    requireText(cityId, 'RouteRepositoryPort cityId');
    throw new Error('RouteRepositoryPort.listByCity must be implemented by an adapter.');
  }
}
