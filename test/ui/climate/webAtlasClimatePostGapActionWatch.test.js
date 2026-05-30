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
  assert.match(webAppSource, /state: 'available'/);
  assert.match(webAppSource, /state: 'impossible'/);
  assert.match(webAppSource, /state: 'fallback'/);
  assert.match(webAppSource, /garde \$\{watchGap\.label\} secondaire sans lancer une prévention complète/);
  assert.match(webAppSource, /aucune action minimale calculable depuis la protection visible/);
  assert.match(webAppSource, /relire la veille secondaire au prochain signal climat avant d’investir/);
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
  assert.match(stylesSource, /\.map-world-climate-post-gap-watch__upkeep--fallback/);
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

test('atlas keeps a readable upkeep fallback without adding climate mechanics', () => {
  assert.match(webAppSource, /state: 'fallback'/);
  assert.match(webAppSource, /label: 'fallback entretien'/);
  assert.match(webAppSource, /relire la veille secondaire au prochain signal climat avant d’investir/);
  assert.match(webAppSource, /aucune mitigation minimale disponible pour maintenir ce statut/);
});
