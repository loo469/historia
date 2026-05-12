import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('selected province panel compares climate mitigation priorities before deadlines', () => {
  assert.match(webAppSource, /function buildProvinceClimateMitigationPriorities/);
  assert.match(webAppSource, /function renderProvinceClimateMitigationPriorities/);
  assert.match(webAppSource, /Comparaison des priorités de mitigation climat/);
  assert.match(webAppSource, /Priorités mitigation climat/);
  assert.match(webAppSource, /buildProvinceClimateCountdownCues\(province, report\)/);
  assert.match(webAppSource, /Évacuer \/ mitiger/);
  assert.match(webAppSource, /Préparer réserves/);
  assert.match(webAppSource, /Déplacer ressources \/ réparation/);
  assert.match(webAppSource, /Observation \/ attente/);
  assert.match(webAppSource, /deadline/);
  assert.match(webAppSource, /avoidedImpact/);
  assert.match(webAppSource, /tradeoff/);
  assert.match(webAppSource, /outcomeChange/);
  assert.match(webAppSource, /renderProvinceClimateMitigationPriorities\(province\)/);

  assert.match(stylesSource, /\.province-climate-mitigation-priorities/);
  assert.match(stylesSource, /\.province-climate-mitigation-priority-list/);
  assert.match(stylesSource, /\.province-climate-mitigation-priority\.is-decisive/);
  assert.match(stylesSource, /\.province-climate-mitigation-priority\.is-observation/);
});
