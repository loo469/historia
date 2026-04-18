export class ClimateState {
  constructor({
    regionId,
    season,
    temperatureC,
    precipitationLevel,
    droughtIndex = 0,
    anomaly = null,
    activeCatastropheIds = [],
    updatedAt = new Date().toISOString(),
  }) {
    if (!regionId || typeof regionId !== 'string') {
      throw new Error('ClimateState requires a non-empty regionId');
    }

    if (!season || typeof season !== 'string') {
      throw new Error('ClimateState requires a season');
    }

    if (!Number.isFinite(temperatureC)) {
      throw new Error('ClimateState temperatureC must be a finite number');
    }

    if (!Number.isFinite(precipitationLevel) || precipitationLevel < 0 || precipitationLevel > 100) {
      throw new Error('ClimateState precipitationLevel must be between 0 and 100');
    }

    if (!Number.isFinite(droughtIndex) || droughtIndex < 0 || droughtIndex > 100) {
      throw new Error('ClimateState droughtIndex must be between 0 and 100');
    }

    this.regionId = regionId;
    this.season = season;
    this.temperatureC = temperatureC;
    this.precipitationLevel = precipitationLevel;
    this.droughtIndex = droughtIndex;
    this.anomaly = anomaly;
    this.activeCatastropheIds = Array.from(new Set(activeCatastropheIds));
    this.updatedAt = updatedAt;
  }

  withSeason(season, updatedAt = new Date().toISOString()) {
    return new ClimateState({
      ...this.toJSON(),
      season,
      updatedAt,
    });
  }

  withReadings({
    temperatureC = this.temperatureC,
    precipitationLevel = this.precipitationLevel,
    droughtIndex = this.droughtIndex,
    anomaly = this.anomaly,
  }, updatedAt = new Date().toISOString()) {
    return new ClimateState({
      ...this.toJSON(),
      temperatureC,
      precipitationLevel,
      droughtIndex,
      anomaly,
      updatedAt,
    });
  }

  activateCatastrophe(catastropheId, updatedAt = new Date().toISOString()) {
    if (!catastropheId || typeof catastropheId !== 'string') {
      throw new Error('ClimateState catastropheId must be a non-empty string');
    }

    return new ClimateState({
      ...this.toJSON(),
      activeCatastropheIds: [...this.activeCatastropheIds, catastropheId],
      updatedAt,
    });
  }

  resolveCatastrophe(catastropheId, updatedAt = new Date().toISOString()) {
    return new ClimateState({
      ...this.toJSON(),
      activeCatastropheIds: this.activeCatastropheIds.filter((id) => id !== catastropheId),
      updatedAt,
    });
  }

  hasAnomaly() {
    return this.anomaly !== null;
  }

  isStable() {
    return this.droughtIndex < 60 && this.precipitationLevel >= 20 && !this.hasAnomaly();
  }

  toJSON() {
    return {
      regionId: this.regionId,
      season: this.season,
      temperatureC: this.temperatureC,
      precipitationLevel: this.precipitationLevel,
      droughtIndex: this.droughtIndex,
      anomaly: this.anomaly,
      activeCatastropheIds: [...this.activeCatastropheIds],
      updatedAt: this.updatedAt,
    };
  }
}
