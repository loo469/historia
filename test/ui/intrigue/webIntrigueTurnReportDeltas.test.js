import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('playable map wires intrigue aftermath deltas into selected province turn report', () => {
  assert.match(webAppSource, /buildIntrigueTurnReportDeltas/);
  assert.match(webAppSource, /function renderIntrigueTurnReportDeltas/);
  assert.match(webAppSource, /Rapport intrigue dernier tour/);
  assert.match(webAppSource, /Risque représailles/);
  assert.match(webAppSource, /renderIntrigueTurnReportDeltas\(province, intrigueView\)/);
});
