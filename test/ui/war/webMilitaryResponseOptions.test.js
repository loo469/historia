import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('selected conflict provinces compare compact military response options', () => {
  assert.match(webAppSource, /function buildMilitaryResponseOptions/);
  assert.match(webAppSource, /function renderMilitaryResponseOptions/);
  assert.match(webAppSource, /buildSelectedProvinceActionQueue\(province, shell, focusContext, intrigueView\)/);
  assert.match(webAppSource, /buildConflictReadinessWarnings\(shell, intrigueView\)/);
  assert.match(webAppSource, /Réponses militaires/);
  assert.match(webAppSource, /Comparer avant d’engager/);
  assert.match(webAppSource, /Option prioritaire/);
  assert.match(webAppSource, /Option prudente/);
  assert.match(webAppSource, /Option de réserve/);
  assert.match(webAppSource, /Coût \/ risque/);
  assert.match(webAppSource, /Effet prochain tour/);
  assert.match(webAppSource, /Raison locale/);
  assert.match(webAppSource, /renderMilitaryResponseOptions\(province, shell, focusContext, intrigueView\)/);
  assert.match(stylesSource, /\.military-response-options/);
  assert.match(stylesSource, /\.military-response-options__grid/);
  assert.match(stylesSource, /military-response-option--blocked/);
  assert.match(stylesSource, /military-response-option--risky/);
  assert.match(stylesSource, /military-response-option--ready/);
});
