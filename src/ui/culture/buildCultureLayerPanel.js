import { buildDiscoveriesPanel } from './buildDiscoveriesPanel.js';
import { buildResearchProgressPanel } from './buildResearchProgressPanel.js';

function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizeEntries(entries) {
  if (!Array.isArray(entries)) {
    throw new TypeError('CultureLayerPanel entries must be an array.');
  }

  return entries.map((entry, index) => {
    const normalizedEntry = requireObject(entry, `CultureLayerPanel entries[${index}]`);

    return {
      overlayId: requireText(normalizedEntry.overlayId, `CultureLayerPanel entries[${index}].overlayId`),
      regionId: requireText(normalizedEntry.regionId, `CultureLayerPanel entries[${index}].regionId`),
      cultureId: requireText(normalizedEntry.cultureId, `CultureLayerPanel entries[${index}].cultureId`),
      cultureName: requireText(normalizedEntry.cultureName, `CultureLayerPanel entries[${index}].cultureName`),
      label: requireText(normalizedEntry.label, `CultureLayerPanel entries[${index}].label`),
      summary: String(normalizedEntry.summary ?? '').trim(),
      influenceScore: Number.isFinite(normalizedEntry.influenceScore) ? normalizedEntry.influenceScore : 0,
      influenceTier: String(normalizedEntry.influenceTier ?? 'faint').trim() || 'faint',
      discoveries: Array.isArray(normalizedEntry.discoveries) ? [...normalizedEntry.discoveries].sort() : [],
      unlockedResearchIds: Array.isArray(normalizedEntry.unlockedResearchIds) ? [...normalizedEntry.unlockedResearchIds].sort() : [],
      eventIds: Array.isArray(normalizedEntry.eventIds) ? [...normalizedEntry.eventIds].sort() : [],
      eventTitles: Array.isArray(normalizedEntry.eventTitles) ? [...normalizedEntry.eventTitles].sort() : [],
      identityTags: Array.isArray(normalizedEntry.identityTags) ? [...normalizedEntry.identityTags].sort() : [],
      highlights: Array.isArray(normalizedEntry.highlights) ? [...normalizedEntry.highlights].sort() : [],
      markerType: String(normalizedEntry.markerType ?? 'balanced').trim() || 'balanced',
      primaryLanguage: String(normalizedEntry.primaryLanguage ?? '').trim() || null,
      cultureMetrics: requireObject(
        normalizedEntry.cultureMetrics ?? {},
        `CultureLayerPanel entries[${index}].cultureMetrics`,
      ),
      atlasStoryLayers: Array.isArray(normalizedEntry.atlasStoryLayers) ? normalizedEntry.atlasStoryLayers : [],
      markerCollisionCluster: normalizedEntry.markerCollisionCluster ?? null,
      narrativeSummary: String(normalizedEntry.narrativeSummary ?? '').trim(),
      narrativePriority: normalizedEntry.narrativePriority ?? normalizedEntry.markerCollisionCluster?.narrativePriority ?? null,
      consequencePreview: normalizedEntry.consequencePreview
        ?? normalizedEntry.narrativePriority?.consequencePreview
        ?? normalizedEntry.markerCollisionCluster?.narrativePriority?.consequencePreview
        ?? null,
    };
  });
}

function buildRegionRows(entries) {
  return [...new Set(entries.map((entry) => entry.regionId))]
    .sort()
    .map((regionId) => {
      const regionEntries = entries
        .filter((entry) => entry.regionId === regionId)
        .sort((left, right) => right.influenceScore - left.influenceScore || left.cultureName.localeCompare(right.cultureName));
      const dominantEntry = regionEntries[0] ?? null;

      return {
        regionId,
        markerCount: regionEntries.length,
        dominantCultureId: dominantEntry?.cultureId ?? null,
        dominantCultureName: dominantEntry?.cultureName ?? null,
        influenceTier: dominantEntry?.influenceTier ?? 'faint',
        influenceScore: dominantEntry?.influenceScore ?? 0,
        highlights: [...new Set(regionEntries.flatMap((entry) => entry.highlights))].slice(0, 4),
        markerIds: regionEntries.map((entry) => entry.overlayId),
      };
    });
}

