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

  const selectedClimateImpactComparison = buildSelectedClimateImpactComparison(regions, normalizedOptions, seasonPreview);
  const selectedClimateTimingRecommendation = buildSelectedClimateTimingRecommendation(selectedClimateImpactComparison);

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
    selectedClimateImpactComparison,
    selectedClimateTimingRecommendation,
    selectedClimateMitigationChoices: buildSelectedClimateMitigationChoices(
      selectedClimateImpactComparison,
      selectedClimateTimingRecommendation,
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
