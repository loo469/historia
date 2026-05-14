import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('atlas recommends the next climate commitment from residual deadline pressure', () => {
  assert.match(webAppSource, /function buildNextClimateCommitmentAfterResidualPressure/);
  assert.match(webAppSource, /nextClimateCommitment: null/);
  assert.match(webAppSource, /nextClimateCommitment,/);

  for (const stableKey of [
    'deadlineTargeted',
    'action',
    'avoidsRepeating',
    'cost',
    'effortScore',
    'pressureReduced',
    'riskIfDeferred',
    'remainsAfterCommitment',
    'reason',
  ]) {
    assert.match(webAppSource, new RegExp(`${stableKey}[:,]`));
  }

  assert.match(webAppSource, /remainingDeadlinePressure\.deadlineStillThreatened/);
  assert.match(webAppSource, /Second engagement climat/);
  assert.match(webAppSource, /deadline confirmée/);
  assert.match(webAppSource, /sans répéter/);
  assert.match(webAppSource, /Prochain engagement/);
  assert.match(webAppSource, /Si différé/);
  assert.match(webAppSource, /Après lui/);
});
