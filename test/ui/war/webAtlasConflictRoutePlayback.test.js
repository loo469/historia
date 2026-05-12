import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas conflict playback derives deterministic route history from existing front pressure', () => {
  assert.match(webAppSource, /atlasConflictPlaybackStep: 1/);
  assert.match(webAppSource, /function buildAtlasConflictRoutePlaybackSteps\(route\)/);
  assert.match(webAppSource, /previousPressure = Math\.max\(0, route\.pressure - trend\)/);
  assert.match(webAppSource, /projectedPressure = Math\.max\(0, route\.pressure \+ Math\.round\(trend \* 0\.7\)\)/);
  assert.match(webAppSource, /function buildAtlasConflictRoutePlayback\(routes, activeStep = state\.atlasConflictPlaybackStep\)/);
  assert.doesNotMatch(webAppSource, /fetch\(|XMLHttpRequest|WebSocket/);
});

test('atlas conflict playback exposes short scrub controls and empty state', () => {
  assert.match(webAppSource, /atlas-conflict-playback/);
  assert.match(webAppSource, /data-atlas-conflict-playback-step/);
  assert.match(webAppSource, /Tour -1/);
  assert.match(webAppSource, /Actuel/);
  assert.match(webAppSource, /Projection/);
  assert.match(webAppSource, /Aucun historique militaire pertinent|Aucun front actif à rejouer/);
  assert.match(webAppSource, /state\.atlasConflictPlaybackStep = Math\.max\(0, Math\.min\(2/);
});

test('atlas conflict playback styling stays compact and non-permanent', () => {
  assert.match(stylesSource, /\.atlas-conflict-playback__panel/);
  assert.match(stylesSource, /\.atlas-conflict-playback-step\.is-active/);
  assert.match(stylesSource, /\.atlas-campaign-route--rising path:first-child/);
  assert.match(stylesSource, /\.atlas-campaign-route--falling path:first-child/);
  assert.doesNotMatch(stylesSource, /@keyframes atlas-conflict|animation:\s*atlas-conflict/);
});
