import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('selected province panel forecasts climate risk reduction after queued mitigation', () => {
  assert.match(webAppSource, /function getProjectedClimateRiskAfterMitigation/);
  assert.match(webAppSource, /function buildClimateMitigationPayoffTradeoff/);
  assert.match(webAppSource, /function buildProvinceClimateRiskReductionForecast/);
  assert.match(webAppSource, /function renderProvinceClimateRiskReductionForecast/);
  assert.match(webAppSource, /Prévision de réduction du risque climatique après mitigation en file/);
  assert.match(webAppSource, /Réduction risque projetée/);
  assert.match(webAppSource, /currentRisk/);
  assert.match(webAppSource, /projectedRisk/);
  assert.match(webAppSource, /criticalDeadline/);
  assert.match(webAppSource, /queuedAction/);
  assert.match(webAppSource, /payoffTradeoff/);
  assert.match(webAppSource, /Bénéfice attendu: risque/);
  assert.match(webAppSource, /pression économie\/logistique/);
  assert.match(webAppSource, /friction culturelle/);
  assert.match(webAppSource, /exposition militaire/);
  assert.match(webAppSource, /coût d’opportunité/);
  assert.match(webAppSource, /remainingCascades/);
  assert.match(webAppSource, /Aucune mitigation climat décisive en file/);
  assert.match(webAppSource, /surveillance résiduelle/);
  assert.match(webAppSource, /renderProvinceClimateRiskReductionForecast\(province, shell\)/);

  assert.match(stylesSource, /\.province-climate-risk-forecast/);
  assert.match(stylesSource, /\.province-climate-risk-forecast--empty/);
  assert.match(stylesSource, /\.province-climate-risk-forecast--unchanged/);
  assert.match(stylesSource, /\.province-climate-risk-forecast--reduced/);
  assert.match(stylesSource, /\.province-climate-risk-forecast__meter/);
  assert.match(stylesSource, /\.province-climate-risk-forecast__payoff/);
  assert.match(stylesSource, /\.province-climate-risk-forecast__residuals/);
});
