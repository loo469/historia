import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('atlas explains why the top ranked climate debt choice should be paid first', () => {
  assert.match(webAppSource, /function buildTopClimateDebtPaymentExplanation/);
  assert.match(webAppSource, /topClimateDebtPaymentExplanation: null/);
  assert.match(webAppSource, /topClimateDebtPaymentExplanation,/);

  for (const stableKey of [
    'choiceKey',
    'choiceLabel',
    'pressureReduced',
    'cascadeAvoided',
    'protectedWindow',
    'riskIfDeferred',
    'reason',
    'actionHint',
  ]) {
    assert.match(webAppSource, new RegExp(`${stableKey}[:,]`));
  }

  assert.match(webAppSource, /Pourquoi payer #1/);
  assert.match(webAppSource, /Si encore différé/);
  assert.match(webAppSource, /évite une cascade de report/);
  assert.match(webAppSource, /protège/);
  assert.match(webAppSource, /Payer maintenant/);
});
