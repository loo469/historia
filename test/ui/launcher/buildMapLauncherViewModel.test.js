import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildMapLauncherViewModel } from '../../../src/ui/launcher/buildMapLauncherViewModel.js';

describe('buildMapLauncherViewModel', () => {
  it('selects the requested map and exposes culture discovery signals', () => {
    const viewModel = buildMapLauncherViewModel([
      {
        id: 'continental',
        title: 'Théâtre continental',
        summary: 'Carte visible de démarrage.',
        cultureCount: 3,
        discoveryCount: 5,
        provinceCount: 6,
        previewTags: ['Culture', 'Découvertes'],
      },
      {
        id: 'marches',
        title: 'Basses Marches',
        summary: 'Focus culturel prototype.',
        cultureCount: 2,
        discoveryCount: 4,
        provinceCount: 3,
      },
    ], 'marches');

    assert.equal(viewModel.selectedMapId, 'marches');
    assert.equal(viewModel.selectedOption.signalLabel, '2 cultures · 4 découvertes');
    assert.deepEqual(viewModel.options.map((option) => option.selected), [false, true]);
  });

  it('falls back to the first playable map when the selected id is unknown', () => {
    const viewModel = buildMapLauncherViewModel([
      {
        id: 'continental',
        title: 'Théâtre continental',
        summary: 'Carte visible de démarrage.',
        cultureCount: 3,
        discoveryCount: 5,
        provinceCount: 6,
      },
    ], 'missing-map');

    assert.equal(viewModel.selectedMapId, 'continental');
    assert.equal(viewModel.options[0].selected, true);
  });
});
