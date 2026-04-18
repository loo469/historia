import test from 'node:test';
import assert from 'node:assert/strict';

import { ResearchState } from '../../../src/domain/culture/ResearchState.js';

test('ResearchState keeps normalized research progression fields', () => {
  const researchState = new ResearchState({
    id: ' research-bronze ',
    cultureId: ' culture-aurora ',
    topicId: ' bronze-working ',
    status: 'active',
    progress: 34,
    currentTier: 2,
    discoveredConceptIds: ['forge', ' alloy-smelting ', 'forge'],
    blockedByIds: [],
    lastAdvancedAt: '2026-04-18T11:55:00.000Z',
  });

  assert.deepEqual(researchState.toJSON(), {
    id: 'research-bronze',
    cultureId: 'culture-aurora',
    topicId: 'bronze-working',
    status: 'active',
    progress: 34,
    currentTier: 2,
    discoveredConceptIds: ['alloy-smelting', 'forge'],
    blockedByIds: [],
    lastAdvancedAt: '2026-04-18T11:55:00.000Z',
    completedAt: null,
  });

  assert.equal(researchState.canAdvance(), true);
  assert.equal(researchState.isBlocked(), false);
});

test('ResearchState can progress to completion immutably', () => {
  const researchState = new ResearchState({
    id: 'research-bronze',
    cultureId: 'culture-aurora',
    topicId: 'bronze-working',
    status: 'active',
    progress: 80,
    currentTier: 2,
    discoveredConceptIds: ['forge'],
  });
  const completedAt = new Date('2026-04-18T12:00:00.000Z');

  const completedResearchState = researchState.withProgress(100, completedAt);

  assert.notEqual(completedResearchState, researchState);
  assert.equal(completedResearchState.status, 'completed');
  assert.equal(completedResearchState.progress, 100);
  assert.equal(completedResearchState.completedAt?.toISOString(), completedAt.toISOString());
  assert.equal(completedResearchState.lastAdvancedAt?.toISOString(), completedAt.toISOString());
  assert.equal(researchState.status, 'active');
  assert.equal(researchState.completedAt, null);
});

test('ResearchState can become blocked with explicit prerequisites', () => {
  const researchState = new ResearchState({
    id: 'research-bronze',
    cultureId: 'culture-aurora',
    topicId: 'bronze-working',
    status: 'active',
  });

  const blockedResearchState = researchState.withStatus('blocked', {
    blockedByIds: ['charcoal-production', 'tin-trade'],
  });

  assert.notEqual(blockedResearchState, researchState);
  assert.equal(blockedResearchState.status, 'blocked');
  assert.deepEqual(blockedResearchState.blockedByIds, ['charcoal-production', 'tin-trade']);
  assert.equal(blockedResearchState.isBlocked(), true);
  assert.equal(blockedResearchState.canAdvance(), false);
});

test('ResearchState rejects invalid status, score, and completion invariants', () => {
  assert.throws(
    () =>
      new ResearchState({
        id: 'research-bronze',
        cultureId: 'culture-aurora',
        topicId: 'bronze-working',
        status: 'queued',
      }),
    /ResearchState status must be one of planned, active, blocked, or completed/,
  );

  assert.throws(
    () =>
      new ResearchState({
        id: 'research-bronze',
        cultureId: 'culture-aurora',
        topicId: 'bronze-working',
        status: 'active',
        progress: 120,
      }),
    /ResearchState progress must be an integer between 0 and 100/,
  );

  assert.throws(
    () =>
      new ResearchState({
        id: 'research-bronze',
        cultureId: 'culture-aurora',
        topicId: 'bronze-working',
        status: 'completed',
        progress: 100,
      }),
    /ResearchState completedAt is required when status is completed/,
  );

  assert.throws(
    () =>
      new ResearchState({
        id: 'research-bronze',
        cultureId: 'culture-aurora',
        topicId: 'bronze-working',
        status: 'active',
        completedAt: '2026-04-18T12:00:00.000Z',
      }),
    /ResearchState completedAt must be null unless status is completed/,
  );
});
