import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas campaign layer derives military pressure from existing province/front data', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryFeatures\(shell\)/);
  assert.match(webAppSource, /buildProvinceRelations\(shell\)/);
  assert.match(webAppSource, /province\.contested/);
  assert.match(webAppSource, /province\.occupied/);
  assert.match(webAppSource, /province\.supplyLevel/);
  assert.match(webAppSource, /getProvinceCenter\(source\.provinceId\)/);
  assert.doesNotMatch(webAppSource, /hiddenMilitary|foggedMilitary|secretMilitary/);
});

test('atlas campaign layer keeps world-scale military signals compact and aggregated', () => {
  assert.match(webAppSource, /function renderAtlasMilitaryLayer\(shell\)/);
  assert.match(webAppSource, /atlas-campaign-route/);
  assert.match(webAppSource, /atlas-campaign-route__arrow/);
  assert.match(webAppSource, /atlas-military-risk/);
  assert.match(webAppSource, /slice\(0, 3\)/);
  assert.match(webAppSource, /overflowCount/);
  assert.match(webAppSource, /axes agrégés/);
});

test('atlas campaign routes and pressure arrows have dedicated styling', () => {
  assert.match(stylesSource, /\.atlas-military-layer/);
  assert.match(stylesSource, /\.atlas-campaign-route path:first-child/);
  assert.match(stylesSource, /\.atlas-campaign-route__arrow/);
  assert.match(stylesSource, /\.atlas-military-risk--front polygon/);
  assert.match(stylesSource, /\.atlas-military-overflow/);
});
