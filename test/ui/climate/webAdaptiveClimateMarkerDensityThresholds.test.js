import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('climate marker density adapts to zoom viewport and selected province detail', () => {
  assert.match(webAppSource, /function getClimateMarkerDensityThreshold/);
  assert.match(webAppSource, /zoom >= 1\.8 \? 3 : zoom >= 1\.35 \? 1 : 0/);
  assert.match(webAppSource, /viewportWidth < 720/);
  assert.match(webAppSource, /mobileMapExpanded \? 0 : 1/);
  assert.match(webAppSource, /selectedProvinceId = options\.selectedProvinceId/);
  assert.match(webAppSource, /selectedMarker/);
  assert.match(webAppSource, /la province sélectionnée reste accessible/);
  assert.match(webAppSource, /Agrégé par seuil adaptatif: zoom/);
  assert.match(webAppSource, /Seuil \$\{maxVisible\} marqueurs/);
  assert.match(webAppSource, /détail de province sélectionnée préservé/);
  assert.match(webAppSource, /viewportWidth = typeof window === 'undefined' \? 1024 : window\.innerWidth/);
  assert.match(webAppSource, /zoom: state\.mapZoom/);
  assert.match(webAppSource, /mobileMapExpanded: state\.mobileMapExpanded/);
  assert.match(webAppSource, /selectedProvinceId: state\.selectedProvinceId/);

  assert.match(stylesSource, /\.map-climate-density--clear/);
});
