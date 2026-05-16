import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas renders compatibility bundles for climate rebound follow-up queues', () => {
  assert.match(webAppSource, /buildAtlasClimateFollowUpCompatibilityBundles/);
  assert.match(webAppSource, /renderAtlasClimateFollowUpCompatibilityBundles/);
  assert.match(webAppSource, /Compatibilité suivis climat/);
  assert.match(webAppSource, /Minimal sûr/);
  assert.match(webAppSource, /Ambitieux fragile/);
  assert.match(webAppSource, /cooling-off-timing/);
  assert.match(webAppSource, /regional-residual-risk/);
  assert.match(webAppSource, /À laisser en attente si minimal/);
  assert.match(webAppSource, /renderAtlasClimateReboundFollowUpQueue\(atlasClimateReboundFollowUpQueue\)\}\s*\$\{renderAtlasClimateFollowUpCompatibilityBundles\(atlasClimateFollowUpCompatibilityBundles\)\}/);

  assert.match(stylesSource, /\.map-world-climate-follow-up-compat/);
  assert.match(stylesSource, /\.map-world-climate-follow-up-compat__item--minimal-safe/);
  assert.match(stylesSource, /\.map-world-climate-follow-up-compat__item--ambitious-fragile/);
});
