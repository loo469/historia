import test from 'node:test';
import assert from 'node:assert/strict';

import { SeasonCycle } from '../../../src/domain/climate/SeasonCycle.js';

test('SeasonCycle normalizes and exposes seasonal progression fields', () => {
  const cycle = new SeasonCycle({
    currentSeason: ' spring ',
    year: 3,
    dayOfSeason: 7,
    seasonLengthDays: 20,
  });

  assert.deepEqual(cycle.toJSON(), {
    currentSeason: 'spring',
    year: 3,
    dayOfSeason: 7,
    seasonLengthDays: 20,
    seasonOrder: ['spring', 'summer', 'autumn', 'winter'],
    nextSeason: 'summer',
    progressRatio: 7 / 20,
  });
});

test('SeasonCycle advances across season and year boundaries immutably', () => {
  const cycle = new SeasonCycle({
    currentSeason: 'winter',
    year: 8,
    dayOfSeason: 29,
    seasonLengthDays: 30,
  });

  const nextDay = cycle.advanceDays();
  const nextSeason = nextDay.advanceDays();

  assert.notEqual(nextDay, cycle);
  assert.equal(nextDay.currentSeason, 'winter');
  assert.equal(nextDay.dayOfSeason, 30);
  assert.equal(nextDay.year, 8);

  assert.equal(nextSeason.currentSeason, 'spring');
  assert.equal(nextSeason.dayOfSeason, 1);
  assert.equal(nextSeason.year, 9);

  assert.equal(cycle.currentSeason, 'winter');
  assert.equal(cycle.dayOfSeason, 29);
  assert.equal(cycle.year, 8);
});

test('SeasonCycle can advance directly to the next season', () => {
  const cycle = new SeasonCycle({
    currentSeason: 'summer',
    year: 2,
    dayOfSeason: 12,
    seasonLengthDays: 15,
  });

  const advanced = cycle.advanceSeason();

  assert.equal(advanced.currentSeason, 'autumn');
  assert.equal(advanced.dayOfSeason, 1);
  assert.equal(advanced.year, 2);
});

test('SeasonCycle rejects invalid configuration', () => {
  assert.throws(
    () => new SeasonCycle({ currentSeason: '', year: 1 }),
    /SeasonCycle currentSeason is required/,
  );

  assert.throws(
    () => new SeasonCycle({ currentSeason: 'monsoon', seasonOrder: ['spring', 'summer'] }),
    /currentSeason must be included in seasonOrder/,
  );

  assert.throws(
    () => new SeasonCycle({ currentSeason: 'spring', dayOfSeason: 31, seasonLengthDays: 30 }),
    /dayOfSeason cannot exceed seasonLengthDays/,
  );

  assert.throws(
    () => new SeasonCycle({ currentSeason: 'spring', seasonOrder: ['spring', 'spring'] }),
    /seasonOrder cannot contain duplicates/,
  );
});
