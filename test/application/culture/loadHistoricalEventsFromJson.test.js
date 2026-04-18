import test from 'node:test';
import assert from 'node:assert/strict';

import { loadHistoricalEventsFromJson } from '../../../src/application/culture/loadHistoricalEventsFromJson.js';

test('loadHistoricalEventsFromJson parses and normalizes historical events', () => {
  const events = loadHistoricalEventsFromJson(`{
    "events": [
      {
        "id": "event-open-archives",
        "title": "Open Archives",
        "era": "late-medieval",
        "summary": "Guild scholars gain access to royal archives.",
        "affectedCultureIds": ["culture-north", "culture-north", "culture-south"],
        "consequenceIds": ["archive-reform", "public-catalogue"],
        "unlockedResearchIds": ["astronomy", "paper-ledgers"],
        "repeatable": true,
        "triggerCount": 2,
        "lastTriggeredAt": "2026-04-18T14:15:00.000Z",
        "divergenceId": "divergence-open-archives"
      }
    ]
  }`);

  assert.equal(events.length, 1);
  assert.deepEqual(events[0], {
    id: 'event-open-archives',
    title: 'Open Archives',
    era: 'late-medieval',
    summary: 'Guild scholars gain access to royal archives.',
    affectedCultureIds: ['culture-north', 'culture-south'],
    consequenceIds: ['archive-reform', 'public-catalogue'],
    unlockedResearchIds: ['astronomy', 'paper-ledgers'],
    repeatable: true,
    triggerCount: 2,
    lastTriggeredAt: '2026-04-18T14:15:00.000Z',
    divergenceId: 'divergence-open-archives',
  });
});

test('loadHistoricalEventsFromJson applies defaults for optional fields', () => {
  const events = loadHistoricalEventsFromJson(`{
    "events": [
      {
        "id": "event-silent-monastery",
        "title": "Silent Monastery",
        "era": "classical",
        "summary": "A monastery hides dissenting chronicles."
      }
    ]
  }`);

  assert.deepEqual(events[0], {
    id: 'event-silent-monastery',
    title: 'Silent Monastery',
    era: 'classical',
    summary: 'A monastery hides dissenting chronicles.',
    affectedCultureIds: [],
    consequenceIds: [],
    unlockedResearchIds: [],
    repeatable: false,
    triggerCount: 0,
    lastTriggeredAt: null,
    divergenceId: null,
  });
});

test('loadHistoricalEventsFromJson rejects invalid JSON and invalid event shapes', () => {
  assert.throws(
    () => loadHistoricalEventsFromJson('{broken'),
    /loadHistoricalEventsFromJson could not parse JSON/,
  );

  assert.throws(
    () => loadHistoricalEventsFromJson('{"events":{}}'),
    /loadHistoricalEventsFromJson root.events must be an array/,
  );

  assert.throws(
    () =>
      loadHistoricalEventsFromJson(`{
        "events": [
          {
            "id": " ",
            "title": "Open Archives",
            "era": "late-medieval",
            "summary": "Guild scholars gain access to royal archives."
          }
        ]
      }`),
    /loadHistoricalEventsFromJson event\[0\]\.id is required/,
  );

  assert.throws(
    () =>
      loadHistoricalEventsFromJson(`{
        "events": [
          {
            "id": "event-open-archives",
            "title": "Open Archives",
            "era": "late-medieval",
            "summary": "Guild scholars gain access to royal archives.",
            "affectedCultureIds": [""]
          }
        ]
      }`),
    /loadHistoricalEventsFromJson event\[0\]\.affectedCultureIds is required/,
  );
});
