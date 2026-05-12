import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas military operation sequence reuses playback and comparison route data', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryOperationSequence\(playback, comparison\)/);
  assert.match(webAppSource, /comparisonByRouteId/);
  assert.match(webAppSource, /route\.activePlayback/);
  assert.match(webAppSource, /route\.contested/);
  assert.match(webAppSource, /route\.occupied/);
  assert.doesNotMatch(webAppSource, /new WarModel|simulateWar|combatModel/);
});

test('atlas military operation sequence exposes compact target effect risk and reason steps', () => {
  assert.match(webAppSource, /function renderAtlasMilitaryOperationSequence\(sequence\)/);
  assert.match(webAppSource, /Plan d’opération/);
  assert.match(webAppSource, /atlas-military-operation-step__target/);
  assert.match(webAppSource, /atlas-military-operation-step__effect/);
  assert.match(webAppSource, /atlas-military-operation-step__reason/);
  assert.match(webAppSource, /\.slice\(0, 3\)/);
  assert.match(webAppSource, /renderAtlasMilitaryOperationSequence\(operationSequence\)/);
});

test('atlas military operation sequence has clean unavailable state and styling', () => {
  assert.match(webAppSource, /Plan d’opération indisponible: aucune route\/front prioritaire visible/);
  assert.match(webAppSource, /Plan d’opération indisponible: données de route incomplètes/);
  assert.match(webAppSource, /atlas-military-operation-sequence__empty/);
  assert.match(stylesSource, /\.atlas-military-operation-sequence__panel/);
  assert.match(stylesSource, /\.atlas-military-operation-step--support circle/);
  assert.match(stylesSource, /\.atlas-military-operation-step__effect/);
});
