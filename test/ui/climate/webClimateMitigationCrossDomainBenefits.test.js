import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('climate mitigation sequence shows cross-domain benefits when confirmed and stays quiet otherwise', () => {
  assert.match(webAppSource, /function buildClimateMitigationSecondaryBenefits/);
  assert.match(webAppSource, /Route logistique préservée/);
  assert.match(webAppSource, /Front stabilisé/);
  assert.match(webAppSource, /Tension culturelle évitée/);
  assert.match(webAppSource, /Cascade voisine réduite/);
  assert.match(webAppSource, /return benefits\.slice\(0, 2\)/);
  assert.match(webAppSource, /secondaryBenefits = buildClimateMitigationSecondaryBenefits\(province, forecast, linkedNeighbors, selectedGroupIds\)/);
  assert.match(webAppSource, /step\.secondaryBenefits\.length > 0 \? step\.secondaryBenefits\.join\(' · '\) : 'Aucun bénéfice secondaire confirmé\.'/);
  assert.match(webAppSource, /Aucun bénéfice secondaire confirmé/);

  assert.match(stylesSource, /\.map-climate-severity-legend__sequence-step em/);
  assert.match(stylesSource, /font-style: normal/);
});
