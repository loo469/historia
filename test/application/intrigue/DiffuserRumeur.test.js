import test from 'node:test';
import assert from 'node:assert/strict';

import { diffuserRumeur } from '../../../src/application/intrigue/DiffuserRumeur.js';

test('DiffuserRumeur amplifies a rumor through relay nodes when spread conditions are favorable', () => {
  const result = diffuserRumeur({
    rumeur: {
      id: 'rumeur-cendre',
      relayIds: ['relay-marche'],
      affectedPopulationIds: ['dockers'],
      credibility: 62,
      propagation: 24,
      tension: 18,
      status: 'circulating',
    },
    cellule: {
      id: 'cellule-ombre',
      secrecy: 78,
      exposure: 16,
    },
    alertLevel: 12,
    randomFactor: 19,
    relayIds: ['relay-guilde', 'relay-port'],
    affectedPopulationIds: ['guildes', 'citadins'],
  });

  assert.deepEqual(result, {
    spread: true,
    outcome: 'rumor-amplified',
    rumeur: {
      id: 'rumeur-cendre',
      relayIds: ['relay-guilde', 'relay-marche', 'relay-port'],
      affectedPopulationIds: ['citadins', 'dockers', 'guildes', 'relay-guilde', 'relay-marche', 'relay-port'],
      credibility: 62,
      propagation: 40,
      tension: 23,
      status: 'amplified',
    },
    summary: 'Rumor spread through 3 relay node(s).',
    spreadScore: 81,
  });
});

test('DiffuserRumeur can contain a rumor under pressure', () => {
  const result = diffuserRumeur({
    rumeur: {
      id: 'rumeur-cendre',
      relayIds: [],
      affectedPopulationIds: ['dockers'],
      credibility: 28,
      propagation: 20,
      tension: 17,
      status: 'circulating',
    },
    cellule: {
      id: 'cellule-ombre',
      secrecy: 30,
      exposure: 48,
    },
    alertLevel: 35,
    randomFactor: 2,
    relayIds: ['relay-guilde'],
  });

  assert.deepEqual(result, {
    spread: false,
    outcome: 'rumor-contained',
    rumeur: {
      id: 'rumeur-cendre',
      relayIds: ['relay-guilde'],
      affectedPopulationIds: ['dockers', 'relay-guilde'],
      credibility: 28,
      propagation: 28,
      tension: 23,
      status: 'contained',
    },
    summary: 'Rumor circulation was contained before broad amplification.',
    spreadScore: 0,
  });
});

test('DiffuserRumeur validates inputs', () => {
  assert.throws(
    () => diffuserRumeur({ rumeur: null, cellule: {} }),
    /DiffuserRumeur rumeur must be an object/,
  );

  assert.throws(
    () =>
      diffuserRumeur({
        rumeur: { id: 'rumeur-cendre', credibility: 50, propagation: 10, tension: 10, relayIds: [], affectedPopulationIds: [] },
        cellule: { id: 'cellule-ombre', secrecy: 50, exposure: 10 },
        alertLevel: 101,
      }),
    /DiffuserRumeur alertLevel must be an integer between 0 and 100/,
  );

  assert.throws(
    () =>
      diffuserRumeur({
        rumeur: { id: 'rumeur-cendre', credibility: 50, propagation: 10, tension: 10, relayIds: [''], affectedPopulationIds: [] },
        cellule: { id: 'cellule-ombre', secrecy: 50, exposure: 10 },
      }),
    /DiffuserRumeur rumeur relayIds cannot contain empty values/,
  );
});
