import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

const deterministicReliefRanking = [
  ['shift-execution-earlier', 'améliore deadline', 78, 3, 'add-secondary-boost'],
  ['add-secondary-boost', 'libère capacité', 74, 2, 'reduce-exposure-first'],
  ['reduce-exposure-first', 'réduit exposition régionale', 70, 1, 'accept-missed-deadline-risk'],
  ['accept-missed-deadline-risk', 'aucun relief sûr', 24, 0, 'add-secondary-boost'],
];

test('atlas ranks climate recovery actions by deterministic collateral relief', () => {
  assert.match(webAppSource, /function buildAtlasClimateRecoveryCollateralReliefRanking/);
  assert.match(webAppSource, /function renderAtlasClimateRecoveryCollateralReliefRanking/);
  assert.match(webAppSource, /state !== 'recoverable'/);
  assert.match(webAppSource, /Aucun ranking relief collatéral/);
  assert.match(webAppSource, /atlasClimateRecoveryCollateralReliefRanking = buildAtlasClimateRecoveryCollateralReliefRanking\(atlasClimateDeadlineRecoveryAction\)/);
  assert.match(webAppSource, /renderAtlasClimateRecoveryCollateralReliefRanking\(atlasClimateRecoveryCollateralReliefRanking\)/);

  for (const [action, relief, score, tiebreaker, rejected] of deterministicReliefRanking) {
    assert.match(webAppSource, new RegExp(action));
    assert.match(webAppSource, new RegExp(relief));
    assert.match(webAppSource, new RegExp(`reliefScore: ${score}`));
    assert.match(webAppSource, new RegExp(`tiebreaker: ${tiebreaker}`));
    assert.match(webAppSource, new RegExp(`rejectedType: '${rejected}'`));
  }

  assert.match(webAppSource, /Alternative rejetée/);
  assert.match(webAppSource, /Top action/);
  assert.match(webAppSource, /no-safe-relief/);
  assert.match(stylesSource, /\.map-world-climate-recovery-relief-ranking/);
  assert.match(stylesSource, /\.map-world-climate-recovery-relief-ranking--no-safe-relief/);
});
