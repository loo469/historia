import test from 'node:test';
import assert from 'node:assert/strict';

import { Province } from '../../../src/domain/war/Province.js';
import {
  buildFirstCleanupPayoff,
  buildIntriguePresenceSabotageOverlay,
  buildFollowUpCleanupChoices,
  buildFollowUpCleanupMiniPlan,
  buildMiniPlanConflictTradeoffs,
  buildMiniPlanConfidenceSignalCue,
  buildMiniPlanDecisionReversibilityCue,
  buildMiniPlanLastSafeCorrectionCue,
  buildMiniPlanLateCorrectionExitCost,
  buildMiniPlanMinimalFollowThrough,
  buildMiniPlanFollowThroughOpportunityTradeoff,
  buildMiniPlanSafestTacticalFallback,
  buildMiniPlanNextTurnHoldPlan,
  buildMiniPlanHoldReleaseCue,
  buildMiniPlanFirstSafeReengagement,
  buildMiniPlanPrematureReengagementRisk,
  buildMiniPlanDependencyConflicts,
  buildMiniPlanRivalResponseComparison,
  buildMiniPlanRivalResponseFallback,
  buildMiniPlanFallbackReturnCue,
  buildMiniPlanReturnProtectionStatus,
  buildMiniPlanRivalResponseRisk,
  buildMiniPlanTradeoffActionPreview,
  buildStrategicMapShell,
  buildTopFollowUpReadiness,
} from '../../../src/ui/war/StrategicMapShell.js';

function createProvince(overrides = {}) {
  return new Province({
    id: 'prov-b',
    name: 'Bastion',
    ownerFactionId: 'faction-a',
    controllingFactionId: 'faction-a',
    supplyLevel: 'stable',
    loyalty: 70,
    strategicValue: 4,
    neighborIds: ['prov-a'],
    contested: false,
    ...overrides,
  });
}

test('StrategicMapShell sorts provinces, derives headline stats and exposes overlay-ready state', () => {
  const shell = buildStrategicMapShell(
    [
      createProvince({
        id: 'prov-c',
        name: 'Colline rouge',
        controllingFactionId: 'faction-b',
        contested: true,
        supplyLevel: 'strained',
        loyalty: 40,
      }),
      createProvince({ id: 'prov-a', name: 'Avant-poste', loyalty: 82, strategicValue: 2 }),
    ],
    {
      title: 'Théâtre nord',
      selectedProvinceId: 'prov-c',
      focusedProvinceId: 'prov-a',
      hoveredProvinceId: 'prov-a',
      queuedProvinceId: 'prov-c',
      factionMetaById: {
        'faction-a': { label: 'Alliance d’Azur' },
        'faction-b': { label: 'Ligue cramoisie' },
      },
      paletteByFaction: {
        'faction-a': { fill: '#2563EB', border: '#1E3A8A' },
        'faction-b': { fill: '#DC2626', border: '#7F1D1D' },
      },
      provinceGeometryById: {
        'prov-a': {
          layout: { x: 10, y: 12, w: 20, h: 18 },
          center: { x: 20, y: 21 },
          polygon: '10,12 30,12 30,30 10,30',
          shape: 'polygon(10% 12%, 30% 12%, 30% 30%, 10% 30%)',
          labelLayout: { x: 20, y: 18, align: 'middle', tone: 'capital' },
        },
      },
    },
  );

  assert.equal(shell.title, 'Théâtre nord');
  assert.equal(shell.subtitle, 'Vue d’ensemble des provinces et lignes de front');
  assert.deepEqual(shell.provinces.map((province) => province.provinceId), ['prov-a', 'prov-c']);
  assert.deepEqual(shell.provinces.map((province) => province.selectionState), [
    { selected: false, focused: true, hovered: true, queued: false },
    { selected: true, focused: false, hovered: false, queued: true },
  ]);
  assert.deepEqual(shell.provinces[0].geometry.layout, { x: 10, y: 12, w: 20, h: 18 });
  assert.equal(shell.provinces[0].geometry.shape, 'polygon(10% 12%, 30% 12%, 30% 30%, 10% 30%)');
  assert.equal(shell.provinces[1].geometry.layout, null);
  assert.deepEqual(shell.mapLayers.provinceSurfaces.map((surface) => ({
    provinceId: surface.provinceId,
    cssClasses: surface.cssClasses,
    status: surface.data.status,
    ariaLabel: surface.ariaLabel,
  })), [
    {
      provinceId: 'prov-a',
      cssClasses: ['province-node', 'province-node--supply-stable', 'province-node--action-idle', 'is-focused', 'is-hovered'],
      status: 'stable',
      ariaLabel: 'Avant-poste — Contrôle stable, ravitaillement stable, loyauté 82%, valeur 2',
    },
    {
      provinceId: 'prov-c',
      cssClasses: ['province-node', 'province-node--contested', 'province-node--occupied', 'province-node--supply-strained', 'province-node--action-available', 'is-selected', 'is-queued'],
      status: 'contested',
      ariaLabel: 'Colline rouge — Front contesté, ravitaillement strained, loyauté 40%, valeur 4',
    },
  ]);
  assert.deepEqual(shell.mapLayers.provinceSurfaces.map((surface) => ({
    provinceId: surface.provinceId,
    actionState: surface.data.actionState,
    affordanceLabel: surface.actionAffordance.label,
    pressure: surface.tacticalHoverIntel.militaryPressure.label,
    nextAction: surface.tacticalHoverIntel.nextAction.label,
    garrisonStatus: surface.tacticalHoverIntel.garrisonStatus,
  })), [
    {
      provinceId: 'prov-a',
      actionState: 'idle',
      affordanceLabel: 'aucune action urgente',
      pressure: 'pression basse',
      nextAction: 'Garder en réserve',
      garrisonStatus: 'garnison stable',
    },
    {
      provinceId: 'prov-c',
      actionState: 'available',
      affordanceLabel: 'action disponible',
      pressure: 'pression critique',
      nextAction: 'Renforcer le front',
      garrisonStatus: 'front actif',
    },
  ]);
  assert.deepEqual(shell.mapLayers.provinceLabels, [
    {
      provinceId: 'prov-a',
      text: 'Avant-poste',
      meta: 'Contrôle stable',
      x: 20,
      y: 18,
      align: 'middle',
      tone: 'capital',
      leaderLine: null,
    },
  ]);
  assert.deepEqual(shell.keyboardActionPlanner, {
    mode: 'keyboard-first',
    focusOrder: [
      {
        provinceId: 'prov-a',
        label: 'Avant-poste',
        tabIndex: 0,
        selected: false,
        focused: true,
        queued: false,
        actionState: 'idle',
      },
      {
        provinceId: 'prov-c',
        label: 'Colline rouge',
        tabIndex: -1,
        selected: true,
        focused: false,
        queued: true,
        actionState: 'available',
      },
    ],
    activeProvinceId: 'prov-a',
    plannedActionPreview: {
      empty: false,
      targetProvinceId: 'prov-a',
      targetLabel: 'Avant-poste',
      actionCode: 'hold-reserve',
      actionLabel: 'Garder en réserve',
      actionStatus: 'idle',
      risk: 'risque maîtrisé',
      expectedEffect: 'maintenir Avant-poste en réserve',
      tacticalReason: 'aucune urgence militaire locale',
    },
    actionQueueValidation: {
      empty: true,
      entries: [],
      summary: {
        readyCount: 0,
        riskyCount: 0,
        blockedCount: 0,
        conflictCount: 0,
      },
      nextSafeAction: null,
    },
    emptyState: null,
  });
  assert.deepEqual(shell.afterActionMapRecap, {
    empty: true,
    entries: [],
    affectedProvinceIds: [],
    affectedFronts: [],
    summary: 'Aucune résolution récente à récapituler.',
  });
  assert.deepEqual(shell.frontPressureReplay, {
    empty: true,
    incomplete: false,
    frameCount: 0,
    currentIndex: -1,
    controls: null,
    beforeAfter: null,
    frames: [],
    activeFrame: null,
    fallbackMessage: 'Aucun historique de pression disponible pour le replay.',
  });
  assert.deepEqual(shell.frontRecoveryRecommendations, {
    empty: true,
    fallbackMessage: 'Recommandations indisponibles sans historique de pression du front.',
    safestActionCode: null,
    opportunisticActionCode: null,
    recommendations: [],
  });
  assert.deepEqual(shell.operationalPrioritySummary, {
    empty: false,
    fallbackMessage: 'Recommandations indisponibles sans historique de pression du front.',
    priorities: [
      { priority: 'tenir', entries: [] },
      { priority: 'renforcer', entries: [] },
      { priority: 'exploiter', entries: [] },
      {
        priority: 'surveiller',
        entries: [
          {
            order: 1,
            provinceId: 'prov-c',
            provinceLabel: 'Colline rouge',
            priority: 'surveiller',
            actionCode: 'watch-front',
            actionLabel: 'Surveiller le front',
            reason: 'province contestée sans replay exploitable dans la fenêtre active',
            risk: 'incertain: données de replay incomplètes',
            marker: 'fallback',
            conflict: {
              type: 'historique incomplet',
              reason: 'aucune recommandation locale fiable pour cette province',
            },
          },
        ],
      },
      { priority: 'différer', entries: [] },
    ],
    conflicts: [
      {
        provinceId: 'prov-c',
        provinceLabel: 'Colline rouge',
        actionCode: 'watch-front',
        type: 'historique incomplet',
        reason: 'aucune recommandation locale fiable pour cette province',
      },
    ],
    actionOrder: [
      {
        order: 1,
        provinceId: 'prov-c',
        provinceLabel: 'Colline rouge',
        priority: 'surveiller',
        actionLabel: 'Surveiller le front',
        marker: 'fallback',
      },
    ],
    summary: '1 priorité: surveiller Colline rouge',
  });
  assert.deepEqual(shell.stats, {
    provinceCount: 2,
    contestedCount: 1,
    occupiedCount: 1,
    averageLoyalty: 61,
  });
  assert.deepEqual(shell.legend, {
    factions: [
      {
        factionId: 'faction-a',
        label: 'Alliance d’Azur',
        color: '#2563EB',
        border: '#1E3A8A',
      },
      {
        factionId: 'faction-b',
        label: 'Ligue cramoisie',
        color: '#DC2626',
        border: '#7F1D1D',
      },
    ],
    states: [
      { code: 'stable', label: 'Contrôle stable' },
      { code: 'occupied', label: 'Occupation' },
      { code: 'contested', label: 'Front contesté' },
    ],
  });
  assert.deepEqual(shell.overlays.slots.map((slot) => slot.slotId), [
    'climate-overlay',
    'culture-overlay',
    'economy-overlay',
    'intrigue-overlay',
  ]);
  assert.equal(shell.activeProvince.provinceId, 'prov-a');
});


