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
        preparationBreakEven: null,
        timingSensitivity: null,
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
        preparationBreakEven: null,
        timingSensitivity: null,
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
    preparationBreakEven: null,
    timingSensitivity: null,
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
    preparationBreakEven: null,
    timingSensitivity: null,
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
    preparationBreakEven: {
      id: 'break-even:grain:shift-to-tools',
      status: 'profitable-now',
      window: 'now',
      turnLimit: 0,
      netValue: 14,
      reason: 'Rentable maintenant: 10 valeur protégée et 5 marge couvrent 1 effort différé.',
    },
    timingSensitivity: {
      id: 'timing-sensitivity:grain:shift-to-tools',
      summary: 'stable: recommandation robuste aux hypothèses testées.',
      status: 'stable',
      flipWarning: {
        status: 'stable',
        summary: 'stable',
        cause: null,
        scenarioId: null,
        alternativeOptionId: null,
        reason: 'La marge de break-even reste positive dans 4 scénarios dérivés.',
        actionability: {
          threshold: null,
          consequence: 'continuer la séquence recommandée',
          advice: 'Action stable: continuer la séquence recommandée tant que la marge de break-even reste positive.',
        },
      },
      scenarios: [
        {
          id: 'delay-one-turn',
          assumption: 'retard d’un tour',
          cause: 'delay',
          netValue: 9,
          recommendationStable: true,
          outcome: 'stable',
          alternativeOptionId: null,
        },
        {
          id: 'lower-capacity',
          assumption: 'capacité moindre',
          cause: 'capacity',
          netValue: 13,
          recommendationStable: true,
          outcome: 'stable',
          alternativeOptionId: null,
        },
        {
          id: 'higher-effort-cost',
          assumption: 'coût légèrement plus élevé',
          cause: 'cost',
          netValue: 13,
          recommendationStable: true,
          outcome: 'stable',
          alternativeOptionId: null,
        },
        {
          id: 'bottleneck-saturation',
          assumption: 'saturation du goulot',
          cause: 'saturation',
          netValue: 8,
          recommendationStable: true,
          outcome: 'stable',
          alternativeOptionId: null,
        },
      ],
      reason: 'La marge de break-even reste positive dans 4 scénarios dérivés.',
      actionableAdvice: 'Action stable: continuer la séquence recommandée tant que la marge de break-even reste positive.',
      delayOpportunityCost: {
        id: 'delay-cost:grain:shift-to-tools',
        recommendedOptionId: 'grain:shift-to-tools',
        cost: 5,
        delayedNetValue: 9,
        summary: 'Attendre coûte 5 valeur mais garde 9 marge nette.',
        dangerThreshold: 'danger si la marge nette tombe à 0; marge actuelle après délai: 9',
        practicalConsequence: 'suivre la séquence recommandée avant de dépenser davantage',
        reason: 'Le délai retire 5 marge au bénéfice de grain:shift-to-tools, dérivé de la comparaison actuelle.',
        salvageAction: null,
      },
      postSalvageDecisionAlert: {
        status: 'no-additional-decision',
        recommendation: 'continue',
        mainConstraint: null,
        summary: 'Aucune décision abandon/inversion requise: la séquence reste rentable après délai.',
      },
      postSalvageDecisionComparison: {
        status: 'neutral',
        confirmNow: 'continuer sans coût d’attente notable',
        wait: 'temporiser reste acceptable tant que la marge nette reste positive',
        recommendation: 'continue',
        dominantConstraint: null,
        waitTurnsDurableLoss: false,
        summary: 'Neutre: aucun coût d’attente notable tant que la marge reste positive.',
      },
      postSalvageRobustness: {
        status: 'robust',
        dominantConstraint: 'saturation',
        nextGesture: 'surveiller',
        needsCapacityProtection: false,
        summary: 'Robuste: surveiller saturation, la marge reste positive après salvage.',
      },
      postSalvageStabilizer: {
        status: 'none-required',
        stabilizer: null,
        nextGesture: 'surveiller',
        benefit: 'Aucun stabilisateur requis: le corridor reste robuste après salvage.',
        summary: 'Stabilisateur neutre: surveiller sans action supplémentaire.',
      },
      postStabilizerReliability: {
        status: 'reliable-route',
        remainingConstraint: null,
        nextGesture: 'promouvoir',
        summary: 'Route fiable: promouvoir le corridor après stabilisateur neutre.',
      },
      monitoredCorridorPromotionRisk: {
        status: 'safe-promotion',
        remainingConstraint: null,
        nextGesture: 'promouvoir',
        summary: 'Promotion sûre: le corridor peut devenir route principale.',
      },
      monitoredCorridorRollbackGuard: {
        status: 'rollback-unneeded',
        constraint: null,
        nextGesture: 'promouvoir sans garde',
        summary: 'Rollback inutile: la promotion peut avancer sans garde dédiée.',
      },
      rollbackGuardLoadMargin: {
        status: 'peak-absorbable',
        constraint: null,
        nextGesture: 'absorber',
        summary: 'Pic absorbable: la route principale garde assez de marge après garde.',
      },
      guardedCorridorLoadRelief: {
        status: 'no-relief-needed',
        relief: null,
        protectedMargin: 'marge actuelle suffisante',
        nextGesture: 'absorber',
        summary: 'Aucun allègement utile: la marge absorbe le prochain pic visible.',
      },
      guardedCorridorNormalizationCheckpoint: {
        status: 'corridor-normalized',
        remainingConstraint: 'aucune contrainte visible',
        action: 'normaliser sans promotion automatique',
        summary: 'Corridor normalisé: garder la lecture active sans promotion automatique.',
      },
      postNormalizationSurplusUse: {
        status: 'invest-next-corridor',
        priority: 'investir dans le prochain corridor utile',
        guidingConstraint: 'charge voisine',
        microAction: 'attendre stabilité confirmée puis investir',
        summary: 'Surplus disponible: viser le prochain corridor utile après stabilité confirmée.',
      },
      surplusStabilizationDecision: {
        status: 'fund-expansion',
        recommendation: 'financer l’expansion',
        corridorState: 'stable',
        decidingConstraint: 'charge voisine',
        summary: 'Surplus libre: financer l’expansion après stabilité du corridor.',
      },
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
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.preparationBreakEven, {
    id: 'break-even:grain:shift-to-tools',
    status: 'profitable-now',
    window: 'now',
    turnLimit: 0,
    netValue: 14,
    reason: 'Rentable maintenant: 10 valeur protégée et 5 marge couvrent 1 effort différé.',
  });
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity, {
    id: 'timing-sensitivity:grain:shift-to-tools',
    summary: 'stable: recommandation robuste aux hypothèses testées.',
    status: 'stable',
    flipWarning: {
      status: 'stable',
      summary: 'stable',
      cause: null,
      scenarioId: null,
      alternativeOptionId: null,
      reason: 'La marge de break-even reste positive dans 4 scénarios dérivés.',
      actionability: {
        threshold: null,
        consequence: 'continuer la séquence recommandée',
        advice: 'Action stable: continuer la séquence recommandée tant que la marge de break-even reste positive.',
      },
    },
    scenarios: [
      {
        id: 'delay-one-turn',
        assumption: 'retard d’un tour',
        cause: 'delay',
        netValue: 9,
        recommendationStable: true,
        outcome: 'stable',
        alternativeOptionId: null,
      },
      {
        id: 'lower-capacity',
        assumption: 'capacité moindre',
        cause: 'capacity',
        netValue: 13,
        recommendationStable: true,
        outcome: 'stable',
        alternativeOptionId: null,
      },
      {
        id: 'higher-effort-cost',
        assumption: 'coût légèrement plus élevé',
        cause: 'cost',
        netValue: 13,
        recommendationStable: true,
        outcome: 'stable',
        alternativeOptionId: null,
      },
      {
        id: 'bottleneck-saturation',
        assumption: 'saturation du goulot',
        cause: 'saturation',
        netValue: 8,
        recommendationStable: true,
        outcome: 'stable',
        alternativeOptionId: null,
      },
    ],
    reason: 'La marge de break-even reste positive dans 4 scénarios dérivés.',
    actionableAdvice: 'Action stable: continuer la séquence recommandée tant que la marge de break-even reste positive.',
    delayOpportunityCost: {
      id: 'delay-cost:grain:shift-to-tools',
      recommendedOptionId: 'grain:shift-to-tools',
      cost: 5,
      delayedNetValue: 9,
      summary: 'Attendre coûte 5 valeur mais garde 9 marge nette.',
      dangerThreshold: 'danger si la marge nette tombe à 0; marge actuelle après délai: 9',
      practicalConsequence: 'suivre la séquence recommandée avant de dépenser davantage',
      reason: 'Le délai retire 5 marge au bénéfice de grain:shift-to-tools, dérivé de la comparaison actuelle.',
      salvageAction: null,
    },
    postSalvageDecisionAlert: {
      status: 'no-additional-decision',
      recommendation: 'continue',
      mainConstraint: null,
      summary: 'Aucune décision abandon/inversion requise: la séquence reste rentable après délai.',
    },
    postSalvageDecisionComparison: {
      status: 'neutral',
      confirmNow: 'continuer sans coût d’attente notable',
      wait: 'temporiser reste acceptable tant que la marge nette reste positive',
      recommendation: 'continue',
      dominantConstraint: null,
      waitTurnsDurableLoss: false,
      summary: 'Neutre: aucun coût d’attente notable tant que la marge reste positive.',
    },
    postSalvageRobustness: {
      status: 'robust',
      dominantConstraint: 'saturation',
      nextGesture: 'surveiller',
      needsCapacityProtection: false,
      summary: 'Robuste: surveiller saturation, la marge reste positive après salvage.',
    },
    postSalvageStabilizer: {
      status: 'none-required',
      stabilizer: null,
      nextGesture: 'surveiller',
      benefit: 'Aucun stabilisateur requis: le corridor reste robuste après salvage.',
      summary: 'Stabilisateur neutre: surveiller sans action supplémentaire.',
    },
    postStabilizerReliability: {
      status: 'reliable-route',
      remainingConstraint: null,
      nextGesture: 'promouvoir',
      summary: 'Route fiable: promouvoir le corridor après stabilisateur neutre.',
    },
    monitoredCorridorPromotionRisk: {
      status: 'safe-promotion',
      remainingConstraint: null,
      nextGesture: 'promouvoir',
      summary: 'Promotion sûre: le corridor peut devenir route principale.',
    },
    monitoredCorridorRollbackGuard: {
      status: 'rollback-unneeded',
      constraint: null,
      nextGesture: 'promouvoir sans garde',
      summary: 'Rollback inutile: la promotion peut avancer sans garde dédiée.',
    },
    rollbackGuardLoadMargin: {
      status: 'peak-absorbable',
      constraint: null,
      nextGesture: 'absorber',
      summary: 'Pic absorbable: la route principale garde assez de marge après garde.',
    },
    guardedCorridorLoadRelief: {
      status: 'no-relief-needed',
      relief: null,
      protectedMargin: 'marge actuelle suffisante',
      nextGesture: 'absorber',
      summary: 'Aucun allègement utile: la marge absorbe le prochain pic visible.',
    },
    guardedCorridorNormalizationCheckpoint: {
      status: 'corridor-normalized',
      remainingConstraint: 'aucune contrainte visible',
      action: 'normaliser sans promotion automatique',
      summary: 'Corridor normalisé: garder la lecture active sans promotion automatique.',
    },
    postNormalizationSurplusUse: {
      status: 'invest-next-corridor',
      priority: 'investir dans le prochain corridor utile',
      guidingConstraint: 'charge voisine',
      microAction: 'attendre stabilité confirmée puis investir',
      summary: 'Surplus disponible: viser le prochain corridor utile après stabilité confirmée.',
    },
    surplusStabilizationDecision: {
      status: 'fund-expansion',
      recommendation: 'financer l’expansion',
      corridorState: 'stable',
      decidingConstraint: 'charge voisine',
      summary: 'Surplus libre: financer l’expansion après stabilité du corridor.',
    },
  });
  assert.deepEqual(
    overlay.routes[0].capacitySpendPreview.nextBottleneck.bestValuePreparation,
    overlay.routes[0].capacitySpendPreview.bestValuePreparation,
  );
});


