import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas military builds next-best closure recommendations from visible blocker checklists', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryNextBestClosureRecommendation\(checklist\)/);
  assert.match(webAppSource, /function getAtlasMilitaryClosureImpactScore\(item\)/);
  assert.match(webAppSource, /impact tactique direct \+ capacité/);
  assert.match(webAppSource, /réduit incertitude avant engagement/);
  assert.match(webAppSource, /évite retard météo critique/);
  assert.match(webAppSource, /stabilise engagement local/);
});

test('atlas military next-best closure avoids false signals for unresolved unknown or idle blockers', () => {
  assert.match(webAppSource, /Prochaine fermeture indécise: aucun blocker actionnable visible/);
  assert.match(webAppSource, /Prochaine fermeture indécise: données visibles insuffisantes, aucune promotion sûre/);
  assert.match(webAppSource, /item\.checklist\.orderState !== 'ordre en veille'/);
  assert.match(webAppSource, /item\.promoted \|\| items\.length === 1/);
  assert.match(webAppSource, /blockerBadge\.type !== 'unknown'/);
});

test('atlas military next-best closure renders a primary recommendation and compact alternatives', () => {
  assert.match(webAppSource, /renderAtlasMilitaryNextBestClosureRecommendation\(nextBestClosureRecommendation\)/);
  assert.match(webAppSource, /data-atlas-next-best-closure/);
  assert.match(webAppSource, /Recommandation principale/);
  assert.match(webAppSource, /Alternative/);
  assert.match(webAppSource, /action minimale \$\{row\.nextAction\}/);
  assert.match(stylesSource, /\.atlas-military-next-best-closure__panel/);
  assert.match(stylesSource, /\.atlas-military-next-best-closure-row\.is-alternative circle/);
});

test('atlas military compares attempted closure choices against the recommendation', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryClosureAfterActionComparison\(recommendation\)/);
  assert.match(webAppSource, /Tenté \/ recommandé \/ risque/);
  assert.match(webAppSource, /aucune action précédente visible/);
  assert.match(webAppSource, /risque restant: capacité non réservée/);
  assert.match(webAppSource, /data-atlas-closure-after-action/);
  assert.match(webAppSource, /renderAtlasMilitaryClosureAfterActionComparison\(closureAfterActionComparison\)/);
  assert.match(stylesSource, /\.atlas-military-closure-after-action__panel/);
  assert.match(stylesSource, /\.atlas-military-closure-after-action-row\.is-alternative circle/);
});

test('atlas military renders a post-closure relapse watchlist from visible closure risks', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryPostClosureRelapseWatchlist\(comparison, recommendation\)/);
  assert.match(webAppSource, /Fenêtres de sécurité post-clôture des rechutes provinciales/);
  assert.match(webAppSource, /Fenêtre sûre/);
  assert.match(webAppSource, /capacité à confirmer au tour suivant/);
  assert.match(webAppSource, /fenêtre météo peut rouvrir le front/);
  assert.match(webAppSource, /data-atlas-post-closure-watch/);
  assert.match(webAppSource, /renderAtlasMilitaryPostClosureRelapseWatchlist\(postClosureRelapseWatchlist\)/);
  assert.match(stylesSource, /\.atlas-military-post-closure-watchlist__panel/);
  assert.match(stylesSource, /\.atlas-military-post-closure-watchlist-row--fragile circle/);
});

test('atlas military adds safe-wait windows to post-closure relapse risks', () => {
  assert.match(webAppSource, /function getAtlasMilitaryRelapseSafeWaitWindow\(row, status\)/);
  assert.match(webAppSource, /attente sûre: 2 tours/);
  assert.match(webAppSource, /attente courte: météo à confirmer/);
  assert.match(webAppSource, /facteur: pression militaire\/capacité/);
  assert.match(webAppSource, /facteur: soutien local/);
  assert.match(webAppSource, /Fenêtres de sécurité post-clôture des rechutes provinciales/);
  assert.match(webAppSource, /row\.safeWaitWindow/);
  assert.match(webAppSource, /row\.dominantFactor/);
  assert.match(stylesSource, /\.atlas-military-post-closure-watchlist-row__window/);
});