test('StrategicMapShell validates province action queues and suggests a safe replacement', () => {
  const shell = buildStrategicMapShell(
    [
      createProvince({ id: 'front', name: 'Front rouge', contested: true, neighborIds: ['support'] }),
      createProvince({
        id: 'support',
        name: 'Support rompu',
        supplyLevel: 'disrupted',
        neighborIds: ['front'],
      }),
      createProvince({ id: 'reserve', name: 'Réserve nord', strategicValue: 1, neighborIds: [] }),
    ],
    {
      selectedProvinceId: 'front',
      focusedProvinceId: 'front',
      queuedProvinceId: 'support',
      provinceActionQueue: [
        { queueId: 'q1', provinceId: 'reserve', label: 'Tenir la réserve' },
        { queueId: 'q2', provinceId: 'support', label: 'Pousser sans soutien', requiresSupport: true },
        { queueId: 'q3', provinceId: 'front', label: 'Avancer après front instable' },
        { queueId: 'q4', provinceId: 'front', label: 'Rejouer même cible' },
      ],
    },
  );

  assert.deepEqual(shell.keyboardActionPlanner.actionQueueValidation, {
    empty: false,
    entries: [
      {
        queueId: 'q1',
        provinceId: 'reserve',
        provinceLabel: 'Réserve nord',
        actionCode: 'hold-reserve',
        actionLabel: 'Tenir la réserve',
        status: 'ready',
        reason: 'ordre prêt',
        safeReplacement: null,
        conflictAwarePreview: {
          frontEffect: 'maintient Réserve nord sans bascule de front',
          blockers: [],
          mutuallyExclusiveWith: null,
          safestAlternative: null,
          confirmationHint: 'confirmable maintenant',
        },
      },
      {
        queueId: 'q2',
        provinceId: 'support',
        provinceLabel: 'Support rompu',
        actionCode: 'avoid-push',
        actionLabel: 'Pousser sans soutien',
        status: 'conflict',
        reason: 'support manquant',
        safeReplacement: {
          actionCode: 'hold-reserve',
          label: 'Garder en réserve',
          reason: 'attendre résolution du blocage',
        },
        conflictAwarePreview: {
          frontEffect: 'évite une poussée fragile sur Support rompu',
          blockers: ['support manquant'],
          mutuallyExclusiveWith: null,
          safestAlternative: {
            actionCode: 'hold-reserve',
            label: 'Garder en réserve',
            reason: 'attendre résolution du blocage',
          },
          confirmationHint: 'corriger avant confirmation',
        },
      },
      {
        queueId: 'q3',
        provinceId: 'front',
        provinceLabel: 'Front rouge',
        actionCode: 'reinforce-front',
        actionLabel: 'Avancer après front instable',
        status: 'ready',
        reason: 'ordre prêt',
        safeReplacement: null,
        conflictAwarePreview: {
          frontEffect: 'stabilise front actif sur Front rouge',
          blockers: [],
          mutuallyExclusiveWith: {
            queueId: 'q2',
            provinceId: 'support',
            reason: 'fronts voisins liés',
          },
          safestAlternative: null,
          confirmationHint: 'confirmable maintenant',
        },
      },
      {
        queueId: 'q4',
        provinceId: 'front',
        provinceLabel: 'Front rouge',
        actionCode: 'reinforce-front',
        actionLabel: 'Rejouer même cible',
        status: 'conflict',
        reason: 'cible déjà engagée',
        safeReplacement: {
          actionCode: 'reinforce-front',
          label: 'Renforcer le front',
          reason: 'front contesté et pression militaire visible',
        },
        conflictAwarePreview: {
          frontEffect: 'stabilise front actif sur Front rouge',
          blockers: ['cible déjà engagée'],
          mutuallyExclusiveWith: {
            queueId: 'q3',
            provinceId: 'front',
            reason: 'même cible',
          },
          safestAlternative: {
            actionCode: 'reinforce-front',
            label: 'Renforcer le front',
            reason: 'front contesté et pression militaire visible',
          },
          confirmationHint: 'corriger avant confirmation',
        },
      },
    ],
    summary: {
      readyCount: 2,
      riskyCount: 0,
      blockedCount: 0,
      conflictCount: 2,
    },
    nextSafeAction: {
      actionCode: 'hold-reserve',
      label: 'Garder en réserve',
      reason: 'attendre résolution du blocage',
    },
  });
});


test('StrategicMapShell summarizes recently resolved province orders for after-action map recap', () => {
  const shell = buildStrategicMapShell(
    [
      createProvince({ id: 'front', name: 'Front rouge', contested: true, neighborIds: ['support'] }),
      createProvince({ id: 'support', name: 'Support rompu', supplyLevel: 'disrupted', neighborIds: ['front'] }),
      createProvince({ id: 'reserve', name: 'Réserve nord', strategicValue: 1, neighborIds: [] }),
    ],
    {
      provinceActionQueue: [
        { queueId: 'q1', provinceId: 'reserve', label: 'Tenir la réserve' },
        { queueId: 'q2', provinceId: 'support', label: 'Pousser sans soutien', requiresSupport: true },
        { queueId: 'q3', provinceId: 'front', label: 'Avancer après front instable' },
      ],
      resolvedProvinceOrders: [
        { resolutionId: 'r1', queueId: 'q1', provinceId: 'reserve', result: 'success', label: 'Tenir la réserve', explanation: 'Réserve consolidée sans ouvrir de nouveau front.' },
        { resolutionId: 'r2', queueId: 'q2', provinceId: 'support', result: 'blocked', label: 'Pousser sans soutien' },
        { resolutionId: 'r3', queueId: 'q3', provinceId: 'front', result: 'conflict', label: 'Avancer après front instable', affectedFront: 'front rouge' },
        { resolutionId: 'r4', provinceId: 'front', result: 'cancelled', label: 'Annuler la poussée', explanation: 'Ordre annulé avant résolution.' },
        { resolutionId: 'r5', provinceId: 'reserve', result: 'deferred', label: 'Reporter le relais' },
      ],
    },
  );

  assert.deepEqual(shell.afterActionMapRecap.summary, '5 ordres résolus: 1 succès · 1 blocage · 1 conflit · 1 annulation · 1 report');
  assert.deepEqual(shell.afterActionMapRecap.affectedProvinceIds, ['reserve', 'support', 'front']);
  assert.deepEqual(shell.afterActionMapRecap.affectedFronts, ['contrôle local', 'front rouge', 'front local contesté']);
  assert.deepEqual(shell.afterActionMapRecap.entries.map((entry) => ({
    resolutionId: entry.resolutionId,
    provinceLabel: entry.provinceLabel,
    result: entry.result,
    tone: entry.tone,
    explanation: entry.explanation,
    frontEffect: entry.frontEffect,
    affectedFront: entry.affectedFront,
    highlight: entry.highlight,
  })), [
    {
      resolutionId: 'r1',
      provinceLabel: 'Réserve nord',
      result: 'success',
      tone: 'positive',
      explanation: 'Réserve consolidée sans ouvrir de nouveau front.',
      frontEffect: 'maintient Réserve nord sans bascule de front',
      affectedFront: 'contrôle local',
      highlight: { provinceId: 'reserve', frontIds: ['reserve'] },
    },
    {
      resolutionId: 'r2',
      provinceLabel: 'Support rompu',
      result: 'blocked',
      tone: 'warning',
      explanation: 'support manquant',
      frontEffect: 'évite une poussée fragile sur Support rompu',
      affectedFront: 'contrôle local',
      highlight: { provinceId: 'support', frontIds: ['support'] },
    },
    {
      resolutionId: 'r3',
      provinceLabel: 'Front rouge',
      result: 'conflict',
      tone: 'warning',
      explanation: 'stabilise front actif sur Front rouge',
      frontEffect: 'stabilise front actif sur Front rouge',
      affectedFront: 'front rouge',
      highlight: { provinceId: 'front', frontIds: ['front rouge'] },
    },
    {
      resolutionId: 'r4',
      provinceLabel: 'Front rouge',
      result: 'cancelled',
      tone: 'muted',
      explanation: 'Ordre annulé avant résolution.',
      frontEffect: 'met à jour front actif sur Front rouge',
      affectedFront: 'front local contesté',
      highlight: { provinceId: 'front', frontIds: ['front'] },
    },
    {
      resolutionId: 'r5',
      provinceLabel: 'Réserve nord',
      result: 'deferred',
      tone: 'neutral',
      explanation: "Réserve nord reporte l'ordre au prochain créneau sûr.",
      frontEffect: 'met à jour garnison stable sur Réserve nord',
      affectedFront: 'contrôle local',
      highlight: { provinceId: 'reserve', frontIds: ['reserve'] },
    },
  ]);
});


