import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

const reliefRankingFixture = [
  { outcome: 'executable', reliefScore: 90, reliefBand: 'temps exécutable gagné' },
  { outcome: 'still-tight', reliefScore: 55, reliefBand: 'soulagement partiel, deadline serrée' },
  { outcome: 'insufficient', reliefScore: 20, reliefBand: 'soulagement faible, deadline bloque encore' },
];

test('atlas ranks climate readiness boosts by post-boost deadline pressure relief', () => {
  assert.match(webAppSource, /function buildAtlasClimateReadinessBoostReliefRanking/);
  assert.match(webAppSource, /function renderAtlasClimateReadinessBoostReliefRanking/);
  assert.match(webAppSource, /postBoostView\.state === 'empty'/);
  assert.match(webAppSource, /Aucun boost readiness urgent à classer par soulagement de deadline/);
  assert.match(webAppSource, /Meilleur boost/);
  assert.match(webAppSource, /Score relief/);
  assert.match(webAppSource, /Pourquoi maintenant/);
  assert.match(webAppSource, /right\.reliefScore - left\.reliefScore \|\| left\.residualPenalty - right\.residualPenalty \|\| left\.deadline\.localeCompare\(right\.deadline\) \|\| left\.provinceLabel\.localeCompare\(right\.provinceLabel\)/);
  assert.match(webAppSource, /atlasClimateReadinessBoostReliefRanking = buildAtlasClimateReadinessBoostReliefRanking\(atlasClimatePostBoostDeadlineRiskPreview\)/);
  assert.match(webAppSource, /renderAtlasClimateReadinessBoostReliefRanking\(atlasClimateReadinessBoostReliefRanking\)/);

  for (const fixture of reliefRankingFixture) {
    assert.match(webAppSource, new RegExp(fixture.outcome));
    assert.match(webAppSource, new RegExp(String(fixture.reliefScore)));
    assert.match(webAppSource, new RegExp(fixture.reliefBand));
  }

  assert.match(stylesSource, /\.map-world-climate-boost-relief-ranking/);
  assert.match(stylesSource, /\.map-world-climate-boost-relief-ranking__item--executable/);
  assert.match(stylesSource, /\.map-world-climate-boost-relief-ranking__item--still-tight/);
  assert.match(stylesSource, /\.map-world-climate-boost-relief-ranking__item--insufficient/);
});
