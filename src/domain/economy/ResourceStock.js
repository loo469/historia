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

export class ResourceStock {
  constructor({
    resourceId,
    quantity,
    capacity,
    reserved = 0,
    reorderPoint = 0,
    spoilageRisk = 0,
  }) {
    this.resourceId = requireText(resourceId, 'ResourceStock resourceId');
    this.capacity = requireInteger(
      capacity,
      'ResourceStock capacity',
      0,
      Number.MAX_SAFE_INTEGER,
    );
    this.quantity = requireInteger(
      quantity,
      'ResourceStock quantity',
      0,
      this.capacity,
    );
    this.reserved = requireInteger(
      reserved,
      'ResourceStock reserved',
      0,
      this.quantity,
    );
    this.reorderPoint = requireInteger(
      reorderPoint,
      'ResourceStock reorderPoint',
      0,
      this.capacity,
    );
    this.spoilageRisk = requireInteger(
      spoilageRisk,
      'ResourceStock spoilageRisk',
      0,
      100,
    );
  }

  get availableQuantity() {
    return this.quantity - this.reserved;
  }

  get isScarce() {
    return this.quantity <= this.reorderPoint;
  }

  get fillRatio() {
    if (this.capacity === 0) {
      return this.quantity === 0 ? 0 : Infinity;
    }

    return this.quantity / this.capacity;
  }

  withQuantity(quantity) {
    return new ResourceStock({
      ...this.toJSON(),
      quantity,
      reserved: Math.min(this.reserved, quantity),
    });
  }

  withReservation(reserved) {
    return new ResourceStock({
      ...this.toJSON(),
      reserved,
    });
  }

  withCapacity(capacity) {
    return new ResourceStock({
      ...this.toJSON(),
      capacity,
      quantity: Math.min(this.quantity, capacity),
      reserved: Math.min(this.reserved, Math.min(this.quantity, capacity)),
      reorderPoint: Math.min(this.reorderPoint, capacity),
    });
  }

  toJSON() {
    return {
      resourceId: this.resourceId,
      quantity: this.quantity,
      capacity: this.capacity,
      reserved: this.reserved,
      reorderPoint: this.reorderPoint,
      spoilageRisk: this.spoilageRisk,
    };
  }
}
