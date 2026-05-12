import test from 'node:test';
import assert from 'node:assert/strict';

import { buildProvinceEconomyBudgetPreview } from '../../../src/ui/economy/buildProvinceEconomyBudgetPreview.js';

const province = { provinceId: 'river-gate', label: 'Porte du Fleuve' };

function buildEconomyView(toolStock = 6) {
  return {
    overlay: {
      cities: [
        {
          cityId: 'river-city',
          cityName: 'River Gate',
          regionId: 'river-gate',
          resources: {
            totalStock: toolStock + 2,
            entries: [
              { resourceId: 'Outils', quantity: toolStock },
              { resourceId: 'grain', quantity: 2 },
            ],
          },
        },
      ],
    },
    comparison: {
      rows: [{ cityId: 'river-city', tensionLevel: 'medium' }],
    },
  };
}

const logisticsChoices = [
  {
    optionId: 'choice-1',
    action: 'Sécuriser convoi',
    resources: ['Outils'],
    routes: ['Ember Line'],
    affectedCity: 'River Gate',
    residualRisk: 42,
  },
];

const actionQueue = [
  { actionCode: 'WAR-RIVER-GATE-1', label: 'Inspecter les routes', status: 'ready' },
];

test('buildProvinceEconomyBudgetPreview exposes consumptions, route and hub budget details', () => {
  const preview = buildProvinceEconomyBudgetPreview(province, buildEconomyView(), { actionQueue, logisticsChoices });

  assert.equal(preview.status, 'ready');
  assert.equal(preview.totalCost, 3);
  assert.equal(preview.plans[0].actionCode, 'WAR-RIVER-GATE-1');
  assert.equal(preview.plans[0].logisticsAction, 'Sécuriser convoi');
  assert.deepEqual(preview.plans[0].routeNames, ['Ember Line']);
  assert.equal(preview.plans[0].hubName, 'River Gate');
  assert.deepEqual(preview.plans[0].consumedResources, [{ label: 'Outils', quantity: 3 }]);
  assert.match(preview.plans[0].surplusOrShortage, /restante/);
});

test('buildProvinceEconomyBudgetPreview marks impossible actions when resources are missing', () => {
  const preview = buildProvinceEconomyBudgetPreview(province, buildEconomyView(1), { actionQueue, logisticsChoices });

  assert.equal(preview.status, 'blocked');
  assert.equal(preview.plans[0].status, 'blocked');
  assert.match(preview.summary, /impossible/);
  assert.match(preview.plans[0].effect, /budget insuffisant/);
});

test('buildProvinceEconomyBudgetPreview returns an empty state without logistics choices', () => {
  const preview = buildProvinceEconomyBudgetPreview(province, buildEconomyView(), { actionQueue, logisticsChoices: [] });

  assert.equal(preview.status, 'empty');
  assert.equal(preview.totalCost, 0);
  assert.deepEqual(preview.plans, []);
  assert.match(preview.summary, /Aucun coût économie\/logistique/);
});

test('buildProvinceEconomyBudgetPreview validates options', () => {
  assert.throws(() => buildProvinceEconomyBudgetPreview(province, buildEconomyView(), null), /options must be an object/);
});
