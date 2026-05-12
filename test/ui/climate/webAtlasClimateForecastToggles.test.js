import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas climate forecast timeline offers compact seasonal toggles while preserving urgent risks', () => {
  assert.match(webAppSource, /atlasClimateForecastMode: 'current'/);
  assert.match(webAppSource, /function getAtlasClimateForecastSeasonIndex/);
  assert.match(webAppSource, /function buildAtlasClimateForecastTimeline/);
  assert.match(webAppSource, /function renderAtlasClimateForecastToggles/);
  assert.match(webAppSource, /mode === 'next-season' \|\| mode === 'short-alert'/);
  assert.match(webAppSource, /currentEntries = shell\.provinces\.map/);
  assert.match(webAppSource, /urgentCurrentEntries = currentEntries\.filter/);
  assert.match(webAppSource, /changedDecision/);
  assert.match(webAppSource, /catastrophe urgente à garder visible/);
  assert.match(webAppSource, /data-atlas-climate-forecast-mode/);
  assert.match(webAppSource, /state\.atlasClimateForecastMode = element\.dataset\.atlasClimateForecastMode \?\? 'current'/);
  assert.match(webAppSource, /Prochaine saison/);
  assert.match(webAppSource, /Alerte courte/);

  assert.match(stylesSource, /\.map-world-climate__toggles/);
  assert.match(stylesSource, /\.map-world-climate__toggle/);
  assert.match(stylesSource, /\.map-world-climate__toggle\.is-active/);
});
