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
  'crown-port': { x: 49.5, y: 28 },
  'river-gate-city': { x: 34, y: 56 },
  'iron-plain-city': { x: 62, y: 55 },
  'southern-crossing': { x: 47, y: 79 },
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
  comparisonProvinceIds: ['river-gate', 'crown-heart'],
  lastTurnSummary: 'Le théâtre reste sous tension, sans bascule majeure.',
};

const seasonLabels = ['Printemps', 'Été', 'Automne', 'Hiver'];

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

function renderProvinceCard(province) {
  const layout = provinceLayouts[province.provinceId];
  const badges = province.badges.map((badge) => `<span class="province-badge">${badge}</span>`).join('');
  const classes = [
    'province-node',
    province.selectionState.selected ? 'is-selected' : '',
    province.selectionState.focused ? 'is-focused' : '',
    province.contested ? 'is-contested' : '',
    province.occupied ? 'is-occupied' : '',
  ].filter(Boolean).join(' ');
  const silhouetteByProvinceId = {
    'north-watch': 'polygon(10% 18%, 66% 6%, 92% 34%, 84% 88%, 28% 94%, 8% 58%)',
    'crown-heart': 'polygon(8% 20%, 52% 4%, 90% 18%, 92% 74%, 54% 94%, 10% 78%)',
    'red-ridge': 'polygon(16% 16%, 74% 8%, 94% 38%, 82% 92%, 22% 88%, 6% 44%)',
    'river-gate': 'polygon(14% 10%, 86% 18%, 92% 54%, 74% 92%, 22% 86%, 6% 40%)',
    'iron-plain': 'polygon(8% 24%, 48% 6%, 92% 28%, 88% 80%, 44% 96%, 6% 74%)',
    'southern-reach': 'polygon(16% 14%, 78% 8%, 94% 46%, 74% 90%, 24% 92%, 6% 48%)',
  };

  return `
    <button
      class="${classes}"
      type="button"
      data-province-id="${province.provinceId}"
      style="left:${layout.x}%;top:${layout.y}%;width:${layout.w}%;height:${layout.h}%;--province-fill:${province.style.fill};--province-border:${province.style.border};--province-shape:${silhouetteByProvinceId[province.provinceId] ?? 'polygon(12% 12%, 88% 12%, 88% 88%, 12% 88%)'};"
      aria-pressed="${province.selectionState.selected}"
    >
      <span class="province-node__terrain"></span>
      <span class="province-node__name">${province.label}</span>
      <span class="province-node__meta">${province.supplyTone} · loyauté ${province.loyalty}</span>
      <span class="province-node__badges">${badges}</span>
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
  const province = shell.activeProvince ?? shell.provinces[0] ?? null;

  if (!province) {
    return '<section class="panel province-details"><p>Aucune province chargée.</p></section>';
  }

  const controller = factionMetaById[province.controllingFactionId]?.label ?? province.controllingFactionId;
  const owner = factionMetaById[province.ownerFactionId]?.label ?? province.ownerFactionId;
  const comparedProvinceNames = state.comparisonProvinceIds
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

function renderEconomyMapOverlay(economyView) {
  if (state.activeOverlaySlot !== 'economy-overlay') {
    return '';
  }

  const routeLines = economyView.overlay.routes.map((route) => {
    const origin = cityLayoutsById[route.originCityId];
    const destination = cityLayoutsById[route.destinationCityId];

    if (!origin || !destination) {
      return '';
    }

    const dashArray = route.style.pattern === 'dashed'
      ? '10 7'
      : route.style.pattern === 'wave'
        ? '7 5'
        : '0';

    return `
      <line
        class="economy-route"
        x1="${origin.x}%"
        y1="${origin.y}%"
        x2="${destination.x}%"
        y2="${destination.y}%"
        stroke="${route.style.stroke}"
        stroke-width="${route.style.width * 3}"
        stroke-dasharray="${dashArray}"
        opacity="${route.style.opacity}"
      />
    `;
  }).join('');

  const cityNodes = economyView.overlay.cities.map((city) => {
    const position = city.marker.position;

    if (!position) {
      return '';
    }

    return `
      <g class="economy-city-group" data-city-id="${city.cityId}">
        <circle class="economy-city economy-city--${city.marker.tone}" cx="${position.x}%" cy="${position.y}%" r="${city.marker.size * 8}" />
        <text class="economy-city-label" x="${position.x}%" y="calc(${position.y}% - 14px)" text-anchor="middle">${city.cityName}</text>
        <text class="economy-city-resource" x="${position.x}%" y="calc(${position.y}% + 18px)" text-anchor="middle">${city.resources.primaryResourceId ?? 'stock vide'}</text>
      </g>
    `;
  }).join('');

  return `
    <svg class="economy-map-layer" viewBox="0 0 100 100" aria-label="Overlay économie et logistique">
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
        ${economyView.overlay.routes.map((route) => `
          <article class="economy-route-card ${route.active ? '' : 'is-inactive'}">
            <strong>${route.routeName}</strong>
            <span>${route.transportMode}, risque ${route.riskLevel}</span>
            <span>capacité ${route.totalCapacity}</span>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderBottomTray(economyView) {
  if (state.activeOverlaySlot !== 'economy-overlay') {
    return '<div class="overlay-anchor-shell overlay-anchor-shell--bottom">Bottom tray</div>';
  }

  return `
    <section id="bottom-tray" class="overlay-anchor-shell overlay-anchor-shell--bottom overlay-anchor-shell--economy">
      <div class="bottom-tray-grid">
        <div class="bottom-tray-table">
          <h4>${economyView.comparison.title}</h4>
          <p>${economyView.comparison.summary}</p>
          <table>
            <thead>
              <tr><th>Ville</th><th>Stock</th><th>Ratio</th><th>Tension</th></tr>
            </thead>
            <tbody>
              ${economyView.comparison.rows.map((row) => `
                <tr>
                  <td>${row.cityName}</td>
                  <td>${row.totalStock}</td>
                  <td>${row.scarcityRatio}</td>
                  <td><span class="tension-pill tension-pill--${row.tensionLevel}">${row.tensionLevel}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="bottom-tray-stocks">
          ${economyView.overlay.cities.map((city) => {
            const panel = economyView.stockPanels[city.cityId];
            return `
              <article class="stock-mini-card">
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
  const relationLines = buildProvinceRelations(shell).map((relation) => `
    <line
      class="front-line ${relation.contested ? 'is-contested' : relation.occupied ? 'is-occupied' : relation.stable ? 'is-stable' : ''}"
      x1="${relation.origin.x}%"
      y1="${relation.origin.y}%"
      x2="${relation.destination.x}%"
      y2="${relation.destination.y}%"
    />
  `).join('');

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
    <div class="terrain-mass terrain-mass--north"></div>
    <div class="terrain-mass terrain-mass--east"></div>
    <div class="terrain-mass terrain-mass--south"></div>
    <div class="terrain-river"></div>
    <div class="terrain-contours terrain-contours--a"></div>
    <div class="terrain-contours terrain-contours--b"></div>
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

function render() {
  const shell = getShell();
  const economyView = getEconomyViewModel();

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

      <section class="layout-grid">
        <section class="panel map-panel">
          <div class="panel-header panel-header--spread">
            <div>
              <h2>Carte opérationnelle</h2>
              <p>Cliquez pour sélectionner, survolez pour déplacer le focus</p>
            </div>
            <div class="overlay-tabs">${renderOverlaySlots(shell)}</div>
          </div>
          <div class="map-stage">
            <div class="map-backdrop"></div>
            ${renderTerrainDecor()}
            ${renderStrategicRelations(shell)}
            <div id="top-hud" class="overlay-anchor-shell overlay-anchor-shell--top">Top HUD</div>
            <div id="left-rail" class="overlay-anchor-shell overlay-anchor-shell--left">Left rail</div>
            <div id="right-rail" class="overlay-anchor-shell overlay-anchor-shell--right">Right rail</div>
            ${renderEconomyMapOverlay(economyView)}
            ${renderBottomTray(economyView)}
            ${shell.provinces.map(renderProvinceCard).join('')}
            ${renderProvincePopup(shell)}
          </div>
        </section>

        <aside class="side-column">
          ${renderLegend(shell)}
          ${renderActiveProvince(shell)}
          ${renderEconomySidePanel(economyView)}
        </aside>
      </section>
    </main>
  `;

  document.querySelectorAll('[data-province-id]').forEach((element) => {
    element.addEventListener('mouseenter', () => {
      state.focusedProvinceId = element.dataset.provinceId;
      render();
    });

    element.addEventListener('click', () => {
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

  document.querySelectorAll('[data-next-turn]').forEach((element) => {
    element.addEventListener('click', () => {
      advanceTurn();
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

  document.querySelectorAll('[data-popup-close]').forEach((element) => {
    element.addEventListener('click', () => {
      state.popupProvinceId = null;
      render();
    });
  });
}

render();
