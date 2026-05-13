import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas military next-turn warnings reuse debt priorities instead of a separate model', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryCommitmentNextTurnWarnings\(prioritySummary, debtSummary, coverage, commitment\)/);
  assert.match(webAppSource, /debtSummary\.debts/);
  assert.match(webAppSource, /prioritySummary\.priorities/);
  assert.match(webAppSource, /coverage\?\.uncoveredFronts/);
  assert.doesNotMatch(webAppSource, /new WarModel|simulateWar|hiddenWarning/);
});

test('atlas military next-turn warnings stay quiet for covered or low-risk debt', () => {
  assert.match(webAppSource, /Aucune alerte prochain tour: dette couverte ou faible risque/);
  assert.match(webAppSource, /priority\.urgencyScore >= 58 && priority\.tone !== 'watch'/);
  assert.match(webAppSource, /if \(!priority \|\| !unresolved\) return null/);
  assert.match(webAppSource, /warnings\.length === 0/);
});

test('atlas military next-turn warnings explain degradation and immediate action compactly', () => {
  assert.match(webAppSource, /risque prochain tour: \$\{warning\.degradation\}; action recommandée: \$\{warning\.action\}/);
  assert.match(webAppSource, /front \$\{debt\.label\}/);
  assert.match(webAppSource, /détacher l’engagement préparé vers/);
  assert.match(webAppSource, /pression ennemie peut fermer la route voisine/);
  assert.match(webAppSource, /renderAtlasMilitaryCommitmentNextTurnWarnings\(commitmentWarnings\)/);
  assert.match(stylesSource, /\.atlas-military-commitment-warning__panel/);
  assert.match(stylesSource, /\.atlas-military-warning-row--critical rect/);
  assert.match(stylesSource, /\.atlas-military-warning-marker--high circle/);
});
