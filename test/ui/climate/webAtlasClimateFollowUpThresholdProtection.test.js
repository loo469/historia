import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas ranks climate follow-ups by next threshold protection', () => {
  assert.match(webAppSource, /function buildAtlasClimateFollowUpThresholdProtection/);
  assert.match(webAppSource, /function renderAtlasClimateFollowUpThresholdProtection/);
  assert.match(webAppSource, /Protection prochain seuil/);
  assert.match(webAppSource, /Meilleur follow-up seuil/);
  assert.match(webAppSource, /protège le seuil/);
  assert.match(webAppSource, /stabilise court terme/);
  assert.match(webAppSource, /insuffisant/);
  assert.match(webAppSource, /Lien seuil\/fenêtre/);
  assert.match(webAppSource, /Repousse le risque sans sécuriser/);
  assert.match(webAppSource, /buildAtlasClimateFollowUpThresholdProtection\(\s*atlasNextClimateFollowUpAction,\s*atlasClimateThresholdProgressAfterReadinessAction,\s*atlasClimateReboundFollowUpQueue,\s*\)/);
  assert.match(webAppSource, /renderAtlasNextClimateFollowUpAction\(atlasNextClimateFollowUpAction\)\}\s*\$\{renderAtlasClimateFollowUpThresholdProtection\(atlasClimateFollowUpThresholdProtection\)\}/);

  assert.match(stylesSource, /\.map-world-climate-threshold-protection/);
  assert.match(stylesSource, /\.map-world-climate-threshold-protection--stabilizes-short-term/);
  assert.match(stylesSource, /\.map-world-climate-threshold-protection--insufficient/);
  assert.match(stylesSource, /\.map-world-climate-threshold-protection__item--protects-threshold/);
  assert.match(stylesSource, /\.map-world-climate-threshold-protection__item--stabilizes-short-term/);
  assert.match(stylesSource, /\.map-world-climate-threshold-protection__item--insufficient/);
});
