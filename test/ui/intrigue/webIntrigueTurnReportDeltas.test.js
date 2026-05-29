import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');

test('playable map wires intrigue aftermath deltas into selected province turn report', () => {
  assert.match(webAppSource, /buildIntrigueTurnReportDeltas/);
  assert.match(webAppSource, /function renderIntrigueTurnReportDeltas/);
  assert.match(webAppSource, /Rapport intrigue dernier tour/);
  assert.match(webAppSource, /Risque représailles/);
  assert.match(webAppSource, /previousTimingRecommendation/);
  assert.match(webAppSource, /Changement de recommandation de timing intrigue/);
  assert.match(webAppSource, /Confiance/);
  assert.match(webAppSource, /confidenceShift/);
  assert.match(webAppSource, /Vérification minimale avant timing intrigue/);
  assert.match(webAppSource, /minimumVerificationPrompt/);
  assert.match(webAppSource, /Obligatoire avant d’attendre/);
  assert.match(webAppSource, /waitVerificationRequirement/);
  assert.match(webAppSource, /safestMinimalVerification/);
  assert.match(webAppSource, /Plus sûre:/);
  assert.match(webAppSource, /Débloque:/);
  assert.match(webAppSource, /unlockNextTurn/);
  assert.match(webAppSource, /province-intrigue-turn-report__next-turn-unlock/);
  assert.match(webAppSource, /followUpOptions/);
  assert.match(webAppSource, /Suites débloquées par la vérification minimale/);
  assert.match(webAppSource, /province-intrigue-turn-report__followup--/);
  assert.match(webAppSource, /Revue complète si le recoupement diverge/);
  assert.match(webAppSource, /renderIntrigueTurnReportDeltas\(province, intrigueView\)/);
});
