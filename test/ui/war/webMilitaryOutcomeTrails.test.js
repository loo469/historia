import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('military outcome trails summarize the most important after-action results', () => {
  assert.match(webAppSource, /function buildMilitaryOutcomeTrailSummary/);
  assert.match(webAppSource, /isMilitaryOutcomeMarkerVisible\(marker\)/);
  assert.match(webAppSource, /militaryOutcomeSeverityRank/);
  assert.match(webAppSource, /impactLabel/);
  assert.match(webAppSource, /pression déplacée/);
  assert.match(webAppSource, /risque résiduel/);
  assert.match(webAppSource, /trails\.slice\(0, 3\)/);
  assert.match(webAppSource, /groupedCount/);
});

test('military outcome trails render compact province-linked map controls', () => {
  assert.match(webAppSource, /function renderMilitaryOutcomeTrailSummary/);
  assert.match(webAppSource, /data-province-id="\$\{trail\.provinceId\}"/);
  assert.match(webAppSource, /data-readiness-focus="\$\{trail\.provinceId\}"/);
  assert.match(webAppSource, /résumé replié par filtres/);
  assert.match(webAppSource, /renderMilitaryOutcomeTrailSummary\(state\.lastMilitaryOutcomeMarkers\)/);
  assert.match(stylesSource, /\.military-outcome-trail/);
  assert.match(stylesSource, /\.military-outcome-trail__item--worsened/);
});
