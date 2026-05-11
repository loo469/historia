import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('playable map wires province economy turn report into selected province details', () => {
  assert.match(webAppSource, /buildProvinceEconomyTurnReport/);
  assert.match(webAppSource, /function renderProvinceEconomyTurnReport/);
  assert.match(webAppSource, /Rapport économie dernier tour/);
  assert.match(webAppSource, /routeDeltaById/);
  assert.match(webAppSource, /previousChoice/);
  assert.match(webAppSource, /renderProvinceEconomyTurnReport\(province, economyView\)/);
  assert.match(stylesSource, /\.province-economy-turn-report/);
  assert.match(stylesSource, /province-economy-turn-report--improved/);
  assert.match(stylesSource, /province-economy-turn-report__delta--worse/);
});
