import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCultureOpportunityReminders } from '../../../src/ui/culture/buildCultureOpportunityReminders.js';

test('buildCultureOpportunityReminders prioritizes actionable culture end-turn reminders with focus targets', () => {
  const report = buildCultureOpportunityReminders({
    province: { provinceId: 'river-gate', label: 'Porte du Fleuve' },
    actionQueue: [
      { actionCode: 'SECURE', label: 'Sécuriser les archives' },
      { actionCode: 'WATCH', label: 'Observer le delta' },
    ],
    unlockHintsByAction: [
      {
        action: { label: 'Sécuriser les archives' },
        hints: [
          {
            status: 'possible',
            tone: 'research',
            label: 'Recherche culture',
            explanation: 'tidal-ledgers liée au choix.',
            regionId: 'river-gate',
            cultureName: 'Compact d’Aurora',
            focusTarget: {
              type: 'marker',
              id: 'river-gate:culture-aurora',
              regionId: 'river-gate',
              label: 'Compact d’Aurora',
            },
          },
          {
            status: 'probable',
            tone: 'event',
            label: 'Événement cluster',
            explanation: 'Ouverture des archives proche.',
            regionId: 'river-gate',
            cultureName: 'Compact d’Aurora',
            focusTarget: {
              type: 'cluster',
              id: 'river-gate:culture-cluster',
              regionId: 'river-gate',
              label: 'Ouverture des archives',
            },
          },
        ],
      },
      {
        action: { label: 'Observer le delta' },
        hints: [
          {
            status: 'missing',
            tone: 'identity',
            label: 'Condition manquante',
            explanation: 'Aucun pin actif.',
            regionId: 'shared-bay',
            cultureName: 'Ligues des Forges',
            focusTarget: {
              type: 'province',
              id: 'shared-bay',
              regionId: 'shared-bay',
              label: 'Province liée',
            },
          },
        ],
      },
    ],
  });

  assert.equal(report.state, 'active');
  assert.equal(report.summary, 'Porte du Fleuve: 1 opportunité probable, 1 condition à surveiller.');
  assert.deepEqual(report.reminders.map((reminder) => [reminder.status, reminder.label, reminder.summary, reminder.focusCopy]), [
    ['probable', 'Prochain repère', 'Événement cluster (river-gate): à exploiter après Sécuriser les archives.', 'cluster: Ouverture des archives'],
    ['possible', 'Recherche à suivre', 'Recherche culture (river-gate): garder en vue avant de clore le tour.', 'marker: Compact d’Aurora'],
    ['missing', 'Condition à combler', 'Condition manquante (shared-bay): Ligues des Forges manque encore un signal exploitable.', 'province: Province liée'],
  ]);
  assert.deepEqual(report.reminders[0].focusTarget, {
    type: 'cluster',
    id: 'river-gate:culture-cluster',
    regionId: 'river-gate',
    label: 'Ouverture des archives',
  });
});

test('buildCultureOpportunityReminders returns a compact quiet summary without hints', () => {
  assert.deepEqual(buildCultureOpportunityReminders({
    province: { provinceId: 'quiet-field', label: 'Champ Calme' },
    actionQueue: [],
    unlockHintsByAction: [],
  }), {
    state: 'quiet',
    provinceLabel: 'Champ Calme',
    summary: 'Champ Calme: aucune opportunité culturelle nouvelle dans le plan de fin de tour.',
    reminders: [],
  });
});
