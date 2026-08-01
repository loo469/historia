import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas shows one remaining climate watch item after the smallest gap action', () => {
  assert.match(webAppSource, /function buildAtlasClimatePostGapActionWatch/);
  assert.match(webAppSource, /function renderAtlasClimatePostGapActionWatch/);
  assert.match(webAppSource, /Veille après action/);
  assert.match(webAppSource, /Watch item/);
  assert.match(webAppSource, /pression seuil/);
  assert.match(webAppSource, /promotionCondition/);
  assert.match(webAppSource, /Devient primaire/);
  assert.match(webAppSource, /Moment promotion/);
  assert.match(webAppSource, /Transfert attention/);
  assert.match(webAppSource, /Reste secondaire si/);
  assert.match(webAppSource, /Entretien minimal/);
  assert.match(webAppSource, /Synthèse watch/);
  assert.match(webAppSource, /Secondaire suivant/);
  assert.match(webAppSource, /nextSecondaryRisk/);
  assert.match(webAppSource, /devient action primaire si la pression reste ≥80 au prochain check/);
  assert.match(webAppSource, /devient action primaire si \$\{progress\.deadline\} confirme \$\{watchGap\.nearestRiskLabel\}/);
  assert.match(webAppSource, /promotionTiming/);
  assert.match(webAppSource, /promotionCue/);
  assert.match(webAppSource, /shortSecondaryLabel/);
  assert.match(webAppSource, /minimalProtection/);
  assert.match(webAppSource, /secondaryProtectionGuard/);
  assert.match(webAppSource, /secondaryUpkeep/);
  assert.match(webAppSource, /primaryPromotionMargin/);
  assert.match(webAppSource, /watchMargin/);
  assert.match(webAppSource, /upkeepReminder/);
  assert.match(webAppSource, /marginRearmReview/);
  assert.match(webAppSource, /unrearmedReviewConsequence/);
  assert.match(webAppSource, /nextWatchPriorityImpact/);
  assert.match(webAppSource, /nextPriorityStability/);
  assert.match(webAppSource, /priorityInstabilityTrigger/);
  assert.match(webAppSource, /priorityInstabilityWindow/);
  assert.match(webAppSource, /Fenêtre instabilité/);
  assert.match(webAppSource, /première fenêtre: vérifier/);
  assert.match(webAppSource, /aucune fenêtre proche/);
  assert.match(webAppSource, /Stable jusqu’à/);
  assert.match(webAppSource, /stable sauf si/);
  assert.match(webAppSource, /instable tant que/);
  assert.match(webAppSource, /la marge tombe courte ou une consequence unrearmed revient/);
  assert.match(webAppSource, /Fin changement priorité/);
  assert.match(webAppSource, /afterStabilizationPriority/);
  assert.match(webAppSource, /Après stabilisation/);
  assert.match(webAppSource, /priorityOrderingRationale/);
  assert.match(webAppSource, /Pourquoi premier/);
  assert.match(webAppSource, /priorityRankingChangeCue/);
  assert.match(webAppSource, /Ce qui changerait/);
  assert.match(webAppSource, /minimalStabilizationAction/);
  assert.match(webAppSource, /Stabilisation minimale/);
  assert.match(webAppSource, /backupClimateActionIfInsufficient/);
  assert.match(webAppSource, /backupClimateScopeCue/);
  assert.match(webAppSource, /nextWatchAfterLimitedBackupCue/);
  assert.match(webAppSource, /Si insuffisant/);
  assert.match(webAppSource, /Portée du secours/);
  assert.match(webAppSource, /Ensuite surveiller/);
  assert.match(webAppSource, /protège la prochaine fenêtre/);
  assert.match(webAppSource, /protège seulement l’urgence actuelle/);
  assert.match(webAppSource, /portée incertaine/);
  assert.match(webAppSource, /fenêtre suivante couverte/);
  assert.match(webAppSource, /prochaine watch fragile/);
  assert.match(webAppSource, /information insuffisante/);
  assert.match(webAppSource, /nextClimateWindow/);
  assert.match(webAppSource, /basculer la veille courte sur/);
  assert.match(webAppSource, /secours neutre/);
  assert.match(webAppSource, /aucun secours fiable à préparer/);
  assert.match(webAppSource, /stabiliser par/);
  assert.match(webAppSource, /stabilisation neutre/);
  assert.match(webAppSource, /aucune action minimale fiable à ajouter/);
  assert.match(webAppSource, /bascule proche/);
  assert.match(webAppSource, /classement stable/);
  assert.match(webAppSource, /aucun basculement proche/);
  assert.match(webAppSource, /seuil primaire atteint/);
  assert.match(webAppSource, /passe devant: pression/);
  assert.match(webAppSource, /dauphin/);
  assert.match(webAppSource, /après stabilisation: surveiller/);
  assert.match(webAppSource, /aucune priorité suivante fiable sans nouveau signal climat/);
  assert.match(webAppSource, /attendre un signal mesurable avant de promettre la prochaine priorité/);
  assert.match(webAppSource, /stabilise après review/);
  assert.match(webAppSource, /déjà stable/);
  assert.match(webAppSource, /stable après mitigation/);
  assert.match(webAppSource, /Prochaine priorité/);
  assert.match(webAppSource, /priorité monte/);
  assert.match(webAppSource, /priorité stable/);
  assert.match(webAppSource, /secondaire après mitigation/);
  assert.match(webAppSource, /priorité indéterminée/);
  assert.match(webAppSource, /Si non réarmé/);
  assert.match(webAppSource, /premier effet sans review/);
  assert.match(webAppSource, /risque d’être lu tard, même avec une marge encore confortable/);
  assert.match(webAppSource, /Réarmer review/);
  assert.match(webAppSource, /review différée/);
  assert.match(webAppSource, /réarmer si \$\{watchGap\.nearestRiskLabel\} revient avant \$\{progress\.deadline\} ou si la marge repasse courte/);
  assert.match(webAppSource, /Rappel upkeep/);
  assert.match(webAppSource, /rappel proche/);
  assert.match(webAppSource, /rappel inutile/);
  assert.match(webAppSource, /sécurité suffisante: attendre un nouveau signal avant de relancer l’upkeep/);
  assert.match(webAppSource, /surveiller au prochain check car le secondaire peut encore remonter vite/);
  assert.match(webAppSource, /Marge avant primaire/);
  assert.match(webAppSource, /marge faible/);
  assert.match(webAppSource, /marge confortable/);
  assert.match(webAppSource, /reste \$\{primaryPromotionMargin\} point/);
  assert.match(webAppSource, /Number\.isFinite\(watchGap\.nearestThresholdScore\)/);
  assert.match(webAppSource, /view\.watchItem\.watchMargin \?/);
  assert.match(webAppSource, /secondaryUpkeep/);
  assert.match(webAppSource, /smallestUpkeepReason/);
  assert.match(webAppSource, /upkeepPromotionRisk/);
  assert.match(webAppSource, /Pourquoi cet upkeep/);
  assert.match(webAppSource, /Sans upkeep immédiat/);
  assert.match(webAppSource, /cible \$\{secondaryProtectionGuard\.label\}; signal \$\{watchGap\.nearestRiskLabel\}; coût minimal/);
  assert.match(webAppSource, /risque de promotion seulement si la protection échoue/);
  assert.match(webAppSource, /risque de promotion au prochain tour/);
  assert.match(webAppSource, /watchLadderSummary/);
  assert.match(webAppSource, /remainingWatchItems\.length > 1/);
  assert.match(webAppSource, /state: 'available'/);
  assert.match(webAppSource, /state: 'impossible'/);
  assert.match(webAppSource, /state: 'stable-without-upkeep'/);
  assert.match(webAppSource, /garde \$\{watchGap\.label\} secondaire sans lancer une prévention complète/);
  assert.match(webAppSource, /aucune action minimale calculable depuis la protection visible/);
  assert.match(webAppSource, /surveiller sans entretien immédiat tant que la protection tient/);
  assert.match(webAppSource, /ne pas confondre avec une prévention complète ou une action primaire/);
  assert.match(webAppSource, /coverageView\.secondaryProtections\?\.\[0\]/);
  assert.match(webAppSource, /coverageView\.activeProtections\?\.\[0\]/);
  assert.match(webAppSource, /reste secondaire si \$\{minimalProtection\.label\} tient/);
  assert.match(webAppSource, /action minimale: \$\{view\.watchItem\.secondaryProtectionGuard\.minimalAction\}/);
  assert.match(webAppSource, /action minimale indisponible/);
  assert.match(webAppSource, /map-world-climate-post-gap-watch__upkeep--\$\{view\.watchItem\.secondaryUpkeep\.state\}/);
  assert.match(webAppSource, /attendue ce tour-ci après résolution de l’action climatique principale/);
  assert.match(webAppSource, /au prochain tour si \$\{progress\.deadline\} confirme la pression secondaire/);
  assert.match(webAppSource, /seulement si la protection échoue ou si le seuil secondaire se rapproche/);
  assert.match(webAppSource, /garder en veille courte sans remplacer l’action principale ce tour-ci/);
  assert.match(webAppSource, /secondaire prêt/);
  assert.match(webAppSource, /veille tour\+1/);
  assert.match(webAppSource, /veille conditionnelle/);
  assert.match(webAppSource, /find\(\(gap\) => gap\.nearestThresholdScore >= 55\)/);
  assert.match(webAppSource, /filter\(\(gap\) => !gap\.nearest && gap\.label !== gapActionView\.recommendation\.target\)/);
  assert.match(webAppSource, /gap\.label !== watchGap\.label/);
  assert.match(webAppSource, /seuil plus loin/);
  assert.match(webAppSource, /protection déjà active/);
  assert.match(webAppSource, /coût trop élevé/);
  assert.match(webAppSource, /seul watch item restant après l’action du gap prioritaire/);
  assert.match(webAppSource, /renderAtlasClimateNearestCoverageGapAction\(atlasClimateNearestCoverageGapAction\)\}\s*\$\{renderAtlasClimatePostGapActionWatch\(atlasClimatePostGapActionWatch\)\}/);

  assert.match(stylesSource, /\.map-world-climate-post-gap-watch/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch--watch/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__cue/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__guard/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__upkeep/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__upkeep--available/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__upkeep--impossible/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__upkeep--stable-without-upkeep/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__why/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__margin/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__margin--tight/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__margin--comfortable/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__reminder/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__reminder--monitor/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__reminder--skip/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__rearm/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__rearm--deferred/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__consequence/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__consequence--informative/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__priority/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__priority--rises/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__priority--secondary-after-mitigation/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__stability/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__stability--already-stable/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__instability/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__instability--stable-until/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__window/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__window--next-check/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__after-stabilization/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__after-stabilization--watch-next/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__after-stabilization--neutral-stable/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__after-stabilization--unknown/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__ordering/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__ordering--threshold-first/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__ordering--margin-first/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__ordering--runner-up-clear/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__rank-change/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__rank-change--rival-close/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__rank-change--margin-fragile/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__rank-change--stable-ranking/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__minimal-stabilization/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__minimal-stabilization--action-readable/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__minimal-stabilization--review-readable/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__minimal-stabilization--stable-neutral/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__minimal-stabilization--watch-neutral/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__backup-action/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__backup-action--watch-backup/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__backup-action--review-backup/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__backup-action--check-backup/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__backup-action--stable-neutral/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__backup-action--unknown-neutral/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__backup-scope/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__backup-scope--protects-next-window/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__backup-scope--current-emergency-only/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__backup-scope--scope-uncertain/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__after-backup/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__after-backup--fragile-watch/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__after-backup--window-covered/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__after-backup--insufficient-info/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__ladder/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__ladder--primary-first/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__ladder--upkeep-secondary/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__ladder--watch-only/);
});

