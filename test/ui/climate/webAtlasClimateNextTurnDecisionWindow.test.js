import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('atlas converts climate deferral risk into a prioritized next-turn decision window', () => {
  assert.match(webAppSource, /function buildClimateNextTurnDecisionWindow/);
  assert.match(webAppSource, /decisionWindow: null/);
  assert.match(webAppSource, /decisionWindow:/);

  for (const stableKey of [
    'immediateRisk',
    'futureDebt',
    'sourceDeadline',
    'choices',
    'synergies',
    'conflicts',
    'summary',
  ]) {
    assert.match(webAppSource, new RegExp(`${stableKey}[:,]`));
  }

  for (const choice of ['act-now', 'wait-one-turn', 'replace-commitment']) {
    assert.match(webAppSource, new RegExp(choice));
  }

  for (const effectKey of ['deadlineEffect', 'regionalPressureEffect', 'climateDebtAfter']) {
    assert.match(webAppSource, new RegExp(`${effectKey}:`));
  }

  assert.match(webAppSource, /Fenêtre décision climat prochain tour/);
  assert.match(webAppSource, /Synergies\/conflits/);
  assert.match(webAppSource, /militaire/);
  assert.match(webAppSource, /logistique/);
  assert.match(webAppSource, /culture/);
  assert.match(webAppSource, /urgent-window/);
});
