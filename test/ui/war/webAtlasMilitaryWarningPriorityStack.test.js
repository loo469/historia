import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas military warning priority stack reuses next-turn warning and route data', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryWarningPriorityStack\(warningSummary, features\)/);
  assert.match(webAppSource, /warningSummary\.warnings/);
  assert.match(webAppSource, /getAtlasMilitaryWarningRouteExposure\(warning, features\)/);
  assert.match(webAppSource, /renderAtlasMilitaryWarningPriorityStack\(commitmentWarningStack\)/);
  assert.doesNotMatch(webAppSource, /new WarModel|simulateWar|hiddenStack/);
});

test('atlas military warning priority stack ranks multiple warnings deterministically', () => {
  assert.match(webAppSource, /stackScore = warning\.frontRisk \+ uncoveredDebt \+ routeExposure \+ degradationScore/);
  assert.match(webAppSource, /right\.stackScore - left\.stackScore \|\| left\.sourceId\.localeCompare\(right\.sourceId\)/);
  assert.match(webAppSource, /slice\(0, 3\)/);
  assert.match(webAppSource, /whyFirst/);
});

test('atlas military warning priority stack hides no-warning state and keeps compact UI', () => {
  assert.match(webAppSource, /Pile priorité inactive: aucune alerte militaire high-risk non résolue/);
  assert.match(webAppSource, /if \(!priorityStack \|\| priorityStack\.empty\) return ''/);
  assert.match(webAppSource, /Pile opérations/);
  assert.match(webAppSource, /why first:/);
  assert.match(stylesSource, /\.atlas-military-warning-stack__panel/);
  assert.match(stylesSource, /\.atlas-military-warning-stack-top--critical rect/);
});