test('buildEconomyMapOverlay warns when timing sensitivity flips to the fallback sequence', () => {
  const overlay = buildEconomyMapOverlay([], [
    {
      id: 'route-saturated',
      name: 'Saturated Road',
      stopCityIds: ['city-a', 'city-b'],
      distance: 2,
      capacityByResource: { grain: 2 },
      transportMode: 'land',
      riskLevel: 100,
    },
  ], {
    recommendedUnlockByRouteId: {
      'route-saturated': {
        mobilizedByResource: { grain: 2 },
      },
    },
  });

  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.flipWarning, {
    status: 'switch',
    summary: 'bascule vers grain:reserve-buffer',
    cause: 'delay',
    scenarioId: 'delay-one-turn',
    alternativeOptionId: 'grain:reserve-buffer',
    reason: 'La recommandation bascule vers grain:reserve-buffer si retard d’un tour.',
    actionability: {
      threshold: 'dès 1 tour de retard',
      consequence: 'inverser la priorité avant d’attendre',
      advice: 'inverser la priorité avant d’attendre: basculer vers grain:reserve-buffer dès 1 tour de retard.',
    },
  });
  assert.equal(
    overlay.routes[0].capacitySpendPreview.timingSensitivity.actionableAdvice,
    'inverser la priorité avant d’attendre: basculer vers grain:reserve-buffer dès 1 tour de retard.',
  );
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.delayOpportunityCost, {
    id: 'delay-cost:grain:priority-window',
    recommendedOptionId: 'grain:priority-window',
    cost: 4,
    delayedNetValue: -4,
    summary: 'Attendre coûte 4 valeur et rend le délai dangereux.',
    dangerThreshold: 'dès 1 tour de retard',
    practicalConsequence: 'inverser la priorité avant d’attendre',
    reason: 'Le délai retire 4 marge au bénéfice de grain:priority-window, dérivé de la comparaison actuelle.',
    salvageAction: {
      id: 'salvage:grain:priority-window:delay-one-turn',
      trigger: 'delay-one-turn',
      action: 'invert-priority-to-alternative',
      label: 'Basculer vers grain:reserve-buffer',
      alternativeOptionId: 'grain:reserve-buffer',
      remainingCost: 4,
      summary: 'Basculer vers grain:reserve-buffer: coût restant 4 après délai dangereux.',
      restorationSummary: {
        status: 'still-unprofitable',
        mainConstraint: 'alternative-plus-sure',
        nextDecision: 'switch-to-alternative',
        summary: 'Salvage insuffisant: basculer vers grain:reserve-buffer reste plus sûr.',
      },
    },
  });
  assert.equal(
    overlay.routes[0].capacitySpendPreview.timingSensitivity.summary,
    'bascule vers grain:reserve-buffer si retard d’un tour.',
  );
  assert.equal(overlay.routes[0].capacitySpendPreview.timingSensitivity.status, 'fragile');
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.postSalvageDecisionAlert, {
    status: 'decision-required',
    recommendation: 'abandon-sequence',
    mainConstraint: 'alternative-plus-sure',
    summary: 'Abandonner la séquence: alternative-plus-sure garde le coût restant trop élevé.',
  });
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.postSalvageDecisionComparison, {
    status: 'wait-dangerous',
    confirmNow: 'abandonner ou inverser immédiatement pour éviter une perte durable',
    wait: 'attendre ajoute 8 coût et fige la perte durable',
    recommendation: 'abandon-sequence',
    dominantConstraint: 'alternative-plus-sure',
    waitCost: 8,
    waitTurnsDurableLoss: true,
    summary: 'abandonner ou inverser immédiatement pour éviter une perte durable: temporiser transforme la décision en perte durable.',
  });
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.postSalvageRobustness, {
    status: 'vulnerable',
    dominantConstraint: 'alternative-plus-sure',
    nextGesture: 'basculer vers alternative',
    needsCapacityProtection: false,
    summary: 'Vulnérable: alternative-plus-sure menace une perte durable; basculer vers alternative.',
  });
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.postSalvageStabilizer, {
    status: 'urgent-stabilization',
    stabilizer: 'alternative de secours',
    nextGesture: 'basculer vers alternative',
    benefit: 'transforme l’inversion possible en flux fiable.',
    summary: 'Stabilisation urgente: alternative de secours pour éviter une perte durable.',
  });
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.postStabilizerReliability, {
    status: 'reserve-corridor',
    remainingConstraint: 'alternative',
    nextGesture: 'garder comme secours',
    summary: 'Corridor à garder en secours: alternative reste trop fragile après stabilisateur.',
  });
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.monitoredCorridorPromotionRisk, {
    status: 'premature-promotion',
    remainingConstraint: 'alternative',
    nextGesture: 'garder en secours',
    summary: 'Promotion prématurée: alternative expose encore le corridor principal.',
  });
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.monitoredCorridorRollbackGuard, {
    status: 'rollback-ready-required',
    constraint: 'alternative',
    nextGesture: 'revenir en secours',
    summary: 'Rollback prêt requis: alternative impose une alternative avant promotion.',
  });
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.rollbackGuardLoadMargin, {
    status: 'overload-likely',
    constraint: 'alternative',
    nextGesture: 'revenir en secours',
    summary: 'Surcharge probable: alternative demande une alternative active.',
  });
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.guardedCorridorLoadRelief, {
    status: 'urgent-relief',
    relief: 'activer alternative de secours',
    protectedMargin: 'alternative',
    nextGesture: 'revenir en secours',
    summary: 'Allègement urgent: alternative surcharge la route, garder une alternative active.',
  });
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.guardedCorridorNormalizationCheckpoint, {
    status: 'guard-still-required',
    remainingConstraint: 'risque de rollback',
    action: 'stabiliser avant de normaliser',
    summary: 'Garde toujours nécessaire: stabiliser risque de rollback avant normalisation.',
  });
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.postNormalizationSurplusUse, {
    status: 'keep-surplus-reserve',
    priority: 'garder le surplus en réserve',
    guidingConstraint: 'risque de rechute',
    microAction: 'conserver jusqu’à stabilité visible',
    summary: 'Surplus en réserve: attendre que le risque de rechute baisse avant dépense.',
  });
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.surplusStabilizationDecision, {
    status: 'stabilize-routes',
    recommendation: 'stabiliser les routes',
    corridorState: 'chargé',
    decidingConstraint: 'risque de rechute',
    summary: 'Surplus à retenir: stabiliser le corridor chargé avant expansion.',
  });
  assert.deepEqual(
    overlay.routes[0].capacitySpendPreview.timingSensitivity.scenarios.map((scenario) => [
      scenario.id,
      scenario.cause,
      scenario.outcome,
      scenario.alternativeOptionId,
    ]),
    [
      ['delay-one-turn', 'delay', 'switch-to-alternative', 'grain:reserve-buffer'],
      ['lower-capacity', 'capacity', 'switch-to-alternative', 'grain:reserve-buffer'],
      ['higher-effort-cost', 'cost', 'switch-to-alternative', 'grain:reserve-buffer'],
      ['bottleneck-saturation', 'saturation', 'switch-to-alternative', 'grain:reserve-buffer'],
    ],
  );
});

