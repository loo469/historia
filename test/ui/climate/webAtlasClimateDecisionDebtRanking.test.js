import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('atlas ranks climate decision-window choices by downstream debt', () => {
  assert.match(webAppSource, /function buildClimateDecisionDebtRanking/);
  assert.match(webAppSource, /decisionDebtRanking/);
  assert.match(webAppSource, /items: \[\]/);

  for (const stableKey of [
    'estimatedDownstreamDebt',
    'debtScore',
    'mainRisk',
    'bestUse',
    'reason',
    'signals',
    'uncertainty',
  ]) {
    assert.match(webAppSource, new RegExp(`${stableKey}[:,]`));
  }

  assert.match(webAppSource, /act-now/);
  assert.match(webAppSource, /wait-one-turn/);
  assert.match(webAppSource, /replace-commitment/);
  assert.match(webAppSource, /deadlineEffect/);
  assert.match(webAppSource, /regionalPressureEffect/);
  assert.match(webAppSource, /climateDebtAfter/);
  assert.match(webAppSource, /Dette aval classée/);
  assert.match(webAppSource, /classement à confirmer/);
  assert.match(webAppSource, /classement déterministe depuis deadline/);
});
