import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('military response options expose compact feasibility blockers before queuing', () => {
  assert.match(webAppSource, /function buildMilitaryOptionFeasibility/);
  assert.match(webAppSource, /feasibility: buildMilitaryOptionFeasibility/);
  assert.match(webAppSource, /prêt/);
  assert.match(webAppSource, /risqué/);
  assert.match(webAppSource, /bloqué/);
  assert.match(webAppSource, /dépendant/);
  assert.match(webAppSource, /Ravitaillement insuffisant/);
  assert.match(webAppSource, /Pression de front trop forte/);
  assert.match(webAppSource, /Moral local fragile/);
  assert.match(webAppSource, /Province voisine sous pression/);
  assert.match(webAppSource, /Information manquante/);
  assert.match(webAppSource, /Bloqueur principal/);
  assert.match(webAppSource, /option\.feasibility\.unlockAction/);
  assert.match(stylesSource, /\.military-response-option__feasibility/);
  assert.match(stylesSource, /military-response-option__feasibility--dependent/);
  assert.match(stylesSource, /military-response-option--dependent/);
});
