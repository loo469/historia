import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas military carry-over queue derives next-turn follow-ups from post-resolution audit rows', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryNextTurnCarryOverQueue\(postResolutionAudit, shell\)/);
  assert.match(webAppSource, /const auditRows = postResolutionAudit\?\.rows \?\? \[\]/);
  assert.match(webAppSource, /getAtlasMilitaryCarryOverKind\(row\.status\)/);
  assert.match(webAppSource, /renderAtlasMilitaryNextTurnCarryOverQueue\(nextTurnCarryOverQueue\)/);
});

test('atlas military carry-over queue separates required opportunistic and watch follow-ups', () => {
  assert.match(webAppSource, /return 'obligatoire'/);
  assert.match(webAppSource, /return 'opportuniste'/);
  assert.match(webAppSource, /return 'à surveiller'/);
  assert.match(webAppSource, /kind === 'obligatoire' \? 'required'/);
  assert.match(webAppSource, /kind === 'opportuniste' \? 'opportunistic'/);
});

test('atlas military carry-over queue explains resolution conditions and visible dependencies', () => {
  assert.match(webAppSource, /résolu si le front critique ou le blocage transversal est levé/);
  assert.match(webAppSource, /résolu si la province redevient couverte par un ordre prioritaire/);
  assert.match(webAppSource, /dependencies\.push\('logistique'\)/);
  assert.match(webAppSource, /dependencies\.push\('renseignement'\)/);
  assert.match(webAppSource, /dependencies\.push\('météo'\)/);
  assert.match(webAppSource, /data-atlas-carry-over-queue/);
  assert.match(stylesSource, /\.atlas-military-carry-over-queue__panel/);
  assert.match(stylesSource, /\.atlas-military-carry-over-item--required rect/);
});
