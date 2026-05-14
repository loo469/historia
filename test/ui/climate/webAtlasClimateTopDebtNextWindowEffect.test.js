import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('atlas shows how paying top climate debt affects the next decision window', () => {
  assert.match(webAppSource, /function buildTopClimateDebtNextWindowEffect/);
  assert.match(webAppSource, /topClimateDebtNextWindowEffect: null/);
  assert.match(webAppSource, /topClimateDebtNextWindowEffect,/);

  for (const stableKey of [
    'choiceKey',
    'status',
    'pressureEffect',
    'cascadeEffect',
    'marginRecovered',
    'statusReason',
    'summary',
    'oneSentence',
  ]) {
    assert.match(webAppSource, new RegExp(`${stableKey}[:,]`));
  }

  assert.match(webAppSource, /plus sûre/);
  assert.match(webAppSource, /inchangée/);
  assert.match(webAppSource, /encore fragile/);
  assert.match(webAppSource, /marge récupérée/);
  assert.match(webAppSource, /Effet fenêtre suivante/);
  assert.match(webAppSource, /Après paiement #1/);
});
