import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('climate overlay exposes compact severity legend for stacked markers', () => {
  assert.match(webAppSource, /function buildClimateSeverityLegend/);
  assert.match(webAppSource, /function renderClimateSeverityLegend/);
  assert.match(webAppSource, /state\.activeOverlaySlot !== 'climate-overlay' \|\| markers\.length === 0/);
  assert.match(webAppSource, /Légende climat inactive: overlay climat masqué ou aucun marqueur/);
  assert.match(webAppSource, /'cascade-active': \{ label: 'Critique'/);
  assert.match(webAppSource, /'hazard-unresolved': \{ label: 'Élevé'/);
  assert.match(webAppSource, /'hazard-delayed': \{ label: 'Surveillance'/);
  assert.match(webAppSource, /'risk-reduced': \{ label: 'Réduit'/);
  assert.match(webAppSource, /map-climate-severity-legend/);
  assert.match(webAppSource, /la sévérité explique les piles sans ouvrir chaque province/);
  assert.match(webAppSource, /climateSeverityLegend = buildClimateSeverityLegend\(postCommitClimateMarkers, climateMarkerDensity\)/);
  assert.match(webAppSource, /renderClimateSeverityLegend\(climateSeverityLegend\)/);

  assert.match(stylesSource, /\.map-climate-severity-legend/);
  assert.match(stylesSource, /\.map-climate-severity-legend__item--cascade-active/);
  assert.match(stylesSource, /\.map-climate-severity-legend__item--hazard-unresolved/);
  assert.match(stylesSource, /\.map-climate-severity-legend__item--hazard-delayed/);
  assert.match(stylesSource, /\.map-climate-severity-legend__item--risk-reduced/);
});
