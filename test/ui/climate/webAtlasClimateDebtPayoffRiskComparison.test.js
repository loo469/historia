import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('atlas compares top climate debt payoff against next-window risk reduction', () => {
  assert.match(webAppSource, /function buildClimateDebtPayoffRiskComparison/);
  assert.match(webAppSource, /climateDebtPayoffRiskComparison: null/);
  assert.match(webAppSource, /climateDebtPayoffRiskComparison,/);

  for (const stableKey of [
    'choiceKey',
    'costLabel',
    'payoff',
    'riskReduction',
    'nextWindowStatus',
    'necessaryDespiteLimitedReduction',
    'summary',
    'reason',
  ]) {
    assert.match(webAppSource, new RegExp(`${stableKey}[:,]`));
  }

  assert.match(webAppSource, /Payoff risque\/coût/);
  assert.match(webAppSource, /Payoff \$\{payoff\}/);
  assert.match(webAppSource, /fort/);
  assert.match(webAppSource, /correct/);
  assert.match(webAppSource, /faible/);
  assert.match(webAppSource, /réduction immédiate limitée/);
  assert.match(webAppSource, /Paiement nécessaire malgré le gain limité/);
});
