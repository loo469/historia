const DEFAULT_SEASONS = ['spring', 'summer', 'autumn', 'winter'];

function normalizeSeasonOrder(seasonOrder) {
  if (!Array.isArray(seasonOrder) || seasonOrder.length === 0) {
    throw new RangeError('SeasonCycle seasonOrder must be a non-empty array.');
  }

  const normalizedOrder = seasonOrder.map((season) => SeasonCycle.requireText(season, 'SeasonCycle seasonOrder value'));

  if (new Set(normalizedOrder).size !== normalizedOrder.length) {
    throw new RangeError('SeasonCycle seasonOrder cannot contain duplicates.');
  }

  return normalizedOrder;
}

export class SeasonCycle {
  constructor({
    currentSeason,
    year = 1,
    dayOfSeason = 1,
    seasonLengthDays = 30,
    seasonOrder = DEFAULT_SEASONS,
  } = {}) {
    this.seasonOrder = normalizeSeasonOrder(seasonOrder);
    this.currentSeason = SeasonCycle.requireText(currentSeason, 'SeasonCycle currentSeason');

    if (!this.seasonOrder.includes(this.currentSeason)) {
      throw new RangeError('SeasonCycle currentSeason must be included in seasonOrder.');
    }

    this.year = SeasonCycle.requireIntegerInRange(year, 'SeasonCycle year', 1, Number.MAX_SAFE_INTEGER);
    this.dayOfSeason = SeasonCycle.requireIntegerInRange(
      dayOfSeason,
      'SeasonCycle dayOfSeason',
      1,
      Number.MAX_SAFE_INTEGER,
    );
    this.seasonLengthDays = SeasonCycle.requireIntegerInRange(
      seasonLengthDays,
      'SeasonCycle seasonLengthDays',
      1,
      366,
    );

    if (this.dayOfSeason > this.seasonLengthDays) {
      throw new RangeError('SeasonCycle dayOfSeason cannot exceed seasonLengthDays.');
    }
  }

  get progressRatio() {
    return this.dayOfSeason / this.seasonLengthDays;
  }

  get nextSeason() {
    const currentIndex = this.seasonOrder.indexOf(this.currentSeason);
    return this.seasonOrder[(currentIndex + 1) % this.seasonOrder.length];
  }

  advanceDays(days = 1) {
    const normalizedDays = SeasonCycle.requireIntegerInRange(
      days,
      'SeasonCycle advance days',
      1,
      Number.MAX_SAFE_INTEGER,
    );

    let currentSeason = this.currentSeason;
    let dayOfSeason = this.dayOfSeason;
    let year = this.year;

    for (let day = 0; day < normalizedDays; day += 1) {
      dayOfSeason += 1;

      if (dayOfSeason > this.seasonLengthDays) {
        dayOfSeason = 1;

        const currentIndex = this.seasonOrder.indexOf(currentSeason);
        const nextIndex = (currentIndex + 1) % this.seasonOrder.length;
        currentSeason = this.seasonOrder[nextIndex];

        if (nextIndex === 0) {
          year += 1;
        }
      }
    }

    return new SeasonCycle({
      currentSeason,
      year,
      dayOfSeason,
      seasonLengthDays: this.seasonLengthDays,
      seasonOrder: this.seasonOrder,
    });
  }

  advanceSeason() {
    return this.advanceDays(this.seasonLengthDays - this.dayOfSeason + 1);
  }

  toJSON() {
    return {
      currentSeason: this.currentSeason,
      year: this.year,
      dayOfSeason: this.dayOfSeason,
      seasonLengthDays: this.seasonLengthDays,
      seasonOrder: [...this.seasonOrder],
      nextSeason: this.nextSeason,
      progressRatio: this.progressRatio,
    };
  }

  static requireText(value, label) {
    const normalizedValue = String(value ?? '').trim();

    if (!normalizedValue) {
      throw new RangeError(`${label} is required.`);
    }

    return normalizedValue;
  }

  static requireIntegerInRange(value, label, min, max) {
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new RangeError(`${label} must be an integer between ${min} and ${max}.`);
    }

    return value;
  }
}
