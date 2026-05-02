import test from 'node:test';
import assert from 'node:assert/strict';

import { Catastrophe } from '../../../src/domain/climate/Catastrophe.js';
import { buildCatastropheMapOverlay } from '../../../src/ui/climate/buildCatastropheMapOverlay.js';

test('buildCatastropheMapOverlay expands active catastrophes into stable regional overlays', () => {
  const overlay = buildCatastropheMapOverlay([
    new Catastrophe({
      id: 'storm-1',
      type: 'great-storm',
      severity: 'major',
      status: 'active',
      regionIds: ['north-coast', 'riverlands'],
      startedAt: '2026-04-19T00:00:00.000Z',
      impact: { harvest: -25 },
      description: 'Coastal flooding',
    }),
    new Catastrophe({
      id: 'drought-2',
      type: 'drought',
      severity: 'critical',
      status: 'warning',
      regionIds: ['ashlands'],
      startedAt: '2026-04-19T00:00:00.000Z',
      impact: { harvest: -40, unrest: 12 },
    }),
    new Catastrophe({
      id: 'flood-3',
      type: 'flood',
      severity: 'minor',
      status: 'resolved',
      regionIds: ['delta'],
      startedAt: '2026-04-19T00:00:00.000Z',
      resolvedAt: '2026-04-20T00:00:00.000Z',
      impact: { infrastructure: -10 },
    }),
  ]);

  assert.deepEqual(overlay, [
    {
      overlayId: 'ashlands:drought-2',
      regionId: 'ashlands',
      catastropheId: 'drought-2',
      type: 'drought',
      severity: 'critical',
      status: 'warning',
      label: 'drought (critical)',
      description: null,
      impact: { harvest: -40, unrest: 12 },
      style: {
        stroke: 'crimson',
        fill: 'crimson',
        opacity: 0.5,
        icon: '⚠',
      },
    },
    {
      overlayId: 'north-coast:storm-1',
      regionId: 'north-coast',
      catastropheId: 'storm-1',
      type: 'great-storm',
      severity: 'major',
      status: 'active',
      label: 'great-storm (major)',
      description: 'Coastal flooding',
      impact: { harvest: -25 },
      style: {
        stroke: 'orange',
        fill: 'orange',
        opacity: 0.4,
        icon: '▲',
      },
    },
    {
      overlayId: 'riverlands:storm-1',
      regionId: 'riverlands',
      catastropheId: 'storm-1',
      type: 'great-storm',
      severity: 'major',
      status: 'active',
      label: 'great-storm (major)',
      description: 'Coastal flooding',
      impact: { harvest: -25 },
      style: {
        stroke: 'orange',
        fill: 'orange',
        opacity: 0.4,
        icon: '▲',
      },
    },
  ]);
});

test('buildCatastropheMapOverlay supports plain payloads and style overrides', () => {
  const overlay = buildCatastropheMapOverlay([
    {
      id: 'locust-4',
      type: 'locusts',
      severity: 'minor',
      regionIds: ['delta'],
      startedAt: '2026-04-19T00:00:00.000Z',
      impact: { harvest: -18 },
    },
  ], {
    styleBySeverity: {
      minor: { stroke: 'gold', fill: 'goldenrod', opacity: 0.65, icon: 'L' },
    },
  });

  assert.deepEqual(overlay[0].style, {
    stroke: 'gold',
    fill: 'goldenrod',
    opacity: 0.65,
    icon: 'L',
  });
});

test('buildCatastropheMapOverlay rejects invalid inputs', () => {
  assert.throws(() => buildCatastropheMapOverlay(null), /catastrophes must be an array/);
  assert.throws(() => buildCatastropheMapOverlay([null]), /Catastrophe instances or plain objects/);
  assert.throws(() => buildCatastropheMapOverlay([], null), /options must be an object/);
  assert.throws(() => buildCatastropheMapOverlay([], { styleBySeverity: [] }), /styleBySeverity must be an object/);
});

test('buildCatastropheMapOverlay can expose tactical dark HUD styling for warning cards', () => {
  const [overlay] = buildCatastropheMapOverlay([
    {
      id: 'drought-2',
      type: 'drought',
      severity: 'critical',
      status: 'warning',
      regionIds: ['ashlands'],
      startedAt: '2026-04-19T00:00:00.000Z',
      impact: { harvest: -40 },
    },
  ], { tacticalHud: true });

  assert.deepEqual(overlay.hudStyle, {
    visualMode: 'tactical-dark',
    panelClassName: 'climate-disaster-card climate-disaster-card--critical',
    surface: {
      background: 'rgba(3, 10, 22, 0.74)',
      border: '1px solid crimson',
      backdropFilter: 'blur(18px) saturate(1.18)',
      gridOverlay: 'coordinate-grid',
    },
    alertTone: 'critical-red',
    glyph: {
      icon: '⚠',
      frame: 'thin-warning-ring',
      color: 'crimson',
    },
    typography: {
      family: 'technical-sans',
      labelTransform: 'uppercase-tracked',
    },
  });
});
