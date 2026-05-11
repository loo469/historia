function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function formatSigned(value) {
  return value > 0 ? `+${value}` : `${value}`;
}

function getDeltaTone(value, invert = false) {
  if (value === 0) {
    return 'neutral';
  }

  const improved = invert ? value < 0 : value > 0;
  return improved ? 'improved' : 'worse';
}

function summarizeRouteDelta(route, delta) {
  if (!delta) {
    return null;
  }

  if (delta.activeDelta !== 0) {
    return {
      type: 'route',
      tone: delta.activeDelta > 0 ? 'improved' : 'worse',
      label: delta.activeDelta > 0 ? 'Route réparée' : 'Route dégradée',
      detail: `${route.routeName}: ${delta.activeDelta > 0 ? 'flux réouvert' : 'flux interrompu'}, risque ${formatSigned(delta.riskDelta)}.`,
      score: 120 + Math.abs(delta.riskDelta),
    };
  }

  if (delta.riskDelta !== 0) {
    return {
      type: 'route',
      tone: getDeltaTone(delta.riskDelta, true),
      label: delta.riskDelta < 0 ? 'Stress logistique réduit' : 'Stress logistique accru',
      detail: `${route.routeName}: risque ${formatSigned(delta.riskDelta)} depuis le dernier tour.`,
      score: 90 + Math.abs(delta.riskDelta),
    };
  }

  return null;
}

function summarizeCityDelta(city, delta) {
  if (!delta) {
    return null;
  }

  const productionDelta = delta.stockDelta ?? 0;
  const stabilityDelta = delta.stabilityDelta ?? 0;
  const prosperityDelta = delta.prosperityDelta ?? 0;
  const strongest = [
    { key: 'stock', label: productionDelta >= 0 ? 'Approvisionnement renforcé' : 'Approvisionnement en baisse', value: productionDelta, invert: false },
    { key: 'stability', label: stabilityDelta >= 0 ? 'Stabilité logistique gagnée' : 'Stabilité logistique perdue', value: stabilityDelta, invert: false },
    { key: 'prosperity', label: prosperityDelta >= 0 ? 'Gain économique' : 'Coût économique', value: prosperityDelta, invert: false },
  ].sort((left, right) => Math.abs(right.value) - Math.abs(left.value))[0];

  if (!strongest || strongest.value === 0) {
    return null;
  }

  return {
    type: 'city',
    tone: getDeltaTone(strongest.value, strongest.invert),
    label: strongest.label,
    detail: `${city.cityName}: stock ${formatSigned(productionDelta)}, stabilité ${formatSigned(stabilityDelta)}, prospérité ${formatSigned(prosperityDelta)}.`,
    score: 70 + Math.abs(strongest.value),
  };
}

export function buildProvinceEconomyTurnReport(province, economyView, options = {}) {
  const normalizedOptions = requireObject(options, 'ProvinceEconomyTurnReport options');
  const previousChoice = normalizedOptions.previousChoice ?? null;

  if (!province || !economyView) {
    return {
      tone: 'neutral',
      summary: 'Aucun rapport économie/logistique disponible pour ce tour.',
      previousAction: null,
      deltas: [],
    };
  }

  const cities = economyView.overlay?.cities ?? [];
  const routes = economyView.overlay?.routes ?? [];
  const deltaByCityId = economyView.deltaByCityId ?? {};
  const routeDeltaById = economyView.routeDeltaById ?? {};
  const provinceCities = cities.filter((city) => city.regionId === province.provinceId);
  const provinceCityIds = new Set(provinceCities.map((city) => city.cityId));
  const provinceRoutes = routes.filter((route) => route.cityIds.some((cityId) => provinceCityIds.has(cityId)));

  const routeDeltas = provinceRoutes
    .map((route) => summarizeRouteDelta(route, routeDeltaById[route.routeId]))
    .filter(Boolean);
  const cityDeltas = provinceCities
    .map((city) => summarizeCityDelta(city, deltaByCityId[city.cityId]))
    .filter(Boolean);
  const deltas = [...routeDeltas, ...cityDeltas]
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label))
    .slice(0, 4);

  if (deltas.length === 0) {
    return {
      tone: 'neutral',
      summary: `Aucun changement économie/logistique notable sur ${province.label ?? province.provinceId}.`,
      previousAction: previousChoice ? `${previousChoice.action}: aucun delta mesurable ce tour.` : null,
      deltas: [],
    };
  }

  const improvedCount = deltas.filter((delta) => delta.tone === 'improved').length;
  const worseCount = deltas.filter((delta) => delta.tone === 'worse').length;
  const tone = worseCount > improvedCount ? 'worse' : improvedCount > 0 ? 'improved' : 'neutral';
  const lead = deltas[0];

  return {
    tone,
    summary: `${lead.label}: ${lead.detail}`,
    previousAction: previousChoice ? `Action Beta précédente: ${previousChoice.action} sur ${previousChoice.routes?.join(', ') ?? 'route locale'}.` : null,
    deltas,
  };
}
