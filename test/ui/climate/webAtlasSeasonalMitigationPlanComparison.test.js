import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas compares seasonal mitigation plans against climate cascades', () => {
  assert.match(webAppSource, /function buildAtlasSeasonalMitigationPlanComparison/);
  assert.match(webAppSource, /function renderAtlasSeasonalMitigationPlanComparison/);
  assert.match(webAppSource, /seasonalWindows\.windows\.slice\(0, 3\)/);
  assert.match(webAppSource, /avoidedCascade: window\.avoidedImpact/);
  assert.match(webAppSource, /delayedCascade/);
  assert.match(webAppSource, /probableCascade/);
  assert.match(webAppSource, /Meilleur choix/);
  assert.match(webAppSource, /Compromis principal/);
  assert.match(webAppSource, /atlasSeasonalPlanComparison = buildAtlasSeasonalMitigationPlanComparison\(atlasSeasonalMitigationWindows\)/);
  assert.match(webAppSource, /renderAtlasSeasonalMitigationPlanComparison\(atlasSeasonalPlanComparison\)/);
  assert.match(webAppSource, /Plans saisonniers comparés/);
  assert.match(webAppSource, /Encore probable/);

  assert.match(stylesSource, /\.map-world-climate-plan-compare/);
  assert.match(stylesSource, /\.map-world-climate-plan-compare--best/);
  assert.match(stylesSource, /\.map-world-climate-plan-compare__item\.is-best/);
});
