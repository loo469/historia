import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('playable map province details expose contextual action recommendations', () => {
  assert.match(webAppSource, /function buildProvinceActionRecommendations/);
  assert.match(webAppSource, /function renderProvinceActionRecommendations/);
  assert.match(webAppSource, /function buildIntrigueProvinceRecommendation/);
  assert.match(webAppSource, /function compareIntrigueRecommendationSignals/);
  assert.match(webAppSource, /Actions recommandées/);
  assert.match(webAppSource, /Renforcer le front/);
  assert.match(webAppSource, /Inspecter les routes/);
  assert.match(webAppSource, /Comparer le risque climat/);
  assert.match(webAppSource, /Signal local/);
  assert.match(webAppSource, /Aucun signal intrigue local/);
  assert.match(webAppSource, /renderProvinceActionRecommendations\(province, focusContext, intrigueView\)/);
});
