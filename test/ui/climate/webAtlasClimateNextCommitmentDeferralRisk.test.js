import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('atlas previews one-turn deferral risk for the next climate commitment', () => {
  assert.match(webAppSource, /function buildNextClimateCommitmentDeferralRisk/);
  assert.match(webAppSource, /deferralRiskPreview/);

  for (const stableKey of [
    'deadlineTouched',
    'pressureMaintained',
    'pressureAdded',
    'mainRisk',
    'decideNowHint',
    'reason',
  ]) {
    assert.match(webAppSource, new RegExp(`${stableKey}[:,]`));
  }

  for (const coveredCase of [
    'tolerable-deferral',
    'deadline-threatened',
    'regional-capacity-insufficient',
    'exposure-worsens',
    'no-next-commitment',
  ]) {
    assert.match(webAppSource, new RegExp(coveredCase));
  }

  assert.match(webAppSource, /Risque de report/);
  assert.match(webAppSource, /Agir maintenant évite/);
  assert.match(webAppSource, /Attendre un tour reste lisible/);
  assert.match(webAppSource, /pression de report \+1 tour/);
});
