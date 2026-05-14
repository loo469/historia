import test from 'node:test';
import assert from 'node:assert/strict';

import { City } from '../../../src/domain/economy/City.js';
import { TradeRoute } from '../../../src/domain/economy/TradeRoute.js';
import { buildEconomyMapOverlay } from '../../../src/ui/economy/buildEconomyMapOverlay.js';

test('buildEconomyMapOverlay builds stable city and route overlays', () => {
  const overlay = buildEconomyMapOverlay([
    new City({
      id: 'city-harbor',
      name: 'Harbor',
      regionId: 'coast',
      population: 120,
      prosperity: 74,
      stability: 61,
      stockByResource: {
        fish: 14,
        wood: 6,
      },
      tradeRouteIds: ['route-river'],
      capital: true,
    }),
    new City({
      id: 'city-mill',
      name: 'Mill',
      regionId: 'riverlands',
      population: 80,
      prosperity: 55,
      stability: 33,
      stockByResource: {
        grain: 10,
      },
      tradeRouteIds: ['route-river', 'route-coast'],
    }),
  ], [
    new TradeRoute({
      id: 'route-river',
      name: 'River Run',
      stopCityIds: ['city-harbor', 'city-mill'],
      distance: 5,
      capacityByResource: {
        fish: 4,
        grain: 7,
      },
      transportMode: 'river',
      riskLevel: 18,
      active: true,
    }),
    new TradeRoute({
      id: 'route-coast',
      name: 'Coast Caravan',
      stopCityIds: ['city-mill', 'city-harbor'],
      distance: 8,
      capacityByResource: {
        wood: 3,
      },
      transportMode: 'land',
      riskLevel: 41,
      active: false,
    }),
  ], {
    cityPositionById: {
      'city-harbor': { x: 10, y: 4 },
      'city-mill': { x: 14, y: 9 },
    },
  });

  assert.equal(overlay.title, 'Carte économie et logistique');
  assert.equal(overlay.summary, '2 villes, 2 routes logistiques');
  assert.deepEqual(overlay.cities, [
    {
      overlayId: 'city:city-harbor',
      type: 'city',
      cityId: 'city-harbor',
      cityName: 'Harbor',
      regionId: 'coast',
      population: 120,
      prosperity: 74,
      stability: 61,
      capital: true,
      label: 'Harbor ★',
      resources: {
        entries: [
          { resourceId: 'fish', quantity: 14 },
          { resourceId: 'wood', quantity: 6 },
        ],
        totalStock: 20,
        resourceCount: 2,
        primaryResourceId: 'fish',
        primaryResourceQuantity: 14,
      },
      tradeRouteIds: ['route-river'],
      marker: {
        icon: 'city',
        tone: 'positive',
        size: 2,
        position: { x: 10, y: 4 },
      },
    },
    {
      overlayId: 'city:city-mill',
      type: 'city',
      cityId: 'city-mill',
      cityName: 'Mill',
      regionId: 'riverlands',
      population: 80,
      prosperity: 55,
      stability: 33,
      capital: false,
      label: 'Mill',
      resources: {
        entries: [
          { resourceId: 'grain', quantity: 10 },
        ],
        totalStock: 10,
        resourceCount: 1,
        primaryResourceId: 'grain',
        primaryResourceQuantity: 10,
      },
      tradeRouteIds: ['route-coast', 'route-river'],
      marker: {
        icon: 'city',
        tone: 'warning',
        size: 1,
        position: { x: 14, y: 9 },
      },
    },
  ]);

  assert.deepEqual(overlay.routes, [
    {
      overlayId: 'route:route-coast',
      type: 'route',
      routeId: 'route-coast',
      routeName: 'Coast Caravan',
      cityIds: ['city-mill', 'city-harbor'],
      originCityId: 'city-mill',
      destinationCityId: 'city-harbor',
      active: false,
      transportMode: 'land',
      riskLevel: 41,
      totalCapacity: 3,
      resources: [
        { resourceId: 'wood', capacity: 3 },
      ],
      capacitySpendPreview: {
        routeId: 'route-coast',
        currentCapacity: 3,
        capacityMobilized: 0,
        capacityRemaining: 3,
        limitingResourceId: null,
        nextBottleneck: null,
        preparationOptions: [],
        bestValuePreparation: null,
        preparationSequence: [],
        opportunityCostComparison: null,
        state: 'no-spend',
        resources: [
          { resourceId: 'wood', currentCapacity: 3, capacityMobilized: 0, capacityRemaining: 3 },
        ],
      },
      label: 'Coast Caravan (land)',
      style: {
        stroke: 'slate',
        width: 1,
        pattern: 'dashed',
        opacity: 0.45,
      },
    },
    {
      overlayId: 'route:route-river',
      type: 'route',
      routeId: 'route-river',
      routeName: 'River Run',
      cityIds: ['city-harbor', 'city-mill'],
      originCityId: 'city-harbor',
      destinationCityId: 'city-mill',
      active: true,
      transportMode: 'river',
      riskLevel: 18,
      totalCapacity: 11,
      resources: [
        { resourceId: 'fish', capacity: 4 },
        { resourceId: 'grain', capacity: 7 },
      ],
      capacitySpendPreview: {
        routeId: 'route-river',
        currentCapacity: 11,
        capacityMobilized: 0,
        capacityRemaining: 11,
        limitingResourceId: null,
        nextBottleneck: null,
        preparationOptions: [],
        bestValuePreparation: null,
        preparationSequence: [],
        opportunityCostComparison: null,
        state: 'no-spend',
        resources: [
          { resourceId: 'fish', currentCapacity: 4, capacityMobilized: 0, capacityRemaining: 4 },
          { resourceId: 'grain', currentCapacity: 7, capacityMobilized: 0, capacityRemaining: 7 },
        ],
      },
      label: 'River Run (river)',
      style: {
        stroke: 'blue',
        width: 2,
        pattern: 'wave',
        opacity: 0.85,
      },
    },
  ]);

  assert.deepEqual(overlay.metrics, {
    cityCount: 2,
    capitalCount: 1,
    routeCount: 2,
    activeRouteCount: 1,
    totalStock: 30,
    totalRouteCapacity: 14,
  });
});

