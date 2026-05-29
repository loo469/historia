import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas shows safety margin after climate threshold follow-up actions', () => {
  assert.match(webAppSource, /function buildAtlasClimateFollowUpSafetyMargin/);
  assert.match(webAppSource, /function renderAtlasClimateFollowUpSafetyMargin/);
  assert.match(webAppSource, /Marge après follow-up/);
  assert.match(webAppSource, /marge confortable/);
  assert.match(webAppSource, /marge correcte/);
  assert.match(webAppSource, /marge faible/);
  assert.match(webAppSource, /marge inconnue/);
  assert.match(webAppSource, /Consomme la marge/);
  assert.match(webAppSource, /Seconde action préventive/);
  assert.match(webAppSource, /Fallback lisible/);
  assert.match(webAppSource, /buildAtlasClimateFollowUpSafetyMargin\(\s*atlasClimateFollowUpThresholdProtection,\s*atlasNextClimateFollowUpAction,\s*atlasClimateThresholdProgressAfterReadinessAction,\s*\)/);
  assert.match(webAppSource, /renderAtlasClimateFollowUpThresholdProtection\(atlasClimateFollowUpThresholdProtection\)\}\s*\$\{renderAtlasClimateFollowUpSafetyMargin\(atlasClimateFollowUpSafetyMargin\)\}/);

  assert.match(stylesSource, /\.map-world-climate-follow-up-safety-margin/);
  assert.match(stylesSource, /\.map-world-climate-follow-up-safety-margin--correct/);
  assert.match(stylesSource, /\.map-world-climate-follow-up-safety-margin--weak/);
  assert.match(stylesSource, /\.map-world-climate-follow-up-safety-margin--unknown/);
});
