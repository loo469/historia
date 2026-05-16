import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas military builds a fog-safe blocker resolution checklist from visible handoff badges', () => {
  assert.match(webAppSource, /function getAtlasMilitaryBlockerResolutionChecklist\(blockerBadge, item, blockingDecision\)/);
  assert.match(webAppSource, /function buildAtlasMilitaryBlockerResolutionChecklist\(handoff\)/);
  assert.match(webAppSource, /Checklist de résolution vide: aucun bloqueur de province contestée visible/);
  assert.match(webAppSource, /blockerResolutionChecklist = buildAtlasMilitaryBlockerResolutionChecklist\(carryOverConfidenceHandoff\)/);
});

test('atlas military checklist adapts action, prerequisite, and wait state by blocker type', () => {
  assert.match(webAppSource, /réserver capacité de renfort/);
  assert.match(webAppSource, /capacité logistique confirmée/);
  assert.match(webAppSource, /mettre ordre en attente météo/);
  assert.match(webAppSource, /fenêtre climat sûre/);
  assert.match(webAppSource, /préparer vérification de visibilité/);
  assert.match(webAppSource, /renseignement confirmé/);
  assert.match(webAppSource, /aligner ordre avec engagement local/);
  assert.match(webAppSource, /récit local stabilisé/);
  assert.match(webAppSource, /remplacer par vérification/);
  assert.match(webAppSource, /bloqueur principal identifié/);
});

test('atlas military checklist exposes order state and accessible SVG hooks', () => {
  assert.match(webAppSource, /ordre préparé/);
  assert.match(webAppSource, /ordre différé/);
  assert.match(webAppSource, /vérification requise/);
  assert.match(webAppSource, /data-atlas-blocker-checklist/);
  assert.match(webAppSource, /aria-label="\$\{row\.provinceLabel\}: \$\{row\.blockerBadge\.label\}; action immédiate/);
  assert.match(webAppSource, /renderAtlasMilitaryBlockerResolutionChecklist\(blockerResolutionChecklist\)/);
  assert.match(stylesSource, /\.atlas-military-blocker-checklist__panel/);
  assert.match(stylesSource, /\.atlas-military-blocker-checklist-row--unknown \.atlas-military-blocker-checklist-row__badge/);
});
