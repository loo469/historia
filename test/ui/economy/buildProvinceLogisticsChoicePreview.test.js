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
  assert.ok(preview.priorityActions.length >= 2);
  assert.equal(preview.priorityActions[0].recommended, true);
  assert.equal(preview.recoveryLeverRanking.empty, false);
  assert.ok(preview.recoveryLeverRanking.levers.length >= 2);
  assert.equal(preview.recoveryLeverRanking.levers[0].recommended, true);
  assert.match(preview.recoveryLeverRanking.summary, /coût|risque évité/i);
  assert.match(preview.recoveryLeverRanking.levers[0].capacityCostDetail, /capacité requise|délai|Ember Line|River Gate/);
  assert.match(preview.recoveryLeverRanking.levers[0].capacityComparison, /demande|second levier|ratio capacité\/risque/);
  assert.match(preview.recoveryLeverRanking.levers[0].debtWatch, /Dette|résiduelle/);
  assert.ok(preview.recoveryLeverRanking.levers.every((lever) => lever.primaryCost.length > 0 && lever.capacityCostDetail.length > 0 && lever.avoidedRisk.length > 0 && lever.mutualBlocker.length > 0));
  assert.ok(preview.selectedActionPreview.badges.length <= 3);
  assert.match(preview.prioritySummary, /recommandée/);
  assert.ok(preview.priorityActions.some((action) => /rapide mais limitée|plus lente mais structurante|équilibrée/.test(action.tradeoff)));
  assert.ok(preview.priorityActions.every((action) => action.impact.length > 0 && action.reason.length > 0 && action.delay.length > 0));
  assert.match(preview.selectedActionPreview.summary, /pénurie|route|province|délai/);
  assert.ok(['critical', 'improved', 'limited'].includes(preview.selectedActionPreview.status));
  assert.equal(preview.selectedActionPreview.badges.length, 3);
  assert.match(`${preview.selectedActionPreview.currentState} ${preview.selectedActionPreview.projectedState}`, /Actuel|Projeté/);
  assert.equal(preview.secondaryBottleneckPreview.state, 'blocked');
  assert.equal(preview.secondaryBottleneckPreview.status, 'bloquant');
  assert.match(preview.secondaryBottleneckPreview.summary, /prochain goulot|Ember Line|Hill Spur|Iron Plain|Hill Hub/);
  assert.match(preview.secondaryBottleneckPreview.detail, /Outils|pression aval|manquer|retarder|reste à surveiller/);
  assert.match(preview.secondaryBottleneckPreview.nextRecommendation.action, /Traiter ensuite/);
  assert.match(preview.secondaryBottleneckPreview.nextRecommendation.target, /Iron Plain|Hill Hub|Outils/);
  assert.match(preview.secondaryBottleneckPreview.nextRecommendation.reason, /évite|empêche|clarifie/);
  assert.equal(preview.primarySecondaryTradeoff.secondaryBetter, true);
  assert.equal(preview.primarySecondaryTradeoff.state, 'secondary');
  assert.match(preview.primarySecondaryTradeoff.summary, /Principal: .*Secondaire:/);
  assert.match(preview.primarySecondaryTradeoff.opportunityCost, /Coût d’opportunité|consomme|bloquer/);
  assert.ok(['fragile', 'relapse-risk', 'stable'].includes(preview.secondaryChoiceRelapsePreview.state));
  assert.equal(preview.secondaryChoiceRelapsePreview.safeSecondary, false);
  assert.match(preview.secondaryChoiceRelapsePreview.summary, /Choix secondaire|rechute|fragile|stable/);
  assert.match(preview.secondaryChoiceRelapsePreview.factor, /capacité|dette logistique|route critique|momentum|marge/);
  assert.match(preview.secondaryChoiceRelapsePreview.guardAction, /Action minimale|Ember Line/);
  assert.ok(['warning', 'critical'].includes(preview.localRecoveryCapacityConflictWarning.state));
  assert.match(preview.localRecoveryCapacityConflictWarning.summary, /Attention: ce choix retarde aussi/);
  assert.match(preview.localRecoveryCapacityConflictWarning.detail, /consomme|partage|Outils/);
  assert.ok(['single', 'chain'].includes(preview.adjacentRouteSpilloverRisk.state));
  assert.match(preview.adjacentRouteSpilloverRisk.summary, /route voisine critique|secondaire|exposée/);
  assert.match(preview.adjacentRouteSpilloverRisk.criticalRoute.route, /Ember Line|Hill Spur|Safe Road/);
  assert.match(preview.adjacentRouteSpilloverRisk.dependencyTrace, /→/);
  assert.match(preview.adjacentRouteSpilloverRisk.dependencyTrace, /capacité saturée|stock critique|risque élevé|Ember Line|Hill Spur|Iron Plain|Hill Hub/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardAction.fallback, false);
  assert.match(preview.adjacentRouteSpilloverRisk.guardAction.label, /Sécuriser|Garder/);
  assert.match(preview.adjacentRouteSpilloverRisk.guardAction.reason, /pression déplacée|capacité consommée/);
  assert.ok(['compare', 'single'].includes(preview.adjacentRouteSpilloverRisk.guardComparison.state));
  assert.match(preview.adjacentRouteSpilloverRisk.guardComparison.summary, /moins disruptif|Une seule garde/);
  assert.ok(preview.adjacentRouteSpilloverRisk.guardComparison.candidates.length >= 1);
  assert.match(preview.adjacentRouteSpilloverRisk.guardComparison.candidates[0].tradeoff, /protégée vs .*capacité/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardSequencing.state, 'competing');
  assert.match(preview.adjacentRouteSpilloverRisk.guardSequencing.phrase, /choisir la garde au lieu de la récupération/);
  assert.match(preview.adjacentRouteSpilloverRisk.guardSequencing.reason, /partage|capacité/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.state, 'competing');
  assert.equal(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.stopChain, true);
  assert.match(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.summary, /Protège .*retarde/);
  assert.match(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.stopReason, /Ne pas prolonger|remplace déjà/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.state, 'fallback');
  assert.equal(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.action, 'use-fallback');
  assert.match(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.summary, /Différer|fallback/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.fallbackJustification.state, 'available');
  assert.match(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.fallbackJustification.protectedMargin, /Ember Line|Hill Spur|marge utile/);
  assert.match(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.fallbackJustification.limitingResource, /Outils|ressource limitante/);
  assert.match(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.fallbackJustification.residualExposure, /reste exposée|reste exposé/);
  assert.match(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.fallbackJustification.ignoredRisk, /Ignorer/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.fallbackJustification.nextChoiceTrigger.state, 'resource');
  assert.match(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.fallbackJustification.nextChoiceTrigger.trigger, /Outils|ressource|devient le risque critique/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.fallbackJustification.primaryReturnSignal.state, 'stay-fallback');
  assert.match(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.fallbackJustification.primaryReturnSignal.summary, /Retour vers .* possible quand Outils/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.fallbackJustification.primaryReturnSignal.residualConstraint.state, 'resource');
  assert.match(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.fallbackJustification.primaryReturnSignal.residualConstraint.summary, /Route primaire reprise, contrainte restante: Outils/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.fallbackJustification.primaryReturnSignal.routeSlack.state, 'tight');
  assert.match(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.fallbackJustification.primaryReturnSignal.routeSlack.summary, /Route reprise mais serrée: Outils/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.fallbackJustification.primaryReturnSignal.routeSlack.slackConsumerHint.primaryConsumer, 'Outils');
  assert.match(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.fallbackJustification.primaryReturnSignal.routeSlack.slackConsumerHint.summary, /Outils consomme d’abord le slack/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.fallbackJustification.primaryReturnSignal.routeSlack.slackConsumerHint.nextBlocker.label, 'Premier bloqueur: Outils');
  assert.match(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.fallbackJustification.primaryReturnSignal.routeSlack.slackConsumerHint.nextBlocker.summary, /Outils deviendrait bloquant en premier/);
  assert.match(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.fallbackJustification.primaryReturnSignal.routeSlack.slackConsumerHint.afterFirstBlockerHandled.summary, /Après Outils, slack restant surveillé/);
  assert.ok(Array.isArray(preview.adjacentRouteSpilloverRisk.secondaryRoutes));
  assert.equal(preview.primaryLogisticsAction.actionId, preview.priorityActions[0].actionId);
  assert.match(preview.primaryLogisticsAction.label, /Ember Line|Hill Spur|Safe Road/);
  assert.match(preview.primaryLogisticsAction.downstreamImpact, /pénurie|route|province|délai/);
  assert.match(preview.primaryLogisticsAction.bottleneckRelieved, /capacité|stock|route|goulot|dégâts/);
  assert.match(preview.primaryLogisticsAction.downstreamEffect, /Projeté/);
  assert.ok(['ready', 'risky'].includes(preview.primaryLogisticsAction.status));
  assert.equal(preview.primaryLogisticsAction.disabled, false);
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
  assert.ok(preview.priorityActions.every((action) => ['high', 'medium', 'low'].includes(action.tone)));
  assert.ok(preview.priorityActions.some((action) => action.downstreamStatus === 'aggravée' || action.shortagesAvoided >= 0));
});


