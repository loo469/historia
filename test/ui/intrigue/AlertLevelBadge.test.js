import test from 'node:test';
import assert from 'node:assert/strict';

import { buildAlertLevelBadge } from '../../../src/ui/intrigue/AlertLevelBadge.js';

test('AlertLevelBadge builds UI metadata from a numeric alert level', () => {
  const badge = buildAlertLevelBadge(2);

  assert.deepEqual(badge, {
    text: 'Alerte Renforcé',
    shortText: 'Alerte 2',
    tone: 'warning',
    color: '#D97706',
    emphasis: 'normal',
    tooltip: 'Niveau 2 sur 4, surveillance 55%',
    level: {
      value: 2,
      code: 'renforce',
      label: 'Renforcé',
      surveillanceIntensity: 55,
    },
  });
});

test('AlertLevelBadge supports custom prefixes and critical levels', () => {
  const badge = buildAlertLevelBadge('verrouille', { prefix: 'Sécurité' });

  assert.deepEqual(badge, {
    text: 'Sécurité Verrouillé',
    shortText: 'Sécurité 4',
    tone: 'critical',
    color: '#7F1D1D',
    emphasis: 'high',
    tooltip: 'Niveau 4 sur 4, surveillance 100%',
    level: {
      value: 4,
      code: 'verrouille',
      label: 'Verrouillé',
      surveillanceIntensity: 100,
    },
  });
});

test('AlertLevelBadge rejects invalid options and invalid levels', () => {
  assert.throws(() => buildAlertLevelBadge(1, null), /AlertLevelBadge options must be an object/);
  assert.throws(() => buildAlertLevelBadge('panic'), /NiveauAlerte code must be one of/);
});
