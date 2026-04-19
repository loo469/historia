import test from 'node:test';
import assert from 'node:assert/strict';

import { ResearchState } from '../../../src/domain/culture/ResearchState.js';
import { buildResearchProgressPanel } from '../../../src/ui/culture/buildResearchProgressPanel.js';

test('buildResearchProgressPanel summarizes active, blocked, and completed research for one culture', () => {
  const panel = buildResearchProgressPanel(
    [
      new ResearchState({
        id: 'research-astrolabe',
        cultureId: 'culture-north',
        topicId: 'astrolabe',
        status: 'active',
        progress: 65,
        currentTier: 2,
        discoveredConceptIds: ['star-maps', 'tidal-ledgers'],
        lastAdvancedAt: '2026-04-19T11:00:00.000Z',
      }),
      new ResearchState({
        id: 'research-harbor-codes',
        cultureId: 'culture-north',
        topicId: 'harbor-codes',
        status: 'blocked',
        progress: 35,
        currentTier: 1,
        blockedByIds: ['dry-docks'],
      }),
      new ResearchState({
        id: 'research-ledgers',
        cultureId: 'culture-north',
        topicId: 'paper-ledgers',
        status: 'completed',
        progress: 100,
        currentTier: 3,
        completedAt: '2026-04-18T08:00:00.000Z',
      }),
      new ResearchState({
        id: 'research-foreign',
        cultureId: 'culture-steppe',
        topicId: 'horse-breeding',
        status: 'active',
        progress: 40,
      }),
    ],
    { cultureId: 'culture-north' },
  );

  assert.equal(panel.summary, '1 actives, 1 bloquées, 1 terminées');
  assert.deepEqual(panel.rows, [
    {
      researchId: 'research-astrolabe',
      topicId: 'astrolabe',
      status: 'active',
      statusLabel: 'Active',
      tone: 'info',
      progress: 65,
      currentTier: 2,
      progressLabel: '65% en cours',
      blockedByIds: [],
      discoveredConceptCount: 2,
      lastAdvancedAt: '2026-04-19T11:00:00.000Z',
      completedAt: null,
    },
    {
      researchId: 'research-harbor-codes',
      topicId: 'harbor-codes',
      status: 'blocked',
      statusLabel: 'Bloquée',
      tone: 'warning',
      progress: 35,
      currentTier: 1,
      progressLabel: '35% bloqué',
      blockedByIds: ['dry-docks'],
      discoveredConceptCount: 0,
      lastAdvancedAt: null,
      completedAt: null,
    },
    {
      researchId: 'research-ledgers',
      topicId: 'paper-ledgers',
      status: 'completed',
      statusLabel: 'Terminée',
      tone: 'success',
      progress: 100,
      currentTier: 3,
      progressLabel: 'Terminée',
      blockedByIds: [],
      discoveredConceptCount: 0,
      lastAdvancedAt: null,
      completedAt: '2026-04-18T08:00:00.000Z',
    },
  ]);
  assert.deepEqual(panel.metrics, {
    researchCount: 3,
    activeCount: 1,
    blockedCount: 1,
    completedCount: 1,
    averageProgress: 67,
  });
});

test('buildResearchProgressPanel validates inputs', () => {
  assert.throws(() => buildResearchProgressPanel(null, { cultureId: 'culture-north' }), /researchStates must be an array/);
  assert.throws(() => buildResearchProgressPanel([null], { cultureId: 'culture-north' }), /must be a ResearchState instance or plain object/);
  assert.throws(() => buildResearchProgressPanel([], null), /options must be an object/);
  assert.throws(() => buildResearchProgressPanel([], {}), /cultureId is required/);
});