test('buildProvinceLogisticsChoicePreview marks multi-guard spillover as chainable when capacity can follow', () => {
  const economyView = buildEconomyView();
  economyView.overlay.routes[0] = {
    ...economyView.overlay.routes[0],
    riskLevel: 82,
    totalCapacity: 9,
    resources: [{ resourceId: 'tools', capacity: 2 }],
  };
  economyView.comparison.rows = economyView.comparison.rows.map((row) => (
    row.cityId === 'iron-city' || row.cityId === 'hill-city' ? { ...row, tensionLevel: 'medium' } : row
  ));
  const preview = buildProvinceLogisticsChoicePreview(province, economyView, {
    resourceLabelById: { grain: 'Grain', tools: 'Outils' },
  });

  assert.equal(preview.adjacentRouteSpilloverRisk.guardComparison.state, 'compare');
  assert.equal(preview.adjacentRouteSpilloverRisk.guardSequencing.state, 'chainable');
  assert.match(preview.adjacentRouteSpilloverRisk.guardSequencing.phrase, /enchaîner après la récupération/);
  assert.match(preview.adjacentRouteSpilloverRisk.guardSequencing.reason, /sans remplacer l’action locale/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.state, 'stop');
  assert.equal(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.stopChain, true);
  assert.match(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.summary, /Arrêter ici protège .* sans retarder/);
  assert.match(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.stopReason, /Arrêter la chaîne|consommerait plus de capacité/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.canContinueWithoutCriticalDelay, false);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.stopMarker.label, 'Point d’arrêt: avant Safe Road');
  assert.match(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.stopMarker.reason, /premier segment où le coût cumulé .* dépasse le bénéfice attendu/);
  assert.match(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.stopMarker.decisionLabel, /Arrêter ici protège Ember Line sans retarder Safe Road/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.state, 'recommended');
  assert.equal(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.action, 'reroute-flow');
  assert.match(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.label, /Rediriger un flux vers Ember Line/);
  assert.match(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.reason, /bénéfice principal.*relais non-chaîné/);
  assert.match(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.opportunityCost, /Safe Road.*Pas de garde ajoutée/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.residualExposure.state, 'traced');
  assert.deepEqual(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.residualExposure.exposedRoutes.map((route) => route.route), ['Safe Road']);
  assert.match(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.residualExposure.exposedRoutes[0].reason, /au-delà du point d’arrêt/);
  assert.match(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.residualExposure.benefit, /protège Ember Line/);
  assert.match(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.residualExposure.residualRisk, /Safe Road.*reste exposé/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.state, 'watch');
  assert.equal(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.action, 'accept-exposure');
  assert.match(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.summary, /Safe Road.*reste à surveiller/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.fallbackJustification.state, 'available');
  assert.match(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.fallbackJustification.protectedMargin, /Iron Plain|Ember Line|marge utile/);
  assert.match(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.fallbackJustification.limitingResource, /Outils|ressource limitante/);
  assert.match(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.fallbackJustification.residualExposure, /Safe Road/);
  assert.match(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.fallbackJustification.ignoredRisk, /Ignorer/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.fallbackJustification.nextChoiceTrigger.state, 'watch');
  assert.match(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.fallbackJustification.nextChoiceTrigger.trigger, /bénéfice attendu de Safe Road/);
  assert.match(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.fallbackJustification.nextChoiceTrigger.reason, /coût .* contre bénéfice/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.fallbackJustification.primaryReturnSignal.state, 'stay-fallback');
  assert.match(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.fallbackJustification.primaryReturnSignal.summary, /Retour vers Safe Road après .* marge/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.fallbackJustification.primaryReturnSignal.residualConstraint.state, 'margin');
  assert.match(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.fallbackJustification.primaryReturnSignal.residualConstraint.summary, /Route primaire reprise plus tard: Safe Road manque encore/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.fallbackJustification.primaryReturnSignal.routeSlack.state, 'blocked');
  assert.match(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.fallbackJustification.primaryReturnSignal.routeSlack.summary, /Route non confortable: Safe Road reste le goulot/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.fallbackJustification.primaryReturnSignal.routeSlack.slackConsumerHint.primaryConsumer, 'Safe Road');
  assert.match(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.fallbackJustification.primaryReturnSignal.routeSlack.slackConsumerHint.summary, /Safe Road consomme d’abord le slack/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.fallbackJustification.primaryReturnSignal.routeSlack.slackConsumerHint.nextBlocker.label, 'Premier bloqueur: Safe Road');
  assert.match(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.fallbackJustification.primaryReturnSignal.routeSlack.slackConsumerHint.nextBlocker.summary, /Safe Road deviendrait bloquant en premier/);
  assert.match(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.fallbackAction.fallbackJustification.primaryReturnSignal.routeSlack.slackConsumerHint.afterFirstBlockerHandled.summary, /Après Safe Road, la marge revient à 0/);
});