test('StrategicMapShell builds a scrub-ready front pressure timeline replay', () => {
  const shell = buildStrategicMapShell(
    [
      createProvince({ id: 'front', name: 'Front rouge', contested: true, neighborIds: ['support', 'reserve'] }),
      createProvince({ id: 'support', name: 'Support rompu', supplyLevel: 'disrupted', neighborIds: ['front'] }),
      createProvince({ id: 'reserve', name: 'Réserve nord', strategicValue: 1, neighborIds: ['front'] }),
    ],
    {
      frontPressureReplayIndex: 1,
      frontPressureTimeline: [
        {
          frameId: 't1',
          provinceId: 'front',
          turnLabel: 'Avant ordre',
          previousPressure: 'critical',
          pressure: 'high',
          marker: 'gain',
          reason: 'renfort arrivé sur la ligne contestée',
          adjacentPressure: [{ provinceId: 'support', label: 'Support rompu', pressure: 'high' }],
        },
        {
          frameId: 't2',
          provinceId: 'front',
          turnLabel: 'Après blocage voisin',
          previousPressure: 'high',
          pressure: 'critical',
          marker: 'loss',
          reason: 'support voisin désorganisé',
          adjacentPressure: [{ provinceId: 'support', label: 'Support rompu', pressure: 'critical' }],
        },
        {
          frameId: 't3',
          provinceId: 'front',
          turnLabel: 'Ordre reporté',
          previousPressure: 'critical',
          pressure: 'critical',
          marker: 'blocked',
          result: 'blocked',
          reason: 'ordre bloqué par ravitaillement rompu',
        },
      ],
    },
  );

  assert.deepEqual(shell.frontPressureReplay, {
    empty: false,
    incomplete: false,
    frameCount: 3,
    currentIndex: 1,
    controls: {
      type: 'scrub',
      min: 0,
      max: 2,
      step: 1,
      label: 'Rejouer la pression du front',
    },
    beforeAfter: {
      provinceId: 'front',
      provinceLabel: 'Front rouge',
      before: 'critical',
      after: 'critical',
      changeLabel: '+1 pression',
    },
    frames: [
      {
        frameId: 't1',
        frameIndex: 0,
        provinceId: 'front',
        provinceLabel: 'Front rouge',
        turnLabel: 'Avant ordre',
        previousPressure: 'critical',
        pressure: 'high',
        pressureDelta: -1,
        changeLabel: '-1 pression',
        marker: { type: 'gain', label: 'gain', tone: 'positive' },
        adjacentPressure: [{ provinceId: 'support', label: 'Support rompu', pressure: 'high' }],
        summary: '-1 pression — renfort arrivé sur la ligne contestée',
        reason: 'renfort arrivé sur la ligne contestée',
      },
      {
        frameId: 't2',
        frameIndex: 1,
        provinceId: 'front',
        provinceLabel: 'Front rouge',
        turnLabel: 'Après blocage voisin',
        previousPressure: 'high',
        pressure: 'critical',
        pressureDelta: 1,
        changeLabel: '+1 pression',
        marker: { type: 'loss', label: 'perte', tone: 'negative' },
        adjacentPressure: [{ provinceId: 'support', label: 'Support rompu', pressure: 'critical' }],
        summary: '+1 pression — support voisin désorganisé',
        reason: 'support voisin désorganisé',
      },
      {
        frameId: 't3',
        frameIndex: 2,
        provinceId: 'front',
        provinceLabel: 'Front rouge',
        turnLabel: 'Ordre reporté',
        previousPressure: 'critical',
        pressure: 'critical',
        pressureDelta: 0,
        changeLabel: 'pression stable',
        marker: { type: 'blocked', label: 'blocage', tone: 'warning' },
        adjacentPressure: [],
        summary: 'pression stable — ordre bloqué par ravitaillement rompu',
        reason: 'ordre bloqué par ravitaillement rompu',
      },
    ],
    activeFrame: {
      frameId: 't2',
      frameIndex: 1,
      provinceId: 'front',
      provinceLabel: 'Front rouge',
      turnLabel: 'Après blocage voisin',
      previousPressure: 'high',
      pressure: 'critical',
      pressureDelta: 1,
      changeLabel: '+1 pression',
      marker: { type: 'loss', label: 'perte', tone: 'negative' },
      adjacentPressure: [{ provinceId: 'support', label: 'Support rompu', pressure: 'critical' }],
      summary: '+1 pression — support voisin désorganisé',
      reason: 'support voisin désorganisé',
    },
    fallbackMessage: null,
  });
  assert.deepEqual(shell.frontRecoveryRecommendations, {
    empty: false,
    fallbackMessage: null,
    safestActionCode: 'consolidate-support',
    opportunisticActionCode: 'limited-probe',
    recommendations: [
      {
        actionCode: 'consolidate-support',
        label: 'Consolider le soutien',
        stance: 'sûre',
        reason: 'le replay montre un blocage qui empêche la pression de retomber',
        risk: 'faible à moyen: stabilise le front mais retarde l’exploitation',
        safest: true,
        opportunistic: false,
      },
      {
        actionCode: 'reinforce-front',
        label: 'Renforcer le front',
        stance: 'défensive',
        reason: 'le replay indique une perte de pression favorable ou une remontée adverse',
        risk: 'moyen: consomme des ressources mais évite une rupture',
        safest: false,
        opportunistic: false,
      },
      {
        actionCode: 'limited-probe',
        label: 'Sonder prudemment la brèche',
        stance: 'opportuniste',
        reason: 'le replay montre un gain, mais la pression adjacente exige une reprise limitée',
        risk: 'moyen à élevé: opportunité réelle mais soutien fragile',
        safest: false,
        opportunistic: true,
      },
    ],
  });
  assert.deepEqual(shell.operationalPrioritySummary.actionOrder, [
    {
      order: 1,
      provinceId: 'front',
      provinceLabel: 'Front rouge',
      priority: 'renforcer',
      actionLabel: 'Consolider le soutien',
      marker: 'option sûre',
    },
    {
      order: 2,
      provinceId: 'front',
      provinceLabel: 'Front rouge',
      priority: 'renforcer',
      actionLabel: 'Renforcer le front',
      marker: 'option de suivi',
    },
    {
      order: 3,
      provinceId: 'front',
      provinceLabel: 'Front rouge',
      priority: 'exploiter',
      actionLabel: 'Sonder prudemment la brèche',
      marker: 'option opportuniste',
    },
  ]);
  assert.deepEqual(shell.operationalPrioritySummary.conflicts, [
    {
      provinceId: 'front',
      provinceLabel: 'Front rouge',
      actionCode: 'consolidate-support',
      type: 'soutien manquant',
      reason: 'la recommandation dépend d’un soutien à rétablir avant reprise',
    },
    {
      provinceId: 'front',
      provinceLabel: 'Front rouge',
      actionCode: 'limited-probe',
      type: 'risque de sur-extension',
      reason: 'l’opportunité existe mais la pression adjacente reste élevée',
    },
  ]);
  assert.equal(shell.operationalPrioritySummary.summary, '3 priorités: renforcer Front rouge → renforcer Front rouge → exploiter Front rouge');
});

test('StrategicMapShell reports incomplete front pressure replay history', () => {
  const shell = buildStrategicMapShell(
    [createProvince({ id: 'front', name: 'Front rouge', contested: true })],
    {
      frontPressureTimeline: [
        { frameId: 'only', provinceId: 'front', previousPressure: 'high', pressure: 'high' },
      ],
    },
  );

  assert.equal(shell.frontPressureReplay.empty, false);
  assert.equal(shell.frontPressureReplay.incomplete, true);
  assert.equal(shell.frontPressureReplay.fallbackMessage, 'Historique incomplet: un seul état disponible pour ce front.');
  assert.deepEqual(shell.frontRecoveryRecommendations, {
    empty: false,
    fallbackMessage: 'Historique incomplet: attendre ou consolider avant une reprise risquée.',
    safestActionCode: 'hold-and-observe',
    opportunisticActionCode: null,
    recommendations: [
      {
        actionCode: 'hold-and-observe',
        label: 'Attendre et observer',
        stance: 'sûre',
        reason: 'un seul état de replay ne suffit pas pour distinguer gain, perte ou pression adjacente',
        risk: 'faible, mais l’initiative reste limitée',
        safest: true,
        opportunistic: false,
      },
    ],
  });
  assert.equal(shell.operationalPrioritySummary.fallbackMessage, 'Historique incomplet: attendre ou consolider avant une reprise risquée.');
  assert.deepEqual(shell.operationalPrioritySummary.actionOrder, [
    {
      order: 1,
      provinceId: 'front',
      provinceLabel: 'Front rouge',
      priority: 'tenir',
      actionLabel: 'Attendre et observer',
      marker: 'option sûre',
    },
  ]);
});

