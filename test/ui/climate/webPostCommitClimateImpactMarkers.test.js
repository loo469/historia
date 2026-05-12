import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('map exposes compact post-commit climate impact markers and detail copy', () => {
  assert.match(webAppSource, /function buildPostCommitClimateImpactMarkers/);
  assert.match(webAppSource, /function renderPostCommitClimateMarkerDetail/);
  assert.match(webAppSource, /risk-reduced/);
  assert.match(webAppSource, /hazard-delayed/);
  assert.match(webAppSource, /hazard-unresolved/);
  assert.match(webAppSource, /cascade-active/);
  assert.match(webAppSource, /Lié au résumé climat cumulé/);
  assert.match(webAppSource, /Aucune intervention climat confirmée ne couvre encore cet aléa/);
  assert.match(webAppSource, /buildClimateMarkerDensityControl/);
  assert.match(webAppSource, /has-climate-post-commit/);
  assert.match(webAppSource, /province-node__climate-marker/);
  assert.match(webAppSource, /marqueur climat post-résolution/);
  assert.match(webAppSource, /renderProvinceCard\(province, focusContext, postCommitClimateMarkers, selectedClimateCascadeGroup\)/);
  assert.match(webAppSource, /renderPostCommitClimateMarkerDetail\(province, buildPostCommitClimateImpactMarkers/);

  assert.match(stylesSource, /\.province-node\.has-climate-post-commit/);
  assert.match(stylesSource, /\.province-node__climate-marker/);
  assert.match(stylesSource, /\.province-climate-post-commit/);
  assert.match(stylesSource, /\.province-climate-post-commit--cascade-active/);
});
