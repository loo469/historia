import { Catastrophe } from '../../domain/climate/Catastrophe.js';
import { ClimateState } from '../../domain/climate/ClimateState.js';
import { Myth } from '../../domain/climate/Myth.js';

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

  return new ClimateState(requireObject(climateState, 'MythicClimateHud climateState'));
}

function normalizeCatastrophe(catastrophe) {
  if (catastrophe instanceof Catastrophe) {
    return catastrophe;
  }

  return new Catastrophe(requireObject(catastrophe, 'MythicClimateHud catastrophe'));
}

function normalizeMyth(myth) {
  if (myth instanceof Myth) {
    return myth;
  }

  return new Myth(requireObject(myth, 'MythicClimateHud myth'));
}

function buildSeverityTone(severity) {
  if (severity === 'critical') return 'critical-red';
  if (severity === 'major') return 'amber-warning';
  return 'cyan-watch';
}

function buildDisasterWarningCard(catastrophe) {
  return {
    cardId: `warning:${catastrophe.id}`,
    type: catastrophe.type,
    severity: catastrophe.severity,
    status: catastrophe.status,
    regionIds: catastrophe.regionIds,
    title: `${catastrophe.type} · ${catastrophe.severity}`,
    description: catastrophe.description,
    tone: buildSeverityTone(catastrophe.severity),
    icon: catastrophe.severity === 'critical' ? '⚠' : catastrophe.severity === 'major' ? '▲' : '△',
    surface: {
      className: `mythic-climate-warning mythic-climate-warning--${catastrophe.severity}`,
      background: 'rgba(3, 10, 22, 0.76)',
      border: catastrophe.severity === 'critical' ? 'rgba(251, 113, 133, 0.5)' : 'rgba(251, 191, 36, 0.36)',
      backdropFilter: 'blur(18px) saturate(1.2)',
    },
    signal: {
      glyph: catastrophe.status === 'active' ? 'pulsing-alert-glyph' : 'warning-standby-glyph',
      contour: catastrophe.severity === 'critical' ? 'double-glow-ring' : 'thin-amber-ring',
      label: catastrophe.status === 'active' ? 'Actif' : 'Préavis',
    },
    impact: { ...catastrophe.impact },
  };
}

function buildMythCard(myth) {
  return {
    cardId: `myth:${myth.id}`,
    mythId: myth.id,
    title: myth.title,
    category: myth.category,
    status: myth.status,
    summary: myth.summary,
    credibility: myth.credibility,
    regionIds: myth.regions,
    originEventIds: myth.originEventIds,
    tone: myth.category === 'catastrophe' ? 'amber-omen' : 'cyan-omen',
    icon: myth.category === 'catastrophe' ? '◆' : '◇',
    surface: {
      className: `mythic-climate-card mythic-climate-card--${myth.category}`,
      background: 'linear-gradient(180deg, rgba(8, 15, 28, 0.76), rgba(3, 7, 18, 0.84))',
      border: myth.category === 'catastrophe' ? 'rgba(251, 191, 36, 0.34)' : 'rgba(103, 232, 249, 0.28)',
      backdropFilter: 'blur(18px) saturate(1.16)',
    },
    typography: {
      titleTransform: 'uppercase-tracked',
      density: 'compact-lore',
    },
  };
}

function buildClimateReadout(climateState, seasonLabels) {
  const seasonLabel = seasonLabels[climateState.season] ?? climateState.season;
  const riskLevel = climateState.activeCatastropheIds.length > 0 || climateState.droughtIndex >= 60
    ? 'critical'
    : climateState.hasAnomaly() || climateState.precipitationLevel < 25
      ? 'watched'
      : 'stable';

  return {
    regionId: climateState.regionId,
    title: `HUD climat · ${seasonLabel}`,
    riskLevel,
    anomaly: climateState.anomaly,
    readings: [
      { key: 'temperature', label: 'Température', value: `${climateState.temperatureC}°C` },
      { key: 'precipitation', label: 'Précip.', value: `${climateState.precipitationLevel}/100` },
      { key: 'drought', label: 'Sécheresse', value: `${climateState.droughtIndex}/100` },
    ],
    surface: {
      className: `mythic-climate-readout mythic-climate-readout--${riskLevel}`,
      background: 'rgba(3, 10, 22, 0.72)',
      border: riskLevel === 'critical' ? 'rgba(251, 191, 36, 0.42)' : 'rgba(125, 211, 252, 0.24)',
      backdropFilter: 'blur(18px) saturate(1.18)',
    },
  };
}

export function buildMythicClimateHud({ climateState, catastrophes = [], myths = [], seasonLabels = {} } = {}) {
  const normalizedClimateState = normalizeClimateState(climateState);
  const normalizedCatastrophes = requireArray(catastrophes, 'MythicClimateHud catastrophes')
    .map(normalizeCatastrophe)
    .filter((catastrophe) => !catastrophe.isResolved)
    .sort((left, right) => left.id.localeCompare(right.id));
  const normalizedMyths = requireArray(myths, 'MythicClimateHud myths')
    .map(normalizeMyth)
    .sort((left, right) => left.id.localeCompare(right.id));
  const normalizedSeasonLabels = requireObject(seasonLabels, 'MythicClimateHud seasonLabels');
  const disasterWarnings = normalizedCatastrophes.map(buildDisasterWarningCard);
  const mythCards = normalizedMyths.map(buildMythCard);

  return {
    title: 'HUD climat mythique',
    summary: `${disasterWarnings.length} alertes catastrophe, ${mythCards.length} récits climatiques`,
    visualMode: 'pax-historia-dark-mythic',
    layout: {
      className: 'mythic-climate-hud mythic-climate-hud--frosted',
      panelSurface: 'semi-transparent-frosted-glass',
      grid: 'compact-alert-and-lore-columns',
      iconography: 'clean-vector-glyphs',
    },
    palette: {
      background: '#020817',
      glass: 'rgba(3, 10, 22, 0.72)',
      cyan: '#67e8f9',
      amber: '#fbbf24',
      danger: '#fb7185',
      text: '#e2e8f0',
    },
    climateReadout: buildClimateReadout(normalizedClimateState, normalizedSeasonLabels),
    disasterWarnings,
    mythCards,
    metrics: {
      warningCount: disasterWarnings.length,
      activeWarningCount: normalizedCatastrophes.filter((catastrophe) => catastrophe.status === 'active').length,
      mythCount: mythCards.length,
      canonizedMythCount: normalizedMyths.filter((myth) => myth.status === 'canonized').length,
    },
  };
}
