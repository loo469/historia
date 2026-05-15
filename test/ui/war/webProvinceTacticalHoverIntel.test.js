import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('province nodes expose tactical hover intel and action affordances', () => {
  assert.match(webAppSource, /province-node__tactical-tooltip/);
  assert.match(webAppSource, /data-tactical-action/);
  assert.match(webAppSource, /data-action-affordance/);
  assert.match(webAppSource, /province-node__action-affordance/);
});

test('province tactical hover affordances have readable hover styles', () => {
  assert.match(stylesSource, /\.province-node__tactical-tooltip/);
  assert.match(stylesSource, /\.province-node--action-available::before/);
  assert.match(stylesSource, /\.province-node__action-affordance--discouraged/);
});
