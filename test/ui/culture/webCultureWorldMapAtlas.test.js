import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('world map atlas renders culture influence zones from existing culture overlay data', () => {
  assert.match(webAppSource, /function buildAtlasCultureFeatures/);
  assert.match(webAppSource, /cultureView\?\.overlay/);
  assert.match(webAppSource, /getProvincePolygon\(entry\.regionId\)/);
  assert.match(webAppSource, /getProvinceCenter\(entry\.regionId\)/);
  assert.match(webAppSource, /atlas-culture-zone--\$\{zone\.tone\}/);
  assert.match(webAppSource, /renderAtlasWorldCanvas\(shell, economyView, cultureView\)/);
});

test('world map atlas exposes discovery sites without adding a new culture source of truth', () => {
  assert.match(webAppSource, /regionalDiscoveryLinks\.slice\(0, 2\)/);
  assert.match(webAppSource, /atlas-discovery-site/);
  assert.match(webAppSource, /data-atlas-discovery="\$\{site\.discoveryId\}"/);
  assert.match(webAppSource, /Couche atlas culture et découvertes/);
  assert.match(stylesSource, /\.atlas-culture-layer/);
  assert.match(stylesSource, /\.atlas-culture-zone--dominant/);
  assert.match(stylesSource, /\.atlas-discovery-site path/);
});
