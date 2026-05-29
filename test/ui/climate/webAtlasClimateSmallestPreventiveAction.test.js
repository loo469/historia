import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas recommends the smallest preventive climate action before margin loss', () => {
  assert.match(webAppSource, /function buildAtlasClimateSmallestPreventiveAction/);
  assert.match(webAppSource, /function renderAtlasClimateSmallestPreventiveAction/);
  assert.match(webAppSource, /Prévention minimale/);
  assert.match(webAppSource, /action préventive minimale/);
  assert.match(webAppSource, /attente sûre/);
  assert.match(webAppSource, /fallback discret/);
  assert.match(webAppSource, /Plus petite action/);
  assert.match(webAppSource, /Perte évitée/);
  assert.match(webAppSource, /Intervenir maintenant limite/);
  assert.match(webAppSource, /Attendre reste sûr/);
  assert.match(webAppSource, /buildAtlasClimateSmallestPreventiveAction\(\s*atlasClimateNextTurnSafetyMarginLoss,\s*atlasClimateFollowUpThresholdProtection,\s*atlasClimateThresholdProgressAfterReadinessAction,\s*\)/);
  assert.match(webAppSource, /renderAtlasClimateNextTurnSafetyMarginLoss\(atlasClimateNextTurnSafetyMarginLoss\)\}\s*\$\{renderAtlasClimateSmallestPreventiveAction\(atlasClimateSmallestPreventiveAction\)\}/);

  assert.match(stylesSource, /\.map-world-climate-smallest-prevention/);
  assert.match(stylesSource, /\.map-world-climate-smallest-prevention--act-now/);
  assert.match(stylesSource, /\.map-world-climate-smallest-prevention--safe-to-wait/);
  assert.match(stylesSource, /\.map-world-climate-smallest-prevention--unavailable/);
});
