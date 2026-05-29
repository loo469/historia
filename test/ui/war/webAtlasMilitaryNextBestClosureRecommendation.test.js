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

test('atlas military compares attempted closure choices against the recommendation', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryClosureAfterActionComparison\(recommendation\)/);
  assert.match(webAppSource, /Tenté \/ recommandé \/ risque/);
  assert.match(webAppSource, /aucune action précédente visible/);
  assert.match(webAppSource, /risque restant: capacité non réservée/);
  assert.match(webAppSource, /data-atlas-closure-after-action/);
  assert.match(webAppSource, /renderAtlasMilitaryClosureAfterActionComparison\(closureAfterActionComparison\)/);
  assert.match(stylesSource, /\.atlas-military-closure-after-action__panel/);
  assert.match(stylesSource, /\.atlas-military-closure-after-action-row\.is-alternative circle/);
});

test('atlas military renders a post-closure relapse watchlist from visible closure risks', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryPostClosureRelapseWatchlist\(comparison, recommendation\)/);
  assert.match(webAppSource, /Fenêtres de sécurité post-clôture des rechutes provinciales/);
  assert.match(webAppSource, /Fenêtre sûre/);
  assert.match(webAppSource, /capacité à confirmer au tour suivant/);
  assert.match(webAppSource, /fenêtre météo peut rouvrir le front/);
  assert.match(webAppSource, /data-atlas-post-closure-watch/);
  assert.match(webAppSource, /renderAtlasMilitaryPostClosureRelapseWatchlist\(postClosureRelapseWatchlist\)/);
  assert.match(stylesSource, /\.atlas-military-post-closure-watchlist__panel/);
  assert.match(stylesSource, /\.atlas-military-post-closure-watchlist-row--fragile circle/);
});

test('atlas military adds safe-wait windows to post-closure relapse risks', () => {
  assert.match(webAppSource, /function getAtlasMilitaryRelapseSafeWaitWindow\(row, status\)/);
  assert.match(webAppSource, /attente sûre: 2 tours/);
  assert.match(webAppSource, /attente courte: météo à confirmer/);
  assert.match(webAppSource, /facteur: pression militaire\/capacité/);
  assert.match(webAppSource, /facteur: soutien local/);
  assert.match(webAppSource, /Fenêtres de sécurité post-clôture des rechutes provinciales/);
  assert.match(webAppSource, /row\.safeWaitWindow/);
  assert.match(webAppSource, /row\.dominantFactor/);
  assert.match(stylesSource, /\.atlas-military-post-closure-watchlist-row__window/);
});

// MAP-A22: keep this source-level contract compact because the atlas demo data is
// assembled inside web/app.js rather than exported as a unit-testable builder.
test('atlas military renders a relapse prevention checklist before committing province orders', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryRelapsePreventionCommitChecklist\(watchlist\)/);
  assert.match(webAppSource, /function renderAtlasMilitaryRelapsePreventionCommitChecklist\(checklist\)/);
  assert.match(webAppSource, /Checklist prévention rechute avant confirmation d'ordre/);
  assert.match(webAppSource, /Check avant ordre/);
  assert.match(webAppSource, /Safe to commit: aucune rechute provinciale significative détectée/);
  assert.match(webAppSource, /Prévenir rechute/);
  assert.match(webAppSource, /risque restant \$\{row\.remainingRisk\}; prérequis/);
  assert.match(webAppSource, /raison d'attendre: \$\{row\.nextCheck\}/);
  assert.match(webAppSource, /visibleRows = \(watchlist\?\.items \?\? \[\]\)\.slice\(0, 4\)/);
  assert.match(webAppSource, /renderAtlasMilitaryRelapsePreventionCommitChecklist\(relapsePreventionCommitChecklist\)/);
  assert.match(stylesSource, /\.atlas-military-relapse-commit-checklist__panel/);
  assert.match(stylesSource, /\.atlas-military-relapse-commit-checklist-row--fragile circle/);
  assert.match(stylesSource, /\.atlas-military-relapse-commit-checklist-row--safe circle/);
});
