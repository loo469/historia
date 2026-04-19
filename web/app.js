import { Province } from '../src/domain/war/Province.js';
import { City } from '../src/domain/economy/City.js';
import { TradeRoute } from '../src/domain/economy/TradeRoute.js';
import { buildStrategicMapShell } from '../src/ui/war/StrategicMapShell.js';
import { buildEconomyMapOverlay } from '../src/ui/economy/buildEconomyMapOverlay.js';
import { buildCityStockPanel } from '../src/ui/economy/buildCityStockPanel.js';
import { buildCityComparisonPanel } from '../src/ui/economy/buildCityComparisonPanel.js';

const paletteByFaction = {
  aurora: { fill: '#2F6BFF', border: '#8FB3FF' },
  ember: { fill: '#E8572A', border: '#FFB394' },
  neutral: { fill: '#64748B', border: '#CBD5E1' },
};

const factionMetaById = {
  aurora: { label: 'Alliance d’Aurora' },
  ember: { label: 'Ligue d’Ember' },
  neutral: { label: 'Marches neutres' },
};

const provinceLayouts = {
  'north-watch': { x: 15, y: 18, w: 20, h: 18 },
  'crown-heart': { x: 38, y: 18, w: 23, h: 20 },
  'red-ridge': { x: 64, y: 16, w: 21, h: 22 },
  'river-gate': { x: 22, y: 46, w: 24, h: 20 },
  'iron-plain': { x: 50, y: 46, w: 26, h: 22 },
  'southern-reach': { x: 33, y: 72, w: 28, h: 18 },
};

const provinces = [
  new Province({
    id: 'north-watch',
    name: 'Veille du Nord',
    ownerFactionId: 'aurora',
    controllingFactionId: 'aurora',
    supplyLevel: 'stable',
    loyalty: 84,
    strategicValue: 5,
    neighborIds: ['crown-heart', 'river-gate'],
  }),
  new Province({
    id: 'crown-heart',
    name: 'Coeur de Couronne',
    ownerFactionId: 'aurora',
    controllingFactionId: 'aurora',
    supplyLevel: 'stable',
    loyalty: 78,
    strategicValue: 8,
    neighborIds: ['north-watch', 'red-ridge', 'river-gate', 'iron-plain'],
  }),
  new Province({
    id: 'red-ridge',
    name: 'Crête Rouge',
    ownerFactionId: 'ember',
    controllingFactionId: 'ember',
    supplyLevel: 'strained',
    loyalty: 58,
    strategicValue: 6,
    neighborIds: ['crown-heart', 'iron-plain'],
  }),
  new Province({
    id: 'river-gate',
    name: 'Porte du Fleuve',
    ownerFactionId: 'aurora',
    controllingFactionId: 'ember',
    supplyLevel: 'disrupted',
    loyalty: 39,
    strategicValue: 7,
    contested: true,
    neighborIds: ['north-watch', 'crown-heart', 'iron-plain', 'southern-reach'],
  }),
  new Province({
    id: 'iron-plain',
    name: 'Plaine de Fer',
    ownerFactionId: 'ember',
    controllingFactionId: 'ember',
    supplyLevel: 'strained',
    loyalty: 61,
    strategicValue: 4,
    neighborIds: ['crown-heart', 'red-ridge', 'river-gate', 'southern-reach'],
  }),
  new Province({
    id: 'southern-reach',
    name: 'Basses Marches',
    ownerFactionId: 'neutral',
    controllingFactionId: 'aurora',
    supplyLevel: 'collapsed',
    loyalty: 44,
    strategicValue: 3,
    neighborIds: ['river-gate', 'iron-plain'],
  }),
];

const overlayLabels = {
  'climate-overlay': 'Climat',
  'culture-overlay': 'Culture',
  'economy-overlay': 'Économie',
  'intrigue-overlay': 'Intrigue',
};

const cityLayoutsById = {
  'crown-port': { x: 49.5, y: 28, labelDx: 0, labelDy: -6 },
  'river-gate-city': { x: 34, y: 56, labelDx: -8, labelDy: 7 },
  'iron-plain-city': { x: 62, y: 55, labelDx: 8, labelDy: -6 },
  'southern-crossing': { x: 47, y: 79, labelDx: 0, labelDy: 8 },
};

