import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('selected province confirms and can undo a queued military map action', () => {
  assert.match(webAppSource, /function buildQueuedMilitaryMapActionConfirmation/);
  assert.match(webAppSource, /function renderQueuedMilitaryMapActionConfirmation/);
  assert.match(webAppSource, /Action carte en file/);
  assert.match(webAppSource, /Confirmation de l’action militaire ajoutée depuis la carte/);
  assert.match(webAppSource, /Cible \/ front/);
  assert.match(webAppSource, /Effet prévu/);
  assert.match(webAppSource, /Retirer de la file/);
  assert.match(webAppSource, /data-undo-recommended-action="true"/);
  assert.match(webAppSource, /state\.acceptedRecommendedMilitaryAction = null/);
  assert.match(webAppSource, /retiré de la file militaire avant résolution/);
  assert.match(webAppSource, /renderQueuedMilitaryMapActionConfirmation\(province, shell, intrigueView\)/);
  assert.match(webAppSource, /provinceId: province\.provinceId/);
  assert.match(stylesSource, /\.queued-map-action-confirmation/);
  assert.match(stylesSource, /queued-map-action-confirmation--blocked/);
  assert.match(stylesSource, /queued-map-action-confirmation--risky/);
});
