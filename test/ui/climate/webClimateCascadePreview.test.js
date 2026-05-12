import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('selected province panel previews regional cascades avoided by climate mitigation', () => {
  assert.match(webAppSource, /function buildProvinceClimateCascadePreview/);
  assert.match(webAppSource, /function renderProvinceClimateCascadePreview/);
  assert.match(webAppSource, /Aperçu des cascades régionales évitées par la mitigation climat/);
  assert.match(webAppSource, /Cascades évitées/);
  assert.match(webAppSource, /famine/);
  assert.match(webAppSource, /route fragilisée/);
  assert.match(webAppSource, /migration de ressources/);
  assert.match(webAppSource, /anomalie saisonnière prolongée/);
  assert.match(webAppSource, /cascade cosmétique/);
  assert.match(webAppSource, /changesThisTurn/);
  assert.match(webAppSource, /protectedNeighbors/);
  assert.match(webAppSource, /resourceDeposits/);
  assert.match(webAppSource, /renderProvinceClimateCascadePreview\(province, shell\)/);

  assert.match(stylesSource, /\.province-climate-cascade-preview/);
  assert.match(stylesSource, /\.province-climate-cascade-list/);
  assert.match(stylesSource, /\.province-climate-cascade\.is-decisive/);
  assert.match(stylesSource, /\.province-climate-cascade\.is-cosmetic/);
});
