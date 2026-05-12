import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('selected province panel explains projected front stability after queued military actions', () => {
  assert.match(webAppSource, /function buildProjectedFrontStability/);
  assert.match(webAppSource, /function renderProjectedFrontStability/);
  assert.match(webAppSource, /Projection stabilité front/);
  assert.match(webAppSource, /Projection front non engagée/);
  assert.match(webAppSource, /Aucune action militaire en file/);
  assert.match(webAppSource, /Stabilité attendue/);
  assert.match(webAppSource, /Risque restant/);
  assert.match(webAppSource, /Voisine sensible/);
  assert.match(webAppSource, /sensitiveNeighbor/);
  assert.match(webAppSource, /projection après validation de l’action en file/);
  assert.match(webAppSource, /renderProjectedFrontStability\(province, shell, focusContext, intrigueView\)/);
  assert.match(stylesSource, /\.projected-front-stability/);
  assert.match(stylesSource, /projected-front-stability--ready/);
  assert.match(stylesSource, /projected-front-stability--warning/);
  assert.match(stylesSource, /projected-front-stability--danger/);
  assert.match(stylesSource, /projected-front-stability--neutral/);
});
