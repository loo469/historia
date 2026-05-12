import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('playable map wires economy readiness warnings into end-turn summary', () => {
  assert.match(webAppSource, /buildEconomyReadinessWarnings/);
  assert.match(webAppSource, /function renderEconomyReadinessWarnings/);
  assert.match(webAppSource, /Readiness économie/);
  assert.match(webAppSource, /Alertes économie et logistique avant fin de tour/);
  assert.match(webAppSource, /budgetByProvinceId/);
  assert.match(webAppSource, /logisticsByProvinceId/);
  assert.match(webAppSource, /function getEconomyReadinessFocusTarget/);
  assert.match(webAppSource, /data-economy-readiness-focus/);
  assert.match(webAppSource, /data-blocker-label/);
  assert.match(webAppSource, /data-next-turn-effect/);
  assert.match(webAppSource, /economyReadinessFocus/);
  assert.match(webAppSource, /renderEconomyBlockerRouteBadge/);
  assert.match(webAppSource, /renderEconomyBlockerCityBadge/);
  assert.match(webAppSource, /state\.activeOverlaySlot = 'economy-overlay'/);
  assert.match(webAppSource, /renderEconomyReadinessWarnings\(shell, economyView, focusContext, intrigueView\)/);
  assert.match(stylesSource, /\.economy-readiness-warnings/);
  assert.match(stylesSource, /economy-readiness-warning--critical/);
  assert.match(stylesSource, /economy-readiness-warnings--risky/);
  assert.match(stylesSource, /has-economy-blocker/);
  assert.match(stylesSource, /economy-blocker-badge/);
  assert.match(stylesSource, /\.economy-readiness-warning button/);
});
