import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('atlas shows the climate downside of spending refresh reserves now', () => {
  assert.match(webAppSource, /function buildClimateRefreshReserveSpendingDownside/);
  assert.match(webAppSource, /climateRefreshReserveSpendingDownside: null/);
  assert.match(webAppSource, /climateRefreshReserveSpendingDownside,/);

  for (const stableKey of [
    'state',
    'visibleDownside',
    'timingMessage',
    'sourceRefreshDecision',
    'sourceProtectionDuration',
    'weakensNextClimateWindow',
    'summary',
  ]) {
    assert.match(webAppSource, new RegExp(`${stableKey}[:,]`));
  }

  assert.match(webAppSource, /dépense prématurée/);
  assert.match(webAppSource, /dépense opportune/);
  assert.match(webAppSource, /dépense à temporiser/);
  assert.match(webAppSource, /fenêtre suivante affaiblie par dépense prématurée/);
  assert.match(webAppSource, /cascade voisine moins couverte/);
  assert.match(webAppSource, /pression saisonnière moins amortie/);
  assert.match(webAppSource, /dette secondaire moins couverte/);
  assert.match(webAppSource, /réserve basse moins disponible/);
  assert.match(webAppSource, /refresh utile: il protège la prochaine fenêtre au bon moment/);
  assert.match(webAppSource, /downside climat: \$\{visibleDownside\}/);
  assert.match(webAppSource, /Coût dépense réserve refresh/);
});
