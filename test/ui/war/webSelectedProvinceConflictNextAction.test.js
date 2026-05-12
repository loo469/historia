import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('selected province panel exposes conflict next-step cues from readiness focus', () => {
  assert.match(webAppSource, /function buildSelectedProvinceConflictNextAction/);
  assert.match(webAppSource, /function renderSelectedProvinceConflictNextAction/);
  assert.match(webAppSource, /buildConflictReadinessWarnings\(shell, intrigueView\)/);
  assert.match(webAppSource, /directWarning/);
  assert.match(webAppSource, /neighborWarning/);
  assert.match(webAppSource, /Prochaine action conflit/);
  assert.match(webAppSource, /Front concerné/);
  assert.match(webAppSource, /focus conflit sélectionné/);
  assert.match(webAppSource, /voisine du focus conflit/);
  assert.match(webAppSource, /Appuyer \$\{targetProvince\.label\}/);
  assert.match(webAppSource, /renderSelectedProvinceConflictNextAction\(province, shell, focusContext, intrigueView\)/);
  assert.match(stylesSource, /\.province-conflict-next-action/);
  assert.match(stylesSource, /province-conflict-next-action--danger/);
  assert.match(stylesSource, /province-conflict-next-action--warning/);
  assert.match(stylesSource, /province-conflict-next-action--ready/);
});
