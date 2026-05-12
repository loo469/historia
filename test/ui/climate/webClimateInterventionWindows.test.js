import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('map compares climate intervention windows across regions', () => {
  assert.match(webAppSource, /function buildMapClimateInterventionWindows/);
  assert.match(webAppSource, /function renderMapClimateInterventionWindows/);
  assert.match(webAppSource, /Comparaison des fenêtres d’intervention climatique/);
  assert.match(webAppSource, /Fenêtres d’intervention climat/);
  assert.match(webAppSource, /deadlineState/);
  assert.match(webAppSource, /delayRisk/);
  assert.match(webAppSource, /Bénéfice immédiat/);
  assert.match(webAppSource, /Si retard/);
  assert.match(webAppSource, /Peut attendre sans gros coût visible/);
  assert.match(webAppSource, /Une seule région climat concernée/);
  assert.match(webAppSource, /renderMapClimateInterventionWindows\(climateInterventionWindows\)/);

  assert.match(stylesSource, /\.map-climate-windows/);
  assert.match(stylesSource, /\.map-climate-windows--urgent/);
  assert.match(stylesSource, /\.map-climate-windows--watch/);
  assert.match(stylesSource, /\.map-climate-windows--calm/);
  assert.match(stylesSource, /\.map-climate-windows__item--missed/);
  assert.match(stylesSource, /\.map-climate-windows__item--just-in-time/);
  assert.match(stylesSource, /\.map-climate-windows__item--covered/);
});
