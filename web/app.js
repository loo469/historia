import { GenerateStrategicMap } from '../src/application/war/GenerateStrategicMap.js';
import { Province } from '../src/domain/war/Province.js';
import { City } from '../src/domain/economy/City.js';
import { TradeRoute } from '../src/domain/economy/TradeRoute.js';
import { buildEconomySeedFromStrategicMap } from '../src/application/economy/BuildEconomySeedFromStrategicMap.js';
import {
  buildFirstCleanupPayoff,
  buildFollowUpCleanupChoices,
  buildStrategicMapShell,
  buildTopFollowUpReadiness,
} from '../src/ui/war/StrategicMapShell.js';
import { buildLauncherMapSelection } from '../src/ui/launcher/buildLauncherMapSelection.js';
import { buildEconomyMapOverlay } from '../src/ui/economy/buildEconomyMapOverlay.js';
import { buildCityStockPanel } from '../src/ui/economy/buildCityStockPanel.js';
import { buildCityComparisonPanel } from '../src/ui/economy/buildCityComparisonPanel.js';
import { buildProvinceLogisticsChoicePreview } from '../src/ui/economy/buildProvinceLogisticsChoicePreview.js';
import { buildProvinceEconomyTurnReport } from '../src/ui/economy/buildProvinceEconomyTurnReport.js';
import { buildProvinceEconomyBudgetPreview } from '../src/ui/economy/buildProvinceEconomyBudgetPreview.js';
import { buildEconomyReadinessWarnings } from '../src/ui/economy/buildEconomyReadinessWarnings.js';
import { Cellule } from '../src/domain/intrigue/Cellule.js';
import { OperationClandestine } from '../src/domain/intrigue/OperationClandestine.js';
import { buildIntrigueWebDemo } from '../src/ui/intrigue/buildIntrigueWebDemo.js';
import { buildIntrigueTurnReportDeltas } from '../src/ui/intrigue/buildIntrigueTurnReportDeltas.js';
import { buildCultureMapRecommendations } from '../src/ui/culture/buildCultureMapRecommendations.js';
import { buildCultureLocalTimeline } from '../src/ui/culture/buildCultureLocalTimeline.js';
import { buildCultureBlockerResolutionHistory, buildCultureDiscoveryUrgencyGroups, buildCultureInterventionPriorities } from '../src/ui/culture/buildCultureDiscoveryUrgencyGroups.js';
import { buildCultureConsequenceChips } from '../src/ui/culture/buildCultureConsequenceChips.js';
import { buildCultureTurnReportDeltas } from '../src/ui/culture/buildCultureTurnReportDeltas.js';
import { buildCultureUnlockHints } from '../src/ui/culture/buildCultureUnlockHints.js';
import { buildCultureOpportunityReminders } from '../src/ui/culture/buildCultureOpportunityReminders.js';
import { buildClimateTurnReportDeltas } from '../src/ui/climate/buildClimateTurnReportDeltas.js';

const culturePayload = {
  cultures: [
    {
      id: 'culture-aurora',
      name: 'Compact d’Aurora',
      archetype: 'maritime-savante',
      primaryLanguage: 'haut-côtier',
      valueIds: ['navigation', 'archives-publiques', 'artisanat'],
      traditionIds: ['assemblées-portuaires', 'cartes-étoiles'],
      openness: 74,
      cohesion: 63,
      researchDrive: 78,
      regionIds: ['north-watch', 'crown-heart', 'river-gate'],
    },
    {
      id: 'culture-ember',
      name: 'Ligues des Forges',
      archetype: 'industrielle-frontalière',
      primaryLanguage: 'parler-des-hauts-fourneaux',
      valueIds: ['discipline', 'maîtrise-du-feu'],
      traditionIds: ['serments-de-fonderie', 'marques-de-lignée'],
      openness: 42,
      cohesion: 71,
      researchDrive: 58,
      regionIds: ['red-ridge', 'iron-plain', 'river-gate'],
    },
    {
      id: 'culture-south',
      name: 'Maisons des Basses Marches',
      archetype: 'caravanière',
      primaryLanguage: 'créole-des-pistes',
      valueIds: ['hospitalité', 'mémoire-des-routes'],
      traditionIds: ['foires-saisonnières', 'chants-des-bornes'],
      openness: 61,
      cohesion: 48,
      researchDrive: 54,
      regionIds: ['southern-reach', 'river-gate'],
    },
  ],
  researchStates: [
    {
      id: 'research-aurora-celestial-ledgers',
      cultureId: 'culture-aurora',
      topicId: 'registres-célestes',
      status: 'active',
      progress: 68,
      currentTier: 2,
      discoveredConceptIds: ['astrolabes-portuaires', 'catalogues-publics'],
    },
    {
      id: 'research-ember-blast-runes',
      cultureId: 'culture-ember',
      topicId: 'runes-de-haut-fourneau',
      status: 'active',
      progress: 52,
      currentTier: 2,
      discoveredConceptIds: ['alliages-de-siège'],
    },
    {
      id: 'research-south-waystones',
      cultureId: 'culture-south',
      topicId: 'bornes-mémorielles',
      status: 'completed',
      progress: 100,
      currentTier: 1,
      completedAt: '2026-04-20T00:00:00.000Z',
      discoveredConceptIds: ['cartes-orales', 'relais-de-caravane'],
    },
  ],
  historicalEvents: [
    {
      id: 'event-aurora-open-archives',
      title: 'Ouverture des archives de Couronne',
      category: 'knowledge',
      summary: 'Les maîtres-cartographes publient les routes célestes utilisées par la flotte.',
      era: 'pax-historia-ui',
      importance: 4,
      triggeredAt: '2026-05-02T08:00:00.000Z',
      affectedCultureIds: ['culture-aurora'],
      discoveryIds: ['routes-célestes'],
    },
    {
      id: 'event-river-gate-synod',
      title: 'Synode de la Porte du Fleuve',
      category: 'diplomacy',
      summary: 'Marchands, forgerons et maisons caravanières fixent des signes communs pour les convois.',
      era: 'pax-historia-ui',
      importance: 3,
      triggeredAt: '2026-05-02T12:00:00.000Z',
      affectedCultureIds: ['culture-aurora', 'culture-ember', 'culture-south'],
      discoveryIds: ['glyphes-de-convoi'],
    },
  ],
};

const strategicMap = new GenerateStrategicMap().execute({ culturePayload });
const paletteByFaction = strategicMap.paletteByFaction;
const factionMetaById = strategicMap.factionMetaById;
const provinceGeometryById = strategicMap.provinceGeometryById;
const provinces = strategicMap.provinces;

const overlayLabels = {
  'climate-overlay': 'Climat',
  'culture-overlay': 'Culture',
  'economy-overlay': 'Économie',
  'intrigue-overlay': 'Intrigue',
};

const cityPositionByProvinceId = {
  'crown-heart': { x: 49.5, y: 28, labelDx: 0, labelDy: -6 },
  'river-gate': { x: 34, y: 56, labelDx: -8, labelDy: 7 },
  'iron-plain': { x: 62, y: 55, labelDx: 8, labelDy: -6 },
  'southern-reach': { x: 47, y: 79, labelDx: 0, labelDy: 8 },
};


const economySeed = buildEconomySeedFromStrategicMap(strategicMap, {
  cityIdByProvinceId: {
    'north-watch': 'north-watch-city',
    'crown-heart': 'crown-port',
    'red-ridge': 'red-ridge-city',
    'river-gate': 'river-gate-city',
    'iron-plain': 'iron-plain-city',
    'southern-reach': 'southern-crossing',
  },
  cityNameByProvinceId: {
    'north-watch': 'Guet du Nord',
    'crown-heart': 'Port de Couronne',
    'red-ridge': 'Bastion Rouge',
    'river-gate': 'Porte du Fleuve',
    'iron-plain': 'Forge des Plaines',
    'southern-reach': 'Passage du Sud',
  },
  cityPositionByProvinceId,
  resourceHintsByProvinceId: {
    'north-watch': { timber: 6, game: 4 },
    'crown-heart': { fish: 14, timber: 7 },
    'red-ridge': { ore: 9, stone: 4 },
    'river-gate': { tools: 2, timber: 4 },
    'iron-plain': { ore: 11, tools: 5 },
    'southern-reach': { grain: 6, horses: 4, timber: 1 },
  },
});
const cityLayoutsById = economySeed.cityPositionById;
const cities = economySeed.cities;
const routes = economySeed.routes;

const intrigueCellules = [
  new Cellule({
    id: 'cell-crown-veil',
    factionId: 'shadow-league',
    codename: 'Voile',
    locationId: 'crown-heart',
    memberIds: ['ag-veil-1'],
    assetIds: ['asset-ledger'],
    secrecy: 76,
    loyalty: 71,
    exposure: 22,
  }),
  new Cellule({
    id: 'cell-river-ember',
    factionId: 'shadow-league',
    codename: 'Braise',
    locationId: 'river-gate',
    memberIds: ['ag-braise-1'],
    assetIds: ['asset-ferry'],
    secrecy: 58,
    loyalty: 63,
    exposure: 41,
  }),
  new Cellule({
    id: 'cell-river-mist',
    factionId: 'shadow-league',
    codename: 'Brume',
    locationId: 'river-gate',
    memberIds: ['ag-brume-1'],
    assetIds: ['asset-dockers'],
    secrecy: 48,
    loyalty: 56,
    exposure: 69,
    sleeper: true,
  }),
  new Cellule({
    id: 'cell-iron-cinder',
    factionId: 'shadow-league',
    codename: 'Cendre',
    locationId: 'iron-plain',
    memberIds: ['ag-cendre-1'],
    assetIds: ['asset-foundry'],
    secrecy: 54,
    loyalty: 60,
    exposure: 36,
  }),
  new Cellule({
    id: 'cell-south-reed',
    factionId: 'shadow-league',
    codename: 'Roseau',
    locationId: 'southern-reach',
    memberIds: ['ag-roseau-1'],
    assetIds: ['asset-crossing'],
    secrecy: 71,
    loyalty: 65,
    exposure: 18,
    sleeper: true,
  }),
];

const intrigueOperations = [
  new OperationClandestine({
    id: 'op-river-locks',
    celluleId: 'cell-river-ember',
    targetFactionId: 'ember',
    type: 'sabotage',
    objective: 'Façonner les écluses pour bloquer les convois',
    theaterId: 'river-gate',
    assignedAgentIds: ['ag-braise-1'],
    requiredAssetIds: ['asset-ferry'],
    detectionRisk: 32,
    progress: 56,
    heat: 52,
    phase: 'execution',
  }),
  new OperationClandestine({
    id: 'op-iron-smoke',
    celluleId: 'cell-iron-cinder',
    targetFactionId: 'ember',
    type: 'sabotage',
    objective: 'Saboter les fours de la plaine',
    theaterId: 'iron-plain',
    assignedAgentIds: ['ag-cendre-1'],
    requiredAssetIds: ['asset-foundry'],
    detectionRisk: 46,
    progress: 41,
    heat: 39,
    phase: 'infiltration',
  }),
  new OperationClandestine({
    id: 'op-crown-ledgers',
    celluleId: 'cell-crown-veil',
    targetFactionId: 'aurora',
    type: 'rumor',
    objective: 'Diffuser de faux ordres comptables',
    theaterId: 'crown-heart',
    assignedAgentIds: ['ag-veil-1'],
    requiredAssetIds: ['asset-ledger'],
    progress: 63,
    heat: 18,
    phase: 'execution',
  }),
];

const desiredStockByCityId = {
  'north-watch-city': { grain: 8, timber: 5, game: 3 },
  'crown-port': { grain: 10, fish: 10, timber: 5 },
  'red-ridge-city': { grain: 5, ore: 7, stone: 3 },
  'river-gate-city': { grain: 9, tools: 4, timber: 5 },
  'iron-plain-city': { ore: 8, tools: 4, grain: 5 },
  'southern-crossing': { grain: 7, horses: 3, timber: 3 },
};


const resourceHudById = {
  fish: { glyph: '◒', label: 'Vivres maritimes', tone: 'cyan' },
  game: { glyph: '◌', label: 'Gibier', tone: 'green' },
  grain: { glyph: '▦', label: 'Grain', tone: 'amber' },
  horses: { glyph: '♞', label: 'Remonte', tone: 'green' },
  ore: { glyph: '◆', label: 'Minerai', tone: 'slate' },
  stone: { glyph: '◇', label: 'Pierre', tone: 'slate' },
  timber: { glyph: '▰', label: 'Bois', tone: 'green' },
  tools: { glyph: '⚙', label: 'Outillage', tone: 'cyan' },
};

const defaultResourceHud = { glyph: '•', label: 'Ressource', tone: 'slate' };

const routeHudByMode = {
  land: { glyph: '⇄', label: 'Convoi terrestre', tone: 'amber' },
  river: { glyph: '≈', label: 'Barge fluviale', tone: 'cyan' },
  sea: { glyph: '⟐', label: 'Ligne maritime', tone: 'violet' },
};

const defaultRouteHud = { glyph: '—', label: 'Route logistique', tone: 'slate' };

const mapScenarios = [
  {
    id: 'continental-prototype',
    title: 'Pax Historia — théâtre continental',
    subtitle: 'Carte prototype jouable',
    description: 'Le prototype complet avec provinces visibles, fronts, villes, routes et overlays prêts pour test rapide.',
    tag: 'Recommandée',
    status: 'ready',
    previewTone: 'cyan',
    recommended: true,
    stats: {
      Provinces: provinces.length,
      Villes: cities.length,
      Routes: routes.length,
      Fronts: provinces.filter((province) => province.contested).length,
    },
    gameTitle: 'Écran stratégique, théâtre continental',
    gameSubtitle: 'Prototype local Alpha prêt à accueillir les overlays inter-domaines',
    initialState: {
      focusedProvinceId: 'crown-heart',
      selectedProvinceId: 'river-gate',
      activeOverlaySlot: 'culture-overlay',
      popupProvinceId: 'river-gate',
      hoveredCityId: 'river-gate-city',
      selectedCityId: 'river-gate-city',
      comparedCityIds: ['river-gate-city', 'crown-port'],
      comparisonProvinceIds: ['river-gate', 'crown-heart'],
      selectedIntrigueOperationId: 'op-river-locks',
      lastTurnSummary: 'Le théâtre continental est chargé: carte visible, overlays prêts, crise du fleuve sélectionnée.',
    },
  },
  {
    id: 'river-crisis',
    title: 'Crise de la Porte du Fleuve',
    subtitle: 'Scénario court de validation UI',
    description: 'Démarre directement sur la province contestée, avec économie et intrigue autour des convois du fleuve.',
    tag: 'Test rapide',
    status: 'ready',
    previewTone: 'amber',
    playable: true,
    stats: {
      Provinces: provinces.length,
      Villes: 2,
      Routes: 2,
      Alertes: intrigueOperations.length,
    },
    gameTitle: 'Crise de la Porte du Fleuve',
    gameSubtitle: 'Carte prototype centrée sur le verrou fluvial et ses opérations clandestines',
    initialState: {
      focusedProvinceId: 'river-gate',
      selectedProvinceId: 'river-gate',
      activeOverlaySlot: 'intrigue-overlay',
      popupProvinceId: 'river-gate',
      hoveredCityId: 'river-gate-city',
      selectedCityId: 'river-gate-city',
      comparedCityIds: ['river-gate-city', 'iron-plain-city'],
      comparisonProvinceIds: ['river-gate', 'iron-plain'],
      selectedIntrigueOperationId: 'op-river-locks',
      lastTurnSummary: 'La Porte du Fleuve est sélectionnée pour vérifier immédiatement carte, panels et signaux d’alerte.',
    },
  },
  {
    id: 'archipelago-coming-soon',
    title: 'Archipels marchands',
    subtitle: 'Carte future',
    description: 'Emplacement réservé pour une carte maritime; visible dans le launcher mais non lançable.',
    tag: 'Bientôt',
    status: 'locked',
    previewTone: 'slate',
    playable: false,
    stats: {
      Îles: 0,
      Routes: 0,
    },
  },
];

const state = {
  screen: 'launcher',
  selectedMapId: 'continental-prototype',
  turn: 1,
  seasonIndex: 0,
  focusedProvinceId: 'crown-heart',
  selectedProvinceId: 'river-gate',
  hoveredProvinceId: null,
  readinessFocusProvinceId: null,
  readinessFocusTone: null,
  economyReadinessFocus: null,
  activeOverlaySlot: 'culture-overlay',
  popupProvinceId: 'river-gate',
  hoveredCityId: 'river-gate-city',
  selectedCityId: 'river-gate-city',
  hoveredRouteId: null,
  selectedRouteId: null,
  queuedLogisticsActions: [],
  logisticsOutcomeMarkers: [],
  logisticsOutcomeSeverityFilter: 'all',
  selectedLogisticsOutcomeRouteId: null,
  queuedCultureActions: [],
  cultureTensionMarkers: [],
  cultureBlockerHistory: [],
  cultureTensionFilters: { eased: true, unresolved: true, escalated: true, opportunity: true },
  comparedCityIds: ['river-gate-city', 'crown-port'],
  comparisonProvinceIds: ['river-gate', 'crown-heart'],
  mobilePanelSection: 'details',
  mobileMapExpanded: true,
  mapZoom: 1,
  mapPanX: 0,
  mapPanY: 0,
  lastTurnSummary: 'Le théâtre reste sous tension, sans bascule majeure.',
  selectedIntrigueOperationId: 'op-river-ashes',
  queuedClimateInterventions: [],
  economyFilters: {
    criticalRoutes: false,
    resourceMarkers: true,
    cityLabels: false,
  },
  intrigueFilters: {
    presence: true,
    alerts: true,
    sabotage: true,
  },
  intrigueExposureOutcomeFilters: {
    lowered: false,
    unchanged: false,
    increased: false,
    hidden: false,
  },
  atlasIntrigueSignalFilters: {
    recent: false,
    stale: false,
    uncertain: false,
    probable: false,
  },
  atlasClimateForecastMode: 'current',
  atlasConflictPlaybackStep: 1,
  atlasConflictComparisonMode: 'current',
  selectedAtlasMilitaryOutcomeOptionId: null,
  acceptedRecommendedMilitaryAction: null,
  lastMilitaryOutcomeMarkers: [],
  militaryOutcomeMarkerFilters: {
    stabilized: true,
    worsened: true,
    blocked: true,
    risk: true,
  },
};

function getSelectedMapScenario() {
  return mapScenarios.find((scenario) => scenario.id === state.selectedMapId && scenario.playable !== false)
    ?? mapScenarios.find((scenario) => scenario.recommended && scenario.playable !== false)
    ?? mapScenarios.find((scenario) => scenario.playable !== false)
    ?? null;
}

function applyMapScenario(scenario) {
  if (!scenario) {
    return;
  }

  state.screen = 'game';
  state.selectedMapId = scenario.id;
  state.turn = 1;
  state.seasonIndex = 0;
  state.atlasClimateForecastMode = 'current';
  state.atlasConflictPlaybackStep = 1;
  state.atlasConflictComparisonMode = 'current';
  state.selectedAtlasMilitaryOutcomeOptionId = null;
  state.mapZoom = 1;
  state.mapPanX = 0;
  state.mapPanY = 0;
  state.mobilePanelSection = 'details';
  state.mobileMapExpanded = true;
  state.hoveredProvinceId = null;
  state.readinessFocusProvinceId = null;
  state.readinessFocusTone = null;
  state.economyReadinessFocus = null;
  state.hoveredRouteId = null;
  state.selectedRouteId = null;
  state.selectedLogisticsOutcomeRouteId = null;
  state.economyFilters = {
    criticalRoutes: false,
    resourceMarkers: true,
    cityLabels: false,
  };
  state.intrigueFilters = {
    presence: true,
    alerts: true,
    sabotage: true,
  };
  Object.assign(state, scenario.initialState ?? {});
}

const seasonLabels = ['Printemps', 'Été', 'Automne', 'Hiver'];

function getFocusContext(shell) {
  const selectedProvince = shell.provinces.find((province) => province.provinceId === state.selectedProvinceId) ?? null;
  const focusedProvince = shell.provinces.find((province) => province.provinceId === state.focusedProvinceId) ?? selectedProvince ?? null;
  const hoveredProvince = shell.provinces.find((province) => province.provinceId === state.hoveredProvinceId) ?? null;
  const anchorProvince = hoveredProvince ?? selectedProvince ?? focusedProvince;
  const neighborIds = new Set(anchorProvince?.neighborIds ?? []);

  return {
    selectedProvince,
    focusedProvince,
    hoveredProvince,
    neighborIds,
  };
}

function getProvinceGeometry(provinceId) {
  return provinceGeometryById[provinceId] ?? {};
}

function getProvinceLayout(provinceId) {
  return getProvinceGeometry(provinceId).layout ?? { x: 12, y: 12, w: 76, h: 76 };
}

function getProvincePolygon(provinceId) {
  return getProvinceGeometry(provinceId).polygon ?? '12,12 88,12 88,88 12,88';
}

function getAtlasTerrainKind(province) {
  if (province.supplyLevel === 'collapsed') return 'marsh';
  if (province.supplyLevel === 'disrupted') return 'highlands';
  if (province.provinceId.includes('river')) return 'delta';
  if (province.provinceId.includes('ridge')) return 'mountain';
  if (province.provinceId.includes('plain')) return 'steppe';
  if (province.provinceId.includes('watch')) return 'tundra';
  if (province.provinceId.includes('reach')) return 'isles';
  return 'heartland';
}

function buildAtlasTerrainShapes(shell) {
  const continents = shell.provinces.map((province) => {
    const geometry = getProvinceGeometry(province.provinceId);
    const layout = geometry.layout ?? getProvinceLayout(province.provinceId);
    return {
      provinceId: province.provinceId,
      label: province.label,
      polygon: geometry.polygon ?? getProvincePolygon(province.provinceId),
      center: getProvinceCenter(province.provinceId),
      terrain: getAtlasTerrainKind(province),
      fill: province.style.fill,
      border: province.style.border,
      relief: ['highlands', 'mountain'].includes(getAtlasTerrainKind(province)) ? 'relief' : 'soft',
      island: layout.w < 18 || getAtlasTerrainKind(province) === 'isles',
    };
  });

  const islands = continents
    .filter((shape) => shape.island)
    .map((shape) => ({
      ...shape,
      radius: shape.terrain === 'isles' ? 2.4 : 1.6,
    }));

  return {
    continents,
    islands,
    oceanBands: [
      { id: 'western-ocean', label: 'Mer d’Occident', path: 'M0,0 H21 C16,18 18,34 9,50 C18,68 13,84 22,100 H0 Z' },
      { id: 'southern-ocean', label: 'Mer Australe', path: 'M0,82 C20,76 31,84 48,79 C68,74 80,82 100,76 V100 H0 Z' },
      { id: 'eastern-sea', label: 'Mer des Brumes', path: 'M82,0 H100 V100 H90 C94,80 86,66 92,47 C84,31 91,15 82,0 Z' },
    ],
  };
}

function getAtlasMilitaryPressureScore(province) {
  let score = 0;
  if (province.contested) score += 80;
  if (province.occupied) score += 58;
  if (province.supplyLevel === 'collapsed') score += 26;
  if (province.supplyLevel === 'disrupted') score += 18;
  if (province.loyalty < 45) score += 14;
  score += Math.min(18, Math.max(0, province.strategicValue ?? 0) * 2);
  return score;
}

function getAtlasMilitaryRouteTone(route) {
  if (route.contested) return 'front';
  if (route.occupied) return 'occupation';
  return route.pressure >= 74 ? 'risk' : 'watch';
}

function getAtlasConflictRouteTrend(route) {
  if (route.contested) return 14;
  if (route.occupied) return 8;
  if (route.pressure >= 74) return 6;
  return -5;
}

function buildAtlasConflictRoutePlaybackSteps(route) {
  const trend = getAtlasConflictRouteTrend(route);
  const previousPressure = Math.max(0, route.pressure - trend);
  const projectedPressure = Math.max(0, route.pressure + Math.round(trend * 0.7));
  const direction = projectedPressure > route.pressure ? 'rising' : projectedPressure < route.pressure ? 'falling' : 'steady';

  return [
    {
      step: 0,
      key: 'previous',
      label: 'Tour -1',
      pressure: previousPressure,
      delta: route.pressure - previousPressure,
      direction: route.pressure > previousPressure ? 'rising' : route.pressure < previousPressure ? 'falling' : 'steady',
    },
    {
      step: 1,
      key: 'current',
      label: 'Actuel',
      pressure: route.pressure,
      delta: route.pressure - previousPressure,
      direction,
    },
    {
      step: 2,
      key: 'projected',
      label: 'Projection',
      pressure: projectedPressure,
      delta: projectedPressure - route.pressure,
      direction,
    },
  ];
}

function buildAtlasConflictRoutePlayback(routes, activeStep = state.atlasConflictPlaybackStep) {
  const safeStep = Math.max(0, Math.min(2, Number(activeStep) || 0));
  const playbackRoutes = routes
    .map((route) => {
      const steps = buildAtlasConflictRoutePlaybackSteps(route);
      const active = steps[safeStep] ?? steps[1];
      return {
        ...route,
        playbackSteps: steps,
        activePlayback: active,
        playbackDirection: active.direction,
      };
    })
    .filter((route) => route.playbackSteps.some((step) => step.delta !== 0));

  return {
    activeStep: safeStep,
    steps: [
      { step: 0, label: 'Tour -1' },
      { step: 1, label: 'Actuel' },
      { step: 2, label: 'Projection' },
    ],
    routes: playbackRoutes,
    empty: playbackRoutes.length === 0,
  };
}

function getAtlasConflictPlaybackSummary(playback) {
  if (playback.empty) {
    return 'Aucun historique de front actif à rejouer.';
  }

  const rising = playback.routes.filter((route) => route.activePlayback.direction === 'rising').length;
  const falling = playback.routes.filter((route) => route.activePlayback.direction === 'falling').length;
  const steady = playback.routes.length - rising - falling;
  return `${playback.steps[playback.activeStep].label}: ${rising} pression${rising > 1 ? 's' : ''} en hausse, ${falling} en baisse, ${steady} stable${steady > 1 ? 's' : ''}.`;
}

function getAtlasConflictComparisonLabel(delta, route, mode) {
  if (mode === 'initial') {
    return 'état initial';
  }
  if (route.occupied && route.activePlayback.pressure >= 70) {
    return 'route coupée';
  }
  if (delta >= 10) {
    return 'pression gagnée';
  }
  if (delta <= -8) {
    return 'front stabilisé';
  }
  if (delta > 0) {
    return 'front menacé';
  }
  if (delta < 0) {
    return 'pression perdue';
  }
  return 'stable';
}

function buildAtlasConflictRouteComparison(playback, mode = state.atlasConflictComparisonMode) {
  const modes = {
    initial: { label: 'État initial', step: 0 },
    current: { label: 'Plan courant', step: 1 },
    final: { label: 'Projection finale', step: 2 },
  };
  const selectedMode = modes[mode] ? mode : 'current';
  const selected = modes[selectedMode];

  if (!playback || playback.empty) {
    return {
      mode: selectedMode,
      modes,
      rows: [],
      summary: 'Comparaison indisponible: aucune route militaire récente.',
      empty: true,
    };
  }

  const rows = playback.routes
    .map((route) => {
      const initial = route.playbackSteps[0] ?? null;
      const current = route.playbackSteps.find((step) => step.step === selected.step) ?? route.activePlayback ?? initial;
      if (!initial || !current) {
        return null;
      }
      const delta = current.pressure - initial.pressure;
      const label = getAtlasConflictComparisonLabel(delta, { ...route, activePlayback: current }, selectedMode);
      return {
        routeId: route.routeId,
        routeLabel: `${route.sourceLabel} → ${route.targetLabel}`,
        initialPressure: initial.pressure,
        currentPressure: current.pressure,
        delta,
        label,
        tone: label === 'route coupée' || label === 'front menacé' ? 'danger' : label === 'front stabilisé' || label === 'pression perdue' ? 'relief' : 'neutral',
      };
    })
    .filter(Boolean)
    .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta) || left.routeLabel.localeCompare(right.routeLabel))
    .slice(0, 3);

  const summary = rows.length > 0
    ? `${selected.label}: ${rows.map((row) => `${row.label} ${row.delta > 0 ? '+' : ''}${row.delta}`).join(' · ')}`
    : 'Comparaison indisponible: données de pression incomplètes.';

  return {
    mode: selectedMode,
    modes,
    rows,
    summary,
    empty: rows.length === 0,
  };
}

function renderAtlasConflictRouteComparison(comparison) {
  return `
    <g class="atlas-conflict-comparison" aria-label="Comparaison avant après des routes militaires: ${comparison.summary}">
      <rect class="atlas-conflict-comparison__panel" x="61" y="24.5" width="36" height="${comparison.empty ? 10 : 13 + (comparison.rows.length * 4.6)}" rx="2.4"></rect>
      <text class="atlas-conflict-comparison__title" x="63" y="28.8">Avant / après</text>
      ${Object.entries(comparison.modes).map(([mode, config], index) => `
        <g class="atlas-conflict-comparison-mode ${comparison.mode === mode ? 'is-active' : ''}" data-atlas-conflict-comparison-mode="${mode}" aria-label="Comparer ${config.label}">
          <rect x="${63 + index * 10.5}" y="30.6" width="9.4" height="4.4" rx="1.4"></rect>
          <text x="${67.7 + index * 10.5}" y="33.5" text-anchor="middle">${mode === 'initial' ? 'Initial' : mode === 'current' ? 'Plan' : 'Final'}</text>
        </g>
      `).join('')}
      ${comparison.empty ? `<text class="atlas-conflict-comparison__empty" x="63" y="39.2">${comparison.summary}</text>` : comparison.rows.map((row, index) => `
        <g class="atlas-conflict-comparison-row atlas-conflict-comparison-row--${row.tone}">
          <text x="63" y="${39.6 + index * 4.6}">${row.label}</text>
          <text class="atlas-conflict-comparison-row__delta" x="94" y="${39.6 + index * 4.6}" text-anchor="end">${row.delta > 0 ? '+' : ''}${row.delta}</text>
          <text class="atlas-conflict-comparison-row__route" x="63" y="${41.8 + index * 4.6}">${row.routeLabel}</text>
        </g>
      `).join('')}
    </g>
  `;
}

function getAtlasMilitaryOperationEffect(route, comparisonRow) {
  if (comparisonRow?.label === 'front stabilisé' || comparisonRow?.label === 'pression perdue') {
    return 'stabiliser le front';
  }
  if (comparisonRow?.label === 'route coupée') {
    return 'rouvrir l’axe coupé';
  }
  if (route.contested) {
    return 'contenir la poussée';
  }
  if (route.occupied) {
    return 'sécuriser l’occupation';
  }
  return route.playbackDirection === 'rising' ? 'ralentir la menace' : 'exploiter le repli';
}

function getAtlasMilitaryOperationRisk(route, comparisonRow) {
  if (comparisonRow?.label === 'route coupée') {
    return 'ravitaillement coupé';
  }
  if (route.activePlayback?.direction === 'rising') {
    return 'pression en hausse';
  }
  if (route.occupied) {
    return 'contre-attaque locale';
  }
  if (route.contested) {
    return 'front instable';
  }
  return 'fenêtre courte';
}

function buildAtlasMilitaryOperationSequence(playback, comparison) {
  if (!playback || playback.empty || !playback.routes.length) {
    return {
      steps: [],
      summary: 'Plan d’opération indisponible: aucune route/front prioritaire visible.',
      empty: true,
    };
  }

  const comparisonByRouteId = new Map((comparison?.rows ?? []).map((row) => [row.routeId, row]));
  const steps = playback.routes
    .map((route) => {
      const comparisonRow = comparisonByRouteId.get(route.routeId) ?? null;
      const pressureDelta = route.activePlayback?.delta ?? 0;
      const priority = Math.abs(pressureDelta) + route.pressure + (route.contested ? 20 : 0) + (route.occupied ? 12 : 0);
      const effect = getAtlasMilitaryOperationEffect(route, comparisonRow);
      const risk = getAtlasMilitaryOperationRisk(route, comparisonRow);
      const reason = comparisonRow?.label
        ?? (pressureDelta > 0 ? 'pression gagnée' : pressureDelta < 0 ? 'pression perdue' : 'pression stable');

      return {
        stepId: `operation:${route.routeId}`,
        target: `${route.sourceLabel} → ${route.targetLabel}`,
        effect,
        risk,
        reason,
        priority,
        tone: risk.includes('hausse') || risk.includes('coupé') || risk.includes('instable') ? 'danger' : 'support',
      };
    })
    .sort((left, right) => right.priority - left.priority || left.target.localeCompare(right.target))
    .slice(0, 3);

  return {
    steps,
    summary: steps.length > 0
      ? `Plan d’opération: ${steps.map((step, index) => `${index + 1}. ${step.effect}`).join(' · ')}`
      : 'Plan d’opération indisponible: données de route incomplètes.',
    empty: steps.length === 0,
  };
}

function renderAtlasMilitaryOperationSequence(sequence) {
  const height = sequence.empty ? 10 : 10 + (sequence.steps.length * 5.9);
  return `
    <g class="atlas-military-operation-sequence" aria-label="Séquence militaire atlas: ${sequence.summary}">
      <rect class="atlas-military-operation-sequence__panel" x="3" y="54" width="38" height="${height}" rx="2.5"></rect>
      <text class="atlas-military-operation-sequence__title" x="5" y="58.3">Plan d’opération</text>
      ${sequence.empty ? `<text class="atlas-military-operation-sequence__empty" x="5" y="63.1">${sequence.summary}</text>` : sequence.steps.map((step, index) => `
        <g class="atlas-military-operation-step atlas-military-operation-step--${step.tone}" data-atlas-operation-step="${step.stepId}">
          <circle cx="${6.1}" cy="${63.2 + index * 5.9}" r="1.35"></circle>
          <text class="atlas-military-operation-step__target" x="8.2" y="${62.3 + index * 5.9}">${index + 1}. ${step.target}</text>
          <text class="atlas-military-operation-step__effect" x="8.2" y="${64.5 + index * 5.9}">${step.effect} · ${step.risk}</text>
          <text class="atlas-military-operation-step__reason" x="8.2" y="${66.4 + index * 5.9}">${step.reason}</text>
        </g>
      `).join('')}
    </g>
  `;
}

function buildAtlasMilitaryOperationOutcomeForecasts(sequence) {
  if (!sequence || sequence.empty || !sequence.steps.length) {
    return {
      options: [],
      summary: 'Prévisions indisponibles: aucune opération militaire candidate visible.',
      empty: true,
    };
  }

  const focusedStep = sequence.steps[0];
  const templates = [
    { key: 'push', label: 'Percée rapide', gain: 14, overextension: 'élevée', delay: 'court', riskBias: 2 },
    { key: 'hold', label: 'Tenir et fixer', gain: 7, overextension: 'modérée', delay: 'moyen', riskBias: 1 },
    { key: 'reserve', label: 'Réserve prudente', gain: -3, overextension: 'faible', delay: 'long', riskBias: -1 },
  ];

  const options = templates.map((template, index) => {
    const danger = focusedStep.tone === 'danger' ? 2 : 0;
    const gain = template.gain - danger + Math.max(0, Math.min(3, Math.round(focusedStep.priority / 55)));
    const riskScore = Math.max(1, Math.min(5, 3 + template.riskBias + danger));
    const frontChange = gain > 8 ? `front +${gain}` : gain >= 0 ? `front +${gain}` : `front ${gain}`;
    const risk = riskScore >= 5 ? 'surextension critique' : riskScore >= 4 ? 'surextension élevée' : riskScore >= 3 ? 'surextension contrôlée' : 'surextension basse';
    return {
      optionId: `forecast:${focusedStep.stepId}:${template.key}`,
      label: template.label,
      target: focusedStep.target,
      targetProvinceLabel: focusedStep.target.split('→').pop().trim(),
      frontChange,
      overextension: template.overextension,
      delay: template.delay,
      risk,
      detail: `${focusedStep.effect}; risque ${focusedStep.risk}; raison ${focusedStep.reason}.`,
      tone: riskScore >= 5 ? 'danger' : gain >= 8 ? 'gain' : gain < 0 ? 'delay' : 'balanced',
      rank: index + 1,
    };
  });

  return {
    options,
    summary: `Prévisions ${focusedStep.target}: ${options.map((option) => `${option.label} ${option.frontChange}`).join(' · ')}`,
    empty: false,
  };
}

function renderAtlasMilitaryOperationOutcomeForecasts(forecasts) {
  const height = forecasts.empty ? 9 : 11 + (forecasts.options.length * 4.8);
  const selectedOptionId = state.selectedAtlasMilitaryOutcomeOptionId ?? forecasts.options[0]?.optionId ?? null;
  return `
    <g class="atlas-military-outcome-forecasts" aria-label="Prévisions comparées des opérations militaires: ${forecasts.summary}">
      <rect class="atlas-military-outcome-forecasts__panel" x="42" y="54" width="55" height="${height}" rx="2.5"></rect>
      <text class="atlas-military-outcome-forecasts__title" x="44" y="58.3">Issues probables</text>
      ${forecasts.empty ? `<text class="atlas-military-outcome-forecasts__empty" x="44" y="63">${forecasts.summary}</text>` : forecasts.options.map((option, index) => `
        <g class="atlas-military-outcome-option atlas-military-outcome-option--${option.tone} ${selectedOptionId === option.optionId ? 'is-selected' : ''}" data-atlas-military-outcome-option="${option.optionId}" tabindex="0" aria-label="${option.label}: ${option.frontChange}, ${option.risk}, délai ${option.delay}. ${option.detail}">
          <circle cx="45.1" cy="${63 + index * 4.8}" r="1.15"></circle>
          <text class="atlas-military-outcome-option__line" x="47" y="${62.4 + index * 4.8}">${option.label}: ${option.frontChange} · ${option.risk}</text>
          <text class="atlas-military-outcome-option__detail" x="47" y="${64.5 + index * 4.8}">délai ${option.delay} · ${option.detail}</text>
          <title>${option.target}: ${option.detail}</title>
        </g>
      `).join('')}
    </g>
  `;
}

function buildAtlasMilitaryStagedCommitment(forecasts, selectedOptionId = state.selectedAtlasMilitaryOutcomeOptionId) {
  if (!forecasts || forecasts.empty || !forecasts.options.length) {
    return {
      selectedOption: null,
      stages: [],
      summary: 'Engagement indisponible: aucune prévision militaire pertinente.',
      empty: true,
    };
  }

  const selectedOption = forecasts.options.find((option) => option.optionId === selectedOptionId) ?? forecasts.options[0];
  const stages = [
    {
      stageId: `${selectedOption.optionId}:recon`,
      status: 'prévisionnel',
      label: 'Repérer',
      costRisk: 'coût faible / risque lecture incomplète',
      territory: selectedOption.target,
      targetProvinceLabel: selectedOption.targetProvinceLabel,
      effect: `confirmer ${selectedOption.frontChange}`,
    },
    {
      stageId: `${selectedOption.optionId}:commit`,
      status: 'à engager',
      label: 'Engager',
      costRisk: `${selectedOption.overextension} / ${selectedOption.risk}`,
      territory: selectedOption.target,
      targetProvinceLabel: selectedOption.targetProvinceLabel,
      effect: selectedOption.label,
    },
    selectedOption.delay === 'long'
      ? {
        stageId: `${selectedOption.optionId}:reserve`,
        status: 'prévisionnel',
        label: 'Réserve',
        costRisk: 'coût moyen / délai long',
        territory: selectedOption.target,
        targetProvinceLabel: selectedOption.targetProvinceLabel,
        effect: 'tenir la fenêtre ouverte',
      }
      : {
        stageId: `${selectedOption.optionId}:followup`,
        status: 'prévisionnel',
        label: 'Suivi',
        costRisk: `risque ${selectedOption.risk}`,
        territory: selectedOption.target,
        targetProvinceLabel: selectedOption.targetProvinceLabel,
        effect: `vérifier ${selectedOption.frontChange}`,
      },
  ].slice(0, 3);

  return {
    selectedOption,
    stages,
    summary: `Engagement préparé: ${selectedOption.label} sur ${selectedOption.target}; ${stages.length} étapes, ${selectedOption.delay}.`,
    empty: false,
  };
}

function renderAtlasMilitaryStagedCommitment(commitment) {
  const height = commitment.empty ? 8 : 7 + (commitment.stages.length * 4.1);
  return `
    <g class="atlas-military-staged-commitment" aria-label="Engagement militaire par étapes: ${commitment.summary}">
      <rect class="atlas-military-staged-commitment__panel" x="42" y="80" width="55" height="${height}" rx="2.5"></rect>
      <text class="atlas-military-staged-commitment__title" x="44" y="83.3">Engagement préparé</text>
      ${commitment.empty ? `<text class="atlas-military-staged-commitment__empty" x="44" y="86.5">${commitment.summary}</text>` : commitment.stages.map((stage, index) => `
        <g class="atlas-military-commitment-stage atlas-military-commitment-stage--${stage.status === 'à engager' ? 'commit' : 'preview'}" data-atlas-commitment-stage="${stage.stageId}" aria-label="${stage.label}: ${stage.status}, ${stage.territory}, ${stage.effect}, ${stage.costRisk}">
          <rect x="44" y="${84.8 + index * 4.1}" width="4.4" height="2.7" rx="0.9"></rect>
          <text class="atlas-military-commitment-stage__label" x="49.5" y="${85.9 + index * 4.1}">${index + 1}. ${stage.label} · ${stage.status}</text>
          <text class="atlas-military-commitment-stage__detail" x="49.5" y="${87.4 + index * 4.1}">${stage.territory}: ${stage.effect}</text>
          <text class="atlas-military-commitment-stage__risk" x="49.5" y="${88.9 + index * 4.1}">${stage.costRisk}</text>
        </g>
      `).join('')}
    </g>
  `;
}

function getAtlasCommitmentTargetProvince(commitment, shell) {
  const label = commitment?.selectedOption?.targetProvinceLabel
    ?? commitment?.stages?.find((stage) => stage.targetProvinceLabel)?.targetProvinceLabel
    ?? '';
  return shell.provinces.find((province) => province.label === label) ?? null;
}

function buildAtlasMilitaryCommitmentFrontConflicts(commitment, shell, features) {
  if (!commitment || commitment.empty || !commitment.stages.length) {
    return {
      conflicts: [],
      summary: 'Aucun engagement militaire préparé à comparer aux fronts actifs.',
      empty: true,
    };
  }

  const targetProvince = getAtlasCommitmentTargetProvince(commitment, shell);
  if (!targetProvince) {
    return {
      conflicts: [],
      summary: 'Conflits non calculés: cible de province introuvable dans la démo atlas.',
      empty: true,
    };
  }

  const pressureByProvinceId = new Map(shell.provinces.map((province) => [province.provinceId, getAtlasMilitaryPressureScore(province)]));
  const targetPressure = pressureByProvinceId.get(targetProvince.provinceId) ?? 0;
  const conflicts = [];

  if (!targetProvince.contested && !targetProvince.occupied && targetPressure < 50) {
    conflicts.push({
      conflictId: `stable-target:${targetProvince.provinceId}`,
      severity: 'moyenne',
      priority: 42,
      label: 'Cible déjà stabilisée',
      provinceLabel: targetProvince.label,
      explanation: `${commitment.selectedOption.label} vise ${targetProvince.label}, mais le front local paraît déjà stabilisé.`,
      decision: 'Reconfirmer avant de consommer l’engagement.',
    });
  }

  const criticalNeighbor = shell.provinces
    .filter((province) => targetProvince.neighborIds.includes(province.provinceId) && province.contested)
    .map((province) => ({
      province,
      pressure: pressureByProvinceId.get(province.provinceId) ?? 0,
      linkedRoute: features.routes.find((route) => route.sourceId === province.provinceId || route.targetId === province.provinceId) ?? null,
    }))
    .filter((entry) => entry.pressure >= targetPressure || entry.linkedRoute?.contested)
    .sort((left, right) => right.pressure - left.pressure || left.province.label.localeCompare(right.province.label))[0] ?? null;

  if (criticalNeighbor) {
    conflicts.push({
      conflictId: `ignored-front:${criticalNeighbor.province.provinceId}`,
      severity: 'haute',
      priority: 70 + criticalNeighbor.pressure,
      label: 'Front voisin plus critique ignoré',
      provinceLabel: criticalNeighbor.province.label,
      explanation: `${criticalNeighbor.province.label} reste contesté près de ${targetProvince.label}.`,
      decision: 'Prioriser ou couvrir ce front avant validation.',
    });
  }

  const sortedConflicts = conflicts
    .sort((left, right) => right.priority - left.priority || left.label.localeCompare(right.label))
    .slice(0, 3);

  return {
    conflicts: sortedConflicts,
    summary: sortedConflicts.length > 0
      ? `${sortedConflicts.length} conflit${sortedConflicts.length > 1 ? 's' : ''} engagement/front détecté${sortedConflicts.length > 1 ? 's' : ''}.`
      : `Aucun conflit détecté: ${targetProvince.label} reste cohérent avec les fronts visibles.`,
    empty: false,
  };
}

function renderAtlasMilitaryCommitmentFrontConflicts(conflicts) {
  const height = conflicts.empty || !conflicts.conflicts.length ? 8 : 7 + (conflicts.conflicts.length * 4.8);
  return `
    <g class="atlas-military-commitment-conflicts" aria-label="Conflits engagement militaire et fronts actifs: ${conflicts.summary}">
      <rect class="atlas-military-commitment-conflicts__panel" x="3" y="80" width="38" height="${height}" rx="2.5"></rect>
      <text class="atlas-military-commitment-conflicts__title" x="5" y="83.3">Conflits fronts</text>
      ${conflicts.empty || !conflicts.conflicts.length ? `<text class="atlas-military-commitment-conflicts__empty" x="5" y="86.6">${conflicts.summary}</text>` : conflicts.conflicts.map((conflict, index) => `
        <g class="atlas-military-commitment-conflict atlas-military-commitment-conflict--${conflict.severity === 'haute' ? 'high' : 'medium'}" data-atlas-commitment-conflict="${conflict.conflictId}" aria-label="${conflict.label}: priorité ${conflict.priority}, ${conflict.explanation} ${conflict.decision}">
          <circle cx="5.8" cy="${86.3 + index * 4.8}" r="1.05"></circle>
          <text class="atlas-military-commitment-conflict__label" x="7.8" y="${85.6 + index * 4.8}">${conflict.label} · ${conflict.severity}</text>
          <text class="atlas-military-commitment-conflict__explanation" x="7.8" y="${87.3 + index * 4.8}">${conflict.explanation}</text>
          <text class="atlas-military-commitment-conflict__decision" x="7.8" y="${89 + index * 4.8}">${conflict.decision}</text>
        </g>
      `).join('')}
    </g>
  `;
}

function buildAtlasMilitaryCommitmentCoverageSummary(commitment, conflicts, shell, features) {
  const pressureByProvinceId = new Map(shell.provinces.map((province) => [province.provinceId, getAtlasMilitaryPressureScore(province)]));
  const targetProvince = getAtlasCommitmentTargetProvince(commitment, shell);
  const committedStages = commitment?.stages?.filter((stage) => stage.status === 'à engager').length ?? 0;
  const activeStages = commitment?.stages?.length ?? 0;
  const coveredProvinceIds = new Set(targetProvince ? [targetProvince.provinceId] : []);
  const uncoveredFronts = shell.provinces
    .filter((province) => province.contested && !coveredProvinceIds.has(province.provinceId))
    .map((province) => ({
      provinceId: province.provinceId,
      label: province.label,
      pressure: pressureByProvinceId.get(province.provinceId) ?? 0,
      reason: 'front actif sans engagement direct',
    }))
    .sort((left, right) => right.pressure - left.pressure || left.label.localeCompare(right.label));

  const contradictoryFronts = (conflicts?.conflicts ?? [])
    .filter((conflict) => conflict.severity === 'haute' || conflict.label.includes('stabilisée'))
    .map((conflict) => ({
      conflictId: conflict.conflictId,
      label: conflict.provinceLabel,
      reason: conflict.label,
      priority: conflict.priority,
    }));

  const frontPriority = uncoveredFronts[0]
    ?? (targetProvince ? {
      provinceId: targetProvince.provinceId,
      label: targetProvince.label,
      pressure: pressureByProvinceId.get(targetProvince.provinceId) ?? 0,
      reason: 'front couvert par engagement préparé',
    } : null);

  const nextDeadline = commitment?.selectedOption?.delay
    ? `échéance ${commitment.selectedOption.delay}`
    : 'échéance non planifiée';
  const rows = [
    {
      key: 'active',
      label: 'Actifs',
      value: `${activeStages} étape${activeStages > 1 ? 's' : ''} · ${committedStages} à engager`,
      tone: activeStages > 0 ? 'covered' : 'uncovered',
    },
    {
      key: 'conflicts',
      label: 'Conflits',
      value: `${conflicts?.conflicts?.length ?? 0} détecté${(conflicts?.conflicts?.length ?? 0) > 1 ? 's' : ''}`,
      tone: conflicts?.conflicts?.length ? 'conflict' : 'covered',
    },
    {
      key: 'priority',
      label: 'Priorité',
      value: frontPriority ? `${frontPriority.label} · ${frontPriority.reason}` : 'aucun front visible',
      tone: uncoveredFronts.length ? 'uncovered' : 'covered',
    },
    {
      key: 'deadline',
      label: 'Échéance',
      value: nextDeadline,
      tone: nextDeadline.includes('long') ? 'uncovered' : 'covered',
    },
  ];

  return {
    rows,
    uncoveredFronts: uncoveredFronts.slice(0, 2),
    contradictoryFronts: contradictoryFronts.slice(0, 2),
    summary: activeStages > 0
      ? `${activeStages} étape${activeStages > 1 ? 's' : ''}; ${uncoveredFronts.length} front${uncoveredFronts.length > 1 ? 's' : ''} non couvert${uncoveredFronts.length > 1 ? 's' : ''}; ${conflicts?.conflicts?.length ?? 0} conflit${(conflicts?.conflicts?.length ?? 0) > 1 ? 's' : ''}.`
      : 'Aucun engagement militaire staged actif à agréger par front.',
    empty: activeStages === 0,
  };
}

function renderAtlasMilitaryCommitmentCoverageSummary(coverage) {
  const extraCount = Math.min(2, (coverage.uncoveredFronts?.length ?? 0) + (coverage.contradictoryFronts?.length ?? 0));
  const height = coverage.empty ? 8 : 8 + (coverage.rows.length * 3.1) + (extraCount * 2.7);
  const extraRows = [
    ...(coverage.uncoveredFronts ?? []).map((front) => ({ tone: 'uncovered', label: `Non couvert: ${front.label}` })),
    ...(coverage.contradictoryFronts ?? []).map((front) => ({ tone: 'conflict', label: `Contradictoire: ${front.label}` })),
  ].slice(0, 2);

  return `
    <g class="atlas-military-commitment-coverage" aria-label="Synthèse couverture engagements militaires par front: ${coverage.summary}">
      <rect class="atlas-military-commitment-coverage__panel" x="3" y="61" width="38" height="${height}" rx="2.5"></rect>
      <text class="atlas-military-commitment-coverage__title" x="5" y="64.4">Couverture engagements</text>
      ${coverage.empty ? `<text class="atlas-military-commitment-coverage__empty" x="5" y="68">${coverage.summary}</text>` : `
        ${coverage.rows.map((row, index) => `
          <g class="atlas-military-coverage-row atlas-military-coverage-row--${row.tone}" data-atlas-coverage-row="${row.key}">
            <text class="atlas-military-coverage-row__label" x="5" y="${68 + index * 3.1}">${row.label}</text>
            <text class="atlas-military-coverage-row__value" x="14" y="${68 + index * 3.1}">${row.value}</text>
          </g>
        `).join('')}
        ${extraRows.map((row, index) => `
          <text class="atlas-military-coverage-extra atlas-military-coverage-extra--${row.tone}" x="5" y="${81.2 + index * 2.7}">${row.label}</text>
        `).join('')}
      `}
    </g>
  `;
}

function buildAtlasMilitaryCommitmentDebtSummary(coverage, commitment, shell) {
  const pressureByProvinceId = new Map(shell.provinces.map((province) => [province.provinceId, getAtlasMilitaryPressureScore(province)]));
  const targetProvince = getAtlasCommitmentTargetProvince(commitment, shell);
  const coveredProvinceIds = new Set(targetProvince ? [targetProvince.provinceId] : []);
  const debtByProvinceId = new Map();

  (coverage?.uncoveredFronts ?? []).forEach((front) => {
    debtByProvinceId.set(front.provinceId, {
      debtId: `uncovered:${front.provinceId}`,
      provinceId: front.provinceId,
      label: front.label,
      tone: 'absent',
      severity: 'haute',
      priority: 70 + front.pressure,
      reason: front.pressure >= 70 ? 'pression élevée non couverte' : 'front actif sans engagement',
    });
  });

  shell.provinces
    .filter((province) => province.contested && !coveredProvinceIds.has(province.provinceId))
    .forEach((province) => {
      const pressure = pressureByProvinceId.get(province.provinceId) ?? 0;
      if (pressure < 55 || debtByProvinceId.has(province.provinceId)) return;
      debtByProvinceId.set(province.provinceId, {
        debtId: `threat:${province.provinceId}`,
        provinceId: province.provinceId,
        label: province.label,
        tone: 'threat',
        severity: 'moyenne',
        priority: 52 + pressure,
        reason: 'menace active encore non couverte',
      });
    });

  (coverage?.contradictoryFronts ?? []).forEach((front) => {
    debtByProvinceId.set(front.conflictId, {
      debtId: `contradictory:${front.conflictId}`,
      provinceId: null,
      label: front.label,
      tone: 'partial',
      severity: 'moyenne',
      priority: front.priority,
      reason: front.reason.includes('stabilisée') ? 'soutien engagé sur front stabilisé' : 'soutien engagé ailleurs',
    });
  });

  const debts = [...debtByProvinceId.values()]
    .sort((left, right) => right.priority - left.priority || left.label.localeCompare(right.label))
    .slice(0, 3)
    .map((debt) => ({
      ...debt,
      center: debt.provinceId ? getProvinceCenter(debt.provinceId) : null,
    }));

  return {
    debts,
    summary: debts.length > 0
      ? `${debts.length} dette${debts.length > 1 ? 's' : ''} d’engagement: ${debts.map((debt) => debt.label).join(', ')}.`
      : 'Dette d’engagement nulle: tous les fronts actifs visibles sont couverts.',
    empty: debts.length === 0,
  };
}

function renderAtlasMilitaryCommitmentDebtSummary(debtSummary) {
  const height = debtSummary.empty ? 8 : 8 + (debtSummary.debts.length * 3.9);
  return `
    <g class="atlas-military-commitment-debt" aria-label="Dette d’engagement militaire restante: ${debtSummary.summary}">
      <rect class="atlas-military-commitment-debt__panel" x="61" y="25" width="36" height="${height}" rx="2.4"></rect>
      <text class="atlas-military-commitment-debt__title" x="63" y="28.4">Dette engagement</text>
      ${debtSummary.empty ? `<text class="atlas-military-commitment-debt__empty" x="63" y="32">${debtSummary.summary}</text>` : debtSummary.debts.map((debt, index) => `
        <g class="atlas-military-debt-row atlas-military-debt-row--${debt.tone}" data-atlas-commitment-debt="${debt.debtId}" aria-label="${debt.label}: ${debt.reason}, priorité ${debt.priority}">
          <circle cx="63.9" cy="${32 + index * 3.9}" r="0.9"></circle>
          <text class="atlas-military-debt-row__label" x="65.5" y="${31.4 + index * 3.9}">${debt.label} · ${debt.severity}</text>
          <text class="atlas-military-debt-row__reason" x="65.5" y="${33.1 + index * 3.9}">${debt.reason}</text>
        </g>
      `).join('')}
      ${debtSummary.debts.filter((debt) => debt.center).map((debt) => `
        <g class="atlas-military-debt-marker atlas-military-debt-marker--${debt.tone}" data-atlas-commitment-debt-marker="${debt.debtId}" aria-label="Dette ${debt.label}: ${debt.reason}">
          <circle cx="${debt.center.x}%" cy="${debt.center.y}%" r="1.45"></circle>
          <text x="${debt.center.x}%" y="${debt.center.y - 2.1}%" text-anchor="middle">DETTE</text>
        </g>
      `).join('')}
    </g>
  `;
}

function getAtlasCommitmentDelayPressure(delay) {
  if (delay === 'court') return { score: 22, label: 'fenêtre courte' };
  if (delay === 'moyen') return { score: 12, label: 'fenêtre moyenne' };
  if (delay === 'long') return { score: 4, label: 'fenêtre longue' };
  return { score: 8, label: 'délai incertain' };
}

function buildAtlasMilitaryCommitmentDebtPriorities(debtSummary, coverage, commitment) {
  if (!debtSummary || debtSummary.empty || !debtSummary.debts.length) {
    return {
      priorities: [],
      summary: 'Aucune dette prioritaire: tous les fronts visibles sont couverts ou non urgents.',
      empty: true,
    };
  }

  const delayPressure = getAtlasCommitmentDelayPressure(commitment?.selectedOption?.delay);
  const uncoveredIds = new Set((coverage?.uncoveredFronts ?? []).map((front) => front.provinceId));
  const priorities = debtSummary.debts
    .map((debt) => {
      const coverageGap = debt.tone === 'absent' || uncoveredIds.has(debt.provinceId) ? 24 : debt.tone === 'partial' ? 14 : 8;
      const pressureScore = Math.max(0, Math.round(debt.priority / 3));
      const urgencyScore = pressureScore + coverageGap + delayPressure.score;
      const reason = debt.tone === 'absent'
        ? `couverture insuffisante · ${debt.reason}`
        : debt.tone === 'threat'
          ? `pression élevée · ${debt.reason}`
          : `soutien partiel · ${debt.reason}`;
      return {
        priorityId: `priority:${debt.debtId}`,
        label: debt.label,
        tone: urgencyScore >= 75 ? 'critical' : urgencyScore >= 58 ? 'high' : 'watch',
        urgencyScore,
        reason,
        delayLabel: delayPressure.label,
        center: debt.center,
      };
    })
    .sort((left, right) => right.urgencyScore - left.urgencyScore || left.label.localeCompare(right.label))
    .slice(0, 3);

  return {
    priorities,
    summary: priorities.length > 0
      ? `Priorité dette: ${priorities.map((priority, index) => `${index + 1}. ${priority.label}`).join(' · ')}.`
      : 'Aucune dette prioritaire: pas de dette active visible.',
    empty: priorities.length === 0,
  };
}

function renderAtlasMilitaryCommitmentDebtPriorities(prioritySummary) {
  const height = prioritySummary.empty ? 7.5 : 7 + (prioritySummary.priorities.length * 3.9);
  return `
    <g class="atlas-military-commitment-priority" aria-label="Priorités de dette d’engagement militaire: ${prioritySummary.summary}">
      <rect class="atlas-military-commitment-priority__panel" x="61" y="46" width="36" height="${height}" rx="2.4"></rect>
      <text class="atlas-military-commitment-priority__title" x="63" y="49.2">Priorité dette</text>
      ${prioritySummary.empty ? `<text class="atlas-military-commitment-priority__empty" x="63" y="52.6">${prioritySummary.summary}</text>` : prioritySummary.priorities.map((priority, index) => `
        <g class="atlas-military-priority-row atlas-military-priority-row--${priority.tone}" data-atlas-commitment-priority="${priority.priorityId}" aria-label="${index + 1}. ${priority.label}: score ${priority.urgencyScore}, ${priority.reason}, ${priority.delayLabel}">
          <rect x="63" y="${51 + index * 3.9}" width="3.6" height="2.6" rx="0.8"></rect>
          <text class="atlas-military-priority-row__label" x="67.2" y="${52 + index * 3.9}">${index + 1}. ${priority.label} · ${priority.urgencyScore}</text>
          <text class="atlas-military-priority-row__reason" x="67.2" y="${53.7 + index * 3.9}">${priority.reason} · ${priority.delayLabel}</text>
        </g>
      `).join('')}
      ${prioritySummary.priorities.filter((priority) => priority.center).map((priority, index) => `
        <g class="atlas-military-priority-marker atlas-military-priority-marker--${priority.tone}" data-atlas-commitment-priority-marker="${priority.priorityId}" aria-label="Priorité ${index + 1} ${priority.label}: ${priority.reason}">
          <circle cx="${priority.center.x}%" cy="${priority.center.y}%" r="2.05"></circle>
          <text x="${priority.center.x}%" y="${priority.center.y + 0.55}%" text-anchor="middle">P${index + 1}</text>
        </g>
      `).join('')}
    </g>
  `;
}


function getAtlasCommitmentDebtDegradation(debt) {
  if (debt.tone === 'absent') return 'initiative du front peut chuter au prochain tour';
  if (debt.tone === 'threat') return 'pression ennemie peut fermer la route voisine';
  return 'engagement dispersé peut consommer la fenêtre utile';
}

function getAtlasCommitmentDebtImmediateAction(debt, commitment) {
  const target = commitment?.selectedOption?.target ?? debt.label;
  if (debt.tone === 'absent') return `détacher l’engagement préparé vers ${debt.label}`;
  if (debt.tone === 'threat') return `renforcer ${debt.label} avant de confirmer ${target}`;
  return `reconfirmer l’ordre ou couvrir ${debt.label} avant validation`;
}

function buildAtlasMilitaryCommitmentNextTurnWarnings(prioritySummary, debtSummary, coverage, commitment) {
  if (!prioritySummary || prioritySummary.empty || !debtSummary || debtSummary.empty) {
    return {
      warnings: [],
      summary: 'Aucune alerte prochain tour: dette couverte ou faible risque.',
      empty: true,
    };
  }

  const highRiskPriorities = new Map(prioritySummary.priorities
    .filter((priority) => priority.urgencyScore >= 58 && priority.tone !== 'watch')
    .map((priority) => [priority.label, priority]));
  const uncoveredIds = new Set((coverage?.uncoveredFronts ?? []).map((front) => front.provinceId));
  const contradictoryLabels = new Set((coverage?.contradictoryFronts ?? []).map((front) => front.label));
  const warnings = debtSummary.debts
    .map((debt) => {
      const priority = highRiskPriorities.get(debt.label);
      const unresolved = debt.tone === 'absent' || uncoveredIds.has(debt.provinceId) || contradictoryLabels.has(debt.label) || debt.tone === 'threat';
      if (!priority || !unresolved) return null;
      const frontRoute = debt.provinceId ? `front ${debt.label}` : `route ${commitment?.selectedOption?.target ?? debt.label}`;
      return {
        warningId: `next-turn:${debt.debtId}`,
        sourceId: debt.provinceId ?? debt.debtId,
        debtId: debt.debtId,
        debtTone: debt.tone,
        label: debt.label,
        frontRoute,
        tone: priority.tone,
        urgencyScore: priority.urgencyScore,
        reason: debt.reason,
        frontRisk: debt.priority,
        degradation: getAtlasCommitmentDebtDegradation(debt),
        action: getAtlasCommitmentDebtImmediateAction(debt, commitment),
        center: debt.center,
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.urgencyScore - left.urgencyScore || left.label.localeCompare(right.label))
    .slice(0, 2);

  return {
    warnings,
    summary: warnings.length > 0
      ? `Alerte prochain tour: ${warnings.map((warning) => `${warning.label} — ${warning.degradation}`).join(' · ')}.`
      : 'Aucune alerte prochain tour: dette couverte ou faible risque.',
    empty: warnings.length === 0,
  };
}

function renderAtlasMilitaryCommitmentNextTurnWarnings(warningSummary) {
  const height = warningSummary.empty ? 8 : 7 + (warningSummary.warnings.length * 5.1);
  return `
    <g class="atlas-military-commitment-warning" aria-label="Alertes militaires prochain tour: ${warningSummary.summary}">
      <rect class="atlas-military-commitment-warning__panel" x="42" y="61" width="55" height="${height}" rx="2.5"></rect>
      <text class="atlas-military-commitment-warning__title" x="44" y="64.3">Alerte prochain tour</text>
      ${warningSummary.empty ? `<text class="atlas-military-commitment-warning__empty" x="44" y="67.5">${warningSummary.summary}</text>` : warningSummary.warnings.map((warning, index) => `
        <g class="atlas-military-warning-row atlas-military-warning-row--${warning.tone}" data-atlas-commitment-warning="${warning.warningId}" aria-label="${warning.frontRoute}: ${warning.reason}; risque prochain tour: ${warning.degradation}; action recommandée: ${warning.action}">
          <rect x="44" y="${66 + index * 5.1}" width="4.2" height="3" rx="0.9"></rect>
          <text class="atlas-military-warning-row__label" x="49.4" y="${67.1 + index * 5.1}">${warning.frontRoute} · ${warning.urgencyScore}</text>
          <text class="atlas-military-warning-row__degradation" x="49.4" y="${68.8 + index * 5.1}">${warning.degradation}</text>
          <text class="atlas-military-warning-row__action" x="49.4" y="${70.5 + index * 5.1}">${warning.action}</text>
        </g>
      `).join('')}
      ${warningSummary.warnings.filter((warning) => warning.center).map((warning, index) => `
        <g class="atlas-military-warning-marker atlas-military-warning-marker--${warning.tone}" data-atlas-commitment-warning-marker="${warning.warningId}" aria-label="Alerte ${warning.label}: ${warning.degradation}">
          <circle cx="${warning.center.x}%" cy="${warning.center.y}%" r="2.35"></circle>
          <text x="${warning.center.x}%" y="${warning.center.y + 0.55}%" text-anchor="middle">A${index + 1}</text>
        </g>
      `).join('')}
    </g>
  `;
}


function getAtlasMilitaryWarningDegradationScore(warning) {
  if (warning.debtTone === 'absent') return 24;
  if (warning.debtTone === 'threat') return 18;
  return 12;
}

function getAtlasMilitaryWarningRouteExposure(warning, features) {
  if (!warning.sourceId) return 0;
  return Math.max(0, ...(features?.routes ?? [])
    .filter((route) => route.sourceId === warning.sourceId || route.targetId === warning.sourceId)
    .map((route) => Math.round(route.pressure / 4)));
}

function buildAtlasMilitaryWarningPriorityStack(warningSummary, features) {
  if (!warningSummary || warningSummary.empty || !warningSummary.warnings.length) {
    return {
      stack: [],
      summary: 'Pile priorité inactive: aucune alerte militaire high-risk non résolue.',
      empty: true,
    };
  }

  const stack = warningSummary.warnings
    .map((warning) => {
      const uncoveredDebt = warning.debtTone === 'absent' ? 24 : warning.debtTone === 'partial' ? 14 : 8;
      const routeExposure = getAtlasMilitaryWarningRouteExposure(warning, features);
      const degradationScore = getAtlasMilitaryWarningDegradationScore(warning);
      const stackScore = warning.frontRisk + uncoveredDebt + routeExposure + degradationScore;
      return {
        ...warning,
        stackId: `stack:${warning.warningId}`,
        stackScore,
        routeExposure,
        whyFirst: `${warning.reason}; risque ${warning.frontRisk}, dette ${uncoveredDebt}, route ${routeExposure}, prochain tour ${degradationScore}`,
      };
    })
    .sort((left, right) => right.stackScore - left.stackScore || left.sourceId.localeCompare(right.sourceId) || left.label.localeCompare(right.label))
    .slice(0, 3);

  return {
    stack,
    summary: stack.length > 0
      ? `Priorité opération: ${stack[0].label} d’abord — ${stack[0].whyFirst}.`
      : 'Pile priorité inactive: aucune alerte militaire high-risk non résolue.',
    empty: stack.length === 0,
  };
}


function getAtlasMilitaryTopWarningReliefTone(reliefScore) {
  if (reliefScore >= 38) return 'relief-high';
  if (reliefScore >= 22) return 'relief-partial';
  return 'no-meaningful-relief';
}

function buildAtlasMilitaryTopWarningReliefPreview(priorityStack) {
  const topWarning = priorityStack?.stack?.[0] ?? null;
  if (!topWarning) {
    return {
      preview: null,
      summary: 'Aucun gain prévisible: aucune alerte militaire prioritaire actionnable.',
      empty: true,
    };
  }

  const frontRiskReduction = Math.min(36, Math.max(0, Math.round(topWarning.frontRisk * 0.28)));
  const commitmentDebtCleared = topWarning.debtTone === 'absent' ? 18 : topWarning.debtTone === 'partial' ? 10 : 7;
  const routeExposureReduced = Math.min(12, Math.max(0, topWarning.routeExposure));
  const reliefScore = frontRiskReduction + commitmentDebtCleared + routeExposureReduced;
  const tone = getAtlasMilitaryTopWarningReliefTone(reliefScore);

  if (tone === 'no-meaningful-relief') {
    return {
      preview: null,
      summary: `Aucun gain significatif prévu pour ${topWarning.label}: surveiller avant d’engager.`,
      empty: true,
    };
  }

  return {
    preview: {
      reliefId: `relief:${topWarning.warningId}`,
      label: topWarning.label,
      tone,
      reliefScore,
      frontRiskReduction,
      commitmentDebtCleared: topWarning.debtTone === 'absent' ? 'dette directe levée' : topWarning.debtTone === 'partial' ? 'dette partielle clarifiée' : 'menace contenue',
      routeExposureReduced,
      action: topWarning.action,
    },
    summary: `${topWarning.label}: risque -${frontRiskReduction}, dette ${topWarning.debtTone}, route -${routeExposureReduced}.`,
    empty: false,
  };
}

function renderAtlasMilitaryTopWarningReliefPreview(reliefPreview) {
  if (!reliefPreview || reliefPreview.empty || !reliefPreview.preview) return '';
  const preview = reliefPreview.preview;
  return `
    <g class="atlas-military-warning-relief atlas-military-warning-relief--${preview.tone}" data-atlas-warning-relief="${preview.reliefId}" aria-label="Gain attendu si priorité traitée: ${reliefPreview.summary} Action: ${preview.action}">
      <rect class="atlas-military-warning-relief__panel" x="22" y="48.2" width="16" height="4.6" rx="1.2"></rect>
      <text class="atlas-military-warning-relief__label" x="23.2" y="49.8">gain ${preview.tone === 'relief-high' ? 'fort' : 'partiel'} · ${preview.reliefScore}</text>
      <text class="atlas-military-warning-relief__detail" x="23.2" y="51.5">risque -${preview.frontRiskReduction} · route -${preview.routeExposureReduced}</text>
    </g>
  `;
}


function buildAtlasMilitaryBestNextOrderHint(priorityStack, reliefPreview, commitment) {
  const topWarning = priorityStack?.stack?.[0] ?? null;
  const preview = reliefPreview?.preview ?? null;
  if (!topWarning || !preview) {
    return {
      hint: null,
      summary: 'Aucun ordre recommandé: pas de priorité actionnable avec gain clair.',
      empty: true,
    };
  }

  const candidate = topWarning.debtTone === 'absent'
    ? {
      type: 'reinforce-front',
      order: 'Renforcer front',
      detail: `basculer l’engagement vers ${topWarning.label}`,
      score: preview.frontRiskReduction + 18,
    }
    : topWarning.routeExposure >= 10 && preview.routeExposureReduced > 0
      ? {
        type: 'clear-route-exposure',
        order: 'Ouvrir route',
        detail: `sécuriser l’axe exposé de ${topWarning.label}`,
        score: preview.routeExposureReduced + 14,
      }
      : topWarning.debtTone === 'partial'
        ? {
          type: 'reduce-overcommitment',
          order: 'Réduire surengagement',
          detail: `recentrer ${commitment?.selectedOption?.target ?? topWarning.label}`,
          score: Math.max(12, preview.reliefScore - 8),
        }
        : null;

  if (!candidate || candidate.score < 12) {
    return {
      hint: null,
      summary: `Aucun ordre clair pour ${topWarning.label}: gain trop incertain.`,
      empty: true,
    };
  }

  return {
    hint: {
      hintId: `order:${topWarning.warningId}`,
      ...candidate,
      label: topWarning.label,
      reliefTone: preview.tone,
    },
    summary: `${candidate.order}: ${candidate.detail} pour débloquer ${preview.reliefScore} de relief.`,
    empty: false,
  };
}

function renderAtlasMilitaryBestNextOrderHint(orderHint) {
  if (!orderHint || orderHint.empty || !orderHint.hint) return '';
  const hint = orderHint.hint;
  return `
    <g class="atlas-military-best-order atlas-military-best-order--${hint.type}" data-atlas-best-next-order="${hint.hintId}" aria-label="Meilleur prochain ordre: ${orderHint.summary}">
      <rect class="atlas-military-best-order__panel" x="22" y="53.2" width="16" height="4.4" rx="1.2"></rect>
      <text class="atlas-military-best-order__label" x="23.2" y="54.8">ordre: ${hint.order}</text>
      <text class="atlas-military-best-order__detail" x="23.2" y="56.4">${hint.detail}</text>
    </g>
  `;
}


function getAtlasMilitaryBestOrderBlocker(topWarning, orderHint, reliefPreview, commitment) {
  const hint = orderHint?.hint ?? null;
  const preview = reliefPreview?.preview ?? null;
  if (!topWarning || !hint || !preview) return 'no-safe-fallback';
  if (hint.type === 'reinforce-front' && topWarning.frontRisk >= 112) return 'resource-blocked';
  if (hint.type === 'clear-route-exposure' && topWarning.routeExposure >= 14) return 'route-blocked';
  if (hint.type === 'reduce-overcommitment' && (commitment?.selectedOption?.delay === 'long' || preview.reliefScore < 30)) return 'overcommitment-blocked';
  return 'no-safe-fallback';
}

function buildAtlasMilitaryFallbackCrossDomainBlocker(fallback, topWarning, shell) {
  if (!fallback || !topWarning || !shell) return null;
  const province = (shell.provinces ?? []).find((candidate) => candidate.provinceId === topWarning.sourceId) ?? null;
  if (!province) {
    return {
      type: 'no-clear-cross-domain-blocker',
      label: 'blocage transversal: aucun clair',
      detail: 'aucun signal carte relié',
    };
  }

  const exposedCellule = intrigueCellules
    .filter((cellule) => cellule.locationId === province.provinceId && cellule.exposure >= 60)
    .sort((left, right) => right.exposure - left.exposure || left.codename.localeCompare(right.codename))[0] ?? null;
  const strainedCulture = province.loyalty <= 42;
  const climatePressure = province.supplyLevel === 'strained' && topWarning.frontRisk >= 118;
  const budgetOrLogistics = province.supplyLevel === 'collapsed' || fallback.type === 'resource-blocked' || topWarning.routeExposure >= 16;

  if (budgetOrLogistics) {
    return {
      type: 'budget-logistics',
      label: 'blocker: budget/logistique',
      detail: province.supplyLevel === 'collapsed' ? 'approvisionnement effondré' : 'corridor trop coûteux',
    };
  }

  if (exposedCellule) {
    return {
      type: 'intrigue-exposure',
      label: 'blocker: exposition intrigue',
      detail: `cellule ${exposedCellule.codename} exposée`,
    };
  }

  if (strainedCulture) {
    return {
      type: 'cultural-tension',
      label: 'blocker: tension culturelle',
      detail: `loyauté ${province.loyalty}`,
    };
  }

  if (climatePressure) {
    return {
      type: 'climate-pressure',
      label: 'blocker: pression climat',
      detail: 'réserves saisonnières contraintes',
    };
  }

  return {
    type: 'no-clear-cross-domain-blocker',
    label: 'blocage transversal: aucun clair',
    detail: 'aucun signal carte prioritaire',
  };
}

function buildAtlasMilitaryFallbackSafetyReason(fallback, topWarning, orderHint, reliefPreview, commitment) {
  if (!fallback || !topWarning || !orderHint?.hint || !reliefPreview?.preview) {
    return {
      type: 'no-clear-safety-reason',
      label: 'sécurité non confirmée',
      detail: 'aucun motif sûr visible',
    };
  }

  if (fallback.type === 'overcommitment-blocked') {
    return {
      type: 'avoids-overcommitment',
      label: 'plus sûr: évite surengagement',
      detail: `charge gelée sur ${commitment?.selectedOption?.target ?? topWarning.label}`,
    };
  }

  if (fallback.type === 'route-blocked') {
    return {
      type: 'bypasses-route-exposure',
      label: 'plus sûr: contourne route exposée',
      detail: `exposition route ${topWarning.routeExposure} évitée`,
    };
  }

  if (fallback.type === 'resource-blocked' && topWarning.frontRisk >= 120) {
    return {
      type: 'waits-for-resupply',
      label: 'plus sûr: attend ravitaillement',
      detail: 'réserve légère sans dépense lourde',
    };
  }

  if (fallback.type === 'resource-blocked') {
    return {
      type: 'preserves-front-coverage',
      label: 'plus sûr: garde couverture',
      detail: `front ${topWarning.label} tenu sans percée`,
    };
  }

  return {
    type: 'no-clear-safety-reason',
    label: 'sécurité non confirmée',
    detail: 'aucun motif sûr visible',
  };
}

function buildAtlasMilitaryFallbackSelectionPreview(fallback, topWarning, reliefPreview) {
  if (!fallback || !topWarning || !reliefPreview?.preview) {
    return null;
  }

  if (fallback.type === 'route-blocked' && topWarning.routeExposure > 0) {
    return {
      type: 'exposure-reduced',
      label: 'après choix: exposition réduite',
      detail: `route visible -${Math.min(12, topWarning.routeExposure)}`,
    };
  }

  if (fallback.type === 'overcommitment-blocked') {
    return {
      type: 'capacity-freed',
      label: 'après choix: capacité libérée',
      detail: 'charge active allégée avant ordre lourd',
    };
  }

  if (fallback.type === 'resource-blocked' && topWarning.frontRisk >= 120) {
    return {
      type: 'reinforcement-window-opened',
      label: 'après choix: fenêtre renfort ouverte',
      detail: 'réserve tenue jusqu’au ravitaillement visible',
    };
  }

  if (fallback.type === 'resource-blocked') {
    return {
      type: 'front-stabilized',
      label: 'après choix: front stabilisé',
      detail: `couverture maintenue sur ${topWarning.label}`,
    };
  }

  return {
    type: 'no-safe-visible-change',
    label: 'après choix: aucun changement sûr',
    detail: 'aucun gain visible garanti',
  };
}

function buildAtlasMilitaryFallbackResidualRisks(fallback, topWarning, shell, priorityStack) {
  if (!fallback || !topWarning) return [];
  const province = (shell?.provinces ?? []).find((candidate) => candidate.provinceId === topWarning.sourceId) ?? null;
  const lowerWarning = (priorityStack?.stack ?? []).find((warning) => warning.warningId !== topWarning.warningId) ?? null;
  const risks = [];

  if (lowerWarning) {
    risks.push({
      key: `neighbor-front:${lowerWarning.sourceId ?? lowerWarning.debtId}`,
      label: 'front voisin fragile',
      reason: `${lowerWarning.label} reste à ${lowerWarning.stackScore}`,
      priority: 10,
    });
  }

  if (province?.contested) {
    risks.push({
      key: `contested-occupation:${province.provinceId}`,
      label: 'occupation contestée',
      reason: `${province.label} reste disputée`,
      priority: 20,
    });
  }

  if (province?.loyalty <= 45) {
    risks.push({
      key: `low-loyalty:${province.provinceId}`,
      label: 'loyauté basse',
      reason: `loyauté ${province.loyalty}`,
      priority: 30,
    });
  }

  if (province?.supplyLevel === 'collapsed' || province?.supplyLevel === 'strained') {
    risks.push({
      key: `supply-pressure:${province.provinceId}`,
      label: 'pression ravitaillement',
      reason: province.supplyLevel === 'collapsed' ? 'approvisionnement effondré' : 'approvisionnement tendu',
      priority: 40,
    });
  }

  if (fallback.type === 'route-blocked' && topWarning.routeExposure >= 18) {
    risks.push({
      key: `route-exposure:${topWarning.sourceId}`,
      label: 'axe encore exposé',
      reason: `exposition route ${topWarning.routeExposure}`,
      priority: 50,
    });
  }

  return risks
    .sort((left, right) => left.priority - right.priority || left.key.localeCompare(right.key))
    .slice(0, 3)
    .map(({ priority, ...risk }) => risk);
}

function buildAtlasMilitaryFallbackCleanupOrders(residualRisks, fallback) {
  if (!fallback || !Array.isArray(residualRisks) || residualRisks.length === 0) return [];

  const cleanupByRisk = {
    'neighbor-front': {
      label: 'Caler couverture voisine',
      reason: 'menace élevée sans ordre lourd',
      prerequisite: 'réserve légère disponible',
      threat: 86,
      cost: 22,
      sideEffect: 12,
    },
    'contested-occupation': {
      label: 'Stabiliser occupation',
      reason: 'zone disputée avant poussée',
      prerequisite: 'patrouille locale non engagée',
      threat: 78,
      cost: 28,
      sideEffect: 18,
    },
    'low-loyalty': {
      label: 'Envoyer liaison locale',
      reason: 'faible coût et peu d’effet secondaire',
      prerequisite: 'émissaire disponible',
      threat: 62,
      cost: 12,
      sideEffect: 8,
    },
    'supply-pressure': {
      label: 'Prioriser convoi court',
      reason: 'ravitaillement visible à faible détour',
      prerequisite: 'corridor court ouvert',
      threat: 74,
      cost: 18,
      sideEffect: 10,
    },
    'route-exposure': {
      label: 'Scanner axe détour',
      reason: 'réduit l’exposition sans combat',
      prerequisite: 'éclaireurs disponibles',
      threat: 70,
      cost: 16,
      sideEffect: 9,
    },
  };

  return residualRisks
    .map((risk) => {
      const riskType = risk.key.split(':')[0];
      const cleanup = cleanupByRisk[riskType] ?? {
        label: 'Surveiller risque restant',
        reason: 'risque visible sans action sûre dédiée',
        prerequisite: 'attendre signal clair',
        threat: 40,
        cost: 12,
        sideEffect: 8,
      };
      const safetyScore = cleanup.threat - cleanup.cost - cleanup.sideEffect;
      return {
        id: `cleanup:${fallback.type}:${risk.key}`,
        label: cleanup.label,
        reason: cleanup.reason,
        residualRiskKey: risk.key,
        riskReduced: risk.label,
        prerequisite: cleanup.prerequisite,
        safetyScore,
      };
    })
    .sort((left, right) => right.safetyScore - left.safetyScore || left.id.localeCompare(right.id))
    .slice(0, 3);
}

function buildAtlasMilitaryFallbackOrderHint(priorityStack, orderHint, reliefPreview, commitment, shell) {
  const topWarning = priorityStack?.stack?.[0] ?? null;
  const blocker = getAtlasMilitaryBestOrderBlocker(topWarning, orderHint, reliefPreview, commitment);
  const fallback = blocker === 'resource-blocked'
    ? {
      type: 'resource-blocked',
      order: 'Fixer réserve',
      detail: `tenir ${topWarning.label} avec réserve légère`,
      why: 'ressources insuffisantes pour l’ordre principal',
    }
    : blocker === 'route-blocked'
      ? {
        type: 'route-blocked',
        order: 'Sécuriser détour',
        detail: `ouvrir un détour avant ${topWarning.label}`,
        why: 'axe principal trop exposé ce tour',
      }
      : blocker === 'overcommitment-blocked'
        ? {
          type: 'overcommitment-blocked',
          order: 'Geler engagement',
          detail: `réduire la charge sur ${commitment?.selectedOption?.target ?? topWarning?.label}`,
          why: 'surengagement encore dangereux',
        }
        : null;

  if (!fallback) {
    return {
      fallback: null,
      safetyReason: buildAtlasMilitaryFallbackSafetyReason(null, topWarning, orderHint, reliefPreview, commitment),
      crossDomainBlocker: null,
      selectionPreview: null,
      residualRisks: [],
      cleanupOrders: [],
      firstCleanupPayoff: null,
      followUpCleanupChoices: [],
      topFollowUpReadiness: buildTopFollowUpReadiness([], []),
      summary: 'Aucun fallback sûr: ordre principal non bloqué ou alternative trop risquée.',
      empty: true,
    };
  }

  const safetyReason = buildAtlasMilitaryFallbackSafetyReason(fallback, topWarning, orderHint, reliefPreview, commitment);
  const crossDomainBlocker = buildAtlasMilitaryFallbackCrossDomainBlocker(fallback, topWarning, shell);
  const selectionPreview = buildAtlasMilitaryFallbackSelectionPreview(fallback, topWarning, reliefPreview);
  const residualRisks = buildAtlasMilitaryFallbackResidualRisks(fallback, topWarning, shell, priorityStack);
  const cleanupOrders = buildAtlasMilitaryFallbackCleanupOrders(residualRisks, fallback);
  const firstCleanupPayoff = buildFirstCleanupPayoff(cleanupOrders, residualRisks);
  const followUpCleanupChoices = buildFollowUpCleanupChoices(cleanupOrders, residualRisks, firstCleanupPayoff);
  const topFollowUpReadiness = buildTopFollowUpReadiness(followUpCleanupChoices, residualRisks);

  return {
    fallback: {
      fallbackId: `fallback:${topWarning.warningId}:${fallback.type}`,
      ...fallback,
      label: topWarning.label,
      safetyReason,
      crossDomainBlocker,
      selectionPreview,
      residualRisks,
      cleanupOrders,
      firstCleanupPayoff,
      followUpCleanupChoices,
      topFollowUpReadiness,
    },
    safetyReason,
    crossDomainBlocker,
    selectionPreview,
    residualRisks,
    cleanupOrders,
    firstCleanupPayoff,
    followUpCleanupChoices,
    topFollowUpReadiness,
    summary: `${fallback.order}: ${fallback.detail} (${fallback.why}; ${safetyReason.label}${crossDomainBlocker ? `; ${crossDomainBlocker.label}` : ''}${selectionPreview ? `; ${selectionPreview.label}` : ''}${residualRisks.length ? `; risques restants: ${residualRisks.map((risk) => risk.label).join(', ')}` : '; risques restants: aucun visible'}${cleanupOrders.length ? `; nettoyage: ${cleanupOrders[0].label}` : '; nettoyage: aucun requis'}${firstCleanupPayoff ? `; payoff: ${firstCleanupPayoff.riskReduced} réduit, ${firstCleanupPayoff.remainingRiskCount} reste` : '; payoff: aucun'}${followUpCleanupChoices.length ? `; suivi: ${followUpCleanupChoices.map((choice) => `${choice.rank}. ${choice.cleanupOrderLabel}`).join(', ')}` : '; suivi: aucun'}; readiness suivi: ${topFollowUpReadiness.label}).`,
    empty: false,
  };
}

function renderAtlasMilitaryFallbackOrderHint(fallbackHint) {
  if (!fallbackHint || fallbackHint.empty || !fallbackHint.fallback) return '';
  const fallback = fallbackHint.fallback;
  const residualRiskLabel = fallback.residualRisks?.length
    ? `reste: ${fallback.residualRisks.map((risk) => risk.label).join(' · ')}`
    : 'reste: aucun risque visible';
  const cleanupOrderLabel = fallback.cleanupOrders?.length
    ? `nettoyer: ${fallback.cleanupOrders.map((order) => order.label).join(' · ')}`
    : 'nettoyer: aucun ordre requis';
  const firstCleanupPayoffLabel = fallback.firstCleanupPayoff
    ? `payoff: ${fallback.firstCleanupPayoff.riskReduced} ↓ · reste ${fallback.firstCleanupPayoff.remainingRiskCount}`
    : 'payoff: aucun nettoyage utile';
  const followUpCleanupLabel = fallback.followUpCleanupChoices?.length
    ? `suivi: ${fallback.followUpCleanupChoices.map((choice) => `${choice.rank}. ${choice.cleanupOrderLabel} (${choice.riskCovered})`).join(' · ')}`
    : 'suivi: aucun cleanup utile';
  const followUpReadinessLabel = fallback.topFollowUpReadiness
    ? `readiness: ${fallback.topFollowUpReadiness.label} · ${fallback.topFollowUpReadiness.blocker}`
    : 'readiness: aucun suivi sûr';
  return `
    <g class="atlas-military-fallback-order atlas-military-fallback-order--${fallback.type}" data-atlas-fallback-order="${fallback.fallbackId}" aria-label="Ordre de repli: ${fallbackHint.summary}">
      <rect class="atlas-military-fallback-order__panel" x="22" y="58" width="16" height="11" rx="1.2"></rect>
      <text class="atlas-military-fallback-order__label" x="23.2" y="59.1">repli: ${fallback.order}</text>
      <text class="atlas-military-fallback-order__detail" x="23.2" y="60.2">${fallback.detail}</text>
      <text class="atlas-military-fallback-order__safety" x="23.2" y="61.3">${fallback.safetyReason.label}</text>
      ${fallback.crossDomainBlocker ? `<text class="atlas-military-fallback-order__blocker" x="23.2" y="62.4">${fallback.crossDomainBlocker.label}</text>` : ''}
      ${fallback.selectionPreview ? `<text class="atlas-military-fallback-order__preview atlas-military-fallback-order__preview--${fallback.selectionPreview.type}" x="23.2" y="63.5">${fallback.selectionPreview.label}</text>` : ''}
      <text class="atlas-military-fallback-order__residual-risks" x="23.2" y="64.6">${residualRiskLabel}</text>
      <text class="atlas-military-fallback-order__cleanup-orders" x="23.2" y="65.7">${cleanupOrderLabel}</text>
      <text class="atlas-military-fallback-order__cleanup-payoff" x="23.2" y="66.8">${firstCleanupPayoffLabel}</text>
      <text class="atlas-military-fallback-order__cleanup-followups" x="23.2" y="67.9">${followUpCleanupLabel}</text>
      <text class="atlas-military-fallback-order__followup-readiness atlas-military-fallback-order__followup-readiness--${fallback.topFollowUpReadiness?.tone ?? 'neutral'}" x="23.2" y="69">${followUpReadinessLabel}</text>
    </g>
  `;
}

function renderAtlasMilitaryWarningPriorityStack(priorityStack, commitment, shell) {
  if (!priorityStack || priorityStack.empty) return '';
  const [topPriority, ...lowerPriorities] = priorityStack.stack;
  const topReliefPreview = buildAtlasMilitaryTopWarningReliefPreview(priorityStack);
  const bestOrderHint = buildAtlasMilitaryBestNextOrderHint(priorityStack, topReliefPreview, commitment);
  const fallbackOrderHint = buildAtlasMilitaryFallbackOrderHint(priorityStack, bestOrderHint, topReliefPreview, commitment, shell);
  const height = 8.8 + (lowerPriorities.length * 2.7);
  return `
    <g class="atlas-military-warning-stack" aria-label="Pile de priorités des alertes militaires: ${priorityStack.summary}">
      <rect class="atlas-military-warning-stack__panel" x="3" y="44" width="37" height="${height}" rx="2.4"></rect>
      <text class="atlas-military-warning-stack__title" x="5" y="47.2">Pile opérations</text>
      <g class="atlas-military-warning-stack-top atlas-military-warning-stack-top--${topPriority.tone}" data-atlas-warning-stack-top="${topPriority.stackId}" aria-label="Priorité 1 ${topPriority.frontRoute}: ${topPriority.whyFirst}; action ${topPriority.action}">
        <rect x="5" y="48.8" width="4" height="2.8" rx="0.8"></rect>
        <text class="atlas-military-warning-stack-top__label" x="10" y="49.8">1. ${topPriority.label} · ${topPriority.stackScore}</text>
        <text class="atlas-military-warning-stack-top__why" x="10" y="51.4">why first: ${topPriority.whyFirst}</text>
      </g>
      ${renderAtlasMilitaryTopWarningReliefPreview(topReliefPreview)}
      ${renderAtlasMilitaryBestNextOrderHint(bestOrderHint)}
      ${renderAtlasMilitaryFallbackOrderHint(fallbackOrderHint)}
      ${lowerPriorities.map((warning, index) => `
        <g class="atlas-military-warning-stack-item atlas-military-warning-stack-item--${warning.tone}" data-atlas-warning-stack-item="${warning.stackId}" aria-label="Priorité ${index + 2} ${warning.frontRoute}: score ${warning.stackScore}; ${warning.action}">
          <text x="5" y="${54.4 + index * 2.7}">${index + 2}. ${warning.label}</text>
          <text x="21" y="${54.4 + index * 2.7}">${warning.stackScore} · ${warning.action}</text>
        </g>
      `).join('')}
    </g>
  `;
}

function buildAtlasMilitaryFeatures(shell) {







  const pressureByProvinceId = new Map(shell.provinces.map((province) => [province.provinceId, getAtlasMilitaryPressureScore(province)]));
  const routes = buildProvinceRelations(shell)
    .map((relation) => {
      const originProvince = shell.provinces.find((province) => province.provinceId === relation.relationId.split('::')[0]);
      const destinationProvince = shell.provinces.find((province) => province.provinceId === relation.relationId.split('::')[1]);
      const originScore = pressureByProvinceId.get(originProvince?.provinceId) ?? 0;
      const destinationScore = pressureByProvinceId.get(destinationProvince?.provinceId) ?? 0;
      const pressure = Math.max(originScore, destinationScore) + (relation.contested ? 18 : relation.occupied ? 10 : 0);
      const source = originScore >= destinationScore ? originProvince : destinationProvince;
      const target = originScore >= destinationScore ? destinationProvince : originProvince;

      if (!source || !target || pressure < 38) {
        return null;
      }

      const controlX = ((relation.origin.x + relation.destination.x) / 2) + (relation.contested ? 1.2 : -0.8);
      const controlY = ((relation.origin.y + relation.destination.y) / 2) - (relation.occupied ? 2.1 : 1.2);

      return {
        routeId: relation.relationId,
        sourceId: source.provinceId,
        targetId: target.provinceId,
        sourceLabel: source.label,
        targetLabel: target.label,
        origin: getProvinceCenter(source.provinceId),
        destination: getProvinceCenter(target.provinceId),
        control: { x: controlX, y: controlY },
        pressure,
        contested: relation.contested,
        occupied: relation.occupied,
        tone: getAtlasMilitaryRouteTone({ ...relation, pressure }),
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.pressure - left.pressure || left.routeId.localeCompare(right.routeId));

  const dominantRoutes = routes.slice(0, 3);
  const riskZones = shell.provinces
    .map((province) => ({
      provinceId: province.provinceId,
      label: province.label,
      center: getProvinceCenter(province.provinceId),
      polygon: getProvincePolygon(province.provinceId),
      pressure: pressureByProvinceId.get(province.provinceId) ?? 0,
      tone: province.contested ? 'front' : province.occupied ? 'occupation' : province.supplyLevel === 'collapsed' ? 'risk' : 'watch',
    }))
    .filter((zone) => zone.pressure >= 42)
    .sort((left, right) => right.pressure - left.pressure || left.label.localeCompare(right.label))
    .slice(0, 3);

  return {
    routes: dominantRoutes,
    overflowCount: Math.max(0, routes.length - dominantRoutes.length),
    riskZones,
  };
}

function renderAtlasMilitaryLayer(shell) {
  const features = buildAtlasMilitaryFeatures(shell);
  const playback = buildAtlasConflictRoutePlayback(features.routes);
  const playbackSummary = getAtlasConflictPlaybackSummary(playback);
  const comparison = buildAtlasConflictRouteComparison(playback);
  const operationSequence = buildAtlasMilitaryOperationSequence(playback, comparison);
  const outcomeForecasts = buildAtlasMilitaryOperationOutcomeForecasts(operationSequence);
  const stagedCommitment = buildAtlasMilitaryStagedCommitment(outcomeForecasts);
  const commitmentConflicts = buildAtlasMilitaryCommitmentFrontConflicts(stagedCommitment, shell, features);
  const commitmentCoverage = buildAtlasMilitaryCommitmentCoverageSummary(stagedCommitment, commitmentConflicts, shell, features);
  const commitmentDebt = buildAtlasMilitaryCommitmentDebtSummary(commitmentCoverage, stagedCommitment, shell);
  const commitmentPriority = buildAtlasMilitaryCommitmentDebtPriorities(commitmentDebt, commitmentCoverage, stagedCommitment);
  const commitmentWarnings = buildAtlasMilitaryCommitmentNextTurnWarnings(commitmentPriority, commitmentDebt, commitmentCoverage, stagedCommitment);
  const commitmentWarningStack = buildAtlasMilitaryWarningPriorityStack(commitmentWarnings, features);

  if (!features.routes.length && !features.riskZones.length) {
    return `
      <g class="atlas-military-layer atlas-military-layer--empty" aria-label="Lecture militaire atlas vide">
        <text class="atlas-conflict-playback-empty" x="50" y="92" text-anchor="middle">Aucun front actif à rejouer</text>
      </g>
    `;
  }

  return `
    <g class="atlas-military-layer" aria-label="Axes militaires atlas: routes de campagne, pression directionnelle et risques résiduels">
      <g class="atlas-conflict-playback" aria-label="Lecture courte des changements de pression: ${playbackSummary}">
        <rect class="atlas-conflict-playback__panel" x="61" y="5" width="36" height="18" rx="2.4"></rect>
        <text class="atlas-conflict-playback__title" x="63" y="9.2">Replay fronts</text>
        <text class="atlas-conflict-playback__summary" x="63" y="20.1">${playbackSummary}</text>
        ${playback.steps.map((step, index) => `
          <g class="atlas-conflict-playback-step ${playback.activeStep === step.step ? 'is-active' : ''}" data-atlas-conflict-playback-step="${step.step}" aria-label="Afficher ${step.label}">
            <rect x="${63 + index * 12.2}" y="11" width="9.2" height="4.7" rx="1.5"></rect>
            <text x="${67.6 + index * 12.2}" y="14.1" text-anchor="middle">${step.label}</text>
          </g>
        `).join('')}
      </g>
      ${renderAtlasConflictRouteComparison(comparison)}
      ${renderAtlasMilitaryOperationSequence(operationSequence)}
      ${renderAtlasMilitaryOperationOutcomeForecasts(outcomeForecasts)}
      ${renderAtlasMilitaryStagedCommitment(stagedCommitment)}
      ${renderAtlasMilitaryCommitmentCoverageSummary(commitmentCoverage)}
      ${renderAtlasMilitaryCommitmentDebtSummary(commitmentDebt)}
      ${renderAtlasMilitaryCommitmentDebtPriorities(commitmentPriority)}
      ${renderAtlasMilitaryCommitmentNextTurnWarnings(commitmentWarnings)}
      ${renderAtlasMilitaryWarningPriorityStack(commitmentWarningStack, stagedCommitment, shell)}
      ${renderAtlasMilitaryCommitmentFrontConflicts(commitmentConflicts)}
      ${features.riskZones.map((zone) => `
        <g class="atlas-military-risk atlas-military-risk--${zone.tone}" data-atlas-risk-province="${zone.provinceId}" aria-label="Zone militaire ${zone.label}: pression ${zone.pressure}">
          <polygon points="${zone.polygon}"></polygon>
          <text x="${zone.center.x}%" y="${zone.center.y - 3.5}%" text-anchor="middle">${zone.tone === 'front' ? 'FRONT' : zone.tone === 'occupation' ? 'OCC' : 'RISQUE'}</text>
        </g>
      `).join('')}
      ${playback.routes.map((route) => {
        const path = `M${route.origin.x},${route.origin.y} Q${route.control.x},${route.control.y} ${route.destination.x},${route.destination.y}`;
        const arrowX = (route.control.x + route.destination.x) / 2;
        const arrowY = (route.control.y + route.destination.y) / 2;
        const deltaPrefix = route.activePlayback.delta > 0 ? '+' : '';
        return `
          <g class="atlas-campaign-route atlas-campaign-route--${route.tone} atlas-campaign-route--${route.playbackDirection}" data-atlas-campaign-route="${route.routeId}" aria-label="Axe ${route.sourceLabel} vers ${route.targetLabel}: ${route.activePlayback.label}, pression ${route.activePlayback.pressure}, delta ${deltaPrefix}${route.activePlayback.delta}">
            <path d="${path}" pathLength="100"></path>
            <path class="atlas-campaign-route__arrow" d="M${arrowX - 1.15},${arrowY - 0.85} L${arrowX + 1.35},${arrowY} L${arrowX - 1.15},${arrowY + 0.85} Z"></path>
            <text x="${route.control.x}" y="${route.control.y - 1.6}" text-anchor="middle">${route.activePlayback.label} ${deltaPrefix}${route.activePlayback.delta}</text>
          </g>
        `;
      }).join('')}
      ${playback.empty ? `<text class="atlas-conflict-playback-empty" x="50" y="92" text-anchor="middle">Aucun historique militaire pertinent</text>` : ''}
      ${features.overflowCount > 0 ? `<text class="atlas-military-overflow" x="82" y="88" text-anchor="middle">+${features.overflowCount} axes agrégés</text>` : ''}
    </g>
  `;
}

function buildAtlasCultureDrift(entry, regionEntries, selectedDiscoveryId, selectedRegionId) {
  const cultures = new Set(regionEntries.map((candidate) => candidate.cultureName));
  const discoveryCount = new Set(regionEntries.flatMap((candidate) => candidate.regionalDiscoveryLinks.map((link) => link.discoveryId))).size;
  const eventCount = regionEntries.reduce((sum, candidate) => sum + (candidate.eventPopups?.length ?? 0), 0);
  const linkedToFocus = Boolean(selectedDiscoveryId)
    && regionEntries.some((candidate) => candidate.regionalDiscoveryLinks.some((link) => link.discoveryId === selectedDiscoveryId));
  const state = cultures.size > 1
    ? 'migre'
    : entry.influenceScore >= 70 || discoveryCount >= 2
      ? 'monte'
      : entry.influenceScore <= 45
        ? 'recule'
        : 'stable';
  const causes = [
    cultures.size > 1 ? 'chevauchement' : null,
    discoveryCount > 0 ? `${discoveryCount} découverte${discoveryCount > 1 ? 's' : ''}` : null,
    eventCount > 0 ? 'repère actif' : null,
    linkedToFocus ? 'focus lié' : null,
  ].filter(Boolean).slice(0, 3);

  return {
    state,
    label: { monte: 'influence monte', recule: 'influence recule', migre: 'migration culturelle', stable: 'zone stable' }[state],
    causes: causes.length > 0 ? causes : ['signal stable'],
    selected: entry.regionId === selectedRegionId,
    linkedToFocus,
  };
}

function buildAtlasCultureFeatures(cultureView) {
  const entries = cultureView?.overlay ?? [];
  const selectedRegionId = cultureView?.selectedRegionId ?? state.selectedProvinceId;
  const dominantByRegion = new Map();

  entries.forEach((entry) => {
    const current = dominantByRegion.get(entry.regionId);
    if (!current || entry.influenceScore > current.influenceScore) {
      dominantByRegion.set(entry.regionId, entry);
    }
  });

  const influenceZones = [...dominantByRegion.values()].map((entry) => ({
    regionId: entry.regionId,
    cultureName: entry.cultureName,
    influenceTier: entry.influenceTier,
    tone: getCultureTone(entry),
    polygon: getProvincePolygon(entry.regionId),
    center: getProvinceCenter(entry.regionId),
    score: entry.influenceScore,
  }));

  const selectedDiscoveryId = entries
    .find((entry) => entry.regionId === selectedRegionId)?.regionalDiscoveryLinks?.[0]?.discoveryId ?? null;
  const discoverySites = entries.flatMap((entry) => entry.regionalDiscoveryLinks.slice(0, 2).map((link, index) => ({
    siteId: `${entry.regionId}:${entry.cultureId}:${link.discoveryId}:${index}`,
    regionId: entry.regionId,
    cultureName: entry.cultureName,
    discoveryId: link.discoveryId,
    tone: getCultureTone(entry),
    center: getProvinceCenter(entry.regionId),
    offset: (index - 0.5) * 2.8,
    focused: entry.regionId === selectedRegionId && link.discoveryId === selectedDiscoveryId,
    related: Boolean(selectedDiscoveryId) && link.discoveryId === selectedDiscoveryId && entry.regionId !== selectedRegionId,
  })));

  const regionSummaries = influenceZones.map((zone) => {
    const regionEntries = entries.filter((entry) => entry.regionId === zone.regionId);
    const discoveryCount = new Set(regionEntries.flatMap((entry) => entry.regionalDiscoveryLinks.map((link) => link.discoveryId))).size;
    const cultures = new Set(regionEntries.map((entry) => entry.cultureName));
    const opportunity = regionEntries
      .flatMap((entry) => entry.eventPopups ?? [])
      .sort((left, right) => (right.importance ?? 0) - (left.importance ?? 0))[0];

    const sourceEntry = dominantByRegion.get(zone.regionId) ?? regionEntries[0];
    const drift = buildAtlasCultureDrift(sourceEntry, regionEntries, selectedDiscoveryId, selectedRegionId);

    return {
      summaryId: `atlas-culture-summary:${zone.regionId}`,
      regionId: zone.regionId,
      cultureName: zone.cultureName,
      tone: zone.tone,
      center: zone.center,
      influenceLabel: cultures.size > 1 ? 'influence contestée' : `${zone.influenceTier} dominante`,
      discoveryLabel: `${discoveryCount} découverte${discoveryCount > 1 ? 's' : ''} active${discoveryCount > 1 ? 's' : ''}`,
      opportunityLabel: opportunity ? `opportunité: ${opportunity.title}` : 'opportunité à surveiller',
      drift,
      selected: zone.regionId === selectedRegionId,
    };
  }).slice(0, 6);
  const driftPreviews = regionSummaries
    .filter((summary) => summary.drift.state !== 'stable' || summary.selected || summary.drift.linkedToFocus)
    .slice(0, 5);
  const borderZones = regionSummaries
    .filter((summary) => summary.drift.state !== 'stable' || summary.influenceLabel.includes('contestée'))
    .map((summary) => {
      const mainDriver = summary.drift.state === 'migre'
        ? 'migration'
        : summary.influenceLabel.includes('contestée')
          ? 'influence voisine'
          : summary.drift.causes.includes('repère actif')
            ? 'événement'
            : summary.drift.causes.some((cause) => cause.includes('découverte'))
              ? 'découverte'
              : 'pression politique';
      const stabilization = mainDriver === 'découverte'
        ? 'protéger découverte'
        : mainDriver === 'événement'
          ? 'suivre repère'
          : mainDriver === 'migration'
            ? 'stabiliser passage'
            : mainDriver === 'influence voisine'
              ? 'arbitrer influence'
              : 'surveiller loyautés';

      const borderZone = {
        ...summary,
        borderId: `atlas-culture-border:${summary.regionId}`,
        mainDriver,
        stabilization,
        chips: [mainDriver, summary.drift.label, stabilization].slice(0, 3),
      };

      const mediation = buildAtlasCultureMediation(borderZone);
      const mediatedZone = { ...borderZone, mediation };

      return {
        ...mediatedZone,
        commitment: buildAtlasMediationCommitment(mediatedZone),
      };
    })
    .slice(0, 4);
  const consolidationRecommendations = borderZones
    .filter((zone) => zone.commitment.consolidationRecommendation)
    .map((zone) => ({
      regionId: zone.regionId,
      cultureName: zone.cultureName,
      recommendation: zone.commitment.consolidationRecommendation,
      reboundWindow: zone.commitment.reboundWindow,
      consolidation: zone.commitment.consolidation,
    }))
    .sort((a, b) => b.recommendation.priority - a.recommendation.priority || a.cultureName.localeCompare(b.cultureName))
    .slice(0, 3);

  return {
    influenceZones,
    cultureMarkers: influenceZones.filter((zone) => zone.influenceTier === 'dominant' || zone.influenceTier === 'strong'),
    discoverySites,
    focusedDiscovery: discoverySites.find((site) => site.focused) ?? null,
    regionSummaries,
    driftPreviews,
    borderZones,
    consolidationRecommendations,
  };
}

function buildAtlasStaleRiskFallbackMove(zone, commitment, followUp) {
  if (followUp?.state !== 'stale-risk') {
    return null;
  }

  if (commitment.consolidation.state === 'expiring' || commitment.reboundWindow.state === 'missed') {
    return {
      state: 'closing-window',
      label: 'geler extension',
      reason: `closing-window · ${commitment.reboundWindow.label}`,
      detail: 'protéger le rebond restant avant toute nouvelle expansion culturelle',
      priority: 3,
    };
  }

  if (zone.mainDriver === 'migration' || zone.mainDriver === 'influence voisine') {
    return {
      state: 'border-pressure',
      label: 'tenir frontière',
      reason: `border-pressure · ${zone.stabilization}`,
      detail: 'poser un relais de frontière pour absorber la pression avant reprise de médiation',
      priority: 2,
    };
  }

  if (zone.drift.linkedToFocus || zone.mainDriver === 'événement') {
    return {
      state: 'mediation-drift',
      label: 'ancrer relais',
      reason: `mediation-drift · ${zone.drift.label}`,
      detail: 'réancrer le signal culturel suivi avant de rouvrir une négociation',
      priority: 1,
    };
  }

  return null;
}

function buildAtlasLatestSafeFallbackTurn(zone, commitment, followUp, fallback) {
  if (followUp?.state !== 'stale-risk' || !fallback) {
    return null;
  }

  if (commitment.reboundWindow.state === 'missed') {
    return {
      state: 'no-safe-window',
      label: 'fenêtre échue',
      value: 'aucun tour sûr',
      reason: `no-safe-window · ${commitment.reboundWindow.label}`,
      detail: 'la médiation doit être révisée avant que le fallback puisse protéger ce rebond',
    };
  }

  if (commitment.consolidation.state === 'expiring' || fallback.state === 'closing-window') {
    return {
      state: 'immediate',
      label: 'dernier sûr',
      value: 'maintenant',
      reason: `immediate · ${commitment.consolidation.reason}`,
      detail: 'jouer le fallback ce tour pour conserver le rebond fragile',
    };
  }

  if (fallback.state === 'border-pressure' || commitment.remainingConfidence === 'faible') {
    return {
      state: 'one-turn-left',
      label: 'dernier sûr',
      value: 'tour +1',
      reason: `one-turn-left · ${zone.mainDriver}`,
      detail: 'laisser un seul tour de tampon avant que la pression de frontière ne dépasse le relais',
    };
  }

  return {
    state: 'multi-turn',
    label: 'dernier sûr',
    value: 'tour +2',
    reason: `multi-turn · ${commitment.remainingConfidence}`,
    detail: 'fenêtre courte mais planifiable tant que le signal de médiation reste lisible',
  };
}

function buildAtlasPairedMediationSupport(zone, commitment, followUp, fallback, latestSafeTurn) {
  if (followUp?.state !== 'stale-risk' || !fallback) {
    return null;
  }

  if (fallback.state === 'border-pressure' && commitment.remainingConfidence === 'faible') {
    return {
      state: 'needs-border-pressure-relief',
      label: 'relief frontière',
      reason: `needs-border-pressure-relief · ${zone.mainDriver}`,
      detail: 'réduire la pression de frontière en parallèle du fallback pour éviter une rechute',
      priority: 2,
    };
  }

  if (latestSafeTurn?.state === 'no-safe-window' || fallback.state === 'mediation-drift' || zone.mediation.confidence === 'inconnue') {
    return {
      state: 'needs-mediation',
      label: 'médiation requise',
      reason: `needs-mediation · ${zone.mediation.confidenceReason}`,
      detail: `${zone.mediation.option} doit accompagner le fallback pour rendre le rebond lisible`,
      priority: 2,
    };
  }

  return null;
}

function buildAtlasSafestPairedSupport(zone, commitment, fallback, latestSafeTurn, pairedMediation) {
  if (!fallback || !pairedMediation) {
    return null;
  }

  if (latestSafeTurn?.state === 'no-safe-window') {
    return {
      state: 'no-safe-pairing',
      label: 'aucun appui sûr',
      action: 'no-safe-pairing',
      reason: `no-safe-pairing · ${commitment.reboundWindow.label}`,
      detail: 'attendre une nouvelle fenêtre de médiation avant de coupler ce fallback',
      priority: 4,
    };
  }

  if (pairedMediation.state === 'needs-border-pressure-relief') {
    return {
      state: 'ease-border-pressure',
      label: 'alléger frontière',
      action: 'ease-border-pressure',
      reason: `ease-border-pressure · ${zone.mainDriver}`,
      detail: 'réduire la pression locale avant de sécuriser le fallback',
      priority: 3,
    };
  }

  if (latestSafeTurn?.state === 'immediate') {
    return {
      state: 'delay-until-safe-window',
      label: 'retarder fenêtre',
      action: 'delay-until-safe-window',
      reason: `delay-until-safe-window · ${latestSafeTurn.value}`,
      detail: 'bloquer l’expansion jusqu’à retrouver un créneau de soutien lisible',
      priority: 3,
    };
  }

  if (fallback.state === 'mediation-drift') {
    return {
      state: 'assign-mediator',
      label: 'assigner médiateur',
      action: 'assign-mediator',
      reason: `assign-mediator · ${zone.mediation.confidenceReason}`,
      detail: `${zone.mediation.option} sécurise le relais sans exposer de cause cachée`,
      priority: 2,
    };
  }

  return {
    state: 'reinforce-local-trust',
    label: 'renforcer confiance',
    action: 'reinforce-local-trust',
    reason: `reinforce-local-trust · ${commitment.remainingConfidence}`,
    detail: 'ajouter un appui local minimal avant de rejouer le fallback',
    priority: 1,
  };
}

function buildAtlasPairedSupportSafetyJustification(zone, commitment, fallback, latestSafeTurn, pairedMediation, safestSupport) {
  if (!fallback || !pairedMediation || !safestSupport) {
    return null;
  }

  if (safestSupport.state === 'no-safe-pairing' || latestSafeTurn?.state === 'no-safe-window') {
    return {
      state: 'no-safe-justification',
      label: 'aucune sûreté lisible',
      reason: `no-safe-justification · ${commitment.reboundWindow.label}`,
      detail: 'ne pas justifier ce couplage tant que la fenêtre reste échue',
      priority: 4,
    };
  }

  if (safestSupport.state === 'ease-border-pressure' && latestSafeTurn?.state !== 'immediate') {
    return {
      state: 'border-pressure-low',
      label: 'pression lisible',
      reason: `border-pressure-low · ${latestSafeTurn?.value ?? 'fenêtre active'}`,
      detail: 'le support réduit une pression de frontière visible sans exposer de cause cachée',
      priority: 3,
    };
  }

  if (safestSupport.state === 'assign-mediator' && zone.mediation.confidence === 'inconnue') {
    return null;
  }

  if (safestSupport.state === 'assign-mediator') {
    return {
      state: 'mediator-available',
      label: 'médiateur disponible',
      reason: `mediator-available · ${zone.mediation.confidence}`,
      detail: `${zone.mediation.option} dispose déjà d’un signal public suffisant`,
      priority: 3,
    };
  }

  if (latestSafeTurn?.state === 'one-turn-left' || latestSafeTurn?.state === 'multi-turn') {
    return {
      state: 'window-open',
      label: 'fenêtre ouverte',
      reason: `window-open · ${latestSafeTurn.value}`,
      detail: 'le tour sûr reste visible avant engagement du support pairé',
      priority: 2,
    };
  }

  if (safestSupport.state === 'reinforce-local-trust' && commitment.remainingConfidence !== 'faible') {
    return {
      state: 'local-trust-sufficient',
      label: 'confiance locale',
      reason: `local-trust-sufficient · ${commitment.remainingConfidence}`,
      detail: 'la confiance restante suffit pour justifier un appui local minimal',
      priority: 1,
    };
  }

  return {
    state: 'no-safe-justification',
    label: 'aucune sûreté lisible',
    reason: 'no-safe-justification · signaux contradictoires',
    detail: 'ne pas afficher de justification optimiste avec des signaux incertains',
    priority: 4,
  };
}

function buildAtlasPairedSupportRiskRelief(zone, commitment, fallback, latestSafeTurn, pairedMediation, safestSupport, safetyJustification) {
  if (!fallback || !pairedMediation || !safestSupport || !safetyJustification) {
    return null;
  }

  if (safetyJustification.state === 'no-safe-justification' || latestSafeTurn?.state === 'no-safe-window') {
    return null;
  }

  if (safetyJustification.state === 'mediator-available') {
    return {
      state: 'mediation-stabilized',
      label: 'médiation stabilisée',
      reason: `mediation-stabilized · ${zone.mediation.confidence}`,
      detail: 'le premier risque retiré est une médiation trop fragile pour porter le fallback',
      priority: 3,
    };
  }

  if (safetyJustification.state === 'border-pressure-low') {
    return {
      state: 'border-tension-calmed',
      label: 'tension frontière calmée',
      reason: `border-tension-calmed · ${zone.mainDriver}`,
      detail: 'le premier risque retiré est la pression visible qui dépassait le relais',
      priority: 3,
    };
  }

  if (safetyJustification.state === 'window-open') {
    return {
      state: 'window-preserved',
      label: 'fenêtre préservée',
      reason: `window-preserved · ${latestSafeTurn.value}`,
      detail: 'le premier risque retiré est la perte du dernier tour sûr',
      priority: 2,
    };
  }

  if (safetyJustification.state === 'local-trust-sufficient') {
    return {
      state: 'local-trust-protected',
      label: 'confiance protégée',
      reason: `local-trust-protected · ${commitment.remainingConfidence}`,
      detail: 'le premier risque retiré est une confiance locale qui retombe avant consolidation',
      priority: 1,
    };
  }

  return null;
}

function buildAtlasConsolidationFollowUpStatus(zone, commitment, recommendation) {
  if (!recommendation) {
    return null;
  }

  if (commitment.consolidation.state === 'expiring' || commitment.reboundWindow.state === 'missed') {
    return {
      state: 'stale-risk',
      label: 'risque obsolète',
      reason: `closing window · ${commitment.reboundWindow.label}`,
      detail: 'la fenêtre se ferme avant que la consolidation ne stabilise le rebond',
      priority: 3,
    };
  }

  if ((zone.mainDriver === 'migration' || zone.mainDriver === 'influence voisine') && commitment.remainingConfidence === 'faible') {
    return {
      state: 'stale-risk',
      label: 'risque obsolète',
      reason: `unresolved border pressure · ${zone.mainDriver}`,
      detail: 'la pression de frontière reste supérieure au signal de médiation',
      priority: 3,
    };
  }

  if (zone.drift.linkedToFocus || commitment.outcomeStatus === 'améliore') {
    return {
      state: 'covered',
      label: 'déjà couvert',
      reason: zone.drift.linkedToFocus ? 'mediation drift suivie par focus' : `médiation ${commitment.outcomeStatus}`,
      detail: 'les signaux existants couvrent déjà le suivi immédiat',
      priority: 1,
    };
  }

  return {
    state: 'pending',
    label: 'à suivre',
    reason: `${recommendation.label} · ${commitment.remainingConfidence}`,
    detail: 'action recommandée encore non couverte par les signaux actuels',
    priority: 2,
  };
}

function buildAtlasFragileReboundRecommendation(zone, commitment) {
  if (commitment.consolidation.state === 'stable') {
    return null;
  }

  if (commitment.reboundWindow.state === 'missed') {
    return {
      action: 'delay expansion',
      label: 'retarder expansion',
      reason: `fenêtre ${commitment.reboundWindow.label} · ${commitment.residualRisk}`,
      detail: 'la médiation doit être révisée avant d’étendre l’influence',
      priority: 4,
    };
  }

  if (zone.mainDriver === 'influence voisine' || zone.mainDriver === 'migration') {
    return {
      action: 'protect border zone',
      label: 'protéger frontière',
      reason: `${zone.mainDriver} · ${commitment.remainingConfidence}`,
      detail: `${zone.stabilization} avant que la pression locale ne déplace le rebond`,
      priority: 3,
    };
  }

  if (zone.drift.linkedToFocus || zone.mainDriver === 'événement') {
    return {
      action: 'monitor drift',
      label: 'surveiller dérive',
      reason: `${zone.drift.label} · ${zone.mediation.confidenceReason}`,
      detail: 'suivre le repère culturel avant d’ajouter un nouvel engagement',
      priority: 2,
    };
  }

  return {
    action: 'reinforce mediation',
    label: 'renforcer médiation',
    reason: `${commitment.consolidation.reason} · ${zone.mediation.confidence}`,
    detail: `${zone.mediation.option} reste le plus petit appui de consolidation`,
    priority: 1,
  };
}

function buildAtlasCultureMediation(zone) {
  const optionByDriver = {
    migration: ['ouvrir médiation', 'passage stabilisé', 'friction accrue'],
    'influence voisine': ['pacte de frontière', 'influence clarifiée', 'rivalité locale'],
    événement: ['mandat d’écoute', 'repère apaisé', 'incident amplifié'],
    découverte: ['protéger relais', 'découverte sécurisée', 'opportunité perdue'],
    'pression politique': ['conseil local', 'loyauté suivie', 'tension latente'],
  };
  const consequenceByDriver = {
    migration: ['apaisement du passage', 'tension déplacée', 'coût culturel modéré'],
    'influence voisine': ['frontière clarifiée', 'pression voisine reportée', 'coût politique léger'],
    événement: ['incident apaisé', 'tension vers relais', 'coût diplomatique'],
    découverte: ['site sécurisé', 'attention déplacée', 'coût de protection'],
    'pression politique': ['loyautés apaisées', 'tension latente déplacée', 'coût politique'],
  };
  const [option, benefit, risk] = optionByDriver[zone.mainDriver] ?? optionByDriver['pression politique'];
  const [appeasement, displacement, cost] = consequenceByDriver[zone.mainDriver] ?? consequenceByDriver['pression politique'];
  const confidence = zone.selected || zone.drift.linkedToFocus
    ? ['sûre', 'signal focalisé']
    : zone.drift.causes.length >= 2
      ? ['incertaine', 'causes multiples']
      : ['inconnue', 'signal partiel'];

  return {
    option,
    benefit,
    risk,
    confidence: confidence[0],
    confidenceReason: confidence[1],
    consequences: { appeasement, displacement, cost },
  };
}

function buildAtlasMediationCommitment(zone) {
  const confidenceRank = { sûre: 3, incertaine: 2, inconnue: 1 }[zone.mediation.confidence] ?? 1;
  const status = confidenceRank >= 3 || zone.selected ? 'stable' : 'à risque';
  const remainingConfidence = confidenceRank >= 3
    ? 'forte'
    : confidenceRank === 2
      ? 'moyenne'
      : 'faible';
  const nextConsequence = status === 'stable'
    ? zone.mediation.consequences.appeasement
    : zone.mediation.consequences.displacement;
  const phase = zone.drift.linkedToFocus
    ? 'phase focus'
    : zone.drift.state === 'migre'
      ? 'phase passage'
      : zone.mainDriver === 'événement'
        ? 'phase repère'
        : 'phase suivi';
  const outcomeStatus = status === 'stable'
    ? 'améliore'
    : remainingConfidence === 'faible'
      ? 'contredit'
      : 'instable';
  const nextAction = outcomeStatus === 'améliore'
    ? 'conserver médiation'
    : outcomeStatus === 'contredit'
      ? 'réviser engagement'
      : 'renforcer suivi';
  const residualRisk = outcomeStatus === 'améliore'
    ? zone.mediation.consequences.cost
    : zone.mediation.risk;
  const reboundWindow = outcomeStatus === 'améliore'
    ? {
        state: 'favorable',
        label: 'stabilisation possible',
        reason: `${remainingConfidence} · ${nextConsequence}`,
        action: 'négocier maintenant',
      }
    : outcomeStatus === 'contredit'
      ? {
          state: 'missed',
          label: 'fenêtre manquée',
          reason: `${zone.drift.label} · ${residualRisk}`,
          action: 'réviser médiation',
        }
      : {
          state: 'risky',
          label: 'rechute probable',
          reason: `${remainingConfidence} · ${zone.drift.label}`,
          action: 'renforcer relais',
        };
  const consolidation = reboundWindow.state === 'favorable' && remainingConfidence === 'forte'
    ? { state: 'stable', label: 'rebond stable', reason: 'confiance forte', action: 'maintenir veille' }
    : reboundWindow.state === 'favorable'
      ? { state: 'fragile', label: 'rebond fragile', reason: 'engagement incomplet', action: 'consolider relais' }
      : reboundWindow.state === 'risky'
        ? { state: 'fragile', label: 'rebond fragile', reason: 'influence adverse', action: 'appui culturel' }
        : { state: 'expiring', label: 'rebond expire', reason: 'délai restant faible', action: 'agir ce tour' };
  const commitment = {
    status,
    remainingConfidence,
    nextConsequence,
    phase,
    outcomeStatus,
    nextAction,
    residualRisk,
    reboundWindow,
    consolidation,
    label: status === 'stable' ? 'engagement stable' : 'engagement à risque',
  };

  const consolidationRecommendation = buildAtlasFragileReboundRecommendation(zone, commitment);
  const followUp = buildAtlasConsolidationFollowUpStatus(zone, commitment, consolidationRecommendation);
  const fallback = buildAtlasStaleRiskFallbackMove(zone, commitment, followUp);
  const latestSafeTurn = buildAtlasLatestSafeFallbackTurn(zone, commitment, followUp, fallback);
  const pairedMediation = buildAtlasPairedMediationSupport(zone, commitment, followUp, fallback, latestSafeTurn);
  const safestSupport = buildAtlasSafestPairedSupport(zone, commitment, fallback, latestSafeTurn, pairedMediation);
  const safetyJustification = buildAtlasPairedSupportSafetyJustification(zone, commitment, fallback, latestSafeTurn, pairedMediation, safestSupport);
  const riskRelief = buildAtlasPairedSupportRiskRelief(zone, commitment, fallback, latestSafeTurn, pairedMediation, safestSupport, safetyJustification);

  return {
    ...commitment,
    consolidationRecommendation: consolidationRecommendation
      ? {
          ...consolidationRecommendation,
          followUp: followUp
            ? {
                ...followUp,
                fallback: fallback
                  ? {
                      ...fallback,
                      latestSafeTurn,
                      pairedMediation: pairedMediation
                        ? {
                            ...pairedMediation,
                            safestSupport: safestSupport
                              ? {
                                  ...safestSupport,
                                  safetyJustification: safetyJustification
                                    ? {
                                        ...safetyJustification,
                                        riskRelief,
                                      }
                                    : null,
                                }
                              : null,
                          }
                        : null,
                    }
                  : null,
              }
            : null,
        }
      : null,
  };
}

function renderAtlasCultureLayer(cultureView) {
  const features = buildAtlasCultureFeatures(cultureView);
  const active = state.activeOverlaySlot === 'culture-overlay';

  if (!features.influenceZones.length) {
    return '';
  }

  return `
    <g class="atlas-culture-layer ${active ? 'is-active' : 'is-muted'}" aria-label="Couche atlas culture et découvertes">
      ${features.influenceZones.map((zone) => `
        <polygon class="atlas-culture-zone atlas-culture-zone--${zone.tone} atlas-culture-zone--${zone.influenceTier}" points="${zone.polygon}" aria-label="Zone d’influence ${zone.cultureName}: ${zone.influenceTier}"></polygon>
      `).join('')}
      ${features.regionSummaries.map((summary, index) => `
        <g class="atlas-culture-summary atlas-culture-summary--${summary.tone} ${summary.selected ? 'is-selected' : ''}" data-atlas-culture-summary="${summary.regionId}" aria-label="Résumé atlas culture ${summary.cultureName}: ${summary.influenceLabel}, ${summary.discoveryLabel}, ${summary.opportunityLabel}, ${summary.drift.label}">
          <text x="${Math.min(92, summary.center.x + 3.2)}%" y="${Math.max(7, summary.center.y - 6.2 + (index % 2) * 2.4)}%">${summary.cultureName}</text>
          <text class="atlas-culture-summary__chip" x="${Math.min(92, summary.center.x + 3.2)}%" y="${Math.max(9.2, summary.center.y - 3.9 + (index % 2) * 2.4)}%">${summary.influenceLabel} · ${summary.discoveryLabel}</text>
          <text class="atlas-culture-summary__drift" x="${Math.min(92, summary.center.x + 3.2)}%" y="${Math.max(11.1, summary.center.y - 2.0 + (index % 2) * 2.4)}%">${summary.drift.label}</text>
        </g>
      `).join('')}
      ${features.driftPreviews.map((summary) => `
        <g class="atlas-culture-drift atlas-culture-drift--${summary.drift.state} ${summary.drift.linkedToFocus ? 'is-linked-focus' : ''}" data-atlas-culture-drift="${summary.regionId}" aria-label="Dérive culture ${summary.cultureName}: ${summary.drift.label}, causes ${summary.drift.causes.join(', ')}">
          <path d="M${summary.center.x - 3},${summary.center.y + 4} q3,-3 6,0" marker-end="url(#atlasCultureDriftArrow)"></path>
          <text x="${summary.center.x + 4.2}%" y="${summary.center.y + 4.3}%">${summary.drift.causes.join(' · ')}</text>
        </g>
      `).join('')}
      ${features.borderZones.map((zone) => `
        <g class="atlas-mediation-outcome atlas-mediation-outcome--${zone.commitment.outcomeStatus}" data-atlas-mediation-outcome="${zone.regionId}" aria-label="Suivi médiation ${zone.cultureName}: signal ${zone.commitment.outcomeStatus}, impact ${zone.commitment.nextConsequence}, risque ${zone.commitment.residualRisk}, prochaine action ${zone.commitment.nextAction}">
          <circle cx="${zone.center.x}%" cy="${zone.center.y + 6}%" r="1.55"></circle>
          <text x="${zone.center.x + 2}%" y="${zone.center.y + 6.4}%">${zone.commitment.outcomeStatus} · ${zone.commitment.nextAction}</text>
        </g>
      `).join('')}
      ${features.borderZones.length > 0 ? features.borderZones.map((zone) => `
        <g class="atlas-cultural-rebound-window atlas-cultural-rebound-window--${zone.commitment.reboundWindow.state} atlas-cultural-rebound-window--consolidation-${zone.commitment.consolidation.state}" data-atlas-cultural-rebound-window="${zone.regionId}" aria-label="Fenêtre culturelle ${zone.cultureName}: ${zone.commitment.reboundWindow.label}, consolidation ${zone.commitment.consolidation.label}, raison ${zone.commitment.consolidation.reason}, action ${zone.commitment.consolidation.action}">
          <rect x="${Math.min(82, zone.center.x + 3)}" y="${Math.min(88, zone.center.y + 8)}" width="17.8" height="6.3" rx="1.5"></rect>
          <text x="${Math.min(83, zone.center.x + 4)}%" y="${Math.min(90, zone.center.y + 10.1)}%">${zone.commitment.consolidation.label}</text>
          <text class="atlas-cultural-rebound-window__action" x="${Math.min(83, zone.center.x + 4)}%" y="${Math.min(92, zone.center.y + 12)}%">${zone.commitment.consolidation.reason} · ${zone.commitment.consolidation.action}</text>
        </g>
      `).join('') : `
        <g class="atlas-cultural-rebound-window is-empty" aria-label="Aucune fenêtre de rebond culturel active">
          <rect x="66" y="86" width="28" height="6" rx="1.6"></rect>
          <text x="68%" y="89.8%">aucune fenêtre active</text>
        </g>
      `}
      ${features.borderZones.length > 0 ? `
        <g class="atlas-cultural-border-zones" aria-label="Synthèse des frontières culturelles instables et médiations">
          <rect x="3" y="55" width="30" height="${20 + (features.borderZones.length * 24.2)}" rx="1.8"></rect>
          <text class="atlas-cultural-border-zones__title" x="5" y="58.4">Médiations culturelles</text>
          ${features.borderZones.map((zone, index) => `
            <g class="atlas-cultural-border-zone atlas-cultural-border-zone--${zone.drift.state} atlas-cultural-border-zone--confidence-${zone.mediation.confidence} atlas-cultural-border-zone--commitment-${zone.commitment.status === 'stable' ? 'stable' : 'risk'}" data-atlas-cultural-border="${zone.regionId}" aria-label="Frontière culturelle ${zone.cultureName}: moteur ${zone.mainDriver}, médiation ${zone.mediation.option}, confiance ${zone.mediation.confidence}, engagement ${zone.commitment.status}, confiance restante ${zone.commitment.remainingConfidence}, prochaine conséquence ${zone.commitment.nextConsequence}, échéance ${zone.commitment.phase}">
              <text x="5" y="${62 + index * 24.2}">${zone.cultureName}</text>
              <text class="atlas-cultural-border-zone__chips" x="5" y="${64 + index * 24.2}">${zone.chips.join(' · ')}</text>
              <text class="atlas-cultural-border-zone__mediation" x="5" y="${66 + index * 24.2}">${zone.mediation.option} → ${zone.mediation.benefit}</text>
              <text class="atlas-cultural-border-zone__confidence" x="5" y="${67.8 + index * 24.2}">confiance ${zone.mediation.confidence} · ${zone.mediation.confidenceReason}</text>
              <text class="atlas-cultural-border-zone__commitment" x="5" y="${69.5 + index * 24.2}">${zone.commitment.label} · ${zone.commitment.outcomeStatus} · reste ${zone.commitment.remainingConfidence}</text>
              <text class="atlas-cultural-border-zone__consequences" x="5" y="${71.2 + index * 24.2}">prochain: ${zone.commitment.nextConsequence} · action: ${zone.commitment.nextAction}</text>
              <text class="atlas-cultural-border-zone__risk" x="5" y="${72.9 + index * 24.2}">${zone.commitment.consolidation.label}: ${zone.commitment.consolidation.action}</text>
              ${zone.commitment.consolidationRecommendation ? `<text class="atlas-cultural-border-zone__recommendation" x="5" y="${74.6 + index * 24.2}">reco: ${zone.commitment.consolidationRecommendation.label} · ${zone.commitment.consolidationRecommendation.reason}</text>` : ''}
              ${zone.commitment.consolidationRecommendation?.followUp ? `<text class="atlas-cultural-border-zone__followup atlas-cultural-border-zone__followup--${zone.commitment.consolidationRecommendation.followUp.state}" x="5" y="${76.1 + index * 24.2}">suivi: ${zone.commitment.consolidationRecommendation.followUp.label} · ${zone.commitment.consolidationRecommendation.followUp.reason}</text>` : ''}
              ${zone.commitment.consolidationRecommendation?.followUp?.fallback ? `<text class="atlas-cultural-border-zone__fallback atlas-cultural-border-zone__fallback--${zone.commitment.consolidationRecommendation.followUp.fallback.state}" x="5" y="${77.5 + index * 24.2}">fallback: ${zone.commitment.consolidationRecommendation.followUp.fallback.label} · ${zone.commitment.consolidationRecommendation.followUp.fallback.reason}</text>` : ''}
              ${zone.commitment.consolidationRecommendation?.followUp?.fallback?.latestSafeTurn ? `<text class="atlas-cultural-border-zone__latest-safe atlas-cultural-border-zone__latest-safe--${zone.commitment.consolidationRecommendation.followUp.fallback.latestSafeTurn.state}" x="5" y="${78.9 + index * 24.2}">dernier sûr: ${zone.commitment.consolidationRecommendation.followUp.fallback.latestSafeTurn.value} · ${zone.commitment.consolidationRecommendation.followUp.fallback.latestSafeTurn.reason}</text>` : ''}
              ${zone.commitment.consolidationRecommendation?.followUp?.fallback?.pairedMediation ? `<text class="atlas-cultural-border-zone__paired-mediation atlas-cultural-border-zone__paired-mediation--${zone.commitment.consolidationRecommendation.followUp.fallback.pairedMediation.state}" x="5" y="${80.3 + index * 24.2}">support: ${zone.commitment.consolidationRecommendation.followUp.fallback.pairedMediation.label} · ${zone.commitment.consolidationRecommendation.followUp.fallback.pairedMediation.reason}</text>` : ''}
              ${zone.commitment.consolidationRecommendation?.followUp?.fallback?.pairedMediation?.safestSupport ? `<text class="atlas-cultural-border-zone__safest-support atlas-cultural-border-zone__safest-support--${zone.commitment.consolidationRecommendation.followUp.fallback.pairedMediation.safestSupport.state}" x="5" y="${81.7 + index * 24.2}">appui sûr: ${zone.commitment.consolidationRecommendation.followUp.fallback.pairedMediation.safestSupport.label} · ${zone.commitment.consolidationRecommendation.followUp.fallback.pairedMediation.safestSupport.reason}</text>` : ''}
              ${zone.commitment.consolidationRecommendation?.followUp?.fallback?.pairedMediation?.safestSupport?.safetyJustification ? `<text class="atlas-cultural-border-zone__support-justification atlas-cultural-border-zone__support-justification--${zone.commitment.consolidationRecommendation.followUp.fallback.pairedMediation.safestSupport.safetyJustification.state}" x="5" y="${83.1 + index * 24.2}">sûr car: ${zone.commitment.consolidationRecommendation.followUp.fallback.pairedMediation.safestSupport.safetyJustification.label} · ${zone.commitment.consolidationRecommendation.followUp.fallback.pairedMediation.safestSupport.safetyJustification.reason}</text>` : ''}
              ${zone.commitment.consolidationRecommendation?.followUp?.fallback?.pairedMediation?.safestSupport?.safetyJustification?.riskRelief ? `<text class="atlas-cultural-border-zone__risk-relief atlas-cultural-border-zone__risk-relief--${zone.commitment.consolidationRecommendation.followUp.fallback.pairedMediation.safestSupport.safetyJustification.riskRelief.state}" x="5" y="${84.5 + index * 24.2}">risque retiré: ${zone.commitment.consolidationRecommendation.followUp.fallback.pairedMediation.safestSupport.safetyJustification.riskRelief.label} · ${zone.commitment.consolidationRecommendation.followUp.fallback.pairedMediation.safestSupport.safetyJustification.riskRelief.reason}</text>` : ''}
            </g>
          `).join('')}
        </g>
      ` : `
        <g class="atlas-cultural-border-zones is-stable" aria-label="Frontières culturelles stables ou données insuffisantes">
          <rect x="3" y="58" width="27" height="8.4" rx="1.8"></rect>
          <text class="atlas-cultural-border-zones__title" x="5" y="61.4">Médiations culturelles</text>
          <text class="atlas-cultural-border-zone__empty" x="5" y="64">aucun engagement · frontières stables</text>
        </g>
      `}
      ${features.consolidationRecommendations.length > 0 ? `
        <g class="atlas-cultural-consolidation-actions" aria-label="Actions de consolidation des rebonds culturels fragiles">
          <rect x="65" y="56" width="31" height="${12 + (features.consolidationRecommendations.length * 14.3)}" rx="1.8"></rect>
          <text class="atlas-cultural-consolidation-actions__title" x="67" y="59.2">Actions consolidation</text>
          ${features.consolidationRecommendations.map((item, index) => `
            <g class="atlas-cultural-consolidation-action atlas-cultural-consolidation-action--${item.consolidation.state} atlas-cultural-consolidation-action--followup-${item.recommendation.followUp.state}" data-atlas-consolidation-action="${item.regionId}" aria-label="Action consolidation ${item.cultureName}: ${item.recommendation.label}, suivi ${item.recommendation.followUp.label}, raison ${item.recommendation.followUp.reason}, détail ${item.recommendation.followUp.detail}">
              <text x="67" y="${62.3 + index * 14.3}">${item.cultureName} · ${item.recommendation.label}</text>
              <text class="atlas-cultural-consolidation-action__reason" x="67" y="${64.1 + index * 14.3}">${item.recommendation.reason}</text>
              <text class="atlas-cultural-consolidation-action__followup" x="67" y="${65.8 + index * 14.3}">${item.recommendation.followUp.label} · ${item.recommendation.followUp.reason}</text>
              ${item.recommendation.followUp.fallback ? `<text class="atlas-cultural-consolidation-action__fallback" x="67" y="${67.5 + index * 14.3}">fallback: ${item.recommendation.followUp.fallback.label} · ${item.recommendation.followUp.fallback.reason}</text>` : ''}
              ${item.recommendation.followUp.fallback?.latestSafeTurn ? `<text class="atlas-cultural-consolidation-action__latest-safe atlas-cultural-consolidation-action__latest-safe--${item.recommendation.followUp.fallback.latestSafeTurn.state}" x="67" y="${69.1 + index * 14.3}">dernier sûr: ${item.recommendation.followUp.fallback.latestSafeTurn.value}</text>` : ''}
              ${item.recommendation.followUp.fallback?.pairedMediation ? `<text class="atlas-cultural-consolidation-action__paired-mediation atlas-cultural-consolidation-action__paired-mediation--${item.recommendation.followUp.fallback.pairedMediation.state}" x="67" y="${70.7 + index * 14.3}">support: ${item.recommendation.followUp.fallback.pairedMediation.label}</text>` : ''}
              ${item.recommendation.followUp.fallback?.pairedMediation?.safestSupport ? `<text class="atlas-cultural-consolidation-action__safest-support atlas-cultural-consolidation-action__safest-support--${item.recommendation.followUp.fallback.pairedMediation.safestSupport.state}" x="67" y="${72.3 + index * 14.3}">appui sûr: ${item.recommendation.followUp.fallback.pairedMediation.safestSupport.label}</text>` : ''}
              ${item.recommendation.followUp.fallback?.pairedMediation?.safestSupport?.safetyJustification ? `<text class="atlas-cultural-consolidation-action__support-justification atlas-cultural-consolidation-action__support-justification--${item.recommendation.followUp.fallback.pairedMediation.safestSupport.safetyJustification.state}" x="67" y="${73.9 + index * 14.3}">sûr car: ${item.recommendation.followUp.fallback.pairedMediation.safestSupport.safetyJustification.label}</text>` : ''}
              ${item.recommendation.followUp.fallback?.pairedMediation?.safestSupport?.safetyJustification?.riskRelief ? `<text class="atlas-cultural-consolidation-action__risk-relief atlas-cultural-consolidation-action__risk-relief--${item.recommendation.followUp.fallback.pairedMediation.safestSupport.safetyJustification.riskRelief.state}" x="67" y="${75.5 + index * 14.3}">risque retiré: ${item.recommendation.followUp.fallback.pairedMediation.safestSupport.safetyJustification.riskRelief.label}</text>` : ''}
            </g>
          `).join('')}
        </g>
      ` : ''}
      ${features.cultureMarkers.map((marker) => `
        <g class="atlas-culture-marker atlas-culture-marker--${marker.tone}" data-atlas-culture-region="${marker.regionId}">
          <circle cx="${marker.center.x}%" cy="${marker.center.y}%" r="${marker.influenceTier === 'dominant' ? 2.35 : 1.85}"></circle>
          <text x="${marker.center.x}%" y="${marker.center.y + 0.82}%" text-anchor="middle">C</text>
        </g>
      `).join('')}
      ${features.discoverySites.map((site) => {
        const x = site.center.x + site.offset;
        const y = site.center.y - 4.8;
        return `
          <g class="atlas-discovery-site atlas-discovery-site--${site.tone} ${site.focused ? 'is-focused' : ''} ${site.related ? 'is-related' : ''}" data-atlas-discovery="${site.discoveryId}">
            ${site.focused || site.related ? `<line class="atlas-discovery-site__link" x1="${site.center.x}%" y1="${site.center.y}%" x2="${x}%" y2="${y}%"></line>` : ''}
            <path d="M ${x} ${y - 1.05} L ${x + 1.05} ${y} L ${x} ${y + 1.05} L ${x - 1.05} ${y} Z"></path>
            ${site.focused ? `<text x="${x + 1.8}%" y="${y - 0.9}%">focus découverte</text>` : ''}
            <title>${site.discoveryId} · ${site.cultureName}${site.related ? ' · lien utile' : ''}</title>
          </g>
        `;
      }).join('')}
    </g>
  `;
}

function renderAtlasWorldCanvas(shell, economyView = null, cultureView = null) {
  const atlas = buildAtlasTerrainShapes(shell);

  return `
    <svg class="atlas-world-canvas" viewBox="0 0 100 100" aria-label="Canevas atlas: océans, continents, îles, relief, cultures et découvertes">
      <defs>
        <linearGradient id="atlasOceanGradient" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#0f3b57"></stop>
          <stop offset="55%" stop-color="#12324a"></stop>
          <stop offset="100%" stop-color="#071827"></stop>
        </linearGradient>
        <filter id="atlasReliefShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0.6" dy="0.9" stdDeviation="0.7" flood-color="#020617" flood-opacity="0.42"></feDropShadow>
        </filter>
        <marker id="atlasCultureDriftArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="3" markerHeight="3" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#a7f3d0" opacity="0.9"></path>
        </marker>
      </defs>
      <rect class="atlas-world-canvas__ocean" width="100" height="100"></rect>
      ${atlas.oceanBands.map((band) => `<path class="atlas-world-canvas__ocean-band" d="${band.path}" aria-label="${band.label}"></path>`).join('')}
      <path class="atlas-world-canvas__current atlas-world-canvas__current--north" d="M8,20 C25,12 37,23 52,16 S82,12 94,23"></path>
      <path class="atlas-world-canvas__current atlas-world-canvas__current--south" d="M5,73 C23,66 41,77 57,69 S82,61 96,70"></path>
      ${atlas.continents.map((shape) => `
        <g class="atlas-region atlas-region--${shape.terrain} atlas-region--${shape.relief}" data-atlas-province="${shape.provinceId}">
          <polygon points="${shape.polygon}" style="--atlas-fill:${shape.fill};--atlas-border:${shape.border}"></polygon>
          <path class="atlas-region__relief" d="M${Math.max(4, shape.center.x - 5)},${shape.center.y} q4,-3 8,0 t8,0"></path>
        </g>
      `).join('')}
      ${atlas.islands.map((shape) => `
        <circle class="atlas-island atlas-island--${shape.terrain}" cx="${shape.center.x}" cy="${shape.center.y}" r="${shape.radius}" aria-label="Île ou archipel: ${shape.label}"></circle>
      `).join('')}
      ${renderAtlasWorldEconomyLayer(economyView)}
      ${renderAtlasCultureLayer(cultureView)}
      ${renderAtlasMilitaryLayer(shell)}
      ${renderAtlasEconomyStressLegend(economyView)}
    </svg>
  `;
}

function getAtlasEconomyCorridor(origin, destination) {
  const midX = (origin.x + destination.x) / 2;
  const midY = (origin.y + destination.y) / 2;

  if (midY < 38) {
    return 'Arc nord';
  }

  if (midY > 66) {
    return 'Corridor sud';
  }

  if (midX < 42) {
    return 'Bassin ouest';
  }

  if (midX > 58) {
    return 'Marches est';
  }

  return 'Carrefour central';
}

function buildAtlasSupplyRouteCapacityForecast(route, stress, tensionByCityId) {
  const cityTensions = route.cityIds.map((cityId) => tensionByCityId[cityId]?.tensionLevel ?? 'low');
  const highHubs = cityTensions.filter((level) => level === 'high').length;
  const mediumHubs = cityTensions.filter((level) => level === 'medium').length;
  const resourceLoad = route.resources.reduce((total, resource) => total + resource.capacity, 0);
  const currentCapacity = route.totalCapacity;
  const capacityDrag = (highHubs * 2) + Math.min(2, mediumHubs) + (stress.tone === 'high' ? 1 : 0);
  const recoveryLift = stress.tone === 'low' && highHubs === 0 ? 1 : 0;
  const projectedCapacity = Math.max(0, currentCapacity - capacityDrag + recoveryLift);
  const delta = projectedCapacity - currentCapacity;
  const uncertain = route.cityIds.length < 2 || route.resources.length === 0 || resourceLoad === 0;
  const tone = uncertain
    ? 'uncertain'
    : delta <= -2 || (stress.tone === 'high' && projectedCapacity <= currentCapacity)
      ? 'overload'
      : delta >= 1 || (stress.tone === 'low' && projectedCapacity >= currentCapacity)
        ? 'recovery'
        : 'watch';

  return {
    routeId: route.routeId,
    routeName: route.routeName,
    currentCapacity,
    projectedCapacity,
    delta,
    tone,
    uncertain,
    highHubs,
    mediumHubs,
    resourceLoad,
    label: uncertain
      ? `${route.routeName}: prévision incertaine`
      : `${route.routeName}: ${currentCapacity}→${projectedCapacity}`,
    status: uncertain
      ? 'prévision incertaine'
      : tone === 'overload'
        ? 'risque surcharge prochain tour'
        : tone === 'recovery'
          ? 'capacité sous contrôle'
          : 'capacité à surveiller',
    action: uncertain
      ? 'Confirmer flux et ressource avant arbitrage.'
      : tone === 'overload'
        ? 'Préparer délestage ou stock tampon.'
        : tone === 'recovery'
          ? 'Maintenir corridor ouvert.'
          : 'Surveiller avant engagement lourd.',
  };
}

function buildAtlasSupplyCapacityForecasts(economyView) {
  if (!economyView) {
    return { routes: [], byRouteId: new Map(), byCorridor: new Map() };
  }

  const tensionByCityId = Object.fromEntries(economyView.comparison.rows.map((row) => [row.cityId, row]));
  const cityNameById = Object.fromEntries(economyView.overlay.cities.map((city) => [city.cityId, city.cityName]));
  const byCorridor = new Map();
  const routes = economyView.overlay.routes
    .map((route) => {
      const origin = cityLayoutsById[route.originCityId];
      const destination = cityLayoutsById[route.destinationCityId];

      if (!origin || !destination) {
        return null;
      }

      const stress = getRouteStressSummary(route, tensionByCityId, cityNameById);
      const forecast = buildAtlasSupplyRouteCapacityForecast(route, stress, tensionByCityId);
      const corridor = getAtlasEconomyCorridor(origin, destination);
      const score = forecast.tone === 'overload'
        ? 40 + Math.abs(forecast.delta) + route.totalCapacity
        : forecast.tone === 'uncertain'
          ? 26 + route.totalCapacity
          : forecast.tone === 'watch'
            ? 18 + route.totalCapacity
            : 10 + route.totalCapacity;

      return { ...forecast, corridor, score };
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score || left.routeName.localeCompare(right.routeName));

  for (const forecast of routes) {
    const current = byCorridor.get(forecast.corridor) ?? { overload: 0, recovery: 0, watch: 0, uncertain: 0, labels: [] };
    current[forecast.tone] += 1;
    if (forecast.tone !== 'recovery' || current.labels.length < 1) {
      current.labels.push(forecast.label);
    }
    byCorridor.set(forecast.corridor, current);
  }

  return {
    routes: routes.slice(0, 4),
    byRouteId: new Map(routes.map((forecast) => [forecast.routeId, forecast])),
    byCorridor,
  };
}

function buildAtlasCorridorInterventionOptions(supplyForecasts) {
  const options = supplyForecasts.routes.map((forecast) => {
    const expectedGain = forecast.uncertain
      ? null
      : forecast.tone === 'overload'
        ? Math.max(2, Math.abs(forecast.delta) + 1)
        : forecast.tone === 'watch'
          ? 1
          : forecast.tone === 'recovery'
            ? 0
            : null;
    const riskAvoided = forecast.uncertain
      ? 'risque à qualifier'
      : forecast.tone === 'overload'
        ? 'pénurie évitée élevée'
        : forecast.tone === 'watch'
          ? 'pénurie évitée moyenne'
          : 'risque déjà contenu';
    const constraint = forecast.uncertain
      ? 'données de flux incomplètes'
      : forecast.highHubs > 0
        ? `${forecast.highHubs} hub${forecast.highHubs > 1 ? 's' : ''} critique${forecast.highHubs > 1 ? 's' : ''}`
        : forecast.resourceLoad >= 8
          ? 'charge ressource élevée'
          : forecast.mediumHubs > 0
            ? 'hub sous tension modérée'
            : 'contrainte faible';
    const score = forecast.uncertain
      ? 0
      : (expectedGain * 10)
        + (forecast.tone === 'overload' ? 12 : forecast.tone === 'watch' ? 6 : 1)
        + Math.min(6, forecast.resourceLoad);

    return {
      optionId: `atlas-intervention:${forecast.routeId}`,
      routeName: forecast.routeName,
      corridor: forecast.corridor,
      tone: forecast.uncertain ? 'unknown' : forecast.tone,
      expectedGain,
      gainLabel: forecast.uncertain ? 'gain inconnu' : `+${expectedGain} capacité attendue`,
      riskAvoided,
      constraint,
      score,
      unknown: forecast.uncertain,
    };
  })
    .sort((left, right) => right.score - left.score || left.routeName.localeCompare(right.routeName))
    .slice(0, 3);

  return options.map((option, index, entries) => ({
    ...option,
    rankLabel: option.unknown
      ? '?'
      : index > 0 && option.score === entries[index - 1].score
        ? `≈${index}`
        : `${index + 1}`,
    tieLabel: index > 0 && option.score === entries[index - 1].score ? 'ex æquo' : '',
  }));
}

function buildAtlasCorridorActionBudget(interventions, actionCapacity = 3) {
  const selected = [];
  const deferred = [];
  let remaining = actionCapacity;

  for (const option of interventions) {
    const actionCost = option.unknown
      ? null
      : option.tone === 'overload' && option.constraint.includes('critique')
        ? 2
        : 1;
    const budgetedOption = {
      ...option,
      actionCost,
      budgetLabel: actionCost === null ? 'coût inconnu' : `${actionCost} action${actionCost > 1 ? 's' : ''}`,
    };

    if (actionCost !== null && actionCost <= remaining && option.expectedGain > 0) {
      selected.push(budgetedOption);
      remaining -= actionCost;
    } else {
      deferred.push(budgetedOption);
    }
  }

  const selectedGain = selected.reduce((total, option) => total + (option.expectedGain ?? 0), 0);
  const deferredRisk = deferred.find((option) => option.tone === 'overload')
    ?? deferred.find((option) => option.unknown)
    ?? deferred[0]
    ?? null;
  const selectedLabel = selected.length > 0
    ? selected.map((option) => option.routeName).join(' + ')
    : 'aucune intervention sûre';
  const deferredLabel = deferred.length > 0
    ? deferred.slice(0, 2).map((option) => option.routeName).join(' + ')
    : 'aucun report';
  const tradeoff = deferredRisk
    ? `Reporter ${deferredRisk.routeName}: ${deferredRisk.riskAvoided}`
    : 'Budget couvre les options lisibles';

  return {
    capacity: actionCapacity,
    used: actionCapacity - remaining,
    remaining,
    selected,
    deferred,
    selectedGain,
    selectedLabel,
    deferredLabel,
    tradeoff,
    empty: interventions.length === 0,
  };
}

function buildAtlasCorridorBudgetShortfalls(actionBudget) {
  if (actionBudget.empty || actionBudget.deferred.length === 0) {
    return {
      empty: true,
      items: [],
      summary: 'Aucun corridor sous-financé',
    };
  }

  const items = actionBudget.deferred
    .map((option) => {
      const downstreamImpact = option.unknown
        ? 12
        : option.tone === 'overload'
          ? 40 + (option.expectedGain ?? 0) * 4
          : option.tone === 'watch'
            ? 24 + (option.expectedGain ?? 0) * 3
            : 10;
      const minimumAction = option.unknown
        ? 'réduire objectif'
        : option.actionCost !== null && option.actionCost > actionBudget.remaining
          ? 'rediriger ressources'
          : option.tone === 'overload'
            ? 'financer'
            : 'reporter';
      const expectedEffect = option.unknown
        ? `${option.corridor}: clarifier routes/cités touchées`
        : option.tone === 'overload'
          ? `${option.routeName}: éviter pénurie aval`
          : option.tone === 'watch'
            ? `${option.routeName}: contenir tension cité`
            : `${option.routeName}: report faible impact`;

      return {
        ...option,
        downstreamImpact,
        minimumAction,
        expectedEffect,
      };
    })
    .sort((left, right) => right.downstreamImpact - left.downstreamImpact || left.routeName.localeCompare(right.routeName))
    .slice(0, 3);

  return {
    empty: items.length === 0,
    items,
    summary: items.length === 0
      ? 'Aucun corridor sous-financé'
      : `${items.length} manque${items.length > 1 ? 's' : ''} budgétaire${items.length > 1 ? 's' : ''} priorisé${items.length > 1 ? 's' : ''}`,
  };
}

function buildAtlasFundedLogisticsPlans(actionBudget, budgetShortfalls) {
  const funded = actionBudget.selected.map((option) => ({
    planId: `atlas-funded-plan:${option.optionId}`,
    routeName: option.routeName,
    corridor: option.corridor,
    committed: option.actionCost ?? 0,
    expectedCost: option.actionCost ?? 0,
    remainingToFund: 0,
    status: 'financé',
    impactLabel: `${option.corridor} · ${option.routeName}`,
    benefit: `+${option.expectedGain ?? 0} capacité · ${option.riskAvoided}`,
    cityEffect: option.constraint.includes('hub') ? option.constraint : 'routes/cités stabilisées',
  }));

  const partial = budgetShortfalls.items
    .filter((item) => !item.unknown)
    .slice(0, 1)
    .map((item) => {
      const committed = Math.max(0, Math.min(actionBudget.remaining, item.actionCost ?? 0));
      const remainingToFund = Math.max(0, (item.actionCost ?? 1) - committed);
      return {
        planId: `atlas-partial-plan:${item.optionId}`,
        routeName: item.routeName,
        corridor: item.corridor,
        committed,
        expectedCost: item.actionCost ?? 1,
        remainingToFund,
        status: remainingToFund > 0 ? 'partiel' : 'finançable',
        impactLabel: `${item.corridor} · ${item.routeName}`,
        benefit: item.expectedEffect,
        cityEffect: item.minimumAction,
      };
    });

  const plans = [...funded, ...partial].slice(0, 3);
  const committedBudget = plans.reduce((total, plan) => total + plan.committed, 0);
  const remainingToFund = plans.reduce((total, plan) => total + plan.remainingToFund, 0);

  return {
    empty: plans.length === 0,
    plans,
    committedBudget,
    remainingToFund,
    summary: plans.length === 0
      ? 'Aucun corridor finançable'
      : `${plans.length} plan${plans.length > 1 ? 's' : ''} logistique${plans.length > 1 ? 's' : ''}`,
  };
}

function buildAtlasCommittedFundingGaps(fundedPlans) {
  if (fundedPlans.empty) {
    return {
      empty: true,
      items: [],
      summary: 'Aucun plan engagé',
    };
  }

  const items = fundedPlans.plans.map((plan) => {
    const fullyCovered = plan.remainingToFund <= 0;
    const residualRisk = fullyCovered
      ? 'risque résiduel bas'
      : plan.status === 'partiel'
        ? 'risque résiduel moyen'
        : 'risque résiduel à confirmer';
    const fragileResource = plan.cityEffect.includes('hub')
      ? plan.cityEffect
      : plan.status === 'partiel'
        ? 'capacité corridor fragile'
        : 'ressource stabilisée';
    const nextAction = fullyCovered
      ? 'Surveiller exécution.'
      : plan.committed > 0
        ? 'Compléter financement.'
        : 'Chercher budget ou réduire objectif.';

    return {
      planId: `${plan.planId}:gap`,
      routeName: plan.routeName,
      corridor: plan.corridor,
      committed: plan.committed,
      expectedCost: plan.expectedCost,
      fundingGap: Math.max(0, plan.expectedCost - plan.committed),
      fullyCovered,
      status: fullyCovered ? 'covered' : 'gap',
      residualRisk,
      fragileResource,
      nextAction,
    };
  });

  return {
    empty: false,
    items,
    summary: `${items.filter((item) => item.fundingGap > 0).length} écart${items.filter((item) => item.fundingGap > 0).length > 1 ? 's' : ''} restant${items.filter((item) => item.fundingGap > 0).length > 1 ? 's' : ''}`,
  };
}

function buildAtlasFundedCapacityProjections(committedFundingGaps, supplyForecasts) {
  if (committedFundingGaps.empty) {
    return {
      empty: true,
      items: [],
      summary: 'Aucune projection financée',
    };
  }

  const forecastByRouteName = new Map(supplyForecasts.routes.map((forecast) => [forecast.routeName, forecast]));
  const items = committedFundingGaps.items.map((gap) => {
    const forecast = forecastByRouteName.get(gap.routeName);
    const currentCapacity = forecast?.currentCapacity ?? gap.expectedCost;
    const plannedGain = Math.max(0, (forecast?.projectedCapacity ?? currentCapacity) - currentCapacity) + Math.max(0, gap.committed - gap.fundingGap);
    const projectedCapacity = currentCapacity + plannedGain;
    const sufficient = gap.fullyCovered && gap.fundingGap === 0 && (forecast?.tone !== 'overload');
    const stillSaturated = !sufficient || forecast?.tone === 'overload';
    const reviewTurn = stillSaturated ? 'Revoir tour +1' : 'Revoir tour +2';
    const priority = gap.fundingGap > 0
      ? 'priorité: compléter budget'
      : stillSaturated
        ? 'priorité: contrôler saturation'
        : 'priorité: maintien';
    const message = sufficient
      ? 'financé et suffisant'
      : gap.fullyCovered
        ? 'financé mais saturation possible'
        : 'financé partiellement, capacité à risque';

    return {
      projectionId: `${gap.planId}:projection`,
      routeName: gap.routeName,
      corridor: gap.corridor,
      currentCapacity,
      projectedCapacity,
      plannedGain,
      fundingGap: gap.fundingGap,
      sufficient,
      stillSaturated,
      reviewTurn,
      priority,
      message,
    };
  });

  return {
    empty: items.length === 0,
    items,
    summary: `${items.filter((item) => item.stillSaturated).length} corridor${items.filter((item) => item.stillSaturated).length > 1 ? 's' : ''} à revoir`,
  };
}

function getAtlasNeighborCorridors(corridor) {
  const neighbors = {
    'Arc nord': ['Carrefour central', 'Bassin ouest', 'Marches est'],
    'Corridor sud': ['Carrefour central', 'Bassin ouest', 'Marches est'],
    'Bassin ouest': ['Carrefour central', 'Arc nord', 'Corridor sud'],
    'Marches est': ['Carrefour central', 'Arc nord', 'Corridor sud'],
    'Carrefour central': ['Arc nord', 'Corridor sud', 'Bassin ouest', 'Marches est'],
  };

  return neighbors[corridor] ?? [];
}

function buildAtlasSecondaryBottleneckReroute(forecast, fundedCapacityProjections, supplyForecasts) {
  if (forecast.uncertain || forecast.tone === 'recovery') {
    return {
      available: false,
      label: 'dérivation non disponible',
      effect: 'données ou besoin insuffisants',
      tradeoff: 'confirmer avant contournement',
    };
  }

  const neighborCorridors = getAtlasNeighborCorridors(forecast.corridor);
  const fundedCandidates = fundedCapacityProjections.items
    .filter((projection) => neighborCorridors.includes(projection.corridor) && projection.sufficient && !projection.stillSaturated)
    .map((projection) => ({
      corridor: projection.corridor,
      routeName: projection.routeName,
      spareCapacity: Math.max(0, projection.projectedCapacity - projection.currentCapacity),
      source: 'capacité financée',
    }));
  const forecastCandidates = supplyForecasts.routes
    .filter((candidate) => candidate.routeName !== forecast.routeName && neighborCorridors.includes(candidate.corridor) && candidate.tone === 'recovery')
    .map((candidate) => ({
      corridor: candidate.corridor,
      routeName: candidate.routeName,
      spareCapacity: Math.max(1, candidate.projectedCapacity - candidate.currentCapacity + 1),
      source: 'corridor voisin',
    }));
  const candidate = [...fundedCandidates, ...forecastCandidates]
    .sort((left, right) => right.spareCapacity - left.spareCapacity || left.routeName.localeCompare(right.routeName))[0];

  if (!candidate || candidate.spareCapacity <= 0) {
    return {
      available: false,
      label: 'dérivation non disponible',
      effect: 'voisins déjà saturés',
      tradeoff: 'éviter de déplacer la pénurie',
    };
  }

  return {
    available: true,
    label: `dériver via ${candidate.corridor}`,
    effect: `absorbe ~${candidate.spareCapacity} capacité sur ${candidate.routeName}`,
    tradeoff: candidate.source === 'capacité financée'
      ? 'consomme marge financée'
      : 'surveillance hub voisin requise',
    targetCorridor: candidate.corridor,
    targetRouteName: candidate.routeName,
    spareCapacity: candidate.spareCapacity,
    source: candidate.source,
  };
}

function buildAtlasSecondaryBottleneckRerouteReadiness(forecast, reroute, fundedCapacityProjections, supplyForecasts) {
  const neighborCorridors = getAtlasNeighborCorridors(forecast.corridor);
  const neighborProjections = fundedCapacityProjections.items
    .filter((projection) => neighborCorridors.includes(projection.corridor));
  const neighborForecasts = supplyForecasts.routes
    .filter((candidate) => candidate.routeName !== forecast.routeName && neighborCorridors.includes(candidate.corridor));
  const matchingProjection = neighborProjections.find((projection) => projection.routeName === reroute.targetRouteName);
  const matchingForecast = neighborForecasts.find((candidate) => candidate.routeName === reroute.targetRouteName);
  const requiredRelief = Math.max(1, Math.abs(forecast.delta ?? 0));
  const sourceHasRisk = forecast.uncertain || forecast.highHubs > 0;
  const targetHasRisk = (matchingForecast?.highHubs ?? 0) > 0 || matchingForecast?.uncertain;
  const fundingGap = matchingProjection?.fundingGap
    ?? neighborProjections.find((projection) => projection.fundingGap > 0)?.fundingGap
    ?? 0;
  const capacityGap = Math.max(1, requiredRelief - Math.max(0, reroute.spareCapacity ?? 0));
  const compareFundingVsCapacity = (selected, rejected, rationale) => ({
    selected,
    rejected,
    rationale,
    label: `choisir ${selected}; écarter ${rejected}`,
  });
  const compareRiskVsBudget = (selected, rejected, rationale) => ({
    selected,
    rejected,
    rationale,
    label: `choisir ${selected}; écarter ${rejected}`,
  });
  const buildReadiness = (status, label, reason, unblockAction = null, tradeoffComparison = null) => ({
    status,
    label,
    reason,
    unblockAction,
    tradeoffComparison,
  });

  if (!reroute.available) {
    if (forecast.uncertain || sourceHasRisk) {
      const riskAction = forecast.uncertain
        ? 'qualifier flux et ressource manquants'
        : `stabiliser ${forecast.highHubs} hub${forecast.highHubs > 1 ? 's' : ''} critique${forecast.highHubs > 1 ? 's' : ''}`;
      return buildReadiness(
        'blocked-risk',
        'bloqué risque',
        'instabilité régionale à qualifier',
        riskAction,
        compareRiskVsBudget(riskAction, `ajouter ${Math.max(1, fundingGap || capacityGap)} budget`, 'budget inutile avant stabilité'),
      );
    }

    if (neighborProjections.some((projection) => projection.fundingGap > 0)) {
      return buildReadiness(
        'blocked-funding',
        'bloqué financement',
        'marge voisine encore à financer',
        `ajouter ${fundingGap} budget corridor`,
        compareFundingVsCapacity(`ajouter ${fundingGap} budget`, `libérer +${capacityGap} capacité`, 'moins cher que délestage voisin'),
      );
    }

    return buildReadiness(
      'blocked-capacity',
      'bloqué capacité',
      'aucun voisin avec marge exécutable',
      `libérer +${capacityGap} capacité voisine`,
      compareFundingVsCapacity(`libérer +${capacityGap} capacité`, `ajouter ${Math.max(1, fundingGap)} budget`, 'budget seul ne crée pas de marge'),
    );
  }

  if (matchingProjection?.fundingGap > 0 || (reroute.source === 'capacité financée' && !matchingProjection?.sufficient)) {
    return buildReadiness(
      'blocked-funding',
      'bloqué financement',
      'budget de délestage incomplet',
      `ajouter ${Math.max(1, fundingGap)} budget corridor`,
      compareFundingVsCapacity(`ajouter ${Math.max(1, fundingGap)} budget`, `libérer +${capacityGap} capacité`, 'répare le verrou direct'),
    );
  }

  if ((reroute.spareCapacity ?? 0) < requiredRelief || matchingProjection?.stillSaturated || matchingForecast?.tone === 'overload') {
    return buildReadiness(
      'blocked-capacity',
      'bloqué capacité',
      `marge ${reroute.spareCapacity ?? 0}/${requiredRelief} insuffisante`,
      `libérer +${capacityGap} capacité hub voisin`,
      compareFundingVsCapacity(`libérer +${capacityGap} capacité`, `ajouter ${Math.max(1, fundingGap)} budget`, 'corrige la contrainte de marge'),
    );
  }

  if (sourceHasRisk || targetHasRisk) {
    const unstableHubs = Math.max(1, forecast.highHubs, matchingForecast?.highHubs ?? 0);
    const riskAction = `stabiliser ${unstableHubs} hub${unstableHubs > 1 ? 's' : ''} critique${unstableHubs > 1 ? 's' : ''}`;
    return buildReadiness(
      'blocked-risk',
      'bloqué risque',
      'hub instable avant exécution',
      riskAction,
      compareRiskVsBudget(riskAction, `ajouter ${Math.max(1, fundingGap || capacityGap)} budget`, 'réduit le risque avant dépense'),
    );
  }

  return buildReadiness(
    'ready',
    'prêt maintenant',
    'financement, capacité et risque OK',
  );
}

function extractAtlasSecondaryBottleneckThreshold(action) {
  const budgetMatch = action?.match(/ajouter (\d+) budget/);
  if (budgetMatch) {
    return { type: 'budget', amount: Number(budgetMatch[1]) };
  }

  const capacityMatch = action?.match(/libérer \+(\d+) capacité/);
  if (capacityMatch) {
    return { type: 'capacity', amount: Number(capacityMatch[1]) };
  }

  return null;
}

function buildAtlasSecondaryBottleneckExecuteVerdict(item, index) {
  if (index > 0 || item.readiness.status === 'ready' || !item.readiness.unblockAction || !item.readiness.tradeoffComparison) {
    return null;
  }

  const selectedAction = item.readiness.tradeoffComparison.selected;
  const rejectedAlternative = item.readiness.tradeoffComparison.rejected;
  const routeStress = item.status === 'encore saturé' || item.impact.includes('pénurie');
  const budgetPressure = item.readiness.status === 'blocked-funding';
  const hubCapacityPressure = item.readiness.status === 'blocked-capacity';
  const instabilityRisk = item.readiness.status === 'blocked-risk';

  if (instabilityRisk) {
    return {
      status: 'too-risky',
      label: 'attendre: trop risqué',
      reason: `${selectedAction} avant ${rejectedAlternative}`,
    };
  }

  if (routeStress) {
    return {
      status: 'execute-now',
      label: 'exécuter maintenant',
      reason: `${selectedAction} maintenant; ${rejectedAlternative} attend`,
    };
  }

  if (budgetPressure) {
    return {
      status: 'wait-for-budget',
      label: 'attendre budget',
      reason: `${selectedAction} avant ${rejectedAlternative}`,
    };
  }

  if (hubCapacityPressure) {
    return {
      status: 'wait-for-capacity',
      label: 'attendre capacité',
      reason: `${selectedAction} avant ${rejectedAlternative}`,
    };
  }

  return null;
}

function buildAtlasSecondaryBottleneckFastestUnlock(item, index) {
  if (index > 0 || !item.waitCondition || !['wait-for-budget', 'wait-for-capacity'].includes(item.executeVerdict?.status)) {
    return null;
  }

  const routeStress = item.status === 'encore saturé' || item.impact.includes('pénurie');
  const budgetPressure = item.executeVerdict.status === 'wait-for-budget';
  const hubCapacityPressure = item.executeVerdict.status === 'wait-for-capacity';
  const instabilityRisk = item.waitCondition.status === 'risk-cooldown' || item.readiness.status === 'blocked-risk';

  if (instabilityRisk) {
    return {
      status: 'wait-for-risk-cooldown',
      label: 'plus vite: risque refroidi',
      action: 'laisser le hub critique sortir du rouge',
    };
  }

  if (budgetPressure && item.waitCondition.status === 'budget-threshold') {
    return {
      status: 'save-budget-one-turn',
      label: 'plus vite: épargner 1 tour',
      action: item.waitCondition.label.replace('seuil sûr: ', ''),
    };
  }

  if (hubCapacityPressure && item.waitCondition.status === 'capacity-threshold') {
    return {
      status: 'free-hub-capacity',
      label: 'plus vite: libérer hub',
      action: item.waitCondition.label.replace('seuil sûr: ', ''),
    };
  }

  if (routeStress) {
    return {
      status: 'reduce-route-stress',
      label: 'plus vite: réduire stress',
      action: 'diminuer la pénurie avant relance',
    };
  }

  return {
    status: 'no-fast-unlock',
    label: 'plus vite: aucun raccourci',
    action: 'attendre le seuil sûr confirmé',
  };
}

function buildAtlasSecondaryBottleneckUnlockPayoff(item, index) {
  if (index > 0 || !item.fastestUnlock) {
    return null;
  }

  const selectedAction = item.readiness.tradeoffComparison?.selected ?? item.readiness.unblockAction ?? '';
  const rejectedAlternative = item.readiness.tradeoffComparison?.rejected ?? '';
  const selectedThreshold = extractAtlasSecondaryBottleneckThreshold(selectedAction);
  const rejectedThreshold = extractAtlasSecondaryBottleneckThreshold(rejectedAlternative);
  const routeStress = item.status === 'encore saturé' || item.impact.includes('pénurie');
  const hubPressure = item.readiness.status === 'blocked-capacity' || /hub|capacité/.test(`${selectedAction} ${item.fastestUnlock.action}`);
  const budgetPressure = item.readiness.status === 'blocked-funding' || /budget/.test(`${selectedAction} ${item.fastestUnlock.action}`);
  const instabilityRisk = item.readiness.status === 'blocked-risk' || item.fastestUnlock.status === 'wait-for-risk-cooldown';

  if (instabilityRisk) {
    return {
      status: 'risk-stabilized',
      label: 'payoff: risque stabilisé',
      detail: 'exécution possible sans exposer le corridor',
    };
  }

  if (hubPressure && selectedThreshold?.type === 'capacity') {
    return {
      status: 'capacity-recovered',
      label: `payoff: +${selectedThreshold.amount} capacité`,
      detail: 'marge récupérée pour relancer la dérivation',
    };
  }

  if (budgetPressure && selectedThreshold?.type === 'budget') {
    return {
      status: 'budget-saved',
      label: `payoff: ${selectedThreshold.amount} budget cadré`,
      detail: rejectedThreshold?.type === 'capacity' ? 'évite un délestage de capacité plus lourd' : 'budget minimal avant exécution',
    };
  }

  if (hubPressure || routeStress) {
    return {
      status: 'hub-desaturated',
      label: 'payoff: hub désaturé',
      detail: 'réduit la pression aval après unlock rapide',
    };
  }

  return {
    status: 'no-clear-payoff',
    label: 'payoff: gain à confirmer',
    detail: 'aucun gain aval clair dans les données visibles',
  };
}

function buildAtlasSecondaryBottleneckNextConstraint(item, index) {
  if (index > 0 || !item.fastestUnlock || !item.unlockPayoff) {
    return null;
  }

  const selectedAction = item.readiness.tradeoffComparison?.selected ?? item.readiness.unblockAction ?? '';
  const rejectedAlternative = item.readiness.tradeoffComparison?.rejected ?? '';
  const selectedThreshold = extractAtlasSecondaryBottleneckThreshold(selectedAction);
  const rejectedThreshold = extractAtlasSecondaryBottleneckThreshold(rejectedAlternative);
  const routeStress = item.status === 'encore saturé' || item.impact.includes('pénurie');
  const hubPressure = item.readiness.status === 'blocked-capacity' || selectedThreshold?.type === 'capacity' || rejectedThreshold?.type === 'capacity';
  const budgetPressure = item.readiness.status === 'blocked-funding' || selectedThreshold?.type === 'budget' || rejectedThreshold?.type === 'budget';
  const regionalRisk = item.readiness.status === 'blocked-risk' || item.fastestUnlock.status === 'wait-for-risk-cooldown';

  if (regionalRisk && item.unlockPayoff.status !== 'risk-stabilized') {
    return {
      status: 'regional-risk',
      label: 'next: risque régional',
      detail: 'surveiller stabilité avant décision suivante',
    };
  }

  if (rejectedThreshold?.type === 'capacity' || (hubPressure && item.unlockPayoff.status !== 'capacity-recovered')) {
    return {
      status: 'hub-capacity',
      label: 'next: capacité hub',
      detail: 'vérifier marge voisine restante',
    };
  }

  if (rejectedThreshold?.type === 'budget' || (budgetPressure && item.unlockPayoff.status !== 'budget-saved')) {
    return {
      status: 'budget',
      label: 'next: budget corridor',
      detail: 'confirmer réserve avant ordre suivant',
    };
  }

  if (routeStress || item.unlockPayoff.status === 'hub-desaturated') {
    return {
      status: 'secondary-route',
      label: 'next: route secondaire',
      detail: 'surveiller le report aval après unlock',
    };
  }

  return {
    status: 'none-visible',
    label: 'next: aucun obstacle visible',
    detail: 'pas de contrainte post-unlock lisible',
  };
}

function buildAtlasSecondaryBottleneckWaitCondition(item, index) {
  if (index > 0 || !item.executeVerdict || !['wait-for-budget', 'wait-for-capacity'].includes(item.executeVerdict.status)) {
    return null;
  }

  const selectedAction = item.readiness.tradeoffComparison?.selected ?? item.readiness.unblockAction;
  const rejectedAlternative = item.readiness.tradeoffComparison?.rejected ?? '';
  const threshold = extractAtlasSecondaryBottleneckThreshold(selectedAction);
  const riskCooldown = /stabiliser|qualifier|risque|instable/.test(`${selectedAction} ${rejectedAlternative} ${item.readiness.reason}`);

  if (riskCooldown) {
    return {
      status: 'risk-cooldown',
      label: 'seuil sûr: risque stabilisé',
      reason: 'exécuter après refroidissement du hub critique',
    };
  }

  if (threshold?.type === 'budget') {
    return {
      status: 'budget-threshold',
      label: `seuil sûr: +${threshold.amount} budget`,
      reason: 'débloque sans consommer de capacité fragile',
    };
  }

  if (threshold?.type === 'capacity') {
    return {
      status: 'capacity-threshold',
      label: `seuil sûr: +${threshold.amount} capacité`,
      reason: 'marge voisine suffisante pour exécuter',
    };
  }

  return {
    status: 'no-clear-threshold',
    label: 'seuil sûr: à confirmer',
    reason: 'données insuffisantes pour seuil minimal',
  };
}

function buildAtlasSecondaryBottlenecks(fundedCapacityProjections, supplyForecasts) {
  if (fundedCapacityProjections.empty) {
    return {
      empty: true,
      items: [],
      summary: 'Aucun goulet secondaire pertinent',
    };
  }

  const projectedRoutes = new Set(fundedCapacityProjections.items.map((item) => item.routeName));
  const secondary = supplyForecasts.routes
    .filter((forecast) => !projectedRoutes.has(forecast.routeName))
    .map((forecast) => {
      const isNewSecondary = forecast.tone === 'watch' || forecast.tone === 'uncertain';
      const status = forecast.tone === 'overload'
        ? 'encore saturé'
        : isNewSecondary
          ? 'nouveau goulet secondaire'
          : 'résolu';
      const cause = forecast.uncertain
        ? 'données corridor incomplètes'
        : forecast.highHubs > 0
          ? `${forecast.highHubs} hub${forecast.highHubs > 1 ? 's' : ''} encore critique${forecast.highHubs > 1 ? 's' : ''}`
          : forecast.resourceLoad >= 8
            ? 'ressource encore fragile'
            : forecast.tone === 'watch'
              ? 'capacité limite après report'
              : 'flux apaisé';
      const impact = forecast.tone === 'overload'
        ? 'pénurie aval probable'
        : isNewSecondary
          ? 'ralentit le bénéfice financé'
          : 'aucun impact majeur';
      const score = forecast.tone === 'overload'
        ? 40 + forecast.resourceLoad
        : isNewSecondary
          ? 24 + forecast.resourceLoad
          : 4;
      const reroute = buildAtlasSecondaryBottleneckReroute(forecast, fundedCapacityProjections, supplyForecasts);
      const readiness = buildAtlasSecondaryBottleneckRerouteReadiness(forecast, reroute, fundedCapacityProjections, supplyForecasts);

      return {
        routeName: forecast.routeName,
        corridor: forecast.corridor,
        status,
        cause,
        impact,
        reroute,
        readiness,
        score: score + (reroute.available ? 3 : 0) + (readiness.status === 'ready' ? 2 : 0),
      };
    })
    .sort((left, right) => right.score - left.score || left.routeName.localeCompare(right.routeName))
    .slice(0, 3)
    .map((item, index) => {
      const itemWithVerdict = {
        ...item,
        executeVerdict: buildAtlasSecondaryBottleneckExecuteVerdict(item, index),
      };
      const itemWithWaitCondition = {
        ...itemWithVerdict,
        waitCondition: buildAtlasSecondaryBottleneckWaitCondition(itemWithVerdict, index),
      };
      const itemWithFastestUnlock = {
        ...itemWithWaitCondition,
        fastestUnlock: buildAtlasSecondaryBottleneckFastestUnlock(itemWithWaitCondition, index),
      };
      const itemWithUnlockPayoff = {
        ...itemWithFastestUnlock,
        unlockPayoff: buildAtlasSecondaryBottleneckUnlockPayoff(itemWithFastestUnlock, index),
      };
      return {
        ...itemWithUnlockPayoff,
        nextConstraint: buildAtlasSecondaryBottleneckNextConstraint(itemWithUnlockPayoff, index),
      };
    });

  return {
    empty: secondary.length === 0 || secondary.every((item) => item.status === 'résolu'),
    items: secondary,
    summary: secondary.length === 0 || secondary.every((item) => item.status === 'résolu')
      ? 'Aucun goulet secondaire pertinent'
      : `${secondary.filter((item) => item.status !== 'résolu').length} prochain${secondary.filter((item) => item.status !== 'résolu').length > 1 ? 's' : ''} goulet${secondary.filter((item) => item.status !== 'résolu').length > 1 ? 's' : ''}`,
  };
}

function buildAtlasEconomyStressRollups(economyView) {
  if (!economyView) {
    return { legend: [], regions: [] };
  }

  const tensionByCityId = Object.fromEntries(economyView.comparison.rows.map((row) => [row.cityId, row]));
  const cityNameById = Object.fromEntries(economyView.overlay.cities.map((city) => [city.cityId, city.cityName]));
  const corridorMap = new Map();
  const supplyForecasts = buildAtlasSupplyCapacityForecasts(economyView);
  const interventionOptions = buildAtlasCorridorInterventionOptions(supplyForecasts);
  const actionBudget = buildAtlasCorridorActionBudget(interventionOptions);
  const budgetShortfalls = buildAtlasCorridorBudgetShortfalls(actionBudget);
  const fundedPlans = buildAtlasFundedLogisticsPlans(actionBudget, budgetShortfalls);
  const committedFundingGaps = buildAtlasCommittedFundingGaps(fundedPlans);
  const fundedCapacityProjections = buildAtlasFundedCapacityProjections(committedFundingGaps, supplyForecasts);
  const secondaryBottlenecks = buildAtlasSecondaryBottlenecks(fundedCapacityProjections, supplyForecasts);
  const toneRank = { critical: 3, strained: 2, healthy: 1 };

  for (const route of economyView.overlay.routes) {
    const origin = cityLayoutsById[route.originCityId];
    const destination = cityLayoutsById[route.destinationCityId];

    if (!origin || !destination) {
      continue;
    }

    const stress = getRouteStressSummary(route, tensionByCityId, cityNameById);
    const tone = stress.tone === 'high' ? 'critical' : stress.tone === 'medium' ? 'strained' : 'healthy';
    const corridor = getAtlasEconomyCorridor(origin, destination);
    const current = corridorMap.get(corridor) ?? {
      corridor,
      tone: 'healthy',
      routeCount: 0,
      saturatedRoutes: 0,
      criticalHubs: new Set(),
      resources: new Map(),
      summaries: [],
      score: 0,
    };

    current.routeCount += 1;
    current.score += toneRank[tone] + Math.max(0, route.totalCapacity - 5) / 3;
    current.tone = toneRank[tone] > toneRank[current.tone] ? tone : current.tone;
    if (tone !== 'healthy' || route.totalCapacity >= 9) {
      current.saturatedRoutes += 1;
      current.summaries.push(`${route.routeName}: ${stress.summary}`);
    }
    for (const cityId of route.cityIds) {
      if (tensionByCityId[cityId]?.tensionLevel === 'high') {
        current.criticalHubs.add(cityNameById[cityId] ?? cityId);
      }
    }
    for (const resource of route.resources) {
      current.resources.set(resource.resourceId, (current.resources.get(resource.resourceId) ?? 0) + resource.capacity);
    }
    corridorMap.set(corridor, current);
  }

  const regions = [...corridorMap.values()]
    .map((entry) => {
      const topResource = [...entry.resources.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0];
      const resourceLabel = topResource ? `${getResourceHud(topResource[0]).label} ${topResource[1]}` : 'ressource stable';
      const hubLabel = [...entry.criticalHubs].slice(0, 2).join(', ') || 'hubs stables';
      const corridorForecast = supplyForecasts.byCorridor.get(entry.corridor);
      const forecastTone = corridorForecast?.overload > 0
        ? 'overload'
        : corridorForecast?.uncertain > 0
          ? 'uncertain'
          : corridorForecast?.watch > 0
            ? 'watch'
            : 'recovery';
      const forecastLabel = corridorForecast
        ? `${corridorForecast.overload} surcharge · ${corridorForecast.recovery} reprise · ${corridorForecast.uncertain} incertain`
        : 'prévision indisponible';

      return {
        corridor: entry.corridor,
        tone: entry.tone,
        routeCount: entry.routeCount,
        saturatedRoutes: entry.saturatedRoutes,
        hubLabel,
        resourceLabel,
        forecastTone,
        forecastLabel,
        summary: entry.summaries[0] ?? 'Flux lisible sans tension majeure.',
        action: entry.tone === 'critical'
          ? 'Sécuriser hub critique avant extension.'
          : entry.tone === 'strained'
            ? 'Surveiller saturation et ressource clé.'
            : 'Maintenir routes ouvertes.',
        score: entry.score,
      };
    })
    .sort((left, right) => right.score - left.score || left.corridor.localeCompare(right.corridor))
    .slice(0, 4);

  const counts = regions.reduce((acc, region) => {
    acc[region.tone] = (acc[region.tone] ?? 0) + 1;
    return acc;
  }, { critical: 0, strained: 0, healthy: 0 });

  return {
    legend: [
      { tone: 'critical', label: 'Critique', detail: `${counts.critical} région${counts.critical > 1 ? 's' : ''}: hubs/routes saturés` },
      { tone: 'strained', label: 'Tendue', detail: `${counts.strained} région${counts.strained > 1 ? 's' : ''}: flux à surveiller` },
      { tone: 'healthy', label: 'Saine', detail: `${counts.healthy} région${counts.healthy > 1 ? 's' : ''}: trafic stable` },
    ],
    regions,
    forecasts: supplyForecasts.routes,
    interventions: interventionOptions,
    actionBudget,
    budgetShortfalls,
    fundedPlans,
    committedFundingGaps,
    fundedCapacityProjections,
    secondaryBottlenecks,
  };
}

function renderAtlasEconomyStressLegend(economyView) {
  const rollup = buildAtlasEconomyStressRollups(economyView);

  if (rollup.regions.length === 0) {
    return '';
  }

  return `
    <g class="atlas-economy-stress-rollup" aria-label="Légende économie atlas: stress logistique et régions économiques">
      <rect class="atlas-economy-stress-rollup__panel" x="3" y="4" width="35" height="${80 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (rollup.interventions.length * 6.2) + (rollup.budgetShortfalls.items.length * 5.2) + (rollup.fundedPlans.plans.length * 5.4) + (rollup.committedFundingGaps.items.length * 5.4) + (rollup.fundedCapacityProjections.items.length * 5.4) + (rollup.secondaryBottlenecks.items.length * 8.1)}" rx="2.4"></rect>
      <text class="atlas-economy-stress-rollup__title" x="5" y="8.3">Stress économie</text>
      ${rollup.legend.map((entry, index) => `
        <g class="atlas-economy-stress-legend atlas-economy-stress-legend--${entry.tone}">
          <circle cx="${6 + (index * 10.8)}" cy="12.2" r="1.15"></circle>
          <text x="${8 + (index * 10.8)}" y="12.8">${entry.label}</text>
        </g>
      `).join('')}
      ${rollup.regions.map((region, index) => {
        const y = 18 + (index * 8.1);
        return `
          <g class="atlas-economy-region-rollup atlas-economy-region-rollup--${region.tone}">
            <rect x="5" y="${y - 2.9}" width="30.5" height="7.6" rx="1.4"></rect>
            <text class="atlas-economy-region-rollup__name" x="6.2" y="${y - 0.4}">${region.corridor} · ${region.tone === 'critical' ? 'critique' : region.tone === 'strained' ? 'tendue' : 'saine'}</text>
            <text class="atlas-economy-region-rollup__detail" x="6.2" y="${y + 1.6}">${region.saturatedRoutes}/${region.routeCount} routes · ${region.hubLabel} · ${region.resourceLabel}</text>
            <text class="atlas-economy-region-rollup__forecast atlas-economy-region-rollup__forecast--${region.forecastTone}" x="6.2" y="${y + 3.7}">Prévision: ${region.forecastLabel}</text>
            <text class="atlas-economy-region-rollup__action" x="6.2" y="${y + 5.8}">${region.action}</text>
          </g>
        `;
      }).join('')}
      <text class="atlas-supply-forecast__title" x="5" y="${20 + (rollup.regions.length * 8.1)}">Capacité prochain tour</text>
      ${rollup.forecasts.map((forecast, index) => {
        const y = 23.8 + (rollup.regions.length * 8.1) + (index * 5.4);
        return `
          <g class="atlas-supply-forecast atlas-supply-forecast--${forecast.tone}" aria-label="Prévision ${forecast.routeName}: ${forecast.status}">
            <rect x="5" y="${y - 2.8}" width="30.5" height="4.7" rx="1.2"></rect>
            <text class="atlas-supply-forecast__route" x="6.2" y="${y - 0.6}">${forecast.label} · ${forecast.status}</text>
            <text class="atlas-supply-forecast__action" x="6.2" y="${y + 1.2}">${forecast.action}</text>
          </g>
        `;
      }).join('')}
      <text class="atlas-corridor-intervention__title" x="5" y="${26 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4)}">Comparer interventions</text>
      ${rollup.interventions.map((option, index) => {
        const y = 30 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (index * 6.2);
        return `
          <g class="atlas-corridor-intervention atlas-corridor-intervention--${option.tone}" aria-label="Intervention ${option.routeName}: ${option.gainLabel}, ${option.riskAvoided}, contrainte ${option.constraint}">
            <rect x="5" y="${y - 3.1}" width="30.5" height="5.5" rx="1.2"></rect>
            <text class="atlas-corridor-intervention__rank" x="6.2" y="${y - 0.8}">${option.rankLabel}</text>
            <text class="atlas-corridor-intervention__route" x="8.2" y="${y - 0.8}">${option.corridor} · ${option.routeName}${option.tieLabel ? ` · ${option.tieLabel}` : ''}</text>
            <text class="atlas-corridor-intervention__detail" x="6.2" y="${y + 1.2}">${option.gainLabel} · ${option.riskAvoided} · ${option.constraint}</text>
          </g>
        `;
      }).join('')}
      <g class="atlas-corridor-budget ${rollup.actionBudget.empty ? 'is-empty' : ''}" aria-label="Budget de corridor: ${rollup.actionBudget.used}/${rollup.actionBudget.capacity} actions, sélection ${rollup.actionBudget.selectedLabel}, reports ${rollup.actionBudget.deferredLabel}">
        <rect x="5" y="${31.8 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (rollup.interventions.length * 6.2)}" width="30.5" height="8.6" rx="1.4"></rect>
        <text class="atlas-corridor-budget__title" x="6.2" y="${34.2 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (rollup.interventions.length * 6.2)}">Budget corridor ${rollup.actionBudget.used}/${rollup.actionBudget.capacity}</text>
        <text class="atlas-corridor-budget__selected" x="6.2" y="${36.4 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (rollup.interventions.length * 6.2)}">Retenir: ${rollup.actionBudget.selectedLabel} · gain +${rollup.actionBudget.selectedGain}</text>
        <text class="atlas-corridor-budget__deferred" x="6.2" y="${38.4 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (rollup.interventions.length * 6.2)}">Reporter: ${rollup.actionBudget.deferredLabel}</text>
        <text class="atlas-corridor-budget__tradeoff" x="6.2" y="${40.2 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (rollup.interventions.length * 6.2)}">Compromis: ${rollup.actionBudget.tradeoff}</text>
      </g>
      <g class="atlas-corridor-shortfall ${rollup.budgetShortfalls.empty ? 'is-empty' : ''}" aria-label="Manques budgétaires corridors: ${rollup.budgetShortfalls.summary}">
        <rect x="5" y="${42.2 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (rollup.interventions.length * 6.2)}" width="30.5" height="${rollup.budgetShortfalls.empty ? 4.8 : 5.6 + (rollup.budgetShortfalls.items.length * 5.2)}" rx="1.4"></rect>
        <text class="atlas-corridor-shortfall__title" x="6.2" y="${44.7 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (rollup.interventions.length * 6.2)}">Manques budget · ${rollup.budgetShortfalls.summary}</text>
        ${rollup.budgetShortfalls.empty ? `<text class="atlas-corridor-shortfall__empty" x="6.2" y="${47.0 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (rollup.interventions.length * 6.2)}">Aucun corridor sous-financé</text>` : ''}
        ${rollup.budgetShortfalls.items.map((item, index) => {
          const y = 48.2 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (rollup.interventions.length * 6.2) + (index * 5.2);
          return `
            <g class="atlas-corridor-shortfall-item atlas-corridor-shortfall-item--${item.tone}" aria-label="Manque ${item.routeName}: impact aval ${item.downstreamImpact}, action minimale ${item.minimumAction}, effet ${item.expectedEffect}">
              <text class="atlas-corridor-shortfall-item__route" x="6.2" y="${y}">${item.corridor} · ${item.routeName}</text>
              <text class="atlas-corridor-shortfall-item__action" x="6.2" y="${y + 2.0}">${item.minimumAction} · ${item.expectedEffect}</text>
            </g>
          `;
        }).join('')}
      </g>
      <g class="atlas-funded-logistics-plan ${rollup.fundedPlans.empty ? 'is-empty' : ''}" aria-label="Plans logistiques financés: ${rollup.fundedPlans.summary}, budget engagé ${rollup.fundedPlans.committedBudget}, reste à financer ${rollup.fundedPlans.remainingToFund}">
        <rect x="5" y="${49.2 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (rollup.interventions.length * 6.2) + (rollup.budgetShortfalls.items.length * 5.2)}" width="30.5" height="${rollup.fundedPlans.empty ? 5.2 : 6.2 + (rollup.fundedPlans.plans.length * 5.4)}" rx="1.4"></rect>
        <text class="atlas-funded-logistics-plan__title" x="6.2" y="${51.7 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (rollup.interventions.length * 6.2) + (rollup.budgetShortfalls.items.length * 5.2)}">Plan financé · engagé ${rollup.fundedPlans.committedBudget} · reste ${rollup.fundedPlans.remainingToFund}</text>
        ${rollup.fundedPlans.empty ? `<text class="atlas-funded-logistics-plan__empty" x="6.2" y="${54.0 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (rollup.interventions.length * 6.2) + (rollup.budgetShortfalls.items.length * 5.2)}">Aucun corridor finançable</text>` : ''}
        ${rollup.fundedPlans.plans.map((plan, index) => {
          const y = 55.3 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (rollup.interventions.length * 6.2) + (rollup.budgetShortfalls.items.length * 5.2) + (index * 5.4);
          return `
            <g class="atlas-funded-logistics-plan-item atlas-funded-logistics-plan-item--${plan.status}" aria-label="Plan ${plan.routeName}: budget engagé ${plan.committed}, reste à financer ${plan.remainingToFund}, bénéfice ${plan.benefit}">
              <text class="atlas-funded-logistics-plan-item__route" x="6.2" y="${y}">${plan.status} · ${plan.impactLabel}</text>
              <text class="atlas-funded-logistics-plan-item__benefit" x="6.2" y="${y + 2.0}">${plan.benefit} · ${plan.cityEffect}</text>
            </g>
          `;
        }).join('')}
      </g>
      <g class="atlas-committed-funding-gap ${rollup.committedFundingGaps.empty ? 'is-empty' : ''}" aria-label="Suivi post-financement: ${rollup.committedFundingGaps.summary}">
        <rect x="5" y="${57.2 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (rollup.interventions.length * 6.2) + (rollup.budgetShortfalls.items.length * 5.2) + (rollup.fundedPlans.plans.length * 5.4)}" width="30.5" height="${rollup.committedFundingGaps.empty ? 5.2 : 6.2 + (rollup.committedFundingGaps.items.length * 5.4)}" rx="1.4"></rect>
        <text class="atlas-committed-funding-gap__title" x="6.2" y="${59.7 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (rollup.interventions.length * 6.2) + (rollup.budgetShortfalls.items.length * 5.2) + (rollup.fundedPlans.plans.length * 5.4)}">Après engagement · ${rollup.committedFundingGaps.summary}</text>
        ${rollup.committedFundingGaps.empty ? `<text class="atlas-committed-funding-gap__empty" x="6.2" y="${62.0 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (rollup.interventions.length * 6.2) + (rollup.budgetShortfalls.items.length * 5.2) + (rollup.fundedPlans.plans.length * 5.4)}">Aucun plan engagé</text>` : ''}
        ${rollup.committedFundingGaps.items.map((gap, index) => {
          const y = 63.3 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (rollup.interventions.length * 6.2) + (rollup.budgetShortfalls.items.length * 5.2) + (rollup.fundedPlans.plans.length * 5.4) + (index * 5.4);
          return `
            <g class="atlas-committed-funding-gap-item atlas-committed-funding-gap-item--${gap.status}" aria-label="Écart financement ${gap.routeName}: engagé ${gap.committed}, coût attendu ${gap.expectedCost}, écart restant ${gap.fundingGap}, ${gap.residualRisk}, ressource ${gap.fragileResource}">
              <text class="atlas-committed-funding-gap-item__route" x="6.2" y="${y}">${gap.fullyCovered ? 'entièrement couvert' : 'reste à couvrir'} · ${gap.corridor} · ${gap.routeName}</text>
              <text class="atlas-committed-funding-gap-item__detail" x="6.2" y="${y + 2.0}">engagé ${gap.committed}/${gap.expectedCost} · écart ${gap.fundingGap} · ${gap.residualRisk} · ${gap.fragileResource} · ${gap.nextAction}</text>
            </g>
          `;
        }).join('')}
      </g>
      <g class="atlas-funded-capacity-projection ${rollup.fundedCapacityProjections.empty ? 'is-empty' : ''}" aria-label="Projection capacité après plans financés: ${rollup.fundedCapacityProjections.summary}">
        <rect x="5" y="${65.2 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (rollup.interventions.length * 6.2) + (rollup.budgetShortfalls.items.length * 5.2) + (rollup.fundedPlans.plans.length * 5.4) + (rollup.committedFundingGaps.items.length * 5.4)}" width="30.5" height="${rollup.fundedCapacityProjections.empty ? 5.2 : 6.2 + (rollup.fundedCapacityProjections.items.length * 5.4)}" rx="1.4"></rect>
        <text class="atlas-funded-capacity-projection__title" x="6.2" y="${67.7 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (rollup.interventions.length * 6.2) + (rollup.budgetShortfalls.items.length * 5.2) + (rollup.fundedPlans.plans.length * 5.4) + (rollup.committedFundingGaps.items.length * 5.4)}">Capacité après plan · ${rollup.fundedCapacityProjections.summary}</text>
        ${rollup.fundedCapacityProjections.empty ? `<text class="atlas-funded-capacity-projection__empty" x="6.2" y="${70.0 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (rollup.interventions.length * 6.2) + (rollup.budgetShortfalls.items.length * 5.2) + (rollup.fundedPlans.plans.length * 5.4) + (rollup.committedFundingGaps.items.length * 5.4)}">Aucune projection financée</text>` : ''}
        ${rollup.fundedCapacityProjections.items.map((projection, index) => {
          const y = 71.3 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (rollup.interventions.length * 6.2) + (rollup.budgetShortfalls.items.length * 5.2) + (rollup.fundedPlans.plans.length * 5.4) + (rollup.committedFundingGaps.items.length * 5.4) + (index * 5.4);
          return `
            <g class="atlas-funded-capacity-projection-item atlas-funded-capacity-projection-item--${projection.sufficient ? 'sufficient' : 'saturated'}" aria-label="Projection ${projection.routeName}: capacité ${projection.currentCapacity} vers ${projection.projectedCapacity}, ${projection.message}, ${projection.reviewTurn}">
              <text class="atlas-funded-capacity-projection-item__route" x="6.2" y="${y}">${projection.message} · ${projection.corridor} · ${projection.routeName}</text>
              <text class="atlas-funded-capacity-projection-item__detail" x="6.2" y="${y + 2.0}">capacité ${projection.currentCapacity}→${projection.projectedCapacity} · reste ${projection.fundingGap} · ${projection.priority} · ${projection.reviewTurn}</text>
            </g>
          `;
        }).join('')}
      </g>
      <g class="atlas-secondary-bottleneck ${rollup.secondaryBottlenecks.empty ? 'is-empty' : ''}" aria-label="Prochains goulets après projection: ${rollup.secondaryBottlenecks.summary}">
        <rect x="5" y="${73.2 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (rollup.interventions.length * 6.2) + (rollup.budgetShortfalls.items.length * 5.2) + (rollup.fundedPlans.plans.length * 5.4) + (rollup.committedFundingGaps.items.length * 5.4) + (rollup.fundedCapacityProjections.items.length * 5.4)}" width="30.5" height="${rollup.secondaryBottlenecks.empty ? 5.2 : 6.3 + (rollup.secondaryBottlenecks.items.length * 8.1)}" rx="1.4"></rect>
        <text class="atlas-secondary-bottleneck__title" x="6.2" y="${75.7 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (rollup.interventions.length * 6.2) + (rollup.budgetShortfalls.items.length * 5.2) + (rollup.fundedPlans.plans.length * 5.4) + (rollup.committedFundingGaps.items.length * 5.4) + (rollup.fundedCapacityProjections.items.length * 5.4)}">Prochains goulets · ${rollup.secondaryBottlenecks.summary}</text>
        ${rollup.secondaryBottlenecks.empty ? `<text class="atlas-secondary-bottleneck__empty" x="6.2" y="${78.0 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (rollup.interventions.length * 6.2) + (rollup.budgetShortfalls.items.length * 5.2) + (rollup.fundedPlans.plans.length * 5.4) + (rollup.committedFundingGaps.items.length * 5.4) + (rollup.fundedCapacityProjections.items.length * 5.4)}">Aucun goulet secondaire pertinent</text>` : ''}
        ${rollup.secondaryBottlenecks.items.map((item, index) => {
          const y = 79.3 + (rollup.regions.length * 8.1) + (rollup.forecasts.length * 5.4) + (rollup.interventions.length * 6.2) + (rollup.budgetShortfalls.items.length * 5.2) + (rollup.fundedPlans.plans.length * 5.4) + (rollup.committedFundingGaps.items.length * 5.4) + (rollup.fundedCapacityProjections.items.length * 5.4) + (index * 8.1);
          return `
            <g class="atlas-secondary-bottleneck-item atlas-secondary-bottleneck-item--${item.status === 'résolu' ? 'resolved' : item.status === 'encore saturé' ? 'saturated' : 'secondary'} ${item.reroute.available ? 'has-reroute' : 'has-no-reroute'} atlas-secondary-bottleneck-item--${item.readiness.status} ${item.executeVerdict ? `atlas-secondary-bottleneck-item--${item.executeVerdict.status}` : ''} ${item.waitCondition ? `atlas-secondary-bottleneck-item--${item.waitCondition.status}` : ''} ${item.fastestUnlock ? `atlas-secondary-bottleneck-item--${item.fastestUnlock.status}` : ''} ${item.unlockPayoff ? `atlas-secondary-bottleneck-item--${item.unlockPayoff.status}` : ''} ${item.nextConstraint ? `atlas-secondary-bottleneck-item--${item.nextConstraint.status}` : ''}" aria-label="Goulet ${index + 1} ${item.routeName}: ${item.status}, cause ${item.cause}, impact ${item.impact}, suggestion ${item.reroute.label}, exécution ${item.readiness.label}, blocage ${item.readiness.reason}${item.readiness.unblockAction ? `, action minimale ${item.readiness.unblockAction}` : ''}${item.readiness.tradeoffComparison ? `, compromis ${item.readiness.tradeoffComparison.label}, raison ${item.readiness.tradeoffComparison.rationale}` : ''}${item.executeVerdict ? `, verdict ${item.executeVerdict.label}, ${item.executeVerdict.reason}` : ''}${item.waitCondition ? `, condition ${item.waitCondition.label}, ${item.waitCondition.reason}` : ''}${item.fastestUnlock ? `, déblocage rapide ${item.fastestUnlock.label}, ${item.fastestUnlock.action}` : ''}${item.unlockPayoff ? `, gain ${item.unlockPayoff.label}, ${item.unlockPayoff.detail}` : ''}${item.nextConstraint ? `, prochaine contrainte ${item.nextConstraint.label}, ${item.nextConstraint.detail}` : ''}">
              <text class="atlas-secondary-bottleneck-item__route" x="6.2" y="${y}">${index + 1}. ${item.status} · ${item.corridor} · ${item.routeName}</text>
              <text class="atlas-secondary-bottleneck-item__detail" x="6.2" y="${y + 2.0}">${item.cause} · ${item.impact}</text>
              <text class="atlas-secondary-bottleneck-item__reroute" x="6.2" y="${y + 4.0}">${item.reroute.label} · ${item.reroute.effect} · ${item.reroute.tradeoff}</text>
              <text class="atlas-secondary-bottleneck-item__readiness" x="6.2" y="${y + 5.8}">${item.readiness.label} · ${item.readiness.reason}${item.readiness.unblockAction ? ` · Action: ${item.readiness.unblockAction}` : ''}${item.readiness.tradeoffComparison ? ` · Vs: ${item.readiness.tradeoffComparison.rejected} (${item.readiness.tradeoffComparison.rationale})` : ''}${item.executeVerdict ? ` · Verdict: ${item.executeVerdict.label}` : ''}${item.waitCondition ? ` · Attendre: ${item.waitCondition.label}` : ''}${item.fastestUnlock ? ` · Débloquer: ${item.fastestUnlock.label}` : ''}${item.unlockPayoff ? ` · Gain: ${item.unlockPayoff.label}` : ''}${item.nextConstraint ? ` · Next: ${item.nextConstraint.label}` : ''}</text>
            </g>
          `;
        }).join('')}
      </g>
    </g>
  `;
}

function renderAtlasWorldEconomyLayer(economyView) {
  if (!economyView) {
    return '';
  }

  const tensionByCityId = Object.fromEntries(economyView.comparison.rows.map((row) => [row.cityId, row]));
  const cityNameById = Object.fromEntries(economyView.overlay.cities.map((city) => [city.cityId, city.cityName]));
  const supplyForecasts = buildAtlasSupplyCapacityForecasts(economyView);
  const routeLines = economyView.overlay.routes.map((route, index) => {
    const origin = cityLayoutsById[route.originCityId];
    const destination = cityLayoutsById[route.destinationCityId];

    if (!origin || !destination) {
      return '';
    }

    const stress = getRouteStressSummary(route, tensionByCityId, cityNameById);
    const intensity = stress.tone === 'high' ? 'major' : stress.tone === 'medium' ? 'medium' : 'minor';
    const laneOffset = ((index % 3) - 1) * 0.8;
    const controlX = ((origin.x + destination.x) / 2) + laneOffset;
    const controlY = ((origin.y + destination.y) / 2) - 3 - laneOffset;
    const path = `M${origin.x},${origin.y} Q${controlX},${controlY} ${destination.x},${destination.y}`;
    const forecast = supplyForecasts.byRouteId.get(route.routeId);

    return `
      <g class="atlas-logistics-route atlas-logistics-route--${intensity} atlas-logistics-route--forecast-${forecast?.tone ?? 'unknown'} ${route.active ? 'is-active' : 'is-inactive'}" aria-label="Route atlas ${route.routeName}: ${stress.summary}; prévision capacité ${forecast?.status ?? 'indisponible'}">
        <path d="${path}" pathLength="100"></path>
        <text x="${controlX}" y="${controlY - 1.2}" text-anchor="middle">${forecast && !forecast.uncertain ? `${route.totalCapacity}→${forecast.projectedCapacity}` : `${route.totalCapacity}?`}</text>
      </g>
    `;
  }).join('');

  const cityNodes = economyView.overlay.cities.map((city) => {
    const position = city.marker.position;
    const tension = tensionByCityId[city.cityId]?.tensionLevel ?? 'low';
    const resources = Object.entries(city.resources.stockByResource ?? {})
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 2)
      .map(([resourceId, amount]) => `${getResourceHud(resourceId).glyph}${amount}`)
      .join(' ');
    const hubSize = city.tradeRouteIds.length >= 2 ? 'hub' : city.capital ? 'capital' : 'node';

    if (!position) {
      return '';
    }

    return `
      <g class="atlas-economy-city atlas-economy-city--${tension} atlas-economy-city--${hubSize}" aria-label="Ville atlas ${city.cityName}: stock ${city.resources.totalStock}, ressources ${resources || 'aucune'}, logistique ${tension}">
        <circle class="atlas-economy-city__aura" cx="${position.x}%" cy="${position.y}%" r="${tension === 'high' ? 4.2 : tension === 'medium' ? 3.2 : 2.4}"></circle>
        <circle class="atlas-economy-city__core" cx="${position.x}%" cy="${position.y}%" r="${city.capital ? 1.6 : 1.2}"></circle>
        <text class="atlas-economy-city__glyph" x="${position.x}%" y="${position.y + 0.55}%" text-anchor="middle">${city.capital ? '★' : city.tradeRouteIds.length >= 2 ? '◆' : '•'}</text>
        <text class="atlas-economy-city__resources" x="${position.x + 2.4}%" y="${position.y - 1.1}%">${resources}</text>
        <text class="atlas-economy-city__label" x="${position.x + 2.4}%" y="${position.y + 1.5}%">${city.cityName}</text>
      </g>
    `;
  }).join('');

  return `
    <g class="atlas-world-economy-layer" aria-label="Villes, ressources et flux logistiques sur la carte monde">
      <g class="atlas-world-logistics-routes">${routeLines}</g>
      <g class="atlas-world-economy-cities">${cityNodes}</g>
    </g>
  `;
}

function getProvinceCenter(provinceId) {
  const geometry = getProvinceGeometry(provinceId);

  if (geometry.center) {
    return geometry.center;
  }

  const layout = getProvinceLayout(provinceId);

  return {
    x: layout.x + (layout.w / 2),
    y: layout.y + (layout.h / 2),
  };
}

function buildProvinceRelations(shell) {
  const uniqueRelations = new Map();

  shell.provinces.forEach((province) => {
    province.neighborIds.forEach((neighborId) => {
      const relationId = [province.provinceId, neighborId].sort().join('::');

      if (uniqueRelations.has(relationId)) {
        return;
      }

      const neighbor = shell.provinces.find((candidate) => candidate.provinceId === neighborId);
      const origin = getProvinceCenter(province.provinceId);
      const destination = getProvinceCenter(neighborId);

      if (!origin || !destination || !neighbor) {
        return;
      }

      const contested = province.contested || neighbor.contested;
      const occupied = province.occupied || neighbor.occupied;
      const stable = !contested && !occupied && province.controllingFactionId !== neighbor.controllingFactionId;

      uniqueRelations.set(relationId, {
        relationId,
        origin,
        destination,
        contested,
        occupied,
        stable,
      });
    });
  });

  return [...uniqueRelations.values()];
}

function getProvinceStateByTurn(province) {
  const seasonalShift = state.seasonIndex;
  const turnShift = Math.max(0, state.turn - 1);
  const loyaltyDelta = province.provinceId === 'river-gate'
    ? Math.max(-18, -turnShift * 4)
    : province.provinceId === 'southern-reach'
      ? Math.min(10, turnShift * 2)
      : province.provinceId === 'crown-heart'
        ? Math.min(6, turnShift)
        : province.provinceId === 'red-ridge'
          ? Math.max(-8, -turnShift * 2)
          : 0;

  const supplyByProvinceId = {
    'north-watch': ['stable', 'stable', 'strained', 'strained'],
    'crown-heart': ['stable', 'stable', 'stable', 'strained'],
    'red-ridge': ['strained', 'strained', 'disrupted', 'strained'],
    'river-gate': ['disrupted', 'strained', 'disrupted', 'collapsed'],
    'iron-plain': ['strained', 'stable', 'strained', 'disrupted'],
    'southern-reach': ['collapsed', 'strained', 'strained', 'collapsed'],
  };

  return new Province({
    ...province.toJSON(),
    loyalty: Math.max(0, Math.min(100, province.loyalty + loyaltyDelta)),
    supplyLevel: supplyByProvinceId[province.id]?.[seasonalShift] ?? province.supplyLevel,
    contested: province.id === 'river-gate' ? state.turn % 2 === 1 : province.contested,
  });
}

function getShell() {
  const scenario = getSelectedMapScenario();

  return buildStrategicMapShell(provinces.map(getProvinceStateByTurn), {
    provinceGeometryById,
    title: scenario?.gameTitle ?? 'Écran stratégique, théâtre continental',
    subtitle: scenario?.gameSubtitle ?? 'Prototype local Alpha prêt à accueillir les overlays inter-domaines',
    paletteByFaction,
    factionMetaById,
    selectedProvinceId: state.selectedProvinceId,
    focusedProvinceId: state.focusedProvinceId,
    hoveredProvinceId: state.hoveredProvinceId,
  });
}

function getOverlayDescription(slotId) {
  const copyBySlot = {
    'climate-overlay': 'Ancrage réservé aux effets météo, saisons et catastrophes régionales.',
    'culture-overlay': 'Ancrage réservé aux couches d’influence culturelle et aux découvertes.',
    'economy-overlay': 'Ancrage réservé aux routes, flux, villes et tensions logistiques.',
    'intrigue-overlay': 'Ancrage réservé aux cellules, alertes et opérations clandestines.',
  };

  return copyBySlot[slotId] ?? 'Ancrage overlay prêt à être enrichi.';
}

function renderStat(label, value, tone = 'neutral') {
  return `<div class="stat-card stat-card--${tone}"><span>${label}</span><strong>${value}</strong></div>`;
}

function renderLegend(shell) {
  const factions = shell.legend.factions.map((faction) => `
    <li>
      <span class="legend-swatch" style="--swatch-fill:${faction.color};--swatch-border:${faction.border}"></span>
      <span>${faction.label}</span>
    </li>
  `).join('');

  const statesMarkup = shell.legend.states.map((entry) => `<li><span class="legend-chip">${entry.code}</span>${entry.label}</li>`).join('');
  const frontierMarkup = [
    ['stable', 'Frontière stable'],
    ['occupied', 'Limite sous occupation'],
    ['contested', 'Front contesté'],
  ].map(([tone, label]) => `
    <li>
      <span class="frontier-key frontier-key--${tone}"></span>
      <span>${label}</span>
    </li>
  `).join('');

  return `
    <section class="panel legend-panel">
      <div class="panel-header">
        <h3>Légende tactique</h3>
        <p>Lecture par faction et état de contrôle</p>
      </div>
      <div class="legend-columns">
        <div>
          <h4>Factions</h4>
          <ul class="legend-list">${factions}</ul>
        </div>
        <div>
          <h4>États</h4>
          <ul class="legend-list legend-list--states">${statesMarkup}</ul>
        </div>
      </div>
      <div class="legend-frontiers">
        <h4>Frontières</h4>
        <ul class="legend-list">${frontierMarkup}</ul>
      </div>
    </section>
  `;
}

function getProvinceShape(provinceId) {
  return getProvinceGeometry(provinceId).shape ?? `polygon(${getProvincePolygon(provinceId).split(' ').map((point) => point.split(',').join('% ')).join('%, ') }%)`;
}

const militaryOutcomeMarkerCategories = [
  { tone: 'stabilized', label: 'Front stabilisé', shortLabel: 'Stabilisé' },
  { tone: 'worsened', label: 'Front aggravé', shortLabel: 'Aggravé' },
  { tone: 'blocked', label: 'Action bloquée', shortLabel: 'Bloqué' },
  { tone: 'risk', label: 'Risque de suivi', shortLabel: 'Risque' },
];

function isCriticalMilitaryOutcomeMarker(marker) {
  return Boolean(marker && ['worsened', 'blocked', 'risk'].includes(marker.tone));
}

function getMilitaryOutcomePinReason(marker) {
  if (!isCriticalMilitaryOutcomeMarker(marker)) {
    return null;
  }

  return {
    worsened: 'épinglé: front aggravé à traiter avant densité/filtre',
    blocked: 'épinglé: action bloquée à débloquer avant nouvel ordre',
    risk: 'épinglé: risque de suivi critique à surveiller',
  }[marker.tone] ?? 'épinglé: suivi militaire prioritaire';
}

function isMilitaryOutcomeMarkerVisible(marker) {
  return Boolean(marker && (state.militaryOutcomeMarkerFilters[marker.tone] !== false || isCriticalMilitaryOutcomeMarker(marker)));
}

function getMilitaryOutcomeMarkerForProvince(provinceId) {
  const marker = state.lastMilitaryOutcomeMarkers.find((candidate) => candidate.provinceId === provinceId) ?? null;

  return isMilitaryOutcomeMarkerVisible(marker) ? marker : null;
}

function getAnyMilitaryOutcomeMarkerForProvince(provinceId) {
  return state.lastMilitaryOutcomeMarkers.find((marker) => marker.provinceId === provinceId) ?? null;
}

function buildMilitaryOutcomeMarkerFilterState(markers = state.lastMilitaryOutcomeMarkers) {
  return militaryOutcomeMarkerCategories.map((category) => {
    const count = markers.filter((marker) => marker.tone === category.tone).length;
    const enabled = state.militaryOutcomeMarkerFilters[category.tone] !== false;

    return {
      ...category,
      count,
      enabled,
      hiddenCount: enabled ? 0 : markers.filter((marker) => marker.tone === category.tone && !isCriticalMilitaryOutcomeMarker(marker)).length,
      pinnedCount: markers.filter((marker) => marker.tone === category.tone && isCriticalMilitaryOutcomeMarker(marker)).length,
    };
  });
}

const militaryOutcomeSeverityRank = {
  worsened: 4,
  blocked: 3,
  risk: 2,
  stabilized: 1,
};

function getMilitaryOutcomeUrgentAction(tone) {
  return {
    worsened: 'Renforcer ce front en priorité au prochain tour.',
    blocked: 'Lever le blocage avant de relancer l’ordre.',
    risk: 'Surveiller le risque restant et préparer un appui ciblé.',
    stabilized: 'Maintenir la pression sans détourner la réserve.',
  }[tone] ?? 'Réévaluer le front au prochain tour.';
}

function buildMilitaryFrontMarkerSummaries(markers = state.lastMilitaryOutcomeMarkers) {
  if (markers.length === 0) {
    return [];
  }

  const groups = new Map();

  for (const marker of markers) {
    const frontKey = marker.provinceId;
    const existing = groups.get(frontKey) ?? {
      frontKey,
      frontLabel: marker.provinceLabel ?? marker.provinceId,
      markers: [],
      visibleCount: 0,
      hiddenCount: 0,
      dominantTone: marker.tone,
      dominantLabel: marker.label,
      urgentAction: getMilitaryOutcomeUrgentAction(marker.tone),
      pinnedCount: 0,
      pinnedReasons: [],
    };
    const visible = isMilitaryOutcomeMarkerVisible(marker);
    const pinReason = getMilitaryOutcomePinReason(marker);

    existing.markers.push(marker);
    existing.visibleCount += visible ? 1 : 0;
    existing.hiddenCount += visible ? 0 : 1;
    existing.pinnedCount += pinReason ? 1 : 0;
    if (pinReason && !existing.pinnedReasons.includes(pinReason)) {
      existing.pinnedReasons.push(pinReason);
    }

    if ((militaryOutcomeSeverityRank[marker.tone] ?? 0) > (militaryOutcomeSeverityRank[existing.dominantTone] ?? 0)) {
      existing.dominantTone = marker.tone;
      existing.dominantLabel = marker.label;
      existing.urgentAction = getMilitaryOutcomeUrgentAction(marker.tone);
    }

    groups.set(frontKey, existing);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      totalCount: group.markers.length,
      status: group.visibleCount > 0 ? 'visible' : 'hidden',
      pinSummary: group.pinnedReasons[0] ?? 'aucun épinglage critique',
    }))
    .sort((left, right) => {
      const severityDelta = (militaryOutcomeSeverityRank[right.dominantTone] ?? 0) - (militaryOutcomeSeverityRank[left.dominantTone] ?? 0);
      return severityDelta || right.visibleCount - left.visibleCount || left.frontLabel.localeCompare(right.frontLabel);
    });
}

function buildMilitaryOutcomeTrailSummary(markers = state.lastMilitaryOutcomeMarkers) {
  const visibleMarkers = markers.filter((marker) => isMilitaryOutcomeMarkerVisible(marker));
  const sourceMarkers = visibleMarkers.length > 0 ? visibleMarkers : markers;

  if (sourceMarkers.length === 0) {
    return {
      empty: true,
      hiddenByFilters: false,
      trails: [],
      groupedCount: 0,
      summary: 'Aucune suite militaire post-résolution à afficher.',
    };
  }

  const trails = sourceMarkers
    .map((marker) => {
      const severity = militaryOutcomeSeverityRank[marker.tone] ?? 0;
      const impactLabel = {
        stabilized: 'stabilisé',
        worsened: 'pression déplacée',
        blocked: 'action bloquée',
        risk: 'risque résiduel',
      }[marker.tone] ?? 'suite militaire';
      const nextStep = getMilitaryOutcomeUrgentAction(marker.tone);

      return {
        provinceId: marker.provinceId,
        provinceLabel: marker.provinceLabel ?? marker.provinceId,
        tone: marker.tone,
        actionCode: marker.actionCode,
        label: marker.label,
        impactLabel,
        detail: marker.changed ?? marker.summaryItem ?? marker.why,
        nextStep,
        severity,
        turn: marker.turn,
      };
    })
    .sort((left, right) => right.severity - left.severity || left.provinceLabel.localeCompare(right.provinceLabel));

  const visibleTrails = trails.slice(0, 3);
  const groupedCount = Math.max(0, trails.length - visibleTrails.length);

  return {
    empty: false,
    hiddenByFilters: visibleMarkers.length === 0 && markers.length > 0,
    trails: visibleTrails,
    groupedCount,
    summary: `${visibleTrails.length} suite${visibleTrails.length > 1 ? 's' : ''} militaire${visibleTrails.length > 1 ? 's' : ''} clé${visibleTrails.length > 1 ? 's' : ''} après résolution${groupedCount > 0 ? ` · ${groupedCount} regroupée${groupedCount > 1 ? 's' : ''}` : ''}.`,
  };
}

function renderMilitaryOutcomeTrailSummary(markers = state.lastMilitaryOutcomeMarkers) {
  const trailSummary = buildMilitaryOutcomeTrailSummary(markers);

  if (trailSummary.empty) {
    return `
      <section class="military-outcome-trail is-empty" aria-label="Suites militaires post-résolution">
        <div class="military-outcome-trail__header">
          <span>Suites militaires</span>
          <strong>Aucune suite</strong>
        </div>
        <p>${trailSummary.summary}</p>
      </section>
    `;
  }

  return `
    <section class="military-outcome-trail" aria-label="Suites militaires post-résolution">
      <div class="military-outcome-trail__header">
        <div>
          <span>Suites militaires</span>
          <strong>${trailSummary.summary}</strong>
        </div>
        ${trailSummary.hiddenByFilters ? '<small>résumé replié par filtres</small>' : '<small>top 3 visibles</small>'}
      </div>
      <div class="military-outcome-trail__list">
        ${trailSummary.trails.map((trail) => `
          <button type="button" class="military-outcome-trail__item military-outcome-trail__item--${trail.tone}" data-province-id="${trail.provinceId}" data-readiness-focus="${trail.provinceId}" aria-label="Suite militaire ${trail.provinceLabel}: ${trail.label}">
            <div>
              <strong>${trail.provinceLabel}</strong>
              <code>${trail.actionCode}</code>
            </div>
            <p><b>${trail.label}</b> · ${trail.impactLabel}</p>
            <small>${trail.nextStep}</small>
          </button>
        `).join('')}
      </div>
    </section>
  `;
}

function renderMilitaryFrontMarkerSummaries(markers = state.lastMilitaryOutcomeMarkers) {
  const summaries = buildMilitaryFrontMarkerSummaries(markers);

  if (summaries.length === 0) {
    return `
      <section class="military-front-marker-summary is-empty" aria-label="Résumé compact des fronts militaires marqués">
        <div class="military-front-marker-summary__header">
          <span>Lecture fronts</span>
          <strong>Aucun marqueur militaire</strong>
        </div>
        <p>Aucune issue militaire post-commit visible ou masquée pour ce tour.</p>
      </section>
    `;
  }

  return `
    <section class="military-front-marker-summary" aria-label="Résumé compact des fronts militaires marqués">
      <div class="military-front-marker-summary__header">
        <span>Lecture fronts</span>
        <strong>${summaries.length} zone${summaries.length > 1 ? 's' : ''}</strong>
      </div>
      <div class="military-front-marker-summary__list">
        ${summaries.map((summary) => `
          <article class="military-front-marker-summary__item military-front-marker-summary__item--${summary.dominantTone} military-front-marker-summary__item--${summary.status}">
            <div>
              <strong>${summary.frontLabel}</strong>
              <small>${summary.visibleCount} visible${summary.visibleCount > 1 ? 's' : ''} · ${summary.hiddenCount} masqué${summary.hiddenCount > 1 ? 's' : ''} · ${summary.pinnedCount} épinglé${summary.pinnedCount > 1 ? 's' : ''}</small>
            </div>
            <p><b>${summary.dominantLabel}</b> · ${summary.urgentAction}</p>
            ${summary.pinnedCount > 0 ? `<em>${summary.pinSummary}</em>` : ''}
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderMilitaryOutcomeMarkerFilters(markers = state.lastMilitaryOutcomeMarkers) {
  const filters = buildMilitaryOutcomeMarkerFilterState(markers);
  const total = markers.length;
  const hiddenTotal = filters.reduce((sum, filter) => sum + filter.hiddenCount, 0);

  return `
    <section class="military-outcome-filter" aria-label="Filtres des marqueurs d’issue militaire">
      <div class="military-outcome-filter__header">
        <div>
          <span>Marqueurs militaires</span>
          <strong>${total} post-commit</strong>
        </div>
        <small>${hiddenTotal} masqué${hiddenTotal > 1 ? 's' : ''} · ${filters.reduce((sum, filter) => sum + filter.pinnedCount, 0)} épinglé${filters.reduce((sum, filter) => sum + filter.pinnedCount, 0) > 1 ? 's' : ''}</small>
      </div>
      <div class="military-outcome-filter__buttons">
        ${filters.map((filter) => `
          <button type="button" class="military-outcome-filter__button military-outcome-filter__button--${filter.tone} ${filter.enabled ? 'is-active' : 'is-muted'}" data-military-outcome-filter="${filter.tone}" aria-pressed="${filter.enabled}">
            <span>${filter.shortLabel}</span>
            <strong>${filter.count}</strong>
          </button>
        `).join('')}
      </div>
    </section>
  `;
}

function buildPostCommitMilitaryOutcomeMarker(province, shell, intrigueView = null) {
  const queuedAction = state.acceptedRecommendedMilitaryAction;

  if (!queuedAction || !province || queuedAction.provinceId !== province.provinceId) {
    return null;
  }

  const focusContext = {
    focusedProvinceId: province.provinceId,
    focusedProvince: province,
    neighborIds: new Set(province.neighborIds),
  };
  const actionQueue = buildSelectedProvinceActionQueue(province, shell, focusContext, intrigueView);
  const action = actionQueue.find((entry) => entry.actionCode === queuedAction.actionCode) ?? actionQueue[0] ?? null;
  const outcome = buildConflictOutcomePreview(province, shell);
  const projection = buildProjectedFrontStability(province, shell, actionQueue);
  const risks = buildCriticalFrontRiskWarnings(province, projection);
  const tone = action?.status === 'blocked'
    ? 'blocked'
    : outcome.tone === 'success'
      ? 'stabilized'
      : outcome.tone === 'danger'
        ? 'worsened'
        : risks.length > 0 || action?.status === 'risky'
          ? 'risk'
          : 'stabilized';
  const labels = {
    stabilized: 'Front stabilisé',
    worsened: 'Front aggravé',
    blocked: 'Action bloquée',
    risk: 'Risque de suivi',
  };
  const summaryItem = `${action?.label ?? queuedAction.actionCode}: ${outcome.title.toLowerCase()}`;
  const why = risks[0]?.detail ?? action?.mainRisk ?? projection.summary;

  return {
    provinceId: province.provinceId,
    provinceLabel: province.label,
    actionCode: queuedAction.actionCode,
    tone,
    label: labels[tone],
    summaryItem,
    changed: `${labels[tone]} après résolution: ${action?.expectedResult ?? projection.summary}`,
    why: `Référence rapport militaire: ${summaryItem}. ${why}`,
    pinReason: getMilitaryOutcomePinReason({ tone }),
    pinned: isCriticalMilitaryOutcomeMarker({ tone }),
    turn: state.turn + 1,
  };
}

function renderPostCommitMilitaryOutcomeMarker(marker) {
  if (!marker) {
    return '';
  }

  return `
    <span class="province-node__military-outcome province-node__military-outcome--${marker.tone}" aria-label="Issue militaire dernier tour: ${marker.label}">
      <b>${marker.label}</b>
      <small>${marker.actionCode}</small>
    </span>
  `;
}

function renderSelectedProvinceMilitaryOutcomeMarker(province) {
  const marker = getAnyMilitaryOutcomeMarkerForProvince(province.provinceId);

  if (!marker) {
    return '';
  }

  return `
    <section class="post-commit-military-outcome post-commit-military-outcome--${marker.tone}" aria-label="Marqueur d’issue militaire post-commit">
      <div>
        <span>Issue militaire dernier tour</span>
        <strong>${marker.label}</strong>
        <code>${marker.actionCode}</code>
      </div>
      <p>${marker.changed}</p>
      <small>${marker.why}</small>
      ${marker.pinReason ? `<em>${marker.pinReason}</em>` : isMilitaryOutcomeMarkerVisible(marker) ? '' : '<em>Marqueur masqué par le filtre de légende.</em>'}
    </section>
  `;
}

function renderProvinceSurface(shell, focusContext) {
  return `
    <svg class="province-surface-layer" viewBox="0 0 100 100" aria-label="Surface continue des provinces">
      ${shell.provinces.map((province) => {
        const isNeighbor = focusContext.neighborIds.has(province.provinceId);
        const isSelected = province.selectionState.selected;
        const isFocused = province.selectionState.focused;
        const isHovered = province.selectionState.hovered;
        const readinessTone = state.readinessFocusProvinceId === province.provinceId ? state.readinessFocusTone : null;
        const militaryOutcomeMarker = getMilitaryOutcomeMarkerForProvince(province.provinceId);
        const isReadinessHighlight = Boolean(readinessTone);
        const isMilitaryOutcomeHighlight = Boolean(militaryOutcomeMarker);
        const isMuted = !isSelected && !isFocused && !isHovered && !isNeighbor && !isReadinessHighlight && !isMilitaryOutcomeHighlight && (focusContext.selectedProvince || focusContext.focusedProvince || focusContext.hoveredProvince || state.readinessFocusProvinceId);
        return `
          <g class="province-surface ${isSelected ? 'is-selected' : ''} ${isFocused ? 'is-focused' : ''} ${isHovered ? 'is-hovered' : ''} ${isNeighbor ? 'is-neighbor' : ''} ${isReadinessHighlight ? 'is-readiness-highlight' : ''} ${isMilitaryOutcomeHighlight ? 'has-military-outcome' : ''} ${militaryOutcomeMarker ? `has-military-outcome--${militaryOutcomeMarker.tone}` : ''} ${readinessTone ? `is-readiness-${readinessTone}` : ''} ${isMuted ? 'is-muted' : ''} ${province.contested ? 'is-contested' : ''} ${province.occupied ? 'is-occupied' : ''}" style="--province-fill:${province.style.fill};--province-border:${province.style.border};">
            <polygon class="province-surface__glow" points="${province.geometry.polygon ?? getProvincePolygon(province.provinceId)}"></polygon>
            <polygon class="province-surface__core" points="${province.geometry.polygon ?? getProvincePolygon(province.provinceId)}"></polygon>
            <polygon class="province-surface__hairline" points="${province.geometry.polygon ?? getProvincePolygon(province.provinceId)}"></polygon>
          </g>
        `;
      }).join('')}
    </svg>
  `;
}

function getLogisticsOutcomeTone(status) {
  if (status === 'resolved') return 'resolved';
  if (status === 'reduced') return 'reduced';
  if (status === 'new-bottleneck') return 'new-bottleneck';
  return 'unresolved';
}

function getLogisticsOutcomeLabel(status) {
  return {
    resolved: 'Pénurie résolue',
    reduced: 'Pénurie réduite',
    unresolved: 'Pénurie restante',
    'new-bottleneck': 'Nouveau goulot',
  }[status] ?? 'Logistique à vérifier';
}

function getLogisticsOutcomeCode(status) {
  return {
    resolved: 'OK',
    reduced: '↓',
    unresolved: '!',
    'new-bottleneck': '⧉',
  }[status] ?? '?';
}

function getLogisticsOutcomeSeverityRank(status) {
  return {
    unresolved: 4,
    'new-bottleneck': 3,
    reduced: 2,
    resolved: 1,
  }[status] ?? 0;
}

function sortLogisticsOutcomeDetails(details) {
  return details.slice().sort((left, right) => getLogisticsOutcomeSeverityRank(right.status) - getLogisticsOutcomeSeverityRank(left.status) || left.routeLabel.localeCompare(right.routeLabel) || left.actionLabel.localeCompare(right.actionLabel));
}

function buildLogisticsOutcomeMarkers(shell, economyView, queuedLogisticsActions = state.queuedLogisticsActions) {
  if (!queuedLogisticsActions.length) {
    return [];
  }

  const singleMarkers = queuedLogisticsActions.map((entry) => {
    const province = shell.provinces.find((candidate) => candidate.provinceId === entry.provinceId) ?? shell.provinces.find((candidate) => {
      const cityIds = new Set(economyView.overlay.cities.filter((city) => city.regionId === candidate.provinceId).map((city) => city.cityId));
      const route = economyView.overlay.routes.find((candidateRoute) => candidateRoute.routeId === entry.routeId);
      return route?.cityIds.some((cityId) => cityIds.has(cityId));
    }) ?? null;
    const preview = province ? buildProvinceLogisticsChoicePreviewView(province, economyView) : null;
    const option = preview?.options.find((candidate) => candidate.routeId === entry.routeId) ?? null;
    const shortage = option?.recoveryChoices[0]?.downstreamShortages.find((candidate) => candidate.status !== 'résolue') ?? option?.recoveryChoices[0]?.downstreamShortages[0] ?? null;
    const bottleneck = option?.recoveryChoices[0]?.bottleneck ?? null;
    const status = entry.status === 'conflict'
      ? 'new-bottleneck'
      : shortage?.status === 'résolue'
        ? 'resolved'
        : shortage?.status === 'déplacée'
          ? 'reduced'
          : shortage?.status === 'aggravée' || bottleneck?.tone === 'high'
            ? 'new-bottleneck'
            : 'unresolved';
    const label = getLogisticsOutcomeLabel(status);
    const routeLabel = option?.routes[0] ?? entry.target ?? entry.routeId;
    const detail = shortage
      ? `${shortage.city} / ${shortage.route}: ${shortage.detail}`
      : entry.downstreamEffect ?? 'Effet aval estimé depuis la file logistique.';

    return {
      markerId: `logistics-outcome:${entry.actionId}`,
      status,
      tone: getLogisticsOutcomeTone(status),
      code: getLogisticsOutcomeCode(status),
      label,
      detail,
      details: [{ status, tone: getLogisticsOutcomeTone(status), code: getLogisticsOutcomeCode(status), label, detail, routeId: entry.routeId, routeLabel, actionLabel: entry.label }],
      provinceId: province?.provinceId ?? entry.provinceId,
      provinceLabel: province?.label ?? entry.provinceId,
      routeId: entry.routeId,
      routeLabel,
      actionLabel: entry.label,
      summaryLink: 'Synthèse pénuries restantes',
    };
  });

  const groupedByCluster = new Map();
  for (const marker of singleMarkers) {
    const clusterKey = `${marker.routeId ?? 'route-inconnue'}:${marker.provinceId ?? 'province-inconnue'}`;
    const existing = groupedByCluster.get(clusterKey) ?? { ...marker, markerId: `logistics-outcome-group:${clusterKey}`, details: [], actionLabel: '' };
    existing.details.push(...marker.details);
    existing.actionLabel = [...new Set([...existing.actionLabel.split(', ').filter(Boolean), marker.actionLabel])].join(', ');
    groupedByCluster.set(clusterKey, existing);
  }

  return Array.from(groupedByCluster.values()).map((group) => {
    const details = sortLogisticsOutcomeDetails(group.details);
    const top = details[0];
    const grouped = details.length > 1;
    return {
      ...group,
      status: top.status,
      tone: top.tone,
      code: grouped ? `${top.code}+${details.length}` : top.code,
      label: grouped ? `${top.label} · ${details.length} effets` : top.label,
      detail: top.detail,
      details,
      grouped,
      summaryLink: 'Synthèse pénuries restantes',
    };
  });
}

function isLogisticsOutcomeVisible(marker, filter = state.logisticsOutcomeSeverityFilter) {
  if (!marker) {
    return false;
  }

  if (filter === 'critical') {
    return marker.status === 'unresolved' || marker.status === 'new-bottleneck';
  }

  if (filter === 'improved') {
    return marker.status === 'reduced' || marker.status === 'resolved';
  }

  return true;
}

function getVisibleLogisticsOutcomeMarkers() {
  return state.logisticsOutcomeMarkers.filter((marker) => isLogisticsOutcomeVisible(marker));
}

function getLogisticsOutcomeMarkerForProvince(provinceId) {
  return getVisibleLogisticsOutcomeMarkers().find((marker) => marker.provinceId === provinceId) ?? null;
}

function getLogisticsOutcomeMarkerForFocusedProvince(provinceId) {
  return state.logisticsOutcomeMarkers.find((marker) => marker.provinceId === provinceId) ?? null;
}

function renderProvinceLogisticsOutcomeMarker(marker) {
  if (!marker) {
    return '';
  }

  return `
    <span class="province-node__logistics-outcome province-node__logistics-outcome--${marker.tone}" data-logistics-outcome-marker="${marker.markerId}" title="${marker.label}: ${marker.detail}">
      <b>${marker.code}</b><small>${marker.label}</small>
    </span>
  `;
}

function renderLogisticsOutcomeRouteBadge(marker, visual) {
  if (!marker) {
    return '';
  }

  const midpoint = getQuadraticPoint(visual.origin, visual.control, visual.destination, 0.58);
  return `
    <g class="economy-logistics-outcome economy-logistics-outcome--${marker.tone}" data-logistics-outcome-marker="${marker.markerId}" aria-label="${marker.label}: ${marker.detail}">
      <rect x="${midpoint.x - 8.8}" y="${midpoint.y + 3.8}" width="17.6" height="4.8" rx="2.4" />
      <text x="${midpoint.x}" y="${midpoint.y + 7.1}" text-anchor="middle">${marker.code} ${marker.routeLabel}</text>
    </g>
  `;
}

function buildLogisticsRouteDecisionSummaries(marker) {
  if (!marker) {
    return { visible: [], hidden: [], all: [] };
  }

  const byRoute = new Map();
  for (const detail of sortLogisticsOutcomeDetails(marker.details ?? [{ ...marker, routeLabel: marker.routeLabel, actionLabel: marker.actionLabel }])) {
    const key = detail.routeId ?? marker.routeId ?? detail.routeLabel ?? marker.routeLabel;
    const existing = byRoute.get(key) ?? { routeId: detail.routeId ?? marker.routeId, routeLabel: detail.routeLabel ?? marker.routeLabel, details: [], top: null };
    existing.details.push(detail);
    existing.top = existing.top ?? detail;
    byRoute.set(key, existing);
  }

  const all = Array.from(byRoute.values()).map((summary) => ({
    ...summary,
    status: summary.top.status,
    tone: summary.top.tone,
    label: summary.top.label,
    dominantShortage: summary.top.detail,
    estimatedImpact: summary.details.length > 1 ? `${summary.details.length} effets groupés, priorité au plus grave.` : summary.top.detail,
    recommendedAction: summary.top.actionLabel ?? marker.actionLabel ?? 'Action à confirmer',
    visible: isLogisticsOutcomeVisible(summary.top),
  }));

  return {
    all,
    visible: all.filter((summary) => summary.visible),
    hidden: all.filter((summary) => !summary.visible),
  };
}

function renderLogisticsOutcomeFilterControls() {
  const filters = [
    ['all', 'Toutes'],
    ['critical', 'Critiques'],
    ['improved', 'Améliorées'],
  ];

  return `
    <div class="province-logistics-outcome-filters" aria-label="Filtres de sévérité logistique">
      ${filters.map(([filter, label]) => `<button type="button" class="province-logistics-outcome-filter ${state.logisticsOutcomeSeverityFilter === filter ? 'is-active' : ''}" data-logistics-outcome-filter="${filter}">${label}</button>`).join('')}
    </div>
  `;
}

function renderLogisticsRouteDecisionList(summaries, stateLabel) {
  if (summaries.length === 0) {
    return `<p class="province-logistics-route-decisions__empty">Aucune route ${stateLabel} pour ce filtre.</p>`;
  }

  return `
    <ol>
      ${summaries.map((summary) => `
        <li class="province-logistics-route-decision province-logistics-route-decision--${summary.tone} ${state.selectedLogisticsOutcomeRouteId === summary.routeId ? 'is-selected' : ''}">
          <button type="button" data-logistics-route-summary="${summary.routeId ?? ''}" data-logistics-route-label="${summary.routeLabel}">
            <strong>${summary.routeLabel}</strong>
            <span>${summary.label}: ${summary.dominantShortage}</span>
            <small>Impact estimé: ${summary.estimatedImpact}</small>
            <small>Action conseillée: ${summary.recommendedAction}</small>
          </button>
        </li>
      `).join('')}
    </ol>
  `;
}

function renderFocusedLogisticsOutcomeGroup(province) {
  const marker = getLogisticsOutcomeMarkerForFocusedProvince(province.provinceId);

  if (!marker) {
    return `
      <section class="province-logistics-outcome-group province-logistics-outcome-group--empty" aria-label="Détails groupés des marqueurs logistiques post-commit">
        <div class="province-logistics-outcome-group__header">
          <span>Résultat logistique groupé</span>
          <strong>Aucun problème logistique post-commit</strong>
          <small>Routes visibles: 0 · routes masquées: 0</small>
        </div>
        ${renderLogisticsOutcomeFilterControls()}
      </section>
    `;
  }

  const details = sortLogisticsOutcomeDetails(marker.details ?? [{ ...marker, routeLabel: marker.routeLabel, actionLabel: marker.actionLabel }]);
  const routeSummaries = buildLogisticsRouteDecisionSummaries(marker);

  return `
    <section class="province-logistics-outcome-group province-logistics-outcome-group--${marker.tone}" aria-label="Détails groupés des marqueurs logistiques post-commit">
      <div class="province-logistics-outcome-group__header">
        <span>Résultat logistique groupé</span>
        <strong>${marker.label}</strong>
        <small>${marker.routeLabel} · ${details.length} détail${details.length > 1 ? 's' : ''} trié${details.length > 1 ? 's' : ''} par gravité · routes visibles ${routeSummaries.visible.length}, masquées ${routeSummaries.hidden.length}</small>
      </div>
      ${renderLogisticsOutcomeFilterControls()}
      <div class="province-logistics-route-decisions" aria-label="Résumé décisionnel des routes logistiques">
        <h4>Routes visibles</h4>
        ${renderLogisticsRouteDecisionList(routeSummaries.visible, 'visible')}
        <h4>Routes masquées par filtre</h4>
        ${renderLogisticsRouteDecisionList(routeSummaries.hidden, 'masquée')}
      </div>
    </section>
  `;
}


function buildProvinceWarOverlayOverflowSummary(province, overlays = {}, displayLimit = 2) {
  const warOverlays = [
    province.contested ? { kind: 'front', label: 'Front actif' } : null,
    overlays.readinessTone ? { kind: 'front', label: 'Alerte préparation' } : null,
    overlays.militaryOutcomeMarker ? { kind: 'front', label: overlays.militaryOutcomeMarker.label } : null,
    overlays.logisticsOutcomeMarker ? { kind: 'supply', label: overlays.logisticsOutcomeMarker.label } : null,
    ['collapsed', 'disrupted', 'strained'].includes(province.supplyLevel) ? { kind: 'supply', label: `Ravitaillement ${province.supplyTone}` } : null,
  ].filter(Boolean);
  const hidden = warOverlays.slice(displayLimit);

  if (hidden.length === 0) {
    return null;
  }

  const frontCount = hidden.filter((entry) => entry.kind === 'front').length;
  const supplyCount = hidden.filter((entry) => entry.kind === 'supply').length;
  const parts = [
    frontCount > 0 ? `${frontCount} front${frontCount > 1 ? 's' : ''}` : null,
    supplyCount > 0 ? `${supplyCount} alerte${supplyCount > 1 ? 's' : ''} ravitaillement` : null,
  ].filter(Boolean);

  if (parts.length === 0) {
    return null;
  }

  return {
    hiddenCount: hidden.length,
    frontCount,
    supplyCount,
    label: parts.join(' / '),
    detail: `${hidden.length} signal${hidden.length > 1 ? 'aux' : ''} militaire${hidden.length > 1 ? 's' : ''} masqué${hidden.length > 1 ? 's' : ''} par la carte compacte.`,
  };
}

function renderProvinceWarOverlayOverflowSummary(summary) {
  if (!summary) {
    return '';
  }

  return `
    <span class="province-node__war-overflow" aria-label="Résumé des signaux militaires masqués: ${summary.detail}">
      <b>${summary.label}</b>
      <small>${summary.detail}</small>
    </span>
  `;
}

function renderProvinceCard(province, focusContext, postCommitClimateMarkers = [], selectedClimateCascadeGroup = null, worldClimateLayer = null) {
  const layout = province.geometry.layout ?? getProvinceLayout(province.provinceId);
  const badges = province.badges.map((badge) => `<span class="province-badge">${badge}</span>`).join('');
  const isNeighbor = focusContext.neighborIds.has(province.provinceId);
  const isSelected = province.selectionState.selected;
  const isFocused = province.selectionState.focused;
  const isHovered = province.selectionState.hovered;
  const readinessTone = state.readinessFocusProvinceId === province.provinceId ? state.readinessFocusTone : null;
  const economyBlocker = state.economyReadinessFocus?.provinceId === province.provinceId ? state.economyReadinessFocus : null;
  const militaryOutcomeMarker = getMilitaryOutcomeMarkerForProvince(province.provinceId);
  const logisticsOutcomeMarker = getLogisticsOutcomeMarkerForProvince(province.provinceId);
  const climateMarker = postCommitClimateMarkers.find((marker) => marker.provinceId === province.provinceId) ?? null;
  const climateCascadeGroupMarker = selectedClimateCascadeGroup?.markers.find((marker) => marker.provinceId === province.provinceId) ?? null;
  const worldClimateEntry = worldClimateLayer?.entries.find((entry) => entry.provinceId === province.provinceId) ?? null;
  const warOverlayOverflow = buildProvinceWarOverlayOverflowSummary(province, { readinessTone, militaryOutcomeMarker, logisticsOutcomeMarker });
  const isReadinessHighlight = Boolean(readinessTone);
  const isMilitaryOutcomeHighlight = Boolean(militaryOutcomeMarker);
  const isLogisticsOutcomeHighlight = Boolean(logisticsOutcomeMarker);
  const isClimateOutcomeHighlight = Boolean(climateMarker);
  const isClimateCascadeGroupHighlight = Boolean(climateCascadeGroupMarker);
  const isWorldClimateHighlight = Boolean(worldClimateEntry && state.activeOverlaySlot === 'climate-overlay');
  const isMuted = !isSelected && !isFocused && !isHovered && !isNeighbor && !isReadinessHighlight && !isMilitaryOutcomeHighlight && !isLogisticsOutcomeHighlight && !isClimateOutcomeHighlight && !isClimateCascadeGroupHighlight && !isWorldClimateHighlight && (focusContext.selectedProvince || focusContext.focusedProvince || focusContext.hoveredProvince || state.readinessFocusProvinceId);
  const tacticalState = province.contested ? 'front contesté' : province.occupied ? 'occupation' : 'contrôle stable';
  const readinessLabel = readinessTone === 'danger' ? 'menace immédiate' : readinessTone === 'warning' ? 'préparation insuffisante' : readinessTone === 'ready' ? 'opportunité tactique' : null;
  const economyBlockerLabel = economyBlocker ? `${economyBlocker.blocker}: ${economyBlocker.summary}` : null;
  const selectionSignal = climateMarker ? 'CLIMAT' : climateCascadeGroupMarker ? 'GROUPE' : worldClimateEntry ? 'SAISON' : economyBlocker ? 'BLOCAGE' : isMilitaryOutcomeHighlight ? 'RÉSOLU' : isReadinessHighlight ? 'ALERTE' : isSelected ? 'ACTIF' : isHovered ? 'SURVOL' : isFocused ? 'FOCUS' : isNeighbor ? 'VOISIN' : 'SCAN';
  const classes = [
    'province-node',
    isSelected ? 'is-selected' : '',
    isFocused ? 'is-focused' : '',
    isHovered ? 'is-hovered' : '',
    isNeighbor ? 'is-neighbor' : '',
    isReadinessHighlight ? 'is-readiness-highlight' : '',
    economyBlocker ? 'has-economy-blocker' : '',
    economyBlocker ? `has-economy-blocker--${economyBlocker.tone}` : '',
    isMilitaryOutcomeHighlight ? 'has-military-outcome' : '',
    militaryOutcomeMarker ? `has-military-outcome--${militaryOutcomeMarker.tone}` : '',
    logisticsOutcomeMarker ? 'has-logistics-outcome' : '',
    logisticsOutcomeMarker ? `has-logistics-outcome--${logisticsOutcomeMarker.tone}` : '',
    climateMarker ? 'has-climate-post-commit' : '',
    climateMarker ? `has-climate-post-commit--${climateMarker.status}` : '',
    climateCascadeGroupMarker ? 'has-climate-cascade-group' : '',
    climateCascadeGroupMarker?.provinceId === selectedClimateCascadeGroup?.primaryProvinceId ? 'is-climate-cascade-group-primary' : '',
    isWorldClimateHighlight ? 'has-world-climate' : '',
    isWorldClimateHighlight ? `has-world-climate--${worldClimateEntry.tone}` : '',
    isWorldClimateHighlight ? `has-world-biome--${worldClimateEntry.biome}` : '',
    readinessTone ? `is-readiness-${readinessTone}` : '',
    isMuted ? 'is-muted' : '',
    province.contested ? 'is-contested' : '',
    province.occupied ? 'is-occupied' : '',
  ].filter(Boolean).join(' ');

  return `
    <button
      class="${classes}"
      type="button"
      data-province-id="${province.provinceId}"
      data-tactical-state="${readinessLabel ?? tacticalState}"
      data-readiness-highlight="${readinessTone ?? ''}"
      data-economy-blocker="${economyBlockerLabel ?? ''}"
      data-military-outcome="${militaryOutcomeMarker?.label ?? ''}"
      data-logistics-outcome="${logisticsOutcomeMarker?.label ?? ''}"
      data-climate-outcome="${climateMarker?.label ?? climateCascadeGroupMarker?.label ?? worldClimateEntry?.label ?? ''}"
      data-world-climate="${worldClimateEntry ? `${worldClimateEntry.biome}:${worldClimateEntry.tone}` : ''}"
      title="${climateMarker ? `${climateMarker.label} — ${climateMarker.summary}` : climateCascadeGroupMarker ? `${selectedClimateCascadeGroup.label}: ${climateCascadeGroupMarker.summary}` : worldClimateEntry ? `${worldClimateEntry.label}: ${worldClimateEntry.summary}` : logisticsOutcomeMarker ? `${logisticsOutcomeMarker.label}: ${logisticsOutcomeMarker.detail}` : economyBlocker ? `${economyBlocker.summary} — ${economyBlocker.effect}` : militaryOutcomeMarker ? `${militaryOutcomeMarker.label} — ${militaryOutcomeMarker.changed}` : province.label}"
      style="left:${layout.x}%;top:${layout.y}%;width:${layout.w}%;height:${layout.h}%;--province-fill:${province.style.fill};--province-border:${province.style.border};--province-shape:${getProvinceShape(province.provinceId)};"
      aria-pressed="${province.selectionState.selected}"
      aria-label="${province.label}, ${climateMarker ? `marqueur climat post-résolution: ${climateMarker.label}, ${climateMarker.summary}` : logisticsOutcomeMarker ? `résultat logistique post-commit: ${logisticsOutcomeMarker.label}, ${logisticsOutcomeMarker.detail}` : economyBlocker ? `blocage économie/logistique: ${economyBlocker.summary}, ${economyBlocker.effect}` : militaryOutcomeMarker ? `issue militaire post-commit: ${militaryOutcomeMarker.label}, ${militaryOutcomeMarker.changed}` : readinessLabel ? `cible préparation conflit: ${readinessLabel}` : tacticalState}, approvisionnement ${province.supplyTone}, loyauté ${province.loyalty}"
    >
      <span class="province-node__terrain"></span>
      <span class="province-node__focus-rail"></span>
      <span class="province-node__signal">${selectionSignal}</span>
      <span class="province-node__name">${province.label}</span>
      <span class="province-node__meta">${province.supplyTone} · loyauté ${province.loyalty}</span>
      ${economyBlocker ? `<span class="province-node__economy-blocker"><b>${economyBlocker.blocker}</b>${economyBlocker.summary}<small>${economyBlocker.effect}</small></span>` : ''}
      ${renderProvinceLogisticsOutcomeMarker(logisticsOutcomeMarker)}
      ${climateMarker ? `<span class="province-node__climate-marker"><b>${climateMarker.label}</b>${climateMarker.summary}<small>${climateMarker.detail}</small></span>` : ''}
      ${isWorldClimateHighlight ? `<span class="province-node__world-climate"><b>${worldClimateEntry.label}</b>${worldClimateEntry.summary}<small>${worldClimateEntry.detail}</small></span>` : ''}
      <span class="province-node__badges">${badges}</span>
      ${renderPostCommitMilitaryOutcomeMarker(militaryOutcomeMarker)}
      ${renderProvinceWarOverlayOverflowSummary(warOverlayOverflow)}
      ${isNeighbor ? '<span class="province-node__link">Voisine directe</span>' : ''}
    </button>
  `;
}

function renderOverlaySlots(shell) {
  return shell.overlays.slots.map((slot) => {
    const active = slot.slotId === state.activeOverlaySlot;
    return `
      <button class="overlay-tab ${active ? 'is-active' : ''}" type="button" data-overlay-slot="${slot.slotId}">
        <span>${overlayLabels[slot.slotId] ?? slot.label}</span>
        <small>${active ? 'visible' : 'masqué'}</small>
      </button>
    `;
  }).join('');
}

function getIntrigueRecommendationTone(criticality) {
  if (criticality === 'critical') {
    return 'danger';
  }

  if (criticality === 'elevated') {
    return 'warning';
  }

  return 'info';
}

function compareIntrigueRecommendationSignals(left, right) {
  const priority = { critical: 3, elevated: 2, watch: 1 };
  const leftDrillDown = left.drillDown ?? {};
  const rightDrillDown = right.drillDown ?? {};

  if ((priority[rightDrillDown.criticality] ?? 0) !== (priority[leftDrillDown.criticality] ?? 0)) {
    return (priority[rightDrillDown.criticality] ?? 0) - (priority[leftDrillDown.criticality] ?? 0);
  }

  if (right.sabotageRiskScore !== left.sabotageRiskScore) {
    return right.sabotageRiskScore - left.sabotageRiskScore;
  }

  if (right.metrics.exposedCellCount !== left.metrics.exposedCellCount) {
    return right.metrics.exposedCellCount - left.metrics.exposedCellCount;
  }

  return left.locationId.localeCompare(right.locationId);
}

function buildIntrigueProvinceRecommendation(province, intrigueView) {
  const entries = intrigueView?.map?.entries ?? [];
  const localEntry = entries.find((entry) => entry.locationId === province.provinceId) ?? null;
  const fallbackEntry = entries.slice().sort(compareIntrigueRecommendationSignals)[0] ?? null;
  const entry = localEntry ?? fallbackEntry;

  if (!entry?.drillDown) {
    return {
      tone: 'neutral',
      title: 'Aucun signal intrigue local',
      body: 'Aucun hotspot prioritaire sur cette province: garder le suivi sans encombrer la carte.',
    };
  }

  const drillDown = entry.drillDown;
  const primaryHint = drillDown.actionHints?.[0] ?? { label: 'Surveiller', description: drillDown.actionHint };
  const localPrefix = localEntry ? 'Signal local' : `Signal prioritaire ailleurs (${drillDown.locationName})`;

  return {
    tone: getIntrigueRecommendationTone(drillDown.criticality),
    title: `${localPrefix}: ${primaryHint.label}`,
    body: `${drillDown.riskBand} · ${drillDown.summary}. ${primaryHint.description}`,
  };
}

function buildProvinceActionRecommendations(province, focusContext, intrigueView = null) {
  const recommendations = [];
  const neighborCount = focusContext.neighborIds.size;
  const linkedCity = cities.find((city) => city.regionId === province.provinceId) ?? null;

  if (province.contested) {
    recommendations.push({
      tone: 'danger',
      title: 'Renforcer le front',
      body: 'Prioriser garnison, ravitaillement et reconnaissance avant la prochaine poussée.',
    });
  } else if (province.occupied) {
    recommendations.push({
      tone: 'warning',
      title: 'Stabiliser l’occupation',
      body: 'Comparer contrôle et propriétaire avant de déplacer des forces voisines.',
    });
  } else {
    recommendations.push({
      tone: 'ready',
      title: 'Préparer la manœuvre',
      body: neighborCount > 0 ? `Scanner ${neighborCount} province${neighborCount > 1 ? 's' : ''} voisine${neighborCount > 1 ? 's' : ''} avant l’ordre.` : 'Aucun voisin direct: garder la province en réserve.',
    });
  }

  recommendations.push(buildIntrigueProvinceRecommendation(province, intrigueView));

  if (['disrupted', 'collapsed'].includes(province.supplyLevel)) {
    recommendations.push({
      tone: 'warning',
      title: 'Inspecter les routes',
      body: 'Ouvrir la couche économie pour repérer les convois et points de rupture.',
    });
  } else if (province.loyalty < 50) {
    recommendations.push({
      tone: 'warning',
      title: 'Surveiller l’agitation',
      body: 'Croiser avec intrigue/culture avant d’engager une action longue.',
    });
  } else if (linkedCity) {
    recommendations.push({
      tone: 'info',
      title: 'Contrôler le hub local',
      body: `Vérifier ${linkedCity.name} pour stocks, stabilité et relais logistiques.`,
    });
  }

  recommendations.push({
    tone: province.strategicValue >= 6 ? 'info' : 'neutral',
    title: province.strategicValue >= 6 ? 'Comparer le risque climat' : 'Garder en observation',
    body: province.strategicValue >= 6
      ? 'Comparer l’impact climat avant de verrouiller une décision coûteuse.'
      : 'Conserver comme point d’appui et réévaluer après le prochain tour.',
  });

  return recommendations.slice(0, 3);
}

function getSelectedCultureContext(regionId = state.selectedProvinceId) {
  const cultureView = getCultureViewModel();
  const selectedMarker = cultureView.overlay.find((entry) => entry.regionId === regionId) ?? null;
  const selectedCluster = buildCultureClusterSummaries(cultureView.overlay)
    .find((cluster) => cluster.regionIds.includes(regionId)) ?? null;
  const localTimeline = buildCultureLocalTimeline({
    selectedRegionId: regionId,
    selectedMarker,
    selectedCluster,
  });
  const consequenceChips = buildCultureConsequenceChips({
    province: { provinceId: regionId },
    action: { title: state.lastTurnSummary },
    selectedMarker,
    selectedCluster,
    localTimeline,
  });

  return {
    cultureView,
    selectedMarker,
    selectedCluster,
    localTimeline,
    consequenceChips,
  };
}

function renderCultureTurnReport(report) {
  return `
    <div class="culture-turn-report culture-turn-report--${report.state}" aria-label="Deltas culturels du tour">
      <strong>${report.summary}</strong>
      ${report.deltas.length > 0 ? `
        <ul>
          ${report.deltas.map((delta) => `
            <li class="culture-turn-report__delta culture-turn-report__delta--${delta.tone}">
              <span>${delta.label}</span>
              <b>${delta.value}</b>
              <small>${delta.cultureName} · ${delta.regionId} · ${delta.reason}</small>
            </li>
          `).join('')}
        </ul>
      ` : '<span>Culture stable: aucun événement, découverte ou tension nouvelle à remonter.</span>'}
    </div>
  `;
}

function renderCultureUnlockHints(hints) {
  return `
    <div class="culture-unlock-hints" aria-label="Unlocks culture potentiels">
      ${hints.map((hint) => `
        <span class="culture-unlock-hint culture-unlock-hint--${hint.status} culture-unlock-hint--${hint.tone} culture-unlock-hint--urgency-${hint.urgency?.level ?? 'stable'}" title="${hint.explanation} ${hint.urgency?.detail ?? ''}">
          <b>${hint.status}</b>
          <small>${hint.label} · ${hint.cultureName}</small>
          <em>${hint.urgency?.label ?? 'Fenêtre stable'} · ${hint.urgency?.window ?? 'stable'}</em>
          <small>${hint.urgency?.reason ?? hint.urgency?.detail ?? hint.explanation}</small>
        </span>
      `).join('')}
    </div>
  `;
}

function buildCultureUnlockHintsForActions(province, actions, cultureContext) {
  return actions.map((action) => ({
    action,
    hints: buildCultureUnlockHints({
      province,
      action: { title: action.title, label: action.label },
      selectedMarker: cultureContext.selectedMarker,
      selectedCluster: cultureContext.selectedCluster,
      localTimeline: cultureContext.localTimeline,
    }),
  }));
}

function renderCultureOpportunityReminders(report) {
  return `
    <section class="culture-opportunity-reminders culture-opportunity-reminders--${report.state}" aria-label="Rappels culturels de fin de tour">
      <div class="culture-opportunity-reminders__header">
        <div>
          <span>Rappels culture fin de tour</span>
          <strong>${report.provinceLabel}</strong>
        </div>
        <small>${report.reminders.length} signal${report.reminders.length > 1 ? 's' : ''}</small>
      </div>
      <p>${report.summary}</p>
      ${report.queuedCultureAction ? `
        <div class="culture-opportunity-queued-action" aria-label="Action culturelle en file">
          <span>Action culturelle en file</span>
          <strong>${report.queuedCultureAction.label}</strong>
          <small>${report.queuedCultureAction.effect}</small>
          <small>Pourquoi: ${report.queuedCultureAction.reason}</small>
          <button type="button" data-culture-undo-action="${report.queuedCultureAction.undoAction.code}" data-culture-undo-index="${report.queuedCultureAction.queueIndex}" aria-label="${report.queuedCultureAction.undoAction.summary}">
            ${report.queuedCultureAction.undoAction.label}
          </button>
        </div>
      ` : ''}
      ${report.resolutionSummary ? `
        <div class="culture-opportunity-resolution culture-opportunity-resolution--${report.resolutionSummary.state}" aria-label="Résumé de résolution culturelle">
          <div class="culture-opportunity-resolution__header">
            <span>Après validation</span>
            <strong>${report.resolutionSummary.summary}</strong>
          </div>
          ${(report.resolutionSummary.queuedActions ?? []).length > 0 ? `
            <ul>
              ${report.resolutionSummary.queuedActions.map((action) => `
                <li class="culture-opportunity-resolution__item culture-opportunity-resolution__item--${action.tone}">
                  <b>${action.cultureName}</b>
                  <span>${action.label} · ${action.outcome}</span>
                  <small>${action.effect} · ${action.reason}</small>
                </li>
              `).join('')}
            </ul>
          ` : ''}
          ${(report.resolutionSummary.uncoveredUrgent ?? []).length > 0 ? `
            <div class="culture-opportunity-resolution__uncovered" aria-label="Recommandations culturelles urgentes non couvertes">
              <b>Urgences non couvertes</b>
              ${(report.resolutionSummary.uncoveredUrgent ?? []).map((entry) => `
                <small>${entry.cultureName}: ${entry.expectedImpact}</small>
              `).join('')}
            </div>
          ` : ''}
        </div>
      ` : ''}
      ${(report.priorityConflicts ?? []).length > 0 ? `
        <div class="culture-opportunity-priority-conflicts" aria-label="Conflits de priorité culturelle">
          ${(report.priorityConflicts ?? []).map((conflict) => `
            <article class="culture-opportunity-priority-conflict culture-opportunity-priority-conflict--${conflict.level}">
              <span>${conflict.label}</span>
              <strong>${conflict.recommendation}</strong>
              <small>${conflict.summary}</small>
            </article>
          `).join('')}
        </div>
      ` : ''}
      ${report.reminders.length > 0 ? `
        <div class="culture-opportunity-reminder-list">
          ${report.reminders.map((reminder) => `
            <article class="culture-opportunity-reminder culture-opportunity-reminder--${reminder.tone}">
              <span>${reminder.label}</span>
              <strong>${reminder.cultureName}</strong>
              <em class="culture-opportunity-reminder__urgency culture-opportunity-reminder__urgency--${reminder.urgency?.level ?? 'stable'}">${reminder.urgencyCopy ?? 'Fenêtre stable · stable'}</em>
              <small class="culture-opportunity-reminder__reason">${reminder.reasonCopy ?? reminder.urgency?.detail ?? reminder.summary}</small>
              <p>${reminder.summary}</p>
              <p class="culture-opportunity-reminder__action"><b>${reminder.recommendedAction?.label ?? 'Surveiller la fenêtre'}</b> · ${reminder.recommendedAction?.summary ?? reminder.actionCopy ?? reminder.summary}</p>
              <p class="culture-opportunity-reminder__tradeoff"><b>Compromis</b> · ${reminder.tradeoff?.summary ?? reminder.tradeoffCopy ?? 'Bénéfice culturel contre risque narratif.'}</p>
              <p class="culture-opportunity-reminder__confidence culture-opportunity-reminder__confidence--${reminder.confidenceCue?.level ?? 'mixed'}"><b>${reminder.confidenceCue?.label ?? 'Confiance mixte'}</b> · ${reminder.confidenceCue?.summary ?? reminder.confidenceCopy ?? 'Effet culturel à confirmer.'}</p>
              <p class="culture-opportunity-reminder__inaction culture-opportunity-reminder__inaction--${reminder.inactionCost?.level ?? 'low'}"><b>Inaction</b> · ${reminder.inactionCost?.summary ?? reminder.inactionCopy ?? 'Pas de perte culturelle claire si la recommandation attend.'}</p>
              ${reminder.stabilityPreview ? `
                <div class="culture-opportunity-reminder__stability-preview culture-opportunity-reminder__stability-preview--${reminder.stabilityPreview.level}" aria-label="Aperçu de stabilité culturelle">
                  <b>Aperçu stabilité</b>
                  <span>${reminder.stabilityPreview.stabilityDelta} · ${reminder.stabilityPreview.urgencyDelta} · ${reminder.stabilityPreview.dissentDelta}</span>
                  <small>${reminder.stabilityPreview.conflictImpact}</small>
                </div>
              ` : ''}
              <div class="culture-opportunity-reminder__ripples" aria-label="Effets de propagation culturelle">
                <b>Propagation</b>
                ${(reminder.rippleEffects ?? []).length > 0 ? `
                  <ul>
                    ${reminder.rippleEffects.slice(0, 3).map((effect) => `
                      <li class="culture-opportunity-reminder__ripple culture-opportunity-reminder__ripple--${effect.tone}">
                        <span>${effect.targetLabel}</span>
                        <small>${effect.cultureName} · ${effect.summary}</small>
                      </li>
                    `).join('')}
                  </ul>
                ` : '<small>Aucun effet de propagation culturel en file.</small>'}
              </div>
              ${reminder.queueConfirmation ? `
                <div class="culture-opportunity-reminder__queue-confirmation" aria-label="Confirmation d’action culturelle en file">
                  <b>En file</b>
                  <small>${reminder.queueConfirmation.effect}</small>
                  <small>Raison: ${reminder.queueConfirmation.reason}</small>
                  <button type="button" data-culture-undo-action="${reminder.queueConfirmation.undoAction.code}" data-culture-undo-index="${reminder.queueConfirmation.queueIndex}" aria-label="${reminder.queueConfirmation.undoAction.summary}">
                    ${reminder.queueConfirmation.undoAction.label}
                  </button>
                </div>
              ` : ''}
              ${reminder.queueAction ? `
                <div class="culture-opportunity-reminder__queue-action" aria-label="Action culturelle à mettre en file">
                  <b>${reminder.queueAction.label}</b>
                  <small>${reminder.queueAction.effect} · ${reminder.queueAction.confidence} (${reminder.queueAction.dissent}) · Horizon ${reminder.queueAction.horizon}</small>
                  <small>Coût d’opportunité: ${reminder.queueAction.opportunityCost}</small>
                  <button type="button" data-culture-queue-action="${reminder.queueAction.code}" data-culture-queue-region="${reminder.provinceId}" data-culture-queue-label="${reminder.queueAction.label}" data-culture-queue-summary="${reminder.queueAction.summary}" aria-label="Mettre en file ${reminder.queueAction.label}: ${reminder.queueAction.summary}">
                    Mettre en file
                  </button>
                </div>
              ` : '<small class="culture-opportunity-reminder__queue-empty">Aucune action culturelle pertinente à mettre en file.</small>'}
              <button type="button" data-culture-focus-region="${reminder.focusTarget.regionId}" data-culture-focus-type="${reminder.focusTarget.type}" data-culture-focus-id="${reminder.focusTarget.id}" aria-label="Voir ${reminder.focusCopy}: ${reminder.urgency?.detail ?? reminder.summary}">
                Voir ${reminder.focusCopy}
              </button>
            </article>
          `).join('')}
        </div>
      ` : ''}
    </section>
  `;
}

function renderCultureConsequenceChips(chips) {
  return `
    <div class="culture-consequence-chips" aria-label="Conséquences culturelles">
      ${chips.map((chip) => `
        <span class="culture-consequence-chip culture-consequence-chip--${chip.tone}" title="${chip.explanation}">
          <b>${chip.label}</b>
          <small>${chip.cultureName} · ${chip.regionId} · S${chip.severity}</small>
        </span>
      `).join('')}
    </div>
  `;
}

function renderProvinceActionRecommendations(province, focusContext, intrigueView = null) {
  const recommendations = buildProvinceActionRecommendations(province, focusContext, intrigueView);
  const { selectedMarker, selectedCluster, localTimeline } = getSelectedCultureContext(province.provinceId);

  return `
    <div class="province-action-recommendations" aria-label="Actions recommandées pour la province sélectionnée">
      <div class="province-action-recommendations__header">
        <strong>Actions recommandées</strong>
        <span>${province.selectionState.selected ? 'sélection active' : 'focus tactique'}</span>
      </div>
      <div class="province-action-list">
        ${recommendations.map((recommendation) => {
          const cultureChips = buildCultureConsequenceChips({
            province,
            action: recommendation,
            selectedMarker,
            selectedCluster,
            localTimeline,
          });
          const unlockHints = buildCultureUnlockHints({
            province,
            action: recommendation,
            selectedMarker,
            selectedCluster,
            localTimeline,
          });

          return `
            <article class="province-action-card province-action-card--${recommendation.tone}">
              <strong>${recommendation.title}</strong>
              <p>${recommendation.body}</p>
              ${renderCultureUnlockHints(unlockHints)}
              ${renderCultureConsequenceChips(cultureChips)}
            </article>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function getProvinceEconomyConsequences(province, economyView) {
  if (!province || !economyView) {
    return [];
  }

  const tensionByCityId = Object.fromEntries(economyView.comparison.rows.map((row) => [row.cityId, row]));
  const cityNameById = Object.fromEntries(economyView.overlay.cities.map((city) => [city.cityId, city.cityName]));
  const provinceCities = economyView.overlay.cities.filter((city) => city.regionId === province.provinceId);
  const provinceCityIds = new Set(provinceCities.map((city) => city.cityId));
  const connectedRoutes = economyView.overlay.routes.filter((route) => route.cityIds.some((cityId) => provinceCityIds.has(cityId)));
  const routeStress = connectedRoutes
    .map((route) => ({ route, stress: getRouteStressSummary(route, tensionByCityId, cityNameById) }))
    .sort((left, right) => {
      const toneRank = { high: 3, medium: 2, low: 1 };
      return (toneRank[right.stress.tone] ?? 0) - (toneRank[left.stress.tone] ?? 0)
        || right.route.riskLevel - left.route.riskLevel
        || right.route.totalCapacity - left.route.totalCapacity;
    });
  const highTensionCity = provinceCities.find((city) => tensionByCityId[city.cityId]?.tensionLevel === 'high');
  const lowStockCity = provinceCities.slice().sort((left, right) => left.resources.totalStock - right.resources.totalStock)[0] ?? null;
  const consequences = [];

  if (routeStress[0]) {
    consequences.push({
      tone: routeStress[0].stress.tone,
      label: routeStress[0].stress.headline,
      text: `${routeStress[0].route.routeName}: ${routeStress[0].stress.summary}`,
    });
  }

  if (highTensionCity) {
    consequences.push({
      tone: 'high',
      label: 'Stock critique',
      text: `${highTensionCity.cityName}: pénurie probable, sécuriser ressources ou convoi prioritaire.`,
    });
  } else if (lowStockCity) {
    consequences.push({
      tone: 'medium',
      label: 'Ressources à suivre',
      text: `${lowStockCity.cityName}: ${lowStockCity.resources.totalStock} unités en stock, vérifier le prochain flux.`,
    });
  }

  if (connectedRoutes.length === 0 && provinceCities.length > 0) {
    consequences.push({
      tone: 'medium',
      label: 'Hub isolé',
      text: `${provinceCities[0].cityName}: aucune route active visible, risque de décrochage logistique.`,
    });
  }

  return consequences.slice(0, 3);
}

function renderProvinceEconomyConsequences(province, economyView) {
  const consequences = getProvinceEconomyConsequences(province, economyView);

  if (consequences.length === 0) {
    return '';
  }

  return `
    <section class="province-economy-recommendations" aria-label="Conséquences économiques recommandées">
      <div class="province-economy-recommendations__header">
        <strong>Conséquences économie</strong>
        <span>routes · ressources · logistique</span>
      </div>
      ${consequences.map((consequence) => `
        <article class="province-economy-recommendation province-economy-recommendation--${consequence.tone}">
          <b>${consequence.label}</b>
          <p>${consequence.text}</p>
        </article>
      `).join('')}
    </section>
  `;
}

function buildProvinceLogisticsBottleneckComparison(province, economyView) {
  if (!province || !economyView) {
    return [];
  }

  const tensionByCityId = Object.fromEntries(economyView.comparison.rows.map((row) => [row.cityId, row]));
  const cityNameById = Object.fromEntries(economyView.overlay.cities.map((city) => [city.cityId, city.cityName]));
  const provinceCities = economyView.overlay.cities.filter((city) => city.regionId === province.provinceId);
  const provinceCityIds = new Set(provinceCities.map((city) => city.cityId));
  const toneRank = { high: 3, medium: 2, low: 1 };

  return economyView.overlay.routes
    .filter((route) => route.cityIds.some((cityId) => provinceCityIds.has(cityId)))
    .map((route) => {
      const stress = getRouteStressSummary(route, tensionByCityId, cityNameById);
      const localCityId = route.cityIds.find((cityId) => provinceCityIds.has(cityId)) ?? route.originCityId;
      const otherCityId = route.cityIds.find((cityId) => !provinceCityIds.has(cityId)) ?? route.destinationCityId;
      const localTension = tensionByCityId[localCityId]?.tensionLevel ?? 'low';
      const mainResource = route.resources.slice().sort((left, right) => right.capacity - left.capacity || left.resourceId.localeCompare(right.resourceId))[0] ?? null;
      const resourceLabel = mainResource ? `${getResourceHud(mainResource.resourceId).label} ${mainResource.capacity}` : 'capacité réservée';
      const leverage = stress.tone === 'high'
        ? 'Priorité: sécuriser ce flux avant action province.'
        : stress.tone === 'medium'
          ? 'Levier utile: renforcer si action coûteuse.'
          : 'Levier secondaire: garder en observation.';

      return {
        routeId: route.routeId,
        routeName: route.routeName,
        tone: stress.tone,
        headline: stress.headline,
        capacity: route.totalCapacity,
        tension: localTension,
        resourceLabel,
        impactedCity: cityNameById[localCityId] ?? cityNameById[otherCityId] ?? route.destinationCityId,
        consequence: stress.summary,
        leverage,
        downstreamImpact: stress.tone === 'high'
          ? `${cityNameById[otherCityId] ?? route.destinationCityId}: pénurie aval probable si le flux reste bloqué.`
          : stress.tone === 'medium'
            ? `${cityNameById[otherCityId] ?? route.destinationCityId}: marge réduite, impact aval à contenir.`
            : `${cityNameById[otherCityId] ?? route.destinationCityId}: impact aval limité pour l'instant.`,
        recoveryAction: !route.active
          ? 'Réouvrir ou détourner la route'
          : localTension === 'high'
            ? 'Prioriser convoi et stock local'
            : route.riskLevel >= 70
              ? 'Escorter le flux critique'
              : route.totalCapacity >= 9
                ? 'Délester vers une route parallèle'
                : 'Surveiller avant engagement',
        score: (toneRank[stress.tone] ?? 0) * 100 + route.riskLevel + route.totalCapacity,
      };
    })
    .sort((left, right) => right.score - left.score || left.routeName.localeCompare(right.routeName))
    .slice(0, 3);
}

function buildProvinceLogisticsInterventionTradeoff(entry, sharedCity, sharedResource) {
  const improves = entry.tone === 'high'
    ? `améliore ${entry.impactedCity} et réduit le risque aval immédiat`
    : `améliore la marge de ${entry.impactedCity}`;
  const delays = sharedResource
    ? `retarde les routes concurrentes sur ${entry.resourceLabel}`
    : entry.capacity >= 9
      ? 'retarde le délestage des flux secondaires'
      : 'retarde les actions de confort sur routes stables';
  const risk = sharedCity
    ? `risque: ignorer ce choix laisse deux goulots bloquer ${entry.impactedCity}`
    : entry.tone === 'high'
      ? `risque: choisir une autre route prolonge la pénurie aval de ${entry.impactedCity}`
      : `risque: une autre ressource d'abord peut transformer ce flux en goulot critique`;

  return { improves, delays, risk, summary: `Améliore: ${improves} · Retarde: ${delays} · ${risk}` };
}

function buildProvinceLogisticsBottleneckPriorities(comparisons) {
  const strained = comparisons.filter((entry) => entry.tone === 'high' || entry.tone === 'medium');
  const impactedCityCounts = strained.reduce((counts, entry) => counts.set(entry.impactedCity, (counts.get(entry.impactedCity) ?? 0) + 1), new Map());
  const resourceCounts = strained.reduce((counts, entry) => counts.set(entry.resourceLabel, (counts.get(entry.resourceLabel) ?? 0) + 1), new Map());

  return strained
    .map((entry) => {
      const sharedCity = (impactedCityCounts.get(entry.impactedCity) ?? 0) > 1;
      const sharedResource = (resourceCounts.get(entry.resourceLabel) ?? 0) > 1;
      const reinforcement = sharedCity
        ? `Renforce un autre goulot sur ${entry.impactedCity}`
        : sharedResource
          ? `Concurrence la même ressource (${entry.resourceLabel})`
          : 'Goulot isolé, priorité par sévérité et risque.';
      const rankReason = entry.tone === 'high'
        ? `Sévérité haute + ${entry.consequence.toLowerCase()}`
        : `Impact moyen mais ${reinforcement.toLowerCase()}`;

      return {
        ...entry,
        reinforcement,
        rankReason,
        interventionTradeoff: buildProvinceLogisticsInterventionTradeoff(entry, sharedCity, sharedResource),
        priorityScore: entry.score + (sharedCity ? 35 : 0) + (sharedResource ? 18 : 0),
      };
    })
    .sort((left, right) => right.priorityScore - left.priorityScore || left.routeName.localeCompare(right.routeName))
    .slice(0, 3);
}

function buildProvinceLogisticsInterventionSequence(priorities) {
  if (priorities.length === 0) {
    return null;
  }

  const steps = priorities.slice(0, 3).map((entry, index, ordered) => {
    const previous = ordered[index - 1] ?? null;
    const next = ordered[index + 1] ?? null;
    const equivalentWithPrevious = previous ? Math.abs(entry.priorityScore - previous.priorityScore) <= 10 : false;
    const equivalentWithNext = next ? Math.abs(next.priorityScore - entry.priorityScore) <= 10 : false;
    const dependency = entry.recoveryAction.includes('Escorter')
      ? 'ordre dépendant du choix militaire'
      : entry.reinforcement.includes('ressource')
        ? 'ordre dépendant du choix culturel/production'
        : null;
    const reason = equivalentWithPrevious || equivalentWithNext
      ? 'alternative équivalente: arbitrer selon disponibilité locale'
      : entry.tone === 'high'
        ? 'urgence et impact aval prioritaire'
        : entry.interventionTradeoff.risk.includes('critique')
          ? 'évite bascule en goulot critique'
          : 'coût d’opportunité contenu après les urgences';

    return {
      routeId: entry.routeId,
      routeName: entry.routeName,
      order: index + 1,
      reason,
      dependency,
      label: `${index + 1}. ${entry.routeName}`,
    };
  });

  return {
    steps,
    path: steps.map((step) => step.order).join(' → '),
    routes: steps.map((step) => step.routeName).join(' → '),
    hasAlternative: steps.some((step) => step.reason.includes('alternative équivalente')),
    dependency: steps.find((step) => step.dependency)?.dependency ?? null,
  };
}

function buildProvinceLogisticsBottleneckWarnings(province, economyView, comparisons = null) {
  if (!province || !economyView) {
    return [];
  }

  const entries = comparisons ?? buildProvinceLogisticsBottleneckComparison(province, economyView);
  const provinceCities = economyView.overlay.cities.filter((city) => city.regionId === province.provinceId);
  const tensionByCityId = Object.fromEntries(economyView.comparison.rows.map((row) => [row.cityId, row]));
  const localShortageCity = provinceCities.find((city) => tensionByCityId[city.cityId]?.tensionLevel === 'high')
    ?? provinceCities.slice().sort((left, right) => left.resources.totalStock - right.resources.totalStock)[0]
    ?? null;
  const strainedRoutes = entries.filter((entry) => entry.tone === 'high' || entry.tone === 'medium');

  if (strainedRoutes.length === 0) {
    return [];
  }

  const priorityRoute = strainedRoutes[0];
  const shortageContext = localShortageCity
    ? `${localShortageCity.cityName}: ${tensionByCityId[localShortageCity.cityId]?.tensionLevel === 'high' ? 'stock en tension haute' : `${localShortageCity.resources.totalStock} unités disponibles`}`
    : 'stock local à vérifier';
  const relatedRoutes = strainedRoutes.slice(0, 2).map((entry) => entry.routeName).join(' + ');

  return [{
    tone: priorityRoute.tone,
    label: priorityRoute.tone === 'high' ? 'Alerte goulot logistique' : 'Route logistique sous tension',
    text: `${shortageContext}; ${relatedRoutes} explique le marqueur par ${priorityRoute.consequence.toLowerCase()}.`,
    routeCount: strainedRoutes.length,
  }];
}

function buildProvinceLogisticsPressureComparison(province, economyView) {
  if (!province || !economyView) {
    return null;
  }

  const planned = buildProvinceLogisticsBottleneckPriorities(buildProvinceLogisticsBottleneckComparison(province, economyView));
  const outcomeMarker = getLogisticsOutcomeMarkerForFocusedProvince(province.provinceId);
  const resolvedDetails = sortLogisticsOutcomeDetails(outcomeMarker?.details ?? []);
  const detailByRouteId = new Map(resolvedDetails.map((detail) => [detail.routeId, detail]));
  const rows = planned.slice(0, 3).map((entry) => {
    const detail = detailByRouteId.get(entry.routeId) ?? resolvedDetails.find((candidate) => candidate.routeLabel === entry.routeName) ?? null;
    const status = detail?.status ?? 'planned-only';
    const delta = status === 'resolved' || status === 'reduced'
      ? 'goulot amélioré'
      : status === 'new-bottleneck'
        ? 'nouvelle contrainte aval'
        : status === 'unresolved'
          ? 'pénurie persistante'
          : 'reste à traiter';
    const tone = status === 'resolved' || status === 'reduced'
      ? 'improved'
      : status === 'new-bottleneck' || status === 'unresolved'
        ? 'danger'
        : 'pending';

    return {
      routeId: entry.routeId,
      routeName: entry.routeName,
      planned: `${entry.headline}: ${entry.downstreamImpact}`,
      resolved: detail ? `${detail.label}: ${detail.detail}` : 'Pas encore confirmé par les marqueurs post-résolution.',
      nextStep: tone === 'improved'
        ? 'Préparer le relais vers le prochain goulot.'
        : tone === 'danger'
          ? 'Replanifier avant le prochain tour.'
          : 'Conserver dans la file de suivi.',
      delta,
      tone,
    };
  });

  if (rows.length === 0 && !outcomeMarker) {
    return null;
  }

  return {
    hasNotableDelta: rows.some((row) => row.tone !== 'pending'),
    summary: rows.some((row) => row.tone === 'danger')
      ? 'Écart logistique notable: une pression reste ou se déplace.'
      : rows.some((row) => row.tone === 'improved')
        ? 'Plan confirmé: une pression logistique s’améliore.'
        : 'Pression prévue en attente de résolution.',
    rows,
  };
}

function renderProvinceLogisticsPressureComparison(province, economyView) {
  const comparison = buildProvinceLogisticsPressureComparison(province, economyView);

  if (!comparison) {
    return '';
  }

  return `
    <section class="province-logistics-pressure-comparison ${comparison.hasNotableDelta ? 'has-notable-delta' : 'is-discreet'}" aria-label="Comparaison pression logistique prévue et résolue">
      <div class="province-logistics-pressure-comparison__header">
        <strong>Prévu vs résolu</strong>
        <span>${comparison.summary}</span>
      </div>
      ${comparison.rows.length > 0 ? `
        <ol>
          ${comparison.rows.map((row) => `
            <li class="province-logistics-pressure-comparison__row province-logistics-pressure-comparison__row--${row.tone}">
              <strong>${row.routeName}</strong>
              <div><b>Prévu</b><span>${row.planned}</span></div>
              <div><b>Résolu</b><span>${row.resolved}</span></div>
              <div><b>Reste à traiter</b><span>${row.delta} · ${row.nextStep}</span></div>
            </li>
          `).join('')}
        </ol>
      ` : '<small>Aucun écart notable sur les routes suivies.</small>'}
    </section>
  `;
}

function renderProvinceLogisticsBottleneckComparison(province, economyView) {
  const comparisons = buildProvinceLogisticsBottleneckComparison(province, economyView);
  const warnings = buildProvinceLogisticsBottleneckWarnings(province, economyView, comparisons);
  const priorities = buildProvinceLogisticsBottleneckPriorities(comparisons);
  const interventionSequence = buildProvinceLogisticsInterventionSequence(priorities);

  if (comparisons.length < 2 && warnings.length === 0 && priorities.length === 0) {
    return '';
  }

  return `
    <section class="province-logistics-comparison" aria-label="Comparatif des goulets logistiques">
      <div class="province-logistics-comparison__header">
        <strong>Goulets logistiques comparés</strong>
        <span>${comparisons.length} route${comparisons.length > 1 ? 's' : ''} liée${comparisons.length > 1 ? 's' : ''}</span>
      </div>
      ${warnings.map((warning) => `
        <div class="province-logistics-bottleneck-warning province-logistics-bottleneck-warning--${warning.tone}" role="note">
          <b>${warning.label}</b>
          <span>${warning.text}</span>
          <small>${warning.routeCount} route${warning.routeCount > 1 ? 's' : ''} sous tension autour de la province.</small>
        </div>
      `).join('')}
      ${priorities.length > 0 ? `
        <div class="province-logistics-bottleneck-priorities" aria-label="Priorités aval des goulets logistiques">
          <div class="province-logistics-bottleneck-priorities__header">
            <b>Priorités aval</b>
            <span>${priorities.length} goulot${priorities.length > 1 ? 's' : ''} classé${priorities.length > 1 ? 's' : ''}</span>
          </div>
          ${interventionSequence ? `
            <div class="province-logistics-intervention-sequence" aria-label="Séquence recommandée d’interventions logistiques">
              <b>Séquence recommandée</b>
              <strong>${interventionSequence.path}</strong>
              <span>${interventionSequence.routes}</span>
              ${interventionSequence.hasAlternative ? '<small>Alternative équivalente détectée: l’ordre peut être inversé selon disponibilité locale.</small>' : ''}
              ${interventionSequence.dependency ? `<small>${interventionSequence.dependency}: vérifier avant d'engager.</small>` : ''}
              <ol>
                ${interventionSequence.steps.map((step) => `
                  <li><b>${step.label}</b><span>${step.reason}${step.dependency ? ` · ${step.dependency}` : ''}</span></li>
                `).join('')}
              </ol>
            </div>
          ` : ''}
          <ol>
            ${priorities.map((entry, index) => `
              <li class="province-logistics-bottleneck-priority province-logistics-bottleneck-priority--${entry.tone}">
                <span class="province-logistics-bottleneck-priority__rank">#${index + 1}</span>
                <div>
                  <strong>${entry.routeName}</strong>
                  <small>${entry.impactedCity} · ${entry.resourceLabel} · ${entry.headline}</small>
                  <p>${entry.downstreamImpact}</p>
                  <small>Action probable: ${entry.recoveryAction}</small>
                  <div class="province-logistics-bottleneck-tradeoff" aria-label="Compromis d’intervention logistique">
                    <span><b>Améliore</b>${entry.interventionTradeoff.improves}</span>
                    <span><b>Retarde</b>${entry.interventionTradeoff.delays}</span>
                    <span><b>Risque</b>${entry.interventionTradeoff.risk}</span>
                  </div>
                  <small>Raison du classement: ${entry.rankReason}</small>
                  ${entry.reinforcement ? `<em>${entry.reinforcement}</em>` : ''}
                </div>
              </li>
            `).join('')}
          </ol>
        </div>
      ` : ''}
      ${comparisons.map((entry, index) => `
        <article class="province-logistics-route province-logistics-route--${entry.tone} ${index === 0 ? 'is-priority' : ''}">
          <div class="province-logistics-route__rank">${index === 0 ? 'Priorité' : `#${index + 1}`}</div>
          <div>
            <strong>${entry.routeName}</strong>
            <p>${entry.consequence}</p>
            <small>${entry.leverage}</small>
          </div>
          <dl>
            <div><dt>Capacité</dt><dd>${entry.capacity}</dd></div>
            <div><dt>Tension</dt><dd>${entry.tension}</dd></div>
            <div><dt>Ressource</dt><dd>${entry.resourceLabel}</dd></div>
            <div><dt>Ville</dt><dd>${entry.impactedCity}</dd></div>
          </dl>
        </article>
      `).join('')}
    </section>
  `;
}

function buildProvinceLogisticsChoicePreviewView(province, economyView) {
  return buildProvinceLogisticsChoicePreview(province, economyView, {
    resourceLabelById: Object.fromEntries(Object.entries(resourceHudById).map(([resourceId, hud]) => [resourceId, hud.label])),
    queuedLogisticsActions: state.queuedLogisticsActions,
  });
}


function renderQueuedLogisticsMapSummary(preview) {
  const queuedEntries = state.queuedLogisticsActions.filter((entry) => entry.routeId === preview.primaryLogisticsAction.routeId || entry.provinceId === state.selectedProvinceId);
  const lastEntry = state.queuedLogisticsActions[state.queuedLogisticsActions.length - 1] ?? null;

  if (queuedEntries.length === 0 && !lastEntry) {
    return `
      <div class="province-logistics-queued-summary province-logistics-queued-summary--empty" aria-label="File logistique carte">
        <b>File logistique</b>
        <span>Aucune récupération logistique engagée depuis la carte.</span>
      </div>
    `;
  }

  return `
    <div class="province-logistics-queued-summary" aria-label="File logistique carte">
      <div>
        <b>File logistique</b>
        <span>${queuedEntries.length || state.queuedLogisticsActions.length} action${(queuedEntries.length || state.queuedLogisticsActions.length) > 1 ? 's' : ''} à auditer avant résolution</span>
      </div>
      <ul>
        ${(queuedEntries.length > 0 ? queuedEntries : state.queuedLogisticsActions.slice(-1)).map((entry) => `
          <li>
            <strong>${entry.label}</strong>
            <span>Cible: ${entry.target ?? entry.routeId} · Goulot: ${entry.bottleneckRelieved ?? 'à confirmer'}</span>
            <small>${entry.downstreamEffect ?? 'Impact aval à confirmer avant résolution.'}</small>
          </li>
        `).join('')}
      </ul>
      ${lastEntry ? `<button type="button" data-logistics-undo-last="${lastEntry.actionId}" aria-label="Retirer la dernière action logistique ${lastEntry.label}">Annuler dernière action</button>` : ''}
    </div>
  `;
}


function buildLogisticsTurnCommitSummary(province, preview) {
  const queuedEntries = state.queuedLogisticsActions.filter((entry) => entry.provinceId === province.provinceId || preview.options.some((option) => option.routeId === entry.routeId));
  const queuedRouteIds = new Set(queuedEntries.map((entry) => entry.routeId));
  const unresolvedShortages = preview.options
    .filter((option) => !queuedRouteIds.has(option.routeId))
    .flatMap((option) => option.recoveryChoices[0]?.downstreamShortages.map((shortage) => ({ ...shortage, routeId: option.routeId, route: option.routes[0], city: option.affectedCity })) ?? [])
    .filter((shortage) => shortage.status !== 'résolue')
    .slice(0, 3);
  const seenRoutes = new Set();
  const redundantActions = queuedEntries.filter((entry) => {
    const duplicate = seenRoutes.has(entry.routeId) || entry.status === 'redundant' || entry.status === 'conflict';
    seenRoutes.add(entry.routeId);
    return duplicate;
  });

  return {
    status: unresolvedShortages.some((shortage) => shortage.status === 'aggravée') ? 'danger' : unresolvedShortages.length > 0 ? 'warning' : queuedEntries.length > 0 ? 'covered' : 'empty',
    queuedEntries,
    unresolvedShortages,
    redundantActions,
    summary: queuedEntries.length === 0
      ? 'Aucune action logistique en attente: les pénuries restent à auditer avant résolution.'
      : unresolvedShortages.length > 0
        ? `${queuedEntries.length} action${queuedEntries.length > 1 ? 's' : ''} couvre${queuedEntries.length > 1 ? 'nt' : ''} la file; ${unresolvedShortages.length} pénurie${unresolvedShortages.length > 1 ? 's' : ''}/goulot${unresolvedShortages.length > 1 ? 's' : ''} reste${unresolvedShortages.length > 1 ? 'nt' : ''} dangereux.`
        : `${queuedEntries.length} action${queuedEntries.length > 1 ? 's' : ''} logistique${queuedEntries.length > 1 ? 's' : ''} couvre${queuedEntries.length > 1 ? 'nt' : ''} les pénuries aval visibles.`,
  };
}

function renderLogisticsTurnCommitSummary(province, preview) {
  const summary = buildLogisticsTurnCommitSummary(province, preview);

  return `
    <div class="province-logistics-turn-summary province-logistics-turn-summary--${summary.status}" aria-label="Synthèse logistique avant validation du tour">
      <div>
        <b>Avant validation du tour</b>
        <span>${summary.summary}</span>
      </div>
      ${summary.queuedEntries.length > 0 ? `
        <ul class="province-logistics-turn-summary__queue">
          ${summary.queuedEntries.map((entry) => `
            <li><strong>${entry.label}</strong><span>${entry.target ?? entry.routeId} · ${entry.bottleneckRelieved ?? 'goulot à confirmer'} · ${entry.downstreamEffect ?? 'effet aval à confirmer'}</span></li>
          `).join('')}
        </ul>
      ` : ''}
      ${summary.unresolvedShortages.length > 0 ? `
        <ul class="province-logistics-turn-summary__unresolved" aria-label="Pénuries ou goulots restant après estimation de la file">
          ${summary.unresolvedShortages.map((shortage) => `
            <li class="province-logistics-turn-summary__shortage province-logistics-turn-summary__shortage--${shortage.tone}"><strong>${shortage.status}</strong><span>${shortage.city} / ${shortage.route}: ${shortage.detail}</span></li>
          `).join('')}
        </ul>
      ` : ''}
      ${summary.redundantActions.length > 0 ? `<small>Actions redondantes ou moins prioritaires: ${summary.redundantActions.map((entry) => entry.label).join(', ')}.</small>` : ''}
    </div>
  `;
}

function renderProvinceLogisticsChoicePreview(province, economyView) {
  const preview = buildProvinceLogisticsChoicePreviewView(province, economyView);

  return `
    <section class="province-logistics-choice-preview" aria-label="Aperçu reroutage et réparation logistique">
      <div class="province-logistics-choice-preview__header">
        <strong>Aperçu choix logistiques</strong>
        <span>${preview.options.length > 0 ? `${preview.options.length} options` : 'stable'}</span>
      </div>
      <p>${preview.summary}</p>
      <div class="province-logistics-cause-summary province-logistics-cause-summary--${preview.status ?? 'stable'}">
        <b>Cause locale</b>
        <span>${preview.options[0]?.cause ?? 'logistique stable'}</span>
      </div>
      <div class="province-logistics-timeline-summary province-logistics-timeline-summary--${preview.timelineStatus ?? 'empty'}">
        <b>Timeline récupération</b>
        <span>${preview.timelineSummary ?? 'Aucune action route/logistique en file.'}</span>
      </div>
      <div class="province-logistics-downstream-summary province-logistics-downstream-summary--${preview.downstreamStatus ?? 'neutre'}">
        <b>Pénuries aval</b>
        <span>${preview.downstreamSummary ?? 'Aucune pénurie aval claire détectée.'}</span>
      </div>
      <div class="province-logistics-priority-summary" aria-label="Priorisation aval des actions logistiques">
        <b>Priorité aval</b>
        <span>${preview.prioritySummary ?? 'Aucune action logistique prioritaire disponible.'}</span>
      </div>
      ${preview.priorityActions.length > 0 ? `
        <div class="province-logistics-priority-list">
          ${preview.priorityActions.map((action) => `
            <article class="province-logistics-priority province-logistics-priority--${action.tone} ${action.recommended ? 'is-recommended' : ''}">
              <div>
                <strong>${action.action}</strong>
                <span>${action.recommended ? 'meilleure première action' : action.tradeoff}</span>
              </div>
              <p>${action.impact}</p>
              <small>${action.shortagesAvoided} pénurie${action.shortagesAvoided > 1 ? 's' : ''} évitée${action.shortagesAvoided > 1 ? 's' : ''} · ${action.downstreamStatus} · délai ${action.delay}</small>
              <small>${action.reason}</small>
            </article>
          `).join('')}
        </div>
      ` : ''}
      <div class="province-logistics-queue-action province-logistics-queue-action--${preview.primaryLogisticsAction.status}" aria-label="Engager une action logistique depuis la carte">
        <div>
          <b>Action carte</b>
          <strong>${preview.primaryLogisticsAction.label}</strong>
        </div>
        <p>${preview.primaryLogisticsAction.gain}</p>
        <dl>
          <div><dt>Coût</dt><dd>${preview.primaryLogisticsAction.cost}</dd></div>
          <div><dt>Délai</dt><dd>${preview.primaryLogisticsAction.delay}</dd></div>
          <div><dt>Impact aval</dt><dd>${preview.primaryLogisticsAction.downstreamImpact}</dd></div>
        </dl>
        <small>${preview.primaryLogisticsAction.queueWarning}</small>
        <button type="button" data-logistics-queue-action="${preview.primaryLogisticsAction.actionId ?? ''}" ${preview.primaryLogisticsAction.disabled ? 'disabled' : ''}>Engager récupération</button>
      </div>
      ${renderQueuedLogisticsMapSummary(preview)}
      ${renderLogisticsTurnCommitSummary(province, preview)}
      <div class="province-logistics-impact-preview province-logistics-impact-preview--${preview.selectedActionPreview.status}" aria-label="Impact projeté avant engagement logistique">
        <div>
          <b>Impact si engagé</b>
          <span>${preview.selectedActionPreview.summary}</span>
        </div>
        <p>${preview.selectedActionPreview.currentState} → ${preview.selectedActionPreview.projectedState}</p>
        ${preview.selectedActionPreview.badges.length > 0 ? `
          <ul>
            ${preview.selectedActionPreview.badges.slice(0, 3).map((badge) => `
              <li class="province-logistics-impact-badge province-logistics-impact-badge--${badge.tone}"><strong>${badge.value}</strong><span>${badge.label}</span></li>
            `).join('')}
          </ul>
        ` : ''}
        ${preview.selectedActionPreview.criticalRemaining ? '<small>Pénurie critique encore possible malgré la meilleure action.</small>' : ''}
      </div>
      ${preview.options.length > 0 ? `
        <div class="province-logistics-choice-list">
          ${preview.options.map((option) => `
          <article class="province-logistics-choice province-logistics-choice--${option.tone} ${option.recommended ? 'is-recommended' : ''}">
            <div class="province-logistics-choice__title">
              <strong>${option.action}</strong>
              <span>${option.recommended ? 'recommandé' : option.delay}</span>
            </div>
            <p>${option.impact}</p>
            <small class="province-logistics-choice__cause">${option.causeLabel}: ${option.cause}</small>
            <div class="province-logistics-recovery-comparison" aria-label="Comparaison des corrections logistiques">
              ${option.recoveryChoices.slice(0, 3).map((choice) => `
                <article class="province-logistics-recovery province-logistics-recovery--${choice.tone} ${choice.recommended ? 'is-recommended' : ''}">
                  <div>
                    <strong>${choice.label}</strong>
                    <span>${choice.comparison}</span>
                  </div>
                  <p>${choice.benefit}</p>
                  <small>Contrainte: ${choice.blocker} · ${choice.rationale}</small>
                  <small class="province-logistics-bottleneck province-logistics-bottleneck--${choice.bottleneck.tone}">Goulot: ${choice.bottleneck.label} · ${choice.bottleneck.detail}</small>
                  ${choice.downstreamShortages.length > 0 ? `
                    <ul class="province-logistics-downstream-shortages" aria-label="Pénuries aval prévues">
                      ${choice.downstreamShortages.map((shortage) => `
                        <li class="province-logistics-downstream-shortage province-logistics-downstream-shortage--${shortage.tone}">
                          <b>${shortage.status}</b>
                          <span>${shortage.target} · ${shortage.resource}</span>
                          <small>${shortage.detail}</small>
                        </li>
                      `).join('')}
                    </ul>
                  ` : ''}
                  ${choice.timeline.length > 0 ? `
                    <ol class="province-logistics-recovery-timeline" aria-label="Timeline de récupération logistique">
                      ${choice.timeline.map((step) => `
                        <li class="province-logistics-recovery-timeline__step province-logistics-recovery-timeline__step--${step.tone}">
                          <b>${step.step}</b>
                          <span>${step.detail}</span>
                          ${step.bottleneck ? `<small>Goulot: ${step.bottleneck.label}</small>` : ''}
                        </li>
                      `).join('')}
                    </ol>
                  ` : ''}
                  ${choice.neighborEffects.length > 0 ? `
                    <ul class="province-logistics-neighbor-effects" aria-label="Effets voisins attendus">
                      ${choice.neighborEffects.map((effect) => `
                        <li class="province-logistics-neighbor-effect province-logistics-neighbor-effect--${effect.tone}">
                          <b>${effect.label}</b>
                          <span>${effect.target} · ${effect.route}</span>
                          <small>${effect.detail}</small>
                        </li>
                      `).join('')}
                    </ul>
                  ` : ''}
                </article>
              `).join('')}
            </div>
            <dl>
              <div><dt>Coût</dt><dd>${option.cost}</dd></div>
              <div><dt>Délai</dt><dd>${option.delay}</dd></div>
              <div><dt>Route</dt><dd>${option.routes.join(', ')}</dd></div>
              <div><dt>Ressource</dt><dd>${option.resources.join(', ')}</dd></div>
              <div><dt>Risque résiduel</dt><dd>${option.residualRisk}</dd></div>
            </dl>
          </article>
        `).join('')}
        </div>
      ` : ''}
    </section>
  `;
}


function renderIntrigueTurnReportDeltas(province, intrigueView) {
  const report = buildIntrigueTurnReportDeltas(province, intrigueView, {
    previousActionCode: intrigueView?.selectedProvince?.drillDown?.recommendedResponseCode ?? null,
  });

  return `
    <section class="province-intrigue-turn-report province-intrigue-turn-report--${report.tone}" aria-label="Rapport intrigue du dernier tour">
      <div class="province-intrigue-turn-report__header">
        <strong>Rapport intrigue dernier tour</strong>
        <span>${report.deltas.length > 0 ? `${report.deltas.length} delta${report.deltas.length > 1 ? 's' : ''}` : 'masqué'}</span>
      </div>
      <p>${report.summary}</p>
      ${report.previousAction ? `<small>${report.previousAction}</small>` : ''}
      ${report.retaliationRisk ? `<small>Risque représailles: ${report.retaliationRisk}</small>` : ''}
      ${report.deltas.length > 0 ? `
        <ul class="province-intrigue-turn-report__list">
          ${report.deltas.map((delta) => `
            <li class="province-intrigue-turn-report__delta province-intrigue-turn-report__delta--${delta.tone}">
              <b>${delta.label}</b>
              <span>${delta.detail}</span>
            </li>
          `).join('')}
        </ul>
      ` : ''}
    </section>
  `;
}

function getProvinceClimateRiskLevel(province) {
  if (province.supplyLevel === 'collapsed' || province.contested) {
    return 'critical';
  }

  if (province.supplyLevel === 'disrupted' || province.supplyLevel === 'strained') {
    return 'strained';
  }

  return 'stable';
}

function buildProvinceClimateTurnReport(province) {
  const currentRiskLevel = getProvinceClimateRiskLevel(province);
  const previousRiskLevel = currentRiskLevel === 'critical'
    ? 'strained'
    : currentRiskLevel === 'strained'
      ? 'stable'
      : 'stable';
  const recoveryChoiceId = currentRiskLevel === 'critical' ? 'evacuate-risk-zones' : 'stockpile-supplies';
  const recoveryLabel = currentRiskLevel === 'critical' ? 'Évacuer les zones exposées' : 'Stocker des vivres';
  const recoveryWindowDays = currentRiskLevel === 'critical' ? 18 : 12;
  const climateOverlay = {
    selectedClimateImpactComparison: {
      state: 'ready',
      regionId: province.provinceId,
      current: {
        riskLevel: currentRiskLevel,
        anomaly: currentRiskLevel === 'stable' ? null : 'seasonal-pressure',
      },
    },
    selectedClimateTimingRecommendation: {
      state: 'ready',
      direction: currentRiskLevel === 'stable' ? 'steady' : 'riskier',
      urgency: currentRiskLevel === 'critical' ? 'act-before-preview' : 'time-sensitive',
      copy: currentRiskLevel === 'stable'
        ? 'Le climat reste stable pour le prochain tour.'
        : 'Le prochain tour peut amplifier la pression climatique locale.',
    },
  };
  const previousClimateOverlay = {
    selectedClimateImpactComparison: {
      state: 'ready',
      regionId: province.provinceId,
      current: {
        riskLevel: previousRiskLevel,
        anomaly: null,
      },
    },
  };

  return buildClimateTurnReportDeltas({
    turn: state.turn,
    selectedRegionId: province.provinceId,
    climateOverlay,
    previousClimateOverlay,
    previousRecoveryForecast: currentRiskLevel === 'stable' ? null : {
      forecasts: [
        {
          choiceId: recoveryChoiceId,
          label: recoveryLabel,
          recoveryWindowDays,
          relapseRisk: currentRiskLevel === 'critical' ? 'medium' : 'low',
          nextCriticalSeason: 'prochain tour',
          summary: `${recoveryLabel}: prévu ~${recoveryWindowDays}j avant stabilisation.`,
        },
      ],
    },
    realizedRecoveryByChoiceId: currentRiskLevel === 'stable' ? {} : {
      [recoveryChoiceId]: {
        recoveryWindowDays: Math.max(6, recoveryWindowDays - 2),
        relapseRisk: currentRiskLevel === 'critical' ? 'medium' : 'low',
        status: 'on-track',
        summary: 'Réalisation lisible dans le rapport du dernier tour.',
      },
    },
    upcomingSeason: 'prochain tour',
  });
}

function buildProvinceClimateCountdownCues(province, report = buildProvinceClimateTurnReport(province)) {
  const hazard = province.hazards?.[0] ?? null;
  const hazardRisk = hazard?.riskLevel ?? null;
  const riskDelta = report.deltas.find((delta) => delta.deltaId.includes(':risk') || delta.deltaId.includes(':anomaly')) ?? null;
  const upcomingDelta = report.deltas.find((delta) => delta.deltaId.includes(':upcoming')) ?? null;
  const recoveryDelta = report.deltas.find((delta) => delta.deltaId.includes(':recovery')) ?? null;
  const cues = [];

  if (report.state === 'risk' || hazardRisk === 'high' || getProvinceClimateRiskLevel(province) === 'critical') {
    cues.push({
      level: 'immediate',
      countdown: 'Immédiat',
      label: riskDelta?.label ?? (hazard ? `Catastrophe ${hazard.type}` : 'Risque climat critique'),
      detail: riskDelta?.reason ?? `${province.label} cumule instabilité, sévérité locale et exposition climatique visible.`,
      action: province.supplyLevel === 'collapsed' || province.contested ? 'Évacuer / mitiger' : 'Renforcer stabilité',
      priority: 1,
    });
  }

  if (upcomingDelta) {
    cues.push({
      level: 'next-turn',
      countdown: 'Prochain tour',
      label: 'Saison à risque',
      detail: upcomingDelta.reason,
      action: 'Préparer réserves',
      priority: 2,
    });
  }

  if (recoveryDelta || hazardRisk === 'moderate' || getProvinceClimateRiskLevel(province) === 'strained') {
    cues.push({
      level: 'watch',
      countdown: 'Surveiller',
      label: recoveryDelta?.label ?? (hazard ? `Aléa ${hazard.type}` : 'Pression climat'),
      detail: recoveryDelta?.reason ?? 'Température/précipitations et sévérité restent à confirmer avant validation du tour.',
      action: recoveryDelta?.tone === 'improved' ? 'Conserver mitigation' : 'Surveiller',
      priority: 3,
    });
  }

  if (cues.length === 0) {
    cues.push({
      level: 'stable',
      countdown: 'Stable',
      label: 'Climat stable',
      detail: 'Aucune catastrophe, anomalie ou dérive température/précipitations prioritaire visible.',
      action: 'Surveiller',
      priority: 4,
    });
  }

  return cues
    .sort((left, right) => left.priority - right.priority || left.label.localeCompare(right.label))
    .slice(0, 3);
}

function buildProvinceClimateMitigationPriorities(province, report = buildProvinceClimateTurnReport(province)) {
  const cues = buildProvinceClimateCountdownCues(province, report);
  const primaryCue = cues[0] ?? null;
  const riskLevel = getProvinceClimateRiskLevel(province);
  const hazard = province.hazards?.[0] ?? null;
  const immediate = primaryCue?.level === 'immediate';
  const nextTurn = primaryCue?.level === 'next-turn';
  const watch = primaryCue?.level === 'watch';
  const mitigationContext = hazard
    ? `${hazard.type} ${hazard.riskLevel ?? 'visible'}`
    : report.deltas[0]?.label ?? primaryCue?.label ?? 'climat stable';
  const priorities = [];

  if (immediate || riskLevel === 'critical') {
    priorities.push({
      option: province.supplyLevel === 'collapsed' || province.contested ? 'Évacuer / mitiger' : 'Renforcer stabilité',
      deadline: primaryCue?.countdown ?? 'Immédiat',
      avoidedImpact: `Évite que ${mitigationContext} bloque le plan province ce tour.`,
      tradeoff: province.supplyLevel === 'collapsed' ? 'Coût: abandon temporaire de rendement local.' : 'Coût: consommer une action de stabilisation.',
      outcomeChange: true,
      priority: 1,
    });
  }

  if (immediate || nextTurn || riskLevel === 'strained') {
    priorities.push({
      option: 'Préparer réserves',
      deadline: nextTurn ? 'Prochain tour' : primaryCue?.countdown ?? 'Surveiller',
      avoidedImpact: `Réduit l’exposition avant ${primaryCue?.label ?? 'la prochaine saison à risque'}.`,
      tradeoff: 'Coût: détourner ressources et logistique du plan principal.',
      outcomeChange: immediate || nextTurn,
      priority: 2,
    });
  }

  if (immediate || watch || province.loyalty < 55) {
    priorities.push({
      option: 'Déplacer ressources / réparation',
      deadline: watch ? 'Surveiller' : 'Ce tour',
      avoidedImpact: 'Contient les pertes de stabilité et accélère la récupération visible.',
      tradeoff: 'Compromis: retarde une action économique ou militaire concurrente.',
      outcomeChange: immediate || riskLevel !== 'stable',
      priority: 3,
    });
  }

  priorities.push({
    option: watch || riskLevel === 'stable' ? 'Observation / attente' : 'Observation active',
    deadline: primaryCue?.countdown ?? 'Stable',
    avoidedImpact: riskLevel === 'stable'
      ? 'Confirme qu’aucune mitigation immédiate ne change le résultat.'
      : 'Garde le risque lisible si aucune ressource ne peut être engagée.',
    tradeoff: riskLevel === 'stable' ? 'Coût: aucun, mais pas de réduction proactive.' : 'Compromis: accepte le risque résiduel jusqu’au prochain signal.',
    outcomeChange: false,
    priority: 4,
  });

  return priorities
    .sort((left, right) => Number(right.outcomeChange) - Number(left.outcomeChange) || left.priority - right.priority)
    .slice(0, 3);
}

function getProjectedClimateRiskAfterMitigation(currentRiskLevel, hasQueuedMitigation) {
  if (!hasQueuedMitigation) {
    return currentRiskLevel;
  }

  if (currentRiskLevel === 'critical') {
    return 'strained';
  }

  if (currentRiskLevel === 'strained') {
    return 'stable';
  }

  return 'stable';
}

function buildClimateMitigationPayoffTradeoff(province, queuedMitigation, currentRisk, projectedRisk) {
  if (!queuedMitigation) {
    return null;
  }

  const tradeoffType = province.contested || province.occupied
    ? 'exposition militaire'
    : province.loyalty < 55
      ? 'friction culturelle'
      : queuedMitigation.tradeoff.includes('logistique') || queuedMitigation.tradeoff.includes('ressources')
        ? 'pression économie/logistique'
        : queuedMitigation.deadline === 'Ce tour' || queuedMitigation.deadline === 'Immédiat'
          ? 'temps'
          : queuedMitigation.tradeoff.includes('retarde') || queuedMitigation.tradeoff.includes('Compromis')
            ? 'coût d’opportunité'
            : null;

  if (!tradeoffType) {
    return null;
  }

  return {
    benefit: `Bénéfice attendu: risque ${currentRisk} → ${projectedRisk}.`,
    tradeoffType,
    tradeoff: queuedMitigation.tradeoff,
  };
}

function getClimateMitigationDeadlineRank(deadline) {
  if (deadline === 'Immédiat' || deadline === 'Ce tour') {
    return 0;
  }

  if (deadline === 'Prochain tour') {
    return 1;
  }

  if (deadline === 'Surveiller') {
    return 2;
  }

  return 3;
}

function getClimateDeadlineResidualRisk(province, cue, cascades) {
  const cascade = cascades[0] ?? null;

  if (cascade) {
    return `${cascade.type}: ${cascade.scope}`;
  }

  if (province.supplyLevel === 'collapsed') {
    return 'récolte: rupture de vivres locale probable';
  }

  if (province.contested || province.occupied) {
    return 'route: exposition logistique et militaire prolongée';
  }

  if (province.loyalty < 55) {
    return 'stabilité: friction locale prolongée';
  }

  return cue?.label ? `anomalie prolongée: ${cue.label}` : 'anomalie prolongée: surveillance climat requise';
}

function buildClimateMitigationDeadlineCoverage(province, queuedMitigation, cues, cascades) {
  const criticalCue = cues.find((cue) => cue.level === 'immediate' || cue.level === 'next-turn') ?? null;

  if (!criticalCue) {
    return {
      state: 'calm',
      label: 'Aucune deadline critique active',
      detail: 'Le plan peut rester en surveillance sans urgence temporelle confirmée.',
      residualRisk: null,
    };
  }

  if (!queuedMitigation) {
    return {
      state: 'missed',
      label: `${criticalCue.countdown}: aucune mitigation en file`,
      detail: 'La deadline climat reste non couverte par le plan actuel.',
      residualRisk: getClimateDeadlineResidualRisk(province, criticalCue, cascades),
    };
  }

  const urgencyRank = criticalCue.level === 'immediate' ? 0 : 1;
  const mitigationRank = getClimateMitigationDeadlineRank(queuedMitigation.deadline);

  if (mitigationRank < urgencyRank) {
    return {
      state: 'covered',
      label: `${queuedMitigation.deadline}: avant ${criticalCue.countdown}`,
      detail: 'La mitigation arrive avant l’échéance climat visible.',
      residualRisk: null,
    };
  }

  if (mitigationRank === urgencyRank) {
    return {
      state: 'just-in-time',
      label: `${queuedMitigation.deadline}: juste à temps`,
      detail: 'Le plan couvre l’urgence, mais sans marge si un autre risque se dégrade.',
      residualRisk: getClimateDeadlineResidualRisk(province, criticalCue, cascades),
    };
  }

  return {
    state: 'missed',
    label: `${queuedMitigation.deadline}: trop tard pour ${criticalCue.countdown}`,
    detail: 'La mitigation réduit le risque ensuite, mais ne couvre pas la deadline critique actuelle.',
    residualRisk: getClimateDeadlineResidualRisk(province, criticalCue, cascades),
  };
}

function buildSelectedClimateInterventionRiskPreview(province, shell, selectedIntervention = null, report = buildProvinceClimateTurnReport(province)) {
  const priorities = buildProvinceClimateMitigationPriorities(province, report);
  const intervention = selectedIntervention ?? priorities.find((priority) => priority.outcomeChange) ?? priorities[0] ?? null;
  const currentRisk = getProvinceClimateRiskLevel(province);
  const projectedRisk = getProjectedClimateRiskAfterMitigation(currentRisk, Boolean(intervention?.outcomeChange));
  const cues = buildProvinceClimateCountdownCues(province, report);
  const cascades = buildProvinceClimateCascadePreview(province, shell, report);
  const avoidedCascade = intervention?.outcomeChange
    ? cascades.find((cascade) => cascade.changesThisTurn) ?? cascades[0] ?? null
    : null;
  const deadlineCoverage = buildClimateMitigationDeadlineCoverage(province, intervention, cues, cascades);
  const timing = intervention && getClimateMitigationDeadlineRank(intervention.deadline) <= 0 ? 'gain immédiat' : 'gain différé';
  const remainsUrgent = deadlineCoverage.state === 'missed' || (deadlineCoverage.state === 'just-in-time' && projectedRisk === 'critical');
  const candidateComparisons = priorities.slice(0, 2).map((candidate) => ({
    option: candidate.option,
    timing: getClimateMitigationDeadlineRank(candidate.deadline) <= 0 ? 'immédiat' : 'différé',
    projectedRisk: getProjectedClimateRiskAfterMitigation(currentRisk, Boolean(candidate.outcomeChange)),
    deadline: candidate.deadline,
  }));

  if (!intervention) {
    return {
      state: 'empty',
      option: 'Aucune intervention sélectionnée',
      deadline: cues.find((cue) => cue.level !== 'stable')?.countdown ?? 'Aucune deadline fiable',
      currentRisk,
      projectedRisk: currentRisk,
      timing: 'gain non confirmé',
      avoidedCascade: 'Cascade évitée non disponible',
      remainsUrgent: false,
      deadlineCoverage,
      candidateComparisons,
    };
  }

  return {
    state: remainsUrgent ? 'urgent' : intervention.outcomeChange ? 'reduced' : 'unchanged',
    option: intervention.option,
    deadline: intervention.deadline ?? deadlineCoverage.label ?? 'Deadline absente',
    currentRisk,
    projectedRisk,
    timing,
    avoidedCascade: avoidedCascade
      ? `${avoidedCascade.type}: ${avoidedCascade.avoidedImpact}`
      : 'Cascade évitée non disponible',
    remainsUrgent,
    deadlineCoverage,
    candidateComparisons,
  };
}

function renderSelectedClimateInterventionRiskPreview(preview) {
  return `
    <div class="province-climate-risk-forecast__selected province-climate-risk-forecast__selected--${preview.state}" aria-label="Aperçu de réduction du risque pour l’intervention climat sélectionnée">
      <div>
        <strong>Intervention sélectionnée · ${preview.option}</strong>
        <span>${preview.deadline} · ${preview.timing}</span>
      </div>
      <p><b>${preview.currentRisk}</b> → <b>${preview.projectedRisk}</b> · ${preview.avoidedCascade}</p>
      ${preview.remainsUrgent ? `<small><b>Urgence persistante</b> · ${preview.deadlineCoverage.detail}</small>` : ''}
      <ul>
        ${preview.candidateComparisons.map((candidate) => `
          <li>${candidate.option}: ${candidate.timing}, risque ${candidate.projectedRisk} (${candidate.deadline})</li>
        `).join('')}
      </ul>
    </div>
  `;
}

function buildProvinceClimateRiskReductionForecast(province, shell, report = buildProvinceClimateTurnReport(province)) {
  const priorities = buildProvinceClimateMitigationPriorities(province, report);
  const queuedMitigation = priorities.find((priority) => priority.outcomeChange) ?? null;
  const currentRisk = getProvinceClimateRiskLevel(province);
  const projectedRisk = getProjectedClimateRiskAfterMitigation(currentRisk, Boolean(queuedMitigation));
  const cues = buildProvinceClimateCountdownCues(province, report);
  const criticalDeadline = queuedMitigation?.deadline ?? cues.find((cue) => cue.level !== 'stable')?.countdown ?? 'Aucune échéance critique';
  const payoffTradeoff = buildClimateMitigationPayoffTradeoff(province, queuedMitigation, currentRisk, projectedRisk);
  const remainingCascades = buildProvinceClimateCascadePreview(province, shell, report)
    .filter((cascade) => !queuedMitigation || !cascade.changesThisTurn)
    .slice(0, 2);
  const deadlineCoverage = buildClimateMitigationDeadlineCoverage(province, queuedMitigation, cues, remainingCascades);
  const selectedInterventionPreview = buildSelectedClimateInterventionRiskPreview(province, shell, queuedMitigation, report);

  if (!queuedMitigation) {
    return {
      state: 'empty',
      currentRisk,
      projectedRisk,
      criticalDeadline,
      queuedAction: null,
      payoffTradeoff: null,
      deadlineCoverage,
      selectedInterventionPreview,
      summary: 'Aucune mitigation climat décisive en file: la réduction de risque projetée reste inchangée.',
      remainingCascades,
    };
  }

  return {
    state: projectedRisk === currentRisk ? 'unchanged' : 'reduced',
    currentRisk,
    projectedRisk,
    criticalDeadline,
    queuedAction: queuedMitigation.option,
    payoffTradeoff,
    deadlineCoverage,
    selectedInterventionPreview,
    summary: `${queuedMitigation.option} projette ${currentRisk} → ${projectedRisk} avant ${criticalDeadline}.`,
    remainingCascades: remainingCascades.length > 0 ? remainingCascades : [{
      type: 'surveillance résiduelle',
      scope: 'Aucune cascade probable restante',
      avoidedImpact: 'La mitigation couvre les cascades régionales lisibles; garder seulement une veille climat.',
      changesThisTurn: false,
      priority: 6,
    }],
  };
}

function buildClimateInterventionQueueEntry(province, plan) {
  return {
    actionCode: plan.actionCode,
    label: plan.actionLabel,
    priority: 2,
    orderCost: '1 ordre climat',
    mainRisk: plan.tradeoff,
    expectedResult: `Réduction climat ${plan.riskReduction}; fenêtre ${plan.window}.`,
    status: plan.missedDeadline ? 'risky' : 'ready',
    tone: plan.missedDeadline ? 'warning' : 'ready',
    provinceId: province.provinceId,
    provinceLabel: province.label,
    category: 'climate',
    deadlineWindow: plan.window,
    riskReduction: plan.riskReduction,
    tradeoff: plan.tradeoff,
    missedDeadline: plan.missedDeadline,
  };
}

function buildClimateInterventionQueuePlan(province, forecast, actionQueue = [], queuedClimateInterventions = []) {
  const alreadyQueued = actionQueue.some((entry) => /climat|climate|mitigation|réserves|reparation|réparation/i.test(`${entry.actionCode} ${entry.label} ${entry.expectedResult}`))
    || queuedClimateInterventions.some((entry) => entry.provinceId === province.provinceId || entry.actionCode === `CLIMATE-${province.provinceId.toUpperCase()}`);
  const overlap = alreadyQueued
    ? 'Chevauchement: une intervention climat ou mitigation proche est déjà en file.'
    : forecast.queuedAction
      ? 'Aucun chevauchement détecté avec la file actuelle.'
      : 'Aucune intervention climat planifiable pour cette sélection.';
  const disabled = !forecast.queuedAction || alreadyQueued;
  const missedDeadline = forecast.deadlineCoverage.state === 'missed'
    ? `Deadline manquée: ${forecast.deadlineCoverage.label}. ${forecast.deadlineCoverage.residualRisk ?? 'Risque résiduel à surveiller.'}`
    : null;

  return {
    disabled,
    alreadyQueued,
    actionCode: `CLIMATE-${province.provinceId.toUpperCase()}`,
    actionLabel: forecast.queuedAction ?? 'Aucune intervention recommandée',
    window: forecast.criticalDeadline,
    riskReduction: `${forecast.currentRisk} → ${forecast.projectedRisk}`,
    tradeoff: forecast.payoffTradeoff?.tradeoff ?? 'Tradeoff non confirmé par les données disponibles.',
    overlap,
    missedDeadline,
    cta: disabled ? (alreadyQueued ? 'Déjà en file' : 'Aucune action climat') : 'Planifier intervention climat',
  };
}

function renderQueuedClimateInterventionConfirmation(province, queuedClimateInterventions = []) {
  const queuedIntervention = [...queuedClimateInterventions].reverse()
    .find((entry) => entry.provinceId === province.provinceId) ?? null;

  if (!queuedIntervention) {
    return '';
  }

  return `
    <div class="province-climate-risk-forecast__confirmation province-climate-risk-forecast__confirmation--${queuedIntervention.tone}" aria-label="Confirmation de l’intervention climat en file">
      <div>
        <strong>Intervention climat confirmée</strong>
        <code>${queuedIntervention.actionCode}</code>
      </div>
      <p>${queuedIntervention.label} est en file pour ${queuedIntervention.provinceLabel ?? province.label}.</p>
      <dl>
        <div><dt>Deadline confirmée</dt><dd>${queuedIntervention.deadlineWindow}</dd></div>
        <div><dt>Impact risque</dt><dd>${queuedIntervention.riskReduction}</dd></div>
        <div><dt>Tradeoff confirmé</dt><dd>${queuedIntervention.tradeoff}</dd></div>
      </dl>
      ${queuedIntervention.missedDeadline ? `<small><b>${queuedIntervention.missedDeadline}</b></small>` : '<small>Prête avant résolution du tour; vous pouvez encore annuler ce choix.</small>'}
      <button type="button" data-undo-climate-intervention="true" data-climate-action-code="${queuedIntervention.actionCode}">Annuler intervention climat</button>
    </div>
  `;
}

function renderClimateInterventionQueueAction(province, forecast, actionQueue = [], queuedClimateInterventions = []) {
  const plan = buildClimateInterventionQueuePlan(province, forecast, actionQueue, queuedClimateInterventions);

  return `
    <div class="province-climate-risk-forecast__queue province-climate-risk-forecast__queue--${plan.disabled ? 'blocked' : 'ready'}" aria-label="Planification de l’intervention climat recommandée">
      <div>
        <strong>${plan.actionLabel}</strong>
        <code>${plan.actionCode}</code>
      </div>
      <dl>
        <div><dt>Fenêtre</dt><dd>${plan.window}</dd></div>
        <div><dt>Réduction</dt><dd>${plan.riskReduction}</dd></div>
        <div><dt>Tradeoff</dt><dd>${plan.tradeoff}</dd></div>
      </dl>
      ${plan.missedDeadline ? `<small><b>${plan.missedDeadline}</b></small>` : ''}
      <small>${plan.overlap}</small>
      <button type="button" data-queue-climate-intervention="true" data-province-id="${province.provinceId}" data-climate-action-code="${plan.actionCode}" ${plan.disabled ? 'disabled' : ''}>${plan.cta}</button>
    </div>
  `;
}

function renderProvinceClimateRiskReductionForecast(province, shell, actionQueue = [], queuedClimateInterventions = []) {
  const forecast = buildProvinceClimateRiskReductionForecast(province, shell);

  return `
    <section class="province-climate-risk-forecast province-climate-risk-forecast--${forecast.state}" aria-label="Prévision de réduction du risque climatique après mitigation en file">
      <div class="province-climate-risk-forecast__header">
        <strong>Réduction risque projetée</strong>
        <span>${forecast.criticalDeadline}</span>
      </div>
      <div class="province-climate-risk-forecast__meter">
        <b>${forecast.currentRisk}</b>
        <i aria-hidden="true">→</i>
        <b>${forecast.projectedRisk}</b>
      </div>
      <p>${forecast.summary}</p>
      ${forecast.payoffTradeoff ? `
        <div class="province-climate-risk-forecast__payoff">
          <span>${forecast.payoffTradeoff.benefit}</span>
          <small><b>${forecast.payoffTradeoff.tradeoffType}</b> · ${forecast.payoffTradeoff.tradeoff}</small>
        </div>
      ` : ''}
      ${renderSelectedClimateInterventionRiskPreview(forecast.selectedInterventionPreview)}
      ${renderQueuedClimateInterventionConfirmation(province, queuedClimateInterventions)}
      ${renderClimateInterventionQueueAction(province, forecast, actionQueue, queuedClimateInterventions)}
      <div class="province-climate-risk-forecast__deadline province-climate-risk-forecast__deadline--${forecast.deadlineCoverage.state}">
        <span><b>Deadline</b> · ${forecast.deadlineCoverage.label}</span>
        <small>${forecast.deadlineCoverage.detail}</small>
        ${forecast.deadlineCoverage.residualRisk ? `<small><b>Risque résiduel</b> · ${forecast.deadlineCoverage.residualRisk}</small>` : ''}
      </div>
      <div class="province-climate-risk-forecast__residuals">
        ${forecast.remainingCascades.map((cascade) => `
          <small><b>${cascade.type}</b> · ${cascade.scope}</small>
        `).join('')}
      </div>
    </section>
  `;
}

function buildProvinceClimateCascadePreview(province, shell, report = buildProvinceClimateTurnReport(province)) {
  const priorities = buildProvinceClimateMitigationPriorities(province, report);
  const decisivePriority = priorities.find((priority) => priority.outcomeChange) ?? null;
  const riskLevel = getProvinceClimateRiskLevel(province);
  const hazard = province.hazards?.[0] ?? null;
  const neighborProvinces = province.neighborIds
    .map((neighborId) => shell.provinces.find((candidate) => candidate.provinceId === neighborId))
    .filter(Boolean);
  const protectedNeighbors = neighborProvinces
    .filter((neighbor) => neighbor.supplyLevel !== 'stable' || neighbor.contested || neighbor.occupied)
    .slice(0, 3);
  const localResources = [
    ...(province.resourceIds ?? []),
    ...Object.keys(province.resourceDeposits ?? {}),
  ];
  const affectedResources = localResources.length > 0 ? localResources.slice(0, 3) : ['réserves locales'];
  const cascades = [];

  if (riskLevel !== 'stable' || province.supplyLevel === 'collapsed') {
    cascades.push({
      type: 'famine',
      scope: protectedNeighbors.length > 0 ? `Protège aussi ${protectedNeighbors.map((neighbor) => neighbor.label).join(', ')}` : 'Impact local seulement',
      avoidedImpact: `Évite une rupture de vivres sur ${affectedResources.join(', ')}.`,
      changesThisTurn: Boolean(decisivePriority),
      priority: 1,
    });
  }

  if (province.contested || province.occupied || protectedNeighbors.length > 0) {
    cascades.push({
      type: 'route fragilisée',
      scope: protectedNeighbors.length > 0 ? `Voisins concernés: ${protectedNeighbors.map((neighbor) => neighbor.label).join(', ')}` : 'Route locale sous pression',
      avoidedImpact: 'Réduit le risque de propagation vers les connexions frontalières et logistiques.',
      changesThisTurn: Boolean(decisivePriority),
      priority: 2,
    });
  }

  if (localResources.length > 0 && riskLevel !== 'stable') {
    cascades.push({
      type: 'migration de ressources',
      scope: affectedResources.join(', '),
      avoidedImpact: 'Garde les ressources dans la province au lieu de les déplacer en urgence.',
      changesThisTurn: Boolean(decisivePriority),
      priority: 3,
    });
  }

  if (hazard || report.deltas.some((delta) => delta.deltaId.includes(':upcoming') || delta.deltaId.includes(':anomaly'))) {
    cascades.push({
      type: 'anomalie saisonnière prolongée',
      scope: hazard ? `${hazard.type} ${hazard.riskLevel ?? 'visible'}` : 'saison prochaine',
      avoidedImpact: 'Limite la prolongation qualitative de l’anomalie au prochain tour.',
      changesThisTurn: Boolean(decisivePriority),
      priority: 4,
    });
  }

  if (cascades.length === 0) {
    cascades.push({
      type: 'cascade cosmétique',
      scope: 'Aucun voisin critique',
      avoidedImpact: 'La mitigation améliore surtout la lisibilité locale; pas de cascade régionale fiable.',
      changesThisTurn: false,
      priority: 5,
    });
  }

  return cascades
    .sort((left, right) => Number(right.changesThisTurn) - Number(left.changesThisTurn) || left.priority - right.priority)
    .slice(0, 3);
}

function renderProvinceClimateCascadePreview(province, shell) {
  const report = buildProvinceClimateTurnReport(province);
  const cascades = buildProvinceClimateCascadePreview(province, shell, report);
  const decisiveCount = cascades.filter((cascade) => cascade.changesThisTurn).length;

  return `
    <section class="province-climate-cascade-preview" aria-label="Aperçu des cascades régionales évitées par la mitigation climat">
      <div class="province-climate-cascade-preview__header">
        <strong>Cascades évitées</strong>
        <span>${decisiveCount > 0 ? `${decisiveCount} change${decisiveCount > 1 ? 'nt' : ''} ce tour` : 'effet local'}</span>
      </div>
      <div class="province-climate-cascade-list">
        ${cascades.map((cascade) => `
          <article class="province-climate-cascade ${cascade.changesThisTurn ? 'is-decisive' : 'is-cosmetic'}">
            <div>
              <b>${cascade.type}</b>
              <code>${cascade.changesThisTurn ? 'agit ce tour' : 'cosmétique'}</code>
            </div>
            <p>${cascade.avoidedImpact}</p>
            <small>${cascade.scope}</small>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderProvinceClimateMitigationPriorities(province) {
  const report = buildProvinceClimateTurnReport(province);
  const priorities = buildProvinceClimateMitigationPriorities(province, report);
  const decisiveCount = priorities.filter((priority) => priority.outcomeChange).length;

  return `
    <section class="province-climate-mitigation-priorities" aria-label="Comparaison des priorités de mitigation climat">
      <div class="province-climate-mitigation-priorities__header">
        <strong>Priorités mitigation climat</strong>
        <span>${decisiveCount} change${decisiveCount > 1 ? 'nt' : ''} le résultat</span>
      </div>
      <div class="province-climate-mitigation-priority-list">
        ${priorities.map((priority, index) => `
          <article class="province-climate-mitigation-priority ${priority.outcomeChange ? 'is-decisive' : 'is-observation'}">
            <div>
              <b>${index + 1}. ${priority.option}</b>
              <code>${priority.deadline}</code>
            </div>
            <p>${priority.avoidedImpact}</p>
            <small>${priority.tradeoff}</small>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderProvinceClimateCountdownCues(province) {
  const report = buildProvinceClimateTurnReport(province);
  const cues = buildProvinceClimateCountdownCues(province, report);

  return `
    <section class="province-climate-countdown" aria-label="Compte à rebours des risques climat de province">
      <div class="province-climate-countdown__header">
        <strong>Urgence climat</strong>
        <span>${cues[0]?.countdown ?? 'Stable'}</span>
      </div>
      <div class="province-climate-countdown__list">
        ${cues.map((cue) => `
          <article class="province-climate-countdown__cue province-climate-countdown__cue--${cue.level}">
            <div>
              <b>${cue.countdown}</b>
              <code>${cue.action}</code>
            </div>
            <strong>${cue.label}</strong>
            <p>${cue.detail}</p>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderProvinceClimateTurnReport(province) {
  const report = buildProvinceClimateTurnReport(province);

  return `
    <section class="province-climate-turn-report province-climate-turn-report--${report.state}" aria-label="Rapport climat et catastrophes du dernier tour">
      <div class="province-climate-turn-report__header">
        <strong>Rapport climat dernier tour</strong>
        <span>${report.deltas.length > 0 ? `${report.deltas.length} delta${report.deltas.length > 1 ? 's' : ''}` : 'stable'}</span>
      </div>
      <p>${report.summary}</p>
      ${report.deltas.length > 0 ? `
        <ul class="province-climate-turn-report__list">
          ${report.deltas.map((delta) => `
            <li class="province-climate-turn-report__delta province-climate-turn-report__delta--${delta.tone}">
              <b>${delta.label}</b>
              <span>${delta.value}</span>
              <small>${delta.forecast && delta.realized ? `Prévu: ${delta.forecast.recoveryWindowDays}j · Réalisé: ${delta.realized.recoveryWindowDays}j` : delta.reason}</small>
            </li>
          `).join('')}
        </ul>
      ` : ''}
    </section>
  `;
}

function buildProvinceClimateHazardBlockers(province, actionQueue) {
  const report = buildProvinceClimateTurnReport(province);
  const plannedAction = actionQueue[0] ?? null;
  const riskDelta = report.deltas.find((delta) => delta.deltaId.includes(':risk') || delta.deltaId.includes(':anomaly'));
  const recoveryDelta = report.deltas.find((delta) => delta.deltaId.includes(':recovery'));
  const upcomingDelta = report.deltas.find((delta) => delta.deltaId.includes(':upcoming'));
  const blockers = [];

  if (report.state === 'risk') {
    blockers.push({
      tone: 'blocked',
      status: 'déconseillée',
      label: 'Hazard climat bloquant',
      hazard: riskDelta?.label ?? 'risque climat accru',
      detail: `${plannedAction?.label ?? 'Action principale'} déconseillée: ${riskDelta?.reason ?? report.summary}`,
      trigger: plannedAction?.actionCode ?? 'plan province',
      priority: 1,
    });
  }

  if (upcomingDelta) {
    blockers.push({
      tone: upcomingDelta.tone === 'improved' ? 'safe' : 'delayed',
      status: upcomingDelta.tone === 'improved' ? 'sûre' : 'retardée',
      label: upcomingDelta.tone === 'improved' ? 'Fenêtre climat sûre' : 'Saison à risque court terme',
      hazard: upcomingDelta.value,
      detail: upcomingDelta.tone === 'improved'
        ? `${plannedAction?.label ?? 'Action'} peut être planifiée pendant cette fenêtre: ${upcomingDelta.reason}`
        : `${plannedAction?.label ?? 'Action'} devrait attendre ou recevoir une mitigation: ${upcomingDelta.reason}`,
      trigger: plannedAction?.actionCode ?? 'saison suivante',
      priority: upcomingDelta.tone === 'improved' ? 4 : 2,
    });
  }

  if (recoveryDelta) {
    blockers.push({
      tone: recoveryDelta.tone === 'worse' ? 'blocked' : recoveryDelta.tone === 'partial' ? 'risky' : 'safe',
      status: recoveryDelta.tone === 'worse' ? 'déconseillée' : recoveryDelta.tone === 'partial' ? 'risquée' : 'sûre',
      label: recoveryDelta.tone === 'improved' ? 'Mitigation efficace' : 'Récupération à surveiller',
      hazard: recoveryDelta.value,
      detail: recoveryDelta.forecast && recoveryDelta.realized
        ? `Prévu ${recoveryDelta.forecast.recoveryWindowDays}j / réalisé ${recoveryDelta.realized.recoveryWindowDays}j; garder ce délai dans la file d’actions.`
        : recoveryDelta.reason,
      trigger: plannedAction?.actionCode ?? recoveryDelta.deltaId,
      priority: recoveryDelta.tone === 'improved' ? 3 : 2,
    });
  }

  if (report.state === 'stable' || report.state === 'quiet') {
    blockers.push({
      tone: 'safe',
      status: 'sûre',
      label: 'Aucun blocker climat',
      hazard: 'saison stable',
      detail: `${plannedAction?.label ?? 'Action principale'} peut être planifiée sans retard climatique visible.`,
      trigger: plannedAction?.actionCode ?? 'plan province',
      priority: 5,
    });
  }

  return blockers
    .sort((left, right) => left.priority - right.priority || left.label.localeCompare(right.label))
    .slice(0, 3);
}

function renderProvinceClimateHazardBlockers(province, actionQueue) {
  const blockers = buildProvinceClimateHazardBlockers(province, actionQueue);

  if (blockers.length === 0) {
    return '';
  }

  return `
    <section class="province-climate-hazard-blockers" aria-label="Blockers climatiques du planning de province">
      <div class="province-climate-hazard-blockers__header">
        <strong>Blockers climat planning</strong>
        <span>${blockers.length} signal${blockers.length > 1 ? 's' : ''}</span>
      </div>
      <div class="province-climate-hazard-blocker-list">
        ${blockers.map((blocker) => `
          <article class="province-climate-hazard-blocker province-climate-hazard-blocker--${blocker.tone}">
            <div>
              <strong>${blocker.label}</strong>
              <code>${blocker.status}</code>
            </div>
            <p>${blocker.detail}</p>
            <small>Hazard: ${blocker.hazard} · Action: ${blocker.trigger}</small>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function getClimatePreparednessFocusRank(blocker, focusType) {
  if (blocker.tone === 'blocked') {
    return {
      riskCategory: 'critical',
      riskRank: 1,
      riskRankLabel: 'Risque critique',
      badge: 'P1',
    };
  }

  if (blocker.tone === 'risky' || blocker.tone === 'delayed') {
    return {
      riskCategory: 'elevated',
      riskRank: 2,
      riskRankLabel: focusType === 'critical-season' ? 'Risque élevé saisonnier' : 'Risque élevé',
      badge: 'P2',
    };
  }

  return {
    riskCategory: 'recovery',
    riskRank: 3,
    riskRankLabel: 'Récupération / opportunité',
    badge: 'P3',
  };
}

function buildClimatePreparednessFocusTooltip(province, selectedBlocker, rank) {
  const expectedImpact = selectedBlocker.tone === 'blocked'
    ? `Impact attendu: ${selectedBlocker.hazard} peut bloquer ${selectedBlocker.trigger}.`
    : selectedBlocker.tone === 'delayed' || selectedBlocker.tone === 'risky'
      ? `Impact attendu: ${selectedBlocker.hazard} augmente le coût ou le délai de ${selectedBlocker.trigger}.`
      : `Impact attendu: ${selectedBlocker.hazard} ouvre une fenêtre de récupération.`;
  const preparednessAction = selectedBlocker.label.includes('Mitigation')
    ? selectedBlocker.hazard
    : selectedBlocker.trigger;

  return {
    expectedImpact,
    preparednessAction,
    tooltip: `${rank.riskRankLabel} · ${province.label}: ${expectedImpact} Préparation: ${preparednessAction}.`,
  };
}

function buildMapClimatePreparednessSummary(shell, focusContext, intrigueView = null) {
  const warnings = shell.provinces
    .map((province) => {
      const actionQueue = buildSelectedProvinceActionQueue(province, shell, focusContext, intrigueView);
      const blockers = buildProvinceClimateHazardBlockers(province, actionQueue);
      const urgentBlocker = blockers.find((blocker) => blocker.tone === 'blocked' || blocker.tone === 'delayed' || blocker.tone === 'risky') ?? null;
      const mitigation = blockers.find((blocker) => blocker.tone === 'safe' && blocker.label === 'Mitigation efficace') ?? null;

      if (!urgentBlocker && !mitigation) {
        return null;
      }

      const selectedBlocker = urgentBlocker ?? mitigation;
      const focusType = urgentBlocker
        ? urgentBlocker.tone === 'delayed'
          ? 'critical-season'
          : 'hazard-zone'
        : 'mitigation';
      const rank = getClimatePreparednessFocusRank(selectedBlocker, focusType);
      const tooltip = buildClimatePreparednessFocusTooltip(province, selectedBlocker, rank);

      return {
        provinceId: province.provinceId,
        provinceId: province.provinceId,
    provinceLabel: province.label,
        tone: selectedBlocker.tone,
        status: selectedBlocker.status,
        label: selectedBlocker.label,
        hazard: selectedBlocker.hazard,
        action: selectedBlocker.trigger,
        detail: selectedBlocker.detail,
        priority: selectedBlocker.priority ?? 4,
        riskCategory: rank.riskCategory,
        riskRank: rank.riskRank,
        riskRankLabel: rank.riskRankLabel,
        rankBadge: rank.badge,
        expectedImpact: tooltip.expectedImpact,
        preparednessAction: tooltip.preparednessAction,
        tooltip: tooltip.tooltip,
        focusTarget: {
          type: focusType,
          provinceId: province.provinceId,
          targetId: `${province.provinceId}:${focusType}`,
          label: focusType === 'critical-season'
            ? `Saison critique · ${selectedBlocker.hazard}`
            : focusType === 'mitigation'
              ? `Mitigation · ${selectedBlocker.hazard}`
              : `Zone de danger · ${selectedBlocker.hazard}`,
          reason: selectedBlocker.detail,
          mitigation: selectedBlocker.label.includes('Mitigation') ? selectedBlocker.hazard : selectedBlocker.action,
        },
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.riskRank - right.riskRank || left.priority - right.priority || left.provinceLabel.localeCompare(right.provinceLabel))
    .slice(0, 4);
  const exposedCount = warnings.filter((warning) => warning.tone !== 'safe').length;
  const mitigatedCount = warnings.filter((warning) => warning.tone === 'safe').length;

  return {
    state: exposedCount > 0 ? 'warning' : mitigatedCount > 0 ? 'mitigated' : 'clear',
    exposedCount,
    mitigatedCount,
    warnings,
    summary: exposedCount > 0
      ? `${exposedCount} province${exposedCount > 1 ? 's' : ''} reste${exposedCount > 1 ? 'nt' : ''} exposée${exposedCount > 1 ? 's' : ''} au climat avant validation du tour.`
      : mitigatedCount > 0
        ? `${mitigatedCount} mitigation${mitigatedCount > 1 ? 's' : ''} climat confirmée${mitigatedCount > 1 ? 's' : ''}; aucun danger résiduel prioritaire.`
        : 'Préparation climat claire: aucun danger résiduel prioritaire avant validation du tour.',
  };
}

function getClimateInterventionWindowRank(entry) {
  if (entry.deadlineState === 'missed') return 0;
  if (entry.deadlineState === 'just-in-time') return 1;
  if (entry.deadlineState === 'covered') return 2;
  if (entry.riskLevel === 'critical') return 3;
  if (entry.riskLevel === 'strained') return 4;
  return 5;
}

function buildMapClimateInterventionWindows(shell) {
  const windows = shell.provinces
    .map((province) => {
      const forecast = buildProvinceClimateRiskReductionForecast(province, shell);
      const primaryCue = buildProvinceClimateCountdownCues(province)[0] ?? null;
      const riskLevel = getProvinceClimateRiskLevel(province);
      const residualCascade = forecast.remainingCascades[0] ?? null;
      const canWait = forecast.deadlineCoverage.state === 'calm' || (riskLevel === 'stable' && primaryCue?.level === 'stable');
      const deadline = forecast.deadlineCoverage.state === 'calm'
        ? primaryCue?.countdown ?? 'Stable'
        : forecast.deadlineCoverage.label;
      const benefit = forecast.payoffTradeoff?.benefit
        ?? (forecast.queuedAction ? `${forecast.queuedAction}: ${forecast.currentRisk} → ${forecast.projectedRisk}.` : 'Action immédiate: bénéfice limité ou non confirmé.');
      const delayRisk = forecast.deadlineCoverage.residualRisk
        ?? (residualCascade ? `${residualCascade.type}: ${residualCascade.scope}` : 'Peut attendre sans gros coût visible.');

      return {
        provinceId: province.provinceId,
        provinceLabel: province.label,
        deadline,
        deadlineState: forecast.deadlineCoverage.state,
        riskLevel,
        delayRisk,
        benefit,
        canWait,
        cueLabel: primaryCue?.label ?? 'Fenêtre climat',
        rank: 0,
      };
    })
    .sort((left, right) => getClimateInterventionWindowRank(left) - getClimateInterventionWindowRank(right)
      || left.provinceLabel.localeCompare(right.provinceLabel))
    .slice(0, 3)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  const urgentCount = windows.filter((window) => !window.canWait && window.deadlineState !== 'covered').length;

  return {
    state: urgentCount > 0 ? 'urgent' : windows.some((window) => !window.canWait) ? 'watch' : 'calm',
    urgentCount,
    windows,
    summary: windows.length > 1
      ? `${windows.length} fenêtres climat comparées; ${urgentCount} urgence${urgentCount > 1 ? 's' : ''} à traiter maintenant.`
      : windows.length === 1
        ? 'Une seule région climat concernée: comparaison réduite à la fenêtre locale.'
        : 'Aucune fenêtre d’intervention climat prioritaire à comparer.',
  };
}

function buildCumulativeClimateImpactSummary(shell, queuedClimateInterventions = []) {
  const duplicateCounts = queuedClimateInterventions.reduce((counts, entry) => {
    counts.set(entry.provinceId, (counts.get(entry.provinceId) ?? 0) + 1);
    return counts;
  }, new Map());
  const interventions = queuedClimateInterventions.map((entry, index) => {
    const province = shell.provinces.find((candidate) => candidate.provinceId === entry.provinceId) ?? null;
    const forecast = province ? buildProvinceClimateRiskReductionForecast(province, shell) : null;
    const deadlineState = entry.missedDeadline ? 'missed' : forecast?.deadlineCoverage.state ?? 'covered';
    const redundant = (duplicateCounts.get(entry.provinceId) ?? 0) > 1;
    const tooLate = Boolean(entry.missedDeadline) || deadlineState === 'missed';

    return {
      ...entry,
      rank: index + 1,
      provinceLabel: entry.provinceLabel ?? province?.label ?? entry.provinceId,
      deadlineWindow: entry.deadlineWindow ?? forecast?.criticalDeadline ?? 'deadline inconnue',
      riskReduction: entry.riskReduction ?? (forecast ? `${forecast.currentRisk} → ${forecast.projectedRisk}` : 'réduction à confirmer'),
      tradeoff: entry.tradeoff ?? forecast?.payoffTradeoff?.tradeoff ?? 'tradeoff à confirmer',
      mitigationDirection: entry.expectedResult ?? (forecast?.queuedAction ? `${forecast.queuedAction}: ${forecast.summary}` : 'mitigation à confirmer'),
      deadlineStatus: tooLate ? 'trop tardive' : deadlineState === 'just-in-time' ? 'sauvée de justesse' : 'sauvée par le plan',
      deadlineState: tooLate ? 'missed' : deadlineState,
      redundant,
      tooLate,
    };
  });
  const savedCount = interventions.filter((entry) => !entry.tooLate).length;
  const missedCount = interventions.filter((entry) => entry.tooLate).length;
  const redundantCount = interventions.filter((entry) => entry.redundant).length;

  return {
    state: interventions.length === 0 ? 'empty' : missedCount > 0 || redundantCount > 0 ? 'warning' : 'ready',
    interventions,
    savedCount,
    missedCount,
    redundantCount,
    summary: interventions.length === 0
      ? 'Aucune intervention climat confirmée: l’impact cumulé sera calculé dès qu’une action est mise en file.'
      : `${interventions.length} intervention${interventions.length > 1 ? 's' : ''} climat en attente: ${savedCount} délai${savedCount > 1 ? 's' : ''} sauvé${savedCount > 1 ? 's' : ''}, ${missedCount} encore critique${missedCount > 1 ? 's' : ''}, ${redundantCount} redondance${redundantCount > 1 ? 's' : ''}.`,
  };
}

function renderCumulativeClimateImpactSummary(view) {
  if (view.interventions.length === 0) {
    return `
      <section class="map-climate-cumulative map-climate-cumulative--empty" aria-label="Impact climatique cumulé avant résolution du tour">
        <strong>Impact climat cumulé</strong>
        <p>${view.summary}</p>
      </section>
    `;
  }

  return `
    <section class="map-climate-cumulative map-climate-cumulative--${view.state}" aria-label="Impact climatique cumulé avant résolution du tour">
      <div class="map-climate-cumulative__header">
        <strong>Impact climat cumulé avant validation</strong>
        <span>${view.savedCount} sauvé${view.savedCount > 1 ? 's' : ''} · ${view.missedCount} critique${view.missedCount > 1 ? 's' : ''} · ${view.redundantCount} redondant${view.redundantCount > 1 ? 's' : ''}</span>
      </div>
      <p>${view.summary}</p>
      <ol class="map-climate-cumulative__list">
        ${view.interventions.map((entry) => `
          <li class="map-climate-cumulative__item map-climate-cumulative__item--${entry.deadlineState} ${entry.redundant ? 'map-climate-cumulative__item--redundant' : ''}">
            <b>${entry.rank}. ${entry.provinceLabel}</b>
            <span>${entry.label} · ${entry.deadlineStatus}</span>
            <small><b>Après résolution</b> · risque ${entry.riskReduction}</small>
            <small><b>Délai</b> · ${entry.deadlineWindow}</small>
            <small><b>Tradeoff</b> · ${entry.tradeoff}</small>
            ${entry.redundant ? '<small><b>Redondance</b> · une autre intervention cible déjà cette province.</small>' : ''}
          </li>
        `).join('')}
      </ol>
    </section>
  `;
}

function buildPostCommitClimateImpactMarkers(shell, queuedClimateInterventions = []) {
  const cumulative = buildCumulativeClimateImpactSummary(shell, queuedClimateInterventions);
  const queuedProvinceIds = new Set(cumulative.interventions.map((entry) => entry.provinceId));
  const markerByProvince = new Map();

  cumulative.interventions.forEach((entry) => {
    const status = entry.tooLate
      ? 'hazard-unresolved'
      : entry.deadlineState === 'just-in-time'
        ? 'hazard-delayed'
        : 'risk-reduced';
    markerByProvince.set(entry.provinceId, {
      provinceId: entry.provinceId,
      provinceLabel: entry.provinceLabel,
      status,
      label: status === 'risk-reduced' ? 'Risque réduit' : status === 'hazard-delayed' ? 'Aléa retardé' : 'Aléa non résolu',
      summary: `${entry.label}: ${entry.riskReduction} après résolution.`,
      detail: `Lié au résumé climat cumulé: délai ${entry.deadlineWindow}, tradeoff ${entry.tradeoff}.`,
      source: 'cumulative-summary',
      priority: status === 'hazard-unresolved' ? 1 : status === 'hazard-delayed' ? 2 : 3,
    });
  });

  shell.provinces.forEach((province) => {
    if (queuedProvinceIds.has(province.provinceId)) {
      return;
    }

    const forecast = buildProvinceClimateRiskReductionForecast(province, shell);
    const hazard = province.hazards?.find((candidate) => candidate.riskLevel === 'high' || candidate.riskLevel === 'moderate') ?? null;
    const activeCascade = forecast.remainingCascades.find((cascade) => cascade.changesThisTurn) ?? null;

    if (activeCascade) {
      markerByProvince.set(province.provinceId, {
        provinceId: province.provinceId,
        provinceLabel: province.label,
        status: 'cascade-active',
        label: 'Cascade active',
        summary: `${activeCascade.type}: ${activeCascade.scope}.`,
        detail: `Risque encore actif après commit: ${activeCascade.avoidedImpact}`,
        source: 'remaining-hazard',
        priority: 1,
      });
    } else if (hazard) {
      markerByProvince.set(province.provinceId, {
        provinceId: province.provinceId,
        provinceLabel: province.label,
        status: 'hazard-unresolved',
        label: 'Aléa non résolu',
        summary: `${hazard.type}: risque ${hazard.riskLevel}.`,
        detail: 'Aucune intervention climat confirmée ne couvre encore cet aléa.',
        source: 'remaining-hazard',
        priority: hazard.riskLevel === 'high' ? 1 : 4,
      });
    }
  });

  return [...markerByProvince.values()]
    .sort((left, right) => left.priority - right.priority || left.provinceLabel.localeCompare(right.provinceLabel));
}

function getClimateMarkerDensityThreshold({ zoom = 1, viewportWidth = 1024, mobileMapExpanded = true } = {}) {
  const zoomAllowance = zoom >= 1.8 ? 3 : zoom >= 1.35 ? 1 : 0;
  const viewportPenalty = viewportWidth < 720 ? 1 : viewportWidth > 1180 ? -1 : 0;
  const collapsedPenalty = mobileMapExpanded ? 0 : 1;

  return Math.max(3, Math.min(8, 4 + zoomAllowance - viewportPenalty - collapsedPenalty));
}

function getClimateMarkerCascadeKey(marker) {
  if (!marker) {
    return null;
  }

  const cascadeType = marker.summary?.split(':')[0]?.trim() || marker.label;
  return `${marker.status}:${cascadeType}`;
}

function buildSelectedClimateCascadeGroup(markers, selectedProvinceId = null) {
  const selectedMarker = markers.find((marker) => marker.provinceId === selectedProvinceId) ?? null;

  if (!selectedMarker) {
    return null;
  }

  const key = getClimateMarkerCascadeKey(selectedMarker);
  const groupMarkers = markers
    .filter((marker) => getClimateMarkerCascadeKey(marker) === key)
    .sort((left, right) => left.priority - right.priority || left.provinceLabel.localeCompare(right.provinceLabel));
  const urgentCount = groupMarkers.filter((marker) => marker.status === 'cascade-active' || marker.status === 'hazard-unresolved').length;

  return {
    key,
    label: selectedMarker.status === 'cascade-active' ? `Groupe cascade ${selectedMarker.summary.split(':')[0]}` : `Groupe climat ${selectedMarker.label}`,
    primaryProvinceId: selectedMarker.provinceId,
    markers: groupMarkers,
    urgentCount,
    summary: `${groupMarkers.length} province${groupMarkers.length > 1 ? 's' : ''} liée${groupMarkers.length > 1 ? 's' : ''} au risque principal ${selectedMarker.summary}. ${urgentCount} urgence${urgentCount > 1 ? 's' : ''} reste${urgentCount > 1 ? 'nt' : ''} épinglée${urgentCount > 1 ? 's' : ''}.`,
  };
}

function buildClimateMarkerDensityControl(markers, options = {}) {
  const maxVisible = getClimateMarkerDensityThreshold(options);
  const selectedProvinceId = options.selectedProvinceId ?? null;
  const urgentMarkers = markers.filter((marker) => marker.status === 'cascade-active' || marker.status === 'hazard-unresolved');
  const selectedMarker = selectedProvinceId
    ? markers.find((marker) => marker.provinceId === selectedProvinceId) ?? null
    : null;
  const pinnedMarkers = urgentMarkers.concat(selectedMarker && !urgentMarkers.some((marker) => marker.provinceId === selectedMarker.provinceId) ? [selectedMarker] : []);
  const pinnedIds = new Set(pinnedMarkers.map((marker) => marker.provinceId));
  const lowerPriorityMarkers = markers.filter((marker) => !pinnedIds.has(marker.provinceId));
  const remainingSlots = Math.max(0, maxVisible - pinnedMarkers.length);
  const visibleMarkers = pinnedMarkers.concat(lowerPriorityMarkers.slice(0, remainingSlots));
  const visibleIds = new Set(visibleMarkers.map((marker) => marker.provinceId));
  const groupedMarkers = markers
    .filter((marker) => !visibleIds.has(marker.provinceId))
    .map((marker) => ({
      ...marker,
      hiddenReason: `Agrégé par seuil adaptatif: zoom ${Math.round((options.zoom ?? 1) * 100)}%, viewport ${options.viewportWidth ?? 1024}px.`,
    }));
  const groupedByStatus = groupedMarkers.reduce((counts, marker) => {
    counts[marker.status] = (counts[marker.status] ?? 0) + 1;
    return counts;
  }, {});
  const thresholdReason = `Seuil ${maxVisible} marqueurs (zoom ${Math.round((options.zoom ?? 1) * 100)}%, viewport ${options.viewportWidth ?? 1024}px${options.mobileMapExpanded === false ? ', carte mobile réduite' : ''}).`;

  const selectedCascadeGroup = buildSelectedClimateCascadeGroup(markers, selectedProvinceId);

  return {
    state: groupedMarkers.length > 0 ? 'grouped' : markers.length > maxVisible ? 'dense' : 'clear',
    maxVisible,
    visibleMarkers,
    groupedMarkers,
    urgentCount: urgentMarkers.length,
    selectedPinned: Boolean(selectedMarker),
    visibleCount: visibleMarkers.length,
    groupedCount: groupedMarkers.length,
    groupedByStatus,
    thresholdReason,
    selectedCascadeGroup,
    summary: groupedMarkers.length > 0
      ? `${visibleMarkers.length} marqueur${visibleMarkers.length > 1 ? 's' : ''} climat affiché${visibleMarkers.length > 1 ? 's' : ''}; ${groupedMarkers.length} réduit${groupedMarkers.length > 1 ? 's' : ''}/retardé${groupedMarkers.length > 1 ? 's' : ''} regroupé${groupedMarkers.length > 1 ? 's' : ''} selon le zoom/viewport. ${urgentMarkers.length} urgence${urgentMarkers.length > 1 ? 's' : ''} cascade/aléa reste${urgentMarkers.length > 1 ? 'nt' : ''} visible${urgentMarkers.length > 1 ? 's' : ''}${selectedMarker ? '; la province sélectionnée reste accessible' : ''}.`
      : markers.length > 0
        ? `${markers.length} marqueur${markers.length > 1 ? 's' : ''} climat affiché${markers.length > 1 ? 's' : ''}; aucune urgence masquée. ${thresholdReason}`
        : 'Aucun marqueur climat post-résolution à densifier.',
  };
}

function renderClimateMarkerDensityRollup(control) {
  if (control.visibleCount === 0 && control.groupedCount === 0) {
    return '';
  }

  const groupedStatuses = Object.entries(control.groupedByStatus)
    .map(([status, count]) => `${count} ${status}`)
    .join(' · ');

  return `
    <section class="map-climate-density map-climate-density--${control.state}" aria-label="Contrôle de densité des marqueurs climat">
      <div>
        <strong>Densité marqueurs climat</strong>
        <span>${control.visibleCount} visibles · ${control.groupedCount} regroupés</span>
      </div>
      <p>${control.summary}</p>
      <small>${control.thresholdReason}</small>
      ${groupedStatuses ? `<small>Regroupés: ${groupedStatuses}. Priorité conservée aux cascades et aléas non résolus${control.selectedPinned ? '; détail de province sélectionnée préservé' : ''}.</small>` : '<small>Cascades et aléas non résolus restent prioritaires sur la carte.</small>'}
    </section>
  `;
}

function getClimateSeverityRank(status) {
  return {
    'cascade-active': 1,
    'hazard-unresolved': 2,
    'hazard-delayed': 3,
    'risk-reduced': 4,
  }[status] ?? 5;
}

function buildClimateMitigationSecondaryBenefits(province, forecast, linkedNeighbors = [], selectedGroupIds = new Set()) {
  const benefits = [];
  const cascadeText = `${forecast.selectedInterventionPreview.avoidedCascade} ${forecast.remainingCascades.map((cascade) => `${cascade.type} ${cascade.scope}`).join(' ')}`;

  if (/route|logistique|frontali/i.test(cascadeText)) {
    benefits.push('Route logistique préservée: la cascade route/connexion perd de la pression.');
  }

  if (province.contested || province.occupied) {
    benefits.push('Front stabilisé: la mitigation réduit une pression météo sur une zone militaire fragile.');
  }

  if (province.loyalty < 55 || /famine|migration/i.test(cascadeText)) {
    benefits.push('Tension culturelle évitée: moins de stress population/ressources après mitigation.');
  }

  if (linkedNeighbors.length > 0 || selectedGroupIds.has(province.provinceId)) {
    benefits.push(`Cascade voisine réduite: ${linkedNeighbors.length > 0 ? linkedNeighbors.map((neighbor) => neighbor.provinceLabel).join(', ') : 'groupe sélectionné'} profite de la même priorité.`);
  }

  return benefits.slice(0, 2);
}

function buildClimateMitigationSequenceFromSeverity(markers = [], shell, densityControl = null) {
  if (!shell || markers.length === 0) {
    return [];
  }

  const markerByProvince = new Map(markers.map((marker) => [marker.provinceId, marker]));
  const selectedGroupIds = new Set((densityControl?.selectedCascadeGroup?.markers ?? []).map((marker) => marker.provinceId));

  return markers
    .map((marker) => {
      const province = shell.provinces.find((candidate) => candidate.provinceId === marker.provinceId) ?? null;
      if (!province) {
        return null;
      }

      const forecast = buildProvinceClimateRiskReductionForecast(province, shell);
      const plan = buildClimateInterventionQueuePlan(province, forecast);
      const linkedNeighbors = province.neighborIds
        .map((provinceId) => markerByProvince.get(provinceId))
        .filter(Boolean)
        .sort((left, right) => getClimateSeverityRank(left.status) - getClimateSeverityRank(right.status) || left.provinceLabel.localeCompare(right.provinceLabel))
        .slice(0, 2);
      const severityRank = getClimateSeverityRank(marker.status);
      const secondaryBenefits = buildClimateMitigationSecondaryBenefits(province, forecast, linkedNeighbors, selectedGroupIds);

      return {
        provinceId: province.provinceId,
        provinceLabel: province.label,
        status: marker.status,
        severityRank,
        severityLabel: marker.status === 'cascade-active' ? 'Critique' : marker.status === 'hazard-unresolved' ? 'Élevé' : marker.status === 'hazard-delayed' ? 'Surveillance' : 'Réduit',
        action: plan.actionLabel,
        window: plan.window,
        cascade: forecast.selectedInterventionPreview.avoidedCascade,
        why: marker.summary,
        neighborRelief: linkedNeighbors.length > 0
          ? `Soulage aussi ${linkedNeighbors.map((neighbor) => neighbor.provinceLabel).join(', ')}.`
          : selectedGroupIds.has(marker.provinceId)
            ? 'Réduit la pression du groupe cascade sélectionné.'
            : 'Effet surtout local; surveiller les voisins après résolution.',
        secondaryBenefits,
        disabled: plan.disabled,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.severityRank - right.severityRank || Number(left.disabled) - Number(right.disabled) || left.provinceLabel.localeCompare(right.provinceLabel))
    .slice(0, 4);
}

function buildClimateSeverityLegend(markers = [], densityControl = null, shell = null) {
  if (state.activeOverlaySlot !== 'climate-overlay' || markers.length === 0) {
    return { active: false, entries: [], summary: 'Légende climat inactive: overlay climat masqué ou aucun marqueur.' };
  }

  const severityLabels = {
    'cascade-active': { label: 'Critique', cue: 'Cascade active épinglée', detail: 'Risque régional principal toujours visible.' },
    'hazard-unresolved': { label: 'Élevé', cue: 'Aléa non résolu', detail: 'Danger restant sans intervention confirmée.' },
    'hazard-delayed': { label: 'Surveillance', cue: 'Aléa retardé', detail: 'Impact ralenti mais à relire après commit.' },
    'risk-reduced': { label: 'Réduit', cue: 'Risque réduit', detail: 'Mitigation confirmée dans le résumé cumulé.' },
  };
  const entries = Object.entries(severityLabels)
    .map(([status, copy]) => ({
      status,
      count: markers.filter((marker) => marker.status === status).length,
      ...copy,
    }))
    .filter((entry) => entry.count > 0);
  const groupedCount = densityControl?.groupedCount ?? 0;
  const cascadeGroupCount = densityControl?.selectedCascadeGroup?.markers.length ?? 0;
  const mitigationSequence = buildClimateMitigationSequenceFromSeverity(markers, shell, densityControl);

  return {
    active: true,
    entries,
    groupedCount,
    cascadeGroupCount,
    mitigationSequence,
    summary: groupedCount > 0
      ? `${groupedCount} marqueur${groupedCount > 1 ? 's' : ''} agrégé${groupedCount > 1 ? 's' : ''}; la sévérité explique les piles sans ouvrir chaque province.`
      : 'Sévérité climat lisible directement sur les marqueurs visibles.',
  };
}

function getWorldClimateBiomeLabel(biome) {
  return {
    continental: 'Continental',
    temperate: 'Tempéré',
    arid: 'Aride',
    coastal: 'Côtier',
    tropical: 'Tropical',
  }[biome] ?? 'Mixte';
}

function getWorldClimateSeasonCue(province, seasonIndex = state.seasonIndex) {
  const season = seasonLabels[seasonIndex] ?? seasonLabels[0];
  const biome = province.biome ?? 'temperate';
  const riskLevel = getProvinceClimateRiskLevel(province);
  const hazard = province.hazards?.[0] ?? null;
  const disaster = hazard && (hazard.riskLevel === 'high' || riskLevel === 'critical')
    ? `${hazard.type} ${hazard.riskLevel}`
    : null;
  const anomaly = hazard && hazard.riskLevel === 'moderate'
    ? `${hazard.type} sous surveillance`
    : riskLevel === 'strained'
      ? 'stress saisonnier'
      : null;
  const seasonalPressure = [
    biome === 'continental' ? 'gel tardif possible' : biome === 'coastal' ? 'crues littorales surveillées' : 'reprise végétale',
    biome === 'arid' ? 'sécheresse probable' : biome === 'tropical' ? 'mousson active' : 'chaleur modérée',
    biome === 'temperate' ? 'récoltes exposées' : biome === 'continental' ? 'premiers froids' : 'instabilité de transition',
    biome === 'continental' ? 'gel et cols difficiles' : biome === 'coastal' ? 'tempêtes côtières' : 'pression hivernale',
  ][seasonIndex] ?? 'saison lisible';
  const tone = disaster ? 'disaster' : anomaly ? 'anomaly' : riskLevel === 'stable' ? 'seasonal' : 'watch';

  return {
    provinceId: province.provinceId,
    provinceLabel: province.label,
    biome,
    biomeLabel: getWorldClimateBiomeLabel(biome),
    season,
    seasonalPressure,
    anomaly,
    disaster,
    tone,
    label: disaster ? 'Catastrophe visible' : anomaly ? 'Anomalie climat' : 'Biome saisonnier',
    summary: `${getWorldClimateBiomeLabel(biome)} · ${season}: ${seasonalPressure}.`,
    detail: disaster ? `Catastrophe: ${disaster}.` : anomaly ? `Anomalie: ${anomaly}.` : `Variation saisonnière sans surcharge: risque ${riskLevel}.`,
  };
}

function getAtlasClimateForecastSeasonIndex(mode, currentSeasonIndex = state.seasonIndex) {
  return mode === 'next-season' || mode === 'short-alert'
    ? (currentSeasonIndex + 1) % seasonLabels.length
    : currentSeasonIndex;
}

function buildAtlasClimateForecastTimeline(shell, mode = state.atlasClimateForecastMode, currentSeasonIndex = state.seasonIndex) {
  const targetSeasonIndex = getAtlasClimateForecastSeasonIndex(mode, currentSeasonIndex);
  const currentEntries = shell.provinces.map((province) => getWorldClimateSeasonCue(province, currentSeasonIndex));
  const targetEntries = shell.provinces.map((province) => getWorldClimateSeasonCue(province, targetSeasonIndex));
  const currentByProvinceId = new Map(currentEntries.map((entry) => [entry.provinceId, entry]));
  const urgentCurrentEntries = currentEntries.filter((entry) => entry.disaster || entry.tone === 'disaster');
  const decisionChanges = targetEntries
    .map((entry) => {
      const current = currentByProvinceId.get(entry.provinceId);
      const changedDecision = Boolean(entry.disaster || entry.anomaly || current?.tone !== entry.tone || current?.seasonalPressure !== entry.seasonalPressure);
      return {
        ...entry,
        currentTone: current?.tone ?? 'seasonal',
        decisionReason: entry.disaster
          ? 'catastrophe urgente à garder visible'
          : entry.anomaly
            ? 'anomalie qui peut modifier la priorité de carte'
            : current?.seasonalPressure !== entry.seasonalPressure
              ? 'variation saisonnière utile pour le prochain tour'
              : 'changement faible, conservé en contexte',
        changedDecision,
      };
    })
    .filter((entry) => mode === 'current' ? entry.disaster || entry.anomaly : entry.changedDecision)
    .sort((left, right) => (left.disaster ? 0 : left.anomaly ? 1 : 2) - (right.disaster ? 0 : right.anomaly ? 1 : 2)
      || left.provinceLabel.localeCompare(right.provinceLabel));

  return {
    mode,
    currentSeason: seasonLabels[currentSeasonIndex] ?? seasonLabels[0],
    targetSeason: seasonLabels[targetSeasonIndex] ?? seasonLabels[0],
    entries: mode === 'current' ? currentEntries : targetEntries,
    decisionChanges,
    urgentCurrentEntries,
    summary: mode === 'current'
      ? 'État actuel: biomes, anomalies et catastrophes visibles sans simulation parallèle.'
      : mode === 'next-season'
        ? `Prochaine saison (${seasonLabels[targetSeasonIndex] ?? seasonLabels[0]}): seuls les changements qui modifient une décision de carte remontent.`
        : `Alerte court terme: ${urgentCurrentEntries.length} risque${urgentCurrentEntries.length > 1 ? 's' : ''} urgent${urgentCurrentEntries.length > 1 ? 's' : ''} reste${urgentCurrentEntries.length > 1 ? 'nt' : ''} visible${urgentCurrentEntries.length > 1 ? 's' : ''} pendant la prévision.`,
  };
}

function buildWorldClimateLayer(shell, seasonIndex = state.seasonIndex, mode = state.atlasClimateForecastMode) {
  const timeline = buildAtlasClimateForecastTimeline(shell, mode, seasonIndex);
  const entries = timeline.entries;
  const disasterCount = entries.filter((entry) => entry.disaster).length;
  const anomalyCount = entries.filter((entry) => entry.anomaly && !entry.disaster).length;
  const biomeCount = new Set(entries.map((entry) => entry.biome)).size;

  return {
    entries,
    season: timeline.targetSeason,
    biomeCount,
    disasterCount,
    anomalyCount,
    timeline,
    summary: `${biomeCount} biomes visibles en ${timeline.targetSeason} · ${disasterCount} catastrophe${disasterCount > 1 ? 's' : ''} · ${anomalyCount} anomalie${anomalyCount > 1 ? 's' : ''}. ${timeline.summary}`,
  };
}

function renderAtlasClimateForecastToggles(layer) {
  if (state.activeOverlaySlot !== 'climate-overlay') {
    return '';
  }

  const options = [
    ['current', 'Actuel'],
    ['next-season', 'Prochaine saison'],
    ['short-alert', 'Alerte courte'],
  ];

  return `
    <div class="map-world-climate__toggles" aria-label="Bascules temporelles climat atlas">
      ${options.map(([mode, label]) => `
        <button type="button" class="map-world-climate__toggle ${layer.timeline.mode === mode ? 'is-active' : ''}" data-atlas-climate-forecast-mode="${mode}" aria-pressed="${layer.timeline.mode === mode}">${label}</button>
      `).join('')}
    </div>
  `;
}

function buildAtlasClimateCascadeImpactPreview(shell, worldClimateLayer) {
  const provinceById = new Map(shell.provinces.map((province) => [province.provinceId, province]));
  const impactedEntries = worldClimateLayer.timeline.decisionChanges
    .concat(worldClimateLayer.timeline.mode === 'short-alert' ? worldClimateLayer.timeline.urgentCurrentEntries : [])
    .filter((entry, index, all) => all.findIndex((candidate) => candidate.provinceId === entry.provinceId) === index)
    .filter((entry) => entry.disaster || entry.anomaly || entry.tone === 'watch' || entry.changedDecision);

  const impacts = impactedEntries.map((entry) => {
    const province = provinceById.get(entry.provinceId);
    const linkedRoutes = (province?.neighborIds ?? [])
      .map((neighborId) => provinceById.get(neighborId))
      .filter(Boolean)
      .slice(0, 2);
    const intensity = entry.disaster ? 'critical' : entry.anomaly ? 'elevated' : 'watch';
    const horizon = worldClimateLayer.timeline.mode === 'current'
      ? 'maintenant'
      : worldClimateLayer.timeline.mode === 'next-season'
        ? `prochaine saison (${worldClimateLayer.timeline.targetSeason})`
        : 'court terme';
    const confidence = entry.disaster ? 'haute' : entry.anomaly ? 'moyenne' : 'prudente';

    return {
      provinceId: entry.provinceId,
      provinceLabel: entry.provinceLabel,
      intensity,
      horizon,
      confidence,
      regionImpact: entry.disaster
        ? `${entry.provinceLabel}: catastrophe susceptible de propager des coûts régionaux.`
        : entry.anomaly
          ? `${entry.provinceLabel}: anomalie à relire avant arbitrage régional.`
          : `${entry.provinceLabel}: variation saisonnière utile mais non critique.`,
      routeImpact: linkedRoutes.length > 0
        ? linkedRoutes.map((neighbor) => `${entry.provinceLabel} → ${neighbor.label}`).join(' · ')
        : 'Aucune route voisine exposée.',
      reason: entry.decisionReason ?? entry.detail,
    };
  })
    .sort((left, right) => ({ critical: 0, elevated: 1, watch: 2 }[left.intensity] ?? 3) - ({ critical: 0, elevated: 1, watch: 2 }[right.intensity] ?? 3)
      || left.provinceLabel.localeCompare(right.provinceLabel))
    .slice(0, 3);

  return {
    state: impacts.length === 0 ? 'empty' : impacts.some((impact) => impact.intensity === 'critical') ? 'critical' : 'watch',
    impacts,
    summary: impacts.length === 0
      ? 'Aucune cascade climat pertinente prévue pour les routes ou régions suivies.'
      : `${impacts.length} cascade${impacts.length > 1 ? 's' : ''} climat à surveiller sur routes/régions · horizon ${worldClimateLayer.timeline.targetSeason}.`,
  };
}

function buildAtlasClimateMitigationSynergies(shell, cascadePreview, worldClimateLayer) {
  if (!shell || !cascadePreview || cascadePreview.impacts.length === 0) {
    return {
      state: 'empty',
      synergies: [],
      summary: 'Aucune synergie climat notable à afficher sur l’atlas.',
    };
  }

  const provinceById = new Map(shell.provinces.map((province) => [province.provinceId, province]));
  const timelineByProvinceId = new Map(worldClimateLayer.timeline.entries.map((entry) => [entry.provinceId, entry]));
  const synergies = cascadePreview.impacts
    .map((impact) => {
      const province = provinceById.get(impact.provinceId);
      if (!province) {
        return null;
      }

      const forecast = buildProvinceClimateRiskReductionForecast(province, shell);
      const plan = buildClimateInterventionQueuePlan(province, forecast);
      const timelineEntry = timelineByProvinceId.get(impact.provinceId);
      const linkedRegions = province.neighborIds
        .map((provinceId) => provinceById.get(provinceId)?.label)
        .filter(Boolean)
        .slice(0, 2);
      const avoidedCascade = forecast.selectedInterventionPreview.avoidedCascade;
      const badges = [
        avoidedCascade ? 'cascade évitée' : null,
        impact.routeImpact !== 'Aucune route voisine exposée.' ? 'route protégée' : null,
        timelineEntry?.season ? `saison critique: ${timelineEntry.season}` : null,
        impact.intensity === 'critical' ? 'région prioritaire' : null,
      ].filter(Boolean);

      return {
        provinceId: province.provinceId,
        provinceLabel: province.label,
        action: plan.actionLabel,
        disabled: plan.disabled,
        intensity: impact.intensity,
        badges: badges.slice(0, 4),
        protectedRegions: linkedRegions.length > 0 ? linkedRegions.join(' · ') : province.label,
        routeImpact: impact.routeImpact,
        avoidedCascade,
        season: timelineEntry?.season ?? worldClimateLayer.timeline.targetSeason,
        summary: `${plan.actionLabel}: protège ${linkedRegions.length > 0 ? linkedRegions.join(' / ') : province.label} et réduit ${avoidedCascade}.`,
      };
    })
    .filter(Boolean)
    .filter((entry) => entry.badges.length > 1 || entry.intensity === 'critical')
    .sort((left, right) => ({ critical: 0, elevated: 1, watch: 2 }[left.intensity] ?? 3) - ({ critical: 0, elevated: 1, watch: 2 }[right.intensity] ?? 3)
      || Number(left.disabled) - Number(right.disabled)
      || left.provinceLabel.localeCompare(right.provinceLabel))
    .slice(0, 3);

  return {
    state: synergies.length === 0 ? 'quiet' : synergies.some((entry) => entry.intensity === 'critical') ? 'priority' : 'ready',
    synergies,
    summary: synergies.length === 0
      ? 'Les cascades prévues n’ont pas encore de synergie de mitigation assez nette; aucun bruit visuel ajouté.'
      : `${synergies.length} synergie${synergies.length > 1 ? 's' : ''} climat relie${synergies.length > 1 ? 'nt' : ''} interventions, régions protégées et cascades évitées.`,
  };
}

function buildAtlasSeasonalMitigationWindows(synergyView, worldClimateLayer) {
  if (!synergyView || synergyView.synergies.length === 0) {
    return {
      state: 'empty',
      windows: [],
      summary: 'Aucune fenêtre saisonnière critique: pas de synergie notable à prioriser.',
    };
  }

  const timelineByProvinceId = new Map(worldClimateLayer.timeline.entries.map((entry) => [entry.provinceId, entry]));
  const windows = synergyView.synergies
    .map((synergy) => {
      const timelineEntry = timelineByProvinceId.get(synergy.provinceId);
      const criticalSeason = synergy.season ?? timelineEntry?.season ?? worldClimateLayer.timeline.targetSeason;
      const urgencyRank = synergy.intensity === 'critical' ? 0 : synergy.intensity === 'elevated' ? 1 : 2;
      const deferredConsequence = synergy.intensity === 'critical'
        ? `Report: ${synergy.routeImpact} peut subir la cascade suivante avant ${criticalSeason}.`
        : synergy.intensity === 'elevated'
          ? `Report: l’anomalie de ${criticalSeason} réduit la marge de mitigation sur ${synergy.protectedRegions}.`
          : `Report: fenêtre utile mais non critique; relire au prochain toggle saison.`;

      return {
        provinceId: synergy.provinceId,
        provinceLabel: synergy.provinceLabel,
        action: synergy.action,
        intensity: synergy.intensity,
        urgencyRank,
        criticalSeason,
        avoidedImpact: synergy.avoidedCascade,
        protectedRegions: synergy.protectedRegions,
        deferredConsequence,
        badges: ['fenêtre saisonnière', ...synergy.badges].slice(0, 4),
      };
    })
    .filter((entry) => entry.criticalSeason && entry.avoidedImpact)
    .sort((left, right) => left.urgencyRank - right.urgencyRank || left.criticalSeason.localeCompare(right.criticalSeason) || left.provinceLabel.localeCompare(right.provinceLabel))
    .slice(0, 3);

  return {
    state: windows.length === 0 ? 'quiet' : windows.some((window) => window.intensity === 'critical') ? 'urgent' : 'ready',
    windows,
    summary: windows.length === 0
      ? 'Les synergies existent mais aucune saison critique nette ne justifie un panneau supplémentaire.'
      : `${windows.length} fenêtre${windows.length > 1 ? 's' : ''} saisonnière${windows.length > 1 ? 's' : ''} lie${windows.length > 1 ? 'nt' : ''} mitigation, impact évité et conséquence du report.`,
  };
}

function buildAtlasSeasonalMitigationPlanComparison(seasonalWindows) {
  if (!seasonalWindows || seasonalWindows.windows.length === 0) {
    return {
      state: 'empty',
      plans: [],
      bestPlan: null,
      summary: 'Aucun plan saisonnier comparable: fenêtre ou synergie insuffisante.',
    };
  }

  const plans = seasonalWindows.windows.slice(0, 3).map((window, index) => {
    const score = (window.intensity === 'critical' ? 3 : window.intensity === 'elevated' ? 2 : 1) * 10
      + Math.max(0, 3 - window.urgencyRank)
      + (window.badges.includes('route protégée') ? 2 : 0)
      + (window.badges.includes('cascade évitée') ? 2 : 0);
    const delayedCascade = window.intensity === 'critical'
      ? 'Cascade retardée seulement si action immédiate.'
      : 'Cascade retardée au prochain jalon saisonnier.';
    const probableCascade = window.deferredConsequence.replace(/^Report: /, 'Probable si report: ');

    return {
      ...window,
      planRank: index + 1,
      score,
      avoidedCascade: window.avoidedImpact,
      delayedCascade,
      probableCascade,
      verdict: score >= 34 ? 'meilleur choix' : score >= 24 ? 'bon compromis' : 'compromis prudent',
    };
  });
  const sorted = plans.slice().sort((left, right) => right.score - left.score || left.planRank - right.planRank);
  const bestPlan = sorted[0] ?? null;
  const hasClearBest = sorted.length > 1 ? (sorted[0].score - sorted[1].score) >= 4 : Boolean(bestPlan);

  return {
    state: hasClearBest ? 'best' : 'tradeoff',
    plans,
    bestPlan: hasClearBest ? bestPlan : null,
    summary: hasClearBest
      ? `Meilleur choix: ${bestPlan.provinceLabel} (${bestPlan.criticalSeason}) maximise cascades évitées et routes protégées.`
      : `Compromis principal: ${plans.map((plan) => plan.provinceLabel).join(' vs ')} équilibrent saison critique, cascade retardée et risque encore probable.`,
  };
}

function buildAtlasClimateActionPlanFromComparison(planComparison) {
  if (!planComparison || planComparison.plans.length === 0) {
    return {
      state: 'empty',
      selectedPlan: null,
      vulnerablePlans: [],
      summary: 'Aucun plan d’action climat à convertir depuis l’atlas.',
    };
  }

  const selectedPlan = planComparison.bestPlan ?? planComparison.plans.slice().sort((left, right) => right.score - left.score || left.planRank - right.planRank)[0];
  const vulnerablePlans = planComparison.plans.filter((plan) => /probable|Report|cascade suivante/i.test(plan.probableCascade) && plan.provinceId !== selectedPlan?.provinceId);

  return {
    state: selectedPlan ? (vulnerablePlans.length > 0 ? 'warning' : 'ready') : 'empty',
    selectedPlan,
    vulnerablePlans,
    summary: selectedPlan
      ? `Plan d’action proposé: ${selectedPlan.action} sur ${selectedPlan.provinceLabel}, fenêtre ${selectedPlan.criticalSeason}.`
      : 'Aucun plan saisonnier assez clair pour devenir une action atlas.',
  };
}

function getAtlasClimateActionPlanUrgencyScore(plan, vulnerabilityCount = 0) {
  const deadlineRank = /Printemps|Été|Automne|Hiver/i.test(plan.criticalSeason) ? 4 : 2;
  const severityRank = plan.intensity === 'critical' ? 8 : plan.intensity === 'elevated' ? 5 : 2;
  const exposureRank = (plan.badges?.includes('route protégée') ? 3 : 0) + (plan.protectedRegions?.split('·').length ?? 1) + vulnerabilityCount;
  return deadlineRank + severityRank + exposureRank + Math.round((plan.score ?? 0) / 10);
}

function buildAtlasClimateActionPlanRanking(actionPlanView) {
  if (!actionPlanView || actionPlanView.state === 'empty' || !actionPlanView.selectedPlan) {
    return {
      state: 'empty',
      priorities: [],
      summary: 'Aucun plan climat à classer par délai et exposition régionale.',
    };
  }

  const candidates = [actionPlanView.selectedPlan, ...actionPlanView.vulnerablePlans]
    .filter((plan, index, all) => plan && all.findIndex((candidate) => candidate.provinceId === plan.provinceId) === index)
    .map((plan) => {
      const vulnerabilityCount = actionPlanView.vulnerablePlans.some((candidate) => candidate.provinceId === plan.provinceId) ? 1 : 0;
      const urgencyScore = getAtlasClimateActionPlanUrgencyScore(plan, vulnerabilityCount);
      const mainReason = plan.intensity === 'critical'
        ? 'catastrophe/cascade active avant la deadline'
        : vulnerabilityCount > 0
          ? 'exposition régionale encore vulnérable'
          : plan.badges?.includes('route protégée')
            ? 'route protégée et cascade évitable'
            : 'deadline saisonnière à surveiller';

      return {
        ...plan,
        urgencyScore,
        mainReason,
        expectedImpact: `${plan.avoidedCascade}; ${plan.protectedRegions} moins exposée${plan.protectedRegions?.includes('·') ? 's' : ''}.`,
      };
    })
    .sort((left, right) => right.urgencyScore - left.urgencyScore || left.provinceLabel.localeCompare(right.provinceLabel))
    .slice(0, 3)
    .map((plan, index) => ({ ...plan, priorityRank: index + 1 }));

  return {
    state: candidates.length > 0 ? 'ready' : 'empty',
    priorities: candidates,
    summary: candidates.length > 0
      ? `${candidates.length} plan${candidates.length > 1 ? 's' : ''} climat classé${candidates.length > 1 ? 's' : ''} par deadline, cascade active et exposition régionale.`
      : 'Aucun plan climat à classer par délai et exposition régionale.',
  };
}

function renderAtlasClimateActionPlanRanking(view) {
  if (state.activeOverlaySlot !== 'climate-overlay' || view.state === 'empty') {
    return '';
  }

  return `
    <section class="map-world-climate-action-ranking" aria-label="Priorisation des plans d’action climat par urgence">
      <div class="map-world-climate-action-ranking__header">
        <strong>Priorités plans climat</strong>
        <span>${view.priorities.length} classé${view.priorities.length > 1 ? 's' : ''}</span>
      </div>
      <p>${view.summary}</p>
      <ol class="map-world-climate-action-ranking__list">
        ${view.priorities.map((plan) => `
          <li class="map-world-climate-action-ranking__item map-world-climate-action-ranking__item--${plan.intensity}">
            <b>${plan.priorityRank}. ${plan.provinceLabel}</b>
            <span>${plan.action} · deadline ${plan.criticalSeason}</span>
            <small><b>Raison</b> · ${plan.mainReason}</small>
            <small><b>Impact attendu</b> · ${plan.expectedImpact}</small>
          </li>
        `).join('')}
      </ol>
    </section>
  `;
}

function buildAtlasClimateActionUrgencyTimeline(rankingView) {
  if (!rankingView || rankingView.state === 'empty' || rankingView.priorities.length === 0) {
    return {
      state: 'empty',
      steps: [],
      summary: 'Aucune timeline climat à afficher: priorité insuffisante.',
    };
  }

  const ordered = rankingView.priorities
    .slice()
    .sort((left, right) => left.priorityRank - right.priorityRank || right.urgencyScore - left.urgencyScore || left.provinceLabel.localeCompare(right.provinceLabel));
  const steps = ordered.map((plan, index) => {
    const nextPlan = ordered[index + 1];
    const dependency = nextPlan && plan.protectedRegions?.split('·').some((region) => nextPlan.protectedRegions?.includes(region.trim()))
      ? `Synergie: prépare ${nextPlan.provinceLabel} via ${plan.protectedRegions}.`
      : plan.badges?.includes('route protégée')
        ? `Dépendance atlas: sécurise les routes avant ${plan.criticalSeason}.`
        : 'Dépendance atlas: autonome mais à relire après le prochain plan.';
    const exposureCount = plan.protectedRegions?.split('·').filter(Boolean).length ?? 1;
    const noCloseWindowAlert = exposureCount >= 2 && plan.intensity !== 'critical'
      ? `Alerte: ${plan.provinceLabel} reste très exposée sans fenêtre d’action proche.`
      : '';

    return {
      provinceId: plan.provinceId,
      provinceLabel: plan.provinceLabel,
      priorityRank: plan.priorityRank,
      intensity: plan.intensity,
      deadline: plan.criticalSeason,
      exposure: plan.protectedRegions,
      action: plan.action,
      reason: plan.mainReason,
      expectedImpact: plan.expectedImpact,
      dependency,
      noCloseWindowAlert,
    };
  });

  return {
    state: steps.some((step) => step.noCloseWindowAlert) ? 'alert' : 'ready',
    steps,
    summary: `Timeline climat: jouer ${steps[0].provinceLabel} ensuite, puis suivre les dépendances atlas sans dupliquer le ranking.`,
  };
}

function buildAtlasClimateMitigationReadinessComparison(timelineView) {
  if (!timelineView || timelineView.state === 'empty' || timelineView.steps.length === 0) {
    return {
      state: 'empty',
      regions: [],
      summary: 'Aucun plan urgent en attente: readiness climat non affichée.',
    };
  }

  const regions = timelineView.steps.map((step) => {
    const readinessStatus = step.intensity === 'critical' && step.noCloseWindowAlert
      ? 'too-late'
      : step.intensity === 'critical'
        ? 'just-in-time'
        : step.noCloseWindowAlert
          ? 'insufficient'
          : 'ready';
    const mitigationAvailable = readinessStatus === 'ready'
      ? 'mitigation prête'
      : readinessStatus === 'just-in-time'
        ? 'mitigation juste-à-temps'
        : readinessStatus === 'insufficient'
          ? 'capacité insuffisante avant fenêtre'
          : 'fenêtre dépassée';
    const timingProblem = readinessStatus === 'insufficient' || readinessStatus === 'too-late'
      ? 'Timing prioritaire: la capacité disponible arrive après l’exposition régionale.'
      : readinessStatus === 'just-in-time'
        ? 'Timing serré: jouer maintenant évite le basculement cascade.'
        : 'Timing couvert: la mitigation précède la cascade probable.';

    return {
      provinceId: step.provinceId,
      provinceLabel: step.provinceLabel,
      status: readinessStatus,
      deadline: step.deadline,
      mitigationAvailable,
      cascadeRisk: step.reason,
      exposure: step.exposure,
      timingProblem,
    };
  });

  return {
    state: regions.some((region) => region.status === 'too-late' || region.status === 'insufficient') ? 'timing-risk' : 'ready',
    regions,
    summary: `${regions.length} région${regions.length > 1 ? 's' : ''} compare${regions.length > 1 ? 'nt' : ''} deadline, mitigation disponible et risque de cascade.`,
  };
}

function buildAtlasClimateUnderReadyExecutionGaps(readinessView) {
  if (!readinessView || readinessView.state === 'empty' || readinessView.regions.length === 0) {
    return {
      state: 'empty',
      gaps: [],
      summary: 'Aucun déficit d’exécution climat urgent à signaler.',
    };
  }

  const gaps = readinessView.regions
    .filter((region) => region.status === 'insufficient' || region.status === 'too-late' || (region.status === 'just-in-time' && /cascade active|serré/i.test(region.cascadeRisk + region.timingProblem)))
    .map((region) => {
      const gapType = region.status === 'too-late'
        ? 'délai'
        : region.mitigationAvailable.includes('insuffisante')
          ? 'capacité'
          : region.exposure?.includes('·')
            ? 'dépendance régionale'
            : 'ressource';
      const severityScore = (region.status === 'too-late' ? 40 : region.status === 'insufficient' ? 30 : 20)
        + (region.exposure?.split('·').length ?? 1)
        + (/cascade active|catastrophe/i.test(region.cascadeRisk) ? 5 : 0);

      return {
        provinceId: region.provinceId,
        provinceLabel: region.provinceLabel,
        status: region.status,
        gapType,
        severityScore,
        deadline: region.deadline,
        shortfall: gapType === 'délai'
          ? `${region.deadline}: fenêtre d’action probablement manquée.`
          : gapType === 'capacité'
            ? `${region.mitigationAvailable}: besoins régionaux non couverts.`
            : gapType === 'dépendance régionale'
              ? `${region.exposure}: dépendances régionales à sécuriser avant l’action.`
              : `${region.mitigationAvailable}: ressource d’exécution à confirmer.`,
        consequence: region.timingProblem,
      };
    })
    .sort((left, right) => right.severityScore - left.severityScore || left.provinceLabel.localeCompare(right.provinceLabel))
    .slice(0, 3);

  return {
    state: gaps.length > 0 ? 'warning' : 'clear',
    gaps,
    summary: gaps.length > 0
      ? `${gaps.length} déficit${gaps.length > 1 ? 's' : ''} d’exécution climat urgent${gaps.length > 1 ? 's' : ''} à résoudre avant validation.`
      : 'Les plans urgents affichés sont suffisamment prêts; aucun avertissement ajouté.',
  };
}

function buildAtlasClimateReadinessBoostRecommendations(gapView) {
  if (!gapView || gapView.state !== 'warning' || gapView.gaps.length === 0) {
    return {
      state: 'empty',
      boosts: [],
      summary: 'Aucun boost readiness climat requis: les plans urgents restent exécutables.',
    };
  }

  const boostByGapType = {
    'capacité': {
      dimension: 'mitigation capacity',
      label: 'Capacité mitigation',
      boost: 'Pré-affecter une équipe mitigation et verrouiller une capacité de réserve avant la deadline.',
    },
    'dépendance régionale': {
      dimension: 'regional coordination',
      label: 'Coordination régionale',
      boost: 'Nommer un relais régional et confirmer le corridor partagé avant de lancer le plan.',
    },
    'délai': {
      dimension: 'timing buffer',
      label: 'Tampon timing',
      boost: 'Avancer le premier jalon d’un tour ou réduire le périmètre pour regagner une fenêtre courte.',
    },
    'ressource': {
      dimension: 'resource coverage',
      label: 'Couverture ressources',
      boost: 'Réserver le stock critique manquant et lier un fallback logistique au plan climat.',
    },
  };

  const boosts = gapView.gaps
    .map((gap) => {
      const recommendation = boostByGapType[gap.gapType] ?? boostByGapType.ressource;
      return {
        provinceId: gap.provinceId,
        provinceLabel: gap.provinceLabel,
        status: gap.status,
        deadline: gap.deadline,
        missingDimension: recommendation.dimension,
        label: recommendation.label,
        concreteReason: gap.shortfall,
        smallestBoost: recommendation.boost,
        consequence: gap.consequence,
      };
    })
    .slice(0, 3);

  return {
    state: boosts.length > 0 ? 'actionable' : 'empty',
    boosts,
    summary: boosts.length > 0
      ? `${boosts.length} boost${boosts.length > 1 ? 's' : ''} readiness minimal${boosts.length > 1 ? 's' : ''} recommandé${boosts.length > 1 ? 's' : ''} avant aggravation des deadlines.`
      : 'Aucun boost readiness climat requis: les plans urgents restent exécutables.',
  };
}

function renderAtlasClimateReadinessBoostRecommendations(view) {
  if (state.activeOverlaySlot !== 'climate-overlay' || view.state !== 'actionable') {
    return '';
  }

  return `
    <section class="map-world-climate-readiness-boosts" aria-label="Boosts readiness recommandés pour plans climat sous-prêts">
      <div class="map-world-climate-readiness-boosts__header">
        <strong>Boosts readiness climat</strong>
        <span>${view.boosts.length} action${view.boosts.length > 1 ? 's' : ''} minimale${view.boosts.length > 1 ? 's' : ''}</span>
      </div>
      <p>${view.summary}</p>
      <ol class="map-world-climate-readiness-boosts__list">
        ${view.boosts.map((boost) => `
          <li class="map-world-climate-readiness-boosts__item map-world-climate-readiness-boosts__item--${boost.status}">
            <b>${boost.provinceLabel}</b>
            <span>${boost.deadline} · ${boost.label}</span>
            <small><b>Dimension manquante</b> · ${boost.missingDimension}</small>
            <small><b>Raison concrète</b> · ${boost.concreteReason}</small>
            <small><b>Boost minimal</b> · ${boost.smallestBoost}</small>
          </li>
        `).join('')}
      </ol>
    </section>
  `;
}

function buildAtlasClimatePostBoostDeadlineRiskPreview(boostView) {
  if (!boostView || boostView.state !== 'actionable' || boostView.boosts.length === 0) {
    return {
      state: 'empty',
      previews: [],
      summary: 'Aucun aperçu post-boost: aucun plan urgent sous-prêt avec boost recommandé.',
    };
  }

  const previews = boostView.boosts.slice(0, 3).map((boost) => {
    const deadlinePressure = /fenêtre courte|deadline|Timing serré|maintenant/i.test(`${boost.smallestBoost} ${boost.consequence}`);
    const outcome = boost.status === 'too-late'
      ? 'insufficient'
      : boost.missingDimension === 'regional coordination' && boost.status === 'just-in-time'
        ? 'executable'
        : deadlinePressure
          ? 'still-tight'
          : 'executable';
    const label = outcome === 'executable'
      ? 'risque abaissé: exécutable'
      : outcome === 'still-tight'
        ? 'risque réduit mais serré'
        : 'boost insuffisant avant deadline';
    const postBoostSignal = outcome === 'executable'
      ? 'Le boost couvre la dimension manquante et replace le plan dans une fenêtre jouable.'
      : outcome === 'still-tight'
        ? 'Le boost réduit la pression, mais la deadline impose encore une exécution immédiate.'
        : 'Même après boost, la fenêtre reste probablement dépassée avant exécution fiable.';

    return {
      provinceId: boost.provinceId,
      provinceLabel: boost.provinceLabel,
      deadline: boost.deadline,
      outcome,
      label,
      missingDimension: boost.missingDimension,
      appliedBoost: boost.smallestBoost,
      postBoostSignal,
    };
  });

  return {
    state: previews.some((preview) => preview.outcome === 'insufficient')
      ? 'blocked'
      : previews.some((preview) => preview.outcome === 'still-tight')
        ? 'tight'
        : 'executable',
    previews,
    summary: `${previews.length} aperçu${previews.length > 1 ? 's' : ''} post-boost compare${previews.length > 1 ? 'nt' : ''} deadline, readiness corrigée et pression résiduelle.`,
  };
}

function renderAtlasClimatePostBoostDeadlineRiskPreview(view) {
  if (state.activeOverlaySlot !== 'climate-overlay' || view.state === 'empty') {
    return '';
  }

  return `
    <section class="map-world-climate-post-boost-risk map-world-climate-post-boost-risk--${view.state}" aria-label="Aperçu du risque de deadline après boost readiness climat">
      <div class="map-world-climate-post-boost-risk__header">
        <strong>Risque post-boost</strong>
        <span>${view.state === 'executable' ? 'exécutable' : view.state === 'tight' ? 'encore serré' : 'insuffisant'}</span>
      </div>
      <p>${view.summary}</p>
      <ol class="map-world-climate-post-boost-risk__list">
        ${view.previews.map((preview) => `
          <li class="map-world-climate-post-boost-risk__item map-world-climate-post-boost-risk__item--${preview.outcome}">
            <b>${preview.provinceLabel}</b>
            <span>${preview.deadline} · ${preview.label}</span>
            <small><b>Boost appliqué</b> · ${preview.appliedBoost}</small>
            <small><b>Pression résiduelle</b> · ${preview.postBoostSignal}</small>
          </li>
        `).join('')}
      </ol>
    </section>
  `;
}

function buildAtlasClimateReadinessBoostReliefRanking(postBoostView) {
  if (!postBoostView || postBoostView.state === 'empty' || postBoostView.previews.length === 0) {
    return {
      state: 'empty',
      rankedBoosts: [],
      summary: 'Aucun boost readiness urgent à classer par soulagement de deadline.',
    };
  }

  const reliefByOutcome = {
    executable: 90,
    'still-tight': 55,
    insufficient: 20,
  };
  const residualPenaltyByOutcome = {
    executable: 0,
    'still-tight': 12,
    insufficient: 28,
  };

  const rankedBoosts = postBoostView.previews
    .map((preview) => {
      const reliefScore = reliefByOutcome[preview.outcome] ?? 0;
      const residualPenalty = residualPenaltyByOutcome[preview.outcome] ?? 0;
      const reliefBand = preview.outcome === 'executable'
        ? 'temps exécutable gagné'
        : preview.outcome === 'still-tight'
          ? 'soulagement partiel, deadline serrée'
          : 'soulagement faible, deadline bloque encore';
      return {
        provinceId: preview.provinceId,
        provinceLabel: preview.provinceLabel,
        deadline: preview.deadline,
        outcome: preview.outcome,
        reliefScore,
        residualPenalty,
        reliefBand,
        appliedBoost: preview.appliedBoost,
        explanation: preview.outcome === 'executable'
          ? `${preview.appliedBoost} achète la fenêtre la plus jouable: ${preview.postBoostSignal}`
          : preview.outcome === 'still-tight'
            ? `${preview.appliedBoost} réduit la pression mais laisse peu de marge: ${preview.postBoostSignal}`
            : `${preview.appliedBoost} soulage trop peu avant la deadline: ${preview.postBoostSignal}`,
      };
    })
    .sort((left, right) => right.reliefScore - left.reliefScore || left.residualPenalty - right.residualPenalty || left.deadline.localeCompare(right.deadline) || left.provinceLabel.localeCompare(right.provinceLabel))
    .map((boost, index) => ({ ...boost, rank: index + 1 }));

  const best = rankedBoosts[0];
  return {
    state: rankedBoosts.length > 0 ? 'ranked' : 'empty',
    rankedBoosts,
    summary: best
      ? `Meilleur boost: ${best.provinceLabel}, car il offre le plus de temps exécutable (${best.reliefBand}).`
      : 'Aucun boost readiness urgent à classer par soulagement de deadline.',
  };
}

function renderAtlasClimateReadinessBoostReliefRanking(view) {
  if (state.activeOverlaySlot !== 'climate-overlay' || view.state !== 'ranked') {
    return '';
  }

  return `
    <section class="map-world-climate-boost-relief-ranking" aria-label="Classement des boosts readiness climat par soulagement de deadline">
      <div class="map-world-climate-boost-relief-ranking__header">
        <strong>Priorité boosts readiness</strong>
        <span>${view.rankedBoosts.length} classé${view.rankedBoosts.length > 1 ? 's' : ''}</span>
      </div>
      <p>${view.summary}</p>
      <ol class="map-world-climate-boost-relief-ranking__list">
        ${view.rankedBoosts.map((boost) => `
          <li class="map-world-climate-boost-relief-ranking__item map-world-climate-boost-relief-ranking__item--${boost.outcome}">
            <b>${boost.rank}. ${boost.provinceLabel}</b>
            <span>${boost.deadline} · ${boost.reliefBand}</span>
            <small><b>Score relief</b> · ${boost.reliefScore} (pénalité résiduelle ${boost.residualPenalty})</small>
            <small><b>Pourquoi maintenant</b> · ${boost.explanation}</small>
          </li>
        `).join('')}
      </ol>
    </section>
  `;
}

function buildAtlasClimateMinimumViableBoostHint(reliefRankingView) {
  if (!reliefRankingView || reliefRankingView.state !== 'ranked' || reliefRankingView.rankedBoosts.length === 0) {
    return {
      state: 'empty',
      hint: null,
      summary: 'Aucun boost climat prioritaire éligible à réduire au minimum viable.',
    };
  }

  const topBoost = reliefRankingView.rankedBoosts[0];
  const packageByOutcome = {
    executable: {
      state: 'minimal-sufficient',
      level: 'minimum suffisant',
      resourcePackage: '1 équipe + réserve ciblée',
      action: 'Appliquer le boost tel quel; ne pas sur-allouer au-delà du paquet minimal.',
    },
    'still-tight': {
      state: 'partial-worthwhile',
      level: 'minimum utile',
      resourcePackage: '1 équipe + jalon avancé',
      action: 'Lancer le paquet minimal maintenant, puis garder une option de renfort si la deadline reste serrée.',
    },
    insufficient: {
      state: 'insufficient-minimum',
      level: 'minimum insuffisant',
      resourcePackage: 'paquet minimal + arbitrage requis',
      action: 'Ne pas compter sur le minimum seul; escalader ressource ou réduire le périmètre avant exécution.',
    },
  };
  const selectedPackage = packageByOutcome[topBoost.outcome] ?? packageByOutcome.insufficient;

  return {
    state: selectedPackage.state,
    hint: {
      provinceId: topBoost.provinceId,
      provinceLabel: topBoost.provinceLabel,
      deadline: topBoost.deadline,
      outcome: topBoost.outcome,
      level: selectedPackage.level,
      resourcePackage: selectedPackage.resourcePackage,
      action: selectedPackage.action,
      reliefBand: topBoost.reliefBand,
      reliefScore: topBoost.reliefScore,
    },
    summary: `${topBoost.provinceLabel}: paquet ${selectedPackage.level} pour maximiser le relief deadline sans dupliquer le ranking.`,
  };
}

function renderAtlasClimateMinimumViableBoostHint(view) {
  if (state.activeOverlaySlot !== 'climate-overlay' || view.state === 'empty' || !view.hint) {
    return '';
  }

  return `
    <aside class="map-world-climate-minimum-boost map-world-climate-minimum-boost--${view.state}" aria-label="Indice de boost readiness climat minimum viable">
      <div class="map-world-climate-minimum-boost__header">
        <strong>Minimum viable boost</strong>
        <span>${view.hint.level}</span>
      </div>
      <p>${view.summary}</p>
      <small><b>${view.hint.provinceLabel}</b> · ${view.hint.deadline} · ${view.hint.resourcePackage}</small>
      <small><b>Action</b> · ${view.hint.action}</small>
      <small><b>Relief attendu</b> · ${view.hint.reliefBand} (${view.hint.reliefScore})</small>
    </aside>
  `;
}

function buildAtlasClimateMinimumBoostDeadlineMissWarning(minimumBoostView) {
  if (!minimumBoostView || minimumBoostView.state === 'empty' || !minimumBoostView.hint) {
    return {
      state: 'empty',
      warning: null,
      summary: 'Aucun warning deadline: aucun minimum viable boost éligible.',
    };
  }

  if (minimumBoostView.state === 'minimal-sufficient') {
    return {
      state: 'recovered-in-time',
      warning: null,
      summary: 'Le minimum viable boost récupère la fenêtre deadline à temps.',
    };
  }

  if (minimumBoostView.state === 'insufficient-minimum') {
    return {
      state: 'insufficient-even-at-minimum',
      warning: null,
      summary: 'Le minimum est déjà insuffisant: l’alerte dédiée reste portée par le hint minimum viable.',
    };
  }

  const missType = /jalon avancé|serrée|still-tight|minimum utile/i.test(`${minimumBoostView.hint.resourcePackage} ${minimumBoostView.hint.action} ${minimumBoostView.hint.outcome} ${minimumBoostView.hint.level}`)
    ? 'misses-by-one-turn'
    : 'misses-by-capacity-gap';
  const reason = missType === 'misses-by-one-turn'
    ? 'Le boost améliore le timing mais laisse un tour de marge manquant avant la fenêtre critique.'
    : 'Le boost améliore la pression mais laisse une capacité de readiness sous le seuil exécutable.';

  return {
    state: missType,
    warning: {
      provinceId: minimumBoostView.hint.provinceId,
      provinceLabel: minimumBoostView.hint.provinceLabel,
      deadline: minimumBoostView.hint.deadline,
      resourcePackage: minimumBoostView.hint.resourcePackage,
      reason,
      nextStep: missType === 'misses-by-one-turn'
        ? 'Avancer l’ordre au tour courant ou ajouter un tampon de calendrier.'
        : 'Ajouter une capacité ciblée ou réduire le périmètre avant validation.',
    },
    summary: `${minimumBoostView.hint.provinceLabel}: minimum viable utile, mais deadline encore à risque après boost.`,
  };
}

function renderAtlasClimateMinimumBoostDeadlineMissWarning(view) {
  if (state.activeOverlaySlot !== 'climate-overlay' || !view.warning || !/^misses-by-/.test(view.state)) {
    return '';
  }

  return `
    <aside class="map-world-climate-minimum-boost-miss map-world-climate-minimum-boost-miss--${view.state}" aria-label="Alerte deadline encore manquée après minimum viable boost climat">
      <div class="map-world-climate-minimum-boost-miss__header">
        <strong>Deadline encore risquée</strong>
        <span>${view.state === 'misses-by-one-turn' ? 'manque 1 tour' : 'capacité courte'}</span>
      </div>
      <p>${view.summary}</p>
      <small><b>${view.warning.provinceLabel}</b> · ${view.warning.deadline} · ${view.warning.resourcePackage}</small>
      <small><b>Pourquoi</b> · ${view.warning.reason}</small>
      <small><b>À sécuriser</b> · ${view.warning.nextStep}</small>
    </aside>
  `;
}

function buildAtlasClimateDeadlineRecoveryAction(deadlineWarningView) {
  if (!deadlineWarningView || !deadlineWarningView.warning || !/^misses-by-/.test(deadlineWarningView.state)) {
    return {
      state: 'no-recovery-action',
      action: null,
      summary: 'Aucune action recovery climat: la deadline est récupérée, insuffisante par design, ou aucun boost n’est éligible.',
    };
  }

  const warning = deadlineWarningView.warning;
  const actionType = deadlineWarningView.state === 'misses-by-one-turn'
    ? 'shift-execution-earlier'
    : /capacité ciblée|capacité courte|readiness sous le seuil/i.test(`${warning.nextStep} ${warning.reason}`)
      ? 'add-secondary-boost'
      : /réduire le périmètre|exposition/i.test(`${warning.nextStep} ${warning.reason}`)
        ? 'reduce-exposure-first'
        : 'accept-missed-deadline-risk';
  const actionLabel = actionType === 'shift-execution-earlier'
    ? 'Avancer exécution'
    : actionType === 'add-secondary-boost'
      ? 'Ajouter boost secondaire'
      : actionType === 'reduce-exposure-first'
        ? 'Réduire exposition d’abord'
        : 'Accepter risque deadline';
  const instruction = actionType === 'shift-execution-earlier'
    ? 'Jouer le paquet minimum au tour courant et déplacer le jalon climat avant la fenêtre critique.'
    : actionType === 'add-secondary-boost'
      ? 'Ajouter une capacité readiness ciblée au paquet minimum avant de confirmer l’exécution.'
      : actionType === 'reduce-exposure-first'
        ? 'Réduire le périmètre exposé avant d’appliquer le boost pour rendre la deadline atteignable.'
        : 'Marquer le risque comme accepté et éviter d’investir des ressources impossibles avant la deadline.';

  return {
    state: 'recoverable',
    action: {
      provinceId: warning.provinceId,
      provinceLabel: warning.provinceLabel,
      deadline: warning.deadline,
      type: actionType,
      label: actionLabel,
      instruction,
      tiedWarning: warning.reason,
    },
    summary: `${warning.provinceLabel}: action recovery proposée pour transformer l’alerte deadline en choix jouable.`,
  };
}

function renderAtlasClimateDeadlineRecoveryAction(view) {
  if (state.activeOverlaySlot !== 'climate-overlay' || view.state !== 'recoverable' || !view.action) {
    return '';
  }

  return `
    <aside class="map-world-climate-deadline-recovery map-world-climate-deadline-recovery--${view.action.type}" aria-label="Action recovery pour deadline climat encore risquée">
      <div class="map-world-climate-deadline-recovery__header">
        <strong>Recovery deadline</strong>
        <span>${view.action.label}</span>
      </div>
      <p>${view.summary}</p>
      <small><b>${view.action.provinceLabel}</b> · ${view.action.deadline} · ${view.action.type}</small>
      <small><b>Action compacte</b> · ${view.action.instruction}</small>
      <small><b>Liée au warning</b> · ${view.action.tiedWarning}</small>
    </aside>
  `;
}

function buildAtlasClimateRecoveryCollateralReliefRanking(recoveryActionView) {
  if (!recoveryActionView || recoveryActionView.state !== 'recoverable' || !recoveryActionView.action) {
    return {
      state: 'empty',
      rankedActions: [],
      rejectedAlternative: null,
      summary: 'Aucun ranking relief collatéral: aucune action recovery réelle proposée.',
    };
  }

  const action = recoveryActionView.action;
  const reliefProfiles = {
    'shift-execution-earlier': {
      collateralRelief: 'améliore deadline',
      reliefScore: 78,
      tiebreaker: 3,
      rationale: 'Récupère le tour manquant sans consommer une capacité secondaire incertaine.',
      rejectedType: 'add-secondary-boost',
      rejectedReason: 'Rejeté: libère moins vite la deadline que le déplacement immédiat du jalon.',
    },
    'add-secondary-boost': {
      collateralRelief: 'libère capacité',
      reliefScore: 74,
      tiebreaker: 2,
      rationale: 'Ajoute seulement la capacité ciblée déjà signalée et réduit le risque de cascade readiness.',
      rejectedType: 'reduce-exposure-first',
      rejectedReason: 'Rejeté: réduit l’exposition mais laisse la capacité courte avant exécution.',
    },
    'reduce-exposure-first': {
      collateralRelief: 'réduit exposition régionale',
      reliefScore: 70,
      tiebreaker: 1,
      rationale: 'Soulage l’exposition régionale avant de réengager le paquet de boost minimal.',
      rejectedType: 'accept-missed-deadline-risk',
      rejectedReason: 'Rejeté: accepter le risque ne retire aucune pression régionale sûre.',
    },
    'accept-missed-deadline-risk': {
      collateralRelief: 'aucun relief sûr',
      reliefScore: 24,
      tiebreaker: 0,
      rationale: 'À garder seulement quand les signaux existants ne justifient pas de ressource supplémentaire.',
      rejectedType: 'add-secondary-boost',
      rejectedReason: 'Rejeté: impossible de recommander une ressource non confirmée par les signaux readiness.',
    },
  };
  const selected = reliefProfiles[action.type] ?? reliefProfiles['accept-missed-deadline-risk'];
  const rankedActions = [{
    rank: 1,
    provinceId: action.provinceId,
    provinceLabel: action.provinceLabel,
    deadline: action.deadline,
    type: action.type,
    label: action.label,
    collateralRelief: selected.collateralRelief,
    reliefScore: selected.reliefScore,
    tiebreaker: selected.tiebreaker,
    rationale: selected.rationale,
  }];
  const rejectedAlternative = {
    type: selected.rejectedType,
    reason: selected.rejectedReason,
  };

  return {
    state: selected.collateralRelief === 'aucun relief sûr' ? 'no-safe-relief' : 'ranked',
    rankedActions,
    rejectedAlternative,
    summary: `${action.provinceLabel}: ${action.label} classée en tête par relief collatéral (${selected.collateralRelief}, score ${selected.reliefScore}, tie-break ${selected.tiebreaker}).`,
  };
}

function renderAtlasClimateRecoveryCollateralReliefRanking(view) {
  if (state.activeOverlaySlot !== 'climate-overlay' || view.state === 'empty' || view.rankedActions.length === 0) {
    return '';
  }

  const topAction = view.rankedActions[0];
  return `
    <aside class="map-world-climate-recovery-relief-ranking map-world-climate-recovery-relief-ranking--${view.state}" aria-label="Ranking des actions recovery climat par relief collatéral">
      <div class="map-world-climate-recovery-relief-ranking__header">
        <strong>Relief collatéral recovery</strong>
        <span>${topAction.collateralRelief}</span>
      </div>
      <p>${view.summary}</p>
      <small><b>Top action</b> · ${topAction.label} (${topAction.type}) · score ${topAction.reliefScore}</small>
      <small><b>Pourquoi</b> · ${topAction.rationale}</small>
      ${view.rejectedAlternative ? `<small><b>Alternative rejetée</b> · ${view.rejectedAlternative.type}: ${view.rejectedAlternative.reason}</small>` : ''}
    </aside>
  `;
}

function buildAtlasClimateFirstRecoveryPressureReliefExplanation(recoveryReliefRankingView) {
  if (!recoveryReliefRankingView || recoveryReliefRankingView.state === 'empty' || !recoveryReliefRankingView.rankedActions?.length) {
    return {
      state: 'empty',
      explanation: null,
      summary: 'Aucune micro-explication pressure relief: aucune top recovery action réelle.',
    };
  }

  const topAction = recoveryReliefRankingView.rankedActions[0];
  const reliefSignals = {
    'améliore deadline': {
      state: 'deadline-less-tight',
      indicator: 'deadline moins serrée',
      firstVisibleRelief: 'La fenêtre critique devrait perdre un tour de pression avant les autres jauges.',
      tiebreaker: 3,
    },
    'libère capacité': {
      state: 'capacity-freed',
      indicator: 'capacité régionale libérée',
      firstVisibleRelief: 'La jauge readiness devrait repasser au-dessus du seuil d’exécution ciblé.',
      tiebreaker: 2,
    },
    'réduit exposition régionale': {
      state: 'exposure-reduced',
      indicator: 'exposition réduite',
      firstVisibleRelief: 'Le premier signal visible devrait être une exposition régionale moins prioritaire.',
      tiebreaker: 1,
    },
    'aucun relief sûr': {
      state: 'no-safe-relief',
      indicator: 'aucun relief sûr',
      firstVisibleRelief: 'Aucun indicateur ne devrait être promis; le risque reste explicitement accepté.',
      tiebreaker: 0,
    },
  };
  const selected = reliefSignals[topAction.collateralRelief] ?? reliefSignals['aucun relief sûr'];

  return {
    state: selected.state,
    explanation: {
      provinceId: topAction.provinceId,
      provinceLabel: topAction.provinceLabel,
      deadline: topAction.deadline,
      actionType: topAction.type,
      actionLabel: topAction.label,
      indicator: selected.indicator,
      firstVisibleRelief: selected.firstVisibleRelief,
      reliefScore: topAction.reliefScore,
      tiebreaker: selected.tiebreaker,
    },
    summary: `${topAction.provinceLabel}: premier relief attendu après ${topAction.label} — ${selected.indicator}.`,
  };
}

function renderAtlasClimateFirstRecoveryPressureReliefExplanation(view) {
  if (state.activeOverlaySlot !== 'climate-overlay' || view.state === 'empty' || !view.explanation) {
    return '';
  }

  return `
    <aside class="map-world-climate-first-recovery-relief map-world-climate-first-recovery-relief--${view.state}" aria-label="Première pression soulagée après recovery climat">
      <div class="map-world-climate-first-recovery-relief__header">
        <strong>Premier relief visible</strong>
        <span>${view.explanation.indicator}</span>
      </div>
      <p>${view.summary}</p>
      <small><b>${view.explanation.provinceLabel}</b> · ${view.explanation.deadline} · ${view.explanation.actionType}</small>
      <small><b>Signal attendu</b> · ${view.explanation.firstVisibleRelief}</small>
      <small><b>Score source</b> · ${view.explanation.reliefScore}, tie-break ${view.explanation.tiebreaker}</small>
    </aside>
  `;
}

function buildAtlasClimateRecoveryPlanProjection(firstReliefView, recoveryRankingView) {
  if (!firstReliefView || firstReliefView.state === 'empty' || !firstReliefView.explanation) {
    return {
      state: 'neutral',
      projection: null,
      remainingRisks: [],
      summary: 'Aucune projection recovery climat: aucune anomalie, catastrophe ou action recovery active à projeter.',
    };
  }

  const relief = firstReliefView.explanation;
  const topAction = recoveryRankingView?.rankedActions?.[0] ?? { label: relief.actionLabel, type: relief.actionType, rationale: 'Action recovery issue du relief principal.' };
  const remainingRiskCandidates = [
    { key: 'deadline-monitoring', label: 'deadline à surveiller', priority: relief.indicator === 'deadline moins serrée' ? 3 : 1 },
    { key: 'cascade-watch', label: 'cascade évitée à confirmer', priority: relief.indicator === 'capacité régionale libérée' ? 1 : 2 },
    { key: 'exposure-tail', label: 'exposition résiduelle', priority: relief.indicator === 'exposition réduite' ? 3 : 2 },
    { key: 'accepted-risk', label: 'risque accepté sans relief sûr', priority: relief.indicator === 'aucun relief sûr' ? 0 : 4 },
  ]
    .filter((risk) => risk.priority < 4)
    .sort((left, right) => left.priority - right.priority || left.label.localeCompare(right.label));

  return {
    state: firstReliefView.state === 'no-safe-relief' ? 'projected-with-risk' : 'projected',
    projection: {
      provinceId: relief.provinceId,
      provinceLabel: relief.provinceLabel,
      deadline: relief.deadline,
      currentState: `Avant: ${relief.deadline}, pression recovery encore active.`,
      proposedActions: [`${topAction.label} (${topAction.type})`],
      projectedState: `Après: ${relief.indicator}; ${relief.firstVisibleRelief}`,
      firstPressureRelieved: relief.indicator,
      sourceScore: relief.reliefScore,
      tiebreaker: relief.tiebreaker,
    },
    remainingRisks: remainingRiskCandidates,
    summary: `${relief.provinceLabel}: projection avant/après courte avec ${relief.indicator} en premier relief et ${remainingRiskCandidates.length} risque${remainingRiskCandidates.length > 1 ? 's' : ''} restant${remainingRiskCandidates.length > 1 ? 's' : ''} trié${remainingRiskCandidates.length > 1 ? 's' : ''}.`,
  };
}

function renderAtlasClimateRecoveryPlanProjection(view) {
  if (state.activeOverlaySlot !== 'climate-overlay' || view.state === 'neutral' || !view.projection) {
    return '';
  }

  return `
    <aside class="map-world-climate-recovery-projection map-world-climate-recovery-projection--${view.state}" aria-label="Projection avant après du plan recovery climat">
      <div class="map-world-climate-recovery-projection__header">
        <strong>Projection recovery</strong>
        <span>${view.projection.firstPressureRelieved}</span>
      </div>
      <p>${view.summary}</p>
      <small><b>Avant</b> · ${view.projection.currentState}</small>
      <small><b>Action proposée</b> · ${view.projection.proposedActions.join(' · ')}</small>
      <small><b>Après</b> · ${view.projection.projectedState}</small>
      <small><b>Risques restants</b> · ${view.remainingRisks.map((risk) => risk.label).join(' → ')}</small>
      <small><b>Score source</b> · ${view.projection.sourceScore}, tie-break ${view.projection.tiebreaker}</small>
    </aside>
  `;
}

function buildRemainingDeadlinePressureAfterCommitment(projection, remainingRisks, pressureReduced) {
  const unresolvedRisks = remainingRisks.map((risk) => risk.label);
  const deadlineRisk = remainingRisks.find((risk) => risk.key === 'deadline-monitoring') ?? null;
  const nextUnresolvedRisk = remainingRisks[0] ?? null;
  const deadlineStillThreatened = deadlineRisk ? projection.deadline : null;
  const state = deadlineStillThreatened
    ? 'deadline-watch'
    : remainingRisks.length > 0
      ? 'residual-watch'
      : 'clear';
  const nextAction = deadlineStillThreatened
    ? `Confirmer un second jalon avant ${projection.deadline}.`
    : nextUnresolvedRisk
      ? `Surveiller ${nextUnresolvedRisk.label}.`
      : 'Aucune action deadline immédiate.';

  return {
    state,
    deadlineCovered: projection.deadline,
    deadlineStillThreatened,
    pressureReduced,
    resolvedByCommitment: [projection.deadline, pressureReduced],
    unresolvedAfterCommitment: unresolvedRisks,
    nextAction,
    reason: deadlineStillThreatened
      ? `${projection.deadline} est couverte mais reste à confirmer après l’engagement minimal.`
      : remainingRisks.length > 0
        ? `La deadline couverte laisse ${remainingRisks.length} pression${remainingRisks.length > 1 ? 's' : ''} hors deadline à suivre.`
        : 'La deadline couverte ne laisse aucune pression visible dans cette projection.',
  };
}

function buildNextClimateCommitmentAfterResidualPressure(cheapestSafeCommitment, remainingDeadlinePressure) {
  if (!cheapestSafeCommitment || !remainingDeadlinePressure || !remainingDeadlinePressure.deadlineStillThreatened) {
    return null;
  }

  const remainingRisks = remainingDeadlinePressure.unresolvedAfterCommitment ?? [];
  const riskIfDeferred = remainingRisks.length > 0
    ? `${remainingRisks[0]} peut rester prioritaire et repousser la stabilisation de ${remainingDeadlinePressure.deadlineStillThreatened}.`
    : `La confirmation de ${remainingDeadlinePressure.deadlineStillThreatened} peut manquer malgré l’engagement minimal.`;
  const remainsAfter = remainingRisks
    .filter((risk) => risk !== 'deadline à surveiller')
    .slice(0, 2);

  return {
    deadlineTargeted: remainingDeadlinePressure.deadlineStillThreatened,
    action: `Second engagement climat: ${remainingDeadlinePressure.nextAction}`,
    avoidsRepeating: cheapestSafeCommitment.action,
    cost: cheapestSafeCommitment.cost === 'faible' ? 'modéré' : 'ciblé',
    effortScore: cheapestSafeCommitment.effortScore + 1,
    pressureReduced: 'deadline confirmée',
    riskIfDeferred,
    remainsAfterCommitment: remainsAfter,
    reason: `Après l’engagement minimal, cibler ${remainingDeadlinePressure.deadlineStillThreatened} réduit la pression deadline restante sans répéter ${cheapestSafeCommitment.pressureReduced}.`,
  };
}

function buildAtlasClimateCheapestSafeRecoveryCommitment(recoveryProjectionView) {
  if (!recoveryProjectionView || recoveryProjectionView.state === 'neutral' || !recoveryProjectionView.projection) {
    return {
      state: 'neutral',
      cheapestSafeCommitment: null,
      remainingDeadlinePressure: null,
      nextClimateCommitment: null,
      summary: 'Aucun engagement climat minimal sûr: aucun plan recovery actif à démarrer.',
    };
  }

  const projection = recoveryProjectionView.projection;
  const remainingRisks = recoveryProjectionView.remainingRisks ?? [];
  const effortByRelief = {
    'deadline moins serrée': { cost: 'faible', effortScore: 1, safeBecause: 'déplace seulement le jalon déjà recommandé sans engager de capacité secondaire.' },
    'capacité régionale libérée': { cost: 'modéré', effortScore: 2, safeBecause: 'engage une capacité ciblée déjà signalée par la projection recovery.' },
    'exposition réduite': { cost: 'modéré', effortScore: 2, safeBecause: 'réduit d’abord le périmètre exposé sans inventer de nouvelle ressource.' },
    'aucun relief sûr': { cost: 'minimal', effortScore: 0, safeBecause: 'ne promet aucun relief non confirmé et limite l’engagement à l’acceptation explicite du risque.' },
  };
  const selected = effortByRelief[projection.firstPressureRelieved] ?? effortByRelief['aucun relief sûr'];
  const unresolvedRisk = remainingRisks[0]?.label ?? 'risque résiduel à surveiller';
  const remainingDeadlinePressure = buildRemainingDeadlinePressureAfterCommitment(
    projection,
    remainingRisks,
    projection.firstPressureRelieved,
  );

  const cheapestSafeCommitment = {
    provinceId: projection.provinceId,
    provinceLabel: projection.provinceLabel,
    action: projection.proposedActions[0] ?? 'Démarrer le plan recovery minimal.',
    cost: selected.cost,
    effortScore: selected.effortScore,
    deadlineCovered: projection.deadline,
    pressureReduced: projection.firstPressureRelieved,
    stillActiveRisk: unresolvedRisk,
    safeBecause: selected.safeBecause,
    doesNotSolve: `Ne résout pas encore: ${unresolvedRisk}.`,
    remainingDeadlinePressure,
  };
  const nextClimateCommitment = buildNextClimateCommitmentAfterResidualPressure(
    cheapestSafeCommitment,
    remainingDeadlinePressure,
  );

  return {
    state: projection.firstPressureRelieved === 'aucun relief sûr' ? 'safe-but-risky' : 'recommended',
    cheapestSafeCommitment,
    remainingDeadlinePressure,
    nextClimateCommitment,
    summary: `${projection.provinceLabel}: engagement sûr le moins coûteux — ${selected.cost}, couvre ${projection.deadline} et réduit ${projection.firstPressureRelieved}.`,
  };
}

function renderAtlasClimateCheapestSafeRecoveryCommitment(view) {
  if (state.activeOverlaySlot !== 'climate-overlay' || view.state === 'neutral' || !view.cheapestSafeCommitment) {
    return '';
  }

  const commitment = view.cheapestSafeCommitment;
  return `
    <aside class="map-world-climate-cheapest-commitment map-world-climate-cheapest-commitment--${view.state}" aria-label="Engagement recovery climat minimal sûr">
      <div class="map-world-climate-cheapest-commitment__header">
        <strong>Engagement sûr minimal</strong>
        <span>${commitment.cost} · effort ${commitment.effortScore}</span>
      </div>
      <p>${view.summary}</p>
      <small><b>Action</b> · ${commitment.action}</small>
      <small><b>Deadline couverte</b> · ${commitment.deadlineCovered}</small>
      <small><b>Pression réduite</b> · ${commitment.pressureReduced}</small>
      <small><b>Pression deadline restante</b> · ${view.remainingDeadlinePressure.reason}</small>
      <small><b>Prochaine action</b> · ${view.remainingDeadlinePressure.nextAction}</small>
      ${view.nextClimateCommitment ? `<small><b>Prochain engagement</b> · ${view.nextClimateCommitment.action} · ${view.nextClimateCommitment.cost}, effort ${view.nextClimateCommitment.effortScore}</small>` : ''}
      ${view.nextClimateCommitment ? `<small><b>Si différé</b> · ${view.nextClimateCommitment.riskIfDeferred}</small>` : ''}
      ${view.nextClimateCommitment ? `<small><b>Après lui</b> · ${view.nextClimateCommitment.remainsAfterCommitment.length > 0 ? view.nextClimateCommitment.remainsAfterCommitment.join(' → ') : 'aucune pression deadline visible'}</small>` : ''}
      <small><b>Pourquoi sûr</b> · ${commitment.safeBecause}</small>
      <small><b>Reste actif</b> · ${commitment.doesNotSolve}</small>
    </aside>
  `;
}

function renderAtlasClimateUnderReadyExecutionGaps(view) {
  if (state.activeOverlaySlot !== 'climate-overlay' || view.state !== 'warning') {
    return '';
  }

  return `
    <section class="map-world-climate-under-ready" aria-label="Déficits d’exécution des plans climat urgents">
      <div class="map-world-climate-under-ready__header">
        <strong>Plans climat sous-prêts</strong>
        <span>${view.gaps.length} déficit${view.gaps.length > 1 ? 's' : ''}</span>
      </div>
      <p>${view.summary}</p>
      <ol class="map-world-climate-under-ready__list">
        ${view.gaps.map((gap) => `
          <li class="map-world-climate-under-ready__item map-world-climate-under-ready__item--${gap.status}">
            <b>${gap.provinceLabel}</b>
            <span>${gap.deadline} · écart ${gap.gapType}</span>
            <small><b>Manque concret</b> · ${gap.shortfall}</small>
            <small><b>Risque exécution</b> · ${gap.consequence}</small>
          </li>
        `).join('')}
      </ol>
    </section>
  `;
}

function renderAtlasClimateMitigationReadinessComparison(view) {
  if (state.activeOverlaySlot !== 'climate-overlay' || view.state === 'empty') {
    return '';
  }

  return `
    <section class="map-world-climate-readiness map-world-climate-readiness--${view.state}" aria-label="Comparaison readiness mitigation climat atlas">
      <div class="map-world-climate-readiness__header">
        <strong>Readiness mitigation climat</strong>
        <span>${view.state === 'timing-risk' ? 'timing à risque' : 'timing couvert'}</span>
      </div>
      <p>${view.summary}</p>
      <ol class="map-world-climate-readiness__list">
        ${view.regions.map((region) => `
          <li class="map-world-climate-readiness__item map-world-climate-readiness__item--${region.status}">
            <b>${region.provinceLabel}</b>
            <span>${region.deadline} · ${region.mitigationAvailable}</span>
            <small><b>Cascade</b> · ${region.cascadeRisk}</small>
            <small><b>Exposition</b> · ${region.exposure}</small>
            <small><b>Problème timing</b> · ${region.timingProblem}</small>
          </li>
        `).join('')}
      </ol>
    </section>
  `;
}

function renderAtlasClimateActionUrgencyTimeline(view) {
  if (state.activeOverlaySlot !== 'climate-overlay' || view.state === 'empty') {
    return '';
  }

  return `
    <section class="map-world-climate-action-timeline map-world-climate-action-timeline--${view.state}" aria-label="Timeline d’urgence des plans d’action climat">
      <div class="map-world-climate-action-timeline__header">
        <strong>Timeline d’urgence climat</strong>
        <span>${view.steps[0]?.provinceLabel ?? 'à confirmer'} ensuite</span>
      </div>
      <p>${view.summary}</p>
      <ol class="map-world-climate-action-timeline__list">
        ${view.steps.map((step) => `
          <li class="map-world-climate-action-timeline__step map-world-climate-action-timeline__step--${step.intensity}">
            <b>${step.priorityRank}. ${step.deadline} · ${step.provinceLabel}</b>
            <span>${step.action}</span>
            <small><b>Pourquoi ensuite</b> · ${step.reason}</small>
            <small><b>Exposition</b> · ${step.exposure}</small>
            <small><b>Dépendance/synergie</b> · ${step.dependency}</small>
            ${step.noCloseWindowAlert ? `<small class="map-world-climate-action-timeline__alert"><b>Sans fenêtre proche</b> · ${step.noCloseWindowAlert}</small>` : ''}
          </li>
        `).join('')}
      </ol>
    </section>
  `;
}

function renderAtlasClimateActionPlan(view) {
  if (state.activeOverlaySlot !== 'climate-overlay' || view.state === 'empty') {
    return '';
  }

  const plan = view.selectedPlan;

  return `
    <section class="map-world-climate-action-plan map-world-climate-action-plan--${view.state}" aria-label="Plan d’action climatique converti depuis la comparaison saisonnière">
      <div class="map-world-climate-action-plan__header">
        <strong>Plan d’action climat</strong>
        <span>${plan.provinceLabel} · ${plan.criticalSeason}</span>
      </div>
      <p>${view.summary}</p>
      <div class="map-world-climate-action-plan__card">
        <b>${plan.action}</b>
        <small><b>Saison/fenêtre</b> · ${plan.criticalSeason}</small>
        <small><b>Régions touchées</b> · ${plan.protectedRegions}</small>
        <small><b>Cascade évitée/réduite</b> · ${plan.avoidedCascade}</small>
        <small><b>Coût/compromis</b> · ${plan.verdict}; ${plan.delayedCascade}</small>
        ${view.vulnerablePlans.length > 0 ? `<small><b>Vulnérable</b> · ${view.vulnerablePlans.map((vulnerable) => `${vulnerable.provinceLabel}: ${vulnerable.probableCascade}`).join(' · ')}</small>` : ''}
      </div>
    </section>
  `;
}

function renderAtlasSeasonalMitigationPlanComparison(view) {
  if (state.activeOverlaySlot !== 'climate-overlay' || view.state === 'empty') {
    return '';
  }

  return `
    <section class="map-world-climate-plan-compare map-world-climate-plan-compare--${view.state}" aria-label="Comparaison des plans saisonniers de mitigation climat">
      <div class="map-world-climate-plan-compare__header">
        <strong>Plans saisonniers comparés</strong>
        <span>${view.bestPlan ? `Choix: ${view.bestPlan.provinceLabel}` : 'Compromis à arbitrer'}</span>
      </div>
      <p>${view.summary}</p>
      <ol class="map-world-climate-plan-compare__list">
        ${view.plans.map((plan) => `
          <li class="map-world-climate-plan-compare__item map-world-climate-plan-compare__item--${plan.intensity} ${view.bestPlan?.provinceId === plan.provinceId ? 'is-best' : ''}">
            <b>${plan.planRank}. ${plan.provinceLabel}</b>
            <span>${plan.action} · ${plan.verdict} · saison ${plan.criticalSeason}</span>
            <small><b>Évitée</b> · ${plan.avoidedCascade}</small>
            <small><b>Retardée</b> · ${plan.delayedCascade}</small>
            <small><b>Encore probable</b> · ${plan.probableCascade}</small>
          </li>
        `).join('')}
      </ol>
    </section>
  `;
}

function renderAtlasSeasonalMitigationWindows(view) {
  if (state.activeOverlaySlot !== 'climate-overlay' || view.state === 'empty') {
    return '';
  }

  if (view.state === 'quiet') {
    return `
      <section class="map-world-climate-window map-world-climate-window--quiet" aria-label="Fenêtres saisonnières de mitigation climat atlas">
        <strong>Fenêtres saisonnières</strong>
        <p>${view.summary}</p>
      </section>
    `;
  }

  return `
    <section class="map-world-climate-window map-world-climate-window--${view.state}" aria-label="Fenêtres saisonnières de mitigation climat atlas">
      <div class="map-world-climate-window__header">
        <strong>Fenêtres saisonnières</strong>
        <span>${view.windows.length} priorité${view.windows.length > 1 ? 's' : ''} climat</span>
      </div>
      <p>${view.summary}</p>
      <ol class="map-world-climate-window__list">
        ${view.windows.map((window) => `
          <li class="map-world-climate-window__item map-world-climate-window__item--${window.intensity}">
            <b>${window.provinceLabel}</b>
            <span>${window.action} · saison critique: ${window.criticalSeason}</span>
            <small><b>Impact évité</b> · ${window.avoidedImpact}</small>
            <small><b>Si reportée</b> · ${window.deferredConsequence}</small>
            <div class="map-world-climate-window__badges">${window.badges.map((badge) => `<small>${badge}</small>`).join('')}</div>
          </li>
        `).join('')}
      </ol>
    </section>
  `;
}

function renderAtlasClimateMitigationSynergies(view) {
  if (state.activeOverlaySlot !== 'climate-overlay' || view.state === 'empty') {
    return '';
  }

  if (view.state === 'quiet') {
    return `
      <section class="map-world-climate-synergy map-world-climate-synergy--quiet" aria-label="Synergies de mitigation climat atlas">
        <strong>Synergies climat</strong>
        <p>${view.summary}</p>
      </section>
    `;
  }

  return `
    <section class="map-world-climate-synergy map-world-climate-synergy--${view.state}" aria-label="Synergies de mitigation climat atlas">
      <div class="map-world-climate-synergy__header">
        <strong>Synergies climat</strong>
        <span>${view.synergies.length} mitigation${view.synergies.length > 1 ? 's' : ''} multi-effet</span>
      </div>
      <p>${view.summary}</p>
      <ol class="map-world-climate-synergy__list">
        ${view.synergies.map((entry) => `
          <li class="map-world-climate-synergy__item map-world-climate-synergy__item--${entry.intensity}">
            <b>${entry.provinceLabel}</b>
            <span>${entry.summary}</span>
            <div class="map-world-climate-synergy__badges">
              ${entry.badges.map((badge) => `<small>${badge}</small>`).join('')}
            </div>
            <small><b>Routes/régions</b> · ${entry.routeImpact} · régions protégées: ${entry.protectedRegions}</small>
          </li>
        `).join('')}
      </ol>
    </section>
  `;
}

function renderAtlasClimateCascadeImpactPreview(preview) {
  if (state.activeOverlaySlot !== 'climate-overlay') {
    return '';
  }

  if (preview.state === 'empty') {
    return `
      <section class="map-world-climate-cascade map-world-climate-cascade--empty" aria-label="Aperçu des cascades climat atlas">
        <strong>Cascades climat atlas</strong>
        <p>${preview.summary}</p>
      </section>
    `;
  }

  return `
    <section class="map-world-climate-cascade map-world-climate-cascade--${preview.state}" aria-label="Aperçu des cascades climat atlas">
      <div class="map-world-climate-cascade__header">
        <strong>Cascades climat atlas</strong>
        <span>${preview.impacts.length} impact${preview.impacts.length > 1 ? 's' : ''} route/région</span>
      </div>
      <p>${preview.summary}</p>
      <ol class="map-world-climate-cascade__list">
        ${preview.impacts.map((impact) => `
          <li class="map-world-climate-cascade__item map-world-climate-cascade__item--${impact.intensity}">
            <b>${impact.provinceLabel}</b>
            <span>${impact.regionImpact}</span>
            <small><b>Routes</b> · ${impact.routeImpact}</small>
            <small><b>Horizon</b> · ${impact.horizon} · confiance ${impact.confidence}</small>
            <small>${impact.reason}</small>
          </li>
        `).join('')}
      </ol>
    </section>
  `;
}

function renderWorldClimateLayerSummary(layer) {
  if (state.activeOverlaySlot !== 'climate-overlay') {
    return '';
  }

  const highlighted = (layer.timeline.mode === 'short-alert'
    ? layer.timeline.urgentCurrentEntries.concat(layer.timeline.decisionChanges)
    : layer.timeline.decisionChanges.length > 0
      ? layer.timeline.decisionChanges
      : layer.entries.filter((entry) => entry.disaster || entry.anomaly))
    .filter((entry, index, all) => all.findIndex((candidate) => candidate.provinceId === entry.provinceId) === index)
    .slice(0, 3);

  return `
    <section class="map-world-climate" aria-label="Lecture monde des saisons biomes et catastrophes">
      <div class="map-world-climate__header">
        <strong>Carte monde climat · ${layer.season}</strong>
        <span>${layer.biomeCount} biomes · ${layer.disasterCount} catastrophes · ${layer.anomalyCount} anomalies</span>
      </div>
      ${renderAtlasClimateForecastToggles(layer)}
      <p>${layer.summary}</p>
      <ul class="map-world-climate__list">
        ${(highlighted.length > 0 ? highlighted : layer.entries.slice(0, 3)).map((entry) => `
          <li class="map-world-climate__item map-world-climate__item--${entry.tone}">
            <b>${entry.provinceLabel}</b>
            <span>${entry.summary}</span>
            <small>${entry.decisionReason ?? entry.detail}</small>
          </li>
        `).join('')}
      </ul>
    </section>
  `;
}

function buildClimateFollowUpDebtSummary(markers = [], mitigationSequence = []) {
  if (markers.length === 0) {
    return {
      state: 'empty',
      successfulCount: 0,
      partialCount: 0,
      debtCount: 0,
      benefits: [],
      debts: [],
      summary: 'Aucune dette climat post-résolution à suivre pour le moment.',
    };
  }

  const successfulCount = markers.filter((marker) => marker.status === 'risk-reduced').length;
  const partialMarkers = markers.filter((marker) => marker.status === 'hazard-delayed');
  const debtMarkers = markers.filter((marker) => marker.status === 'hazard-unresolved' || marker.status === 'cascade-active');
  const benefits = mitigationSequence
    .flatMap((step) => step.secondaryBenefits ?? [])
    .filter((benefit, index, all) => all.indexOf(benefit) === index)
    .slice(0, 2);
  const debts = debtMarkers
    .map((marker) => `${marker.provinceLabel}: ${marker.summary}`)
    .slice(0, 2);

  return {
    state: debtMarkers.length > 0 ? 'debt' : partialMarkers.length > 0 ? 'partial' : 'resolved',
    successfulCount,
    partialCount: partialMarkers.length,
    debtCount: debtMarkers.length,
    benefits,
    debts,
    summary: `${successfulCount} mitigation${successfulCount > 1 ? 's' : ''} réussie${successfulCount > 1 ? 's' : ''}, ${partialMarkers.length} partielle${partialMarkers.length > 1 ? 's' : ''}, ${debtMarkers.length} dette${debtMarkers.length > 1 ? 's' : ''} de suivi après résolution.`,
  };
}

function renderClimateFollowUpDebtSummary(summary) {
  if (summary.state === 'empty') {
    return '';
  }

  return `
    <section class="map-climate-follow-up-debt map-climate-follow-up-debt--${summary.state}" aria-label="Résumé des dettes de suivi climatique après résolution">
      <div>
        <strong>Dette climat après résolution</strong>
        <span>${summary.successfulCount} réussie${summary.successfulCount > 1 ? 's' : ''} · ${summary.partialCount} partielle${summary.partialCount > 1 ? 's' : ''} · ${summary.debtCount} ouverte${summary.debtCount > 1 ? 's' : ''}</span>
      </div>
      <p>${summary.summary}</p>
      <small><b>Bénéfices obtenus</b> · ${summary.benefits.length > 0 ? summary.benefits.join(' · ') : 'Aucun bénéfice cross-domain confirmé.'}</small>
      <small><b>Conséquences ouvertes</b> · ${summary.debts.length > 0 ? summary.debts.join(' · ') : 'Aucune conséquence critique ouverte; vérifier les mitigations partielles au prochain tour.'}</small>
    </section>
  `;
}

function renderClimateSeverityLegend(legend) {
  if (!legend.active || legend.entries.length === 0) {
    return '';
  }

  return `
    <section class="map-climate-severity-legend" aria-label="Légende de sévérité des marqueurs climat empilés">
      <div>
        <strong>Sévérité climat</strong>
        <span>${legend.entries.length} niveau${legend.entries.length > 1 ? 'x' : ''} · ${legend.groupedCount} agrégé${legend.groupedCount > 1 ? 's' : ''}</span>
      </div>
      <p>${legend.summary}</p>
      <ul>
        ${legend.entries.map((entry) => `
          <li class="map-climate-severity-legend__item map-climate-severity-legend__item--${entry.status}">
            <b>${entry.label}</b>
            <span>${entry.cue} · ${entry.count}</span>
            <small>${entry.detail}</small>
          </li>
        `).join('')}
      </ul>
      ${legend.cascadeGroupCount > 1 ? `<small>Groupe sélectionné: ${legend.cascadeGroupCount} provinces liées au risque principal.</small>` : '<small>Les cascades et aléas non résolus restent épinglés en priorité.</small>'}
      ${legend.mitigationSequence.length > 0 ? `
        <ol class="map-climate-severity-legend__sequence" aria-label="Séquence de mitigation climat priorisée">
          ${legend.mitigationSequence.map((step, index) => `
            <li class="map-climate-severity-legend__sequence-step map-climate-severity-legend__sequence-step--${step.status}">
              <b>${index + 1}. ${step.provinceLabel} · ${step.severityLabel}</b>
              <span>${step.action} · fenêtre ${step.window}</span>
              <small>${step.cascade} · ${step.neighborRelief}</small>
              <em>${step.secondaryBenefits.length > 0 ? step.secondaryBenefits.join(' · ') : 'Aucun bénéfice secondaire confirmé.'}</em>
            </li>
          `).join('')}
        </ol>
      ` : ''}
    </section>
  `;
}

function renderSelectedClimateCascadeGroup(group) {
  if (!group || group.markers.length <= 1) {
    return '';
  }

  return `
    <section class="map-climate-cascade-group" aria-label="Groupe de cascade climat sélectionné">
      <div>
        <strong>${group.label}</strong>
        <span>${group.markers.length} provinces liées · ${group.urgentCount} urgentes</span>
      </div>
      <p>${group.summary}</p>
      <small>Le groupe met en évidence les provinces du risque principal pendant que les autres marqueurs restent calmes.</small>
    </section>
  `;
}

function renderPostCommitClimateMarkerDetail(province, markers = []) {
  const marker = markers.find((entry) => entry.provinceId === province.provinceId) ?? null;

  if (!marker) {
    return '';
  }

  return `
    <section class="province-climate-post-commit province-climate-post-commit--${marker.status}" aria-label="Marqueur climat post-résolution">
      <div>
        <strong>${marker.label}</strong>
        <span>${marker.source === 'cumulative-summary' ? 'résumé cumulé' : 'aléa restant'}</span>
      </div>
      <p>${marker.summary}</p>
      <small>${marker.detail}</small>
    </section>
  `;
}

function renderMapClimateInterventionWindows(view) {
  if (view.windows.length === 0) {
    return `
      <section class="map-climate-windows map-climate-windows--calm" aria-label="Comparaison des fenêtres d’intervention climatique">
        <strong>Fenêtres climat</strong>
        <p>${view.summary}</p>
      </section>
    `;
  }

  return `
    <section class="map-climate-windows map-climate-windows--${view.state}" aria-label="Comparaison des fenêtres d’intervention climatique">
      <div class="map-climate-windows__header">
        <strong>Fenêtres d’intervention climat</strong>
        <span>${view.urgentCount} maintenant · ${view.windows.length - view.urgentCount} peut attendre</span>
      </div>
      <p>${view.summary}</p>
      <ol class="map-climate-windows__list">
        ${view.windows.map((window) => `
          <li class="map-climate-windows__item map-climate-windows__item--${window.deadlineState} ${window.canWait ? 'map-climate-windows__item--wait' : ''}">
            <b>${window.rank}. ${window.provinceLabel}</b>
            <span>${window.deadline} · risque ${window.riskLevel}</span>
            <small><b>Si retard</b> · ${window.delayRisk}</small>
            <small><b>Bénéfice immédiat</b> · ${window.benefit}</small>
          </li>
        `).join('')}
      </ol>
    </section>
  `;
}

function renderMapClimatePreparednessSummary(summary) {
  if (summary.warnings.length === 0) {
    return `
      <section class="map-climate-preparedness map-climate-preparedness--clear" aria-label="Résumé de préparation climatique de fin de tour">
        <strong>Préparation climat</strong>
        <p>${summary.summary}</p>
      </section>
    `;
  }

  return `
    <section class="map-climate-preparedness map-climate-preparedness--${summary.state}" aria-label="Résumé de préparation climatique de fin de tour">
      <div class="map-climate-preparedness__header">
        <strong>Préparation climat fin de tour</strong>
        <span>${summary.exposedCount} exposée${summary.exposedCount > 1 ? 's' : ''} · ${summary.mitigatedCount} mitigée${summary.mitigatedCount > 1 ? 's' : ''}</span>
      </div>
      <p>${summary.summary}</p>
      <ul class="map-climate-preparedness__list">
        ${summary.warnings.map((warning) => `
          <li class="map-climate-preparedness__item map-climate-preparedness__item--${warning.tone} map-climate-preparedness__item--${warning.riskCategory}">
            <div class="map-climate-preparedness__rank">
              <strong>${warning.rankBadge}</strong>
              <span>${warning.riskRankLabel}</span>
            </div>
            <b>${warning.provinceLabel}</b>
            <span>${warning.status}: ${warning.hazard}</span>
            <small>${warning.action} · ${warning.label}</small>
            <button
              type="button"
              data-climate-preparedness-focus="true"
              data-province-id="${warning.focusTarget.provinceId}"
              data-climate-focus-type="${warning.focusTarget.type}"
              data-climate-focus-id="${warning.focusTarget.targetId}"
              data-climate-risk-rank="${warning.riskRank}"
              data-climate-risk-category="${warning.riskCategory}"
              title="${warning.tooltip}"
              aria-label="Focaliser ${warning.focusTarget.label}: ${warning.tooltip}"
            >Voir ${warning.focusTarget.label}</button>
            <small class="map-climate-preparedness__tooltip">${warning.expectedImpact} Préparation: ${warning.preparednessAction}.</small>
          </li>
        `).join('')}
      </ul>
    </section>
  `;
}

function buildProvinceEconomyBudgetPreviewView(province, economyView, shell, focusContext, intrigueView = null) {
  const actionQueue = buildSelectedProvinceActionQueue(province, shell, focusContext, intrigueView);
  const logisticsPreview = buildProvinceLogisticsChoicePreviewView(province, economyView);

  return buildProvinceEconomyBudgetPreview(province, economyView, {
    actionQueue,
    logisticsChoices: logisticsPreview.options,
  });
}

function renderProvinceEconomyBudgetPreview(province, economyView, shell, focusContext, intrigueView = null) {
  const budget = buildProvinceEconomyBudgetPreviewView(province, economyView, shell, focusContext, intrigueView);

  if (budget.status === 'empty') {
    return `
      <section class="province-economy-budget-preview province-economy-budget-preview--empty" aria-label="Aperçu budget économie du plan de province">
        <div class="province-economy-budget-preview__header">
          <strong>Budget économie du plan</strong>
          <span>stable</span>
        </div>
        <p>${budget.summary}</p>
      </section>
    `;
  }

  return `
    <section class="province-economy-budget-preview province-economy-budget-preview--${budget.status}" aria-label="Aperçu budget économie du plan de province">
      <div class="province-economy-budget-preview__header">
        <strong>Budget économie du plan</strong>
        <span>${budget.totalCost} unités</span>
      </div>
      <p>${budget.summary}</p>
      <div class="province-economy-budget-preview__list">
        ${budget.plans.map((plan) => `
          <article class="province-economy-budget-card province-economy-budget-card--${plan.status}">
            <div class="province-economy-budget-card__title">
              <strong>${plan.logisticsAction}</strong>
              <span>${plan.status}</span>
            </div>
            <p>${plan.effect}</p>
            <dl>
              <div><dt>Action</dt><dd>${plan.actionCode ?? plan.actionLabel}</dd></div>
              <div><dt>Coût</dt><dd>${plan.consumedResources.map((resource) => `${resource.quantity} ${resource.label}`).join(', ')}</dd></div>
              <div><dt>Route</dt><dd>${plan.routeNames.join(', ') || 'hub local'}</dd></div>
              <div><dt>Hub</dt><dd>${plan.hubName}</dd></div>
              <div><dt>Stock</dt><dd>${plan.surplusOrShortage}</dd></div>
              <div><dt>Risque</dt><dd>${plan.risk}</dd></div>
            </dl>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function getEconomyReadinessFocusTarget(warning, economyView) {
  const route = economyView.overlay.routes.find((candidate) => candidate.routeName === warning.focusTarget?.routeName) ?? null;
  const hub = economyView.overlay.cities.find((candidate) => candidate.cityName === warning.focusTarget?.hubName) ?? null;

  return {
    provinceId: warning.provinceId,
    routeId: route?.routeId ?? '',
    cityId: hub?.cityId ?? '',
    label: route?.routeName ?? hub?.cityName ?? warning.provinceLabel,
  };
}

function renderEconomyReadinessWarnings(shell, economyView, focusContext, intrigueView = null) {
  const provinces = shell.provinces.slice(0, 6);
  const logisticsByProvinceId = Object.fromEntries(
    provinces.map((province) => [province.provinceId, buildProvinceLogisticsChoicePreviewView(province, economyView)]),
  );
  const budgetByProvinceId = Object.fromEntries(
    provinces.map((province) => [province.provinceId, buildProvinceEconomyBudgetPreviewView(province, economyView, shell, focusContext, intrigueView)]),
  );
  const readiness = buildEconomyReadinessWarnings(provinces, {
    budgetByProvinceId,
    logisticsByProvinceId,
    maxWarnings: 3,
  });

  return `
    <section class="economy-readiness-warnings economy-readiness-warnings--${readiness.status}" aria-label="Alertes économie et logistique avant fin de tour">
      <div class="economy-readiness-warnings__header">
        <strong>Readiness économie</strong>
        <span>${readiness.warnings.length > 0 ? `${readiness.warnings.length} alerte${readiness.warnings.length > 1 ? 's' : ''}` : 'sécurisé'}</span>
      </div>
      <p>${readiness.summary}</p>
      ${readiness.warnings.length > 0 ? `
        <ul class="economy-readiness-warnings__list">
          ${readiness.warnings.map((warning) => {
            const target = getEconomyReadinessFocusTarget(warning, economyView);

            return `
              <li class="economy-readiness-warning economy-readiness-warning--${warning.tone}">
                <b>${warning.label}</b>
                <span>${warning.detail}</span>
                <button
                  type="button"
                  data-economy-readiness-focus="true"
                  data-province-id="${target.provinceId}"
                  data-route-id="${target.routeId}"
                  data-city-id="${target.cityId}"
                  data-readiness-tone="${warning.status === 'blocked' ? 'danger' : 'warning'}"
                  data-blocker-label="${warning.blockerLabel}"
                  data-map-summary="${warning.mapSummary}"
                  data-next-turn-effect="${warning.nextTurnEffect}"
                >Voir ${target.label}</button>
              </li>
            `;
          }).join('')}
        </ul>
      ` : ''}
    </section>
  `;
}

function renderProvinceEconomyTurnReport(province, economyView) {
  const previousChoice = buildProvinceLogisticsChoicePreviewView(province, economyView).options[0] ?? null;
  const report = buildProvinceEconomyTurnReport(province, economyView, { previousChoice });

  return `
    <section class="province-economy-turn-report province-economy-turn-report--${report.tone}" aria-label="Rapport économie et logistique du dernier tour">
      <div class="province-economy-turn-report__header">
        <strong>Rapport économie dernier tour</strong>
        <span>${report.deltas.length > 0 ? `${report.deltas.length} delta${report.deltas.length > 1 ? 's' : ''}` : 'stable'}</span>
      </div>
      <p>${report.summary}</p>
      ${report.previousAction ? `<small>${report.previousAction}</small>` : ''}
      ${report.deltas.length > 0 ? `
        <ul class="province-economy-turn-report__list">
          ${report.deltas.map((delta) => `
            <li class="province-economy-turn-report__delta province-economy-turn-report__delta--${delta.tone}">
              <b>${delta.label}</b>
              <span>${delta.detail}</span>
            </li>
          `).join('')}
        </ul>
      ` : ''}
    </section>
  `;
}

function buildConflictOutcomePreview(province, shell) {
  const neighbors = province.neighborIds
    .map((provinceId) => shell.provinces.find((candidate) => candidate.provinceId === provinceId))
    .filter(Boolean);
  const alliedNeighbors = neighbors.filter((neighbor) => neighbor.controllingFactionId === province.controllingFactionId).length;
  const hostileNeighbors = neighbors.length - alliedNeighbors;
  const supplyScore = { stable: 2, strained: 1, disrupted: -1, collapsed: -2 }[province.supplyLevel] ?? 0;
  const frontPressureScore = province.contested ? -2 : province.occupied ? -1 : hostileNeighbors > alliedNeighbors ? -1 : 1;
  const stabilityScore = province.loyalty >= 70 ? 1 : province.loyalty < 45 ? -1 : 0;
  const totalScore = supplyScore + frontPressureScore + stabilityScore + (alliedNeighbors > hostileNeighbors ? 1 : 0);
  const tone = totalScore >= 2 ? 'success' : totalScore <= -2 ? 'danger' : 'warning';
  const title = totalScore >= 2 ? 'Victoire probable' : totalScore <= -2 ? 'Risque élevé' : 'Issue disputée';

  return {
    tone,
    title,
    summary: totalScore >= 2
      ? 'La province dispose de suffisamment d’appuis pour tenter une action limitée.'
      : totalScore <= -2
        ? 'Action risquée: sécuriser appuis et ravitaillement avant confirmation.'
        : 'Résultat incertain: une préparation ciblée peut faire basculer l’issue.',
    factors: [
      {
        label: 'Pression de front',
        value: province.contested ? 'front actif' : hostileNeighbors > 0 ? `${hostileNeighbors} voisin${hostileNeighbors > 1 ? 's' : ''} adverse${hostileNeighbors > 1 ? 's' : ''}` : 'front calme',
      },
      {
        label: 'Ravitaillement',
        value: province.supplyLevel,
      },
      {
        label: 'Contrôle adjacent',
        value: `${alliedNeighbors} appui${alliedNeighbors > 1 ? 's' : ''} / ${hostileNeighbors} menace${hostileNeighbors > 1 ? 's' : ''}`,
      },
    ],
  };
}

function renderConflictOutcomePreview(province, shell) {
  const preview = buildConflictOutcomePreview(province, shell);

  return `
    <section class="conflict-outcome-preview conflict-outcome-preview--${preview.tone}" aria-label="Issue probable de conflit">
      <div class="conflict-outcome-preview__header">
        <span>Issue probable</span>
        <strong>${preview.title}</strong>
      </div>
      <p>${preview.summary}</p>
      <div class="conflict-outcome-factors">
        ${preview.factors.map((factor) => `
          <div class="conflict-outcome-factor">
            <span>${factor.label}</span>
            <strong>${factor.value}</strong>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function buildSelectedProvinceActionQueue(province, shell, focusContext, intrigueView = null) {
  const outcome = buildConflictOutcomePreview(province, shell);
  const recommendations = buildProvinceActionRecommendations(province, focusContext, intrigueView);
  const priorityByTone = { danger: 1, warning: 2, ready: 3, info: 4, neutral: 5 };
  const statusByTone = { danger: 'blocked', warning: 'risky', ready: 'ready', info: 'ready', neutral: 'ready' };
  const outcomeRisk = outcome.tone === 'danger' ? 'risque élevé' : outcome.tone === 'warning' ? 'issue disputée' : 'risque maîtrisé';
  const queuedClimateActions = state.queuedClimateInterventions
    .filter((entry) => entry.provinceId === province.provinceId)
    .map((entry) => ({ ...entry }));
  const queuedCultureActions = state.queuedCultureActions
    .filter((entry) => entry.provinceId === province.provinceId)
    .map((entry) => ({ ...entry }));

  return recommendations
    .map((recommendation, index) => ({
      actionCode: `WAR-${province.provinceId.toUpperCase()}-${index + 1}`,
      label: recommendation.title,
      priority: priorityByTone[recommendation.tone] ?? index + 3,
      orderCost: recommendation.tone === 'danger' ? '2 ordres + appui' : recommendation.tone === 'warning' ? '1 ordre + contrôle' : '1 ordre',
      mainRisk: recommendation.tone === 'danger' || recommendation.tone === 'warning' ? recommendation.body : outcomeRisk,
      expectedResult: outcome.tone === 'success'
        ? `Résolution favorable: ${recommendation.title.toLowerCase()} peut consolider ${province.label}.`
        : outcome.tone === 'danger'
          ? `Résolution fragile: ${recommendation.title.toLowerCase()} doit attendre un appui.`
          : `Résolution disputée: ${recommendation.title.toLowerCase()} prépare une bascule limitée.`,
      status: statusByTone[recommendation.tone] ?? 'ready',
      tone: recommendation.tone,
    }))
    .concat(queuedClimateActions, queuedCultureActions)
    .sort((left, right) => left.priority - right.priority || left.actionCode.localeCompare(right.actionCode));
}

function summarizeTurnResolutionPreview(province, actionQueue) {
  const readyCount = actionQueue.filter((entry) => entry.status === 'ready').length;
  const blockedCount = actionQueue.filter((entry) => entry.status === 'blocked').length;
  const riskyCount = actionQueue.filter((entry) => entry.status === 'risky').length;
  const topAction = actionQueue[0] ?? null;
  const impactedFaction = factionMetaById[province.controllingFactionId]?.label ?? province.controllingFactionId;

  return {
    readyCount,
    blockedCount,
    riskyCount,
    impactedProvince: province.label,
    impactedFaction,
    summary: blockedCount > 0
      ? `${blockedCount} action bloquée: sécuriser ${province.label} avant résolution.`
      : riskyCount > readyCount
        ? `${riskyCount} action${riskyCount > 1 ? 's' : ''} risquée${riskyCount > 1 ? 's' : ''}: confirmer seulement avec réserve disponible.`
        : `${readyCount} action${readyCount > 1 ? 's' : ''} prête${readyCount > 1 ? 's' : ''}: ${topAction?.label ?? 'ordre tactique'} peut partir au prochain tour.`,
  };
}


function findProvinceIntrigueDrillDown(province, intrigueView) {
  const provinceId = province?.provinceId;
  const selectedDrillDown = intrigueView?.selectedProvince?.drillDown ?? null;

  if (selectedDrillDown?.locationId === provinceId) {
    return selectedDrillDown;
  }

  return (intrigueView?.map?.entries ?? [])
    .find((entry) => entry.locationId === provinceId)?.drillDown ?? null;
}

function resolveIntrigueExposureTimelineHint(entry, province) {
  const response = entry.drillDown?.quickResponses?.find((candidate) => candidate.code === entry.drillDown.recommendedResponseCode)
    ?? entry.drillDown?.quickResponses?.[0]
    ?? null;
  const fogLimited = !entry.showSecondaryDetails && entry.sabotageRiskLevel !== 'high' && entry.metrics.exposedCellCount === 0;
  const certainty = fogLimited
    ? 'unknown'
    : entry.metrics.exposedCellCount > 0 || entry.showSecondaryDetails
      ? 'confirmed'
      : 'suspected';
  const freshness = certainty === 'unknown'
    ? 'unresolved'
    : entry.sabotageRiskLevel === 'high' || entry.metrics.exposedCellCount > 0 || (response?.heatGenerated ?? 0) >= 10
      ? 'fresh'
      : 'stale';
  const priority = (certainty === 'confirmed' ? 100 : certainty === 'suspected' ? 40 : 0)
    + (freshness === 'fresh' ? 60 : freshness === 'stale' ? 15 : 0)
    + (entry.sabotageRiskLevel === 'high' ? 30 : entry.sabotageRiskLevel === 'medium' ? 12 : 0);
  const tone = freshness === 'fresh' && certainty === 'confirmed'
    ? 'danger'
    : freshness === 'stale'
      ? 'watch'
      : certainty === 'unknown'
        ? 'masked'
        : 'warning';
  const freshnessLabel = freshness === 'fresh'
    ? 'Signal récent'
    : freshness === 'stale'
      ? 'Soupçon ancien'
      : 'Zone non résolue';
  const detail = freshness === 'fresh'
    ? 'Menace visible récente: vérifier ou contenir avant d’empiler un ordre long.'
    : freshness === 'stale'
      ? 'Information ancienne: confirmer la province avant intervention lourde.'
      : 'Fraîcheur inconnue sous brouillard: inspecter sans inférer cellule, cible ou relais.';

  return {
    locationId: entry.locationId,
    locationName: entry.locationName,
    scope: entry.locationId === province.provinceId ? 'province sélectionnée' : 'voisinage surveillé',
    certainty,
    freshness,
    priority,
    tone,
    freshnessLabel,
    certaintyLabel: certainty === 'confirmed' ? 'confirmé' : certainty === 'suspected' ? 'soupçon' : 'inconnu',
    responseLabel: response?.label ?? 'surveillance prudente',
    detail,
  };
}

function buildProvinceIntrigueExposureTimelineHints(province, intrigueView) {
  const neighborIds = new Set(province?.neighborIds ?? []);

  return (intrigueView?.map?.entries ?? [])
    .filter((entry) => entry.locationId === province?.provinceId || neighborIds.has(entry.locationId))
    .map((entry) => resolveIntrigueExposureTimelineHint(entry, province))
    .sort((left, right) => right.priority - left.priority || left.locationName.localeCompare(right.locationName))
    .slice(0, 4);
}

function renderProvinceIntrigueExposureTimelineHints(province, intrigueView) {
  const hints = buildProvinceIntrigueExposureTimelineHints(province, intrigueView);

  if (hints.length === 0) {
    return '';
  }

  return `
    <section class="province-intrigue-timeline-hints" aria-label="Timeline fog-safe des expositions intrigue">
      <div class="province-intrigue-timeline-hints__header">
        <strong>Timeline intrigue</strong>
        <span>fraîcheur · certitude · brouillard</span>
      </div>
      <ol class="province-intrigue-timeline-hints__list">
        ${hints.map((hint) => `
          <li class="province-intrigue-timeline-hint province-intrigue-timeline-hint--${hint.tone}">
            <div>
              <b>${hint.freshnessLabel}</b>
              <span>${hint.locationName} · ${hint.scope}</span>
            </div>
            <small>${hint.certaintyLabel} · ${hint.responseLabel} · ${hint.detail}</small>
          </li>
        `).join('')}
      </ol>
      <small>Lecture fog-safe: les indices anciens ou inconnus n’ajoutent aucun nom de cellule, cible ou relais caché.</small>
    </section>
  `;
}

function buildSafeIntrigueResponseTimingOptions(province, intrigueView) {
  const drillDown = findProvinceIntrigueDrillDown(province, intrigueView);
  const entry = (intrigueView?.map?.entries ?? []).find((candidate) => candidate.locationId === province?.provinceId) ?? null;
  const responses = drillDown?.quickResponses ?? [];

  if (!drillDown || responses.length === 0) {
    return [];
  }

  const baseExposure = drillDown.riskBand === 'high' || drillDown.criticality === 'critical'
    ? 3
    : drillDown.riskBand === 'medium'
      ? 2
      : 1;

  return responses.map((response) => {
    const lowersExposure = ['contenir', 'surveiller'].includes(response.code) && response.escalationProbability !== 'élevée';
    const fogState = !entry?.showSecondaryDetails
      ? 'brouillard conservé'
      : (entry.metrics?.exposedCellCount ?? 0) > 0
        ? 'signal confirmé visible'
        : 'signal partiel visible';
    const delayTurns = response.cooldownTurns > 0
      ? response.cooldownTurns
      : lowersExposure
        ? 2
        : response.escalationProbability === 'élevée'
          ? 0
          : 1;
    const secondaryRisk = response.escalationProbability === 'élevée' || response.heatGenerated >= 10
      ? 'risque secondaire élevé: chaleur visible à compenser'
      : response.heatGenerated >= 5
        ? 'risque secondaire modéré: surveiller la chaleur'
        : 'risque secondaire faible: garder la couverture discrète';
    const waitingRisk = delayTurns <= 0 || (!lowersExposure && baseExposure >= 2)
      ? 'sûr maintenant, risqué si le joueur attend'
      : delayTurns === 1
        ? 'fenêtre courte: revalider au prochain tour'
        : 'marge de délai confortable sous signaux visibles';
    const tone = waitingRisk.includes('risqué') || response.escalationProbability === 'élevée'
      ? 'danger'
      : lowersExposure
        ? 'mitigated'
        : 'watch';
    const score = (lowersExposure ? 40 : 0) + delayTurns * 10 - (response.heatGenerated ?? 0) - (response.escalationProbability === 'élevée' ? 20 : 0);

    return {
      code: response.code,
      label: response.label,
      tone,
      score,
      exposureChange: lowersExposure ? 'exposition réduite' : response.code === 'exposer' ? 'exposition assumée' : 'exposition surveillée',
      fogState,
      delayLabel: delayTurns <= 0 ? 'aggravation possible immédiate' : `${delayTurns} tour${delayTurns > 1 ? 's' : ''} avant aggravation probable`,
      secondaryRisk,
      waitingRisk,
      summary: response.aftermathSummary ?? response.summary,
    };
  })
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label))
    .slice(0, 4);
}

function renderSafeIntrigueResponseTimingComparison(province, intrigueView) {
  const options = buildSafeIntrigueResponseTimingOptions(province, intrigueView);

  if (options.length === 0) {
    return '';
  }

  return `
    <section class="province-intrigue-response-timing" aria-label="Comparaison fog-safe des réponses intrigue sous timing d’exposition">
      <div class="province-intrigue-response-timing__header">
        <strong>Réponses intrigue sûres</strong>
        <span>exposition · délai · risque secondaire</span>
      </div>
      <div class="province-intrigue-response-timing__grid">
        ${options.map((option) => `
          <article class="province-intrigue-response-option province-intrigue-response-option--${option.tone}">
            <div>
              <b>${option.label}</b>
              <code>${option.code}</code>
            </div>
            <dl>
              <div><dt>Exposition</dt><dd>${option.exposureChange}</dd></div>
              <div><dt>Incertitude</dt><dd>${option.fogState}</dd></div>
              <div><dt>Délai</dt><dd>${option.delayLabel}</dd></div>
              <div><dt>Risque</dt><dd>${option.secondaryRisk}</dd></div>
            </dl>
            <p>${option.waitingRisk}</p>
            <small>${option.summary}</small>
          </article>
        `).join('')}
      </div>
      <small>Comparaison prudente: seules les tendances visibles sont comparées; cellule, cible, relais et état caché restent masqués.</small>
    </section>
  `;
}

function collectQueuedMapChoiceConflictSources(province, queuedMapChoices = state) {
  const selectedProvinceId = province?.provinceId;
  const logistics = (queuedMapChoices.queuedLogisticsActions ?? [])
    .filter((entry) => entry.provinceId !== selectedProvinceId)
    .map((entry) => ({
      type: 'logistics',
      label: entry.label ?? entry.target ?? 'choix logistique en file',
      code: entry.actionId ?? entry.routeId ?? 'LOG',
      priority: entry.status === 'conflict' || entry.status === 'risky' ? 1 : 3,
      conflictType: 'ressource détournée',
      detail: entry.downstreamEffect ?? 'un ordre logistique visible peut détourner la réserve avant la réponse intrigue.',
    }));
  const climate = (queuedMapChoices.queuedClimateInterventions ?? [])
    .filter((entry) => entry.provinceId !== selectedProvinceId)
    .map((entry) => ({
      type: 'climate',
      label: entry.label ?? 'intervention climat en file',
      code: entry.actionCode ?? 'CLIMATE',
      priority: entry.missedDeadline ? 1 : 2,
      conflictType: entry.missedDeadline ? 'fenêtre de brouillard de guerre qui se referme' : 'délai consommé',
      detail: entry.tradeoff ?? entry.expectedResult ?? 'l’intervention consomme une fenêtre d’action lisible avant la réponse intrigue.',
    }));
  const culture = (queuedMapChoices.queuedCultureActions ?? [])
    .filter((entry) => entry.provinceId !== selectedProvinceId)
    .map((entry) => ({
      type: 'culture',
      label: entry.label ?? 'choix culturel en file',
      code: entry.actionCode ?? 'CULTURE',
      priority: entry.status === 'risky' || entry.status === 'blocked' ? 1 : 2,
      conflictType: 'exposition accrue',
      detail: entry.mainRisk ?? entry.expectedResult ?? 'un ordre public peut hausser le bruit visible avant la réponse intrigue.',
    }));

  return logistics.concat(climate, culture)
    .sort((left, right) => left.priority - right.priority || left.label.localeCompare(right.label))
    .slice(0, 3);
}

function buildIntrigueQueuedMapChoiceConflicts(province, intrigueView, queuedMapChoices = state) {
  const options = buildSafeIntrigueResponseTimingOptions(province, intrigueView);
  const entry = (intrigueView?.map?.entries ?? []).find((candidate) => candidate.locationId === province?.provinceId) ?? null;
  const sources = collectQueuedMapChoiceConflictSources(province, queuedMapChoices);

  if (options.length === 0 || sources.length === 0) {
    return [];
  }

  const fogLimited = !entry?.showSecondaryDetails && (entry?.metrics?.exposedCellCount ?? 0) === 0 && entry?.sabotageRiskLevel !== 'high';
  const primaryOption = options.find((option) => option.tone === 'danger') ?? options[0];

  if (fogLimited) {
    return [{
      tone: 'masked',
      priority: 1,
      label: 'attention: conflit possible sous brouillard',
      sourceLabel: 'choix de carte masqué',
      sourceCode: primaryOption.code,
      responseLabel: primaryOption.label,
      detail: 'La file contient un choix ailleurs, mais le brouillard masque le lien exact: ne pas inférer cellule, cible, relais ni objectif caché.',
    }];
  }

  return sources.map((source, index) => {
    const option = options[index] ?? primaryOption;
    return {
      tone: source.priority <= 1 || option.tone === 'danger' ? 'danger' : 'warning',
      priority: source.priority + (option.tone === 'danger' ? 0 : 1),
      label: `attention: conflit avec ${source.label}`,
      sourceLabel: source.label,
      sourceCode: source.code,
      responseLabel: option.label,
      detail: `${source.conflictType}: ${source.detail} Réponse concernée: ${option.label}; seuls les impacts visibles de file, délai, exposition et ressource sont comparés.`,
    };
  })
    .sort((left, right) => left.priority - right.priority || left.label.localeCompare(right.label))
    .slice(0, 2);
}

function renderIntrigueQueuedMapChoiceConflicts(province, intrigueView, queuedMapChoices = state) {
  const conflicts = buildIntrigueQueuedMapChoiceConflicts(province, intrigueView, queuedMapChoices);

  if (conflicts.length === 0) {
    return '';
  }

  return `
    <section class="province-intrigue-queue-conflicts" aria-label="Conflits fog-safe entre réponses intrigue et choix carte en file">
      <div class="province-intrigue-queue-conflicts__header">
        <strong>Conflits avec la file carte</strong>
        <span>${conflicts.length} avertissement${conflicts.length > 1 ? 's' : ''}</span>
      </div>
      <div class="province-intrigue-queue-conflict-list">
        ${conflicts.map((conflict) => `
          <article class="province-intrigue-queue-conflict province-intrigue-queue-conflict--${conflict.tone}">
            <div>
              <b>${conflict.label}</b>
              <code>${conflict.sourceCode}</code>
            </div>
            <p>${conflict.detail}</p>
            <small>${conflict.responseLabel} · ${conflict.sourceLabel}</small>
          </article>
        `).join('')}
      </div>
      <small>Lecture fog-safe: avertit seulement sur les conflits déductibles; cellule, cible, relais et état caché restent masqués.</small>
    </section>
  `;
}

function buildProvinceIntrigueRiskWarnings(province, actionQueue, intrigueView) {
  const drillDown = findProvinceIntrigueDrillDown(province, intrigueView);
  const selectedResponse = drillDown?.quickResponses?.find((response) => response.code === drillDown.recommendedResponseCode)
    ?? drillDown?.quickResponses?.[0]
    ?? null;
  const warningCandidates = [];
  const plannedAction = actionQueue[0] ?? null;
  const riskyActionCount = actionQueue.filter((entry) => entry.status !== 'ready').length;

  if (!drillDown) {
    warningCandidates.push({
      tone: 'masked',
      priority: 5,
      label: 'Renseignement incomplet',
      detail: 'Aucun signal confirmé: garder le plan discret jusqu’au prochain rafraîchissement intrigue.',
      trigger: plannedAction?.actionCode ?? 'aucune action',
    });
  } else {
    if (drillDown.signalType === 'sabotage' || drillDown.criticality === 'critical') {
      warningCandidates.push({
        tone: 'danger',
        priority: 1,
        label: 'Sabotage probable',
        detail: `${drillDown.summary}; éviter de lancer ${plannedAction?.label ?? 'une action longue'} sans contre-mesure.`,
        trigger: plannedAction?.actionCode ?? drillDown.recommendedResponseCode,
      });
    }

    if ((drillDown.reasons ?? []).some((reason) => reason.includes('exposée'))) {
      warningCandidates.push({
        tone: 'warning',
        priority: 2,
        label: 'Exposition de cellule',
        detail: 'La file d’actions peut révéler des relais: privilégier infiltration ou containment avant l’ordre principal.',
        trigger: drillDown.primaryCelluleId ?? 'cellule locale',
      });
    }

    if (selectedResponse?.cooldownTurns > 0 || selectedResponse?.escalationProbability === 'élevée') {
      warningCandidates.push({
        tone: selectedResponse.escalationProbability === 'élevée' ? 'danger' : 'watch',
        priority: selectedResponse.escalationProbability === 'élevée' ? 1 : 3,
        label: 'Cooldown / alerte active',
        detail: `${selectedResponse.label}: cooldown ${selectedResponse.cooldownTurns} tour${selectedResponse.cooldownTurns > 1 ? 's' : ''}, chaleur +${selectedResponse.heatGenerated}, escalade ${selectedResponse.escalationProbability}.`,
        trigger: selectedResponse.code,
      });
    }
  }

  if (province.supplyLevel !== 'stable' || province.loyalty < 50 || riskyActionCount > 0) {
    warningCandidates.push({
      tone: riskyActionCount > 0 ? 'warning' : 'watch',
      priority: riskyActionCount > 0 ? 2 : 4,
      label: 'Province vulnérable',
      detail: `${province.label} cumule ${province.supplyLevel} / loyauté ${province.loyalty}; réduire l’empreinte avant d’empiler les ordres.`,
      trigger: plannedAction?.actionCode ?? 'plan province',
    });
  }

  return warningCandidates
    .sort((left, right) => left.priority - right.priority || left.label.localeCompare(right.label))
    .slice(0, 3);
}

function buildIntrigueExposureSourceBreakdown(province, drillDown, response, localOperations) {
  if (!drillDown || !response) {
    return [
      {
        tone: 'masked',
        label: 'Source masquée',
        detail: 'Le brouillard empêche d’attribuer la projection à une source précise.',
      },
    ];
  }

  const sources = [];
  const heatedOperation = localOperations.find((operation) => operation.detectionRisk >= 50 || operation.heat >= 50) ?? null;

  if (drillDown.riskBand === 'high' || drillDown.criticality === 'critical') {
    sources.push({
      tone: 'danger',
      label: 'Suspicion locale',
      detail: 'Signal visible élevé sur la province; identité et relais restent masqués.',
    });
  }

  if (heatedOperation) {
    sources.push({
      tone: 'warning',
      label: 'Opération conflictuelle',
      detail: 'Une opération visible chauffe déjà le théâtre sans révéler sa cible exacte.',
    });
  }

  if ((drillDown.reasons ?? []).some((reason) => reason.includes('exposée'))) {
    sources.push({
      tone: 'danger',
      label: 'Couverture fragile',
      detail: 'Une exposition est soupçonnée; la cellule ou le canal concerné reste caché.',
    });
  }

  if (response.code === 'infiltrer') {
    sources.push({
      tone: 'warning',
      label: 'Tension réseau',
      detail: 'L’approche ajoute du contact opérationnel avant confirmation complète.',
    });
  } else if (response.code === 'exposer') {
    sources.push({
      tone: 'danger',
      label: 'Vigilance cible',
      detail: 'La réponse rend le signal exploitable publiquement et peut alerter l’adversaire.',
    });
  } else if (response.code === 'surveiller') {
    sources.push({
      tone: 'watch',
      label: 'Surveillance discrète',
      detail: 'Le risque vient surtout du suivi prolongé, pas d’une révélation directe.',
    });
  } else if (response.code === 'contenir') {
    sources.push({
      tone: 'mitigated',
      label: 'Pression contenue',
      detail: 'La réponse réduit la fenêtre d’exposition sans nommer la menace.',
    });
  }

  if (province.loyalty < 50) {
    sources.push({
      tone: 'warning',
      label: 'Couverture faible',
      detail: 'La loyauté locale basse rend les mouvements plus visibles sans identifier d’agent.',
    });
  }

  if (sources.length === 0) {
    sources.push({
      tone: 'masked',
      label: 'Information limitée',
      detail: 'La projection agrège des signaux faibles sans révéler leur origine.',
    });
  }

  return sources.slice(0, 3);
}

function buildSafeIntrigueFallbackAction(province, drillDown, response, projectionTone, confidence, rawDelta) {
  if (!drillDown || !response) {
    return {
      empty: true,
      action: 'Aucune alternative sûre connue',
      detail: 'Attendre un signal confirmé avant de choisir une réponse intrigue.',
    };
  }

  const riskyProjection = ['danger', 'warning'].includes(projectionTone) || ['partielle', 'brouillard'].includes(confidence) || rawDelta >= 8;

  if (!riskyProjection) {
    return {
      empty: true,
      action: 'Aucune alternative sûre connue',
      detail: 'La réponse en file reste lisible; garder le plan actuel ou surveiller sans escalade.',
    };
  }

  if (response.code === 'exposer') {
    return {
      empty: false,
      action: 'Réduire chaleur',
      detail: 'Protège les canaux visibles avant toute révélation publique, sans nommer cellule ou cible.',
    };
  }

  if (response.code === 'infiltrer') {
    return {
      empty: false,
      action: 'Collecter renseignement',
      detail: 'Clarifie le signal et teste la couverture avant un contact plus exposé.',
    };
  }

  if (response.code === 'contenir' && projectionTone === 'danger') {
    return {
      empty: false,
      action: 'Temporiser',
      detail: 'Préserve la marge de sécurité si le brouillard rend la contention trop visible.',
    };
  }

  if (drillDown.criticality === 'critical' || drillDown.riskBand === 'high') {
    return {
      empty: false,
      action: 'Contenir',
      detail: 'Réduit la fenêtre d’exposition sans dévoiler la menace réelle.',
    };
  }

  return {
    empty: false,
    action: 'Surveiller',
    detail: 'Garde la province sous observation et clarifie le prochain signal sans ajouter de chaleur.',
  };
}

function buildQueuedIntrigueDetectionRiskProjection(province, actionQueue, intrigueView) {
  const drillDown = findProvinceIntrigueDrillDown(province, intrigueView);
  const response = drillDown?.quickResponses?.find((candidate) => candidate.code === drillDown.recommendedResponseCode)
    ?? drillDown?.quickResponses?.[0]
    ?? null;
  const queuedIntrigueAction = actionQueue.find((entry) => entry.label.includes('Signal local') || entry.label.includes('Signal prioritaire')) ?? null;

  if (!queuedIntrigueAction || !drillDown || !response) {
    return {
      empty: true,
      tone: 'masked',
      label: 'Aucune réponse intrigue en file',
      summary: 'Aucune projection de détection: queuez une réponse intrigue pour estimer la tendance sans lever le brouillard.',
      confidence: 'information limitée',
      beforeLabel: '—',
      afterLabel: '—',
      deltaLabel: 'stable',
      fogLimit: 'Le brouillard conserve les cellules, relais et objectifs masqués.',
      sources: buildIntrigueExposureSourceBreakdown(province, drillDown, response, []),
      fallback: buildSafeIntrigueFallbackAction(province, drillDown, response, 'masked', 'brouillard', 0),
    };
  }

  const localOperations = (intrigueView?.panels?.operations ?? []).filter((operation) => operation.locationId === province.provinceId);
  const visibleBaseRisk = localOperations.length > 0
    ? Math.max(...localOperations.map((operation) => operation.detectionRisk))
    : drillDown.riskBand === 'high'
      ? 62
      : drillDown.riskBand === 'medium'
        ? 42
        : 24;
  const responseDeltaByCode = {
    contenir: -Math.max(6, Math.round(response.heatGenerated / 2)),
    surveiller: Math.max(1, Math.round(response.heatGenerated / 3)),
    infiltrer: Math.max(4, Math.round(response.heatGenerated / 2)),
    exposer: Math.max(10, response.heatGenerated),
  };
  const rawDelta = responseDeltaByCode[response.code] ?? Math.round(response.heatGenerated / 2);
  const afterRisk = Math.max(0, Math.min(100, visibleBaseRisk + rawDelta));
  const confidence = localOperations.length > 0
    ? 'visible'
    : drillDown.criticality === 'critical'
      ? 'partielle'
      : 'brouillard';
  const tone = rawDelta < 0 ? 'mitigated' : afterRisk >= 60 ? 'danger' : afterRisk >= 40 ? 'warning' : 'watch';
  const deltaLabel = rawDelta < 0 ? `${rawDelta}` : `+${rawDelta}`;
  const sources = buildIntrigueExposureSourceBreakdown(province, drillDown, response, localOperations);
  const fallback = buildSafeIntrigueFallbackAction(province, drillDown, response, tone, confidence, rawDelta);

  return {
    empty: false,
    tone,
    label: `${response.label}: risque ${deltaLabel}`,
    summary: `Projection détection ${visibleBaseRisk} → ${afterRisk}: ${response.aftermathSummary ?? response.summary}.`,
    confidence: confidence === 'visible' ? 'confiance visible' : confidence === 'partielle' ? 'confiance partielle' : 'confiance sous brouillard',
    beforeLabel: `${visibleBaseRisk}`,
    afterLabel: `${afterRisk}`,
    deltaLabel,
    fogLimit: confidence === 'visible'
      ? 'Basé sur les opérations visibles; les relais non confirmés restent masqués.'
      : 'Projection prudente: source, cellule et objectif exacts restent masqués par le brouillard.',
    sources,
    fallback,
  };
}

function buildCumulativeQueuedIntrigueExposureRisk(province, projection, intrigueView) {
  const riskBandScore = { low: 8, medium: 16, high: 26 };
  const escalationScore = { faible: 4, moyenne: 9, élevée: 16 };
  const currentContribution = projection.empty ? null : {
    provinceLabel: province.label,
    actionLabel: projection.label,
    score: Math.max(0, Number.parseInt(projection.afterLabel, 10) || 0),
    reason: projection.sources[0]?.label ?? 'Projection locale',
    fallback: projection.fallback.empty ? 'différer' : projection.fallback.action.toLowerCase(),
  };
  const proposedContributions = (intrigueView?.map?.entries ?? [])
    .filter((entry) => entry.locationId !== province.provinceId && entry.drillDown?.quickResponses?.length)
    .map((entry) => {
      const response = entry.drillDown.quickResponses.find((candidate) => candidate.code === entry.drillDown.recommendedResponseCode)
        ?? entry.drillDown.quickResponses[0];
      const score = (riskBandScore[entry.drillDown.riskBand] ?? 10)
        + (escalationScore[response.escalationProbability] ?? 6)
        + Math.min(16, response.heatGenerated ?? 0);
      const provinceLabel = provinces.find((candidate) => candidate.id === entry.locationId)?.name
        ?? entry.locationName
        ?? entry.locationId;

      return {
        provinceLabel,
        actionLabel: response.label,
        score,
        reason: entry.drillDown.criticality === 'critical' ? 'Signal critique' : response.risk ?? 'Réponse proposée',
        fallback: response.code === 'exposer' ? 'réduire chaleur' : response.code === 'infiltrer' ? 'collecter renseignement' : 'surveiller',
      };
    });
  const contributions = [currentContribution, ...proposedContributions]
    .filter(Boolean)
    .sort((left, right) => right.score - left.score || left.provinceLabel.localeCompare(right.provinceLabel))
    .slice(0, 3);
  const totalScore = contributions.reduce((sum, contribution) => sum + contribution.score, 0);
  const level = totalScore >= 110 ? 'critique' : totalScore >= 75 ? 'élevé' : totalScore >= 40 ? 'modéré' : contributions.length > 0 ? 'faible' : 'vide';
  const tone = level === 'critique' ? 'danger' : level === 'élevé' ? 'warning' : level === 'modéré' ? 'watch' : 'masked';
  const mitigation = contributions.length === 0
    ? 'Aucune mitigation cumulée: attendre une réponse intrigue en file ou proposée.'
    : level === 'critique' || level === 'élevé'
      ? `Mitigation: remplacer ${contributions[0].actionLabel} sur ${contributions[0].provinceLabel} par ${contributions[0].fallback}, ou différer une action exposée.`
      : `Mitigation simple: conserver ${contributions[0].fallback} comme repli si un nouveau signal accroît l’exposition.`;

  return {
    level,
    tone,
    totalLabel: contributions.length === 0 ? '—' : `${Math.min(100, totalScore)}`,
    summary: contributions.length === 0
      ? 'Aucun risque cumulé lisible: les détails par action restent disponibles dès qu’une réponse intrigue est en file.'
      : `${contributions.length} contribution${contributions.length > 1 ? 's' : ''} intrigue agrégée${contributions.length > 1 ? 's' : ''}; détails par action conservés ci-dessus.`,
    mitigation,
    contributions,
    fogLimit: 'Agrégation prudente: provinces et tendances visibles seulement, sans révéler cellule, canal ou menace réelle.',
  };
}

function buildIntrigueQueueChangePreview(projection, cumulativeRisk) {
  const lead = cumulativeRisk.contributions[0] ?? null;
  const fallbackAction = projection.fallback?.empty ? lead?.fallback ?? 'différer' : projection.fallback.action.toLowerCase();
  const currentScore = Number.parseInt(cumulativeRisk.totalLabel, 10) || 0;
  const candidateScore = lead?.score ?? 0;
  const addScore = Math.min(100, currentScore + Math.max(4, Math.round(candidateScore / 4)));
  const removeScore = Math.max(0, currentScore - Math.max(6, Math.round(candidateScore / 3)));
  const replaceScore = Math.max(0, currentScore - Math.max(4, Math.round(candidateScore / 4)));
  const deltaLabel = (nextScore) => {
    const delta = nextScore - currentScore;

    return delta > 0 ? `+${delta}` : `${delta}`;
  };
  const strongestMover = lead
    ? `${lead.provinceLabel}: ${lead.actionLabel}`
    : 'Aucune action candidate visible';

  return {
    strongestMover,
    safeAlternative: fallbackAction,
    fogLimit: 'Prévisualisation fog-safe: seuls delta, province visible et type de réponse sont exposés.',
    scenarios: [
      {
        code: 'ajout',
        label: 'Ajouter',
        before: currentScore,
        after: addScore,
        delta: deltaLabel(addScore),
        detail: lead
          ? `Ajout pressenti autour de ${lead.provinceLabel}; garder la source exacte masquée.`
          : 'Aucun ajout risqué lisible dans la file actuelle.',
      },
      {
        code: 'retrait',
        label: 'Retirer',
        before: currentScore,
        after: removeScore,
        delta: deltaLabel(removeScore),
        detail: lead
          ? `Retirer ${lead.actionLabel} réduit surtout la pression visible sur ${lead.provinceLabel}.`
          : 'Retrait sans effet estimable tant que la file reste vide.',
      },
      {
        code: 'remplacement',
        label: 'Remplacer',
        before: currentScore,
        after: replaceScore,
        delta: deltaLabel(replaceScore),
        detail: `Remplacer par ${fallbackAction} conserve un repli prudent sans révéler cellule ou cible.`,
      },
    ],
  };
}

function buildMapIntrigueSafeQueueAction(province, projection, cumulativeRisk, queueChangePreview) {
  const alreadyQueued = !projection.empty;
  const tooRisky = projection.tone === 'danger' && projection.fallback.empty;
  const fallbackReady = !projection.fallback.empty && ['danger', 'warning', 'masked'].includes(projection.tone);
  const unavailable = projection.empty && projection.fallback.empty;
  const status = alreadyQueued
    ? 'déjà en file'
    : tooRisky
      ? 'trop risqué'
      : unavailable
        ? 'aucune réponse disponible'
        : fallbackReady
          ? 'fallback proposé'
          : 'prêt';
  const actionLabel = fallbackReady
    ? projection.fallback.action
    : unavailable
      ? 'Aucune réponse disponible'
      : projection.label.replace(/^Réponse en file · /, '') || 'Réponse intrigue recommandée';
  const disabled = alreadyQueued || tooRisky || unavailable;
  const residualRisk = queueChangePreview.scenarios.find((scenario) => scenario.code === 'remplacement')?.after
    ?? Number.parseInt(cumulativeRisk.totalLabel, 10)
    ?? 0;
  const majorSources = projection.sources.slice(0, 2).map((source) => source.label).join(' · ') || 'Sources masquées';

  return {
    status,
    actionLabel,
    disabled,
    residualRisk,
    majorSources,
    beforeLabel: projection.beforeLabel,
    afterLabel: projection.afterLabel,
    ignoredConsequence: cumulativeRisk.level === 'critique' || cumulativeRisk.level === 'élevé'
      ? 'Ignorer maintenant laisse la pression visible s’accumuler au prochain tour.'
      : 'Ignorer conserve le signal sous observation, mais le brouillard peut réduire la confiance.',
    ctaLabel: disabled ? 'Action non queueable' : `Queue carte: ${actionLabel}`,
    detail: fallbackReady
      ? 'La réponse recommandée est remplacée par un fallback sûr déjà connu.'
      : alreadyQueued
        ? 'Une réponse intrigue est déjà en file pour cette province.'
        : tooRisky
          ? 'Risque trop élevé sans fallback sûr; attendre un signal confirmé.'
          : unavailable
            ? 'Aucune réponse exploitable depuis la carte sans lever le brouillard.'
            : 'Queue directe depuis le panneau carte, sans navigation lourde.',
  };
}

function buildConfirmedQueuedIntrigueMapResponse(province, projection, mapQueueAction) {
  const confirmed = !projection.empty;
  const direction = projection.deltaLabel === 'stable'
    ? 'risque stable'
    : projection.deltaLabel.startsWith('+')
      ? 'risque en hausse'
      : 'risque réduit';

  return {
    confirmed,
    responseType: mapQueueAction.actionLabel,
    visibleContext: province.label,
    exposureDirection: direction,
    uncertainty: projection.confidence,
    summary: confirmed
      ? `Réponse confirmée: ${mapQueueAction.actionLabel} sur ${province.label}; ${direction}, avec ${projection.confidence}.`
      : 'Aucune confirmation active: queuez une réponse sûre depuis la carte pour obtenir un résumé auditable.',
    undoLabel: confirmed ? 'Annuler dernière réponse intrigue' : 'Aucune réponse à annuler',
    undoDetail: confirmed
      ? 'Annulation disponible avant résolution du tour; le brouillard conserve cible, cellule et relais masqués.'
      : 'L’undo s’active dès qu’une réponse intrigue carte est en file.',
  };
}

function buildFinalIntrigueExposureCommitSummary(province, projection, cumulativeRisk, confirmation) {
  const pendingResponses = cumulativeRisk.contributions.map((contribution) => ({
    context: `Cellule masquée · ${contribution.provinceLabel}`,
    response: contribution.actionLabel,
    exposureAfter: Math.min(100, contribution.score),
    riskState: contribution.score >= 70 ? 'trop risqué' : contribution.score >= 45 ? 'à surveiller' : 'contenu',
  }));
  const localDuplicates = pendingResponses.filter((response) => response.context.includes(province.label)).length;
  const interference = localDuplicates > 1 || cumulativeRisk.level === 'critique' || cumulativeRisk.level === 'élevé'
    ? 'Combinaison gênante: plusieurs réponses visibles peuvent cumuler chaleur et réduire la couverture.'
    : 'Aucune combinaison gênante majeure dans les signaux visibles.';
  const riskyCells = pendingResponses.filter((response) => response.riskState === 'trop risqué');

  return {
    empty: pendingResponses.length === 0,
    level: cumulativeRisk.level,
    tone: cumulativeRisk.tone,
    exposureAfter: cumulativeRisk.totalLabel,
    summary: pendingResponses.length === 0
      ? 'Synthèse finale indisponible: aucune réponse intrigue confirmée avant résolution.'
      : `${pendingResponses.length} réponse${pendingResponses.length > 1 ? 's' : ''} intrigue en attente; exposition estimée après résolution ${cumulativeRisk.totalLabel}.`,
    pendingResponses,
    riskyCells,
    interference,
    confirmationHint: confirmation.confirmed
      ? 'Dernière confirmation conservée; undo encore possible avant commit du tour.'
      : 'Confirmer une réponse carte pour verrouiller la synthèse finale.',
    fogLimit: 'Synthèse finale fog-safe: cellule, cible et relais restent masqués; seules province visible et tendance d’exposition sont listées.',
    residualWarning: projection.tone === 'danger'
      ? 'Risque résiduel élevé: différer ou remplacer avant résolution.'
      : 'Risque résiduel lisible; conserver les détails existants pour arbitrage final.',
  };
}

function renderQueuedIntrigueDetectionRiskProjection(province, actionQueue, intrigueView) {
  const projection = buildQueuedIntrigueDetectionRiskProjection(province, actionQueue, intrigueView);
  const cumulativeRisk = buildCumulativeQueuedIntrigueExposureRisk(province, projection, intrigueView);
  const queueChangePreview = buildIntrigueQueueChangePreview(projection, cumulativeRisk);
  const mapQueueAction = buildMapIntrigueSafeQueueAction(province, projection, cumulativeRisk, queueChangePreview);
  const confirmation = buildConfirmedQueuedIntrigueMapResponse(province, projection, mapQueueAction);
  const finalCommitSummary = buildFinalIntrigueExposureCommitSummary(province, projection, cumulativeRisk, confirmation);

  return `
    <section class="province-intrigue-detection-projection province-intrigue-detection-projection--${projection.tone}" aria-label="Projection du risque de détection intrigue">
      <div class="province-intrigue-detection-projection__header">
        <strong>Projection détection intrigue</strong>
        <span>${projection.confidence}</span>
      </div>
      <p>${projection.summary}</p>
      <div class="province-intrigue-detection-projection__scale">
        <span>Avant <b>${projection.beforeLabel}</b></span>
        <span>Après <b>${projection.afterLabel}</b></span>
        <span>Tendance <b>${projection.deltaLabel}</b></span>
      </div>
      <div class="province-intrigue-detection-projection__sources" aria-label="Sources compactes du risque d’exposition">
        ${projection.sources.map((source) => `
          <article class="province-intrigue-detection-source province-intrigue-detection-source--${source.tone}">
            <strong>${source.label}</strong>
            <span>${source.detail}</span>
          </article>
        `).join('')}
      </div>
      <div class="province-intrigue-detection-fallback province-intrigue-detection-fallback--${projection.fallback.empty ? 'empty' : 'ready'}" aria-label="Alternative intrigue sûre">
        <span>Fallback prudent</span>
        <strong>${projection.fallback.action}</strong>
        <small>${projection.fallback.detail}</small>
      </div>
      <div class="province-intrigue-cumulative-risk province-intrigue-cumulative-risk--${cumulativeRisk.tone}" aria-label="Risque d’exposition cumulé intrigue">
        <div class="province-intrigue-cumulative-risk__header">
          <span>Risque cumulé</span>
          <strong>${cumulativeRisk.level} · ${cumulativeRisk.totalLabel}</strong>
        </div>
        <p>${cumulativeRisk.summary}</p>
        ${cumulativeRisk.contributions.length > 0 ? `
          <ol>
            ${cumulativeRisk.contributions.map((contribution) => `
              <li>
                <strong>${contribution.provinceLabel}</strong>
                <span>${contribution.actionLabel} · ${contribution.reason}</span>
              </li>
            `).join('')}
          </ol>
        ` : ''}
        <small>${cumulativeRisk.mitigation}</small>
        <small>${cumulativeRisk.fogLimit}</small>
      </div>
      <div class="province-intrigue-queue-change-preview" aria-label="Aperçu avant confirmation des changements intrigue">
        <div class="province-intrigue-queue-change-preview__header">
          <span>Avant confirmation</span>
          <strong>${queueChangePreview.strongestMover}</strong>
        </div>
        <div class="province-intrigue-queue-change-preview__grid">
          ${queueChangePreview.scenarios.map((scenario) => `
            <article class="province-intrigue-queue-change-preview__scenario province-intrigue-queue-change-preview__scenario--${scenario.code}">
              <strong>${scenario.label}</strong>
              <span>${scenario.before} → ${scenario.after} (${scenario.delta})</span>
              <small>${scenario.detail}</small>
            </article>
          `).join('')}
        </div>
        <small>Alternative sûre: ${queueChangePreview.safeAlternative}.</small>
        <small>${queueChangePreview.fogLimit}</small>
      </div>
      <div class="province-intrigue-map-queue-action province-intrigue-map-queue-action--${mapQueueAction.disabled ? 'disabled' : 'ready'}" aria-label="Queue carte réponse intrigue sûre">
        <div class="province-intrigue-map-queue-action__header">
          <span>${mapQueueAction.status}</span>
          <strong>${mapQueueAction.actionLabel}</strong>
        </div>
        <dl>
          <div><dt>Exposition</dt><dd>${mapQueueAction.beforeLabel} → ${mapQueueAction.afterLabel}</dd></div>
          <div><dt>Risque résiduel</dt><dd>${mapQueueAction.residualRisk}</dd></div>
          <div><dt>Sources majeures</dt><dd>${mapQueueAction.majorSources}</dd></div>
        </dl>
        <p>${mapQueueAction.ignoredConsequence}</p>
        <button type="button" class="province-intrigue-map-queue-action__cta" data-action="queue-safe-intrigue-response" data-province-id="${province.provinceId}" ${mapQueueAction.disabled ? 'disabled' : ''}>${mapQueueAction.ctaLabel}</button>
        <small>${mapQueueAction.detail}</small>
      </div>
      <div class="province-intrigue-map-confirmation province-intrigue-map-confirmation--${confirmation.confirmed ? 'confirmed' : 'empty'}" aria-label="Confirmation fog-safe réponse intrigue queueée">
        <div class="province-intrigue-map-confirmation__header">
          <span>${confirmation.confirmed ? 'Réponse queueée' : 'Aucune réponse queueée'}</span>
          <strong>${confirmation.responseType}</strong>
        </div>
        <p>${confirmation.summary}</p>
        <dl>
          <div><dt>Contexte visible</dt><dd>${confirmation.visibleContext}</dd></div>
          <div><dt>Direction risque</dt><dd>${confirmation.exposureDirection}</dd></div>
          <div><dt>Incertitude</dt><dd>${confirmation.uncertainty}</dd></div>
        </dl>
        <button type="button" class="province-intrigue-map-confirmation__undo" data-action="undo-last-intrigue-response" data-province-id="${province.provinceId}" ${confirmation.confirmed ? '' : 'disabled'}>${confirmation.undoLabel}</button>
        <small>${confirmation.undoDetail}</small>
      </div>
      <div class="province-intrigue-final-commit-summary province-intrigue-final-commit-summary--${finalCommitSummary.tone}" aria-label="Synthèse finale exposition intrigue avant commit du tour">
        <div class="province-intrigue-final-commit-summary__header">
          <span>Avant commit du tour</span>
          <strong>${finalCommitSummary.level} · ${finalCommitSummary.exposureAfter}</strong>
        </div>
        <p>${finalCommitSummary.summary}</p>
        ${finalCommitSummary.pendingResponses.length > 0 ? `
          <ol>
            ${finalCommitSummary.pendingResponses.map((response) => `
              <li class="province-intrigue-final-commit-summary__item province-intrigue-final-commit-summary__item--${response.riskState.replaceAll(' ', '-')}">
                <strong>${response.context}</strong>
                <span>${response.response} · exposition après ${response.exposureAfter} · ${response.riskState}</span>
              </li>
            `).join('')}
          </ol>
        ` : ''}
        <small>${finalCommitSummary.interference}</small>
        <small>${finalCommitSummary.riskyCells.length > 0 ? `${finalCommitSummary.riskyCells.length} cellule${finalCommitSummary.riskyCells.length > 1 ? 's' : ''} encore trop risquée${finalCommitSummary.riskyCells.length > 1 ? 's' : ''}.` : 'Aucune cellule visible encore trop risquée.'}</small>
        <small>${finalCommitSummary.residualWarning}</small>
        <small>${finalCommitSummary.confirmationHint}</small>
        <small>${finalCommitSummary.fogLimit}</small>
      </div>
      <small>${projection.fogLimit}</small>
    </section>
  `;
}

function renderProvinceIntrigueRiskWarnings(province, actionQueue, intrigueView) {
  const warnings = buildProvinceIntrigueRiskWarnings(province, actionQueue, intrigueView);

  if (warnings.length === 0) {
    return '';
  }

  return `
    <section class="province-intrigue-risk-warnings" aria-label="Warnings intrigue du planning de province">
      <div class="province-intrigue-risk-warnings__header">
        <strong>Warnings intrigue planning</strong>
        <span>${warnings.length} signal${warnings.length > 1 ? 's' : ''}</span>
      </div>
      <div class="province-intrigue-risk-warning-list">
        ${warnings.map((warning) => `
          <article class="province-intrigue-risk-warning province-intrigue-risk-warning--${warning.tone}">
            <div>
              <strong>${warning.label}</strong>
              <code>${warning.trigger}</code>
            </div>
            <p>${warning.detail}</p>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function buildMilitaryOptionFeasibility(entry, province, readinessWarning, outcome) {
  const neighborPressure = readinessWarning && readinessWarning.provinceId !== province.provinceId;

  if (entry.status === 'blocked') {
    const blocker = ['disrupted', 'collapsed'].includes(province.supplyLevel)
      ? 'Ravitaillement insuffisant'
      : province.contested || outcome.tone === 'danger'
        ? 'Pression de front trop forte'
        : province.loyalty < 45
          ? 'Moral local fragile'
          : 'Information manquante';

    return {
      state: 'bloqué',
      tone: 'blocked',
      blocker,
      detail: entry.mainRisk,
      unlockAction: blocker === 'Ravitaillement insuffisant'
        ? 'Sécuriser une route ou un convoi avant de confirmer.'
        : blocker === 'Pression de front trop forte'
          ? 'Ajouter un appui adjacent ou renforcer la garnison.'
          : blocker === 'Moral local fragile'
            ? 'Stabiliser loyauté et ordre public avant l’action.'
            : 'Lancer reconnaissance ou attendre un signal confirmé.',
    };
  }

  if (entry.status === 'risky') {
    return {
      state: neighborPressure ? 'dépendant' : 'risqué',
      tone: neighborPressure ? 'dependent' : 'risky',
      blocker: neighborPressure ? 'Province voisine sous pression' : 'Délai / contrôle à confirmer',
      detail: neighborPressure ? readinessWarning.focusTargetLabel : entry.mainRisk,
      unlockAction: neighborPressure
        ? `Traiter ${readinessWarning.provinceLabel} ou déplacer un appui voisin.`
        : 'Vérifier réserve, timing et contrôle avant de queue l’ordre.',
    };
  }

  return {
    state: readinessWarning?.tone === 'warning' ? 'dépendant' : 'prêt',
    tone: readinessWarning?.tone === 'warning' ? 'dependent' : 'ready',
    blocker: readinessWarning?.tone === 'warning' ? 'Préparation voisine à surveiller' : 'Aucun bloqueur immédiat',
    detail: readinessWarning?.tone === 'warning' ? readinessWarning.focusTargetLabel : `Ravitaillement ${province.supplyLevel}, loyauté ${province.loyalty}.`,
    unlockAction: readinessWarning?.tone === 'warning'
      ? 'Confirmer l’appui adjacent avant engagement.'
      : 'Peut être queue maintenant si l’ordre reste prioritaire.',
  };
}

function buildMilitaryResponseOptions(province, shell, focusContext, intrigueView = null) {
  const actionQueue = buildSelectedProvinceActionQueue(province, shell, focusContext, intrigueView);
  const outcome = buildConflictOutcomePreview(province, shell);
  const readinessWarning = buildConflictReadinessWarnings(shell, intrigueView)
    .find((warning) => warning.provinceId === province.provinceId || province.neighborIds.includes(warning.provinceId)) ?? null;
  const localReason = readinessWarning?.provinceId === province.provinceId
    ? readinessWarning.detail
    : readinessWarning
      ? `Voisinage sous tension: ${readinessWarning.focusTargetLabel}.`
      : outcome.summary;

  if (outcome.tone === 'success' && !readinessWarning && actionQueue.every((entry) => entry.status === 'ready')) {
    return [];
  }

  return actionQueue.slice(0, 3).map((entry, index) => ({
    ...entry,
    optionLabel: index === 0 ? 'Option prioritaire' : index === 1 ? 'Option prudente' : 'Option de réserve',
    feasibility: buildMilitaryOptionFeasibility(entry, province, readinessWarning, outcome),
    localReason: index === 0
      ? localReason
      : entry.status === 'ready'
        ? `Appui local disponible: ${province.supplyLevel}, loyauté ${province.loyalty}.`
        : entry.mainRisk,
    expectedNextTurn: entry.expectedResult,
  }));
}

function renderMilitaryResponseOptions(province, shell, focusContext, intrigueView = null) {
  const options = buildMilitaryResponseOptions(province, shell, focusContext, intrigueView);

  if (options.length === 0) {
    return '';
  }

  return `
    <section class="military-response-options" aria-label="Comparaison des réponses militaires">
      <div class="military-response-options__header">
        <div>
          <span>Réponses militaires</span>
          <strong>Comparer avant d’engager</strong>
        </div>
        <small>${options.length} option${options.length > 1 ? 's' : ''}</small>
      </div>
      <div class="military-response-options__grid">
        ${options.map((option) => `
          <article class="military-response-option military-response-option--${option.status} military-response-option--${option.feasibility.tone}">
            <div class="military-response-option__title">
              <span>${option.optionLabel}</span>
              <code>${option.actionCode}</code>
            </div>
            <strong>${option.label}</strong>
            <div class="military-response-option__feasibility military-response-option__feasibility--${option.feasibility.tone}">
              <span>${option.feasibility.state}</span>
              <strong>${option.feasibility.blocker}</strong>
              <small>${option.feasibility.unlockAction}</small>
            </div>
            <dl>
              <div><dt>Coût / risque</dt><dd>${option.orderCost} · ${option.mainRisk}</dd></div>
              <div><dt>Effet prochain tour</dt><dd>${option.expectedNextTurn}</dd></div>
              <div><dt>Raison locale</dt><dd>${option.localReason}</dd></div>
              <div><dt>Bloqueur principal</dt><dd>${option.feasibility.detail}</dd></div>
            </dl>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderSelectedProvinceActionQueue(province, shell, focusContext, intrigueView = null) {
  const actionQueue = buildSelectedProvinceActionQueue(province, shell, focusContext, intrigueView);
  const resolution = summarizeTurnResolutionPreview(province, actionQueue);
  const intrigueWarnings = renderProvinceIntrigueRiskWarnings(province, actionQueue, intrigueView);
  const intrigueDetectionProjection = renderQueuedIntrigueDetectionRiskProjection(province, actionQueue, intrigueView);
  const climateHazardBlockers = renderProvinceClimateHazardBlockers(province, actionQueue);

  return `
    <section class="province-action-queue" aria-label="File d’actions préparées pour la province sélectionnée">
      <div class="province-action-queue__header">
        <div>
          <span>File d’actions</span>
          <strong>Résolution prochain tour</strong>
        </div>
        <small>${resolution.impactedProvince} · ${resolution.impactedFaction}</small>
      </div>
      <div class="province-action-queue__summary">
        <span>${resolution.readyCount} prêtes</span>
        <span>${resolution.riskyCount} risquées</span>
        <span>${resolution.blockedCount} bloquées</span>
      </div>
      <p>${resolution.summary}</p>
      <ol class="province-action-queue__list">
        ${actionQueue.map((entry) => `
          <li class="province-action-queue__item province-action-queue__item--${entry.status}">
            <div>
              <code>${entry.actionCode}</code>
              <strong>${entry.label}</strong>
              <p>${entry.expectedResult}</p>
            </div>
            <dl>
              <div><dt>Priorité</dt><dd>${entry.priority}</dd></div>
              <div><dt>Coût</dt><dd>${entry.orderCost}</dd></div>
              <div><dt>Risque</dt><dd>${entry.mainRisk}</dd></div>
              <div><dt>Statut</dt><dd>${entry.status}</dd></div>
            </dl>
          </li>
        `).join('')}
      </ol>
    </section>
    ${intrigueDetectionProjection}
    ${intrigueWarnings}
    ${climateHazardBlockers}
  `;
}

function buildResolvedConflictDeltas(province, shell, actionQueue) {
  if (actionQueue.length === 0) {
    return {
      empty: true,
      summary: 'Aucun changement militaire résolu sur cette province au dernier tour.',
      deltas: [],
    };
  }

  const outcome = buildConflictOutcomePreview(province, shell);
  const resolvedAction = actionQueue.find((entry) => entry.status === 'ready') ?? actionQueue[0];
  const pressureDelta = outcome.tone === 'success' ? '-1 pression' : outcome.tone === 'danger' ? '+1 risque' : 'pression stable';
  const controlDelta = province.contested ? 'front contesté maintenu' : province.occupied ? 'occupation stabilisée' : 'contrôle inchangé';
  const lossDelta = resolvedAction.status === 'blocked' ? 'pertes évitées' : resolvedAction.status === 'risky' ? 'risque accru' : 'risque contenu';

  return {
    empty: false,
    summary: `${resolvedAction.label}: ${outcome.title.toLowerCase()} pour ${province.label}.`,
    resolvedActionCode: resolvedAction.actionCode,
    impactedProvince: province.label,
    deltas: [
      { tone: outcome.tone, label: 'Contrôle / front', value: controlDelta },
      { tone: outcome.tone === 'danger' ? 'danger' : 'warning', label: 'Pression', value: pressureDelta },
      { tone: resolvedAction.status === 'ready' ? 'success' : resolvedAction.status === 'blocked' ? 'neutral' : 'danger', label: 'Pertes / risque', value: lossDelta },
      { tone: resolvedAction.status === 'ready' ? 'success' : resolvedAction.status === 'blocked' ? 'neutral' : 'warning', label: 'Action résolue', value: resolvedAction.status === 'blocked' ? 'échec bloqué' : 'succès partiel' },
    ],
  };
}

function renderResolvedConflictDeltas(province, shell, focusContext, intrigueView = null) {
  const actionQueue = buildSelectedProvinceActionQueue(province, shell, focusContext, intrigueView);
  const report = buildResolvedConflictDeltas(province, shell, actionQueue);

  if (report.empty) {
    return `
      <section class="resolved-conflict-deltas is-empty" aria-label="Rapport de résolution militaire">
        <strong>Rapport dernier tour</strong>
        <p>${report.summary}</p>
      </section>
    `;
  }

  return `
    <section class="resolved-conflict-deltas" aria-label="Rapport de résolution militaire">
      <div class="resolved-conflict-deltas__header">
        <div>
          <span>Rapport dernier tour</span>
          <strong>${report.impactedProvince}</strong>
        </div>
        <code>${report.resolvedActionCode}</code>
      </div>
      <p>${report.summary}</p>
      <div class="resolved-conflict-delta-list">
        ${report.deltas.map((delta) => `
          <article class="resolved-conflict-delta resolved-conflict-delta--${delta.tone}">
            <span>${delta.label}</span>
            <strong>${delta.value}</strong>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function buildMilitaryPlanImpactSummary(province, shell, actionQueue) {
  const outcome = buildConflictOutcomePreview(province, shell);
  const affectedProvinceLabels = [province.label, ...province.neighborIds
    .map((provinceId) => shell.provinces.find((candidate) => candidate.provinceId === provinceId)?.label)
    .filter(Boolean)]
    .slice(0, 4);
  const readyActions = actionQueue.filter((entry) => entry.status === 'ready');
  const riskyActions = actionQueue.filter((entry) => entry.status === 'risky');
  const blockedActions = actionQueue.filter((entry) => entry.status === 'blocked');
  const supplyRisk = province.supplyLevel === 'collapsed' || province.supplyLevel === 'disrupted'
    ? 'routage fragile'
    : province.supplyLevel === 'strained'
      ? 'ravitaillement à surveiller'
      : 'ravitaillement stable';

  return {
    turn: state.turn,
    tone: blockedActions.length > 0 ? 'danger' : riskyActions.length > readyActions.length ? 'warning' : 'ready',
    summary: actionQueue.length === 0
      ? 'Aucune action militaire en file: le plan de tour ne modifie pas encore la carte.'
      : `${actionQueue.length} action${actionQueue.length > 1 ? 's' : ''} en file: ${readyActions.length} prête${readyActions.length > 1 ? 's' : ''}, ${riskyActions.length} risquée${riskyActions.length > 1 ? 's' : ''}, ${blockedActions.length} bloquée${blockedActions.length > 1 ? 's' : ''}.`,
    metrics: [
      { label: 'Fronts / provinces', value: affectedProvinceLabels.join(', ') || province.label },
      { label: 'Pression attendue', value: outcome.tone === 'success' ? 'pression en baisse' : outcome.tone === 'danger' ? 'pression en hausse' : 'pression contestée' },
      { label: 'Contrôle probable', value: outcome.tone === 'success' ? 'contrôle consolidé' : outcome.tone === 'danger' ? 'contrôle menacé' : 'contrôle disputé' },
      { label: 'Risque ravitaillement', value: supplyRisk },
    ],
  };
}

function renderMilitaryPlanImpactSummary(province, shell, focusContext, intrigueView = null) {
  const actionQueue = buildSelectedProvinceActionQueue(province, shell, focusContext, intrigueView);
  const impact = buildMilitaryPlanImpactSummary(province, shell, actionQueue);

  return `
    <section class="military-plan-impact military-plan-impact--${impact.tone}" aria-label="Impact du plan militaire en file">
      <div class="military-plan-impact__header">
        <div>
          <span>Impact du plan</span>
          <strong>Tour ${impact.turn}</strong>
        </div>
        <small>mis à jour avec la file</small>
      </div>
      <p>${impact.summary}</p>
      <div class="military-plan-impact__metrics">
        ${impact.metrics.map((metric) => `
          <article class="military-plan-impact__metric">
            <span>${metric.label}</span>
            <strong>${metric.value}</strong>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function buildFrontStabilityDrivers(province, outcome, queuedAction, sensitiveNeighbor) {
  const drivers = [];

  if (province.contested || outcome.tone === 'danger') {
    drivers.push({ label: 'Pression', value: province.contested ? 'front contesté actif' : outcome.summary });
  }

  if (queuedAction) {
    drivers.push({
      label: 'Appui',
      value: queuedAction.status === 'ready'
        ? `${queuedAction.label}: action prête à stabiliser le front.`
        : queuedAction.status === 'risky'
          ? `${queuedAction.label}: effet dépendant du timing et du contrôle.`
          : `${queuedAction.label}: bloqueur encore présent avant résolution.`,
    });
  }

  if (['collapsed', 'disrupted', 'strained'].includes(province.supplyLevel)) {
    drivers.push({ label: 'Fatigue / supply', value: `Ravitaillement ${province.supplyLevel}: la projection reste fragile.` });
  } else if (province.loyalty < 55) {
    drivers.push({ label: 'Moral', value: `Loyauté ${province.loyalty}: attention à l’attrition locale.` });
  }

  if (sensitiveNeighbor) {
    drivers.push({ label: 'Front voisin', value: `${sensitiveNeighbor.label} peut propager la pression si l’action échoue.` });
  }

  if (drivers.length === 0) {
    drivers.push({ label: 'Terrain', value: 'Aucun signal critique: stabilité surtout portée par la position locale.' });
  }

  return drivers.slice(0, 3);
}

function buildProjectedFrontStability(province, shell, actionQueue) {
  const outcome = buildConflictOutcomePreview(province, shell);
  const queuedAction = actionQueue.find((entry) => entry.status === 'ready') ?? actionQueue[0] ?? null;
  const hostileNeighbors = province.neighborIds
    .map((provinceId) => shell.provinces.find((candidate) => candidate.provinceId === provinceId))
    .filter((neighbor) => neighbor && neighbor.controllingFactionId !== province.controllingFactionId);
  const sensitiveNeighbor = hostileNeighbors
    .sort((left, right) => (right.strategicValue - left.strategicValue) || left.label.localeCompare(right.label))[0] ?? null;
  const drivers = buildFrontStabilityDrivers(province, outcome, queuedAction, sensitiveNeighbor);

  if (!queuedAction) {
    return {
      empty: true,
      tone: 'neutral',
      title: 'Projection front non engagée',
      summary: 'Aucune action militaire en file: la stabilité du front reste inchangée pour ce tour.',
      lines: [
        { label: 'Stabilité attendue', value: province.contested ? 'front encore contesté' : 'position maintenue' },
        { label: 'Risque restant', value: outcome.summary },
        { label: 'Voisine sensible', value: sensitiveNeighbor?.label ?? 'aucune menace adjacente prioritaire' },
      ],
      drivers,
    };
  }

  const stability = queuedAction.status === 'blocked'
    ? 'instable après résolution'
    : queuedAction.status === 'risky'
      ? 'stabilité partielle'
      : outcome.tone === 'success'
        ? 'front stabilisé'
        : 'front sous contrôle prudent';
  const residualRisk = queuedAction.status === 'blocked'
    ? queuedAction.mainRisk
    : queuedAction.status === 'risky'
      ? 'risque résiduel si appui ou timing échoue'
      : outcome.tone === 'danger'
        ? 'pression ennemie encore élevée'
        : 'risque contenu au prochain tour';

  return {
    empty: false,
    tone: queuedAction.status === 'blocked' ? 'danger' : queuedAction.status === 'risky' ? 'warning' : 'ready',
    title: queuedAction.label,
    summary: `${queuedAction.actionCode}: projection après validation de l’action en file.`,
    lines: [
      { label: 'Stabilité attendue', value: stability },
      { label: 'Risque restant', value: residualRisk },
      { label: 'Voisine sensible', value: sensitiveNeighbor ? `${sensitiveNeighbor.label} · valeur ${sensitiveNeighbor.strategicValue}` : 'aucune menace adjacente prioritaire' },
    ],
    drivers,
  };
}

function renderProjectedFrontStability(province, shell, focusContext, intrigueView = null) {
  const actionQueue = buildSelectedProvinceActionQueue(province, shell, focusContext, intrigueView);
  const projection = buildProjectedFrontStability(province, shell, actionQueue);

  return `
    <section class="projected-front-stability projected-front-stability--${projection.tone} ${projection.empty ? 'is-empty' : ''}" aria-label="Projection de stabilité du front après actions en file">
      <div class="projected-front-stability__header">
        <div>
          <span>Projection stabilité front</span>
          <strong>${projection.title}</strong>
        </div>
        <small>${projection.empty ? 'aucune action en file' : 'après action'}</small>
      </div>
      <p>${projection.summary}</p>
      <div class="projected-front-stability__lines">
        ${projection.lines.map((line) => `
          <article class="projected-front-stability__line">
            <span>${line.label}</span>
            <strong>${line.value}</strong>
          </article>
        `).join('')}
      </div>
      <div class="projected-front-stability__drivers" aria-label="Facteurs de variation de stabilité">
        <span>Pourquoi ça change</span>
        ${projection.drivers.map((driver) => `
          <article class="projected-front-stability__driver">
            <strong>${driver.label}</strong>
            <p>${driver.value}</p>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function buildCriticalFrontRiskWarnings(province, projection) {
  const risks = [];
  const hasDriver = (label) => projection.drivers.some((driver) => driver.label === label);

  if (projection.tone === 'danger') {
    risks.push({
      tone: 'critical',
      label: 'Risque critique avant validation',
      summary: 'Le plan laisse une brèche ou une perte de contrôle probable.',
      driver: projection.drivers[0]?.label ?? 'Projection',
    });
  } else if (projection.tone === 'warning') {
    risks.push({
      tone: 'watch',
      label: 'Risque à surveiller',
      summary: 'La stabilité reste partielle: confirmer l’appui avant fin de tour.',
      driver: projection.drivers[0]?.label ?? 'Projection',
    });
  }

  if (hasDriver('Fatigue / supply')) {
    risks.push({
      tone: ['collapsed', 'disrupted'].includes(province.supplyLevel) ? 'critical' : 'watch',
      label: 'Fatigue / supply résiduelle',
      summary: `Ravitaillement ${province.supplyLevel}: l’action peut rester difficile à rattraper au tour suivant.`,
      driver: 'Fatigue / supply',
    });
  }

  if (hasDriver('Front voisin')) {
    risks.push({
      tone: projection.tone === 'ready' ? 'watch' : 'critical',
      label: 'Pression voisine persistante',
      summary: 'Un front adjacent peut propager la pression malgré l’action en file.',
      driver: 'Front voisin',
    });
  }

  if (risks.length === 0) {
    risks.push({
      tone: 'covered',
      label: 'Risque acceptable',
      summary: 'Le plan couvre correctement le front pour ce tour.',
      driver: projection.drivers[0]?.label ?? 'Terrain',
    });
  }

  const rank = { critical: 1, watch: 2, covered: 3 };
  return risks
    .sort((left, right) => rank[left.tone] - rank[right.tone] || left.label.localeCompare(right.label))
    .slice(0, 3);
}

function renderCriticalFrontRiskWarnings(province, shell, focusContext, intrigueView = null) {
  const actionQueue = buildSelectedProvinceActionQueue(province, shell, focusContext, intrigueView);
  const projection = buildProjectedFrontStability(province, shell, actionQueue);
  const risks = buildCriticalFrontRiskWarnings(province, projection);
  const leadRisk = risks[0] ?? null;

  return `
    <section class="critical-front-risks critical-front-risks--${leadRisk?.tone ?? 'covered'}" aria-label="Risques critiques restants du front">
      <div class="critical-front-risks__header">
        <div>
          <span>Risques restants</span>
          <strong>${leadRisk?.label ?? 'Risque acceptable'}</strong>
        </div>
        <small>${risks.length} signal${risks.length > 1 ? 's' : ''}</small>
      </div>
      <div class="critical-front-risks__list">
        ${risks.map((risk) => `
          <article class="critical-front-risk critical-front-risk--${risk.tone}">
            <div>
              <strong>${risk.label}</strong>
              <code>${risk.driver}</code>
            </div>
            <p>${risk.summary}</p>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}



function buildFrontPriorityRanking(shell, intrigueView = null) {
  const rankTone = { critical: 'danger', watch: 'warning', covered: 'ready' };

  return shell.provinces
    .map((province) => {
      const focusContext = {
        focusedProvinceId: province.provinceId,
        focusedProvince: province,
        neighborIds: new Set(province.neighborIds),
      };
      const actionQueue = buildSelectedProvinceActionQueue(province, shell, focusContext, intrigueView);
      const projection = buildProjectedFrontStability(province, shell, actionQueue);
      const risks = buildCriticalFrontRiskWarnings(province, projection);
      const leadRisk = risks[0] ?? { tone: 'covered', label: 'Risque acceptable', driver: 'Terrain' };
      const blockedCount = actionQueue.filter((entry) => entry.status === 'blocked').length;
      const riskyCount = actionQueue.filter((entry) => entry.status === 'risky').length;
      const criticalCount = risks.filter((risk) => risk.tone === 'critical').length;
      const watchCount = risks.filter((risk) => risk.tone === 'watch').length;
      const urgencyLabel = criticalCount > 0 || blockedCount > 0
        ? 'avant validation'
        : watchCount > 0 || riskyCount > 0
          ? 'prochain tour'
          : 'surveillance légère';
      const score = (criticalCount * 40)
        + (watchCount * 18)
        + (projection.tone === 'danger' ? 28 : projection.tone === 'warning' ? 16 : 4)
        + (blockedCount * 12)
        + (riskyCount * 6)
        + (province.contested ? 8 : 0)
        + (['collapsed', 'disrupted'].includes(province.supplyLevel) ? 6 : province.supplyLevel === 'strained' ? 3 : 0)
        + Math.min(province.strategicValue ?? 0, 8);
      const reasons = [
        `${leadRisk.label} (${leadRisk.driver})`,
        projection.lines.find((line) => line.label === 'Stabilité attendue')?.value ?? projection.title,
      ];

      if (blockedCount > 0) {
        reasons.push(`${blockedCount} option${blockedCount > 1 ? 's' : ''} bloquée${blockedCount > 1 ? 's' : ''}`);
      } else if (riskyCount > 0) {
        reasons.push(`${riskyCount} option${riskyCount > 1 ? 's' : ''} risquée${riskyCount > 1 ? 's' : ''}`);
      }

      reasons.push(`urgence ${urgencyLabel}`);

      return {
        provinceId: province.provinceId,
        provinceLabel: province.label,
        tone: rankTone[leadRisk.tone] ?? 'ready',
        score,
        leadRisk: leadRisk.label,
        actionCode: actionQueue[0]?.actionCode ?? 'WAR-HOLD',
        reason: reasons.slice(0, 4).join(' · '),
        focusTargetLabel: province.contested ? `front contesté ${province.label}` : `province ${province.label}`,
      };
    })
    .filter((entry) => entry.tone !== 'ready' || entry.score >= 18)
    .sort((left, right) => right.score - left.score || left.provinceLabel.localeCompare(right.provinceLabel))
    .slice(0, 3)
    .map((entry, index, entries) => ({
      ...entry,
      rank: index + 1,
      comparison: index === 0
        ? 'Passe en premier: cumul risque / stabilité le plus élevé.'
        : `Après ${entries[index - 1].provinceLabel}: score ${entry.score} contre ${entries[index - 1].score}.`,
    }));
}

function renderFrontPriorityRanking(shell, intrigueView = null) {
  const priorities = buildFrontPriorityRanking(shell, intrigueView);

  if (priorities.length === 0) {
    return `
      <section class="front-priority-ranking is-empty" aria-label="Classement des priorités militaires de front">
        <div class="front-priority-ranking__header">
          <strong>Priorités fronts</strong>
          <span>calme</span>
        </div>
        <p>Aucun front visible ne demande de priorité militaire immédiate.</p>
      </section>
    `;
  }

  return `
    <section class="front-priority-ranking" aria-label="Classement des priorités militaires de front">
      <div class="front-priority-ranking__header">
        <strong>Priorités fronts</strong>
        <span>${priorities.length} provinces à traiter</span>
      </div>
      <div class="front-priority-ranking__list">
        ${priorities.map((priority) => `
          <button class="front-priority front-priority--${priority.tone}" type="button" data-province-id="${priority.provinceId}" data-readiness-focus="${priority.provinceId}" aria-label="Priorité ${priority.rank}: ${priority.focusTargetLabel}">
            <div>
              <strong>#${priority.rank} ${priority.provinceLabel}</strong>
              <code>${priority.actionCode}</code>
            </div>
            <p>${priority.reason}</p>
            <small>${priority.comparison}</small>
          </button>
        `).join('')}
      </div>
    </section>
  `;
}



function buildRecommendedMilitaryQueueState(province, recommendedAction) {
  const acceptedAction = state.acceptedRecommendedMilitaryAction;

  if (!recommendedAction) {
    return {
      status: 'empty',
      label: 'Aucune recommandation à engager',
      detail: 'La carte reste en surveillance: aucun ordre prioritaire ne peut être ajouté maintenant.',
      buttonLabel: 'Rien à ajouter',
      disabled: true,
    };
  }

  if (acceptedAction?.provinceId === province.provinceId && acceptedAction?.actionCode === recommendedAction.actionCode) {
    return {
      status: 'queued',
      label: 'Déjà en file depuis la carte',
      detail: `${recommendedAction.actionCode} reste attachée à ${province.label} sans doublon ambigu.`,
      buttonLabel: 'Déjà en file',
      disabled: true,
    };
  }

  if (acceptedAction) {
    return {
      status: 'replace',
      label: 'Remplace l’action carte précédente',
      detail: `${recommendedAction.actionCode} remplacera ${acceptedAction.actionCode} (${acceptedAction.provinceLabel}).`,
      buttonLabel: 'Remplacer par cette action',
      disabled: false,
    };
  }

  return {
    status: 'valid',
    label: 'Prête à ajouter à la file',
    detail: `${recommendedAction.orderCost} · ${recommendedAction.mainRisk}`,
    buttonLabel: 'Ajouter à la file',
    disabled: false,
  };
}

function buildRecommendedMilitaryActionPreview(shell, intrigueView = null) {
  const [priority] = buildFrontPriorityRanking(shell, intrigueView);

  if (!priority) {
    return {
      empty: true,
      tone: 'ready',
      provinceId: null,
      provinceLabel: 'Aucun front prioritaire',
      actionCode: 'WAR-HOLD',
      actionLabel: 'Aucune action militaire recommandée',
      confidence: 'calculé: aucune priorité immédiate détectée',
      effects: [
        { label: 'Pression', value: 'aucun changement urgent', source: 'calculé' },
        { label: 'Stabilité projetée', value: 'position maintenue', source: 'estimé prudent' },
        { label: 'Risque critique restant', value: 'aucun signal critique prioritaire', source: 'calculé' },
      ],
      sideEffect: 'Dégradation propre: garder la file militaire actuelle ou surveiller les fronts voisins.',
      queueState: buildRecommendedMilitaryQueueState(null, null),
      horizon: 'Horizon prévu: surveillance au prochain tour.',
    };
  }

  const province = shell.provinces.find((candidate) => candidate.provinceId === priority.provinceId) ?? null;

  if (!province) {
    return {
      empty: true,
      tone: 'warning',
      provinceId: priority.provinceId,
      provinceLabel: priority.provinceLabel,
      actionCode: priority.actionCode,
      actionLabel: 'Action introuvable',
      confidence: 'estimé prudent: province prioritaire non résolue',
      effects: [
        { label: 'Pression', value: 'donnée indisponible', source: 'estimé prudent' },
        { label: 'Stabilité projetée', value: 'donnée indisponible', source: 'estimé prudent' },
        { label: 'Risque critique restant', value: priority.leadRisk, source: 'calculé' },
      ],
      sideEffect: 'Province prioritaire introuvable: ne pas empiler de nouvel ordre sans vérifier la sélection.',
      queueState: buildRecommendedMilitaryQueueState(null, null),
      horizon: 'Horizon prévu: vérifier la sélection avant engagement.',
    };
  }

  const focusContext = {
    focusedProvinceId: province.provinceId,
    focusedProvince: province,
    neighborIds: new Set(province.neighborIds),
  };
  const actionQueue = buildSelectedProvinceActionQueue(province, shell, focusContext, intrigueView);
  const recommendedAction = actionQueue[0] ?? null;
  const projection = buildProjectedFrontStability(province, shell, actionQueue);
  const risks = buildCriticalFrontRiskWarnings(province, projection);
  const criticalCount = risks.filter((risk) => risk.tone === 'critical').length;
  const watchCount = risks.filter((risk) => risk.tone === 'watch').length;
  const stabilityValue = projection.lines.find((line) => line.label === 'Stabilité attendue')?.value ?? projection.title;
  const residualRisk = risks[0]?.label ?? 'Risque acceptable';
  const pressureValue = projection.drivers.some((driver) => driver.label === 'Pression')
    ? 'pression traitée mais encore visible'
    : projection.tone === 'ready'
      ? 'pression en baisse estimée'
      : 'pression encore contestée';
  const sensitiveNeighbor = projection.lines.find((line) => line.label === 'Voisine sensible')?.value ?? 'aucune menace adjacente prioritaire';
  const sideEffect = recommendedAction?.status === 'blocked'
    ? `${recommendedAction.label}: province encore bloquée avant résolution.`
    : risks.some((risk) => risk.driver === 'Front voisin')
      ? `Front voisin soulagé partiellement: ${sensitiveNeighbor}.`
      : criticalCount > 0 || watchCount > 0
        ? 'Urgence qui demeure: prévoir un suivi au prochain tour.'
        : 'Effet secondaire favorable: l’urgence locale baisse sans surcharge visible.';
  const queueState = buildRecommendedMilitaryQueueState(province, recommendedAction);

  return {
    empty: !recommendedAction,
    tone: criticalCount > 0 ? 'danger' : watchCount > 0 ? 'warning' : 'ready',
    provinceId: province.provinceId,
    provinceLabel: province.label,
    actionCode: recommendedAction?.actionCode ?? 'WAR-HOLD',
    actionLabel: recommendedAction?.label ?? 'Aucune action militaire recommandée',
    confidence: recommendedAction ? 'calculé: action recommandée + projection actuelle' : 'estimé prudent: aucune action disponible',
    queueState,
    horizon: recommendedAction?.expectedResult ?? 'Horizon prévu: aucun engagement militaire recommandé.',
    effects: [
      { label: 'Pression', value: pressureValue, source: projection.drivers.some((driver) => driver.label === 'Pression') ? 'calculé' : 'estimé prudent' },
      { label: 'Stabilité projetée', value: stabilityValue, source: 'calculé' },
      { label: 'Risque critique restant', value: residualRisk, source: criticalCount > 0 || watchCount > 0 ? 'calculé' : 'estimé prudent' },
    ],
    sideEffect,
  };
}
function buildFrontDecisionDependencies(province, shell, projection, actionQueue, risks) {
  if (!province || !projection) {
    return [];
  }

  const dependencies = [];
  const hasDriver = (label) => projection.drivers.some((driver) => driver.label === label);
  const neighborFront = shell.provinces.find((candidate) => province.neighborIds.includes(candidate.provinceId) && (candidate.contested || candidate.occupied));
  const blockedAction = actionQueue.find((entry) => entry.status === 'blocked');
  const riskyAction = actionQueue.find((entry) => entry.status === 'risky');
  const stabilityValue = projection.lines.find((line) => line.label === 'Stabilité attendue')?.value ?? projection.title;

  if (hasDriver('Front voisin') && neighborFront) {
    dependencies.push({
      kind: 'military',
      label: `Soutenir ${neighborFront.label}`,
      reason: 'Front voisin conditionne la pression locale.',
    });
  } else if (hasDriver('Pression')) {
    dependencies.push({
      kind: 'military',
      label: 'Neutraliser marqueur adverse',
      reason: risks[0]?.summary ?? 'Pression ennemie visible avant engagement.',
    });
  }

  if (blockedAction) {
    dependencies.push({
      kind: 'logistics',
      label: 'Débloquer contrainte logistique',
      reason: `${blockedAction.label} reste bloquée avant succès probable.`,
    });
  } else if (hasDriver('Fatigue / supply') || ['collapsed', 'disrupted', 'strained'].includes(province.supplyLevel)) {
    dependencies.push({
      kind: 'logistics',
      label: `Sécuriser ravitaillement ${province.supplyTone}`,
      reason: 'La contrainte supply conditionne le coût réel de l’action.',
    });
  }

  if (dependencies.length < 2 && (projection.tone !== 'ready' || riskyAction)) {
    dependencies.push({
      kind: 'stability',
      label: 'Confirmer stabilité projetée',
      reason: `${stabilityValue}; ${riskyAction ? `${riskyAction.label} reste risquée.` : 'suivi nécessaire avant commit.'}`,
    });
  }

  return dependencies.slice(0, 2);
}

function buildFrontDecisionRippleEffects(province, projection, recommendedAction, dependencies, risks) {
  if (!province || !projection) {
    return [];
  }

  const effects = [];
  const stabilityValue = projection.lines.find((line) => line.label === 'Stabilité attendue')?.value ?? projection.title;
  const leadRisk = risks[0] ?? { label: 'Risque acceptable', tone: 'covered' };
  const militaryDependency = dependencies.find((dependency) => dependency.kind === 'military');
  const logisticsDependency = dependencies.find((dependency) => dependency.kind === 'logistics');

  effects.push({
    kind: 'military',
    impact: projection.tone === 'ready' ? 'positive' : projection.tone === 'danger' ? 'critical' : 'warning',
    label: projection.tone === 'ready' ? 'Front stabilisé' : 'Front encore fragile',
    detail: recommendedAction ? `${recommendedAction.actionCode}: ${stabilityValue}` : stabilityValue,
    rank: projection.tone === 'danger' ? 1 : projection.tone === 'warning' ? 2 : 4,
  });

  if (militaryDependency) {
    effects.push({
      kind: 'ally',
      impact: 'warning',
      label: 'Province alliée impactée',
      detail: militaryDependency.reason,
      rank: 2,
    });
  }

  if (logisticsDependency) {
    effects.push({
      kind: 'logistics',
      impact: 'warning',
      label: 'Tension logistique',
      detail: logisticsDependency.reason,
      rank: 3,
    });
  } else if ((province.loyalty ?? 100) < 50) {
    effects.push({
      kind: 'culture',
      impact: 'warning',
      label: 'Tension locale',
      detail: `Loyauté ${province.loyalty}: l’engagement peut raviver une fracture culturelle visible.`,
      rank: 3,
    });
  }

  effects.push({
    kind: 'delay',
    impact: leadRisk.tone === 'critical' ? 'critical' : 'warning',
    label: 'Si retardée',
    detail: leadRisk.summary ?? leadRisk.label,
    rank: leadRisk.tone === 'critical' ? 1 : 5,
  });

  return effects
    .sort((left, right) => left.rank - right.rank || left.label.localeCompare(right.label))
    .slice(0, 3);
}

function buildCriticalFrontDecisionComparison(shell, intrigueView = null) {
  const priorities = buildFrontPriorityRanking(shell, intrigueView)
    .filter((priority) => priority.tone !== 'ready')
    .slice(0, 4);

  if (priorities.length === 0) {
    return {
      empty: true,
      title: 'Comparaison décisions fronts',
      summary: 'Aucun front critique visible à comparer pour ce tour.',
      decisions: [],
    };
  }

  const decisions = priorities.map((priority, index) => {
    const province = shell.provinces.find((candidate) => candidate.provinceId === priority.provinceId) ?? null;
    const focusContext = province ? {
      focusedProvinceId: province.provinceId,
      focusedProvince: province,
      neighborIds: new Set(province.neighborIds),
    } : null;
    const actionQueue = province && focusContext
      ? buildSelectedProvinceActionQueue(province, shell, focusContext, intrigueView)
      : [];
    const projection = province && focusContext
      ? buildProjectedFrontStability(province, shell, actionQueue)
      : null;
    const risks = province && projection
      ? buildCriticalFrontRiskWarnings(province, projection)
      : [];
    const recommendedAction = actionQueue[0] ?? null;
    const leadRisk = risks[0] ?? { label: priority.leadRisk, driver: 'Projection', tone: priority.tone === 'danger' ? 'critical' : 'watch' };
    const stabilityValue = projection?.lines.find((line) => line.label === 'Stabilité attendue')?.value ?? 'stabilité non calculée';
    const blockedCount = actionQueue.filter((entry) => entry.status === 'blocked').length;
    const riskyCount = actionQueue.filter((entry) => entry.status === 'risky').length;
    const dominantCause = leadRisk.driver === 'Fatigue / supply'
      ? `Ravitaillement ${province?.supplyTone ?? 'fragile'}`
      : leadRisk.driver === 'Front voisin'
        ? 'Pression front voisin'
        : leadRisk.driver === 'Pression'
          ? 'Pression ennemie visible'
          : leadRisk.label;
    const ignoredRisk = leadRisk.tone === 'critical' || priority.tone === 'danger'
      ? `Ignorer: brèche probable (${stabilityValue}).`
      : leadRisk.tone === 'watch' || priority.tone === 'warning'
        ? `Ignorer: suivi nécessaire au prochain tour (${stabilityValue}).`
        : `Ignorer: surveillance suffisante (${stabilityValue}).`;
    const costRisk = recommendedAction
      ? `${recommendedAction.orderCost} · ${recommendedAction.mainRisk}`
      : blockedCount > 0
        ? `${blockedCount} option${blockedCount > 1 ? 's' : ''} bloquée${blockedCount > 1 ? 's' : ''}; arbitrage manuel requis.`
        : riskyCount > 0
          ? `${riskyCount} option${riskyCount > 1 ? 's' : ''} risquée${riskyCount > 1 ? 's' : ''}; garder une réserve.`
          : ignoredRisk;
    const dependencies = buildFrontDecisionDependencies(province, shell, projection, actionQueue, risks);
    const rippleEffects = buildFrontDecisionRippleEffects(province, projection, recommendedAction, dependencies, risks);

    return {
      rank: index + 1,
      provinceId: priority.provinceId,
      provinceLabel: priority.provinceLabel,
      tone: priority.tone,
      threatLevel: priority.tone === 'danger' ? 'Critique' : priority.tone === 'warning' ? 'Sous tension' : 'À surveiller',
      dominantCause,
      recommendedAction: recommendedAction?.label ?? priority.actionCode,
      actionCode: recommendedAction?.actionCode ?? priority.actionCode,
      costRisk,
      ignoredRisk,
      dependencies,
      rippleEffects,
      comparison: index === 0
        ? 'Choix recommandé en premier: menace cumulée maximale.'
        : `Comparer après ${priorities[index - 1].provinceLabel}: menace ${priority.score} vs ${priorities[index - 1].score}.`,
    };
  });

  return {
    empty: false,
    title: 'Comparaison décisions fronts',
    summary: `${decisions.length} front${decisions.length > 1 ? 's' : ''} critique${decisions.length > 1 ? 's' : ''} visible${decisions.length > 1 ? 's' : ''}: choisir la prochaine action sans perdre les filtres carte.`,
    decisions,
  };
}

function renderCriticalFrontDecisionComparison(shell, intrigueView = null) {
  const comparison = buildCriticalFrontDecisionComparison(shell, intrigueView);

  if (comparison.empty) {
    return `
      <section class="critical-front-decision-comparison is-empty" aria-label="Comparaison des décisions de fronts critiques">
        <div class="critical-front-decision-comparison__header">
          <strong>${comparison.title}</strong>
          <span>calme</span>
        </div>
        <p>${comparison.summary}</p>
      </section>
    `;
  }

  return `
    <section class="critical-front-decision-comparison" aria-label="Comparaison des décisions de fronts critiques">
      <div class="critical-front-decision-comparison__header">
        <div>
          <strong>${comparison.title}</strong>
          <p>${comparison.summary}</p>
        </div>
        <span>navigation rapide</span>
      </div>
      <div class="critical-front-decision-comparison__grid">
        ${comparison.decisions.map((decision) => `
          <button class="critical-front-decision critical-front-decision--${decision.tone}" type="button" data-province-id="${decision.provinceId}" data-readiness-focus="${decision.provinceId}" aria-label="Comparer ${decision.provinceLabel}: ${decision.threatLevel}">
            <div class="critical-front-decision__title">
              <strong>#${decision.rank} ${decision.provinceLabel}</strong>
              <code>${decision.actionCode}</code>
            </div>
            <dl>
              <div><dt>Menace</dt><dd>${decision.threatLevel}</dd></div>
              <div><dt>Cause</dt><dd>${decision.dominantCause}</dd></div>
              <div><dt>Action</dt><dd>${decision.recommendedAction}</dd></div>
              <div><dt>Coût / risque</dt><dd>${decision.costRisk}</dd></div>
            </dl>
            ${decision.dependencies.length > 0 ? `
              <div class="critical-front-decision__dependencies" aria-label="Dépendances avant engagement">
                <span>Dépendances</span>
                ${decision.dependencies.map((dependency) => `
                  <em class="critical-front-decision__dependency critical-front-decision__dependency--${dependency.kind}"><b>${dependency.label}</b>${dependency.reason}</em>
                `).join('')}
              </div>
            ` : ''}
            ${decision.rippleEffects.length > 0 ? `
              <div class="critical-front-decision__ripples" aria-label="Effets domino avant ajout à la file">
                <span>Effets domino</span>
                ${decision.rippleEffects.map((effect) => `
                  <em class="critical-front-decision__ripple critical-front-decision__ripple--${effect.kind} critical-front-decision__ripple--${effect.impact}"><b>${effect.label}</b>${effect.detail}</em>
                `).join('')}
              </div>
            ` : ''}
            <small>${decision.ignoredRisk} ${decision.comparison}</small>
          </button>
        `).join('')}
      </div>
    </section>
  `;
}



function renderRecommendedMilitaryActionPreview(shell, intrigueView = null) {
  const preview = buildRecommendedMilitaryActionPreview(shell, intrigueView);

  return `
    <section class="recommended-action-preview recommended-action-preview--${preview.tone} ${preview.empty ? 'is-empty' : ''}" aria-label="Aperçu après action militaire recommandée">
      <div class="recommended-action-preview__header">
        <div>
          <span>Aperçu action recommandée</span>
          <strong>${preview.provinceLabel}</strong>
        </div>
        <code>${preview.actionCode}</code>
      </div>
      <p><strong>${preview.actionLabel}</strong> · ${preview.confidence}</p>
      <div class="recommended-action-preview__effects">
        ${preview.effects.map((effect) => `
          <article class="recommended-action-preview__effect">
            <span>${effect.label}</span>
            <strong>${effect.value}</strong>
            <small>${effect.source}</small>
          </article>
        `).join('')}
      </div>
      <div class="recommended-action-preview__queue recommended-action-preview__queue--${preview.queueState.status}">
        <div>
          <strong>${preview.queueState.label}</strong>
          <span>${preview.queueState.detail}</span>
          <small>${preview.horizon}</small>
        </div>
        <button type="button" data-queue-recommended-action="true" data-province-id="${preview.provinceId ?? ''}" data-action-code="${preview.actionCode}" ${preview.queueState.disabled ? 'disabled' : ''}>${preview.queueState.buttonLabel}</button>
      </div>
      <small class="recommended-action-preview__side-effect">${preview.sideEffect}</small>
    </section>
  `;
}



function buildQueuedMilitaryResolutionSummary(shell, intrigueView = null) {
  const queuedAction = state.acceptedRecommendedMilitaryAction;

  if (!queuedAction) {
    return {
      empty: true,
      tone: 'ready',
      title: 'Aucune résolution militaire en attente',
      summary: 'Aucune action militaire ajoutée depuis la carte: le tour peut être validé sans changement de front immédiat.',
      items: [],
      conflicts: [],
    };
  }

  const province = shell.provinces.find((candidate) => candidate.provinceId === queuedAction.provinceId) ?? null;

  if (!province) {
    return {
      empty: false,
      tone: 'warning',
      title: 'Action en file à vérifier',
      summary: `${queuedAction.actionCode} référence une province introuvable avant résolution.`,
      items: [{
        provinceLabel: queuedAction.provinceLabel,
        actionCode: queuedAction.actionCode,
        target: 'province indisponible',
        effect: 'résolution suspendue tant que la cible n’est pas retrouvée',
        pressure: 'pression inconnue',
        residualRisk: 'risque à vérifier',
        status: 'risky',
      }],
      conflicts: ['Cible introuvable: vérifier la sélection avant de valider le tour.'],
    };
  }

  const focusContext = {
    focusedProvinceId: province.provinceId,
    focusedProvince: province,
    neighborIds: new Set(province.neighborIds),
  };
  const actionQueue = buildSelectedProvinceActionQueue(province, shell, focusContext, intrigueView);
  const action = actionQueue.find((entry) => entry.actionCode === queuedAction.actionCode) ?? actionQueue[0] ?? null;
  const projection = buildProjectedFrontStability(province, shell, actionQueue);
  const risks = buildCriticalFrontRiskWarnings(province, projection);
  const stability = projection.lines.find((line) => line.label === 'Stabilité attendue')?.value ?? projection.title;
  const pressure = projection.drivers.some((driver) => driver.label === 'Pression')
    ? 'pression ennemie encore visible'
    : projection.tone === 'ready'
      ? 'pression en baisse'
      : 'pression contestée';
  const residualRisk = risks[0]?.label ?? 'Risque acceptable';
  const duplicateCount = actionQueue.filter((entry) => entry.actionCode === queuedAction.actionCode).length;
  const conflicts = [];

  if (duplicateCount > 1) {
    conflicts.push(`${queuedAction.actionCode} apparaît ${duplicateCount} fois dans la file locale.`);
  }

  if (action?.status === 'blocked') {
    conflicts.push('Action bloquée: la province resterait critique après résolution.');
  }

  if (action?.status === 'risky') {
    conflicts.push('Action risquée: confirmer l’appui avant commit du tour.');
  }

  return {
    empty: false,
    tone: conflicts.length > 0 ? (action?.status === 'blocked' ? 'danger' : 'warning') : 'ready',
    title: 'Résolution militaire prête',
    summary: `${queuedAction.actionCode} sera résolue au prochain commit de tour pour ${province.label}.`,
    items: [{
      provinceLabel: province.label,
      actionCode: queuedAction.actionCode,
      target: province.contested ? `Front contesté ${province.label}` : `Province ${province.label}`,
      effect: action?.expectedResult ?? `Stabilité prévue: ${stability}.`,
      pressure,
      residualRisk,
      status: action?.status ?? 'ready',
      stability,
    }],
    conflicts,
  };
}

function renderQueuedMilitaryResolutionSummary(shell, intrigueView = null) {
  const report = buildQueuedMilitaryResolutionSummary(shell, intrigueView);

  return `
    <section class="queued-military-resolution queued-military-resolution--${report.tone} ${report.empty ? 'is-empty' : ''}" aria-label="Résumé de résolution militaire avant validation du tour">
      <div class="queued-military-resolution__header">
        <div>
          <span>Résolution avant commit</span>
          <strong>${report.title}</strong>
        </div>
        <small>${report.items.length} action${report.items.length > 1 ? 's' : ''}</small>
      </div>
      <p>${report.summary}</p>
      ${report.items.length > 0 ? `
        <div class="queued-military-resolution__items">
          ${report.items.map((item) => `
            <article class="queued-military-resolution__item queued-military-resolution__item--${item.status}">
              <div>
                <strong>${item.provinceLabel}</strong>
                <code>${item.actionCode}</code>
              </div>
              <dl>
                <div><dt>Cible / front</dt><dd>${item.target}</dd></div>
                <div><dt>Stabilité</dt><dd>${item.stability}</dd></div>
                <div><dt>Pression ennemie</dt><dd>${item.pressure}</dd></div>
                <div><dt>Risque restant</dt><dd>${item.residualRisk}</dd></div>
              </dl>
              <p>${item.effect}</p>
            </article>
          `).join('')}
        </div>
      ` : ''}
      <div class="queued-military-resolution__conflicts ${report.conflicts.length > 0 ? 'has-conflicts' : ''}">
        <strong>${report.conflicts.length > 0 ? 'Conflits à vérifier' : 'Aucun conflit de file détecté'}</strong>
        <span>${report.conflicts.length > 0 ? report.conflicts.join(' · ') : 'Pas de doublon militaire carte avant validation du tour.'}</span>
      </div>
    </section>
  `;
}

function buildQueuedMilitaryMapActionConfirmation(province, shell, intrigueView = null) {
  const queuedAction = state.acceptedRecommendedMilitaryAction;

  if (!queuedAction || queuedAction.provinceId !== province.provinceId) {
    return null;
  }

  const focusContext = {
    focusedProvinceId: province.provinceId,
    focusedProvince: province,
    neighborIds: new Set(province.neighborIds),
  };
  const actionQueue = buildSelectedProvinceActionQueue(province, shell, focusContext, intrigueView);
  const action = actionQueue.find((entry) => entry.actionCode === queuedAction.actionCode) ?? actionQueue[0] ?? null;
  const projection = buildProjectedFrontStability(province, shell, actionQueue);
  const stability = projection.lines.find((line) => line.label === 'Stabilité attendue')?.value ?? projection.title;
  const target = province.contested ? `Front contesté ${province.label}` : `Province ${province.label}`;

  return {
    actionCode: queuedAction.actionCode,
    actionLabel: action?.label ?? queuedAction.actionCode,
    target,
    status: action?.status ?? 'ready',
    mainEffect: action?.expectedResult ?? `Stabilité prévue: ${stability}.`,
    risk: action?.mainRisk ?? 'risque contenu avant résolution',
    queuedTurn: queuedAction.turn,
    stability,
  };
}

function renderQueuedMilitaryMapActionConfirmation(province, shell, intrigueView = null) {
  const confirmation = buildQueuedMilitaryMapActionConfirmation(province, shell, intrigueView);

  if (!confirmation) {
    return '';
  }

  return `
    <section class="queued-map-action-confirmation queued-map-action-confirmation--${confirmation.status}" aria-label="Confirmation de l’action militaire ajoutée depuis la carte">
      <div class="queued-map-action-confirmation__header">
        <div>
          <span>Action carte en file</span>
          <strong>${confirmation.actionLabel}</strong>
        </div>
        <code>${confirmation.actionCode}</code>
      </div>
      <dl>
        <div><dt>Cible / front</dt><dd>${confirmation.target}</dd></div>
        <div><dt>Effet prévu</dt><dd>${confirmation.mainEffect}</dd></div>
        <div><dt>Stabilité</dt><dd>${confirmation.stability}</dd></div>
        <div><dt>Risque principal</dt><dd>${confirmation.risk}</dd></div>
      </dl>
      <div class="queued-map-action-confirmation__footer">
        <small>Ajoutée au tour ${confirmation.queuedTurn}, modifiable avant résolution.</small>
        <button type="button" data-undo-recommended-action="true" data-province-id="${province.provinceId}">Retirer de la file</button>
      </div>
    </section>
  `;
}



function buildConflictReadinessWarnings(shell, intrigueView = null) {
  return shell.provinces
    .map((province) => {
      const focusContext = {
        focusedProvinceId: province.provinceId,
        focusedProvince: province,
        neighborIds: new Set(province.neighborIds),
      };
      const actionQueue = buildSelectedProvinceActionQueue(province, shell, focusContext, intrigueView);
      const outcome = buildConflictOutcomePreview(province, shell);
      const blockedCount = actionQueue.filter((entry) => entry.status === 'blocked').length;
      const riskyCount = actionQueue.filter((entry) => entry.status === 'risky').length;
      const plannedAction = actionQueue[0] ?? null;
      const score = (outcome.tone === 'danger' ? 40 : outcome.tone === 'warning' ? 24 : 8) + (blockedCount * 8) + (riskyCount * 4) + (province.contested ? 6 : 0);

      const tone = blockedCount > 0 || outcome.tone === 'danger' ? 'danger' : riskyCount > 0 || outcome.tone === 'warning' ? 'warning' : 'ready';

      return {
        provinceId: province.provinceId,
        provinceLabel: province.label,
        focusTargetLabel: province.contested ? 'front contesté' : `province ${province.label}`,
        actionCode: plannedAction?.actionCode ?? 'WAR-HOLD',
        actionLabel: plannedAction?.label ?? 'Aucune action planifiée',
        tone,
        severityRank: tone === 'danger' ? 1 : tone === 'warning' ? 2 : 3,
        expectedImpact: score,
        priorityLabel: tone === 'danger' ? 'Priorité critique' : tone === 'warning' ? 'À vérifier' : 'Couvert',
        detail: outcome.tone === 'danger'
          ? `${outcome.title}: défense et ravitaillement restent mal couverts.`
          : outcome.tone === 'warning'
            ? `${outcome.title}: confirmer seulement avec appui adjacent.`
            : `${outcome.title}: couverture suffisante avant fin de tour.`,
      };
    })
    .sort((left, right) => left.severityRank - right.severityRank || right.expectedImpact - left.expectedImpact || left.provinceLabel.localeCompare(right.provinceLabel))
    .slice(0, 3);
}

function renderConflictReadinessWarnings(shell, intrigueView = null) {
  const warnings = buildConflictReadinessWarnings(shell, intrigueView);
  const primaryWarning = warnings[0] ?? null;

  return `
    <div class="conflict-readiness-summary" tabindex="0" data-readiness-summary="true" data-readiness-default-province="${primaryWarning?.provinceId ?? ''}" data-readiness-default-tone="${primaryWarning?.tone ?? ''}" aria-label="Préparation conflit avant fin de tour">
      <div class="conflict-readiness-summary__header">
        <strong>Préparation conflit</strong>
        <span>${warnings.length} points clés</span>
      </div>
      <div class="conflict-readiness-summary__list">
        ${warnings.map((warning) => `
          <button class="conflict-readiness-warning conflict-readiness-warning--${warning.tone}" type="button" data-province-id="${warning.provinceId}" data-readiness-focus="${warning.provinceId}" data-readiness-tone="${warning.tone}" aria-label="Focaliser ${warning.focusTargetLabel}: ${warning.priorityLabel}">
            <div>
              <strong>${warning.provinceLabel}</strong>
              <span>${warning.priorityLabel} · ${warning.focusTargetLabel}</span>
            </div>
            <small>${warning.actionCode} · ${warning.actionLabel}</small>
            <p>${warning.detail}</p>
            <small class="conflict-readiness-warning__tooltip">Carte: ${warning.focusTargetLabel} · ${warning.tone === 'danger' ? 'menace immédiate' : warning.tone === 'warning' ? 'préparation insuffisante' : 'opportunité tactique'}</small>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}


function buildSelectedProvinceConflictNextAction(province, shell, focusContext, intrigueView = null) {
  const warnings = buildConflictReadinessWarnings(shell, intrigueView);
  const directWarning = warnings.find((warning) => warning.provinceId === province.provinceId) ?? null;
  const neighborWarning = warnings.find((warning) => province.neighborIds.includes(warning.provinceId)) ?? null;
  const warning = directWarning ?? neighborWarning;

  if (!warning) {
    return null;
  }

  const targetProvince = shell.provinces.find((candidate) => candidate.provinceId === warning.provinceId) ?? province;
  const relation = directWarning ? 'focus conflit sélectionné' : `voisine du focus conflit ${targetProvince.label}`;
  const actionQueue = buildSelectedProvinceActionQueue(directWarning ? province : targetProvince, shell, {
    focusedProvinceId: targetProvince.provinceId,
    focusedProvince: targetProvince,
    selectedProvince: province,
    neighborIds: new Set(targetProvince.neighborIds),
  }, intrigueView);
  const nextAction = actionQueue[0] ?? null;

  return {
    tone: warning.tone,
    priority: warning.priorityLabel,
    reason: warning.detail,
    relation,
    provinceLabel: province.label,
    targetLabel: warning.focusTargetLabel,
    frontLabel: targetProvince.contested ? `Front contesté ${targetProvince.label}` : `Front ${targetProvince.label}`,
    actionCode: nextAction?.actionCode ?? warning.actionCode,
    suggestedAction: directWarning
      ? nextAction?.label ?? warning.actionLabel
      : `Appuyer ${targetProvince.label}: ${nextAction?.label ?? warning.actionLabel}`,
  };
}

function renderSelectedProvinceConflictNextAction(province, shell, focusContext, intrigueView = null) {
  const nextAction = buildSelectedProvinceConflictNextAction(province, shell, focusContext, intrigueView);

  if (!nextAction) {
    return '';
  }

  return `
    <section class="province-conflict-next-action province-conflict-next-action--${nextAction.tone}" aria-label="Prochaine action conflit">
      <div class="province-conflict-next-action__header">
        <div>
          <span>Prochaine action conflit</span>
          <strong>${nextAction.priority}</strong>
        </div>
        <code>${nextAction.actionCode}</code>
      </div>
      <dl class="province-conflict-next-action__facts">
        <div><dt>Province</dt><dd>${nextAction.provinceLabel}</dd></div>
        <div><dt>Front concerné</dt><dd>${nextAction.frontLabel}</dd></div>
        <div><dt>Cible</dt><dd>${nextAction.targetLabel}</dd></div>
        <div><dt>Relation</dt><dd>${nextAction.relation}</dd></div>
      </dl>
      <p>${nextAction.reason}</p>
      <strong class="province-conflict-next-action__suggestion">${nextAction.suggestedAction}</strong>
    </section>
  `;
}



function buildIntrigueExposureFocusTarget(province, drillDown, leadWarning, response, mitigated) {
  if (mitigated && drillDown) {
    return {
      state: 'confirmed',
      kind: response.code === 'exposer' ? 'cellule' : 'hotspot',
      provinceId: province.provinceId,
      targetId: response.code === 'exposer' ? drillDown.primaryCelluleId ?? drillDown.locationId : drillDown.locationId,
      label: response.code === 'exposer'
        ? `Cellule ${drillDown.primaryCelluleId ?? 'locale'} confirmée`
        : `Hotspot confirmé ${drillDown.locationName}`,
      hint: 'focus confirmé',
      visibilityLabel: 'Révélé',
      privacyReason: 'Renseignement confirmé: le focus peut afficher la cible précise.',
      ariaLabel: response.code === 'exposer'
        ? `Focaliser cellule confirmée en ${province.label}`
        : `Focaliser hotspot confirmé en ${province.label}`,
      focusable: true,
    };
  }

  if (drillDown?.primaryCelluleId) {
    return {
      state: 'confirmed',
      kind: 'cellule',
      provinceId: province.provinceId,
      targetId: drillDown.primaryCelluleId,
      label: `Cellule ${drillDown.primaryCelluleId}`,
      hint: 'cible confirmée',
      visibilityLabel: 'Révélé',
      privacyReason: 'Cellule identifiée par le drilldown: aucun brouillard restant sur cette cible.',
      ariaLabel: `Focaliser cellule confirmée en ${province.label}`,
      focusable: true,
    };
  }

  if (drillDown?.locationId) {
    return {
      state: 'confirmed',
      kind: 'hotspot',
      provinceId: province.provinceId,
      targetId: drillDown.locationId,
      label: `Hotspot ${drillDown.locationName}`,
      hint: 'hotspot confirmé',
      visibilityLabel: 'Révélé',
      privacyReason: 'Hotspot local confirmé: le focus peut afficher la province sans masquer la source.',
      ariaLabel: `Focaliser hotspot confirmé en ${province.label}`,
      focusable: true,
    };
  }

  if (leadWarning?.tone !== 'masked') {
    return {
      state: 'probable',
      kind: 'province-fog',
      provinceId: province.provinceId,
      targetId: province.provinceId,
      label: `Zone probable ${province.label}`,
      hint: 'zone probable',
      visibilityLabel: 'Partiellement révélé',
      privacyReason: 'Signal agrégé par le brouillard: seules la province et la raison de soupçon sont affichées.',
      ariaLabel: `Focaliser zone probable sans révéler cellule ou opération en ${province.label}`,
      focusable: true,
    };
  }

  return {
    state: 'masked',
    kind: 'province-fog',
    provinceId: province.provinceId,
    targetId: province.provinceId,
    label: `Cible masquée par le brouillard en ${province.label}`,
    hint: 'voir zone masquée',
    visibilityLabel: 'Masqué',
    privacyReason: 'Brouillard préservé: focus limité à la province, cellule et opération restent cachées.',
    ariaLabel: `Focaliser zone masquée sans révéler cible intrigue en ${province.label}`,
    focusable: true,
  };
}

function buildMapIntrigueExposureSummary(shell, intrigueView = null) {
  const warnings = shell.provinces
    .map((province) => {
      const focusContext = {
        focusedProvinceId: province.provinceId,
        focusedProvince: province,
        neighborIds: new Set(province.neighborIds),
      };
      const actionQueue = buildSelectedProvinceActionQueue(province, shell, focusContext, intrigueView);
      const localWarnings = buildProvinceIntrigueRiskWarnings(province, actionQueue, intrigueView);
      const lead = localWarnings[0] ?? null;
      const drillDown = findProvinceIntrigueDrillDown(province, intrigueView);
      const response = drillDown?.quickResponses?.find((candidate) => candidate.code === drillDown.recommendedResponseCode)
        ?? drillDown?.quickResponses?.[0]
        ?? null;

      if (!lead && !response) {
        return null;
      }

      const mitigated = response && ['contenir', 'exposer'].includes(response.code) && response.escalationProbability !== 'élevée';

      const focusTarget = buildIntrigueExposureFocusTarget(province, drillDown, lead, response, mitigated);

      return {
        provinceId: province.provinceId,
        provinceLabel: province.label,
        tone: mitigated ? 'mitigated' : lead?.tone ?? 'masked',
        label: mitigated ? 'Exposition réduite' : lead.label,
        risk: mitigated ? response.label : lead.label,
        consequence: mitigated
          ? `${response.label}: ${response.aftermathSummary ?? response.summary}`
          : lead.detail,
        trigger: mitigated ? response.code : lead.trigger,
        priority: mitigated ? 4 : lead.priority,
        focusTarget,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.priority - right.priority || left.provinceLabel.localeCompare(right.provinceLabel))
    .slice(0, 4);
  const residualCount = warnings.filter((warning) => warning.tone !== 'mitigated').length;
  const mitigatedCount = warnings.filter((warning) => warning.tone === 'mitigated').length;

  return {
    state: residualCount > 0 ? 'warning' : mitigatedCount > 0 ? 'mitigated' : 'clear',
    residualCount,
    mitigatedCount,
    warnings,
    summary: residualCount > 0
      ? `${residualCount} risque${residualCount > 1 ? 's' : ''} intrigue reste${residualCount > 1 ? 'nt' : ''} actif${residualCount > 1 ? 's' : ''} avant fin de tour.`
      : mitigatedCount > 0
        ? `${mitigatedCount} exposition${mitigatedCount > 1 ? 's' : ''} intrigue fortement réduite${mitigatedCount > 1 ? 's' : ''} par le plan actuel.`
        : 'Récap intrigue clair: aucun hotspot ou cooldown critique laissé ouvert.',
  };
}

function renderMapIntrigueExposureSummary(summary) {
  if (summary.warnings.length === 0) {
    return `
      <section class="map-intrigue-exposure-summary map-intrigue-exposure-summary--clear" aria-label="Résumé intrigue de fin de tour">
        <strong>Intrigue fin de tour</strong>
        <p>${summary.summary}</p>
      </section>
    `;
  }

  return `
    <section class="map-intrigue-exposure-summary map-intrigue-exposure-summary--${summary.state}" aria-label="Résumé intrigue de fin de tour">
      <div class="map-intrigue-exposure-summary__header">
        <strong>Intrigue fin de tour</strong>
        <span>${summary.residualCount} résiduel${summary.residualCount > 1 ? 's' : ''} · ${summary.mitigatedCount} réduit${summary.mitigatedCount > 1 ? 's' : ''}</span>
      </div>
      <p>${summary.summary}</p>
      <ul class="map-intrigue-exposure-summary__list">
        ${summary.warnings.map((warning) => `
          <li class="map-intrigue-exposure-summary__item map-intrigue-exposure-summary__item--${warning.tone} map-intrigue-exposure-summary__item--${warning.focusTarget.state}">
            <div>
              <b>${warning.provinceLabel}</b>
              ${warning.focusTarget.focusable ? `<button type="button" data-province-id="${warning.focusTarget.provinceId}" data-intrigue-focus-target="${warning.focusTarget.kind}:${warning.focusTarget.targetId}" data-intrigue-fog-state="${warning.focusTarget.state}" aria-label="${warning.focusTarget.ariaLabel}">${warning.focusTarget.hint}</button>` : `<em>${warning.focusTarget.hint}</em>`}
            </div>
            <span>${warning.risk}</span>
            <small><b>${warning.focusTarget.visibilityLabel}</b> · ${warning.focusTarget.label} · ${warning.trigger} · ${warning.focusTarget.privacyReason} · ${warning.consequence}</small>
          </li>
        `).join('')}
      </ul>
    </section>
  `;
}

function getActiveIntrigueExposureOutcomeFilters() {
  return Object.entries(state.intrigueExposureOutcomeFilters)
    .filter(([, active]) => active)
    .map(([key]) => key);
}

function filterPostCommitIntrigueExposureMarkers(markers) {
  const activeFilters = getActiveIntrigueExposureOutcomeFilters();

  if (activeFilters.length === 0) {
    return markers;
  }

  return markers.filter((marker) => activeFilters.includes(marker.direction));
}

function buildIntrigueExposureMarkerRollup(markers) {
  const filteredMarkers = filterPostCommitIntrigueExposureMarkers(markers);
  const counts = {
    lowered: markers.filter((marker) => marker.direction === 'lowered').length,
    unchanged: markers.filter((marker) => marker.direction === 'unchanged').length,
    increased: markers.filter((marker) => marker.direction === 'increased').length,
    hidden: markers.filter((marker) => marker.direction === 'hidden').length,
  };
  const activeFilters = getActiveIntrigueExposureOutcomeFilters();
  const certaintyGroups = {
    confirmed: markers.filter((marker) => marker.certainty === 'confirmed'),
    suspected: markers.filter((marker) => marker.certainty === 'suspected'),
    unknown: markers.filter((marker) => marker.certainty === 'unknown'),
  };
  const certaintyCopy = {
    confirmed: `${certaintyGroups.confirmed.length} confirmé${certaintyGroups.confirmed.length > 1 ? 's' : ''}: résultat appuyé par un signal visible consolidé.`,
    suspected: `${certaintyGroups.suspected.length} soupçon${certaintyGroups.suspected.length > 1 ? 's' : ''}: tendance lisible, mais source ou relais encore partiellement masqué.`,
    unknown: `${certaintyGroups.unknown.length} zone${certaintyGroups.unknown.length > 1 ? 's' : ''} inconnue${certaintyGroups.unknown.length > 1 ? 's' : ''}: ne pas assimiler à un faible risque confirmé.`,
  };
  const freshnessCounts = {
    recent: markers.filter((marker) => marker.freshness === 'recent').length,
    stale: markers.filter((marker) => marker.freshness === 'stale').length,
    uncertain: markers.filter((marker) => marker.freshness === 'uncertain').length,
  };
  const freshnessCopy = `${freshnessCounts.recent} récent${freshnessCounts.recent > 1 ? 's' : ''} · ${freshnessCounts.stale} ancien${freshnessCounts.stale > 1 ? 's' : ''} · ${freshnessCounts.uncertain} incertain${freshnessCounts.uncertain > 1 ? 's' : ''}; fraîcheur déduite seulement des signaux visibles.`;
  const resolutionCounts = {
    resolved: markers.filter((marker) => marker.resolutionStatus === 'resolved').length,
    active: markers.filter((marker) => marker.resolutionStatus === 'active').length,
    fogCalmed: markers.filter((marker) => marker.resolutionStatus === 'fog-calmed').length,
  };
  const resolutionCopy = `${resolutionCounts.resolved} traité${resolutionCounts.resolved > 1 ? 's' : ''} récemment · ${resolutionCounts.active} encore actif${resolutionCounts.active > 1 ? 's' : ''} · ${resolutionCounts.fogCalmed} rumeur${resolutionCounts.fogCalmed > 1 ? 's' : ''} calmée${resolutionCounts.fogCalmed > 1 ? 's' : ''}; l’assurance reste confirmée, probable ou rumeur calmée selon les données visibles.`;

  return {
    counts,
    activeFilters,
    filteredCount: filteredMarkers.length,
    totalCount: markers.length,
    certaintyGroups,
    certaintyCopy,
    freshnessCounts,
    freshnessCopy,
    resolutionCounts,
    resolutionCopy,
    summary: activeFilters.length > 0
      ? `${filteredMarkers.length}/${markers.length} marqueur${markers.length > 1 ? 's' : ''} intrigue visible${filteredMarkers.length > 1 ? 's' : ''} après filtre fog-safe.`
      : `${markers.length} marqueur${markers.length > 1 ? 's' : ''} intrigue post-commit visible${markers.length > 1 ? 's' : ''}; aucun filtre d’issue actif.`,
    hiddenCopy: counts.hidden > 0
      ? `${counts.hidden} résultat${counts.hidden > 1 ? 's' : ''} fog-limité${counts.hidden > 1 ? 's' : ''}: province inspectable, cible/cellule/relais masqués.`
      : 'Aucun résultat fog-limité visible dans le rollup actuel.',
  };
}

function buildPostCommitIntrigueExposureMarkers(intrigueView = null, options = {}) {
  const markers = (intrigueView?.map?.entries ?? [])
    .map((entry) => {
      const response = entry.drillDown?.quickResponses?.find((candidate) => candidate.code === entry.drillDown.recommendedResponseCode)
        ?? entry.drillDown?.quickResponses?.[0]
        ?? null;

      if (!response) {
        return null;
      }

      const fogLimited = !entry.showSecondaryDetails && entry.sabotageRiskLevel !== 'high' && entry.metrics.exposedCellCount === 0;
      const direction = fogLimited
        ? 'hidden'
        : ['contenir', 'exposer'].includes(response.code) && response.escalationProbability !== 'élevée'
          ? 'lowered'
          : response.heatGenerated >= 10 || response.escalationProbability === 'élevée'
            ? 'increased'
            : 'unchanged';
      const directionLabels = {
        lowered: 'Exposition réduite',
        unchanged: 'Exposition stable',
        increased: 'Exposition accrue',
        hidden: 'Résultat fog-limité',
      };
      const glyphs = {
        lowered: '↓',
        unchanged: '≈',
        increased: '↑',
        hidden: '?',
      };
      const residualRisk = direction === 'lowered'
        ? 'risque résiduel contenu; vérifier la synthèse finale avant commit'
        : direction === 'increased'
          ? 'risque résiduel élevé; la synthèse finale signale les combinaisons gênantes'
          : direction === 'unchanged'
            ? 'risque résiduel stable; la synthèse finale conserve le détail visible'
            : 'résultat masqué par le brouillard; seule la province reste inspectable';

      const certainty = direction === 'hidden'
        ? 'unknown'
        : entry.metrics.exposedCellCount > 0 || entry.showSecondaryDetails
          ? 'confirmed'
          : 'suspected';
      const certaintyLabels = {
        confirmed: 'confirmé',
        suspected: 'soupçon',
        unknown: 'inconnu',
      };
      const certaintyExplanation = certainty === 'confirmed'
        ? 'certitude confirmée par les marqueurs visibles; pas de détail secret ajouté'
        : certainty === 'suspected'
          ? 'certitude partielle: tendance visible, identité et relais non confirmés'
          : 'certitude inconnue: zone fog-limitée séparée des faibles risques confirmés';
      const freshness = certainty === 'unknown'
        ? 'uncertain'
        : entry.sabotageRiskLevel === 'high' || entry.metrics.exposedCellCount > 0 || response.heatGenerated >= 10
          ? 'recent'
          : 'stale';
      const freshnessLabels = {
        recent: 'info récente',
        stale: 'info ancienne',
        uncertain: 'fraîcheur incertaine',
      };
      const freshnessExplanation = freshness === 'recent'
        ? 'signal récent confirmé par une chaleur ou exposition visible'
        : freshness === 'stale'
          ? 'soupçon ancien à revérifier avant intervention lourde'
          : 'fraîcheur incertaine sous brouillard; vérifier la province sans inférer de cible';
      const resolutionStatus = direction === 'lowered'
        ? 'resolved'
        : direction === 'hidden'
          ? 'fog-calmed'
          : 'active';
      const resolutionLabels = {
        resolved: 'Traité récemment',
        active: 'Menace active',
        'fog-calmed': 'Rumeur calmée',
      };
      const assuranceLevel = resolutionStatus === 'fog-calmed'
        ? 'rumeur calmée'
        : certainty === 'confirmed'
          ? 'confirmé'
          : 'probable';
      const activeAfterResponse = resolutionStatus === 'active';
      const resolutionDetail = resolutionStatus === 'resolved'
        ? 'alerte calmée par une réponse visible; garder une vérification légère au prochain tour'
        : resolutionStatus === 'fog-calmed'
          ? 'rumeur calmée sous brouillard; aucune source ou cause cachée n’est révélée'
          : direction === 'increased'
            ? 'menace encore active malgré la réponse; chaleur visible à compenser'
            : 'menace encore à surveiller malgré la réponse; ne pas révéler de cause cachée';

      return {
        locationId: entry.locationId,
        locationName: entry.locationName,
        center: {
          x: clampVisualMetric(entry.center.x + 4.4, 5, 95),
          y: clampVisualMetric(entry.center.y + 5.6, 6, 96),
        },
        direction,
        label: directionLabels[direction],
        glyph: glyphs[direction],
        responseLabel: response.label,
        certainty,
        certaintyLabel: certaintyLabels[certainty],
        certaintyExplanation,
        freshness,
        freshnessLabel: freshnessLabels[freshness],
        freshnessExplanation,
        resolutionStatus,
        resolutionLabel: resolutionLabels[resolutionStatus],
        assuranceLevel,
        activeAfterResponse,
        resolutionDetail,
        residualRisk,
        copy: `${resolutionLabels[resolutionStatus]} · assurance ${assuranceLevel} · ${directionLabels[direction]} après résolution · ${freshnessLabels[freshness]} · ${resolutionDetail}.`,
        ariaLabel: `${resolutionLabels[resolutionStatus]} en ${entry.locationName}: assurance ${assuranceLevel}; ${activeAfterResponse ? 'menace reste active' : 'alerte calmée'}; ${freshnessExplanation}; aucun détail caché révélé`,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.locationName.localeCompare(right.locationName))
    .slice(0, 5);

  return options.ignoreFilters ? markers : filterPostCommitIntrigueExposureMarkers(markers);
}

function renderIntrigueExposureMarkerRollup(rollup) {
  if (rollup.totalCount === 0) {
    return '';
  }

  const labels = {
    lowered: 'Réduite',
    unchanged: 'Stable',
    increased: 'Accrue',
    hidden: 'Fog-limité',
  };

  return `
    <section class="intrigue-exposure-marker-rollup" aria-label="Filtres fog-safe des marqueurs exposition intrigue">
      <div class="intrigue-exposure-marker-rollup__header">
        <strong>Marqueurs exposition</strong>
        <span>${rollup.filteredCount}/${rollup.totalCount} visibles</span>
      </div>
      <p>${rollup.summary}</p>
      <div class="intrigue-exposure-marker-rollup__chips">
        ${Object.entries(labels).map(([key, label]) => `
          <button type="button" class="intrigue-exposure-marker-filter ${state.intrigueExposureOutcomeFilters[key] ? 'is-active' : ''}" data-intrigue-exposure-filter="${key}" aria-pressed="${state.intrigueExposureOutcomeFilters[key]}">
            ${label} <b>${rollup.counts[key]}</b>
          </button>
        `).join('')}
      </div>
      <div class="intrigue-exposure-certainty-rollup" aria-label="Niveau de certitude fog-safe des marqueurs intrigue">
        <span><b>Confirmés</b>${rollup.certaintyCopy.confirmed}</span>
        <span><b>Soupçons</b>${rollup.certaintyCopy.suspected}</span>
        <span><b>Inconnues</b>${rollup.certaintyCopy.unknown}</span>
      </div>
      <div class="intrigue-exposure-freshness-rollup" aria-label="Fraîcheur fog-safe des marqueurs intrigue">
        <b>Fraîcheur</b>
        <span>${rollup.freshnessCopy}</span>
        <small>Récent = signal visible actif; ancien = soupçon à revérifier; incertain = zone inconnue sans détail caché.</small>
      </div>
      <div class="intrigue-exposure-resolution-rollup" aria-label="Menaces intrigue traitées ou encore actives">
        <b>Résolution récente</b>
        <span>${rollup.resolutionCopy}</span>
        <small>Une menace active malgré réponse reste affichée sans source ni cause cachée.</small>
      </div>
      <small>${rollup.hiddenCopy}</small>
      <small>Certitude fog-safe: les zones inconnues restent séparées des faibles risques confirmés et ne nomment jamais cellule, cible ou relais.</small>
    </section>
  `;
}

function renderPostCommitIntrigueExposureMarkers(markers) {
  if (!markers.length) {
    return '';
  }

  return `
    <g class="intrigue-post-commit-marker-layer" aria-label="Marqueurs intrigue post-commit fog-safe">
      ${markers.map((marker) => `
        <g class="intrigue-post-commit-marker intrigue-post-commit-marker--${marker.direction} intrigue-post-commit-marker--${marker.resolutionStatus}" data-intrigue-location="${marker.locationId}" tabindex="0" aria-label="${marker.ariaLabel}">
          <title>${marker.copy}</title>
          <circle class="intrigue-post-commit-marker__backplate" cx="${marker.center.x}%" cy="${marker.center.y}%" r="3.3"></circle>
          <text class="intrigue-post-commit-marker__glyph" x="${marker.center.x}%" y="${marker.center.y + 1.15}%" text-anchor="middle">${marker.glyph}</text>
          <text class="intrigue-post-commit-marker__label" x="${marker.center.x + 4.1}%" y="${marker.center.y - 1.15}%" text-anchor="start">${marker.resolutionLabel}</text>
          <text class="intrigue-post-commit-marker__copy" x="${marker.center.x + 4.1}%" y="${marker.center.y + 2.25}%" text-anchor="start">${marker.assuranceLevel} · ${marker.activeAfterResponse ? 'reste active' : 'calmée'} · ${marker.freshnessLabel}</text>
        </g>
      `).join('')}
    </g>
  `;
}


function getActiveAtlasIntrigueSignalFilters() {
  return Object.entries(state.atlasIntrigueSignalFilters)
    .filter(([, active]) => active)
    .map(([key]) => key);
}

function filterWorldMapIntrigueSignals(signals) {
  const activeFilters = getActiveAtlasIntrigueSignalFilters();

  if (activeFilters.length === 0) {
    return signals;
  }

  return signals.filter((signal) => activeFilters.some((filter) => signal.filterTags.includes(filter)));
}

function buildWorldMapIntrigueSignals(intrigueView = null, options = {}) {
  const entries = intrigueView?.map?.entries ?? [];
  const signals = entries.map((entry) => {
    const presenceLabels = {
      high: 'présence forte',
      medium: 'présence probable',
      low: 'présence faible',
      none: 'présence inconnue',
    };
    const riskLabels = {
      high: 'risque sabotage probable',
      medium: 'risque sabotage possible',
      low: 'risque sabotage faible',
      none: 'risque non confirmé',
    };
    const hasSabotageSignal = entry.metrics.sabotageOperationCount > 0 || ['high', 'medium'].includes(entry.sabotageRiskLevel);
    const shadowZone = !entry.showSecondaryDetails || (entry.metrics.exposedCellCount === 0 && entry.presenceLevel !== 'high');
    const assurance = entry.metrics.exposedCellCount > 0 || entry.showSecondaryDetails
      ? 'confirmé'
      : hasSabotageSignal
        ? 'probable'
        : 'zone d’ombre';
    const glyph = hasSabotageSignal
      ? 'S?'
      : shadowZone
        ? '??'
        : 'I';
    const freshness = entry.sabotageRiskLevel === 'high' || entry.metrics.exposedCellCount > 0 || hasSabotageSignal
      ? 'recent'
      : shadowZone
        ? 'uncertain'
        : 'stale';
    const freshnessLabels = {
      recent: 'récent',
      stale: 'ancien',
      uncertain: 'incertain',
    };
    const certainty = assurance === 'confirmé'
      ? 'confirmed'
      : assurance === 'probable'
        ? 'probable'
        : 'uncertain';
    const filterTags = [freshness];

    if (certainty === 'probable') {
      filterTags.push('probable');
    }

    const priorityReason = freshness === 'stale'
      ? 'information ancienne à revérifier avant action directe'
      : freshness === 'uncertain'
        ? 'incertitude élevée: action risquée sans vérification'
        : certainty === 'probable'
          ? 'signal probable à prioriser sans révéler la source'
          : 'signal récent lisible par données visibles';
    const tone = entry.sabotageRiskLevel === 'high'
      ? 'danger'
      : entry.sabotageRiskLevel === 'medium' || entry.presenceLevel === 'high'
        ? 'warning'
        : shadowZone
          ? 'shadow'
          : 'watch';

    return {
      locationId: entry.locationId,
      locationName: entry.locationName,
      center: {
        x: clampVisualMetric(entry.center.x - 4.8, 4, 94),
        y: clampVisualMetric(entry.center.y - 5.1, 6, 94),
      },
      tone,
      glyph,
      assurance,
      certainty,
      freshness,
      freshnessLabel: freshnessLabels[freshness],
      filterTags,
      priorityReason,
      presenceLabel: presenceLabels[entry.presenceLevel] ?? presenceLabels.none,
      riskLabel: riskLabels[entry.sabotageRiskLevel] ?? riskLabels.none,
      shadowZone,
      probableSabotage: hasSabotageSignal,
      copy: `${freshnessLabels[freshness]} · ${presenceLabels[entry.presenceLevel] ?? presenceLabels.none} · ${riskLabels[entry.sabotageRiskLevel] ?? riskLabels.none} · assurance ${assurance}${shadowZone ? ' · zone d’ombre conservée' : ''} · ${priorityReason}`,
      ariaLabel: `Signal intrigue monde en ${entry.locationName}: ${freshnessLabels[freshness]}; ${presenceLabels[entry.presenceLevel] ?? presenceLabels.none}; ${riskLabels[entry.sabotageRiskLevel] ?? riskLabels.none}; assurance ${assurance}; aucun détail caché révélé`,
    };
  }).sort((left, right) => {
    const rank = { danger: 1, warning: 2, shadow: 3, watch: 4 };
    return rank[left.tone] - rank[right.tone] || left.locationName.localeCompare(right.locationName);
  }).slice(0, 6);

  return options.ignoreFilters ? signals : filterWorldMapIntrigueSignals(signals);
}

function buildWorldMapIntrigueSignalRollup(signals) {
  const filteredSignals = filterWorldMapIntrigueSignals(signals);
  const counts = {
    danger: signals.filter((signal) => signal.tone === 'danger').length,
    warning: signals.filter((signal) => signal.tone === 'warning').length,
    shadow: signals.filter((signal) => signal.shadowZone).length,
    probableSabotage: signals.filter((signal) => signal.probableSabotage).length,
    recent: signals.filter((signal) => signal.freshness === 'recent').length,
    stale: signals.filter((signal) => signal.freshness === 'stale').length,
    uncertain: signals.filter((signal) => signal.freshness === 'uncertain').length,
    probable: signals.filter((signal) => signal.certainty === 'probable').length,
  };
  const activeFilters = getActiveAtlasIntrigueSignalFilters();

  return {
    counts,
    activeFilters,
    filteredCount: filteredSignals.length,
    totalCount: signals.length,
    summary: signals.length > 0
      ? `${filteredSignals.length}/${signals.length} signal${signals.length > 1 ? 's' : ''} intrigue atlas visible${filteredSignals.length > 1 ? 's' : ''}: ${counts.recent} récent${counts.recent > 1 ? 's' : ''}, ${counts.stale} ancien${counts.stale > 1 ? 's' : ''}, ${counts.uncertain} incertain${counts.uncertain > 1 ? 's' : ''}, ${counts.probable} probable${counts.probable > 1 ? 's' : ''}.`
      : 'Aucun signal intrigue monde visible avec les filtres actuels.',
  };
}

function renderWorldMapIntrigueSignals(signals) {
  if (!signals.length) {
    return '';
  }

  return `
    <g class="world-map-intrigue-signal-layer" aria-label="Signaux intrigue sur la carte monde fog-safe">
      ${signals.map((signal) => `
        <g class="world-map-intrigue-signal world-map-intrigue-signal--${signal.tone} ${signal.shadowZone ? 'has-shadow-zone' : ''}" data-intrigue-location="${signal.locationId}" tabindex="0" aria-label="${signal.ariaLabel}">
          <title>${signal.copy}</title>
          <circle class="world-map-intrigue-signal__aura" cx="${signal.center.x}%" cy="${signal.center.y}%" r="${signal.probableSabotage ? 4.9 : 3.9}"></circle>
          <text class="world-map-intrigue-signal__glyph" x="${signal.center.x}%" y="${signal.center.y + 1.05}%" text-anchor="middle">${signal.glyph}</text>
          <text class="world-map-intrigue-signal__label" x="${signal.center.x + 4.2}%" y="${signal.center.y - 1.2}%" text-anchor="start">${signal.freshnessLabel} · ${signal.riskLabel}</text>
          <text class="world-map-intrigue-signal__copy" x="${signal.center.x + 4.2}%" y="${signal.center.y + 2.0}%" text-anchor="start">${signal.presenceLabel} · ${signal.assurance}</text>
        </g>
      `).join('')}
    </g>
  `;
}

function renderWorldMapIntrigueSignalRollup(rollup) {
  if (rollup.totalCount === 0) {
    return '';
  }

  return `
    <section class="world-map-intrigue-rollup" aria-label="Résumé intrigue carte monde fog-safe">
      <div class="world-map-intrigue-rollup__header">
        <strong>Intrigue carte monde</strong>
        <span>${rollup.counts.probableSabotage} sabotage${rollup.counts.probableSabotage > 1 ? 's' : ''} probable${rollup.counts.probableSabotage > 1 ? 's' : ''}</span>
      </div>
      <p>${rollup.summary}</p>
      <div class="world-map-intrigue-filter-chips" aria-label="Filtres atlas intrigue par fraîcheur et certitude">
        ${[
          ['recent', 'Récents'],
          ['stale', 'Anciens'],
          ['uncertain', 'Incertains'],
          ['probable', 'Probables'],
        ].map(([key, label]) => `
          <button type="button" class="world-map-intrigue-filter-chip ${state.atlasIntrigueSignalFilters[key] ? 'is-active' : ''}" data-atlas-intrigue-signal-filter="${key}" aria-pressed="${state.atlasIntrigueSignalFilters[key]}">
            ${label} <b>${rollup.counts[key]}</b>
          </button>
        `).join('')}
      </div>
      <small>${rollup.counts.shadow} zone${rollup.counts.shadow > 1 ? 's' : ''} d’ombre conservée${rollup.counts.shadow > 1 ? 's' : ''}; les cellules, relais, objectifs et causes cachées restent masqués.</small>
    </section>
  `;
}


function buildAtlasCounterintelligenceSweepPlan(signals) {
  const filteredSignals = filterWorldMapIntrigueSignals(signals);
  const sweepCandidates = filteredSignals
    .map((signal) => {
      const freshnessWeight = signal.freshness === 'recent' ? 18 : signal.freshness === 'uncertain' ? 16 : 10;
      const certaintyWeight = signal.certainty === 'probable' ? 14 : signal.certainty === 'confirmed' ? 10 : 8;
      const exposureWeight = signal.tone === 'danger' ? 18 : signal.tone === 'warning' ? 12 : signal.shadowZone ? 9 : 4;
      const score = freshnessWeight + certaintyWeight + exposureWeight + (signal.probableSabotage ? 8 : 0);
      const sweepMode = signal.freshness === 'stale'
        ? 'Revérification discrète'
        : signal.freshness === 'uncertain'
          ? 'Balayage prudent'
          : signal.certainty === 'probable'
            ? 'Balayage prioritaire'
            : 'Veille ciblée';
      const expectedReduction = signal.tone === 'danger'
        ? 'réduction estimée forte si le signal visible se confirme'
        : signal.tone === 'warning' || signal.certainty === 'probable'
          ? 'réduction estimée modérée sans dévoiler la source'
          : 'réduction légère, utile pour clarifier la zone';
      const costDelay = signal.freshness === 'stale'
        ? 'coût bas · délai court'
        : signal.freshness === 'uncertain'
          ? 'coût moyen · délai prudent'
          : 'coût moyen · action ce tour';
      const uncertainty = signal.freshness === 'uncertain' || signal.shadowZone
        ? 'incertitude haute: confirmer la province avant action nominative'
        : signal.certainty === 'probable'
          ? 'incertitude moyenne: cause et relais restent masqués'
          : 'incertitude limitée aux détails non visibles';
      const coverageLevel = signal.tone === 'danger' || signal.certainty === 'confirmed'
        ? 'covered'
        : signal.certainty === 'probable' || signal.tone === 'warning'
          ? 'partial'
          : 'uncertain';
      const coverageLabel = coverageLevel === 'covered'
        ? 'couverture probable'
        : coverageLevel === 'partial'
          ? 'couverture partielle'
          : 'couverture incertaine';
      const exposureCooldownRisk = signal.tone === 'danger'
        ? 'exposition haute · cooldown long'
        : signal.tone === 'warning' || signal.certainty === 'probable'
          ? 'exposition modérée · cooldown moyen'
          : 'exposition faible · cooldown court';
      const missedWindowRiskLevel = signal.freshness === 'stale'
        ? 'closing'
        : signal.freshness === 'uncertain' || signal.shadowZone
          ? 'uncertain'
          : signal.tone === 'danger' || signal.probableSabotage
            ? 'urgent'
            : 'low';
      const missedWindowLabel = missedWindowRiskLevel === 'urgent'
        ? 'fenêtre critique ce tour'
        : missedWindowRiskLevel === 'closing'
          ? 'fenêtre en train de se fermer'
          : missedWindowRiskLevel === 'uncertain'
            ? 'fenêtre incertaine à confirmer'
            : 'fenêtre stable';
      const missedWindowReason = missedWindowRiskLevel === 'urgent'
        ? 'attendre risque de rendre la réponse moins utile malgré une cause masquée'
        : missedWindowRiskLevel === 'closing'
          ? 'signal ancien: attendre peut périmer la vérification'
          : missedWindowRiskLevel === 'uncertain'
            ? 'signal partiel: délai utile seulement si la couverture reste discrète'
            : 'faible risque de fenêtre manquée avec les données visibles';

      return {
        ...signal,
        score,
        sweepMode,
        expectedReduction,
        costDelay,
        uncertainty,
        coverageLevel,
        coverageLabel,
        exposureCooldownRisk,
        missedWindowRiskLevel,
        missedWindowLabel,
        missedWindowReason,
      };
    })
    .filter((signal) => signal.score >= 28 || signal.freshness !== 'stale' || signal.certainty === 'probable')
    .sort((left, right) => right.score - left.score || left.locationName.localeCompare(right.locationName))
    .slice(0, 3);

  const candidateIds = new Set(sweepCandidates.map((candidate) => candidate.locationId));
  const coveragePreview = {
    covered: sweepCandidates.filter((candidate) => candidate.coverageLevel === 'covered'),
    partial: sweepCandidates.filter((candidate) => candidate.coverageLevel === 'partial'),
    uncertain: sweepCandidates.filter((candidate) => candidate.coverageLevel === 'uncertain'),
    uncovered: filteredSignals.filter((signal) => !candidateIds.has(signal.locationId)),
  };
  const scheduledSweeps = sweepCandidates.map((candidate, index) => ({
    ...candidate,
    plannedTurnOffset: candidate.missedWindowRiskLevel === 'urgent' ? 0 : index === 0 ? 0 : index,
  }));
  const missedWindowRisks = scheduledSweeps
    .filter((candidate) => ['urgent', 'closing', 'uncertain'].includes(candidate.missedWindowRiskLevel));
  const missedWindowSummary = missedWindowRisks.length > 0
    ? `${missedWindowRisks.length} fenêtre${missedWindowRisks.length > 1 ? 's' : ''} de balayage à risque si vous attendez: ${missedWindowRisks.filter((candidate) => candidate.missedWindowRiskLevel === 'urgent').length} critique${missedWindowRisks.filter((candidate) => candidate.missedWindowRiskLevel === 'urgent').length > 1 ? 's' : ''}, ${missedWindowRisks.filter((candidate) => candidate.missedWindowRiskLevel === 'closing').length} en fermeture, ${missedWindowRisks.filter((candidate) => candidate.missedWindowRiskLevel === 'uncertain').length} incertaine${missedWindowRisks.filter((candidate) => candidate.missedWindowRiskLevel === 'uncertain').length > 1 ? 's' : ''}.`
    : 'Aucune fenêtre manquée probable avec les signaux filtrés actuels.';
  const scheduleConflicts = [];
  scheduledSweeps.forEach((candidate, index) => {
    const overlapping = scheduledSweeps.find((other, otherIndex) => otherIndex < index && other.plannedTurnOffset === candidate.plannedTurnOffset);
    if (overlapping) {
      scheduleConflicts.push({
        type: 'overlap',
        tone: 'warning',
        locationName: candidate.locationName,
        label: 'chevauchement de balayage',
        detail: `Même créneau que ${overlapping.locationName}; prioriser le signal le plus frais sans dévoiler la cause.`,
        alternative: candidate.score > overlapping.score ? 'Déplacer l’autre balayage au créneau suivant.' : 'Déplacer ce balayage au créneau suivant.',
      });
    }

    if (['urgent', 'closing'].includes(candidate.missedWindowRiskLevel) && candidate.plannedTurnOffset > 0) {
      scheduleConflicts.push({
        type: 'late',
        tone: 'danger',
        locationName: candidate.locationName,
        label: 'arrive trop tard',
        detail: `${candidate.missedWindowLabel}: le créneau prévu peut réduire l’utilité de la réponse.`,
        alternative: 'Monter ce balayage en priorité ou remplacer une veille stable.',
      });
    }
  });
  coveragePreview.uncovered
    .filter((signal) => signal.tone === 'danger' || signal.tone === 'warning' || signal.certainty === 'probable')
    .slice(0, 2)
    .forEach((signal) => scheduleConflicts.push({
      type: 'gap',
      tone: signal.tone === 'danger' ? 'danger' : 'warning',
      locationName: signal.locationName,
      label: 'zone sensible sans couverture',
      detail: `${signal.freshnessLabel} · ${signal.riskLabel}; aucune identité ni cause cachée révélée.`,
      alternative: 'Remplacer une veille stable par une vérification courte sur cette zone.',
    }));
  const scheduleConflictSummary = scheduleConflicts.length > 0
    ? `${scheduleConflicts.length} conflit${scheduleConflicts.length > 1 ? 's' : ''} de planning détecté${scheduleConflicts.length > 1 ? 's' : ''}: ${scheduleConflicts.filter((conflict) => conflict.type === 'overlap').length} chevauchement${scheduleConflicts.filter((conflict) => conflict.type === 'overlap').length > 1 ? 's' : ''}, ${scheduleConflicts.filter((conflict) => conflict.type === 'late').length} retard${scheduleConflicts.filter((conflict) => conflict.type === 'late').length > 1 ? 's' : ''}, ${scheduleConflicts.filter((conflict) => conflict.type === 'gap').length} zone${scheduleConflicts.filter((conflict) => conflict.type === 'gap').length > 1 ? 's' : ''} sans couverture.`
    : 'Aucun conflit de planning visible entre balayages filtrés.';
  const conflictsByLocation = scheduleConflicts.reduce((accumulator, conflict) => {
    const existing = accumulator.get(conflict.locationName) ?? [];
    existing.push(conflict);
    accumulator.set(conflict.locationName, existing);
    return accumulator;
  }, new Map());
  const assignmentOrders = scheduledSweeps.map((candidate, index) => {
    const conflicts = conflictsByLocation.get(candidate.locationName) ?? [];
    const blocked = conflicts.some((conflict) => conflict.tone === 'danger' || conflict.type === 'overlap');
    const requiredAgents = candidate.tone === 'danger' ? 3 : candidate.tone === 'warning' || candidate.certainty === 'probable' ? 2 : 1;
    const requiredResources = candidate.missedWindowRiskLevel === 'urgent'
      ? 'équipe mobile + liaison discrète'
      : candidate.coverageLevel === 'partial'
        ? 'équipe légère + couverture locale'
        : 'veille atlas + messager sûr';

    const unsafeReason = blocked
      ? 'conflit de planning visible avant engagement'
      : candidate.tone === 'danger'
        ? 'exposition et chaleur opérationnelle élevées'
        : candidate.shadowZone || candidate.missedWindowRiskLevel === 'uncertain'
          ? 'statut réseau incertain sous brouillard'
          : null;
    const safetyStatus = unsafeReason ? 'unsafe' : 'safe';
    const residualRisk = blocked
      ? 'risque résiduel élevé tant que le conflit reste actif'
      : candidate.missedWindowRiskLevel === 'urgent'
        ? 'risque résiduel modéré si confirmation immédiate'
        : 'risque résiduel faible à modéré selon les signaux visibles';

    return {
      locationId: candidate.locationId,
      locationName: candidate.locationName,
      orderRank: index + 1,
      orderStatus: blocked ? 'blocked' : 'ready',
      orderStatusLabel: blocked ? 'bloqué par conflit' : 'prêt à confirmer',
      safetyStatus,
      safetyLabel: safetyStatus === 'unsafe' ? 'unsafe' : 'safe',
      unsafeReason: unsafeReason ?? 'aucune cause dangereuse visible',
      requiredAgents,
      requiredResources,
      coveredZone: `${candidate.coverageLabel} · ${candidate.freshnessLabel}`,
      remainingConflict: conflicts.length > 0 ? conflicts.map((conflict) => conflict.label).join(', ') : 'aucun conflit visible restant',
      residualRisk,
      actionLabel: blocked ? 'Réviser le créneau' : safetyStatus === 'unsafe' ? 'Valider le risque' : 'Préparer ordre',
    };
  });
  const assignmentSafetySummary = assignmentOrders.length > 0
    ? `${assignmentOrders.filter((order) => order.safetyStatus === 'safe').length} ordre${assignmentOrders.filter((order) => order.safetyStatus === 'safe').length > 1 ? 's' : ''} safe; ${assignmentOrders.filter((order) => order.safetyStatus === 'unsafe').length} unsafe avant engagement.`
    : 'Aucun ordre à valider avant engagement.';
  const assignmentOrderSummary = assignmentOrders.length > 0
    ? `${assignmentOrders.filter((order) => order.orderStatus === 'ready').length} ordre${assignmentOrders.filter((order) => order.orderStatus === 'ready').length > 1 ? 's' : ''} prêt${assignmentOrders.filter((order) => order.orderStatus === 'ready').length > 1 ? 's' : ''}; ${assignmentOrders.filter((order) => order.orderStatus === 'blocked').length} bloqué${assignmentOrders.filter((order) => order.orderStatus === 'blocked').length > 1 ? 's' : ''} par conflit visible. ${assignmentSafetySummary}`
    : 'Aucun balayage utile disponible pour préparer un ordre.';
  const coveredOrderZones = assignmentOrders
    .filter((order) => order.orderStatus === 'ready' && order.safetyStatus === 'safe')
    .map((order) => ({ locationName: order.locationName, detail: order.coveredZone, tone: 'safe' }));
  const fragileAssignments = assignmentOrders
    .filter((order) => order.safetyStatus === 'unsafe' || order.orderStatus === 'blocked')
    .map((order) => ({ locationName: order.locationName, detail: `${order.remainingConflict} · ${order.residualRisk}`, tone: 'fragile' }));
  const uncoveredRiskZones = coveragePreview.uncovered
    .filter((signal) => ['danger', 'warning'].includes(signal.tone) || signal.certainty === 'probable')
    .sort((left, right) => {
      const rank = { danger: 1, warning: 2, shadow: 3, watch: 4 };
      return rank[left.tone] - rank[right.tone] || left.locationName.localeCompare(right.locationName);
    })
    .slice(0, 3)
    .map((signal) => ({ locationName: signal.locationName, detail: `${signal.freshnessLabel} · ${signal.riskLabel}`, tone: 'uncovered' }));
  const postOrderCoverageSummary = assignmentOrders.length > 0
    ? `${coveredOrderZones.length} zone${coveredOrderZones.length > 1 ? 's' : ''} couverte${coveredOrderZones.length > 1 ? 's' : ''} après ordre; ${uncoveredRiskZones.length} zone${uncoveredRiskZones.length > 1 ? 's' : ''} à risque non couverte${uncoveredRiskZones.length > 1 ? 's' : ''}; ${fragileAssignments.length} affectation${fragileAssignments.length > 1 ? 's' : ''} fragile${fragileAssignments.length > 1 ? 's' : ''} à résoudre.`
    : 'Aucun résumé post-ordre disponible tant qu’aucun ordre de balayage n’est préparé.';
  const residualBlindSpots = [
    ...uncoveredRiskZones.map((zone) => ({
      locationName: zone.locationName,
      failureType: 'non couvert',
      severity: 'haute',
      severityRank: 1,
      detail: zone.detail,
      nextAction: 'Ajouter un balayage court ou déplacer une veille stable.',
    })),
    ...assignmentOrders
      .filter((order) => order.coveredZone.includes('partielle'))
      .map((order) => ({
        locationName: order.locationName,
        failureType: 'couverture trop faible',
        severity: order.safetyStatus === 'unsafe' ? 'haute' : 'moyenne',
        severityRank: order.safetyStatus === 'unsafe' ? 1 : 2,
        detail: `${order.coveredZone} · ${order.residualRisk}`,
        nextAction: 'Renforcer par une équipe légère avant confirmation définitive.',
      })),
    ...fragileAssignments.map((zone) => ({
      locationName: zone.locationName,
      failureType: 'couverture expirante/contestée',
      severity: 'moyenne',
      severityRank: 2,
      detail: zone.detail,
      nextAction: 'Résoudre le conflit d’affectation ou replanifier le créneau.',
    })),
  ]
    .sort((left, right) => left.severityRank - right.severityRank || left.locationName.localeCompare(right.locationName))
    .slice(0, 4);
  const residualBlindSpotSummary = residualBlindSpots.length > 0
    ? `${residualBlindSpots.length} angle${residualBlindSpots.length > 1 ? 's' : ''} mort${residualBlindSpots.length > 1 ? 's' : ''} résiduel${residualBlindSpots.length > 1 ? 's' : ''}: ${residualBlindSpots.filter((spot) => spot.failureType === 'non couvert').length} non couvert${residualBlindSpots.filter((spot) => spot.failureType === 'non couvert').length > 1 ? 's' : ''}, ${residualBlindSpots.filter((spot) => spot.failureType === 'couverture trop faible').length} couverture${residualBlindSpots.filter((spot) => spot.failureType === 'couverture trop faible').length > 1 ? 's' : ''} trop faible${residualBlindSpots.filter((spot) => spot.failureType === 'couverture trop faible').length > 1 ? 's' : ''}, ${residualBlindSpots.filter((spot) => spot.failureType === 'couverture expirante/contestée').length} contesté${residualBlindSpots.filter((spot) => spot.failureType === 'couverture expirante/contestée').length > 1 ? 's' : ''}.`
    : 'Aucun angle mort résiduel visible: la couverture actuelle suffit selon les signaux atlas.';
  const resweepPriorities = residualBlindSpots.map((spot) => {
    const operationalRiskScore = spot.severity === 'haute' ? 3 : 2;
    const freshnessScore = spot.detail.includes('récent')
      ? 3
      : spot.detail.includes('incertain') || spot.failureType === 'couverture expirante/contestée'
        ? 2
        : 1;
    const sensitiveObjectiveScore = spot.failureType === 'non couvert'
      ? 3
      : spot.failureType === 'couverture expirante/contestée'
        ? 2
        : 1;
    const priorityScore = operationalRiskScore + freshnessScore + sensitiveObjectiveScore;
    const priorityLevel = priorityScore >= 8 ? 'critique' : priorityScore >= 6 ? 'haute' : 'prudente';
    const objectiveProximity = sensitiveObjectiveScore >= 3
      ? 'proche d’un objectif sensible visible'
      : sensitiveObjectiveScore === 2
        ? 'objectif sensible possible à reconfirmer'
        : 'proximité non confirmée';

    return {
      ...spot,
      operationalRiskScore,
      freshnessScore,
      sensitiveObjectiveScore,
      priorityScore,
      priorityLevel,
      objectiveProximity,
      priorityReason: `risque ${spot.severity}; fraîcheur ${freshnessScore >= 3 ? 'récente' : freshnessScore === 2 ? 'incertaine' : 'ancienne'}; ${objectiveProximity}`,
      resweepAction: priorityLevel === 'critique'
        ? 'Resweep sûr immédiat avant nouvel engagement.'
        : priorityLevel === 'haute'
          ? 'Planifier le resweep au prochain créneau libre.'
          : 'Garder une vérification prudente si les données restent faibles.',
    };
  }).sort((left, right) => right.priorityScore - left.priorityScore || left.locationName.localeCompare(right.locationName));
  const resweepPrioritySummary = resweepPriorities.length > 0
    ? `${resweepPriorities.length} priorité${resweepPriorities.length > 1 ? 's' : ''} de resweep: ${resweepPriorities.filter((spot) => spot.priorityLevel === 'critique').length} critique${resweepPriorities.filter((spot) => spot.priorityLevel === 'critique').length > 1 ? 's' : ''}, ${resweepPriorities.filter((spot) => spot.priorityLevel === 'haute').length} haute${resweepPriorities.filter((spot) => spot.priorityLevel === 'haute').length > 1 ? 's' : ''}, ${resweepPriorities.filter((spot) => spot.priorityLevel === 'prudente').length} prudente${resweepPriorities.filter((spot) => spot.priorityLevel === 'prudente').length > 1 ? 's' : ''}.`
    : 'Aucune priorité de resweep: données suffisantes ou trop faibles pour hiérarchiser sans spéculer.';
  const stagedResweepAssignments = resweepPriorities.map((spot) => {
    const noSafeAssignment = spot.failureType === 'couverture expirante/contestée'
      || spot.detail.includes('risque résiduel élevé')
      || spot.detail.includes('conflit')
      || spot.detail.includes('danger');
    const assignmentStage = noSafeAssignment
      ? 'attente sûre'
      : spot.priorityLevel === 'critique'
        ? 'premier resweep'
        : spot.priorityLevel === 'haute'
          ? 'second créneau'
          : 'file prudente';
    const assignmentReason = noSafeAssignment
      ? 'aucune affectation sûre tant que le conflit, la chaleur ou la couverture contestée n’est pas levé'
      : spot.failureType === 'non couvert'
        ? 'zone non couverte à traiter avant les renforcements partiels'
        : spot.failureType === 'couverture trop faible'
          ? 'renfort léger après sécurisation des angles totalement découverts'
          : 'vérification de confort seulement si les signaux restent faibles';
    const safetyGuardrail = noSafeAssignment
      ? 'ne pas assigner: les avertissements précédents rejetteraient ce sweep'
      : spot.priorityLevel === 'critique'
        ? 'assigner une équipe mobile, puis vérifier l’absence de conflit actif avant départ'
        : 'assigner une équipe légère uniquement sur créneau libre et couverture locale stable';

    return {
      ...spot,
      assignmentStage,
      assignmentStatus: noSafeAssignment ? 'no-safe' : 'safe',
      assignmentReason,
      safetyGuardrail,
    };
  }).sort((left, right) => {
    const statusRank = { safe: 0, 'no-safe': 1 };
    return statusRank[left.assignmentStatus] - statusRank[right.assignmentStatus]
      || right.priorityScore - left.priorityScore
      || left.failureType.localeCompare(right.failureType)
      || left.locationName.localeCompare(right.locationName);
  }).map((assignment, index) => ({
    ...assignment,
    assignmentRank: index + 1,
    firstAssignment: index === 0 && assignment.assignmentStatus === 'safe',
  }));
  const stagedResweepAssignmentSummary = stagedResweepAssignments.length > 0
    ? `${stagedResweepAssignments.filter((assignment) => assignment.assignmentStatus === 'safe').length} affectation${stagedResweepAssignments.filter((assignment) => assignment.assignmentStatus === 'safe').length > 1 ? 's' : ''} de resweep sûre${stagedResweepAssignments.filter((assignment) => assignment.assignmentStatus === 'safe').length > 1 ? 's' : ''}; ${stagedResweepAssignments.filter((assignment) => assignment.assignmentStatus === 'no-safe').length} sans affectation sûre. ${stagedResweepAssignments.some((assignment) => assignment.firstAssignment) ? `Premier: ${stagedResweepAssignments.find((assignment) => assignment.firstAssignment).locationName}, ${stagedResweepAssignments.find((assignment) => assignment.firstAssignment).assignmentReason}.` : 'Aucun premier resweep sûr: attendre une couverture ou un créneau moins risqué.'}`
    : 'Aucune affectation staged: pas de priorité de resweep exploitable sans inventer de signal.';
  const firstSafeStagedAssignment = stagedResweepAssignments.find((assignment) => assignment.firstAssignment) ?? null;
  const firstResweepCoveragePreviewItems = firstSafeStagedAssignment
    ? [
        {
          type: 'blind-spot-reduced',
          tone: firstSafeStagedAssignment.failureType === 'non couvert' ? 'high' : 'medium',
          gainRank: firstSafeStagedAssignment.failureType === 'non couvert' ? 1 : 2,
          copy: firstSafeStagedAssignment.failureType === 'non couvert'
            ? 'angle mort réduit: la zone passe de non couverte à vérification active'
            : 'angle mort réduit partiellement: renfort de couverture plutôt que résolution complète',
        },
        {
          type: 'stale-signal-refreshed',
          tone: firstSafeStagedAssignment.freshnessScore <= 1 ? 'high' : 'medium',
          gainRank: firstSafeStagedAssignment.freshnessScore <= 1 ? 1 : 3,
          copy: firstSafeStagedAssignment.freshnessScore <= 1
            ? 'signal ancien rafraîchi avant engagement nominatif'
            : 'signal visible reconfirmé sans exposer source, relais ou cause cachée',
        },
        {
          type: 'unsafe-gap-remaining',
          tone: firstSafeStagedAssignment.failureType === 'couverture trop faible' || firstSafeStagedAssignment.priorityLevel === 'prudente' ? 'low' : 'medium',
          gainRank: firstSafeStagedAssignment.failureType === 'couverture trop faible' || firstSafeStagedAssignment.priorityLevel === 'prudente' ? 4 : 3,
          copy: firstSafeStagedAssignment.failureType === 'couverture trop faible' || firstSafeStagedAssignment.priorityLevel === 'prudente'
            ? 'gain attendu faible: un gap unsafe peut rester malgré l’affectation sûre'
            : 'gap unsafe surveillé: vérifier le créneau avant départ',
        },
      ].sort((left, right) => left.gainRank - right.gainRank || left.type.localeCompare(right.type))
    : [];
  const firstResweepCoverageGainLevel = firstResweepCoveragePreviewItems.some((item) => item.tone === 'high') && firstSafeStagedAssignment?.failureType === 'non couvert'
    ? 'high-gain'
    : firstSafeStagedAssignment
      ? 'low-gain'
      : 'no-preview';
  const firstResweepCoveragePreviewSummary = firstSafeStagedAssignment
    ? `${firstSafeStagedAssignment.locationName}: ${firstResweepCoverageGainLevel === 'high-gain' ? 'gain de couverture élevé' : 'gain de couverture faible'} avant confirmation du premier resweep sûr.`
    : 'Aucun aperçu de couverture: les affectations unsafe/no-safe ne sont pas prévisualisées.';
  const rankedStagedResweepAssignments = stagedResweepAssignments
    .filter((assignment) => assignment.assignmentStatus === 'safe')
    .map((assignment) => {
      const blindSpotValue = assignment.failureType === 'non couvert' ? 4 : assignment.failureType === 'couverture trop faible' ? 2 : 1;
      const staleRefreshValue = assignment.freshnessScore <= 1 ? 3 : assignment.freshnessScore === 2 ? 2 : 1;
      const unsafeGapPenalty = assignment.failureType === 'couverture trop faible' || assignment.priorityLevel === 'prudente' ? 2 : 0;
      const previewValue = assignment.failureType === 'non couvert'
        ? 3
        : assignment.failureType === 'couverture trop faible'
          ? 1
          : 0;
      const coverageValueScore = assignment.priorityScore + blindSpotValue + staleRefreshValue + previewValue - unsafeGapPenalty;
      const coverageValueLevel = coverageValueScore >= 12 ? 'high-value' : coverageValueScore >= 9 ? 'medium-value' : 'low-value';
      const lessUrgentReason = coverageValueLevel === 'high-value'
        ? 'meilleur gain: priorité haute, récupération de couverture et rafraîchissement utiles'
        : coverageValueLevel === 'medium-value'
          ? 'moins urgent: gain utile mais couverture déjà partielle ou fraîcheur moins critique'
          : 'faible gain: garder en réserve après les resweeps plus rentables';

      return {
        ...assignment,
        blindSpotValue,
        staleRefreshValue,
        unsafeGapPenalty,
        previewValue,
        coverageValueScore,
        coverageValueLevel,
        lessUrgentReason,
      };
    })
    .sort((left, right) => right.coverageValueScore - left.coverageValueScore
      || right.priorityScore - left.priorityScore
      || left.failureType.localeCompare(right.failureType)
      || left.locationName.localeCompare(right.locationName))
    .map((assignment, index) => ({
      ...assignment,
      coverageValueRank: index + 1,
      bestCoverageValue: index === 0,
    }));
  const excludedUnsafeResweepAssignments = stagedResweepAssignments.filter((assignment) => assignment.assignmentStatus !== 'safe');
  const rankedStagedResweepAssignmentSummary = rankedStagedResweepAssignments.length > 0
    ? `${rankedStagedResweepAssignments.length} resweep${rankedStagedResweepAssignments.length > 1 ? 's' : ''} sûr${rankedStagedResweepAssignments.length > 1 ? 's' : ''} classé${rankedStagedResweepAssignments.length > 1 ? 's' : ''} par valeur de couverture; meilleur: ${rankedStagedResweepAssignments[0].locationName}. ${rankedStagedResweepAssignments.filter((assignment) => assignment.coverageValueLevel === 'low-value').length} low-gain à garder en réserve; ${excludedUnsafeResweepAssignments.length} unsafe exclu${excludedUnsafeResweepAssignments.length > 1 ? 's' : ''}.`
    : 'Aucun classement de valeur: toutes les affectations staged sont unsafe/no-safe ou sans gain exploitable.';
  const bestRankedStagedResweepAssignment = rankedStagedResweepAssignments.find((assignment) => assignment.bestCoverageValue) ?? null;
  const bestResweepResidualGapWarning = (() => {
    if (!bestRankedStagedResweepAssignment) {
      return {
        state: 'no-safe-assignment',
        tone: 'muted',
        locationName: null,
        summary: 'Aucun warning résiduel: aucun meilleur resweep sûr n’est disponible à confirmer.',
        detail: 'Les affectations unsafe/no-safe restent exclues; attendre un créneau ou une couverture plus sûre.',
      };
    }

    const remainingPriorities = resweepPriorities
      .filter((spot) => spot.locationName !== bestRankedStagedResweepAssignment.locationName)
      .sort((left, right) => right.priorityScore - left.priorityScore || left.locationName.localeCompare(right.locationName));
    const highPriorityBlindSpot = remainingPriorities.find((spot) => spot.failureType === 'non couvert' && ['critique', 'haute'].includes(spot.priorityLevel));
    const staleCriticalSignal = remainingPriorities.find((spot) => spot.freshnessScore <= 1 && ['critique', 'haute'].includes(spot.priorityLevel));

    if (highPriorityBlindSpot) {
      return {
        state: 'high-priority-blind-spot',
        tone: 'danger',
        locationName: highPriorityBlindSpot.locationName,
        summary: `${bestRankedStagedResweepAssignment.locationName} est le meilleur resweep sûr, mais laisse ${highPriorityBlindSpot.locationName} en angle mort prioritaire.`,
        detail: `${highPriorityBlindSpot.priorityReason}; garder un second créneau ou remplacer une veille stable.`,
      };
    }

    if (staleCriticalSignal) {
      return {
        state: 'stale-critical-signal',
        tone: 'warning',
        locationName: staleCriticalSignal.locationName,
        summary: `${bestRankedStagedResweepAssignment.locationName} est le meilleur resweep sûr, mais un signal ancien critique reste non rafraîchi.`,
        detail: `${staleCriticalSignal.locationName}: ${staleCriticalSignal.priorityReason}; prévoir un refresh court avant engagement nominatif.`,
      };
    }

    return {
      state: 'acceptable-residual',
      tone: 'safe',
      locationName: bestRankedStagedResweepAssignment.locationName,
      summary: `${bestRankedStagedResweepAssignment.locationName} ne laisse aucun gap résiduel critique après le meilleur resweep sûr.`,
      detail: 'Les risques restants sont couverts, partiels ou low-gain selon les signaux atlas visibles.',
    };
  })();
  const bestResweepFollowUpSuggestion = (() => {
    if (!['high-priority-blind-spot', 'stale-critical-signal'].includes(bestResweepResidualGapWarning.state)) {
      return {
        state: 'no-follow-up',
        label: 'aucun follow-up immédiat',
        copy: 'Pas de suggestion supplémentaire: le résiduel est acceptable ou aucun meilleur resweep sûr n’existe.',
      };
    }

    const followUpAssignment = stagedResweepAssignments.find((assignment) => assignment.locationName === bestResweepResidualGapWarning.locationName);
    if (!followUpAssignment || followUpAssignment.assignmentStatus !== 'safe') {
      return {
        state: 'wait-for-safe-window',
        label: 'attendre fenêtre sûre',
        copy: `${bestResweepResidualGapWarning.locationName}: pas de follow-up sûr maintenant; attendre un créneau non contesté ou une couverture locale stable.`,
      };
    }

    if (bestResweepResidualGapWarning.state === 'high-priority-blind-spot') {
      return {
        state: 'close-blind-spot',
        label: 'fermer angle mort',
        copy: `${followUpAssignment.locationName}: lancer le prochain sweep court pour fermer l’angle mort prioritaire après le meilleur resweep.`,
      };
    }

    return {
      state: 'refresh-stale-signal',
      label: 'rafraîchir signal ancien',
      copy: `${followUpAssignment.locationName}: planifier un refresh discret du signal ancien avant tout engagement nominatif.`,
    };
  })();
  const nextSafeFollowUpPriorityMarker = (() => {
    if (bestResweepFollowUpSuggestion.state === 'wait-for-safe-window') {
      return {
        state: 'wait-for-safe-window',
        shouldRender: true,
        label: 'Priorité suivante: attendre une fenêtre sûre avant un second sweep.',
      };
    }

    const followUpCandidates = stagedResweepAssignments
      .filter((assignment) => assignment.assignmentStatus === 'safe' && assignment.locationName !== bestRankedStagedResweepAssignment?.locationName)
      .map((assignment) => {
        const priorityState = assignment.failureType === 'non couvert' && ['critique', 'haute'].includes(assignment.priorityLevel)
          ? 'closes-critical-blind-spot'
          : assignment.freshnessScore <= 1 && ['critique', 'haute'].includes(assignment.priorityLevel)
            ? 'refreshes-stale-critical-signal'
            : 'lowest-exposure-sweep';
        const priorityWeight = priorityState === 'closes-critical-blind-spot' ? 3 : priorityState === 'refreshes-stale-critical-signal' ? 2 : 1;
        const exposureRank = assignment.failureType === 'couverture trop faible' || assignment.priorityLevel === 'prudente' ? 1 : 2;

        return { ...assignment, priorityState, priorityWeight, exposureRank };
      })
      .sort((left, right) => right.priorityWeight - left.priorityWeight
        || right.priorityScore - left.priorityScore
        || left.exposureRank - right.exposureRank
        || left.locationName.localeCompare(right.locationName));

    if (followUpCandidates.length === 0) {
      return {
        state: 'no-safe-follow-up',
        shouldRender: bestResweepFollowUpSuggestion.state !== 'no-follow-up',
        label: 'Priorité suivante: aucun follow-up sûr disponible après le meilleur resweep.',
      };
    }

    const nextCandidate = followUpCandidates[0];
    const stateLabel = nextCandidate.priorityState === 'closes-critical-blind-spot'
      ? 'fermer le blind spot critique'
      : nextCandidate.priorityState === 'refreshes-stale-critical-signal'
        ? 'rafraîchir le signal ancien critique'
        : 'prendre le sweep à exposition minimale';

    return {
      state: nextCandidate.priorityState,
      shouldRender: followUpCandidates.length > 1 || !['close-blind-spot', 'refresh-stale-signal'].includes(bestResweepFollowUpSuggestion.state),
      label: `Priorité suivante: ${nextCandidate.locationName} · ${stateLabel}.`,
    };
  })();
  const nextSafeSweepExposureTradeoff = (() => {
    if (!nextSafeFollowUpPriorityMarker.shouldRender) {
      return {
        state: 'silent-guard',
        shouldRender: false,
        label: 'aucun tradeoff affiché',
      };
    }

    if (nextSafeFollowUpPriorityMarker.state === 'wait-for-safe-window') {
      return {
        state: 'wait-required',
        shouldRender: true,
        label: 'Tradeoff: attendre réduit l’exposition; partir maintenant risquerait de briser le fog-of-war.',
      };
    }

    if (nextSafeFollowUpPriorityMarker.state === 'no-safe-follow-up') {
      return {
        state: 'no-safe-tradeoff',
        shouldRender: true,
        label: 'Tradeoff: aucun sweep sûr ne bat le risque d’exposition pour l’instant.',
      };
    }

    if (nextSafeFollowUpPriorityMarker.state === 'closes-critical-blind-spot') {
      return {
        state: 'critical-coverage-tradeoff',
        shouldRender: true,
        label: 'Tradeoff: meilleure couverture critique malgré une exposition contrôlée et non nominative.',
      };
    }

    if (nextSafeFollowUpPriorityMarker.state === 'refreshes-stale-critical-signal') {
      return {
        state: 'stale-refresh-tradeoff',
        shouldRender: true,
        label: 'Tradeoff: refresh du signal ancien avant action directe, avec exposition courte et limitée.',
      };
    }

    return {
      state: 'minimal-exposure-tradeoff',
      shouldRender: true,
      label: 'Tradeoff: choisir l’exposition minimale plutôt qu’un gain de couverture plus spéculatif.',
    };
  })();
  const nextSafeSweepFollowUpPreview = (() => {
    if (!nextSafeFollowUpPriorityMarker.shouldRender || !nextSafeSweepExposureTradeoff.shouldRender) {
      return {
        state: 'silent-guard',
        shouldRender: false,
        label: 'aucun follow-up preview affiché',
      };
    }

    if (nextSafeFollowUpPriorityMarker.state === 'wait-for-safe-window') {
      return {
        state: 'wait-safe-window',
        shouldRender: true,
        label: 'Après sweep bas-risque: attendre la prochaine fenêtre sûre avant tout relais.',
      };
    }

    if (nextSafeFollowUpPriorityMarker.state === 'no-safe-follow-up') {
      return {
        state: 'no-safe-follow-up',
        shouldRender: true,
        label: 'Après sweep bas-risque: aucun follow-up sûr sans nouveau signal visible.',
      };
    }

    if (nextSafeFollowUpPriorityMarker.state === 'refreshes-stale-critical-signal') {
      return {
        state: 'refresh-critical-signal',
        shouldRender: true,
        label: 'Après sweep bas-risque: rafraîchir le signal critique restant, sans nommer source ni cible.',
      };
    }

    if (nextSafeFollowUpPriorityMarker.state === 'closes-critical-blind-spot') {
      return {
        state: 'reduce-residual-gap',
        shouldRender: true,
        label: 'Après sweep bas-risque: réduire le gap résiduel prioritaire avec une passe courte.',
      };
    }

    return {
      state: 'switch-domain',
      shouldRender: true,
      label: 'Après sweep bas-risque: basculer vers un autre domaine si le gain visible reste marginal.',
    };
  })();
  const postOrderCoverage = {
    coveredOrderZones,
    fragileAssignments,
    uncoveredRiskZones,
    residualBlindSpots,
    residualBlindSpotSummary,
    resweepPriorities,
    resweepPrioritySummary,
    stagedResweepAssignments,
    stagedResweepAssignmentSummary,
    firstSafeStagedAssignment,
    firstResweepCoveragePreviewItems,
    firstResweepCoverageGainLevel,
    firstResweepCoveragePreviewSummary,
    rankedStagedResweepAssignments,
    rankedStagedResweepAssignmentSummary,
    excludedUnsafeResweepAssignments,
    bestRankedStagedResweepAssignment,
    bestResweepResidualGapWarning,
    bestResweepFollowUpSuggestion,
    nextSafeFollowUpPriorityMarker,
    nextSafeSweepExposureTradeoff,
    nextSafeSweepFollowUpPreview,
    summary: postOrderCoverageSummary,
  };
  const exposureCooldownSummary = sweepCandidates.length > 0
    ? `${sweepCandidates.filter((candidate) => candidate.tone === 'danger').length} risque${sweepCandidates.filter((candidate) => candidate.tone === 'danger').length > 1 ? 's' : ''} d’exposition haut${sweepCandidates.filter((candidate) => candidate.tone === 'danger').length > 1 ? 's' : ''}; cooldown visible estimé sans cause cachée.`
    : 'Aucun risque d’exposition ou cooldown supplémentaire proposé.';

  return {
    empty: sweepCandidates.length === 0,
    totalFiltered: filteredSignals.length,
    candidates: scheduledSweeps,
    coveragePreview,
    missedWindowRisks,
    missedWindowSummary,
    scheduleConflicts,
    scheduleConflictSummary,
    assignmentOrders,
    assignmentOrderSummary,
    assignmentSafetySummary,
    postOrderCoverage,
    exposureCooldownSummary,
    summary: sweepCandidates.length > 0
      ? `${sweepCandidates.length} zone${sweepCandidates.length > 1 ? 's' : ''} de balayage contre-espionnage proposée${sweepCandidates.length > 1 ? 's' : ''} depuis les filtres atlas actifs.`
      : 'Aucun signal filtré ne justifie un balayage contre-espionnage ce tour.',
  };
}

function renderAtlasCounterintelligenceSweepPlan(plan) {
  if (plan.empty) {
    return `
      <section class="atlas-counterintelligence-plan is-empty" aria-label="Plan de balayage contre-espionnage atlas">
        <div class="atlas-counterintelligence-plan__header">
          <strong>Balayage contre-espionnage</strong>
          <span>aucune zone</span>
        </div>
        <p>${plan.summary}</p>
        <small>Activez un filtre récent, ancien, incertain ou probable pour préparer une vérification sans révéler de cause cachée.</small>
        <small>${plan.exposureCooldownSummary}</small>
        <small>${plan.missedWindowSummary}</small>
        <small>${plan.scheduleConflictSummary}</small>
        <small>${plan.assignmentOrderSummary}</small>
        <small>${plan.assignmentSafetySummary}</small>
        <small>${plan.postOrderCoverage.summary}</small>
      </section>
    `;
  }

  return `
    <section class="atlas-counterintelligence-plan" aria-label="Plan de balayage contre-espionnage atlas">
      <div class="atlas-counterintelligence-plan__header">
        <strong>Balayage contre-espionnage</strong>
        <span>${plan.candidates.length}/${plan.totalFiltered} priorités</span>
      </div>
      <p>${plan.summary}</p>
      <div class="atlas-counterintelligence-coverage-preview" aria-label="Prévisualisation de couverture fog-safe avant confirmation">
        <span><b>${plan.coveragePreview.covered.length}</b> couvert${plan.coveragePreview.covered.length > 1 ? 's' : ''} probable${plan.coveragePreview.covered.length > 1 ? 's' : ''}</span>
        <span><b>${plan.coveragePreview.partial.length + plan.coveragePreview.uncertain.length}</b> partiel${plan.coveragePreview.partial.length + plan.coveragePreview.uncertain.length > 1 ? 's' : ''} ou incertain${plan.coveragePreview.partial.length + plan.coveragePreview.uncertain.length > 1 ? 's' : ''}</span>
        <span><b>${plan.coveragePreview.uncovered.length}</b> non couvert${plan.coveragePreview.uncovered.length > 1 ? 's' : ''}</span>
      </div>
      <small>${plan.exposureCooldownSummary}</small>
      <section class="atlas-counterintelligence-assignment-orders" aria-label="Ordres de balayage contre-espionnage fog-safe">
        <strong>Ordres d’assignation</strong>
        <p>${plan.assignmentOrderSummary}</p>
        <small>${plan.assignmentSafetySummary}</small>
        ${plan.assignmentOrders.length > 0
          ? `<div class="atlas-counterintelligence-assignment-orders__list">${plan.assignmentOrders.map((order) => `
            <button type="button" class="atlas-counterintelligence-assignment-order atlas-counterintelligence-assignment-order--${order.orderStatus} atlas-counterintelligence-assignment-order--${order.safetyStatus}" data-province-id="${order.locationId}" data-counterintelligence-order="${order.orderStatus}" data-counterintelligence-safety="${order.safetyStatus}" aria-label="${order.actionLabel} pour ${order.locationName}: ${order.orderStatusLabel}; ${order.safetyLabel}">
              <span><b>#${order.orderRank} ${order.locationName}</b><em>${order.orderStatusLabel} · ${order.safetyLabel}</em></span>
              <dl>
                <div><dt>Agents / ressources</dt><dd>${order.requiredAgents} agent${order.requiredAgents > 1 ? 's' : ''} · ${order.requiredResources}</dd></div>
                <div><dt>Zone couverte</dt><dd>${order.coveredZone}</dd></div>
                <div><dt>Conflit restant</dt><dd>${order.remainingConflict}</dd></div>
                <div><dt>Risque résiduel</dt><dd>${order.residualRisk}</dd></div>
                <div><dt>Validation Delta</dt><dd>${order.safetyLabel}: ${order.unsafeReason}</dd></div>
              </dl>
              <small>${order.actionLabel} · aucun acteur, relais ou cause cachée révélé.</small>
            </button>
          `).join('')}</div>`
          : '<small>Aucun balayage utile n’est disponible pour transformer la prévisualisation en ordre.</small>'}
      </section>
      <section class="atlas-counterintelligence-post-order-coverage" aria-label="Résumé post-ordre des balayages contre-espionnage fog-safe">
        <strong>Couverture après ordres</strong>
        <p>${plan.postOrderCoverage.summary}</p>
        <div class="atlas-counterintelligence-post-order-coverage__grid">
          <div>
            <b>Couvert réellement</b>
            ${plan.postOrderCoverage.coveredOrderZones.length > 0
              ? `<ul>${plan.postOrderCoverage.coveredOrderZones.map((zone) => `<li>${zone.locationName} · ${zone.detail}</li>`).join('')}</ul>`
              : '<small>Aucune zone sûre confirmable pour l’instant.</small>'}
          </div>
          <div>
            <b>À risque non couvert</b>
            ${plan.postOrderCoverage.uncoveredRiskZones.length > 0
              ? `<ul>${plan.postOrderCoverage.uncoveredRiskZones.map((zone) => `<li>${zone.locationName} · ${zone.detail}</li>`).join('')}</ul>`
              : '<small>Aucune zone à haut risque non couverte avec les filtres actifs.</small>'}
          </div>
          <div>
            <b>Affectations fragiles</b>
            ${plan.postOrderCoverage.fragileAssignments.length > 0
              ? `<ul>${plan.postOrderCoverage.fragileAssignments.map((zone) => `<li>${zone.locationName} · ${zone.detail}</li>`).join('')}</ul>`
              : '<small>Aucun conflit d’affectation restant à résoudre.</small>'}
          </div>
        </div>
      </section>
      <section class="atlas-counterintelligence-blind-spots" aria-label="Angles morts résiduels de renseignement fog-safe">
        <strong>Angles morts résiduels</strong>
        <p>${plan.postOrderCoverage.residualBlindSpotSummary}</p>
        ${plan.postOrderCoverage.residualBlindSpots.length > 0
          ? `<ul>${plan.postOrderCoverage.residualBlindSpots.map((spot) => `<li class="atlas-counterintelligence-blind-spots__item atlas-counterintelligence-blind-spots__item--${spot.severity}"><b>${spot.locationName}</b> · ${spot.failureType} · sévérité ${spot.severity}<small>${spot.detail} · ${spot.nextAction}</small></li>`).join('')}</ul>`
          : '<small>État vide: aucune province ne reste aveugle ou fragile après ces ordres.</small>'}
      </section>
      <section class="atlas-counterintelligence-resweep-priorities" aria-label="Priorités de resweep fog-safe pour angles morts">
        <strong>Priorités de resweep</strong>
        <p>${plan.postOrderCoverage.resweepPrioritySummary}</p>
        ${plan.postOrderCoverage.resweepPriorities.length > 0
          ? `<ol>${plan.postOrderCoverage.resweepPriorities.map((spot) => `<li class="atlas-counterintelligence-resweep-priorities__item atlas-counterintelligence-resweep-priorities__item--${spot.priorityLevel}"><b>${spot.locationName}</b> · priorité ${spot.priorityLevel}<small>${spot.priorityReason} · ${spot.resweepAction}</small></li>`).join('')}</ol>`
          : '<small>Zones sans données suffisantes: priorité prudente plutôt qu’une précision inventée.</small>'}
      </section>
      <section class="atlas-counterintelligence-staged-resweep-assignments" aria-label="Affectations staged de resweep fog-safe pour angles morts">
        <strong>Affectations staged de resweep</strong>
        <p>${plan.postOrderCoverage.stagedResweepAssignmentSummary}</p>
        ${plan.postOrderCoverage.stagedResweepAssignments.length > 0
          ? `<ol>${plan.postOrderCoverage.stagedResweepAssignments.map((assignment) => `<li class="atlas-counterintelligence-staged-resweep-assignments__item atlas-counterintelligence-staged-resweep-assignments__item--${assignment.assignmentStatus}"><b>#${assignment.assignmentRank} ${assignment.locationName}</b> · ${assignment.assignmentStage}${assignment.firstAssignment ? ' · première affectation' : ''}<small>${assignment.assignmentReason} · ${assignment.safetyGuardrail}</small></li>`).join('')}</ol>`
          : '<small>Aucune affectation sûre: attendre une couverture supplémentaire ou un créneau non contesté.</small>'}
      </section>
      <section class="atlas-counterintelligence-first-resweep-preview atlas-counterintelligence-first-resweep-preview--${plan.postOrderCoverage.firstResweepCoverageGainLevel}" aria-label="Aperçu de couverture gagnée avant confirmation du premier resweep">
        <strong>Couverture gagnée avant confirmation</strong>
        <p>${plan.postOrderCoverage.firstResweepCoveragePreviewSummary}</p>
        ${plan.postOrderCoverage.firstResweepCoveragePreviewItems.length > 0
          ? `<ol>${plan.postOrderCoverage.firstResweepCoveragePreviewItems.map((item) => `<li class="atlas-counterintelligence-first-resweep-preview__item atlas-counterintelligence-first-resweep-preview__item--${item.tone}"><b>${item.type}</b><small>${item.copy}</small></li>`).join('')}</ol>`
          : '<small>Aucun preview: l’affectation proposée reste unsafe ou sans couverture récupérable sûre.</small>'}
      </section>
      <section class="atlas-counterintelligence-resweep-value-ranking" aria-label="Classement des resweeps staged sûrs par valeur de couverture">
        <strong>Valeur de couverture des resweeps</strong>
        <p>${plan.postOrderCoverage.rankedStagedResweepAssignmentSummary}</p>
        ${plan.postOrderCoverage.rankedStagedResweepAssignments.length > 0
          ? `<ol>${plan.postOrderCoverage.rankedStagedResweepAssignments.map((assignment) => `<li class="atlas-counterintelligence-resweep-value-ranking__item atlas-counterintelligence-resweep-value-ranking__item--${assignment.coverageValueLevel}"><b>#${assignment.coverageValueRank} ${assignment.locationName}</b> · ${assignment.coverageValueScore} valeur${assignment.bestCoverageValue ? ' · meilleur choix' : ''}<small>${assignment.lessUrgentReason} · priorité ${assignment.priorityScore}, refresh ${assignment.staleRefreshValue}, preview ${assignment.previewValue}, gap unsafe -${assignment.unsafeGapPenalty}</small></li>`).join('')}</ol>`
          : '<small>Aucun resweep sûr à classer: les affectations rejetées par sécurité restent exclues.</small>'}
        <aside class="atlas-counterintelligence-best-resweep-gap-warning atlas-counterintelligence-best-resweep-gap-warning--${plan.postOrderCoverage.bestResweepResidualGapWarning.state}" aria-label="Warning de gap résiduel après le meilleur resweep sûr">
          <b>Gap résiduel du meilleur resweep</b>
          <span>${plan.postOrderCoverage.bestResweepResidualGapWarning.summary}</span>
          <small>${plan.postOrderCoverage.bestResweepResidualGapWarning.detail}</small>
          <small class="atlas-counterintelligence-best-resweep-gap-warning__follow-up atlas-counterintelligence-best-resweep-gap-warning__follow-up--${plan.postOrderCoverage.bestResweepFollowUpSuggestion.state}"><b>Follow-up:</b> ${plan.postOrderCoverage.bestResweepFollowUpSuggestion.label} · ${plan.postOrderCoverage.bestResweepFollowUpSuggestion.copy}</small>
          ${plan.postOrderCoverage.nextSafeFollowUpPriorityMarker.shouldRender ? `<small class="atlas-counterintelligence-best-resweep-gap-warning__next-safe atlas-counterintelligence-best-resweep-gap-warning__next-safe--${plan.postOrderCoverage.nextSafeFollowUpPriorityMarker.state}"><b>Next safe sweep:</b> ${plan.postOrderCoverage.nextSafeFollowUpPriorityMarker.label}</small>` : ''}
          ${plan.postOrderCoverage.nextSafeSweepExposureTradeoff.shouldRender ? `<small class="atlas-counterintelligence-best-resweep-gap-warning__tradeoff atlas-counterintelligence-best-resweep-gap-warning__tradeoff--${plan.postOrderCoverage.nextSafeSweepExposureTradeoff.state}"><b>Tradeoff exposition:</b> ${plan.postOrderCoverage.nextSafeSweepExposureTradeoff.label}</small>` : ''}
          ${plan.postOrderCoverage.nextSafeSweepFollowUpPreview.shouldRender ? `<small class="atlas-counterintelligence-best-resweep-gap-warning__low-exposure-follow-up atlas-counterintelligence-best-resweep-gap-warning__low-exposure-follow-up--${plan.postOrderCoverage.nextSafeSweepFollowUpPreview.state}"><b>Après sweep bas-risque:</b> ${plan.postOrderCoverage.nextSafeSweepFollowUpPreview.label}</small>` : ''}
        </aside>
      </section>
      <section class="atlas-counterintelligence-schedule-conflicts" aria-label="Conflits de calendrier contre-espionnage fog-safe">
        <strong>Conflits de planning</strong>
        <p>${plan.scheduleConflictSummary}</p>
        ${plan.scheduleConflicts.length > 0
          ? `<ul>${plan.scheduleConflicts.map((conflict) => `<li class="atlas-counterintelligence-schedule-conflicts__item atlas-counterintelligence-schedule-conflicts__item--${conflict.tone}"><b>${conflict.locationName}</b> · ${conflict.label}: ${conflict.detail}<small>${conflict.alternative}</small></li>`).join('')}</ul>`
          : '<small>Aucun chevauchement, retard critique ou trou de couverture sensible avec les filtres actifs.</small>'}
      </section>
      <section class="atlas-counterintelligence-window-risk" aria-label="Risque de fenêtre manquée fog-safe">
        <strong>Fenêtres à ne pas manquer</strong>
        <p>${plan.missedWindowSummary}</p>
        ${plan.missedWindowRisks.length > 0
          ? `<ul>${plan.missedWindowRisks.map((candidate) => `<li><b>${candidate.locationName}</b> · ${candidate.missedWindowLabel} · ${candidate.missedWindowReason}</li>`).join('')}</ul>`
          : '<small>État low-signal: aucun délai ne semble réduire fortement l’utilité du sweep.</small>'}
      </section>
      <div class="atlas-counterintelligence-plan__list">
        ${plan.candidates.map((candidate, index) => `
          <button type="button" class="atlas-counterintelligence-card atlas-counterintelligence-card--${candidate.tone}" data-province-id="${candidate.locationId}" aria-label="Choisir ${candidate.locationName} pour ${candidate.sweepMode}: ${candidate.uncertainty}">
            <div>
              <b>#${index + 1} ${candidate.locationName}</b>
              <span>${candidate.sweepMode} · ${candidate.freshnessLabel} · ${candidate.assurance}</span>
            </div>
            <dl>
              <div><dt>Effet</dt><dd>${candidate.expectedReduction}</dd></div>
              <div><dt>Coût / délai</dt><dd>${candidate.costDelay}</dd></div>
              <div><dt>Incertitude</dt><dd>${candidate.uncertainty}</dd></div>
              <div><dt>Couverture</dt><dd>${candidate.coverageLabel} · ${candidate.exposureCooldownRisk}</dd></div>
              <div><dt>Fenêtre</dt><dd>${candidate.missedWindowLabel}</dd></div>
            </dl>
            <small>${candidate.priorityReason}; cellule, relais, cible et cause restent masqués.</small>
          </button>
        `).join('')}
      </div>
    </section>
  `;
}

function renderCultureOpportunityEndTurnSummary(province, shell, focusContext, intrigueView = null) {
  const actionQueue = buildSelectedProvinceActionQueue(province, shell, focusContext, intrigueView);
  const cultureContext = getSelectedCultureContext(province.provinceId);
  const unlockHintsByAction = buildCultureUnlockHintsForActions(province, actionQueue, cultureContext);
  const report = buildCultureOpportunityReminders({
    province,
    actionQueue,
    unlockHintsByAction,
  });

  return renderCultureOpportunityReminders(report);
}

function renderActiveProvince(shell, economyView = null, intrigueView = null) {
  const focusContext = getFocusContext(shell);
  const province = shell.activeProvince ?? shell.provinces[0] ?? null;

  if (!province) {
    return '<section class="panel province-details"><p>Aucune province chargée.</p></section>';
  }

  const controller = factionMetaById[province.controllingFactionId]?.label ?? province.controllingFactionId;
  const owner = factionMetaById[province.ownerFactionId]?.label ?? province.ownerFactionId;
  const comparedProvinceNames = state.comparisonProvinceIds
    .map((provinceId) => shell.provinces.find((candidate) => candidate.provinceId === provinceId)?.label)
    .filter(Boolean);
  const neighborNames = [...focusContext.neighborIds]
    .map((provinceId) => shell.provinces.find((candidate) => candidate.provinceId === provinceId)?.label)
    .filter(Boolean);

  return `
    <section class="panel province-details">
      <div class="panel-header">
        <h3>${province.label}</h3>
        <p>${province.selectionState.selected ? 'Province sélectionnée' : 'Province focalisée'}</p>
      </div>
      <dl class="province-facts">
        <div><dt>Contrôle</dt><dd>${controller}</dd></div>
        <div><dt>Propriétaire</dt><dd>${owner}</dd></div>
        <div><dt>Approvisionnement</dt><dd>${province.supplyLevel}</dd></div>
        <div><dt>Valeur stratégique</dt><dd>${province.strategicValue}</dd></div>
        <div><dt>Voisins</dt><dd>${province.neighborIds.join(', ')}</dd></div>
      </dl>
      <div class="province-summary-tags">${province.badges.map((badge) => `<span class="legend-chip">${badge}</span>`).join('')}</div>
      <div class="focus-strip">
        <div class="focus-strip__item">
          <span>Voisines mises en avant</span>
          <strong>${neighborNames.length > 0 ? neighborNames.join(', ') : 'Aucune'}</strong>
        </div>
        <div class="focus-strip__item">
          <span>Transition de focus</span>
          <strong>${focusContext.focusedProvince?.label ?? province.label}</strong>
        </div>
      </div>
      ${renderProvinceActionRecommendations(province, focusContext, intrigueView)}
      ${renderProvinceIntrigueExposureTimelineHints(province, intrigueView)}
      ${renderSafeIntrigueResponseTimingComparison(province, intrigueView)}
      ${renderIntrigueQueuedMapChoiceConflicts(province, intrigueView)}
      ${renderConflictOutcomePreview(province, shell)}
      ${renderSelectedProvinceConflictNextAction(province, shell, focusContext, intrigueView)}
      ${renderQueuedMilitaryMapActionConfirmation(province, shell, intrigueView)}
      ${renderMilitaryResponseOptions(province, shell, focusContext, intrigueView)}
      ${renderSelectedProvinceActionQueue(province, shell, focusContext, intrigueView)}
      ${renderMilitaryPlanImpactSummary(province, shell, focusContext, intrigueView)}
      ${renderSelectedProvinceMilitaryOutcomeMarker(province)}
      ${renderProjectedFrontStability(province, shell, focusContext, intrigueView)}
      ${renderCriticalFrontRiskWarnings(province, shell, focusContext, intrigueView)}
      ${renderCultureOpportunityEndTurnSummary(province, shell, focusContext, intrigueView)}
      ${renderProvinceEconomyBudgetPreview(province, economyView, shell, focusContext, intrigueView)}
      ${renderResolvedConflictDeltas(province, shell, focusContext, intrigueView)}
      ${renderIntrigueTurnReportDeltas(province, intrigueView)}
      ${renderProvinceClimateCountdownCues(province)}
      ${renderProvinceClimateMitigationPriorities(province)}
      ${renderProvinceClimateRiskReductionForecast(province, shell, buildSelectedProvinceActionQueue(province, shell, focusContext, intrigueView), state.queuedClimateInterventions)}
      ${renderProvinceClimateCascadePreview(province, shell)}
      ${renderProvinceClimateTurnReport(province)}
      ${renderPostCommitClimateMarkerDetail(province, buildPostCommitClimateImpactMarkers(shell, state.queuedClimateInterventions))}
      <div class="context-summary">
        <strong>Comparaison rapide</strong>
        <p>${comparedProvinceNames.length > 0 ? comparedProvinceNames.join(' vs ') : 'Aucune province comparée pour le moment.'}</p>
      </div>
      ${renderProvinceEconomyConsequences(province, economyView)}
      ${renderProvinceEconomyTurnReport(province, economyView)}
      ${renderProvinceLogisticsPressureComparison(province, economyView)}
      ${renderProvinceLogisticsBottleneckComparison(province, economyView)}
      ${renderFocusedLogisticsOutcomeGroup(province)}
      ${renderProvinceLogisticsChoicePreview(province, economyView)}
    </section>
  `;
}

function getCityStateByTurn(city, explicitTurn = state.turn) {
  const shift = Math.max(0, explicitTurn - 1);
  const stockByResource = { ...city.stockByResource };

  if (city.id === 'river-gate-city') {
    stockByResource.grain = Math.max(0, stockByResource.grain - shift);
    stockByResource.tools = Math.max(0, stockByResource.tools - Math.floor(shift / 2));
  }

  if (city.id === 'crown-port') {
    stockByResource.grain += shift;
    stockByResource.fish += Math.ceil(shift / 2);
  }

  if (city.id === 'southern-crossing') {
    const simulatedSeasonIndex = explicitTurn === state.turn ? state.seasonIndex : (explicitTurn - 1) % seasonLabels.length;
    stockByResource.grain = Math.max(0, stockByResource.grain + (simulatedSeasonIndex === 2 ? 2 : -1 + shift));
  }

  return new City({
    ...city.toJSON(),
    prosperity: Math.max(0, Math.min(100, city.prosperity + (city.id === 'crown-port' ? shift : city.id === 'river-gate-city' ? -shift : 0))),
    stability: Math.max(0, Math.min(100, city.stability + (city.id === 'river-gate-city' ? -Math.ceil(shift / 2) : city.id === 'southern-crossing' ? 1 : 0))),
    stockByResource,
  });
}

function getRouteStateByTurn(route, explicitTurn = state.turn, explicitSeasonIndex = state.seasonIndex) {
  return new TradeRoute({
    ...route.toJSON(),
    active: route.id === 'southern-grainway' ? explicitSeasonIndex !== 3 : route.active,
    riskLevel: Math.max(0, Math.min(100, route.riskLevel + (route.id === 'ember-foundry-line' ? explicitTurn * 3 : explicitSeasonIndex === 3 ? 8 : -2))),
  });
}



function getRouteHud(route) {
  return routeHudByMode[route.transportMode] ?? defaultRouteHud;
}

function getQuadraticPoint(origin, control, destination, t) {
  const inverse = 1 - t;

  return {
    x: (inverse * inverse * origin.x) + (2 * inverse * t * control.x) + (t * t * destination.x),
    y: (inverse * inverse * origin.y) + (2 * inverse * t * control.y) + (t * t * destination.y),
  };
}

function renderRouteHudMarkers(route, visual, { compact = false } = {}) {
  const routeHud = getRouteHud(route);
  const midpoint = getQuadraticPoint(visual.origin, visual.control, visual.destination, 0.5);
  const packetCount = compact ? 1 : Math.max(1, Math.min(3, Math.ceil(route.totalCapacity / 5)));
  const packetMarkup = Array.from({ length: packetCount }, (_, index) => {
    const t = compact ? 0.5 : 0.28 + (index * (0.44 / Math.max(1, packetCount - 1)));
    const point = getQuadraticPoint(visual.origin, visual.control, visual.destination, t);

    return `<circle class="economy-route-packet economy-route-packet--${routeHud.tone}" cx="${point.x}" cy="${point.y}" r="${compact ? 0.58 : 0.68 + (index % 2) * 0.1}" />`;
  }).join('');
  const riskTicks = compact ? 0 : Math.max(0, Math.min(2, Math.floor(route.riskLevel / 32)));
  const riskMarkup = Array.from({ length: riskTicks }, (_, index) => `
    <rect class="economy-route-risk-tick" x="${midpoint.x + 2.7 + (index * 1.15)}" y="${midpoint.y - 4.05}" width="0.72" height="1.85" rx="0.32" />
  `).join('');

  return `
    <g class="economy-route-hud economy-route-hud--${routeHud.tone} ${compact ? 'is-compact' : 'is-emphasized'}" aria-label="${routeHud.label}, capacité ${route.totalCapacity}, risque ${route.riskLevel}">
      ${packetMarkup}
      ${compact ? '' : `<circle class="economy-route-hud__plate" cx="${midpoint.x}" cy="${midpoint.y}" r="2.7" />`}
      ${compact ? '' : `<text class="economy-route-hud__glyph" x="${midpoint.x}" y="calc(${midpoint.y} + 1px)" text-anchor="middle">${routeHud.glyph}</text>`}
      ${riskMarkup}
    </g>
  `;
}

function getResourceHud(resourceId) {
  return resourceHudById[resourceId] ?? { ...defaultResourceHud, label: resourceId };
}

function getCityResourceHudItems(city, limit = 3) {
  return city.resources.entries
    .slice()
    .sort((left, right) => right.quantity - left.quantity || left.resourceId.localeCompare(right.resourceId))
    .slice(0, limit)
    .map((resource) => ({
      ...resource,
      ...getResourceHud(resource.resourceId),
    }));
}

function renderResourceHudBadges(city, position, { expanded = false } = {}) {
  const resources = getCityResourceHudItems(city, expanded ? 3 : 1);
  const labelDx = Number.isFinite(position.labelDx) ? position.labelDx / 5 : 0;
  const labelDy = Number.isFinite(position.labelDy) ? position.labelDy / 5 : 0;
  const gap = expanded ? 5.4 : 0;
  const startX = position.x + labelDx - ((resources.length - 1) * (gap / 2));
  const y = position.y + labelDy + (city.marker.size * (expanded ? 10.2 : 8.8));

  return resources.map((resource, index) => {
    const x = startX + (index * gap);
    return `
      <g class="economy-resource-glyph ${expanded ? 'is-expanded' : 'is-compact'} economy-resource-glyph--${resource.tone}" aria-label="${resource.label}: ${resource.quantity}">
        <circle class="economy-resource-glyph__backplate" cx="${x}%" cy="${y}%" r="${expanded ? 2.25 : 1.55}" />
        <text class="economy-resource-glyph__icon" x="${x}%" y="calc(${y}% + 1px)" text-anchor="middle">${resource.glyph}</text>
      </g>
    `;
  }).join('');
}

function renderRouteManifest(route) {
  const resources = route.resources.slice(0, 3).map((resource) => ({
    ...resource,
    ...getResourceHud(resource.resourceId),
  }));

  if (resources.length === 0) {
    return '<div class="economy-route-card__manifest"><span class="economy-resource-chip economy-resource-chip--slate">• capacité réservée</span></div>';
  }

  return `
    <div class="economy-route-card__manifest">
      ${resources.map((resource) => `<span class="economy-resource-chip economy-resource-chip--${resource.tone}" title="${resource.label}">${resource.glyph} ${resource.resourceId} ${resource.capacity}</span>`).join('')}
    </div>
  `;
}

function getRouteStressSummary(route, tensionByCityId, cityNameById = {}) {
  const originTension = tensionByCityId[route.originCityId]?.tensionLevel ?? 'low';
  const destinationTension = tensionByCityId[route.destinationCityId]?.tensionLevel ?? 'low';
  const resources = route.resources.slice().sort((left, right) => right.capacity - left.capacity || left.resourceId.localeCompare(right.resourceId));
  const mainResource = resources[0];
  const mainResourceLabel = mainResource ? getResourceHud(mainResource.resourceId).label : 'capacité réservée';
  const highTension = originTension === 'high' || destinationTension === 'high';
  const stressedEndpoint = originTension === 'high'
    ? cityNameById[route.originCityId] ?? route.originCityId
    : destinationTension === 'high'
      ? cityNameById[route.destinationCityId] ?? route.destinationCityId
      : null;
  const drivers = [];

  if (!route.active) {
    drivers.push('route inactive: bascule logistique à prévoir');
  }

  if (route.riskLevel >= 70) {
    drivers.push(`risque ${route.riskLevel}: convoi vulnérable`);
  } else if (route.riskLevel >= 55) {
    drivers.push(`risque ${route.riskLevel}: escorte utile`);
  }

  if (route.totalCapacity >= 9) {
    drivers.push(`surcharge ${route.totalCapacity}: goulot possible`);
  } else if (route.totalCapacity >= 6) {
    drivers.push(`flux dense ${route.totalCapacity}: surveiller débit`);
  }

  if (highTension) {
    drivers.push(`${stressedEndpoint} en tension: route prioritaire`);
  }

  if (mainResource) {
    drivers.push(`${mainResourceLabel} (${mainResource.capacity}) ressource clé`);
  }

  const tone = !route.active || route.riskLevel >= 70 || highTension
    ? 'high'
    : route.riskLevel >= 55 || route.totalCapacity >= 9
      ? 'medium'
      : 'low';
  const headline = tone === 'high'
    ? 'Priorité logistique'
    : tone === 'medium'
      ? 'Flux à surveiller'
      : 'Route stable';

  return {
    tone,
    headline,
    drivers: drivers.slice(0, 3),
    summary: drivers.slice(0, 2).join(' · ') || 'Flux stable, pas de goulot visible',
  };
}

function renderRouteStressBadge(route, stress, visual) {
  const midpoint = getQuadraticPoint(visual.origin, visual.control, visual.destination, 0.5);

  return `
    <g class="economy-route-stress economy-route-stress--${stress.tone}" aria-label="${stress.headline}: ${stress.summary}">
      <rect x="${midpoint.x - 9.4}" y="${midpoint.y - 8.6}" width="18.8" height="4.4" rx="2.2" />
      <text x="${midpoint.x}" y="${midpoint.y - 5.55}" text-anchor="middle">${stress.headline}</text>
    </g>
  `;
}

function renderEconomyBlockerRouteBadge(blocker, visual) {
  const midpoint = getQuadraticPoint(visual.origin, visual.control, visual.destination, 0.5);

  return `
    <g class="economy-blocker-badge economy-blocker-badge--${blocker.tone}" aria-label="${blocker.summary}: ${blocker.effect}">
      <rect x="${midpoint.x - 10.8}" y="${midpoint.y - 9.2}" width="21.6" height="5.2" rx="2.6" />
      <text x="${midpoint.x}" y="${midpoint.y - 5.55}" text-anchor="middle">${blocker.blocker}</text>
    </g>
  `;
}

function renderEconomyBlockerCityBadge(blocker, position) {
  const labelDx = Number.isFinite(position.labelDx) ? position.labelDx / 5 : 0;
  const labelDy = Number.isFinite(position.labelDy) ? position.labelDy / 5 : 0;
  const x = position.x + labelDx;
  const y = position.y + labelDy - 7.2;

  return `
    <g class="economy-blocker-city-badge economy-blocker-city-badge--${blocker.tone}" aria-label="${blocker.summary}: ${blocker.effect}">
      <circle cx="${x}%" cy="${y}%" r="2.45" />
      <text x="${x}%" y="calc(${y}% + 1px)" text-anchor="middle">!</text>
    </g>
  `;
}

function getEconomyViewModel() {
  const liveCities = cities.map(getCityStateByTurn);
  const previousTurn = Math.max(1, state.turn - 1);
  const previousCities = cities.map((city) => getCityStateByTurn(city, previousTurn));
  const liveRoutes = routes.map(getRouteStateByTurn);
  const previousSeasonIndex = (state.seasonIndex + seasonLabels.length - 1) % seasonLabels.length;
  const previousRoutes = routes.map((route) => getRouteStateByTurn(route, previousTurn, previousSeasonIndex));
  const overlay = buildEconomyMapOverlay(liveCities, liveRoutes, { cityPositionById: cityLayoutsById });
  const comparison = buildCityComparisonPanel(liveCities, { desiredStockByCityId });
  const stockPanels = Object.fromEntries(
    liveCities.map((city) => [city.id, buildCityStockPanel(city, { desiredStockByResource: desiredStockByCityId[city.id] ?? {} })]),
  );
  const deltaByCityId = Object.fromEntries(
    liveCities.map((city) => {
      const previousCity = previousCities.find((candidate) => candidate.id === city.id) ?? city;
      const previousStock = Object.values(previousCity.stockByResource).reduce((total, value) => total + value, 0);
      const currentStock = Object.values(city.stockByResource).reduce((total, value) => total + value, 0);

      return [city.id, {
        stockDelta: currentStock - previousStock,
        stabilityDelta: city.stability - previousCity.stability,
        prosperityDelta: city.prosperity - previousCity.prosperity,
      }];
    }),
  );

  const routeDeltaById = Object.fromEntries(
    liveRoutes.map((route) => {
      const previousRoute = previousRoutes.find((candidate) => candidate.id === route.id) ?? route;

      return [route.id, {
        riskDelta: route.riskLevel - previousRoute.riskLevel,
        activeDelta: Number(route.active) - Number(previousRoute.active),
        capacityDelta: route.totalCapacity - previousRoute.totalCapacity,
      }];
    }),
  );

  const pulse = liveCities
    .map((city) => ({ city, delta: deltaByCityId[city.id] }))
    .sort((left, right) => Math.abs(right.delta.stockDelta) - Math.abs(left.delta.stockDelta))[0] ?? null;

  return { overlay, comparison, stockPanels, cities: liveCities, routes: liveRoutes, deltaByCityId, routeDeltaById, pulse };
}

function buildRouteVisual(route, origin, destination, index) {
  const deltaX = destination.x - origin.x;
  const deltaY = destination.y - origin.y;
  const length = Math.hypot(deltaX, deltaY) || 1;
  const normalX = -deltaY / length;
  const normalY = deltaX / length;
  const critical = route.riskLevel >= 55 || route.totalCapacity >= 9;
  const inactive = !route.active;
  const modeClass = `is-${route.transportMode}`;
  const emphasisClass = critical ? 'is-critical' : 'is-support';
  const activeClass = inactive ? 'is-inactive' : 'is-active';
  const amplitude = route.transportMode === 'river' ? 2.2 : route.transportMode === 'land' ? 1.25 : 1.8;
  const lane = (index % 3) - 1;
  const curveLift = (3.2 + (Math.abs(lane) * 1.9)) * (lane === 0 ? 1 : lane);
  const controlX = ((origin.x + destination.x) / 2) + (normalX * curveLift);
  const controlY = ((origin.y + destination.y) / 2) + (normalY * curveLift);
  const control = { x: controlX, y: controlY };
  const pathD = `M ${origin.x} ${origin.y} Q ${control.x} ${control.y} ${destination.x} ${destination.y}`;
  const markerId = `route-arrow-${route.transportMode}`;

  return {
    pathD,
    classes: ['economy-route', modeClass, emphasisClass, activeClass].join(' '),
    markerId,
    critical,
    inactive,
    amplitude,
    origin,
    control,
    destination,
  };
}

function renderCityQuickPanel(economyView) {
  if (state.activeOverlaySlot !== 'economy-overlay') {
    return '';
  }

  const cityId = state.hoveredCityId ?? state.selectedCityId;
  const city = economyView.overlay.cities.find((candidate) => candidate.cityId === cityId);

  if (!city || !city.marker.position) {
    return '';
  }

  const stockPanel = economyView.stockPanels[city.cityId];
  const comparisonRow = economyView.comparison.rows.find((candidate) => candidate.cityId === city.cityId);
  const topResources = stockPanel.rows.slice(0, 3);
  const fragileResources = stockPanel.rows.filter((row) => row.status === 'shortage').length;
  const left = Math.min(76, Math.max(8, city.marker.position.x + 3));
  const top = Math.min(66, Math.max(10, city.marker.position.y - 18));

  return `
    <aside class="city-quick-panel city-quick-panel--${comparisonRow?.tensionLevel ?? 'low'}" style="left:${left}%;top:${top}%;" aria-live="polite">
      <div class="city-quick-panel__header">
        <div>
          <strong>${city.cityName}</strong>
          <p>${city.capital ? 'Capitale logistique' : city.tradeRouteIds.length >= 2 || city.resources.totalStock >= 16 ? 'Hub logistique' : 'Ville logistique'} · ${city.regionId}</p>
        </div>
        <span class="city-quick-panel__tone city-quick-panel__tone--${city.marker.tone}">${city.marker.tone}</span>
      </div>
      <div class="city-quick-panel__stats">
        <span>Stock ${city.resources.totalStock}</span>
        <span>Stabilité ${city.stability}</span>
        <span>Prospérité ${city.prosperity}</span>
      </div>
      <div class="city-quick-panel__alert-row">
        <span class="tension-pill tension-pill--${comparisonRow?.tensionLevel ?? 'low'}">${comparisonRow?.tensionLevel ?? 'low'}</span>
        <span>${fragileResources} ressource${fragileResources > 1 ? 's' : ''} fragile${fragileResources > 1 ? 's' : ''}</span>
      </div>
      <ul class="city-quick-panel__stocks">
        ${topResources.map((row) => `<li class="${row.status}"><span>${row.resourceId}</span><strong>${row.currentQuantity}</strong></li>`).join('')}
      </ul>
    </aside>
  `;
}

function getIntrigueCelluleStateByTurn(cellule) {
  const shift = Math.max(0, state.turn - 1);
  const exposureDeltaByLocation = {
    'crown-heart': state.seasonIndex === 1 ? 4 : 1,
    'river-gate': 6 + state.seasonIndex,
    'iron-plain': 3 + Math.floor(shift / 2),
    'southern-reach': -1 + shift,
  };

  return new Cellule({
    ...cellule.toJSON(),
    exposure: Math.max(0, Math.min(100, cellule.exposure + (exposureDeltaByLocation[cellule.locationId] ?? shift))),
  });
}

function getIntrigueOperationStateByTurn(operation) {
  const shift = Math.max(0, state.turn - 1);

  return new OperationClandestine({
    ...operation.toJSON(),
    progress: Math.max(0, Math.min(100, operation.progress + (operation.type === 'sabotage' ? 6 + shift : 2))),
    heat: Math.max(0, Math.min(100, operation.heat + (operation.type === 'sabotage' ? 4 + state.seasonIndex : 1))),
    detectionRisk: Math.max(0, Math.min(100, operation.detectionRisk + (operation.theaterId === 'river-gate' ? 3 : 1))),
  });
}


const sabotageGlyphLanguage = {
  high: {
    code: 'S3',
    label: 'Sabotage critique',
    glyph: 'M 0 -1.15 L 1 0.58 L -1 0.58 Z M -0.38 0.16 H 0.38 M 0 -0.58 V 0.3',
    tickCount: 6,
  },
  medium: {
    code: 'S2',
    label: 'Menace active',
    glyph: 'M -0.92 -0.68 H 0.92 L 0.5 0.72 H -0.5 Z M -0.45 0 H 0.45',
    tickCount: 4,
  },
  low: {
    code: 'S1',
    label: 'Signal discret',
    glyph: 'M 0 -0.9 A 0.9 0.9 0 1 1 -0.01 -0.9 M -0.48 0 H 0.48',
    tickCount: 3,
  },
  none: {
    code: 'S0',
    label: 'Aucune menace',
    glyph: 'M -0.72 0 H 0.72 M 0 -0.72 V 0.72',
    tickCount: 2,
  },
};

function getSabotageGlyphLanguage(entry) {
  return sabotageGlyphLanguage[entry.sabotageRiskLevel] ?? sabotageGlyphLanguage.none;
}

function renderSabotageGlyphTicks(entry, radius, tickCount) {
  return Array.from({ length: tickCount }, (_, index) => {
    const angle = ((Math.PI * 2) / tickCount) * index - (Math.PI / 2);
    const innerRadius = radius + 0.95;
    const outerRadius = radius + 1.95;
    const x1 = entry.glyphCenter.x + Math.cos(angle) * innerRadius;
    const y1 = entry.glyphCenter.y + Math.sin(angle) * innerRadius;
    const x2 = entry.glyphCenter.x + Math.cos(angle) * outerRadius;
    const y2 = entry.glyphCenter.y + Math.sin(angle) * outerRadius;

    return `<line class="intrigue-threat-glyph__tick" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%"></line>`;
  }).join('');
}

function clampVisualMetric(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getIntrigueOverlapPressure(entry, entries) {
  return entries.reduce((pressure, candidate) => {
    if (candidate.locationId === entry.locationId) {
      return pressure;
    }

    const distance = Math.hypot(entry.center.x - candidate.center.x, entry.center.y - candidate.center.y);

    if (distance >= 24) {
      return pressure;
    }

    return pressure + ((24 - distance) / 24);
  }, 0);
}

function buildIntrigueEntryVisuals(entries) {
  return entries.map((entry, index) => {
    const overlapPressure = getIntrigueOverlapPressure(entry, entries);
    const isCritical = entry.sabotageRiskLevel === 'high' || entry.metrics.exposedCellCount > 0;
    const overlapScale = clampVisualMetric(1 - (overlapPressure * (isCritical ? 0.07 : 0.16)), isCritical ? 0.78 : 0.58, 1);
    const baseHeatRadius = entry.sabotageRiskLevel === 'high'
      ? 20
      : entry.sabotageRiskLevel === 'medium'
        ? 14
        : entry.sabotageRiskLevel === 'low'
          ? 9
          : 6;
    const baseGlyphRadius = entry.sabotageRiskLevel === 'high'
      ? 6.6
      : entry.sabotageRiskLevel === 'medium'
        ? 5.4
        : 4.3;
    const offsetAngle = ((Math.PI * 2) / Math.max(1, entries.length)) * index - (Math.PI / 2);
    const glyphOffset = overlapPressure > 0.2 ? clampVisualMetric(2.4 + (overlapPressure * 3.2), 2.4, 7.4) : 0;
    const labelOffset = overlapPressure > 0.2 ? clampVisualMetric(10 + (overlapPressure * 3.8), 10, 16) : 10;

    return {
      ...entry,
      overlapPressure,
      heatRadius: Math.round(baseHeatRadius * overlapScale * 10) / 10,
      heatIntensity: clampVisualMetric((entry.sabotageRiskScore / 100) * (isCritical ? 0.78 : 0.58) * overlapScale, 0.08, isCritical ? 0.62 : 0.42),
      haloRadius: Math.round((8 + (entry.celluleCount * 2.4)) * overlapScale * 10) / 10,
      coreRadius: Math.round((3.4 + (entry.celluleCount * 1.2)) * overlapScale * 10) / 10,
      glyphRadius: Math.round(baseGlyphRadius * (isCritical ? Math.max(overlapScale, 0.86) : overlapScale) * 10) / 10,
      glyphCenter: {
        x: clampVisualMetric(entry.center.x + (Math.cos(offsetAngle) * glyphOffset), 4, 96),
        y: clampVisualMetric(entry.center.y + (Math.sin(offsetAngle) * glyphOffset), 4, 96),
      },
      labelAnchor: {
        x: clampVisualMetric(entry.center.x, 5, 95),
        y: clampVisualMetric(entry.center.y - labelOffset, 5, 95),
      },
      metaAnchor: {
        x: clampVisualMetric(entry.center.x, 5, 95),
        y: clampVisualMetric(entry.center.y + labelOffset + 3.8, 5, 95),
      },
      showSecondaryDetails: isCritical || entry.isSelected || entry.isFocused || overlapPressure < 0.45,
    };
  });
}

function buildIntrigueLinkVisual(link, index) {
  const deltaX = link.destination.x - link.origin.x;
  const deltaY = link.destination.y - link.origin.y;
  const length = Math.hypot(deltaX, deltaY) || 1;
  const normalX = -deltaY / length;
  const normalY = deltaX / length;
  const curveLift = (link.riskLevel === 'high' ? 4.8 : link.riskLevel === 'medium' ? 3.6 : 2.5) + ((index % 2) * 1.5);
  const control = {
    x: ((link.origin.x + link.destination.x) / 2) + (normalX * curveLift),
    y: ((link.origin.y + link.destination.y) / 2) + (normalY * curveLift),
  };

  return {
    ...link,
    strokeWidth: Math.round((0.65 + (Math.min(link.intensity, 3) * 0.34)) * 100) / 100,
    relayRadius: Math.round((0.85 + (Math.min(link.intensity, 3) * 0.22)) * 100) / 100,
    pathD: `M ${link.origin.x} ${link.origin.y} Q ${control.x} ${control.y} ${link.destination.x} ${link.destination.y}`,
    control,
  };
}

function buildIntrigueLinks(entries) {
  const entryById = new Map(entries.map((entry) => [entry.locationId, entry]));
  const links = new Map();

  provinces.forEach((province) => {
    const source = entryById.get(province.id);

    if (!source) {
      return;
    }

    province.neighborIds.forEach((neighborId) => {
      const target = entryById.get(neighborId);
      const origin = getProvinceCenter(province.id);
      const destination = getProvinceCenter(neighborId);
      const linkId = [province.id, neighborId].sort().join('::');

      if (!target || !origin || !destination || links.has(linkId)) {
        return;
      }

      links.set(linkId, {
        linkId,
        origin,
        destination,
        intensity: Math.max(source.celluleCount, target.celluleCount),
        riskLevel: source.sabotageRiskLevel === 'high' || target.sabotageRiskLevel === 'high'
          ? 'high'
          : source.sabotageRiskLevel === 'medium' || target.sabotageRiskLevel === 'medium'
            ? 'medium'
            : 'low',
      });
    });
  });

  return [...links.values()];
}

function buildSelectedProvinceIntrigueFogHint(entry, selectedCellules, selectedOperations) {
  if (!entry) {
    return null;
  }

  const compromisedCount = selectedCellules.filter((cellule) => cellule.statusClass === 'compromised').length;
  const exposedCount = entry.metrics.exposedCellCount + compromisedCount;
  const heatedOperation = selectedOperations.find((operation) => operation.detectionRisk >= 50 || operation.heat >= 50) ?? null;
  const activeSabotage = selectedOperations.find((operation) => operation.type === 'sabotage') ?? null;

  if (exposedCount > 0) {
    return {
      tone: 'warning',
      visibility: 'Partiellement révélé',
      reason: `Cellule exposée signalée à ${entry.locationName}: les identifiants restent masqués tant que le renseignement local n'est pas consolidé.`,
      safeAction: 'Réduire chaleur',
      actionHint: 'Réduire chaleur avant d’exposer la cellule ou déplacer le focus sur une cible nominative.',
      ariaLabel: `Raison brouillard intrigue pour ${entry.locationName}: cellule exposée, action sûre réduire chaleur`,
    };
  }

  if (heatedOperation) {
    return {
      tone: 'danger',
      visibility: 'Masqué',
      reason: `Sécurité cible élevée à ${entry.locationName}: l'opération est active mais son relais exact reste couvert par le brouillard.`,
      safeAction: 'Temporiser',
      actionHint: 'Temporiser et baisser la pression; ne pas révéler cellule, relais ou objectif tant que le risque reste haut.',
      ariaLabel: `Raison brouillard intrigue pour ${entry.locationName}: sécurité cible élevée, action sûre temporiser`,
    };
  }

  if (entry.presenceLevel === 'high' || entry.sabotageRiskLevel === 'medium' || entry.sabotageRiskLevel === 'high' || activeSabotage) {
    return {
      tone: entry.sabotageRiskLevel === 'high' ? 'danger' : 'warning',
      visibility: 'Partiellement révélé',
      reason: `Renseignement incomplet à ${entry.locationName}: la présence clandestine est lisible, mais les relais précis ne sont pas confirmés.`,
      safeAction: 'Collecter renseignement',
      actionHint: 'Collecter renseignement pour confirmer le hotspot avant toute action qui révélerait une cible.',
      ariaLabel: `Raison brouillard intrigue pour ${entry.locationName}: renseignement incomplet, action sûre collecter renseignement`,
    };
  }

  return {
    tone: 'watch',
    visibility: 'Surveillance',
    reason: `Signal faible à ${entry.locationName}: le brouillard masque les détails car aucun risque fort n'est confirmé.`,
    safeAction: 'Surveiller',
    actionHint: 'Surveiller sans escalade; garder la province en observation jusqu’à un signal plus net.',
    ariaLabel: `Raison brouillard intrigue pour ${entry.locationName}: signal faible, action sûre surveiller`,
  };
}

function buildSelectedProvinceIntrigueResponseChoices(entry, selectedCellules, selectedOperations, fogHint = null) {
  if (!entry) {
    return [];
  }

  const compromisedCount = selectedCellules.filter((cellule) => cellule.statusClass === 'compromised').length;
  const exposedCount = entry.metrics.exposedCellCount + compromisedCount;
  const hasActiveOperation = selectedOperations.length > 0;
  const heatedOperation = selectedOperations.find((operation) => operation.detectionRisk >= 50 || operation.heat >= 50) ?? null;
  const riskIsHigh = entry.sabotageRiskLevel === 'high' || exposedCount > 0 || Boolean(heatedOperation);
  const baseMissingInfo = exposedCount > 0
    ? 'identité de cellule et relais précis masqués'
    : hasActiveOperation
      ? 'objectif exact et relais opérationnel masqués'
      : 'source du signal et loyautés locales inconnues';
  const choices = [
    {
      code: 'surveiller',
      label: 'Surveiller',
      tone: 'watch',
      exposureRisk: 'faible',
      confidence: riskIsHigh ? 'incertain' : 'fiable',
      confidenceLabel: riskIsHigh ? 'Confiance incertaine' : 'Confiance fiable',
      confidenceReason: riskIsHigh
        ? 'Le signal reste exploitable, mais une pression cachée peut fausser la lecture.'
        : 'Les signaux visibles suffisent pour observer sans exposer le réseau.',
      improveConfidence: 'Collecter renseignement ou attendre un tour pour confirmer le signal avant action directe.',
      missingInfo: baseMissingInfo,
      gain: 'Maintient le signal visible sans forcer la révélation du brouillard.',
      summary: 'Surveiller: garder la province en observation et attendre un signal plus net.',
      recommended: !riskIsHigh,
    },
    {
      code: 'infiltrer',
      label: 'Infiltrer',
      tone: riskIsHigh ? 'warning' : 'watch',
      exposureRisk: riskIsHigh ? 'modéré' : 'faible à modéré',
      confidence: heatedOperation ? 'dangereux' : entry.presenceLevel === 'low' ? 'information-insuffisante' : 'incertain',
      confidenceLabel: heatedOperation ? 'Confiance dangereuse' : entry.presenceLevel === 'low' ? 'Information insuffisante' : 'Confiance incertaine',
      confidenceReason: heatedOperation
        ? 'La sécurité cible visible est trop haute pour supposer un contact sûr.'
        : entry.presenceLevel === 'low'
          ? 'Le brouillard masque encore la source du signal; ne pas inférer une menace réelle.'
          : 'Le hotspot est plausible, mais le relais précis reste non confirmé.',
      improveConfidence: 'Collecter renseignement discret avant infiltration ou basculer en surveillance.',
      missingInfo: exposedCount > 0 ? 'canal sûr pour approcher la cellule exposée' : 'confirmation du hotspot avant contact direct',
      gain: 'Transforme le soupçon en renseignement exploitable sans nommer la cible.',
      summary: 'Collecter renseignement: approcher le réseau sans révéler cellule, relais ou objectif.',
      recommended: !heatedOperation && entry.presenceLevel !== 'low',
    },
  ];

  if (riskIsHigh) {
    choices.push({
      code: exposedCount > 0 ? 'reduire-chaleur' : 'temporiser',
      label: exposedCount > 0 ? 'Réduire chaleur' : 'Temporiser',
      tone: exposedCount > 0 ? 'danger' : 'warning',
      exposureRisk: exposedCount > 0 ? 'élevé si action directe' : 'modéré tant que la sécurité cible reste haute',
      confidence: exposedCount > 0 ? 'dangereux' : 'incertain',
      confidenceLabel: exposedCount > 0 ? 'Confiance dangereuse' : 'Confiance incertaine',
      confidenceReason: exposedCount > 0
        ? 'L’exposition visible rend toute neutralisation directe risquée sans révéler les détails masqués.'
        : 'Le risque est lisible, mais le relais exact reste couvert par le brouillard.',
      improveConfidence: exposedCount > 0
        ? 'Réduire chaleur puis collecter renseignement avant une action nominative.'
        : 'Temporiser pour laisser baisser la sécurité cible avant de réévaluer.',
      missingInfo: fogHint?.reason ?? baseMissingInfo,
      gain: exposedCount > 0
        ? 'Diminue la pression avant une neutralisation publique ou ciblée.'
        : 'Laisse passer la fenêtre risquée tout en gardant le théâtre sous contrôle.',
      summary: `${exposedCount > 0 ? 'Réduire chaleur' : 'Temporiser'}: privilégier une réponse prudente avant toute neutralisation visible.`,
      recommended: true,
    });
  } else {
    choices.push({
      code: 'attendre',
      label: 'Attendre',
      tone: 'watch',
      exposureRisk: 'très faible',
      confidence: entry.presenceLevel === 'low' ? 'information-insuffisante' : 'fiable',
      confidenceLabel: entry.presenceLevel === 'low' ? 'Information insuffisante' : 'Confiance fiable',
      confidenceReason: entry.presenceLevel === 'low'
        ? 'Le choix est sûr, mais les données visibles ne suffisent pas à qualifier la menace.'
        : 'Attendre ne révèle rien et garde les options ouvertes avec les informations actuelles.',
      improveConfidence: 'Surveiller ou collecter renseignement au prochain tour pour clarifier le signal.',
      missingInfo: baseMissingInfo,
      gain: 'Préserve totalement le brouillard mais reporte le gain de renseignement.',
      summary: 'Surveiller sans escalade: attendre si le tour ne peut pas absorber de chaleur intrigue.',
      recommended: false,
    });
  }

  return choices.slice(0, 3);
}

function getIntrigueViewModel() {
  const liveCellules = intrigueCellules.map(getIntrigueCelluleStateByTurn);
  const liveOperations = intrigueOperations.map(getIntrigueOperationStateByTurn);
  const locationNames = Object.fromEntries(provinces.map((province) => [province.id, province.name]));
  const demo = buildIntrigueWebDemo({
    alertLevel: state.turn >= 4 ? 'eleve' : state.turn >= 2 ? 'renforce' : 'latent',
    cellules: liveCellules,
    operations: liveOperations,
  }, { locationNames });
  const entries = buildIntrigueEntryVisuals(demo.map.entries.map((entry) => ({
    ...entry,
    center: getProvinceCenter(entry.locationId),
    isSelected: entry.locationId === state.selectedProvinceId,
    isFocused: entry.locationId === state.focusedProvinceId,
    celluleCount: entry.metrics.celluleCount,
    threatGlyph: getSabotageGlyphLanguage(entry),
  })).filter((entry) => entry.center));

  const filters = state.intrigueFilters;
  const filteredEntries = entries.filter((entry) => {
    const matchesPresence = !filters.presence || entry.metrics.celluleCount > 0;
    const matchesAlerts = !filters.alerts || entry.metrics.exposedCellCount > 0 || entry.sabotageRiskLevel === 'high';
    const matchesSabotage = !filters.sabotage || entry.metrics.sabotageOperationCount > 0;
    return matchesPresence && matchesAlerts && matchesSabotage;
  });
  const filteredCellules = demo.panels.cellules.filter((cellule) => {
    const matchesPresence = !filters.presence || true;
    const matchesAlerts = !filters.alerts || cellule.statusClass === 'exposed' || cellule.statusClass === 'compromised';
    const matchesSabotage = !filters.sabotage || liveOperations.some((operation) => !operation.isResolved && operation.celluleId === cellule.celluleId && operation.type === 'sabotage');
    return matchesPresence && matchesAlerts && matchesSabotage;
  });
  const filteredOperations = demo.panels.operations.filter((operation) => {
    const matchesPresence = !filters.presence || true;
    const matchesAlerts = !filters.alerts || operation.tone === 'danger' || operation.detectionRisk >= 40;
    const matchesSabotage = !filters.sabotage || operation.type === 'sabotage';
    return matchesPresence && matchesAlerts && matchesSabotage;
  });
  const selectedOperation = filteredOperations.find((operation) => operation.operationId === state.selectedIntrigueOperationId)
    ?? filteredOperations.find((operation) => operation.locationId === state.selectedProvinceId)
    ?? filteredOperations[0]
    ?? null;
  const selectedEntry = filteredEntries.find((entry) => entry.locationId === state.selectedProvinceId) ?? filteredEntries[0] ?? null;
  const selectedCellules = filteredCellules.filter((cellule) => cellule.locationId === selectedEntry?.locationId);
  const selectedOperations = filteredOperations.filter((operation) => operation.locationId === selectedEntry?.locationId);
  const selectedRiskReasons = [
    selectedEntry ? `Risque sabotage ${selectedEntry.sabotageRiskLevel}` : null,
    selectedEntry?.metrics.exposedCellCount ? `${selectedEntry.metrics.exposedCellCount} cellule${selectedEntry.metrics.exposedCellCount > 1 ? 's' : ''} exposee${selectedEntry.metrics.exposedCellCount > 1 ? 's' : ''}` : null,
    selectedOperations.length ? `${selectedOperations.length} operation${selectedOperations.length > 1 ? 's' : ''} active${selectedOperations.length > 1 ? 's' : ''}` : null,
    selectedCellules.filter((cellule) => cellule.statusClass === 'compromised').length
      ? `${selectedCellules.filter((cellule) => cellule.statusClass === 'compromised').length} cellule${selectedCellules.filter((cellule) => cellule.statusClass === 'compromised').length > 1 ? 's' : ''} compromise${selectedCellules.filter((cellule) => cellule.statusClass === 'compromised').length > 1 ? 's' : ''}`
      : null,
  ].filter(Boolean);
  const selectedFogHint = buildSelectedProvinceIntrigueFogHint(selectedEntry, selectedCellules, selectedOperations);
  const selectedResponseChoices = buildSelectedProvinceIntrigueResponseChoices(selectedEntry, selectedCellules, selectedOperations, selectedFogHint);
  const incidents = [
    {
      id: 'incident-locks',
      turnLabel: `T${state.turn}`,
      severity: selectedOperation?.tone === 'danger' ? 'critical' : 'warning',
      locationName: selectedOperation?.locationName ?? (entries[0]?.locationName ?? 'Frontieres'),
      title: selectedOperation
        ? `${selectedOperation.type} sous surveillance`
        : 'Activite clandestine detectee',
      detail: selectedOperation
        ? `${selectedOperation.objective}, progression ${selectedOperation.progress}% et risque ${selectedOperation.detectionRisk}.`
        : 'Les relais de terrain signalent un regain d activite a verifier.',
    },
    {
      id: 'incident-cells',
      turnLabel: `T${Math.max(1, state.turn - 1)}`,
      severity: demo.metrics.exposedCellCount > 0 ? 'warning' : 'watch',
      locationName: entries.find((entry) => entry.metrics.exposedCellCount > 0)?.locationName ?? (entries[1]?.locationName ?? 'Province secondaire'),
      title: demo.metrics.exposedCellCount > 0 ? 'Cellules exposees remontees' : 'Reseau reste discret',
      detail: demo.metrics.exposedCellCount > 0
        ? `${demo.metrics.exposedCellCount} cellule${demo.metrics.exposedCellCount > 1 ? 's' : ''} exposee${demo.metrics.exposedCellCount > 1 ? 's' : ''} ont force un repli partiel.`
        : 'Aucune cellule compromise supplementaire n a ete detectee sur le dernier tour.',
    },
    {
      id: 'incident-summary',
      turnLabel: `T${Math.max(1, state.turn - 2)}`,
      severity: 'watch',
      locationName: 'Synthese theatre',
      title: 'Resume securite recent',
      detail: state.lastTurnSummary,
    },
  ];

  return {
    ...demo,
    filters,
    selectedOperation,
    selectedProvince: selectedEntry ? {
      locationId: selectedEntry.locationId,
      locationName: selectedEntry.locationName,
      presenceLevel: selectedEntry.presenceLevel,
      sabotageRiskLevel: selectedEntry.sabotageRiskLevel,
      sabotageRiskScore: selectedEntry.sabotageRiskScore,
      celluleCount: selectedEntry.metrics.celluleCount,
      exposedCellCount: selectedEntry.metrics.exposedCellCount,
      sleeperCellCount: selectedEntry.metrics.sleeperCellCount,
      activeOperationCount: selectedOperations.length,
      drillDown: selectedEntry.drillDown,
      fogHint: selectedFogHint,
      responseChoices: selectedResponseChoices,
      reasons: selectedRiskReasons.length > 0 ? selectedRiskReasons : ['Aucun signal Delta notable'],
      guidance: selectedEntry.sabotageRiskLevel === 'high'
        ? 'Priorite a la surveillance locale, les marqueurs rouges concentrent le risque actif.'
        : selectedOperations.length > 0
          ? 'Surveillez les operations en cours et l exposition des cellules liees.'
          : 'Lecture locale stable, a conserver sous observation.',
    } : null,
    incidents,
    hotspots: demo.hotspots.filter((hotspot) => filteredEntries.some((entry) => entry.locationId === hotspot.locationId)),
    panels: {
      ...demo.panels,
      cellules: filteredCellules,
      operations: filteredOperations,
    },
    metrics: {
      ...demo.metrics,
      locationCount: filteredEntries.length,
      exposedCellCount: filteredCellules.filter((cellule) => cellule.statusClass === 'exposed' || cellule.statusClass === 'compromised').length,
      activeSabotageCount: filteredOperations.filter((operation) => operation.type === 'sabotage').length,
    },
    map: {
      ...demo.map,
      entries: filteredEntries,
      links: buildIntrigueLinks(filteredEntries).map(buildIntrigueLinkVisual),
    },
  };
}


function getCultureViewModel() {
  const overlay = strategicMap.overlays.culture;
  const panel = strategicMap.panels.culture;
  const seeds = strategicMap.businessData.cultureSeeds;
  const selectedRegionId = state.selectedProvinceId;
  const selectedMarkers = overlay.filter((entry) => entry.regionId === selectedRegionId);
  const selectedMarker = selectedMarkers[0] ?? overlay[0] ?? null;
  const tensionFilters = state.cultureTensionFilters ?? {};
  const filteredTensionMarkers = state.cultureTensionMarkers.filter((marker) => tensionFilters[marker.state] !== false);

  return {
    overlay,
    panel,
    seeds,
    selectedRegionId,
    selectedMarkers,
    selectedMarker,
    tensionMarkers: filteredTensionMarkers,
    tensionFilters,
    allTensionMarkers: state.cultureTensionMarkers,
    selectedTensionMarkers: filteredTensionMarkers.filter((marker) => marker.provinceId === selectedRegionId),
    metrics: {
      markerCount: overlay.length,
      cultureCount: seeds.length,
      discoveryCount: new Set(seeds.flatMap((seed) => seed.discoveryIds)).size,
      eventCount: new Set(seeds.flatMap((seed) => seed.historicalEventIds)).size,
      strongMarkerCount: overlay.filter((entry) => entry.influenceTier === 'dominant' || entry.influenceTier === 'strong').length,
    },
  };
}

function getCultureTone(entry) {
  if (entry.markerType === 'innovation') {
    return 'cyan';
  }

  if (entry.markerType === 'traditional') {
    return 'amber';
  }

  if (entry.markerType === 'fragmented') {
    return 'rose';
  }

  return 'slate';
}

const cultureMarkerLanguage = {
  innovation: {
    code: 'INN',
    label: 'Découverte active',
    glyph: 'M 0 -1.15 L 0.34 -0.34 L 1.15 0 L 0.34 0.34 L 0 1.15 L -0.34 0.34 L -1.15 0 L -0.34 -0.34 Z',
    ticks: 8,
  },
  balanced: {
    code: 'BAL',
    label: 'Synthèse culturelle',
    glyph: 'M -0.82 -0.82 H 0.82 V 0.82 H -0.82 Z M -0.38 -0.38 H 0.38 V 0.38 H -0.38 Z',
    ticks: 4,
  },
  traditional: {
    code: 'TRD',
    label: 'Tradition établie',
    glyph: 'M 0 -1 L 0.86 -0.5 L 0.86 0.5 L 0 1 L -0.86 0.5 L -0.86 -0.5 Z M -0.5 0 H 0.5',
    ticks: 6,
  },
  fragmented: {
    code: 'FRG',
    label: 'Mémoire fracturée',
    glyph: 'M -0.95 -0.82 L 0.12 -0.28 L -0.5 0.05 L 0.82 0.78 M 0.62 -0.9 L 0.1 0.16 L 0.92 0.28 M -0.84 0.82 L -0.2 0.24',
    ticks: 5,
  },
  default: {
    code: 'CUL',
    label: 'Présence culturelle',
    glyph: 'M 0 -0.95 A 0.95 0.95 0 1 1 -0.01 -0.95 M -0.55 0 H 0.55',
    ticks: 4,
  },
};

function getCultureMarkerLanguage(entry) {
  return cultureMarkerLanguage[entry.markerType] ?? cultureMarkerLanguage.default;
}

function renderCultureMarkerTicks(center, radius, markerLanguage) {
  return Array.from({ length: markerLanguage.ticks }, (_, index) => {
    const angle = ((Math.PI * 2) / markerLanguage.ticks) * index - (Math.PI / 2);
    const innerRadius = radius + 1.05;
    const outerRadius = radius + 2.05;
    const x1 = center.x + Math.cos(angle) * innerRadius;
    const y1 = center.y + Math.sin(angle) * innerRadius;
    const x2 = center.x + Math.cos(angle) * outerRadius;
    const y2 = center.y + Math.sin(angle) * outerRadius;

    return `<line class="culture-marker__tick" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%"></line>`;
  }).join('');
}

function formatCultureDate(isoDate) {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return String(isoDate ?? '').slice(0, 10);
  }

  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(date).replace('.', '');
}

function getCultureEventTone(event) {
  if (event.importance >= 4) {
    return 'major';
  }

  if (event.discoveries.length > 0) {
    return 'discovery';
  }

  return 'standard';
}

function renderCultureEventCard(event, cultureName) {
  const tone = getCultureEventTone(event);
  const discoveryCount = event.discoveries.length;

  return `
    <article class="culture-event-card culture-event-card--${tone}">
      <div class="culture-event-card__rail"><span>${formatCultureDate(event.triggeredAt)}</span></div>
      <div class="culture-event-card__body">
        <div class="culture-event-card__meta">
          <span>${cultureName}</span>
          <b>IMP-${event.importance}</b>
          ${discoveryCount > 0 ? `<b>D-${discoveryCount}</b>` : ''}
        </div>
        <h4>${event.title}</h4>
        <p>${event.summary}</p>
        ${discoveryCount > 0 ? `<div class="culture-event-card__chips">${event.discoveries.slice(0, 3).map((discoveryId) => `<i>${discoveryId}</i>`).join('')}</div>` : ''}
      </div>
    </article>
  `;
}

function renderCultureLegendKey(cultureView) {
  const entriesByType = [...new Map(cultureView.overlay.map((entry) => [entry.markerType, entry])).values()];
  const active = state.activeOverlaySlot === 'culture-overlay';

  return `
    <div class="culture-symbol-key ${active ? 'is-active' : 'is-muted'}" aria-label="Langage visuel culture et découvertes">
      <div class="culture-symbol-key__status">
        <strong>${active ? 'Couche culture active' : 'Couche culture en veille'}</strong>
        <span>${active ? 'Codes compacts et découvertes du focus pour limiter les collisions.' : 'Repères discrets; activez Culture pour les détails.'}</span>
      </div>
      ${entriesByType.map((entry) => {
        const language = getCultureMarkerLanguage(entry);
        return `
          <span class="culture-symbol-key__item culture-symbol-key__item--${getCultureTone(entry)}">
            <i>${language.code}</i>${language.label}
          </span>
        `;
      }).join('')}
    </div>
  `;
}

function renderCultureMarker(entry, active, clusteredRegionIds = new Set()) {
  const center = getProvinceCenter(entry.regionId);

  if (!center) {
    return '';
  }

  const selected = entry.regionId === state.selectedProvinceId;
  const clustered = clusteredRegionIds.has(entry.regionId);
  const tone = getCultureTone(entry);
  const radius = active ? Math.max(3.9, Math.min(8.2, entry.zoneContour.radius / (clustered ? 4.2 : 3.4))) : 2.15;
  const eventBadgeY = center.y - radius - 2.1;
  const language = getCultureMarkerLanguage(entry);
  const glyphScale = active ? Math.max(1.55, radius * 0.32) : 1.05;
  const selectedClass = selected ? 'is-selected' : '';
  const stateClass = active ? 'is-readable' : 'is-quiet';
  const clusterClass = clustered ? 'is-clustered' : '';

  return `
    <g class="culture-marker culture-marker--${tone} culture-marker--${entry.influenceTier} culture-marker--${entry.markerType} ${selectedClass} ${stateClass} ${clusterClass}" data-culture-region="${entry.regionId}">
      <title>${entry.cultureName} · ${entry.regionId} · ${entry.summary}</title>
      <circle class="culture-marker__aura" cx="${center.x}%" cy="${center.y}%" r="${radius + (active ? 1.8 : 0.9)}"></circle>
      <circle class="culture-marker__ring" cx="${center.x}%" cy="${center.y}%" r="${radius}"></circle>
      ${active && selected ? renderCultureMarkerTicks(center, radius, language) : ''}
      ${active ? `<path class="culture-marker__sigil" d="${language.glyph}" transform="translate(${center.x} ${center.y}) scale(${glyphScale})"></path>` : ''}
      ${active ? `<text class="culture-marker__code" x="${center.x}%" y="${center.y + radius + 2.4}%" text-anchor="middle">${language.code}</text>` : ''}
      ${active && entry.eventCount > 0 && !clustered ? `<g class="culture-event-flag"><circle cx="${center.x + radius + 1.7}%" cy="${eventBadgeY}%" r="1.55"></circle><text x="${center.x + radius + 1.7}%" y="${eventBadgeY + 0.48}%" text-anchor="middle">${entry.eventCount}</text></g>` : ''}
    </g>
  `;
}

function buildCultureClusterSummaries(entries) {
  const remaining = entries
    .map((entry) => ({ entry, center: getProvinceCenter(entry.regionId) }))
    .filter((item) => item.center)
    .sort((left, right) => left.center.x - right.center.x || left.center.y - right.center.y);
  const clusters = [];
  const usedRegionIds = new Set();

  remaining.forEach((item) => {
    if (usedRegionIds.has(item.entry.regionId)) {
      return;
    }

    const members = remaining.filter((candidate) => (
      !usedRegionIds.has(candidate.entry.regionId)
      && Math.hypot(candidate.center.x - item.center.x, candidate.center.y - item.center.y) <= 14
    ));

    if (members.length < 3 && !item.entry.clusterSummary) {
      return;
    }

    members.forEach((member) => usedRegionIds.add(member.entry.regionId));
    const entriesInCluster = members.map((member) => member.entry);
    const cultureIds = [...new Set(entriesInCluster.flatMap((entry) => entry.clusterSummary?.cultureIds ?? [entry.cultureId]))].sort();
    const cultureNames = [...new Set(entriesInCluster.flatMap((entry) => entry.clusterSummary?.cultureNames ?? [entry.cultureName]))].sort();
    const discoveryIds = [...new Set(entriesInCluster.flatMap((entry) => entry.clusterSummary?.discoveryIds ?? entry.discoveries))].sort();
    const pins = entriesInCluster.flatMap((entry) => entry.clusterSummary?.pins ?? [
      ...entry.eventPopups.map((event) => ({
        pinId: `${entry.regionId}:${entry.cultureId}:event:${event.eventId}`,
        kind: 'event',
        name: event.title,
        type: 'événement',
        regionId: entry.regionId,
        cultureId: entry.cultureId,
        cultureName: entry.cultureName,
        importance: event.importance,
      })),
      ...entry.regionalDiscoveryLinks.map((link) => ({
        pinId: link.linkId,
        kind: 'discovery',
        name: link.discoveryId,
        type: 'Découverte',
        regionId: entry.regionId,
        cultureId: entry.cultureId,
        cultureName: entry.cultureName,
        importance: null,
      })),
    ]);
    const dedupedPins = [...new Map(pins.map((pin) => [pin.pinId, pin])).values()]
      .sort((left, right) => (right.importance ?? -1) - (left.importance ?? -1) || left.name.localeCompare(right.name));
    const eventCount = dedupedPins.filter((pin) => pin.kind === 'event').length;
    const centroid = members.reduce((accumulator, member) => ({
      x: accumulator.x + member.center.x,
      y: accumulator.y + member.center.y,
    }), { x: 0, y: 0 });
    const anchor = {
      x: Math.max(9, Math.min(91, centroid.x / members.length)),
      y: Math.max(5, Math.min(94, (centroid.y / members.length) - 7.4)),
    };

    clusters.push({
      clusterId: `culture-cluster:${entriesInCluster.map((entry) => entry.regionId).sort().join(':')}`,
      anchor,
      regionIds: entriesInCluster.map((entry) => entry.regionId).sort(),
      cultureIds,
      cultureNames,
      cultureCount: cultureIds.length,
      discoveryCount: discoveryIds.length,
      eventCount,
      pins: dedupedPins,
      label: `${cultureIds.length} cultures · ${discoveryIds.length} découvertes`,
      summary: `${cultureNames.slice(0, 2).join(', ')}${cultureNames.length > 2 ? '…' : ''}`,
    });
  });

  return clusters;
}

function renderCultureClusterSummary(cluster, active) {
  const detail = `${cluster.summary} · régions ${cluster.regionIds.join(', ')} · cultures ${cluster.cultureIds.join(', ')}`;
  const visiblePins = active ? cluster.pins.slice(0, 4) : [];
  const pinNodes = visiblePins.map((pin, index) => {
    const x = cluster.anchor.x - 5.4 + (index * 3.6);
    const y = cluster.anchor.y + 5.4;
    const pinCode = pin.kind === 'event' ? `H${pin.importance ?? ''}` : `D${index + 1}`;

    return `
      <g class="culture-cluster-pin culture-cluster-pin--${pin.kind}">
        <title>${pin.name} · ${pin.type} · ${pin.regionId}${pin.importance ? ` · importance ${pin.importance}` : ''}</title>
        <circle cx="${x}%" cy="${y}%" r="1.35"></circle>
        <text x="${x}%" y="${y + 0.43}%" text-anchor="middle">${pinCode}</text>
      </g>
    `;
  }).join('');

  return `
    <g class="culture-cluster-summary ${active ? 'is-active' : 'is-muted'}" data-culture-cluster="${cluster.clusterId}">
      <title>${detail}</title>
      <rect x="${cluster.anchor.x - 7.8}%" y="${cluster.anchor.y - 3.1}%" width="15.6%" height="6.2%" rx="2.2%"></rect>
      <text class="culture-cluster-summary__count" x="${cluster.anchor.x - 5.9}%" y="${cluster.anchor.y + 0.45}%">C${cluster.cultureCount}</text>
      <text class="culture-cluster-summary__label" x="${cluster.anchor.x - 0.7}%" y="${cluster.anchor.y + 0.45}%">D${cluster.discoveryCount}${cluster.eventCount > 0 ? ` · H${cluster.eventCount}` : ''}</text>
      ${pinNodes}
    </g>
  `;
}

function renderCultureRecommendationPanel(recommendationView) {
  return `
    <article class="culture-recommendation-panel culture-recommendation-panel--${recommendationView.state}">
      <div class="culture-recommendation-panel__header">
        <span>Conseil culture</span>
        <strong>${recommendationView.summary}</strong>
      </div>
      <div class="culture-recommendation-panel__items">
        ${recommendationView.recommendations.map((recommendation) => `
          <section class="culture-recommendation culture-recommendation--${recommendation.tone}">
            <b>${recommendation.title}</b>
            <p>${recommendation.hook}</p>
            <small>${recommendation.detail}</small>
          </section>
        `).join('')}
      </div>
    </article>
  `;
}

function renderCultureLocalTimeline(timelineView) {
  return `
    <article class="culture-local-timeline culture-local-timeline--${timelineView.state}">
      <div class="culture-local-timeline__header">
        <span>${timelineView.heading}</span>
        <strong>${timelineView.summary}</strong>
      </div>
      ${timelineView.items.length > 0 ? `
        <ol>
          ${timelineView.items.map((item) => `
            <li class="culture-local-timeline__item culture-local-timeline__item--${item.signal}">
              <span>${item.signal}</span>
              <div>
                <b>${item.title}</b>
                <p>${item.summary}</p>
                <small>${item.cultureName} · ${item.regionId}${item.importance ? ` · IMP-${item.importance}` : ''}${item.date ? ` · ${item.date}` : ''}</small>
              </div>
            </li>
          `).join('')}
        </ol>
      ` : '<p>Aucun signal local; sélectionnez un cluster ou une province culturelle dense.</p>'}
    </article>
  `;
}

function renderCultureDiscoveryUrgencyGroups(groupView) {
  if (!groupView || groupView.state !== 'active') {
    return '';
  }

  return `
    <article class="culture-discovery-urgency-groups" aria-label="Découvertes culturelles groupées par urgence">
      <div class="culture-discovery-urgency-groups__header">
        <span>Signaux culturels</span>
        <strong>${groupView.summary}</strong>
      </div>
      ${groupView.groups.map((group) => `
        <section class="culture-discovery-urgency-group culture-discovery-urgency-group--${group.key}">
          <div class="culture-discovery-urgency-group__title">
            <b>${group.label}</b>
            <small>${group.summary}</small>
          </div>
          <ul>
            ${group.items.map((item) => `
              <li class="culture-discovery-urgency-item culture-discovery-urgency-item--${item.kind}">
                <span>${item.shortLabel}</span>
                <b>${item.cause}</b>
                <small>${item.cultureName}${item.regionId ? ` · ${item.regionId}` : ''} · ${item.detail}</small>
              </li>
            `).join('')}
          </ul>
        </section>
      `).join('')}
    </article>
  `;
}

function renderCultureInterventionPriorities(priorityView) {
  if (!priorityView || priorityView.state !== 'active') {
    return '';
  }

  return `
    <article class="culture-intervention-priorities" aria-label="File recommandée des interventions culturelles">
      <div class="culture-intervention-priorities__header">
        <span>Interventions à mettre en file</span>
        <strong>${priorityView.summary}</strong>
      </div>
      <ol>
        ${priorityView.priorities.map((priority) => `
          <li class="culture-intervention-priority culture-intervention-priority--${priority.urgency} ${priority.conflict ? 'has-conflict' : ''}">
            <div>
              <b>${priority.rank}. ${priority.action}</b>
              <span>${priority.urgencyLabel} · ${priority.sourceLabel}</span>
            </div>
            <p>${priority.effect}</p>
            <small>Risque: ${priority.waitRisk} · Dépendance: ${priority.dependency}</small>
            ${priority.blocker ? `<em class="culture-intervention-priority__blocker">${priority.blocker.label} ${priority.blocker.shortReason}</em>` : ''}
            ${priority.followUp ? `<em class="culture-intervention-priority__follow-up">${priority.followUp.label} ${priority.followUp.action}</em>` : ''}
            ${priority.resolutionGain ? `
              <div class="culture-intervention-priority__resolution-gain">
                <b>${priority.resolutionGain.label}</b>
                <span>${priority.resolutionGain.gain}</span>
                <small>${priority.resolutionGain.next} · ${priority.resolutionGain.riskAvoided}</small>
              </div>
            ` : ''}
          </li>
        `).join('')}
      </ol>
      ${priorityView.conflicts.length > 0 ? `
        <div class="culture-intervention-conflicts">
          <b>Conflits prioritaires</b>
          ${priorityView.conflicts.map((conflict) => `<p>${conflict.label}: ${conflict.summary}</p>`).join('')}
        </div>
      ` : ''}
    </article>
  `;
}

function renderCultureBlockerResolutionHistory(history) {
  if (!history.length) {
    return '';
  }

  return `
    <article class="culture-blocker-history" aria-label="Historique récent des blocages culturels">
      <div class="culture-blocker-history__header">
        <span>Blocages récents</span>
        <strong>${history.length} trace${history.length > 1 ? 's' : ''} utile${history.length > 1 ? 's' : ''}</strong>
      </div>
      <ol>
        ${history.map((entry) => `
          <li class="culture-blocker-history__item culture-blocker-history__item--${entry.urgency}">
            <b>${entry.status}</b>
            <span>${entry.effect}</span>
            <small>${entry.cultureName} · ${entry.source} · ${entry.next}</small>
            <em>${entry.risk}</em>
          </li>
        `).join('')}
      </ol>
    </article>
  `;
}

function renderCultureClusterPinList(cluster) {
  if (!cluster) {
    return '';
  }

  const pins = cluster.pins.slice(0, 5);

  return `
    <article class="culture-cluster-pin-list">
      <div class="culture-cluster-pin-list__header">
        <span>Cluster sélectionné</span>
        <strong>${cluster.label}</strong>
      </div>
      ${pins.length > 0 ? `
        <ul>
          ${pins.map((pin) => `
            <li class="culture-cluster-pin-list__item culture-cluster-pin-list__item--${pin.kind}">
              <b>${pin.kind === 'event' ? 'Événement' : 'Découverte'}</b>
              <span>${pin.name}</span>
              <small>${pin.type} · ${pin.regionId}${pin.importance ? ` · IMP-${pin.importance}` : ''}</small>
            </li>
          `).join('')}
        </ul>
      ` : '<p>Aucun événement ou découverte lié à ce cluster.</p>'}
    </article>
  `;
}


function getCultureTensionMarkerVisual(marker) {
  const visuals = {
    eased: { code: 'OK', label: 'Tension apaisée', icon: '✓' },
    unresolved: { code: '!', label: 'Tension non couverte', icon: '!' },
    escalated: { code: '↑', label: 'Tension aggravée', icon: '▲' },
    opportunity: { code: '+', label: 'Opportunité ouverte', icon: '+' },
  };

  return visuals[marker.state] ?? visuals.unresolved;
}

function getCultureTensionTrendVisual(marker) {
  const trend = marker.trend ?? 'unknown';
  const visuals = {
    rising: { code: '↗', label: 'Tendance hausse', shortLabel: 'hausse', priority: 4 },
    stable: { code: '→', label: 'Tendance stable', shortLabel: 'stable', priority: 2 },
    falling: { code: '↘', label: 'Tendance baisse', shortLabel: 'baisse', priority: 1 },
    unknown: { code: '?', label: 'Tendance inconnue', shortLabel: 'inconnue', priority: 0 },
  };

  return visuals[trend] ?? visuals.unknown;
}

function inferCultureTensionTrend(marker) {
  if (marker.state === 'escalated') {
    return 'rising';
  }

  if (marker.state === 'eased') {
    return 'falling';
  }

  if (marker.state === 'unresolved') {
    return 'stable';
  }

  return 'unknown';
}

function buildCultureTensionCause(marker) {
  const trend = marker.trend ?? inferCultureTensionTrend(marker);
  const detail = marker.detail ?? marker.summary ?? 'Cause culturelle à confirmer.';

  if (trend === 'rising') {
    return {
      label: 'Urgence',
      detail: `${marker.source ?? 'Signal culturel'}: ${detail}`,
      priority: 4,
    };
  }

  if (trend === 'falling') {
    return {
      label: 'Action',
      detail: `${marker.source ?? 'Action validée'}: ${detail}`,
      priority: 2,
    };
  }

  if (trend === 'stable') {
    return {
      label: 'File vide',
      detail: `${marker.source ?? 'Recommandation'}: ${detail}`,
      priority: 3,
    };
  }

  return {
    label: 'Cause floue',
    detail: `${marker.source ?? 'Signal ambigu'}: ${detail}`,
    priority: 1,
  };
}

function buildCulturePostCommitTensionMarkers(province, report) {
  if (!province || !report?.resolutionSummary) {
    return [];
  }

  const queuedMarkers = (report.resolutionSummary.queuedActions ?? []).map((action, index) => {
    const state = String(action.effect ?? '').toLowerCase().includes('opportun') ? 'opportunity' : 'eased';
    return {
      markerId: `culture-tension:${state}:${province.provinceId}:${action.actionCode}:${index}`,
      provinceId: province.provinceId,
      provinceLabel: province.label,
      cultureName: action.cultureName,
      state,
      label: state === 'opportunity' ? 'Opportunité ouverte' : 'Tension apaisée',
      summary: action.summary ?? `${action.cultureName}: ${action.effect}`,
      detail: `${action.label}: ${action.effect}. ${action.reason}`,
      source: 'Action culturelle résolue',
      trend: inferCultureTensionTrend({ state }),
    };
    marker.cause = buildCultureTensionCause(marker);
    return marker;
  });

  const uncoveredMarkers = (report.resolutionSummary.uncoveredUrgent ?? []).map((entry, index) => {
    const state = entry.tone === 'aggravated' ? 'escalated' : 'unresolved';
    return {
      markerId: `culture-tension:${state}:${province.provinceId}:${entry.reminderId}:${index}`,
      provinceId: province.provinceId,
      provinceLabel: province.label,
      cultureName: entry.cultureName,
      state,
      label: state === 'escalated' ? 'Tension aggravée' : 'Tension non couverte',
      summary: entry.summary,
      detail: entry.expectedImpact,
      source: 'Recommandation urgente non couverte',
      trend: inferCultureTensionTrend({ state }),
    };
    marker.cause = buildCultureTensionCause(marker);
    return marker;
  });

  return [...queuedMarkers, ...uncoveredMarkers].slice(0, 4);
}

function buildPostCommitCultureTensionMarkers(shell) {
  const provinces = shell.provinces ?? [];
  const intrigueView = buildIntrigueView(shell);

  return provinces.flatMap((province) => {
    const focusContext = { focusedProvinceId: province.provinceId, focusedProvince: province, neighborIds: new Set(province.neighborIds) };
    const actionQueue = buildSelectedProvinceActionQueue(province, shell, focusContext, intrigueView);
    const cultureContext = getSelectedCultureContext(province.provinceId);
    const unlockHintsByAction = buildCultureUnlockHintsForActions(province, actionQueue, cultureContext);
    const report = buildCultureOpportunityReminders({ province, actionQueue, unlockHintsByAction });
    return buildCulturePostCommitTensionMarkers(province, report);
  }).slice(0, 8);
}

function buildPostCommitCultureBlockerHistory(shell) {
  const overlay = strategicMap.overlays.culture;
  const clusters = buildCultureClusterSummaries(overlay);

  return (shell.provinces ?? []).flatMap((province) => {
    const selectedMarker = overlay.find((entry) => entry.regionId === province.provinceId) ?? null;
    const selectedCluster = clusters.find((cluster) => cluster.regionIds.includes(province.provinceId)) ?? null;
    const groups = buildCultureDiscoveryUrgencyGroups({ selectedMarker, selectedCluster });
    const priorityView = buildCultureInterventionPriorities(groups);

    return buildCultureBlockerResolutionHistory({
      priorityView,
      previousHistory: state.cultureBlockerHistory,
      provinceId: province.provinceId,
      provinceLabel: province.label,
      turn: state.turn,
    });
  }).slice(0, 8);
}


const CULTURE_TENSION_FILTER_LABELS = {
  eased: 'Apaisées',
  unresolved: 'Non couvertes',
  escalated: 'Aggravées',
  opportunity: 'Opportunités',
};

function cultureTensionPriority(marker) {
  return { escalated: 4, unresolved: 3, opportunity: 2, eased: 1 }[marker.state] ?? 0;
}

function cultureTensionTrendPriority(marker) {
  return getCultureTensionTrendVisual(marker).priority;
}

function cultureTensionCausePriority(marker) {
  return (marker.cause ?? buildCultureTensionCause(marker)).priority;
}

function renderCultureTensionFilters(cultureView) {
  const markers = cultureView.allTensionMarkers ?? [];

  if (!markers.length) {
    return '';
  }

  return `
    <div class="culture-tension-filters" aria-label="Filtres des marqueurs culturels post-commit">
      ${Object.entries(CULTURE_TENSION_FILTER_LABELS).map(([stateKey, label]) => {
        const active = cultureView.tensionFilters?.[stateKey] !== false;
        const count = markers.filter((marker) => marker.state === stateKey).length;
        return `
          <button type="button" class="culture-tension-filter ${active ? 'is-active' : ''}" data-culture-tension-filter="${stateKey}" aria-pressed="${active}" aria-label="Filtrer les marqueurs culturels ${label}: ${count}">
            <span>${label}</span><b>${count}</b>
          </button>
        `;
      }).join('')}
    </div>
  `;
}

function renderCultureTensionQuickJump(markers) {
  const entries = [...markers]
    .sort((left, right) => cultureTensionPriority(right) - cultureTensionPriority(left)
      || cultureTensionTrendPriority(right) - cultureTensionTrendPriority(left)
      || cultureTensionCausePriority(right) - cultureTensionCausePriority(left)
      || left.provinceLabel.localeCompare(right.provinceLabel))
    .slice(0, 4);

  if (!entries.length) {
    return '';
  }

  return `
    <div class="culture-tension-quick-jump" aria-label="Accès rapide aux tensions culturelles prioritaires">
      <div class="culture-tension-quick-jump__header">
        <span>À vérifier</span>
        <strong>${entries.length} repère${entries.length > 1 ? 's' : ''} · urgence puis tendance</strong>
      </div>
      ${entries.map((marker) => {
        const visual = getCultureTensionMarkerVisual(marker);
        const trend = getCultureTensionTrendVisual(marker);
        const cause = marker.cause ?? buildCultureTensionCause(marker);
        return `
          <button type="button" class="culture-tension-jump culture-tension-jump--${marker.state} culture-tension-jump--trend-${marker.trend ?? 'unknown'}" data-culture-tension-jump="${marker.provinceId}" aria-label="Aller à ${marker.provinceLabel}: ${marker.label}, tendance ${trend.shortLabel}, cause ${cause.label}">
            <b>${visual.icon}</b>
            <span>${marker.provinceLabel}<i>${trend.code}</i></span>
            <small>${marker.label} · ${trend.shortLabel} · ${cause.label}</small>
          </button>
        `;
      }).join('')}
    </div>
  `;
}

function renderCultureTensionMarker(marker, active) {
  const center = getProvinceCenter(marker.provinceId);

  if (!center || !active) {
    return '';
  }

  const visual = getCultureTensionMarkerVisual(marker);
  const trend = getCultureTensionTrendVisual(marker);
  const cause = marker.cause ?? buildCultureTensionCause(marker);
  const selected = marker.provinceId === state.selectedProvinceId;
  const y = center.y - 9.2;

  return `
    <g class="culture-tension-marker culture-tension-marker--${marker.state} culture-tension-marker--trend-${marker.trend ?? 'unknown'} ${selected ? 'is-selected' : ''}" data-culture-tension-region="${marker.provinceId}">
      <title>${visual.label} · ${trend.label} · ${cause.label} · ${marker.cultureName} · ${cause.detail}</title>
      <circle class="culture-tension-marker__pulse" cx="${center.x}%" cy="${y}%" r="3.5"></circle>
      <rect x="${center.x - 3.2}%" y="${y - 2.35}%" width="6.4%" height="4.7%" rx="1.5%"></rect>
      <text x="${center.x}%" y="${y + 0.62}%" text-anchor="middle">${visual.code}</text>
      <text class="culture-tension-marker__trend" x="${center.x + 3.7}%" y="${y - 2.65}%" text-anchor="middle">${trend.code}</text>
      <text class="culture-tension-marker__cause" x="${center.x}%" y="${y + 4.8}%" text-anchor="middle">${cause.label}</text>
    </g>
  `;
}

function renderCultureTensionMarkerPanel(markers) {
  if (!markers.length) {
    return '';
  }

  return `
    <article class="culture-tension-marker-panel" aria-label="Tensions culturelles après résolution">
      <div class="culture-tension-marker-panel__header">
        <span>Après commit</span>
        <strong>${markers.length} tension${markers.length > 1 ? 's' : ''} visible${markers.length > 1 ? 's' : ''}</strong>
      </div>
      ${markers.map((marker) => {
        const visual = getCultureTensionMarkerVisual(marker);
        const trend = getCultureTensionTrendVisual(marker);
        const cause = marker.cause ?? buildCultureTensionCause(marker);
        return `
          <section class="culture-tension-marker-card culture-tension-marker-card--${marker.state} culture-tension-marker-card--trend-${marker.trend ?? 'unknown'}">
            <b>${visual.icon} ${marker.label}<i>${trend.code} ${trend.shortLabel}</i></b>
            <p><mark>${cause.label}</mark>${marker.summary}</p>
            <small>${marker.cultureName} · ${marker.provinceLabel} · ${marker.source} · ${trend.label} · ${cause.detail}</small>
          </section>
        `;
      }).join('')}
    </article>
  `;
}

function renderCultureMapOverlay(cultureView) {
  const active = state.activeOverlaySlot === 'culture-overlay';
  const markerEntries = active
    ? cultureView.overlay
    : cultureView.overlay.filter((entry) => entry.dominantInRegion || entry.regionId === state.selectedProvinceId);
  const clusterSummaries = buildCultureClusterSummaries(markerEntries);
  const clusteredRegionIds = new Set(clusterSummaries.flatMap((cluster) => cluster.regionIds));
  const markerNodes = markerEntries.map((entry) => renderCultureMarker(entry, active, clusteredRegionIds)).join('');
  const tensionMarkerNodes = (cultureView.tensionMarkers ?? []).map((marker) => renderCultureTensionMarker(marker, active)).join('');
  const clusterNodes = clusterSummaries.map((cluster) => renderCultureClusterSummary(cluster, active)).join('');

  const discoveryLinks = active ? cultureView.overlay.flatMap((entry) => {
    const center = getProvinceCenter(entry.regionId);

    if (!center) {
      return [];
    }

    const selected = entry.regionId === state.selectedProvinceId;
    const clustered = clusteredRegionIds.has(entry.regionId);

    if (clustered && !selected) {
      return [];
    }

    const visibleLinks = entry.regionalDiscoveryLinks.slice(0, selected ? 2 : 1);

    return visibleLinks.map((link, index) => {
      const offset = (index - ((visibleLinks.length - 1) / 2)) * 4.2;
      const tone = getCultureTone(entry);
      const x = center.x + offset;
      const y = center.y - 6.3;

      return `
        <g class="culture-discovery-ping culture-discovery-ping--${tone} ${selected ? 'is-selected' : ''}">
          <title>${link.discoveryId} · ${entry.cultureName}</title>
          <line class="culture-discovery-ping__leader" x1="${center.x}%" y1="${center.y}%" x2="${x}%" y2="${y}%"></line>
          <path class="culture-discovery-ping__glyph" d="M ${x} ${y - 1.05} L ${x + 1.05} ${y} L ${x} ${y + 1.05} L ${x - 1.05} ${y} Z M ${x - 0.42} ${y} H ${x + 0.42}"></path>
          <text x="${x}%" y="${y - 1.55}%" text-anchor="middle">D${index + 1}</text>
        </g>
      `;
    });
  }).join('') : '';

  return `
    <svg class="culture-overlay-map ${active ? 'is-active' : 'is-muted'}" viewBox="0 0 100 100" aria-label="Overlay culture et découvertes">
      <defs>
        <filter id="cultureHudGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.1" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      ${markerNodes}
      ${tensionMarkerNodes}
      ${clusterNodes}
      ${discoveryLinks}
    </svg>
  `;
}


function buildAtlasMediationSignalWarnings(cultureView, selectedProvinceId = state.selectedProvinceId) {
  const features = buildAtlasCultureFeatures({
    ...cultureView,
    selectedRegionId: selectedProvinceId,
  });
  const selectedEntries = cultureView.overlay.filter((entry) => entry.regionId === selectedProvinceId);
  const selectedCultures = new Set(selectedEntries.map((entry) => entry.cultureName));
  const selectedCohesion = Math.max(0, ...selectedEntries.map((entry) => entry.influenceScore ?? 0));
  const selectedFocusWarning = features.borderZones
    .filter((zone) => zone.regionId === selectedProvinceId)
    .flatMap((zone) => {
      const warnings = [];
      if (zone.commitment.status === 'stable' && selectedCohesion < 50) {
        warnings.push({
          warningId: `${zone.borderId}:low-cohesion`,
          state: 'conflict',
          cultureName: zone.cultureName,
          title: 'engagement trop optimiste',
          detail: `cohésion locale ${selectedCohesion || 'faible'} · ${zone.commitment.outcomeStatus}`,
          followUp: zone.commitment.nextAction,
        });
      }
      if (!selectedCultures.has(zone.cultureName)) {
        warnings.push({
          warningId: `${zone.borderId}:missing-culture`,
          state: 'conflict',
          cultureName: zone.cultureName,
          title: 'culture absente de la région',
          detail: `${zone.mediation.option} cible ${zone.cultureName}`,
          followUp: 'choisir frontière liée',
        });
      }
      return warnings;
    });
  const crossRegionWarnings = features.borderZones
    .filter((zone) => zone.regionId !== selectedProvinceId && !selectedCultures.has(zone.cultureName))
    .slice(0, Math.max(0, 2 - selectedFocusWarning.length))
    .map((zone) => ({
      warningId: `${zone.borderId}:off-region`,
      state: 'conflict',
      cultureName: zone.cultureName,
      title: 'médiation hors culture locale',
      detail: `${zone.regionId} · ${zone.commitment.outcomeStatus}`,
      followUp: zone.commitment.nextAction,
    }));
  const warnings = [...selectedFocusWarning, ...crossRegionWarnings].slice(0, 2);

  if (warnings.length === 0) {
    return [{
      warningId: `atlas-mediation:${selectedProvinceId}:coherent`,
      state: 'coherent',
      cultureName: selectedEntries[0]?.cultureName ?? 'culture locale',
      title: 'engagement cohérent',
      detail: selectedEntries.length > 0 ? 'signaux régionaux alignés' : 'aucun engagement actif',
      followUp: selectedEntries.length > 0 ? 'maintenir suivi' : 'attendre médiation',
    }];
  }

  return warnings;
}

function renderCultureMediationSignalWarnings(warnings) {
  return `
    <div class="culture-mediation-warnings" aria-label="Avertissements des engagements de médiation culturelle">
      <div class="culture-mediation-warnings__header">
        <strong>Engagements de médiation</strong>
        <span>${warnings.length} signal${warnings.length > 1 ? 'aux' : ''}</span>
      </div>
      ${warnings.map((warning) => `
        <article class="culture-mediation-warning culture-mediation-warning--${warning.state}">
          <b>${warning.title}</b>
          <span>${warning.cultureName} · ${warning.detail}</span>
          <small>suivi: ${warning.followUp}</small>
        </article>
      `).join('')}
    </div>
  `;
}

function renderCultureSidePanel(cultureView) {
  if (state.activeOverlaySlot !== 'culture-overlay') {
    return null;
  }

  const focus = cultureView.selectedMarker ?? cultureView.panel.focus;
  const focusSeed = focus ? cultureView.seeds.find((seed) => seed.cultureId === focus.cultureId) : null;
  const selectedCluster = buildCultureClusterSummaries(cultureView.overlay)
    .find((cluster) => cluster.regionIds.includes(state.selectedProvinceId)) ?? null;
  const discoveryUrgencyGroups = buildCultureDiscoveryUrgencyGroups({
    selectedMarker: focus,
    selectedCluster,
  });
  const interventionPriorities = buildCultureInterventionPriorities(discoveryUrgencyGroups);
  const blockerHistory = buildCultureBlockerResolutionHistory({
    previousHistory: state.cultureBlockerHistory,
    provinceId: state.selectedProvinceId,
    provinceLabel: state.selectedProvinceId,
    turn: state.turn,
  });
  const recommendationView = buildCultureMapRecommendations({
    selectedRegionId: state.selectedProvinceId,
    selectedMarker: focus,
    selectedCluster,
  });
  const localTimelineView = buildCultureLocalTimeline({
    selectedRegionId: state.selectedProvinceId,
    selectedMarker: focus,
    selectedCluster,
  });
  const mediationWarnings = buildAtlasMediationSignalWarnings(cultureView, state.selectedProvinceId);

  return `
    <section class="panel overlay-panel overlay-panel--culture">
      <div class="panel-header">
        <p class="eyebrow">Culture HUD</p>
        <h3>Overlay actif, Culture</h3>
        <p>Découvertes, influences et repères historiques en lecture tactique sombre.</p>
      </div>
      <div class="culture-hud-stats">
        <div class="overlay-anchor"><span>Marqueurs</span><strong>${cultureView.metrics.markerCount}</strong></div>
        <div class="overlay-anchor"><span>Cultures</span><strong>${cultureView.metrics.cultureCount}</strong></div>
        <div class="overlay-anchor"><span>Découvertes</span><strong>${cultureView.metrics.discoveryCount}</strong></div>
        <div class="overlay-anchor"><span>Repères</span><strong>${cultureView.metrics.eventCount}</strong></div>
      </div>
      ${renderCultureLegendKey(cultureView)}
      ${renderCultureTensionFilters(cultureView)}
      ${renderCultureTensionQuickJump(cultureView.tensionMarkers ?? [])}
      ${renderCultureTensionMarkerPanel(cultureView.selectedTensionMarkers ?? [])}
      ${renderCultureRecommendationPanel(recommendationView)}
      ${renderCultureLocalTimeline(localTimelineView)}
      ${renderCultureDiscoveryUrgencyGroups(discoveryUrgencyGroups)}
      ${renderCultureInterventionPriorities(interventionPriorities)}
      ${renderCultureBlockerResolutionHistory(blockerHistory)}
      ${renderCultureMediationSignalWarnings(mediationWarnings)}
      ${renderCultureClusterPinList(selectedCluster)}
      ${focus ? `
        <article class="culture-focus-card culture-focus-card--${getCultureTone(focus)}">
          <div class="culture-focus-card__header">
            <span>${focus.markerType}</span>
            <strong>${focus.cultureName}</strong>
          </div>
          <p>${focus.summary}</p>
          <div class="culture-focus-card__microgrid">
            <span><b>${focus.influenceTier}</b> influence</span>
            <span><b>${focus.discoveries.length}</b> découvertes</span>
            <span><b>${focus.eventCount}</b> repères</span>
          </div>
          <div class="culture-focus-card__meter" style="--culture-score:${focus.influenceScore}%"><i></i></div>
          <ul class="culture-hud-tags">
            ${focus.highlights.slice(0, 5).map((tag) => `<li>${tag}</li>`).join('')}
          </ul>
        </article>
      ` : ''}
      <div class="culture-marker-list">
        ${cultureView.overlay.slice(0, 5).map((entry) => `
          <article class="culture-marker-row culture-marker-row--${getCultureTone(entry)} ${entry.regionId === state.selectedProvinceId ? 'is-selected' : ''}">
            <span>${entry.style.markerIcon}</span>
            <div><strong>${entry.cultureName}</strong><small>${entry.regionId} · ${entry.influenceTier}</small></div>
            <b>${entry.influenceScore}</b>
          </article>
        `).join('')}
      </div>
      ${focusSeed ? `
        <div class="culture-event-stack">
          <div class="culture-event-stack__header">
            <strong>Repères historiques</strong>
            <span>${focus.eventPopups.length} entrées liées</span>
          </div>
          ${focus.eventPopups.slice(0, 3).map((event) => renderCultureEventCard(event, focus.cultureName)).join('')}
        </div>
      ` : ''}
    </section>
  `;
}

function renderCultureBottomTray(cultureView) {
  if (state.activeOverlaySlot !== 'culture-overlay') {
    return null;
  }

  return `
    <section id="bottom-tray" class="overlay-anchor-shell overlay-anchor-shell--bottom overlay-anchor-shell--culture">
      <div class="culture-bottom-grid">
        <div class="culture-timeline-strip">
          <h4>Timeline culturelle</h4>
          <p>Repères liés aux découvertes et aux zones d’influence visibles.</p>
          <div class="culture-timeline-items">
            ${cultureView.overlay.flatMap((entry) => entry.eventPopups.map((event) => ({ ...event, cultureName: entry.cultureName }))).slice(0, 5).map((event, index) => `
              <article class="culture-timeline-node culture-timeline-node--${getCultureEventTone(event)}" style="--timeline-index:${index}">
                <span>${formatCultureDate(event.triggeredAt)}</span>
                <strong>${event.title}</strong>
                <small>${event.cultureName} · IMP-${event.importance}</small>
              </article>
            `).join('')}
          </div>
        </div>
        <div class="culture-discovery-stack">
          ${cultureView.seeds.map((seed) => `
            <article class="stock-mini-card culture-seed-card">
              <div class="culture-seed-card__header">
                <h4>${seed.cultureName}</h4>
                <span>${seed.regionIds.length} zones</span>
              </div>
              <p>${seed.regionIds.join(' · ')}</p>
              <ul>
                ${seed.discoveryIds.slice(0, 3).map((discoveryId) => `<li><span>${discoveryId}</span><strong>catalogué</strong></li>`).join('')}
              </ul>
            </article>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderEconomyMapOverlay(economyView) {
  if (state.activeOverlaySlot !== 'economy-overlay') {
    return '';
  }

  const filters = state.economyFilters;
  const tensionByCityId = Object.fromEntries(economyView.comparison.rows.map((row) => [row.cityId, row]));
  const cityNameById = Object.fromEntries(economyView.overlay.cities.map((city) => [city.cityId, city.cityName]));
  const heatNodes = economyView.overlay.cities.map((city) => {
    const position = city.marker.position;
    const tension = tensionByCityId[city.cityId];

    if (!position || !tension) {
      return '';
    }

    const tensionRadius = tension.tensionLevel === 'high' ? 18 : tension.tensionLevel === 'medium' ? 13 : 9;
    const prosperityRadius = city.prosperity >= 70 ? 14 : city.prosperity >= 55 ? 10 : 7;

    return `
      <g class="economy-heat-node is-${tension.tensionLevel}-tension ${city.prosperity >= 70 ? 'is-rich' : city.prosperity >= 55 ? 'is-balanced' : 'is-fragile'}">
        <circle class="economy-heat-node__tension" cx="${position.x}%" cy="${position.y}%" r="${tensionRadius}" />
        <circle class="economy-heat-node__prosperity" cx="${position.x}%" cy="${position.y}%" r="${prosperityRadius}" />
      </g>
    `;
  }).join('');

  const economyBlockerFocus = state.economyReadinessFocus;
  const routeLines = economyView.overlay.routes.map((route, index) => {
    const origin = cityLayoutsById[route.originCityId];
    const destination = cityLayoutsById[route.destinationCityId];

    if (!origin || !destination) {
      return '';
    }

    const visual = buildRouteVisual(route, origin, destination, index);
    const originTension = tensionByCityId[route.originCityId]?.tensionLevel ?? 'low';
    const destinationTension = tensionByCityId[route.destinationCityId]?.tensionLevel ?? 'low';
    const tensionClass = originTension === 'high' || destinationTension === 'high'
      ? 'has-high-tension'
      : originTension === 'medium' || destinationTension === 'medium'
        ? 'has-medium-tension'
        : 'has-low-tension';
    const emphasizeRoute = visual.critical || tensionClass === 'has-high-tension';
    const routeFiltered = filters.criticalRoutes && !emphasizeRoute;
    const showRouteLabel = !routeFiltered && (emphasizeRoute || tensionClass === 'has-medium-tension');
    const routeFocused = state.hoveredRouteId === route.routeId || state.selectedRouteId === route.routeId;
    const routeBlocker = economyBlockerFocus?.routeId === route.routeId ? economyBlockerFocus : null;
    const stress = getRouteStressSummary(route, tensionByCityId, cityNameById);
    const logisticsOutcomeMarker = getVisibleLogisticsOutcomeMarkers().find((marker) => marker.routeId === route.routeId) ?? null;
    const logisticsRouteHighlighted = state.selectedLogisticsOutcomeRouteId === route.routeId;
    const logisticsRouteDimmed = Boolean(state.selectedLogisticsOutcomeRouteId) && !logisticsRouteHighlighted;

    return `
      <g class="economy-route-group ${visual.classes} ${tensionClass} ${emphasizeRoute ? 'is-emphasized' : 'is-muted'} ${routeFiltered ? 'is-filtered' : ''} ${routeFocused ? 'is-focused' : ''} ${logisticsRouteHighlighted ? 'is-logistics-outcome-highlighted' : ''} ${logisticsRouteDimmed ? 'is-logistics-outcome-dimmed' : ''} ${routeBlocker ? `has-economy-blocker has-economy-blocker--${routeBlocker.tone}` : ''}" data-route-id="${route.routeId}" aria-label="${routeFiltered ? 'Route secondaire atténuée par filtre' : 'Route économie visible'}: ${logisticsRouteHighlighted ? 'route logistique sélectionnée depuis le résumé; ' : ''}${routeBlocker ? `${routeBlocker.summary}. ${routeBlocker.effect}` : stress.summary}">
        <title>${route.routeName}: ${routeBlocker ? `${routeBlocker.summary} — ${routeBlocker.effect}` : `${stress.headline} — ${stress.summary}`}</title>
        <path class="economy-route-hitbox" d="${visual.pathD}" pathLength="100" />
        <path class="economy-route__halo" d="${visual.pathD}" pathLength="100" />
        <path class="economy-route__casing" d="${visual.pathD}" pathLength="100" />
        <path class="economy-route__line" d="${visual.pathD}" pathLength="100" marker-end="url(#${visual.markerId})" />
        <path class="economy-route__flow" d="${visual.pathD}" pathLength="100" />
        ${renderRouteHudMarkers(route, visual, { compact: !emphasizeRoute || routeFiltered })}
        ${routeBlocker ? renderEconomyBlockerRouteBadge(routeBlocker, visual) : routeFocused ? renderRouteStressBadge(route, stress, visual) : ''}
        ${renderLogisticsOutcomeRouteBadge(logisticsOutcomeMarker, visual)}
        ${showRouteLabel ? `<text class="economy-route__label" text-anchor="middle">
          <textPath href="#route-label-${route.routeId}" startOffset="50%">${route.routeName}</textPath>
        </text>` : ''}
        <path id="route-label-${route.routeId}" d="${visual.pathD}" fill="none" stroke="none" />
      </g>
    `;
  }).join('');

  const cityNodes = economyView.overlay.cities.map((city) => {
    const position = city.marker.position;

    if (!position) {
      return '';
    }

    const tension = tensionByCityId[city.cityId]?.tensionLevel ?? 'low';
    const isHub = city.tradeRouteIds.length >= 2 || city.resources.totalStock >= 16;
    const isSelected = state.selectedCityId === city.cityId || state.hoveredCityId === city.cityId;
    const cityBlocker = economyBlockerFocus?.cityId === city.cityId ? economyBlockerFocus : null;
    const expandResources = isSelected || tension === 'high' || Boolean(cityBlocker);
    const keepResourceWarning = tension === 'high';
    const showResources = keepResourceWarning || (filters.resourceMarkers && (expandResources || city.capital || isHub));
    const showCityLabels = filters.cityLabels && (isSelected || city.capital || isHub || tension !== 'low');

    return `
      <g class="economy-city-group ${isSelected ? 'is-selected' : ''} ${city.capital ? 'is-capital' : ''} ${isHub ? 'is-hub' : ''} is-${tension}-tension ${cityBlocker ? `has-economy-blocker has-economy-blocker--${cityBlocker.tone}` : ''} ${!filters.resourceMarkers && showResources ? 'has-forced-resource-warning' : ''}" data-city-id="${city.cityId}">
        <circle class="economy-city-tension-ring" cx="${position.x}%" cy="${position.y}%" r="${city.marker.size * 9.2}" />
        ${city.capital ? `<circle class="economy-city-capital-ring" cx="${position.x}%" cy="${position.y}%" r="${city.marker.size * 10.8}" />` : ''}
        ${isHub ? `<rect class="economy-city-hub-frame" x="calc(${position.x}% - ${city.marker.size * 7.4}px)" y="calc(${position.y}% - ${city.marker.size * 7.4}px)" width="${city.marker.size * 14.8}" height="${city.marker.size * 14.8}" rx="${city.marker.size * 3.2}" ry="${city.marker.size * 3.2}" />` : ''}
        <circle class="economy-city economy-city--${city.marker.tone}" cx="${position.x}%" cy="${position.y}%" r="${city.marker.size * 6.6}" />
        ${city.capital ? `<text class="economy-city-glyph" x="${position.x}%" y="calc(${position.y}% + 1px)" text-anchor="middle">★</text>` : isHub ? `<text class="economy-city-glyph" x="${position.x}%" y="calc(${position.y}% + 1px)" text-anchor="middle">◆</text>` : ''}
        ${showResources ? renderResourceHudBadges(city, position, { expanded: expandResources && filters.resourceMarkers }) : ''}
        ${cityBlocker ? renderEconomyBlockerCityBadge(cityBlocker, position) : ''}
        <circle class="economy-city-hitbox" cx="${position.x}%" cy="${position.y}%" r="${city.marker.size * 12}" />
        <text class="economy-city-label ${showCityLabels ? '' : 'economy-city-label--sr'}" x="${position.x}%" y="calc(${position.y}% - 14px)" text-anchor="middle">${city.cityName}</text>
        <text class="economy-city-resource ${showCityLabels ? '' : 'economy-city-resource--sr'}" x="${position.x}%" y="calc(${position.y}% + 18px)" text-anchor="middle">${city.resources.primaryResourceId ?? 'stock vide'}</text>
      </g>
    `;
  }).join('');

  return `
    <svg class="economy-map-layer" viewBox="0 0 100 100" aria-label="Overlay économie et logistique">
      <defs>
        <marker id="route-arrow-land" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#f8fafc" opacity="0.9" />
        </marker>
        <marker id="route-arrow-river" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#bae6fd" opacity="0.95" />
        </marker>
        <marker id="route-arrow-sea" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#c7d2fe" opacity="0.95" />
        </marker>
      </defs>
      <g class="economy-heat-layer">
        ${heatNodes}
      </g>
      ${routeLines}
      ${cityNodes}
    </svg>
  `;
}

function renderIntrigueMapOverlay(intrigueView) {
  const postCommitMarkers = buildPostCommitIntrigueExposureMarkers(intrigueView);
  const worldMapSignals = buildWorldMapIntrigueSignals(intrigueView);

  if (state.activeOverlaySlot !== 'intrigue-overlay') {
    const criticalSignals = intrigueView.map.entries.filter((entry) => entry.sabotageRiskLevel === 'high' || entry.metrics.exposedCellCount > 0);

    if (criticalSignals.length === 0 && postCommitMarkers.length === 0 && worldMapSignals.every((signal) => signal.tone === 'watch')) {
      return '';
    }

    return `
      <svg class="intrigue-map-layer intrigue-map-layer--critical-only" viewBox="0 0 100 100" aria-label="Signaux intrigue critiques">
        ${criticalSignals.map((entry) => `
          <g class="intrigue-critical-signal intrigue-critical-signal--${entry.sabotageRiskLevel}" data-intrigue-location="${entry.locationId}">
            <circle class="intrigue-critical-signal__pulse" cx="${entry.center.x}%" cy="${entry.center.y}%" r="${Math.max(3.8, entry.coreRadius)}"></circle>
            <text class="intrigue-critical-signal__code" x="${entry.center.x + 3.8}%" y="${entry.center.y - 2.6}%">${entry.threatGlyph.code}</text>
          </g>
        `).join('')}
        ${renderWorldMapIntrigueSignals(worldMapSignals.filter((signal) => signal.tone !== 'watch'))}
        ${renderPostCommitIntrigueExposureMarkers(postCommitMarkers)}
      </svg>
    `;
  }

  const heatmapMarkup = intrigueView.map.entries.map((entry) => `
    <g class="intrigue-heat-node intrigue-heat-node--${entry.sabotageRiskLevel} ${entry.isSelected ? 'is-selected' : ''}">
      <circle class="intrigue-heat-node__outer" cx="${entry.center.x}%" cy="${entry.center.y}%" r="${entry.heatRadius}" style="opacity:${Math.min(0.62, entry.heatIntensity)}"></circle>
      <circle class="intrigue-heat-node__inner" cx="${entry.center.x}%" cy="${entry.center.y}%" r="${Math.max(3.8, entry.heatRadius * 0.52)}" style="opacity:${Math.min(0.76, entry.heatIntensity + 0.08)}"></circle>
    </g>
  `).join('');

  const linkMarkup = intrigueView.map.links.map((link) => `
    <g class="intrigue-link-node intrigue-link-node--${link.riskLevel}">
      <path
        class="intrigue-link intrigue-link--${link.riskLevel}"
        d="${link.pathD}"
        stroke-width="${link.strokeWidth}"
      />
      <circle class="intrigue-link-node__relay" cx="${link.control.x}%" cy="${link.control.y}%" r="${link.relayRadius}"></circle>
    </g>
  `).join('');

  const threatGlyphMarkup = intrigueView.map.entries.map((entry) => `
    <g class="intrigue-threat-glyph intrigue-threat-glyph--${entry.sabotageRiskLevel} ${entry.isSelected ? 'is-selected' : ''}" data-intrigue-location="${entry.locationId}" aria-label="${entry.threatGlyph.label}">
      <circle class="intrigue-threat-glyph__backplate" cx="${entry.glyphCenter.x}%" cy="${entry.glyphCenter.y}%" r="${entry.glyphRadius}"></circle>
      <circle class="intrigue-threat-glyph__ring" cx="${entry.glyphCenter.x}%" cy="${entry.glyphCenter.y}%" r="${entry.glyphRadius - 1.15}"></circle>
      ${renderSabotageGlyphTicks(entry, entry.glyphRadius, entry.threatGlyph.tickCount)}
      <path class="intrigue-threat-glyph__sigil" d="${entry.threatGlyph.glyph}" transform="translate(${entry.glyphCenter.x} ${entry.glyphCenter.y}) scale(${Math.max(2.1, entry.glyphRadius * 0.36)})"></path>
      <text class="intrigue-threat-glyph__code" x="${entry.glyphCenter.x + entry.glyphRadius + 1.4}%" y="${entry.glyphCenter.y - 0.7}%" text-anchor="start">${entry.threatGlyph.code}</text>
    </g>
  `).join('');

  const hotspotMarkup = intrigueView.map.entries.map((entry) => `
    <g class="intrigue-hotspot intrigue-hotspot--${entry.presenceLevel} ${entry.isSelected ? 'is-selected' : ''} ${entry.isFocused ? 'is-focused' : ''}" data-intrigue-location="${entry.locationId}">
      <circle class="intrigue-hotspot__halo intrigue-hotspot__halo--${entry.sabotageRiskLevel}" cx="${entry.center.x}%" cy="${entry.center.y}%" r="${entry.haloRadius}"></circle>
      <circle class="intrigue-hotspot__core" cx="${entry.center.x}%" cy="${entry.center.y}%" r="${entry.coreRadius}"></circle>
      <text class="intrigue-hotspot__marker" x="${entry.center.x}%" y="${entry.center.y + 1.5}%" text-anchor="middle">${entry.style.presence.marker}</text>
      ${entry.showSecondaryDetails ? `<text class="intrigue-hotspot__label" x="${entry.labelAnchor.x}%" y="${entry.labelAnchor.y}%" text-anchor="middle">${entry.locationName}</text>` : ''}
      ${entry.showSecondaryDetails ? `<text class="intrigue-hotspot__meta" x="${entry.metaAnchor.x}%" y="${entry.metaAnchor.y}%" text-anchor="middle">réseau ${entry.presenceLevel} · ${entry.threatGlyph.code} ${entry.sabotageRiskScore}</text>` : ''}
    </g>
  `).join('');

  return `
    <svg class="intrigue-map-layer" viewBox="0 0 100 100" aria-label="Overlay intrigue et heatmap de sabotage">
      <g class="intrigue-heat-layer">
        ${heatmapMarkup}
      </g>
      <g class="intrigue-network-layer">
        ${linkMarkup}
      </g>
      <g class="intrigue-threat-layer">
        ${threatGlyphMarkup}
      </g>
      ${hotspotMarkup}
      ${renderWorldMapIntrigueSignals(worldMapSignals)}
      ${renderPostCommitIntrigueExposureMarkers(postCommitMarkers)}
    </svg>
  `;
}

function renderIntrigueSidePanel(intrigueView) {
  if (state.activeOverlaySlot !== 'intrigue-overlay') {
    return null;
  }

  const exposureMarkers = buildPostCommitIntrigueExposureMarkers(intrigueView, { ignoreFilters: true });
  const exposureMarkerRollup = buildIntrigueExposureMarkerRollup(exposureMarkers);
  const worldMapSignals = buildWorldMapIntrigueSignals(intrigueView, { ignoreFilters: true });
  const worldMapSignalRollup = buildWorldMapIntrigueSignalRollup(worldMapSignals);
  const counterintelligencePlan = buildAtlasCounterintelligenceSweepPlan(worldMapSignals);

  return `
    <section class="panel overlay-panel overlay-panel--intrigue">
      <div class="panel-header">
        <h3>Overlay actif, Intrigue</h3>
        <p>${intrigueView.summary}</p>
      </div>
      <div class="economy-quick-stats intrigue-quick-stats">
        <div class="overlay-anchor"><span>Foyers</span><strong>${intrigueView.metrics.locationCount}</strong></div>
        <div class="overlay-anchor"><span>Cellules exposées</span><strong>${intrigueView.metrics.exposedCellCount}</strong></div>
        <div class="overlay-anchor"><span>Sabotages actifs</span><strong>${intrigueView.metrics.activeSabotageCount}</strong></div>
        <div class="overlay-anchor"><span>Alerte</span><strong>${intrigueView.alertBadge.level.label}</strong></div>
      </div>
      <section class="intrigue-filter-bar" aria-label="Filtres intrigue">
        <button type="button" class="intrigue-filter-chip ${intrigueView.filters.presence ? 'is-active' : ''}" data-intrigue-filter="presence">Presence</button>
        <button type="button" class="intrigue-filter-chip ${intrigueView.filters.alerts ? 'is-active' : ''}" data-intrigue-filter="alerts">Alertes</button>
        <button type="button" class="intrigue-filter-chip ${intrigueView.filters.sabotage ? 'is-active' : ''}" data-intrigue-filter="sabotage">Sabotage</button>
      </section>
      ${renderWorldMapIntrigueSignalRollup(worldMapSignalRollup)}
      ${renderAtlasCounterintelligenceSweepPlan(counterintelligencePlan)}
      ${renderIntrigueExposureMarkerRollup(exposureMarkerRollup)}
      <section class="intrigue-alert-panel intrigue-alert-panel--${intrigueView.alertPanel.tone}" aria-label="Lecture du niveau d'alerte">
        <div class="intrigue-alert-panel__header">
          <div>
            <span class="intrigue-alert-panel__eyebrow">Niveau d'alerte Delta</span>
            <strong>${intrigueView.alertPanel.icon} ${intrigueView.alertPanel.title}</strong>
          </div>
          <span class="intrigue-alert-panel__summary">${intrigueView.alertPanel.summary}</span>
        </div>
        <div class="intrigue-risk-meter" aria-label="Hiérarchie de risque">
          <span class="intrigue-risk-meter__segment is-watch"></span>
          <span class="intrigue-risk-meter__segment is-warning"></span>
          <span class="intrigue-risk-meter__segment is-danger"></span>
          <small>${intrigueView.metrics.exposedCellCount} cellules exposées · ${intrigueView.metrics.activeSabotageCount} sabotages</small>
        </div>
        <p>${intrigueView.alertPanel.guidance}</p>
        <ul class="intrigue-alert-panel__drivers">
          ${intrigueView.alertPanel.drivers.map((driver) => `<li>${driver}</li>`).join('')}
        </ul>
        <div class="intrigue-alert-panel__zones">
          ${intrigueView.alertPanel.watchZones.map((zone) => `
            <article class="intrigue-alert-zone intrigue-alert-zone--${zone.severity}">
              <i aria-hidden="true"></i>
              <div>
                <strong>${zone.locationName}</strong>
                <span>${zone.reason}</span>
              </div>
            </article>
          `).join('')}
        </div>
      </section>
      ${intrigueView.selectedProvince ? `
        <section class="intrigue-province-focus intrigue-province-focus--${intrigueView.selectedProvince.sabotageRiskLevel}">
          <div class="intrigue-province-focus__header">
            <strong>Province suivie, ${intrigueView.selectedProvince.locationName}</strong>
            <span>presence ${intrigueView.selectedProvince.presenceLevel} · risque ${intrigueView.selectedProvince.sabotageRiskLevel}</span>
          </div>
          <p>${intrigueView.selectedProvince.guidance}</p>
          ${intrigueView.selectedProvince.fogHint ? `
            <aside class="intrigue-fog-hint intrigue-fog-hint--${intrigueView.selectedProvince.fogHint.tone}" aria-label="${intrigueView.selectedProvince.fogHint.ariaLabel}">
              <div>
                <span>${intrigueView.selectedProvince.fogHint.visibility}</span>
                <strong>${intrigueView.selectedProvince.fogHint.safeAction}</strong>
              </div>
              <p>${intrigueView.selectedProvince.fogHint.reason}</p>
              <small>${intrigueView.selectedProvince.fogHint.actionHint}</small>
            </aside>
          ` : ''}
          ${intrigueView.selectedProvince.responseChoices?.length ? `
            <section class="intrigue-response-comparison" aria-label="Comparer les réponses intrigue sûres sous brouillard">
              <div class="intrigue-response-comparison__header">
                <span>Choix sous brouillard</span>
                <strong>Agir ou attendre</strong>
              </div>
              <div class="intrigue-response-comparison__list">
                ${intrigueView.selectedProvince.responseChoices.map((choice) => `
                  <article class="intrigue-response-choice intrigue-response-choice--${choice.tone} ${choice.recommended ? 'is-recommended' : ''}" aria-label="${choice.label}: risque d'exposition ${choice.exposureRisk}">
                    <div>
                      <strong>${choice.label}</strong>
                      <span class="intrigue-response-choice__confidence intrigue-response-choice__confidence--${choice.confidence}">${choice.confidenceLabel}</span>
                      ${choice.recommended ? '<b>prudente</b>' : ''}
                    </div>
                    <p>${choice.summary}</p>
                    <small>${choice.confidenceReason} ${choice.improveConfidence}</small>
                    <dl>
                      <div><dt>Exposition</dt><dd>${choice.exposureRisk}</dd></div>
                      <div><dt>Info manquante</dt><dd>${choice.missingInfo}</dd></div>
                      <div><dt>Gain</dt><dd>${choice.gain}</dd></div>
                    </dl>
                  </article>
                `).join('')}
              </div>
            </section>
          ` : ''}
          <div class="intrigue-province-focus__stats">
            <span>${intrigueView.selectedProvince.celluleCount} cellules</span>
            <span>${intrigueView.selectedProvince.activeOperationCount} operations</span>
            <span>${intrigueView.selectedProvince.exposedCellCount} exposees</span>
            <span>score ${intrigueView.selectedProvince.sabotageRiskScore}</span>
          </div>
          <div class="intrigue-status-pill-row">
            ${intrigueView.selectedProvince.reasons.map((reason) => `<span class="intrigue-status-pill intrigue-status-pill--${intrigueView.selectedProvince.sabotageRiskLevel === 'high' ? 'compromised' : intrigueView.selectedProvince.sabotageRiskLevel === 'medium' ? 'exposed' : 'active'}">${reason}</span>`).join('')}
          </div>
          ${intrigueView.selectedProvince.drillDown ? `
            <div class="intrigue-drilldown intrigue-drilldown--${intrigueView.selectedProvince.drillDown.criticality}">
              <div class="intrigue-drilldown__header">
                <span>Signal ${intrigueView.selectedProvince.drillDown.signalType}</span>
                <strong>risque ${intrigueView.selectedProvince.drillDown.riskBand}</strong>
              </div>
              <p>${intrigueView.selectedProvince.drillDown.summary}</p>
              <div class="intrigue-drilldown__context">
                <span>Province: ${intrigueView.selectedProvince.drillDown.locationName}</span>
                <span>Faction: ${intrigueView.selectedProvince.drillDown.affectedFactionIds.join(', ') || 'inconnue'}</span>
                <span>Cible: ${intrigueView.selectedProvince.drillDown.targetFactionIds.join(', ') || 'aucune'}</span>
              </div>
              <ul>
                ${intrigueView.selectedProvince.drillDown.reasons.map((reason) => `<li>${reason}</li>`).join('')}
              </ul>
              <div class="intrigue-action-hints" aria-label="Indices d'action intrigue">
                ${intrigueView.selectedProvince.drillDown.actionHints.map((hint) => `
                  <article class="intrigue-action-hint intrigue-action-hint--${hint.priority}">
                    <strong>${hint.label}</strong>
                    <span>${hint.description}</span>
                  </article>
                `).join('')}
              </div>
              <div class="intrigue-response-aftermath" aria-label="Résumé aftermath intrigue">
                <strong>Après-coup probable</strong>
                <p>${intrigueView.selectedProvince.drillDown.responseAftermath.summary}</p>
              </div>
              <div class="intrigue-quick-responses" aria-label="Réponses rapides intrigue">
                ${intrigueView.selectedProvince.drillDown.quickResponses.map((response) => `
                  <article class="intrigue-quick-response ${response.recommended ? 'is-recommended' : ''}">
                    <div>
                      <strong>${response.label}</strong>
                      ${response.recommended ? '<b>recommandée</b>' : ''}
                    </div>
                    <span>${response.summary}</span>
                    <small>${response.aftermathSummary}</small>
                    <em>${response.effect}</em>
                    <em>${response.countermeasure}</em>
                  </article>
                `).join('')}
              </div>
              <small>${intrigueView.selectedProvince.drillDown.actionHint}</small>
            </div>
          ` : ''}
        </section>
      ` : ''}
      <div class="intrigue-legend-strip" aria-label="Légende heatmap sabotage">
        <span>Heatmap sabotage</span>
        <div class="intrigue-legend-strip__scale">
          <i class="is-low"></i>
          <i class="is-medium"></i>
          <i class="is-high"></i>
        </div>
        <small>faible à critique</small>
      </div>
      <section class="intrigue-incident-log" aria-label="Historique leger des incidents de securite">
        <div class="intrigue-incident-log__header">
          <strong>Journal securite</strong>
          <span>${intrigueView.incidents.length} entrees recentes</span>
        </div>
        ${intrigueView.incidents.map((incident) => `
          <article class="intrigue-incident intrigue-incident--${incident.severity}">
            <div class="intrigue-incident__meta">
              <span>${incident.turnLabel}</span>
              <strong>${incident.locationName}</strong>
            </div>
            <h4>${incident.title}</h4>
            <p>${incident.detail}</p>
          </article>
        `).join('')}
      </section>
      <div class="intrigue-hotspot-list">
        ${intrigueView.hotspots.slice(0, 4).map((hotspot) => {
          const statusPreview = intrigueView.panels.cellules
            .filter((cellule) => cellule.locationId === hotspot.locationId)
            .slice(0, 3)
            .map((cellule) => `<span class="intrigue-status-pill intrigue-status-pill--${cellule.statusClass}">${cellule.statusMarker} ${cellule.statusLabel}</span>`)
            .join('');

          return `
            <article class="intrigue-hotspot-card intrigue-hotspot-card--${hotspot.severity}">
              <strong>${hotspot.locationName}</strong>
              <span>${hotspot.visualCue} · ${hotspot.celluleCount} cellules</span>
              <span>${hotspot.operationCount} opérations, ${hotspot.exposedCellCount} exposées</span>
              <div class="intrigue-status-pill-row">${statusPreview}</div>
            </article>
          `;
        }).join('')}
      </div>
    </section>
  `;
}


function getEconomyPanelTone(row) {
  if (!row) {
    return 'neutral';
  }

  return row.tensionLevel === 'high' ? 'danger' : row.tensionLevel === 'medium' ? 'warning' : 'stable';
}

function renderEconomyKpiStrip(economyView) {
  const routeEfficiency = economyView.overlay.metrics.routeCount === 0
    ? 0
    : Math.round((economyView.overlay.metrics.activeRouteCount / economyView.overlay.metrics.routeCount) * 100);
  const averageStock = economyView.overlay.metrics.cityCount === 0
    ? 0
    : Math.round(economyView.overlay.metrics.totalStock / economyView.overlay.metrics.cityCount);

  return `
    <div class="economy-kpi-strip" aria-label="Indicateurs économie">
      <div class="economy-kpi economy-kpi--cyan"><span>Villes</span><strong>${economyView.overlay.metrics.cityCount}</strong><small>nœuds suivis</small></div>
      <div class="economy-kpi economy-kpi--amber"><span>Réseau actif</span><strong>${routeEfficiency}%</strong><small>${economyView.overlay.metrics.activeRouteCount}/${economyView.overlay.metrics.routeCount} routes</small></div>
      <div class="economy-kpi economy-kpi--red"><span>Tensions fortes</span><strong>${economyView.comparison.metrics.highTensionCount}</strong><small>alertes stock</small></div>
      <div class="economy-kpi economy-kpi--slate"><span>Stock moyen</span><strong>${averageStock}</strong><small>unités/ville</small></div>
    </div>
  `;
}

function renderEconomyFocusPanel(economyView) {
  const selectedCity = economyView.overlay.cities.find((city) => city.cityId === state.selectedCityId) ?? economyView.overlay.cities[0];

  if (!selectedCity) {
    return '';
  }

  const stockPanel = economyView.stockPanels[selectedCity.cityId];
  const comparisonRow = economyView.comparison.rows.find((row) => row.cityId === selectedCity.cityId);
  const delta = economyView.deltaByCityId[selectedCity.cityId] ?? { stockDelta: 0, stabilityDelta: 0, prosperityDelta: 0 };
  const tone = getEconomyPanelTone(comparisonRow);

  return `
    <article class="economy-focus-panel economy-focus-panel--${tone}">
      <div class="economy-focus-panel__header">
        <div>
          <span>Ville sélectionnée</span>
          <strong>${selectedCity.cityName}</strong>
        </div>
        <b>${comparisonRow?.tensionLevel ?? 'low'}</b>
      </div>
      <div class="economy-focus-panel__grid">
        <div><span>Stock</span><strong>${selectedCity.resources.totalStock}</strong><small>${delta.stockDelta > 0 ? '+' : ''}${delta.stockDelta}</small></div>
        <div><span>Stabilité</span><strong>${selectedCity.stability}</strong><small>${delta.stabilityDelta > 0 ? '+' : ''}${delta.stabilityDelta}</small></div>
        <div><span>Prospérité</span><strong>${selectedCity.prosperity}</strong><small>${delta.prosperityDelta > 0 ? '+' : ''}${delta.prosperityDelta}</small></div>
      </div>
      <div class="economy-focus-panel__resources">
        ${(stockPanel?.rows ?? []).slice(0, 4).map((resource) => {
          const hud = getResourceHud(resource.resourceId);
          return `<span class="economy-resource-chip economy-resource-chip--${hud.tone}">${hud.glyph} ${resource.resourceId} · ${resource.currentQuantity}</span>`;
        }).join('')}
      </div>
    </article>
  `;
}

function renderEconomySidePanel(economyView, cultureView) {
  const culturePanel = renderCultureSidePanel(cultureView);

  if (culturePanel) {
    return culturePanel;
  }

  if (state.activeOverlaySlot !== 'economy-overlay') {
    return `
      <section class="panel overlay-panel">
        <div class="panel-header">
          <h3>Overlay actif, ${overlayLabels[state.activeOverlaySlot]}</h3>
          <p>${getOverlayDescription(state.activeOverlaySlot)}</p>
        </div>
        <div class="overlay-anchor-grid">
          <div class="overlay-anchor"><span>HUD haut</span><strong>#top-hud</strong></div>
          <div class="overlay-anchor"><span>Rail gauche</span><strong>#left-rail</strong></div>
          <div class="overlay-anchor"><span>Rail droit</span><strong>#right-rail</strong></div>
          <div class="overlay-anchor"><span>Barre basse</span><strong>#bottom-tray</strong></div>
        </div>
      </section>
    `;
  }

  const filters = state.economyFilters;
  const tensionByCityId = Object.fromEntries(economyView.comparison.rows.map((row) => [row.cityId, row]));
  const cityNameById = Object.fromEntries(economyView.overlay.cities.map((city) => [city.cityId, city.cityName]));
  const selectedRoute = economyView.overlay.routes.find((route) => route.routeId === (state.hoveredRouteId ?? state.selectedRouteId))
    ?? economyView.overlay.routes.find((route) => route.routeId === state.selectedRouteId)
    ?? null;
  const selectedRouteStress = selectedRoute ? getRouteStressSummary(selectedRoute, tensionByCityId, cityNameById) : null;
  const criticalRouteCount = economyView.overlay.routes.filter((route) => {
    const originTension = tensionByCityId[route.originCityId]?.tensionLevel ?? 'low';
    const destinationTension = tensionByCityId[route.destinationCityId]?.tensionLevel ?? 'low';
    return route.riskLevel >= 55 || route.totalCapacity >= 9 || originTension === 'high' || destinationTension === 'high';
  }).length;
  const resourceSignalCopy = filters.resourceMarkers
    ? 'ressources compactes visibles'
    : 'ressources masquées sauf tension forte';
  const routeSignalCopy = filters.criticalRoutes
    ? `${criticalRouteCount} routes critiques gardées nettes`
    : 'routes critiques et support visibles';

  return `
    <section class="panel overlay-panel overlay-panel--economy">
      <div class="panel-header economy-panel-header">
        <p class="eyebrow">Economy HUD</p>
        <h3>Overlay actif, Économie</h3>
        <p>${economyView.overlay.summary} · ${routeSignalCopy} · ${resourceSignalCopy}</p>
      </div>
      <section class="economy-filter-bar" aria-label="Filtres économie">
        <button type="button" class="economy-filter-chip ${filters.criticalRoutes ? 'is-active' : ''}" data-economy-filter="criticalRoutes" aria-pressed="${filters.criticalRoutes}">Routes critiques</button>
        <button type="button" class="economy-filter-chip ${filters.resourceMarkers ? 'is-active' : ''}" data-economy-filter="resourceMarkers" aria-pressed="${filters.resourceMarkers}">Ressources</button>
        <button type="button" class="economy-filter-chip ${filters.cityLabels ? 'is-active' : ''}" data-economy-filter="cityLabels" aria-pressed="${filters.cityLabels}">Labels logistiques</button>
        <small>${filters.criticalRoutes ? 'Routes secondaires atténuées, pas supprimées.' : 'Vue lisible par défaut.'} ${filters.cityLabels ? 'Labels clés affichés.' : 'Labels détaillés au survol/sélection.'}</small>
      </section>
      ${renderEconomyKpiStrip(economyView)}
      ${renderEconomyFocusPanel(economyView)}
      ${selectedRoute && selectedRouteStress ? `
        <article class="economy-route-stress-panel economy-route-stress-panel--${selectedRouteStress.tone}">
          <div class="economy-route-stress-panel__header">
            <span>Route suivie</span>
            <strong>${selectedRoute.routeName}</strong>
            <b>${selectedRouteStress.headline}</b>
          </div>
          <p>${selectedRouteStress.summary}</p>
          <ul>
            ${selectedRouteStress.drivers.map((driver) => `<li>${driver}</li>`).join('')}
          </ul>
        </article>
      ` : ''}
      <div class="economy-route-list">
        ${economyView.overlay.routes.map((route) => {
          const originTension = tensionByCityId[route.originCityId]?.tensionLevel ?? 'low';
          const destinationTension = tensionByCityId[route.destinationCityId]?.tensionLevel ?? 'low';
          const tensionClass = originTension === 'high' || destinationTension === 'high'
            ? 'has-high-tension'
            : originTension === 'medium' || destinationTension === 'medium'
              ? 'has-medium-tension'
              : 'has-low-tension';

          const stress = getRouteStressSummary(route, tensionByCityId, cityNameById);
          const routeFocused = state.hoveredRouteId === route.routeId || state.selectedRouteId === route.routeId;

          return `
            <article class="economy-route-card ${route.active ? '' : 'is-inactive'} ${route.transportMode === 'river' ? 'is-river' : route.transportMode === 'sea' ? 'is-sea' : 'is-land'} ${route.riskLevel >= 55 || route.totalCapacity >= 9 ? 'is-critical' : ''} ${tensionClass} ${routeFocused ? 'is-selected' : ''}" data-route-id="${route.routeId}" title="${stress.headline}: ${stress.summary}">
              <div class="economy-route-card__header"><strong>${route.routeName}</strong><span>${getRouteHud(route).glyph}</span></div>
              <div class="economy-route-card__stats">
                <span>${route.transportMode}</span>
                <span>risque ${route.riskLevel}</span>
                <span>capacité ${route.totalCapacity}</span>
              </div>
              <p class="economy-route-card__stress economy-route-card__stress--${stress.tone}">${stress.headline}: ${stress.summary}</p>
              ${renderRouteManifest(route)}
            </article>
          `;
        }).join('')}
      </div>
      <section class="economy-legend-panel" aria-label="Légende économique">
        <div class="economy-legend-panel__header">
          <h4>Légende économique</h4>
          <p>Repères compacts pour lire villes, routes, stocks et tensions sans quitter la carte.</p>
        </div>
        <div class="economy-legend-grid">
          <article class="economy-legend-card">
            <strong>Villes</strong>
            <ul>
              <li><span class="economy-legend-city is-capital"></span>Capitale logistique</li>
              <li><span class="economy-legend-city is-hub"></span>Hub majeur</li>
              <li><span class="economy-legend-city is-warning"></span>Ville sous vigilance</li>
              <li><span class="economy-legend-ring"></span>Tension d’approvisionnement</li>
            </ul>
          </article>
          <article class="economy-legend-card">
            <strong>Glyphes ressources</strong>
            <ul class="economy-resource-legend">
              ${Object.entries(resourceHudById).map(([resourceId, hud]) => `<li><span class="economy-resource-chip economy-resource-chip--${hud.tone}">${hud.glyph}</span>${resourceId}</li>`).join('')}
            </ul>
          </article>
          <article class="economy-legend-card">
            <strong>Routes</strong>
            <ul class="economy-route-legend">
              <li><i class="is-land"></i>Terre</li>
              <li><i class="is-river"></i>Fluvial</li>
              <li><i class="is-sea"></i>Maritime</li>
              <li><i class="is-critical"></i>Liaison critique</li>
              <li><i class="is-high-tension"></i>Tension forte</li>
            </ul>
          </article>
          <article class="economy-legend-card">
            <strong>Stocks et tension</strong>
            <ul class="economy-legend-pill-list">
              <li><span class="tension-pill tension-pill--low">low</span>lecture stable</li>
              <li><span class="tension-pill tension-pill--medium">medium</span>stocks fragiles</li>
              <li><span class="tension-pill tension-pill--high">high</span>pénurie à traiter</li>
              <li><span class="economy-legend-heat is-rich"></span>zone prospère</li>
              <li><span class="economy-legend-heat is-fragile"></span>zone en tension</li>
            </ul>
          </article>
        </div>
      </section>
    </section>
  `;
}

function renderBottomTray(economyView, intrigueView, cultureView) {
  const cultureTray = renderCultureBottomTray(cultureView);

  if (cultureTray) {
    return cultureTray;
  }

  if (state.activeOverlaySlot === 'intrigue-overlay') {
    return `
      <section id="bottom-tray" class="overlay-anchor-shell overlay-anchor-shell--bottom overlay-anchor-shell--economy">
        <div class="bottom-tray-grid">
          <div class="bottom-tray-table">
            <h4>Cellules suivies</h4>
            <p>${intrigueView.summary}</p>
            <table>
              <thead>
                <tr><th>Cellule</th><th>Lieu</th><th>Exposition</th><th>Statut</th></tr>
              </thead>
              <tbody>
                ${intrigueView.panels.cellules.slice(0, 4).map((cellule) => `
                  <tr class="intrigue-cell-row intrigue-cell-row--${cellule.statusClass}">
                    <td><span class="intrigue-cell-status-dot intrigue-cell-status-dot--${cellule.statusClass}"></span>${cellule.codename}</td>
                    <td>${cellule.locationName}</td>
                    <td>${cellule.exposure}</td>
                    <td><span class="intrigue-status-pill intrigue-status-pill--${cellule.statusClass}">${cellule.statusMarker} ${cellule.statusLabel}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="bottom-tray-stocks">
            ${intrigueView.panels.operations.slice(0, 4).map((operation) => `
              <article class="stock-mini-card intrigue-operation-card intrigue-operation-card--${operation.tone} ${intrigueView.selectedOperation?.operationId === operation.operationId ? 'is-selected' : ''}" data-intrigue-operation-id="${operation.operationId}">
                <div class="intrigue-operation-card__header">
                  <span>${operation.type}</span>
                  <strong>R${Math.ceil(operation.detectionRisk / 25)}</strong>
                </div>
                <h4>${operation.locationName}</h4>
                <p>${operation.objective}</p>
                <div class="intrigue-operation-card__progress" aria-label="Progression ${operation.progress}%">
                  <i style="width:${operation.progress}%"></i>
                </div>
                <ul>
                  <li><span>Phase</span><strong>${operation.phase}</strong></li>
                  <li><span>Progression</span><strong>${operation.progress}%</strong></li>
                  <li><span>Chaleur</span><strong>${operation.heat}</strong></li>
                </ul>
              </article>
            `).join('')}
          </div>
        </div>
        ${intrigueView.selectedOperation ? `
          <section class="intrigue-operation-detail" aria-label="Détail d'opération active">
            <div class="intrigue-operation-detail__header">
              <div>
                <h4>Opération active, ${intrigueView.selectedOperation.locationName}</h4>
                <p>${intrigueView.selectedOperation.objective}</p>
              </div>
              <span class="tension-pill tension-pill--${intrigueView.selectedOperation.tone === 'danger' ? 'high' : 'medium'}">${intrigueView.selectedOperation.type}</span>
            </div>
            <div class="intrigue-operation-detail__stats">
              <div><span>Phase</span><strong>${intrigueView.selectedOperation.phase}</strong></div>
              <div><span>Progression</span><strong>${intrigueView.selectedOperation.progress}%</strong></div>
              <div><span>Heat</span><strong>${intrigueView.selectedOperation.heat}</strong></div>
              <div><span>Risque</span><strong>${intrigueView.selectedOperation.detectionRisk}</strong></div>
            </div>
            <div class="intrigue-operation-detail__directive">
              <span>Directive covert-op</span>
              <strong>${intrigueView.selectedOperation.tone === 'danger' ? 'Réduire signature terrain' : 'Maintenir couverture et cadence'}</strong>
            </div>
          </section>
        ` : ''}
      </section>
    `;
  }

  if (state.activeOverlaySlot !== 'economy-overlay') {
    return '<div class="overlay-anchor-shell overlay-anchor-shell--bottom">Bottom tray</div>';
  }

  const comparedIds = state.comparedCityIds.filter((cityId) => economyView.stockPanels[cityId]);
  const comparedCities = (comparedIds.length > 0 ? comparedIds : economyView.overlay.cities.slice(0, 2).map((city) => city.cityId))
    .map((cityId) => {
      const city = economyView.overlay.cities.find((candidate) => candidate.cityId === cityId);
      const panel = economyView.stockPanels[cityId];
      const row = economyView.comparison.rows.find((candidate) => candidate.cityId === cityId);
      return city && panel && row ? { city, panel, row } : null;
    })
    .filter(Boolean);

  return `
    <section id="bottom-tray" class="overlay-anchor-shell overlay-anchor-shell--bottom overlay-anchor-shell--economy">
      <div class="bottom-tray-grid">
        <div class="bottom-tray-table bottom-tray-table--comparison">
          <div class="comparison-toolbar">
            <div>
              <h4>Comparaison multi-villes</h4>
              <p>Sélectionne jusqu’à 3 villes sur la carte pour comparer stock, stabilité et prospérité.</p>
            </div>
            <div class="comparison-chip-row">
              ${economyView.overlay.cities.map((city) => `<button type="button" class="comparison-chip ${state.comparedCityIds.includes(city.cityId) ? 'is-active' : ''}" data-compare-city-id="${city.cityId}">${city.cityName}</button>`).join('')}
            </div>
          </div>
          <div class="comparison-cards">
            ${comparedCities.map(({ city, panel, row }) => `
              <article class="comparison-card ${state.selectedCityId === city.cityId ? 'is-selected' : ''}">
                <div class="comparison-card__header">
                  <div>
                    <h5>${city.cityName}</h5>
                    <p>${panel.summary}</p>
                  </div>
                  <span class="tension-pill tension-pill--${row.tensionLevel}">${row.tensionLevel}</span>
                </div>
                <dl class="comparison-card__stats economy-dense-stats">
                  <div><dt>Stock</dt><dd>${row.totalStock} <small>${economyView.deltaByCityId[city.cityId].stockDelta > 0 ? '+' : ''}${economyView.deltaByCityId[city.cityId].stockDelta}</small></dd></div>
                  <div><dt>Stabilité</dt><dd>${city.stability} <small>${economyView.deltaByCityId[city.cityId].stabilityDelta > 0 ? '+' : ''}${economyView.deltaByCityId[city.cityId].stabilityDelta}</small></dd></div>
                  <div><dt>Prospérité</dt><dd>${city.prosperity} <small>${economyView.deltaByCityId[city.cityId].prosperityDelta > 0 ? '+' : ''}${economyView.deltaByCityId[city.cityId].prosperityDelta}</small></dd></div>
                  <div><dt>Ratio</dt><dd>${row.scarcityRatio}</dd></div>
                </dl>
                <ul>
                  ${panel.rows.slice(0, 3).map((resource) => `<li class="${resource.status}"><span>${resource.resourceId}</span><strong>${resource.detail}</strong></li>`).join('')}
                </ul>
              </article>
            `).join('')}
          </div>
        </div>
        <div class="bottom-tray-stocks">
          ${economyView.overlay.cities.map((city) => {
            const panel = economyView.stockPanels[city.cityId];
            const comparisonRow = economyView.comparison.rows.find((candidate) => candidate.cityId === city.cityId);
            return `
              <article class="stock-mini-card ${state.comparedCityIds.includes(city.cityId) ? 'is-compared' : ''} ${comparisonRow?.tensionLevel === 'high' ? 'is-fragile' : ''}">
                <h4>${panel.cityName}</h4>
                <p>${panel.summary}</p>
                <ul>
                  ${panel.rows.slice(0, 3).map((row) => { const hud = getResourceHud(row.resourceId); return `<li class="${row.status}"><span>${hud.glyph} ${row.resourceId}</span><strong>${row.detail}</strong></li>`; }).join('')}
                </ul>
              </article>
            `;
          }).join('')}
        </div>
      </div>
    </section>
  `;
}

function getLabelAnchorOffset(align) {
  if (align === 'start') {
    return { rectX: 0, textPadding: 1.2 };
  }

  if (align === 'end') {
    return { rectX: -19.2, textPadding: -1.2 };
  }

  return { rectX: -9.6, textPadding: 0 };
}

function getProvinceLabelModel(province) {
  const center = getProvinceCenter(province.provinceId);
  const label = province.geometry.labelLayout ?? { ...center, align: 'middle', tone: 'standard' };
  const offset = getLabelAnchorOffset(label.align);
  const leaderNeeded = Math.abs(label.x - center.x) > 4 || Math.abs(label.y - center.y) > 4;

  return {
    ...label,
    center,
    leaderNeeded,
    titleX: label.x + offset.textPadding,
    rectX: label.x + offset.rectX,
    rectY: label.y - 4.4,
    subtitleY: label.y + 4.25,
    width: 19.2,
    height: 7.8,
  };
}

function renderProvinceLabels(shell) {
  return `
    <svg class="map-label-layer" viewBox="0 0 100 100" aria-label="Labels des provinces et points clés">
      ${shell.provinces.map((province) => {
        const label = getProvinceLabelModel(province);
        const city = cities.find((candidate) => candidate.regionId === province.provinceId) ?? null;
        const cityLayout = city ? cityLayoutsById[city.id] : null;
        const cityLabelX = cityLayout ? cityLayout.x + (cityLayout.labelDx ?? 0) : null;
        const cityLabelY = cityLayout ? cityLayout.y + (cityLayout.labelDy ?? 0) : null;

        return `
          <g class="province-map-label province-map-label--${label.tone} ${province.selectionState.selected ? 'is-selected' : province.selectionState.hovered ? 'is-hovered' : province.selectionState.focused ? 'is-focused' : ''}">
            ${label.leaderNeeded ? `<path class="province-map-label__leader" d="M ${label.center.x} ${label.center.y} L ${label.x} ${label.y - 1.5}"></path>` : ''}
            <rect class="province-map-label__plate" x="${label.rectX}%" y="${label.rectY}%" width="${label.width}%" height="${label.height}%" rx="1.4" ry="1.4"></rect>
            <text class="province-map-label__title" x="${label.titleX}%" y="${label.y}%" text-anchor="${label.align}">${province.label}</text>
            <text class="province-map-label__subtitle" x="${label.titleX}%" y="${label.subtitleY}%" text-anchor="${label.align}">${province.contested ? 'Front actif' : province.occupied ? 'Occupation' : `Valeur ${province.strategicValue}`}</text>
            ${city && cityLayout ? `
              <g class="city-map-label ${city.capital ? 'is-capital' : 'is-key'} ${state.selectedCityId === city.id ? 'is-selected' : ''}">
                <line class="city-map-label__leader" x1="${cityLayout.x}%" y1="${cityLayout.y}%" x2="${cityLabelX}%" y2="${cityLabelY}%"></line>
                <text class="city-map-label__title" x="${cityLabelX}%" y="${cityLabelY}%" text-anchor="middle">${city.name}</text>
              </g>
            ` : ''}
          </g>
        `;
      }).join('')}
    </svg>
  `;
}

function renderProvincePopup(shell) {
  const province = shell.provinces.find((candidate) => candidate.provinceId === state.popupProvinceId);

  if (!province) {
    return '';
  }

  const layout = province.geometry.layout ?? getProvinceLayout(province.provinceId);
  const controller = factionMetaById[province.controllingFactionId]?.label ?? province.controllingFactionId;
  const status = province.contested ? 'Front contesté' : province.occupied ? 'Sous occupation' : 'Contrôle stable';

  return `
    <aside
      class="province-popup"
      style="left:calc(${layout.x + layout.w - 2}%);top:calc(${layout.y - 2}%);"
      aria-live="polite"
    >
      <div class="province-popup__header">
        <div>
          <strong>${province.label}</strong>
          <p>${status}</p>
        </div>
        <button type="button" class="province-popup__close" data-popup-close="true" aria-label="Fermer le popup">×</button>
      </div>
      <div class="province-popup__facts">
        <span>${controller}</span>
        <span>Loyauté ${province.loyalty}%</span>
        <span>Valeur ${province.strategicValue}</span>
      </div>
      <div class="province-popup__actions">
        <button type="button" data-popup-action="focus" data-province-id="${province.provinceId}">Focus</button>
        <button type="button" data-popup-action="compare" data-province-id="${province.provinceId}">Comparer</button>
        <button type="button" data-popup-action="details" data-province-id="${province.provinceId}">Détail</button>
      </div>
    </aside>
  `;
}

function buildReadableRelationPath(relation, index) {
  const dx = relation.destination.x - relation.origin.x;
  const dy = relation.destination.y - relation.origin.y;
  const length = Math.hypot(dx, dy) || 1;
  const bend = ((index % 3) - 1) * 2.8;
  const controlX = ((relation.origin.x + relation.destination.x) / 2) - (dy / length) * bend;
  const controlY = ((relation.origin.y + relation.destination.y) / 2) + (dx / length) * bend;

  return `M ${relation.origin.x} ${relation.origin.y} Q ${controlX.toFixed(2)} ${controlY.toFixed(2)} ${relation.destination.x} ${relation.destination.y}`;
}

function renderStrategicRelations(shell) {
  const focusContext = getFocusContext(shell);
  const relationLines = buildProvinceRelations(shell).map((relation, index) => {
    const linkedToSelection = focusContext.selectedProvince
      && (relation.relationId.includes(focusContext.selectedProvince.provinceId));
    const linkedToHover = focusContext.hoveredProvince
      && (relation.relationId.includes(focusContext.hoveredProvince.provinceId));
    const pathD = buildReadableRelationPath(relation, index);

    return `
    <g class="front-link ${linkedToSelection ? 'is-emphasized' : ''} ${linkedToHover ? 'is-previewed' : ''}">
      <path class="front-line-casing" d="${pathD}" />
      <path
        class="front-line ${relation.contested ? 'is-contested' : relation.occupied ? 'is-occupied' : relation.stable ? 'is-stable' : ''} ${linkedToSelection ? 'is-emphasized' : ''}"
        d="${pathD}"
      />
    </g>
  `;
  }).join('');

  const frontierRings = shell.provinces.map((province) => {
    const center = getProvinceCenter(province.provinceId);
    if (!center) {
      return '';
    }

    return `
      <circle
        class="province-ring ${province.contested ? 'is-contested' : province.occupied ? 'is-occupied' : 'is-stable'}"
        cx="${center.x}%"
        cy="${center.y}%"
        r="6.4"
      ></circle>
    `;
  }).join('');

  const hotspots = shell.provinces
    .filter((province) => province.contested || province.occupied)
    .map((province) => {
      const center = getProvinceCenter(province.provinceId);
      if (!center) {
        return '';
      }

      return `
        <g class="front-hotspot ${province.contested ? 'is-contested' : 'is-occupied'}">
          <circle cx="${center.x}%" cy="${center.y}%" r="2.3"></circle>
          <text x="${center.x}%" y="${center.y - 4}%" text-anchor="middle">${province.contested ? 'Front' : 'Occupation'}</text>
        </g>
      `;
    }).join('');

  return `
    <svg class="strategic-relations-layer" viewBox="0 0 100 100" aria-label="Relations entre provinces et lignes de front">
      ${relationLines}
      ${frontierRings}
      ${hotspots}
    </svg>
  `;
}

function renderTerrainDecor() {
  return `
    <div class="map-sea map-sea--west"></div>
    <div class="map-sea map-sea--south"></div>
    <div class="terrain-shadow terrain-shadow--north"></div>
    <div class="terrain-shadow terrain-shadow--central"></div>
    <div class="terrain-shadow terrain-shadow--south"></div>
    <div class="terrain-mass terrain-mass--north"></div>
    <div class="terrain-mass terrain-mass--east"></div>
    <div class="terrain-mass terrain-mass--south"></div>
    <div class="terrain-ridge terrain-ridge--north"></div>
    <div class="terrain-ridge terrain-ridge--central"></div>
    <div class="terrain-ridge terrain-ridge--south"></div>
    <div class="terrain-forest terrain-forest--west"></div>
    <div class="terrain-forest terrain-forest--east"></div>
    <div class="terrain-river"></div>
    <div class="terrain-contours terrain-contours--a"></div>
    <div class="terrain-contours terrain-contours--b"></div>
    <div class="terrain-contours terrain-contours--c"></div>
    <div class="terrain-grain"></div>
  `;
}

function clampMapPan() {
  const limit = Math.round((state.mapZoom - 1) * 180);
  state.mapPanX = Math.max(-limit, Math.min(limit, state.mapPanX));
  state.mapPanY = Math.max(-limit, Math.min(limit, state.mapPanY));
}

function setMapZoom(nextZoom) {
  state.mapZoom = Math.max(1, Math.min(2.4, Number(nextZoom.toFixed(2))));
  if (state.mapZoom === 1) {
    state.mapPanX = 0;
    state.mapPanY = 0;
    return;
  }
  clampMapPan();
}

function nudgeMapPan(deltaX, deltaY) {
  state.mapPanX += deltaX;
  state.mapPanY += deltaY;
  clampMapPan();
}

function centerMapOnProvince(provinceId, viewportElement) {
  const center = getProvinceCenter(provinceId);

  if (!center || !viewportElement) {
    return false;
  }

  setMapZoom(Math.max(state.mapZoom, 1.55));

  const bounds = viewportElement.getBoundingClientRect();
  state.mapPanX = ((50 - center.x) / 100) * bounds.width * state.mapZoom;
  state.mapPanY = ((50 - center.y) / 100) * bounds.height * state.mapZoom;
  clampMapPan();
  return true;
}

function resetMapViewport() {
  state.mapPanX = 0;
  state.mapPanY = 0;
  setMapZoom(1);
}

function getMapViewportTransform() {
  return `translate(${state.mapPanX}px, ${state.mapPanY}px) scale(${state.mapZoom})`;
}

function renderMapControls() {
  return `
    <div class="map-controls" aria-label="Navigation carte">
      <button type="button" class="map-control-button" data-map-zoom="out" aria-label="Zoom arrière">−</button>
      <div class="map-zoom-indicator">${Math.round(state.mapZoom * 100)}%</div>
      <button type="button" class="map-control-button" data-map-zoom="in" aria-label="Zoom avant">+</button>
      <button type="button" class="map-control-button" data-map-pan="selection" aria-label="Recentrer sur la province sélectionnée">Cible</button>
      <button type="button" class="map-control-button ${state.mapZoom === 1 ? 'is-disabled' : ''}" data-map-pan="reset" aria-label="Réinitialiser la vue">Reset</button>
    </div>
  `;
}

function getMapAnchors() {
  return [
    { id: 'top-hud', className: 'overlay-anchor-shell overlay-anchor-shell--top', label: 'Top HUD' },
    { id: 'left-rail', className: 'overlay-anchor-shell overlay-anchor-shell--left', label: 'Left rail' },
    { id: 'right-rail', className: 'overlay-anchor-shell overlay-anchor-shell--right', label: 'Right rail' },
  ];
}

function renderMapAnchorShells() {
  return getMapAnchors().map((anchor) => `<div id="${anchor.id}" class="${anchor.className}">${anchor.label}</div>`).join('');
}

function renderTacticalCoordinateGrid() {
  const columns = ['A', 'B', 'C', 'D', 'E'];
  const rows = ['01', '02', '03', '04'];

  return `
    <div class="tactical-coordinate-grid" aria-hidden="true">
      <div class="coordinate-axis coordinate-axis--top">
        ${columns.map((column) => `<span>${column}</span>`).join('')}
      </div>
      <div class="coordinate-axis coordinate-axis--left">
        ${rows.map((row) => `<span>${row}</span>`).join('')}
      </div>
      <div class="blueprint-crosshair blueprint-crosshair--north"></div>
      <div class="blueprint-crosshair blueprint-crosshair--south"></div>
    </div>
  `;
}

function getMapRenderLayers(shell, economyView, focusContext, cultureView, postCommitClimateMarkers = [], selectedClimateCascadeGroup = null, worldClimateLayer = null) {
  return [
    { key: 'backdrop', className: 'map-layer map-layer--backdrop', content: `<div class="map-backdrop"></div>${renderTacticalCoordinateGrid()}` },
    { key: 'atlas', className: 'map-layer map-layer--atlas', content: renderAtlasWorldCanvas(shell, economyView, cultureView) },
    { key: 'terrain', className: 'map-layer map-layer--terrain', content: renderTerrainDecor() },
    { key: 'surface', className: 'map-layer map-layer--surface', content: renderProvinceSurface(shell, focusContext) },
    { key: 'relations', className: 'map-layer map-layer--relations', content: renderStrategicRelations(shell) },
    { key: 'labels', className: 'map-layer map-layer--labels', content: renderProvinceLabels(shell) },
    { key: 'anchors', className: 'map-layer map-layer--anchors', content: renderMapAnchorShells() },
    { key: 'economy', className: 'map-layer map-layer--economy', content: `${renderEconomyMapOverlay(economyView)}${renderCultureMapOverlay(cultureView)}` },
    { key: 'hud', className: 'map-layer map-layer--hud', content: `${renderCityQuickPanel(economyView)}<div class="focus-hint">${focusContext.selectedProvince ? `Sélection active, ${focusContext.selectedProvince.label}` : 'Survolez une province pour déplacer le focus'}</div>` },
    { key: 'interactions', className: 'map-layer map-layer--interactions', content: `${shell.provinces.map((province) => renderProvinceCard(province, focusContext, postCommitClimateMarkers, selectedClimateCascadeGroup, worldClimateLayer)).join('')}${renderProvincePopup(shell)}` },
  ];
}

function renderMapLayerStack(shell, economyView, focusContext, cultureView, postCommitClimateMarkers = [], selectedClimateCascadeGroup = null, worldClimateLayer = null) {
  return getMapRenderLayers(shell, economyView, focusContext, cultureView, postCommitClimateMarkers, selectedClimateCascadeGroup, worldClimateLayer)
    .map((layer) => `<div class="${layer.className}" data-map-layer="${layer.key}">${layer.content}</div>`)
    .join('');
}

function renderMapArchitecturePanel() {
  return `
    <section class="panel map-architecture-panel">
      <div class="panel-header">
        <h3>Architecture carte</h3>
        <p>Socle réutilisable pour les futures couches agents et overlays métier.</p>
      </div>
      <div class="map-architecture-grid">
        <article class="map-architecture-card">
          <strong>Socle visuel</strong>
          <span>backdrop, terrain, surface, relations, labels</span>
        </article>
        <article class="map-architecture-card">
          <strong>Ancrages</strong>
          <span>${getMapAnchors().map((anchor) => anchor.id).join(' · ')}, #bottom-tray</span>
        </article>
        <article class="map-architecture-card">
          <strong>Couches métier</strong>
          <span>economy et HUD isolés, prêts pour extensions culture, climat, intrigue</span>
        </article>
      </div>
    </section>
  `;
}

function advanceTurn() {
  const shell = getShell();
  const militaryOutcomeMarker = state.acceptedRecommendedMilitaryAction
    ? buildPostCommitMilitaryOutcomeMarker(
      shell.provinces.find((province) => province.provinceId === state.acceptedRecommendedMilitaryAction.provinceId),
      shell,
      getIntrigueViewModel(),
    )
    : null;

  state.turn += 1;
  state.seasonIndex = (state.seasonIndex + 1) % seasonLabels.length;

  const summaries = [
    'Les convois remontent depuis Couronne, mais la Porte du Fleuve reste fragile.',
    'Les lignes se réorganisent, la logistique se tend autour du front central.',
    'Les récoltes soulagent le sud, tandis que la pression remonte à la frontière est.',
    'Le froid coupe certains flux, les provinces exposées repassent en posture défensive.',
  ];

  const economyView = getEconomyViewModel();
  const logisticsOutcomeMarkers = buildLogisticsOutcomeMarkers(shell, economyView);

  state.cultureTensionMarkers = buildPostCommitCultureTensionMarkers(shell);
  state.cultureBlockerHistory = buildPostCommitCultureBlockerHistory(shell);
  state.queuedCultureActions = [];
  state.lastMilitaryOutcomeMarkers = militaryOutcomeMarker ? [militaryOutcomeMarker] : [];
  state.logisticsOutcomeMarkers = logisticsOutcomeMarkers;
  state.queuedLogisticsActions = [];
  state.lastTurnSummary = logisticsOutcomeMarkers.length > 0
    ? `${logisticsOutcomeMarkers.length} marqueur${logisticsOutcomeMarkers.length > 1 ? 's' : ''} logistique${logisticsOutcomeMarkers.length > 1 ? 's' : ''} post-commit visible${logisticsOutcomeMarkers.length > 1 ? 's' : ''} sur la carte: ${logisticsOutcomeMarkers.map((marker) => `${marker.provinceLabel} ${marker.code}`).join(', ')}.`
    : militaryOutcomeMarker
      ? `${militaryOutcomeMarker.label}: ${militaryOutcomeMarker.changed}`
      : summaries[(state.turn - 2) % summaries.length];
  state.acceptedRecommendedMilitaryAction = null;
}

function renderMobileToolbar() {
  return `
    <div class="mobile-toolbar" aria-label="Navigation mobile de la carte">
      <button type="button" class="mobile-toolbar__button ${state.mobilePanelSection === 'details' ? 'is-active' : ''}" data-mobile-panel="details">Détails</button>
      <button type="button" class="mobile-toolbar__button ${state.mobilePanelSection === 'legend' ? 'is-active' : ''}" data-mobile-panel="legend">Légende</button>
      <button type="button" class="mobile-toolbar__button ${state.mobilePanelSection === 'overlay' ? 'is-active' : ''}" data-mobile-panel="overlay">Overlay</button>
      <button type="button" class="mobile-toolbar__button ${state.mobileMapExpanded ? 'is-active' : ''}" data-mobile-map-toggle="true">${state.mobileMapExpanded ? 'Réduire carte' : 'Ouvrir carte'}</button>
    </div>
  `;
}

function renderLauncherMapStats(stats) {
  return Object.entries(stats).map(([label, value]) => `
    <span class="launcher-map-card__stat"><strong>${value}</strong>${label}</span>
  `).join('');
}

function renderLauncher() {
  return `
    <main class="launcher-root">
      <section class="launcher-hero panel launcher-hero--startup">
        <div class="launcher-hero__copy">
          <p class="eyebrow">Historia launcher</p>
          <h1>Bienvenue dans Historia</h1>
          <p>Un démarrage clair avant le jeu: choisissez une carte prototype, puis entrez dans une carte visible sans écran vide.</p>
          <div class="launcher-actions">
            <button type="button" class="turn-button launcher-primary" data-open-map-select="true">Choisir une carte</button>
          </div>
        </div>
        <div class="launcher-hero__screen" aria-label="Aperçu du menu de démarrage">
          <div class="launcher-screen-frame launcher-screen-frame--cyan">
            <div class="launcher-screen-map">
              <span class="launcher-screen-map__province launcher-screen-map__province--a"></span>
              <span class="launcher-screen-map__province launcher-screen-map__province--b"></span>
              <span class="launcher-screen-map__province launcher-screen-map__province--c"></span>
              <span class="launcher-screen-map__route launcher-screen-map__route--a"></span>
              <span class="launcher-screen-map__route launcher-screen-map__route--b"></span>
            </div>
            <strong>Launcher → sélection → carte</strong>
            <small>Flux court et testable pour vérifier immédiatement que la carte apparaît.</small>
          </div>
        </div>
      </section>
    </main>
  `;
}

function renderMapSelection() {
  const selection = buildLauncherMapSelection(mapScenarios, state.selectedMapId);
  const selectedMap = selection.selectedMap;
  const mapCards = selection.maps.map((map) => `
    <button
      type="button"
      class="launcher-map-card launcher-map-card--${map.previewTone} ${map.selected ? 'is-selected' : ''} ${map.playable ? '' : 'is-locked'}"
      data-map-option="${map.id}"
      ${map.playable ? '' : 'disabled'}
      aria-pressed="${map.selected ? 'true' : 'false'}"
    >
      <span class="launcher-map-card__tag">${map.tag}</span>
      <span class="launcher-map-card__preview" aria-hidden="true">
        <span></span><span></span><span></span><span></span>
      </span>
      <span class="launcher-map-card__title">${map.title}</span>
      <span class="launcher-map-card__subtitle">${map.subtitle}</span>
      <span class="launcher-map-card__description">${map.description}</span>
      <span class="launcher-map-card__stats">${renderLauncherMapStats(map.stats)}</span>
      <span class="launcher-map-card__action">${map.playable ? 'Cliquer pour lancer' : 'Non disponible'}</span>
    </button>
  `).join('');

  return `
    <main class="launcher-root">
      <section class="launcher-hero panel">
        <div class="launcher-hero__copy">
          <p class="eyebrow">Historia launcher</p>
          <h1>Choisissez une carte</h1>
          <p>Une carte prototype est disponible maintenant; les autres emplacements restent visibles mais ne se superposent pas au jeu.</p>
          <div class="launcher-actions">
            <button type="button" class="turn-button turn-button--secondary" data-open-startup="true">Retour au menu</button>
            <button type="button" class="turn-button launcher-primary" data-launch-selected="true" ${selection.canLaunch ? '' : 'disabled'}>
              Lancer la carte sélectionnée
            </button>
            <span>${selection.headline}</span>
          </div>
        </div>
        <div class="launcher-hero__screen" aria-label="Aperçu de la carte sélectionnée">
          <div class="launcher-screen-frame launcher-screen-frame--${selectedMap?.previewTone ?? 'cyan'}">
            <div class="launcher-screen-map">
              <span class="launcher-screen-map__province launcher-screen-map__province--a"></span>
              <span class="launcher-screen-map__province launcher-screen-map__province--b"></span>
              <span class="launcher-screen-map__province launcher-screen-map__province--c"></span>
              <span class="launcher-screen-map__route launcher-screen-map__route--a"></span>
              <span class="launcher-screen-map__route launcher-screen-map__route--b"></span>
            </div>
            <strong>${selectedMap?.title ?? 'Aucune carte'}</strong>
            <small>${selectedMap?.description ?? 'Ajoutez une carte jouable pour lancer Historia.'}</small>
          </div>
        </div>
      </section>

      <section class="launcher-map-select panel">
        <div class="panel-header panel-header--spread">
          <div>
            <h2>Sélection de carte</h2>
            <p>Le premier choix est prêt pour validation produit; les cartes futures restent visibles sans bloquer le test.</p>
          </div>
        </div>
        <div class="launcher-map-grid">${mapCards}</div>
      </section>
    </main>
  `;
}

function bindLauncherEvents() {
  document.querySelectorAll('[data-open-map-select]').forEach((element) => {
    element.addEventListener('click', () => {
      state.screen = 'map-select';
      render();
    });
  });
}

function bindMapSelectionEvents() {
  document.querySelectorAll('[data-open-startup]').forEach((element) => {
    element.addEventListener('click', () => {
      state.screen = 'launcher';
      render();
    });
  });

  document.querySelectorAll('[data-map-option]').forEach((element) => {
    element.addEventListener('click', () => {
      const mapId = element.dataset.mapOption;
      const scenario = mapScenarios.find((candidate) => candidate.id === mapId && candidate.playable !== false);

      state.selectedMapId = mapId;

      if (scenario) {
        applyMapScenario(scenario);
      }

      render();
    });
  });

  document.querySelectorAll('[data-launch-selected]').forEach((element) => {
    element.addEventListener('click', () => {
      applyMapScenario(getSelectedMapScenario());
      render();
    });
  });
}

function render() {
  if (state.screen === 'launcher') {
    document.querySelector('#app').innerHTML = renderLauncher();
    bindLauncherEvents();
    return;
  }

  if (state.screen === 'map-select') {
    document.querySelector('#app').innerHTML = renderMapSelection();
    bindMapSelectionEvents();
    return;
  }

  const shell = getShell();
  const economyView = getEconomyViewModel();
  const focusContext = getFocusContext(shell);
  const intrigueView = getIntrigueViewModel();
  const cultureView = getCultureViewModel();
  const selectedCultureContext = getSelectedCultureContext();
  const cultureTurnReport = buildCultureTurnReportDeltas({
    turn: state.turn,
    selectedRegionId: state.selectedProvinceId,
    selectedMarker: selectedCultureContext.selectedMarker,
    selectedCluster: selectedCultureContext.selectedCluster,
    localTimeline: selectedCultureContext.localTimeline,
    consequenceChips: selectedCultureContext.consequenceChips,
  });
  const climatePreparednessSummary = buildMapClimatePreparednessSummary(shell, focusContext, intrigueView);
  const climateInterventionWindows = buildMapClimateInterventionWindows(shell);
  const cumulativeClimateImpact = buildCumulativeClimateImpactSummary(shell, state.queuedClimateInterventions);
  const postCommitClimateMarkers = buildPostCommitClimateImpactMarkers(shell, state.queuedClimateInterventions);
  const viewportWidth = typeof window === 'undefined' ? 1024 : window.innerWidth;
  const climateMarkerDensity = buildClimateMarkerDensityControl(postCommitClimateMarkers, {
    zoom: state.mapZoom,
    viewportWidth,
    mobileMapExpanded: state.mobileMapExpanded,
    selectedProvinceId: state.selectedProvinceId,
  });
  const climateSeverityLegend = buildClimateSeverityLegend(postCommitClimateMarkers, climateMarkerDensity, shell);
  const climateFollowUpDebt = buildClimateFollowUpDebtSummary(postCommitClimateMarkers, climateSeverityLegend.mitigationSequence ?? []);
  const worldClimateLayer = buildWorldClimateLayer(shell, state.seasonIndex, state.atlasClimateForecastMode);
  const atlasClimateCascadeImpact = buildAtlasClimateCascadeImpactPreview(shell, worldClimateLayer);
  const atlasClimateMitigationSynergies = buildAtlasClimateMitigationSynergies(shell, atlasClimateCascadeImpact, worldClimateLayer);
  const atlasSeasonalMitigationWindows = buildAtlasSeasonalMitigationWindows(atlasClimateMitigationSynergies, worldClimateLayer);
  const atlasSeasonalPlanComparison = buildAtlasSeasonalMitigationPlanComparison(atlasSeasonalMitigationWindows);
  const atlasClimateActionPlan = buildAtlasClimateActionPlanFromComparison(atlasSeasonalPlanComparison);
  const atlasClimateActionPlanRanking = buildAtlasClimateActionPlanRanking(atlasClimateActionPlan);
  const atlasClimateActionUrgencyTimeline = buildAtlasClimateActionUrgencyTimeline(atlasClimateActionPlanRanking);
  const atlasClimateMitigationReadiness = buildAtlasClimateMitigationReadinessComparison(atlasClimateActionUrgencyTimeline);
  const atlasClimateUnderReadyExecutionGaps = buildAtlasClimateUnderReadyExecutionGaps(atlasClimateMitigationReadiness);
  const atlasClimateReadinessBoostRecommendations = buildAtlasClimateReadinessBoostRecommendations(atlasClimateUnderReadyExecutionGaps);
  const atlasClimatePostBoostDeadlineRiskPreview = buildAtlasClimatePostBoostDeadlineRiskPreview(atlasClimateReadinessBoostRecommendations);
  const atlasClimateReadinessBoostReliefRanking = buildAtlasClimateReadinessBoostReliefRanking(atlasClimatePostBoostDeadlineRiskPreview);
  const atlasClimateMinimumViableBoostHint = buildAtlasClimateMinimumViableBoostHint(atlasClimateReadinessBoostReliefRanking);
  const atlasClimateMinimumBoostDeadlineMissWarning = buildAtlasClimateMinimumBoostDeadlineMissWarning(atlasClimateMinimumViableBoostHint);
  const atlasClimateDeadlineRecoveryAction = buildAtlasClimateDeadlineRecoveryAction(atlasClimateMinimumBoostDeadlineMissWarning);
  const atlasClimateRecoveryCollateralReliefRanking = buildAtlasClimateRecoveryCollateralReliefRanking(atlasClimateDeadlineRecoveryAction);
  const atlasClimateFirstRecoveryPressureReliefExplanation = buildAtlasClimateFirstRecoveryPressureReliefExplanation(atlasClimateRecoveryCollateralReliefRanking);
  const atlasClimateRecoveryPlanProjection = buildAtlasClimateRecoveryPlanProjection(atlasClimateFirstRecoveryPressureReliefExplanation, atlasClimateRecoveryCollateralReliefRanking);
  const atlasClimateCheapestSafeRecoveryCommitment = buildAtlasClimateCheapestSafeRecoveryCommitment(atlasClimateRecoveryPlanProjection);
  const intrigueExposureSummary = buildMapIntrigueExposureSummary(shell, intrigueView);

  document.querySelector('#app').innerHTML = `
    <main class="shell-root">
      <section class="hero panel">
        <div>
          <p class="eyebrow">Alpha war room</p>
          <h1>${shell.title}</h1>
          <p class="hero-copy">${shell.subtitle}</p>
          <div class="turn-toolbar">
            <div class="turn-indicator">
              <strong>Tour ${state.turn}</strong>
              <span>${seasonLabels[state.seasonIndex]}</span>
            </div>
            <button type="button" class="turn-button" data-next-turn="true">Tour suivant</button>
            <button type="button" class="turn-button turn-button--secondary" data-open-launcher="true">Changer de carte</button>
          </div>
          <p class="turn-summary">${state.lastTurnSummary}</p>
          ${renderConflictReadinessWarnings(shell, intrigueView)}
          ${renderFrontPriorityRanking(shell, intrigueView)}
          ${renderCriticalFrontDecisionComparison(shell, intrigueView)}
          ${renderRecommendedMilitaryActionPreview(shell, intrigueView)}
          ${renderQueuedMilitaryResolutionSummary(shell, intrigueView)}
          ${renderMapClimatePreparednessSummary(climatePreparednessSummary)}
          ${renderMapClimateInterventionWindows(climateInterventionWindows)}
          ${renderCumulativeClimateImpactSummary(cumulativeClimateImpact)}
          ${renderClimateMarkerDensityRollup(climateMarkerDensity)}
          ${renderSelectedClimateCascadeGroup(climateMarkerDensity.selectedCascadeGroup)}
          ${renderClimateFollowUpDebtSummary(climateFollowUpDebt)}
          ${renderWorldClimateLayerSummary(worldClimateLayer)}
          ${renderAtlasClimateCascadeImpactPreview(atlasClimateCascadeImpact)}
          ${renderAtlasClimateMitigationSynergies(atlasClimateMitigationSynergies)}
          ${renderAtlasSeasonalMitigationWindows(atlasSeasonalMitigationWindows)}
          ${renderAtlasSeasonalMitigationPlanComparison(atlasSeasonalPlanComparison)}
          ${renderAtlasClimateActionPlan(atlasClimateActionPlan)}
          ${renderAtlasClimateActionPlanRanking(atlasClimateActionPlanRanking)}
          ${renderAtlasClimateActionUrgencyTimeline(atlasClimateActionUrgencyTimeline)}
          ${renderAtlasClimateMitigationReadinessComparison(atlasClimateMitigationReadiness)}
          ${renderAtlasClimateUnderReadyExecutionGaps(atlasClimateUnderReadyExecutionGaps)}
          ${renderAtlasClimateReadinessBoostRecommendations(atlasClimateReadinessBoostRecommendations)}
          ${renderAtlasClimatePostBoostDeadlineRiskPreview(atlasClimatePostBoostDeadlineRiskPreview)}
          ${renderAtlasClimateReadinessBoostReliefRanking(atlasClimateReadinessBoostReliefRanking)}
          ${renderAtlasClimateMinimumViableBoostHint(atlasClimateMinimumViableBoostHint)}
          ${renderAtlasClimateMinimumBoostDeadlineMissWarning(atlasClimateMinimumBoostDeadlineMissWarning)}
          ${renderAtlasClimateDeadlineRecoveryAction(atlasClimateDeadlineRecoveryAction)}
          ${renderAtlasClimateRecoveryCollateralReliefRanking(atlasClimateRecoveryCollateralReliefRanking)}
          ${renderAtlasClimateFirstRecoveryPressureReliefExplanation(atlasClimateFirstRecoveryPressureReliefExplanation)}
          ${renderAtlasClimateRecoveryPlanProjection(atlasClimateRecoveryPlanProjection)}
          ${renderAtlasClimateCheapestSafeRecoveryCommitment(atlasClimateCheapestSafeRecoveryCommitment)}
          ${renderMapIntrigueExposureSummary(intrigueExposureSummary)}
          ${economyView.pulse ? `
            <div class="economy-turn-pulse">
              <strong>Variation visible</strong>
              <span>${economyView.pulse.city.name}, stock ${economyView.pulse.delta.stockDelta > 0 ? '+' : ''}${economyView.pulse.delta.stockDelta}, stabilité ${economyView.pulse.delta.stabilityDelta > 0 ? '+' : ''}${economyView.pulse.delta.stabilityDelta}, prospérité ${economyView.pulse.delta.prosperityDelta > 0 ? '+' : ''}${economyView.pulse.delta.prosperityDelta}</span>
            </div>
          ` : ''}
          ${renderEconomyReadinessWarnings(shell, economyView, focusContext, intrigueView)}
          ${renderCultureTurnReport(cultureTurnReport)}
        </div>
        <div class="hero-stats">
          ${renderStat('Provinces', shell.stats.provinceCount, 'neutral')}
          ${renderStat('Fronts contestés', shell.stats.contestedCount, 'alert')}
          ${renderStat('Occupations', shell.stats.occupiedCount, 'warning')}
          ${renderStat('Loyauté moyenne', `${shell.stats.averageLoyalty}%`, 'success')}
        </div>
      </section>

      ${renderMobileToolbar()}
      <section class="layout-grid ${state.mobileMapExpanded ? 'is-map-expanded' : 'is-map-collapsed'}">
        <section class="panel map-panel">
          <div class="panel-header panel-header--spread">
            <div>
              <h2>Carte opérationnelle</h2>
              <p>Cliquez pour sélectionner, survolez pour déplacer le focus</p>
            </div>
            <div class="overlay-tabs">${renderOverlaySlots(shell)}</div>
          </div>
          ${renderClimateSeverityLegend(climateSeverityLegend)}
          <div class="map-stage" data-map-stage="true" tabindex="0" aria-label="Carte opérationnelle zoomable. Utilisez plus, moins, zéro ou C pour naviguer.">
            ${renderMapControls()}
            ${renderMilitaryOutcomeMarkerFilters(state.lastMilitaryOutcomeMarkers)}
            ${renderMilitaryOutcomeTrailSummary(state.lastMilitaryOutcomeMarkers)}
            ${renderMilitaryFrontMarkerSummaries(state.lastMilitaryOutcomeMarkers)}
            <div class="map-viewport" style="transform:${getMapViewportTransform()};">
              ${renderMapLayerStack(shell, economyView, focusContext, cultureView, climateMarkerDensity.visibleMarkers, climateMarkerDensity.selectedCascadeGroup, worldClimateLayer)}
              ${renderIntrigueMapOverlay(intrigueView)}
            </div>
            ${renderBottomTray(economyView, intrigueView, cultureView)}
          </div>
        </section>

        <aside class="side-column">
          <div class="mobile-panel-stack ${state.mobilePanelSection === 'legend' ? 'show-legend' : state.mobilePanelSection === 'overlay' ? 'show-overlay' : 'show-details'}">
            ${renderLegend(shell)}
            ${renderActiveProvince(shell, economyView, intrigueView)}
            ${renderIntrigueSidePanel(intrigueView) ?? renderEconomySidePanel(economyView, cultureView)}
            ${renderMapArchitecturePanel()}
          </div>
        </aside>
      </section>
    </main>
  `;

  document.querySelectorAll('[data-readiness-summary]').forEach((element) => {
    element.addEventListener('focus', () => {
      if (!element.dataset.readinessDefaultProvince) {
        return;
      }

      state.readinessFocusProvinceId = element.dataset.readinessDefaultProvince;
      state.readinessFocusTone = element.dataset.readinessDefaultTone ?? 'ready';
      render();
    });

    element.addEventListener('blur', () => {
      state.readinessFocusProvinceId = null;
      state.readinessFocusTone = null;
      render();
    });
  });

  document.querySelectorAll('[data-province-id]').forEach((element) => {
    const applyProvinceFocus = () => {
      state.hoveredProvinceId = element.dataset.provinceId;
      state.focusedProvinceId = element.dataset.provinceId;
      if (element.dataset.readinessFocus) {
        state.readinessFocusProvinceId = element.dataset.readinessFocus;
        state.readinessFocusTone = element.dataset.readinessTone ?? 'ready';
      }
      render();
    };
    const clearProvinceFocus = () => {
      state.hoveredProvinceId = null;
      state.focusedProvinceId = state.selectedProvinceId;
      if (element.dataset.readinessFocus) {
        state.readinessFocusProvinceId = null;
        state.readinessFocusTone = null;
      }
      render();
    };

    element.addEventListener('mouseenter', applyProvinceFocus);
    element.addEventListener('focus', applyProvinceFocus);

    element.addEventListener('mouseleave', clearProvinceFocus);
    element.addEventListener('blur', clearProvinceFocus);

    element.addEventListener('click', () => {
      state.hoveredProvinceId = null;
      state.readinessFocusProvinceId = element.dataset.readinessFocus ?? null;
      state.readinessFocusTone = element.dataset.readinessFocus ? (element.dataset.readinessTone ?? 'ready') : null;
      state.focusedProvinceId = element.dataset.provinceId;
      state.selectedProvinceId = element.dataset.provinceId;
      state.popupProvinceId = element.dataset.provinceId;
      render();
    });
  });

  document.querySelectorAll('[data-logistics-outcome-filter]').forEach((element) => {
    element.addEventListener('click', () => {
      state.logisticsOutcomeSeverityFilter = element.dataset.logisticsOutcomeFilter ?? 'all';
      render();
    });
  });

  document.querySelectorAll('[data-logistics-route-summary]').forEach((element) => {
    element.addEventListener('click', () => {
      const routeId = element.dataset.logisticsRouteSummary;
      if (!routeId) {
        return;
      }
      state.selectedLogisticsOutcomeRouteId = routeId;
      state.selectedRouteId = routeId;
      state.hoveredRouteId = routeId;
      state.activeOverlaySlot = 'economy-overlay';
      state.lastTurnSummary = `Route logistique sélectionnée depuis le résumé: ${element.dataset.logisticsRouteLabel ?? routeId}. Les routes non concernées sont atténuées.`;
      render();
    });
  });

  document.querySelectorAll('[data-logistics-outcome-marker]').forEach((element) => {
    element.addEventListener('click', (event) => {
      event.stopPropagation();
      const marker = state.logisticsOutcomeMarkers.find((candidate) => candidate.markerId === element.dataset.logisticsOutcomeMarker);
      if (!marker) {
        return;
      }
      state.selectedProvinceId = marker.provinceId;
      state.focusedProvinceId = marker.provinceId;
      state.popupProvinceId = marker.provinceId;
      state.selectedRouteId = marker.routeId;
      state.hoveredRouteId = marker.routeId;
      state.selectedLogisticsOutcomeRouteId = marker.routeId;
      state.activeOverlaySlot = 'economy-overlay';
      state.mobilePanelSection = 'details';
      state.lastTurnSummary = `${marker.label}: ${(marker.details ?? [marker]).map((detail) => detail.detail).join(' | ')} (${marker.summaryLink}).`;
      render();
    });
  });

  document.querySelectorAll('[data-overlay-slot]').forEach((element) => {
    element.addEventListener('click', () => {
      state.activeOverlaySlot = element.dataset.overlaySlot;
      render();
    });
  });

  document.querySelectorAll('[data-city-id]').forEach((element) => {
    element.addEventListener('mouseenter', () => {
      state.hoveredCityId = element.dataset.cityId;
      render();
    });

    element.addEventListener('click', () => {
      const cityId = element.dataset.cityId;
      state.selectedCityId = cityId;
      state.hoveredCityId = cityId;

      if (state.comparedCityIds.includes(cityId)) {
        state.comparedCityIds = [cityId, ...state.comparedCityIds.filter((candidate) => candidate !== cityId)].slice(0, 3);
      } else {
        state.comparedCityIds = [...state.comparedCityIds, cityId].slice(-3);
      }

      render();
    });
  });

  document.querySelectorAll('[data-compare-city-id]').forEach((element) => {
    element.addEventListener('click', () => {
      const cityId = element.dataset.compareCityId;
      const exists = state.comparedCityIds.includes(cityId);

      if (exists) {
        state.comparedCityIds = state.comparedCityIds.filter((candidate) => candidate !== cityId);
      } else {
        state.comparedCityIds = [...state.comparedCityIds, cityId].slice(-3);
      }

      state.selectedCityId = cityId;
      state.hoveredCityId = cityId;
      render();
    });
  });

  document.querySelectorAll('[data-route-id]').forEach((element) => {
    element.addEventListener('mouseenter', () => {
      state.hoveredRouteId = element.dataset.routeId;
      render();
    });

    element.addEventListener('click', () => {
      state.selectedRouteId = element.dataset.routeId;
      state.hoveredRouteId = element.dataset.routeId;
      render();
    });
  });

  document.querySelectorAll('[data-economy-readiness-focus]').forEach((element) => {
    element.addEventListener('click', () => {
      const provinceId = element.dataset.provinceId;
      const routeId = element.dataset.routeId;
      const cityId = element.dataset.cityId;
      const readinessTone = element.dataset.readinessTone ?? 'warning';
      state.activeOverlaySlot = 'economy-overlay';
      state.selectedProvinceId = provinceId;
      state.focusedProvinceId = provinceId;
      state.popupProvinceId = provinceId;
      state.readinessFocusProvinceId = provinceId;
      state.readinessFocusTone = readinessTone;
      state.economyReadinessFocus = {
        provinceId,
        routeId,
        cityId,
        tone: readinessTone,
        blocker: element.dataset.blockerLabel ?? 'logistique',
        summary: element.dataset.mapSummary ?? 'contrainte économie/logistique',
        effect: element.dataset.nextTurnEffect ?? 'Effet à surveiller au prochain tour.',
      };

      if (routeId) {
        state.selectedRouteId = routeId;
        state.hoveredRouteId = routeId;
      }

      if (cityId) {
        state.selectedCityId = cityId;
        state.hoveredCityId = cityId;
      }

      const viewport = document.querySelector('.map-viewport');
      centerMapOnProvince(provinceId, viewport);
      render();
    });
  });

  document.querySelectorAll('[data-climate-preparedness-focus]').forEach((element) => {
    element.addEventListener('click', () => {
      const provinceId = element.dataset.provinceId;
      state.activeOverlaySlot = 'climate-overlay';
      state.selectedProvinceId = provinceId;
      state.focusedProvinceId = provinceId;
      state.popupProvinceId = provinceId;
      state.mobilePanelSection = element.dataset.climateFocusType === 'mitigation' ? 'details' : 'overlay';

      const viewport = document.querySelector('.map-viewport');
      centerMapOnProvince(provinceId, viewport);
      render();
    });
  });

  document.querySelectorAll('[data-undo-recommended-action]').forEach((element) => {
    element.addEventListener('click', () => {
      const provinceId = element.dataset.provinceId;
      const queuedAction = state.acceptedRecommendedMilitaryAction;

      if (!queuedAction || queuedAction.provinceId !== provinceId) {
        return;
      }

      state.acceptedRecommendedMilitaryAction = null;
      state.selectedProvinceId = provinceId;
      state.focusedProvinceId = provinceId;
      state.lastTurnSummary = `${queuedAction.actionCode} retiré de la file militaire avant résolution.`;
      render();
    });
  });

  document.querySelectorAll('[data-queue-recommended-action]').forEach((element) => {
    element.addEventListener('click', () => {
      const provinceId = element.dataset.provinceId;
      const actionCode = element.dataset.actionCode;
      const shell = getShell();
      const province = shell.provinces.find((candidate) => candidate.provinceId === provinceId) ?? null;

      if (!province || !actionCode) {
        return;
      }

      state.acceptedRecommendedMilitaryAction = {
        provinceId,
        provinceLabel: province.label,
        actionCode,
        turn: state.turn,
      };
      state.selectedProvinceId = provinceId;
      state.focusedProvinceId = provinceId;
      state.readinessFocusProvinceId = provinceId;
      state.readinessFocusTone = 'ready';
      state.lastTurnSummary = `${actionCode} ajouté à la file militaire depuis la carte pour ${province.label}.`;
      render();
    });
  });

  document.querySelectorAll('[data-queue-climate-intervention]').forEach((element) => {
    element.addEventListener('click', () => {
      const provinceId = element.dataset.provinceId;
      const actionCode = element.dataset.climateActionCode;
      const shell = getShell();
      const province = shell.provinces.find((candidate) => candidate.provinceId === provinceId);
      if (!province || state.queuedClimateInterventions.some((entry) => entry.actionCode === actionCode || entry.provinceId === provinceId)) {
        return;
      }
      const focusContext = { focusedProvinceId: provinceId, focusedProvince: province, neighborIds: new Set(province.neighborIds) };
      const actionQueue = buildSelectedProvinceActionQueue(province, shell, focusContext, buildIntrigueView(shell));
      const forecast = buildProvinceClimateRiskReductionForecast(province, shell);
      const plan = buildClimateInterventionQueuePlan(province, forecast, actionQueue, state.queuedClimateInterventions);
      if (plan.disabled) {
        return;
      }
      state.queuedClimateInterventions = state.queuedClimateInterventions.concat(buildClimateInterventionQueueEntry(province, plan));
      state.selectedProvinceId = provinceId;
      state.focusedProvinceId = provinceId;
      state.activeOverlaySlot = 'climate-overlay';
      state.lastTurnSummary = `Intervention climat planifiée: ${actionCode} sur ${province.label}. Vérifiez deadline, tradeoff et risque résiduel avant validation du tour.`;
      render();
    });
  });

  document.querySelectorAll('[data-culture-queue-action]').forEach((element) => {
    element.addEventListener('click', () => {
      const provinceId = element.dataset.cultureQueueRegion;
      const actionCode = element.dataset.cultureQueueAction;
      const shell = getShell();
      const province = shell.provinces.find((candidate) => candidate.provinceId === provinceId);
      if (!province || !actionCode || state.queuedCultureActions.some((entry) => entry.actionCode === actionCode)) {
        return;
      }

      state.queuedCultureActions = state.queuedCultureActions.concat({
        actionCode,
        label: element.dataset.cultureQueueLabel ?? 'Action culturelle',
        provinceId,
        priority: 2,
        orderCost: '1 ordre culturel',
        mainRisk: element.dataset.cultureQueueSummary ?? 'Effet culturel à confirmer.',
        expectedResult: element.dataset.cultureQueueSummary ?? 'Stabilité culturelle préparée avant résolution.',
        status: 'ready',
        tone: 'ready',
      });
      state.selectedProvinceId = provinceId;
      state.focusedProvinceId = provinceId;
      state.activeOverlaySlot = 'culture-overlay';
      state.mobilePanelSection = 'details';
      state.lastTurnSummary = `Action culturelle planifiée: ${element.dataset.cultureQueueLabel ?? actionCode} sur ${province.label}. Vous pouvez la retirer avant validation du tour.`;
      render();
    });
  });

  document.querySelectorAll('[data-culture-undo-action]').forEach((element) => {
    element.addEventListener('click', () => {
      const actionCode = String(element.dataset.cultureUndoAction ?? '').replace(/^undo:/, '');
      if (!actionCode) {
        return;
      }

      state.queuedCultureActions = state.queuedCultureActions.filter((entry) => entry.actionCode !== actionCode);
      state.lastTurnSummary = 'Action culturelle retirée de la file avant résolution du tour.';
      render();
    });
  });

  document.querySelectorAll('[data-undo-climate-intervention]').forEach((element) => {
    element.addEventListener('click', () => {
      const actionCode = element.dataset.climateActionCode;
      const removed = [...state.queuedClimateInterventions].reverse()
        .find((entry) => !actionCode || entry.actionCode === actionCode) ?? null;
      if (!removed) {
        return;
      }
      state.queuedClimateInterventions = state.queuedClimateInterventions.filter((entry) => entry !== removed);
      state.selectedProvinceId = removed.provinceId;
      state.focusedProvinceId = removed.provinceId;
      state.activeOverlaySlot = 'climate-overlay';
      state.lastTurnSummary = `Intervention climat annulée: ${removed.actionCode} sur ${removed.provinceLabel ?? removed.provinceId}.`;
      render();
    });
  });

  document.querySelectorAll('[data-next-turn]').forEach((element) => {
    element.addEventListener('click', () => {
      advanceTurn();
      render();
    });
  });

  document.querySelectorAll('[data-open-launcher]').forEach((element) => {
    element.addEventListener('click', () => {
      state.screen = 'launcher';
      render();
    });
  });

  document.querySelectorAll('[data-mobile-panel]').forEach((element) => {
    element.addEventListener('click', () => {
      state.mobilePanelSection = element.dataset.mobilePanel;
      render();
    });
  });

  document.querySelectorAll('[data-mobile-map-toggle]').forEach((element) => {
    element.addEventListener('click', () => {
      state.mobileMapExpanded = !state.mobileMapExpanded;
      render();
    });
  });

  document.querySelectorAll('[data-military-outcome-filter]').forEach((element) => {
    element.addEventListener('click', () => {
      const tone = element.dataset.militaryOutcomeFilter;
      state.militaryOutcomeMarkerFilters[tone] = state.militaryOutcomeMarkerFilters[tone] === false;
      render();
    });
  });

  document.querySelectorAll('[data-map-zoom]').forEach((element) => {
    element.addEventListener('click', () => {
      setMapZoom(state.mapZoom + (element.dataset.mapZoom === 'in' ? 0.2 : -0.2));
      render();
    });
  });

  document.querySelectorAll('[data-map-pan]').forEach((element) => {
    element.addEventListener('click', () => {
      const viewport = document.querySelector('.map-viewport');

      if (element.dataset.mapPan === 'selection') {
        centerMapOnProvince(state.selectedProvinceId, viewport);
      } else {
        resetMapViewport();
      }

      render();
    });
  });

  document.querySelectorAll('[data-map-stage]').forEach((stage) => {
    const viewport = stage.querySelector('.map-viewport');
    let dragState = null;

    stage.addEventListener('wheel', (event) => {
      event.preventDefault();
      setMapZoom(state.mapZoom + (event.deltaY < 0 ? 0.1 : -0.1));
      render();
    }, { passive: false });

    stage.addEventListener('keydown', (event) => {
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        setMapZoom(state.mapZoom + 0.2);
        render();
      }

      if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        setMapZoom(state.mapZoom - 0.2);
        render();
      }

      if (event.key === '0' || event.key.toLowerCase() === 'r') {
        event.preventDefault();
        resetMapViewport();
        render();
      }

      if (event.key.toLowerCase() === 'c') {
        event.preventDefault();
        centerMapOnProvince(state.selectedProvinceId, viewport);
        render();
      }
    });

    stage.addEventListener('mousedown', (event) => {
      if (state.mapZoom <= 1) {
        return;
      }
      dragState = {
        startX: event.clientX,
        startY: event.clientY,
        originX: state.mapPanX,
        originY: state.mapPanY,
      };
      stage.classList.add('is-dragging');
    });

    stage.addEventListener('mousemove', (event) => {
      if (!dragState || !viewport) {
        return;
      }
      state.mapPanX = dragState.originX + (event.clientX - dragState.startX);
      state.mapPanY = dragState.originY + (event.clientY - dragState.startY);
      clampMapPan();
      viewport.style.transform = getMapViewportTransform();
    });

    const stopDragging = () => {
      dragState = null;
      stage.classList.remove('is-dragging');
    };

    stage.addEventListener('mouseleave', stopDragging);
    stage.addEventListener('mouseup', stopDragging);
  });


  document.querySelectorAll('[data-culture-tension-filter]').forEach((element) => {
    element.addEventListener('click', () => {
      const key = element.dataset.cultureTensionFilter;
      if (!key) {
        return;
      }

      state.cultureTensionFilters[key] = state.cultureTensionFilters[key] === false;
      state.activeOverlaySlot = 'culture-overlay';
      render();
    });
  });

  document.querySelectorAll('[data-culture-tension-jump]').forEach((element) => {
    element.addEventListener('click', () => {
      const provinceId = element.dataset.cultureTensionJump;
      const shell = getShell();
      const province = shell.provinces.find((candidate) => candidate.provinceId === provinceId);

      if (!province) {
        return;
      }

      state.selectedProvinceId = provinceId;
      state.focusedProvinceId = provinceId;
      state.activeOverlaySlot = 'culture-overlay';
      state.mobilePanelSection = 'overlay';
      const viewport = document.querySelector('.map-viewport');
      centerMapOnProvince(provinceId, viewport);
      render();
    });
  });

  document.querySelectorAll('[data-culture-focus-region]').forEach((element) => {
    element.addEventListener('click', () => {
      const provinceId = element.dataset.cultureFocusRegion;
      state.selectedProvinceId = provinceId;
      state.focusedProvinceId = provinceId;
      state.popupProvinceId = provinceId;
      state.activeOverlaySlot = 'culture';
      state.mobilePanelSection = element.dataset.cultureFocusType === 'timeline' ? 'details' : 'overlay';
      render();
    });
  });

  document.querySelectorAll('[data-popup-action]').forEach((element) => {
    element.addEventListener('click', () => {
      const provinceId = element.dataset.provinceId;
      const action = element.dataset.popupAction;

      if (action === 'focus') {
        state.focusedProvinceId = provinceId;
      }

      if (action === 'details') {
        state.selectedProvinceId = provinceId;
        state.focusedProvinceId = provinceId;
      }

      if (action === 'compare') {
        state.comparisonProvinceIds = [...new Set([state.selectedProvinceId, provinceId])].filter(Boolean).slice(0, 2);
      }

      render();
    });
  });

  document.querySelectorAll('[data-intrigue-location]').forEach((element) => {
    element.addEventListener('click', () => {
      const provinceId = element.dataset.intrigueLocation;
      state.selectedProvinceId = provinceId;
      state.focusedProvinceId = provinceId;
      state.popupProvinceId = provinceId;
      const provinceOperation = intrigueOperations.find((operation) => operation.theaterId === provinceId && !operation.isResolved);
      if (provinceOperation) {
        state.selectedIntrigueOperationId = provinceOperation.id;
      }
      render();
    });
  });

  document.querySelectorAll('[data-intrigue-operation-id]').forEach((element) => {
    element.addEventListener('click', () => {
      state.selectedIntrigueOperationId = element.dataset.intrigueOperationId;
      render();
    });
  });

  document.querySelectorAll('[data-economy-filter]').forEach((element) => {
    element.addEventListener('click', () => {
      const key = element.dataset.economyFilter;
      state.economyFilters[key] = !state.economyFilters[key];
      render();
    });
  });

  document.querySelectorAll('[data-logistics-queue-action]').forEach((element) => {
    element.addEventListener('click', () => {
      const actionId = element.dataset.logisticsQueueAction;
      if (!actionId || element.disabled) {
        return;
      }

      const shell = getShell();
      const province = shell.provinces.find((candidate) => candidate.provinceId === state.selectedProvinceId) ?? null;
      const economyView = getEconomyViewModel();
      const preview = province ? buildProvinceLogisticsChoicePreviewView(province, economyView) : null;
      const action = preview?.primaryLogisticsAction;
      if (!action || action.disabled) {
        return;
      }

      state.queuedLogisticsActions = [
        ...state.queuedLogisticsActions.filter((entry) => entry.actionId !== action.actionId),
        {
          actionId: action.actionId,
          provinceId: state.selectedProvinceId,
          routeId: action.routeId,
          choiceId: action.choiceId,
          label: action.label,
          status: action.status,
          target: action.target,
          bottleneckRelieved: action.bottleneckRelieved,
          downstreamEffect: action.downstreamEffect,
        },
      ];
      state.mobilePanelSection = 'details';
      render();
    });
  });

  document.querySelectorAll('[data-logistics-undo-last]').forEach((element) => {
    element.addEventListener('click', () => {
      const actionId = element.dataset.logisticsUndoLast;
      if (!actionId) {
        return;
      }

      const lastIndex = state.queuedLogisticsActions.map((entry) => entry.actionId).lastIndexOf(actionId);
      if (lastIndex < 0) {
        return;
      }

      state.queuedLogisticsActions = state.queuedLogisticsActions.filter((_, index) => index !== lastIndex);
      state.mobilePanelSection = 'details';
      render();
    });
  });

  document.querySelectorAll('[data-intrigue-filter]').forEach((element) => {
    element.addEventListener('click', () => {
      const key = element.dataset.intrigueFilter;
      state.intrigueFilters[key] = !state.intrigueFilters[key];
      render();
    });
  });

  document.querySelectorAll('[data-intrigue-exposure-filter]').forEach((element) => {
    element.addEventListener('click', () => {
      const key = element.dataset.intrigueExposureFilter;
      state.intrigueExposureOutcomeFilters[key] = !state.intrigueExposureOutcomeFilters[key];
      render();
    });
  });

  document.querySelectorAll('[data-atlas-intrigue-signal-filter]').forEach((element) => {
    element.addEventListener('click', () => {
      const key = element.dataset.atlasIntrigueSignalFilter;
      state.atlasIntrigueSignalFilters[key] = !state.atlasIntrigueSignalFilters[key];
      render();
    });
  });

  document.querySelectorAll('[data-atlas-climate-forecast-mode]').forEach((element) => {
    element.addEventListener('click', () => {
      state.atlasClimateForecastMode = element.dataset.atlasClimateForecastMode ?? 'current';
      state.activeOverlaySlot = 'climate-overlay';
      render();
    });
  });

  document.querySelectorAll('[data-atlas-conflict-playback-step]').forEach((element) => {
    element.addEventListener('click', () => {
      state.atlasConflictPlaybackStep = Math.max(0, Math.min(2, Number(element.dataset.atlasConflictPlaybackStep) || 0));
      render();
    });
  });

  document.querySelectorAll('[data-atlas-conflict-comparison-mode]').forEach((element) => {
    element.addEventListener('click', () => {
      state.atlasConflictComparisonMode = element.dataset.atlasConflictComparisonMode ?? 'current';
      render();
    });
  });

  document.querySelectorAll('[data-atlas-military-outcome-option]').forEach((element) => {
    element.addEventListener('click', () => {
      state.selectedAtlasMilitaryOutcomeOptionId = element.dataset.atlasMilitaryOutcomeOption ?? null;
      render();
    });
  });

  document.querySelectorAll('[data-popup-close]').forEach((element) => {
    element.addEventListener('click', () => {
      state.popupProvinceId = null;
      render();
    });
  });
}

render();
