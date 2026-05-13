import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas military commitment coverage aggregates staged commitments by front state', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryCommitmentCoverageSummary\(commitment, conflicts, shell, features\)/);
  assert.match(webAppSource, /committedStages/);
  assert.match(webAppSource, /coveredProvinceIds/);
  assert.match(webAppSource, /uncoveredFronts = shell\.provinces/);
  assert.match(webAppSource, /province\.contested && !coveredProvinceIds\.has\(province\.provinceId\)/);
  assert.match(webAppSource, /front actif sans engagement direct/);
});

test('atlas military commitment coverage summarizes active commitments conflicts priority and deadline', () => {
  assert.match(webAppSource, /Actifs/);
  assert.match(webAppSource, /Conflits/);
  assert.match(webAppSource, /Priorité/);
  assert.match(webAppSource, /Échéance/);
  assert.match(webAppSource, /échéance \$\{commitment\.selectedOption\.delay\}/);
  assert.match(webAppSource, /Contradictoire:/);
  assert.match(webAppSource, /renderAtlasMilitaryCommitmentCoverageSummary\(commitmentCoverage\)/);
});

test('atlas military commitment coverage renders compact map panel and empty state', () => {
  assert.match(webAppSource, /atlas-military-commitment-coverage/);
  assert.match(webAppSource, /Aucun engagement militaire staged actif à agréger par front/);
  assert.match(webAppSource, /Non couvert:/);
  assert.match(stylesSource, /\.atlas-military-commitment-coverage__panel/);
  assert.match(stylesSource, /\.atlas-military-coverage-row--uncovered/);
  assert.match(stylesSource, /\.atlas-military-coverage-row--conflict/);
});