function buildFocus(entries, normalizedOptions) {
  const selectedRegionId = normalizedOptions.selectedRegionId ? requireText(normalizedOptions.selectedRegionId, 'CultureLayerPanel options.selectedRegionId') : null;
  const selectedCultureId = normalizedOptions.selectedCultureId ? requireText(normalizedOptions.selectedCultureId, 'CultureLayerPanel options.selectedCultureId') : null;
  const activeFilter = normalizedOptions.activeFilter === undefined
    ? 'all'
    : requireText(normalizedOptions.activeFilter, 'CultureLayerPanel options.activeFilter');
  const historicalEventsByCulture = requireObject(
    normalizedOptions.historicalEventsByCulture ?? {},
    'CultureLayerPanel historicalEventsByCulture',
  );
  const researchStatesByCulture = requireObject(
    normalizedOptions.researchStatesByCulture ?? {},
    'CultureLayerPanel researchStatesByCulture',
  );

  const focusedEntry = entries.find((entry) => (
    (selectedRegionId === null || entry.regionId === selectedRegionId)
      && (selectedCultureId === null || entry.cultureId === selectedCultureId)
  )) ?? entries[0] ?? null;

  if (!focusedEntry) {
    return null;
  }

  const allHistoricalEvents = historicalEventsByCulture[focusedEntry.cultureId] ?? focusedEntry.eventTitles.map((title, index) => ({
    id: focusedEntry.eventIds[index] ?? `${focusedEntry.cultureId}:event:${index}`,
    title,
    discoveryIds: focusedEntry.discoveries,
    unlockedResearchIds: focusedEntry.unlockedResearchIds,
  }));
  const filteredDiscoveries = activeFilter === 'research'
    ? []
    : focusedEntry.discoveries;
  const filteredResearchIds = activeFilter === 'events'
    ? []
    : focusedEntry.unlockedResearchIds;
  const filteredHistoricalEvents = activeFilter === 'research'
    ? []
    : activeFilter === 'discoveries'
      ? allHistoricalEvents.filter((event) => Array.isArray(event.discoveryIds) && event.discoveryIds.length > 0)
      : allHistoricalEvents;
  const researchStatusFilter = activeFilter === 'events' || activeFilter === 'discoveries'
    ? null
    : activeFilter === 'research'
      ? 'active'
      : null;

  return {
    regionId: focusedEntry.regionId,
    cultureId: focusedEntry.cultureId,
    cultureName: focusedEntry.cultureName,
    label: focusedEntry.label,
    summary: focusedEntry.summary,
    markerType: focusedEntry.markerType,
    influenceScore: focusedEntry.influenceScore,
    influenceTier: focusedEntry.influenceTier,
    primaryLanguage: focusedEntry.primaryLanguage,
    highlights: focusedEntry.highlights,
    activeFilter,
    availableFilters: ['all', 'discoveries', 'research', 'events'],
    researchProgressPanel: buildResearchProgressPanel(
      researchStatesByCulture[focusedEntry.cultureId] ?? [],
      {
        cultureId: focusedEntry.cultureId,
        title: activeFilter === 'research' ? 'Recherches actives' : 'Recherches',
        statusFilter: researchStatusFilter,
      },
    ),
    discoveriesPanel: buildDiscoveriesPanel(
      {
        cultureId: focusedEntry.cultureId,
        discoveredConceptIds: filteredDiscoveries,
        unlockedResearchIds: filteredResearchIds,
      },
      {
        historicalEvents: filteredHistoricalEvents,
      },
    ),
  };
}

