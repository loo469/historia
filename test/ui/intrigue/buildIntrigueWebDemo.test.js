import test from 'node:test';
import assert from 'node:assert/strict';

import { Cellule } from '../../../src/domain/intrigue/Cellule.js';
import { OperationClandestine } from '../../../src/domain/intrigue/OperationClandestine.js';
import { buildIntrigueWebDemo } from '../../../src/ui/intrigue/buildIntrigueWebDemo.js';

test('buildIntrigueWebDemo assembles alert badge, hotspots, and panels for the web demo', () => {
  const demo = buildIntrigueWebDemo({
    alertLevel: 'critique',
    cellules: [
      new Cellule({
        id: 'cell-ash-1',
        factionId: 'shadow-league',
        codename: 'Veil',
        locationId: 'ashlands',
        memberIds: ['ag-1'],
        assetIds: ['asset-1'],
        secrecy: 72,
        loyalty: 66,
        exposure: 21,
      }),
      new Cellule({
        id: 'cell-ash-2',
        factionId: 'shadow-league',
        codename: 'Cinder',
        locationId: 'ashlands',
        memberIds: ['ag-2'],
        assetIds: ['asset-2'],
        secrecy: 49,
        loyalty: 55,
        exposure: 74,
        sleeper: true,
      }),
      new Cellule({
        id: 'cell-river-1',
        factionId: 'shadow-league',
        codename: 'Mist',
        locationId: 'riverlands',
        memberIds: ['ag-3'],
        assetIds: ['asset-3'],
        secrecy: 61,
        loyalty: 62,
        exposure: 15,
      }),
    ],
    operations: [
      new OperationClandestine({
        id: 'op-ash-1',
        celluleId: 'cell-ash-1',
        targetFactionId: 'sun-empire',
        type: 'sabotage',
        objective: 'Cut the signal towers',
        theaterId: 'ashlands',
        assignedAgentIds: ['ag-1'],
        requiredAssetIds: ['asset-1'],
        detectionRisk: 20,
        progress: 58,
        heat: 44,
        phase: 'execution',
      }),
      new OperationClandestine({
        id: 'op-river-1',
        celluleId: 'cell-river-1',
        targetFactionId: 'sun-empire',
        type: 'sabotage',
        objective: 'Poison the ferries',
        theaterId: 'riverlands',
        assignedAgentIds: ['ag-3'],
        requiredAssetIds: ['asset-3'],
        detectionRisk: 70,
        progress: 20,
        heat: 10,
        phase: 'infiltration',
      }),
      new OperationClandestine({
        id: 'op-rumor',
        celluleId: 'cell-river-1',
        targetFactionId: 'sun-empire',
        type: 'rumor',
        objective: 'Spread false orders',
        theaterId: 'riverlands',
        assignedAgentIds: ['ag-3'],
        requiredAssetIds: ['asset-3'],
        phase: 'execution',
      }),
    ],
  }, {
    locationNames: {
      ashlands: 'Ashlands',
      riverlands: 'Riverlands',
    },
  });

  assert.equal(demo.title, 'Couches intrigue');
  assert.equal(demo.summary, '1 foyers critiques, 2 sabotages actifs, alerte critique');
  assert.equal(demo.alertBadge.level.code, 'critique');
  assert.equal(demo.map.entries.length, 2);
  assert.deepEqual(demo.map.entries[0].drillDown, {
    locationId: 'ashlands',
    locationName: 'Ashlands',
    signalType: 'sabotage',
    severity: 'critical',
    criticality: 'critical',
    riskBand: 'moyen',
    affectedFactionIds: ['shadow-league'],
    targetFactionIds: ['sun-empire'],
    primaryCelluleId: 'cell-ash-2',
    primaryOperationId: 'op-ash-1',
    summary: 'Risque sabotage medium (61)',
    reasons: ['Risque sabotage medium (61)', '1 cellule exposée', '1 cellule dormante', '1 opération active'],
    actionHint: 'Prioriser les contre-mesures locales et réduire les fenêtres de sabotage.',
    actionHints: [
      {
        code: 'renforcer-securite',
        label: 'Renforcer sécurité',
        priority: 'high',
        description: 'Prioriser les contre-mesures locales et réduire les fenêtres de sabotage.',
      },
      {
        code: 'enqueter',
        label: 'Enquêter',
        priority: 'high',
        description: 'Identifier les cellules exposées et relier les opérations actives au foyer.',
      },
    ],
    recommendedResponseCode: 'contenir',
    quickResponses: [
      {
        code: 'contenir',
        label: 'Contenir',
        recommended: true,
        cost: '2 ordres sécurité',
        risk: 'Escalade moyen',
        benefit: 'Réduit la fenêtre de sabotage immédiate',
        cooldownTurns: 2,
        heatGenerated: 17,
        escalationProbability: 'moyenne',
        effect: 'cellule compromise: pression sécuritaire immédiate; opération execution ralentie',
        countermeasure: 'Préparer rotation de patrouilles et couverture discrète au tour suivant.',
        summary: '2 ordres sécurité · Escalade moyen · Réduit la fenêtre de sabotage immédiate',
        aftermathSummary: 'Cooldown 2 tours · chaleur +17 · escalade moyenne',
      },
      {
        code: 'infiltrer',
        label: 'Infiltrer',
        recommended: false,
        cost: '1 agent disponible',
        risk: 'Chaleur opérationnelle accrue',
        benefit: 'Identifie cellule, cible ou commanditaire prioritaire',
        cooldownTurns: 3,
        heatGenerated: 14,
        escalationProbability: 'moyenne',
        effect: 'cellule compromise: réseau cartographié sans résolution automatique; opération execution ralentie',
        countermeasure: 'Limiter l’exposition des agents et vérifier les relais compromis.',
        summary: '1 agent disponible · Chaleur opérationnelle accrue · Identifie cellule, cible ou commanditaire prioritaire',
        aftermathSummary: 'Cooldown 3 tours · chaleur +14 · escalade moyenne',
      },
      {
        code: 'exposer',
        label: 'Exposer',
        recommended: false,
        cost: '1 preuve exploitable',
        risk: 'Réseau adverse alerté',
        benefit: 'Convertit une cellule exposée en avantage public',
        cooldownTurns: 1,
        heatGenerated: 23,
        escalationProbability: 'élevée',
        effect: 'cellule compromise: preuve rendue exploitable, réseau adverse alerté',
        countermeasure: 'Coordonner message public et sécuriser témoins avant représailles.',
        summary: '1 preuve exploitable · Réseau adverse alerté · Convertit une cellule exposée en avantage public',
        aftermathSummary: 'Cooldown 1 tour · chaleur +23 · escalade élevée',
      },
    ],
    responseAftermath: {
      safestResponseCode: 'infiltrer',
      mostEffectiveResponseCode: 'contenir',
      retaliationRisk: 'élevé',
      summary: 'Plus sûre: Infiltrer; plus efficace: Contenir; représailles élevé.',
    },
  });
  assert.deepEqual(demo.hotspots, [
    {
      locationId: 'ashlands',
      locationName: 'Ashlands',
      label: 'Ashlands, présence medium, risque sabotage medium',
      severity: 'critical',
      sabotageRiskScore: 61,
      presenceLevel: 'medium',
      sabotageRiskLevel: 'medium',
      exposedCellCount: 1,
      sleeperCellCount: 1,
      celluleCount: 2,
      operationCount: 1,
      visualCue: '◑ elevated',
      drillDown: {
        locationId: 'ashlands',
        locationName: 'Ashlands',
        signalType: 'sabotage',
        severity: 'critical',
        criticality: 'critical',
        riskBand: 'moyen',
        affectedFactionIds: ['shadow-league'],
        targetFactionIds: ['sun-empire'],
        primaryCelluleId: 'cell-ash-2',
        primaryOperationId: 'op-ash-1',
        summary: 'Risque sabotage medium (61)',
        reasons: ['Risque sabotage medium (61)', '1 cellule exposée', '1 cellule dormante', '1 opération active'],
        actionHint: 'Prioriser les contre-mesures locales et réduire les fenêtres de sabotage.',
        actionHints: [
          {
            code: 'renforcer-securite',
            label: 'Renforcer sécurité',
            priority: 'high',
            description: 'Prioriser les contre-mesures locales et réduire les fenêtres de sabotage.',
          },
          {
            code: 'enqueter',
            label: 'Enquêter',
            priority: 'high',
            description: 'Identifier les cellules exposées et relier les opérations actives au foyer.',
          },
        ],
        recommendedResponseCode: 'contenir',
        quickResponses: [
          {
            code: 'contenir',
            label: 'Contenir',
            recommended: true,
            cost: '2 ordres sécurité',
            risk: 'Escalade moyen',
            benefit: 'Réduit la fenêtre de sabotage immédiate',
            cooldownTurns: 2,
            heatGenerated: 17,
            escalationProbability: 'moyenne',
            effect: 'cellule compromise: pression sécuritaire immédiate; opération execution ralentie',
            countermeasure: 'Préparer rotation de patrouilles et couverture discrète au tour suivant.',
            summary: '2 ordres sécurité · Escalade moyen · Réduit la fenêtre de sabotage immédiate',
            aftermathSummary: 'Cooldown 2 tours · chaleur +17 · escalade moyenne',
          },
          {
            code: 'infiltrer',
            label: 'Infiltrer',
            recommended: false,
            cost: '1 agent disponible',
            risk: 'Chaleur opérationnelle accrue',
            benefit: 'Identifie cellule, cible ou commanditaire prioritaire',
            cooldownTurns: 3,
            heatGenerated: 14,
            escalationProbability: 'moyenne',
            effect: 'cellule compromise: réseau cartographié sans résolution automatique; opération execution ralentie',
            countermeasure: 'Limiter l’exposition des agents et vérifier les relais compromis.',
            summary: '1 agent disponible · Chaleur opérationnelle accrue · Identifie cellule, cible ou commanditaire prioritaire',
            aftermathSummary: 'Cooldown 3 tours · chaleur +14 · escalade moyenne',
          },
          {
            code: 'exposer',
            label: 'Exposer',
            recommended: false,
            cost: '1 preuve exploitable',
            risk: 'Réseau adverse alerté',
            benefit: 'Convertit une cellule exposée en avantage public',
            cooldownTurns: 1,
            heatGenerated: 23,
            escalationProbability: 'élevée',
            effect: 'cellule compromise: preuve rendue exploitable, réseau adverse alerté',
            countermeasure: 'Coordonner message public et sécuriser témoins avant représailles.',
            summary: '1 preuve exploitable · Réseau adverse alerté · Convertit une cellule exposée en avantage public',
            aftermathSummary: 'Cooldown 1 tour · chaleur +23 · escalade élevée',
          },
        ],
        responseAftermath: {
          safestResponseCode: 'infiltrer',
          mostEffectiveResponseCode: 'contenir',
          retaliationRisk: 'élevé',
          summary: 'Plus sûre: Infiltrer; plus efficace: Contenir; représailles élevé.',
        },
      },
    },
    {
      locationId: 'riverlands',
      locationName: 'Riverlands',
      label: 'Riverlands, présence low, risque sabotage low',
      severity: 'watch',
      sabotageRiskScore: 20,
      presenceLevel: 'low',
      sabotageRiskLevel: 'low',
      exposedCellCount: 0,
      sleeperCellCount: 0,
      celluleCount: 1,
      operationCount: 1,
      visualCue: '◔ normal',
      drillDown: {
        locationId: 'riverlands',
        locationName: 'Riverlands',
        signalType: 'sabotage',
        severity: 'watch',
        criticality: 'watch',
        riskBand: 'faible',
        affectedFactionIds: ['shadow-league'],
        targetFactionIds: ['sun-empire'],
        primaryCelluleId: 'cell-river-1',
        primaryOperationId: 'op-river-1',
        summary: 'Risque sabotage low (20)',
        reasons: ['Risque sabotage low (20)', '1 opération active'],
        actionHint: 'Conserver un œil léger sur l’activité et la chaleur opérationnelle.',
        actionHints: [
          {
            code: 'surveiller',
            label: 'Surveiller',
            priority: 'low',
            description: 'Conserver un œil léger sur l’activité et la chaleur opérationnelle.',
          },
        ],
        recommendedResponseCode: 'infiltrer',
        quickResponses: [
          {
            code: 'infiltrer',
            label: 'Infiltrer',
            recommended: true,
            cost: '1 agent disponible',
            risk: 'Chaleur opérationnelle accrue',
            benefit: 'Identifie cellule, cible ou commanditaire prioritaire',
            cooldownTurns: 3,
            heatGenerated: 10,
            escalationProbability: 'moyenne',
            effect: 'cellule active: réseau cartographié sans résolution automatique; opération infiltration ralentie',
            countermeasure: 'Limiter l’exposition des agents et vérifier les relais compromis.',
            summary: '1 agent disponible · Chaleur opérationnelle accrue · Identifie cellule, cible ou commanditaire prioritaire',
            aftermathSummary: 'Cooldown 3 tours · chaleur +10 · escalade moyenne',
          },
          {
            code: 'surveiller',
            label: 'Surveiller',
            recommended: false,
            cost: '0 ordre lourd',
            risk: 'Menace différée possible',
            benefit: 'Maintient le signal visible sans encombrer la carte',
            cooldownTurns: 1,
            heatGenerated: 3,
            escalationProbability: 'faible',
            effect: 'cellule active: aucun changement direct, signal maintenu visible',
            countermeasure: 'Recontrôler le hotspot après le prochain tour ou si la chaleur monte.',
            summary: '0 ordre lourd · Menace différée possible · Maintient le signal visible sans encombrer la carte',
            aftermathSummary: 'Cooldown 1 tour · chaleur +3 · escalade faible',
          },
        ],
        responseAftermath: {
          safestResponseCode: 'surveiller',
          mostEffectiveResponseCode: 'infiltrer',
          retaliationRisk: 'modéré',
          summary: 'Plus sûre: Surveiller; plus efficace: Infiltrer; représailles modéré.',
        },
      },
    },
  ]);
  assert.deepEqual(demo.panels.cellules[0], {
    celluleId: 'cell-ash-2',
    codename: 'Cinder',
    locationId: 'ashlands',
    locationName: 'Ashlands',
    status: 'active',
    sleeper: true,
    exposure: 74,
    readiness: 43,
    tone: 'danger',
    statusClass: 'compromised',
    statusLabel: 'Compromise',
    statusMarker: '✕',
    badges: ['compromise', 'loyalty:55', 'secrecy:49'],
  });
  assert.deepEqual(demo.panels.operations[0], {
    operationId: 'op-ash-1',
    type: 'sabotage',
    objective: 'Cut the signal towers',
    locationId: 'ashlands',
    locationName: 'Ashlands',
    phase: 'execution',
    progress: 58,
    heat: 44,
    detectionRisk: 20,
    successWindow: 88,
    tone: 'warning',
  });
  assert.deepEqual(demo.metrics, {
    locationCount: 2,
    celluleCount: 3,
    exposedCellCount: 1,
    sleeperCellCount: 1,
    activeOperationCount: 3,
    activeSabotageCount: 2,
    criticalHotspotCount: 1,
  });
});

