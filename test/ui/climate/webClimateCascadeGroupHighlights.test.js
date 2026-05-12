import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('aggregated climate markers expose selected cascade groups while urgent markers stay pinned', () => {
  assert.match(webAppSource, /function getClimateMarkerCascadeKey/);
  assert.match(webAppSource, /function buildSelectedClimateCascadeGroup/);
  assert.match(webAppSource, /getClimateMarkerCascadeKey\(marker\) === key/);
  assert.match(webAppSource, /Groupe cascade/);
  assert.match(webAppSource, /selectedCascadeGroup/);
  assert.match(webAppSource, /renderSelectedClimateCascadeGroup/);
  assert.match(webAppSource, /Le groupe met en évidence les provinces du risque principal/);
  assert.match(webAppSource, /has-climate-cascade-group/);
  assert.match(webAppSource, /is-climate-cascade-group-primary/);
  assert.match(webAppSource, /renderMapLayerStack\(shell, economyView, focusContext, cultureView, climateMarkerDensity\.visibleMarkers, climateMarkerDensity\.selectedCascadeGroup, worldClimateLayer\)/);
  assert.match(webAppSource, /marker\.status === 'cascade-active' \|\| marker\.status === 'hazard-unresolved'/);

  assert.match(stylesSource, /\.map-climate-cascade-group/);
  assert.match(stylesSource, /\.province-node\.has-climate-cascade-group::after/);
  assert.match(stylesSource, /\.province-node\.is-climate-cascade-group-primary::after/);
});
