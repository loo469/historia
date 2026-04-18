import test from 'node:test';
import assert from 'node:assert/strict';

import { NiveauAlerte } from '../../../src/domain/intrigue/NiveauAlerte.js';

test('NiveauAlerte exposes a stable alert scale', () => {
  const level = new NiveauAlerte(2);

  assert.deepEqual(level.toJSON(), {
    value: 2,
    code: 'renforce',
    label: 'Renforcé',
    surveillanceIntensity: 55,
  });

  assert.equal(level.isCritical, false);
  assert.deepEqual(
    NiveauAlerte.all().map((entry) => entry.code),
    ['latent', 'surveille', 'renforce', 'critique', 'verrouille'],
  );
});

test('NiveauAlerte supports clamped escalation and de-escalation', () => {
  const latent = NiveauAlerte.minimum();
  const escalated = latent.increase(3);
  const maximum = escalated.increase(5);
  const reduced = maximum.decrease(2);

  assert.notEqual(escalated, latent);
  assert.equal(escalated.value, 3);
  assert.equal(escalated.code, 'critique');
  assert.equal(escalated.isCritical, true);
  assert.equal(maximum.value, 4);
  assert.equal(reduced.value, 2);
  assert.equal(reduced.code, 'renforce');
});

test('NiveauAlerte can be created from code or another instance', () => {
  const fromCode = NiveauAlerte.from(' verrouille ');
  const cloned = NiveauAlerte.from(fromCode);

  assert.equal(fromCode.value, 4);
  assert.equal(fromCode.label, 'Verrouillé');
  assert.notEqual(cloned, fromCode);
  assert.equal(cloned.equals(fromCode), true);
});

test('NiveauAlerte rejects invalid values, codes, and steps', () => {
  assert.throws(() => new NiveauAlerte(9), /NiveauAlerte value must be an integer between 0 and 4/);

  assert.throws(
    () => NiveauAlerte.from('panic'),
    /NiveauAlerte code must be one of: latent, surveille, renforce, critique, verrouille/,
  );

  assert.throws(
    () => new NiveauAlerte(1).increase(-1),
    /NiveauAlerte step must be a non-negative integer/,
  );
});
