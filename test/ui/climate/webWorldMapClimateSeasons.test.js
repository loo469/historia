import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('world map climate layer exposes seasons biomes anomalies and disasters without replacing marker density', () => {
  assert.match(webAppSource, /function getWorldClimateBiomeLabel/);
  assert.match(webAppSource, /function getWorldClimateSeasonCue/);
  assert.match(webAppSource, /function buildWorldClimateLayer/);
  assert.match(webAppSource, /function renderWorldClimateLayerSummary/);
  assert.match(webAppSource, /province\.biome \?\? 'temperate'/);
  assert.match(webAppSource, /seasonLabels\[seasonIndex\]/);
  assert.match(webAppSource, /hazard\.riskLevel === 'high' \|\| riskLevel === 'critical'/);
  assert.match(webAppSource, /Catastrophe visible/);
  assert.match(webAppSource, /Anomalie climat/);
  assert.match(webAppSource, /Biome saisonnier/);
  assert.match(webAppSource, /state\.activeOverlaySlot !== 'climate-overlay'/);
  assert.match(webAppSource, /worldClimateLayer = buildWorldClimateLayer\(shell, state\.seasonIndex, state\.atlasClimateForecastMode\)/);
  assert.match(webAppSource, /renderWorldClimateLayerSummary\(worldClimateLayer\)/);
  assert.match(webAppSource, /renderMapLayerStack\(shell, economyView, focusContext, cultureView, climateMarkerDensity\.visibleMarkers, climateMarkerDensity\.selectedCascadeGroup, worldClimateLayer\)/);
  assert.match(webAppSource, /renderProvinceCard\(province, focusContext, postCommitClimateMarkers, selectedClimateCascadeGroup, worldClimateLayer\)/);
  assert.match(webAppSource, /data-world-climate/);

  assert.match(stylesSource, /\.map-world-climate/);
  assert.match(stylesSource, /\.map-world-climate__item--disaster/);
  assert.match(stylesSource, /\.province-node\.has-world-climate/);
  assert.match(stylesSource, /\.province-node__world-climate/);
});
