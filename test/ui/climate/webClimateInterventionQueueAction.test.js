import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('selected province climate forecast can queue the recommended intervention from the map', () => {
  assert.match(webAppSource, /queuedClimateInterventions: \[\]/);
  assert.match(webAppSource, /function buildClimateInterventionQueueEntry/);
  assert.match(webAppSource, /function buildClimateInterventionQueuePlan/);
  assert.match(webAppSource, /function renderClimateInterventionQueueAction/);
  assert.match(webAppSource, /Planification de l’intervention climat recommandée/);
  assert.match(webAppSource, /data-queue-climate-intervention/);
  assert.match(webAppSource, /Planifier intervention climat/);
  assert.match(webAppSource, /Déjà en file/);
  assert.match(webAppSource, /Aucune action climat/);
  assert.match(webAppSource, /Chevauchement: une intervention climat ou mitigation proche est déjà en file/);
  assert.match(webAppSource, /Deadline manquée:/);
  assert.match(webAppSource, /Fenêtre/);
  assert.match(webAppSource, /Réduction/);
  assert.match(webAppSource, /Tradeoff/);
  assert.match(webAppSource, /Intervention climat planifiée:/);
  assert.match(webAppSource, /state\.queuedClimateInterventions = state\.queuedClimateInterventions\.concat/);
  assert.match(webAppSource, /category: 'climate'/);
  assert.match(webAppSource, /renderClimateInterventionQueueAction\(province, forecast, actionQueue, queuedClimateInterventions\)/);

  assert.match(stylesSource, /\.province-climate-risk-forecast__queue/);
  assert.match(stylesSource, /\.province-climate-risk-forecast__queue--blocked/);
  assert.match(stylesSource, /\.province-climate-risk-forecast__queue button:disabled/);
});
