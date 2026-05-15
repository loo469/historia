import test from 'node:test';
import assert from 'node:assert/strict';

import { GenerateStrategicMap } from '../../../src/application/war/GenerateStrategicMap.js';
import { buildStrategicMapPreviewHtml } from '../../../src/ui/war/buildStrategicMapPreviewHtml.js';

test('buildStrategicMapPreviewHtml renders a screenshot-ready preview from the generated map contract', () => {
  const generatedMap = new GenerateStrategicMap().execute();
  const html = buildStrategicMapPreviewHtml(generatedMap, {
    generatedAt: '2026-05-11T19:25:00.000Z',
  });

  assert.match(html, /<!doctype html>/);
  assert.match(html, /Carte stratégique Historia/);
  assert.match(html, /GenerateStrategicMap/);
  assert.match(html, /buildStrategicMapShell/);
  assert.match(html, /points="38,38 54,34 66,40 68,54 56,66 40,64 32,52 34,42"/);
  assert.match(html, /class="relation-line-casing"/);
  assert.match(html, /class="province-label-plate"/);
  assert.match(html, /class="province-label-leader"/);
  assert.match(html, /Planificateur clavier d’action province/);
  assert.match(html, /Première action recommandée/);
  assert.match(html, /Raison tactique/);
  assert.match(html, /Validation de file d’actions province/);
  assert.match(html, /Prochaine action sûre/);
  assert.match(html, /queue-validation-item--conflict/);
  assert.match(html, /conflict-aware-preview/);
  assert.match(html, /Blocage:/);
  assert.match(html, /Exclusif avec/);
  assert.match(html, /corriger avant confirmation/);
  assert.match(html, /Récapitulatif des ordres de province résolus/);
  assert.match(html, /Après-action/);
  assert.match(html, /Ordre principal résolu/);
  assert.match(html, /Appui reporté/);
  assert.match(html, /Replay timeline de pression du front/);
  assert.match(html, /Rejouer la pression du front/);
  assert.match(html, /Avant ordre/);
  assert.match(html, /Après résolution/);
  assert.match(html, /Ordre bloqué/);
  assert.match(html, /front-pressure-frame--loss is-active/);
  assert.match(html, /Recommandations de récupération après replay de pression/);
  assert.match(html, /Consolider le soutien/);
  assert.match(html, /Sonder prudemment la brèche/);
  assert.match(html, /option la plus sûre/);
  assert.match(html, /option opportuniste/);
  assert.match(html, /class="province is-contested is-occupied is-selected is-queued is-recently-affected"/);
  assert.match(html, /tabindex="0"/);
  assert.match(html, /Porte du Fleuve/);
  assert.match(html, /historia-alpha-strategic-map-v1/);
  assert.equal((html.match(/<g class="province/g) ?? []).length, generatedMap.provinces.length);
});

test('buildStrategicMapPreviewHtml validates generated map input', () => {
  const generatedMap = new GenerateStrategicMap().execute();

  assert.throws(() => buildStrategicMapPreviewHtml(null), /generatedMap must be an object/);
  assert.throws(() => buildStrategicMapPreviewHtml(generatedMap, null), /options must be an object/);
  assert.throws(() => buildStrategicMapPreviewHtml({ provinces: {} }), /generatedMap.provinces must be an array/);
});
