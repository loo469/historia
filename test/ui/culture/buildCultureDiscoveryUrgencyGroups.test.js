import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCultureBlockerResolutionHistory, buildCultureDiscoveryUrgencyGroups, buildCultureInterventionPriorities } from '../../../src/ui/culture/buildCultureDiscoveryUrgencyGroups.js';

test('buildCultureDiscoveryUrgencyGroups orders urgent and active culture signals before background lore', () => {
  const groups = buildCultureDiscoveryUrgencyGroups({
    selectedMarker: {
      regionId: 'river-gate',
      cultureName: 'Compact d’Aurora',
      markerType: 'innovation',
      influenceTier: 'dominant',
      activeResearchCount: 1,
      regionalDiscoveryLinks: [
        {
          linkId: 'river:aurora:routes',
          regionId: 'river-gate',
          cultureId: 'culture-aurora',
          discoveryId: 'routes-célestes',
          eventCount: 1,
          activeResearchCount: 1,
          label: 'routes-célestes · river-gate · 1 événement',
        },
        {
          linkId: 'river:aurora:catalogue',
          regionId: 'river-gate',
          cultureId: 'culture-aurora',
          discoveryId: 'catalogues-publics',
          eventCount: 0,
          activeResearchCount: 1,
          label: 'catalogues-publics · river-gate',
        },
      ],
      eventPopups: [
        {
          popupId: 'river:aurora:archive',
          title: 'Ouverture des archives',
          summary: 'Les maîtres-cartographes publient une route exploitable.',
          importance: 4,
          discoveries: ['routes-célestes'],
        },
        {
          popupId: 'river:aurora:chant',
          title: 'Chant de quai',
          summary: 'Un chant ancien reste consultable.',
          importance: 1,
          discoveries: [],
        },
      ],
    },
  });

  assert.equal(groups.state, 'active');
  assert.deepEqual(groups.groups.map((group) => group.key), ['urgent', 'active', 'background']);
  assert.equal(groups.groups[0].items[0].label, 'Ouverture des archives');
  assert.match(groups.groups[0].items.map((item) => item.label).join(' | '), /routes-célestes/);
  assert.equal(groups.groups[1].items[0].cause, 'Recherche active');
  assert.equal(groups.groups[2].items[0].label, 'Chant de quai');

  const priorities = buildCultureInterventionPriorities(groups);
  assert.equal(priorities.state, 'active');
  assert.equal(priorities.priorities[0].urgency, 'urgent');
  assert.equal(priorities.priorities[0].action, 'Suivre le repère maintenant');
  assert.match(priorities.priorities[0].effect, /Ouverture des archives/);
  assert.match(priorities.priorities[0].waitRisk, /signal prioritaire/);
  assert.equal(priorities.priorities[0].blocker, null);
  assert.equal(priorities.priorities[0].followUp.label, 'débloque ensuite');
  assert.equal(priorities.priorities[0].followUp.action, 'catalogues-publics');
  assert.equal(priorities.priorities[0].resolutionGain.label, 'après résolution');
  assert.match(priorities.priorities[0].resolutionGain.gain, /action suivante débloquée: catalogues-publics/);
  assert.match(priorities.priorities[0].resolutionGain.riskAvoided, /fenêtre culturelle utile/);
  assert.match(priorities.summary, /interventions? culturelle/);
});

