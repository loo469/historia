import test from 'node:test';
import assert from 'node:assert/strict';

import { Rumeur } from '../../../src/domain/intrigue/Rumeur.js';

test('Rumeur normalizes rumor spread fields', () => {
  const rumeur = new Rumeur({
    id: ' rumeur-cendre ',
    sourceCelluleId: ' cellule-ombre ',
    targetFactionId: ' faction-aube ',
    category: 'political',
    narrative: ' le conseil prépare une purge des guildes ',
    originLocationId: ' port-nord ',
    relayIds: ['relay-b', ' relay-a ', 'relay-b'],
    affectedPopulationIds: ['dockers', ' guildes ', 'dockers'],
    credibility: 67,
    propagation: 54,
    tension: 71,
    truthValue: false,
  });

  assert.deepEqual(rumeur.toJSON(), {
    id: 'rumeur-cendre',
    sourceCelluleId: 'cellule-ombre',
    targetFactionId: 'faction-aube',
    category: 'political',
    narrative: 'le conseil prépare une purge des guildes',
    originLocationId: 'port-nord',
    relayIds: ['relay-a', 'relay-b'],
    affectedPopulationIds: ['dockers', 'guildes'],
    credibility: 67,
    propagation: 54,
    tension: 71,
    status: 'circulating',
    truthValue: false,
  });

  assert.equal(rumeur.influenceScore, 64);
  assert.equal(rumeur.isNeutralized, false);
});

test('Rumeur supports immutable relay and amplification updates', () => {
  const rumeur = new Rumeur({
    id: 'rumeur-cendre',
    sourceCelluleId: 'cellule-ombre',
    targetFactionId: 'faction-aube',
    category: 'social',
    narrative: 'des agents étrangers recrutent dans les tavernes',
    originLocationId: 'port-nord',
    propagation: 22,
    tension: 31,
    status: 'circulating',
  });

  const relayedRumeur = rumeur.addRelay('relay-guilde');
  const amplifiedRumeur = relayedRumeur.amplify({
    propagation: 64,
    tension: 58,
  });

  assert.notEqual(relayedRumeur, rumeur);
  assert.notEqual(amplifiedRumeur, relayedRumeur);
  assert.deepEqual(relayedRumeur.relayIds, ['relay-guilde']);
  assert.equal(amplifiedRumeur.status, 'amplified');
  assert.equal(amplifiedRumeur.propagation, 64);
  assert.equal(amplifiedRumeur.tension, 58);
  assert.deepEqual(rumeur.relayIds, []);
  assert.equal(rumeur.status, 'circulating');
});

test('Rumeur rejects invalid rumor invariants', () => {
  assert.throws(
    () =>
      new Rumeur({
        id: '',
        sourceCelluleId: 'cellule-ombre',
        targetFactionId: 'faction-aube',
        category: 'political',
        narrative: 'le conseil prépare une purge des guildes',
        originLocationId: 'port-nord',
      }),
    /Rumeur id is required/,
  );

  assert.throws(
    () =>
      new Rumeur({
        id: 'rumeur-cendre',
        sourceCelluleId: 'cellule-ombre',
        targetFactionId: 'faction-aube',
        category: 'arcane',
        narrative: 'le conseil prépare une purge des guildes',
        originLocationId: 'port-nord',
      }),
    /Rumeur category must be one of: military, political, economic, religious, social/,
  );

  assert.throws(
    () =>
      new Rumeur({
        id: 'rumeur-cendre',
        sourceCelluleId: 'cellule-ombre',
        targetFactionId: 'faction-aube',
        category: 'political',
        narrative: 'le conseil prépare une purge des guildes',
        originLocationId: 'port-nord',
        relayIds: ['relay-a', ''],
      }),
    /Rumeur relayIds cannot contain empty values/,
  );

  assert.throws(
    () =>
      new Rumeur({
        id: 'rumeur-cendre',
        sourceCelluleId: 'cellule-ombre',
        targetFactionId: 'faction-aube',
        category: 'political',
        narrative: 'le conseil prépare une purge des guildes',
        originLocationId: 'port-nord',
        truthValue: 'unknown',
      }),
    /Rumeur truthValue must be a boolean or null/,
  );
});
