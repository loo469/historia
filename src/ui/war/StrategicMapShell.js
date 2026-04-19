import { Province } from '../../domain/war/Province.js';
import { renderProvince } from './ProvinceRenderer.js';

const DEFAULT_OVERLAY_SLOTS = Object.freeze([
  'climate-overlay',
  'culture-overlay',
  'economy-overlay',
  'intrigue-overlay',
]);

function requireOptions(options) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('StrategicMapShell options must be an object.');
  }

  return options;
}

function requireProvinceList(provinces) {
  if (!Array.isArray(provinces)) {
    throw new TypeError('StrategicMapShell provinces must be an array.');
  }

  return provinces.map((province) => {
    if (!(province instanceof Province)) {
      throw new TypeError('StrategicMapShell provinces must contain Province instances.');
    }

    return province;
  });
}

function normalizeTextMap(value, label) {
  if (value === undefined) {
    return {};
  }

  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function normalizeOverlaySlots(overlaySlots) {
  if (overlaySlots === undefined) {
    return [...DEFAULT_OVERLAY_SLOTS];
  }

  if (!Array.isArray(overlaySlots)) {
    throw new TypeError('StrategicMapShell overlaySlots must be an array.');
  }

  return [...new Set(overlaySlots.map((slot) => String(slot).trim()).filter(Boolean))];
}

function buildLegend(renderedProvinces, options) {
  const factionMetaById = normalizeTextMap(options.factionMetaById, 'StrategicMapShell factionMetaById');
  const paletteByFaction = normalizeTextMap(options.paletteByFaction, 'StrategicMapShell paletteByFaction');
  const controllingFactionIds = [...new Set(renderedProvinces.map((province) => province.controllingFactionId))].sort();

  return {
    factions: controllingFactionIds.map((factionId) => ({
      factionId,
      label: String(factionMetaById[factionId]?.label ?? factionId).trim() || factionId,
      color: String(paletteByFaction[factionId]?.fill ?? '#94A3B8').trim() || '#94A3B8',
      border: String(paletteByFaction[factionId]?.border ?? '#334155').trim() || '#334155',
    })),
    states: [
      { code: 'stable', label: 'Contrôle stable' },
      { code: 'occupied', label: 'Occupation' },
      { code: 'contested', label: 'Front contesté' },
    ],
  };
}

function enhanceProvince(renderedProvince, options) {
  const selectedProvinceId = String(options.selectedProvinceId ?? '').trim();
  const focusedProvinceId = String(options.focusedProvinceId ?? '').trim();

  return {
    ...renderedProvince,
    selectionState: {
      selected: renderedProvince.provinceId === selectedProvinceId,
      focused: renderedProvince.provinceId === focusedProvinceId,
    },
  };
}

export function buildStrategicMapShell(provinces, options = {}) {
  const normalizedProvinces = requireProvinceList(provinces);
  const normalizedOptions = requireOptions(options);
  const title = String(normalizedOptions.title ?? 'Carte stratégique').trim() || 'Carte stratégique';
  const subtitle = String(normalizedOptions.subtitle ?? 'Vue d’ensemble des provinces et lignes de front').trim()
    || 'Vue d’ensemble des provinces et lignes de front';
  const overlaySlots = normalizeOverlaySlots(normalizedOptions.overlaySlots);

  const renderedProvinces = normalizedProvinces
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((province) => enhanceProvince(renderProvince(province, normalizedOptions), normalizedOptions));

  const stats = renderedProvinces.reduce(
    (summary, province) => ({
      provinceCount: summary.provinceCount + 1,
      contestedCount: summary.contestedCount + (province.contested ? 1 : 0),
      occupiedCount: summary.occupiedCount + (province.occupied ? 1 : 0),
      averageLoyalty: summary.averageLoyalty + province.loyalty,
    }),
    {
      provinceCount: 0,
      contestedCount: 0,
      occupiedCount: 0,
      averageLoyalty: 0,
    },
  );

  return {
    title,
    subtitle,
    provinces: renderedProvinces,
    stats: {
      provinceCount: stats.provinceCount,
      contestedCount: stats.contestedCount,
      occupiedCount: stats.occupiedCount,
      averageLoyalty: stats.provinceCount === 0 ? 0 : Math.round(stats.averageLoyalty / stats.provinceCount),
    },
    legend: buildLegend(renderedProvinces, normalizedOptions),
    overlays: {
      slots: overlaySlots.map((slotId) => ({
        slotId,
        label: slotId.replace(/-/g, ' '),
        enabled: true,
      })),
    },
    activeProvince: renderedProvinces.find(
      (province) => province.selectionState.selected || province.selectionState.focused,
    ) ?? null,
  };
}
