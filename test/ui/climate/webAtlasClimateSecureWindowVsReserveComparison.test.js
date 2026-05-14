import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('atlas compares securing restored climate window against keeping reserve', () => {
  assert.match(webAppSource, /function buildClimateSecureWindowVsReserveComparison/);
  assert.match(webAppSource, /climateSecureWindowVsReserveComparison: null/);
  assert.match(webAppSource, /climateSecureWindowVsReserveComparison,/);

  for (const stableKey of [
    'state',
    'dominantConstraint',
    'secureOption',
    'reserveOption',
    'avoidedRisk',
    'sourceFollowThrough',
    'windowState',
    'summary',
  ]) {
    assert.match(webAppSource, new RegExp(`${stableKey}[:,]`));
  }

  assert.match(webAppSource, /sécuriser maintenant/);
  assert.match(webAppSource, /garder réserve/);
  assert.match(webAppSource, /attendre sans risque notable/);
  assert.match(webAppSource, /dette secondaire/);
  assert.match(webAppSource, /saison/);
  assert.match(webAppSource, /cascade voisine/);
  assert.match(webAppSource, /pression régionale/);
  assert.match(webAppSource, /conflit de timing/);
  assert.match(webAppSource, /évite que la fenêtre restaurée se referme/);
  assert.match(webAppSource, /évite de consommer la marge nécessaire/);
  assert.match(webAppSource, /aucun arbitrage réel visible/);
  assert.match(webAppSource, /Sécuriser vs réserve/);
});
