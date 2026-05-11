import test from 'node:test';
import assert from 'node:assert/strict';

import { buildClimateMapOverlay } from '../../../src/ui/climate/buildClimateMapOverlay.js';
import { buildClimateTurnReportDeltas } from '../../../src/ui/climate/buildClimateTurnReportDeltas.js';

function buildOverlay({ risk = 'critical', anomaly = 'drought', previewRisk = 'strained' } = {}) {
  return buildClimateMapOverlay([
    {
      regionId: 'sunreach',
      season: 'summer',
      temperatureC: risk === 'stable' ? 20 : 35,
      precipitationLevel: risk === 'stable' ? 45 : 8,
      droughtIndex: risk === 'critical' ? 78 : risk === 'strained' ? 38 : 8,
      anomaly,
    },
  ], {
    selectedRegionId: 'sunreach',
    seasonLabels: { summer: 'Été', autumn: 'Automne' },
    seasonPreview: {
      season: 'autumn',
      impactsByRegion: {
        sunreach: { strategicImpact: previewRisk, anomaly: previewRisk === 'stable' ? null : anomaly },
      },
    },
  });
}

test('buildClimateTurnReportDeltas shows risk reduction and forecast versus realized recovery', () => {
  const previousOverlay = buildOverlay({ risk: 'critical', anomaly: 'drought', previewRisk: 'critical' });
  const currentOverlay = buildOverlay({ risk: 'strained', anomaly: null, previewRisk: 'stable' });
  const report = buildClimateTurnReportDeltas({
    turn: 7,
    selectedRegionId: 'sunreach',
    previousClimateOverlay: previousOverlay,
    climateOverlay: currentOverlay,
    previousRecoveryForecast: previousOverlay.selectedClimateRecoveryForecast,
    realizedRecoveryByChoiceId: {
      'evacuate-risk-zones': {
        recoveryWindowDays: 18,
        relapseRisk: 'low',
        status: 'on-track',
        summary: 'Mitigation réalisée plus vite que prévu.',
      },
    },
  });

  assert.equal(report.state, 'recovery');
  assert.equal(report.summary, 'Tour 7: Risque climat réduit — critical → strained.');
  assert.deepEqual(report.deltas.map((delta) => [delta.tone, delta.label]), [
    ['improved', 'Risque climat réduit'],
    ['improved', 'Récupération engagée'],
    ['improved', 'Fenêtre météo favorable'],
  ]);
  assert.deepEqual(report.deltas.find((delta) => delta.label === 'Récupération engagée').forecast, {
    choiceId: 'evacuate-risk-zones',
    recoveryWindowDays: 20,
    relapseRisk: 'medium',
    nextCriticalSeason: 'Automne',
  });
  assert.deepEqual(report.deltas.find((delta) => delta.label === 'Récupération engagée').realized, {
    recoveryWindowDays: 18,
    relapseRisk: 'low',
    status: 'on-track',
  });
});

test('buildClimateTurnReportDeltas warns when risk increases and a critical season approaches', () => {
  const previousOverlay = buildOverlay({ risk: 'stable', anomaly: null, previewRisk: 'critical' });
  const currentOverlay = buildOverlay({ risk: 'critical', anomaly: 'drought', previewRisk: 'critical' });
  const report = buildClimateTurnReportDeltas({
    turn: 8,
    selectedRegionId: 'sunreach',
    previousClimateOverlay: previousOverlay,
    climateOverlay: currentOverlay,
    upcomingSeason: 'Automne sec',
  });

  assert.equal(report.state, 'risk');
  assert.deepEqual(report.deltas.map((delta) => [delta.tone, delta.label, delta.value]), [
    ['worse', 'Risque climat accru', 'stable → critical'],
    ['improved', 'Récupération engagée', 'Évacuer les zones exposées · prévu 20j / réalisé 20j'],
  ]);
});

test('buildClimateTurnReportDeltas reports stable quiet state without climate data', () => {
  assert.deepEqual(buildClimateTurnReportDeltas({ turn: 3, selectedRegionId: 'quiet-field' }), {
    state: 'quiet',
    turn: 3,
    regionId: 'quiet-field',
    summary: 'Aucun delta climat/catastrophe visible ce tour.',
    deltas: [],
  });
});

test('buildClimateTurnReportDeltas validates realized recovery map', () => {
  assert.throws(() => buildClimateTurnReportDeltas({ realizedRecoveryByChoiceId: null }), /realizedRecoveryByChoiceId must be an object/);
});
