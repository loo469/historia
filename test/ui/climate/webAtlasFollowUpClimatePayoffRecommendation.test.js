import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('atlas recommends follow-up climate payoff that limits risk rebound', () => {
  assert.match(webAppSource, /function buildFollowUpClimatePayoffRecommendation/);
  assert.match(webAppSource, /followUpClimatePayoffRecommendation: null/);
  assert.match(webAppSource, /followUpClimatePayoffRecommendation,/);

  for (const stableKey of [
    'state',
    'followUpDebtKey',
    'followUpDebtLabel',
    'reboundState',
    'nextAction',
    'reason',
    'summary',
  ]) {
    assert.match(webAppSource, new RegExp(`${stableKey}[:,]`));
  }

  assert.match(webAppSource, /Paiement de suivi/);
  assert.match(webAppSource, /Paiement de suivi recommandé/);
  assert.match(webAppSource, /Aucun paiement de suivi sûr ou utile/);
  assert.match(webAppSource, /limiter \$\{climateRiskReboundAfterTopPayoff.state\}/);
  assert.match(webAppSource, /réduit le rebond/);
  assert.match(webAppSource, /Prochaine action/);
});
