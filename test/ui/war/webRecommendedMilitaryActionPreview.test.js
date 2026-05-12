import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('map previews the front state after the recommended military action', () => {
  assert.match(webAppSource, /function buildRecommendedMilitaryActionPreview/);
  assert.match(webAppSource, /function renderRecommendedMilitaryActionPreview/);
  assert.match(webAppSource, /Aperçu action recommandée/);
  assert.match(webAppSource, /Aperçu après action militaire recommandée/);
  assert.match(webAppSource, /buildFrontPriorityRanking\(shell, intrigueView\)/);
  assert.match(webAppSource, /buildProjectedFrontStability\(province, shell, actionQueue\)/);
  assert.match(webAppSource, /buildCriticalFrontRiskWarnings\(province, projection\)/);
  assert.match(webAppSource, /Pression/);
  assert.match(webAppSource, /Stabilité projetée/);
  assert.match(webAppSource, /Risque critique restant/);
  assert.match(webAppSource, /calculé: action recommandée \+ projection actuelle/);
  assert.match(webAppSource, /estimé prudent/);
  assert.match(webAppSource, /Front voisin soulagé partiellement|province encore bloquée|Urgence qui demeure/);
  assert.match(webAppSource, /renderRecommendedMilitaryActionPreview\(shell, intrigueView\)/);
  assert.match(stylesSource, /\.recommended-action-preview/);
  assert.match(stylesSource, /\.recommended-action-preview__effects/);
  assert.match(stylesSource, /\.recommended-action-preview--danger/);
});
