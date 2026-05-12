import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas conflict comparison supports initial plan and final modes from playback data', () => {
  assert.match(webAppSource, /atlasConflictComparisonMode: 'current'/);
  assert.match(webAppSource, /function buildAtlasConflictRouteComparison\(playback, mode = state\.atlasConflictComparisonMode\)/);
  assert.match(webAppSource, /initial: \{ label: 'État initial', step: 0 \}/);
  assert.match(webAppSource, /current: \{ label: 'Plan courant', step: 1 \}/);
  assert.match(webAppSource, /final: \{ label: 'Projection finale', step: 2 \}/);
  assert.match(webAppSource, /data-atlas-conflict-comparison-mode/);
});

test('atlas conflict comparison summarizes key route changes without duplicating arrows', () => {
  assert.match(webAppSource, /function getAtlasConflictComparisonLabel/);
  assert.match(webAppSource, /pression gagnée/);
  assert.match(webAppSource, /pression perdue/);
  assert.match(webAppSource, /route coupée/);
  assert.match(webAppSource, /front stabilisé/);
  assert.match(webAppSource, /front menacé/);
  assert.match(webAppSource, /function renderAtlasConflictRouteComparison/);
  assert.match(webAppSource, /renderAtlasConflictRouteComparison\(comparison\)/);
  assert.match(webAppSource, /atlas-conflict-comparison-row/);
  assert.doesNotMatch(webAppSource, /atlas-conflict-comparison[\s\S]{0,1400}atlas-campaign-route__arrow/);
});

test('atlas conflict comparison degrades cleanly when data is missing', () => {
  assert.match(webAppSource, /Comparaison indisponible: aucune route militaire récente/);
  assert.match(webAppSource, /Comparaison indisponible: données de pression incomplètes/);
  assert.match(webAppSource, /atlas-conflict-comparison__empty/);
  assert.match(stylesSource, /\.atlas-conflict-comparison__panel/);
  assert.match(stylesSource, /\.atlas-conflict-comparison-mode\.is-active/);
  assert.match(stylesSource, /\.atlas-conflict-comparison-row--danger/);
  assert.match(stylesSource, /\.atlas-conflict-comparison-row--relief/);
});
