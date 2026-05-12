import { GenerateStrategicMap } from '../src/application/war/GenerateStrategicMap.js';
import { Province } from '../src/domain/war/Province.js';
import { City } from '../src/domain/economy/City.js';
import { TradeRoute } from '../src/domain/economy/TradeRoute.js';
import { buildEconomySeedFromStrategicMap } from '../src/application/economy/BuildEconomySeedFromStrategicMap.js';
import { buildStrategicMapShell } from '../src/ui/war/StrategicMapShell.js';
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
  activeOverlaySlot: 'culture-overlay',
  popupProvinceId: 'river-gate',
  hoveredCityId: 'river-gate-city',
  selectedCityId: 'river-gate-city',
  hoveredRouteId: null,
  selectedRouteId: null,
  comparedCityIds: ['river-gate-city', 'crown-port'],
  comparisonProvinceIds: ['river-gate', 'crown-heart'],
  mobilePanelSection: 'details',
  mobileMapExpanded: true,
  mapZoom: 1,
  mapPanX: 0,
  mapPanY: 0,
  lastTurnSummary: 'Le théâtre reste sous tension, sans bascule majeure.',
  selectedIntrigueOperationId: 'op-river-ashes',
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
  state.mapZoom = 1;
  state.mapPanX = 0;
  state.mapPanY = 0;
  state.mobilePanelSection = 'details';
  state.mobileMapExpanded = true;
  state.hoveredProvinceId = null;
  state.hoveredRouteId = null;
  state.selectedRouteId = null;
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

function renderProvinceSurface(shell, focusContext) {
  return `
    <svg class="province-surface-layer" viewBox="0 0 100 100" aria-label="Surface continue des provinces">
      ${shell.provinces.map((province) => {
        const isNeighbor = focusContext.neighborIds.has(province.provinceId);
        const isSelected = province.selectionState.selected;
        const isFocused = province.selectionState.focused;
        const isHovered = province.selectionState.hovered;
        const isMuted = !isSelected && !isFocused && !isHovered && !isNeighbor && (focusContext.selectedProvince || focusContext.focusedProvince || focusContext.hoveredProvince);
        return `
          <g class="province-surface ${isSelected ? 'is-selected' : ''} ${isFocused ? 'is-focused' : ''} ${isHovered ? 'is-hovered' : ''} ${isNeighbor ? 'is-neighbor' : ''} ${isMuted ? 'is-muted' : ''} ${province.contested ? 'is-contested' : ''} ${province.occupied ? 'is-occupied' : ''}" style="--province-fill:${province.style.fill};--province-border:${province.style.border};">
            <polygon class="province-surface__glow" points="${province.geometry.polygon ?? getProvincePolygon(province.provinceId)}"></polygon>
            <polygon class="province-surface__core" points="${province.geometry.polygon ?? getProvincePolygon(province.provinceId)}"></polygon>
            <polygon class="province-surface__hairline" points="${province.geometry.polygon ?? getProvincePolygon(province.provinceId)}"></polygon>
          </g>
        `;
      }).join('')}
    </svg>
  `;
}

