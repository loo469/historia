import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateCulturalDrift } from '../../../src/application/culture/evaluateCulturalDrift.js';

test('evaluateCulturalDrift combines pressure and contact into cultural drift', () => {
  const result = evaluateCulturalDrift(
    {
      id: 'culture-state-north',
      cultureId: 'culture-north',
      stability: 12,
      values: {
        tradition: 5,
        openness: 2,
      },
    },
    {
      pressure: {
        tradition: -0.4,
        openness: 0.3,
      },
      contact: {
        openness: 0.5,
        scholarship: 0.2,
      },
      resilience: 0.1,
    },
  );

  assert.deepEqual(result.values, {
    tradition: 4.5,
    openness: 2.7,
    scholarship: 0.1,
  });
  assert.deepEqual(result.appliedDrift, {
    tradition: -0.5,
    openness: 0.7,
    scholarship: 0.1,
  });
  assert.equal(result.stability, 11.87);
});

test('evaluateCulturalDrift handles resilient cultures with no net change', () => {
  const result = evaluateCulturalDrift(
    {
      id: 'culture-state-east',
      cultureId: 'culture-east',
      stability: 9,
      values: {
        ritual: 3,
      },
    },
    {
      pressure: {
        ritual: 0.2,
      },
      contact: {
        ritual: 0.1,
      },
      resilience: 0.3,
    },
  );

  assert.deepEqual(result.values, { ritual: 3 });
  assert.deepEqual(result.appliedDrift, { ritual: 0 });
  assert.equal(result.stability, 9);
});

test('evaluateCulturalDrift rejects invalid culture states and drift inputs', () => {
  assert.throws(
    () => evaluateCulturalDrift(null, {}),
    /evaluateCulturalDrift cultureState must be an object/,
  );

  assert.throws(
    () =>
      evaluateCulturalDrift(
        {
          id: 'culture-state-south',
          cultureId: 'culture-south',
          stability: 'high',
          values: {},
        },
        { pressure: {}, contact: {}, resilience: 0 },
      ),
    /evaluateCulturalDrift cultureState.stability must be a finite number/,
  );

  assert.throws(
    () =>
      evaluateCulturalDrift(
        {
          id: 'culture-state-south',
          cultureId: 'culture-south',
          stability: 8,
          values: { ritual: 2 },
        },
        { pressure: { ritual: '0.2' }, contact: {}, resilience: 0 },
      ),
    /evaluateCulturalDrift driftInputs.pressure.ritual must be a finite number/,
  );
});
