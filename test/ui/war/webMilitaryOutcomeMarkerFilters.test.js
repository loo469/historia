import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('military outcome markers expose legend filters with counts', () => {
  assert.match(webAppSource, /militaryOutcomeMarkerFilters: \{/);
  assert.match(webAppSource, /stabilized: true/);
  assert.match(webAppSource, /worsened: true/);
  assert.match(webAppSource, /blocked: true/);
  assert.match(webAppSource, /risk: true/);
  assert.match(webAppSource, /militaryOutcomeMarkerCategories/);
  assert.match(webAppSource, /function buildMilitaryOutcomeMarkerFilterState/);
  assert.match(webAppSource, /function renderMilitaryOutcomeMarkerFilters/);
  assert.match(webAppSource, /data-military-outcome-filter/);
  assert.match(webAppSource, /filter\.count/);
  assert.match(webAppSource, /hiddenCount/);
  assert.match(webAppSource, /isMilitaryOutcomeMarkerVisible/);
  assert.match(webAppSource, /getAnyMilitaryOutcomeMarkerForProvince/);
  assert.match(webAppSource, /Marqueur masqué par le filtre de légende/);
  assert.match(stylesSource, /\.military-outcome-filter/);
  assert.match(stylesSource, /\.military-outcome-filter__button--stabilized/);
  assert.match(stylesSource, /\.military-outcome-filter__button--worsened/);
  assert.match(stylesSource, /\.military-outcome-filter__button--blocked/);
  assert.match(stylesSource, /\.military-outcome-filter__button--risk/);
});
