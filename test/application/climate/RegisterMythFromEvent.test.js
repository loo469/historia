import test from 'node:test';
import assert from 'node:assert/strict';

import { RegisterMythFromEvent } from '../../../src/application/climate/RegisterMythFromEvent.js';
import { Catastrophe } from '../../../src/domain/climate/Catastrophe.js';

test('RegisterMythFromEvent turns a catastrophe into a structured myth', () => {
  const useCase = new RegisterMythFromEvent();
  const event = new Catastrophe({
    id: 'sunreach-drought-summer',
    type: 'drought',
    severity: 'critical',
    status: 'active',
    regionIds: ['sunreach'],
    startedAt: '2026-04-18T13:30:00.000Z',
    impact: { harvest: -50, unrest: -12 },
  });

  const result = useCase.execute({
    event,
    createdAt: '2026-04-18T14:00:00.000Z',
  });

  assert.equal(result.sourceEvent, event);
  assert.equal(result.myth.id, 'myth-sunreach-drought-summer');
  assert.equal(result.myth.title, 'The Withering Season');
  assert.equal(result.myth.category, 'catastrophe');
  assert.equal(result.myth.credibility, 84);
  assert.deepEqual(result.myth.originEventIds, ['sunreach-drought-summer']);
  assert.deepEqual(result.myth.regions, ['sunreach']);
  assert.deepEqual(result.myth.tags, ['active', 'critical', 'drought']);
  assert.match(result.myth.summary, /sunreach/);
});

test('RegisterMythFromEvent accepts plain event payloads and adapts credibility', () => {
  const useCase = new RegisterMythFromEvent();

  const result = useCase.execute({
    event: {
      id: 'riverlands-flood-winter',
      type: 'flood',
      severity: 'major',
      status: 'resolved',
      regionIds: ['riverlands'],
      startedAt: '2026-04-18T10:00:00.000Z',
      resolvedAt: '2026-04-18T12:00:00.000Z',
      impact: { infrastructure: -22 },
    },
    createdAt: '2026-04-18T12:10:00.000Z',
  });

  assert.equal(result.myth.category, 'catastrophe');
  assert.equal(result.myth.credibility, 52);
  assert.equal(result.myth.title, 'The River Without Mercy');
});

test('RegisterMythFromEvent rejects invalid events', () => {
  const useCase = new RegisterMythFromEvent();

  assert.throws(
    () => useCase.execute({ event: null }),
    /event must be an object or Catastrophe/,
  );
});