test('buildEconomyMapOverlay flags partially restored salvage as durable inversion decision', () => {
  const overlay = buildEconomyMapOverlay([], [
    {
      id: 'route-partial',
      name: 'Partial Road',
      stopCityIds: ['city-a', 'city-b'],
      distance: 2,
      capacityByResource: { grain: 3 },
      transportMode: 'land',
      riskLevel: 100,
    },
  ], {
    recommendedUnlockByRouteId: {
      'route-partial': {
        mobilizedByResource: { grain: 3 },
      },
    },
  });

  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.delayOpportunityCost.salvageAction.restorationSummary, {
    status: 'partially-stabilized',
    mainConstraint: 'alternative-plus-sure',
    nextDecision: 'switch-to-alternative',
    summary: 'Salvage stabilise partiellement: Basculer vers grain:reserve-buffer; coût restant 2.',
  });
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.postSalvageDecisionAlert, {
    status: 'decision-required',
    recommendation: 'invert-durably',
    mainConstraint: 'alternative-plus-sure',
    summary: 'Inverser durablement: grain:reserve-buffer reste plus sûr malgré le salvage.',
  });
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.postSalvageDecisionComparison, {
    status: 'wait-dangerous',
    confirmNow: 'confirmer l’inversion vers grain:reserve-buffer',
    wait: 'attendre ajoute 5 coût et rend l’alternative plus sûre durablement',
    recommendation: 'invert-durably',
    dominantConstraint: 'alternative-plus-sure',
    waitCost: 5,
    waitTurnsDurableLoss: true,
    summary: 'confirmer l’inversion vers grain:reserve-buffer: temporiser transforme la décision en perte durable.',
  });
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.postSalvageRobustness, {
    status: 'fragile-usable',
    dominantConstraint: 'alternative-plus-sure',
    nextGesture: 'basculer vers alternative',
    needsCapacityProtection: false,
    summary: 'Fragile mais utilisable: alternative-plus-sure reste serré; basculer vers alternative.',
  });
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.postSalvageStabilizer, {
    status: 'stabilizer-recommended',
    stabilizer: 'alternative de secours',
    nextGesture: 'basculer vers alternative',
    benefit: 'transforme l’inversion possible en flux fiable.',
    summary: 'Stabilisateur recommandé: alternative de secours pour fiabiliser le corridor fragile.',
  });
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.postStabilizerReliability, {
    status: 'monitored-route',
    remainingConstraint: 'alternative',
    nextGesture: 'surveiller un tour',
    summary: 'Route utilisable sous surveillance: contrôler alternative après stabilisateur.',
  });
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.monitoredCorridorPromotionRisk, {
    status: 'limited-promotion',
    remainingConstraint: 'alternative',
    nextGesture: 'plafonner le flux',
    summary: 'Promotion sous limite: plafonner le flux tant que alternative reste surveillé.',
  });
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.monitoredCorridorRollbackGuard, {
    status: 'guard-recommended',
    constraint: 'alternative',
    nextGesture: 'plafonner avec garde',
    summary: 'Garde conseillée: plafonner le flux et surveiller alternative.',
  });
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.rollbackGuardLoadMargin, {
    status: 'peak-capped',
    constraint: 'alternative',
    nextGesture: 'plafonner le flux',
    summary: 'Pic à plafonner: alternative exige de garder la marge sous contrôle.',
  });
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.guardedCorridorLoadRelief, {
    status: 'relief-recommended',
    relief: 'déporter vers alternative de secours',
    protectedMargin: 'alternative',
    nextGesture: 'plafonner le flux',
    summary: 'Allègement utile: déporter vers alternative de secours protège la marge sans promettre une sécurité totale.',
  });
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.guardedCorridorNormalizationCheckpoint, {
    status: 'monitored-normalization-possible',
    remainingConstraint: 'alternative fragile',
    action: 'appliquer l’allègement puis surveiller un tour',
    summary: 'Normalisation surveillée possible: vérifier alternative fragile après allègement.',
  });
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.postNormalizationSurplusUse, {
    status: 'reinforce-fragile-alternative',
    priority: 'renforcer une alternative fragile',
    guidingConstraint: 'alternative critique',
    microAction: 'renforcer avant de consommer le surplus',
    summary: 'Surplus prudent: renforcer l’alternative critique avant nouvel investissement.',
  });
  assert.deepEqual(overlay.routes[0].capacitySpendPreview.timingSensitivity.surplusStabilizationDecision, {
    status: 'stabilize-routes',
    recommendation: 'stabiliser les routes',
    corridorState: 'fragile',
    decidingConstraint: 'alternative critique',
    summary: 'Surplus à stabiliser: sécuriser les routes avant expansion.',
  });
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

