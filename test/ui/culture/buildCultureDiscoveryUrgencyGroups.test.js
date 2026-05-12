import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCultureDiscoveryUrgencyGroups } from '../../../src/ui/culture/buildCultureDiscoveryUrgencyGroups.js';

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
});