function renderProvinceCard(province, focusContext) {
  const layout = province.geometry.layout ?? getProvinceLayout(province.provinceId);
  const badges = province.badges.map((badge) => `<span class="province-badge">${badge}</span>`).join('');
  const isNeighbor = focusContext.neighborIds.has(province.provinceId);
  const isSelected = province.selectionState.selected;
  const isFocused = province.selectionState.focused;
  const isHovered = province.selectionState.hovered;
  const isMuted = !isSelected && !isFocused && !isHovered && !isNeighbor && (focusContext.selectedProvince || focusContext.focusedProvince || focusContext.hoveredProvince);
  const tacticalState = province.contested ? 'front contesté' : province.occupied ? 'occupation' : 'contrôle stable';
  const selectionSignal = isSelected ? 'ACTIF' : isHovered ? 'SURVOL' : isFocused ? 'FOCUS' : isNeighbor ? 'VOISIN' : 'SCAN';
  const classes = [
    'province-node',
    isSelected ? 'is-selected' : '',
    isFocused ? 'is-focused' : '',
    isHovered ? 'is-hovered' : '',
    isNeighbor ? 'is-neighbor' : '',
    isMuted ? 'is-muted' : '',
    province.contested ? 'is-contested' : '',
    province.occupied ? 'is-occupied' : '',
  ].filter(Boolean).join(' ');

  return `
    <button
      class="${classes}"
      type="button"
      data-province-id="${province.provinceId}"
      data-tactical-state="${tacticalState}"
      style="left:${layout.x}%;top:${layout.y}%;width:${layout.w}%;height:${layout.h}%;--province-fill:${province.style.fill};--province-border:${province.style.border};--province-shape:${getProvinceShape(province.provinceId)};"
      aria-pressed="${province.selectionState.selected}"
      aria-label="${province.label}, ${tacticalState}, approvisionnement ${province.supplyTone}, loyauté ${province.loyalty}"
    >
      <span class="province-node__terrain"></span>
      <span class="province-node__focus-rail"></span>
      <span class="province-node__signal">${selectionSignal}</span>
      <span class="province-node__name">${province.label}</span>
      <span class="province-node__meta">${province.supplyTone} · loyauté ${province.loyalty}</span>
      <span class="province-node__badges">${badges}</span>
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
        <span class="culture-unlock-hint culture-unlock-hint--${hint.status} culture-unlock-hint--${hint.tone}" title="${hint.explanation}">
          <b>${hint.status}</b>
          <small>${hint.label} · ${hint.cultureName}</small>
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
      ${report.reminders.length > 0 ? `
        <div class="culture-opportunity-reminder-list">
          ${report.reminders.map((reminder) => `
            <article class="culture-opportunity-reminder culture-opportunity-reminder--${reminder.tone}">
              <span>${reminder.label}</span>
              <strong>${reminder.cultureName}</strong>
              <p>${reminder.summary}</p>
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
        score: (toneRank[stress.tone] ?? 0) * 100 + route.riskLevel + route.totalCapacity,
      };
    })
    .sort((left, right) => right.score - left.score || left.routeName.localeCompare(right.routeName))
    .slice(0, 3);
}

function renderProvinceLogisticsBottleneckComparison(province, economyView) {
  const comparisons = buildProvinceLogisticsBottleneckComparison(province, economyView);

  if (comparisons.length < 2) {
    return '';
  }

  return `
    <section class="province-logistics-comparison" aria-label="Comparatif des goulets logistiques">
      <div class="province-logistics-comparison__header">
        <strong>Goulets logistiques comparés</strong>
        <span>${comparisons.length} routes liées</span>
      </div>
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
  });
}

