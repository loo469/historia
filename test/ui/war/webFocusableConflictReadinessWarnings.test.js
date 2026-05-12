import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('conflict readiness warnings expose focusable map targets', () => {
  assert.match(webAppSource, /focusTargetLabel/);
  assert.match(webAppSource, /priorityLabel/);
  assert.match(webAppSource, /severityRank/);
  assert.match(webAppSource, /expectedImpact/);
  assert.match(webAppSource, /left\.severityRank - right\.severityRank/);
  assert.match(webAppSource, /data-readiness-focus/);
  assert.match(webAppSource, /data-province-id="\$\{warning\.provinceId\}"/);
  assert.match(webAppSource, /aria-label="Focaliser \$\{warning\.focusTargetLabel\}/);
  assert.match(webAppSource, /Priorité critique/);
  assert.match(webAppSource, /À vérifier/);
  assert.match(webAppSource, /Couvert/);
  assert.match(stylesSource, /\.conflict-readiness-warning:hover/);
  assert.match(stylesSource, /\.conflict-readiness-warning:focus-visible/);
  assert.match(stylesSource, /cursor: pointer/);
});
