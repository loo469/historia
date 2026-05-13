import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

const projectionSignals = [
  ['deadline moins serrée', 'deadline à surveiller'],
  ['capacité régionale libérée', 'cascade évitée à confirmer'],
  ['exposition réduite', 'exposition résiduelle'],
  ['aucun relief sûr', 'risque accepté sans relief sûr'],
];

test('atlas projects the climate recovery plan before and after with stable remaining risks', () => {
  assert.match(webAppSource, /function buildAtlasClimateRecoveryPlanProjection/);
  assert.match(webAppSource, /function renderAtlasClimateRecoveryPlanProjection/);
  assert.match(webAppSource, /state: 'neutral'/);
  assert.match(webAppSource, /Aucune projection recovery climat: aucune anomalie, catastrophe ou action recovery active/);
  assert.match(webAppSource, /currentState/);
  assert.match(webAppSource, /proposedActions/);
  assert.match(webAppSource, /projectedState/);
  assert.match(webAppSource, /firstPressureRelieved/);
  assert.match(webAppSource, /remainingRiskCandidates/);
  assert.match(webAppSource, /sort\(\(left, right\) => left\.priority - right\.priority \|\| left\.label\.localeCompare\(right\.label\)\)/);
  assert.match(webAppSource, /atlasClimateRecoveryPlanProjection = buildAtlasClimateRecoveryPlanProjection\(atlasClimateFirstRecoveryPressureReliefExplanation, atlasClimateRecoveryCollateralReliefRanking\)/);
  assert.match(webAppSource, /renderAtlasClimateRecoveryPlanProjection\(atlasClimateRecoveryPlanProjection\)/);

  for (const [relief, remainingRisk] of projectionSignals) {
    assert.match(webAppSource, new RegExp(relief));
    assert.match(webAppSource, new RegExp(remainingRisk));
  }

  assert.match(webAppSource, /Projection recovery/);
  assert.match(webAppSource, /Risques restants/);
  assert.match(stylesSource, /\.map-world-climate-recovery-projection/);
  assert.match(stylesSource, /\.map-world-climate-recovery-projection--projected-with-risk/);
});
