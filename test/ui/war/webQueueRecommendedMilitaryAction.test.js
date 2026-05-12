import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('map recommendation can be queued directly with clear duplicate states', () => {
  assert.match(webAppSource, /acceptedRecommendedMilitaryAction: null/);
  assert.match(webAppSource, /function buildRecommendedMilitaryQueueState/);
  assert.match(webAppSource, /Prête à ajouter à la file/);
  assert.match(webAppSource, /Déjà en file depuis la carte/);
  assert.match(webAppSource, /Remplace l’action carte précédente/);
  assert.match(webAppSource, /data-queue-recommended-action="true"/);
  assert.match(webAppSource, /Ajouter à la file/);
  assert.match(webAppSource, /state\.acceptedRecommendedMilitaryAction =/);
  assert.match(webAppSource, /state\.selectedProvinceId = provinceId/);
  assert.match(webAppSource, /Coût \/ risque|orderCost/);
  assert.match(webAppSource, /horizon: recommendedAction\?\.expectedResult/);
  assert.match(stylesSource, /\.recommended-action-preview__queue/);
  assert.match(stylesSource, /recommended-action-preview__queue--queued/);
  assert.match(stylesSource, /recommended-action-preview__queue--replace/);
});