test('StrategicMapShell projects intrigue presence and sabotage risk into the map overlay slot', () => {
  const provinces = [
    createProvince({ id: 'ashlands', name: 'Ashlands' }),
    createProvince({ id: 'riverlands', name: 'Riverlands' }),
    createProvince({ id: 'quiet-plains', name: 'Quiet Plains' }),
  ];
  const intrigueMapOverlay = [
    {
      locationId: 'riverlands',
      locationName: 'Riverlands',
      presenceLevel: 'low',
      sabotageRiskLevel: 'high',
      sabotageRiskScore: 83.6,
      metrics: { celluleCount: 1, sabotageOperationCount: 2 },
    },
    {
      locationId: 'ashlands',
      locationName: 'Ashlands',
      presenceLevel: 'high',
      sabotageRiskLevel: 'medium',
      sabotageRiskScore: 48,
      metrics: { celluleCount: 3, sabotageOperationCount: 1 },
    },
    {
      locationId: 'off-map',
      presenceLevel: 'high',
      sabotageRiskLevel: 'high',
      sabotageRiskScore: 100,
      metrics: { celluleCount: 4, sabotageOperationCount: 4 },
    },
    {
      locationId: 'quiet-plains',
      presenceLevel: 'none',
      sabotageRiskLevel: 'none',
      sabotageRiskScore: 0,
    },
  ];

  const shell = buildStrategicMapShell(provinces, { intrigueMapOverlay });

  assert.deepEqual(shell.overlays.intrigue, {
    overlayId: 'intrigue-presence-sabotage',
    slotId: 'intrigue-overlay',
    label: 'Présence intrigue et risque sabotage',
    markers: [
      {
        provinceId: 'riverlands',
        provinceName: 'Riverlands',
        locationId: 'riverlands',
        label: 'Riverlands: présence low, sabotage high (84)',
        tone: 'danger',
        presence: { level: 'low', celluleCount: 1 },
        sabotageRisk: { level: 'high', score: 84, operationCount: 2 },
      },
      {
        provinceId: 'ashlands',
        provinceName: 'Ashlands',
        locationId: 'ashlands',
        label: 'Ashlands: présence high, sabotage medium (48)',
        tone: 'warning',
        presence: { level: 'high', celluleCount: 3 },
        sabotageRisk: { level: 'medium', score: 48, operationCount: 1 },
      },
    ],
    summary: {
      markerCount: 2,
      highRiskCount: 1,
      activePresenceCount: 2,
    },
  });
  assert.deepEqual(buildIntriguePresenceSabotageOverlay(provinces, undefined).summary, {
    markerCount: 0,
    highRiskCount: 0,
    activePresenceCount: 0,
  });
});

test('StrategicMapShell rejects invalid intrigue map overlay payloads', () => {
  assert.throws(
    () => buildStrategicMapShell([createProvince()], { intrigueMapOverlay: {} }),
    /intrigueMapOverlay must be an array/,
  );
  assert.throws(
    () => buildStrategicMapShell([createProvince()], { intrigueMapOverlay: [null] }),
    /intrigueMapOverlay entries must be objects/,
  );
});

test('StrategicMapShell exposes the first cleanup payoff from cleanup orders and residual risks', () => {
  const shell = buildStrategicMapShell([createProvince({ id: 'front-a', name: 'Front A' })], {
    residualRisks: [
      { key: 'supply-pressure:front-a', label: 'pression ravitaillement', reason: 'approvisionnement tendu' },
      { key: 'low-loyalty:front-a', label: 'loyauté basse', reason: 'loyauté 42' },
    ],
    cleanupOrders: [
      {
        id: 'cleanup:route-blocked:supply-pressure:front-a',
        label: 'Prioriser convoi court',
        residualRiskKey: 'supply-pressure:front-a',
        riskReduced: 'pression ravitaillement',
        reason: 'ravitaillement visible à faible détour',
      },
    ],
  });

  assert.deepEqual(shell.firstCleanupPayoff, {
    cleanupOrderId: 'cleanup:route-blocked:supply-pressure:front-a',
    cleanupOrderLabel: 'Prioriser convoi court',
    residualRiskKey: 'supply-pressure:front-a',
    targetId: 'front-a',
    riskReduced: 'pression ravitaillement',
    priorityReason: 'ravitaillement visible à faible détour',
    currentRiskReason: 'approvisionnement tendu',
    expectedEffect: 'réduit pression ravitaillement',
    remainingRiskState: 'residual-risk-remains',
    remainingRiskCount: 1,
    remainingRisks: [
      { key: 'low-loyalty:front-a', label: 'loyauté basse', reason: 'loyauté 42' },
    ],
  });
});

