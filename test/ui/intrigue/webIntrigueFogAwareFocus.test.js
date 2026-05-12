import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('intrigue end-turn exposure warnings expose fog-aware focus targets', () => {
  assert.match(webAppSource, /function buildIntrigueExposureFocusTarget/);
  assert.match(webAppSource, /data-intrigue-focus-target/);
  assert.match(webAppSource, /focusTarget\.state/);
  assert.match(webAppSource, /data-intrigue-fog-state/);
  assert.match(webAppSource, /cible confirmée|hotspot confirmé/);
  assert.match(webAppSource, /zone probable/);
  assert.match(webAppSource, /Partiellement révélé/);
  assert.match(webAppSource, /Brouillard préservé: focus limité à la province/);
  assert.match(webAppSource, /Cible masquée par le brouillard/);
  assert.match(webAppSource, /sans révéler cellule ou opération/);
  assert.match(stylesSource, /map-intrigue-exposure-summary__item--confirmed/);
  assert.match(stylesSource, /map-intrigue-exposure-summary__item--probable/);
  assert.match(stylesSource, /map-intrigue-exposure-summary__item--masked/);
  assert.match(stylesSource, /data-intrigue-fog-state="probable"/);
  assert.match(stylesSource, /data-intrigue-fog-state="masked"/);
});

test('selected intrigue province detail explains fog reasons with safe action hints', () => {
  assert.match(webAppSource, /function buildSelectedProvinceIntrigueFogHint/);
  assert.match(webAppSource, /Cellule exposée signalée/);
  assert.match(webAppSource, /Sécurité cible élevée/);
  assert.match(webAppSource, /Renseignement incomplet/);
  assert.match(webAppSource, /Réduire chaleur/);
  assert.match(webAppSource, /Collecter renseignement/);
  assert.match(webAppSource, /Temporiser/);
  assert.match(webAppSource, /Surveiller sans escalade/);
  assert.match(webAppSource, /aria-label="\$\{intrigueView\.selectedProvince\.fogHint\.ariaLabel\}"/);
  assert.match(stylesSource, /intrigue-fog-hint--danger/);
  assert.match(stylesSource, /intrigue-fog-hint--warning/);
  assert.match(stylesSource, /intrigue-fog-hint--watch/);
});

