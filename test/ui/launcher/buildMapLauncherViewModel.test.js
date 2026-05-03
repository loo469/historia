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
        economy: {
          cityCount: 2,
          routeCount: 1,
          activeRouteCount: 1,
          totalStock: 18,
          totalCapacity: 7,
          pressureLabel: 'Route des gués · risque 31',
          resources: [
            { resourceId: 'grain', label: 'Grain', quantity: 12 },
            { resourceId: 'tools', quantity: 6 },
          ],
          visibleCities: ['Gué du Sud', 'Marché des Bornes'],
          routeNames: ['Route des gués'],
        },
      },
    ], 'marches');

    assert.equal(viewModel.selectedMapId, 'marches');
    assert.equal(viewModel.selectedOption.signalLabel, '2 cultures · 4 découvertes · 2 villes · 1 route · 18 stocks');
    assert.deepEqual(viewModel.selectedOption.economy, {
      cityCount: 2,
      routeCount: 1,
      activeRouteCount: 1,
      totalStock: 18,
      totalCapacity: 7,
      pressureLabel: 'Route des gués · risque 31',
      resources: [
        { resourceId: 'grain', label: 'Grain', quantity: 12 },
        { resourceId: 'tools', label: 'tools', quantity: 6 },
      ],
      visibleCities: ['Gué du Sud', 'Marché des Bornes'],
      routeNames: ['Route des gués'],
      signalLabel: '2 villes · 1 route · 18 stocks',
    });
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
