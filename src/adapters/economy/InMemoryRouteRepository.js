import { RouteRepositoryPort } from '../../domain/economy/RouteRepositoryPort.js';
import { TradeRoute } from '../../domain/economy/TradeRoute.js';

function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizeRoute(route) {
  if (route instanceof TradeRoute) {
    return new TradeRoute(route.toJSON());
  }

  if (route === null || typeof route !== 'object' || Array.isArray(route)) {
    throw new TypeError('InMemoryRouteRepository route must be an object.');
  }

  return new TradeRoute(route);
}

export class InMemoryRouteRepository extends RouteRepositoryPort {
  constructor({ routes = [] } = {}) {
    super();

    if (!Array.isArray(routes)) {
      throw new TypeError('InMemoryRouteRepository routes must be an array.');
    }

    this.routesById = new Map();

    for (const route of routes) {
      const normalizedRoute = normalizeRoute(route);
      this.routesById.set(normalizedRoute.id, normalizedRoute);
    }
  }

  async getById(routeId) {
    const normalizedRouteId = requireText(routeId, 'RouteRepositoryPort routeId');
    const route = this.routesById.get(normalizedRouteId);
    return route ? new TradeRoute(route.toJSON()) : null;
  }

  async save(route) {
    if (route === null || typeof route !== 'object' || Array.isArray(route)) {
      throw new TypeError('RouteRepositoryPort route must be an object.');
    }

    requireText(route.id, 'RouteRepositoryPort route.id');

    const normalizedRoute = normalizeRoute(route);
    this.routesById.set(normalizedRoute.id, normalizedRoute);
    return new TradeRoute(normalizedRoute.toJSON());
  }

  async listByCity(cityId) {
    const normalizedCityId = requireText(cityId, 'RouteRepositoryPort cityId');

    return [...this.routesById.values()]
      .filter((route) => route.connects(normalizedCityId))
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((route) => new TradeRoute(route.toJSON()));
  }
}
