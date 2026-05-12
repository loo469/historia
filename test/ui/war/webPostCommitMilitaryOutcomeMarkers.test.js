import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('committed military map queues leave lightweight outcome markers', () => {
  assert.match(webAppSource, /lastMilitaryOutcomeMarkers: \[\]/);
  assert.match(webAppSource, /function buildPostCommitMilitaryOutcomeMarker/);
  assert.match(webAppSource, /function renderPostCommitMilitaryOutcomeMarker/);
  assert.match(webAppSource, /function renderSelectedProvinceMilitaryOutcomeMarker/);
  assert.match(webAppSource, /province-node__military-outcome/);
  assert.match(webAppSource, /data-military-outcome/);
  assert.match(webAppSource, /has-military-outcome--\$\{militaryOutcomeMarker\.tone\}/);
  assert.match(webAppSource, /Issue militaire dernier tour/);
  assert.match(webAppSource, /Référence rapport militaire/);
  assert.match(webAppSource, /state\.lastMilitaryOutcomeMarkers = militaryOutcomeMarker \? \[militaryOutcomeMarker\] : \[\]/);
  assert.match(webAppSource, /state\.acceptedRecommendedMilitaryAction = null/);
  assert.match(stylesSource, /\.province-surface\.has-military-outcome/);
  assert.match(stylesSource, /\.province-node__military-outcome--stabilized/);
  assert.match(stylesSource, /\.province-node__military-outcome--worsened/);
  assert.match(stylesSource, /\.province-node__military-outcome--blocked/);
  assert.match(stylesSource, /\.province-node__military-outcome--risk/);
  assert.match(stylesSource, /\.post-commit-military-outcome/);
});
