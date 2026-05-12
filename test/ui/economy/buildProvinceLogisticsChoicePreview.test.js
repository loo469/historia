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
        { cityId: 'hill-city', cityName: 'Hill Hub', regionId: 'hill-hub' },
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
        {
          routeId: 'hill-spur',
          routeName: 'Hill Spur',
          cityIds: ['river-city', 'hill-city'],
          active: true,
          riskLevel: 46,
          totalCapacity: 8,
          resources: [{ resourceId: 'tools', capacity: 3 }],
        },
      ],
    },
    comparison: {
      rows: [
        { cityId: 'river-city', tensionLevel: 'high' },
        { cityId: 'iron-city', tensionLevel: 'low' },
        { cityId: 'port-city', tensionLevel: 'low' },
        { cityId: 'hill-city', tensionLevel: 'medium' },
      ],
    },
  };
}

test('buildProvinceLogisticsChoicePreview ranks the most constrained route as recommended', () => {
  const preview = buildProvinceLogisticsChoicePreview(province, buildEconomyView(), {
    resourceLabelById: { grain: 'Grain', tools: 'Outils' },
  });

  assert.equal(preview.options.length, 3);
  assert.equal(preview.recommendedOptionId, preview.options[0].optionId);
  assert.equal(preview.options[0].routeId, 'ember-line');
  assert.equal(preview.options[0].recommended, true);
  assert.equal(preview.options[0].action, 'Sécuriser convoi');
  assert.deepEqual(preview.options[0].resources, ['Outils']);
  assert.match(preview.summary, /Ember Line/);
  assert.equal(preview.status, 'high');
  assert.equal(preview.options[0].causeLabel, 'stock critique');
  assert.match(preview.options[0].cause, /River Gate/);
  assert.match(preview.options[0].cause, /Ember Line/);
  assert.equal(preview.recoveryChoiceCount, 4);
  assert.equal(preview.timelineStatus, 'queued');
  assert.match(preview.timelineSummary, /prochain tour/);
  assert.match(preview.timelineSummary, /goulot/);
  assert.match(preview.downstreamSummary, /manquer|pression|pénurie|aval/);
  assert.ok(['aggravée', 'déplacée', 'résolue', 'inconnue'].includes(preview.downstreamStatus));
  assert.ok(preview.options[0].recoveryChoices.length >= 2);
  assert.equal(preview.options[0].recoveryChoices[0].recommended, true);
  assert.match(preview.options[0].recoveryChoices[0].benefit, /Outils|River Gate|Ember Line/);
  assert.ok(preview.options[0].recoveryChoices[0].blocker.length > 0);
  assert.match(preview.options[0].recoveryChoices[1].comparison, /moins urgent/);
  assert.ok(preview.options[0].recoveryChoices[0].neighborEffects.length >= 1);
  assert.match(preview.options[0].recoveryChoices[0].neighborEffects[0].detail, /Iron Plain|Hill Hub|voisin|hub|trafic/);
  assert.ok(['congestion déplacée', 'hub soulagé', 'route toujours fragile', 'stockpile consommé', 'hub priorisé', 'effet réseau limité'].includes(preview.options[0].recoveryChoices[0].neighborEffects[0].label));
  assert.deepEqual(preview.options[0].recoveryChoices[0].timeline.map((step) => step.step), ['Effet immédiat', 'Prochain tour', 'Risque restant']);
  assert.match(preview.options[0].recoveryChoices[0].timeline[2].detail, /goulot|veille|Risque estimé/);
  assert.equal(preview.options[0].recoveryChoices[0].bottleneck.type, 'capacity');
  assert.equal(preview.options[0].recoveryChoices[0].bottleneck.label, 'capacité saturée');
  assert.equal(preview.options[0].recoveryChoices[0].timeline[2].bottleneck.label, 'capacité saturée');
  assert.ok(preview.options[0].recoveryChoices[0].downstreamShortages.length >= 1);
  assert.equal(preview.options[0].recoveryChoices[0].downstreamShortages[0].status, 'aggravée');
  assert.match(preview.options[0].recoveryChoices[0].downstreamShortages[0].detail, /Outils|pression aval|manquer/);
});

