import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateResearchUnlocks } from '../../../src/application/culture/evaluateResearchUnlocks.js';

test('evaluateResearchUnlocks unlocks projects that match current knowledge points', () => {
  const result = evaluateResearchUnlocks(
    {
      id: 'research-state-north',
      cultureId: 'culture-north',
      focusIds: ['astronomy'],
      unlockedResearchIds: ['paper-ledgers'],
      activeProjectId: 'project-observatory',
      knowledgePoints: 18,
    },
    [
      { id: 'paper-ledgers', requiredKnowledgePoints: 4 },
      { id: 'observatory-maps', requiredKnowledgePoints: 10 },
      { id: 'stellar-census', requiredKnowledgePoints: 18 },
      { id: 'deep-vaults', requiredKnowledgePoints: 25 },
    ],
  );

  assert.deepEqual(result.unlockedResearchIds, [
    'observatory-maps',
    'paper-ledgers',
    'stellar-census',
  ]);
  assert.deepEqual(result.newlyUnlockedResearchIds, ['observatory-maps', 'stellar-census']);
});

test('evaluateResearchUnlocks returns no new unlocks when thresholds are unmet', () => {
  const result = evaluateResearchUnlocks(
    {
      id: 'research-state-south',
      cultureId: 'culture-south',
      focusIds: [],
      unlockedResearchIds: [],
      activeProjectId: null,
      knowledgePoints: 3,
    },
    [
      { id: 'paper-ledgers', requiredKnowledgePoints: 4 },
      { id: 'observatory-maps', requiredKnowledgePoints: 10 },
    ],
  );

  assert.deepEqual(result.unlockedResearchIds, []);
  assert.deepEqual(result.newlyUnlockedResearchIds, []);
});

test('evaluateResearchUnlocks rejects invalid research state and project shapes', () => {
  assert.throws(
    () => evaluateResearchUnlocks(null, []),
    /evaluateResearchUnlocks researchState must be an object/,
  );

  assert.throws(
    () =>
      evaluateResearchUnlocks(
        {
          id: 'research-state-east',
          cultureId: 'culture-east',
          focusIds: [],
          unlockedResearchIds: [],
          activeProjectId: null,
          knowledgePoints: 'not-a-number',
        },
        [],
      ),
    /evaluateResearchUnlocks researchState.knowledgePoints must be a finite number/,
  );

  assert.throws(
    () =>
      evaluateResearchUnlocks(
        {
          id: 'research-state-east',
          cultureId: 'culture-east',
          focusIds: [],
          unlockedResearchIds: [],
          activeProjectId: null,
          knowledgePoints: 8,
        },
        [{ id: 'observatory-maps', requiredKnowledgePoints: '10' }],
      ),
    /evaluateResearchUnlocks researchProjects\[0\]\.requiredKnowledgePoints must be a finite number/,
  );
});
