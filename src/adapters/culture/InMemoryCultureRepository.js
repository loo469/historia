import { CultureRepositoryPort } from '../../domain/culture/CultureRepositoryPort.js';

function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizeCulture(culture) {
  if (!culture || typeof culture !== 'object' || Array.isArray(culture)) {
    throw new TypeError('InMemoryCultureRepository culture must be an object.');
  }

  return {
    ...culture,
    id: requireText(culture.id, 'InMemoryCultureRepository culture.id'),
    name: requireText(culture.name, 'InMemoryCultureRepository culture.name'),
    eraId: requireText(culture.eraId, 'InMemoryCultureRepository culture.eraId'),
    tags: Array.isArray(culture.tags)
      ? [...new Set(culture.tags.map((tag) => requireText(tag, 'InMemoryCultureRepository culture.tags[]')))].sort()
      : [],
  };
}

function cloneCulture(culture) {
  return {
    ...culture,
    tags: [...culture.tags],
  };
}

export class InMemoryCultureRepository extends CultureRepositoryPort {
  constructor(initialCultures = []) {
    super();
    this.cultures = new Map();

    for (const culture of initialCultures) {
      const normalizedCulture = normalizeCulture(culture);
      this.cultures.set(normalizedCulture.id, normalizedCulture);
    }
  }

  async getById(cultureId) {
    const normalizedCultureId = requireText(cultureId, 'CultureRepositoryPort cultureId');
    const culture = this.cultures.get(normalizedCultureId);

    return culture ? cloneCulture(culture) : null;
  }

  async save(culture) {
    const normalizedCulture = normalizeCulture(culture);
    this.cultures.set(normalizedCulture.id, normalizedCulture);
    return cloneCulture(normalizedCulture);
  }

  async listByEra(eraId) {
    const normalizedEraId = requireText(eraId, 'CultureRepositoryPort eraId');

    return [...this.cultures.values()]
      .filter((culture) => culture.eraId === normalizedEraId)
      .map((culture) => cloneCulture(culture));
  }
}
