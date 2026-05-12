import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('map end-turn summary exposes compact conflict readiness warnings', () => {
  assert.match(webAppSource, /function buildConflictReadinessWarnings/);
  assert.match(webAppSource, /function renderConflictReadinessWarnings/);
  assert.match(webAppSource, /Préparation conflit/);
  assert.match(webAppSource, /points clés/);
  assert.match(webAppSource, /défense et ravitaillement restent mal couverts/);
  assert.match(webAppSource, /confirmer seulement avec appui adjacent/);
  assert.match(webAppSource, /couverture suffisante avant fin de tour/);
  assert.match(webAppSource, /renderConflictReadinessWarnings\(shell, intrigueView\)/);
  assert.match(stylesSource, /\.conflict-readiness-summary/);
  assert.match(stylesSource, /conflict-readiness-warning--ready/);
  assert.match(stylesSource, /conflict-readiness-warning--warning/);
  assert.match(stylesSource, /conflict-readiness-warning--danger/);
});
