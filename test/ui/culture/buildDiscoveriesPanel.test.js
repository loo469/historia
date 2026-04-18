import test from 'node:test';
import assert from 'node:assert/strict';

import { buildDiscoveriesPanel } from '../../../src/ui/culture/buildDiscoveriesPanel.js';

test('buildDiscoveriesPanel summarizes research discoveries and event discoveries', () => {
  const panel = buildDiscoveriesPanel(
    {
      cultureId: 'culture-north',
      discoveredConceptIds: ['bronze-smelting', ' star-maps ', 'bronze-smelting'],
      unlockedResearchIds: ['observatory-maps', 'paper-ledgers'],
    },
    {
      historicalEvents: [
        {
          id: 'event-open-archives',
          title: 'Open Archives',
          discoveryIds: ['public-catalogue', 'scholar-oath'],
          unlockedResearchIds: ['paper-ledgers'],
        },
      ],
    },
  );

  assert.deepEqual(panel, {
    cultureId: 'culture-north',
    title: 'Découvertes',
    summary: '2 concepts, 2 recherches, 1 événements',
    sections: {
      concepts: ['bronze-smelting', 'star-maps'],
      research: ['observatory-maps', 'paper-ledgers'],
      events: [
        {
          eventId: 'event-open-archives',
          eventTitle: 'Open Archives',
          discoveryCount: 2,
          discoveries: ['public-catalogue', 'scholar-oath'],
          unlockedResearchIds: ['paper-ledgers'],
          label: 'Open Archives (2 découvertes)',
        },
      ],
    },
    metrics: {
      conceptCount: 2,
      unlockedResearchCount: 2,
      eventCount: 1,
    },
  });
});

test('buildDiscoveriesPanel supports empty discovery collections', () => {
  const panel = buildDiscoveriesPanel(
    {
      cultureId: 'culture-south',
      discoveredConceptIds: [],
      unlockedResearchIds: [],
    },
    {
      historicalEvents: [],
    },
  );

  assert.equal(panel.summary, '0 concepts, 0 recherches, 0 événements');
  assert.deepEqual(panel.sections.events, []);
});

test('buildDiscoveriesPanel rejects invalid payloads', () => {
  assert.throws(
    () => buildDiscoveriesPanel(null, {}),
    /DiscoveriesPanel researchState must be an object/,
  );

  assert.throws(
    () =>
      buildDiscoveriesPanel(
        {
          cultureId: 'culture-north',
          discoveredConceptIds: [''],
          unlockedResearchIds: [],
        },
        {},
      ),
    /DiscoveriesPanel researchState.discoveredConceptIds is required/,
  );

  assert.throws(
    () =>
      buildDiscoveriesPanel(
        {
          cultureId: 'culture-north',
          discoveredConceptIds: [],
          unlockedResearchIds: [],
        },
        {
          historicalEvents: [{ id: 'event-open-archives', title: ' ', discoveryIds: [] }],
        },
      ),
    /DiscoveriesPanel historicalEvents\[0\]\.title is required/,
  );
});
