import test from 'node:test';
import assert from 'node:assert/strict';

import { advanceResearch } from '../../../src/application/culture/advanceResearch.js';

test('advanceResearch increases progress and merges discoveries immutably', () => {
  const researchState = {
    id: 'research-bronze',
    cultureId: 'culture-aurora',
    topicId: 'bronze-working',
    status: 'active',
    progress: 35,
    currentTier: 2,
    discoveredConceptIds: ['forge'],
    blockedByIds: [],
    lastAdvancedAt: null,
    completedAt: null,
  };

  const advancedResearchState = advanceResearch(researchState, {
    amount: 20,
    discoveredConceptIds: [' alloy-smelting ', 'forge'],
    advancedAt: '2026-04-18T12:32:00.000Z',
  });

  assert.notEqual(advancedResearchState, researchState);
  assert.equal(advancedResearchState.progress, 55);
  assert.equal(advancedResearchState.status, 'active');
  assert.deepEqual(advancedResearchState.discoveredConceptIds, ['alloy-smelting', 'forge']);
  assert.equal(advancedResearchState.lastAdvancedAt, '2026-04-18T12:32:00.000Z');
  assert.equal(advancedResearchState.completedAt, null);
  assert.deepEqual(researchState.discoveredConceptIds, ['forge']);
});

test('advanceResearch completes research when reaching 100 progress', () => {
  const completedResearchState = advanceResearch(
    {
      id: 'research-bronze',
      cultureId: 'culture-aurora',
      topicId: 'bronze-working',
      status: 'active',
      progress: 85,
      currentTier: 2,
      discoveredConceptIds: ['forge'],
      blockedByIds: [],
      lastAdvancedAt: null,
      completedAt: null,
    },
    {
      amount: 25,
      advancedAt: '2026-04-18T12:35:00.000Z',
    },
  );

  assert.equal(completedResearchState.progress, 100);
  assert.equal(completedResearchState.status, 'completed');
  assert.equal(completedResearchState.lastAdvancedAt, '2026-04-18T12:35:00.000Z');
  assert.equal(completedResearchState.completedAt, '2026-04-18T12:35:00.000Z');
});

test('advanceResearch can surface newly blocked research after advancement', () => {
  const blockedResearchState = advanceResearch(
    {
      id: 'research-navigation',
      cultureId: 'culture-aurora',
      topicId: 'deep-sea-navigation',
      status: 'active',
      progress: 40,
      currentTier: 3,
      discoveredConceptIds: [],
      blockedByIds: [],
      lastAdvancedAt: null,
      completedAt: null,
    },
    {
      amount: 10,
      blockedByIds: ['star-maps'],
      advancedAt: '2026-04-18T12:36:00.000Z',
    },
  );

  assert.equal(blockedResearchState.progress, 50);
  assert.equal(blockedResearchState.status, 'blocked');
  assert.deepEqual(blockedResearchState.blockedByIds, ['star-maps']);
  assert.equal(blockedResearchState.completedAt, null);
});

test('advanceResearch rejects invalid states and impossible transitions', () => {
  assert.throws(
    () =>
      advanceResearch(
        {
          id: 'research-bronze',
          cultureId: 'culture-aurora',
          topicId: 'bronze-working',
          status: 'completed',
          progress: 100,
          currentTier: 2,
          discoveredConceptIds: [],
          blockedByIds: [],
        },
        {
          amount: 1,
        },
      ),
    /advanceResearch cannot advance completed research/,
  );

  assert.throws(
    () =>
      advanceResearch(
        {
          id: 'research-bronze',
          cultureId: 'culture-aurora',
          topicId: 'bronze-working',
          status: 'active',
          progress: 50,
          currentTier: 2,
          discoveredConceptIds: [],
          blockedByIds: ['tin-trade'],
        },
        {
          amount: 5,
        },
      ),
    /advanceResearch cannot advance blocked research/,
  );

  assert.throws(
    () =>
      advanceResearch(
        {
          id: 'research-bronze',
          cultureId: 'culture-aurora',
          topicId: 'bronze-working',
          status: 'active',
          progress: 50,
          currentTier: 2,
          discoveredConceptIds: [],
          blockedByIds: [],
        },
        {
          amount: 0,
        },
      ),
    /advanceResearch advancement.amount must be an integer between 1 and 100/,
  );

  assert.throws(
    () =>
      advanceResearch(
        {
          id: 'research-bronze',
          cultureId: 'culture-aurora',
          topicId: 'bronze-working',
          status: 'active',
          progress: 50,
          currentTier: 2,
          discoveredConceptIds: [],
          blockedByIds: [],
        },
        {
          amount: 5,
          advancedAt: 'not-a-date',
        },
      ),
    /advanceResearch advancement.advancedAt must be a valid date/,
  );
});
