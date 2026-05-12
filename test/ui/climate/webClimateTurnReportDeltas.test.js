import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('playable map wires climate recovery and risk deltas into selected province turn report', () => {
  assert.match(webAppSource, /buildClimateTurnReportDeltas/);
  assert.match(webAppSource, /function renderProvinceClimateTurnReport/);
  assert.match(webAppSource, /Rapport climat dernier tour/);
  assert.match(webAppSource, /Prévu: /);
  assert.match(webAppSource, /Réalisé: /);
  assert.match(webAppSource, /renderProvinceClimateTurnReport\(province\)/);
  assert.match(stylesSource, /\.province-climate-turn-report/);
  assert.match(stylesSource, /province-climate-turn-report--recovery/);
  assert.match(stylesSource, /province-climate-turn-report--risk/);
  assert.match(stylesSource, /province-climate-turn-report__delta--partial/);
});
