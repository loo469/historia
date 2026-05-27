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
  assert.match(webAppSource, /sideEffectWarning/);
  assert.match(webAppSource, /warningGroups/);
  assert.match(webAppSource, /tradeOffComparisons/);
  assert.match(webAppSource, /outcomeRecaps/);
  assert.match(webAppSource, /nextRecoveryActionSummary/);
  assert.match(webAppSource, /economy-next-recovery-action/);
  assert.match(webAppSource, /nextRecoveryActionSummary\.affectedDestinations/);
  assert.match(webAppSource, /recoveryMomentumForecast/);
  assert.match(webAppSource, /economy-recovery-momentum/);
  assert.match(webAppSource, /recoveryMomentumForecast\.confidence/);
  assert.match(webAppSource, /recoveryRelapseRiskAlerts/);
  assert.match(webAppSource, /economy-recovery-relapse/);
  assert.match(webAppSource, /Alertes risque de rechute de récupération/);
  assert.match(webAppSource, /group\.factor/);
  assert.match(webAppSource, /group\.action/);
  assert.match(webAppSource, /economy-repayment-outcomes/);
  assert.match(webAppSource, /recap\.secondaryOverload/);

  const repaymentScenariosRenderer = webAppSource.slice(
    webAppSource.indexOf('function renderEconomyRecoveryRepaymentScenarios'),
    webAppSource.indexOf('function renderEconomyRecoveryDebtOverlay'),
  );
  assert.ok(
    repaymentScenariosRenderer.indexOf('economy-repayment-outcomes') < repaymentScenariosRenderer.indexOf('economy-next-recovery-action'),
    'next recovery action summary renders after bottleneck outcome recaps',
  );
  assert.match(webAppSource, /economy-repayment-tradeoffs/);
  assert.match(webAppSource, /choice\.overloadShiftRisk/);
  assert.match(webAppSource, /economy-repayment-bottlenecks/);
  assert.match(webAppSource, /group\.bestDecision\?\.nextArbitrage/);
  assert.match(webAppSource, /economy-repayment-scenario__warning/);
  assert.match(webAppSource, /option\.sideEffectWarning\.nextArbitrage/);
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
  assert.match(stylesSource, /\.economy-repayment-scenario__warning--danger/);
  assert.match(stylesSource, /\.economy-repayment-scenario__warning--costly/);
  assert.match(stylesSource, /\.economy-repayment-bottleneck--danger/);
  assert.match(stylesSource, /\.economy-repayment-bottleneck--costly/);
  assert.match(stylesSource, /\.economy-repayment-tradeoff__choice--minimale-sûre/);
  assert.match(stylesSource, /\.economy-repayment-tradeoff__choice--rapide-fragile/);
  assert.match(stylesSource, /\.economy-repayment-outcome--résolution-avec-surcharge-secondaire/);
  assert.match(stylesSource, /\.economy-repayment-outcome--données-partielles/);
  assert.match(stylesSource, /\.economy-next-recovery-action--action-concrète/);
  assert.match(stylesSource, /\.economy-next-recovery-action--à-arbitrer/);
  assert.match(stylesSource, /\.economy-next-recovery-action--surveiller/);
  assert.match(stylesSource, /\.economy-recovery-momentum--en-reprise/);
  assert.match(stylesSource, /\.economy-recovery-momentum--stable/);
  assert.match(stylesSource, /\.economy-recovery-momentum--fragile/);
  assert.match(stylesSource, /\.economy-recovery-relapse--à-risque/);
  assert.match(stylesSource, /\.economy-recovery-relapse__group--fragile/);
});
