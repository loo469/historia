import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('atlas recommends safest climate follow-through after restored-window deadline tradeoff', () => {
  assert.match(webAppSource, /function buildSafestClimateFollowThroughAfterDeadlineTradeoff/);
  assert.match(webAppSource, /safestClimateFollowThroughAfterDeadlineTradeoff: null/);
  assert.match(webAppSource, /safestClimateFollowThroughAfterDeadlineTradeoff,/);

  for (const stableKey of [
    'state',
    'action',
    'dominantConstraint',
    'sourceTradeoff',
    'windowState',
    'reason',
    'summary',
  ]) {
    assert.match(webAppSource, new RegExp(`${stableKey}[:,]`));
  }

  assert.match(webAppSource, /follow-through critique/);
  assert.match(webAppSource, /follow-through modéré/);
  assert.match(webAppSource, /follow-through absent/);
  assert.match(webAppSource, /payer encore/);
  assert.match(webAppSource, /verrouiller la fenêtre/);
  assert.match(webAppSource, /accepter un risque court/);
  assert.match(webAppSource, /déplacer la décision/);
  assert.match(webAppSource, /attendre/);
  assert.match(webAppSource, /dette secondaire/);
  assert.match(webAppSource, /saison/);
  assert.match(webAppSource, /cascade/);
  assert.match(webAppSource, /pression régionale/);
  assert.match(webAppSource, /conflit de timing/);
  assert.match(webAppSource, /Follow-through sûr/);
});
