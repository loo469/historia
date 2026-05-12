import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('province cards summarize hidden dense war/front overlays', () => {
  assert.match(webAppSource, /function buildProvinceWarOverlayOverflowSummary/);
  assert.match(webAppSource, /function renderProvinceWarOverlayOverflowSummary/);
  assert.match(webAppSource, /warOverlays\.slice\(displayLimit\)/);
  assert.match(webAppSource, /frontCount/);
  assert.match(webAppSource, /supplyCount/);
  assert.match(webAppSource, /front\$\{frontCount > 1 \? 's' : ''\}/);
  assert.match(webAppSource, /alerte\$\{supplyCount > 1 \? 's' : ''\} ravitaillement/);
  assert.match(webAppSource, /signaux? militaire/);
  assert.match(webAppSource, /province-node__war-overflow/);
  assert.match(webAppSource, /renderProvinceWarOverlayOverflowSummary\(warOverlayOverflow\)/);
  assert.match(stylesSource, /\.province-node__war-overflow/);
});