function renderProvinceLogisticsChoicePreview(province, economyView) {
  const preview = buildProvinceLogisticsChoicePreviewView(province, economyView);

  if (preview.options.length === 0) {
    return '';
  }

  return `
    <section class="province-logistics-choice-preview" aria-label="Aperçu reroutage et réparation logistique">
      <div class="province-logistics-choice-preview__header">
        <strong>Aperçu choix logistiques</strong>
        <span>${preview.options.length} options</span>
      </div>
      <p>${preview.summary}</p>
      <div class="province-logistics-choice-list">
        ${preview.options.map((option) => `
          <article class="province-logistics-choice province-logistics-choice--${option.tone} ${option.recommended ? 'is-recommended' : ''}">
            <div class="province-logistics-choice__title">
              <strong>${option.action}</strong>
              <span>${option.recommended ? 'recommandé' : option.delay}</span>
            </div>
            <p>${option.impact}</p>
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

      return {
        provinceId: province.provinceId,
        provinceLabel: province.label,
        tone: urgentBlocker?.tone ?? 'safe',
        status: urgentBlocker?.status ?? mitigation.status,
        label: urgentBlocker?.label ?? mitigation.label,
        hazard: urgentBlocker?.hazard ?? mitigation.hazard,
        action: urgentBlocker?.trigger ?? mitigation.trigger,
        detail: urgentBlocker?.detail ?? mitigation.detail,
        priority: urgentBlocker?.priority ?? 4,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.priority - right.priority || left.provinceLabel.localeCompare(right.provinceLabel))
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
          <li class="map-climate-preparedness__item map-climate-preparedness__item--${warning.tone}">
            <b>${warning.provinceLabel}</b>
            <span>${warning.status}: ${warning.hazard}</span>
            <small>${warning.action} · ${warning.label}</small>
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
          ${readiness.warnings.map((warning) => `
            <li class="economy-readiness-warning economy-readiness-warning--${warning.tone}">
              <b>${warning.label}</b>
              <span>${warning.detail}</span>
            </li>
          `).join('')}
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

function renderSelectedProvinceActionQueue(province, shell, focusContext, intrigueView = null) {
  const actionQueue = buildSelectedProvinceActionQueue(province, shell, focusContext, intrigueView);
  const resolution = summarizeTurnResolutionPreview(province, actionQueue);
  const intrigueWarnings = renderProvinceIntrigueRiskWarnings(province, actionQueue, intrigueView);
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

      return {
        provinceId: province.provinceId,
        provinceLabel: province.label,
        actionCode: plannedAction?.actionCode ?? 'WAR-HOLD',
        actionLabel: plannedAction?.label ?? 'Aucune action planifiée',
        tone: blockedCount > 0 || outcome.tone === 'danger' ? 'danger' : riskyCount > 0 || outcome.tone === 'warning' ? 'warning' : 'ready',
        score,
        detail: outcome.tone === 'danger'
          ? `${outcome.title}: défense et ravitaillement restent mal couverts.`
          : outcome.tone === 'warning'
            ? `${outcome.title}: confirmer seulement avec appui adjacent.`
            : `${outcome.title}: couverture suffisante avant fin de tour.`,
      };
    })
    .sort((left, right) => right.score - left.score || left.provinceLabel.localeCompare(right.provinceLabel))
    .slice(0, 3);
}