test('buildEconomyMapOverlay supports plain payloads and style overrides', () => {
  const overlay = buildEconomyMapOverlay([
    {
      id: 'city-delta',
      name: 'Delta',
      regionId: 'delta',
      population: 40,
      stockByResource: { salt: 5 },
    },
  ], [
    {
      id: 'route-sea',
      name: 'Sea Lane',
      stopCityIds: ['city-delta', 'city-port'],
      distance: 12,
      capacityByResource: { salt: 9 },
      transportMode: 'sea',
      riskLevel: 12,
    },
  ], {
    styleByTransportMode: {
      sea: { stroke: 'teal', width: 4, pattern: 'current', opacity: 0.7 },
    },
  });

  assert.deepEqual(overlay.routes[0].style, {
    stroke: 'teal',
    width: 4,
    pattern: 'current',
    opacity: 0.7,
  });
  assert.equal(overlay.cities[0].resources.primaryResourceId, 'salt');
  assert.deepEqual(overlay.routes[0].capacitySpendPreview, {
    routeId: 'route-sea',
    currentCapacity: 9,
    capacityMobilized: 0,
    capacityRemaining: 9,
    limitingResourceId: null,
    nextBottleneck: null,
    preparationOptions: [],
    bestValuePreparation: null,
    preparationSequence: [],
    opportunityCostComparison: null,
    state: 'no-spend',
    resources: [
      { resourceId: 'salt', currentCapacity: 9, capacityMobilized: 0, capacityRemaining: 9 },
    ],
  });
});

