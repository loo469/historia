import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('map summarizes queued military resolution before turn commit', () => {
  assert.match(webAppSource, /function buildQueuedMilitaryResolutionSummary/);
  assert.match(webAppSource, /function renderQueuedMilitaryResolutionSummary/);
  assert.match(webAppSource, /Résumé de résolution militaire avant validation du tour/);
  assert.match(webAppSource, /Résolution avant commit/);
  assert.match(webAppSource, /Stabilité/);
  assert.match(webAppSource, /Pression ennemie/);
  assert.match(webAppSource, /Risque restant/);
  assert.match(webAppSource, /Conflits à vérifier/);
  assert.match(webAppSource, /Aucun conflit de file détecté/);
  assert.match(webAppSource, /duplicateCount > 1/);
  assert.match(webAppSource, /Action bloquée: la province resterait critique après résolution/);
  assert.match(webAppSource, /renderQueuedMilitaryResolutionSummary\(shell, intrigueView\)/);
  assert.match(stylesSource, /\.queued-military-resolution/);
  assert.match(stylesSource, /queued-military-resolution__conflicts\.has-conflicts/);
  assert.match(stylesSource, /queued-military-resolution--danger/);
});
