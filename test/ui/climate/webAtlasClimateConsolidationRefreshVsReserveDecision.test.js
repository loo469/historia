import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('atlas shows when to refresh consolidation instead of saving climate reserves', () => {
  assert.match(webAppSource, /function buildClimateConsolidationRefreshVsReserveDecision/);
  assert.match(webAppSource, /climateConsolidationRefreshVsReserveDecision: null/);
  assert.match(webAppSource, /climateConsolidationRefreshVsReserveDecision,/);

  for (const stableKey of [
    'state',
    'refreshConstraint',
    'microAction',
    'expiresBeforeCriticalWindow',
    'sourceProtectionDuration',
    'sourceWindowPrevention',
    'summary',
  ]) {
    assert.match(webAppSource, new RegExp(`${stableKey}[:,]`));
  }

  assert.match(webAppSource, /réserve à conserver/);
  assert.match(webAppSource, /rafraîchissement prudent recommandé/);
  assert.match(webAppSource, /rafraîchissement urgent avant expiration/);
  assert.match(webAppSource, /protection courte restante/);
  assert.match(webAppSource, /réserve basse/);
  assert.match(webAppSource, /pression saisonnière/);
  assert.match(webAppSource, /anomalie voisine/);
  assert.match(webAppSource, /dette secondaire/);
  assert.match(webAppSource, /rafraîchir maintenant/);
  assert.match(webAppSource, /programmer un refresh léger avant de consommer la réserve/);
  assert.match(webAppSource, /conserver la réserve climatique/);
  assert.match(webAppSource, /Refresh vs réserve/);
});
