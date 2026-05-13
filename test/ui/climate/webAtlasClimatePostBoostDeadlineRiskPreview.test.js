import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

const postBoostOutcomeFixture = [
  {
    status: 'just-in-time',
    missingDimension: 'regional coordination',
    expectedOutcome: 'executable',
    expectedLabel: 'risque abaissé: exécutable',
  },
  {
    status: 'insufficient',
    missingDimension: 'timing buffer',
    expectedOutcome: 'still-tight',
    expectedLabel: 'risque réduit mais serré',
  },
  {
    status: 'too-late',
    missingDimension: 'resource coverage',
    expectedOutcome: 'insufficient',
    expectedLabel: 'boost insuffisant avant deadline',
  },
];

test('atlas previews post-boost deadline risk for urgent under-ready climate plans', () => {
  assert.match(webAppSource, /function buildAtlasClimatePostBoostDeadlineRiskPreview/);
  assert.match(webAppSource, /function renderAtlasClimatePostBoostDeadlineRiskPreview/);
  assert.match(webAppSource, /boostView\.state !== 'actionable'/);
  assert.match(webAppSource, /Aucun aperçu post-boost/);
  assert.match(webAppSource, /deadline, readiness corrigée et pression résiduelle/);
  assert.match(webAppSource, /Boost appliqué/);
  assert.match(webAppSource, /Pression résiduelle/);
  assert.match(webAppSource, /atlasClimatePostBoostDeadlineRiskPreview = buildAtlasClimatePostBoostDeadlineRiskPreview\(atlasClimateReadinessBoostRecommendations\)/);
  assert.match(webAppSource, /renderAtlasClimatePostBoostDeadlineRiskPreview\(atlasClimatePostBoostDeadlineRiskPreview\)/);

  for (const fixture of postBoostOutcomeFixture) {
    assert.match(webAppSource, new RegExp(fixture.status));
    assert.match(webAppSource, new RegExp(fixture.missingDimension));
    assert.match(webAppSource, new RegExp(fixture.expectedOutcome));
    assert.match(webAppSource, new RegExp(fixture.expectedLabel));
  }

  assert.match(stylesSource, /\.map-world-climate-post-boost-risk/);
  assert.match(stylesSource, /\.map-world-climate-post-boost-risk__item--executable/);
  assert.match(stylesSource, /\.map-world-climate-post-boost-risk__item--still-tight/);
  assert.match(stylesSource, /\.map-world-climate-post-boost-risk__item--insufficient/);
});
