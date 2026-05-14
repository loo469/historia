import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('atlas shows residual reserve risk after secondary climate debt payment', () => {
  assert.match(webAppSource, /function buildResidualReserveRiskAfterSecondaryClimateDebtPayment/);
  assert.match(webAppSource, /residualReserveRiskAfterSecondaryClimateDebtPayment: null/);
  assert.match(webAppSource, /residualReserveRiskAfterSecondaryClimateDebtPayment,/);

  for (const stableKey of [
    'state',
    'visibleConstraint',
    'followUpGesture',
    'secondaryDebtKey',
    'secondaryDebtLabel',
    'changesNextStep',
    'sourceWindowEffect',
    'summary',
  ]) {
    assert.match(webAppSource, new RegExp(`${stableKey}[:,]`));
  }

  assert.match(webAppSource, /réserve suffisante/);
  assert.match(webAppSource, /réserve mince/);
  assert.match(webAppSource, /cascade voisine exposée/);
  assert.match(webAppSource, /saison/);
  assert.match(webAppSource, /cascade voisine/);
  assert.match(webAppSource, /pression régionale/);
  assert.match(webAppSource, /dette secondaire/);
  assert.match(webAppSource, /conflit de timing/);
  assert.match(webAppSource, /réserve restante/);
  assert.match(webAppSource, /garder une réserve contre la cascade voisine/);
  assert.match(webAppSource, /conserver une réserve courte/);
  assert.match(webAppSource, /aucun geste immédiat/);
  assert.match(webAppSource, /Risque réserve résiduel/);
});
