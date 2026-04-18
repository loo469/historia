const VALID_CATEGORIES = ['origin', 'omen', 'catastrophe', 'seasonal', 'heroic'];
const VALID_STATUSES = ['emerging', 'canonized', 'forgotten'];

function normalizeTags(tags) {
  if (!Array.isArray(tags)) {
    throw new RangeError('Myth tags must be an array.');
  }

  return [...new Set(tags.map((tag) => Myth.requireText(tag, 'Myth tag')))];
}

function normalizeOrigins(origins) {
  if (!Array.isArray(origins) || origins.length === 0) {
    throw new RangeError('Myth origins must be a non-empty array.');
  }

  return [...new Set(origins.map((origin) => Myth.requireText(origin, 'Myth origin')))];
}

export class Myth {
  constructor({
    id,
    title,
    category,
    status = 'emerging',
    originEventIds,
    summary,
    credibility = 50,
    regions = [],
    tags = [],
    createdAt = new Date(),
    canonizedAt = null,
  }) {
    this.id = Myth.requireText(id, 'Myth id');
    this.title = Myth.requireText(title, 'Myth title');
    this.category = Myth.requireChoice(category, 'Myth category', VALID_CATEGORIES);
    this.status = Myth.requireChoice(status, 'Myth status', VALID_STATUSES);
    this.originEventIds = normalizeOrigins(originEventIds);
    this.summary = Myth.requireText(summary, 'Myth summary');
    this.credibility = Myth.requireIntegerInRange(credibility, 'Myth credibility', 0, 100);
    this.regions = normalizeTags(regions).sort();
    this.tags = normalizeTags(tags).sort();
    this.createdAt = Myth.normalizeDate(createdAt, 'Myth createdAt');
    this.canonizedAt = Myth.normalizeOptionalDate(canonizedAt, 'Myth canonizedAt');

    if (this.status === 'canonized' && this.canonizedAt === null) {
      throw new RangeError('Myth canonized status requires canonizedAt.');
    }

    if (this.canonizedAt !== null && this.canonizedAt < this.createdAt) {
      throw new RangeError('Myth canonizedAt cannot be earlier than createdAt.');
    }
  }

  get isCanonized() {
    return this.status === 'canonized';
  }

  rememberInRegion(regionId) {
    return new Myth({
      ...this.toJSON(),
      regions: [...this.regions, regionId],
    });
  }

  withCredibility(credibility) {
    return new Myth({
      ...this.toJSON(),
      credibility,
    });
  }

  addTag(tag) {
    return new Myth({
      ...this.toJSON(),
      tags: [...this.tags, tag],
    });
  }

  canonize(canonizedAt = new Date()) {
    return new Myth({
      ...this.toJSON(),
      status: 'canonized',
      canonizedAt,
    });
  }

  forget() {
    return new Myth({
      ...this.toJSON(),
      status: 'forgotten',
      canonizedAt: null,
    });
  }

  referencesEvent(eventId) {
    const normalizedEventId = String(eventId ?? '').trim();
    return this.originEventIds.includes(normalizedEventId);
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      category: this.category,
      status: this.status,
      originEventIds: [...this.originEventIds],
      summary: this.summary,
      credibility: this.credibility,
      regions: [...this.regions],
      tags: [...this.tags],
      createdAt: this.createdAt.toISOString(),
      canonizedAt: this.canonizedAt?.toISOString() ?? null,
    };
  }

  static requireText(value, label) {
    const normalizedValue = String(value ?? '').trim();

    if (!normalizedValue) {
      throw new RangeError(`${label} is required.`);
    }

    return normalizedValue;
  }

  static requireChoice(value, label, validValues) {
    const normalizedValue = Myth.requireText(value, label);

    if (!validValues.includes(normalizedValue)) {
      throw new RangeError(`${label} must be one of: ${validValues.join(', ')}.`);
    }

    return normalizedValue;
  }

  static requireIntegerInRange(value, label, min, max) {
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new RangeError(`${label} must be an integer between ${min} and ${max}.`);
    }

    return value;
  }

  static normalizeDate(value, label) {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new RangeError(`${label} must be a valid date.`);
    }

    return date;
  }

  static normalizeOptionalDate(value, label) {
    if (value === null || value === undefined) {
      return null;
    }

    return Myth.normalizeDate(value, label);
  }
}