// MAP-A22: keep this source-level contract compact because the atlas demo data is
// assembled inside web/app.js rather than exported as a unit-testable builder.
test('atlas military renders a relapse prevention checklist before committing province orders', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryRelapsePreventionCommitChecklist\(watchlist\)/);
  assert.match(webAppSource, /function renderAtlasMilitaryRelapsePreventionCommitChecklist\(checklist\)/);
  assert.match(webAppSource, /Checklist prévention rechute avant confirmation d'ordre/);
  assert.match(webAppSource, /Check avant ordre/);
  assert.match(webAppSource, /Safe to commit: aucune rechute provinciale significative détectée/);
  assert.match(webAppSource, /Prévenir rechute/);
  assert.match(webAppSource, /risque restant \$\{row\.remainingRisk\}; prérequis/);
  assert.match(webAppSource, /raison d'attendre: \$\{row\.nextCheck\}/);
  assert.match(webAppSource, /visibleRows = \(watchlist\?\.items \?\? \[\]\)\.slice\(0, 4\)/);
  assert.match(webAppSource, /renderAtlasMilitaryRelapsePreventionCommitChecklist\(relapsePreventionCommitChecklist\)/);
  assert.match(stylesSource, /\.atlas-military-relapse-commit-checklist__panel/);
  assert.match(stylesSource, /\.atlas-military-relapse-commit-checklist-row--fragile circle/);
  assert.match(stylesSource, /\.atlas-military-relapse-commit-checklist-row--safe circle/);
});

// MAP-A23: preview the immediate neighbouring-front effects without expanding the
// A22 checklist panel.
test('atlas military previews neighboring front shifts after committing province orders', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryNeighborFrontShiftPreview\(recommendation, checklist, features\)/);
  assert.match(webAppSource, /function renderAtlasMilitaryNeighborFrontShiftPreview\(preview\)/);
  assert.match(webAppSource, /Prévisualisation des fronts voisins après engagement/);
  assert.match(webAppSource, /Voisins après ordre/);
  assert.match(webAppSource, /candidateRoutes = \(features\?\.routes \?\? \[\]\)/);
  assert.match(webAppSource, /fallbackRoutes\.slice\(0, 3\)/);
  assert.match(webAppSource, /label: 'soulage'/);
  assert.match(webAppSource, /label: 'neutre'/);
  assert.match(webAppSource, /label: 'rechute probable'/);
  assert.match(webAppSource, /pression voisine élevée après engagement/);
  assert.match(webAppSource, /renderAtlasMilitaryNeighborFrontShiftPreview\(neighborFrontShiftPreview\)/);
  assert.match(stylesSource, /\.atlas-military-neighbor-front-shift__panel/);
  assert.match(stylesSource, /\.atlas-military-neighbor-front-shift-row--soulage circle/);
  assert.match(stylesSource, /\.atlas-military-neighbor-front-shift-row--rechute circle/);
});

// MAP-A24: summarize which neighboring province should be reviewed first after
// the post-commit preview.
test('atlas military summarizes post-commit neighboring province review priority', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryNeighborReviewPriority\(shifts\)/);
  assert.match(webAppSource, /function renderAtlasMilitaryNeighborReviewPriority\(priority, y\)/);
  assert.match(webAppSource, /Priorité de revue post-engagement/);
  assert.match(webAppSource, /Revoir \$\{urgent\.neighborLabel\} en premier/);
  assert.match(webAppSource, /pression \$\{shift\.pressure\}: rechute probable à relire en premier/);
  assert.match(webAppSource, /instabilité: \$\{shift\.reason\}/);
  assert.match(webAppSource, /opportunité: \$\{shift\.reason\}/);
  assert.match(webAppSource, /manque d'ordres: \$\{shift\.reason\}/);
  assert.match(webAppSource, /Revue voisins: aucun risque prioritaire/);
  assert.match(webAppSource, /fallback: garder une surveillance légère après engagement/);
  assert.match(webAppSource, /reviewPriority: buildAtlasMilitaryNeighborReviewPriority\(\[\]\)/);
  assert.match(webAppSource, /renderAtlasMilitaryNeighborReviewPriority\(preview\.reviewPriority, priorityY\)/);
  assert.match(stylesSource, /\.atlas-military-neighbor-review-priority__label/);
  assert.match(stylesSource, /\.atlas-military-neighbor-review-priority--stable/);
  assert.match(stylesSource, /\.atlas-military-neighbor-review-priority--rechute/);
});

