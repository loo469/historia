import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas military top warning relief preview builds on priority stack signals', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryTopWarningReliefPreview\(priorityStack\)/);
  assert.match(webAppSource, /const topWarning = priorityStack\?\.stack\?\.\[0\]/);
  assert.match(webAppSource, /frontRiskReduction = Math\.min\(36, Math\.max\(0, Math\.round\(topWarning\.frontRisk \* 0\.28\)\)\)/);
  assert.match(webAppSource, /routeExposureReduced = Math\.min\(12, Math\.max\(0, topWarning\.routeExposure\)\)/);
  assert.match(webAppSource, /renderAtlasMilitaryTopWarningReliefPreview\(topReliefPreview\)/);
});

test('atlas military top warning relief preview has deterministic high partial and no-relief cases', () => {
  assert.match(webAppSource, /if \(reliefScore >= 38\) return 'relief-high'/);
  assert.match(webAppSource, /if \(reliefScore >= 22\) return 'relief-partial'/);
  assert.match(webAppSource, /return 'no-meaningful-relief'/);
  assert.match(webAppSource, /if \(tone === 'no-meaningful-relief'\)/);
  assert.match(webAppSource, /Aucun gain significatif prévu/);
});

test('atlas military top warning relief preview renders only beside the top actionable stack item', () => {
  assert.match(webAppSource, /if \(!reliefPreview \|\| reliefPreview\.empty \|\| !reliefPreview\.preview\) return ''/);
  assert.match(webAppSource, /data-atlas-warning-relief/);
  assert.match(webAppSource, /gain \$\{preview\.tone === 'relief-high' \? 'fort' : 'partiel'\}/);
  assert.doesNotMatch(webAppSource, /lowerPriorities\.map[\s\S]*renderAtlasMilitaryTopWarningReliefPreview/);
  assert.match(stylesSource, /\.atlas-military-warning-relief__panel/);
  assert.match(stylesSource, /\.atlas-military-warning-relief--relief-partial/);
});
