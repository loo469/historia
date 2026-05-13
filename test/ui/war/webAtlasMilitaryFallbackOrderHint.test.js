import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas military fallback order hint builds on top warning best order and relief data', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryFallbackOrderHint\(priorityStack, orderHint, reliefPreview, commitment, shell\)/);
  assert.match(webAppSource, /getAtlasMilitaryBestOrderBlocker\(topWarning, orderHint, reliefPreview, commitment\)/);
  assert.match(webAppSource, /buildAtlasMilitaryFallbackOrderHint\(priorityStack, bestOrderHint, topReliefPreview, commitment, shell\)/);
  assert.match(webAppSource, /renderAtlasMilitaryFallbackOrderHint\(fallbackOrderHint\)/);
});

test('atlas military fallback order hint handles resource route overcommitment and cross-domain blocks', () => {
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
  assert.match(webAppSource, /type: 'budget-logistics'/);
  assert.match(webAppSource, /type: 'intrigue-exposure'/);
  assert.match(webAppSource, /type: 'cultural-tension'/);
  assert.match(webAppSource, /type: 'climate-pressure'/);
  assert.match(webAppSource, /type: 'no-clear-cross-domain-blocker'/);
  assert.match(webAppSource, /function buildAtlasMilitaryFallbackSelectionPreview\(fallback, topWarning, reliefPreview\)/);
  assert.match(webAppSource, /type: 'front-stabilized'/);
  assert.match(webAppSource, /type: 'exposure-reduced'/);
  assert.match(webAppSource, /type: 'capacity-freed'/);
  assert.match(webAppSource, /type: 'reinforcement-window-opened'/);
  assert.match(webAppSource, /type: 'no-safe-visible-change'/);
  assert.match(webAppSource, /function buildAtlasMilitaryFallbackResidualRisks\(fallback, topWarning, shell, priorityStack\)/);
  assert.match(webAppSource, /key: `neighbor-front:\$\{lowerWarning\.sourceId \?\? lowerWarning\.debtId\}`/);
  assert.match(webAppSource, /label: 'front voisin fragile'/);
  assert.match(webAppSource, /key: `contested-occupation:\$\{province\.provinceId\}`/);
  assert.match(webAppSource, /label: 'occupation contestée'/);
  assert.match(webAppSource, /key: `low-loyalty:\$\{province\.provinceId\}`/);
  assert.match(webAppSource, /label: 'loyauté basse'/);
  assert.match(webAppSource, /key: `supply-pressure:\$\{province\.provinceId\}`/);
  assert.match(webAppSource, /label: 'pression ravitaillement'/);
  assert.match(webAppSource, /key: `route-exposure:\$\{topWarning\.sourceId\}`/);
  assert.match(webAppSource, /label: 'axe encore exposé'/);
});

test('atlas military fallback order hint stays secondary and hides no-safe fallback state', () => {
  assert.match(webAppSource, /Aucun fallback sûr: ordre principal non bloqué ou alternative trop risquée/);
  assert.match(webAppSource, /return 'no-safe-fallback'/);
  assert.match(webAppSource, /if \(!fallbackHint \|\| fallbackHint\.empty \|\| !fallbackHint\.fallback\) return ''/);
  assert.match(webAppSource, /data-atlas-fallback-order/);
  assert.match(webAppSource, /atlas-military-fallback-order__safety/);
  assert.match(webAppSource, /atlas-military-fallback-order__blocker/);
  assert.match(webAppSource, /fallback\.crossDomainBlocker \? `<text class="atlas-military-fallback-order__blocker"/);
  assert.match(webAppSource, /crossDomainBlocker: null/);
  assert.match(webAppSource, /selectionPreview: null/);
  assert.match(webAppSource, /residualRisks: \[\]/);
  assert.match(webAppSource, /residualRisks\.length \? `; risques restants: \$\{residualRisks\.map\(\(risk\) => risk\.label\)\.join\(', '\)\}` : '; risques restants: aucun visible'/);
  assert.match(webAppSource, /fallback\.selectionPreview \? `<text class="atlas-military-fallback-order__preview/);
  assert.match(webAppSource, /atlas-military-fallback-order__residual-risks/);
  assert.match(webAppSource, /reste: aucun risque visible/);
  assert.match(webAppSource, /crossDomainBlocker \? `; \$\{crossDomainBlocker\.label\}` : ''/);
  assert.match(webAppSource, /selectionPreview \? `; \$\{selectionPreview\.label\}` : ''/);
  assert.match(stylesSource, /\.atlas-military-fallback-order__panel/);
  assert.match(stylesSource, /\.atlas-military-fallback-order--route-blocked/);
  assert.match(stylesSource, /\.atlas-military-fallback-order--overcommitment-blocked/);
  assert.match(stylesSource, /\.atlas-military-fallback-order__safety/);
  assert.match(stylesSource, /\.atlas-military-fallback-order__blocker/);
  assert.match(stylesSource, /\.atlas-military-fallback-order__preview/);
  assert.match(stylesSource, /\.atlas-military-fallback-order__residual-risks/);
});
