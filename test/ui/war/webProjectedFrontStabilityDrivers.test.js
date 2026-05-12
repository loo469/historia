import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('projected front stability forecast explains the top change drivers', () => {
  assert.match(webAppSource, /function buildFrontStabilityDrivers/);
  assert.match(webAppSource, /drivers = buildFrontStabilityDrivers/);
  assert.match(webAppSource, /Pourquoi ça change/);
  assert.match(webAppSource, /Facteurs de variation de stabilité/);
  assert.match(webAppSource, /Pression/);
  assert.match(webAppSource, /Appui/);
  assert.match(webAppSource, /Fatigue \/ supply/);
  assert.match(webAppSource, /Moral/);
  assert.match(webAppSource, /Front voisin/);
  assert.match(webAppSource, /Terrain/);
  assert.match(webAppSource, /drivers\.slice\(0, 3\)/);
  assert.match(stylesSource, /\.projected-front-stability__drivers/);
  assert.match(stylesSource, /\.projected-front-stability__driver/);
});