test('buildCultureDiscoveryUrgencyGroups names ambiguous empty states without duplicating marker data', () => {
  assert.deepEqual(buildCultureDiscoveryUrgencyGroups(), {
    state: 'quiet',
    summary: 'Aucun signal culturel détaillé à grouper pour cette province.',
    groups: [],
  });

  const grouped = buildCultureDiscoveryUrgencyGroups({
    selectedMarker: {
      regionId: 'red-ridge',
      cultureName: 'Ligues des Forges',
      markerType: 'fragmented',
      influenceTier: 'emerging',
      activeResearchCount: 0,
      regionalDiscoveryLinks: [{
        linkId: 'ridge:forge:alloy',
        regionId: 'red-ridge',
        cultureId: 'culture-forge',
        discoveryId: 'alliages-de-siège',
        eventCount: 0,
        activeResearchCount: 0,
      }],
      eventPopups: [],
    },
    selectedCluster: {
      pins: [{
        pinId: 'red-ridge:culture-forge:discovery:alliages-de-siège',
        kind: 'discovery',
        name: 'alliages-de-siège',
        type: 'Découverte',
        regionId: 'red-ridge',
        cultureName: 'Ligues des Forges',
      }],
    },
  });

  assert.equal(grouped.groups[0].key, 'urgent');
  assert.equal(grouped.groups[0].items.length, 1);
  assert.equal(grouped.groups[0].items[0].cause, 'Tension locale');

  const priorities = buildCultureInterventionPriorities(grouped);
  assert.equal(priorities.priorities.length, 1);
  assert.equal(priorities.priorities[0].action, 'Stabiliser la découverte');
  assert.match(priorities.priorities[0].waitRisk, /tension locale/);
  assert.equal(priorities.priorities[0].blocker.label, 'bloqué par');
  assert.equal(priorities.priorities[0].blocker.shortReason, 'tension locale');
  assert.equal(priorities.priorities[0].followUp.label, 'débloque ensuite');
  assert.equal(priorities.priorities[0].resolutionGain.label, 'après résolution');
  assert.match(priorities.priorities[0].resolutionGain.gain, /tension réduite/);
  assert.match(priorities.priorities[0].resolutionGain.next, /priorités actives/);
  assert.match(priorities.priorities[0].resolutionGain.riskAvoided, /risque social/);
});

test('buildCultureInterventionPriorities flags local priority conflicts', () => {
  const priorities = buildCultureInterventionPriorities({
    groups: [{
      key: 'urgent',
      items: [
        {
          itemId: 'discovery:river:aurora',
          kind: 'discovery',
          group: 'urgent',
          label: 'routes-célestes',
          shortLabel: 'routes-célestes',
          cultureName: 'Compact d’Aurora',
          regionId: 'river-gate',
          cause: '1 repère',
          detail: 'route critique',
          priority: 330,
        },
        {
          itemId: 'discovery:river:ember',
          kind: 'discovery',
          group: 'urgent',
          label: 'glyphes-de-convoi',
          shortLabel: 'glyphes-de-convoi',
          cultureName: 'Ligues des Forges',
          regionId: 'river-gate',
          cause: 'Tension locale',
          detail: 'friction locale',
          priority: 320,
        },
      ],
    }],
  });

  assert.equal(priorities.priorities[0].conflict, true);
  assert.equal(priorities.priorities[0].blocker.label, 'bloqué par');
  assert.equal(priorities.priorities[0].blocker.shortReason, 'Ligues des Forges');
  assert.match(priorities.priorities[0].resolutionGain.gain, /tension réduite entre Compact d’Aurora et Ligues des Forges/);
  assert.equal(priorities.conflicts[0].label, 'Même province');
  assert.match(priorities.conflicts[0].summary, /concurrence/);
});

test('buildCultureBlockerResolutionHistory keeps recent resolved blockers and useful unlocks compact', () => {
  const priorities = buildCultureInterventionPriorities({
    groups: [{
      key: 'urgent',
      items: [
        {
          itemId: 'discovery:river:aurora',
          kind: 'discovery',
          group: 'urgent',
          label: 'routes-célestes',
          shortLabel: 'routes-célestes',
          cultureName: 'Compact d’Aurora',
          regionId: 'river-gate',
          cause: 'Tension locale',
          detail: 'route critique',
          priority: 330,
        },
        {
          itemId: 'discovery:river:aurora:catalogue',
          kind: 'discovery',
          group: 'active',
          label: 'catalogues-publics',
          shortLabel: 'catalogues-publics',
          cultureName: 'Compact d’Aurora',
          regionId: 'river-gate',
          cause: 'Recherche active',
          detail: 'suite utile',
          priority: 220,
        },
      ],
    }],
  });

  const history = buildCultureBlockerResolutionHistory({
    priorityView: priorities,
    previousHistory: [{
      historyId: 'old',
      provinceId: 'river-gate',
      cultureName: 'Ancienne trace',
      source: 'ancien signal',
      status: 'gain reporté',
      effect: 'ancienne option masquée',
      next: 'ne devrait pas dominer',
      risk: 'ancien risque',
      turn: 1,
      priority: 1,
    }],
    provinceId: 'river-gate',
    provinceLabel: 'Porte du Fleuve',
    turn: 4,
  });

  assert.equal(history[0].status, 'blocage levé');
  assert.match(history[0].effect, /tension réduite/);
  assert.match(history[0].next, /catalogues-publics/);
  assert.match(history[0].risk, /risque social/);
  assert.ok(history.length <= 4);
});
