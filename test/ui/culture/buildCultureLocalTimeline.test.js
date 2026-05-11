import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCultureLocalTimeline } from '../../../src/ui/culture/buildCultureLocalTimeline.js';

test('buildCultureLocalTimeline prioritizes local events and cluster discovery pins', () => {
  const timeline = buildCultureLocalTimeline({
    selectedRegionId: 'river-gate',
    selectedMarker: {
      cultureName: 'Compact d’Aurora',
      eventPopups: [
        {
          eventId: 'event-archive-opening',
          title: 'Ouverture des archives',
          summary: 'Les cartes anciennes révèlent une passe sûre.',
          triggeredAt: '2026-04-20T00:00:00.000Z',
          importance: 5,
          discoveries: ['archive-routes'],
        },
      ],
    },
    selectedCluster: {
      pins: [
        {
          pinId: 'river-gate:culture-aurora:discovery:tidal-ledgers',
          kind: 'discovery',
          name: 'tidal-ledgers',
          type: 'Découverte',
          regionId: 'river-gate',
          cultureId: 'culture-aurora',
          cultureName: 'Compact d’Aurora',
          importance: null,
        },
      ],
    },
  });

  assert.equal(timeline.state, 'active');
  assert.equal(timeline.summary, '2 signals culturels liés à la province sélectionnée.');
  assert.deepEqual(timeline.items.map((item) => [item.kind, item.signal, item.title]), [
    ['event', 'opportunity', 'Ouverture des archives'],
    ['discovery', 'research', 'tidal-ledgers'],
  ]);
  assert.equal(timeline.items[0].date, '2026-04-20');
});

test('buildCultureLocalTimeline returns a calm empty state without local signals', () => {
  assert.deepEqual(buildCultureLocalTimeline({ selectedRegionId: 'quiet-field' }), {
    state: 'empty',
    regionId: 'quiet-field',
    heading: 'Chronologie locale calme',
    summary: 'Aucun événement ou découverte culturelle immédiate pour cette province.',
    items: [],
  });
});
