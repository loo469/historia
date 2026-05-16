import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas military outcome timeline derives compact province history from carry-over queue', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryCarryOverOutcomeTimeline\(carryOverQueue\)/);
  assert.match(webAppSource, /const items = carryOverQueue\?\.items \?\? \[\]/);
  assert.match(webAppSource, /items\.slice\(0, 3\)\.map/);
  assert.match(webAppSource, /renderAtlasMilitaryCarryOverOutcomeTimeline\(carryOverOutcomeTimeline\)/);
});

test('atlas military outcome timeline shows recent results decision impact and next carry-over', () => {
  assert.match(webAppSource, /step: 'résultat'/);
  assert.match(webAppSource, /step: 'décision'/);
  assert.match(webAppSource, /step: 'prochain'/);
  assert.match(webAppSource, /ordre maintenu/);
  assert.match(webAppSource, /ordre à revoir/);
  assert.match(webAppSource, /conflit non résolu/);
});

test('atlas military outcome timeline stays compact accessible and has an empty state', () => {
  assert.match(webAppSource, /Timeline carry-over vide: aucune province contestée à suivre/);
  assert.match(webAppSource, /Timeline des décisions de provinces contestées/);
  assert.match(webAppSource, /data-atlas-outcome-timeline/);
  assert.match(webAppSource, /is-decision-changing/);
  assert.match(stylesSource, /\.atlas-military-outcome-timeline__panel/);
  assert.match(stylesSource, /\.atlas-military-outcome-timeline-entry\.is-decision-changing circle/);
});
