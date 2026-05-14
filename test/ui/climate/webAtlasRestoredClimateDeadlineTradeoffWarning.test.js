import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('atlas warns when a restored climate window still leaves a deadline tradeoff', () => {
  assert.match(webAppSource, /function buildRestoredClimateDeadlineTradeoffWarning/);
  assert.match(webAppSource, /restoredClimateDeadlineTradeoffWarning: null/);
  assert.match(webAppSource, /restoredClimateDeadlineTradeoffWarning,/);

  for (const stableKey of [
    'state',
    'deadline',
    'tradeoffName',
    'remainingConstraint',
    'action',
    'summary',
  ]) {
    assert.match(webAppSource, new RegExp(`${stableKey}[:,]`));
  }

  assert.match(webAppSource, /aucun tradeoff restant/);
  assert.match(webAppSource, /tradeoff modéré/);
  assert.match(webAppSource, /tradeoff critique/);
  assert.match(webAppSource, /payer encore/);
  assert.match(webAppSource, /accepter un risque court/);
  assert.match(webAppSource, /déplacer la décision/);
  assert.match(webAppSource, /Alerte tradeoff deadline/);
});
