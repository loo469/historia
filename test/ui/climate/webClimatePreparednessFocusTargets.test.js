import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('climate preparedness warnings expose focusable map targets', () => {
  assert.match(webAppSource, /focusTarget: \{/);
  assert.match(webAppSource, /hazard-zone/);
  assert.match(webAppSource, /critical-season/);
  assert.match(webAppSource, /mitigation/);
  assert.match(webAppSource, /data-climate-preparedness-focus="true"/);
  assert.match(webAppSource, /data-climate-focus-type/);
  assert.match(webAppSource, /data-climate-focus-id/);
  assert.match(webAppSource, /Focaliser \$\{warning\.focusTarget\.label\}/);
  assert.match(webAppSource, /state\.activeOverlaySlot = 'climate-overlay'/);
  assert.match(webAppSource, /state\.mobilePanelSection = element\.dataset\.climateFocusType === 'mitigation' \? 'details' : 'overlay'/);
  assert.match(webAppSource, /centerMapOnProvince\(provinceId, viewport\)/);
  assert.match(stylesSource, /\.map-climate-preparedness__item button/);
});
