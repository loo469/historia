import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas flags urgent climate plans whose execution readiness is under-prepared', () => {
  assert.match(webAppSource, /function buildAtlasClimateUnderReadyExecutionGaps/);
  assert.match(webAppSource, /function renderAtlasClimateUnderReadyExecutionGaps/);
  assert.match(webAppSource, /region\.status === 'insufficient' \|\| region\.status === 'too-late'/);
  assert.match(webAppSource, /gapType = region\.status === 'too-late'/);
  assert.match(webAppSource, /délai/);
  assert.match(webAppSource, /capacité/);
  assert.match(webAppSource, /ressource/);
  assert.match(webAppSource, /dépendance régionale/);
  assert.match(webAppSource, /Manque concret/);
  assert.match(webAppSource, /Risque exécution/);
  assert.match(webAppSource, /aucun avertissement ajouté/);
  assert.match(webAppSource, /atlasClimateUnderReadyExecutionGaps = buildAtlasClimateUnderReadyExecutionGaps\(atlasClimateMitigationReadiness\)/);
  assert.match(webAppSource, /renderAtlasClimateUnderReadyExecutionGaps\(atlasClimateUnderReadyExecutionGaps\)/);

  assert.match(stylesSource, /\.map-world-climate-under-ready/);
  assert.match(stylesSource, /\.map-world-climate-under-ready__item--insufficient/);
  assert.match(stylesSource, /\.map-world-climate-under-ready__item--too-late/);
});
