import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('climate severity legend prioritizes mitigation sequences from marker stacks', () => {
  assert.match(webAppSource, /function getClimateSeverityRank/);
  assert.match(webAppSource, /function buildClimateMitigationSequenceFromSeverity/);
  assert.match(webAppSource, /buildProvinceClimateRiskReductionForecast\(province, shell\)/);
  assert.match(webAppSource, /buildClimateInterventionQueuePlan\(province, forecast\)/);
  assert.match(webAppSource, /linkedNeighbors = province\.neighborIds/);
  assert.match(webAppSource, /Soulage aussi/);
  assert.match(webAppSource, /Réduit la pression du groupe cascade sélectionné/);
  assert.match(webAppSource, /mitigationSequence/);
  assert.match(webAppSource, /Séquence de mitigation climat priorisée/);
  assert.match(webAppSource, /fenêtre \$\{step\.window\}/);
  assert.match(webAppSource, /buildClimateSeverityLegend\(postCommitClimateMarkers, climateMarkerDensity, shell\)/);

  assert.match(stylesSource, /\.map-climate-severity-legend__sequence/);
  assert.match(stylesSource, /\.map-climate-severity-legend__sequence-step/);
  assert.match(stylesSource, /\.map-climate-severity-legend__sequence-step--cascade-active/);
  assert.match(stylesSource, /\.map-climate-severity-legend__sequence-step--hazard-unresolved/);
});
