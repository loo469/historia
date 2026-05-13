import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

const deterministicCommitments = [
  ['deadline moins serrée', 'faible', 1, 'déplace seulement le jalon déjà recommandé'],
  ['capacité régionale libérée', 'modéré', 2, 'engage une capacité ciblée déjà signalée'],
  ['exposition réduite', 'modéré', 2, 'réduit d’abord le périmètre exposé'],
  ['aucun relief sûr', 'minimal', 0, 'ne promet aucun relief non confirmé'],
];

test('atlas surfaces the cheapest safe climate recovery commitment from the projection', () => {
  assert.match(webAppSource, /function buildAtlasClimateCheapestSafeRecoveryCommitment/);
  assert.match(webAppSource, /function renderAtlasClimateCheapestSafeRecoveryCommitment/);
  assert.match(webAppSource, /cheapestSafeCommitment: null/);
  assert.match(webAppSource, /Aucun engagement climat minimal sûr/);
  assert.match(webAppSource, /atlasClimateCheapestSafeRecoveryCommitment = buildAtlasClimateCheapestSafeRecoveryCommitment\(atlasClimateRecoveryPlanProjection\)/);
  assert.match(webAppSource, /renderAtlasClimateCheapestSafeRecoveryCommitment\(atlasClimateCheapestSafeRecoveryCommitment\)/);

  for (const [pressure, cost, effort, safeBecause] of deterministicCommitments) {
    assert.match(webAppSource, new RegExp(pressure));
    assert.match(webAppSource, new RegExp(`cost: '${cost}'`));
    assert.match(webAppSource, new RegExp(`effortScore: ${effort}`));
    assert.match(webAppSource, new RegExp(safeBecause));
  }

  assert.match(webAppSource, /deadlineCovered/);
  assert.match(webAppSource, /pressureReduced/);
  assert.match(webAppSource, /stillActiveRisk/);
  assert.match(webAppSource, /doesNotSolve/);
  assert.match(webAppSource, /Pourquoi sûr/);
  assert.match(webAppSource, /Reste actif/);
  assert.match(stylesSource, /\.map-world-climate-cheapest-commitment/);
  assert.match(stylesSource, /\.map-world-climate-cheapest-commitment--safe-but-risky/);
});
