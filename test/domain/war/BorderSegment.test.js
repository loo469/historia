import test from 'node:test';
import assert from 'node:assert/strict';

import { BorderSegment } from '../../../src/domain/war/BorderSegment.js';

test('BorderSegment normalizes province order and derives a stable id', () => {
  const segment = new BorderSegment({
    provinceAId: 'province-west',
    provinceBId: 'province-east',
    terrainType: 'river',
    pressure: 12,
    length: 3,
    position: 1,
  });

  assert.deepEqual(segment.toJSON(), {
    id: 'province-east::province-west',
    provinceAId: 'province-east',
    provinceBId: 'province-west',
    terrainType: 'river',
    pressure: 12,
    contested: false,
    chokepoint: false,
    length: 3,
    position: 1,
  });

  assert.equal(segment.dominantProvinceId, 'province-east');
});

test('BorderSegment tracks contested pressure through immutable updates', () => {
  const segment = new BorderSegment({
    id: 'custom-segment',
    provinceAId: 'province-a',
    provinceBId: 'province-b',
    terrainType: 'forest',
    chokepoint: true,
  });

  const contestedSegment = segment.withPressure(-25);
  const neutralSegment = contestedSegment.withPressure(0);

  assert.notEqual(contestedSegment, segment);
  assert.equal(contestedSegment.contested, true);
  assert.equal(contestedSegment.dominantProvinceId, 'province-b');
  assert.equal(contestedSegment.chokepoint, true);

  assert.equal(neutralSegment.contested, false);
  assert.equal(neutralSegment.dominantProvinceId, null);
  assert.equal(segment.pressure, 0);
});

test('BorderSegment rejects invalid borders and invalid metrics', () => {
  assert.throws(
    () =>
      new BorderSegment({
        provinceAId: 'province-a',
        provinceBId: 'province-a',
        terrainType: 'plain',
      }),
    /BorderSegment provinces must be different/,
  );

  assert.throws(
    () =>
      new BorderSegment({
        provinceAId: 'province-a',
        provinceBId: 'province-b',
        terrainType: 'plain',
        pressure: 101,
      }),
    /BorderSegment pressure must be an integer between -100 and 100/,
  );

  assert.throws(
    () =>
      new BorderSegment({
        provinceAId: 'province-a',
        provinceBId: 'province-b',
        terrainType: 'plain',
        length: 0,
      }),
    /BorderSegment length must be greater than 0/,
  );
});
