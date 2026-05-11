import test from 'node:test';
import assert from 'node:assert/strict';

import { buildProvinceLogisticsChoicePreview } from '../../../src/ui/economy/buildProvinceLogisticsChoicePreview.js';

const province = { provinceId: 'river-gate' };

function buildEconomyView() {
  return {
    overlay: {
      cities: [
        { cityId: 'river-city', cityName: 'River Gate', regionId: 'river-gate' },
        { cityId: 'iron-city', cityName: 'Iron Plain', regionId: 'iron-plain' },
        { cityId: 'port-city', cityName: 'Crown Port', regionId: 'crown-heart' },
      ],
      routes: [
        {
          routeId: 'safe-road',
          routeName: 'Safe Road',
          cityIds: ['river-city', 'port-city'],
          active: true,
          riskLevel: 18,
          totalCapacity: 4,
          resources: [{ resourceId: 'grain', capacity: 2 }],
        },
        {
          routeId: 'ember-line',
          routeName: 'Ember Line',
          cityIds: ['river-city', 'iron-city'],
          active: true,
          riskLevel: 68,
          totalCapacity: 10,
          resources: [{ resourceId: 'tools', capacity: 6 }],
        },
      ],
    },
    comparison: {
      rows: [
        { cityId: 'river-city', tensionLevel: 'high' },
        { cityId: 'iron-city', tensionLevel: 'low' },
        { cityId: 'port-city', tensionLevel: 'low' },
      ],
    },
  };
}

test('buildProvinceLogisticsChoicePreview ranks the most constrained route as recommended', () => {
  const preview = buildProvinceLogisticsChoicePreview(province, buildEconomyView(), {
    resourceLabelById: { grain: 'Grain', tools: 'Outils' },
  });

  assert.equal(preview.options.length, 2);
  assert.equal(preview.recommendedOptionId, preview.options[0].optionId);
  assert.equal(preview.options[0].routeId, 'ember-line');
  assert.equal(preview.options[0].recommended, true);
  assert.equal(preview.options[0].action, 'Sécuriser convoi');
  assert.deepEqual(preview.options[0].resources, ['Outils']);
  assert.match(preview.summary, /Ember Line/);
});

test('buildProvinceLogisticsChoicePreview exposes readable cost delay risk and impact labels', () => {
  const preview = buildProvinceLogisticsChoicePreview(province, buildEconomyView());
  const option = preview.options[0];

  assert.ok(option.cost.length > 0);
  assert.ok(option.delay.length > 0);
  assert.equal(typeof option.residualRisk, 'number');
  assert.ok(option.impact.includes('tools') || option.impact.includes('ressource'));
  assert.deepEqual(option.routes, ['Ember Line']);
});

test('buildProvinceLogisticsChoicePreview returns an empty state when no route is linked', () => {
  const preview = buildProvinceLogisticsChoicePreview({ provinceId: 'isolated' }, buildEconomyView());

  assert.equal(preview.recommendedOptionId, null);
  assert.deepEqual(preview.options, []);
  assert.match(preview.summary, /Aucun reroutage utile/);
});

test('buildProvinceLogisticsChoicePreview validates options', () => {
  assert.throws(() => buildProvinceLogisticsChoicePreview(province, buildEconomyView(), null), /options must be an object/);
  assert.throws(() => buildProvinceLogisticsChoicePreview(province, buildEconomyView(), { resourceLabelById: [] }), /resourceLabelById must be an object/);
});
