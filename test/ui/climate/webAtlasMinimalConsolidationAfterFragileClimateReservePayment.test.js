import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('atlas recommends minimal consolidation after fragile climate reserve payment', () => {
  assert.match(webAppSource, /function buildMinimalConsolidationAfterFragileClimateReservePayment/);
  assert.match(webAppSource, /minimalConsolidationAfterFragileClimateReservePayment: null/);
  assert.match(webAppSource, /minimalConsolidationAfterFragileClimateReservePayment,/);

  for (const stableKey of [
    'state',
    'visibleConstraint',
    'shortGesture',
    'changesNextStep',
    'sourceReserveRisk',
    'secondaryDebtKey',
    'secondaryDebtLabel',
    'summary',
  ]) {
    assert.match(webAppSource, new RegExp(`${stableKey}[:,]`));
  }

  assert.match(webAppSource, /consolidation inutile/);
  assert.match(webAppSource, /consolidation légère/);
  assert.match(webAppSource, /consolidation urgente/);
  assert.match(webAppSource, /saison/);
  assert.match(webAppSource, /cascade voisine/);
  assert.match(webAppSource, /pression régionale/);
  assert.match(webAppSource, /dette secondaire/);
  assert.match(webAppSource, /conflit de timing/);
  assert.match(webAppSource, /réserve restante/);
  assert.match(webAppSource, /verrouiller une réserve anti-cascade/);
  assert.match(webAppSource, /ajouter une marge courte sans surpayer la dette climat/);
  assert.match(webAppSource, /aucun geste immédiat/);
  assert.match(webAppSource, /Consolidation minimale/);
});
