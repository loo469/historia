import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas shows remaining climate coverage gaps after prevention', () => {
  assert.match(webAppSource, /function buildAtlasClimateRemainingCoverageGaps/);
  assert.match(webAppSource, /function renderAtlasClimateRemainingCoverageGaps/);
  assert.match(webAppSource, /Couverture restante/);
  assert.match(webAppSource, /Protections actives/);
  assert.match(webAppSource, /Protections secondaires/);
  assert.match(webAppSource, /Angles morts restants/);
  assert.match(webAppSource, /Prochaine petite prévention/);
  assert.match(webAppSource, /aucun angle mort prioritaire/);
  assert.match(webAppSource, /buildAtlasClimateRemainingCoverageGaps\(\s*atlasClimateSmallestPreventiveAction,\s*atlasClimatePreventiveSecondaryProtection,\s*atlasClimateFollowUpThresholdProtection,\s*atlasClimateThresholdProgressAfterReadinessAction,\s*\)/);
  assert.match(webAppSource, /renderAtlasClimatePreventiveSecondaryProtection\(atlasClimatePreventiveSecondaryProtection\)\}\s*\$\{renderAtlasClimateRemainingCoverageGaps\(atlasClimateRemainingCoverageGaps\)\}/);

  assert.match(stylesSource, /\.map-world-climate-coverage-gaps/);
  assert.match(stylesSource, /\.map-world-climate-coverage-gaps--has-gaps/);
  assert.match(stylesSource, /\.map-world-climate-coverage-gaps--covered/);
});