test('StrategicMapShell ranks follow-up cleanup choices after the first payoff', () => {
  const shell = buildStrategicMapShell([createProvince({ id: 'front-a', name: 'Front A' })], {
    residualRisks: [
      { key: 'supply-pressure:front-a', label: 'pression ravitaillement', reason: 'approvisionnement tendu' },
      { key: 'low-loyalty:front-a', label: 'loyauté basse', reason: 'loyauté 42' },
      { key: 'route-exposure:front-b', label: 'axe encore exposé', reason: 'exposition route 21' },
    ],
    cleanupOrders: [
      {
        id: 'cleanup:route-blocked:supply-pressure:front-a',
        label: 'Prioriser convoi court',
        residualRiskKey: 'supply-pressure:front-a',
        riskReduced: 'pression ravitaillement',
        reason: 'ravitaillement visible à faible détour',
        safetyScore: 46,
      },
      {
        id: 'cleanup:route-blocked:low-loyalty:front-a',
        label: 'Envoyer liaison locale',
        residualRiskKey: 'low-loyalty:front-a',
        riskReduced: 'loyauté basse',
        reason: 'faible coût et peu d’effet secondaire',
        prerequisite: 'émissaire disponible',
        safetyScore: 42,
      },
      {
        id: 'cleanup:route-blocked:route-exposure:front-b',
        label: 'Scanner axe détour',
        residualRiskKey: 'route-exposure:front-b',
        riskReduced: 'axe encore exposé',
        reason: 'réduit l’exposition sans combat',
        prerequisite: 'éclaireurs disponibles',
        safetyScore: 45,
      },
    ],
  });

  assert.deepEqual(shell.followUpCleanupChoices, [
    {
      rank: 1,
      cleanupOrderId: 'cleanup:route-blocked:route-exposure:front-b',
      cleanupOrderLabel: 'Scanner axe détour',
      residualRiskKey: 'route-exposure:front-b',
      targetId: 'front-b',
      riskCovered: 'axe encore exposé',
      expectedBenefit: 'réduit axe encore exposé',
      rankReason: 'réduit l’exposition sans combat',
      prerequisite: 'éclaireurs disponibles',
      safetyScore: 45,
    },
    {
      rank: 2,
      cleanupOrderId: 'cleanup:route-blocked:low-loyalty:front-a',
      cleanupOrderLabel: 'Envoyer liaison locale',
      residualRiskKey: 'low-loyalty:front-a',
      targetId: 'front-a',
      riskCovered: 'loyauté basse',
      expectedBenefit: 'réduit loyauté basse',
      rankReason: 'faible coût et peu d’effet secondaire',
      prerequisite: 'émissaire disponible',
      safetyScore: 42,
    },
  ]);

  assert.deepEqual(shell.topFollowUpReadiness, {
    state: 'needs-logistics',
    tone: 'warning',
    label: 'Logistique à vérifier',
    blocker: 'éclaireurs disponibles',
    action: 'sécuriser le corridor court avant exécution',
    targetId: 'front-b',
    residualRiskKey: 'route-exposure:front-b',
  });
  assert.deepEqual(shell.followUpCleanupMiniPlan, {
    empty: false,
    reason: 'Logistique à vérifier',
    targetId: 'front-b',
    steps: [
      {
        stepId: 'followup-readiness:route-exposure:front-b',
        order: 1,
        label: 'sécuriser le corridor court avant exécution',
        prerequisite: 'éclaireurs disponibles',
        riskReduced: 'bloqueur readiness',
        untreatedRisk: 'axe encore exposé',
        state: 'needs-logistics',
      },
      {
        stepId: 'followup-cleanup:route-exposure:front-b',
        order: 2,
        label: 'Scanner axe détour',
        prerequisite: 'éclaireurs disponibles',
        riskReduced: 'axe encore exposé',
        untreatedRisk: 'pression ravitaillement',
        state: 'execute-cleanup',
      },
      {
        stepId: 'followup-next:low-loyalty:front-a',
        order: 3,
        label: 'Envoyer liaison locale',
        prerequisite: 'émissaire disponible',
        riskReduced: 'loyauté basse',
        untreatedRisk: 'pression ravitaillement',
        state: 'next-followup',
      },
    ],
  });
  assert.deepEqual(shell.miniPlanDependencyConflicts, [
    {
      conflictId: 'mini-plan-conflict:supply-pressure:front-a',
      severity: 'blocking',
      label: 'Convoi partagé',
      reason: 'approvisionnement tendu',
      mitigation: 'réserver le convoi court avant le mini-plan',
      residualRiskKey: 'supply-pressure:front-a',
      targetId: 'front-a',
    },
  ]);
  assert.deepEqual(shell.miniPlanConflictTradeoffs, [
    {
      tradeoffId: 'mini-plan-tradeoff:supply-pressure:front-a',
      conflictId: 'mini-plan-conflict:supply-pressure:front-a',
      severity: 'blocking',
      reason: 'approvisionnement tendu',
      recommendedChoice: 'réserver le convoi court avant le mini-plan',
      rejectedChoice: 'Scanner axe détour',
      rejectedCost: 'retarde Scanner axe détour',
      label: 'prioriser convoi partagé',
      targetId: 'front-a',
    },
  ]);
  assert.deepEqual(shell.miniPlanTradeoffActionPreview, {
    empty: false,
    reason: 'approvisionnement tendu',
    tradeoffId: 'mini-plan-tradeoff:supply-pressure:front-a',
    targetId: 'front-a',
    action: 'réserver le convoi court avant le mini-plan',
    prerequisite: 'approvisionnement tendu',
    expectedBenefit: 'débloque Scanner axe détour',
  });
  assert.deepEqual(shell.miniPlanRivalResponseRisk, {
    empty: false,
    level: 'high',
    label: 'Risque élevé',
    response: 'coupure du convoi partagé',
    watch: 'À surveiller: approvisionnement tendu',
    tradeoffId: 'mini-plan-tradeoff:supply-pressure:front-a',
    targetId: 'front-a',
  });
  assert.deepEqual(shell.miniPlanRivalResponseComparison, {
    empty: false,
    recommendedTradeoffId: 'mini-plan-tradeoff:supply-pressure:front-a',
    recommendationChanged: false,
    reason: 'branche recommandée robuste face aux réponses listées',
    branches: [
      {
        branchId: 'mini-plan-branch:1:mini-plan-tradeoff:supply-pressure:front-a',
        tradeoffId: 'mini-plan-tradeoff:supply-pressure:front-a',
        recommended: true,
        action: 'réserver le convoi court avant le mini-plan',
        rivalResponse: 'coupure du convoi partagé',
        riskLevel: 'high',
        reason: 'À surveiller: approvisionnement tendu',
        targetId: 'front-a',
      },
    ],
  });
  assert.deepEqual(shell.miniPlanRivalResponseFallback, {
    empty: true,
    fallbackBranchId: null,
    action: null,
    reason: 'branche recommandée encore sûre',
    cost: null,
    targetId: null,
  });
  assert.deepEqual(shell.miniPlanFallbackReturnCue, {
    empty: true,
    decision: 'none',
    condition: 'aucun retour à arbitrer',
    switchCost: null,
    reason: null,
    initialBranchId: null,
    fallbackBranchId: null,
  });
  assert.deepEqual(shell.miniPlanReturnProtectionStatus, {
    empty: true,
    state: 'none',
    label: 'protection non évaluée',
    constraint: null,
    nextDecision: null,
    reason: null,
  });
  assert.deepEqual(shell.miniPlanConfidenceSignalCue, {
    empty: true,
    decision: 'none',
    label: 'confiance non évaluée',
    signal: null,
    waitCost: null,
  });
  assert.deepEqual(shell.miniPlanDecisionReversibilityCue, {
    empty: true,
    state: 'none',
    label: 'réversibilité non évaluée',
    constraint: null,
    nextStep: null,
  });
  assert.deepEqual(shell.miniPlanLastSafeCorrectionCue, {
    empty: true,
    state: 'none',
    label: 'fenêtre correction inconnue',
    constraint: null,
    nextStep: null,
  });
  assert.deepEqual(shell.miniPlanLateCorrectionExitCost, {
    empty: true,
    severity: 'none',
    label: 'coût de sortie inconnu',
    loss: null,
    decision: null,
  });
  assert.deepEqual(shell.miniPlanMinimalFollowThrough, {
    empty: true,
    level: 'none',
    label: 'aucun suivi critique',
    support: null,
    action: null,
  });
  assert.deepEqual(shell.miniPlanFollowThroughOpportunityTradeoff, {
    empty: true,
    state: 'no-conflict',
    label: 'suivi sans conflit',
    constraint: null,
    action: null,
  });
  assert.deepEqual(shell.miniPlanSafestTacticalFallback, {
    empty: true,
    state: 'unneeded',
    label: 'repli inutile',
    constraint: null,
    action: null,
  });
  assert.deepEqual(shell.miniPlanNextTurnHoldPlan, {
    empty: true,
    label: 'plan prochain tour non requis',
    action: null,
    constraint: null,
    riskIfIgnored: null,
  });
  assert.deepEqual(shell.miniPlanHoldReleaseCue, {
    empty: true,
    state: 'safe-release',
    label: 'relâchement sûr',
    constraint: null,
    action: null,
  });
  assert.deepEqual(shell.miniPlanFirstSafeReengagement, {
    empty: true,
    state: 'main-safe',
    label: 'réengagement principal sûr',
    constraint: null,
    action: null,
  });
  assert.deepEqual(shell.miniPlanPrematureReengagementRisk, {
    empty: true,
    state: 'ready',
    label: 'fenêtre prête',
    risk: null,
    nextSafe: null,
  });
});

test('StrategicMapShell builds a compact executable follow-up cleanup mini-plan', () => {
  const readiness = buildTopFollowUpReadiness([
    {
      cleanupOrderLabel: 'Surveiller risque restant',
      residualRiskKey: 'watch:front-a',
      targetId: 'front-a',
      riskCovered: 'alerte diffuse',
    },
  ]);

  assert.deepEqual(buildFollowUpCleanupMiniPlan([
    {
      cleanupOrderLabel: 'Surveiller risque restant',
      residualRiskKey: 'watch:front-a',
      targetId: 'front-a',
      riskCovered: 'alerte diffuse',
    },
  ], [{ key: 'watch:front-a', label: 'alerte diffuse' }], readiness), {
    empty: false,
    reason: 'Prêt maintenant',
    targetId: 'front-a',
    steps: [
      {
        stepId: 'followup-cleanup:watch:front-a',
        order: 1,
        label: 'Surveiller risque restant',
        prerequisite: 'aucun bloqueur visible',
        riskReduced: 'alerte diffuse',
        untreatedRisk: 'aucun risque visible',
        state: 'execute-cleanup',
      },
    ],
  });
  assert.deepEqual(buildFollowUpCleanupMiniPlan([], [], buildTopFollowUpReadiness([], [])), {
    empty: true,
    reason: 'aucun cleanup suivi sûr',
    targetId: null,
    steps: [],
  });
});

test('StrategicMapShell surfaces dependency conflicts around the follow-up mini-plan', () => {
  const miniPlan = {
    empty: false,
    steps: [
      { state: 'execute-cleanup', label: 'Scanner axe détour', riskReduced: 'axe encore exposé', untreatedRisk: 'loyauté basse' },
    ],
  };
  const readiness = { state: 'ready-now', residualRiskKey: 'route-exposure:front-a' };

  assert.deepEqual(buildMiniPlanDependencyConflicts(miniPlan, [
    { key: 'route-exposure:front-a', label: 'axe encore exposé', reason: 'exposition route 21' },
    { key: 'neighbor-front:front-b', label: 'front voisin fragile', reason: 'ordre prioritaire reste à 88' },
    { key: 'low-loyalty:front-a', label: 'loyauté basse', reason: 'loyauté 42' },
  ], readiness), [
    {
      conflictId: 'mini-plan-conflict:neighbor-front:front-b',
      severity: 'blocking',
      label: 'Priorité voisine',
      reason: 'ordre prioritaire reste à 88',
      mitigation: 'caler une couverture voisine minimale',
      residualRiskKey: 'neighbor-front:front-b',
      targetId: 'front-b',
    },
    {
      conflictId: 'mini-plan-conflict:low-loyalty:front-a',
      severity: 'watchable',
      label: 'Loyauté à suivre',
      reason: 'loyauté 42',
      mitigation: 'envoyer liaison si le plan dure',
      residualRiskKey: 'low-loyalty:front-a',
      targetId: 'front-a',
    },
  ]);
  assert.deepEqual(buildMiniPlanDependencyConflicts({ empty: true }, [
    { key: 'supply-pressure:front-a', label: 'pression ravitaillement' },
  ], readiness), []);
});

test('StrategicMapShell turns mini-plan conflicts into explicit choose-one tradeoffs', () => {
  const miniPlan = {
    empty: false,
    steps: [
      { state: 'execute-cleanup', label: 'Scanner axe détour', untreatedRisk: 'front voisin fragile' },
    ],
  };

  assert.deepEqual(buildMiniPlanConflictTradeoffs(miniPlan, [
    {
      conflictId: 'mini-plan-conflict:neighbor-front:front-b',
      severity: 'blocking',
      label: 'Priorité voisine',
      reason: 'ordre prioritaire reste à 88',
      mitigation: 'caler une couverture voisine minimale',
      residualRiskKey: 'neighbor-front:front-b',
      targetId: 'front-b',
    },
    {
      conflictId: 'mini-plan-conflict:low-loyalty:front-a',
      severity: 'watchable',
      label: 'Loyauté à suivre',
      reason: 'loyauté 42',
      mitigation: 'envoyer liaison si le plan dure',
      residualRiskKey: 'low-loyalty:front-a',
      targetId: 'front-a',
    },
  ]), [
    {
      tradeoffId: 'mini-plan-tradeoff:neighbor-front:front-b',
      conflictId: 'mini-plan-conflict:neighbor-front:front-b',
      severity: 'blocking',
      reason: 'ordre prioritaire reste à 88',
      recommendedChoice: 'caler une couverture voisine minimale',
      rejectedChoice: 'Scanner axe détour',
      rejectedCost: 'retarde Scanner axe détour',
      label: 'prioriser priorité voisine',
      targetId: 'front-b',
    },
    {
      tradeoffId: 'mini-plan-tradeoff:low-loyalty:front-a',
      conflictId: 'mini-plan-conflict:low-loyalty:front-a',
      severity: 'watchable',
      reason: 'loyauté 42',
      recommendedChoice: 'Scanner axe détour',
      rejectedChoice: 'envoyer liaison si le plan dure',
      rejectedCost: 'laisse loyauté à suivre sous surveillance',
      label: 'continuer malgré loyauté à suivre',
      targetId: 'front-a',
    },
  ]);
  assert.deepEqual(buildMiniPlanConflictTradeoffs({ empty: true }, [
    { severity: 'blocking', residualRiskKey: 'supply-pressure:front-a' },
  ]), []);
});

