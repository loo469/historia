import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('atlas identifies secondary climate debt when reserve costs a near window', () => {
  assert.match(webAppSource, /function buildSecondaryClimateDebtWhenReserveCostsWindow/);
  assert.match(webAppSource, /secondaryClimateDebtWhenReserveCostsWindow: null/);
  assert.match(webAppSource, /secondaryClimateDebtWhenReserveCostsWindow,/);

  for (const stableKey of [
    'state',
    'secondaryDebtKey',
    'secondaryDebtLabel',
    'visibleConstraint',
    'shortGesture',
    'reserveStillBest',
    'sourceReserveCost',
    'summary',
  ]) {
    assert.match(webAppSource, new RegExp(`${stableKey}[:,]`));
  }

  assert.match(webAppSource, /dette secondaire urgente/);
  assert.match(webAppSource, /dette à surveiller/);
  assert.match(webAppSource, /réserve encore préférable/);
  assert.match(webAppSource, /aucune dette prioritaire/);
  assert.match(webAppSource, /saison/);
  assert.match(webAppSource, /cascade voisine/);
  assert.match(webAppSource, /pression régionale/);
  assert.match(webAppSource, /conflit de timing/);
  assert.match(webAppSource, /dette secondaire/);
  assert.match(webAppSource, /fenêtre restaurée/);
  assert.match(webAppSource, /traiter \$\{secondaryDebt\.label\} avant de garder la réserve/);
  assert.match(webAppSource, /préparer \$\{secondaryDebt\.label\} si la fenêtre reste coûteuse/);
  assert.match(webAppSource, /aucun geste immédiat/);
  assert.match(webAppSource, /Dette secondaire réserve/);
});
