import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCultureConsequenceChips } from '../../../src/ui/culture/buildCultureConsequenceChips.js';

test('buildCultureConsequenceChips deduplicates and sorts cultural signals by severity', () => {
  const chips = buildCultureConsequenceChips({
    province: { provinceId: 'river-gate' },
    action: { title: 'Renforcer le front' },
    selectedMarker: {
      overlayId: 'river-gate:culture-aurora',
      regionId: 'river-gate',
      cultureName: 'Compact d’Aurora',
      influenceTier: 'strong',
      eventCount: 1,
      discoveries: ['archive-routes'],
    },
    localTimeline: {
      items: [
        {
          timelineId: 'river-gate:event:event-archive-opening',
          signal: 'opportunity',
          title: 'Ouverture des archives',
          regionId: 'river-gate',
          cultureName: 'Compact d’Aurora',
          importance: 5,
        },
        {
          timelineId: 'river-gate:event:event-archive-opening-copy',
          signal: 'opportunity',
          title: 'Ouverture des archives',
          regionId: 'river-gate',
          cultureName: 'Compact d’Aurora',
          importance: 4,
        },
        {
          timelineId: 'river-gate:discovery:tidal-ledgers',
          signal: 'research',
          title: 'tidal-ledgers',
          regionId: 'river-gate',
          cultureName: 'Compact d’Aurora',
          importance: null,
        },
      ],
    },
  });

  assert.deepEqual(chips.map((chip) => [chip.tone, chip.label, chip.severity]), [
    ['opportunity', 'Ouverture culturelle', 5],
    ['opportunity', 'Repère historique', 4],
    ['research', 'Découverte liée', 2],
  ]);
  assert.equal(chips[0].explanation, 'Ouverture des archives influence “Renforcer le front”.');
});

test('buildCultureConsequenceChips exposes calm fallbacks for empty or quiet culture context', () => {
  assert.deepEqual(buildCultureConsequenceChips({
    province: { provinceId: 'quiet-field' },
    action: { title: 'Garder en observation' },
  }), [
    {
      chipId: 'neutral:quiet-field:Aucun signal:Culture calme:Garder en observation',
      tone: 'neutral',
      label: 'Culture calme',
      explanation: 'Aucune conséquence culturelle immédiate pour ce choix.',
      cultureName: 'Aucun signal',
      regionId: 'quiet-field',
      severity: 0,
    },
  ]);

  assert.deepEqual(buildCultureConsequenceChips({
    province: { provinceId: 'shared-bay' },
    action: { title: 'Préparer la manœuvre' },
    selectedCluster: {
      clusterId: 'shared-bay:culture-cluster',
      summary: 'Delta Scribes, Harbor Compact',
      regionIds: ['shared-bay'],
      pins: [],
    },
  })[0], {
    chipId: 'identity:shared-bay:Delta Scribes, Harbor Compact:Cluster calme:shared-bay:culture-cluster',
    tone: 'identity',
    label: 'Cluster calme',
    explanation: 'Aucun événement actif, mais le voisinage culturel reste pertinent.',
    cultureName: 'Delta Scribes, Harbor Compact',
    regionId: 'shared-bay',
    severity: 1,
  });
});