// MAP-A25: flag stale neighboring review summaries when orders, fronts, or turns
// move past the last analysis.
test('atlas military warns when neighboring province reviews become stale', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryNeighborReviewStaleness\(recommendation, shifts\)/);
  assert.match(webAppSource, /function renderAtlasMilitaryNeighborReviewStaleness\(staleness, y\)/);
  assert.match(webAppSource, /Avertissement fraîcheur revue voisine/);
  assert.match(webAppSource, /Revue voisine périmée/);
  assert.match(webAppSource, /nouvel ordre: \$\{primary\.previousDecision\} → \$\{primary\.nextAction\}/);
  assert.match(webAppSource, /Front voisin changé/);
  assert.match(webAppSource, /front changé: \$\{frontChange\.routeLabel\}/);
  assert.match(webAppSource, /Revue du tour précédent/);
  assert.match(webAppSource, /tour passé: tour \$\{state\.turn\}/);
  assert.match(webAppSource, /vérifier uniquement les provinces critiques/);
  assert.match(webAppSource, /ignorer pour ce tour si aucun risque critique/);
  assert.match(webAppSource, /âge\/cause non disponible: surveiller sans alerte/);
  assert.match(webAppSource, /reviewStaleness: buildAtlasMilitaryNeighborReviewStaleness\(recommendation, \[\]\)/);
  assert.match(webAppSource, /renderAtlasMilitaryNeighborReviewStaleness\(preview\.reviewStaleness, staleY\)/);
  assert.match(stylesSource, /\.atlas-military-neighbor-review-staleness__label/);
  assert.match(stylesSource, /\.atlas-military-neighbor-review-staleness--front/);
  assert.match(stylesSource, /\.atlas-military-neighbor-review-staleness--unknown/);
});

// MAP-A26: explain what changed since a stale neighbouring province review so
// the player can decide whether to re-run it.
test('atlas military explains what changed since the stale neighboring review', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryNeighborReviewChangeExplanation\(staleness, priority, shifts\)/);
  assert.match(webAppSource, /function renderAtlasMilitaryNeighborReviewChangeExplanation\(change, y\)/);
  assert.match(webAppSource, /Changement depuis la revue voisine stale/);
  assert.match(webAppSource, /Changement: ordre modifié/);
  assert.match(webAppSource, /ordre ajouté\/retiré: recommandation à recalculer/);
  assert.match(webAppSource, /Changement: front modifié/);
  assert.match(webAppSource, /front voisin impacté/);
  assert.match(webAppSource, /Changement: tour passé/);
  assert.match(webAppSource, /priorité voisine recalculée sans cible critique/);
  assert.match(webAppSource, /Changement: cause non précisée/);
  assert.match(webAppSource, /fallback discret: donnée stale non identifiée/);
  assert.match(webAppSource, /relancer toute la revue/);
  assert.match(webAppSource, /vérifier seulement \$\{impacted\}/);
  assert.match(webAppSource, /conserver la décision/);
  assert.match(webAppSource, /reviewChange: buildAtlasMilitaryNeighborReviewChangeExplanation/);
  assert.match(webAppSource, /renderAtlasMilitaryNeighborReviewChangeExplanation\(preview\.reviewChange, changeY\)/);
  assert.match(stylesSource, /\.atlas-military-neighbor-review-change__label/);
  assert.match(stylesSource, /\.atlas-military-neighbor-review-change--invalidant/);
  assert.match(stylesSource, /\.atlas-military-neighbor-review-change--mineur/);
});

// MAP-A27: when several neighboring contested provinces are readable, recommend
// the first one to handle without adding noise for single/equivalent priorities.
test('atlas military prioritizes the first neighboring contested province to handle', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryNeighborContestedHandlingPriority\(shifts, reviewStaleness, reviewChange\)/);
  assert.match(webAppSource, /function renderAtlasMilitaryNeighborContestedHandlingPriority\(priority, y\)/);
  assert.match(webAppSource, /Priorité de premier front voisin/);
  assert.match(webAppSource, /Traiter d'abord \$\{primary\.neighborLabel\}/);
  assert.match(webAppSource, /risque de rechute/);
  assert.match(webAppSource, /stale review/);
  assert.match(webAppSource, /urgence front contesté/);
  assert.match(webAppSource, /opportunité/);
  assert.match(webAppSource, /une seule province concernée ou priorités équivalentes/);
  assert.match(webAppSource, /ordre défensif en premier/);
  assert.match(webAppSource, /ordre offensif court/);
  assert.match(webAppSource, /contestedPriority: buildAtlasMilitaryNeighborContestedHandlingPriority/);
  assert.match(webAppSource, /renderAtlasMilitaryNeighborContestedHandlingPriority\(preview\.contestedPriority, contestedY\)/);
  assert.match(stylesSource, /\.atlas-military-neighbor-contested-priority__label/);
  assert.match(stylesSource, /\.atlas-military-neighbor-contested-priority--critical/);
  assert.match(stylesSource, /\.atlas-military-neighbor-contested-priority--contested/);
});

