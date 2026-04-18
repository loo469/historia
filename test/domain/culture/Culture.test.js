import test from 'node:test';
import assert from 'node:assert/strict';

import { Culture } from '../../../src/domain/culture/Culture.js';

test('Culture keeps normalized core culture fields', () => {
  const culture = new Culture({
    id: '  culture-aurora ',
    name: ' Aurora Compact ',
    archetype: ' mercantile ',
    primaryLanguage: ' trade-speech ',
    valueIds: ['curiosity', ' curiosity ', 'craft'],
    traditionIds: ['harvest-song', ' sky-festival ', 'harvest-song'],
    openness: 66,
    cohesion: 58,
    researchDrive: 71,
  });

  assert.deepEqual(culture.toJSON(), {
    id: 'culture-aurora',
    name: 'Aurora Compact',
    archetype: 'mercantile',
    primaryLanguage: 'trade-speech',
    valueIds: ['craft', 'curiosity'],
    traditionIds: ['harvest-song', 'sky-festival'],
    openness: 66,
    cohesion: 58,
    researchDrive: 71,
    lastEvolvedAt: null,
  });

  assert.equal(culture.embracesInnovation(), true);
});

test('Culture can evolve immutably while tracking the evolution date', () => {
  const culture = new Culture({
    id: 'culture-aurora',
    name: 'Aurora Compact',
    archetype: 'mercantile',
    primaryLanguage: 'trade-speech',
    valueIds: ['craft'],
    traditionIds: ['harvest-song'],
  });
  const evolvedAt = new Date('2026-04-18T11:40:00.000Z');

  const evolvedCulture = culture.withEvolution({
    openness: 72,
    cohesion: 61,
    researchDrive: 74,
    valueIds: ['craft', 'navigation'],
    traditionIds: ['harvest-song', 'river-moot'],
    lastEvolvedAt: evolvedAt,
  });

  assert.notEqual(evolvedCulture, culture);
  assert.deepEqual(evolvedCulture.valueIds, ['craft', 'navigation']);
  assert.deepEqual(evolvedCulture.traditionIds, ['harvest-song', 'river-moot']);
  assert.equal(evolvedCulture.lastEvolvedAt?.toISOString(), evolvedAt.toISOString());
  assert.equal(culture.lastEvolvedAt, null);
  assert.deepEqual(culture.valueIds, ['craft']);
  assert.deepEqual(culture.traditionIds, ['harvest-song']);
});

test('Culture rejects invalid text, list, score, and date inputs', () => {
  assert.throws(
    () =>
      new Culture({
        id: '',
        name: 'Aurora Compact',
        archetype: 'mercantile',
        primaryLanguage: 'trade-speech',
      }),
    /Culture id is required/,
  );

  assert.throws(
    () =>
      new Culture({
        id: 'culture-aurora',
        name: 'Aurora Compact',
        archetype: 'mercantile',
        primaryLanguage: 'trade-speech',
        valueIds: ['craft', ''],
      }),
    /Culture valueIds cannot contain empty values/,
  );

  assert.throws(
    () =>
      new Culture({
        id: 'culture-aurora',
        name: 'Aurora Compact',
        archetype: 'mercantile',
        primaryLanguage: 'trade-speech',
        openness: 101,
      }),
    /Culture openness must be an integer between 0 and 100/,
  );

  assert.throws(
    () =>
      new Culture({
        id: 'culture-aurora',
        name: 'Aurora Compact',
        archetype: 'mercantile',
        primaryLanguage: 'trade-speech',
        lastEvolvedAt: 'not-a-date',
      }),
    /Culture lastEvolvedAt must be a valid date/,
  );
});