test('buildIntrigueWebDemo supports plain payloads and option overrides', () => {
  const demo = buildIntrigueWebDemo({
    alertLevel: 2,
    cellules: [{
      id: 'cell-delta-1',
      factionId: 'shadow-league',
      codename: 'Wake',
      locationId: 'delta',
      memberIds: ['ag-1'],
      assetIds: ['asset-1'],
      secrecy: 60,
      loyalty: 60,
      exposure: 10,
    }],
    operations: [{
      id: 'op-delta-1',
      celluleId: 'cell-delta-1',
      targetFactionId: 'sun-empire',
      type: 'sabotage',
      objective: 'Disable the sluice gates',
      theaterId: 'delta',
      assignedAgentIds: ['ag-1'],
      requiredAssetIds: ['asset-1'],
      detectionRisk: 5,
      progress: 90,
      heat: 30,
      phase: 'execution',
    }],
  }, {
    alertPrefix: 'Sécurité',
    styleByPresence: {
      low: { marker: '✦', color: '#10B981', opacity: 0.7 },
    },
    styleByRisk: {
      high: { stroke: '#111827', fill: '#F59E0B', emphasis: 'critical' },
    },
  });

  assert.equal(demo.alertBadge.text, 'Sécurité Renforcé');
  assert.deepEqual(demo.map.entries[0].style, {
    presence: {
      marker: '✦',
      color: '#10B981',
      opacity: 0.7,
    },
    risk: {
      stroke: '#111827',
      fill: '#F59E0B',
      emphasis: 'critical',
    },
  });
});

