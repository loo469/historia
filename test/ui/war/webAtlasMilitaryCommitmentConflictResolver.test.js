import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas military commitment conflict resolver combines commitments orders and recovery warnings', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryCommitmentConflictResolver\(commitment, commitmentConflicts, commitmentCoverage, commitmentPriority, commitmentWarnings\)/);
  assert.match(webAppSource, /pickAtlasMilitaryResolverSource\(commitmentConflicts, commitmentPriority, commitmentWarnings\)/);
  assert.match(webAppSource, /ordre de province ou suivi de récupération/);
  assert.match(webAppSource, /renderAtlasMilitaryCommitmentConflictResolver\(commitmentResolver\)/);
});

test('atlas military commitment conflict resolver recommends execute defer replace or block', () => {
  assert.match(webAppSource, /decision: 'exécuter'/);
  assert.match(webAppSource, /decision: 'différer'/);
  assert.match(webAppSource, /decision: 'remplacer'/);
  assert.match(webAppSource, /decision: 'bloquer'/);
  assert.match(webAppSource, /risque restant: aucun conflit visible/);
  assert.match(webAppSource, /Décision recommandée \$\{recommendation\.decision\}/);
});

test('atlas military commitment conflict resolver renders accessible readable states', () => {
  assert.match(webAppSource, /Résolveur des engagements militaires superposés/);
  assert.match(webAppSource, /data-atlas-commitment-resolver/);
  assert.match(webAppSource, /atlas-military-commitment-resolver__empty/);
  assert.match(stylesSource, /\.atlas-military-commitment-resolver__panel/);
  assert.match(stylesSource, /\.atlas-military-resolver-row--block rect/);
  assert.match(stylesSource, /\.atlas-military-resolver-row--execute rect/);
});
