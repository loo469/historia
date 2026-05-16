import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas military handoff builds compact cross-domain blocker badges from visible dependencies', () => {
  assert.match(webAppSource, /function getAtlasMilitaryCrossDomainBlockerBadge\(item\)/);
  assert.match(webAppSource, /label: 'logistique\/capacité'/);
  assert.match(webAppSource, /label: 'météo\/climat'/);
  assert.match(webAppSource, /label: 'renseignement\/incertitude'/);
  assert.match(webAppSource, /label: 'engagement culturel\/narratif'/);
  assert.match(webAppSource, /label: 'blocage inconnu'/);
});

test('atlas military handoff reports useful military action only when blocker allows it', () => {
  assert.match(webAppSource, /function getAtlasMilitaryUsefulActionAgainstBlocker\(item, blockerBadge, blockingDecision\)/);
  assert.match(webAppSource, /renfort valide seulement après capacité confirmée/);
  assert.match(webAppSource, /attendre fenêtre météo avant ordre exposé/);
  assert.match(webAppSource, /vérifier visibilité avant engagement/);
  assert.match(webAppSource, /ordre valide si récit local stabilisé/);
  assert.match(webAppSource, /vérifier le bloqueur avant action/);
});

test('atlas military handoff keeps blocker badges accessible and styled', () => {
  assert.match(webAppSource, /bloqueur \$\{row\.blockerBadge\.label\}/);
  assert.match(webAppSource, /atlas-military-confidence-handoff-row__badge/);
  assert.match(webAppSource, /dependencies\.push\('culture'\)/);
  assert.match(webAppSource, /\['blocage inconnu'\]/);
  assert.match(stylesSource, /\.atlas-military-confidence-handoff-row--logistics \.atlas-military-confidence-handoff-row__badge/);
  assert.match(stylesSource, /\.atlas-military-confidence-handoff-row--unknown \.atlas-military-confidence-handoff-row__badge/);
});