test('buildIntrigueWebDemo rejects invalid inputs', () => {
  assert.throws(() => buildIntrigueWebDemo(null), /payload must be an object/);
  assert.throws(() => buildIntrigueWebDemo({ cellules: null, operations: [] }), /payload.cellules must be an array/);
  assert.throws(() => buildIntrigueWebDemo({ cellules: [], operations: null }), /payload.operations must be an array/);
  assert.throws(() => buildIntrigueWebDemo({ cellules: [null], operations: [] }), /Cellule instances or plain objects/);
  assert.throws(() => buildIntrigueWebDemo({ cellules: [], operations: [null] }), /OperationClandestine instances or plain objects/);
  assert.throws(() => buildIntrigueWebDemo({ cellules: [], operations: [] }, null), /options must be an object/);
  assert.throws(() => buildIntrigueWebDemo({ cellules: [], operations: [] }, { locationNames: [] }), /locationNames must be an object/);
});

test('buildIntrigueWebDemo projects quick response aftermath, cooldowns, and fallback states', () => {
  const demo = buildIntrigueWebDemo({
    alertLevel: 'surveille',
    cellules: [
      new Cellule({
        id: 'cell-dormant',
        factionId: 'shadow-league',
        codename: 'Lantern',
        locationId: 'harbor',
        memberIds: ['ag-4'],
        assetIds: ['asset-4'],
        secrecy: 80,
        loyalty: 58,
        exposure: 18,
        sleeper: true,
      }),
      new Cellule({
        id: 'cell-exposed',
        factionId: 'shadow-league',
        codename: 'Torch',
        locationId: 'market',
        memberIds: ['ag-5'],
        assetIds: ['asset-5'],
        secrecy: 35,
        loyalty: 52,
        exposure: 74,
      }),
    ],
    operations: [],
  }, {
    locationNames: {
      harbor: 'Harbor',
      market: 'Market',
    },
  });

  const harborDrillDown = demo.map.entries.find((entry) => entry.locationId === 'harbor').drillDown;
  const marketDrillDown = demo.map.entries.find((entry) => entry.locationId === 'market').drillDown;

  assert.equal(harborDrillDown.recommendedResponseCode, 'infiltrer');
  assert.equal(harborDrillDown.quickResponses[0].effect, 'cellule dormante: réseau cartographié sans résolution automatique');
  assert.equal(harborDrillDown.quickResponses[0].cooldownTurns, 2);
  assert.equal(harborDrillDown.responseAftermath.safestResponseCode, 'surveiller');
  assert.equal(harborDrillDown.responseAftermath.mostEffectiveResponseCode, 'infiltrer');

  assert.equal(marketDrillDown.recommendedResponseCode, 'contenir');
  assert.equal(marketDrillDown.quickResponses[0].escalationProbability, 'moyenne');
  assert.equal(marketDrillDown.quickResponses[1].code, 'exposer');
  assert.match(marketDrillDown.quickResponses[1].countermeasure, /témoins/);
  assert.equal(marketDrillDown.responseAftermath.retaliationRisk, 'élevé');
});