const provinceLabelLayouts = {
  'north-watch': { x: 26, y: 20, align: 'middle', tone: 'standard' },
  'crown-heart': { x: 49.5, y: 18.5, align: 'middle', tone: 'capital' },
  'red-ridge': { x: 75, y: 18.5, align: 'middle', tone: 'standard' },
  'river-gate': { x: 21, y: 45, align: 'start', tone: 'frontier' },
  'iron-plain': { x: 80, y: 48, align: 'end', tone: 'standard' },
  'southern-reach': { x: 47, y: 91, align: 'middle', tone: 'frontier' },
};

const cities = [
  new City({
    id: 'crown-port',
    name: 'Port de Couronne',
    regionId: 'crown-heart',
    population: 145,
    prosperity: 78,
    stability: 72,
    stockByResource: { grain: 12, fish: 14, timber: 7 },
    tradeRouteIds: ['aurora-river', 'southern-grainway'],
    capital: true,
  }),
  new City({
    id: 'river-gate-city',
    name: 'Porte du Fleuve',
    regionId: 'river-gate',
    population: 102,
    prosperity: 49,
    stability: 37,
    stockByResource: { grain: 3, tools: 2, timber: 4 },
    tradeRouteIds: ['aurora-river', 'ember-foundry-line'],
  }),
  new City({
    id: 'iron-plain-city',
    name: 'Forge des Plaines',
    regionId: 'iron-plain',
    population: 93,
    prosperity: 57,
    stability: 52,
    stockByResource: { ore: 11, tools: 5, grain: 2 },
    tradeRouteIds: ['ember-foundry-line'],
  }),
  new City({
    id: 'southern-crossing',
    name: 'Passage du Sud',
    regionId: 'southern-reach',
    population: 81,
    prosperity: 43,
    stability: 41,
    stockByResource: { grain: 2, horses: 4, timber: 1 },
    tradeRouteIds: ['southern-grainway'],
  }),
];

const routes = [
  new TradeRoute({
    id: 'aurora-river',
    name: 'Artère fluviale',
    stopCityIds: ['crown-port', 'river-gate-city'],
    distance: 5,
    capacityByResource: { grain: 6, fish: 5, timber: 3 },
    transportMode: 'river',
    riskLevel: 24,
  }),
  new TradeRoute({
    id: 'ember-foundry-line',
    name: 'Ligne des fonderies',
    stopCityIds: ['river-gate-city', 'iron-plain-city'],
    distance: 4,
    capacityByResource: { ore: 5, tools: 3, grain: 2 },
    transportMode: 'land',
    riskLevel: 61,
  }),
  new TradeRoute({
    id: 'southern-grainway',
    name: 'Route des moissons',
    stopCityIds: ['crown-port', 'southern-crossing'],
    distance: 6,
    capacityByResource: { grain: 4, timber: 2, horses: 2 },
    transportMode: 'land',
    riskLevel: 42,
    active: false,
  }),
];

const desiredStockByCityId = {
  'crown-port': { grain: 10, fish: 10, timber: 5 },
  'river-gate-city': { grain: 9, tools: 4, timber: 5 },
  'iron-plain-city': { ore: 8, tools: 4, grain: 5 },
  'southern-crossing': { grain: 7, horses: 3, timber: 3 },
};

const state = {
  turn: 1,
  seasonIndex: 0,
  focusedProvinceId: 'crown-heart',
  selectedProvinceId: 'river-gate',
  activeOverlaySlot: 'economy-overlay',
  popupProvinceId: 'river-gate',
  hoveredCityId: 'river-gate-city',
  selectedCityId: 'river-gate-city',
  comparedCityIds: ['river-gate-city', 'crown-port'],
  comparisonProvinceIds: ['river-gate', 'crown-heart'],
  mobilePanelSection: 'details',
  mobileMapExpanded: true,
  mapZoom: 1,
  mapPanX: 0,
  mapPanY: 0,
  lastTurnSummary: 'Le théâtre reste sous tension, sans bascule majeure.',
};

const seasonLabels = ['Printemps', 'Été', 'Automne', 'Hiver'];

function getFocusContext(shell) {
  const selectedProvince = shell.provinces.find((province) => province.provinceId === state.selectedProvinceId) ?? null;
  const focusedProvince = shell.provinces.find((province) => province.provinceId === state.focusedProvinceId) ?? selectedProvince ?? null;
  const anchorProvince = selectedProvince ?? focusedProvince;
  const neighborIds = new Set(anchorProvince?.neighborIds ?? []);

  return {
    selectedProvince,
    focusedProvince,
    neighborIds,
  };
}

