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

test('Cellule marks network exposure when heat crosses the compromise threshold', () => {
  const cellule = new Cellule({
    id: 'cellule-ombre',
    factionId: 'faction-nocturne',
    codename: 'Les Lanternes',
    locationId: 'district-cendre',
    secrecy: 76,
    loyalty: 84,
    exposure: 68,
    status: 'active',
  });

  const thresholdCellule = cellule.withExposure(69);
  const exposedCellule = cellule.withExposure(70);
  const deeplyExposedCellule = exposedCellule.withExposure(92);

  assert.equal(cellule.isExposed, false);
  assert.equal(thresholdCellule.isExposed, false);
  assert.equal(thresholdCellule.status, 'active');
  assert.equal(thresholdCellule.operationalReadiness, 64);
  assert.equal(exposedCellule.isExposed, true);
  assert.equal(exposedCellule.status, 'compromised');
  assert.equal(exposedCellule.operationalReadiness, 63);
  assert.equal(deeplyExposedCellule.isExposed, true);
  assert.equal(deeplyExposedCellule.status, 'compromised');
  assert.equal(deeplyExposedCellule.operationalReadiness, 56);
});

test('Cellule keeps compromised network status explicit even when exposure later drops', () => {
  const cellule = new Cellule({
    id: 'cellule-ombre',
    factionId: 'faction-nocturne',
    codename: 'Les Lanternes',
    locationId: 'district-cendre',
    secrecy: 61,
    loyalty: 74,
    exposure: 73,
    status: 'compromised',
  });

  const cooledDownCellule = cellule.withExposure(18);

  assert.equal(cooledDownCellule.exposure, 18);
  assert.equal(cooledDownCellule.status, 'compromised');
  assert.equal(cooledDownCellule.isExposed, true);
  assert.equal(cooledDownCellule.operationalReadiness, 72);
});

test('Cellule keeps a dismantled network dismantled even when exposure changes', () => {
  const cellule = new Cellule({
    id: 'cellule-ombre',
    factionId: 'faction-nocturne',
    codename: 'Les Lanternes',
    locationId: 'district-cendre',
    secrecy: 50,
    loyalty: 40,
    exposure: 88,
    status: 'dismantled',
  });

  const lessExposedCellule = cellule.withExposure(12);
  const reassignedCellule = cellule.assignOperation('op-cendre');

  assert.equal(lessExposedCellule.status, 'dismantled');
  assert.equal(lessExposedCellule.isExposed, false);
  assert.equal(reassignedCellule.status, 'dismantled');
  assert.deepEqual(reassignedCellule.operationIds, ['op-cendre']);
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
