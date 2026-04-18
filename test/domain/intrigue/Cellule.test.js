import test from 'node:test';
import assert from 'node:assert/strict';

import { Cellule } from '../../../src/domain/intrigue/Cellule.js';

test('Cellule normalizes intrigue fields and computes readiness', () => {
  const cellule = new Cellule({
    id: '  cellule-ombre ',
    factionId: ' faction-nocturne ',
    codename: ' Les Lanternes ',
    locationId: ' district-cendre ',
    memberIds: ['agent-2', ' agent-1 ', 'agent-2'],
    assetIds: ['safehouse-3', ' safehouse-1 ', 'safehouse-3'],
    operationIds: ['op-rumeur', ' op-filature ', 'op-rumeur'],
    secrecy: 72,
    loyalty: 81,
    exposure: 15,
    sleeper: 1,
  });

  assert.deepEqual(cellule.toJSON(), {
    id: 'cellule-ombre',
    factionId: 'faction-nocturne',
    codename: 'Les Lanternes',
    locationId: 'district-cendre',
    memberIds: ['agent-1', 'agent-2'],
    assetIds: ['safehouse-1', 'safehouse-3'],
    operationIds: ['op-filature', 'op-rumeur'],
    secrecy: 72,
    loyalty: 81,
    exposure: 15,
    status: 'active',
    sleeper: true,
  });

  assert.equal(cellule.operationalReadiness, 79);
  assert.equal(cellule.isExposed, false);
});

test('Cellule supports immutable exposure and operation updates', () => {
  const cellule = new Cellule({
    id: 'cellule-ombre',
    factionId: 'faction-nocturne',
    codename: 'Les Lanternes',
    locationId: 'district-cendre',
    secrecy: 72,
    loyalty: 81,
    exposure: 15,
    status: 'dormant',
    sleeper: true,
  });

  const assignedCellule = cellule.assignOperation('op-rumeur');
  const compromisedCellule = assignedCellule.withExposure(74);

  assert.notEqual(assignedCellule, cellule);
  assert.notEqual(compromisedCellule, assignedCellule);
  assert.deepEqual(assignedCellule.operationIds, ['op-rumeur']);
  assert.equal(assignedCellule.status, 'active');
  assert.equal(assignedCellule.sleeper, false);
  assert.equal(compromisedCellule.status, 'compromised');
  assert.equal(compromisedCellule.isExposed, true);

  assert.deepEqual(cellule.operationIds, []);
  assert.equal(cellule.status, 'dormant');
  assert.equal(cellule.sleeper, true);
});

test('Cellule rejects invalid intrigue invariants', () => {
  assert.throws(
    () =>
      new Cellule({
        id: '',
        factionId: 'faction-nocturne',
        codename: 'Les Lanternes',
        locationId: 'district-cendre',
      }),
    /Cellule id is required/,
  );

  assert.throws(
    () =>
      new Cellule({
        id: 'cellule-ombre',
        factionId: 'faction-nocturne',
        codename: 'Les Lanternes',
        locationId: 'district-cendre',
        memberIds: ['agent-1', ''],
      }),
    /Cellule memberIds cannot contain empty values/,
  );

  assert.throws(
    () =>
      new Cellule({
        id: 'cellule-ombre',
        factionId: 'faction-nocturne',
        codename: 'Les Lanternes',
        locationId: 'district-cendre',
        secrecy: 101,
      }),
    /Cellule secrecy must be an integer between 0 and 100/,
  );

  assert.throws(
    () =>
      new Cellule({
        id: 'cellule-ombre',
        factionId: 'faction-nocturne',
        codename: 'Les Lanternes',
        locationId: 'district-cendre',
        status: 'unknown',
      }),
    /Cellule status must be one of: active, dormant, compromised, dismantled/,
  );
});
