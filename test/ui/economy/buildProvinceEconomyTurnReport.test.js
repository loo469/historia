import test from 'node:test';
import assert from 'node:assert/strict';

import { buildProvinceEconomyTurnReport } from '../../../src/ui/economy/buildProvinceEconomyTurnReport.js';

const province = { provinceId: 'river-gate', label: 'Porte du Fleuve' };

function buildEconomyView({ routeDelta = -12, stockDelta = 4, stabilityDelta = 1 } = {}) {
  return {
    overlay: {
      cities: [
        { cityId: 'river-city', cityName: 'River Gate', regionId: 'river-gate' },
        { cityId: 'port-city', cityName: 'Crown Port', regionId: 'crown-heart' },
      ],
      routes: [
        {
          routeId: 'river-road',
          routeName: 'River Road',
          cityIds: ['river-city', 'port-city'],
        },
      ],
    },
    deltaByCityId: {
      'river-city': { stockDelta, stabilityDelta, prosperityDelta: 0 },
    },
    routeDeltaById: {
      'river-road': { riskDelta: routeDelta, activeDelta: 0, capacityDelta: 0 },
    },
  };
}

test('buildProvinceEconomyTurnReport recommends visible improved logistics deltas first', () => {
  const report = buildProvinceEconomyTurnReport(province, buildEconomyView(), {
    previousChoice: { action: 'Sécuriser convoi', routes: ['River Road'] },
  });

  assert.equal(report.tone, 'improved');
  assert.match(report.summary, /Stress logistique réduit/);
  assert.match(report.previousAction, /Action Beta précédente: Sécuriser convoi/);
  assert.equal(report.deltas[0].type, 'route');
  assert.equal(report.deltas[0].tone, 'improved');
  assert.match(report.deltas[0].detail, /risque -12/);
});

test('buildProvinceEconomyTurnReport surfaces degradation and economic cost labels', () => {
  const report = buildProvinceEconomyTurnReport(province, buildEconomyView({ routeDelta: 8, stockDelta: -3 }));

  assert.equal(report.tone, 'worse');
  assert.ok(report.deltas.some((delta) => delta.label === 'Stress logistique accru'));
  assert.ok(report.deltas.some((delta) => delta.label === 'Approvisionnement en baisse'));
});

test('buildProvinceEconomyTurnReport detects repaired or broken route state changes', () => {
  const economyView = buildEconomyView();
  economyView.routeDeltaById['river-road'] = { riskDelta: -4, activeDelta: 1, capacityDelta: 0 };

  const report = buildProvinceEconomyTurnReport(province, economyView);

  assert.equal(report.deltas[0].label, 'Route réparée');
  assert.equal(report.deltas[0].tone, 'improved');
});

test('buildProvinceEconomyTurnReport returns a neutral empty state when nothing changed', () => {
  const report = buildProvinceEconomyTurnReport(province, buildEconomyView({ routeDelta: 0, stockDelta: 0, stabilityDelta: 0 }));

  assert.equal(report.tone, 'neutral');
  assert.deepEqual(report.deltas, []);
  assert.match(report.summary, /Aucun changement économie\/logistique notable/);
});

test('buildProvinceEconomyTurnReport validates options', () => {
  assert.throws(() => buildProvinceEconomyTurnReport(province, buildEconomyView(), null), /options must be an object/);
});
