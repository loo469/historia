import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas renders post-bundle climate rebound preview after the safe recovery commitment', () => {
  assert.match(webAppSource, /buildAtlasClimateReboundAfterActionBundle/);
  assert.match(webAppSource, /renderAtlasClimateReboundAfterActionBundle/);
  assert.match(webAppSource, /Après bundle climat/);
  assert.match(webAppSource, /cooling-off/);
  assert.match(webAppSource, /Rebond probable/);
  assert.match(webAppSource, /Action minimale/);
  assert.match(webAppSource, /renderAtlasClimateCheapestSafeRecoveryCommitment\(atlasClimateCheapestSafeRecoveryCommitment\)\}\s*\$\{renderAtlasClimateReboundAfterActionBundle\(atlasClimateReboundAfterActionBundle\)\}/);

  assert.match(stylesSource, /\.map-world-climate-post-bundle-rebound/);
  assert.match(stylesSource, /\.map-world-climate-post-bundle-rebound--risky/);
});