test('buildProvinceLogisticsChoicePreview returns an empty state when no route is linked', () => {
  const preview = buildProvinceLogisticsChoicePreview({ provinceId: 'isolated' }, buildEconomyView());

  assert.equal(preview.recommendedOptionId, null);
  assert.deepEqual(preview.options, []);
  assert.equal(preview.status, 'stable');
  assert.equal(preview.timelineStatus, 'empty');
  assert.equal(preview.downstreamStatus, 'neutre');
  assert.match(preview.downstreamSummary, /Aucune pénurie aval/);
  assert.deepEqual(preview.priorityActions, []);
  assert.match(preview.prioritySummary, /Aucune action logistique prioritaire/);
  assert.equal(preview.recoveryLeverRanking.empty, true);
  assert.deepEqual(preview.recoveryLeverRanking.levers, []);
  assert.equal(preview.selectedActionPreview.status, 'empty');
  assert.deepEqual(preview.selectedActionPreview.badges, []);
  assert.equal(preview.secondaryBottleneckPreview.state, 'empty');
  assert.match(preview.secondaryBottleneckPreview.summary, /impossible de projeter/);
  assert.match(preview.secondaryBottleneckPreview.nextRecommendation.reason, /aucun bottleneck secondaire pertinent/);
  assert.equal(preview.primarySecondaryTradeoff.state, 'empty');
  assert.match(preview.primarySecondaryTradeoff.summary, /indisponible|aucun bottleneck secondaire/);
  assert.equal(preview.secondaryChoiceRelapsePreview.state, 'unknown');
  assert.match(preview.secondaryChoiceRelapsePreview.summary, /Rechute non chiffrable/);
  assert.equal(preview.localRecoveryCapacityConflictWarning.state, 'empty');
  assert.match(preview.localRecoveryCapacityConflictWarning.summary, /Aucun conflit transversal/);
  assert.equal(preview.adjacentRouteSpilloverRisk.state, 'empty');
  assert.match(preview.adjacentRouteSpilloverRisk.summary, /Aucun spillover/);
  assert.match(preview.adjacentRouteSpilloverRisk.dependencyTrace, /Dépendance inconnue/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardAction.fallback, true);
  assert.match(preview.adjacentRouteSpilloverRisk.guardAction.label, /Garde indisponible/);
  assert.match(preview.adjacentRouteSpilloverRisk.guardAction.reason, /Aucune chaîne de spillover/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardComparison.state, 'fallback');
  assert.match(preview.adjacentRouteSpilloverRisk.guardComparison.summary, /Comparaison impossible/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardSequencing.state, 'unknown');
  assert.match(preview.adjacentRouteSpilloverRisk.guardSequencing.phrase, /enchaînement inconnu/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.state, 'fallback');
  assert.match(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.summary, /Coût d’opportunité indisponible/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.residualExposure.state, 'unknown');
  assert.deepEqual(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.residualExposure.exposedRoutes, []);
  assert.match(preview.adjacentRouteSpilloverRisk.guardOpportunityCost.residualExposure.residualRisk, /non traçable précisément/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.state, 'unknown');
  assert.equal(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.action, 'wait-for-signals');
  assert.equal(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.fallbackJustification.state, 'unavailable');
  assert.match(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.fallbackJustification.label, /Aucun fallback sûr/);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.fallbackJustification.nextChoiceTrigger, undefined);
  assert.equal(preview.adjacentRouteSpilloverRisk.guardDecisionSummary.fallbackJustification.primaryReturnSignal, undefined);
  assert.equal(preview.primaryLogisticsAction.status, 'empty');
  assert.equal(preview.primaryLogisticsAction.disabled, true);
  assert.match(preview.timelineSummary, /timeline vide/);
  assert.match(preview.summary, /Logistique stable/);
});

