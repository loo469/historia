import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('playable map adds intrigue warnings to selected province action planning', () => {
  assert.match(webAppSource, /function buildProvinceIntrigueRiskWarnings/);
  assert.match(webAppSource, /function renderProvinceIntrigueRiskWarnings/);
  assert.match(webAppSource, /Warnings intrigue planning/);
  assert.match(webAppSource, /Sabotage probable/);
  assert.match(webAppSource, /Exposition de cellule/);
  assert.match(webAppSource, /Cooldown \/ alerte active/);
  assert.match(webAppSource, /Province vulnérable/);
  assert.match(webAppSource, /renderProvinceIntrigueRiskWarnings\(province, actionQueue, intrigueView\)/);
});
