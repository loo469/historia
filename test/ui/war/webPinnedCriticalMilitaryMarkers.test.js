import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('critical military follow-up markers stay pinned through filters', () => {
  assert.match(webAppSource, /function isCriticalMilitaryOutcomeMarker/);
  assert.match(webAppSource, /function getMilitaryOutcomePinReason/);
  assert.match(webAppSource, /worsened', 'blocked', 'risk/);
  assert.match(webAppSource, /state\.militaryOutcomeMarkerFilters\[marker\.tone\] !== false \|\| isCriticalMilitaryOutcomeMarker\(marker\)/);
  assert.match(webAppSource, /pinnedCount/);
  assert.match(webAppSource, /pinnedReasons/);
  assert.match(webAppSource, /pinSummary/);
  assert.match(webAppSource, /épinglé: front aggravé/);
  assert.match(webAppSource, /épinglé: action bloquée/);
  assert.match(webAppSource, /épinglé: risque de suivi critique/);
  assert.match(webAppSource, /marker\.pinReason/);
  assert.match(webAppSource, /épinglé\$\{summary\.pinnedCount > 1 \? 's' : ''\}/);
  assert.match(stylesSource, /\.military-front-marker-summary__item em/);
});
