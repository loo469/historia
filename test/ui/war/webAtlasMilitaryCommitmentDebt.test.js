import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas military commitment debt reuses coverage and staged commitment data', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryCommitmentDebtSummary\(coverage, commitment, shell\)/);
  assert.match(webAppSource, /coverage\?\.uncoveredFronts/);
  assert.match(webAppSource, /coverage\?\.contradictoryFronts/);
  assert.match(webAppSource, /getAtlasCommitmentTargetProvince\(commitment, shell\)/);
  assert.match(webAppSource, /renderAtlasMilitaryCommitmentDebtSummary\(commitmentDebt\)/);
  assert.doesNotMatch(webAppSource, /new WarModel|simulateWar|hiddenDebt/);
});

test('atlas military commitment debt lists active threat partial and absent coverage reasons', () => {
  assert.match(webAppSource, /pression élevée non couverte/);
  assert.match(webAppSource, /menace active encore non couverte/);
  assert.match(webAppSource, /soutien engagé ailleurs|soutien engagé sur front stabilisé/);
  assert.match(webAppSource, /tone: 'absent'/);
  assert.match(webAppSource, /tone: 'threat'/);
  assert.match(webAppSource, /tone: 'partial'/);
  assert.match(webAppSource, /priority: 70 \+ front\.pressure/);
});

test('atlas military commitment debt renders compact atlas panel markers and empty state', () => {
  assert.match(webAppSource, /atlas-military-commitment-debt/);
  assert.match(webAppSource, /Dette engagement/);
  assert.match(webAppSource, /DETTE/);
  assert.match(webAppSource, /Dette d’engagement nulle: tous les fronts actifs visibles sont couverts/);
  assert.match(stylesSource, /\.atlas-military-commitment-debt__panel/);
  assert.match(stylesSource, /\.atlas-military-debt-marker--absent circle/);
  assert.match(stylesSource, /\.atlas-military-debt-row--partial circle/);
});
