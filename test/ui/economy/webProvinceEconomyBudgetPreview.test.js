import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('playable map wires economy budget preview into province action planning', () => {
  assert.match(webAppSource, /buildProvinceEconomyBudgetPreview/);
  assert.match(webAppSource, /function renderProvinceEconomyBudgetPreview/);
  assert.match(webAppSource, /Budget économie du plan/);
  assert.match(webAppSource, /logisticsChoices: logisticsPreview\.options/);
  assert.match(webAppSource, /renderProvinceEconomyBudgetPreview\(province, economyView, shell, focusContext, intrigueView\)/);
  assert.match(stylesSource, /\.province-economy-budget-preview/);
  assert.match(stylesSource, /province-economy-budget-card--blocked/);
  assert.match(stylesSource, /province-economy-budget-preview--risky/);
});
