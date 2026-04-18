import { NiveauAlerte } from '../../domain/intrigue/NiveauAlerte.js';

const TONE_BY_CODE = Object.freeze({
  latent: 'muted',
  surveille: 'watch',
  renforce: 'warning',
  critique: 'danger',
  verrouille: 'critical',
});

const COLOR_BY_CODE = Object.freeze({
  latent: '#6B7280',
  surveille: '#2563EB',
  renforce: '#D97706',
  critique: '#DC2626',
  verrouille: '#7F1D1D',
});

function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

export function buildAlertLevelBadge(level, options = {}) {
  const normalizedOptions = requireObject(options, 'AlertLevelBadge options');
  const alertLevel = NiveauAlerte.from(level);
  const prefix = String(normalizedOptions.prefix ?? 'Alerte').trim() || 'Alerte';

  return {
    text: `${prefix} ${alertLevel.label}`,
    shortText: `${prefix} ${alertLevel.value}`,
    tone: TONE_BY_CODE[alertLevel.code],
    color: COLOR_BY_CODE[alertLevel.code],
    emphasis: alertLevel.isCritical ? 'high' : 'normal',
    tooltip: `Niveau ${alertLevel.value} sur ${NiveauAlerte.maximum().value}, surveillance ${alertLevel.surveillanceIntensity}%`,
    level: alertLevel.toJSON(),
  };
}
