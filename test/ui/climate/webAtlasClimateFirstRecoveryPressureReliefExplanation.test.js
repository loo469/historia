import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

const deterministicFirstReliefs = [
  ['améliore deadline', 'deadline-less-tight', 'deadline moins serrée', 3],
  ['libère capacité', 'capacity-freed', 'capacité régionale libérée', 2],
  ['réduit exposition régionale', 'exposure-reduced', 'exposition réduite', 1],
  ['aucun relief sûr', 'no-safe-relief', 'aucun relief sûr', 0],
];

test('atlas explains the first pressure relieved after the ranked climate recovery action', () => {
  assert.match(webAppSource, /function buildAtlasClimateFirstRecoveryPressureReliefExplanation/);
  assert.match(webAppSource, /function renderAtlasClimateFirstRecoveryPressureReliefExplanation/);
  assert.match(webAppSource, /Aucune micro-explication pressure relief/);
  assert.match(webAppSource, /rankedActions\?\.length/);
  assert.match(webAppSource, /atlasClimateFirstRecoveryPressureReliefExplanation = buildAtlasClimateFirstRecoveryPressureReliefExplanation\(atlasClimateRecoveryCollateralReliefRanking\)/);
  assert.match(webAppSource, /renderAtlasClimateFirstRecoveryPressureReliefExplanation\(atlasClimateFirstRecoveryPressureReliefExplanation\)/);

  for (const [collateralRelief, state, indicator, tiebreaker] of deterministicFirstReliefs) {
    assert.match(webAppSource, new RegExp(collateralRelief));
    assert.match(webAppSource, new RegExp(state));
    assert.match(webAppSource, new RegExp(indicator));
    assert.match(webAppSource, new RegExp(`tiebreaker: ${tiebreaker}`));
  }

  assert.match(webAppSource, /Premier relief visible/);
  assert.match(webAppSource, /Signal attendu/);
  assert.match(webAppSource, /Score source/);
  assert.match(stylesSource, /\.map-world-climate-first-recovery-relief/);
  assert.match(stylesSource, /\.map-world-climate-first-recovery-relief--capacity-freed/);
  assert.match(stylesSource, /\.map-world-climate-first-recovery-relief--exposure-reduced/);
  assert.match(stylesSource, /\.map-world-climate-first-recovery-relief--no-safe-relief/);
});
