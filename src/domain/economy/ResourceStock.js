function normalizeEntries(entries) {
  if (entries === null || typeof entries !== 'object' || Array.isArray(entries)) {
    throw new TypeError('ResourceStock entries must be an object.');
  }

  return Object.fromEntries(
    Object.entries(entries)
      .map(([resourceId, quantity]) => {
        const normalizedResourceId = String(resourceId).trim();

        if (!normalizedResourceId) {
          throw new RangeError('ResourceStock cannot contain an empty resource id.');
        }

        if (!Number.isInteger(quantity) || quantity < 0) {
          throw new RangeError('ResourceStock quantities must be integers greater than or equal to 0.');
        }

        return [normalizedResourceId, quantity];
      })
      .sort(([leftId], [rightId]) => leftId.localeCompare(rightId)),
  );
}

export class ResourceStock {
  constructor(entries = {}) {
    this.entries = normalizeEntries(entries);
  }

  get totalQuantity() {
    return Object.values(this.entries).reduce((sum, quantity) => sum + quantity, 0);
  }

  has(resourceId, minimumQuantity = 1) {
    const normalizedResourceId = ResourceStock.#requireText(resourceId, 'ResourceStock resourceId');
    const normalizedMinimum = ResourceStock.#requireIntegerInRange(
      minimumQuantity,
      'ResourceStock minimumQuantity',
      0,
      Number.MAX_SAFE_INTEGER,
    );

    return (this.entries[normalizedResourceId] ?? 0) >= normalizedMinimum;
  }

  get(resourceId) {
    const normalizedResourceId = ResourceStock.#requireText(resourceId, 'ResourceStock resourceId');

    return this.entries[normalizedResourceId] ?? 0;
  }

  with(resourceId, quantity) {
    const normalizedResourceId = ResourceStock.#requireText(resourceId, 'ResourceStock resourceId');
    const normalizedQuantity = ResourceStock.#requireIntegerInRange(
      quantity,
      'ResourceStock quantity',
      0,
      Number.MAX_SAFE_INTEGER,
    );

    return new ResourceStock({
      ...this.entries,
      [normalizedResourceId]: normalizedQuantity,
    });
  }

  add(resourceId, quantity) {
    const normalizedResourceId = ResourceStock.#requireText(resourceId, 'ResourceStock resourceId');
    const normalizedQuantity = ResourceStock.#requireIntegerInRange(
      quantity,
      'ResourceStock quantity',
      0,
      Number.MAX_SAFE_INTEGER,
    );

    return this.with(normalizedResourceId, this.get(normalizedResourceId) + normalizedQuantity);
  }

  subtract(resourceId, quantity) {
    const normalizedResourceId = ResourceStock.#requireText(resourceId, 'ResourceStock resourceId');
    const normalizedQuantity = ResourceStock.#requireIntegerInRange(
      quantity,
      'ResourceStock quantity',
      0,
      Number.MAX_SAFE_INTEGER,
    );
    const currentQuantity = this.get(normalizedResourceId);

    if (normalizedQuantity > currentQuantity) {
      throw new RangeError('ResourceStock cannot subtract more than the available quantity.');
    }

    return this.with(normalizedResourceId, currentQuantity - normalizedQuantity);
  }

  merge(otherStock) {
    const stock = otherStock instanceof ResourceStock ? otherStock : new ResourceStock(otherStock);

    let mergedStock = new ResourceStock(this.entries);

    for (const [resourceId, quantity] of Object.entries(stock.entries)) {
      mergedStock = mergedStock.add(resourceId, quantity);
    }

    return mergedStock;
  }

  toJSON() {
    return { ...this.entries };
  }

  static #requireText(value, label) {
    const normalizedValue = String(value ?? '').trim();

    if (!normalizedValue) {
      throw new RangeError(`${label} is required.`);
    }

    return normalizedValue;
  }

  static #requireIntegerInRange(value, label, min, max) {
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new RangeError(`${label} must be an integer between ${min} and ${max}.`);
    }

    return value;
  }
}
