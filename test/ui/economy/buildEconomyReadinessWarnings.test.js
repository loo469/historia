import test from 'node:test';
import assert from 'node:assert/strict';

import { buildEconomyReadinessWarnings } from '../../../src/ui/economy/buildEconomyReadinessWarnings.js';

const provinces = [
  { provinceId: 'river-gate', label: 'Porte du Fleuve' },
  { provinceId: 'iron-plain', label: 'Plaine de Fer' },
];

test('buildEconomyReadinessWarnings ranks blocked economy budgets first', () => {
  const report = buildEconomyReadinessWarnings(provinces, {
    budgetByProvinceId: {
      'river-gate': {
        status: 'blocked',
        plans: [
          {
            status: 'blocked',
            logisticsAction: 'Réparer route',
            consumedResources: [{ label: 'Outils', quantity: 4 }],
            routeNames: ['Ember Line'],
            hubName: 'River Gate',
            surplusOrShortage: '2 unités manquantes',
            risk: 30,
            costUnits: 4,
          },
        ],
      },
      'iron-plain': {
        status: 'risky',
        plans: [
          {
            status: 'risky',
            logisticsAction: 'Sécuriser convoi',
            consumedResources: [{ label: 'Grain', quantity: 3 }],
            routeNames: ['Iron Road'],
            surplusOrShortage: '1 unité restante',
            risk: 58,
            costUnits: 3,
          },
        ],
      },
    },
  });

  assert.equal(report.status, 'blocked');
  assert.match(report.summary, /blocage/);
  assert.equal(report.warnings[0].tone, 'critical');
  assert.equal(report.warnings[0].provinceLabel, 'Porte du Fleuve');
  assert.match(report.warnings[0].detail, /Ember Line/);
  assert.match(report.warnings[0].detail, /Outils/);
  assert.deepEqual(report.warnings[0].focusTarget, {
    kind: 'hub',
    provinceId: 'river-gate',
    routeName: 'Ember Line',
    hubName: 'River Gate',
    resourceLabel: 'Outils',
  });
});

test('buildEconomyReadinessWarnings falls back to high logistics route stress', () => {
  const report = buildEconomyReadinessWarnings(provinces, {
    logisticsByProvinceId: {
      'iron-plain': {
        options: [
          {
            tone: 'high',
            routes: ['Iron Road'],
            resources: ['Outils'],
            affectedCity: 'Iron Hub',
            residualRisk: 72,
          },
        ],
      },
    },
  });

  assert.equal(report.status, 'risky');
  assert.equal(report.warnings.length, 1);
  assert.equal(report.warnings[0].label, 'Route sous stress');
  assert.match(report.warnings[0].detail, /Iron Road/);
  assert.equal(report.warnings[0].focusTarget.kind, 'route');
  assert.equal(report.warnings[0].focusTarget.hubName, 'Iron Hub');
});

test('buildEconomyReadinessWarnings returns compact ready state without warnings', () => {
  const report = buildEconomyReadinessWarnings(provinces, {
    budgetByProvinceId: {
      'river-gate': { status: 'ready', plans: [{ status: 'ready' }] },
    },
  });

  assert.equal(report.status, 'ready');
  assert.deepEqual(report.warnings, []);
  assert.match(report.summary, /aucun blocage majeur/);
});

test('buildEconomyReadinessWarnings validates inputs', () => {
  assert.throws(() => buildEconomyReadinessWarnings(null), /provinces must be an array/);
  assert.throws(() => buildEconomyReadinessWarnings(provinces, null), /options must be an object/);
  assert.throws(() => buildEconomyReadinessWarnings(provinces, { budgetByProvinceId: [] }), /budgetByProvinceId must be an object/);
});
