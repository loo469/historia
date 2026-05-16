import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('playable economy overlay renders logistics recovery debt ledger', () => {
  assert.match(webAppSource, /function renderEconomyRecoveryDebtLedger/);
  assert.match(webAppSource, /recoveryDebtLedger/);
  assert.match(webAppSource, /Ledger dette capacité logistique après reprises/);
  assert.match(webAppSource, /statusClass = ledger.status.replaceAll\(' ', '-'\)[\s\S]*ledger\.recommendedNextAction/);
  assert.match(webAppSource, /ledger\.decisionJustification/);
  assert.match(webAppSource, /entry\.corridor/);
  assert.match(webAppSource, /entry\.nextAction/);
  assert.match(webAppSource, /renderEconomyRecoveryDebtLedger\(economyView\)/);

  assert.match(webAppSource, /function renderEconomyRecoveryRepaymentPriorities/);
  assert.match(webAppSource, /recoveryDebtRepaymentPriorities/);
  assert.match(webAppSource, /Priorités de remboursement de dette logistique/);
  assert.match(webAppSource, /priority\.blockingImpact/);
  assert.match(webAppSource, /priority\.expectedGain/);
  assert.match(webAppSource, /view\.waitable/);
  assert.match(webAppSource, /renderEconomyRecoveryRepaymentPriorities\(economyView\)/);

  assert.match(webAppSource, /function renderEconomyRecoveryRepaymentScenarios/);
  assert.match(webAppSource, /recoveryDebtRepaymentScenarioPreviews/);
  assert.match(webAppSource, /Scénarios de reprise après remboursement logistique/);
  assert.match(webAppSource, /option\.capacityConsumed/);
  assert.match(webAppSource, /option\.remainingBlocked/);
  assert.match(webAppSource, /scenario\.minimalViableAction/);
  assert.match(webAppSource, /renderEconomyRecoveryRepaymentScenarios\(economyView\)/);

  assert.match(stylesSource, /\.economy-recovery-debt/);
  assert.match(stylesSource, /\.economy-recovery-debt--en-dette/);
  assert.match(stylesSource, /\.economy-recovery-debt__totals/);
  assert.match(stylesSource, /\.economy-recovery-debt__entry--critical/);

  assert.match(stylesSource, /\.economy-repayment-priorities/);
  assert.match(stylesSource, /\.economy-repayment-priorities__item--critical/);
  assert.match(stylesSource, /\.economy-repayment-priorities__wait/);

  assert.match(stylesSource, /\.economy-repayment-scenarios/);
  assert.match(stylesSource, /\.economy-repayment-scenario__option--warning/);
  assert.match(stylesSource, /\.economy-repayment-scenario__option--positive/);
});
