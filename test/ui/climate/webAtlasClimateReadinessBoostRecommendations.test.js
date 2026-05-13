import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

const climateReadinessBoostFixture = [
  {
    gapType: 'capacité',
    expectedDimension: 'mitigation capacity',
    expectedBoost: 'Pré-affecter une équipe mitigation',
  },
  {
    gapType: 'dépendance régionale',
    expectedDimension: 'regional coordination',
    expectedBoost: 'Nommer un relais régional',
  },
];

test('atlas recommends minimal readiness boosts for urgent under-ready climate plans', () => {
  assert.match(webAppSource, /function buildAtlasClimateReadinessBoostRecommendations/);
  assert.match(webAppSource, /function renderAtlasClimateReadinessBoostRecommendations/);
  assert.match(webAppSource, /gapView\.state !== 'warning'/);
  assert.match(webAppSource, /les plans urgents restent exécutables/);
  assert.match(webAppSource, /Boost minimal/);
  assert.match(webAppSource, /Raison concrète/);
  assert.match(webAppSource, /Dimension manquante/);
  assert.match(webAppSource, /resource coverage/);
  assert.match(webAppSource, /timing buffer/);
  assert.match(webAppSource, /atlasClimateReadinessBoostRecommendations = buildAtlasClimateReadinessBoostRecommendations\(atlasClimateUnderReadyExecutionGaps\)/);
  assert.match(webAppSource, /renderAtlasClimateReadinessBoostRecommendations\(atlasClimateReadinessBoostRecommendations\)/);

  for (const fixture of climateReadinessBoostFixture) {
    assert.match(webAppSource, new RegExp(fixture.gapType));
    assert.match(webAppSource, new RegExp(fixture.expectedDimension));
    assert.match(webAppSource, new RegExp(fixture.expectedBoost));
  }

  assert.match(stylesSource, /\.map-world-climate-readiness-boosts/);
  assert.match(stylesSource, /\.map-world-climate-readiness-boosts__item--insufficient/);
  assert.match(stylesSource, /\.map-world-climate-readiness-boosts__item--too-late/);
});