function renderConflictReadinessWarnings(shell, intrigueView = null) {
  const warnings = buildConflictReadinessWarnings(shell, intrigueView);

  return `
    <div class="conflict-readiness-summary" aria-label="Préparation conflit avant fin de tour">
      <div class="conflict-readiness-summary__header">
        <strong>Préparation conflit</strong>
        <span>${warnings.length} points clés</span>
      </div>
      <div class="conflict-readiness-summary__list">
        ${warnings.map((warning) => `
          <article class="conflict-readiness-warning conflict-readiness-warning--${warning.tone}">
            <div>
              <strong>${warning.provinceLabel}</strong>
              <span>${warning.actionCode} · ${warning.actionLabel}</span>
            </div>
            <p>${warning.detail}</p>
          </article>
        `).join('')}
      </div>
    </div>
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
      ${renderConflictOutcomePreview(province, shell)}
      ${renderSelectedProvinceActionQueue(province, shell, focusContext, intrigueView)}
      ${renderMilitaryPlanImpactSummary(province, shell, focusContext, intrigueView)}
      ${renderCultureOpportunityEndTurnSummary(province, shell, focusContext, intrigueView)}
      ${renderProvinceEconomyBudgetPreview(province, economyView, shell, focusContext, intrigueView)}
      ${renderResolvedConflictDeltas(province, shell, focusContext, intrigueView)}
      ${renderIntrigueTurnReportDeltas(province, intrigueView)}
      ${renderProvinceClimateTurnReport(province)}
      <div class="context-summary">
        <strong>Comparaison rapide</strong>
        <p>${comparedProvinceNames.length > 0 ? comparedProvinceNames.join(' vs ') : 'Aucune province comparée pour le moment.'}</p>
      </div>
      ${renderProvinceEconomyConsequences(province, economyView)}
      ${renderProvinceEconomyTurnReport(province, economyView)}
      ${renderProvinceLogisticsBottleneckComparison(province, economyView)}
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

  return {
    overlay,
    panel,
    seeds,
    selectedRegionId,
    selectedMarkers,
    selectedMarker,
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

function renderCultureMapOverlay(cultureView) {
  const active = state.activeOverlaySlot === 'culture-overlay';
  const markerEntries = active
    ? cultureView.overlay
    : cultureView.overlay.filter((entry) => entry.dominantInRegion || entry.regionId === state.selectedProvinceId);
  const clusterSummaries = buildCultureClusterSummaries(markerEntries);
  const clusteredRegionIds = new Set(clusterSummaries.flatMap((cluster) => cluster.regionIds));
  const markerNodes = markerEntries.map((entry) => renderCultureMarker(entry, active, clusteredRegionIds)).join('');
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
      ${clusterNodes}
      ${discoveryLinks}
    </svg>
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
      ${renderCultureRecommendationPanel(recommendationView)}
      ${renderCultureLocalTimeline(localTimelineView)}
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
    const stress = getRouteStressSummary(route, tensionByCityId, cityNameById);

    return `
      <g class="economy-route-group ${visual.classes} ${tensionClass} ${emphasizeRoute ? 'is-emphasized' : 'is-muted'} ${routeFiltered ? 'is-filtered' : ''} ${routeFocused ? 'is-focused' : ''}" data-route-id="${route.routeId}" aria-label="${routeFiltered ? 'Route secondaire atténuée par filtre' : 'Route économie visible'}: ${stress.summary}">
        <title>${route.routeName}: ${stress.headline} — ${stress.summary}</title>
        <path class="economy-route-hitbox" d="${visual.pathD}" pathLength="100" />
        <path class="economy-route__halo" d="${visual.pathD}" pathLength="100" />
        <path class="economy-route__casing" d="${visual.pathD}" pathLength="100" />
        <path class="economy-route__line" d="${visual.pathD}" pathLength="100" marker-end="url(#${visual.markerId})" />
        <path class="economy-route__flow" d="${visual.pathD}" pathLength="100" />
        ${renderRouteHudMarkers(route, visual, { compact: !emphasizeRoute || routeFiltered })}
        ${routeFocused ? renderRouteStressBadge(route, stress, visual) : ''}
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
    const expandResources = isSelected || tension === 'high';
    const keepResourceWarning = tension === 'high';
    const showResources = keepResourceWarning || (filters.resourceMarkers && (expandResources || city.capital || isHub));
    const showCityLabels = filters.cityLabels && (isSelected || city.capital || isHub || tension !== 'low');

    return `
      <g class="economy-city-group ${isSelected ? 'is-selected' : ''} ${city.capital ? 'is-capital' : ''} ${isHub ? 'is-hub' : ''} is-${tension}-tension ${!filters.resourceMarkers && showResources ? 'has-forced-resource-warning' : ''}" data-city-id="${city.cityId}">
        <circle class="economy-city-tension-ring" cx="${position.x}%" cy="${position.y}%" r="${city.marker.size * 9.2}" />
        ${city.capital ? `<circle class="economy-city-capital-ring" cx="${position.x}%" cy="${position.y}%" r="${city.marker.size * 10.8}" />` : ''}
        ${isHub ? `<rect class="economy-city-hub-frame" x="calc(${position.x}% - ${city.marker.size * 7.4}px)" y="calc(${position.y}% - ${city.marker.size * 7.4}px)" width="${city.marker.size * 14.8}" height="${city.marker.size * 14.8}" rx="${city.marker.size * 3.2}" ry="${city.marker.size * 3.2}" />` : ''}
        <circle class="economy-city economy-city--${city.marker.tone}" cx="${position.x}%" cy="${position.y}%" r="${city.marker.size * 6.6}" />
        ${city.capital ? `<text class="economy-city-glyph" x="${position.x}%" y="calc(${position.y}% + 1px)" text-anchor="middle">★</text>` : isHub ? `<text class="economy-city-glyph" x="${position.x}%" y="calc(${position.y}% + 1px)" text-anchor="middle">◆</text>` : ''}
        ${showResources ? renderResourceHudBadges(city, position, { expanded: expandResources && filters.resourceMarkers }) : ''}
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
  if (state.activeOverlaySlot !== 'intrigue-overlay') {
    const criticalSignals = intrigueView.map.entries.filter((entry) => entry.sabotageRiskLevel === 'high' || entry.metrics.exposedCellCount > 0);

    if (criticalSignals.length === 0) {
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
    </svg>
  `;
}

