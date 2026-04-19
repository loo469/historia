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
  });

  assert.deepEqual(panel, {
    regionId: 'sunreach',
    regionName: 'Sunreach',
    title: 'Climat de Sunreach',
    summary: 'Été, heatwave, locusts, wildfire',
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
    metrics: {
      anomalyCount: 3,
      activeCatastropheCount: 2,
      hasAnomaly: true,
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

  assert.equal(panel.summary, 'spring, Aucune anomalie');
  assert.deepEqual(panel.anomalies, []);
  assert.deepEqual(panel.metrics, {
    anomalyCount: 0,
    activeCatastropheCount: 0,
    hasAnomaly: false,
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
});
