import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

const recoveryActionFixture = [
  {
    warningState: 'misses-by-one-turn',
    action: 'shift-execution-earlier',
    label: 'Avancer exécution',
  },
  {
    warningState: 'misses-by-capacity-gap',
    action: 'add-secondary-boost',
    label: 'Ajouter boost secondaire',
  },
  {
    warningState: 'reduce-exposure-first',
    action: 'reduce-exposure-first',
    label: 'Réduire exposition d’abord',
  },
  {
    warningState: 'accept-missed-deadline-risk',
    action: 'accept-missed-deadline-risk',
    label: 'Accepter risque deadline',
  },
  {
    warningState: 'empty',
    action: 'no-recovery-action',
    label: 'Aucune action recovery climat',
  },
];

test('atlas suggests one compact recovery action when minimum climate boost still misses deadline', () => {
  assert.match(webAppSource, /function buildAtlasClimateDeadlineRecoveryAction/);
  assert.match(webAppSource, /function renderAtlasClimateDeadlineRecoveryAction/);
  assert.match(webAppSource, /!deadlineWarningView\.warning/);
  assert.match(webAppSource, /Action compacte/);
  assert.match(webAppSource, /Liée au warning/);
  assert.match(webAppSource, /atlasClimateDeadlineRecoveryAction = buildAtlasClimateDeadlineRecoveryAction\(atlasClimateMinimumBoostDeadlineMissWarning\)/);
  assert.match(webAppSource, /renderAtlasClimateDeadlineRecoveryAction\(atlasClimateDeadlineRecoveryAction\)/);

  for (const fixture of recoveryActionFixture) {
    assert.match(webAppSource, new RegExp(fixture.warningState));
    assert.match(webAppSource, new RegExp(fixture.action));
    assert.match(webAppSource, new RegExp(fixture.label));
  }

  assert.match(stylesSource, /\.map-world-climate-deadline-recovery/);
  assert.match(stylesSource, /\.map-world-climate-deadline-recovery--add-secondary-boost/);
  assert.match(stylesSource, /\.map-world-climate-deadline-recovery--reduce-exposure-first/);
  assert.match(stylesSource, /\.map-world-climate-deadline-recovery--accept-missed-deadline-risk/);
});
