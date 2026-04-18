import test from 'node:test';
import assert from 'node:assert/strict';

import { evolveCulture } from '../../../src/application/culture/evolveCulture.js';

test('evolveCulture updates scores and cultural lists immutably', () => {
  const culture = {
    id: 'culture-aurora',
    name: 'Aurora Compact',
    archetype: 'mercantile',
    primaryLanguage: 'trade-speech',
    valueIds: ['craft', 'curiosity'],
    traditionIds: ['harvest-song'],
    openness: 58,
    cohesion: 63,
    researchDrive: 54,
    lastEvolvedAt: null,
  };

  const evolvedCulture = evolveCulture(culture, {
    opennessDelta: 8,
    cohesionDelta: -5,
    researchDriveDelta: 11,
    addedValueIds: ['navigation'],
    addedTraditionIds: [' river-moot '],
    removedTraditionIds: ['harvest-song'],
    evolvedAt: '2026-04-18T12:40:00.000Z',
  });

  assert.notEqual(evolvedCulture, culture);
  assert.equal(evolvedCulture.openness, 66);
  assert.equal(evolvedCulture.cohesion, 58);
  assert.equal(evolvedCulture.researchDrive, 65);
  assert.deepEqual(evolvedCulture.valueIds, ['craft', 'curiosity', 'navigation']);
  assert.deepEqual(evolvedCulture.traditionIds, ['river-moot']);
  assert.equal(evolvedCulture.lastEvolvedAt, '2026-04-18T12:40:00.000Z');
  assert.deepEqual(culture.valueIds, ['craft', 'curiosity']);
  assert.deepEqual(culture.traditionIds, ['harvest-song']);
});

test('evolveCulture clamps score changes to valid bounds', () => {
  const evolvedCulture = evolveCulture(
    {
      id: 'culture-aurora',
      name: 'Aurora Compact',
      archetype: 'mercantile',
      primaryLanguage: 'trade-speech',
      valueIds: [],
      traditionIds: [],
      openness: 95,
      cohesion: 3,
      researchDrive: 97,
      lastEvolvedAt: null,
    },
    {
      opennessDelta: 20,
      cohesionDelta: -15,
      researchDriveDelta: 12,
      evolvedAt: '2026-04-18T12:41:00.000Z',
    },
  );

  assert.equal(evolvedCulture.openness, 100);
  assert.equal(evolvedCulture.cohesion, 0);
  assert.equal(evolvedCulture.researchDrive, 100);
});

test('evolveCulture removes duplicates and supports list refreshes', () => {
  const evolvedCulture = evolveCulture(
    {
      id: 'culture-aurora',
      name: 'Aurora Compact',
      archetype: 'mercantile',
      primaryLanguage: 'trade-speech',
      valueIds: ['craft'],
      traditionIds: ['harvest-song', 'river-moot'],
      openness: 50,
      cohesion: 50,
      researchDrive: 50,
      lastEvolvedAt: null,
    },
    {
      addedValueIds: ['craft', ' scholarship '],
      removedTraditionIds: ['river-moot'],
      addedTraditionIds: [' harbor-oath ', 'harbor-oath'],
      evolvedAt: '2026-04-18T12:42:00.000Z',
    },
  );

  assert.deepEqual(evolvedCulture.valueIds, ['craft', 'scholarship']);
  assert.deepEqual(evolvedCulture.traditionIds, ['harbor-oath', 'harvest-song']);
});

test('evolveCulture rejects invalid payloads and conflicting list mutations', () => {
  assert.throws(
    () =>
      evolveCulture(
        {
          id: 'culture-aurora',
          name: 'Aurora Compact',
          archetype: 'mercantile',
          primaryLanguage: 'trade-speech',
          valueIds: [],
          traditionIds: [],
          openness: 50,
          cohesion: 50,
          researchDrive: 50,
        },
        {
          opennessDelta: 1.5,
        },
      ),
    /evolveCulture evolution.opennessDelta must be an integer between -100 and 100/,
  );

  assert.throws(
    () =>
      evolveCulture(
        {
          id: 'culture-aurora',
          name: 'Aurora Compact',
          archetype: 'mercantile',
          primaryLanguage: 'trade-speech',
          valueIds: ['craft'],
          traditionIds: [],
          openness: 50,
          cohesion: 50,
          researchDrive: 50,
        },
        {
          addedValueIds: ['craft'],
          removedValueIds: [' craft '],
        },
      ),
    /evolveCulture cannot add and remove the same value id in one evolution/,
  );

  assert.throws(
    () =>
      evolveCulture(
        {
          id: 'culture-aurora',
          name: 'Aurora Compact',
          archetype: 'mercantile',
          primaryLanguage: 'trade-speech',
          valueIds: [],
          traditionIds: [],
          openness: 50,
          cohesion: 50,
          researchDrive: 50,
        },
        {
          evolvedAt: 'not-a-date',
        },
      ),
    /evolveCulture evolution.evolvedAt must be a valid date/,
  );
});
