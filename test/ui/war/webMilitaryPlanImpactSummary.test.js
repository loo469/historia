import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('playable map exposes military plan impact summary for queued province actions', () => {
  assert.match(webAppSource, /function buildMilitaryPlanImpactSummary/);
  assert.match(webAppSource, /function renderMilitaryPlanImpactSummary/);
  assert.match(webAppSource, /Impact du plan/);
  assert.match(webAppSource, /mis à jour avec la file/);
  assert.match(webAppSource, /Fronts \/ provinces/);
  assert.match(webAppSource, /Pression attendue/);
  assert.match(webAppSource, /Contrôle probable/);
  assert.match(webAppSource, /Risque ravitaillement/);
  assert.match(webAppSource, /Aucune action militaire en file/);
  assert.match(webAppSource, /renderMilitaryPlanImpactSummary\(province, shell, focusContext, intrigueView\)/);
  assert.match(stylesSource, /\.military-plan-impact/);
  assert.match(stylesSource, /military-plan-impact__metrics/);
  assert.match(stylesSource, /military-plan-impact--ready/);
  assert.match(stylesSource, /military-plan-impact--warning/);
  assert.match(stylesSource, /military-plan-impact--danger/);
});
