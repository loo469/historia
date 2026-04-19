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
          id: 'event-navigators-guild',
          title: 'Navigators Guild',
          summary: 'Les premières cartes d\'étoiles circulent entre ports.',
          triggeredAt: '2026-04-10T10:00:00.000Z',
          discoveryIds: ['star-charts'],
          unlockedResearchIds: ['observatory-maps'],
        },
        {
          id: 'event-open-archives',
          title: 'Open Archives',
          summary: 'Les archives publiques rendent les découvertes traçables.',
          triggeredAt: '2026-04-12T14:30:00.000Z',
          discoveryIds: ['public-catalogue', 'scholar-oath'],
          unlockedResearchIds: ['paper-ledgers'],
        },
      ],
    },
  );

  assert.deepEqual(panel, {
    cultureId: 'culture-north',
    title: 'Découvertes',
    summary: '2 concepts, 2 recherches, 2 événements',
    sections: {
      concepts: ['bronze-smelting', 'star-maps'],
      research: ['observatory-maps', 'paper-ledgers'],
      events: [
        {
          eventId: 'event-navigators-guild',
          eventTitle: 'Navigators Guild',
          discoveryCount: 1,
          discoveries: ['star-charts'],
          unlockedResearchIds: ['observatory-maps'],
          triggeredAt: '2026-04-10T10:00:00.000Z',
          label: 'Navigators Guild (1 découverte)',
        },
        {
          eventId: 'event-open-archives',
          eventTitle: 'Open Archives',
          discoveryCount: 2,
          discoveries: ['public-catalogue', 'scholar-oath'],
          unlockedResearchIds: ['paper-ledgers'],
          triggeredAt: '2026-04-12T14:30:00.000Z',
          label: 'Open Archives (2 découvertes)',
        },
      ],
      timeline: [
        {
          id: 'event-navigators-guild:timeline',
          eventId: 'event-navigators-guild',
          title: 'Navigators Guild',
          summary: "Les premières cartes d'étoiles circulent entre ports.",
          triggeredAt: '2026-04-10T10:00:00.000Z',
          order: 1,
          discoveries: ['star-charts'],
          unlockedResearchIds: ['observatory-maps'],
          label: '1. Navigators Guild · 2026-04-10',
        },
        {
          id: 'event-open-archives:timeline',
          eventId: 'event-open-archives',
          title: 'Open Archives',
          summary: 'Les archives publiques rendent les découvertes traçables.',
          triggeredAt: '2026-04-12T14:30:00.000Z',
          order: 2,
          discoveries: ['public-catalogue', 'scholar-oath'],
          unlockedResearchIds: ['paper-ledgers'],
          label: '2. Open Archives · 2026-04-12',
        },
      ],
    },
    metrics: {
      conceptCount: 2,
      unlockedResearchCount: 2,
      eventCount: 2,
      timelineEventCount: 2,
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
  assert.deepEqual(panel.sections.timeline, []);
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

  assert.throws(
    () =>
      buildDiscoveriesPanel(
        {
          cultureId: 'culture-north',
          discoveredConceptIds: [],
          unlockedResearchIds: [],
        },
        {
          historicalEvents: [{ id: 'event-open-archives', title: 'Open Archives', triggeredAt: 'invalid-date', discoveryIds: [] }],
        },
      ),
    /DiscoveriesPanel historicalEvents\[0\]\.triggeredAt must be a valid date/,
  );
});
