import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCultureOpportunityReminders } from '../../../src/ui/culture/buildCultureOpportunityReminders.js';

test('buildCultureOpportunityReminders prioritizes actionable culture end-turn reminders', () => {
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
          },
          {
            status: 'probable',
            tone: 'event',
            label: 'Événement cluster',
            explanation: 'Ouverture des archives proche.',
            regionId: 'river-gate',
            cultureName: 'Compact d’Aurora',
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
          },
        ],
      },
    ],
  });

  assert.equal(report.state, 'active');
  assert.equal(report.summary, 'Porte du Fleuve: 1 opportunité probable, 1 condition à surveiller.');
  assert.deepEqual(report.reminders.map((reminder) => [reminder.status, reminder.label, reminder.summary]), [
    ['probable', 'Prochain repère', 'Événement cluster (river-gate): à exploiter après Sécuriser les archives.'],
    ['possible', 'Recherche à suivre', 'Recherche culture (river-gate): garder en vue avant de clore le tour.'],
    ['missing', 'Condition à combler', 'Condition manquante (shared-bay): Ligues des Forges manque encore un signal exploitable.'],
  ]);
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
