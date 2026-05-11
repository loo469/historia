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
  assert.match(html, /Porte du Fleuve/);
  assert.match(html, /historia-alpha-strategic-map-v1/);
  assert.equal((html.match(/class="province /g) ?? []).length, generatedMap.provinces.length);
});

test('buildStrategicMapPreviewHtml validates generated map input', () => {
  const generatedMap = new GenerateStrategicMap().execute();

  assert.throws(() => buildStrategicMapPreviewHtml(null), /generatedMap must be an object/);
  assert.throws(() => buildStrategicMapPreviewHtml(generatedMap, null), /options must be an object/);
  assert.throws(() => buildStrategicMapPreviewHtml({ provinces: {} }), /generatedMap.provinces must be an array/);
});
