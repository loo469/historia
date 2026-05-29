import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('atlas previews climate safety margin loss on the next turn', () => {
  assert.match(webAppSource, /function buildAtlasClimateNextTurnSafetyMarginLoss/);
  assert.match(webAppSource, /function renderAtlasClimateNextTurnSafetyMarginLoss/);
  assert.match(webAppSource, /Marge prochain tour/);
  assert.match(webAppSource, /marge stable/);
  assert.match(webAppSource, /diminue légèrement/);
  assert.match(webAppSource, /devient dangereuse/);
  assert.match(webAppSource, /projection inconnue/);
  assert.match(webAppSource, /Consommateur principal/);
  assert.match(webAppSource, /action préventive préférable maintenant/);
  assert.match(webAppSource, /Projection indisponible/);
  assert.match(webAppSource, /buildAtlasClimateNextTurnSafetyMarginLoss\(\s*atlasClimateFollowUpSafetyMargin,\s*atlasClimateThresholdProgressAfterReadinessAction,\s*atlasClimateFollowUpThresholdProtection,\s*\)/);
  assert.match(webAppSource, /renderAtlasClimateFollowUpSafetyMargin\(atlasClimateFollowUpSafetyMargin\)\}\s*\$\{renderAtlasClimateNextTurnSafetyMarginLoss\(atlasClimateNextTurnSafetyMarginLoss\)\}/);

  assert.match(stylesSource, /\.map-world-climate-next-turn-margin-loss/);
  assert.match(stylesSource, /\.map-world-climate-next-turn-margin-loss--slight-loss/);
  assert.match(stylesSource, /\.map-world-climate-next-turn-margin-loss--dangerous-next-turn/);
  assert.match(stylesSource, /\.map-world-climate-next-turn-margin-loss--unknown/);
});
