import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas staged commitments select a military forecast without leaving the map', () => {
  assert.match(webAppSource, /selectedAtlasMilitaryOutcomeOptionId: null/);
  assert.match(webAppSource, /data-atlas-military-outcome-option/);
  assert.match(webAppSource, /state\.selectedAtlasMilitaryOutcomeOptionId = element\.dataset\.atlasMilitaryOutcomeOption/);
  assert.match(webAppSource, /function buildAtlasMilitaryStagedCommitment\(forecasts, selectedOptionId = state\.selectedAtlasMilitaryOutcomeOptionId\)/);
  assert.match(webAppSource, /forecasts\.options\.find\(\(option\) => option\.optionId === selectedOptionId\)/);
});

test('atlas staged commitments prepare two or three readable commitment stages', () => {
  assert.match(webAppSource, /Repérer/);
  assert.match(webAppSource, /Engager/);
  assert.match(webAppSource, /Suivi|Réserve/);
  assert.match(webAppSource, /costRisk/);
  assert.match(webAppSource, /territory/);
  assert.match(webAppSource, /effect/);
  assert.match(webAppSource, /prévisionnel/);
  assert.match(webAppSource, /à engager/);
  assert.match(webAppSource, /renderAtlasMilitaryStagedCommitment\(stagedCommitment\)/);
});

test('atlas staged commitments expose unavailable state and selected styling', () => {
  assert.match(webAppSource, /Engagement indisponible: aucune prévision militaire pertinente/);
  assert.match(webAppSource, /atlas-military-staged-commitment__empty/);
  assert.match(stylesSource, /\.atlas-military-staged-commitment__panel/);
  assert.match(stylesSource, /\.atlas-military-commitment-stage--commit rect/);
  assert.match(stylesSource, /\.atlas-military-outcome-option\.is-selected circle/);
});
