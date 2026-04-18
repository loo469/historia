import test from 'node:test';
import assert from 'node:assert/strict';

import { evolveCulture } from '../../../src/application/culture/evolveCulture.js';
import { Culture } from '../../../src/domain/culture/Culture.js';

test('evolveCulture updates culture scores and traditions immutably from drift inputs', () => {
  const culture = new Culture({
    id: 'culture-aurora',
    name: 'Aurora Compact',
    archetype: 'mercantile',
    primaryLanguage: 'trade-speech',
    valueIds: ['craft'],
    traditionIds: ['harvest-song', 'harbor-oath'],
    openness: 54,
    cohesion: 58,
    researchDrive: 57,
  });

  const evolvedCulture = evolveCulture(culture, {
    driftInputs: {
      pressure: {
        openness: 6,
        researchDrive: 5,
        cohesion: -1,
      },
      contact: {
        openness: 3,
        researchDrive: 2,
      },
      resilience: 1,
    },
    adoptedValueIds: ['seafaring'],
    retiredTraditionIds: ['harbor-oath'],
    emergentTraditionIds: ['river-moot'],
    evolvedAt: '2026-04-18T17:00:00.000Z',
  });

  assert.notEqual(evolvedCulture, culture);
  assert.equal(evolvedCulture.openness, 62);
  assert.equal(evolvedCulture.researchDrive, 63);
  assert.equal(evolvedCulture.cohesion, 56);
  assert.deepEqual(evolvedCulture.valueIds, ['craft', 'exchange', 'innovation', 'seafaring']);
  assert.deepEqual(evolvedCulture.traditionIds, ['harvest-song', 'river-moot']);
  assert.equal(evolvedCulture.lastEvolvedAt?.toISOString(), '2026-04-18T17:00:00.000Z');

  assert.deepEqual(culture.valueIds, ['craft']);
  assert.deepEqual(culture.traditionIds, ['harbor-oath', 'harvest-song']);
});

test('evolveCulture clamps scores inside culture bounds and can derive continuity', () => {
  const evolvedCulture = evolveCulture(
    {
      id: 'culture-cedar',
      name: 'Cedar Chorus',
      archetype: 'ritualist',
      primaryLanguage: 'cedar-tongue',
      valueIds: [],
      traditionIds: ['solstice-chant'],
      openness: 2,
      cohesion: 64,
      researchDrive: 1,
    },
    {
      driftInputs: {
        pressure: {
          openness: -10,
          researchDrive: -2,
          cohesion: 4,
        },
        contact: {
          cohesion: 1,
        },
        resilience: 0,
      },
      emergentTraditionIds: ['ancestral-ledger'],
    },
  );

  assert.equal(evolvedCulture.openness, 0);
  assert.equal(evolvedCulture.researchDrive, 0);
  assert.equal(evolvedCulture.cohesion, 62);
  assert.deepEqual(evolvedCulture.valueIds, ['continuity']);
  assert.deepEqual(evolvedCulture.traditionIds, ['ancestral-ledger', 'solstice-chant']);
});

test('evolveCulture rejects invalid evolution payloads', () => {
  assert.throws(() => evolveCulture(null, {}), /Cannot destructure property 'id'/);

  assert.throws(
    () =>
      evolveCulture(
        {
          id: 'culture-aurora',
          name: 'Aurora Compact',
          archetype: 'mercantile',
          primaryLanguage: 'trade-speech',
        },
        null,
      ),
    /evolveCulture evolutionInputs must be an object/,
  );

  assert.throws(
    () =>
      evolveCulture(
        {
          id: 'culture-aurora',
          name: 'Aurora Compact',
          archetype: 'mercantile',
          primaryLanguage: 'trade-speech',
        },
        {
          adoptedValueIds: [''],
        },
      ),
    /evolveCulture evolutionInputs.adoptedValueIds is required/,
  );
});