function buildAtlasLayerControls(entries) {
  const layersByKind = new Map();

  for (const entry of entries) {
    for (const layer of entry.atlasStoryLayers) {
      const current = layersByKind.get(layer.kind) ?? {
        kind: layer.kind,
        label: layer.label,
        enabled: false,
        markerCount: 0,
        regionIds: new Set(),
      };
      current.enabled = current.enabled || layer.enabled;
      current.markerCount += layer.markerCount ?? 0;
      current.regionIds.add(entry.regionId);
      layersByKind.set(layer.kind, current);
    }
  }

  return [...layersByKind.values()]
    .sort((left, right) => left.kind.localeCompare(right.kind))
    .map((layer) => ({
      kind: layer.kind,
      label: layer.label,
      enabled: layer.enabled,
      markerCount: layer.markerCount,
      regionIds: [...layer.regionIds].sort(),
    }));
}

function buildCollisionControls(entries) {
  return [...new Map(entries
    .filter((entry) => entry.markerCollisionCluster)
    .map((entry) => [entry.regionId, entry.markerCollisionCluster])).values()]
    .sort((left, right) => right.markerCount - left.markerCount || left.regionId.localeCompare(right.regionId));
}

function buildNarrativePriorityRows(entries) {
  return [...new Map(entries
    .filter((entry) => entry.narrativePriority)
    .map((entry) => [entry.regionId, {
      regionId: entry.regionId,
      cultureId: entry.narrativePriority.priorityCultureId ?? entry.cultureId,
      cultureName: entry.narrativePriority.priorityCultureName ?? entry.cultureName,
      state: entry.narrativePriority.state,
      label: entry.narrativePriority.label,
      microAction: entry.narrativePriority.microAction,
      source: entry.narrativePriority.source,
      reason: entry.narrativePriority.reason,
      priorityScore: entry.narrativePriority.priorityScore,
      consequencePreview: entry.consequencePreview,
    }])).values()]
    .sort((left, right) => right.priorityScore - left.priorityScore || left.regionId.localeCompare(right.regionId));
}

export function buildCultureLayerPanel(entries, options = {}) {
  const normalizedEntries = normalizeEntries(entries);
  const normalizedOptions = requireObject(options, 'CultureLayerPanel options');
  const title = String(normalizedOptions.title ?? 'Couche culturelle').trim() || 'Couche culturelle';
  const regionRows = buildRegionRows(normalizedEntries);
  const focus = buildFocus(normalizedEntries, normalizedOptions);
  const comparison = normalizedEntries
    .slice()
    .sort((left, right) => right.influenceScore - left.influenceScore || left.cultureName.localeCompare(right.cultureName))
    .map((entry) => ({
      cultureId: entry.cultureId,
      cultureName: entry.cultureName,
      regionId: entry.regionId,
      influenceScore: entry.influenceScore,
      influenceTier: entry.influenceTier,
      openness: Number.isFinite(entry.cultureMetrics.openness) ? entry.cultureMetrics.openness : 0,
      cohesion: Number.isFinite(entry.cultureMetrics.cohesion) ? entry.cultureMetrics.cohesion : 0,
      researchDrive: Number.isFinite(entry.cultureMetrics.researchDrive) ? entry.cultureMetrics.researchDrive : 0,
      label: `${entry.cultureName} · ${entry.regionId}`,
    }));

  return {
    title,
    summary: `${normalizedEntries.length} marqueurs, ${regionRows.length} régions, ${regionRows.filter((row) => row.influenceTier === 'dominant' || row.influenceTier === 'strong').length} zones d'influence fortes`,
    markers: normalizedEntries
      .slice()
      .sort((left, right) => left.regionId.localeCompare(right.regionId) || right.influenceScore - left.influenceScore),
    regions: regionRows,
    focus,
    comparison: {
      title: 'Comparaison régionale',
      summary: `${comparison.length} cultures visibles comparées`,
      rows: comparison,
    },
    atlasLayers: buildAtlasLayerControls(normalizedEntries),
    collisionControls: buildCollisionControls(normalizedEntries),
    narrativePriorities: buildNarrativePriorityRows(normalizedEntries),
    metrics: {
      markerCount: normalizedEntries.length,
      regionCount: regionRows.length,
      strongInfluenceRegionCount: regionRows.filter((row) => row.influenceTier === 'dominant' || row.influenceTier === 'strong').length,
      cultureCount: new Set(normalizedEntries.map((entry) => entry.cultureId)).size,
    },
  };
}
