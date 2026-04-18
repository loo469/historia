import test from 'node:test';
import assert from 'node:assert/strict';

import { CultureRepositoryPort } from '../../../src/domain/culture/CultureRepositoryPort.js';

test('CultureRepositoryPort validates identifiers before delegating to adapters', async () => {
  const port = new CultureRepositoryPort();

  await assert.rejects(() => port.getById(''), /CultureRepositoryPort cultureId is required/);
  await assert.rejects(() => port.listByEra('   '), /CultureRepositoryPort eraId is required/);
});

test('CultureRepositoryPort validates culture payloads before save', async () => {
  const port = new CultureRepositoryPort();

  await assert.rejects(() => port.save(null), /CultureRepositoryPort culture must be an object/);
  await assert.rejects(() => port.save({ id: 'culture-north', name: ' ' }), /CultureRepositoryPort culture.name is required/);
  await assert.rejects(() => port.save({ id: ' ', name: 'Northern Scriptorium' }), /CultureRepositoryPort culture.id is required/);
});

test('CultureRepositoryPort exposes explicit adapter implementation errors', async () => {
  const port = new CultureRepositoryPort();
  const culture = { id: 'culture-north', name: 'Northern Scriptorium', eraId: 'late-medieval' };

  await assert.rejects(
    () => port.getById('culture-north'),
    /CultureRepositoryPort\.getById must be implemented by an adapter/,
  );
  await assert.rejects(
    () => port.save(culture),
    /CultureRepositoryPort\.save must be implemented by an adapter/,
  );
  await assert.rejects(
    () => port.listByEra('late-medieval'),
    /CultureRepositoryPort\.listByEra must be implemented by an adapter/,
  );
});
