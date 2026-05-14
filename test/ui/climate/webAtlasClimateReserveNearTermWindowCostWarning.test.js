import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('atlas warns when keeping climate reserve creates a near-term window cost', () => {
  assert.match(webAppSource, /function buildClimateReserveNearTermWindowCostWarning/);
  assert.match(webAppSource, /climateReserveNearTermWindowCostWarning: null/);
  assert.match(webAppSource, /climateReserveNearTermWindowCostWarning,/);

  for (const stableKey of [
    'state',
    'visibleConstraint',
    'recommendedGesture',
    'reserveChoice',
    'windowState',
    'summary',
  ]) {
    assert.match(webAppSource, new RegExp(`${stableKey}[:,]`));
  }

  assert.match(webAppSource, /aucun coût proche/);
  assert.match(webAppSource, /coût acceptable/);
  assert.match(webAppSource, /fenêtre proche menacée/);
  assert.match(webAppSource, /saison/);
  assert.match(webAppSource, /cascade voisine/);
  assert.match(webAppSource, /dette secondaire/);
  assert.match(webAppSource, /pression régionale/);
  assert.match(webAppSource, /conflit de timing/);
  assert.match(webAppSource, /fenêtre restaurée/);
  assert.match(webAppSource, /sécuriser la fenêtre maintenant/);
  assert.match(webAppSource, /réserver un paiement court au prochain tour/);
  assert.match(webAppSource, /aucun geste immédiat/);
  assert.match(webAppSource, /Coût réserve court terme/);
});
