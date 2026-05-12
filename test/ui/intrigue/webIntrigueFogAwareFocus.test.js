import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('intrigue end-turn exposure warnings expose fog-aware focus targets', () => {
  assert.match(webAppSource, /function buildIntrigueExposureFocusTarget/);
  assert.match(webAppSource, /data-intrigue-focus-target/);
  assert.match(webAppSource, /focusTarget\.state/);
  assert.match(webAppSource, /cible confirmée|hotspot confirmé/);
  assert.match(webAppSource, /zone probable/);
  assert.match(webAppSource, /brouillard préservé/);
  assert.match(webAppSource, /Information masquée/);
  assert.match(stylesSource, /map-intrigue-exposure-summary__item--confirmed/);
  assert.match(stylesSource, /map-intrigue-exposure-summary__item--probable/);
  assert.match(stylesSource, /map-intrigue-exposure-summary__item--masked/);
});
