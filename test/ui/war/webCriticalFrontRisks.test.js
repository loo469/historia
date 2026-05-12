import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('front stability projection flags critical residual risks from the current queue', () => {
  assert.match(webAppSource, /function buildCriticalFrontRiskWarnings/);
  assert.match(webAppSource, /function renderCriticalFrontRiskWarnings/);
  assert.match(webAppSource, /Risques restants/);
  assert.match(webAppSource, /Risques critiques restants du front/);
  assert.match(webAppSource, /Risque acceptable/);
  assert.match(webAppSource, /Risque à surveiller/);
  assert.match(webAppSource, /Risque critique avant validation/);
  assert.match(webAppSource, /Fatigue \/ supply résiduelle/);
  assert.match(webAppSource, /Pression voisine persistante/);
  assert.match(webAppSource, /buildProjectedFrontStability\(province, shell, actionQueue\)/);
  assert.match(webAppSource, /renderCriticalFrontRiskWarnings\(province, shell, focusContext, intrigueView\)/);
  assert.match(stylesSource, /\.critical-front-risks/);
  assert.match(stylesSource, /critical-front-risk--critical/);
  assert.match(stylesSource, /critical-front-risk--watch/);
  assert.match(stylesSource, /critical-front-risk--covered/);
});
