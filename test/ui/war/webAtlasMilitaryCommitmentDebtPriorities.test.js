import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas military commitment debt priorities reuse visible debt coverage and delay data', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryCommitmentDebtPriorities\(debtSummary, coverage, commitment\)/);
  assert.match(webAppSource, /getAtlasCommitmentDelayPressure\(commitment\?\.selectedOption\?\.delay\)/);
  assert.match(webAppSource, /coverage\?\.uncoveredFronts/);
  assert.match(webAppSource, /debtSummary\.debts/);
  assert.match(webAppSource, /renderAtlasMilitaryCommitmentDebtPriorities\(commitmentPriority\)/);
  assert.doesNotMatch(webAppSource, /new WarModel|simulateWar|hiddenPriority/);
});

test('atlas military commitment debt priorities combine pressure coverage gap and degradation window', () => {
  assert.match(webAppSource, /pressureScore = Math\.max\(0, Math\.round\(debt\.priority \/ 3\)\)/);
  assert.match(webAppSource, /coverageGap = debt\.tone === 'absent'/);
  assert.match(webAppSource, /urgencyScore = pressureScore \+ coverageGap \+ delayPressure\.score/);
  assert.match(webAppSource, /fenêtre courte/);
  assert.match(webAppSource, /couverture insuffisante/);
  assert.match(webAppSource, /pression élevée/);
  assert.match(webAppSource, /soutien partiel/);
});

test('atlas military commitment debt priorities render short ranking and quiet empty state', () => {
  assert.match(webAppSource, /Priorité dette/);
  assert.match(webAppSource, /atlas-military-commitment-priority/);
  assert.match(webAppSource, /P\$\{index \+ 1\}/);
  assert.match(webAppSource, /Aucune dette prioritaire: tous les fronts visibles sont couverts ou non urgents/);
  assert.match(stylesSource, /\.atlas-military-commitment-priority__panel/);
  assert.match(stylesSource, /\.atlas-military-priority-row--critical rect/);
  assert.match(stylesSource, /\.atlas-military-priority-marker--high circle/);
});
