import { Province } from '../src/domain/war/Province.js';
import { buildStrategicMapShell } from '../src/ui/war/StrategicMapShell.js';

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

const state = {
  focusedProvinceId: 'crown-heart',
  selectedProvinceId: 'river-gate',
  activeOverlaySlot: 'economy-overlay',
};

function getShell() {
  return buildStrategicMapShell(provinces, {
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

  return `
    <button
      class="${classes}"
      type="button"
      data-province-id="${province.provinceId}"
      style="left:${layout.x}%;top:${layout.y}%;width:${layout.w}%;height:${layout.h}%;--province-fill:${province.style.fill};--province-border:${province.style.border};"
      aria-pressed="${province.selectionState.selected}"
    >
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
    </section>
  `;
}

function renderOverlayPanel() {
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

function render() {
  const shell = getShell();

  document.querySelector('#app').innerHTML = `
    <main class="shell-root">
      <section class="hero panel">
        <div>
          <p class="eyebrow">Alpha war room</p>
          <h1>${shell.title}</h1>
          <p class="hero-copy">${shell.subtitle}</p>
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
            <div id="top-hud" class="overlay-anchor-shell overlay-anchor-shell--top">Top HUD</div>
            <div id="left-rail" class="overlay-anchor-shell overlay-anchor-shell--left">Left rail</div>
            <div id="right-rail" class="overlay-anchor-shell overlay-anchor-shell--right">Right rail</div>
            <div id="bottom-tray" class="overlay-anchor-shell overlay-anchor-shell--bottom">Bottom tray</div>
            ${shell.provinces.map(renderProvinceCard).join('')}
          </div>
        </section>

        <aside class="side-column">
          ${renderLegend(shell)}
          ${renderActiveProvince(shell)}
          ${renderOverlayPanel()}
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
      render();
    });
  });

  document.querySelectorAll('[data-overlay-slot]').forEach((element) => {
    element.addEventListener('click', () => {
      state.activeOverlaySlot = element.dataset.overlaySlot;
      render();
    });
  });
}

render();
