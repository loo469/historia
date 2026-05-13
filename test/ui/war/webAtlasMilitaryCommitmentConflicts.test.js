import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas military commitment conflicts compare staged commitments to active fronts', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryCommitmentFrontConflicts\(commitment, shell, features\)/);
  assert.match(webAppSource, /getAtlasCommitmentTargetProvince\(commitment, shell\)/);
  assert.match(webAppSource, /targetProvinceLabel/);
  assert.match(webAppSource, /getAtlasMilitaryPressureScore\(province\)/);
  assert.match(webAppSource, /renderAtlasMilitaryCommitmentFrontConflicts\(commitmentConflicts\)/);
});

test('atlas military commitment conflicts cover stable target and ignored contested neighbor', () => {
  assert.match(webAppSource, /Cible déjà stabilisée/);
  assert.match(webAppSource, /Front voisin plus critique ignoré/);
  assert.match(webAppSource, /!targetProvince\.contested && !targetProvince\.occupied/);
  assert.match(webAppSource, /targetProvince\.neighborIds\.includes\(province\.provinceId\) && province\.contested/);
  assert.match(webAppSource, /severity: 'haute'/);
  assert.match(webAppSource, /Prioriser ou couvrir ce front avant validation/);
});

test('atlas military commitment conflicts expose readable empty and no-conflict states', () => {
  assert.match(webAppSource, /Aucun engagement militaire préparé à comparer aux fronts actifs/);
  assert.match(webAppSource, /Aucun conflit détecté/);
  assert.match(webAppSource, /atlas-military-commitment-conflicts__empty/);
  assert.match(stylesSource, /\.atlas-military-commitment-conflicts__panel/);
  assert.match(stylesSource, /\.atlas-military-commitment-conflict--high circle/);
});
