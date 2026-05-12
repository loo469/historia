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
  assert.deepEqual(report.reminders.map((reminder) => [reminder.status, reminder.label, reminder.summary, reminder.focusCopy, reminder.urgencyCopy]), [
    ['probable', 'Prochain repère', 'Événement cluster (river-gate): à exploiter après Sécuriser les archives. expire bientôt · ce tour.', 'cluster: Ouverture des archives', 'Expire bientôt · ce tour'],
    ['possible', 'Recherche à suivre', 'Recherche culture (river-gate): garder en vue avant de clore le tour. nouveau signal · maintenant.', 'marker: Compact d’Aurora', 'Nouveau signal · maintenant'],
    ['missing', 'Condition à combler', 'Condition manquante (shared-bay): Ligues des Forges manque encore un signal exploitable. à préparer · stable.', 'province: Province liée', 'À préparer · stable'],
  ]);
  assert.deepEqual(report.reminders.map((reminder) => [reminder.recommendedAction.code, reminder.recommendedAction.label, reminder.recommendedAction.timing]), [
    ['follow-event', 'Suivre l’événement', 'ce tour'],
    ['accelerate-research', 'Accélérer la recherche', 'maintenant'],
    ['accept-risk', 'Ignorer avec risque assumé', 'stable'],
  ]);
  assert.equal(report.reminders[0].recommendedAction.summary, 'Suivre Ouverture des archives depuis river-gate; fenêtre ce tour.');
  assert.deepEqual(report.reminders.map((reminder) => [reminder.tradeoff.benefit, reminder.tradeoff.risk, reminder.tradeoff.window]), [
    ['Protège Ouverture des archives', 'Événement ignoré si ce tour passe', 'ce tour'],
    ['Accélère Compact d’Aurora', 'Recherche retardée si l’action reste en attente', 'maintenant'],
    ['Libère l’action province', 'Ligues des Forges reste sans signal exploitable', 'stable'],
  ]);
  assert.equal(report.reminders[0].tradeoff.summary, 'Gain: repère culturel protégé. Risque: événement ignoré (ce tour).');
  assert.deepEqual(report.reminders.map((reminder) => reminder.rippleEffects.map((effect) => [effect.targetLabel, effect.tone])), [
    [['Province river-gate', 'positive'], ['Timeline locale', 'positive']],
    [['Province river-gate', 'uncertain'], ['Recherche locale', 'positive']],
    [],
  ]);
  assert.equal(report.reminders[0].rippleCopy, 'Province river-gate: Ouverture des archives stabilise l’opportunité culturelle locale. | Timeline locale: Repère narratif maintenu dans la timeline locale.');
  assert.deepEqual(report.reminders.map((reminder) => [reminder.confidenceCue.level, reminder.confidenceCue.label, reminder.confidenceCue.dissent]), [
    ['high', 'Confiance haute', 'Aucune dissidence majeure'],
    ['mixed', 'Confiance mixte', 'Recherche encore partielle'],
    ['risky', 'Confiance risquée', 'Signal culturel manquant'],
  ]);
  assert.equal(report.reminders[1].confidenceCue.summary, 'Recherche encore partielle: garder le signal visible sans sur-prioriser.');
  assert.equal(report.reminders[2].confidenceCopy, 'Confiance risquée · Signal culturel manquant');
  assert.deepEqual(report.reminders.map((reminder) => [reminder.inactionCost.level, reminder.inactionCost.label]), [
    ['closing', 'Se ferme ce tour'],
    ['low', 'Inaction tolérée'],
    ['low', 'Inaction tolérée'],
  ]);
  assert.equal(report.reminders[0].inactionCost.summary, 'Ouverture des archives risque de sortir de la timeline locale sans action (ce tour).');
  assert.equal(report.reminders[1].inactionCopy, 'Inaction tolérée · Pas de perte culturelle claire si la recommandation attend.');
  assert.deepEqual(report.priorityConflicts.map((conflict) => [conflict.level, conflict.label, conflict.recommendation, conflict.cultures]), [
    ['urgent', 'Même action en file', 'Agir maintenant', ['Compact d’Aurora', 'Compact d’Aurora']],
  ]);
  assert.equal(report.priorityConflicts[0].summary, 'Agir maintenant: prioriser Compact d’Aurora avant Compact d’Aurora. Ouverture des archives risque de sortir de la timeline locale sans action (ce tour).');
  assert.deepEqual(report.reminders.map((reminder) => reminder.stabilityPreview && [reminder.stabilityPreview.level, reminder.stabilityPreview.stabilityDelta, reminder.stabilityPreview.urgencyDelta]), [
    ['urgent', '+ stabilité locale', 'urgence baisse si action validée'],
    ['urgent', 'effet limité', 'urgence stable'],
    null,
  ]);
  assert.equal(report.reminders[0].stabilityPreview.conflictImpact, 'Même action en file: peut aggraver le conflit détecté.');
  assert.equal(report.reminders[1].stabilityPreview.reason, 'Compact d’Aurora garde la fenêtre culturelle ouverte.');
  assert.deepEqual(report.reminders.map((reminder) => reminder.queueAction && [reminder.queueAction.code, reminder.queueAction.label, reminder.queueAction.horizon]), [
    ['culture:follow-event:river-gate', 'Suivre l’événement', 'ce tour'],
    ['culture:accelerate-research:river-gate', 'Accélérer la recherche', 'maintenant'],
    null,
  ]);
  assert.equal(report.reminders[0].queueAction.opportunityCost, 'Événement ignoré si ce tour passe');
  assert.match(report.reminders[0].queueAction.summary, /coût: Événement ignoré si ce tour passe/);
  assert.deepEqual(report.reminders[0].urgency, {
    level: 'soon',
    label: 'Expire bientôt',
    window: 'ce tour',
    detail: 'Ouverture des archives: fenêtre courte, à traiter avant de clore le tour.',
  });
  assert.deepEqual(report.reminders[0].focusTarget, {
    type: 'cluster',
    id: 'river-gate:culture-cluster',
    regionId: 'river-gate',
    label: 'Ouverture des archives',
    urgency: {
      level: 'soon',
      label: 'Expire bientôt',
      window: 'ce tour',
      detail: 'Ouverture des archives: fenêtre courte, à traiter avant de clore le tour.',
    },
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