function getProvinceCenter(provinceId) {
  const layout = provinceLayouts[provinceId];

  if (!layout) {
    return null;
  }

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
  return buildStrategicMapShell(provinces.map(getProvinceStateByTurn), {
    title: 'Écran stratégique, théâtre continental',
    subtitle: 'Prototype local Alpha prêt à accueillir les overlays inter-domaines',
    paletteByFaction,
    factionMetaById,
    selectedProvinceId: state.selectedProvinceId,
    focusedProvinceId: state.focusedProvinceId,
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

const provincePolygonById = {
  'north-watch': '8,24 24,12 39,10 47,18 46,36 34,42 18,40 8,32',
  'crown-heart': '24,18 40,12 58,14 64,24 58,40 40,46 26,38 22,28',
  'red-ridge': '58,16 73,10 88,18 90,34 80,44 64,42 54,32 52,22',
  'river-gate': '38,38 54,34 66,40 68,54 56,66 40,64 32,52 34,42',
  'iron-plain': '60,44 78,42 90,52 88,68 72,78 56,72 54,56',
  'southern-reach': '24,58 42,54 58,58 64,74 48,88 28,86 16,72',
};

function getProvinceShape(provinceId) {
  const polygon = provincePolygonById[provinceId] ?? '12,12 88,12 88,88 12,88';
  return `polygon(${polygon.split(' ').map((point) => point.split(',').join('% ')).join('%, ') }%)`;
}

function renderProvinceSurface(shell, focusContext) {
  return `
    <svg class="province-surface-layer" viewBox="0 0 100 100" aria-label="Surface continue des provinces">
      ${shell.provinces.map((province) => {
        const isNeighbor = focusContext.neighborIds.has(province.provinceId);
        const isSelected = province.selectionState.selected;
        const isFocused = province.selectionState.focused;
        const isMuted = !isSelected && !isFocused && !isNeighbor && (focusContext.selectedProvince || focusContext.focusedProvince);
        return `
          <g class="province-surface ${isSelected ? 'is-selected' : ''} ${isFocused ? 'is-focused' : ''} ${isNeighbor ? 'is-neighbor' : ''} ${isMuted ? 'is-muted' : ''} ${province.contested ? 'is-contested' : ''} ${province.occupied ? 'is-occupied' : ''}">
            <polygon points="${provincePolygonById[province.provinceId]}" style="--province-fill:${province.style.fill};--province-border:${province.style.border};"></polygon>
          </g>
        `;
      }).join('')}
    </svg>
  `;
}

function renderProvinceCard(province, focusContext) {
  const layout = provinceLayouts[province.provinceId];
  const badges = province.badges.map((badge) => `<span class="province-badge">${badge}</span>`).join('');
  const isNeighbor = focusContext.neighborIds.has(province.provinceId);
  const isSelected = province.selectionState.selected;
  const isFocused = province.selectionState.focused;
  const isMuted = !isSelected && !isFocused && !isNeighbor && (focusContext.selectedProvince || focusContext.focusedProvince);
  const classes = [
    'province-node',
    isSelected ? 'is-selected' : '',
    isFocused ? 'is-focused' : '',
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
      style="left:${layout.x}%;top:${layout.y}%;width:${layout.w}%;height:${layout.h}%;--province-fill:${province.style.fill};--province-border:${province.style.border};--province-shape:${getProvinceShape(province.provinceId)};"
      aria-pressed="${province.selectionState.selected}"
    >
      <span class="province-node__terrain"></span>
      <span class="province-node__focus-rail"></span>
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

function renderActiveProvince(shell) {
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
      <div class="context-summary">
        <strong>Comparaison rapide</strong>
        <p>${comparedProvinceNames.length > 0 ? comparedProvinceNames.join(' vs ') : 'Aucune province comparée pour le moment.'}</p>
      </div>
    </section>
  `;
}

function getCityStateByTurn(city) {
  const shift = Math.max(0, state.turn - 1);
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
    stockByResource.grain = Math.max(0, stockByResource.grain + (state.seasonIndex === 2 ? 2 : -1 + shift));
  }

  return new City({
    ...city.toJSON(),
    prosperity: Math.max(0, Math.min(100, city.prosperity + (city.id === 'crown-port' ? shift : city.id === 'river-gate-city' ? -shift : 0))),
    stability: Math.max(0, Math.min(100, city.stability + (city.id === 'river-gate-city' ? -Math.ceil(shift / 2) : city.id === 'southern-crossing' ? 1 : 0))),
    stockByResource,
  });
}

function getRouteStateByTurn(route) {
  return new TradeRoute({
    ...route.toJSON(),
    active: route.id === 'southern-grainway' ? state.seasonIndex !== 3 : route.active,
    riskLevel: Math.max(0, Math.min(100, route.riskLevel + (route.id === 'ember-foundry-line' ? state.turn * 3 : state.seasonIndex === 3 ? 8 : -2))),
  });
}

function getEconomyViewModel() {
  const liveCities = cities.map(getCityStateByTurn);
  const liveRoutes = routes.map(getRouteStateByTurn);
  const overlay = buildEconomyMapOverlay(liveCities, liveRoutes, { cityPositionById: cityLayoutsById });
  const comparison = buildCityComparisonPanel(liveCities, { desiredStockByCityId });
  const stockPanels = Object.fromEntries(
    liveCities.map((city) => [city.id, buildCityStockPanel(city, { desiredStockByResource: desiredStockByCityId[city.id] ?? {} })]),
  );

  return { overlay, comparison, stockPanels, cities: liveCities, routes: liveRoutes };
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
  const amplitude = route.transportMode === 'river' ? 2.8 : route.transportMode === 'land' ? 1.6 : 2.2;
  const curveLift = 4 + ((index % 2) * 1.8);
  const controlX = ((origin.x + destination.x) / 2) + (normalX * curveLift);
  const controlY = ((origin.y + destination.y) / 2) + (normalY * curveLift);
  const pathD = `M ${origin.x} ${origin.y} Q ${controlX} ${controlY} ${destination.x} ${destination.y}`;
  const markerId = `route-arrow-${route.transportMode}`;

  return {
    pathD,
    classes: ['economy-route', modeClass, emphasisClass, activeClass].join(' '),
    markerId,
    critical,
    inactive,
    amplitude,
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

function renderEconomyMapOverlay(economyView) {
  if (state.activeOverlaySlot !== 'economy-overlay') {
    return '';
  }

  const tensionByCityId = Object.fromEntries(economyView.comparison.rows.map((row) => [row.cityId, row]));
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

    return `
      <g class="economy-route-group ${visual.classes} ${tensionClass}" data-route-id="${route.routeId}">
        <path class="economy-route__halo" d="${visual.pathD}" pathLength="100" />
        <path class="economy-route__casing" d="${visual.pathD}" pathLength="100" />
        <path class="economy-route__line" d="${visual.pathD}" pathLength="100" marker-end="url(#${visual.markerId})" />
        <path class="economy-route__flow" d="${visual.pathD}" pathLength="100" />
        <text class="economy-route__label" text-anchor="middle">
          <textPath href="#route-label-${route.routeId}" startOffset="50%">${route.routeName}</textPath>
        </text>
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

    return `
      <g class="economy-city-group ${state.selectedCityId === city.cityId ? 'is-selected' : ''} ${city.capital ? 'is-capital' : ''} ${isHub ? 'is-hub' : ''} is-${tension}-tension" data-city-id="${city.cityId}">
        <circle class="economy-city-tension-ring" cx="${position.x}%" cy="${position.y}%" r="${city.marker.size * 10.5}" />
        ${city.capital ? `<circle class="economy-city-capital-ring" cx="${position.x}%" cy="${position.y}%" r="${city.marker.size * 12.4}" />` : ''}
        ${isHub ? `<rect class="economy-city-hub-frame" x="calc(${position.x}% - ${city.marker.size * 9}px)" y="calc(${position.y}% - ${city.marker.size * 9}px)" width="${city.marker.size * 18}" height="${city.marker.size * 18}" rx="${city.marker.size * 4}" ry="${city.marker.size * 4}" />` : ''}
        <circle class="economy-city economy-city--${city.marker.tone}" cx="${position.x}%" cy="${position.y}%" r="${city.marker.size * 8}" />
        ${city.capital ? `<text class="economy-city-glyph" x="${position.x}%" y="calc(${position.y}% + 1px)" text-anchor="middle">★</text>` : isHub ? `<text class="economy-city-glyph" x="${position.x}%" y="calc(${position.y}% + 1px)" text-anchor="middle">◆</text>` : ''}
        <circle class="economy-city-hitbox" cx="${position.x}%" cy="${position.y}%" r="${city.marker.size * 11}" />
        <text class="economy-city-label economy-city-label--sr" x="${position.x}%" y="calc(${position.y}% - 14px)" text-anchor="middle">${city.cityName}</text>
        <text class="economy-city-resource economy-city-resource--sr" x="${position.x}%" y="calc(${position.y}% + 18px)" text-anchor="middle">${city.resources.primaryResourceId ?? 'stock vide'}</text>
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

function renderEconomySidePanel(economyView) {
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

  return `
    <section class="panel overlay-panel overlay-panel--economy">
      <div class="panel-header">
        <h3>Overlay actif, Économie</h3>
        <p>${economyView.overlay.summary}</p>
      </div>
      <div class="economy-quick-stats">
        <div class="overlay-anchor"><span>Villes</span><strong>${economyView.overlay.metrics.cityCount}</strong></div>
        <div class="overlay-anchor"><span>Routes actives</span><strong>${economyView.overlay.metrics.activeRouteCount}/${economyView.overlay.metrics.routeCount}</strong></div>
        <div class="overlay-anchor"><span>Tensions fortes</span><strong>${economyView.comparison.metrics.highTensionCount}</strong></div>
        <div class="overlay-anchor"><span>Capacité</span><strong>${economyView.overlay.metrics.totalRouteCapacity}</strong></div>
      </div>
      <div class="economy-route-list">
        ${economyView.overlay.routes.map((route) => {
          const originTension = tensionByCityId[route.originCityId]?.tensionLevel ?? 'low';
          const destinationTension = tensionByCityId[route.destinationCityId]?.tensionLevel ?? 'low';
          const tensionClass = originTension === 'high' || destinationTension === 'high'
            ? 'has-high-tension'
            : originTension === 'medium' || destinationTension === 'medium'
              ? 'has-medium-tension'
              : 'has-low-tension';

          return `
            <article class="economy-route-card ${route.active ? '' : 'is-inactive'} ${route.transportMode === 'river' ? 'is-river' : route.transportMode === 'sea' ? 'is-sea' : 'is-land'} ${route.riskLevel >= 55 || route.totalCapacity >= 9 ? 'is-critical' : ''} ${tensionClass}">
              <strong>${route.routeName}</strong>
              <span>${route.transportMode}, risque ${route.riskLevel}</span>
              <span>capacité ${route.totalCapacity}</span>
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
            <strong>Routes</strong>
            <ul class="economy-route-legend">
              <li><i class="is-land"></i>Terre</li>
              <li><i class="is-river"></i>Fluvial</li>
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

function renderBottomTray(economyView) {
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
                <dl class="comparison-card__stats">
                  <div><dt>Stock</dt><dd>${row.totalStock}</dd></div>
                  <div><dt>Stabilité</dt><dd>${city.stability}</dd></div>
                  <div><dt>Prospérité</dt><dd>${city.prosperity}</dd></div>
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
                  ${panel.rows.slice(0, 3).map((row) => `<li class="${row.status}"><span>${row.resourceId}</span><strong>${row.detail}</strong></li>`).join('')}
                </ul>
              </article>
            `;
          }).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderProvinceLabels(shell) {
  return `
    <svg class="map-label-layer" viewBox="0 0 100 100" aria-label="Labels des provinces et points clés">
      ${shell.provinces.map((province) => {
        const label = provinceLabelLayouts[province.provinceId] ?? { ...getProvinceCenter(province.provinceId), align: 'middle', tone: 'standard' };
        const city = cities.find((candidate) => candidate.regionId === province.provinceId) ?? null;
        const cityLayout = city ? cityLayoutsById[city.id] : null;
        const cityLabelX = cityLayout ? cityLayout.x + (cityLayout.labelDx ?? 0) : null;
        const cityLabelY = cityLayout ? cityLayout.y + (cityLayout.labelDy ?? 0) : null;

        return `
          <g class="province-map-label province-map-label--${label.tone} ${province.selectionState.selected ? 'is-selected' : province.selectionState.focused ? 'is-focused' : ''}">
            <text class="province-map-label__title" x="${label.x}%" y="${label.y}%" text-anchor="${label.align}">${province.label}</text>
            <text class="province-map-label__subtitle" x="${label.x}%" y="${label.y + 3.4}%" text-anchor="${label.align}">${province.contested ? 'Front actif' : province.occupied ? 'Occupation' : `Valeur ${province.strategicValue}`}</text>
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

  const layout = provinceLayouts[province.provinceId];
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

function renderStrategicRelations(shell) {
  const focusContext = getFocusContext(shell);
  const relationLines = buildProvinceRelations(shell).map((relation) => {
    const linkedToSelection = focusContext.selectedProvince
      && (relation.relationId.includes(focusContext.selectedProvince.provinceId));

    return `
    <line
      class="front-line ${relation.contested ? 'is-contested' : relation.occupied ? 'is-occupied' : relation.stable ? 'is-stable' : ''} ${linkedToSelection ? 'is-emphasized' : ''}"
      x1="${relation.origin.x}%"
      y1="${relation.origin.y}%"
      x2="${relation.destination.x}%"
      y2="${relation.destination.y}%"
    />
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

function getMapViewportTransform() {
  return `translate(${state.mapPanX}px, ${state.mapPanY}px) scale(${state.mapZoom})`;
}

function renderMapControls() {
  return `
    <div class="map-controls" aria-label="Navigation carte">
      <button type="button" class="map-control-button" data-map-zoom="out" aria-label="Zoom arrière">−</button>
      <div class="map-zoom-indicator">${Math.round(state.mapZoom * 100)}%</div>
      <button type="button" class="map-control-button" data-map-zoom="in" aria-label="Zoom avant">+</button>
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

function getMapRenderLayers(shell, economyView, focusContext) {
  return [
    { key: 'backdrop', className: 'map-layer map-layer--backdrop', content: '<div class="map-backdrop"></div>' },
    { key: 'terrain', className: 'map-layer map-layer--terrain', content: renderTerrainDecor() },
    { key: 'surface', className: 'map-layer map-layer--surface', content: renderProvinceSurface(shell, focusContext) },
    { key: 'relations', className: 'map-layer map-layer--relations', content: renderStrategicRelations(shell) },
    { key: 'labels', className: 'map-layer map-layer--labels', content: renderProvinceLabels(shell) },
    { key: 'anchors', className: 'map-layer map-layer--anchors', content: renderMapAnchorShells() },
    { key: 'economy', className: 'map-layer map-layer--economy', content: renderEconomyMapOverlay(economyView) },
    { key: 'hud', className: 'map-layer map-layer--hud', content: `${renderCityQuickPanel(economyView)}${renderBottomTray(economyView)}<div class="focus-hint">${focusContext.selectedProvince ? `Sélection active, ${focusContext.selectedProvince.label}` : 'Survolez une province pour déplacer le focus'}</div>` },
    { key: 'interactions', className: 'map-layer map-layer--interactions', content: `${shell.provinces.map((province) => renderProvinceCard(province, focusContext)).join('')}${renderProvincePopup(shell)}` },
  ];
}

function renderMapLayerStack(shell, economyView, focusContext) {
  return getMapRenderLayers(shell, economyView, focusContext)
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

function render() {
  const shell = getShell();
  const economyView = getEconomyViewModel();
  const focusContext = getFocusContext(shell);

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
          </div>
          <p class="turn-summary">${state.lastTurnSummary}</p>
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
          <div class="map-stage" data-map-stage="true">
            ${renderMapControls()}
            <div class="map-viewport" style="transform:${getMapViewportTransform()};">
              ${renderMapLayerStack(shell, economyView, focusContext)}
            </div>
          </div>
        </section>

        <aside class="side-column">
          <div class="mobile-panel-stack ${state.mobilePanelSection === 'legend' ? 'show-legend' : state.mobilePanelSection === 'overlay' ? 'show-overlay' : 'show-details'}">
            ${renderLegend(shell)}
            ${renderActiveProvince(shell)}
            ${renderEconomySidePanel(economyView)}
            ${renderMapArchitecturePanel()}
          </div>
        </aside>
      </section>
    </main>
  `;

  document.querySelectorAll('[data-province-id]').forEach((element) => {
    element.addEventListener('mouseenter', () => {
      state.focusedProvinceId = element.dataset.provinceId;
      render();
    });

    element.addEventListener('mouseleave', () => {
      state.focusedProvinceId = state.selectedProvinceId;
      render();
    });

    element.addEventListener('click', () => {
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

  document.querySelectorAll('[data-next-turn]').forEach((element) => {
    element.addEventListener('click', () => {
      advanceTurn();
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
      state.mapPanX = 0;
      state.mapPanY = 0;
      setMapZoom(1);
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

  document.querySelectorAll('[data-popup-close]').forEach((element) => {
    element.addEventListener('click', () => {
      state.popupProvinceId = null;
      render();
    });
  });
}

render();
