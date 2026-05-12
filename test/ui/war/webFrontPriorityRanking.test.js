import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('map ranks visible front provinces by next military priority', () => {
  assert.match(webAppSource, /function buildFrontPriorityRanking/);
  assert.match(webAppSource, /function renderFrontPriorityRanking/);
  assert.match(webAppSource, /Priorités fronts/);
  assert.match(webAppSource, /buildCriticalFrontRiskWarnings\(province, projection\)/);
  assert.match(webAppSource, /buildProjectedFrontStability\(province, shell, actionQueue\)/);
  assert.match(webAppSource, /blockedCount \* 12/);
  assert.match(webAppSource, /urgence \$\{urgencyLabel\}/);
  assert.match(webAppSource, /Passe en premier: cumul risque \/ stabilité le plus élevé/);
  assert.match(webAppSource, /Après \$\{entries\[index - 1\]\.provinceLabel\}: score/);
  assert.match(webAppSource, /renderFrontPriorityRanking\(shell, intrigueView\)/);
  assert.match(stylesSource, /\.front-priority-ranking/);
  assert.match(stylesSource, /\.front-priority--danger/);
  assert.match(stylesSource, /\.front-priority--warning/);
});
