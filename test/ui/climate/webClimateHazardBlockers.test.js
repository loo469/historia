import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('playable map adds climate hazard blockers to selected province action planning', () => {
  assert.match(webAppSource, /function buildProvinceClimateHazardBlockers/);
  assert.match(webAppSource, /function renderProvinceClimateHazardBlockers/);
  assert.match(webAppSource, /Blockers climat planning/);
  assert.match(webAppSource, /Hazard climat bloquant/);
  assert.match(webAppSource, /Saison à risque court terme/);
  assert.match(webAppSource, /Mitigation efficace/);
  assert.match(webAppSource, /Aucun blocker climat/);
  assert.match(webAppSource, /sûre/);
  assert.match(webAppSource, /risquée/);
  assert.match(webAppSource, /retardée/);
  assert.match(webAppSource, /déconseillée/);
  assert.match(webAppSource, /renderProvinceClimateHazardBlockers\(province, actionQueue\)/);
  assert.match(stylesSource, /\.province-climate-hazard-blockers/);
  assert.match(stylesSource, /province-climate-hazard-blocker--blocked/);
  assert.match(stylesSource, /province-climate-hazard-blocker--risky/);
  assert.match(stylesSource, /province-climate-hazard-blocker--delayed/);
  assert.match(stylesSource, /province-climate-hazard-blocker--safe/);
});