test('buildEconomyMapOverlay previews capacity spent by recommended unlocks', () => {
  const overlay = buildEconomyMapOverlay([], [
    {
      id: 'route-bread',
      name: 'Bread Road',
      stopCityIds: ['city-a', 'city-b'],
      distance: 3,
      capacityByResource: { grain: 5, tools: 2 },
      transportMode: 'land',
      riskLevel: 20,
    },
    {
      id: 'route-clear',
      name: 'Clear Road',
      stopCityIds: ['city-b', 'city-c'],
      distance: 4,
      capacityByResource: { wood: 4 },
      transportMode: 'land',
      riskLevel: 10,
    },
  ], {
    recommendedUnlockByRouteId: {
      'route-bread': {
        mobilizedByResource: { grain: 4, tools: 1 },
      },
    },
  });

  assert.deepEqual(overlay.routes.map((route) => route.routeId), ['route-bread', 'route-clear']);
  assert.deepEqual(overlay.routes[0].capacitySpendPreview, {
    routeId: 'route-bread',
    currentCapacity: 7,
    capacityMobilized: 5,
    capacityRemaining: 2,
    limitingResourceId: 'grain',
    nextBottleneck: {
      type: 'low-margin',
      resourceId: 'grain',
      marginRemaining: 1,
      preparationAction: 'reserve-capacity-buffer',
      preparationOptions: [
        {
          id: 'grain:reserve-buffer',
          action: 'reserve-capacity-buffer',
          label: 'Réserver 1 capacité tampon grain',
          effort: {
            type: 'capacity',
            amount: 1,
            unit: 'grain',
          },
          expectedEffect: {
            marginGain: 1,
            description: 'Transforme la marge critique en tampon exploitable.',
          },
          riskIfIgnored: 'La prochaine dépense peut épuiser la marge restante.',
          safety: 'safe',
        },
      ],
      bestValuePreparation: null,
    },
    preparationOptions: [
      {
        id: 'grain:reserve-buffer',
        action: 'reserve-capacity-buffer',
        label: 'Réserver 1 capacité tampon grain',
        effort: {
          type: 'capacity',
          amount: 1,
          unit: 'grain',
        },
        expectedEffect: {
          marginGain: 1,
          description: 'Transforme la marge critique en tampon exploitable.',
        },
        riskIfIgnored: 'La prochaine dépense peut épuiser la marge restante.',
        safety: 'safe',
      },
    ],
    bestValuePreparation: null,
    preparationSequence: [],
    opportunityCostComparison: null,
    state: 'remaining-margin',
    resources: [
      { resourceId: 'grain', currentCapacity: 5, capacityMobilized: 4, capacityRemaining: 1 },
      { resourceId: 'tools', currentCapacity: 2, capacityMobilized: 1, capacityRemaining: 1 },
    ],
  });
  assert.equal(overlay.routes[1].capacitySpendPreview.limitingResourceId, null);
  assert.equal(overlay.routes[1].capacitySpendPreview.nextBottleneck, null);
  assert.deepEqual(overlay.routes[1].capacitySpendPreview.preparationOptions, []);
  assert.equal(overlay.routes[1].capacitySpendPreview.state, 'no-spend');
});

