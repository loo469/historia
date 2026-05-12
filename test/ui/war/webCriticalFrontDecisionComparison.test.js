import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('critical front decision comparison reuses map priority and action data', () => {
  assert.match(webAppSource, /function buildCriticalFrontDecisionComparison/);
  assert.match(webAppSource, /buildFrontPriorityRanking\(shell, intrigueView\)/);
  assert.match(webAppSource, /buildSelectedProvinceActionQueue\(province, shell, focusContext, intrigueView\)/);
  assert.match(webAppSource, /buildProjectedFrontStability\(province, shell, actionQueue\)/);
  assert.match(webAppSource, /buildCriticalFrontRiskWarnings\(province, projection\)/);
  assert.match(webAppSource, /dominantCause/);
  assert.match(webAppSource, /recommendedAction/);
  assert.match(webAppSource, /costRisk/);
  assert.match(webAppSource, /ignoredRisk/);
});

test('critical front decision comparison highlights immediate military and non-military dependencies', () => {
  assert.match(webAppSource, /function buildFrontDecisionDependencies/);
  assert.match(webAppSource, /kind: 'military'/);
  assert.match(webAppSource, /Soutenir \$\{neighborFront\.label\}/);
  assert.match(webAppSource, /Neutraliser marqueur adverse/);
  assert.match(webAppSource, /kind: 'logistics'/);
  assert.match(webAppSource, /Sécuriser ravitaillement/);
  assert.match(webAppSource, /kind: 'stability'/);
  assert.match(webAppSource, /dependencies\.slice\(0, 2\)/);
});

test('critical front decision comparison renders compact navigation cards without changing filters', () => {
  assert.match(webAppSource, /function renderCriticalFrontDecisionComparison/);
  assert.match(webAppSource, /data-province-id="\$\{decision\.provinceId\}"/);
  assert.match(webAppSource, /data-readiness-focus="\$\{decision\.provinceId\}"/);
  assert.match(webAppSource, /sans perdre les filtres carte/);
  assert.match(webAppSource, /renderCriticalFrontDecisionComparison\(shell, intrigueView\)/);
  assert.match(webAppSource, /critical-front-decision__dependencies/);
  assert.match(stylesSource, /\.critical-front-decision-comparison/);
  assert.match(stylesSource, /\.critical-front-decision--danger/);
  assert.match(stylesSource, /\.critical-front-decision__dependency--military/);
  assert.match(stylesSource, /\.critical-front-decision__dependency--logistics/);
});
