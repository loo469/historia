import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const webAppSource = readFileSync(new URL('../../../web/app.js', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../web/styles.css', import.meta.url), 'utf8');

test('culture urgency badges render compact local timeline reasons', () => {
  assert.match(webAppSource, /hint\.urgency\?\.reason/);
  assert.match(webAppSource, /culture-opportunity-reminder__reason/);
  assert.match(webAppSource, /reminder\.reasonCopy/);
  assert.match(webAppSource, /aria-label="Voir \$\{reminder\.focusCopy\}: \$\{reminder\.urgency\?\.detail/);
  assert.match(webAppSource, /culture-opportunity-reminder__action/);
  assert.match(webAppSource, /reminder\.recommendedAction\?\.summary/);
  assert.match(stylesSource, /\.culture-opportunity-reminder__reason/);
  assert.match(stylesSource, /\.culture-opportunity-reminder__action/);
});
