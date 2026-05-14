import test from 'node:test';
import assert from 'node:assert/strict';

import { Province } from '../../../src/domain/war/Province.js';
import {
  buildFirstCleanupPayoff,
  buildFollowUpCleanupChoices,
  buildFollowUpCleanupMiniPlan,
  buildMiniPlanConflictTradeoffs,
  buildMiniPlanDependencyConflicts,
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
    { selected: false, focused: true, hovered: true },
    { selected: true, focused: false, hovered: false },
  ]);
  assert.deepEqual(shell.provinces[0].geometry.layout, { x: 10, y: 12, w: 20, h: 18 });
  assert.equal(shell.provinces[0].geometry.shape, 'polygon(10% 12%, 30% 12%, 30% 30%, 10% 30%)');
  assert.equal(shell.provinces[1].geometry.layout, null);
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
