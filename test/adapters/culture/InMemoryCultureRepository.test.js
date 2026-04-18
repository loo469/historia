import test from 'node:test';
import assert from 'node:assert/strict';

import { InMemoryCultureRepository } from '../../../src/adapters/culture/InMemoryCultureRepository.js';

test('InMemoryCultureRepository returns stored cultures by id and clones results', async () => {
  const repository = new InMemoryCultureRepository([
    {
      id: 'culture-north',
      name: 'Northern Scriptorium',
      eraId: 'late-medieval',
      tags: ['archives', 'maritime'],
    },
  ]);

  const culture = await repository.getById('culture-north');
  culture.tags.push('mutated');
  const secondRead = await repository.getById('culture-north');

  assert.equal(culture.name, 'Northern Scriptorium');
  assert.deepEqual(secondRead.tags, ['archives', 'maritime']);
});

test('InMemoryCultureRepository saves and lists cultures by era', async () => {
  const repository = new InMemoryCultureRepository();

  const savedCulture = await repository.save({
    id: 'culture-east',
    name: 'Eastern Annalists',
    eraId: 'early-modern',
    tags: ['diplomacy', 'translation', 'diplomacy'],
  });

  const cultures = await repository.listByEra('early-modern');

  assert.equal(savedCulture.id, 'culture-east');
  assert.deepEqual(savedCulture.tags, ['diplomacy', 'translation']);
  assert.equal(cultures.length, 1);
  assert.equal(cultures[0].name, 'Eastern Annalists');
});

test('InMemoryCultureRepository validates payloads and identifiers', async () => {
  const repository = new InMemoryCultureRepository();

  await assert.rejects(() => repository.getById(''), /CultureRepositoryPort cultureId is required/);
  await assert.rejects(() => repository.listByEra('   '), /CultureRepositoryPort eraId is required/);
  await assert.rejects(() => repository.save(null), /InMemoryCultureRepository culture must be an object/);
  await assert.rejects(
    () => repository.save({ id: 'culture-west', name: 'Western Chroniclers', eraId: ' ', tags: [] }),
    /InMemoryCultureRepository culture.eraId is required/,
  );
  assert.throws(
    () => new InMemoryCultureRepository([{ id: 'culture-west', name: 'Western Chroniclers', eraId: 'classical', tags: ['valid', ' '] }]),
    /InMemoryCultureRepository culture.tags\[\] is required/,
  );
});
