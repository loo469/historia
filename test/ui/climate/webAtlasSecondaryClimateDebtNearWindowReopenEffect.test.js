import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('atlas shows whether paying secondary climate debt reopens the near window', () => {
  assert.match(webAppSource, /function buildSecondaryClimateDebtNearWindowReopenEffect/);
  assert.match(webAppSource, /secondaryClimateDebtNearWindowReopenEffect: null/);
  assert.match(webAppSource, /secondaryClimateDebtNearWindowReopenEffect,/);

  for (const stableKey of [
    'state',
    'secondaryDebtKey',
    'secondaryDebtLabel',
    'visibleConstraint',
    'immediateGesture',
    'changesDecision',
    'reserveStillNeeded',
    'summary',
  ]) {
    assert.match(webAppSource, new RegExp(`${stableKey}[:,]`));
  }

  assert.match(webAppSource, /fenêtre rouverte/);
  assert.match(webAppSource, /fenêtre stabilisée mais fragile/);
  assert.match(webAppSource, /paiement insuffisant/);
  assert.match(webAppSource, /saison/);
  assert.match(webAppSource, /cascade voisine/);
  assert.match(webAppSource, /pression régionale/);
  assert.match(webAppSource, /dette secondaire/);
  assert.match(webAppSource, /conflit de timing/);
  assert.match(webAppSource, /réserve restante/);
  assert.match(webAppSource, /payer \$\{secondaryClimateDebtWhenReserveCostsWindow\.secondaryDebtLabel\} maintenant/);
  assert.match(webAppSource, /puis garder une réserve courte/);
  assert.match(webAppSource, /aucun geste immédiat/);
  assert.match(webAppSource, /Effet paiement dette secondaire/);
});
