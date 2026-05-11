import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('intrigue side panel renders quick response choices from hotspot drill-downs', () => {
  assert.match(webAppSource, /Réponses rapides intrigue/);
  assert.match(webAppSource, /drillDown\.quickResponses\.map/);
  assert.match(webAppSource, /intrigue-quick-response/);
  assert.match(webAppSource, /recommandée/);
  assert.match(webAppSource, /response\.summary/);
});
