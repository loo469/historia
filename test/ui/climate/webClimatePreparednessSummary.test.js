import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('playable map adds climate preparedness warnings to the end-turn summary', () => {
  assert.match(webAppSource, /function buildMapClimatePreparednessSummary/);
  assert.match(webAppSource, /function renderMapClimatePreparednessSummary/);
  assert.match(webAppSource, /Préparation climat fin de tour/);
  assert.match(webAppSource, /reste.*exposée.*au climat avant validation du tour/s);
  assert.match(webAppSource, /mitigation.*climat confirmée/s);
  assert.match(webAppSource, /aucun danger résiduel prioritaire/);
  assert.match(webAppSource, /buildProvinceClimateHazardBlockers\(province, actionQueue\)/);
  assert.match(webAppSource, /renderMapClimatePreparednessSummary\(climatePreparednessSummary\)/);
  assert.match(stylesSource, /\.map-climate-preparedness/);
  assert.match(stylesSource, /map-climate-preparedness--warning/);
  assert.match(stylesSource, /map-climate-preparedness--mitigated/);
  assert.match(stylesSource, /map-climate-preparedness__item--blocked/);
  assert.match(stylesSource, /map-climate-preparedness__item--safe/);
});
