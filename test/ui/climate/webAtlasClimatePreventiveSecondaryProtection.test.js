import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas surfaces secondary protection from preventive climate actions', () => {
  assert.match(webAppSource, /function buildAtlasClimatePreventiveSecondaryProtection/);
  assert.match(webAppSource, /function renderAtlasClimatePreventiveSecondaryProtection/);
  assert.match(webAppSource, /Protection secondaire/);
  assert.match(webAppSource, /Protège aussi/);
  assert.match(webAppSource, /Effet local uniquement/);
  assert.match(webAppSource, /catastrophe régionale en cascade/);
  assert.match(webAppSource, /piste mythique sensible/);
  assert.match(webAppSource, /benefitKind/);
  assert.match(webAppSource, /change l’intérêt du choix préventif/);
  assert.match(webAppSource, /buildAtlasClimatePreventiveSecondaryProtection\(\s*atlasClimateSmallestPreventiveAction,\s*atlasClimateFollowUpThresholdProtection,\s*atlasClimateThresholdProgressAfterReadinessAction,\s*\)/);
  assert.match(webAppSource, /renderAtlasClimateSmallestPreventiveAction\(atlasClimateSmallestPreventiveAction\)\}\s*\$\{renderAtlasClimatePreventiveSecondaryProtection\(atlasClimatePreventiveSecondaryProtection\)\}/);

  assert.match(stylesSource, /\.map-world-climate-secondary-protection/);
  assert.match(stylesSource, /\.map-world-climate-secondary-protection--catastrophe/);
  assert.match(stylesSource, /\.map-world-climate-secondary-protection--myth-track/);
  assert.match(stylesSource, /\.map-world-climate-secondary-protection--threshold/);
  assert.match(stylesSource, /\.map-world-climate-secondary-protection--zone/);
});
