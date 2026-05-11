function requireMapOptions(mapOptions) {
  if (!Array.isArray(mapOptions)) {
    throw new TypeError('Launcher map options must be an array.');
  }

  return mapOptions;
}

function normalizeText(value, fallback) {
  const normalized = String(value ?? '').trim();

  return normalized || fallback;
}

function normalizeStats(stats) {
  if (stats === undefined) {
    return {};
  }

  if (stats === null || typeof stats !== 'object' || Array.isArray(stats)) {
    throw new TypeError('Launcher map stats must be an object.');
  }

  return Object.fromEntries(
    Object.entries(stats)
      .map(([key, value]) => [String(key).trim(), Number(value)])
      .filter(([key, value]) => key && Number.isFinite(value)),
  );
}

function normalizeMapOption(option, index) {
  if (option === null || typeof option !== 'object' || Array.isArray(option)) {
    throw new TypeError('Launcher map options must contain objects.');
  }

  const id = normalizeText(option.id, `map-${index + 1}`);
  const playable = option.playable !== false;

  return {
    id,
    title: normalizeText(option.title, id),
    subtitle: normalizeText(option.subtitle, 'Carte jouable'),
    description: normalizeText(option.description, 'Prototype prêt à lancer.'),
    tag: normalizeText(option.tag, playable ? 'Jouable' : 'Bientôt'),
    status: normalizeText(option.status, playable ? 'ready' : 'locked'),
    recommended: Boolean(option.recommended),
    playable,
    previewTone: normalizeText(option.previewTone, 'cyan'),
    stats: normalizeStats(option.stats),
  };
}

export function buildLauncherMapSelection(mapOptions, selectedMapId) {
  const maps = requireMapOptions(mapOptions).map(normalizeMapOption);
  const playableMaps = maps.filter((map) => map.playable);
  const selectedMap = maps.find((map) => map.id === selectedMapId && map.playable)
    ?? playableMaps.find((map) => map.recommended)
    ?? playableMaps[0]
    ?? null;

  return {
    maps: maps.map((map) => ({
      ...map,
      selected: selectedMap?.id === map.id,
    })),
    selectedMap,
    canLaunch: Boolean(selectedMap),
    headline: selectedMap
      ? `Carte sélectionnée: ${selectedMap.title}`
      : 'Aucune carte jouable disponible',
  };
}
