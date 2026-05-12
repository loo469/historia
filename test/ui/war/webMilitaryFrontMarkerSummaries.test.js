import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('military marker filters include compact front summaries', () => {
  assert.match(webAppSource, /militaryOutcomeSeverityRank/);
  assert.match(webAppSource, /function buildMilitaryFrontMarkerSummaries/);
  assert.match(webAppSource, /function renderMilitaryFrontMarkerSummaries/);
  assert.match(webAppSource, /visibleCount/);
  assert.match(webAppSource, /hiddenCount/);
  assert.match(webAppSource, /dominantTone/);
  assert.match(webAppSource, /urgentAction/);
  assert.match(webAppSource, /Lecture fronts/);
  assert.match(webAppSource, /Aucun marqueur militaire/);
  assert.match(webAppSource, /renderMilitaryFrontMarkerSummaries\(state\.lastMilitaryOutcomeMarkers\)/);
  assert.match(webAppSource, /isMilitaryOutcomeMarkerVisible\(marker\)/);
  assert.match(stylesSource, /\.military-front-marker-summary/);
  assert.match(stylesSource, /\.military-front-marker-summary__item--hidden/);
  assert.match(stylesSource, /\.military-front-marker-summary__item--worsened/);
  assert.match(stylesSource, /\.military-front-marker-summary__item--blocked/);
});
