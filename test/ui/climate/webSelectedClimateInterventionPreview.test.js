import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('selected province climate forecast previews the selected intervention risk reduction', () => {
  assert.match(webAppSource, /function buildSelectedClimateInterventionRiskPreview/);
  assert.match(webAppSource, /function renderSelectedClimateInterventionRiskPreview/);
  assert.match(webAppSource, /Aperçu de réduction du risque pour l’intervention climat sélectionnée/);
  assert.match(webAppSource, /Intervention sélectionnée/);
  assert.match(webAppSource, /gain immédiat/);
  assert.match(webAppSource, /gain différé/);
  assert.match(webAppSource, /Urgence persistante/);
  assert.match(webAppSource, /Cascade évitée non disponible/);
  assert.match(webAppSource, /candidateComparisons/);
  assert.match(webAppSource, /selectedInterventionPreview/);
  assert.match(webAppSource, /renderSelectedClimateInterventionRiskPreview\(forecast\.selectedInterventionPreview\)/);

  assert.match(stylesSource, /\.province-climate-risk-forecast__selected/);
  assert.match(stylesSource, /\.province-climate-risk-forecast__selected--reduced/);
  assert.match(stylesSource, /\.province-climate-risk-forecast__selected--urgent/);
  assert.match(stylesSource, /\.province-climate-risk-forecast__selected--unchanged/);
});
