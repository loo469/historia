import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('playable map exposes selected province action queue and turn resolution preview', () => {
  assert.match(webAppSource, /function buildSelectedProvinceActionQueue/);
  assert.match(webAppSource, /function summarizeTurnResolutionPreview/);
  assert.match(webAppSource, /function renderSelectedProvinceActionQueue/);
  assert.match(webAppSource, /actionCode/);
  assert.match(webAppSource, /priority/);
  assert.match(webAppSource, /orderCost/);
  assert.match(webAppSource, /mainRisk/);
  assert.match(webAppSource, /expectedResult/);
  assert.match(webAppSource, /status: statusByTone/);
  assert.match(webAppSource, /readyCount/);
  assert.match(webAppSource, /blockedCount/);
  assert.match(webAppSource, /impactedFaction/);
  assert.match(webAppSource, /Résolution prochain tour/);
  assert.match(webAppSource, /renderSelectedProvinceActionQueue\(province, shell, focusContext, intrigueView\)/);
  assert.match(stylesSource, /\.province-action-queue/);
  assert.match(stylesSource, /province-action-queue__item--ready/);
  assert.match(stylesSource, /province-action-queue__item--risky/);
  assert.match(stylesSource, /province-action-queue__item--blocked/);
});