test('buildProvinceLogisticsChoicePreview flags redundant queued logistics actions', () => {
  const baseline = buildProvinceLogisticsChoicePreview(province, buildEconomyView(), {
    resourceLabelById: { grain: 'Grain', tools: 'Outils' },
  });
  const queuedAction = baseline.primaryLogisticsAction;

  const preview = buildProvinceLogisticsChoicePreview(province, buildEconomyView(), {
    resourceLabelById: { grain: 'Grain', tools: 'Outils' },
    queuedLogisticsActions: [{ actionId: queuedAction.actionId, routeId: queuedAction.routeId, choiceId: queuedAction.choiceId, label: queuedAction.label }],
  });

  assert.equal(preview.primaryLogisticsAction.status, 'redundant');
  assert.equal(preview.primaryLogisticsAction.disabled, true);
  assert.match(preview.primaryLogisticsAction.queueWarning, /déjà en file|doublon/);
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
  assert.ok(preview.priorityActions.length >= 1);
  assert.equal(preview.priorityActions[0].recommended, true);
  assert.equal(preview.recoveryLeverRanking.empty, true);
  assert.equal(preview.options[0].recoveryChoices[0].downstreamShortages[0].status, 'résolue');
  assert.match(preview.options[0].recoveryChoices[0].downstreamShortages[0].detail, /aucune pénurie aval/i);
});

test('buildProvinceLogisticsChoicePreview validates options', () => {
  assert.throws(() => buildProvinceLogisticsChoicePreview(province, buildEconomyView(), null), /options must be an object/);
  assert.throws(() => buildProvinceLogisticsChoicePreview(province, buildEconomyView(), { resourceLabelById: [] }), /resourceLabelById must be an object/);
});
