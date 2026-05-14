import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('atlas shows whether minimal consolidation prevents the next climate window', () => {
  assert.match(webAppSource, /function buildMinimalConsolidationNextClimateWindowPrevention/);
  assert.match(webAppSource, /minimalConsolidationNextClimateWindowPrevention: null/);
  assert.match(webAppSource, /minimalConsolidationNextClimateWindowPrevention,/);

  for (const stableKey of [
    'state',
    'visibleConstraint',
    'smallestUsefulComplement',
    'changesNextStep',
    'sourceConsolidation',
    'sourceReserveRisk',
    'summary',
  ]) {
    assert.match(webAppSource, new RegExp(`${stableKey}[:,]`));
  }

  assert.match(webAppSource, /fenêtre proche empêchée/);
  assert.match(webAppSource, /fenêtre contenue/);
  assert.match(webAppSource, /complément requis/);
  assert.match(webAppSource, /saison/);
  assert.match(webAppSource, /cascade voisine/);
  assert.match(webAppSource, /pression régionale/);
  assert.match(webAppSource, /dette secondaire/);
  assert.match(webAppSource, /conflit de timing/);
  assert.match(webAppSource, /réserve restante/);
  assert.match(webAppSource, /ajouter une réserve anti-cascade courte/);
  assert.match(webAppSource, /garder la consolidation légère jusqu’au prochain tour/);
  assert.match(webAppSource, /aucun complément utile/);
  assert.match(webAppSource, /Fenêtre après consolidation/);
});
