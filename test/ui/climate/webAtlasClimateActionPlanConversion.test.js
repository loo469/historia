import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas converts seasonal mitigation comparisons into climate action plans', () => {
  assert.match(webAppSource, /function buildAtlasClimateActionPlanFromComparison/);
  assert.match(webAppSource, /function renderAtlasClimateActionPlan/);
  assert.match(webAppSource, /planComparison\.bestPlan \?\? planComparison\.plans/);
  assert.match(webAppSource, /vulnerablePlans = planComparison\.plans\.filter/);
  assert.match(webAppSource, /Plan d’action proposé/);
  assert.match(webAppSource, /Saison\/fenêtre/);
  assert.match(webAppSource, /Régions touchées/);
  assert.match(webAppSource, /Cascade évitée\/réduite/);
  assert.match(webAppSource, /Coût\/compromis/);
  assert.match(webAppSource, /Vulnérable/);
  assert.match(webAppSource, /atlasClimateActionPlan = buildAtlasClimateActionPlanFromComparison\(atlasSeasonalPlanComparison\)/);
  assert.match(webAppSource, /renderAtlasClimateActionPlan\(atlasClimateActionPlan\)/);

  assert.match(stylesSource, /\.map-world-climate-action-plan/);
  assert.match(stylesSource, /\.map-world-climate-action-plan--warning/);
  assert.match(stylesSource, /\.map-world-climate-action-plan__card/);
});