test('StrategicMapShell previews the action unlocked by the recommended mini-plan tradeoff', () => {
  const miniPlan = {
    empty: false,
    targetId: 'front-a',
    steps: [
      {
        state: 'execute-cleanup',
        label: 'Scanner axe détour',
        prerequisite: 'éclaireurs disponibles',
        riskReduced: 'axe encore exposé',
      },
    ],
  };

  assert.deepEqual(buildMiniPlanTradeoffActionPreview(miniPlan, [
    {
      tradeoffId: 'mini-plan-tradeoff:neighbor-front:front-b',
      severity: 'blocking',
      reason: 'ordre prioritaire reste à 88',
      recommendedChoice: 'caler une couverture voisine minimale',
      rejectedChoice: 'Scanner axe détour',
      targetId: 'front-b',
    },
  ]), {
    empty: false,
    reason: 'ordre prioritaire reste à 88',
    tradeoffId: 'mini-plan-tradeoff:neighbor-front:front-b',
    targetId: 'front-b',
    action: 'caler une couverture voisine minimale',
    prerequisite: 'ordre prioritaire reste à 88',
    expectedBenefit: 'débloque Scanner axe détour',
  });
  assert.deepEqual(buildMiniPlanTradeoffActionPreview(miniPlan, [
    {
      tradeoffId: 'mini-plan-tradeoff:low-loyalty:front-a',
      severity: 'watchable',
      reason: 'loyauté 42',
      recommendedChoice: 'Scanner axe détour',
      rejectedChoice: 'envoyer liaison si le plan dure',
      targetId: 'front-a',
    },
  ]).expectedBenefit, 'réduit axe encore exposé');
  assert.deepEqual(buildMiniPlanTradeoffActionPreview({ empty: true }, []), {
    empty: true,
    reason: 'aucun arbitrage actionnable',
    tradeoffId: null,
    targetId: null,
    action: null,
    prerequisite: null,
    expectedBenefit: null,
  });
});

test('StrategicMapShell shows the rival response risk that can invalidate a chosen tradeoff', () => {
  assert.deepEqual(buildMiniPlanRivalResponseRisk({
    empty: false,
    reason: 'ordre prioritaire reste à 88',
    tradeoffId: 'mini-plan-tradeoff:neighbor-front:front-b',
    targetId: 'front-b',
    action: 'caler une couverture voisine minimale',
  }, [{
    tradeoffId: 'mini-plan-tradeoff:neighbor-front:front-b',
    severity: 'blocking',
    reason: 'ordre prioritaire reste à 88',
    targetId: 'front-b',
  }]), {
    empty: false,
    level: 'high',
    label: 'Risque élevé',
    response: 'contre-poussée du front voisin',
    watch: 'À surveiller: ordre prioritaire reste à 88',
    tradeoffId: 'mini-plan-tradeoff:neighbor-front:front-b',
    targetId: 'front-b',
  });
  assert.deepEqual(buildMiniPlanRivalResponseRisk({
    empty: false,
    reason: 'loyauté 42',
    tradeoffId: 'mini-plan-tradeoff:low-loyalty:front-a',
    targetId: 'front-a',
    action: 'Scanner axe détour',
  }, [{
    tradeoffId: 'mini-plan-tradeoff:low-loyalty:front-a',
    severity: 'watchable',
    reason: 'loyauté 42',
  }]).level, 'medium');
  assert.deepEqual(buildMiniPlanRivalResponseRisk({ empty: true }, []), {
    empty: true,
    level: 'low',
    label: 'Risque faible',
    response: 'aucune réponse adverse lisible',
    watch: null,
    tradeoffId: null,
    targetId: null,
  });
});

test('StrategicMapShell compares rival responses across mini-plan branches before commitment', () => {
  const miniPlan = {
    empty: false,
    targetId: 'front-a',
    steps: [
      { state: 'execute-cleanup', label: 'Scanner axe détour', riskReduced: 'axe encore exposé' },
    ],
  };
  const comparison = buildMiniPlanRivalResponseComparison(miniPlan, [
    {
      tradeoffId: 'mini-plan-tradeoff:neighbor-front:front-b',
      severity: 'blocking',
      reason: 'ordre prioritaire reste à 88',
      recommendedChoice: 'caler une couverture voisine minimale',
      rejectedChoice: 'Scanner axe détour',
      targetId: 'front-b',
    },
    {
      tradeoffId: 'mini-plan-tradeoff:low-loyalty:front-a',
      severity: 'watchable',
      reason: 'loyauté 42',
      recommendedChoice: 'Scanner axe détour',
      rejectedChoice: 'envoyer liaison si le plan dure',
      targetId: 'front-a',
    },
  ]);

  assert.equal(comparison.recommendationChanged, true);
  assert.equal(comparison.recommendedTradeoffId, 'mini-plan-tradeoff:low-loyalty:front-a');
  assert.equal(comparison.reason, 'contre-poussée du front voisin rend la branche initiale trop risquée');
  assert.deepEqual(comparison.branches, [
    {
      branchId: 'mini-plan-branch:1:mini-plan-tradeoff:neighbor-front:front-b',
      tradeoffId: 'mini-plan-tradeoff:neighbor-front:front-b',
      recommended: false,
      action: 'caler une couverture voisine minimale',
      rivalResponse: 'contre-poussée du front voisin',
      riskLevel: 'high',
      reason: 'À surveiller: ordre prioritaire reste à 88',
      targetId: 'front-b',
    },
    {
      branchId: 'mini-plan-branch:2:mini-plan-tradeoff:low-loyalty:front-a',
      tradeoffId: 'mini-plan-tradeoff:low-loyalty:front-a',
      recommended: true,
      action: 'Scanner axe détour',
      rivalResponse: 'agitation locale avant liaison',
      riskLevel: 'medium',
      reason: 'À surveiller: loyauté 42',
      targetId: 'front-a',
    },
  ]);
  assert.deepEqual(buildMiniPlanRivalResponseComparison({ empty: true }, []), {
    empty: true,
    recommendedTradeoffId: null,
    recommendationChanged: false,
    reason: 'aucune branche à comparer',
    branches: [],
  });
});

