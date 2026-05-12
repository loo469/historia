import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('map summarizes cumulative queued climate impact before turn commit', () => {
  assert.match(webAppSource, /function buildCumulativeClimateImpactSummary/);
  assert.match(webAppSource, /function renderCumulativeClimateImpactSummary/);
  assert.match(webAppSource, /Impact climat cumulé avant validation/);
  assert.match(webAppSource, /Impact climatique cumulé avant résolution du tour/);
  assert.match(webAppSource, /intervention.*climat en attente/);
  assert.match(webAppSource, /délai.*sauvé/);
  assert.match(webAppSource, /encore critique/);
  assert.match(webAppSource, /redondance/);
  assert.match(webAppSource, /Après résolution/);
  assert.match(webAppSource, /risque \$\{entry\.riskReduction\}/);
  assert.match(webAppSource, /Délai/);
  assert.match(webAppSource, /Tradeoff/);
  assert.match(webAppSource, /une autre intervention cible déjà cette province/);
  assert.match(webAppSource, /buildCumulativeClimateImpactSummary\(shell, state\.queuedClimateInterventions\)/);
  assert.match(webAppSource, /renderCumulativeClimateImpactSummary\(cumulativeClimateImpact\)/);

  assert.match(stylesSource, /\.map-climate-cumulative/);
  assert.match(stylesSource, /\.map-climate-cumulative--warning/);
  assert.match(stylesSource, /\.map-climate-cumulative__item--missed/);
  assert.match(stylesSource, /\.map-climate-cumulative__item--redundant/);
});
