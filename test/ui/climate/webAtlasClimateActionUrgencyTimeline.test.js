import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas renders a compact urgency timeline from ranked climate action plans', () => {
  assert.match(webAppSource, /function buildAtlasClimateActionUrgencyTimeline/);
  assert.match(webAppSource, /function renderAtlasClimateActionUrgencyTimeline/);
  assert.match(webAppSource, /left\.priorityRank - right\.priorityRank/);
  assert.match(webAppSource, /Dépendance\/synergie/);
  assert.match(webAppSource, /Synergie: prépare/);
  assert.match(webAppSource, /Sans fenêtre proche/);
  assert.match(webAppSource, /très exposée sans fenêtre d’action proche/);
  assert.match(webAppSource, /Timeline climat: jouer/);
  assert.match(webAppSource, /atlasClimateActionUrgencyTimeline = buildAtlasClimateActionUrgencyTimeline\(atlasClimateActionPlanRanking\)/);
  assert.match(webAppSource, /renderAtlasClimateActionUrgencyTimeline\(atlasClimateActionUrgencyTimeline\)/);

  assert.match(stylesSource, /\.map-world-climate-action-timeline/);
  assert.match(stylesSource, /\.map-world-climate-action-timeline--alert/);
  assert.match(stylesSource, /\.map-world-climate-action-timeline__step--critical/);
});