test('selected intrigue province compares safe responses under fog', () => {
  assert.match(webAppSource, /function buildSelectedProvinceIntrigueResponseChoices/);
  assert.match(webAppSource, /Choix sous brouillard/);
  assert.match(webAppSource, /Agir ou attendre/);
  assert.match(webAppSource, /risque d'exposition/);
  assert.match(webAppSource, /Info manquante/);
  assert.match(webAppSource, /Transforme le soupçon en renseignement exploitable sans nommer la cible/);
  assert.match(webAppSource, /Surveiller: garder la province en observation/);
  assert.match(webAppSource, /privilégier une réponse prudente avant toute neutralisation visible/);
  assert.match(webAppSource, /Surveiller sans escalade: attendre/);
  assert.match(stylesSource, /intrigue-response-comparison/);
  assert.match(stylesSource, /intrigue-response-choice--danger/);
  assert.match(stylesSource, /intrigue-response-choice--warning/);
  assert.match(stylesSource, /intrigue-response-choice--watch/);
});

test('selected intrigue province adds fog-safe confidence levels to responses', () => {
  assert.match(webAppSource, /confidence: riskIsHigh \? 'incertain' : 'fiable'/);
  assert.match(webAppSource, /confidence: heatedOperation \? 'dangereux' : entry\.presenceLevel === 'low' \? 'information-insuffisante' : 'incertain'/);
  assert.match(webAppSource, /Le brouillard masque encore la source du signal; ne pas inférer une menace réelle/);
  assert.match(webAppSource, /L’exposition visible rend toute neutralisation directe risquée sans révéler les détails masqués/);
  assert.match(webAppSource, /Collecter renseignement discret avant infiltration ou basculer en surveillance/);
  assert.match(webAppSource, /choice\.confidenceLabel/);
  assert.match(webAppSource, /choice\.confidenceReason/);
  assert.match(stylesSource, /intrigue-response-choice__confidence--fiable/);
  assert.match(stylesSource, /intrigue-response-choice__confidence--incertain/);
  assert.match(stylesSource, /intrigue-response-choice__confidence--dangereux/);
  assert.match(stylesSource, /intrigue-response-choice__confidence--information-insuffisante/);
});

test('queued province intrigue responses project detection risk without breaking fog', () => {
  assert.match(webAppSource, /function buildQueuedIntrigueDetectionRiskProjection/);
  assert.match(webAppSource, /function renderQueuedIntrigueDetectionRiskProjection/);
  assert.match(webAppSource, /Projection détection intrigue/);
  assert.match(webAppSource, /Aucune réponse intrigue en file/);
  assert.match(webAppSource, /queuez une réponse intrigue pour estimer la tendance sans lever le brouillard/);
  assert.match(webAppSource, /Projection prudente: source, cellule et objectif exacts restent masqués par le brouillard/);
  assert.match(webAppSource, /Basé sur les opérations visibles; les relais non confirmés restent masqués/);
  assert.match(webAppSource, /Projection détection \$\{visibleBaseRisk\} → \$\{afterRisk\}/);
  assert.match(stylesSource, /province-intrigue-detection-projection/);
  assert.match(stylesSource, /province-intrigue-detection-projection--mitigated/);
  assert.match(stylesSource, /province-intrigue-detection-projection--masked/);
});

test('queued intrigue detection projection explains fog-safe exposure sources', () => {
  assert.match(webAppSource, /function buildIntrigueExposureSourceBreakdown/);
  assert.match(webAppSource, /Sources compactes du risque d’exposition/);
  assert.match(webAppSource, /Suspicion locale/);
  assert.match(webAppSource, /Opération conflictuelle/);
  assert.match(webAppSource, /Vigilance cible/);
  assert.match(webAppSource, /Tension réseau/);
  assert.match(webAppSource, /Couverture faible/);
  assert.match(webAppSource, /Signal visible élevé sur la province; identité et relais restent masqués/);
  assert.match(webAppSource, /la cellule ou le canal concerné reste caché/);
  assert.match(webAppSource, /sans révéler sa cible exacte/);
  assert.match(stylesSource, /province-intrigue-detection-projection__sources/);
  assert.match(stylesSource, /province-intrigue-detection-source--danger/);
  assert.match(stylesSource, /province-intrigue-detection-source--mitigated/);
});

test('risky queued intrigue responses suggest fog-safe fallback actions', () => {
  assert.match(webAppSource, /function buildSafeIntrigueFallbackAction/);
  assert.match(webAppSource, /Alternative intrigue sûre/);
  assert.match(webAppSource, /Fallback prudent/);
  assert.match(webAppSource, /Aucune alternative sûre connue/);
  assert.match(webAppSource, /Réduire chaleur/);
  assert.match(webAppSource, /Collecter renseignement/);
  assert.match(webAppSource, /Temporiser/);
  assert.match(webAppSource, /Contenir/);
  assert.match(webAppSource, /Surveiller/);
  assert.match(webAppSource, /Protège les canaux visibles avant toute révélation publique, sans nommer cellule ou cible/);
  assert.match(webAppSource, /Clarifie le signal et teste la couverture avant un contact plus exposé/);
  assert.match(webAppSource, /Réduit la fenêtre d’exposition sans dévoiler la menace réelle/);
  assert.match(stylesSource, /province-intrigue-detection-fallback/);
  assert.match(stylesSource, /province-intrigue-detection-fallback--ready/);
  assert.match(stylesSource, /province-intrigue-detection-fallback--empty/);
});

test('queued intrigue actions show cumulative exposure risk and mitigations', () => {
  assert.match(webAppSource, /function buildCumulativeQueuedIntrigueExposureRisk/);
  assert.match(webAppSource, /Risque d’exposition cumulé intrigue/);
  assert.match(webAppSource, /Risque cumulé/);
  assert.match(webAppSource, /contribution\$\{contributions\.length > 1 \? 's' : ''\} intrigue agrégée/);
  assert.match(webAppSource, /détails par action conservés ci-dessus/);
  assert.match(webAppSource, /remplacer \$\{contributions\[0\]\.actionLabel\} sur \$\{contributions\[0\]\.provinceLabel\} par \$\{contributions\[0\]\.fallback\}/);
  assert.match(webAppSource, /différer une action exposée/);
  assert.match(webAppSource, /Agrégation prudente: provinces et tendances visibles seulement, sans révéler cellule, canal ou menace réelle/);
  assert.match(stylesSource, /province-intrigue-cumulative-risk/);
  assert.match(stylesSource, /province-intrigue-cumulative-risk--danger/);
  assert.match(stylesSource, /province-intrigue-cumulative-risk--warning/);
});

test('queued intrigue preview shows exposure deltas before confirmation', () => {
  assert.match(webAppSource, /function buildIntrigueQueueChangePreview/);
  assert.match(webAppSource, /Aperçu avant confirmation des changements intrigue/);
  assert.match(webAppSource, /Avant confirmation/);
  assert.match(webAppSource, /Ajouter/);
  assert.match(webAppSource, /Retirer/);
  assert.match(webAppSource, /Remplacer/);
  assert.match(webAppSource, /Alternative sûre: \$\{queueChangePreview\.safeAlternative\}/);
  assert.match(webAppSource, /Prévisualisation fog-safe: seuls delta, province visible et type de réponse sont exposés/);
  assert.match(webAppSource, /Remplacer par \$\{fallbackAction\} conserve un repli prudent sans révéler cellule ou cible/);
  assert.match(stylesSource, /province-intrigue-queue-change-preview/);
  assert.match(stylesSource, /province-intrigue-queue-change-preview__scenario--ajout/);
  assert.match(stylesSource, /province-intrigue-queue-change-preview__scenario--retrait/);
  assert.match(stylesSource, /province-intrigue-queue-change-preview__scenario--remplacement/);
});

test('map panel can queue safe intrigue responses with guarded states', () => {
  assert.match(webAppSource, /function buildMapIntrigueSafeQueueAction/);
  assert.match(webAppSource, /Queue carte réponse intrigue sûre/);
  assert.match(webAppSource, /data-action="queue-safe-intrigue-response"/);
  assert.match(webAppSource, /déjà en file/);
  assert.match(webAppSource, /trop risqué/);
  assert.match(webAppSource, /aucune réponse disponible/);
  assert.match(webAppSource, /fallback proposé/);
  assert.match(webAppSource, /Exposition/);
  assert.match(webAppSource, /Risque résiduel/);
  assert.match(webAppSource, /Sources majeures/);
  assert.match(webAppSource, /Ignorer maintenant laisse la pression visible s’accumuler au prochain tour/);
  assert.match(webAppSource, /La réponse recommandée est remplacée par un fallback sûr déjà connu/);
  assert.match(webAppSource, /Queue directe depuis le panneau carte, sans navigation lourde/);
  assert.match(stylesSource, /province-intrigue-map-queue-action/);
  assert.match(stylesSource, /province-intrigue-map-queue-action--disabled/);
  assert.match(stylesSource, /province-intrigue-map-queue-action__cta:disabled/);
});

test('queued intrigue map responses show fog-safe confirmation and undo affordance', () => {
  assert.match(webAppSource, /function buildConfirmedQueuedIntrigueMapResponse/);
  assert.match(webAppSource, /Confirmation fog-safe réponse intrigue queueée/);
  assert.match(webAppSource, /Réponse queueée/);
  assert.match(webAppSource, /Aucune réponse queueée/);
  assert.match(webAppSource, /Contexte visible/);
  assert.match(webAppSource, /Direction risque/);
  assert.match(webAppSource, /Incertitude/);
  assert.match(webAppSource, /data-action="undo-last-intrigue-response"/);
  assert.match(webAppSource, /Annuler dernière réponse intrigue/);
  assert.match(webAppSource, /Annulation disponible avant résolution du tour; le brouillard conserve cible, cellule et relais masqués/);
  assert.match(webAppSource, /Réponse confirmée: \$\{mapQueueAction\.actionLabel\} sur \$\{province\.label\}/);
  assert.match(stylesSource, /province-intrigue-map-confirmation/);
  assert.match(stylesSource, /province-intrigue-map-confirmation--confirmed/);
  assert.match(stylesSource, /province-intrigue-map-confirmation__undo:disabled/);
});

test('final intrigue exposure summary is visible before turn commit', () => {
  assert.match(webAppSource, /function buildFinalIntrigueExposureCommitSummary/);
  assert.match(webAppSource, /Synthèse finale exposition intrigue avant commit du tour/);
  assert.match(webAppSource, /Avant commit du tour/);
  assert.match(webAppSource, /Cellule masquée · \$\{contribution\.provinceLabel\}/);
  assert.match(webAppSource, /exposition estimée après résolution \$\{cumulativeRisk\.totalLabel\}/);
  assert.match(webAppSource, /cellule\$\{finalCommitSummary\.riskyCells\.length > 1 \? 's' : ''\} encore trop risquée/);
  assert.match(webAppSource, /Combinaison gênante: plusieurs réponses visibles peuvent cumuler chaleur et réduire la couverture/);
  assert.match(webAppSource, /Dernière confirmation conservée; undo encore possible avant commit du tour/);
  assert.match(webAppSource, /Synthèse finale fog-safe: cellule, cible et relais restent masqués/);
  assert.match(stylesSource, /province-intrigue-final-commit-summary/);
  assert.match(stylesSource, /province-intrigue-final-commit-summary--danger/);
  assert.match(stylesSource, /province-intrigue-final-commit-summary__item--trop-risqué/);
});

test('world map intrigue signals show presence risk shadows and probable sabotage safely', () => {
  assert.match(webAppSource, /function buildWorldMapIntrigueSignals/);
  assert.match(webAppSource, /function renderWorldMapIntrigueSignals/);
  assert.match(webAppSource, /function renderWorldMapIntrigueSignalRollup/);
  assert.match(webAppSource, /Signaux intrigue sur la carte monde fog-safe/);
  assert.match(webAppSource, /Résumé intrigue carte monde fog-safe/);
  assert.match(webAppSource, /présence forte/);
  assert.match(webAppSource, /risque sabotage probable/);
  assert.match(webAppSource, /zone d’ombre conservée/);
  assert.match(webAppSource, /les cellules, relais, objectifs et causes cachées restent masqués/);
  assert.match(webAppSource, /aucun détail caché révélé/);
  assert.match(webAppSource, /renderWorldMapIntrigueSignals\(worldMapSignals\)/);
  assert.match(stylesSource, /world-map-intrigue-signal/);
  assert.match(stylesSource, /world-map-intrigue-signal--shadow/);
  assert.match(stylesSource, /world-map-intrigue-rollup/);
});

test('post-commit intrigue exposure markers stay fog-safe on the map', () => {
  assert.match(webAppSource, /function buildPostCommitIntrigueExposureMarkers/);
  assert.match(webAppSource, /function renderPostCommitIntrigueExposureMarkers/);
  assert.match(webAppSource, /Marqueurs intrigue post-commit fog-safe/);
  assert.match(webAppSource, /Exposition réduite/);
  assert.match(webAppSource, /Exposition stable/);
  assert.match(webAppSource, /Exposition accrue/);
  assert.match(webAppSource, /Résultat fog-limité/);
  assert.match(webAppSource, /assurance \$\{assuranceLevel\}/);
  assert.match(webAppSource, /résultat masqué par le brouillard; seule la province reste inspectable/);
  assert.match(webAppSource, /aucun détail caché révélé/);
  assert.match(webAppSource, /renderPostCommitIntrigueExposureMarkers\(postCommitMarkers\)/);
  assert.match(stylesSource, /intrigue-post-commit-marker/);
  assert.match(stylesSource, /intrigue-post-commit-marker--lowered/);
  assert.match(stylesSource, /intrigue-post-commit-marker--unchanged/);
  assert.match(stylesSource, /intrigue-post-commit-marker--increased/);
  assert.match(stylesSource, /intrigue-post-commit-marker--hidden/);
});

test('intrigue exposure marker rollup filters reveal only safe counts', () => {
  assert.match(webAppSource, /intrigueExposureOutcomeFilters/);
  assert.match(webAppSource, /function getActiveIntrigueExposureOutcomeFilters/);
  assert.match(webAppSource, /function filterPostCommitIntrigueExposureMarkers/);
  assert.match(webAppSource, /function buildIntrigueExposureMarkerRollup/);
  assert.match(webAppSource, /function renderIntrigueExposureMarkerRollup/);
  assert.match(webAppSource, /data-intrigue-exposure-filter="\$\{key\}"/);
  assert.match(webAppSource, /state\.intrigueExposureOutcomeFilters\[key\] = !state\.intrigueExposureOutcomeFilters\[key\]/);
  assert.match(webAppSource, /marqueur\$\{markers\.length > 1 \? 's' : ''\} intrigue post-commit visible/);
  assert.match(webAppSource, /résultat\$\{counts\.hidden > 1 \? 's' : ''\} fog-limité/);
  assert.match(webAppSource, /Certitude fog-safe: les zones inconnues restent séparées des faibles risques confirmés/);
  assert.match(stylesSource, /intrigue-exposure-marker-rollup/);
  assert.match(stylesSource, /intrigue-exposure-marker-filter\.is-active/);
});

test('intrigue exposure rollups separate confirmed suspected and unknown certainty', () => {
  assert.match(webAppSource, /certaintyGroups/);
  assert.match(webAppSource, /confirmed: markers\.filter\(\(marker\) => marker\.certainty === 'confirmed'\)/);
  assert.match(webAppSource, /suspected: markers\.filter\(\(marker\) => marker\.certainty === 'suspected'\)/);
  assert.match(webAppSource, /unknown: markers\.filter\(\(marker\) => marker\.certainty === 'unknown'\)/);
  assert.match(webAppSource, /certitude partielle: tendance visible, identité et relais non confirmés/);
  assert.match(webAppSource, /certitude inconnue: zone fog-limitée séparée des faibles risques confirmés/);
  assert.match(webAppSource, /ne pas assimiler à un faible risque confirmé/);
  assert.match(webAppSource, /Certitude fog-safe: les zones inconnues restent séparées des faibles risques confirmés/);
  assert.match(webAppSource, /aria-label="Niveau de certitude fog-safe des marqueurs intrigue"/);
  assert.match(stylesSource, /intrigue-exposure-certainty-rollup/);
});

test('intrigue exposure markers mark resolved threats without exposing hidden causes', () => {
  assert.match(webAppSource, /resolutionStatus/);
  assert.match(webAppSource, /resolutionCounts/);
  assert.match(webAppSource, /resolved: markers\.filter\(\(marker\) => marker\.resolutionStatus === 'resolved'\)/);
  assert.match(webAppSource, /active: markers\.filter\(\(marker\) => marker\.resolutionStatus === 'active'\)/);
  assert.match(webAppSource, /fogCalmed: markers\.filter\(\(marker\) => marker\.resolutionStatus === 'fog-calmed'\)/);
  assert.match(webAppSource, /Traité récemment/);
  assert.match(webAppSource, /Menace active/);
  assert.match(webAppSource, /Rumeur calmée/);
  assert.match(webAppSource, /assuranceLevel/);
  assert.match(webAppSource, /menace encore active malgré la réponse/);
  assert.match(webAppSource, /aucune source ou cause cachée n’est révélée/);
  assert.match(webAppSource, /aria-label="Menaces intrigue traitées ou encore actives"/);
  assert.match(stylesSource, /intrigue-exposure-resolution-rollup/);
  assert.match(stylesSource, /intrigue-post-commit-marker--fog-calmed/);
});

test('intrigue exposure markers show fog-safe freshness cues', () => {
  assert.match(webAppSource, /freshnessCounts/);
  assert.match(webAppSource, /freshnessCopy/);
  assert.match(webAppSource, /recent: markers\.filter\(\(marker\) => marker\.freshness === 'recent'\)/);
  assert.match(webAppSource, /stale: markers\.filter\(\(marker\) => marker\.freshness === 'stale'\)/);
  assert.match(webAppSource, /uncertain: markers\.filter\(\(marker\) => marker\.freshness === 'uncertain'\)/);
  assert.match(webAppSource, /info récente/);
  assert.match(webAppSource, /info ancienne/);
  assert.match(webAppSource, /fraîcheur incertaine/);
  assert.match(webAppSource, /soupçon ancien à revérifier avant intervention lourde/);
  assert.match(webAppSource, /fraîcheur déduite seulement des signaux visibles/);
  assert.match(webAppSource, /Récent = signal visible actif; ancien = soupçon à revérifier; incertain = zone inconnue sans détail caché/);
  assert.match(webAppSource, /aria-label="Fraîcheur fog-safe des marqueurs intrigue"/);
  assert.match(stylesSource, /intrigue-exposure-freshness-rollup/);
});

test('selected province intrigue details show ordered fog-safe timeline hints', () => {
  assert.match(webAppSource, /function buildProvinceIntrigueExposureTimelineHints/);
  assert.match(webAppSource, /function renderProvinceIntrigueExposureTimelineHints/);
  assert.match(webAppSource, /resolveIntrigueExposureTimelineHint/);
  assert.match(webAppSource, /right\.priority - left\.priority/);
  assert.match(webAppSource, /Signal récent/);
  assert.match(webAppSource, /Soupçon ancien/);
  assert.match(webAppSource, /Zone non résolue/);
  assert.match(webAppSource, /Menace visible récente: vérifier ou contenir avant d’empiler un ordre long/);
  assert.match(webAppSource, /Information ancienne: confirmer la province avant intervention lourde/);
  assert.match(webAppSource, /Fraîcheur inconnue sous brouillard: inspecter sans inférer cellule, cible ou relais/);
  assert.match(webAppSource, /Lecture fog-safe: les indices anciens ou inconnus n’ajoutent aucun nom de cellule, cible ou relais caché/);
  assert.match(webAppSource, /renderProvinceIntrigueExposureTimelineHints\(province, intrigueView\)/);
  assert.match(stylesSource, /province-intrigue-timeline-hints/);
  assert.match(stylesSource, /province-intrigue-timeline-hint--danger/);
});

test('safe intrigue responses compare exposure timing without breaking fog', () => {
  assert.match(webAppSource, /function buildSafeIntrigueResponseTimingOptions/);
  assert.match(webAppSource, /function renderSafeIntrigueResponseTimingComparison/);
  assert.match(webAppSource, /Comparaison fog-safe des réponses intrigue sous timing d’exposition/);
  assert.match(webAppSource, /exposition réduite/);
  assert.match(webAppSource, /brouillard conservé/);
  assert.match(webAppSource, /aggravation possible immédiate/);
  assert.match(webAppSource, /risque secondaire élevé: chaleur visible à compenser/);
  assert.match(webAppSource, /sûr maintenant, risqué si le joueur attend/);
  assert.match(webAppSource, /Comparaison prudente: seules les tendances visibles sont comparées; cellule, cible, relais et état caché restent masqués/);
  assert.match(webAppSource, /renderSafeIntrigueResponseTimingComparison\(province, intrigueView\)/);
  assert.match(stylesSource, /province-intrigue-response-timing/);
  assert.match(stylesSource, /province-intrigue-response-option--mitigated/);
  assert.match(stylesSource, /province-intrigue-response-option--danger/);
});

test('intrigue responses warn about queued map choice conflicts without leaking fog', () => {
  assert.match(webAppSource, /function buildIntrigueQueuedMapChoiceConflicts/);
  assert.match(webAppSource, /function renderIntrigueQueuedMapChoiceConflicts/);
  assert.match(webAppSource, /collectQueuedMapChoiceConflictSources/);
  assert.match(webAppSource, /attention: conflit avec/);
  assert.match(webAppSource, /ressource détournée/);
  assert.match(webAppSource, /délai consommé/);
  assert.match(webAppSource, /exposition accrue/);
  assert.match(webAppSource, /attention: conflit possible sous brouillard/);
  assert.match(webAppSource, /ne pas inférer cellule, cible, relais ni objectif caché/);
  assert.match(webAppSource, /Conflits fog-safe entre réponses intrigue et choix carte en file/);
  assert.match(webAppSource, /renderIntrigueQueuedMapChoiceConflicts\(province, intrigueView\)/);
  assert.match(stylesSource, /province-intrigue-queue-conflicts/);
  assert.match(stylesSource, /province-intrigue-queue-conflict--masked/);
});
