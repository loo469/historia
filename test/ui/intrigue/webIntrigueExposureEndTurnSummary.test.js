import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('map end-turn summary exposes intrigue exposure warnings and mitigations', () => {
  assert.match(webAppSource, /function buildMapIntrigueExposureSummary/);
  assert.match(webAppSource, /function renderMapIntrigueExposureSummary/);
  assert.match(webAppSource, /Intrigue fin de tour/);
  assert.match(webAppSource, /risque.*intrigue.*actif/s);
  assert.match(webAppSource, /Exposition réduite/);
  assert.match(webAppSource, /renderMapIntrigueExposureSummary\(intrigueExposureSummary\)/);
  assert.match(stylesSource, /\.map-intrigue-exposure-summary/);
});