test('StrategicMapShell shows safest fallback when rival response invalidates the recommended branch', () => {
  const comparison = {
    empty: false,
    recommendationChanged: true,
    branches: [
      {
        branchId: 'mini-plan-branch:1:mini-plan-tradeoff:neighbor-front:front-b',
        tradeoffId: 'mini-plan-tradeoff:neighbor-front:front-b',
        recommended: false,
        action: 'caler une couverture voisine minimale',
        rivalResponse: 'contre-poussée du front voisin',
        riskLevel: 'high',
        targetId: 'front-b',
      },
      {
        branchId: 'mini-plan-branch:2:mini-plan-tradeoff:low-loyalty:front-a',
        tradeoffId: 'mini-plan-tradeoff:low-loyalty:front-a',
        recommended: true,
        action: 'Scanner axe détour',
        rivalResponse: 'agitation locale avant liaison',
        riskLevel: 'medium',
        targetId: 'front-a',
      },
    ],
  };

  const fallback = buildMiniPlanRivalResponseFallback(comparison);
  assert.deepEqual(fallback, {
    empty: false,
    fallbackBranchId: 'mini-plan-branch:2:mini-plan-tradeoff:low-loyalty:front-a',
    action: 'Scanner axe détour',
    reason: 'agitation locale avant liaison reste medium, contre contre-poussée du front voisin',
    cost: 'cible moins prioritaire: front-a',
    targetId: 'front-a',
  });
  const returnCue = buildMiniPlanFallbackReturnCue(fallback, comparison);
  assert.deepEqual(returnCue, {
    empty: false,
    decision: 'keep-fallback',
    condition: 'revenir quand front-b devient moins exposée',
    switchCost: 'changer encore consomme cible moins prioritaire: front-a',
    reason: 'garder le fallback tant que contre-poussée du front voisin reste high',
    initialBranchId: 'mini-plan-branch:1:mini-plan-tradeoff:neighbor-front:front-b',
    fallbackBranchId: 'mini-plan-branch:2:mini-plan-tradeoff:low-loyalty:front-a',
  });
  const protection = buildMiniPlanReturnProtectionStatus(returnCue, fallback, comparison);
  assert.deepEqual(protection, {
    empty: false,
    state: 'lost',
    label: 'protection perdue',
    constraint: 'contre-poussée du front voisin',
    nextDecision: 'confirm-fallback',
    reason: 'confirmer le fallback: contre-poussée du front voisin reste plus dangereux',
  });
  const confidence = buildMiniPlanConfidenceSignalCue(protection, returnCue, fallback);
  assert.deepEqual(confidence, {
    empty: false,
    decision: 'hold-fallback',
    label: 'tenir fallback',
    signal: 'contre-poussée du front voisin encore actif',
    waitCost: 'attendre trop longtemps coûte cible moins prioritaire: front-a',
  });
  const reversibility = buildMiniPlanDecisionReversibilityCue(confidence, fallback);
  assert.deepEqual(reversibility, {
    empty: false,
    state: 'locked',
    label: 'quasi verrouillée',
    constraint: 'position moins prioritaire',
    nextStep: null,
  });
  const lastSafe = buildMiniPlanLastSafeCorrectionCue(reversibility);
  assert.deepEqual(lastSafe, {
    empty: false,
    state: 'locked-commitment',
    label: 'engagement verrouillé',
    constraint: 'position moins prioritaire',
    nextStep: null,
  });
  const exitCost = buildMiniPlanLateCorrectionExitCost(lastSafe);
  assert.deepEqual(exitCost, {
    empty: false,
    severity: 'deterrent',
    label: 'coût dissuasif',
    loss: 'position',
    decision: 'attendre sans nouvelle correction',
  });
  const followThrough = buildMiniPlanMinimalFollowThrough(exitCost);
  assert.deepEqual(followThrough, {
    empty: false,
    level: 'urgent',
    label: 'suivi urgent',
    support: 'position',
    action: 'protéger position',
  });
  const opportunityTradeoff = buildMiniPlanFollowThroughOpportunityTradeoff(followThrough);
  assert.deepEqual(opportunityTradeoff, {
    empty: false,
    state: 'opportunity-threatened',
    label: 'opportunité menacée',
    constraint: 'position',
    action: 'reporter l’opportunité',
  });
  const tacticalFallback = buildMiniPlanSafestTacticalFallback(opportunityTradeoff);
  assert.deepEqual(tacticalFallback, {
    empty: false,
    state: 'urgent-save-opportunity',
    label: 'repli urgent pour sauver l’opportunité',
    constraint: 'position',
    action: 'exploiter maintenant',
  });
  const holdPlan = buildMiniPlanNextTurnHoldPlan(tacticalFallback);
  assert.deepEqual(holdPlan, {
    empty: false,
    label: 'tenir ouverture sauvée',
    action: 'verrouiller exploitation',
    constraint: 'position',
    riskIfIgnored: 'position se rouvre',
  });
  const releaseCue = buildMiniPlanHoldReleaseCue(holdPlan);
  assert.deepEqual(releaseCue, {
    empty: false,
    state: 'hold-required',
    label: 'maintien encore requis',
    constraint: 'front exposé',
    action: 'tenir écran',
  });
  const reengagement = buildMiniPlanFirstSafeReengagement(releaseCue);
  assert.deepEqual(reengagement, {
    empty: false,
    state: 'defensive-stance',
    label: 'rester en posture défensive',
    constraint: 'front voisin instable',
    action: 'garder écran',
  });
  assert.deepEqual(buildMiniPlanPrematureReengagementRisk(reengagement), {
    empty: false,
    state: 'too-early',
    label: 'réengagement prématuré',
    risk: 'front repris à revers',
    nextSafe: 'attendre test limité',
  });
  assert.deepEqual(buildMiniPlanRivalResponseFallback({
    empty: false,
    branches: [{ branchId: 'one', action: 'A', rivalResponse: 'r', riskLevel: 'medium' }],
  }), {
    empty: true,
    fallbackBranchId: null,
    action: null,
    reason: 'branche recommandée encore sûre',
    cost: null,
    targetId: null,
  });
});

test('StrategicMapShell distinguishes keeping fallback from returning to original branch', () => {
  const fallback = {
    empty: false,
    fallbackBranchId: 'fallback',
    action: 'retour initial surveillé',
    reason: 'risque abaissé',
    cost: 'bénéfice moindre mais risque équivalent',
    targetId: 'front-a',
  };
  const comparison = {
    empty: false,
    branches: [
      { branchId: 'initial', action: 'branche initiale', rivalResponse: 'agitation locale avant liaison', riskLevel: 'medium', targetId: 'front-a' },
      { branchId: 'fallback', action: 'fallback', rivalResponse: 'veille adverse', riskLevel: 'medium', targetId: 'front-a' },
    ],
  };

  const returnCue = buildMiniPlanFallbackReturnCue(fallback, comparison);
  assert.deepEqual(returnCue, {
    empty: false,
    decision: 'return-initial',
    condition: 'revenir quand la réponse rivale se dissipe',
    switchCost: 'changer encore consomme bénéfice moindre mais risque équivalent',
    reason: 'revenir à la branche initiale si son risque retombe au niveau medium',
    initialBranchId: 'initial',
    fallbackBranchId: 'fallback',
  });
  const protection = buildMiniPlanReturnProtectionStatus(returnCue, fallback, comparison);
  assert.deepEqual(protection, {
    empty: false,
    state: 'partial',
    label: 'protection partielle',
    constraint: 'agitation locale avant liaison',
    nextDecision: 'wait-signal',
    reason: 'attendre un signal: revenir quand la réponse rivale se dissipe',
  });
  const confidence = buildMiniPlanConfidenceSignalCue(protection, returnCue, fallback);
  assert.deepEqual(confidence, {
    empty: false,
    decision: 'wait-confidence',
    label: 'attendre signal confiance',
    signal: 'revenir quand la réponse rivale se dissipe',
    waitCost: 'attendre trop longtemps coûte bénéfice moindre mais risque équivalent',
  });
  const reversibility = buildMiniPlanDecisionReversibilityCue(confidence, fallback);
  assert.deepEqual(reversibility, {
    empty: false,
    state: 'reversible',
    label: 'réversible',
    constraint: 'coût d’opportunité',
    nextStep: 'garder un ordre court en réserve',
  });
  const lastSafe = buildMiniPlanLastSafeCorrectionCue(reversibility);
  assert.deepEqual(lastSafe, {
    empty: false,
    state: 'safe-correction',
    label: 'correction encore sûre',
    constraint: 'coût d’opportunité',
    nextStep: 'préparer correction courte',
  });
  const exitCost = buildMiniPlanLateCorrectionExitCost(lastSafe);
  assert.deepEqual(exitCost, {
    empty: false,
    severity: 'light',
    label: 'coût léger',
    loss: 'opportunité rivale',
    decision: 'corriger maintenant',
  });
  const followThrough = buildMiniPlanMinimalFollowThrough(exitCost);
  assert.deepEqual(followThrough, {
    empty: false,
    level: 'none',
    label: 'aucun suivi critique',
    support: 'opportunité rivale',
    action: 'surveiller',
  });
  const opportunityTradeoff = buildMiniPlanFollowThroughOpportunityTradeoff(followThrough);
  assert.deepEqual(opportunityTradeoff, {
    empty: false,
    state: 'no-conflict',
    label: 'suivi sans conflit',
    constraint: 'opportunité rivale',
    action: 'suivre maintenant',
  });
  const tacticalFallback = buildMiniPlanSafestTacticalFallback(opportunityTradeoff);
  assert.deepEqual(tacticalFallback, {
    empty: false,
    state: 'unneeded',
    label: 'repli inutile',
    constraint: 'fenêtre d’opportunité',
    action: 'exploiter maintenant',
  });
  const holdPlan = buildMiniPlanNextTurnHoldPlan(tacticalFallback);
  assert.deepEqual(holdPlan, {
    empty: false,
    label: 'tenir exploitation simple',
    action: 'maintenir tempo',
    constraint: 'fenêtre d’opportunité',
    riskIfIgnored: 'fenêtre d’opportunité se referme',
  });
  const releaseCue = buildMiniPlanHoldReleaseCue(holdPlan);
  assert.deepEqual(releaseCue, {
    empty: false,
    state: 'safe-release',
    label: 'relâchement sûr',
    constraint: 'opportunité encore fragile',
    action: null,
  });
  const reengagement = buildMiniPlanFirstSafeReengagement(releaseCue);
  assert.deepEqual(reengagement, {
    empty: false,
    state: 'main-safe',
    label: 'réengagement principal sûr',
    constraint: 'opportunité trop fragile',
    action: null,
  });
  assert.deepEqual(buildMiniPlanPrematureReengagementRisk(reengagement), {
    empty: false,
    state: 'ready',
    label: 'fenêtre prête',
    risk: 'risque contenu',
    nextSafe: 'pousser maintenant',
  });
  assert.deepEqual(buildMiniPlanFallbackReturnCue(null, comparison), {
    empty: true,
    decision: 'none',
    condition: 'aucun retour à arbitrer',
    switchCost: null,
    reason: null,
    initialBranchId: null,
    fallbackBranchId: null,
  });
});

