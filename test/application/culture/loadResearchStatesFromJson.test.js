import test from 'node:test';
import assert from 'node:assert/strict';

import { loadResearchStatesFromJson } from '../../../src/application/culture/loadResearchStatesFromJson.js';

test('loadResearchStatesFromJson parses and normalizes research states', () => {
  const researchStates = loadResearchStatesFromJson(`{
    "researchStates": [
      {
        "id": "research-state-north",
        "cultureId": "culture-north",
        "focusIds": ["astronomy", "archives", "astronomy"],
        "unlockedResearchIds": ["paper-ledgers", "navigation"],
        "activeProjectId": "project-star-census",
        "knowledgePoints": 14
      }
    ]
  }`);

  assert.equal(researchStates.length, 1);
  assert.deepEqual(researchStates[0], {
    id: 'research-state-north',
    cultureId: 'culture-north',
    focusIds: ['archives', 'astronomy'],
    unlockedResearchIds: ['navigation', 'paper-ledgers'],
    activeProjectId: 'project-star-census',
    knowledgePoints: 14,
  });
});

test('loadResearchStatesFromJson applies defaults for optional fields', () => {
  const researchStates = loadResearchStatesFromJson(`{
    "researchStates": [
      {
        "id": "research-state-south",
        "cultureId": "culture-south"
      }
    ]
  }`);

  assert.deepEqual(researchStates[0], {
    id: 'research-state-south',
    cultureId: 'culture-south',
    focusIds: [],
    unlockedResearchIds: [],
    activeProjectId: null,
    knowledgePoints: 0,
  });
});

test('loadResearchStatesFromJson rejects invalid JSON and invalid research state shapes', () => {
  assert.throws(
    () => loadResearchStatesFromJson('{broken'),
    /loadResearchStatesFromJson could not parse JSON/,
  );

  assert.throws(
    () => loadResearchStatesFromJson('{"researchStates":{}}'),
    /loadResearchStatesFromJson root.researchStates must be an array/,
  );

  assert.throws(
    () =>
      loadResearchStatesFromJson(`{
        "researchStates": [
          {
            "id": " ",
            "cultureId": "culture-north"
          }
        ]
      }`),
    /loadResearchStatesFromJson researchState\[0\]\.id is required/,
  );

  assert.throws(
    () =>
      loadResearchStatesFromJson(`{
        "researchStates": [
          {
            "id": "research-state-north",
            "cultureId": "culture-north",
            "focusIds": [""]
          }
        ]
      }`),
    /loadResearchStatesFromJson researchState\[0\]\.focusIds is required/,
  );
});
