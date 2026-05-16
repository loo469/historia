import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas renders a post-preview climate rebound follow-up queue', () => {
  assert.match(webAppSource, /buildAtlasClimateReboundFollowUpQueue/);
  assert.match(webAppSource, /renderAtlasClimateReboundFollowUpQueue/);
  assert.match(webAppSource, /File suivis rebound/);
  assert.match(webAppSource, /Raison/);
  assert.match(webAppSource, /Si ignoré/);
  assert.match(webAppSource, /Prochaine action/);
  assert.match(webAppSource, /urgent/);
  assert.match(webAppSource, /prudent/);
  assert.match(webAppSource, /deferrable/);
  assert.match(webAppSource, /renderAtlasClimateReboundAfterActionBundle\(atlasClimateReboundAfterActionBundle\)\}\s*\$\{renderAtlasClimateReboundFollowUpQueue\(atlasClimateReboundFollowUpQueue\)\}/);

  assert.match(stylesSource, /\.map-world-climate-rebound-follow-up/);
  assert.match(stylesSource, /\.map-world-climate-rebound-follow-up__item--urgent/);
  assert.match(stylesSource, /\.map-world-climate-rebound-follow-up__item--prudent/);
  assert.match(stylesSource, /\.map-world-climate-rebound-follow-up__item--deferrable/);
});
