import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('conflict readiness focus targets highlight their map provinces', () => {
  assert.match(webAppSource, /readinessFocusProvinceId/);
  assert.match(webAppSource, /readinessFocusTone/);
  assert.match(webAppSource, /data-readiness-tone/);
  assert.match(webAppSource, /data-readiness-summary/);
  assert.match(webAppSource, /data-readiness-default-province/);
  assert.match(webAppSource, /primaryWarning/);
  assert.match(webAppSource, /data-readiness-highlight/);
  assert.match(webAppSource, /is-readiness-highlight/);
  assert.match(webAppSource, /`is-readiness-\$\{readinessTone\}`/);
  assert.match(webAppSource, /menace immédiate/);
  assert.match(webAppSource, /préparation insuffisante/);
  assert.match(webAppSource, /opportunité tactique/);
  assert.match(webAppSource, /Carte: \$\{warning\.focusTargetLabel\}/);
  assert.match(webAppSource, /element\.addEventListener\('focus', applyProvinceFocus\)/);
  assert.match(stylesSource, /\.province-surface\.is-readiness-highlight/);
  assert.match(stylesSource, /\.province-node\.is-readiness-highlight/);
  assert.match(stylesSource, /province-node\.is-readiness-danger/);
  assert.match(stylesSource, /province-node\.is-readiness-warning/);
  assert.match(stylesSource, /province-node\.is-readiness-ready/);
});
