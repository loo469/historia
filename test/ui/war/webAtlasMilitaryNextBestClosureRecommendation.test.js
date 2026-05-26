import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas military builds next-best closure recommendations from visible blocker checklists', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryNextBestClosureRecommendation\(checklist\)/);
  assert.match(webAppSource, /function getAtlasMilitaryClosureImpactScore\(item\)/);
  assert.match(webAppSource, /impact tactique direct \+ capacité/);
  assert.match(webAppSource, /réduit incertitude avant engagement/);
  assert.match(webAppSource, /évite retard météo critique/);
  assert.match(webAppSource, /stabilise engagement local/);
});

test('atlas military next-best closure avoids false signals for unresolved unknown or idle blockers', () => {
  assert.match(webAppSource, /Prochaine fermeture indécise: aucun blocker actionnable visible/);
  assert.match(webAppSource, /Prochaine fermeture indécise: données visibles insuffisantes, aucune promotion sûre/);
  assert.match(webAppSource, /item\.checklist\.orderState !== 'ordre en veille'/);
  assert.match(webAppSource, /item\.promoted \|\| items\.length === 1/);
  assert.match(webAppSource, /blockerBadge\.type !== 'unknown'/);
});

test('atlas military next-best closure renders a primary recommendation and compact alternatives', () => {
  assert.match(webAppSource, /renderAtlasMilitaryNextBestClosureRecommendation\(nextBestClosureRecommendation\)/);
  assert.match(webAppSource, /data-atlas-next-best-closure/);
  assert.match(webAppSource, /Recommandation principale/);
  assert.match(webAppSource, /Alternative/);
  assert.match(webAppSource, /action minimale \$\{row\.nextAction\}/);
  assert.match(stylesSource, /\.atlas-military-next-best-closure__panel/);
  assert.match(stylesSource, /\.atlas-military-next-best-closure-row\.is-alternative circle/);
});
