import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('climate mitigation follow-up debt summarizes resolved partial and open outcomes', () => {
  assert.match(webAppSource, /function buildClimateFollowUpDebtSummary/);
  assert.match(webAppSource, /function renderClimateFollowUpDebtSummary/);
  assert.match(webAppSource, /marker\.status === 'risk-reduced'/);
  assert.match(webAppSource, /marker\.status === 'hazard-delayed'/);
  assert.match(webAppSource, /marker\.status === 'hazard-unresolved' \|\| marker\.status === 'cascade-active'/);
  assert.match(webAppSource, /Bénéfices obtenus/);
  assert.match(webAppSource, /Conséquences ouvertes/);
  assert.match(webAppSource, /Aucun bénéfice cross-domain confirmé/);
  assert.match(webAppSource, /Aucune conséquence critique ouverte/);
  assert.match(webAppSource, /climateFollowUpDebt = buildClimateFollowUpDebtSummary\(postCommitClimateMarkers, climateSeverityLegend\.mitigationSequence \?\? \[\]\)/);
  assert.match(webAppSource, /renderClimateFollowUpDebtSummary\(climateFollowUpDebt\)/);

  assert.match(stylesSource, /\.map-climate-follow-up-debt/);
  assert.match(stylesSource, /\.map-climate-follow-up-debt--debt/);
  assert.match(stylesSource, /\.map-climate-follow-up-debt--partial/);
  assert.match(stylesSource, /\.map-climate-follow-up-debt--resolved/);
});
