import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('playable province detail renders compact logistics route causes', () => {
  assert.match(webAppSource, /function renderProvinceLogisticsChoicePreview/);
  assert.match(webAppSource, /province-logistics-cause-summary/);
  assert.match(webAppSource, /Cause locale/);
  assert.match(webAppSource, /option\.causeLabel/);
  assert.match(webAppSource, /option\.cause/);
  assert.match(webAppSource, /province-logistics-recovery-comparison/);
  assert.match(webAppSource, /choice\.benefit/);
  assert.match(webAppSource, /choice\.blocker/);
  assert.match(webAppSource, /choice\.rationale/);
  assert.match(webAppSource, /logistique stable/);
  assert.equal(webAppSource.includes("if (preview.options.length === 0) {\n    return '';\n  }"), false);
  assert.match(stylesSource, /\.province-logistics-cause-summary/);
  assert.match(stylesSource, /province-logistics-cause-summary--high/);
  assert.match(stylesSource, /province-logistics-cause-summary--stable/);
  assert.match(stylesSource, /province-logistics-choice__cause/);
  assert.match(stylesSource, /province-logistics-recovery-comparison/);
  assert.match(stylesSource, /province-logistics-recovery--high/);
  assert.match(stylesSource, /province-logistics-recovery--medium/);
});
