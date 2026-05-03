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

function normalizeMapOption(option) {
  if (option === null || typeof option !== 'object' || Array.isArray(option)) {
    throw new TypeError('Map launcher options must be objects.');
  }

  const id = requireText(option.id, 'Map launcher option id');
  const cultureCount = normalizeCount(option.cultureCount, `Map launcher option ${id} cultureCount`);
  const discoveryCount = normalizeCount(option.discoveryCount, `Map launcher option ${id} discoveryCount`);

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
    signalLabel: `${cultureCount} cultures · ${discoveryCount} découvertes`,
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
