import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('playable map exposes viewport controls and reset-to-selection affordance', () => {
  assert.match(webAppSource, /data-map-zoom="out"/);
  assert.match(webAppSource, /data-map-zoom="in"/);
  assert.match(webAppSource, /data-map-pan="reset"/);
  assert.match(webAppSource, /data-map-pan="selection"/);
  assert.match(webAppSource, /centerMapOnProvince\(state\.selectedProvinceId, viewport\)/);
  assert.match(webAppSource, /tabindex="0"/);
});
