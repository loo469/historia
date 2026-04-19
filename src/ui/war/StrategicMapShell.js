import { Province } from '../../domain/war/Province.js';
import { renderProvince } from './ProvinceRenderer.js';

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

function buildLegend(renderedProvinces) {
  const controllingFactionIds = [...new Set(renderedProvinces.map((province) => province.controllingFactionId))].sort();

  return {
    factions: controllingFactionIds,
    states: [
      { code: 'stable', label: 'Contrôle stable' },
      { code: 'occupied', label: 'Occupation' },
      { code: 'contested', label: 'Front contesté' },
    ],
  };
}

export function buildStrategicMapShell(provinces, options = {}) {
  const normalizedProvinces = requireProvinceList(provinces);
  const normalizedOptions = requireOptions(options);
  const title = String(normalizedOptions.title ?? 'Carte stratégique').trim() || 'Carte stratégique';
  const subtitle = String(normalizedOptions.subtitle ?? 'Vue d’ensemble des provinces et lignes de front').trim()
    || 'Vue d’ensemble des provinces et lignes de front';

  const renderedProvinces = normalizedProvinces
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((province) => renderProvince(province, normalizedOptions));

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
    legend: buildLegend(renderedProvinces),
  };
}
