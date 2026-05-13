import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

const deadlineMissWarningFixture = [
  {
    state: 'misses-by-one-turn',
    reason: 'un tour de marge manquant',
    nextStep: 'Avancer l’ordre au tour courant',
  },
  {
    state: 'misses-by-capacity-gap',
    reason: 'capacité de readiness sous le seuil exécutable',
    nextStep: 'Ajouter une capacité ciblée',
  },
  {
    state: 'recovered-in-time',
    reason: 'récupère la fenêtre deadline à temps',
    nextStep: 'warning: null',
  },
  {
    state: 'empty',
    reason: 'aucun minimum viable boost éligible',
    nextStep: 'warning: null',
  },
];

test('atlas warns when the top minimum viable climate boost still misses deadline risk', () => {
  assert.match(webAppSource, /function buildAtlasClimateMinimumBoostDeadlineMissWarning/);
  assert.match(webAppSource, /function renderAtlasClimateMinimumBoostDeadlineMissWarning/);
  assert.match(webAppSource, /minimumBoostView\.state === 'empty'/);
  assert.match(webAppSource, /minimumBoostView\.state === 'minimal-sufficient'/);
  assert.match(webAppSource, /minimumBoostView\.state === 'insufficient-minimum'/);
  assert.match(webAppSource, /Deadline encore risquée/);
  assert.match(webAppSource, /À sécuriser/);
  assert.match(webAppSource, /atlasClimateMinimumBoostDeadlineMissWarning = buildAtlasClimateMinimumBoostDeadlineMissWarning\(atlasClimateMinimumViableBoostHint\)/);
  assert.match(webAppSource, /renderAtlasClimateMinimumBoostDeadlineMissWarning\(atlasClimateMinimumBoostDeadlineMissWarning\)/);

  for (const fixture of deadlineMissWarningFixture) {
    assert.match(webAppSource, new RegExp(fixture.state));
    assert.match(webAppSource, new RegExp(fixture.reason));
    assert.match(webAppSource, new RegExp(fixture.nextStep));
  }

  assert.match(stylesSource, /\.map-world-climate-minimum-boost-miss/);
  assert.match(stylesSource, /\.map-world-climate-minimum-boost-miss--misses-by-capacity-gap/);
});
