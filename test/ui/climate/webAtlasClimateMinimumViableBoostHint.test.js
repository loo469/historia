import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

const minimumViableBoostFixture = [
  {
    outcome: 'executable',
    state: 'minimal-sufficient',
    level: 'minimum suffisant',
    package: '1 équipe + réserve ciblée',
  },
  {
    outcome: 'still-tight',
    state: 'partial-worthwhile',
    level: 'minimum utile',
    package: '1 équipe + jalon avancé',
  },
  {
    outcome: 'insufficient',
    state: 'insufficient-minimum',
    level: 'minimum insuffisant',
    package: 'paquet minimal + arbitrage requis',
  },
];

test('atlas shows a minimum viable boost hint only for the top ranked climate readiness boost', () => {
  assert.match(webAppSource, /function buildAtlasClimateMinimumViableBoostHint/);
  assert.match(webAppSource, /function renderAtlasClimateMinimumViableBoostHint/);
  assert.match(webAppSource, /reliefRankingView\.state !== 'ranked'/);
  assert.match(webAppSource, /Aucun boost climat prioritaire éligible à réduire au minimum viable/);
  assert.match(webAppSource, /const topBoost = reliefRankingView\.rankedBoosts\[0\]/);
  assert.match(webAppSource, /Minimum viable boost/);
  assert.match(webAppSource, /Relief attendu/);
  assert.match(webAppSource, /atlasClimateMinimumViableBoostHint = buildAtlasClimateMinimumViableBoostHint\(atlasClimateReadinessBoostReliefRanking\)/);
  assert.match(webAppSource, /renderAtlasClimateMinimumViableBoostHint\(atlasClimateMinimumViableBoostHint\)/);

  for (const fixture of minimumViableBoostFixture) {
    assert.match(webAppSource, new RegExp(fixture.outcome));
    assert.match(webAppSource, new RegExp(fixture.state));
    assert.match(webAppSource, new RegExp(fixture.level));
    assert.match(webAppSource, new RegExp(fixture.package.replace('+', '\\+')));
  }

  assert.match(stylesSource, /\.map-world-climate-minimum-boost/);
  assert.match(stylesSource, /\.map-world-climate-minimum-boost--partial-worthwhile/);
  assert.match(stylesSource, /\.map-world-climate-minimum-boost--insufficient-minimum/);
});