test('atlas keeps a quiet fallback when no secondary climate watch is close enough', () => {
  assert.match(webAppSource, /state: 'quiet'/);
  assert.match(webAppSource, /Veille secondaire climat indisponible après action minimale/);
  assert.match(webAppSource, /Veille calme: aucun second gap climat assez proche du seuil après cette action/);
  assert.match(webAppSource, /Ne pas créer de liste/);
  assert.match(webAppSource, /aucun second risque assez lisible sans créer une file/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch--quiet/);
});

test('atlas suggests available upkeep for a conditional secondary climate watch', () => {
  assert.match(webAppSource, /secondaryUpkeep = secondaryProtectionGuard\?\.minimalAction/);
  assert.match(webAppSource, /label: 'entretien minimal'/);
  assert.match(webAppSource, /garde \$\{watchGap\.label\} secondaire sans lancer une prévention complète/);
  assert.match(webAppSource, /<b>Entretien minimal<\/b>/);
});

test('atlas marks secondary climate upkeep impossible when no minimal action is calculable', () => {
  assert.match(webAppSource, /state: 'impossible'/);
  assert.match(webAppSource, /label: 'entretien impossible'/);
  assert.match(webAppSource, /action minimale indisponible/);
  assert.match(webAppSource, /aucune action minimale calculable depuis la protection visible/);
});

