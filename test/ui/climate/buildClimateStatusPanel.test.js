import test from 'node:test';
import assert from 'node:assert/strict';

import { ClimateState } from '../../../src/domain/climate/ClimateState.js';
import { buildClimateStatusPanel } from '../../../src/ui/climate/buildClimateStatusPanel.js';

test('buildClimateStatusPanel summarizes season, anomaly, and active catastrophes', () => {
  const panel = buildClimateStatusPanel(new ClimateState({
    regionId: 'sunreach',
    season: 'summer',
    temperatureC: 33,
    precipitationLevel: 11,
    droughtIndex: 74,
    anomaly: 'heatwave',
    activeCatastropheIds: ['locusts', 'wildfire'],
  }), {
    regionName: 'Sunreach',
    seasonLabels: {
      summer: 'Été',
    },
    turnProgression: {
      seasonChanged: true,
      temperatureDelta: 5,
      precipitationDelta: -4,
      droughtDelta: 14,
      summary: 'spring → summer, temp +5°C, précip -4, sécheresse +14',
    },
  });

  assert.deepEqual(panel, {
    regionId: 'sunreach',
    regionName: 'Sunreach',
    title: 'Climat de Sunreach',
    summary: 'Été, heatwave, locusts, wildfire, logistique élevé, récoltes fragile, vigilance renforcée',
    season: {
      id: 'summer',
      label: 'Été',
    },
    readings: {
      temperatureC: 33,
      precipitationLevel: 11,
      droughtIndex: 74,
      stability: 'volatile',
    },
    highlights: [
      {
        key: 'temperature',
        label: 'Température',
        value: '33°C',
      },
      {
        key: 'precipitation',
        label: 'Précipitations',
        value: '11/100',
      },
      {
        key: 'drought',
        label: 'Sécheresse',
        value: '74/100',
      },
    ],
    turnProgression: {
      seasonChanged: true,
      temperatureDelta: 5,
      precipitationDelta: -4,
      droughtDelta: 14,
      summary: 'spring → summer, temp +5°C, précip -4, sécheresse +14',
    },
    anomalies: [
      {
        type: 'anomaly',
        id: 'heatwave',
        label: 'heatwave',
        tone: 'warning',
      },
      {
        type: 'catastrophe',
        id: 'locusts',
        label: 'locusts',
        tone: 'danger',
      },
      {
        type: 'catastrophe',
        id: 'wildfire',
        label: 'wildfire',
        tone: 'danger',
      },
    ],
    risks: {
      logistics: 'élevé',
      harvest: 'fragile',
      vigilance: 'renforcée',
      summary: 'logistique élevé, récoltes fragile, vigilance renforcée',
    },
    metrics: {
      anomalyCount: 3,
      activeCatastropheCount: 2,
      hasAnomaly: true,
      riskLevel: 'critical',
    },
  });
});

test('buildClimateStatusPanel supports plain payloads without anomalies', () => {
  const panel = buildClimateStatusPanel({
    regionId: 'north-coast',
    season: 'spring',
    temperatureC: 12,
    precipitationLevel: 63,
    droughtIndex: 18,
  });

  assert.equal(panel.summary, 'spring, Aucune anomalie, logistique faible, récoltes soutenu, vigilance normale');
  assert.deepEqual(panel.highlights, [
    {
      key: 'temperature',
      label: 'Température',
      value: '12°C',
    },
    {
      key: 'precipitation',
      label: 'Précipitations',
      value: '63/100',
    },
    {
      key: 'drought',
      label: 'Sécheresse',
      value: '18/100',
    },
  ]);
  assert.equal(panel.turnProgression, null);
  assert.deepEqual(panel.anomalies, []);
  assert.deepEqual(panel.risks, {
    logistics: 'faible',
    harvest: 'soutenu',
    vigilance: 'normale',
    summary: 'logistique faible, récoltes soutenu, vigilance normale',
  });
  assert.deepEqual(panel.metrics, {
    anomalyCount: 0,
    activeCatastropheCount: 0,
    hasAnomaly: false,
    riskLevel: 'stable',
  });
  assert.equal(panel.readings.stability, 'stable');
});

test('buildClimateStatusPanel rejects invalid payloads', () => {
  assert.throws(
    () => buildClimateStatusPanel(null),
    /ClimateStatusPanel climateState must be a ClimateState or plain object/,
  );

  assert.throws(
    () => buildClimateStatusPanel({
      regionId: 'north-coast',
      season: 'spring',
      temperatureC: 12,
      precipitationLevel: 63,
      droughtIndex: 18,
    }, null),
    /ClimateStatusPanel options must be an object/,
  );

  assert.throws(
    () => buildClimateStatusPanel({
      regionId: 'north-coast',
      season: 'spring',
      temperatureC: 12,
      precipitationLevel: 63,
      droughtIndex: 18,
    }, {
      regionName: ' ',
    }),
    /ClimateStatusPanel regionName is required/,
  );

  assert.throws(
    () => buildClimateStatusPanel({
      regionId: 'north-coast',
      season: 'spring',
      temperatureC: 12,
      precipitationLevel: 63,
      droughtIndex: 18,
    }, {
      turnProgression: [],
    }),
    /ClimateStatusPanel turnProgression must be an object/,
  );
});

test('buildClimateStatusPanel can expose frosted tactical HUD panel styling', () => {
  const panel = buildClimateStatusPanel({
    regionId: 'sunreach',
    season: 'summer',
    temperatureC: 33,
    precipitationLevel: 11,
    droughtIndex: 74,
    anomaly: 'heatwave',
    activeCatastropheIds: ['wildfire'],
  }, { tacticalHud: true });

  assert.deepEqual(panel.panelStyle, {
    visualMode: 'tactical-dark',
    className: 'climate-status-panel climate-status-panel--critical',
    surface: {
      background: 'rgba(3, 10, 22, 0.72)',
      border: 'rgba(251, 191, 36, 0.42)',
      backdropFilter: 'blur(18px) saturate(1.18)',
      coordinateGrid: true,
    },
    accent: 'amber-danger',
    readoutMode: 'compact-hud',
    glyphRail: 'alert-stack',
  });
});
