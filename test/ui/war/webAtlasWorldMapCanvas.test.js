import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas world map canvas reuses existing province geometry for continents and islands', () => {
  assert.match(webAppSource, /function buildAtlasTerrainShapes/);
  assert.match(webAppSource, /getProvinceGeometry\(province\.provinceId\)/);
  assert.match(webAppSource, /getProvincePolygon\(province\.provinceId\)/);
  assert.match(webAppSource, /getProvinceCenter\(province\.provinceId\)/);
  assert.match(webAppSource, /const continents = shell\.provinces\.map/);
  assert.match(webAppSource, /islands/);
});

test('atlas world map canvas renders ocean terrain and relief as a dedicated map layer', () => {
  assert.match(webAppSource, /function renderAtlasWorldCanvas/);
  assert.match(webAppSource, /atlas-world-canvas/);
  assert.match(webAppSource, /atlasOceanGradient/);
  assert.match(webAppSource, /atlas-region--\$\{shape\.terrain\}/);
  assert.match(webAppSource, /map-layer--atlas/);
  assert.match(webAppSource, /renderAtlasWorldCanvas\(shell, economyView, cultureView\)/);
  assert.match(webAppSource, /function renderAtlasWorldEconomyLayer/);
  assert.match(webAppSource, /function buildAtlasEconomyStressRollups/);
  assert.match(webAppSource, /function buildAtlasSupplyCapacityForecasts/);
  assert.match(webAppSource, /function buildAtlasSupplyRouteCapacityForecast/);
  assert.match(webAppSource, /function renderAtlasEconomyStressLegend/);
  assert.match(webAppSource, /atlas-world-economy-layer/);
  assert.match(webAppSource, /atlas-economy-stress-rollup/);
  assert.match(webAppSource, /atlas-logistics-route/);
  assert.match(webAppSource, /atlas-economy-city/);
  assert.match(webAppSource, /Villes, ressources et flux logistiques sur la carte monde/);
  assert.match(webAppSource, /Légende économie atlas: stress logistique et régions économiques/);
  assert.match(webAppSource, /getAtlasEconomyCorridor/);
  assert.match(webAppSource, /routes saturés/);
  assert.match(webAppSource, /Sécuriser hub critique avant extension/);
  assert.match(webAppSource, /Capacité prochain tour/);
  assert.match(webAppSource, /risque surcharge prochain tour/);
  assert.match(webAppSource, /prévision incertaine/);
  assert.match(webAppSource, /atlas-logistics-route--forecast-\$\{forecast\?\.tone \?\? 'unknown'\}/);
  assert.match(webAppSource, /getRouteStressSummary\(route, tensionByCityId, cityNameById\)/);
  assert.match(stylesSource, /\.atlas-world-canvas/);
  assert.match(stylesSource, /\.atlas-world-canvas__ocean-band/);
  assert.match(stylesSource, /\.atlas-region__relief/);
  assert.match(stylesSource, /\.atlas-island/);
  assert.match(stylesSource, /\.atlas-world-economy-layer/);
  assert.match(stylesSource, /\.atlas-economy-stress-rollup/);
  assert.match(stylesSource, /\.atlas-economy-region-rollup--critical/);
  assert.match(stylesSource, /\.atlas-economy-stress-legend--strained/);
  assert.match(stylesSource, /\.atlas-supply-forecast--overload/);
  assert.match(stylesSource, /\.atlas-supply-forecast__title/);
  assert.match(stylesSource, /\.atlas-logistics-route--forecast-uncertain/);
  assert.match(stylesSource, /\.atlas-logistics-route--major/);
  assert.match(stylesSource, /\.atlas-economy-city--high/);
  assert.match(stylesSource, /\.atlas-economy-city__resources/);
});