// MAP-A28: group neighboring contested provinces by shared front urgency so the
// player sees the first cluster before scanning province-level details.
test('atlas military groups neighboring contested provinces by shared front urgency', () => {
  assert.match(webAppSource, /function getAtlasMilitaryNeighborContestedCandidates\(shifts, reviewStaleness, reviewChange\)/);
  assert.match(webAppSource, /function buildAtlasMilitaryNeighborFrontUrgencyCluster\(shifts, reviewStaleness, reviewChange\)/);
  assert.match(webAppSource, /function renderAtlasMilitaryNeighborFrontUrgencyCluster\(cluster, y\)/);
  assert.match(webAppSource, /Cluster prioritaire de provinces contestées voisines/);
  assert.match(webAppSource, /Groupe prioritaire: \$\{provinceList\}/);
  assert.match(webAppSource, /front partagé/);
  assert.match(webAppSource, /cause:\$\{candidate\.factor\}/);
  assert.match(webAppSource, /détail province par province suffisant/);
  assert.match(webAppSource, /traiter ce front avant le détail province/);
  assert.match(webAppSource, /urgencyCluster: buildAtlasMilitaryNeighborFrontUrgencyCluster/);
  assert.match(webAppSource, /renderAtlasMilitaryNeighborFrontUrgencyCluster\(preview\.urgencyCluster, clusterY\)/);
  assert.match(stylesSource, /\.atlas-military-neighbor-front-cluster__label/);
  assert.match(stylesSource, /\.atlas-military-neighbor-front-cluster--critical/);
  assert.match(stylesSource, /\.atlas-military-neighbor-front-cluster--contested/);
});

// MAP-A29: show when a grouped neighboring front can be covered by one order
// versus when the cluster still needs separate follow-up.
test('atlas military shows safe shared handling hints for grouped front urgency', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryNeighborSharedHandlingHint\(cluster\)/);
  assert.match(webAppSource, /function renderAtlasMilitaryNeighborSharedHandlingHint\(hint, y\)/);
  assert.match(webAppSource, /Indice de traitement groupé du front voisin/);
  assert.match(webAppSource, /Même ordre possible/);
  assert.match(webAppSource, /Suivi séparé requis/);
  assert.match(webAppSource, /front lié, causes\/actions mixtes/);
  assert.match(webAppSource, /cause liée sans ordre commun sûr/);
  assert.match(webAppSource, /cluster\.actions\.length === 1 && cluster\.factors\.length === 1/);
  assert.match(webAppSource, /sharedHandlingHint: buildAtlasMilitaryNeighborSharedHandlingHint/);
  assert.match(webAppSource, /renderAtlasMilitaryNeighborSharedHandlingHint\(preview\.sharedHandlingHint, hintY\)/);
  assert.match(stylesSource, /\.atlas-military-neighbor-shared-handling__label/);
  assert.match(stylesSource, /\.atlas-military-neighbor-shared-handling--shared/);
  assert.match(stylesSource, /\.atlas-military-neighbor-shared-handling--separate/);
});

// MAP-A30: before committing a shared grouped-front order, show whether the
// group is covered or which flank still needs follow-up.
test('atlas military shows residual risk after shared grouped front handling', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryNeighborSharedResidualRisk\(cluster, sharedHandlingHint\)/);
  assert.match(webAppSource, /function renderAtlasMilitaryNeighborSharedResidualRisk\(risk, y\)/);
  assert.match(webAppSource, /Risque résiduel après traitement groupé du front voisin/);
  assert.match(webAppSource, /Groupe couvert après ordre/);
  assert.match(webAppSource, /confirmer puis surveiller léger/);
  assert.match(webAppSource, /Risque résiduel: flanc à suivre/);
  assert.match(webAppSource, /pression restante après ordre groupé/);
  assert.match(webAppSource, /prévoir suivi sur \$\{exposedFlank\}/);
  assert.match(webAppSource, /sharedHandlingHint\?\.tone !== 'shared'/);
  assert.match(webAppSource, /sharedResidualRisk: buildAtlasMilitaryNeighborSharedResidualRisk/);
  assert.match(webAppSource, /renderAtlasMilitaryNeighborSharedResidualRisk\(preview\.sharedResidualRisk, residualY\)/);
  assert.match(stylesSource, /\.atlas-military-neighbor-shared-residual__label/);
  assert.match(stylesSource, /\.atlas-military-neighbor-shared-residual--covered/);
  assert.match(stylesSource, /\.atlas-military-neighbor-shared-residual--residual/);
});

