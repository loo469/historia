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
