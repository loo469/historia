import test from 'node:test';
import assert from 'node:assert/strict';

import { ResearchRepositoryPort } from '../../../src/domain/culture/ResearchRepositoryPort.js';

test('ResearchRepositoryPort validates identifiers before delegating to adapters', async () => {
  const port = new ResearchRepositoryPort();

  await assert.rejects(() => port.getById(''), /ResearchRepositoryPort researchStateId is required/);
  await assert.rejects(() => port.listByCulture('   '), /ResearchRepositoryPort cultureId is required/);
});

test('ResearchRepositoryPort validates research state payloads before save', async () => {
  const port = new ResearchRepositoryPort();

  await assert.rejects(() => port.save(null), /ResearchRepositoryPort researchState must be an object/);
  await assert.rejects(
    () => port.save({ id: 'research-state-1', cultureId: 'culture-north', focusIds: ['archives', ' '] }),
    /ResearchRepositoryPort researchState.focusIds cannot contain empty values/,
  );
  await assert.rejects(
    () => port.save({ id: ' ', cultureId: 'culture-north', focusIds: [] }),
    /ResearchRepositoryPort researchState.id is required/,
  );
  await assert.rejects(
    () => port.save({ id: 'research-state-1', cultureId: ' ', focusIds: [] }),
    /ResearchRepositoryPort researchState.cultureId is required/,
  );
});

test('ResearchRepositoryPort exposes explicit adapter implementation errors', async () => {
  const port = new ResearchRepositoryPort();
  const researchState = {
    id: 'research-state-1',
    cultureId: 'culture-north',
    focusIds: ['archives', 'astronomy'],
  };

  await assert.rejects(
    () => port.getById('research-state-1'),
    /ResearchRepositoryPort\.getById must be implemented by an adapter/,
  );
  await assert.rejects(
    () => port.save(researchState),
    /ResearchRepositoryPort\.save must be implemented by an adapter/,
  );
  await assert.rejects(
    () => port.listByCulture('culture-north'),
    /ResearchRepositoryPort\.listByCulture must be implemented by an adapter/,
  );
});