// MAP-A31: when residual grouped-front risk remains, name the next follow-up
// order and keep fully covered groups quiet.
test('atlas military recommends follow-up order for residual grouped front risk', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryNeighborResidualFollowUpOrder\(sharedResidualRisk, cluster\)/);
  assert.match(webAppSource, /function renderAtlasMilitaryNeighborResidualFollowUpOrder\(followUp, y\)/);
  assert.match(webAppSource, /Ordre de suivi recommandé pour risque résiduel/);
  assert.match(webAppSource, /Suivi recommandé: \$\{provinceLabel\}/);
  assert.match(webAppSource, /dominantReason = cluster\?\.tone === 'critical'/);
  assert.match(webAppSource, /\? 'urgence'/);
  assert.match(webAppSource, /\? 'exposition'/);
  assert.match(webAppSource, /: 'mouvement ennemi probable'/);
  assert.match(webAppSource, /ordre rapide: verrouiller le flanc/);
  assert.match(webAppSource, /ordre de couverture: protéger la province/);
  assert.match(webAppSource, /ordre d’interception: bloquer le mouvement/);
  assert.match(webAppSource, /sharedResidualRisk\.tone !== 'residual'/);
  assert.match(webAppSource, /Aucun suivi requis/);
  assert.match(webAppSource, /groupe couvert par l’ordre partagé/);
  assert.match(webAppSource, /residualFollowUpOrder: buildAtlasMilitaryNeighborResidualFollowUpOrder/);
  assert.match(webAppSource, /renderAtlasMilitaryNeighborResidualFollowUpOrder\(preview\.residualFollowUpOrder, followUpY\)/);
  assert.match(stylesSource, /\.atlas-military-neighbor-residual-follow-up__label/);
  assert.match(stylesSource, /\.atlas-military-neighbor-residual-follow-up--urgent/);
  assert.match(stylesSource, /\.atlas-military-neighbor-residual-follow-up--exposed/);
  assert.match(stylesSource, /\.atlas-military-neighbor-residual-follow-up--movement/);
});

// MAP-A32: residual grouped-front follow-up should reveal conflicts with
// existing orders/reservations/queued actions without changing the single follow-up.
test('atlas military shows conflicts for residual front follow-up orders', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryNeighborResidualFollowUpConflict\(followUp, recommendation, checklist, queuedAction = state\.acceptedRecommendedMilitaryAction\)/);
  assert.match(webAppSource, /function renderAtlasMilitaryNeighborResidualFollowUpConflict\(conflict, y\)/);
  assert.match(webAppSource, /Conflit de l’ordre de suivi résiduel/);
  assert.match(webAppSource, /queuedAction\?\.provinceLabel && queuedAction\.provinceLabel !== followUp\.provinceLabel/);
  assert.match(webAppSource, /Conflit: action déjà en file/);
  assert.match(webAppSource, /Conflit: unité réservée/);
  assert.match(webAppSource, /Conflit: ordre existant/);
  assert.match(webAppSource, /\$\{followUp\.provinceLabel\} protégé vs \$\{queuedConflict\.provinceLabel\} retardé/);
  assert.match(webAppSource, /\$\{followUp\.provinceLabel\} protégé vs réserve logistique affaiblie/);
  assert.match(webAppSource, /Suivi libre à mettre en file/);
  assert.match(webAppSource, /aucun ordre, réserve ou action déjà en file ne bloque/);
  assert.match(webAppSource, /residualFollowUpConflict: buildAtlasMilitaryNeighborResidualFollowUpConflict/);
  assert.match(webAppSource, /renderAtlasMilitaryNeighborResidualFollowUpConflict\(preview\.residualFollowUpConflict, conflictY\)/);
  assert.match(stylesSource, /\.atlas-military-neighbor-residual-follow-up-conflict__label/);
  assert.match(stylesSource, /\.atlas-military-neighbor-residual-follow-up-conflict--conflict/);
  assert.match(stylesSource, /\.atlas-military-neighbor-residual-follow-up-conflict--reserved/);
  assert.match(stylesSource, /\.atlas-military-neighbor-residual-follow-up-conflict--safe/);
});

