import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas climate mitigation synergies reuse cascade previews for compact multi-effect badges', () => {
  assert.match(webAppSource, /function buildAtlasClimateMitigationSynergies/);
  assert.match(webAppSource, /function renderAtlasClimateMitigationSynergies/);
  assert.match(webAppSource, /cascadePreview\.impacts/);
  assert.match(webAppSource, /buildProvinceClimateRiskReductionForecast\(province, shell\)/);
  assert.match(webAppSource, /buildClimateInterventionQueuePlan\(province, forecast\)/);
  assert.match(webAppSource, /cascade évitée/);
  assert.match(webAppSource, /route protégée/);
  assert.match(webAppSource, /saison critique/);
  assert.match(webAppSource, /région prioritaire/);
  assert.match(webAppSource, /aucun bruit visuel ajouté/);
  assert.match(webAppSource, /atlasClimateMitigationSynergies = buildAtlasClimateMitigationSynergies\(shell, atlasClimateCascadeImpact, worldClimateLayer\)/);
  assert.match(webAppSource, /renderAtlasClimateMitigationSynergies\(atlasClimateMitigationSynergies\)/);
  assert.match(webAppSource, /map-world-climate-synergy__badges/);

  assert.match(stylesSource, /\.map-world-climate-synergy/);
  assert.match(stylesSource, /\.map-world-climate-synergy--priority/);
  assert.match(stylesSource, /\.map-world-climate-synergy__badges/);
});
