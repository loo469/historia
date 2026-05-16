import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas military confidence handoff aggregates visible carry-over outcomes by province', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryCarryOverConfidenceHandoff\(carryOverQueue, outcomeTimeline\)/);
  assert.match(webAppSource, /const items = carryOverQueue\?\.items \?\? \[\]/);
  assert.match(webAppSource, /timelineByProvince\.get\(item\.provinceLabel\)/);
  assert.match(webAppSource, /buildAtlasMilitaryCarryOverConfidenceHandoff\(nextTurnCarryOverQueue, carryOverOutcomeTimeline\)/);
  assert.match(webAppSource, /renderAtlasMilitaryCarryOverConfidenceHandoff\(carryOverConfidenceHandoff\)/);
});

test('atlas military confidence handoff surfaces blocking next decisions and risk labels', () => {
  assert.match(webAppSource, /renfort: sécuriser logistique/);
  assert.match(webAppSource, /attente: confirmer renseignement/);
  assert.match(webAppSource, /repli: éviter fenêtre météo/);
  assert.match(webAppSource, /ordre: résoudre blocage/);
  assert.match(webAppSource, /Confiance fragile/);
  assert.match(webAppSource, /risque: dépendance/);
});

test('atlas military confidence handoff keeps fog-safe empty and accessible labels', () => {
  assert.match(webAppSource, /Handoff confiance vide: aucun carry-over visible ou informations sous brouillard/);
  assert.match(webAppSource, /Handoff confiance et risque des provinces contestées/);
  assert.match(webAppSource, /data-atlas-confidence-handoff/);
  assert.match(webAppSource, /décision bloquante \$\{row\.blockingDecision\}/);
  assert.match(stylesSource, /\.atlas-military-confidence-handoff__panel/);
  assert.match(stylesSource, /\.atlas-military-confidence-handoff-row--fragile circle/);
});
