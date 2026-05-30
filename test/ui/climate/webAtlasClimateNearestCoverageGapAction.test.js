import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas suggests the smallest action for the nearest climate coverage gap', () => {
  assert.match(webAppSource, /function buildAtlasClimateNearestCoverageGapAction/);
  assert.match(webAppSource, /function renderAtlasClimateNearestCoverageGapAction/);
  assert.match(webAppSource, /Action gap prioritaire/);
  assert.match(webAppSource, /Plus petit suivi/);
  assert.match(webAppSource, /protège contre le basculement du seuil/);
  assert.match(webAppSource, /Fallback: aucun angle mort restant/);
  assert.match(webAppSource, /Aucun suivi spécifique/);
  assert.match(webAppSource, /autre\$\{view\.recommendation\.otherGapsKept > 1 \? 's' : ''\} gap/);
  assert.match(webAppSource, /buildAtlasClimateNearestCoverageGapAction\(\s*atlasClimateRemainingCoverageGaps,\s*atlasClimateThresholdProgressAfterReadinessAction,\s*\)/);
  assert.match(webAppSource, /renderAtlasClimateRemainingCoverageGaps\(atlasClimateRemainingCoverageGaps\)\}\s*\$\{renderAtlasClimateNearestCoverageGapAction\(atlasClimateNearestCoverageGapAction\)\}/);

  assert.match(stylesSource, /\.map-world-climate-nearest-gap-action/);
  assert.match(stylesSource, /\.map-world-climate-nearest-gap-action--fallback/);
});
