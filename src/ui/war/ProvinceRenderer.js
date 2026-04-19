import { Province } from '../../domain/war/Province.js';

const DEFAULT_FILL = '#94A3B8';
const DEFAULT_BORDER = '#334155';

const SUPPLY_TONE_BY_LEVEL = Object.freeze({
  stable: 'ready',
  strained: 'fragile',
  disrupted: 'critical',
  collapsed: 'isolated',
});

function requireProvince(province) {
  if (!(province instanceof Province)) {
    throw new TypeError('ProvinceRenderer province must be a Province instance.');
  }

  return province;
}

function requireOptions(options) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('ProvinceRenderer options must be an object.');
  }

  return options;
}

function getFactionPalette(paletteByFaction, factionId) {
  const palette = paletteByFaction[factionId] ?? paletteByFaction.default ?? {};

  return {
    fill: String(palette.fill ?? DEFAULT_FILL).trim() || DEFAULT_FILL,
    border: String(palette.border ?? DEFAULT_BORDER).trim() || DEFAULT_BORDER,
  };
}

export function renderProvince(province, options = {}) {
  const normalizedProvince = requireProvince(province);
  const normalizedOptions = requireOptions(options);
  const paletteByFaction = normalizedOptions.paletteByFaction ?? {};

  if (!paletteByFaction || typeof paletteByFaction !== 'object' || Array.isArray(paletteByFaction)) {
    throw new TypeError('ProvinceRenderer paletteByFaction must be an object.');
  }

  const supplyToneByLevel = normalizedOptions.supplyToneByLevel ?? SUPPLY_TONE_BY_LEVEL;

  if (!supplyToneByLevel || typeof supplyToneByLevel !== 'object' || Array.isArray(supplyToneByLevel)) {
    throw new TypeError('ProvinceRenderer supplyToneByLevel must be an object.');
  }

  const ownerPalette = getFactionPalette(paletteByFaction, normalizedProvince.ownerFactionId);
  const controllerPalette = getFactionPalette(paletteByFaction, normalizedProvince.controllingFactionId);

  return {
    provinceId: normalizedProvince.id,
    label: normalizedProvince.name,
    ownerFactionId: normalizedProvince.ownerFactionId,
    controllingFactionId: normalizedProvince.controllingFactionId,
    occupied: normalizedProvince.isOccupied,
    contested: normalizedProvince.contested,
    supplyLevel: normalizedProvince.supplyLevel,
    supplyTone: String(supplyToneByLevel[normalizedProvince.supplyLevel] ?? normalizedProvince.supplyLevel).trim()
      || normalizedProvince.supplyLevel,
    loyalty: normalizedProvince.loyalty,
    strategicValue: normalizedProvince.strategicValue,
    neighborIds: [...normalizedProvince.neighborIds],
    style: {
      fill: controllerPalette.fill,
      border: ownerPalette.border,
      borderStyle: normalizedProvince.contested ? 'dashed' : 'solid',
      pattern: normalizedProvince.isOccupied ? 'occupation-stripes' : 'solid',
      accent: normalizedProvince.contested ? 'contested-glow' : 'stable-frame',
    },
    badges: [
      normalizedProvince.contested ? 'contested' : null,
      normalizedProvince.isOccupied ? 'occupied' : null,
      `supply:${normalizedProvince.supplyLevel}`,
      `value:${normalizedProvince.strategicValue}`,
    ].filter(Boolean),
  };
}
