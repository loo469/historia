import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas military best next order hint builds on stack relief and staged commitment data', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryBestNextOrderHint\(priorityStack, reliefPreview, commitment\)/);
  assert.match(webAppSource, /priorityStack\?\.stack\?\.\[0\]/);
  assert.match(webAppSource, /reliefPreview\?\.preview/);
  assert.match(webAppSource, /commitment\?\.selectedOption\?\.target/);
  assert.match(webAppSource, /renderAtlasMilitaryWarningPriorityStack\(commitmentWarningStack, stagedCommitment\)/);
});

test('atlas military best next order hint handles reinforce route and overcommitment candidates', () => {
  assert.match(webAppSource, /type: 'reinforce-front'/);
  assert.match(webAppSource, /order: 'Renforcer front'/);
  assert.match(webAppSource, /type: 'clear-route-exposure'/);
  assert.match(webAppSource, /order: 'Ouvrir route'/);
  assert.match(webAppSource, /type: 'reduce-overcommitment'/);
  assert.match(webAppSource, /order: 'Réduire surengagement'/);
});

test('atlas military best next order hint stays hidden when there is no clear order', () => {
  assert.match(webAppSource, /Aucun ordre recommandé: pas de priorité actionnable avec gain clair/);
  assert.match(webAppSource, /if \(!candidate \|\| candidate\.score < 12\)/);
  assert.match(webAppSource, /if \(!orderHint \|\| orderHint\.empty \|\| !orderHint\.hint\) return ''/);
  assert.match(webAppSource, /data-atlas-best-next-order/);
  assert.match(stylesSource, /\.atlas-military-best-order__panel/);
  assert.match(stylesSource, /\.atlas-military-best-order--clear-route-exposure/);
  assert.match(stylesSource, /\.atlas-military-best-order--reduce-overcommitment/);
});
