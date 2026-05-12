import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('climate post-commit markers have density controls that preserve urgent threats', () => {
  assert.match(webAppSource, /function buildClimateMarkerDensityControl/);
  assert.match(webAppSource, /function renderClimateMarkerDensityRollup/);
  assert.match(webAppSource, /getClimateMarkerDensityThreshold\(options\)/);
  assert.match(webAppSource, /marker\.status === 'cascade-active' \|\| marker\.status === 'hazard-unresolved'/);
  assert.match(webAppSource, /visibleMarkers = pinnedMarkers\.concat/);
  assert.match(webAppSource, /groupedMarkers/);
  assert.match(webAppSource, /Densité marqueurs climat/);
  assert.match(webAppSource, /Priorité conservée aux cascades et aléas non résolus/);
  assert.match(webAppSource, /climateMarkerDensity = buildClimateMarkerDensityControl\(postCommitClimateMarkers, \{/);
  assert.match(webAppSource, /renderClimateMarkerDensityRollup\(climateMarkerDensity\)/);
  assert.match(webAppSource, /renderMapLayerStack\(shell, economyView, focusContext, cultureView, climateMarkerDensity\.visibleMarkers\)/);

  assert.match(stylesSource, /\.map-climate-density/);
  assert.match(stylesSource, /\.map-climate-density--grouped/);
  assert.match(stylesSource, /\.map-climate-density--dense/);
});