test('buildEconomyMapOverlay exposes city resource and logistics map layers', () => {
  const overlay = buildEconomyMapOverlay([
    {
      id: 'city-harbor',
      name: 'Harbor',
      regionId: 'coast',
      population: 100,
      prosperity: 72,
      stability: 65,
      stockByResource: { fish: 24, timber: 3 },
      tradeRouteIds: ['route-coast'],
      capital: true,
    },
    {
      id: 'city-mill',
      name: 'Mill',
      regionId: 'riverlands',
      population: 50,
      prosperity: 44,
      stability: 31,
      stockByResource: { fish: 0, grain: 8 },
      tradeRouteIds: ['route-coast'],
    },
  ], [
    {
      id: 'route-coast',
      name: 'Coast Road',
      stopCityIds: ['city-harbor', 'city-mill'],
      distance: 6,
      capacityByResource: { grain: 4, timber: 2 },
      transportMode: 'land',
      riskLevel: 47,
    },
  ], {
    cityPositionById: {
      'city-harbor': { x: 2, y: 3 },
      'city-mill': { x: 7, y: 5 },
    },
    recommendedUnlockByRouteId: {
      'route-coast': {
        mobilizedByResource: { grain: 4, timber: 1 },
      },
    },
  });

  assert.deepEqual(Object.keys(overlay.layers), ['cities', 'resources', 'logistics']);
  assert.deepEqual(overlay.layers.cities.features.map((feature) => ({
    featureId: feature.featureId,
    label: feature.label,
    position: feature.position,
    capital: feature.capital,
  })), [
    {
      featureId: 'city:city-harbor',
      label: 'Harbor ★',
      position: { x: 2, y: 3 },
      capital: true,
    },
    {
      featureId: 'city:city-mill',
      label: 'Mill',
      position: { x: 7, y: 5 },
      capital: false,
    },
  ]);
  assert.deepEqual(overlay.layers.resources.totalsByResource, [
    { resourceId: 'fish', totalQuantity: 24, cityCount: 2 },
    { resourceId: 'grain', totalQuantity: 8, cityCount: 1 },
    { resourceId: 'timber', totalQuantity: 3, cityCount: 1 },
  ]);
  assert.deepEqual(overlay.layers.resources.features.map((feature) => ({
    featureId: feature.featureId,
    intensity: feature.intensity,
    label: feature.label,
  })), [
    { featureId: 'resource:fish:city-harbor', intensity: 'abundant', label: 'fish: 24' },
    { featureId: 'resource:fish:city-mill', intensity: 'empty', label: 'fish: 0' },
    { featureId: 'resource:grain:city-mill', intensity: 'available', label: 'grain: 8' },
    { featureId: 'resource:timber:city-harbor', intensity: 'available', label: 'timber: 3' },
  ]);
  assert.deepEqual(overlay.layers.logistics.features, [
    {
      featureId: 'route:route-coast',
      routeId: 'route-coast',
      label: 'Coast Road (land)',
      cityIds: ['city-harbor', 'city-mill'],
      active: true,
      transportMode: 'land',
      riskLevel: 47,
      totalCapacity: 6,
      capacityRemaining: 1,
      state: 'remaining-margin',
      bottleneckResourceId: 'grain',
      style: {
        stroke: 'ochre',
        width: 2,
        pattern: 'solid',
        opacity: 0.85,
      },
    },
  ]);
});