test('atlas keeps a readable no-upkeep state without adding climate mechanics', () => {
  assert.match(webAppSource, /state: 'stable-without-upkeep'/);
  assert.match(webAppSource, /label: 'veille stable sans upkeep'/);
  assert.match(webAppSource, /surveiller sans entretien immédiat tant que la protection tient/);
  assert.match(webAppSource, /la veille peut rester secondaire sans upkeep immédiat/);
});


test('atlas summarizes the watch ladder when the primary remains first', () => {
  assert.match(webAppSource, /state: 'primary-first'/);
  assert.match(webAppSource, /decision: 'traiter le primaire'/);
  assert.match(webAppSource, /Traiter le primaire: \$\{watchGap\.label\}/);
  assert.match(webAppSource, /ne pas rendre le secondaire plus urgent que le primaire/);
});

test('atlas summarizes the ladder with secondary upkeep when useful', () => {
  assert.match(webAppSource, /state: 'upkeep-secondary'/);
  assert.match(webAppSource, /decision: 'entretenir un secondaire'/);
  assert.match(webAppSource, /Entretenir un secondaire: \$\{secondaryUpkeep\.action\}/);
  assert.match(webAppSource, /plus petit upkeep utile, pas une prévention complète/);
});

test('atlas summarizes the ladder as watch-only when thresholds are uncertain', () => {
  assert.match(webAppSource, /state: 'watch-only'/);
  assert.match(webAppSource, /decision: 'surveiller sans action immédiate'/);
  assert.match(webAppSource, /Surveiller sans action immédiate: \$\{watchGap\.label\}/);
  assert.match(webAppSource, /fallback robuste quand les seuils ou protections ne sont pas connus/);
});


