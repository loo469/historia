import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas shows climate threshold progress after readiness actions', () => {
  assert.match(webAppSource, /function buildAtlasClimateThresholdProgressAfterReadinessAction/);
  assert.match(webAppSource, /function renderAtlasClimateThresholdProgressAfterReadinessAction/);
  assert.match(webAppSource, /Progression seuil climat/);
  assert.match(webAppSource, /Avant/);
  assert.match(webAppSource, /Après/);
  assert.match(webAppSource, /Manque encore/);
  assert.match(webAppSource, /Prochain suivi carte/);
  assert.match(webAppSource, /Compatibilité conséquences/);
  assert.match(webAppSource, /threshold-reached/);
  assert.match(webAppSource, /threshold-pending/);
  assert.match(webAppSource, /buildAtlasClimateThresholdProgressAfterReadinessAction\(\s*atlasClimateNextReadinessThreshold,\s*atlasClimateReadinessConsequenceHints,\s*atlasClimateReadinessBoostRecommendations,\s*atlasClimatePostBoostDeadlineRiskPreview,\s*\)/);
  assert.match(webAppSource, /renderAtlasClimateThresholdProgressAfterReadinessAction\(atlasClimateThresholdProgressAfterReadinessAction\)/);

  assert.match(stylesSource, /\.map-world-climate-threshold-progress/);
  assert.match(stylesSource, /\.map-world-climate-threshold-progress--threshold-reached/);
  assert.match(stylesSource, /\.map-world-climate-threshold-progress--threshold-pending/);
});
