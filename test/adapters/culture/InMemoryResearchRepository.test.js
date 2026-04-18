import test from 'node:test';
import assert from 'node:assert/strict';

import { InMemoryResearchRepository } from '../../../src/adapters/culture/InMemoryResearchRepository.js';

test('InMemoryResearchRepository returns stored research states by id and clones results', async () => {
  const repository = new InMemoryResearchRepository([
    {
      id: 'research-state-north',
      cultureId: 'culture-north',
      focusIds: ['astronomy', 'archives'],
    },
  ]);

  const researchState = await repository.getById('research-state-north');
  researchState.focusIds.push('mutated');
  const secondRead = await repository.getById('research-state-north');

  assert.equal(researchState.cultureId, 'culture-north');
  assert.deepEqual(secondRead.focusIds, ['archives', 'astronomy']);
});

test('InMemoryResearchRepository saves and lists research states by culture', async () => {
  const repository = new InMemoryResearchRepository();

  const savedResearchState = await repository.save({
    id: 'research-state-east',
    cultureId: 'culture-east',
    focusIds: ['translation', 'cartography', 'translation'],
  });

  const researchStates = await repository.listByCulture('culture-east');

  assert.equal(savedResearchState.id, 'research-state-east');
  assert.deepEqual(savedResearchState.focusIds, ['cartography', 'translation']);
  assert.equal(researchStates.length, 1);
  assert.equal(researchStates[0].cultureId, 'culture-east');
});

test('InMemoryResearchRepository validates payloads and identifiers', async () => {
  const repository = new InMemoryResearchRepository();

  await assert.rejects(
    () => repository.getById(''),
    /ResearchRepositoryPort researchStateId is required/,
  );
  await assert.rejects(
    () => repository.listByCulture('   '),
    /ResearchRepositoryPort cultureId is required/,
  );
  await assert.rejects(
    () => repository.save(null),
    /InMemoryResearchRepository researchState must be an object/,
  );
  await assert.rejects(
    () => repository.save({ id: 'research-state-west', cultureId: ' ', focusIds: [] }),
    /InMemoryResearchRepository researchState.cultureId is required/,
  );
  assert.throws(
    () =>
      new InMemoryResearchRepository([
        {
          id: 'research-state-west',
          cultureId: 'culture-west',
          focusIds: ['astronomy', ' '],
        },
      ]),
    /InMemoryResearchRepository researchState.focusIds\[\] is required/,
  );
});