function renderIntrigueSidePanel(intrigueView) {
  if (state.activeOverlaySlot !== 'intrigue-overlay') {
    return null;
  }

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

function getMapRenderLayers(shell, economyView, focusContext, cultureView) {
  return [
    { key: 'backdrop', className: 'map-layer map-layer--backdrop', content: `<div class="map-backdrop"></div>${renderTacticalCoordinateGrid()}` },
    { key: 'terrain', className: 'map-layer map-layer--terrain', content: renderTerrainDecor() },
    { key: 'surface', className: 'map-layer map-layer--surface', content: renderProvinceSurface(shell, focusContext) },
    { key: 'relations', className: 'map-layer map-layer--relations', content: renderStrategicRelations(shell) },
    { key: 'labels', className: 'map-layer map-layer--labels', content: renderProvinceLabels(shell) },
    { key: 'anchors', className: 'map-layer map-layer--anchors', content: renderMapAnchorShells() },
    { key: 'economy', className: 'map-layer map-layer--economy', content: `${renderEconomyMapOverlay(economyView)}${renderCultureMapOverlay(cultureView)}` },
    { key: 'hud', className: 'map-layer map-layer--hud', content: `${renderCityQuickPanel(economyView)}<div class="focus-hint">${focusContext.selectedProvince ? `Sélection active, ${focusContext.selectedProvince.label}` : 'Survolez une province pour déplacer le focus'}</div>` },
    { key: 'interactions', className: 'map-layer map-layer--interactions', content: `${shell.provinces.map((province) => renderProvinceCard(province, focusContext)).join('')}${renderProvincePopup(shell)}` },
  ];
}

function renderMapLayerStack(shell, economyView, focusContext, cultureView) {
  return getMapRenderLayers(shell, economyView, focusContext, cultureView)
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
  state.turn += 1;
  state.seasonIndex = (state.seasonIndex + 1) % seasonLabels.length;

  const summaries = [
    'Les convois remontent depuis Couronne, mais la Porte du Fleuve reste fragile.',
    'Les lignes se réorganisent, la logistique se tend autour du front central.',
    'Les récoltes soulagent le sud, tandis que la pression remonte à la frontière est.',
    'Le froid coupe certains flux, les provinces exposées repassent en posture défensive.',
  ];

  state.lastTurnSummary = summaries[(state.turn - 2) % summaries.length];
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
          ${renderMapClimatePreparednessSummary(climatePreparednessSummary)}
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
          <div class="map-stage" data-map-stage="true" tabindex="0" aria-label="Carte opérationnelle zoomable. Utilisez plus, moins, zéro ou C pour naviguer.">
            ${renderMapControls()}
            <div class="map-viewport" style="transform:${getMapViewportTransform()};">
              ${renderMapLayerStack(shell, economyView, focusContext, cultureView)}
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

  document.querySelectorAll('[data-province-id]').forEach((element) => {
    element.addEventListener('mouseenter', () => {
      state.hoveredProvinceId = element.dataset.provinceId;
      state.focusedProvinceId = element.dataset.provinceId;
      render();
    });

    element.addEventListener('mouseleave', () => {
      state.hoveredProvinceId = null;
      state.focusedProvinceId = state.selectedProvinceId;
      render();
    });

    element.addEventListener('click', () => {
      state.hoveredProvinceId = null;
      state.focusedProvinceId = element.dataset.provinceId;
      state.selectedProvinceId = element.dataset.provinceId;
      state.popupProvinceId = element.dataset.provinceId;
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

  document.querySelectorAll('[data-intrigue-filter]').forEach((element) => {
    element.addEventListener('click', () => {
      const key = element.dataset.intrigueFilter;
      state.intrigueFilters[key] = !state.intrigueFilters[key];
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
