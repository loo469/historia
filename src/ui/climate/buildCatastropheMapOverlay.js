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

export function buildCatastropheMapOverlay(catastrophes, options = {}) {
  if (!Array.isArray(catastrophes)) {
    throw new TypeError('CatastropheMapOverlay catastrophes must be an array.');
  }

  const normalizedOptions = requireObject(options, 'CatastropheMapOverlay options');
  const styleBySeverity = {
    ...DEFAULT_STYLE_BY_SEVERITY,
    ...requireObject(normalizedOptions.styleBySeverity ?? {}, 'CatastropheMapOverlay styleBySeverity'),
  };

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
    .map(({ catastrophe, regionId }) => ({
      overlayId: `${regionId}:${catastrophe.id}`,
      regionId,
      catastropheId: catastrophe.id,
      type: catastrophe.type,
      severity: catastrophe.severity,
      status: catastrophe.status,
      label: `${catastrophe.type} (${catastrophe.severity})`,
      description: catastrophe.description,
      impact: { ...catastrophe.impact },
      style: normalizeStyle(styleBySeverity, catastrophe.severity),
    }));
}
