import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas compares climate urgency timelines against mitigation readiness', () => {
  assert.match(webAppSource, /function buildAtlasClimateMitigationReadinessComparison/);
  assert.match(webAppSource, /function renderAtlasClimateMitigationReadinessComparison/);
  assert.match(webAppSource, /ready/);
  assert.match(webAppSource, /just-in-time/);
  assert.match(webAppSource, /insufficient/);
  assert.match(webAppSource, /too-late/);
  assert.match(webAppSource, /deadline, mitigation disponible et risque de cascade/);
  assert.match(webAppSource, /Timing prioritaire/);
  assert.match(webAppSource, /Problème timing/);
  assert.match(webAppSource, /atlasClimateMitigationReadiness = buildAtlasClimateMitigationReadinessComparison\(atlasClimateActionUrgencyTimeline\)/);
  assert.match(webAppSource, /renderAtlasClimateMitigationReadinessComparison\(atlasClimateMitigationReadiness\)/);

  assert.match(stylesSource, /\.map-world-climate-readiness/);
  assert.match(stylesSource, /\.map-world-climate-readiness--timing-risk/);
  assert.match(stylesSource, /\.map-world-climate-readiness__item--just-in-time/);
  assert.match(stylesSource, /\.map-world-climate-readiness__item--insufficient/);
});
