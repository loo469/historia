import { Catastrophe } from '../../domain/climate/Catastrophe.js';

const DEFAULT_STYLE_BY_SEVERITY = Object.freeze({
  minor: { stroke: 'yellow', fill: 'yellow', opacity: 0.3, icon: '△' },
  major: { stroke: 'orange', fill: 'orange', opacity: 0.4, icon: '▲' },
  critical: { stroke: 'crimson', fill: 'crimson', opacity: 0.5, icon: '⚠' },
  default: { stroke: 'slate', fill: 'slate', opacity: 0.25, icon: '•' },
});

function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function normalizeCatastrophe(catastrophe) {
  if (catastrophe instanceof Catastrophe) {
    return catastrophe;
  }

  if (catastrophe === null || typeof catastrophe !== 'object' || Array.isArray(catastrophe)) {
    throw new TypeError('CatastropheMapOverlay catastrophes must be Catastrophe instances or plain objects.');
  }

  return new Catastrophe(catastrophe);
}

function normalizeStyle(styleBySeverity, severity) {
  const style = styleBySeverity[severity] ?? styleBySeverity.default ?? DEFAULT_STYLE_BY_SEVERITY.default;

  return {
    stroke: String(style.stroke ?? DEFAULT_STYLE_BY_SEVERITY[severity]?.stroke ?? 'slate').trim() || 'slate',
    fill: String(style.fill ?? DEFAULT_STYLE_BY_SEVERITY[severity]?.fill ?? 'slate').trim() || 'slate',
    opacity: Number.isFinite(style.opacity) ? Math.max(0, Math.min(1, style.opacity)) : (DEFAULT_STYLE_BY_SEVERITY[severity]?.opacity ?? 0.25),
    icon: String(style.icon ?? DEFAULT_STYLE_BY_SEVERITY[severity]?.icon ?? '•').trim() || '•',
  };
}

function buildTacticalHudStyle(catastrophe, style) {
  const alertTone = catastrophe.severity === 'critical'
    ? 'critical-red'
    : catastrophe.severity === 'major'
      ? 'amber-warning'
      : 'cyan-watch';

  return {
    visualMode: 'tactical-dark',
    panelClassName: `climate-disaster-card climate-disaster-card--${catastrophe.severity}`,
    surface: {
      background: 'rgba(3, 10, 22, 0.74)',
      border: `1px solid ${style.stroke}`,
      backdropFilter: 'blur(18px) saturate(1.18)',
      gridOverlay: 'coordinate-grid',
    },
    alertTone,
    glyph: {
      icon: style.icon,
      frame: catastrophe.status === 'active' ? 'pulsing-ring' : 'thin-warning-ring',
      color: style.fill,
    },
    typography: {
      family: 'technical-sans',
      labelTransform: 'uppercase-tracked',
    },
  };
}

export function buildCatastropheMapOverlay(catastrophes, options = {}) {
  if (!Array.isArray(catastrophes)) {
    throw new TypeError('CatastropheMapOverlay catastrophes must be an array.');
  }

  const normalizedOptions = requireObject(options, 'CatastropheMapOverlay options');
  const styleBySeverity = {
    ...DEFAULT_STYLE_BY_SEVERITY,
    ...requireObject(normalizedOptions.styleBySeverity ?? {}, 'CatastropheMapOverlay styleBySeverity'),
  };
  const tacticalHud = Boolean(normalizedOptions.tacticalHud);

  return catastrophes
    .map(normalizeCatastrophe)
    .filter((catastrophe) => !catastrophe.isResolved)
    .flatMap((catastrophe) => catastrophe.regionIds.map((regionId) => ({ catastrophe, regionId })))
    .sort((left, right) => {
      const regionComparison = left.regionId.localeCompare(right.regionId);

      if (regionComparison !== 0) {
        return regionComparison;
      }

      return left.catastrophe.id.localeCompare(right.catastrophe.id);
    })
    .map(({ catastrophe, regionId }) => {
      const style = normalizeStyle(styleBySeverity, catastrophe.severity);

      return {
        overlayId: `${regionId}:${catastrophe.id}`,
        regionId,
        catastropheId: catastrophe.id,
        type: catastrophe.type,
        severity: catastrophe.severity,
        status: catastrophe.status,
        label: `${catastrophe.type} (${catastrophe.severity})`,
        description: catastrophe.description,
        impact: { ...catastrophe.impact },
        style,
        ...(tacticalHud ? { hudStyle: buildTacticalHudStyle(catastrophe, style) } : {}),
      };
    });
}