// MAP-A33: when a residual front follow-up is blocked, suggest a compact
// alternative or explicitly say none is safe this turn.
test('atlas military suggests alternatives when residual front follow-up is blocked', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryBlockedResidualFollowUpAlternative\(followUp, conflict, recommendation, checklist\)/);
  assert.match(webAppSource, /function getAtlasMilitaryBlockedFollowUpAlternativeReason\(option, checklistItem\)/);
  assert.match(webAppSource, /function renderAtlasMilitaryBlockedResidualFollowUpAlternative\(alternative, y\)/);
  assert.match(webAppSource, /Alternative après suivi résiduel bloqué/);
  assert.match(webAppSource, /\$\{viability\.label\}: \$\{candidate\.provinceLabel\}/);
  assert.match(webAppSource, /ordre principal \$\{recommendation\?\.primary\?\.provinceLabel \?\? 'indécis'\} · suivi bloqué \$\{followUp\.provinceLabel\}/);
  assert.match(webAppSource, /Aucune alternative sûre ce tour/);
  assert.match(webAppSource, /attendre résolution du conflit/);
  assert.match(webAppSource, /return 'coût'/);
  assert.match(webAppSource, /return 'dépendance'/);
  assert.match(webAppSource, /return 'sécurité'/);
  assert.match(webAppSource, /return 'urgence'/);
  assert.match(webAppSource, /conflict\.tone === 'safe'/);
  assert.match(webAppSource, /blockedFollowUpAlternative: buildAtlasMilitaryBlockedResidualFollowUpAlternative/);
  assert.match(webAppSource, /renderAtlasMilitaryBlockedResidualFollowUpAlternative\(preview\.blockedFollowUpAlternative, alternativeY\)/);
  assert.match(stylesSource, /\.atlas-military-neighbor-blocked-follow-up-alt__label/);
  assert.match(stylesSource, /\.atlas-military-neighbor-blocked-follow-up-alt--blocked/);
  assert.match(stylesSource, /\.atlas-military-neighbor-blocked-follow-up-alt--dependency/);
  assert.match(stylesSource, /\.atlas-military-neighbor-blocked-follow-up-alt--safe/);
});

// MAP-A34: alternatives after a blocked residual follow-up must say whether they
// are immediately playable, need a short preparation, or should be avoided this turn.
test('atlas military shows viability conditions for blocked front alternatives', () => {
  assert.match(webAppSource, /function getAtlasMilitaryBlockedFollowUpAlternativeViability\(option, checklistItem\)/);
  assert.match(webAppSource, /Jouable maintenant/);
  assert.match(webAppSource, /Préparation courte requise/);
  assert.match(webAppSource, /À éviter ce tour/);
  assert.match(webAppSource, /condition minimale: \$\{minimumCondition\}/);
  assert.match(webAppSource, /viability\.status === 'ready' \? reasonTone : viability\.tone/);
  assert.match(webAppSource, /viabilityStatus: viability\.status/);
  assert.match(webAppSource, /minimumCondition: viability\.condition/);
  assert.match(webAppSource, /viabilité \$\{alternative\.viabilityLabel\}; \$\{alternative\.minimumCondition\}/);
  assert.match(webAppSource, /\$\{alternative\.minimumCondition\} · \$\{alternative\.reason\}: \$\{alternative\.action\}/);
  assert.match(stylesSource, /\.atlas-military-neighbor-blocked-follow-up-alt--preparation/);
});

// MAP-A35: when no front alternative is playable now, show the smallest prep
// action that can unlock the closest alternative next turn.
test('atlas military shows prep action to unlock the next front alternative', () => {
  assert.match(webAppSource, /function getAtlasMilitaryBlockedFollowUpPrepUnlock\(option, checklistItem\)/);
  assert.match(webAppSource, /const allAlternativesNeedPrep = candidates\.length > 0 && candidates\.every\(\(entry\) => entry\.viability\.status !== 'ready'\)/);
  assert.match(webAppSource, /réserver ressource: \$\{checklistAction\}/);
  assert.match(webAppSource, /lever info manquante: \$\{checklistAction\}/);
  assert.match(webAppSource, /sécuriser dépendance: \$\{checklistAction\}/);
  assert.match(webAppSource, /débloque si \$\{prerequisite\}/);
  assert.match(webAppSource, /prepUnlock: allAlternativesNeedPrep \? getAtlasMilitaryBlockedFollowUpPrepUnlock/);
  assert.match(webAppSource, /préparation \$\{alternative\.prepUnlock\.label\}: \$\{alternative\.prepUnlock\.action\}; \$\{alternative\.prepUnlock\.unlocks\}/);
  assert.match(webAppSource, /atlas-military-neighbor-blocked-follow-up-alt__prep/);
  assert.match(stylesSource, /\.atlas-military-neighbor-blocked-follow-up-alt__prep/);
});

