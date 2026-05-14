import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('atlas previews remaining deadline pressure after cheapest safe climate commitment', () => {
  assert.match(webAppSource, /function buildRemainingDeadlinePressureAfterCommitment/);
  assert.match(webAppSource, /remainingDeadlinePressure: null/);
  assert.match(webAppSource, /remainingDeadlinePressure,/);

  for (const stableKey of [
    'state',
    'deadlineCovered',
    'deadlineStillThreatened',
    'pressureReduced',
    'resolvedByCommitment',
    'unresolvedAfterCommitment',
    'nextAction',
    'reason',
  ]) {
    assert.match(webAppSource, new RegExp(`${stableKey}[:,]`));
  }

  assert.match(webAppSource, /deadline-watch/);
  assert.match(webAppSource, /residual-watch/);
  assert.match(webAppSource, /clear/);
  assert.match(webAppSource, /Pression deadline restante/);
  assert.match(webAppSource, /Prochaine action/);
  assert.match(webAppSource, /Confirmer un second jalon avant/);
  assert.match(webAppSource, /La deadline couverte ne laisse aucune pression visible/);
});
