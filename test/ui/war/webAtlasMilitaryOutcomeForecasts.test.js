import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas operation outcome forecasts reuse visible operation sequence data', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryOperationOutcomeForecasts\(sequence\)/);
  assert.match(webAppSource, /focusedStep = sequence\.steps\[0\]/);
  assert.match(webAppSource, /focusedStep\.effect/);
  assert.match(webAppSource, /focusedStep\.risk/);
  assert.match(webAppSource, /focusedStep\.reason/);
  assert.doesNotMatch(webAppSource, /new WarModel|simulateWar|hiddenForecast|secretForecast/);
});

test('atlas operation outcome forecasts compare multiple options with gain risk and delay', () => {
  assert.match(webAppSource, /Percée rapide/);
  assert.match(webAppSource, /Tenir et fixer/);
  assert.match(webAppSource, /Réserve prudente/);
  assert.match(webAppSource, /frontChange/);
  assert.match(webAppSource, /overextension/);
  assert.match(webAppSource, /delay/);
  assert.match(webAppSource, /surextension/);
  assert.match(webAppSource, /renderAtlasMilitaryOperationOutcomeForecasts\(outcomeForecasts\)/);
});

test('atlas operation outcome forecasts render one-line options plus focus details and empty state', () => {
  assert.match(webAppSource, /atlas-military-outcome-option__line/);
  assert.match(webAppSource, /atlas-military-outcome-option__detail/);
  assert.match(webAppSource, /tabindex="0"/);
  assert.match(webAppSource, /Prévisions indisponibles: aucune opération militaire candidate visible/);
  assert.match(stylesSource, /\.atlas-military-outcome-forecasts__panel/);
  assert.match(stylesSource, /\.atlas-military-outcome-option:focus \.atlas-military-outcome-option__detail/);
  assert.match(stylesSource, /\.atlas-military-outcome-option--gain circle/);
  assert.match(stylesSource, /\.atlas-military-outcome-option--danger circle/);
});
