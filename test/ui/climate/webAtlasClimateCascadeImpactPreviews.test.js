import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas climate timeline previews cascade impacts on regions and routes', () => {
  assert.match(webAppSource, /function buildAtlasClimateCascadeImpactPreview/);
  assert.match(webAppSource, /function renderAtlasClimateCascadeImpactPreview/);
  assert.match(webAppSource, /worldClimateLayer\.timeline\.decisionChanges/);
  assert.match(webAppSource, /worldClimateLayer\.timeline\.urgentCurrentEntries/);
  assert.match(webAppSource, /province\?\.neighborIds/);
  assert.match(webAppSource, /intensity = entry\.disaster \? 'critical' : entry\.anomaly \? 'elevated' : 'watch'/);
  assert.match(webAppSource, /horizon = worldClimateLayer\.timeline\.mode === 'current'/);
  assert.match(webAppSource, /confidence = entry\.disaster \? 'haute' : entry\.anomaly \? 'moyenne' : 'prudente'/);
  assert.match(webAppSource, /Aucune cascade climat pertinente prévue/);
  assert.match(webAppSource, /Routes<\/b> · \$\{impact\.routeImpact\}/);
  assert.match(webAppSource, /atlasClimateCascadeImpact = buildAtlasClimateCascadeImpactPreview\(shell, worldClimateLayer\)/);
  assert.match(webAppSource, /renderAtlasClimateCascadeImpactPreview\(atlasClimateCascadeImpact\)/);

  assert.match(stylesSource, /\.map-world-climate-cascade/);
  assert.match(stylesSource, /\.map-world-climate-cascade--critical/);
  assert.match(stylesSource, /\.map-world-climate-cascade__item--elevated/);
});
