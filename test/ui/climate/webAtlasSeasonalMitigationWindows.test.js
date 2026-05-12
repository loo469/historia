import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas climate mitigation synergies expose compact seasonal windows', () => {
  assert.match(webAppSource, /function buildAtlasSeasonalMitigationWindows/);
  assert.match(webAppSource, /function renderAtlasSeasonalMitigationWindows/);
  assert.match(webAppSource, /synergyView\.synergies/);
  assert.match(webAppSource, /worldClimateLayer\.timeline\.entries/);
  assert.match(webAppSource, /criticalSeason = synergy\.season/);
  assert.match(webAppSource, /deferredConsequence = synergy\.intensity === 'critical'/);
  assert.match(webAppSource, /Impact évité/);
  assert.match(webAppSource, /Si reportée/);
  assert.match(webAppSource, /Aucune fenêtre saisonnière critique/);
  assert.match(webAppSource, /aucune saison critique nette/);
  assert.match(webAppSource, /atlasSeasonalMitigationWindows = buildAtlasSeasonalMitigationWindows\(atlasClimateMitigationSynergies, worldClimateLayer\)/);
  assert.match(webAppSource, /renderAtlasSeasonalMitigationWindows\(atlasSeasonalMitigationWindows\)/);

  assert.match(stylesSource, /\.map-world-climate-window/);
  assert.match(stylesSource, /\.map-world-climate-window--urgent/);
  assert.match(stylesSource, /\.map-world-climate-window__badges/);
});
