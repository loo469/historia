import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('atlas shows climate risk rebound after spending the top payoff', () => {
  assert.match(webAppSource, /function buildClimateRiskReboundAfterTopPayoff/);
  assert.match(webAppSource, /climateRiskReboundAfterTopPayoff: null/);
  assert.match(webAppSource, /climateRiskReboundAfterTopPayoff,/);

  for (const stableKey of [
    'state',
    'reboundScore',
    'secondaryDebtKey',
    'secondaryDebtLabel',
    'secondaryDebtCause',
    'thresholdExceeded',
    'recommendedNextAction',
    'summary',
    'reason',
  ]) {
    assert.match(webAppSource, new RegExp(`${stableKey}[:,]`));
  }

  assert.match(webAppSource, /rebond faible/);
  assert.match(webAppSource, /rebond modéré/);
  assert.match(webAppSource, /rebond fort/);
  assert.match(webAppSource, /Rebond après payoff/);
  assert.match(webAppSource, /dette secondaire/);
  assert.match(webAppSource, /prochaine action/);
});
