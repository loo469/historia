import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('playable map province details expose likely conflict outcome preview', () => {
  assert.match(webAppSource, /function buildConflictOutcomePreview/);
  assert.match(webAppSource, /function renderConflictOutcomePreview/);
  assert.match(webAppSource, /Issue probable/);
  assert.match(webAppSource, /Victoire probable/);
  assert.match(webAppSource, /Issue disputée/);
  assert.match(webAppSource, /Risque élevé/);
  assert.match(webAppSource, /Pression de front/);
  assert.match(webAppSource, /Ravitaillement/);
  assert.match(webAppSource, /Contrôle adjacent/);
  assert.match(webAppSource, /renderConflictOutcomePreview\(province, shell\)/);
});