test('buildEconomyMapOverlay compares deterministic bottleneck preparation options', () => {
  const overlay = buildEconomyMapOverlay([], [
    {
      id: 'route-risky',
      name: 'Risky Road',
      stopCityIds: ['city-a', 'city-b'],
      distance: 7,
      capacityByResource: { grain: 4, tools: 6 },
      transportMode: 'land',
      riskLevel: 52,
    },
  ], {
    recommendedUnlockByRouteId: {
      'route-risky': {
        mobilizedByResource: { grain: 4, tools: 1 },
      },
    },
  });

  assert.deepEqual(overlay.routes[0].capacitySpendPreview.preparationOptions.map((option) => option.id), [
    'grain:reserve-buffer',
    'grain:shift-to-tools',
    'grain:priority-window',
  ]);
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.preparationOptions.map((option) => option.effort.amount), [1, 2, 3]);
  assert.equal(overlay.routes[0].capacitySpendPreview.preparationOptions[0].expectedEffect.marginGain, 1);
  assert.equal(overlay.routes[0].capacitySpendPreview.preparationOptions[2].safety, 'risky');
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.bestValuePreparation, {
    id: 'best-value:grain:shift-to-tools',
    optionId: 'grain:shift-to-tools',
    action: 'shift-load-to-spare-resource',
    estimatedValueProtected: 20,
    marginGain: 2,
    effort: {
      type: 'coordination',
      amount: 2,
      unit: 'turns',
    },
    reason: 'Protège 20 valeur corridor avec +2 marge pour 2 turns.',
    cheaperAcceptable: {
      optionId: 'grain:reserve-buffer',
      condition: 'acceptable seulement si le coût immédiat prime sur la valeur protégée',
    },
    sequence: [
      {
        id: 'grain:shift-to-tools:now',
        timing: 'now',
        optionId: 'grain:shift-to-tools',
        action: 'shift-load-to-spare-resource',
        label: 'Reporter une partie du flux vers tools',
        reason: 'Sécurise 20 valeur corridor avant dépense.',
      },
      {
        id: 'grain:shift-to-tools:next',
        timing: 'next',
        optionId: 'grain:shift-to-tools',
        action: 'spend-capacity-after-preparation',
        label: 'Dépenser la capacité après marge confirmée',
        reason: 'Engage la dépense seulement après +2 marge préparée.',
      },
      {
        id: 'grain:reserve-buffer:defer',
        timing: 'defer',
        optionId: 'grain:reserve-buffer',
        action: 'keep-cheaper-fallback',
        label: 'Garder l’option moins chère en repli',
        reason: 'acceptable seulement si le coût immédiat prime sur la valeur protégée',
      },
    ],
    opportunityCostComparison: {
      id: 'opportunity-cost:grain:shift-to-tools:vs:grain:reserve-buffer',
      recommendedOptionId: 'grain:shift-to-tools',
      alternativeOptionId: 'grain:reserve-buffer',
      summary: 'Meilleure maintenant: +10 valeur protégée contre Libérer 1 capacité grain.',
      gained: {
        protectedValue: 10,
        margin: 1,
        reason: 'Reporter une partie du flux vers tools protège davantage le corridor avant la dépense.',
      },
      deferred: {
        effort: 1,
        unit: 'turns',
        reason: 'Libérer 1 capacité grain reste moins coûteuse si le coût immédiat devient prioritaire.',
      },
      aggravated: {
        risk: 'none',
        reason: 'Aucune aggravation nette détectée par rapport à l’alternative comparée.',
      },
      reconsiderWhen: 'Reconsidérer si le risque corridor augmente encore ou si la capacité opérationnelle manque.',
    },
  });
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.preparationSequence, [
    {
      id: 'grain:shift-to-tools:now',
      timing: 'now',
      optionId: 'grain:shift-to-tools',
      action: 'shift-load-to-spare-resource',
      label: 'Reporter une partie du flux vers tools',
      reason: 'Sécurise 20 valeur corridor avant dépense.',
    },
    {
      id: 'grain:shift-to-tools:next',
      timing: 'next',
      optionId: 'grain:shift-to-tools',
      action: 'spend-capacity-after-preparation',
      label: 'Dépenser la capacité après marge confirmée',
      reason: 'Engage la dépense seulement après +2 marge préparée.',
    },
    {
      id: 'grain:reserve-buffer:defer',
      timing: 'defer',
      optionId: 'grain:reserve-buffer',
      action: 'keep-cheaper-fallback',
      label: 'Garder l’option moins chère en repli',
      reason: 'acceptable seulement si le coût immédiat prime sur la valeur protégée',
    },
  ]);
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.opportunityCostComparison, {
    id: 'opportunity-cost:grain:shift-to-tools:vs:grain:reserve-buffer',
    recommendedOptionId: 'grain:shift-to-tools',
    alternativeOptionId: 'grain:reserve-buffer',
    summary: 'Meilleure maintenant: +10 valeur protégée contre Libérer 1 capacité grain.',
    gained: {
      protectedValue: 10,
      margin: 1,
      reason: 'Reporter une partie du flux vers tools protège davantage le corridor avant la dépense.',
    },
    deferred: {
      effort: 1,
      unit: 'turns',
      reason: 'Libérer 1 capacité grain reste moins coûteuse si le coût immédiat devient prioritaire.',
    },
    aggravated: {
      risk: 'none',
      reason: 'Aucune aggravation nette détectée par rapport à l’alternative comparée.',
    },
    reconsiderWhen: 'Reconsidérer si le risque corridor augmente encore ou si la capacité opérationnelle manque.',
  });
  assert.deepEqual(
    overlay.routes[0].capacitySpendPreview.nextBottleneck.bestValuePreparation,
    overlay.routes[0].capacitySpendPreview.bestValuePreparation,
  );
});

test('buildEconomyMapOverlay rejects invalid inputs', () => {
  assert.throws(() => buildEconomyMapOverlay(null, []), /EconomyMapOverlay cities must be an array/);
  assert.throws(() => buildEconomyMapOverlay([], null), /EconomyMapOverlay routes must be an array/);
  assert.throws(() => buildEconomyMapOverlay([null], []), /City instances or plain objects/);
  assert.throws(() => buildEconomyMapOverlay([], [null]), /TradeRoute instances or plain objects/);
  assert.throws(() => buildEconomyMapOverlay([], [], null), /EconomyMapOverlay options must be an object/);
  assert.throws(() => buildEconomyMapOverlay([], [], { cityPositionById: [] }), /cityPositionById must be an object/);
  assert.throws(() => buildEconomyMapOverlay([], [], { styleByTransportMode: [] }), /styleByTransportMode must be an object/);
});