// MAP-A36: prep guidance should also show whether delaying it is acceptable or risky,
// without inventing a cost when no fog-safe cost signal exists.
test('atlas military shows delay cost for blocked front prep actions', () => {
  assert.match(webAppSource, /function getAtlasMilitaryBlockedFollowUpPrepDelayCost\(option, checklistItem\)/);
  assert.match(webAppSource, /Report acceptable/);
  assert.match(webAppSource, /coût limité si relu au prochain tour/);
  assert.match(webAppSource, /Report risqué/);
  assert.match(webAppSource, /fenêtre qui se ferme/);
  assert.match(webAppSource, /province qui reste exposée/);
  assert.match(webAppSource, /option\.viabilityStatus === 'ready' \|\| option\.blockerType === 'unknown'\) return null/);
  assert.match(webAppSource, /delayCost: getAtlasMilitaryBlockedFollowUpPrepDelayCost\(option, checklistItem\)/);
  assert.match(webAppSource, /coût de report \$\{delayCost\.label\}: \$\{delayCost\.detail\}/);
  assert.match(webAppSource, /atlas-military-neighbor-blocked-follow-up-alt__delay--\$\{delayCost\.tone\}/);
  assert.match(stylesSource, /\.atlas-military-neighbor-blocked-follow-up-alt__delay--acceptable/);
  assert.match(stylesSource, /\.atlas-military-neighbor-blocked-follow-up-alt__delay--risky/);
});

// MAP-A37: when multiple follow-up signals coexist, add one compact ladder that
// orders play-now, prep, and delay-risk cues without duplicating each row.
test('atlas military summarizes the front follow-up ladder', () => {
  assert.match(webAppSource, /function buildAtlasMilitaryBlockedFollowUpLadder\(alternative, candidates = \[\], residualRisk = null\)/);
  assert.match(webAppSource, /const playableEntry = candidates\.find\(\(entry\) => entry\.viability\.status === 'ready'\)/);
  assert.match(webAppSource, /jouer maintenant: \$\{playableEntry\.option\.nextAction\}/);
  assert.match(webAppSource, /jouer maintenant: \$\{alternative\.action\}/);
  assert.match(webAppSource, /const prepEntry = candidates\.find\(\(entry\) => entry\.viability\.status === 'prep'\)/);
  assert.match(webAppSource, /préparer: \$\{prepUnlock\.action\}/);
  assert.match(webAppSource, /attendre: \$\{prepUnlock\.delayCost\.label\.toLowerCase\(\)\}/);
  assert.match(webAppSource, /if \(steps\.length < 2\)/);
  assert.match(webAppSource, /label: 'Échelle suivi front'/);
  assert.match(webAppSource, /detail: steps\.join\(' → '\)/);
  assert.match(webAppSource, /firstActionReason: `Pourquoi d’abord: \$\{reasonParts\.slice\(0, 4\)\.join\(' · '\)\}`/);
  assert.match(webAppSource, /préparation minimale: \$\{prepUnlock\.unlocks\}/);
  assert.match(webAppSource, /alternative bloquée: \$\{alternative\.viabilityLabel\}/);
  assert.match(webAppSource, /risque restant: \$\{residualRisk\.label\}/);
  assert.match(webAppSource, /const blockedFollowUpLadder = buildAtlasMilitaryBlockedFollowUpLadder\(blockedFollowUpAlternative, candidates, sharedResidualRisk\)/);
  assert.match(webAppSource, /renderAtlasMilitaryBlockedFollowUpLadder\(preview\.blockedFollowUpLadder, ladderY\)/);
  assert.match(webAppSource, /Synthèse échelle de suivi de front/);
  assert.match(stylesSource, /\.atlas-military-neighbor-blocked-follow-up-ladder--ready/);
  assert.match(stylesSource, /\.atlas-military-neighbor-blocked-follow-up-ladder--prep/);
  assert.match(stylesSource, /\.atlas-military-neighbor-blocked-follow-up-ladder--risky/);
  assert.match(stylesSource, /\.atlas-military-neighbor-blocked-follow-up-ladder__reason/);
});

