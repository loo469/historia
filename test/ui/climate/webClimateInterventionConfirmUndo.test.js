import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('queued climate intervention exposes confirmation context and undo before turn resolution', () => {
  assert.match(webAppSource, /function renderQueuedClimateInterventionConfirmation/);
  assert.match(webAppSource, /Confirmation de l’intervention climat en file/);
  assert.match(webAppSource, /Intervention climat confirmée/);
  assert.match(webAppSource, /Deadline confirmée/);
  assert.match(webAppSource, /Impact risque/);
  assert.match(webAppSource, /Tradeoff confirmé/);
  assert.match(webAppSource, /Prête avant résolution du tour; vous pouvez encore annuler ce choix/);
  assert.match(webAppSource, /data-undo-climate-intervention/);
  assert.match(webAppSource, /Annuler intervention climat/);
  assert.match(webAppSource, /Intervention climat annulée:/);
  assert.match(webAppSource, /deadlineWindow: plan\.window/);
  assert.match(webAppSource, /riskReduction: plan\.riskReduction/);
  assert.match(webAppSource, /tradeoff: plan\.tradeoff/);
  assert.match(webAppSource, /missedDeadline: plan\.missedDeadline/);
  assert.match(webAppSource, /state\.queuedClimateInterventions = state\.queuedClimateInterventions\.filter/);
  assert.match(webAppSource, /renderQueuedClimateInterventionConfirmation\(province, queuedClimateInterventions\)/);

  assert.match(stylesSource, /\.province-climate-risk-forecast__confirmation/);
  assert.match(stylesSource, /\.province-climate-risk-forecast__confirmation--warning/);
  assert.match(stylesSource, /\.province-climate-risk-forecast__confirmation button/);
});
