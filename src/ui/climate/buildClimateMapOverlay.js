import { ClimateState } from '../../domain/climate/ClimateState.js';
import { buildCatastropheMapOverlay } from './buildCatastropheMapOverlay.js';

function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function requireArray(value, label) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${label} must be an array.`);
  }

  return value;
}

function normalizeClimateState(climateState) {
  if (climateState instanceof ClimateState) {
    return climateState;
  }

  if (climateState === null || typeof climateState !== 'object' || Array.isArray(climateState)) {
    throw new TypeError('ClimateMapOverlay climateStates must contain ClimateState instances or plain objects.');
  }

  return new ClimateState(climateState);
}

const DEFAULT_SEASON_STYLE_BY_TYPE = Object.freeze({
  spring: { icon: '✿', tone: 'renewal', accent: 'green' },
  summer: { icon: '☀', tone: 'bright', accent: 'gold' },
  autumn: { icon: '❋', tone: 'harvest', accent: 'amber' },
  winter: { icon: '❄', tone: 'cold', accent: 'cyan' },
  default: { icon: '◐', tone: 'info', accent: 'slate' },
});

function normalizeSeasonStyle(styleByType, season) {
  const seasonType = String(season ?? '').trim().toLowerCase();
  const style = styleByType[seasonType] ?? styleByType.default ?? DEFAULT_SEASON_STYLE_BY_TYPE.default;

  return {
    icon: String(style.icon ?? DEFAULT_SEASON_STYLE_BY_TYPE[seasonType]?.icon ?? '◐').trim() || '◐',
    tone: String(style.tone ?? DEFAULT_SEASON_STYLE_BY_TYPE[seasonType]?.tone ?? 'info').trim() || 'info',
    accent: String(style.accent ?? DEFAULT_SEASON_STYLE_BY_TYPE[seasonType]?.accent ?? 'slate').trim() || 'slate',
  };
}

function buildSeasonEntry(state, seasonLabels, seasonStyleByType) {
  const badge = normalizeSeasonStyle(seasonStyleByType, state.season);

  return {
    overlayId: `${state.regionId}:season`,
    regionId: state.regionId,
    kind: 'season',
    label: seasonLabels[state.season] ?? state.season,
    season: state.season,
    tone: badge.tone,
    badge,
  };
}

const DEFAULT_ANOMALY_STYLE_BY_TYPE = Object.freeze({
  heatwave: { icon: '☀', tone: 'danger', accent: 'amber' },
  drought: { icon: '♨', tone: 'danger', accent: 'ochre' },
  storm: { icon: '☈', tone: 'warning', accent: 'blue' },
  flood: { icon: '≈', tone: 'warning', accent: 'teal' },
  frost: { icon: '❄', tone: 'warning', accent: 'cyan' },
  default: { icon: '◌', tone: 'warning', accent: 'slate' },
});

function normalizeAnomalyType(anomaly) {
  return String(anomaly ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');
}

function normalizeAnomalyStyle(styleByType, anomaly) {
  const anomalyType = normalizeAnomalyType(anomaly);
  const style = styleByType[anomalyType] ?? styleByType.default ?? DEFAULT_ANOMALY_STYLE_BY_TYPE.default;

  return {
    icon: String(style.icon ?? DEFAULT_ANOMALY_STYLE_BY_TYPE[anomalyType]?.icon ?? '◌').trim() || '◌',
    tone: String(style.tone ?? DEFAULT_ANOMALY_STYLE_BY_TYPE[anomalyType]?.tone ?? 'warning').trim() || 'warning',
    accent: String(style.accent ?? DEFAULT_ANOMALY_STYLE_BY_TYPE[anomalyType]?.accent ?? 'slate').trim() || 'slate',
  };
}

function buildAnomalyEntry(state, anomalyStyleByType) {
  if (!state.hasAnomaly()) {
    return null;
  }

  const marker = normalizeAnomalyStyle(anomalyStyleByType, state.anomaly);

  return {
    overlayId: `${state.regionId}:anomaly:${state.anomaly}`,
    regionId: state.regionId,
    kind: 'anomaly',
    label: state.anomaly,
    season: state.season,
    tone: marker.tone,
    marker,
  };
}

function buildStrategicImpact(state, catastropheEntries) {
  if (catastropheEntries.length > 0 || state.droughtIndex >= 60) {
    return 'critical';
  }

  if (state.hasAnomaly() || state.precipitationLevel < 20) {
    return 'strained';
  }

  return 'stable';
}

function buildStrategicSignals(state, catastropheEntries) {
  const logisticsRisk = catastropheEntries.length > 0
    ? 'severe'
    : state.precipitationLevel < 20 || state.droughtIndex >= 55
      ? 'elevated'
      : 'low';

  const stabilityRisk = catastropheEntries.some((entry) => entry.impact.unrest > 0)
    ? 'high'
    : state.hasAnomaly() || state.droughtIndex >= 45
      ? 'moderate'
      : 'low';

  const harvestRisk = catastropheEntries.some((entry) => entry.impact.harvest < 0)
    ? 'high'
    : state.precipitationLevel < 25 || state.droughtIndex >= 50
      ? 'moderate'
      : 'low';

  return {
    logisticsRisk,
    stabilityRisk,
    harvestRisk,
    summary: `logistique ${logisticsRisk}, stabilité ${stabilityRisk}, récoltes ${harvestRisk}`,
  };
}

function buildSeasonSummary(states, seasonLabels, seasonStyleByType) {
  const countsBySeason = Object.create(null);

  for (const state of states) {
    countsBySeason[state.season] = (countsBySeason[state.season] ?? 0) + 1;
  }

  const seasons = Object.entries(countsBySeason)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([season, regionCount]) => ({
      season,
      label: seasonLabels[season] ?? season,
      regionCount,
      badge: normalizeSeasonStyle(seasonStyleByType, season),
    }));

  const dominantSeason = seasons
    .slice()
    .sort((left, right) => {
      if (right.regionCount !== left.regionCount) {
        return right.regionCount - left.regionCount;
      }

      return left.season.localeCompare(right.season);
    })[0] ?? null;

  return {
    title: 'Situation saisonnière',
    summary: seasons.map((entry) => `${entry.label}: ${entry.regionCount}`).join(', '),
    dominantSeason,
    seasons,
  };
}


function normalizeSeasonPreview(options, seasonLabels, seasonStyleByType) {
  const previewOption = options.seasonPreview ?? options.previewSeason;

  if (previewOption === undefined || previewOption === null || previewOption === false) {
    return null;
  }

  const preview = typeof previewOption === 'string'
    ? { season: previewOption }
    : requireObject(previewOption, 'ClimateMapOverlay seasonPreview');
  const season = String(preview.season ?? preview.previewSeason ?? '').trim().toLowerCase();

  if (!season) {
    throw new RangeError('ClimateMapOverlay seasonPreview.season is required.');
  }

  const badge = normalizeSeasonStyle(seasonStyleByType, season);
  const label = String(preview.label ?? seasonLabels[season] ?? season).trim() || season;

  return {
    mode: 'season-preview',
    season,
    label,
    active: preview.active === undefined ? true : Boolean(preview.active),
    badge,
    impactsByRegion: preview.impactsByRegion ?? preview.regions,
    copy: String(preview.copy ?? `Aperçu saison suivante: ${label}`).trim() || `Aperçu saison suivante: ${label}`,
  };
}

function buildSeasonPreviewPanel(states, seasonPreview, seasonLabels) {
  if (!seasonPreview?.active) {
    return null;
  }

  const currentSeasons = [...new Set(states.map((state) => state.season))].sort();
  const changedRegionCount = states.filter((state) => state.season !== seasonPreview.season).length;

  return {
    mode: seasonPreview.mode,
    active: true,
    currentSeasonLabels: currentSeasons.map((season) => seasonLabels[season] ?? season),
    previewSeason: seasonPreview.season,
    previewLabel: seasonPreview.label,
    changedRegionCount,
    control: {
      controlId: 'climate-season-preview',
      label: seasonPreview.copy,
      tone: seasonPreview.badge.tone,
      icon: seasonPreview.badge.icon,
      placement: 'hud-compact',
      obscuresMap: false,
    },
    copy: `${seasonPreview.label} preview on ${changedRegionCount}/${states.length} regions`,
  };
}

function normalizeSelectedRegionId(options) {
  const selectedRegionId = options.selectedRegionId ?? options.selectedProvinceId ?? options.focusedRegionId ?? options.focusedProvinceId;

  if (selectedRegionId === undefined || selectedRegionId === null) {
    return null;
  }

  return String(selectedRegionId).trim() || null;
}

function normalizePreviewImpacts(options, seasonPreview) {
  const previewImpacts = options.previewImpactsByRegion ?? seasonPreview?.impactsByRegion ?? seasonPreview?.regions;

  if (previewImpacts === undefined || previewImpacts === null) {
    return {};
  }

  return requireObject(previewImpacts, 'ClimateMapOverlay previewImpactsByRegion');
}

function summarizeRegionClimate(region) {
  return region.strategicSignals?.summary ?? `${region.seasonLabel}, ${region.strategicImpact}`;
}

const CLIMATE_RISK_ORDER = Object.freeze({ stable: 0, strained: 1, critical: 2 });

function getClimateRiskScore(riskLevel) {
  return CLIMATE_RISK_ORDER[String(riskLevel ?? '').trim().toLowerCase()] ?? 1;
}

function getPrimaryClimateTimingSignal(comparison) {
  if (comparison.state !== 'ready') {
    return null;
  }

  const currentScore = getClimateRiskScore(comparison.current.riskLevel);
  const previewScore = getClimateRiskScore(comparison.preview.riskLevel);

  if (previewScore < currentScore) {
    return {
      direction: 'safer',
      urgency: comparison.current.riskLevel === 'critical' ? 'wait-for-preview' : 'opportunistic',
      tone: 'positive',
      copy: `${comparison.preview.label} rend l’action plus sûre: risque ${comparison.current.riskLevel} → ${comparison.preview.riskLevel}.`,
    };
  }

  if (previewScore > currentScore) {
    return {
      direction: 'riskier',
      urgency: comparison.preview.riskLevel === 'critical' ? 'act-before-preview' : 'time-sensitive',
      tone: 'warning',
      copy: `${comparison.preview.label} augmente le risque: agir avant la bascule saisonnière si possible.`,
    };
  }

  if (comparison.current.riskLevel === 'critical' || comparison.preview.riskLevel === 'critical') {
    return {
      direction: 'time-sensitive',
      urgency: 'avoid-delay',
      tone: 'danger',
      copy: `Risque critique stable sur ${comparison.preview.label}: garder l’action sous surveillance immédiate.`,
    };
  }

  if (comparison.current.anomaly !== comparison.preview.anomaly) {
    return {
      direction: comparison.preview.anomaly ? 'riskier' : 'safer',
      urgency: comparison.preview.anomaly ? 'watch-preview' : 'opportunistic',
      tone: comparison.preview.anomaly ? 'warning' : 'positive',
      copy: comparison.preview.anomaly
        ? `${comparison.preview.label} ajoute l’anomalie ${comparison.preview.anomaly}: préparer une marge de sécurité.`
        : `${comparison.preview.label} lève l’anomalie actuelle: fenêtre plus lisible pour agir.`,
    };
  }

  return {
    direction: 'steady',
    urgency: 'normal',
    tone: 'neutral',
    copy: `${comparison.preview.label} ne change pas le niveau de risque climatique pour cette province.`,
  };
}

function buildSelectedClimateTimingRecommendation(comparison) {
  if (comparison.state === 'no-selection') {
    return {
      state: 'no-selection',
      compact: true,
      relevant: false,
      copy: 'Sélectionnez une province pour afficher le timing climat.',
    };
  }

  if (comparison.state === 'missing-climate-data') {
    return {
      state: 'missing-climate-data',
      compact: true,
      relevant: false,
      regionId: comparison.regionId,
      copy: 'Pas de recommandation climat: données indisponibles pour cette province.',
    };
  }

  if (comparison.state === 'no-preview') {
    return {
      state: 'current-only',
      compact: true,
      relevant: comparison.current.riskLevel !== 'stable' || comparison.current.anomaly !== null,
      regionId: comparison.regionId,
      direction: comparison.current.riskLevel === 'critical' ? 'time-sensitive' : 'steady',
      urgency: comparison.current.riskLevel === 'critical' ? 'avoid-delay' : 'normal',
      tone: comparison.current.riskLevel === 'critical'
        ? 'danger'
        : comparison.current.riskLevel === 'strained' || comparison.current.anomaly !== null
          ? 'warning'
          : 'neutral',
      copy: comparison.current.riskLevel === 'stable' && comparison.current.anomaly === null
        ? 'Timing climat normal: aucune contrainte notable pour cette province.'
        : `${comparison.current.label}: tenir compte du risque ${comparison.current.riskLevel} avant d’agir.`,
    };
  }

  const signal = getPrimaryClimateTimingSignal(comparison);

  return {
    state: 'ready',
    compact: true,
    relevant: signal.direction !== 'steady' || comparison.current.riskLevel !== 'stable',
    regionId: comparison.regionId,
    currentSeason: comparison.current.season,
    previewSeason: comparison.preview.season,
    currentRiskLevel: comparison.current.riskLevel,
    previewRiskLevel: comparison.preview.riskLevel,
    direction: signal.direction,
    urgency: signal.urgency,
    tone: signal.tone,
    copy: signal.copy,
  };
}

function buildMitigationChoice(choiceId, label, effect, timing, tone, linkedSignals) {
  return {
    choiceId,
    label,
    effect,
    timing,
    tone,
    compact: true,
    placement: 'province-panel-compact',
    obscuresMap: false,
    linkedSignals,
  };
}

function buildSelectedClimateMitigationChoices(comparison, timingRecommendation) {
  if (comparison.state === 'no-selection') {
    return {
      state: 'no-selection',
      compact: true,
      choices: [],
      copy: 'Sélectionnez une province pour afficher les réponses climat.',
    };
  }

  if (comparison.state === 'missing-climate-data') {
    return {
      state: 'missing-climate-data',
      compact: true,
      regionId: comparison.regionId,
      choices: [],
      copy: 'Aucune mitigation climat proposée: données indisponibles.',
    };
  }

  const current = comparison.current;
  const preview = comparison.preview ?? null;
  const activeRiskLevel = preview?.riskLevel ?? current.riskLevel;
  const activeAnomaly = preview?.anomaly ?? current.anomaly;
  const previewLabel = preview?.label ?? current.label;
  const linkedSignals = {
    legendKeys: [
      `season:${current.season}`,
      ...(preview ? [`season-preview:${preview.season}`] : []),
      ...(activeAnomaly ? [`anomaly:${activeAnomaly}`] : []),
    ],
    previewSeason: preview?.season ?? null,
    timingDirection: timingRecommendation.direction ?? 'steady',
  };

  if (current.riskLevel === 'stable' && !activeAnomaly && activeRiskLevel === 'stable') {
    return {
      state: 'not-needed',
      compact: true,
      regionId: comparison.regionId,
      choices: [
        buildMitigationChoice(
          'wait-monitor',
          'Attendre et surveiller',
          'Conserve les ressources tant que le risque reste bas.',
          `${previewLabel}: pas de mitigation active nécessaire.`,
          'neutral',
          linkedSignals,
        ),
      ],
      copy: 'Risque climat bas: surveiller sans mobiliser.',
    };
  }

  const choices = [];

  if (activeRiskLevel === 'critical' || current.riskLevel === 'critical') {
    choices.push(buildMitigationChoice(
      'evacuate-risk-zones',
      'Évacuer les zones exposées',
      'Réduit les pertes civiles et l’instabilité si le risque culmine.',
      `${previewLabel}: priorité immédiate avant aggravation saisonnière.`,
      'danger',
      linkedSignals,
    ));
  }

  if (activeAnomaly === 'drought' || current.anomaly === 'heatwave' || activeRiskLevel !== 'stable') {
    choices.push(buildMitigationChoice(
      'irrigate-reserves',
      'Irriguer et rationner',
      'Protège les récoltes et limite la pression logistique.',
      `${previewLabel}: utile avant le pic de sécheresse/chaleur.`,
      'warning',
      linkedSignals,
    ));
  }

  if (activeAnomaly === 'storm' || activeAnomaly === 'flood' || activeRiskLevel === 'critical') {
    choices.push(buildMitigationChoice(
      'fortify-routes',
      'Fortifier routes et abris',
      'Réduit les ruptures de circulation et sécurise les marqueurs clés.',
      `${previewLabel}: préparer avant les perturbations visibles sur la carte.`,
      'warning',
      linkedSignals,
    ));
  }

  choices.push(buildMitigationChoice(
    'stockpile-supplies',
    'Stocker des vivres',
    'Augmente la marge de sécurité pour population, armée et récoltes.',
    timingRecommendation.urgency === 'wait-for-preview'
      ? `${previewLabel}: stocker maintenant, agir quand la fenêtre devient plus sûre.`
      : `${previewLabel}: réserve courte avant décision provinciale.`,
    activeRiskLevel === 'critical' ? 'danger' : 'warning',
    linkedSignals,
  ));

  const uniqueChoices = [...new Map(choices.map((choice) => [choice.choiceId, choice])).values()].slice(0, 3);

  return {
    state: 'ready',
    compact: true,
    regionId: comparison.regionId,
    choices: uniqueChoices,
    copy: uniqueChoices.map((choice) => choice.label).join(' · '),
  };
}

const MITIGATION_RECOVERY_BASE_DAYS = Object.freeze({
  'wait-monitor': 7,
  'evacuate-risk-zones': 10,
  'irrigate-reserves': 14,
  'fortify-routes': 18,
  'stockpile-supplies': 12,
});

const MITIGATION_RECOVERY_EFFECTS = Object.freeze({
  'wait-monitor': {
    stability: 'stable',
    harvestImpact: 'neutre',
    logisticsImpact: 'neutre',
    relapseBias: 0,
  },
  'evacuate-risk-zones': {
    stability: 'guarded',
    harvestImpact: 'récoltes ralenties',
    logisticsImpact: 'mobilité civile sécurisée',
    relapseBias: -1,
  },
  'irrigate-reserves': {
    stability: 'improving',
    harvestImpact: 'récoltes protégées',
    logisticsImpact: 'ravitaillement sous tension',
    relapseBias: -2,
  },
  'fortify-routes': {
    stability: 'guarded',
    harvestImpact: 'récoltes exposées',
    logisticsImpact: 'routes stabilisées',
    relapseBias: -1,
  },
  'stockpile-supplies': {
    stability: 'cautious',
    harvestImpact: 'réserves amorties',
    logisticsImpact: 'stock local renforcé',
    relapseBias: 0,
  },
});

function clampRecoveryDays(days) {
  return Math.max(3, Math.min(30, days));
}

function getRelapseRisk(score) {
  if (score >= 3) {
    return 'high';
  }

  if (score >= 1) {
    return 'medium';
  }

  return 'low';
}

function getRecoveryConfidence(comparison, forecastEntries) {
  if (comparison.state === 'not-needed') {
    return 'high';
  }

  if (forecastEntries.some((entry) => entry.relapseRisk === 'high')) {
    return 'medium';
  }

  return comparison.state === 'ready' ? 'medium' : 'high';
}

function buildRecoveryEntry(choice, comparison, timingRecommendation) {
  const current = comparison.current;
  const preview = comparison.preview ?? null;
  const activeRiskLevel = preview?.riskLevel ?? current.riskLevel;
  const activeAnomaly = preview?.anomaly ?? current.anomaly;
  const riskScore = getClimateRiskScore(activeRiskLevel);
  const effects = MITIGATION_RECOVERY_EFFECTS[choice.choiceId] ?? MITIGATION_RECOVERY_EFFECTS['stockpile-supplies'];
  const baseDays = MITIGATION_RECOVERY_BASE_DAYS[choice.choiceId] ?? 12;
  const anomalyDelay = activeAnomaly === 'drought' || activeAnomaly === 'flood' ? 4 : activeAnomaly ? 2 : 0;
  const timingDelay = timingRecommendation.direction === 'riskier'
    ? 3
    : timingRecommendation.direction === 'safer'
      ? -2
      : 0;
  const recoveryDays = clampRecoveryDays(baseDays + (riskScore * 3) + anomalyDelay + timingDelay);
  const relapseRisk = getRelapseRisk(riskScore + anomalyDelay / 3 + effects.relapseBias);
  const nextCriticalSeason = preview?.label ?? current.label;

  return {
    choiceId: choice.choiceId,
    label: choice.label,
    recoveryWindowDays: recoveryDays,
    expectedStability: effects.stability,
    harvestImpact: effects.harvestImpact,
    logisticsImpact: effects.logisticsImpact,
    relapseRisk,
    nextCriticalSeason,
    confidence: relapseRisk === 'high' ? 'medium' : 'high',
    summary: `${choice.label}: récupération ~${recoveryDays}j, rechute ${relapseRisk} avant ${nextCriticalSeason}.`,
  };
}

function pickRecoverySummary(forecastEntries) {
  const relapseRank = { low: 0, medium: 1, high: 2 };
  const stabilityRank = { stable: 0, improving: 1, cautious: 2, guarded: 3 };
  const sortedBySafety = forecastEntries
    .slice()
    .sort((left, right) => {
      const relapseComparison = relapseRank[left.relapseRisk] - relapseRank[right.relapseRisk];

      if (relapseComparison !== 0) {
        return relapseComparison;
      }

      return left.recoveryWindowDays - right.recoveryWindowDays;
    });
  const sortedByCaution = forecastEntries
    .slice()
    .sort((left, right) => {
      const stabilityComparison = stabilityRank[right.expectedStability] - stabilityRank[left.expectedStability];

      if (stabilityComparison !== 0) {
        return stabilityComparison;
      }

      return right.recoveryWindowDays - left.recoveryWindowDays;
    });
  const sortedByRisk = forecastEntries
    .slice()
    .sort((left, right) => {
      const relapseComparison = relapseRank[right.relapseRisk] - relapseRank[left.relapseRisk];

      if (relapseComparison !== 0) {
        return relapseComparison;
      }

      return right.recoveryWindowDays - left.recoveryWindowDays;
    });

  return {
    bestMitigation: sortedBySafety[0]?.choiceId ?? null,
    prudentOption: sortedByCaution[0]?.choiceId ?? null,
    riskyOption: sortedByRisk[0]?.choiceId ?? null,
  };
}

function buildSelectedClimateRecoveryForecast(comparison, timingRecommendation, mitigationChoices) {
  if (mitigationChoices.state === 'no-selection') {
    return {
      state: 'no-selection',
      compact: true,
      forecasts: [],
      copy: 'Sélectionnez une province pour voir la récupération climat.',
    };
  }

  if (mitigationChoices.state === 'missing-climate-data') {
    return {
      state: 'missing-climate-data',
      compact: true,
      regionId: mitigationChoices.regionId,
      forecasts: [],
      copy: 'Forecast indisponible: données climat manquantes.',
    };
  }

  const forecasts = mitigationChoices.choices
    .map((choice) => buildRecoveryEntry(choice, comparison, timingRecommendation))
    .sort((left, right) => {
      if (left.recoveryWindowDays !== right.recoveryWindowDays) {
        return left.recoveryWindowDays - right.recoveryWindowDays;
      }

      return left.choiceId.localeCompare(right.choiceId);
    });
  const summary = pickRecoverySummary(forecasts);
  const confidence = mitigationChoices.state === 'not-needed'
    ? 'high'
    : getRecoveryConfidence(comparison, forecasts);

  return {
    state: mitigationChoices.state === 'not-needed' ? 'stable' : 'ready',
    compact: true,
    regionId: mitigationChoices.regionId,
    confidence,
    summary: {
      ...summary,
      confidence,
    },
    forecasts,
    copy: forecasts.length > 0
      ? `Récupération estimée: ${forecasts[0].label} en ~${forecasts[0].recoveryWindowDays}j.`
      : 'Aucune récupération climat à prévoir.',
  };
}

function buildSelectedClimateImpactComparison(regions, options, seasonPreview) {
  const selectedRegionId = normalizeSelectedRegionId(options);

  if (!selectedRegionId) {
    return {
      state: 'no-selection',
      compact: true,
      copy: 'Sélectionnez une province pour comparer son climat.',
    };
  }

  const region = regions.find((candidate) => candidate.regionId === selectedRegionId);

  if (!region) {
    return {
      state: 'missing-climate-data',
      compact: true,
      regionId: selectedRegionId,
      copy: 'Aucune donnée climat disponible pour cette province.',
    };
  }

  if (!seasonPreview?.active) {
    return {
      state: 'no-preview',
      compact: true,
      regionId: selectedRegionId,
      current: {
        season: region.season,
        label: region.seasonLabel,
        riskLevel: region.strategicImpact,
        anomaly: region.anomaly,
        summary: summarizeRegionClimate(region),
      },
      copy: `${region.seasonLabel}: ${region.strategicImpact}`,
    };
  }

  const previewImpacts = normalizePreviewImpacts(options, seasonPreview);
  const previewImpact = previewImpacts[selectedRegionId] ?? {};
  const previewRiskLevel = String(previewImpact.riskLevel ?? previewImpact.strategicImpact ?? region.strategicImpact).trim()
    || region.strategicImpact;
  const previewAnomaly = previewImpact.anomaly === undefined ? region.anomaly : previewImpact.anomaly;
  const previewSummary = String(previewImpact.summary ?? `${seasonPreview.label}: ${previewRiskLevel}`).trim()
    || `${seasonPreview.label}: ${previewRiskLevel}`;

  return {
    state: 'ready',
    compact: true,
    regionId: selectedRegionId,
    current: {
      season: region.season,
      label: region.seasonLabel,
      riskLevel: region.strategicImpact,
      anomaly: region.anomaly,
      summary: summarizeRegionClimate(region),
    },
    preview: {
      season: seasonPreview.season,
      label: seasonPreview.label,
      riskLevel: previewRiskLevel,
      anomaly: previewAnomaly,
      summary: previewSummary,
      projected: true,
    },
    delta: {
      seasonChanged: region.season !== seasonPreview.season,
      riskChanged: region.strategicImpact !== previewRiskLevel,
      anomalyChanged: region.anomaly !== previewAnomaly,
    },
    copy: `${region.seasonLabel} ${region.strategicImpact} → ${seasonPreview.label} ${previewRiskLevel}`,
  };
}

function buildReadabilityProfile(options) {
  const selectedOverlayId = options.selectedOverlayId ?? options.activeOverlaySlot ?? options.activeOverlayId;
  const overlaySelected = options.overlaySelected
    ?? (selectedOverlayId === undefined ? true : selectedOverlayId === 'climate-overlay');
  const density = overlaySelected ? 'readable' : 'reduced';

  return {
    overlaySelected: Boolean(overlaySelected),
    density,
    seasonWashOpacity: density === 'reduced'
      ? { stable: 0.06, strained: 0.1, critical: 0.12 }
      : { stable: 0.1, strained: 0.14, critical: 0.16 },
    anomalyOpacity: density === 'reduced' ? 0.46 : 0.68,
    catastropheRingOpacityBoost: density === 'reduced' ? 0.02 : 0.08,
    atmosphereOpacity: density === 'reduced' ? 0.24 : 0.38,
  };
}

function getImpactOpacity(region, readabilityProfile) {
  if (region.strategicImpact === 'critical') {
    return readabilityProfile.seasonWashOpacity.critical;
  }

  if (region.strategicImpact === 'strained') {
    return readabilityProfile.seasonWashOpacity.strained;
  }

  return readabilityProfile.seasonWashOpacity.stable;
}

function buildCatastropheZones(catastropheEntries, readabilityProfile) {
  return [...new Map(catastropheEntries
    .map((entry) => [entry.catastropheId, entry]))
    .values()]
    .sort((left, right) => left.catastropheId.localeCompare(right.catastropheId))
    .map((entry) => {
      const regionIds = catastropheEntries
        .filter((candidate) => candidate.catastropheId === entry.catastropheId)
        .map((candidate) => candidate.regionId)
        .sort((left, right) => left.localeCompare(right));

      return {
        zoneId: `zone:${entry.catastropheId}`,
        catastropheId: entry.catastropheId,
        type: entry.type,
        severity: entry.severity,
        status: entry.status,
        label: entry.label,
        regionIds,
        outline: {
          stroke: entry.style.stroke,
          pattern: 'ring',
          opacity: Math.min(0.72, entry.style.opacity + 0.12),
        },
        fill: {
          color: entry.style.fill,
          opacity: readabilityProfile.density === 'reduced'
            ? Math.max(0.05, entry.style.opacity - 0.3)
            : Math.max(0.08, entry.style.opacity - 0.22),
        },
      };
    });
}

function buildTurnProgression(state, progressionByRegion) {
  const progression = progressionByRegion[state.regionId] ?? null;

  if (!progression) {
    return null;
  }

  return {
    seasonChanged: progression.seasonChanged,
    temperatureDelta: progression.temperatureDelta,
    precipitationDelta: progression.precipitationDelta,
    droughtDelta: progression.droughtDelta,
    summary: progression.summary,
  };
}

function buildTacticalClimateTheme(regions, catastropheEntries, readabilityProfile) {
  const criticalCount = regions.filter((region) => region.strategicImpact === 'critical').length;

  return {
    visualMode: 'tactical-dark',
    className: 'climate-hud climate-hud--pax-dark',
    palette: {
      background: '#020817',
      glass: 'rgba(3, 10, 22, 0.72)',
      border: 'rgba(125, 211, 252, 0.24)',
      accent: criticalCount > 0 ? '#f59e0b' : '#67e8f9',
      danger: '#fb7185',
      text: '#e2e8f0',
    },
    layers: {
      regionFill: readabilityProfile.density === 'reduced'
        ? 'reduced-season-hints'
        : 'low-opacity-season-wash',
      anomalyGlyphs: readabilityProfile.density === 'reduced'
        ? 'edge-pinned-alert-dots'
        : 'minimal-cyan-amber-markers',
      catastropheRings: catastropheEntries.length > 0 ? 'thin-glowing-alert-rings' : 'standby-grid',
      coordinateGrid: true,
    },
    panel: {
      surface: 'frosted-glass',
      density: 'compact',
      typography: 'technical-sans',
    },
  };
}

function buildSeasonVisualEffect(region, stateEntry, readabilityProfile) {
  return {
    effectId: `${region.regionId}:season-wash`,
    regionId: region.regionId,
    kind: 'season-wash',
    layer: 'atmosphere-base',
    season: region.season,
    tone: stateEntry?.tone ?? 'info',
    accent: stateEntry?.badge?.accent ?? 'slate',
    vector: {
      primitive: 'soft-gradient-field',
      blendMode: 'screen',
      opacity: getImpactOpacity(region, readabilityProfile),
      labelSafe: true,
    },
  };
}


function buildSeasonPreviewVisualEffect(region, seasonPreview, readabilityProfile) {
  if (!seasonPreview?.active || region.season === seasonPreview.season) {
    return null;
  }

  return {
    effectId: `${region.regionId}:season-preview:${seasonPreview.season}`,
    regionId: region.regionId,
    kind: 'season-preview',
    layer: 'atmosphere-preview',
    currentSeason: region.season,
    previewSeason: seasonPreview.season,
    tone: seasonPreview.badge.tone,
    accent: seasonPreview.badge.accent,
    vector: {
      primitive: 'thin-edge-halo',
      blendMode: 'screen',
      opacity: readabilityProfile.density === 'reduced' ? 0.18 : 0.28,
      strokeDasharray: '1.2 1.8',
      labelSafe: true,
      placement: {
        anchor: 'province-edge',
        avoid: ['province-label', 'province-marker', 'province-border'],
        priority: 'tertiary',
      },
    },
    summary: `${region.seasonLabel} → ${seasonPreview.label}`,
  };
}

function buildAnomalyVisualEffect(entry, readabilityProfile) {
  return {
    effectId: `${entry.regionId}:anomaly-glyph:${entry.label}`,
    regionId: entry.regionId,
    kind: 'anomaly-glyph',
    layer: 'atmosphere-alerts',
    anomaly: entry.label,
    tone: entry.tone,
    accent: entry.marker.accent,
    vector: {
      primitive: 'minimal-orbital-glyph',
      icon: entry.marker.icon,
      stroke: entry.marker.accent,
      animation: readabilityProfile.density === 'reduced' ? 'none' : 'slow-scan-pulse',
      opacity: readabilityProfile.anomalyOpacity,
      placement: {
        anchor: 'province-edge',
        avoid: ['province-label', 'province-marker'],
        priority: 'secondary',
      },
    },
  };
}

function buildCatastropheVisualEffect(entry, readabilityProfile) {
  return {
    effectId: `${entry.regionId}:catastrophe-ring:${entry.catastropheId}`,
    regionId: entry.regionId,
    kind: 'catastrophe-ring',
    layer: 'atmosphere-alerts',
    catastropheId: entry.catastropheId,
    severity: entry.severity,
    tone: entry.severity === 'critical' ? 'danger' : 'warning',
    vector: {
      primitive: entry.status === 'active' ? 'pulsing-contour-ring' : 'dashed-warning-contour',
      stroke: entry.style.stroke,
      fill: entry.style.fill,
      opacity: Math.min(0.74, entry.style.opacity + readabilityProfile.catastropheRingOpacityBoost),
      fillOpacity: readabilityProfile.density === 'reduced' ? 0.04 : 0.08,
      labelSafe: true,
    },
  };
}

function buildAtmosphericSignal(region, readabilityProfile) {
  const intensity = region.strategicImpact === 'critical'
    ? 'high'
    : region.strategicImpact === 'strained'
      ? 'medium'
      : 'low';

  return {
    effectId: `${region.regionId}:atmospheric-signal`,
    regionId: region.regionId,
    kind: 'atmospheric-signal',
    layer: 'coordinate-grid',
    intensity,
    vector: {
      primitive: 'wind-line-field',
      density: readabilityProfile.density === 'reduced'
        ? 'sparse'
        : intensity === 'high'
          ? 'measured'
          : intensity === 'medium'
            ? 'light'
            : 'sparse',
      color: intensity === 'high' ? 'amber' : 'cyan',
      opacity: readabilityProfile.atmosphereOpacity,
      labelSafe: true,
    },
    summary: `${region.seasonLabel}, ${region.strategicImpact}`,
  };
}

function buildClimateVisualEffects(regions, stateEntries, catastropheEntries, readabilityProfile, seasonPreview) {
  const seasonEntriesByRegion = new Map(stateEntries
    .filter((entry) => entry.kind === 'season')
    .map((entry) => [entry.regionId, entry]));

  return [
    ...regions.map((region) => buildSeasonVisualEffect(
      region,
      seasonEntriesByRegion.get(region.regionId),
      readabilityProfile,
    )),
    ...stateEntries
      .filter((entry) => entry.kind === 'anomaly')
      .map((entry) => buildAnomalyVisualEffect(entry, readabilityProfile)),
    ...catastropheEntries.map((entry) => buildCatastropheVisualEffect(entry, readabilityProfile)),
    ...regions
      .map((region) => buildSeasonPreviewVisualEffect(region, seasonPreview, readabilityProfile))
      .filter(Boolean),
    ...regions.map((region) => buildAtmosphericSignal(region, readabilityProfile)),
  ].sort((left, right) => {
    const regionComparison = left.regionId.localeCompare(right.regionId);

    if (regionComparison !== 0) {
      return regionComparison;
    }

    return left.effectId.localeCompare(right.effectId);
  });
}

function buildRegionalRiskMode(regions) {
  return regions.map((region) => ({
    regionId: region.regionId,
    riskLevel: region.strategicImpact,
    anomaly: region.anomaly,
    activeCatastropheIds: region.activeCatastropheIds,
    signals: region.strategicSignals,
    highlight: {
      tone: region.strategicImpact === 'critical'
        ? 'danger'
        : region.strategicImpact === 'strained'
          ? 'warning'
          : 'calm',
      emphasis: region.strategicImpact === 'critical' ? 'strong' : 'soft',
    },
    summary: `${region.seasonLabel}, ${region.strategicSignals.summary}`,
  }));
}


function normalizeRegionGeometryById(options) {
  return requireObject(
    options.regionGeometryById ?? options.provinceGeometryById ?? {},
    'ClimateMapOverlay regionGeometryById',
  );
}

function getRegionCenter(regionId, regionGeometryById) {
  const geometry = regionGeometryById[regionId] ?? {};
  const center = geometry.center ?? geometry.labelLayout ?? null;

  if (!center || !Number.isFinite(center.x) || !Number.isFinite(center.y)) {
    return null;
  }

  return { x: center.x, y: center.y };
}


function normalizeAnomalyTooltipByRegion(options) {
  return requireObject(
    options.anomalyTooltipByRegion ?? options.anomalyTooltipsByRegion ?? {},
    'ClimateMapOverlay anomalyTooltipByRegion',
  );
}

function describeAnomalyCause(anomaly) {
  const anomalyType = normalizeAnomalyType(anomaly);

  return {
    heatwave: 'température élevée et pression sèche',
    drought: 'sécheresse prolongée et précipitations basses',
    storm: 'front instable et vents violents',
    flood: 'excès de pluie et saturation des sols',
    frost: 'froid tardif et gel local',
  }[anomalyType] ?? 'signal climatique régional anormal';
}

function describeAnomalyImpact(anomaly) {
  const anomalyType = normalizeAnomalyType(anomaly);

  return {
    heatwave: 'récoltes fragiles, routes exposées, coût de mitigation accru',
    drought: 'réserves et récoltes sous pression, attendre ou irriguer avant dépense',
    storm: 'routes et opérations sensibles risquent une interruption',
    flood: 'logistique et stabilité locale demandent une mitigation rapide',
    frost: 'production et timing saisonnier deviennent moins fiables',
  }[anomalyType] ?? 'vérifier la province avant d’engager une action coûteuse';
}

function buildAnomalyTooltip(entry, region, seasonPreview, anomalyTooltipByRegion) {
  const override = anomalyTooltipByRegion[entry.regionId] ?? {};
  const windowLabel = override.window
    ?? override.timeWindow
    ?? (seasonPreview?.active ? `maintenant → ${seasonPreview.label}` : 'tour actuel');

  return {
    title: `Anomalie: ${entry.label}`,
    cause: String(override.cause ?? describeAnomalyCause(entry.label)).trim(),
    window: String(windowLabel).trim(),
    playerImpact: String(override.playerImpact ?? override.impact ?? describeAnomalyImpact(entry.label)).trim(),
    riskLevel: region?.strategicImpact ?? 'strained',
  };
}

function normalizeConfidenceBand(value) {
  const band = String(value ?? '').trim().toLowerCase();

  if (['probable', 'uncertain', 'extreme'].includes(band)) {
    return band;
  }

  return null;
}

function inferConfidenceBand(region, previewImpact, previewRiskLevel, previewAnomaly) {
  const explicitBand = normalizeConfidenceBand(previewImpact.confidenceBand ?? previewImpact.confidence?.band);

  if (explicitBand) {
    return explicitBand;
  }

  const numericConfidence = Number(previewImpact.confidence ?? previewImpact.probability);

  if (Number.isFinite(numericConfidence)) {
    if (numericConfidence >= 0.75) {
      return 'probable';
    }

    if (numericConfidence < 0.45) {
      return 'uncertain';
    }
  }

  if (previewRiskLevel === 'critical' && (region.strategicImpact === 'critical' || previewAnomaly)) {
    return 'extreme';
  }

  return 'uncertain';
}

function buildClimateMapLayers(regions, stateEntries, catastropheEntries, seasonPreview, regionGeometryById, anomalyTooltipByRegion, resilienceMarkers = []) {
  const seasonEntriesByRegion = new Map(stateEntries
    .filter((entry) => entry.kind === 'season')
    .map((entry) => [entry.regionId, entry]));
  const anomalyEntriesByRegion = new Map(stateEntries
    .filter((entry) => entry.kind === 'anomaly')
    .map((entry) => [entry.regionId, entry]));
  const catastrophesByRegion = catastropheEntries.reduce((map, entry) => {
    const bucket = map.get(entry.regionId) ?? [];
    bucket.push(entry);
    map.set(entry.regionId, bucket);
    return map;
  }, new Map());

  const seasonSurfaces = regions.map((region) => {
    const seasonEntry = seasonEntriesByRegion.get(region.regionId);
    const center = getRegionCenter(region.regionId, regionGeometryById);

    return {
      regionId: region.regionId,
      layerId: `${region.regionId}:climate-season-surface`,
      kind: 'season-surface',
      season: region.season,
      label: region.seasonLabel,
      tone: seasonEntry?.tone ?? 'info',
      accent: seasonEntry?.badge?.accent ?? 'slate',
      riskLevel: region.strategicImpact,
      geometry: {
        center,
        shape: regionGeometryById[region.regionId]?.shape ?? null,
        polygon: regionGeometryById[region.regionId]?.polygon ?? null,
      },
      style: {
        fill: seasonEntry?.badge?.accent ?? 'slate',
        opacity: region.strategicImpact === 'critical' ? 0.16 : region.strategicImpact === 'strained' ? 0.12 : 0.08,
      },
      ariaLabel: `${region.regionId}: saison ${region.seasonLabel}, risque ${region.strategicImpact}`,
    };
  });

  const climateLabels = regions.map((region) => {
    const seasonEntry = seasonEntriesByRegion.get(region.regionId);
    const anomalyEntry = anomalyEntriesByRegion.get(region.regionId) ?? null;
    const regionalCatastrophes = catastrophesByRegion.get(region.regionId) ?? [];
    const center = getRegionCenter(region.regionId, regionGeometryById);
    const alertBadges = [
      anomalyEntry ? {
        kind: 'anomaly',
        label: anomalyEntry.label,
        icon: anomalyEntry.marker.icon,
        tone: anomalyEntry.tone,
      } : null,
      ...regionalCatastrophes.map((entry) => ({
        kind: 'catastrophe',
        label: entry.label,
        icon: entry.style.icon,
        tone: entry.severity === 'critical' ? 'danger' : 'warning',
      })),
    ].filter(Boolean);

    return {
      regionId: region.regionId,
      layerId: `${region.regionId}:climate-label`,
      text: region.seasonLabel,
      meta: region.strategicSignals.summary,
      x: center?.x ?? null,
      y: center?.y ?? null,
      tone: region.strategicImpact === 'critical' ? 'danger' : region.strategicImpact === 'strained' ? 'warning' : seasonEntry?.tone ?? 'calm',
      badges: [
        {
          kind: 'season',
          label: region.seasonLabel,
          icon: seasonEntry?.badge?.icon ?? '◐',
          tone: seasonEntry?.tone ?? 'info',
        },
        ...alertBadges,
      ],
      ariaLabel: `${region.regionId}: ${region.seasonLabel}; ${region.strategicSignals.summary}`,
      placement: {
        anchor: center ? 'region-center' : 'region-label-slot',
        avoid: ['province-name', 'front-line', 'route-label'],
        priority: region.strategicImpact === 'critical' ? 'primary' : 'secondary',
      },
    };
  });

  const anomalyMarkers = [...anomalyEntriesByRegion.values()].map((entry) => {
    const center = getRegionCenter(entry.regionId, regionGeometryById);
    const region = regions.find((candidate) => candidate.regionId === entry.regionId) ?? null;

    return {
      regionId: entry.regionId,
      layerId: `${entry.regionId}:climate-anomaly-marker:${entry.label}`,
      kind: 'anomaly-marker',
      label: entry.label,
      icon: entry.marker.icon,
      tone: entry.tone,
      accent: entry.marker.accent,
      x: center?.x ?? null,
      y: center?.y ?? null,
      placement: 'edge-pinned',
      ariaLabel: `${entry.regionId}: anomalie ${entry.label}`,
      tooltip: buildAnomalyTooltip(entry, region, seasonPreview, anomalyTooltipByRegion),
    };
  });

  const disasterRings = catastropheEntries.map((entry) => ({
    regionId: entry.regionId,
    layerId: `${entry.regionId}:climate-disaster-ring:${entry.catastropheId}`,
    kind: 'disaster-ring',
    catastropheId: entry.catastropheId,
    label: entry.label,
    severity: entry.severity,
    status: entry.status,
    stroke: entry.style.stroke,
    fill: entry.style.fill,
    icon: entry.style.icon,
    geometry: {
      center: getRegionCenter(entry.regionId, regionGeometryById),
      shape: regionGeometryById[entry.regionId]?.shape ?? null,
      polygon: regionGeometryById[entry.regionId]?.polygon ?? null,
    },
    ariaLabel: `${entry.regionId}: catastrophe ${entry.label}`,
  }));

  return {
    seasonSurfaces,
    climateLabels,
    anomalyMarkers,
    disasterRings,
    resilienceMarkers: resilienceMarkers.map((marker) => {
      const center = getRegionCenter(marker.regionId, regionGeometryById);

      return {
        ...marker,
        layerId: `${marker.regionId}:climate-resilience:${marker.markerId}`,
        kind: 'resilience-marker',
        x: center?.x ?? null,
        y: center?.y ?? null,
        placement: 'edge-recovery-badge',
        ariaLabel: `${marker.regionId}: résilience ${marker.resilienceState}, ${marker.label}`,
      };
    }),
    ...(seasonPreview?.active ? {
      seasonPreviewLabels: regions
        .filter((region) => region.season !== seasonPreview.season)
        .map((region) => ({
          regionId: region.regionId,
          layerId: `${region.regionId}:climate-preview-label:${seasonPreview.season}`,
          text: `${region.seasonLabel} → ${seasonPreview.label}`,
          tone: seasonPreview.badge.tone,
          icon: seasonPreview.badge.icon,
          placement: 'edge-halo-label',
        })),
    } : {}),
  };
}


function getClimateRiskRank(riskLevel) {
  return { stable: 0, strained: 1, critical: 2 }[riskLevel] ?? 0;
}


function normalizeAftermathSeverity(value, fallback = 'moderate') {
  const severity = String(value ?? fallback).trim().toLowerCase();

  if (['minor', 'moderate', 'major', 'critical'].includes(severity)) {
    return severity;
  }

  return fallback;
}

function normalizeResilienceState(value, fallback = 'recovering') {
  const state = String(value ?? fallback).trim().toLowerCase();

  if (['recovering', 'resilient', 'strained', 'regressing'].includes(state)) {
    return state;
  }

  return fallback;
}

function buildDefaultAftermathFromAlert(alert) {
  const appliedMitigation = alert.mitigationPreviews.find((preview) => preview.mode !== 'no-action') ?? null;
  const missingMitigation = alert.mitigationPreviews.find((preview) => preview.mode === 'no-action') ?? null;
  const resilienceState = alert.urgencyRank <= 1
    ? appliedMitigation ? 'recovering' : 'strained'
    : alert.urgencyRank === 2 ? 'resilient' : alert.urgencyRank === 3 ? 'strained' : 'recovering';

  return {
    eventId: `${alert.regionId}:forecast-aftermath`,
    regionIds: [alert.regionId],
    observedImpact: alert.playerImpact,
    severity: alert.previewRiskLevel === 'critical' ? 'major' : alert.previewRiskLevel === 'strained' ? 'moderate' : 'minor',
    appliedMitigation: appliedMitigation?.label ?? null,
    missingMitigation: missingMitigation ? missingMitigation.label : alert.urgencyRank <= 2 ? 'aucune mitigation renseignée' : null,
    confidenceBand: alert.confidenceBand,
    sourceAlertId: alert.regionId,
    resilienceState,
  };
}

function normalizeAftermathEvent(event, index, alertsByRegion) {
  const regionIds = requireArray(event.regionIds ?? event.affectedRegionIds ?? [event.regionId], 'ClimateMapOverlay aftermath regionIds')
    .map((regionId) => String(regionId).trim())
    .filter(Boolean);
  const firstRegionId = regionIds[0] ?? `region-${index + 1}`;
  const linkedAlert = alertsByRegion.get(firstRegionId) ?? null;
  const severity = normalizeAftermathSeverity(event.severity, linkedAlert?.previewRiskLevel === 'critical' ? 'major' : 'moderate');
  const resilienceState = normalizeResilienceState(
    event.resilienceState ?? event.recoveryState,
    event.mitigationApplied ?? event.appliedMitigation ? 'recovering' : severity === 'major' || severity === 'critical' ? 'strained' : 'resilient',
  );

  return {
    eventId: String(event.eventId ?? event.id ?? `${firstRegionId}:aftermath:${index + 1}`).trim(),
    observedImpact: String(event.observedImpact ?? event.impact ?? linkedAlert?.playerImpact ?? 'impact climatique observé').trim(),
    severity,
    affectedRegionIds: regionIds,
    appliedMitigation: event.appliedMitigation ?? event.mitigationApplied ?? null,
    missingMitigation: event.missingMitigation ?? event.mitigationMissing ?? null,
    confidenceBand: normalizeConfidenceBand(event.confidenceBand) ?? linkedAlert?.confidenceBand ?? 'uncertain',
    sourceAlertId: event.sourceAlertId ?? linkedAlert?.regionId ?? null,
    resilienceState,
  };
}


function normalizeSafeWindowState(value, fallback = 'risky') {
  const state = String(value ?? fallback).trim().toLowerCase();

  if (['safe', 'risky', 'critical'].includes(state)) {
    return state;
  }

  return fallback;
}

function inferSafeWindowState(event, marker, alert, offset) {
  if (offset === 0 && (event.severity === 'critical' || event.severity === 'major' || alert?.urgencyRank === 1)) {
    return 'critical';
  }

  if (event.resilienceState === 'recovering' || event.resilienceState === 'resilient') {
    return offset >= 2 || event.severity === 'minor' ? 'safe' : 'risky';
  }

  if (marker?.resilienceState === 'regressing' || event.resilienceState === 'regressing') {
    return offset <= 1 ? 'critical' : 'risky';
  }

  return offset >= 2 ? 'risky' : 'critical';
}

function buildSafeWindowTradeoff(windowState, confidenceBand) {
  if (windowState === 'safe') {
    return {
      now: 'reprendre avec coût réduit',
      wait: 'attendre conserve la marge mais retarde le gain',
      reinforceFirst: 'utile seulement si la confiance reste incertaine',
      recommendation: confidenceBand === 'uncertain' ? 'renforcer d’abord' : 'agir maintenant',
    };
  }

  if (windowState === 'risky') {
    return {
      now: 'possible mais avec coût ou rechute probable',
      wait: 'attendre améliore la lisibilité de la reprise',
      reinforceFirst: 'réduit le risque avant reprise',
      recommendation: confidenceBand === 'extreme' ? 'renforcer d’abord' : 'attendre',
    };
  }

  return {
    now: 'éviter sauf urgence stratégique',
    wait: 'attendre la stabilisation limite les pertes',
    reinforceFirst: 'priorité avant toute reprise',
    recommendation: 'renforcer d’abord',
  };
}

function buildDefaultSafeWindowsForEvent(event, markers, alertsByRegion) {
  const windows = ['tour actuel', 'prochain tour', 'saison suivante'];

  return windows.map((label, offset) => {
    const marker = markers.find((candidate) => event.affectedRegionIds.includes(candidate.regionId)) ?? null;
    const alert = event.sourceAlertId ? alertsByRegion.get(event.sourceAlertId) : null;
    const windowState = inferSafeWindowState(event, marker, alert, offset);
    const confidenceBand = event.confidenceBand ?? alert?.confidenceBand ?? 'uncertain';

    return {
      windowId: `${event.eventId}:window:${offset + 1}`,
      label,
      state: windowState,
      affectedRegionIds: [...event.affectedRegionIds],
      resilienceMarkerIds: markers
        .filter((candidate) => event.affectedRegionIds.includes(candidate.regionId))
        .map((candidate) => candidate.markerId),
      aftermathEventId: event.eventId,
      confidenceBand,
      actionTradeoff: buildSafeWindowTradeoff(windowState, confidenceBand),
    };
  });
}

function normalizeSafeWindowOverride(window, index, event, markers) {
  const state = normalizeSafeWindowState(window.state ?? window.safety ?? window.riskState);
  const confidenceBand = normalizeConfidenceBand(window.confidenceBand) ?? event.confidenceBand ?? 'uncertain';

  return {
    windowId: String(window.windowId ?? `${event.eventId}:window:${index + 1}`).trim(),
    label: String(window.label ?? window.turnLabel ?? `fenêtre ${index + 1}`).trim(),
    state,
    affectedRegionIds: requireArray(window.affectedRegionIds ?? window.regionIds ?? event.affectedRegionIds, 'ClimateMapOverlay safeWindow affectedRegionIds')
      .map((regionId) => String(regionId).trim())
      .filter(Boolean),
    resilienceMarkerIds: requireArray(
      window.resilienceMarkerIds ?? markers.map((marker) => marker.markerId),
      'ClimateMapOverlay safeWindow resilienceMarkerIds',
    ).map((markerId) => String(markerId).trim()).filter(Boolean),
    aftermathEventId: String(window.aftermathEventId ?? event.eventId).trim(),
    confidenceBand,
    actionTradeoff: {
      ...buildSafeWindowTradeoff(state, confidenceBand),
      ...requireObject(window.actionTradeoff ?? {}, 'ClimateMapOverlay safeWindow actionTradeoff'),
    },
  };
}

function buildClimateSafeWindowCalendar(climateAftermathRecap, climateAlerts, normalizedOptions) {
  const alertsByRegion = new Map(climateAlerts.map((alert) => [alert.regionId, alert]));
  const explicitWindows = Array.isArray(normalizedOptions.climateSafeWindows)
    ? normalizedOptions.climateSafeWindows
    : Array.isArray(normalizedOptions.safeClimateWindows)
      ? normalizedOptions.safeClimateWindows
      : null;

  if (climateAftermathRecap.events.length === 0) {
    return {
      title: 'Calendrier fenêtres climat sûres',
      fallback: 'Aucun récap post-catastrophe exploitable pour planifier une fenêtre sûre.',
      windows: [],
      summary: 'Aucune fenêtre climatique à afficher.',
    };
  }

  const windows = climateAftermathRecap.events.flatMap((event) => {
    const markers = climateAftermathRecap.resilienceMarkers
      .filter((marker) => event.affectedRegionIds.includes(marker.regionId));
    const eventOverrides = explicitWindows?.filter((window) => (window.aftermathEventId ?? event.eventId) === event.eventId) ?? [];

    return eventOverrides.length > 0
      ? eventOverrides.map((window, index) => normalizeSafeWindowOverride(window, index, event, markers))
      : buildDefaultSafeWindowsForEvent(event, markers, alertsByRegion);
  }).sort((left, right) => {
    const rank = { critical: 0, risky: 1, safe: 2 };

    return (rank[left.state] ?? 1) - (rank[right.state] ?? 1) || left.windowId.localeCompare(right.windowId);
  });

  return {
    title: 'Calendrier fenêtres climat sûres',
    fallback: null,
    windows,
    summary: `${windows.length} fenêtre(s) pour planifier reprise, attente ou renfort.`,
  };
}

function buildReadinessPrerequisites(window, event, markers) {
  const hasMitigation = Boolean(event.appliedMitigation);
  const missingMitigation = event.missingMitigation ?? 'renfort local non confirmé';
  const resilientMarkerCount = markers
    .filter((marker) => ['recovering', 'resilient'].includes(marker.resilienceState))
    .length;
  const residualRisk = window.state === 'safe' && window.confidenceBand !== 'uncertain'
    ? (event.severity === 'critical' ? 'élevé' : 'contenu')
    : window.confidenceBand === 'uncertain'
      ? 'incertain à vérifier'
      : 'élevé';

  return {
    reserve: event.severity === 'critical' || event.severity === 'major'
      ? 'réserve renforcée requise avant reprise'
      : 'réserve standard suffisante',
    mitigationActive: hasMitigation
      ? `active: ${event.appliedMitigation}`
      : `manquante: ${missingMitigation}`,
    localResilience: resilientMarkerCount === markers.length && markers.length > 0
      ? 'résilience locale suffisante'
      : 'résilience locale à consolider',
    minimalDelay: window.state === 'safe'
      ? `fenêtre exploitable: ${window.label}`
      : `attendre au moins ${window.label} ou renforcer avant action`,
    residualRisk,
  };
}

function inferReadinessStatus(window, event, prerequisites) {
  if (window.state === 'critical') {
    return 'discouraged';
  }

  if (window.confidenceBand === 'uncertain' || prerequisites.residualRisk !== 'contenu') {
    return 'nearly-ready';
  }

  if (!event.appliedMitigation || prerequisites.localResilience !== 'résilience locale suffisante') {
    return 'nearly-ready';
  }

  return window.state === 'safe' ? 'ready' : 'nearly-ready';
}

function buildReadinessAction(status, window) {
  if (status === 'ready') {
    return 'utiliser la fenêtre en gardant la réserve active';
  }

  if (status === 'nearly-ready') {
    return window.confidenceBand === 'uncertain'
      ? 'confirmer la prévision puis renforcer avant reprise'
      : 'compléter les prérequis avant d’engager l’action';
  }

  return 'déconseillé: renforcer et attendre une fenêtre moins exposée';
}

function normalizeRecoveryReadinessOverride(override, baseRecommendation) {
  const status = String(override.status ?? override.readinessStatus ?? baseRecommendation.status).trim().toLowerCase();

  return {
    ...baseRecommendation,
    ...override,
    recommendationId: String(override.recommendationId ?? baseRecommendation.recommendationId).trim(),
    windowId: String(override.windowId ?? baseRecommendation.windowId).trim(),
    aftermathEventId: String(override.aftermathEventId ?? baseRecommendation.aftermathEventId).trim(),
    resilienceMarkerIds: requireArray(
      override.resilienceMarkerIds ?? baseRecommendation.resilienceMarkerIds,
      'ClimateMapOverlay recoveryReadiness resilienceMarkerIds',
    ).map((markerId) => String(markerId).trim()).filter(Boolean),
    status: ['ready', 'nearly-ready', 'discouraged'].includes(status) ? status : baseRecommendation.status,
    prerequisites: {
      ...baseRecommendation.prerequisites,
      ...requireObject(override.prerequisites ?? {}, 'ClimateMapOverlay recoveryReadiness prerequisites'),
    },
    action: String(override.action ?? baseRecommendation.action).trim(),
    confidenceBand: normalizeConfidenceBand(override.confidenceBand) ?? baseRecommendation.confidenceBand,
  };
}

function buildClimateRecoveryReadiness(climateAftermathRecap, climateSafeWindowCalendar, normalizedOptions) {
  const eventsById = new Map(climateAftermathRecap.events.map((event) => [event.eventId, event]));
  const markersByEvent = new Map(climateAftermathRecap.events.map((event) => [
    event.eventId,
    climateAftermathRecap.resilienceMarkers.filter((marker) => event.affectedRegionIds.includes(marker.regionId)),
  ]));
  const explicitReadiness = Array.isArray(normalizedOptions.climateRecoveryReadiness)
    ? normalizedOptions.climateRecoveryReadiness
    : Array.isArray(normalizedOptions.climateReadinessRecommendations)
      ? normalizedOptions.climateReadinessRecommendations
      : [];

  if (climateSafeWindowCalendar.windows.length === 0) {
    return {
      title: 'Préparation reprise climat',
      fallback: 'Aucune fenêtre climatique sûre à qualifier.',
      recommendations: [],
      summary: 'Aucune recommandation de reprise climatique.',
    };
  }

  const recommendations = climateSafeWindowCalendar.windows.map((window) => {
    const event = eventsById.get(window.aftermathEventId);
    const markers = markersByEvent.get(window.aftermathEventId) ?? [];
    const prerequisites = event
      ? buildReadinessPrerequisites(window, event, markers)
      : {
        reserve: 'réserve à confirmer',
        mitigationActive: 'mitigation à confirmer',
        localResilience: 'résilience locale à vérifier',
        minimalDelay: `fenêtre à vérifier: ${window.label}`,
        residualRisk: 'incertain à vérifier',
      };
    const status = event ? inferReadinessStatus(window, event, prerequisites) : 'nearly-ready';
    const baseRecommendation = {
      recommendationId: `${window.windowId}:readiness`,
      windowId: window.windowId,
      aftermathEventId: window.aftermathEventId,
      resilienceMarkerIds: [...window.resilienceMarkerIds],
      status,
      confidenceBand: window.confidenceBand,
      prerequisites,
      action: buildReadinessAction(status, window),
    };
    const override = explicitReadiness.find((item) => (item.windowId ?? window.windowId) === window.windowId);

    return override ? normalizeRecoveryReadinessOverride(override, baseRecommendation) : baseRecommendation;
  }).sort((left, right) => {
    const rank = { discouraged: 0, 'nearly-ready': 1, ready: 2 };

    return (rank[left.status] ?? 1) - (rank[right.status] ?? 1) || left.recommendationId.localeCompare(right.recommendationId);
  });

  return {
    title: 'Préparation reprise climat',
    fallback: null,
    recommendations,
    summary: `${recommendations.length} recommandation(s) de préparation avant fenêtre climatique.`,
  };
}

function classifyClimatePriority(recommendation, window) {
  if (recommendation.status === 'ready' && recommendation.confidenceBand !== 'uncertain') {
    return 'act-now';
  }

  if (recommendation.status === 'discouraged') {
    return window?.state === 'critical' || recommendation.confidenceBand === 'uncertain' ? 'avoid' : 'defer';
  }

  if (recommendation.confidenceBand === 'uncertain') {
    return 'prepare-first';
  }

  return window?.state === 'safe' ? 'prepare-first' : 'defer';
}

function describeClimatePriorityReason(priority, recommendation, window) {
  if (priority === 'act-now') {
    return 'fenêtre exploitable avec prérequis readiness validés';
  }

  if (priority === 'prepare-first') {
    return recommendation.confidenceBand === 'uncertain'
      ? 'prévision incertaine: confirmer et renforcer avant engagement'
      : 'préparer les prérequis manquants avant d’utiliser la fenêtre';
  }

  if (priority === 'defer') {
    return `reporter: ${window?.label ?? 'fenêtre'} reste moins favorable ou trop coûteuse`;
  }

  return 'éviter pour ce tour: risque résiduel ou fenêtre critique trop exposée';
}

function buildClimateResourceConflicts(recommendation, window) {
  const conflicts = [];
  const prerequisites = recommendation.prerequisites ?? {};

  if (String(prerequisites.reserve ?? '').includes('renforcée') || String(prerequisites.reserve ?? '').includes('requise')) {
    conflicts.push('reserve');
  }

  if (String(prerequisites.mitigationActive ?? '').startsWith('manquante')) {
    conflicts.push('mitigation');
  }

  if (String(prerequisites.localResilience ?? '').includes('consolider')) {
    conflicts.push('local-resilience');
  }

  if (window?.state !== 'safe') {
    conflicts.push('window-timing');
  }

  if (String(prerequisites.residualRisk ?? '').includes('élevé') || String(prerequisites.residualRisk ?? '').includes('incertain')) {
    conflicts.push('residual-risk');
  }

  return [...new Set(conflicts)];
}

function normalizeClimatePriorityOverride(override, basePriority) {
  const priority = String(override.priority ?? basePriority.priority).trim().toLowerCase();

  return {
    ...basePriority,
    ...override,
    priorityId: String(override.priorityId ?? basePriority.priorityId).trim(),
    regionIds: requireArray(override.regionIds ?? basePriority.regionIds, 'ClimateMapOverlay climatePriority regionIds')
      .map((regionId) => String(regionId).trim())
      .filter(Boolean),
    priority: ['act-now', 'prepare-first', 'defer', 'avoid'].includes(priority) ? priority : basePriority.priority,
    windowId: String(override.windowId ?? basePriority.windowId).trim(),
    readinessRecommendationId: String(override.readinessRecommendationId ?? basePriority.readinessRecommendationId).trim(),
    resourceConflicts: requireArray(
      override.resourceConflicts ?? basePriority.resourceConflicts,
      'ClimateMapOverlay climatePriority resourceConflicts',
    ).map((conflict) => String(conflict).trim()).filter(Boolean),
    confidenceBand: normalizeConfidenceBand(override.confidenceBand) ?? basePriority.confidenceBand,
    reason: String(override.reason ?? basePriority.reason).trim(),
  };
}

function buildClimatePrioritySummary(climateSafeWindowCalendar, climateRecoveryReadiness, normalizedOptions) {
  const windowsById = new Map(climateSafeWindowCalendar.windows.map((window) => [window.windowId, window]));
  const explicitPriorities = Array.isArray(normalizedOptions.climatePrioritySummary)
    ? normalizedOptions.climatePrioritySummary
    : Array.isArray(normalizedOptions.climateCrossRegionPriorities)
      ? normalizedOptions.climateCrossRegionPriorities
      : [];

  if (climateRecoveryReadiness.recommendations.length === 0) {
    return {
      title: 'Synthèse priorités climat inter-régions',
      fallback: 'Aucune recommandation de readiness climat à agréger.',
      priorities: [],
      resourceConflicts: [],
      summary: 'Aucune priorité climatique inter-régions.',
    };
  }

  const priorities = climateRecoveryReadiness.recommendations.map((recommendation) => {
    const window = windowsById.get(recommendation.windowId);
    const priority = classifyClimatePriority(recommendation, window);
    const basePriority = {
      priorityId: `${recommendation.recommendationId}:priority`,
      regionIds: window?.affectedRegionIds ? [...window.affectedRegionIds] : [],
      priority,
      windowId: recommendation.windowId,
      readinessRecommendationId: recommendation.recommendationId,
      confidenceBand: recommendation.confidenceBand,
      resourceConflicts: buildClimateResourceConflicts(recommendation, window),
      reason: describeClimatePriorityReason(priority, recommendation, window),
    };
    const override = explicitPriorities.find((item) => (
      item.windowId ?? item.readinessRecommendationId ?? basePriority.windowId
    ) === basePriority.windowId || item.readinessRecommendationId === basePriority.readinessRecommendationId);

    return override ? normalizeClimatePriorityOverride(override, basePriority) : basePriority;
  }).sort((left, right) => {
    const rank = { 'act-now': 0, 'prepare-first': 1, defer: 2, avoid: 3 };

    return (rank[left.priority] ?? 2) - (rank[right.priority] ?? 2) || left.priorityId.localeCompare(right.priorityId);
  });

  const resourceConflicts = [...new Set(priorities.flatMap((priority) => priority.resourceConflicts))];
  const counts = priorities.reduce((acc, priority) => {
    acc[priority.priority] = (acc[priority.priority] ?? 0) + 1;
    return acc;
  }, {});

  return {
    title: 'Synthèse priorités climat inter-régions',
    fallback: null,
    priorities,
    resourceConflicts,
    summary: `${counts['act-now'] ?? 0} à agir, ${counts['prepare-first'] ?? 0} à préparer, ${counts.defer ?? 0} à reporter, ${counts.avoid ?? 0} à éviter.`,
  };
}


function buildClimateAftermathRecap(regions, climateAlerts, normalizedOptions) {
  const alertsByRegion = new Map(climateAlerts.map((alert) => [alert.regionId, alert]));
  const explicitEvents = Array.isArray(normalizedOptions.climateAftermathEvents)
    ? normalizedOptions.climateAftermathEvents
    : Array.isArray(normalizedOptions.aftermathEvents)
      ? normalizedOptions.aftermathEvents
      : null;
  const events = explicitEvents?.length
    ? explicitEvents.map((event, index) => normalizeAftermathEvent(event, index, alertsByRegion))
    : climateAlerts
      .filter((alert) => alert.urgencyRank <= 2 || alert.previewRiskLevel !== alert.currentRiskLevel || alert.previewAnomaly !== alert.currentAnomaly)
      .map(buildDefaultAftermathFromAlert)
      .map((event, index) => normalizeAftermathEvent(event, index, alertsByRegion));
  const regionIds = new Set(regions.map((region) => region.regionId));
  const resilienceMarkers = events.flatMap((event) => event.affectedRegionIds
    .filter((regionId) => regionIds.has(regionId))
    .map((regionId) => ({
      markerId: `${event.eventId}:${regionId}`,
      eventId: event.eventId,
      regionId,
      resilienceState: event.resilienceState,
      label: event.resilienceState === 'recovering'
        ? 'récupération en cours'
        : event.resilienceState === 'resilient'
          ? 'résilience renforcée'
          : event.resilienceState === 'regressing'
            ? 'résilience en recul'
            : 'résilience sous pression',
      severity: event.severity,
      confidenceBand: event.confidenceBand,
      tooltip: {
        observedImpact: event.observedImpact,
        mitigation: event.appliedMitigation
          ? `mitigation appliquée: ${event.appliedMitigation}`
          : event.missingMitigation
            ? `mitigation manquante: ${event.missingMitigation}`
            : 'mitigation non renseignée',
        confidenceBand: event.confidenceBand,
      },
    })));

  return {
    title: 'Récap climat après événement',
    fallback: events.length > 0 ? null : 'Aucun événement climatique récent à récapituler.',
    events,
    resilienceMarkers,
    summary: events.length > 0
      ? `${events.length} conséquence(s) climatique(s), ${resilienceMarkers.length} marqueur(s) de résilience.`
      : 'Aucune conséquence récente exploitable.',
  };
}


function normalizeForecastWindow(previewImpact, seasonPreview) {
  return String(
    previewImpact.window
      ?? previewImpact.timeWindow
      ?? previewImpact.forecastWindow
      ?? (seasonPreview?.active ? `maintenant → ${seasonPreview.label}` : 'tour actuel'),
  ).trim();
}

function normalizeForecastPlayerImpact(region, previewImpact, previewRiskLevel, previewAnomaly) {
  const explicitImpact = previewImpact.playerImpact ?? previewImpact.impact ?? previewImpact.decisionImpact;

  if (explicitImpact !== undefined) {
    return String(explicitImpact).trim();
  }

  if (previewRiskLevel === 'critical') {
    return 'décision de carte sensible: prioriser mitigation ou détour';
  }

  if (previewRiskLevel === 'strained' || previewAnomaly) {
    return 'préparer réserve ou vérifier routes/récoltes avant engagement';
  }

  if (region.strategicImpact === 'critical' && previewRiskLevel !== 'critical') {
    return 'amélioration prévue: conserver le plan si le timing le permet';
  }

  return 'aucun changement majeur: conserver le plan actuel';
}

function buildClimateUrgency(region, previewImpact, previewRiskLevel, previewAnomaly, confidenceBand, riskDelta, anomalyChanged) {
  const window = normalizeForecastWindow(previewImpact, previewImpact.seasonPreview ?? null);
  const immediateWindow = /maintenant|now|tour actuel|1\s*tour|imm[eé]diat/i.test(window);
  const highImpact = /priorit|mitigation|d[ée]tour|route|r[ée]colte|r[ée]serve|co[uû]t|fragile|sensible/i.test(
    normalizeForecastPlayerImpact(region, previewImpact, previewRiskLevel, previewAnomaly),
  );

  if (confidenceBand === 'extreme' || (previewRiskLevel === 'critical' && (immediateWindow || highImpact))) {
    return {
      urgencyRank: 1,
      urgency: 'act-now',
      urgencyLabel: 'agir maintenant',
      microAction: 'déplacer priorité',
    };
  }

  if (confidenceBand === 'probable' && (riskDelta > 0 || previewRiskLevel === 'strained' || highImpact)) {
    return {
      urgencyRank: 2,
      urgency: 'prepare',
      urgencyLabel: 'préparer',
      microAction: 'préparer réserve',
    };
  }

  if (anomalyChanged || riskDelta !== 0 || confidenceBand === 'uncertain') {
    return {
      urgencyRank: 3,
      urgency: 'monitor',
      urgencyLabel: 'surveiller',
      microAction: 'attendre confirmation',
    };
  }

  return {
    urgencyRank: 4,
    urgency: 'ignore-now',
    urgencyLabel: 'ignorer pour l’instant',
    microAction: 'conserver plan',
  };
}


function normalizeCollateralCost(value, fallback = 'medium') {
  const cost = String(value ?? fallback).trim().toLowerCase();

  if (['none', 'low', 'medium', 'high'].includes(cost)) {
    return cost;
  }

  return fallback;
}

function normalizeRiskImpact(value, fallback) {
  const impact = String(value ?? fallback).trim();

  return impact || fallback;
}

function normalizeMitigationPreview(preview, index, alertContext) {
  const mode = String(preview.mode ?? preview.kind ?? `custom-${index + 1}`).trim();
  const label = String(preview.label ?? mode).trim();

  return {
    previewId: String(preview.previewId ?? `${alertContext.regionId}:mitigation:${mode}`).trim(),
    mode,
    label,
    expectedTiming: String(preview.expectedTiming ?? preview.timing ?? alertContext.timeWindow).trim(),
    riskImpact: normalizeRiskImpact(preview.riskImpact ?? preview.expectedRiskImpact, alertContext.defaultRiskImpact),
    confidenceBand: normalizeConfidenceBand(preview.confidenceBand) ?? alertContext.confidenceBand,
    urgencyRank: alertContext.urgencyRank,
    collateralCost: normalizeCollateralCost(preview.collateralCost ?? preview.cost, alertContext.defaultCollateralCost),
    playerImpact: String(preview.playerImpact ?? alertContext.playerImpact).trim(),
  };
}

function buildDefaultMitigationPreviews(alertContext) {
  if (alertContext.urgencyRank === 1) {
    return [
      {
        previewId: `${alertContext.regionId}:mitigation:immediate`,
        mode: 'immediate-mitigation',
        label: 'mitiger maintenant',
        expectedTiming: alertContext.timeWindow,
        riskImpact: alertContext.previewRiskLevel === 'critical' ? 'réduit le risque critique vers tendu' : 'réduit le risque avant impact',
        confidenceBand: alertContext.confidenceBand,
        urgencyRank: alertContext.urgencyRank,
        collateralCost: 'high',
        playerImpact: alertContext.playerImpact,
      },
      {
        previewId: `${alertContext.regionId}:mitigation:delayed`,
        mode: 'delayed-mitigation',
        label: 'préparer puis agir',
        expectedTiming: 'prochain tour',
        riskImpact: 'réduction partielle si la fenêtre reste ouverte',
        confidenceBand: alertContext.confidenceBand === 'extreme' ? 'uncertain' : alertContext.confidenceBand,
        urgencyRank: alertContext.urgencyRank + 1,
        collateralCost: 'medium',
        playerImpact: 'préserve des ressources mais laisse un risque intermédiaire',
      },
      {
        previewId: `${alertContext.regionId}:mitigation:no-action`,
        mode: 'no-action',
        label: 'ne rien changer',
        expectedTiming: alertContext.timeWindow,
        riskImpact: 'aucune réduction: risque inchangé ou aggravé',
        confidenceBand: alertContext.confidenceBand,
        urgencyRank: 4,
        collateralCost: 'none',
        playerImpact: 'conserve le plan mais accepte le risque signalé',
      },
    ];
  }

  if (alertContext.urgencyRank === 2) {
    return [
      {
        previewId: `${alertContext.regionId}:mitigation:reserve`,
        mode: 'reserve-prep',
        label: 'préparer réserve',
        expectedTiming: alertContext.timeWindow,
        riskImpact: 'réduit le risque attendu sans déplacer toute la priorité',
        confidenceBand: alertContext.confidenceBand,
        urgencyRank: alertContext.urgencyRank,
        collateralCost: 'medium',
        playerImpact: alertContext.playerImpact,
      },
      {
        previewId: `${alertContext.regionId}:mitigation:no-action`,
        mode: 'no-action',
        label: 'surveiller sans dépense',
        expectedTiming: alertContext.timeWindow,
        riskImpact: 'aucune réduction avant confirmation',
        confidenceBand: alertContext.confidenceBand,
        urgencyRank: 4,
        collateralCost: 'none',
        playerImpact: 'garde les ressources mais expose le plan à la bascule',
      },
    ];
  }

  if (alertContext.urgencyRank === 3) {
    return [
      {
        previewId: `${alertContext.regionId}:mitigation:confirm`,
        mode: 'confirm-first',
        label: 'attendre confirmation',
        expectedTiming: alertContext.timeWindow,
        riskImpact: 'évite une dépense inutile tant que le signal reste incertain',
        confidenceBand: alertContext.confidenceBand,
        urgencyRank: alertContext.urgencyRank,
        collateralCost: 'low',
        playerImpact: alertContext.playerImpact,
      },
    ];
  }

  return [
    {
      previewId: `${alertContext.regionId}:mitigation:keep-plan`,
      mode: 'no-action',
      label: 'conserver plan',
      expectedTiming: alertContext.timeWindow,
      riskImpact: 'aucune mitigation nécessaire pour l’instant',
      confidenceBand: alertContext.confidenceBand,
      urgencyRank: alertContext.urgencyRank,
      collateralCost: 'none',
      playerImpact: alertContext.playerImpact,
    },
  ];
}

function buildClimateMitigationPreviews(region, previewImpact, alertContext) {
  const explicitPreviews = Array.isArray(previewImpact.mitigationPreviews)
    ? previewImpact.mitigationPreviews
    : Array.isArray(previewImpact.mitigations)
      ? previewImpact.mitigations
      : null;
  const normalizedContext = {
    ...alertContext,
    regionId: region.regionId,
    defaultRiskImpact: alertContext.previewRiskLevel === 'critical'
      ? 'réduit le risque critique attendu'
      : 'réduit le risque attendu',
    defaultCollateralCost: alertContext.urgencyRank <= 1 ? 'high' : alertContext.urgencyRank === 2 ? 'medium' : 'low',
  };

  if (explicitPreviews?.length) {
    return explicitPreviews.map((preview, index) => normalizeMitigationPreview(preview, index, normalizedContext));
  }

  return buildDefaultMitigationPreviews(normalizedContext);
}

function buildClimateAlert(region, previewImpact, previewRiskLevel, previewAnomaly, seasonPreview) {
  const riskDelta = getClimateRiskRank(previewRiskLevel) - getClimateRiskRank(region.strategicImpact);
  const anomalyChanged = region.anomaly !== previewAnomaly;
  const confidenceBand = inferConfidenceBand(region, previewImpact, previewRiskLevel, previewAnomaly);
  const timeWindow = normalizeForecastWindow(previewImpact, seasonPreview);
  const playerImpact = normalizeForecastPlayerImpact(region, previewImpact, previewRiskLevel, previewAnomaly);
  const urgency = buildClimateUrgency(
    region,
    { ...previewImpact, seasonPreview },
    previewRiskLevel,
    previewAnomaly,
    confidenceBand,
    riskDelta,
    anomalyChanged,
  );

  const alertContext = {
    regionId: region.regionId,
    currentRiskLevel: region.strategicImpact,
    previewRiskLevel,
    currentAnomaly: region.anomaly,
    previewAnomaly,
    confidenceBand,
    timeWindow,
    playerImpact,
    ...urgency,
  };

  return {
    ...alertContext,
    mitigationPreviews: buildClimateMitigationPreviews(region, previewImpact, alertContext),
  };
}

function buildClimateTimeline(regions, seasonPreview, normalizedOptions, seasonLabels) {
  const previewImpacts = seasonPreview?.active ? normalizePreviewImpacts(normalizedOptions, seasonPreview) : {};
  const frames = [
    {
      frameId: 'now',
      label: 'Maintenant',
      active: !seasonPreview?.active,
      projected: false,
      seasonLabels: [...new Set(regions.map((region) => region.seasonLabel))].sort(),
      summary: `${regions.length} provinces lisibles au climat actuel`,
    },
  ];

  if (seasonPreview?.active) {
    frames.push({
      frameId: 'next-season',
      label: seasonPreview.label,
      active: true,
      projected: true,
      season: seasonPreview.season,
      seasonLabel: seasonLabels[seasonPreview.season] ?? seasonPreview.label,
      summary: `${seasonPreview.label}: prévision légère, sans simulation complète`,
    });
  }

  const climateAlerts = seasonPreview?.active
    ? regions.map((region) => {
      const previewImpact = previewImpacts[region.regionId] ?? {};
      const previewRiskLevel = String(previewImpact.riskLevel ?? previewImpact.strategicImpact ?? region.strategicImpact).trim()
        || region.strategicImpact;
      const previewAnomaly = previewImpact.anomaly === undefined ? region.anomaly : previewImpact.anomaly;

      return buildClimateAlert(region, previewImpact, previewRiskLevel, previewAnomaly, seasonPreview);
    }).sort((left, right) => left.urgencyRank - right.urgencyRank || left.regionId.localeCompare(right.regionId))
    : [];

  const decisionChangingRegions = climateAlerts
    .filter((alert) => alert.currentRiskLevel !== alert.previewRiskLevel || alert.currentAnomaly !== alert.previewAnomaly)
    .map((alert) => {
      const riskDelta = getClimateRiskRank(alert.previewRiskLevel) - getClimateRiskRank(alert.currentRiskLevel);

      return {
        ...alert,
        changeType: riskDelta > 0 ? 'risk-increases' : riskDelta < 0 ? 'risk-decreases' : 'anomaly-changes',
        decisionHint: riskDelta > 0
          ? 'agir avant la bascule si la province porte une action sensible'
          : riskDelta < 0
            ? 'attendre la fenêtre prévue peut réduire le coût'
            : 'vérifier l’anomalie avant d’engager récoltes ou routes',
        tone: riskDelta > 0 ? 'warning' : riskDelta < 0 ? 'positive' : 'info',
      };
    });

  return {
    mode: seasonPreview?.active ? 'now-next-scrubber' : 'static-current-climate',
    compact: true,
    control: {
      controlId: 'climate-timeline-scrubber',
      label: seasonPreview?.active ? `Maintenant → ${seasonPreview.label}` : 'Climat actuel',
      enabled: Boolean(seasonPreview?.active),
      steps: frames.map((frame) => ({
        frameId: frame.frameId,
        label: frame.label,
        projected: frame.projected,
      })),
      fallback: seasonPreview?.active ? null : 'Aucune prévision disponible: affichage statique des saisons, anomalies et désastres actuels.',
    },
    frames,
    decisionChangingRegions,
    climateAlerts,
    alertSummary: {
      fallback: seasonPreview?.active ? null : 'Fallback statique: aucune prévision exploitable pour classer les alertes.',
      buckets: [
        { urgencyRank: 1, urgency: 'act-now', label: 'agir maintenant', microAction: 'déplacer priorité' },
        { urgencyRank: 2, urgency: 'prepare', label: 'préparer', microAction: 'préparer réserve' },
        { urgencyRank: 3, urgency: 'monitor', label: 'surveiller', microAction: 'attendre confirmation' },
        { urgencyRank: 4, urgency: 'ignore-now', label: 'ignorer pour l’instant', microAction: 'conserver plan' },
      ],
    },
    clarity: {
      anomalyLevels: [
        { level: 'none', label: 'aucune anomalie', decisionWeight: 'normal' },
        { level: 'warning', label: 'anomalie active', decisionWeight: 'surveiller récoltes/routes' },
        { level: 'danger', label: 'anomalie forte', decisionWeight: 'éviter dépenses fragiles' },
      ],
      disasterLevels: [
        { level: 'minor', label: 'désastre mineur', decisionWeight: 'coût local' },
        { level: 'major', label: 'désastre majeur', decisionWeight: 'planifier mitigation' },
        { level: 'critical', label: 'désastre critique', decisionWeight: 'priorité stratégique' },
      ],
      confidenceBands: [
        { band: 'probable', label: 'probable', meaning: 'donnée cohérente avec les signaux actuels' },
        { band: 'uncertain', label: 'incertain', meaning: 'prévision utile mais à confirmer avant engagement coûteux' },
        { band: 'extreme', label: 'extrême', meaning: 'risque critique ou catastrophe à traiter comme priorité' },
      ],
      copy: decisionChangingRegions.length > 0
        ? `${decisionChangingRegions.length} province(s) changent assez pour peser sur une décision.`
        : seasonPreview?.active
          ? 'Prévision stable: aucun changement majeur de risque ou anomalie.'
          : 'Fallback statique: aucune donnée de prévision fournie.',
    },
  };
}

function buildLegend(stateEntries, catastropheEntries, seasonLabels, seasonPreview) {
  const seasonLegend = [...new Set(stateEntries
    .filter((entry) => entry.kind === 'season')
    .map((entry) => entry.season))]
    .sort()
    .map((season) => {
      const seasonEntry = stateEntries.find((entry) => entry.kind === 'season' && entry.season === season);

      return {
        key: `season:${season}`,
        kind: 'season',
        season,
        label: seasonLabels[season] ?? season,
        tone: seasonEntry?.tone ?? 'info',
        icon: seasonEntry?.badge?.icon ?? '◐',
        accent: seasonEntry?.badge?.accent ?? 'slate',
        description: 'Saison dominante affichée pour une région.',
      };
    });

  const anomalyLegend = [...new Map(stateEntries
    .filter((entry) => entry.kind === 'anomaly')
    .map((entry) => [entry.label, {
      key: `anomaly:${entry.label}`,
      kind: 'anomaly',
      label: entry.label,
      tone: entry.tone,
      icon: entry.marker.icon,
      accent: entry.marker.accent,
      description: 'Anomalie climatique active sur la région.',
    }]))
    .entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, legendEntry]) => legendEntry);

  const catastropheLegend = [...new Map(catastropheEntries
    .map((entry) => [entry.severity, {
      key: `catastrophe:${entry.severity}`,
      kind: 'catastrophe',
      severity: entry.severity,
      label: entry.severity,
      icon: entry.style.icon,
      color: entry.style.fill,
      description: 'Catastrophe active ou imminente visible sur la carte.',
    }]))
    .entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, legendEntry]) => legendEntry);

  const previewLegend = seasonPreview?.active ? [{
    key: `season-preview:${seasonPreview.season}`,
    kind: 'season-preview',
    season: seasonPreview.season,
    label: seasonPreview.label,
    tone: seasonPreview.badge.tone,
    icon: seasonPreview.badge.icon,
    accent: seasonPreview.badge.accent,
    description: 'Aperçu saisonnier projeté en halo léger sans couvrir les provinces.',
  }] : [];

  return {
    title: 'Légende climat',
    compact: true,
    items: [
      ...seasonLegend,
      ...previewLegend,
      ...anomalyLegend,
      ...catastropheLegend,
    ],
  };
}

export function buildClimateMapOverlay(climateStates, options = {}) {
  const states = requireArray(climateStates, 'ClimateMapOverlay climateStates').map(normalizeClimateState);
  const normalizedOptions = requireObject(options, 'ClimateMapOverlay options');
  const seasonLabels = requireObject(normalizedOptions.seasonLabels ?? {}, 'ClimateMapOverlay seasonLabels');
  const seasonStyleByType = {
    ...DEFAULT_SEASON_STYLE_BY_TYPE,
    ...requireObject(normalizedOptions.seasonStyleByType ?? {}, 'ClimateMapOverlay seasonStyleByType'),
  };
  const anomalyStyleByType = {
    ...DEFAULT_ANOMALY_STYLE_BY_TYPE,
    ...requireObject(normalizedOptions.anomalyStyleByType ?? {}, 'ClimateMapOverlay anomalyStyleByType'),
  };
  const progressionByRegion = requireObject(normalizedOptions.progressionByRegion ?? {}, 'ClimateMapOverlay progressionByRegion');
  const regionGeometryById = normalizeRegionGeometryById(normalizedOptions);
  const anomalyTooltipByRegion = normalizeAnomalyTooltipByRegion(normalizedOptions);
  const tacticalHud = Boolean(normalizedOptions.tacticalHud);
  const visualEffects = Boolean(normalizedOptions.visualEffects);
  const readabilityProfile = buildReadabilityProfile(normalizedOptions);
  const seasonPreview = normalizeSeasonPreview(normalizedOptions, seasonLabels, seasonStyleByType);
  const catastropheEntries = buildCatastropheMapOverlay(
    normalizedOptions.catastrophes ?? [],
    { styleBySeverity: normalizedOptions.styleBySeverity ?? {}, tacticalHud },
  ).map((entry) => ({
    ...entry,
    kind: 'catastrophe',
  }));

  const stateEntries = states
    .slice()
    .sort((left, right) => left.regionId.localeCompare(right.regionId))
    .flatMap((state) => {
      const entries = [buildSeasonEntry(state, seasonLabels, seasonStyleByType)];
      const anomalyEntry = buildAnomalyEntry(state, anomalyStyleByType);

      if (anomalyEntry) {
        entries.push(anomalyEntry);
      }

      return entries;
    });

  const regions = states
    .slice()
    .sort((left, right) => left.regionId.localeCompare(right.regionId))
    .map((state) => {
      const regionalCatastrophes = catastropheEntries.filter((entry) => entry.regionId === state.regionId);

      const strategicSignals = buildStrategicSignals(state, regionalCatastrophes);

      return {
        regionId: state.regionId,
        season: state.season,
        seasonLabel: seasonLabels[state.season] ?? state.season,
        anomaly: state.anomaly,
        activeCatastropheIds: regionalCatastrophes.map((entry) => entry.catastropheId),
        strategicImpact: buildStrategicImpact(state, regionalCatastrophes),
        strategicSignals,
        turnProgression: buildTurnProgression(state, progressionByRegion),
        temperatureC: state.temperatureC,
        precipitationLevel: state.precipitationLevel,
        droughtIndex: state.droughtIndex,
      };
    });

  const climateTimeline = buildClimateTimeline(regions, seasonPreview, normalizedOptions, seasonLabels);
  const climateAftermathRecap = buildClimateAftermathRecap(regions, climateTimeline.climateAlerts, normalizedOptions);
  const climateSafeWindowCalendar = buildClimateSafeWindowCalendar(
    climateAftermathRecap,
    climateTimeline.climateAlerts,
    normalizedOptions,
  );
  const climateRecoveryReadiness = buildClimateRecoveryReadiness(
    climateAftermathRecap,
    climateSafeWindowCalendar,
    normalizedOptions,
  );
  const climatePrioritySummary = buildClimatePrioritySummary(
    climateSafeWindowCalendar,
    climateRecoveryReadiness,
    normalizedOptions,
  );
  const selectedClimateImpactComparison = buildSelectedClimateImpactComparison(regions, normalizedOptions, seasonPreview);
  const selectedClimateTimingRecommendation = buildSelectedClimateTimingRecommendation(selectedClimateImpactComparison);
  const selectedClimateMitigationChoices = buildSelectedClimateMitigationChoices(
    selectedClimateImpactComparison,
    selectedClimateTimingRecommendation,
  );

  return {
    title: 'Carte climat et catastrophes',
    summary: `${states.length} régions, ${catastropheEntries.length} catastrophes visibles, ${regions.filter((region) => region.anomaly !== null).length} anomalies`,
    entries: [...stateEntries, ...catastropheEntries].sort((left, right) => {
      const regionComparison = left.regionId.localeCompare(right.regionId);

      if (regionComparison !== 0) {
        return regionComparison;
      }

      return left.overlayId.localeCompare(right.overlayId);
    }),
    regions,
    seasonalPanel: buildSeasonSummary(states, seasonLabels, seasonStyleByType),
    catastropheZones: buildCatastropheZones(catastropheEntries, readabilityProfile),
    regionalRiskMode: buildRegionalRiskMode(regions),
    mapLayers: buildClimateMapLayers(
      regions,
      stateEntries,
      catastropheEntries,
      seasonPreview,
      regionGeometryById,
      anomalyTooltipByRegion,
      climateAftermathRecap.resilienceMarkers,
    ),
    climateTimeline,
    ...(climateAftermathRecap.events.length > 0 ? {
      climateAftermathRecap,
      climateSafeWindowCalendar,
      climateRecoveryReadiness,
      climatePrioritySummary,
    } : {}),
    selectedClimateImpactComparison,
    selectedClimateTimingRecommendation,
    selectedClimateMitigationChoices,
    selectedClimateRecoveryForecast: buildSelectedClimateRecoveryForecast(
      selectedClimateImpactComparison,
      selectedClimateTimingRecommendation,
      selectedClimateMitigationChoices,
    ),
    ...(seasonPreview?.active ? { seasonPreview: buildSeasonPreviewPanel(states, seasonPreview, seasonLabels) } : {}),
    legend: buildLegend(stateEntries, catastropheEntries, seasonLabels, seasonPreview),
    ...(!readabilityProfile.overlaySelected ? {
      reducedState: {
        reason: 'climate-overlay-inactive',
        density: readabilityProfile.density,
        preservedSignals: ['critical-catastrophe-rings', 'edge-pinned-anomaly-dots'],
      },
    } : {}),
    ...(tacticalHud ? { tacticalTheme: buildTacticalClimateTheme(regions, catastropheEntries, readabilityProfile) } : {}),
    ...(visualEffects ? {
      visualEffects: buildClimateVisualEffects(regions, stateEntries, catastropheEntries, readabilityProfile, seasonPreview),
    } : {}),
    metrics: {
      regionCount: states.length,
      seasonCount: states.length,
      anomalyCount: stateEntries.filter((entry) => entry.kind === 'anomaly').length,
      catastropheCount: catastropheEntries.length,
      criticalRegionCount: regions.filter((region) => region.strategicImpact === 'critical').length,
      logisticsRiskRegionCount: regions.filter((region) => region.strategicSignals.logisticsRisk !== 'low').length,
      stabilityRiskRegionCount: regions.filter((region) => region.strategicSignals.stabilityRisk !== 'low').length,
      harvestRiskRegionCount: regions.filter((region) => region.strategicSignals.harvestRisk !== 'low').length,
    },
  };
}
