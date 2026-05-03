import test from 'node:test';
import assert from 'node:assert/strict';

import { buildMythicClimateHud } from '../../../src/ui/climate/buildMythicClimateHud.js';
import { Catastrophe } from '../../../src/domain/climate/Catastrophe.js';
import { ClimateState } from '../../../src/domain/climate/ClimateState.js';
import { Myth } from '../../../src/domain/climate/Myth.js';

test('buildMythicClimateHud composes disaster warnings and myth cards into frosted HUD payloads', () => {
  const hud = buildMythicClimateHud({
    climateState: new ClimateState({
      regionId: 'sunreach',
      season: 'summer',
      temperatureC: 33,
      precipitationLevel: 11,
      droughtIndex: 74,
      anomaly: 'heatwave',
      activeCatastropheIds: ['wildfire-1'],
    }),
    seasonLabels: { summer: 'Été' },
    catastrophes: [
      new Catastrophe({
        id: 'wildfire-1',
        type: 'wildfire',
        severity: 'critical',
        status: 'active',
        regionIds: ['sunreach'],
        startedAt: '2026-04-19T00:00:00.000Z',
        impact: { harvest: -32, unrest: 12 },
        description: 'Ligne de feu au sud.',
      }),
    ],
    myths: [
      new Myth({
        id: 'myth-wildfire-1',
        title: 'Le Brasier des Bornes',
        category: 'catastrophe',
        status: 'canonized',
        originEventIds: ['wildfire-1'],
        summary: 'Les vigies relient les flammes à un serment ancien.',
        credibility: 72,
        regions: ['sunreach'],
        tags: ['wildfire'],
        createdAt: '2026-04-19T00:00:00.000Z',
        canonizedAt: '2026-04-20T00:00:00.000Z',
      }),
    ],
  });

  assert.deepEqual(hud, {
    title: 'HUD climat mythique',
    summary: '1 alertes catastrophe, 1 récits climatiques',
    visualMode: 'pax-historia-dark-mythic',
    layout: {
      className: 'mythic-climate-hud mythic-climate-hud--frosted',
      panelSurface: 'semi-transparent-frosted-glass',
      grid: 'compact-alert-and-lore-columns',
      iconography: 'clean-vector-glyphs',
    },
    palette: {
      background: '#020817',
      glass: 'rgba(3, 10, 22, 0.72)',
      cyan: '#67e8f9',
      amber: '#fbbf24',
      danger: '#fb7185',
      text: '#e2e8f0',
    },
    climateReadout: {
      regionId: 'sunreach',
      title: 'HUD climat · Été',
      riskLevel: 'critical',
      anomaly: 'heatwave',
      readings: [
        { key: 'temperature', label: 'Température', value: '33°C' },
        { key: 'precipitation', label: 'Précip.', value: '11/100' },
        { key: 'drought', label: 'Sécheresse', value: '74/100' },
      ],
      surface: {
        className: 'mythic-climate-readout mythic-climate-readout--critical',
        background: 'rgba(3, 10, 22, 0.72)',
        border: 'rgba(251, 191, 36, 0.42)',
        backdropFilter: 'blur(18px) saturate(1.18)',
      },
    },
    disasterWarnings: [
      {
        cardId: 'warning:wildfire-1',
        type: 'wildfire',
        severity: 'critical',
        status: 'active',
        regionIds: ['sunreach'],
        title: 'wildfire · critical',
        description: 'Ligne de feu au sud.',
        tone: 'critical-red',
        icon: '⚠',
        surface: {
          className: 'mythic-climate-warning mythic-climate-warning--critical',
          background: 'rgba(3, 10, 22, 0.76)',
          border: 'rgba(251, 113, 133, 0.5)',
          backdropFilter: 'blur(18px) saturate(1.2)',
        },
        signal: {
          glyph: 'pulsing-alert-glyph',
          contour: 'double-glow-ring',
          label: 'Actif',
        },
        impact: { harvest: -32, unrest: 12 },
      },
    ],
    mythCards: [
      {
        cardId: 'myth:myth-wildfire-1',
        mythId: 'myth-wildfire-1',
        title: 'Le Brasier des Bornes',
        category: 'catastrophe',
        status: 'canonized',
        summary: 'Les vigies relient les flammes à un serment ancien.',
        credibility: 72,
        regionIds: ['sunreach'],
        originEventIds: ['wildfire-1'],
        tone: 'amber-omen',
        icon: '◆',
        surface: {
          className: 'mythic-climate-card mythic-climate-card--catastrophe',
          background: 'linear-gradient(180deg, rgba(8, 15, 28, 0.76), rgba(3, 7, 18, 0.84))',
          border: 'rgba(251, 191, 36, 0.34)',
          backdropFilter: 'blur(18px) saturate(1.16)',
        },
        typography: {
          titleTransform: 'uppercase-tracked',
          density: 'compact-lore',
        },
      },
    ],
    metrics: {
      warningCount: 1,
      activeWarningCount: 1,
      mythCount: 1,
      canonizedMythCount: 1,
    },
  });
});

test('buildMythicClimateHud accepts plain payloads and filters resolved catastrophes', () => {
  const hud = buildMythicClimateHud({
    climateState: {
      regionId: 'north-coast',
      season: 'spring',
      temperatureC: 12,
      precipitationLevel: 63,
      droughtIndex: 18,
    },
    catastrophes: [
      {
        id: 'storm-1',
        type: 'storm',
        severity: 'minor',
        status: 'resolved',
        regionIds: ['north-coast'],
        startedAt: '2026-04-19T00:00:00.000Z',
        resolvedAt: '2026-04-20T00:00:00.000Z',
        impact: { harvest: -2 },
      },
    ],
    myths: [],
  });

  assert.equal(hud.summary, '0 alertes catastrophe, 0 récits climatiques');
  assert.equal(hud.climateReadout.riskLevel, 'stable');
  assert.deepEqual(hud.disasterWarnings, []);
  assert.deepEqual(hud.mythCards, []);
});

test('buildMythicClimateHud rejects malformed input collections', () => {
  assert.throws(() => buildMythicClimateHud(), /climateState must be an object/);
  assert.throws(() => buildMythicClimateHud({
    climateState: { regionId: 'x', season: 'summer', temperatureC: 1, precipitationLevel: 10, droughtIndex: 0 },
    catastrophes: {},
  }), /catastrophes must be an array/);
  assert.throws(() => buildMythicClimateHud({
    climateState: { regionId: 'x', season: 'summer', temperatureC: 1, precipitationLevel: 10, droughtIndex: 0 },
    myths: {},
  }), /myths must be an array/);
  assert.throws(() => buildMythicClimateHud({
    climateState: { regionId: 'x', season: 'summer', temperatureC: 1, precipitationLevel: 10, droughtIndex: 0 },
    seasonLabels: [],
  }), /seasonLabels must be an object/);
});
