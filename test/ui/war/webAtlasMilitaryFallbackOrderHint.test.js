import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas military fallback order hint builds on top warning best order and relief data', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryFallbackOrderHint\(priorityStack, orderHint, reliefPreview, commitment\)/);
  assert.match(webAppSource, /getAtlasMilitaryBestOrderBlocker\(topWarning, orderHint, reliefPreview, commitment\)/);
  assert.match(webAppSource, /buildAtlasMilitaryFallbackOrderHint\(priorityStack, bestOrderHint, topReliefPreview, commitment\)/);
  assert.match(webAppSource, /renderAtlasMilitaryFallbackOrderHint\(fallbackOrderHint\)/);
});

test('atlas military fallback order hint handles resource route and overcommitment blocks', () => {
  assert.match(webAppSource, /return 'resource-blocked'/);
  assert.match(webAppSource, /return 'route-blocked'/);
  assert.match(webAppSource, /return 'overcommitment-blocked'/);
  assert.match(webAppSource, /order: 'Fixer réserve'/);
  assert.match(webAppSource, /order: 'Sécuriser détour'/);
  assert.match(webAppSource, /order: 'Geler engagement'/);
  assert.match(webAppSource, /detail: `réduire la charge sur \$\{commitment\?\.selectedOption\?\.target \?\? topWarning\?\.label\}`/);
  assert.match(webAppSource, /type: 'avoids-overcommitment'/);
  assert.match(webAppSource, /type: 'bypasses-route-exposure'/);
  assert.match(webAppSource, /type: 'preserves-front-coverage'/);
  assert.match(webAppSource, /type: 'waits-for-resupply'/);
  assert.match(webAppSource, /type: 'no-clear-safety-reason'/);
});

test('atlas military fallback order hint stays secondary and hides no-safe fallback state', () => {
  assert.match(webAppSource, /Aucun fallback sûr: ordre principal non bloqué ou alternative trop risquée/);
  assert.match(webAppSource, /return 'no-safe-fallback'/);
  assert.match(webAppSource, /if \(!fallbackHint \|\| fallbackHint\.empty \|\| !fallbackHint\.fallback\) return ''/);
  assert.match(webAppSource, /data-atlas-fallback-order/);
  assert.match(webAppSource, /atlas-military-fallback-order__safety/);
  assert.match(webAppSource, /summary: `\$\{fallback\.order\}: \$\{fallback\.detail\} \(\$\{fallback\.why\}; \$\{safetyReason\.label\}\)\.`/);
  assert.match(stylesSource, /\.atlas-military-fallback-order__panel/);
  assert.match(stylesSource, /\.atlas-military-fallback-order--route-blocked/);
  assert.match(stylesSource, /\.atlas-military-fallback-order--overcommitment-blocked/);
  assert.match(stylesSource, /\.atlas-military-fallback-order__safety/);
});
