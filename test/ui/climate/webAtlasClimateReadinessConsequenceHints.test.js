import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas shows compact map consequence hints for climate readiness gaps', () => {
  assert.match(webAppSource, /function buildAtlasClimateReadinessConsequenceHints/);
  assert.match(webAppSource, /function renderAtlasClimateReadinessConsequenceHints/);
  assert.match(webAppSource, /slice\(0, 3\)/);
  assert.match(webAppSource, /Conséquence probable carte/);
  assert.match(webAppSource, /Action de suivi/);
  assert.match(webAppSource, /Effet sur risque/);
  assert.match(webAppSource, /réduit le risque/);
  assert.match(webAppSource, /reporte le risque/);
  assert.match(webAppSource, /ne change pas vraiment le risque/);
  assert.match(webAppSource, /capacité mitigation régionale/);
  assert.match(webAppSource, /corridor régional partagé/);
  assert.match(webAppSource, /fenêtre saisonnière/);
  assert.match(webAppSource, /atlasClimateReadinessConsequenceHints = buildAtlasClimateReadinessConsequenceHints/);
  assert.match(webAppSource, /renderAtlasClimateReadinessConsequenceHints\(atlasClimateReadinessConsequenceHints\)/);

  assert.match(stylesSource, /\.map-world-climate-readiness-consequences/);
  assert.match(stylesSource, /\.map-world-climate-readiness-consequences__item--insufficient/);
  assert.match(stylesSource, /\.map-world-climate-readiness-consequences__item--too-late/);
});
