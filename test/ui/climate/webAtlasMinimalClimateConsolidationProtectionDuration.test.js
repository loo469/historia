import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('atlas shows how long minimal climate consolidation protects the next window', () => {
  assert.match(webAppSource, /function buildMinimalClimateConsolidationProtectionDuration/);
  assert.match(webAppSource, /minimalClimateConsolidationProtectionDuration: null/);
  assert.match(webAppSource, /minimalClimateConsolidationProtectionDuration,/);

  for (const stableKey of [
    'state',
    'shorteningConstraint',
    'microAction',
    'expiresBeforeCriticalWindow',
    'sourceWindowPrevention',
    'sourceConsolidation',
    'summary',
  ]) {
    assert.match(webAppSource, new RegExp(`${stableKey}[:,]`));
  }

  assert.match(webAppSource, /protection courte/);
  assert.match(webAppSource, /protection jusqu’à la prochaine fenêtre/);
  assert.match(webAppSource, /protection durable/);
  assert.match(webAppSource, /réserve basse/);
  assert.match(webAppSource, /anomalie voisine/);
  assert.match(webAppSource, /dette secondaire/);
  assert.match(webAppSource, /pression de saison/);
  assert.match(webAppSource, /rafraîchir la consolidation avant \$\{shorteningConstraint\}/);
  assert.match(webAppSource, /aucune micro-action immédiate/);
  assert.match(webAppSource, /Durée protection consolidation/);
});
