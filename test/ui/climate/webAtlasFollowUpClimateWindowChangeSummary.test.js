import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('atlas summarizes how follow-up climate payoff changes the next window', () => {
  assert.match(webAppSource, /function buildFollowUpClimateWindowChangeSummary/);
  assert.match(webAppSource, /followUpClimateWindowChangeSummary: null/);
  assert.match(webAppSource, /followUpClimateWindowChangeSummary,/);

  for (const stableKey of [
    'state',
    'effect',
    'remainingConstraint',
    'nextDecision',
    'followUpDebtLabel',
    'summary',
    'oneSentence',
  ]) {
    assert.match(webAppSource, new RegExp(`${stableKey}[:,]`));
  }

  assert.match(webAppSource, /fenêtre sûre restaurée/);
  assert.match(webAppSource, /rebond réduit seulement/);
  assert.match(webAppSource, /ne suffit pas encore/);
  assert.match(webAppSource, /contrainte restante/);
  assert.match(webAppSource, /payer maintenant/);
  assert.match(webAppSource, /attendre une meilleure fenêtre/);
  assert.match(webAppSource, /traiter une autre dette/);
  assert.match(webAppSource, /accepter le risque/);
  assert.match(webAppSource, /Fenêtre après suivi/);
});
