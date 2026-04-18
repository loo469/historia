function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function requireCulture(culture) {
  if (!culture || typeof culture !== 'object' || Array.isArray(culture)) {
    throw new TypeError('CultureRepositoryPort culture must be an object.');
  }

  return {
    ...culture,
    id: requireText(culture.id, 'CultureRepositoryPort culture.id'),
    name: requireText(culture.name, 'CultureRepositoryPort culture.name'),
  };
}

export class CultureRepositoryPort {
  async getById(cultureId) {
    requireText(cultureId, 'CultureRepositoryPort cultureId');
    throw new Error('CultureRepositoryPort.getById must be implemented by an adapter.');
  }

  async save(culture) {
    requireCulture(culture);
    throw new Error('CultureRepositoryPort.save must be implemented by an adapter.');
  }

  async listByEra(eraId) {
    requireText(eraId, 'CultureRepositoryPort eraId');
    throw new Error('CultureRepositoryPort.listByEra must be implemented by an adapter.');
  }
}
