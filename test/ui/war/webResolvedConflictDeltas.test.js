import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('playable map exposes resolved conflict deltas in the turn report', () => {
  assert.match(webAppSource, /function buildResolvedConflictDeltas/);
  assert.match(webAppSource, /function renderResolvedConflictDeltas/);
  assert.match(webAppSource, /Rapport dernier tour/);
  assert.match(webAppSource, /Contrôle \/ front/);
  assert.match(webAppSource, /Pression/);
  assert.match(webAppSource, /Pertes \/ risque/);
  assert.match(webAppSource, /Action résolue/);
  assert.match(webAppSource, /Aucun changement militaire résolu/);
  assert.match(webAppSource, /resolvedActionCode/);
  assert.match(webAppSource, /renderResolvedConflictDeltas\(province, shell, focusContext, intrigueView\)/);
  assert.match(stylesSource, /\.resolved-conflict-deltas/);
  assert.match(stylesSource, /resolved-conflict-delta--success/);
  assert.match(stylesSource, /resolved-conflict-delta--warning/);
  assert.match(stylesSource, /resolved-conflict-delta--danger/);
  assert.match(stylesSource, /resolved-conflict-deltas\.is-empty/);
});