test('StrategicMapShell reports whether returning keeps rival-response protection', () => {
  const fallback = {
    empty: false,
    fallbackBranchId: 'fallback',
    cost: 'délai avant branche initiale',
  };
  const returnCue = {
    empty: false,
    initialBranchId: 'initial',
    fallbackBranchId: 'fallback',
    condition: 'revenir quand le délai rival est absorbé',
  };
  const comparison = {
    empty: false,
    branches: [
      { branchId: 'initial', rivalResponse: 'coupure du convoi partagé', riskLevel: 'low' },
      { branchId: 'fallback', rivalResponse: 'veille adverse', riskLevel: 'medium' },
    ],
  };

  const protection = buildMiniPlanReturnProtectionStatus(returnCue, fallback, comparison);
  assert.deepEqual(protection, {
    empty: false,
    state: 'kept',
    label: 'protection conservée',
    constraint: 'coupure du convoi partagé',
    nextDecision: 'return-now',
    reason: 'revenir maintenant: le risque initial ne dépasse plus le fallback',
  });
  const confidence = buildMiniPlanConfidenceSignalCue(protection, returnCue, fallback);
  assert.deepEqual(confidence, {
    empty: false,
    decision: 'return-confirmed',
    label: 'retour confirmé',
    signal: 'risque initial revenu sous le fallback',
    waitCost: 'attendre trop longtemps coûte délai avant branche initiale',
  });
  const reversibility = buildMiniPlanDecisionReversibilityCue(confidence, fallback);
  assert.deepEqual(reversibility, {
    empty: false,
    state: 'costly',
    label: 'correction coûteuse',
    constraint: 'tempo rival',
    nextStep: 'préserver un tempo de correction',
  });
  const lastSafe = buildMiniPlanLastSafeCorrectionCue(reversibility);
  assert.deepEqual(lastSafe, {
    empty: false,
    state: 'last-correction-turn',
    label: 'dernier tour de correction',
    constraint: 'tempo rival',
    nextStep: 'corriger maintenant ou assumer',
  });
  const exitCost = buildMiniPlanLateCorrectionExitCost(lastSafe);
  assert.deepEqual(exitCost, {
    empty: false,
    severity: 'costly',
    label: 'coûteux mais possible',
    loss: 'tempo',
    decision: 'assumer le plan',
  });
  const followThrough = buildMiniPlanMinimalFollowThrough(exitCost);
  assert.deepEqual(followThrough, {
    empty: false,
    level: 'advised',
    label: 'suivi conseillé',
    support: 'tempo',
    action: 'consolider',
  });
  const opportunityTradeoff = buildMiniPlanFollowThroughOpportunityTradeoff(followThrough);
  assert.deepEqual(opportunityTradeoff, {
    empty: false,
    state: 'manageable-conflict',
    label: 'conflit gérable',
    constraint: 'tempo',
    action: 'limiter l’engagement',
  });
  const tacticalFallback = buildMiniPlanSafestTacticalFallback(opportunityTradeoff);
  assert.deepEqual(tacticalFallback, {
    empty: false,
    state: 'value-advised',
    label: 'repli de valeur conseillé',
    constraint: 'tempo',
    action: 'sécuriser puis exploiter',
  });
  const holdPlan = buildMiniPlanNextTurnHoldPlan(tacticalFallback);
  assert.deepEqual(holdPlan, {
    empty: false,
    label: 'tenir repli de valeur',
    action: 'garder réserve courte',
    constraint: 'tempo',
    riskIfIgnored: 'tempo repris par le rival',
  });
  const releaseCue = buildMiniPlanHoldReleaseCue(holdPlan);
  assert.deepEqual(releaseCue, {
    empty: false,
    state: 'cautious-release',
    label: 'relâchement prudent possible',
    constraint: 'menace voisine',
    action: 'surveiller voisin',
  });
  const reengagement = buildMiniPlanFirstSafeReengagement(releaseCue);
  assert.deepEqual(reengagement, {
    empty: false,
    state: 'limited-reengagement',
    label: 'réengagement limité possible',
    constraint: 'menace non résolue',
    action: 'tester avancée',
  });
  assert.deepEqual(buildMiniPlanPrematureReengagementRisk(reengagement), {
    empty: false,
    state: 'partial-window',
    label: 'risque si poussée totale',
    risk: 'menace convertie en blocage',
    nextSafe: 'attendre fenêtre principale',
  });
  assert.deepEqual(buildMiniPlanReturnProtectionStatus(null, fallback, comparison), {
    empty: true,
    state: 'none',
    label: 'protection non évaluée',
    constraint: null,
    nextDecision: null,
    reason: null,
  });
  assert.deepEqual(buildMiniPlanConfidenceSignalCue(null, returnCue, fallback), {
    empty: true,
    decision: 'none',
    label: 'confiance non évaluée',
    signal: null,
    waitCost: null,
  });
  assert.deepEqual(buildMiniPlanDecisionReversibilityCue(null, fallback), {
    empty: true,
    state: 'none',
    label: 'réversibilité non évaluée',
    constraint: null,
    nextStep: null,
  });
  assert.deepEqual(buildMiniPlanLastSafeCorrectionCue(null), {
    empty: true,
    state: 'none',
    label: 'fenêtre correction inconnue',
    constraint: null,
    nextStep: null,
  });
  assert.deepEqual(buildMiniPlanLateCorrectionExitCost(null), {
    empty: true,
    severity: 'none',
    label: 'coût de sortie inconnu',
    loss: null,
    decision: null,
  });
  assert.deepEqual(buildMiniPlanMinimalFollowThrough(null), {
    empty: true,
    level: 'none',
    label: 'aucun suivi critique',
    support: null,
    action: null,
  });
  assert.deepEqual(buildMiniPlanFollowThroughOpportunityTradeoff(null), {
    empty: true,
    state: 'no-conflict',
    label: 'suivi sans conflit',
    constraint: null,
    action: null,
  });
  assert.deepEqual(buildMiniPlanSafestTacticalFallback(null), {
    empty: true,
    state: 'unneeded',
    label: 'repli inutile',
    constraint: null,
    action: null,
  });
  assert.deepEqual(buildMiniPlanNextTurnHoldPlan(null), {
    empty: true,
    label: 'plan prochain tour non requis',
    action: null,
    constraint: null,
    riskIfIgnored: null,
  });
  assert.deepEqual(buildMiniPlanHoldReleaseCue(null), {
    empty: true,
    state: 'safe-release',
    label: 'relâchement sûr',
    constraint: null,
    action: null,
  });
  assert.deepEqual(buildMiniPlanFirstSafeReengagement(null), {
    empty: true,
    state: 'main-safe',
    label: 'réengagement principal sûr',
    constraint: null,
    action: null,
  });
  assert.deepEqual(buildMiniPlanPrematureReengagementRisk(null), {
    empty: true,
    state: 'ready',
    label: 'fenêtre prête',
    risk: null,
    nextSafe: null,
  });
});

test('StrategicMapShell explains deterministic readiness blockers for the top follow-up', () => {
  assert.deepEqual(buildTopFollowUpReadiness([], []), {
    state: 'no-safe-followup',
    tone: 'neutral',
    label: 'Aucun suivi sûr',
    blocker: 'aucun cleanup de suivi exploitable',
    action: null,
    targetId: null,
    residualRiskKey: null,
  });
  assert.deepEqual(buildTopFollowUpReadiness([
    { residualRiskKey: 'supply-pressure:front-a', targetId: 'front-a', rankReason: 'approvisionnement tendu' },
  ], [{ key: 'supply-pressure:front-a', reason: 'approvisionnement tendu' }]).state, 'supply-pressure');
  assert.deepEqual(buildTopFollowUpReadiness([
    { residualRiskKey: 'low-loyalty:front-a', targetId: 'front-a', prerequisite: 'émissaire disponible' },
  ]).state, 'stabilize-control');
  assert.deepEqual(buildTopFollowUpReadiness([
    { residualRiskKey: 'watch:front-a', targetId: 'front-a', cleanupOrderLabel: 'Surveiller risque restant' },
  ]).state, 'ready-now');
});

test('StrategicMapShell returns empty follow-up cleanup choices when no follow-up is useful', () => {
  assert.deepEqual(buildFollowUpCleanupChoices([
    { id: 'cleanup:first', residualRiskKey: 'low-loyalty:front-a', riskReduced: 'loyauté basse' },
  ], [{ key: 'low-loyalty:front-a', label: 'loyauté basse' }], {
    cleanupOrderId: 'cleanup:first',
    residualRiskKey: 'low-loyalty:front-a',
  }), []);
  assert.deepEqual(buildStrategicMapShell([], {}).followUpCleanupChoices, []);
});

test('StrategicMapShell returns a neutral cleanup payoff when no cleanup order is useful', () => {
  assert.equal(buildFirstCleanupPayoff([], [{ key: 'low-loyalty:front-a', label: 'loyauté basse' }]), null);
  assert.equal(buildStrategicMapShell([], {}).firstCleanupPayoff, null);
  assert.throws(() => buildStrategicMapShell([], { cleanupOrders: {} }), /cleanupOrders must be an array/);
  assert.throws(() => buildStrategicMapShell([], { residualRisks: {} }), /residualRisks must be an array/);
});

test('StrategicMapShell falls back to default title and validates inputs', () => {
  const shell = buildStrategicMapShell([], {});

  assert.equal(shell.title, 'Carte stratégique');
  assert.equal(shell.stats.provinceCount, 0);
  assert.equal(shell.activeProvince, null);
  assert.throws(() => buildStrategicMapShell(null), /StrategicMapShell provinces must be an array/);
  assert.throws(() => buildStrategicMapShell([{}]), /StrategicMapShell provinces must contain Province instances/);
  assert.throws(() => buildStrategicMapShell([], null), /StrategicMapShell options must be an object/);
  assert.throws(() => buildStrategicMapShell([], { overlaySlots: null }), /overlaySlots must be an array/);
  assert.throws(() => buildStrategicMapShell([], { factionMetaById: [] }), /factionMetaById must be an object/);
  assert.throws(() => buildStrategicMapShell([], { provinceGeometryById: [] }), /provinceGeometryById must be an object/);
});
