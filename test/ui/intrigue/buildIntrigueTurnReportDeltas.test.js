import test from 'node:test';
import assert from 'node:assert/strict';

import { buildIntrigueTurnReportDeltas } from '../../../src/ui/intrigue/buildIntrigueTurnReportDeltas.js';

const province = { provinceId: 'ashlands', label: 'Ashlands' };

function buildIntrigueView(responseOverrides = {}) {
  const response = {
    code: 'contenir',
    label: 'Contenir',
    cooldownTurns: 2,
    heatGenerated: 17,
    escalationProbability: 'moyenne',
    effect: 'cellule compromise: pression sécuritaire immédiate; opération execution ralentie',
    ...responseOverrides,
  };

  return {
    selectedProvince: {
      drillDown: {
        locationId: 'ashlands',
        locationName: 'Ashlands',
        recommendedResponseCode: response.code,
        quickResponses: [response],
        responseAftermath: {
          retaliationRisk: response.escalationProbability === 'élevée' ? 'élevé' : 'modéré',
          summary: 'Plus sûre: Infiltrer; plus efficace: Contenir; représailles modéré.',
        },
      },
    },
    map: { entries: [] },
  };
}

test('buildIntrigueTurnReportDeltas summarizes resolved intrigue action deltas', () => {
  const report = buildIntrigueTurnReportDeltas(province, buildIntrigueView(), { previousActionCode: 'contenir' });

  assert.equal(report.tone, 'improved');
  assert.equal(report.previousAction, 'Action Delta résolue: Contenir sur Ashlands.');
  assert.equal(report.retaliationRisk, 'modéré');
  assert.match(report.summary, /Sabotage évité|Menace contenue/);
  assert.deepEqual(report.deltas.map((delta) => delta.type).sort(), ['cooldown', 'network', 'threat']);
  assert.ok(report.deltas.some((delta) => delta.label === 'Cooldown restant' && /chaleur générée \+17/.test(delta.detail)));
});

test('buildIntrigueTurnReportDeltas marks aggravated and exposed aftermath clearly', () => {
  const report = buildIntrigueTurnReportDeltas(province, buildIntrigueView({
    code: 'exposer',
    label: 'Exposer',
    escalationProbability: 'élevée',
    cooldownTurns: 1,
    heatGenerated: 23,
    effect: 'cellule exposée: preuve rendue exploitable, réseau adverse alerté',
  }));

  assert.equal(report.tone, 'worse');
  assert.equal(report.retaliationRisk, 'élevé');
  assert.equal(report.deltas[0].label, 'Menace aggravée');
  assert.ok(report.deltas.some((delta) => delta.label === 'Réseau exposé'));
});

test('buildIntrigueTurnReportDeltas keeps unknown intelligence discreet', () => {
  assert.deepEqual(buildIntrigueTurnReportDeltas(province, null), {
    tone: 'masked',
    summary: 'Rapport intrigue masqué: aucune donnée fiable pour ce tour.',
    previousAction: null,
    deltas: [],
  });

  const report = buildIntrigueTurnReportDeltas(province, { map: { entries: [] } }, { previousActionCode: 'surveiller' });
  assert.equal(report.tone, 'masked');
  assert.match(report.summary, /aucun delta confirmé/);
  assert.equal(report.previousAction, 'Action Delta précédente: surveiller; résultat non confirmé.');
  assert.deepEqual(report.deltas, []);
});

test('buildIntrigueTurnReportDeltas validates options', () => {
  assert.throws(() => buildIntrigueTurnReportDeltas(province, buildIntrigueView(), null), /options must be an object/);
});
