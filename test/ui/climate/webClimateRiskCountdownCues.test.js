import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('selected province panel exposes climate risk countdown cues', () => {
  assert.match(webAppSource, /function buildProvinceClimateCountdownCues/);
  assert.match(webAppSource, /function renderProvinceClimateCountdownCues/);
  assert.match(webAppSource, /Compte à rebours des risques climat de province/);
  assert.match(webAppSource, /Urgence climat/);
  assert.match(webAppSource, /Immédiat/);
  assert.match(webAppSource, /Prochain tour/);
  assert.match(webAppSource, /Surveiller/);
  assert.match(webAppSource, /Stable/);
  assert.match(webAppSource, /Évacuer \/ mitiger/);
  assert.match(webAppSource, /Préparer réserves/);
  assert.match(webAppSource, /Renforcer stabilité/);
  assert.match(webAppSource, /province\.hazards/);
  assert.match(webAppSource, /Température\/précipitations/);
  assert.match(webAppSource, /renderProvinceClimateCountdownCues\(province\)/);

  assert.match(stylesSource, /\.province-climate-countdown/);
  assert.match(stylesSource, /\.province-climate-countdown__cue--immediate/);
  assert.match(stylesSource, /\.province-climate-countdown__cue--next-turn/);
  assert.match(stylesSource, /\.province-climate-countdown__cue--watch/);
  assert.match(stylesSource, /\.province-climate-countdown__cue--stable/);
});
