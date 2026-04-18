import test from 'node:test';
import assert from 'node:assert/strict';

import { Agent } from '../../../src/domain/intrigue/Agent.js';

test('Agent normalizes intrigue operative fields', () => {
  const agent = new Agent({
    id: '  agent-corbeau ',
    codename: ' La Cendre ',
    factionId: ' faction-nocturne ',
    celluleId: ' cellule-ombre ',
    specialtyIds: ['infiltration', ' sabotage ', 'infiltration'],
    contactIds: ['contact-b', ' contact-a ', 'contact-b'],
    coverIdentity: '  archiviste itinérant ',
    discretion: 88,
    influence: 61,
    health: 93,
    coverStrength: 77,
  });

  assert.deepEqual(agent.toJSON(), {
    id: 'agent-corbeau',
    codename: 'La Cendre',
    factionId: 'faction-nocturne',
    celluleId: 'cellule-ombre',
    specialtyIds: ['infiltration', 'sabotage'],
    contactIds: ['contact-a', 'contact-b'],
    coverIdentity: 'archiviste itinérant',
    discretion: 88,
    influence: 61,
    health: 93,
    coverStrength: 77,
    status: 'active',
    compromised: false,
  });

  assert.equal(agent.operationalValue, 80);
  assert.equal(agent.isOperational, true);
});

test('Agent supports immutable compromise and contact updates', () => {
  const agent = new Agent({
    id: 'agent-corbeau',
    codename: 'La Cendre',
    factionId: 'faction-nocturne',
    celluleId: 'cellule-ombre',
    status: 'undercover',
    coverStrength: 72,
  });

  const networkedAgent = agent.assignContact('contact-zeta');
  const compromisedAgent = networkedAgent.withCompromise({
    compromised: true,
    coverStrength: 18,
  });

  assert.notEqual(networkedAgent, agent);
  assert.notEqual(compromisedAgent, networkedAgent);
  assert.deepEqual(networkedAgent.contactIds, ['contact-zeta']);
  assert.equal(compromisedAgent.compromised, true);
  assert.equal(compromisedAgent.status, 'missing');
  assert.equal(compromisedAgent.coverStrength, 18);
  assert.equal(compromisedAgent.isOperational, false);

  assert.deepEqual(agent.contactIds, []);
  assert.equal(agent.status, 'undercover');
  assert.equal(agent.compromised, false);
});

test('Agent rejects invalid operative invariants', () => {
  assert.throws(
    () =>
      new Agent({
        id: '',
        codename: 'La Cendre',
        factionId: 'faction-nocturne',
        celluleId: 'cellule-ombre',
      }),
    /Agent id is required/,
  );

  assert.throws(
    () =>
      new Agent({
        id: 'agent-corbeau',
        codename: 'La Cendre',
        factionId: 'faction-nocturne',
        celluleId: 'cellule-ombre',
        specialtyIds: ['infiltration', ''],
      }),
    /Agent specialtyIds cannot contain empty values/,
  );

  assert.throws(
    () =>
      new Agent({
        id: 'agent-corbeau',
        codename: 'La Cendre',
        factionId: 'faction-nocturne',
        celluleId: 'cellule-ombre',
        coverStrength: 101,
      }),
    /Agent coverStrength must be an integer between 0 and 100/,
  );

  assert.throws(
    () =>
      new Agent({
        id: 'agent-corbeau',
        codename: 'La Cendre',
        factionId: 'faction-nocturne',
        celluleId: 'cellule-ombre',
        status: 'legendary',
      }),
    /Agent status must be one of: active, undercover, captured, retired, missing/,
  );
});
