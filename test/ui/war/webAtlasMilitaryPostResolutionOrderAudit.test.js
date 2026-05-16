import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas military post resolution audit reuses resolver conflict and warning signals', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryPostResolutionOrderAudit\(commitment, commitmentConflicts, commitmentCoverage, commitmentWarnings, commitmentResolver\)/);
  assert.match(webAppSource, /commitmentResolver\?\.recommendations\?\.\[0\]\?\.decision/);
  assert.match(webAppSource, /for \(const conflict of commitmentConflicts\?\.conflicts \?\? \[\]\)/);
  assert.match(webAppSource, /for \(const warning of commitmentWarnings\?\.warnings \?\? \[\]\)/);
  assert.match(webAppSource, /renderAtlasMilitaryPostResolutionOrderAudit\(postResolutionAudit\)/);
});

test('atlas military post resolution audit groups contested province outcomes by status', () => {
  assert.match(webAppSource, /status === 'appliqué'/);
  assert.match(webAppSource, /status === 'reporté'/);
  assert.match(webAppSource, /status === 'annulé'/);
  assert.match(webAppSource, /'à revoir'/);
  assert.match(webAppSource, /auditByProvince\.set\(label, candidate\)/);
  assert.match(webAppSource, /cause principale: \$\{row\.cause\}/);
});

test('atlas military post resolution audit exposes accessible empty and correction cues', () => {
  assert.match(webAppSource, /Audit post-résolution vide: aucun ordre contesté à vérifier/);
  assert.match(webAppSource, /prochaine correction: ajouter couverture ou reporter l’ordre secondaire/);
  assert.match(webAppSource, /data-atlas-post-resolution-audit/);
  assert.match(webAppSource, /Audit post-résolution des ordres contestés/);
  assert.match(stylesSource, /\.atlas-military-post-resolution-audit__panel/);
  assert.match(stylesSource, /\.atlas-military-post-resolution-row--cancelled rect/);
});
