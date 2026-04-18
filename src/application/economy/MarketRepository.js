function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function requireInteger(value, label, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${label} must be an integer between ${min} and ${max}.`);
  }

  return value;
}

function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

export class MarketRepository {
  getPrice({ cityId, resourceId }) {
    requireObject({ cityId, resourceId }, 'MarketRepository getPrice input');
    requireText(cityId, 'MarketRepository getPrice cityId');
    requireText(resourceId, 'MarketRepository getPrice resourceId');
    throw new Error('MarketRepository.getPrice must be implemented by an adapter.');
  }

  setPrice({ cityId, resourceId, price }) {
    requireObject({ cityId, resourceId, price }, 'MarketRepository setPrice input');
    requireText(cityId, 'MarketRepository setPrice cityId');
    requireText(resourceId, 'MarketRepository setPrice resourceId');
    requireInteger(price, 'MarketRepository setPrice price', 0);
    throw new Error('MarketRepository.setPrice must be implemented by an adapter.');
  }

  listPricesByCity(cityId) {
    requireText(cityId, 'MarketRepository listPricesByCity cityId');
    throw new Error('MarketRepository.listPricesByCity must be implemented by an adapter.');
  }
}
