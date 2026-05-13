import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas ranks climate action plans by deadline severity and regional exposure', () => {
  assert.match(webAppSource, /function getAtlasClimateActionPlanUrgencyScore/);
  assert.match(webAppSource, /function buildAtlasClimateActionPlanRanking/);
  assert.match(webAppSource, /function renderAtlasClimateActionPlanRanking/);
  assert.match(webAppSource, /deadlineRank/);
  assert.match(webAppSource, /severityRank/);
  assert.match(webAppSource, /exposureRank/);
  assert.match(webAppSource, /catastrophe\/cascade active avant la deadline/);
  assert.match(webAppSource, /exposition régionale encore vulnérable/);
  assert.match(webAppSource, /expectedImpact/);
  assert.match(webAppSource, /sort\(\(left, right\) => right\.urgencyScore - left\.urgencyScore/);
  assert.match(webAppSource, /atlasClimateActionPlanRanking = buildAtlasClimateActionPlanRanking\(atlasClimateActionPlan\)/);
  assert.match(webAppSource, /renderAtlasClimateActionPlanRanking\(atlasClimateActionPlanRanking\)/);
  assert.match(webAppSource, /Priorités plans climat/);
  assert.match(webAppSource, /Impact attendu/);

  assert.match(stylesSource, /\.map-world-climate-action-ranking/);
  assert.match(stylesSource, /\.map-world-climate-action-ranking__item--critical/);
});
