import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas recommends the next climate readiness threshold from map hints', () => {
  assert.match(webAppSource, /function buildAtlasClimateNextReadinessThreshold/);
  assert.match(webAppSource, /function renderAtlasClimateNextReadinessThreshold/);
  assert.match(webAppSource, /seuil capacité \+1 équipe prête/);
  assert.match(webAppSource, /seuil coordination régionale confirmée/);
  assert.match(webAppSource, /seuil délai: jalon avancé avant saison critique/);
  assert.match(webAppSource, /catastrophe évitée/);
  assert.match(webAppSource, /délai gagné/);
  assert.match(webAppSource, /région protégée/);
  assert.match(webAppSource, /mythe stabilisé/);
  assert.match(webAppSource, /petit investissement sans effet de seuil immédiat/);
  assert.match(webAppSource, /Sans effet immédiat/);
  assert.match(webAppSource, /buildAtlasClimateNextReadinessThreshold\(\s*atlasClimateReadinessConsequenceHints/);
  assert.match(webAppSource, /renderAtlasClimateNextReadinessThreshold\(atlasClimateNextReadinessThreshold\)/);

  assert.match(stylesSource, /\.map-world-climate-next-threshold/);
  assert.match(stylesSource, /\.map-world-climate-next-threshold--threshold-tight/);
  assert.match(stylesSource, /\.map-world-climate-next-threshold--no-threshold-change/);
});
