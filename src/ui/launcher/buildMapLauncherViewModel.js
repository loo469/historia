function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizeCount(value, label) {
  const numericValue = Number(value ?? 0);

  if (!Number.isFinite(numericValue)) {
    throw new TypeError(`${label} must be a finite number.`);
  }

  return Math.max(0, Math.round(numericValue));
}

function normalizeTextList(values, label) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .map((value) => requireText(value, label));
}

function normalizeResourceSignals(values, label) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.slice(0, 5).map((resource) => {
    if (resource === null || typeof resource !== 'object' || Array.isArray(resource)) {
      throw new TypeError(`${label} resources must be objects.`);
    }

    const resourceId = requireText(resource.resourceId, `${label} resourceId`);

    return {
      resourceId,
      label: String(resource.label ?? resourceId).trim() || resourceId,
      quantity: normalizeCount(resource.quantity, `${label} ${resourceId} quantity`),
    };
  });
}

function pluralizeCount(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function normalizeEconomySignals(economy, id) {
  if (economy === undefined || economy === null) {
    return {
      cityCount: 0,
      routeCount: 0,
      activeRouteCount: 0,
      totalStock: 0,
      totalCapacity: 0,
      pressureLabel: 'Économie à brancher',
      resources: [],
      visibleCities: [],
      routeNames: [],
      signalLabel: '0 villes · 0 routes · 0 stocks',
    };
  }

  if (typeof economy !== 'object' || Array.isArray(economy)) {
    throw new TypeError(`Map launcher option ${id} economy must be an object.`);
  }

  const cityCount = normalizeCount(economy.cityCount, `Map launcher option ${id} economy cityCount`);
  const routeCount = normalizeCount(economy.routeCount, `Map launcher option ${id} economy routeCount`);
  const totalStock = normalizeCount(economy.totalStock, `Map launcher option ${id} economy totalStock`);

  return {
    cityCount,
    routeCount,
    activeRouteCount: normalizeCount(economy.activeRouteCount, `Map launcher option ${id} economy activeRouteCount`),
    totalStock,
    totalCapacity: normalizeCount(economy.totalCapacity, `Map launcher option ${id} economy totalCapacity`),
    pressureLabel: String(economy.pressureLabel ?? 'Aucune tension majeure').trim() || 'Aucune tension majeure',
    resources: normalizeResourceSignals(economy.resources, `Map launcher option ${id} economy`).slice(0, 5),
    visibleCities: normalizeTextList(economy.visibleCities, `Map launcher option ${id} economy visibleCities`).slice(0, 4),
    routeNames: normalizeTextList(economy.routeNames, `Map launcher option ${id} economy routeNames`).slice(0, 3),
    signalLabel: `${pluralizeCount(cityCount, 'ville', 'villes')} · ${pluralizeCount(routeCount, 'route', 'routes')} · ${pluralizeCount(totalStock, 'stock', 'stocks')}`,
  };
}

function normalizeMapOption(option) {
  if (option === null || typeof option !== 'object' || Array.isArray(option)) {
    throw new TypeError('Map launcher options must be objects.');
  }

  const id = requireText(option.id, 'Map launcher option id');
  const cultureCount = normalizeCount(option.cultureCount, `Map launcher option ${id} cultureCount`);
  const discoveryCount = normalizeCount(option.discoveryCount, `Map launcher option ${id} discoveryCount`);
  const economy = normalizeEconomySignals(option.economy, id);

  return {
    id,
    title: requireText(option.title, `Map launcher option ${id} title`),
    eyebrow: String(option.eyebrow ?? 'Carte prototype').trim() || 'Carte prototype',
    summary: requireText(option.summary, `Map launcher option ${id} summary`),
    status: String(option.status ?? 'Jouable').trim() || 'Jouable',
    cultureCount,
    discoveryCount,
    provinceCount: normalizeCount(option.provinceCount, `Map launcher option ${id} provinceCount`),
    recommendedOverlay: String(option.recommendedOverlay ?? 'culture-overlay').trim() || 'culture-overlay',
    previewTags: normalizeTextList(option.previewTags, `Map launcher option ${id} previewTags`).slice(0, 4),
    detailLines: normalizeTextList(option.detailLines, `Map launcher option ${id} detailLines`).slice(0, 3),
    economy,
    signalLabel: `${cultureCount} cultures · ${discoveryCount} découvertes · ${economy.signalLabel}`,
  };
}

export function buildMapLauncherViewModel(mapOptions, selectedMapId) {
  if (!Array.isArray(mapOptions)) {
    throw new TypeError('Map launcher options must be an array.');
  }

  const options = mapOptions.map(normalizeMapOption);

  if (options.length === 0) {
    throw new RangeError('Map launcher needs at least one map option.');
  }

  const selectedOption = options.find((option) => option.id === selectedMapId) ?? options[0];

  return {
    title: 'Choisissez une carte',
    subtitle: 'Launcher jouable rapide: sélectionnez une carte prototype visible avant d’entrer dans la partie.',
    selectedMapId: selectedOption.id,
    selectedOption,
    options: options.map((option) => ({
      ...option,
      selected: option.id === selectedOption.id,
    })),
  };
}