test('buildProvinceLogisticsChoicePreview exposes readable cost delay risk and impact labels', () => {
  const preview = buildProvinceLogisticsChoicePreview(province, buildEconomyView());
  const option = preview.options[0];

  assert.ok(option.cost.length > 0);
  assert.ok(option.delay.length > 0);
  assert.equal(typeof option.residualRisk, 'number');
  assert.ok(option.impact.includes('tools') || option.impact.includes('ressource'));
  assert.deepEqual(option.routes, ['Ember Line']);
  assert.ok(option.cause.length > 0);
  assert.deepEqual(option.recoveryChoices.map((choice) => choice.choiceId).sort(), ['economic-priority', 'repair', 'reroute', 'stockpile']);
  assert.ok(option.recoveryChoices.every((choice) => Array.isArray(choice.neighborEffects)));
  assert.ok(option.recoveryChoices.some((choice) => choice.neighborEffects.some((effect) => effect.target === 'Iron Plain')));
  assert.ok(option.recoveryChoices.every((choice) => choice.bottleneck && choice.bottleneck.detail.length > 0));
  assert.ok(option.recoveryChoices.every((choice) => Array.isArray(choice.downstreamShortages)));
  assert.ok(option.recoveryChoices.some((choice) => choice.downstreamShortages.some((shortage) => ['aggravée', 'déplacée', 'résolue', 'inconnue'].includes(shortage.status))));
});

test('buildProvinceLogisticsChoicePreview returns an empty state when no route is linked', () => {
  const preview = buildProvinceLogisticsChoicePreview({ provinceId: 'isolated' }, buildEconomyView());

  assert.equal(preview.recommendedOptionId, null);
  assert.deepEqual(preview.options, []);
  assert.equal(preview.status, 'stable');
  assert.equal(preview.timelineStatus, 'empty');
  assert.equal(preview.downstreamStatus, 'neutre');
  assert.match(preview.downstreamSummary, /Aucune pénurie aval/);
  assert.match(preview.timelineSummary, /timeline vide/);
  assert.match(preview.summary, /Logistique stable/);
});

test('buildProvinceLogisticsChoicePreview exposes stable local route causes', () => {
  const stableView = buildEconomyView();
  stableView.overlay.routes = [stableView.overlay.routes[0]];
  stableView.comparison.rows = stableView.comparison.rows.map((row) => ({ ...row, tensionLevel: 'low' }));

  const preview = buildProvinceLogisticsChoicePreview(province, stableView, {
    resourceLabelById: { grain: 'Grain' },
  });

  assert.equal(preview.status, 'stable');
  assert.equal(preview.timelineStatus, 'empty');
  assert.match(preview.summary, /Logistique stable/);
  assert.equal(preview.options[0].causeLabel, 'logistique stable');
  assert.match(preview.options[0].cause, /Safe Road/);
  assert.match(preview.options[0].cause, /River Gate/);
  assert.equal(preview.options[0].recoveryChoices[0].bottleneck.type, 'none');
  assert.match(preview.options[0].recoveryChoices[0].bottleneck.detail, /Aucun ralentisseur/);
  assert.equal(preview.options[0].recoveryChoices[0].downstreamShortages[0].status, 'résolue');
  assert.match(preview.options[0].recoveryChoices[0].downstreamShortages[0].detail, /aucune pénurie aval/i);
});

test('buildProvinceLogisticsChoicePreview validates options', () => {
  assert.throws(() => buildProvinceLogisticsChoicePreview(province, buildEconomyView(), null), /options must be an object/);
  assert.throws(() => buildProvinceLogisticsChoicePreview(province, buildEconomyView(), { resourceLabelById: [] }), /resourceLabelById must be an object/);
});