// MAP-A39: after the chosen follow-up action, show the most useful remaining
// watch item without adding noise when nothing relevant remains.
test('atlas military shows what remains to watch after the front follow-up action', () => {
  assert.match(webAppSource, /const watchParts = \[\]/);
  assert.match(webAppSource, /watchParts\.push\(`\$\{residualRisk\.label\}: \$\{residualRisk\.detail\}`\)/);
  assert.match(webAppSource, /watchParts\.push\(`condition \$\{alternative\.minimumCondition\}`\)/);
  assert.match(webAppSource, /watchParts\.push\(`\$\{prepUnlock\.delayCost\.label\.toLowerCase\(\)\}: \$\{prepUnlock\.delayCost\.detail\}`\)/);
  assert.match(webAppSource, /const remainingWatch = watchParts\.length \? `Reste à surveiller: \$\{watchParts\.slice\(0, 2\)\.join\(' · '\)\}` : null/);
  assert.match(webAppSource, /remainingWatch,/);
  assert.match(webAppSource, /ladder\.remainingWatch \? `<text class="atlas-military-neighbor-blocked-follow-up-ladder__watch"/);
  assert.match(webAppSource, /preview\.blockedFollowUpLadder\?\.remainingWatch \? 5\.2 : 3\.85/);
  assert.match(stylesSource, /\.atlas-military-neighbor-blocked-follow-up-ladder__watch/);
});

// MAP-A40: show when residual front follow-up surveillance is still useful or
// can be dropped, using the same visible risk/condition signals.
test('atlas military shows when the front follow-up watch can be dropped', () => {
  assert.match(webAppSource, /let watchDrop = null/);
  assert.match(webAppSource, /residualRisk\?\.visible && residualRisk\.tone === 'covered'/);
  assert.match(webAppSource, /label: 'Suivi stabilisé'/);
  assert.match(webAppSource, /peut être lâché après confirmation: \$\{residualRisk\.action\}/);
  assert.match(webAppSource, /label: 'Surveillance encore utile'/);
  assert.match(webAppSource, /detail: `lâcher quand \$\{exitCondition\}`/);
  assert.match(webAppSource, /ladder\.watchDrop \? `<text class="atlas-military-neighbor-blocked-follow-up-ladder__drop/);
  assert.match(webAppSource, /ladder\.watchDrop\.label\}: \$\{ladder\.watchDrop\.detail\}/);
  assert.match(webAppSource, /preview\.blockedFollowUpLadder\?\.watchDrop \? preview\.blockedFollowUpLadder\?\.remainingWatch \? 6\.55 : 5\.2/);
  assert.match(stylesSource, /\.atlas-military-neighbor-blocked-follow-up-ladder__drop--watch/);
  assert.match(stylesSource, /\.atlas-military-neighbor-blocked-follow-up-ladder__drop--stable/);
});

// MAP-A41: once active residual watch is dropped, keep only a light recheck cue
// for the next turn/signal instead of creating a new urgent alert.
test('atlas military shows the next light front check after watch drop', () => {
  assert.match(webAppSource, /const nextLightCheck = watchDrop\?\.tone === 'stable'/);
  assert.match(webAppSource, /Contrôle léger: prochain tour, vérifier \$\{residualRisk\?\.provinceLabel \?\? alternative\.provinceLabel \?\? 'front'\} sans relancer d’alerte/);
  assert.match(webAppSource, /nextLightCheck,/);
  assert.match(webAppSource, /ladder\.nextLightCheck \? `<text class="atlas-military-neighbor-blocked-follow-up-ladder__recheck"/);
  assert.match(webAppSource, /preview\.blockedFollowUpLadder\?\.nextLightCheck \? preview\.blockedFollowUpLadder\?\.remainingWatch \? 7\.9 : 6\.55/);
  assert.match(stylesSource, /\.atlas-military-neighbor-blocked-follow-up-ladder__recheck/);
});

// MAP-A42: a passed light recheck should unlock a safe next action or
// confirmation state, while making condition changes the only reason to re-arm.
test('atlas military shows what a passed light front recheck unlocks next', () => {
  assert.match(webAppSource, /const lightRecheckUnlock = nextLightCheck/);
  assert.match(webAppSource, /label: 'Recheck OK: sortie confirmée'/);
  assert.match(webAppSource, /procéder sans watch active · observer léger · réarmer si \$\{residualRisk\?\.provinceLabel \?\? alternative\.provinceLabel \?\? 'front'\} change/);
  assert.match(webAppSource, /lightRecheckUnlock,/);
  assert.match(webAppSource, /ladder\.lightRecheckUnlock \? `<text class="atlas-military-neighbor-blocked-follow-up-ladder__unlock"/);
  assert.match(webAppSource, /preview\.blockedFollowUpLadder\?\.lightRecheckUnlock \? preview\.blockedFollowUpLadder\?\.remainingWatch \? 9\.25 : 7\.9/);
  assert.match(stylesSource, /\.atlas-military-neighbor-blocked-follow-up-ladder__unlock/);
});