test('atlas explains why the smallest climate upkeep was picked', () => {
  assert.match(webAppSource, /smallestUpkeepReason = secondaryProtectionGuard\?\.minimalAction/);
  assert.match(webAppSource, /region: secondaryProtectionGuard\.label/);
  assert.match(webAppSource, /signal: watchGap\.nearestRiskLabel/);
  assert.match(webAppSource, /coût minimal: garder la mitigation existante plutôt qu’une prévention complète/);
  assert.match(webAppSource, /promotionRisk: upkeepPromotionRisk/);
});

test('atlas clearly marks when secondary watch can stay secondary without upkeep', () => {
  assert.match(webAppSource, /state: 'stable-without-upkeep'/);
  assert.match(webAppSource, /label: 'veille stable sans upkeep'/);
  assert.match(webAppSource, /Sans upkeep immédiat/);
  assert.match(webAppSource, /la veille peut rester secondaire tant que le signal ne se rapproche pas/);
});

test('atlas shows remaining margin before secondary climate watch becomes primary', () => {
  assert.match(webAppSource, /const primaryPromotionMargin = Number\.isFinite\(watchGap\.nearestThresholdScore\)/);
  assert.match(webAppSource, /Math\.max\(0, 80 - watchGap\.nearestThresholdScore\)/);
  assert.match(webAppSource, /label: primaryPromotionMargin <= 0/);
  assert.match(webAppSource, /marge nulle/);
  assert.match(webAppSource, /marge courte/);
  assert.match(webAppSource, /Marge avant primaire/);
  assert.match(webAppSource, /view\.watchItem\.watchMargin \? `<small class="map-world-climate-post-gap-watch__margin/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__margin--short/);
});

test('atlas shows when climate watch margin can stop immediate upkeep reminders', () => {
  assert.match(webAppSource, /const upkeepReminder = watchMargin/);
  assert.match(webAppSource, /watchMargin\.state === 'comfortable'/);
  assert.match(webAppSource, /state: 'skip'/);
  assert.match(webAppSource, /state: 'monitor'/);
  assert.match(webAppSource, /Rappel upkeep/);
  assert.match(webAppSource, /view\.watchItem\.upkeepReminder \?/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__reminder--skip/);
});

test('atlas shows when comfortable climate margin should be rearmed for review', () => {
  assert.match(webAppSource, /const marginRearmReview = watchMargin\?\.state === 'comfortable'/);
  assert.match(webAppSource, /watchGap\.nearestRiskLabel && progress\.deadline/);
  assert.match(webAppSource, /label: 'review différée'/);
  assert.match(webAppSource, /Réarmer review/);
  assert.match(webAppSource, /view\.watchItem\.marginRearmReview \?/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__rearm--deferred/);
});

test('atlas shows first consequence of leaving climate review unrearmed', () => {
  assert.match(webAppSource, /const unrearmedReviewConsequence = marginRearmReview/);
  assert.match(webAppSource, /state: 'informative'/);
  assert.match(webAppSource, /label: 'premier effet sans review'/);
  assert.match(webAppSource, /le prochain signal \$\{watchGap\.nearestRiskLabel\} risque d’être lu tard/);
  assert.match(webAppSource, /view\.watchItem\.unrearmedReviewConsequence \?/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__consequence--informative/);
});

test('atlas links unrearmed climate consequence to next watch priority', () => {
  assert.match(webAppSource, /const nextWatchPriorityImpact = unrearmedReviewConsequence/);
  assert.match(webAppSource, /state: 'rises'/);
  assert.match(webAppSource, /label: 'priorité monte'/);
  assert.match(webAppSource, /prochaine watch: \$\{watchGap\.label\} remonte si la review reste non réarmée/);
  assert.match(webAppSource, /label: watchMargin\.state === 'comfortable' \? 'priorité stable' : 'secondaire après mitigation'/);
  assert.match(webAppSource, /label: 'priorité indéterminée'/);
  assert.match(webAppSource, /view\.watchItem\.nextWatchPriorityImpact \?/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__priority--fallback/);
});

test('atlas shows when next climate watch priority will stop changing', () => {
  assert.match(webAppSource, /const nextPriorityStability = nextWatchPriorityImpact\.state === 'rises'/);
  assert.match(webAppSource, /state: 'stabilizes-after-rearm'/);
  assert.match(webAppSource, /label: 'stabilise après review'/);
  assert.match(webAppSource, /cesse de changer quand la review est réarmée/);
  assert.match(webAppSource, /state: 'already-stable'/);
  assert.match(webAppSource, /label: 'déjà stable'/);
  assert.match(webAppSource, /state: 'stabilizes-after-mitigation'/);
  assert.match(webAppSource, /Fin changement priorité/);
  assert.match(webAppSource, /view\.watchItem\.nextPriorityStability \?/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__stability--stabilizes-after-rearm/);
});

test('atlas explains what can make stable climate priority unstable again', () => {
  assert.match(webAppSource, /const priorityInstabilityTrigger = nextPriorityStability\?\.state === 'already-stable'/);
  assert.match(webAppSource, /state: 'stable-until'/);
  assert.match(webAppSource, /label: 'stable sauf si'/);
  assert.match(webAppSource, /la marge tombe courte ou une consequence unrearmed revient sur \$\{watchGap\.nearestRiskLabel\}/);
  assert.match(webAppSource, /state: 'watch-until-rearmed'/);
  assert.match(webAppSource, /Stable jusqu’à/);
  assert.match(webAppSource, /view\.watchItem\.priorityInstabilityTrigger \?/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__instability--watch-until-rearmed/);
});

test('atlas shows the first window where climate priority can destabilize', () => {
  assert.match(webAppSource, /const priorityInstabilityWindow = priorityInstabilityTrigger\?\.state === 'stable-until'/);
  assert.match(webAppSource, /state: 'next-check'/);
  assert.match(webAppSource, /label: progress\.deadline/);
  assert.match(webAppSource, /première fenêtre: vérifier si \$\{watchGap\.nearestRiskLabel\} réduit la marge au prochain check/);
  assert.match(webAppSource, /state: 'before-review'/);
  assert.match(webAppSource, /fenêtre ouverte tant que la review reste non réarmée/);
  assert.match(webAppSource, /state: 'none-close'/);
  assert.match(webAppSource, /attendre un nouveau signal climat mesurable avant de reclasser la priorité/);
  assert.match(webAppSource, /Fenêtre instabilité/);
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__window--none-close/);
});
