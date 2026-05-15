import test from 'node:test';
import assert from 'node:assert/strict';

import { Culture } from '../../../src/domain/culture/Culture.js';
import { HistoricalEvent } from '../../../src/domain/culture/HistoricalEvent.js';
import { ResearchState } from '../../../src/domain/culture/ResearchState.js';
import { buildCultureMapOverlay, buildResidualCultureActionPayoff, buildResidualCultureFollowUpWindow, buildResidualCultureWindowClosureThreat, buildResidualCultureSupportAllocationChoice, buildResidualCulturePostAllocationStability, buildResidualCultureReevaluationTrigger, buildResidualCultureReevaluationDelayCost, buildResidualCultureMinimalDelayedSupport, buildResidualCultureReliabilityUpgradeCondition, buildResidualCultureStabilityWatchWindow, buildResidualCultureSupportRedeploymentCue, buildResidualCulturePrematureRedeploymentRisk } from '../../../src/ui/culture/buildCultureMapOverlay.js';

function withoutSupportRiskPreviews(value) {
  if (Array.isArray(value)) {
    return value.map(withoutSupportRiskPreviews);
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !['riskChangePreview', 'postBundleCumulativeRisk', 'nextSafeSupportBundle', 'cultureStabilizationSummary'].includes(key))
      .map(([key, nestedValue]) => [key, withoutSupportRiskPreviews(nestedValue)]),
  );
}

test('buildCultureMapOverlay expands cultures into stable regional markers with discoveries', () => {
  const overlay = buildCultureMapOverlay(
    {
      cultures: [
        new Culture({
          id: 'culture-north',
          name: 'Northern League',
          archetype: 'maritime',
          primaryLanguage: 'north-tongue',
          valueIds: ['trade', 'navigation'],
          traditionIds: ['assemblies'],
          openness: 72,
          cohesion: 61,
          researchDrive: 77,
        }),
        new Culture({
          id: 'culture-steppe',
          name: 'Steppe Houses',
          archetype: 'nomadic',
          primaryLanguage: 'horse-speech',
          valueIds: ['honor'],
          traditionIds: ['clan-oaths'],
          openness: 35,
          cohesion: 67,
          researchDrive: 40,
        }),
      ],
      researchStates: [
        new ResearchState({
          id: 'research-astrolabe',
          cultureId: 'culture-north',
          topicId: 'astrolabe',
          status: 'active',
          progress: 65,
          discoveredConceptIds: ['star-maps', 'tidal-ledgers'],
        }),
        new ResearchState({
          id: 'research-saddles',
          cultureId: 'culture-steppe',
          topicId: 'composite-saddles',
          status: 'completed',
          progress: 100,
          completedAt: '2026-04-19T00:00:00.000Z',
          discoveredConceptIds: ['stirrup-drill'],
        }),
      ],
      historicalEvents: [
        new HistoricalEvent({
          id: 'event-open-archives',
          title: 'Open Archives',
          category: 'knowledge',
          summary: 'Scholars share navigation routes.',
          era: 'age-of-sails',
          importance: 3,
          triggeredAt: '2026-04-19T00:00:00.000Z',
          affectedCultureIds: ['culture-north'],
          discoveryIds: ['public-catalogue'],
        }),
      ],
    },
    {
      regionIdsByCulture: {
        'culture-north': ['north-coast', 'archipelago'],
        'culture-steppe': ['high-steppe'],
      },
    },
  );

  assert.deepEqual(withoutSupportRiskPreviews(overlay), [
    {
      overlayId: 'archipelago:culture-north',
      regionId: 'archipelago',
      cultureId: 'culture-north',
      cultureName: 'Northern League',
      archetype: 'maritime',
      primaryLanguage: 'north-tongue',
      markerType: 'innovation',
      influenceScore: 79,
      influenceTier: 'strong',
      label: 'Northern League (3 découvertes)',
      summary: '1 recherches actives, 1 événements, 3 repères culturels',
      discoveries: ['public-catalogue', 'star-maps', 'tidal-ledgers'],
      regionalDiscoveryLinks: [
        {
          linkId: 'archipelago:culture-north:public-catalogue',
          regionId: 'archipelago',
          cultureId: 'culture-north',
          discoveryId: 'public-catalogue',
          eventIds: ['event-open-archives'],
          eventTitles: ['Open Archives'],
          eventCount: 1,
          activeResearchCount: 1,
          label: 'public-catalogue · archipelago · 1 événement',
        },
        {
          linkId: 'archipelago:culture-north:star-maps',
          regionId: 'archipelago',
          cultureId: 'culture-north',
          discoveryId: 'star-maps',
          eventIds: [],
          eventTitles: [],
          eventCount: 0,
          activeResearchCount: 1,
          label: 'star-maps · archipelago',
        },
        {
          linkId: 'archipelago:culture-north:tidal-ledgers',
          regionId: 'archipelago',
          cultureId: 'culture-north',
          discoveryId: 'tidal-ledgers',
          eventIds: [],
          eventTitles: [],
          eventCount: 0,
          activeResearchCount: 1,
          label: 'tidal-ledgers · archipelago',
        },
      ],
      unlockedResearchIds: ['astrolabe'],
      activeResearchCount: 1,
      eventIds: ['event-open-archives'],
      eventTitles: ['Open Archives'],
      eventCount: 1,
      eventPopups: [
        {
          popupId: 'archipelago:culture-north:event-open-archives:popup',
          eventId: 'event-open-archives',
          title: 'Open Archives',
          summary: 'Scholars share navigation routes.',
          triggeredAt: '2026-04-19T00:00:00.000Z',
          importance: 3,
          discoveries: ['public-catalogue'],
          unlockedResearchIds: ['astrolabe'],
          label: 'Open Archives · 2026-04-19',
          order: 1,
        },
      ],
      identityTags: ['assemblies', 'navigation', 'trade'],
      highlights: ['public-catalogue', 'star-maps', 'assemblies'],
      cultureMetrics: {
        openness: 72,
        cohesion: 61,
        researchDrive: 77,
      },
      zoneRank: 0,
      overlapCount: 1,
      zoneBand: 'core',
      dominantInRegion: true,
      competingCultureIds: [],
      zoneContour: {
        radius: 22,
        feather: 2,
        ringCount: 1,
      },
      style: {
        color: 'violet',
        icon: '✦',
        emphasis: 'high',
        accent: 'iris',
        labelTone: 'visionary',
      },
      zoneStyle: {
        fill: 'violet',
        outline: 'violet',
        accent: 'iris',
        markerIcon: '✦',
        emphasis: 'high',
        labelTone: 'visionary',
        opacity: 0.7,
        pattern: 'radiant',
        surface: 'gloss',
        glow: 'luminous',
        blendMode: 'source-over',
        strokeWidth: 4,
      },
    },
    {
      overlayId: 'high-steppe:culture-steppe',
      regionId: 'high-steppe',
      cultureId: 'culture-steppe',
      cultureName: 'Steppe Houses',
      archetype: 'nomadic',
      primaryLanguage: 'horse-speech',
      markerType: 'traditional',
      influenceScore: 45,
      influenceTier: 'emerging',
      label: 'Steppe Houses (1 découvertes)',
      summary: '0 recherches actives, 0 événements, 2 repères culturels',
      discoveries: ['stirrup-drill'],
      regionalDiscoveryLinks: [
        {
          linkId: 'high-steppe:culture-steppe:stirrup-drill',
          regionId: 'high-steppe',
          cultureId: 'culture-steppe',
          discoveryId: 'stirrup-drill',
          eventIds: [],
          eventTitles: [],
          eventCount: 0,
          activeResearchCount: 0,
          label: 'stirrup-drill · high-steppe',
        },
      ],
      unlockedResearchIds: ['composite-saddles'],
      activeResearchCount: 0,
      eventIds: [],
      eventTitles: [],
      eventCount: 0,
      eventPopups: [],
      identityTags: ['clan-oaths', 'honor'],
      highlights: ['stirrup-drill', 'clan-oaths', 'honor'],
      cultureMetrics: {
        openness: 35,
        cohesion: 67,
        researchDrive: 40,
      },
      zoneRank: 0,
      overlapCount: 1,
      zoneBand: 'core',
      dominantInRegion: true,
      competingCultureIds: [],
      zoneContour: {
        radius: 18,
        feather: 2,
        ringCount: 1,
      },
      style: {
        color: 'amber',
        icon: '⬢',
        emphasis: 'normal',
        accent: 'ochre',
        labelTone: 'ancestral',
      },
      zoneStyle: {
        fill: 'amber',
        outline: 'amber',
        accent: 'ochre',
        markerIcon: '⬢',
        emphasis: 'normal',
        labelTone: 'ancestral',
        opacity: 0.55,
        pattern: 'woven',
        surface: 'grain',
        glow: 'matte',
        blendMode: 'source-over',
        strokeWidth: 4,
      },
    },
    {
      overlayId: 'north-coast:culture-north',
      regionId: 'north-coast',
      cultureId: 'culture-north',
      cultureName: 'Northern League',
      archetype: 'maritime',
      primaryLanguage: 'north-tongue',
      markerType: 'innovation',
      influenceScore: 79,
      influenceTier: 'strong',
      label: 'Northern League (3 découvertes)',
      summary: '1 recherches actives, 1 événements, 3 repères culturels',
      discoveries: ['public-catalogue', 'star-maps', 'tidal-ledgers'],
      regionalDiscoveryLinks: [
        {
          linkId: 'north-coast:culture-north:public-catalogue',
          regionId: 'north-coast',
          cultureId: 'culture-north',
          discoveryId: 'public-catalogue',
          eventIds: ['event-open-archives'],
          eventTitles: ['Open Archives'],
          eventCount: 1,
          activeResearchCount: 1,
          label: 'public-catalogue · north-coast · 1 événement',
        },
        {
          linkId: 'north-coast:culture-north:star-maps',
          regionId: 'north-coast',
          cultureId: 'culture-north',
          discoveryId: 'star-maps',
          eventIds: [],
          eventTitles: [],
          eventCount: 0,
          activeResearchCount: 1,
          label: 'star-maps · north-coast',
        },
        {
          linkId: 'north-coast:culture-north:tidal-ledgers',
          regionId: 'north-coast',
          cultureId: 'culture-north',
          discoveryId: 'tidal-ledgers',
          eventIds: [],
          eventTitles: [],
          eventCount: 0,
          activeResearchCount: 1,
          label: 'tidal-ledgers · north-coast',
        },
      ],
      unlockedResearchIds: ['astrolabe'],
      activeResearchCount: 1,
      eventIds: ['event-open-archives'],
      eventTitles: ['Open Archives'],
      eventCount: 1,
      eventPopups: [
        {
          popupId: 'north-coast:culture-north:event-open-archives:popup',
          eventId: 'event-open-archives',
          title: 'Open Archives',
          summary: 'Scholars share navigation routes.',
          triggeredAt: '2026-04-19T00:00:00.000Z',
          importance: 3,
          discoveries: ['public-catalogue'],
          unlockedResearchIds: ['astrolabe'],
          label: 'Open Archives · 2026-04-19',
          order: 1,
        },
      ],
      identityTags: ['assemblies', 'navigation', 'trade'],
      highlights: ['public-catalogue', 'star-maps', 'assemblies'],
      cultureMetrics: {
        openness: 72,
        cohesion: 61,
        researchDrive: 77,
      },
      zoneRank: 0,
      overlapCount: 1,
      zoneBand: 'core',
      dominantInRegion: true,
      competingCultureIds: [],
      zoneContour: {
        radius: 22,
        feather: 2,
        ringCount: 1,
      },
      style: {
        color: 'violet',
        icon: '✦',
        emphasis: 'high',
        accent: 'iris',
        labelTone: 'visionary',
      },
      zoneStyle: {
        fill: 'violet',
        outline: 'violet',
        accent: 'iris',
        markerIcon: '✦',
        emphasis: 'high',
        labelTone: 'visionary',
        opacity: 0.7,
        pattern: 'radiant',
        surface: 'gloss',
        glow: 'luminous',
        blendMode: 'source-over',
        strokeWidth: 4,
      },
    },
  ]);
});

test('buildCultureMapOverlay distinguishes overlapping cultural influences in the same region', () => {
  const overlay = buildCultureMapOverlay(
    {
      cultures: [
        {
          id: 'culture-north',
          name: 'Northern League',
          archetype: 'maritime',
          primaryLanguage: 'north-tongue',
          valueIds: ['trade', 'navigation'],
          traditionIds: ['assemblies'],
          openness: 72,
          cohesion: 61,
          researchDrive: 77,
        },
        {
          id: 'culture-delta',
          name: 'Delta Scribes',
          archetype: 'scholarly',
          primaryLanguage: 'delta-script',
          valueIds: ['memory'],
          traditionIds: ['archives'],
          openness: 58,
          cohesion: 52,
          researchDrive: 64,
        },
      ],
      researchStates: [
        {
          id: 'research-astrolabe',
          cultureId: 'culture-north',
          topicId: 'astrolabe',
          status: 'active',
          progress: 65,
          discoveredConceptIds: ['star-maps', 'tidal-ledgers'],
        },
        {
          id: 'research-ledgers',
          cultureId: 'culture-delta',
          topicId: 'delta-ledgers',
          status: 'active',
          progress: 52,
          discoveredConceptIds: ['ink-network'],
        },
      ],
      historicalEvents: [],
    },
    {
      regionIdsByCulture: {
        'culture-north': ['shared-bay'],
        'culture-delta': ['shared-bay'],
      },
    },
  );

  assert.deepEqual(withoutSupportRiskPreviews(overlay), [
    {
      overlayId: 'shared-bay:culture-delta',
      regionId: 'shared-bay',
      cultureId: 'culture-delta',
      cultureName: 'Delta Scribes',
      archetype: 'scholarly',
      primaryLanguage: 'delta-script',
      markerType: 'balanced',
      influenceScore: 52,
      influenceTier: 'emerging',
      label: 'Delta Scribes (1 découvertes)',
      summary: '1 recherches actives, 0 événements, 2 repères culturels',
      discoveries: ['ink-network'],
      regionalDiscoveryLinks: [
        {
          linkId: 'shared-bay:culture-delta:ink-network',
          regionId: 'shared-bay',
          cultureId: 'culture-delta',
          discoveryId: 'ink-network',
          eventIds: [],
          eventTitles: [],
          eventCount: 0,
          activeResearchCount: 1,
          label: 'ink-network · shared-bay',
        },
      ],
      unlockedResearchIds: ['delta-ledgers'],
      activeResearchCount: 1,
      eventIds: [],
      eventTitles: [],
      eventCount: 0,
      eventPopups: [],
      identityTags: ['archives', 'memory'],
      highlights: ['ink-network', 'archives', 'memory'],
      cultureMetrics: {
        openness: 58,
        cohesion: 52,
        researchDrive: 64,
      },
      zoneRank: 1,
      overlapCount: 2,
      zoneBand: 'outer',
      dominantInRegion: false,
      competingCultureIds: ['culture-north'],
      zoneContour: {
        radius: 15,
        feather: 4,
        ringCount: 2,
      },
      style: {
        color: 'teal',
        icon: '◆',
        emphasis: 'normal',
        accent: 'seafoam',
        labelTone: 'measured',
      },
      zoneStyle: {
        fill: 'teal',
        outline: 'teal',
        accent: 'seafoam',
        markerIcon: '◆',
        emphasis: 'normal',
        labelTone: 'measured',
        opacity: 0.55,
        pattern: 'solid',
        surface: 'matte',
        glow: 'soft',
        blendMode: 'multiply',
        strokeWidth: 2,
      },
    },
    {
      overlayId: 'shared-bay:culture-north',
      regionId: 'shared-bay',
      cultureId: 'culture-north',
      cultureName: 'Northern League',
      archetype: 'maritime',
      primaryLanguage: 'north-tongue',
      markerType: 'innovation',
      influenceScore: 68,
      influenceTier: 'strong',
      label: 'Northern League (2 découvertes)',
      summary: '1 recherches actives, 0 événements, 3 repères culturels',
      discoveries: ['star-maps', 'tidal-ledgers'],
      regionalDiscoveryLinks: [
        {
          linkId: 'shared-bay:culture-north:star-maps',
          regionId: 'shared-bay',
          cultureId: 'culture-north',
          discoveryId: 'star-maps',
          eventIds: [],
          eventTitles: [],
          eventCount: 0,
          activeResearchCount: 1,
          label: 'star-maps · shared-bay',
        },
        {
          linkId: 'shared-bay:culture-north:tidal-ledgers',
          regionId: 'shared-bay',
          cultureId: 'culture-north',
          discoveryId: 'tidal-ledgers',
          eventIds: [],
          eventTitles: [],
          eventCount: 0,
          activeResearchCount: 1,
          label: 'tidal-ledgers · shared-bay',
        },
      ],
      unlockedResearchIds: ['astrolabe'],
      activeResearchCount: 1,
      eventIds: [],
      eventTitles: [],
      eventCount: 0,
      eventPopups: [],
      identityTags: ['assemblies', 'navigation', 'trade'],
      highlights: ['star-maps', 'tidal-ledgers', 'assemblies'],
      cultureMetrics: {
        openness: 72,
        cohesion: 61,
        researchDrive: 77,
      },
      zoneRank: 0,
      overlapCount: 2,
      zoneBand: 'core',
      dominantInRegion: true,
      competingCultureIds: ['culture-delta'],
      zoneContour: {
        radius: 22,
        feather: 4,
        ringCount: 2,
      },
      style: {
        color: 'violet',
        icon: '✦',
        emphasis: 'high',
        accent: 'iris',
        labelTone: 'visionary',
      },
      zoneStyle: {
        fill: 'violet',
        outline: 'violet',
        accent: 'iris',
        markerIcon: '✦',
        emphasis: 'high',
        labelTone: 'visionary',
        opacity: 0.7,
        pattern: 'radiant',
        surface: 'gloss',
        glow: 'luminous',
        blendMode: 'source-over',
        strokeWidth: 4,
      },
    },
  ]);
});

test('buildCultureMapOverlay supports plain payloads and style overrides', () => {
  const overlay = buildCultureMapOverlay(
    {
      cultures: [
        {
          id: 'culture-fractured',
          name: 'Broken Courts',
          archetype: 'courtly',
          primaryLanguage: 'court-speech',
          valueIds: ['prestige'],
          traditionIds: ['duels'],
          openness: 50,
          cohesion: 24,
          researchDrive: 58,
        },
      ],
      researchStates: [],
      historicalEvents: [],
    },
    {
      regionIdsByCulture: { 'culture-fractured': ['capital-basin'] },
      styleByMarkerType: {
        fragmented: { color: 'ruby', icon: '⚑', emphasis: 'critical' },
      },
    },
  );

  assert.deepEqual(overlay[0].style, {
    color: 'ruby',
    icon: '⚑',
    emphasis: 'critical',
    accent: 'ember',
    labelTone: 'volatile',
  });
  assert.equal(overlay[0].markerType, 'fragmented');
  assert.equal(overlay[0].influenceTier, 'faint');
  assert.equal(overlay[0].zoneStyle.pattern, 'fractured');
  assert.equal(overlay[0].zoneStyle.surface, 'shattered');
  assert.equal(overlay[0].zoneStyle.glow, 'sparking');
});

test('buildCultureMapOverlay bundles compatible supports for fragile cultural regions', () => {
  const overlay = buildCultureMapOverlay(
    {
      cultures: [
        {
          id: 'culture-marsh',
          name: 'Marsh Houses',
          archetype: 'riverine',
          primaryLanguage: 'marsh-cant',
          valueIds: ['oaths'],
          traditionIds: ['reed-courts'],
          openness: 38,
          cohesion: 34,
          researchDrive: 64,
        },
        {
          id: 'culture-hill',
          name: 'Hill Compact',
          archetype: 'highland',
          primaryLanguage: 'hill-speech',
          valueIds: ['trade'],
          traditionIds: ['beacons'],
          openness: 61,
          cohesion: 66,
          researchDrive: 58,
        },
        {
          id: 'culture-stable',
          name: 'Stable Guilds',
          archetype: 'urban',
          primaryLanguage: 'guild-tongue',
          valueIds: ['craft'],
          traditionIds: ['charters'],
          openness: 58,
          cohesion: 72,
          researchDrive: 62,
        },
      ],
      researchStates: [
        {
          id: 'research-marsh-couriers',
          cultureId: 'culture-marsh',
          topicId: 'reed-couriers',
          status: 'active',
          progress: 44,
          discoveredConceptIds: ['reed-routes'],
        },
      ],
      historicalEvents: [
        {
          id: 'event-marsh-accord',
          title: 'Marsh Accord',
          category: 'diplomacy',
          summary: 'Border delegates reopen a contested ferry.',
          era: 'map-play',
          importance: 3,
          triggeredAt: '2026-05-13T00:00:00.000Z',
          affectedCultureIds: ['culture-marsh'],
          discoveryIds: ['ferry-charter'],
        },
      ],
    },
    {
      regionIdsByCulture: {
        'culture-marsh': ['shared-marsh'],
        'culture-hill': ['shared-marsh'],
        'culture-stable': ['stable-market'],
      },
    },
  );

  const marsh = overlay.find((entry) => entry.cultureId === 'culture-marsh');
  const stable = overlay.find((entry) => entry.cultureId === 'culture-stable');

  assert.deepEqual(marsh.supportBundles, [
    {
      id: 'shared-marsh:culture-marsh:bundle:cohesion-anchor',
      label: 'ancrer cohésion locale',
      actionIds: ['identity:oaths', 'event:mediate-public-memory'],
      actionKeys: ['protect-identity', 'mediate-event-memory'],
      expectedBenefit: 'réduit la fragmentation visible avant soutien externe',
      tradeoff: 'cohésion + / ouverture -',
      riskReduced: 'fragmentation culturelle',
      reason: 'cohésion 34 · oaths',
      safetyScore: 12,
      safetyReason: 'engagement sûr: ancre identitaire d’abord · score 12',
      monitoredRisk: 'fragmentation culturelle',
      rank: 1,
    },
    {
      id: 'shared-marsh:culture-marsh:bundle:guided-opening',
      label: 'ouvrir par relais savant',
      actionIds: ['discovery:ferry-charter', 'research:reed-couriers'],
      actionKeys: ['share-discovery', 'pace-research'],
      expectedBenefit: 'garde l’ouverture lisible sans casser les repères locaux',
      tradeoff: 'ouverture + / cohésion sous surveillance',
      riskReduced: 'isolement du support',
      reason: 'ouverture 38 · ferry-charter',
      safetyScore: 5,
      safetyReason: 'engagement sûr: recherche cadencée avant ouverture · score 5',
      monitoredRisk: 'isolement du support',
      rank: 2,
    },
  ]);
  assert.deepEqual(marsh.recommendedFirstBundle, {
    bundleId: 'shared-marsh:culture-marsh:bundle:cohesion-anchor',
    label: 'ancrer cohésion locale',
    safetyScore: 12,
    reason: 'engagement sûr: ancre identitaire d’abord · score 12',
    monitoredRisk: 'fragmentation culturelle',
    riskChangePreview: {
      status: 'improves',
      currentRisk: 66,
      expectedRisk: 40,
      delta: -26,
      monitoredRisk: 'fragmentation culturelle',
      tradeoffToWatch: 'cohésion + / ouverture -',
      reason: 'réduit la fragmentation visible avant soutien externe',
    },
    postBundleCumulativeRisk: {
      status: 'redirects-attention',
      before: {
        score: 67,
        level: 'elevated',
      },
      after: {
        score: 67,
        level: 'elevated',
      },
      reducedRisk: 'fragmentation culturelle',
      remainingPriority: 'isolement du support',
      fragileRegionId: 'shared-marsh',
      fragileCultureId: 'culture-marsh',
      nextAttention: 'surveiller les relais savants et le rythme d’ouverture',
    },
  });
  assert.deepEqual(marsh.riskChangePreview, marsh.recommendedFirstBundle.riskChangePreview);
  assert.deepEqual(marsh.postBundleCumulativeRisk, marsh.recommendedFirstBundle.postBundleCumulativeRisk);
  assert.deepEqual(marsh.nextSafeSupportBundle, {
    bundleId: 'shared-marsh:culture-marsh:bundle:guided-opening',
    label: 'ouvrir par relais savant',
    residualReliefScore: 12,
    reason: 'second soutien sûr: cible le risque résiduel isolement du support · score 12',
    monitoredRisk: 'isolement du support',
    tradeoffToWatch: 'ouverture + / cohésion sous surveillance',
    followsBundleId: 'shared-marsh:culture-marsh:bundle:cohesion-anchor',
  });
  assert.deepEqual(marsh.cultureStabilizationSummary, {
    status: 'partial',
    beforeSecondBundle: {
      score: 67,
      level: 'elevated',
    },
    afterSecondBundle: {
      score: 43,
      level: 'guarded',
    },
    stableRegionIds: [],
    fragileRegionIds: [],
    mediationRegionIds: ['shared-marsh'],
    dependencies: [
      {
        fromBundleId: 'shared-marsh:culture-marsh:bundle:cohesion-anchor',
        toBundleId: 'shared-marsh:culture-marsh:bundle:guided-opening',
        reason: 'appliquer le second soutien seulement après stabilisation du premier bundle',
      },
    ],
    incompatibilities: [
      {
        bundleId: 'shared-marsh:culture-marsh:bundle:guided-opening',
        tradeoff: 'ouverture + / cohésion sous surveillance',
        mitigation: 'médiation ultérieure recommandée avant d’empiler un troisième soutien',
      },
    ],
    stabilizationDebtSummary: {
      status: 'open',
      count: 3,
      debts: [
        {
          debtId: 'shared-marsh:debt:dependency:shared-marsh:culture-marsh:bundle:guided-opening',
          type: 'bundle-dependency',
          cause: 'appliquer le second soutien seulement après stabilisation du premier bundle',
          urgency: 'medium',
          nextAction: 'séquencer les supports avant tout nouveau bundle',
        },
        {
          debtId: 'shared-marsh:debt:incompatibility:shared-marsh:culture-marsh:bundle:guided-opening',
          type: 'bundle-incompatibility',
          cause: 'ouverture + / cohésion sous surveillance',
          urgency: 'medium',
          nextAction: 'médiation ultérieure recommandée avant d’empiler un troisième soutien',
        },
        {
          debtId: 'shared-marsh:debt:mediation:isolement du support',
          type: 'regional-mediation',
          cause: 'risque restant: isolement du support',
          urgency: 'medium',
          nextAction: 'surveiller les relais savants et le rythme d’ouverture',
        },
      ],
      dependencyRetirementRanking: [
        {
          rank: 1,
          debtId: 'shared-marsh:debt:incompatibility:shared-marsh:culture-marsh:bundle:guided-opening',
          type: 'bundle-incompatibility',
          cause: 'ouverture + / cohésion sous surveillance',
          urgency: 'medium',
          nextAction: 'médiation ultérieure recommandée avant d’empiler un troisième soutien',
          expectedGain: 'retire un tradeoff de support qui entretient la dette de stabilisation',
          blockedUntilSupport: false,
        },
        {
          rank: 2,
          debtId: 'shared-marsh:debt:dependency:shared-marsh:culture-marsh:bundle:guided-opening',
          type: 'bundle-dependency',
          cause: 'appliquer le second soutien seulement après stabilisation du premier bundle',
          urgency: 'medium',
          nextAction: 'séquencer les supports avant tout nouveau bundle',
          expectedGain: 'simplifie la séquence de soutien et clarifie la prochaine action culturelle',
          blockedUntilSupport: false,
        },
        {
          rank: 3,
          debtId: 'shared-marsh:debt:mediation:isolement du support',
          type: 'regional-mediation',
          cause: 'risque restant: isolement du support',
          urgency: 'medium',
          nextAction: 'surveiller les relais savants et le rythme d’ouverture',
          expectedGain: 'réduit la priorité régionale isolement du support',
          blockedUntilSupport: false,
        },
      ],
      recommendedFirstRetirement: {
        rank: 1,
        debtId: 'shared-marsh:debt:incompatibility:shared-marsh:culture-marsh:bundle:guided-opening',
        type: 'bundle-incompatibility',
        cause: 'ouverture + / cohésion sous surveillance',
        urgency: 'medium',
        nextAction: 'médiation ultérieure recommandée avant d’empiler un troisième soutien',
        expectedGain: 'retire un tradeoff de support qui entretient la dette de stabilisation',
        blockedUntilSupport: false,
      },
      topRetirementReadiness: {
        status: 'blocked',
        blockers: [
          {
            blockerId: 'shared-marsh:debt:incompatibility:shared-marsh:culture-marsh:bundle:guided-opening:timing',
            type: 'timing-local-pressure',
            reason: 'surveiller les relais savants et le rythme d’ouverture',
            nextSmallStep: 'stabiliser la pression locale avant retrait',
          },
        ],
        nextSmallStep: 'stabiliser la pression locale avant retrait',
      },
      topRetirementRecoveryPreview: {
        status: 'preview',
        recoveryType: 'stability',
        expectedRecovery: 'stabilité récupérée: le tradeoff culturel cesse de nourrir la dette prioritaire',
        immediacy: 'conditional',
        closesLoop: 'stabiliser la pression locale avant retrait → retire un tradeoff de support qui entretient la dette de stabilisation',
      },
      nextDependencyRetirementPath: {
        status: 'conditional',
        nextRetirement: {
          debtId: 'shared-marsh:debt:dependency:shared-marsh:culture-marsh:bundle:guided-opening',
          type: 'bundle-dependency',
          rank: 2,
          cause: 'appliquer le second soutien seulement après stabilisation du premier bundle',
          expectedGain: 'simplifie la séquence de soutien et clarifie la prochaine action culturelle',
        },
        recommendedRecoveryPath: 'stabilité récupérée: le tradeoff culturel cesse de nourrir la dette prioritaire',
        mainRemainingBlocker: {
          blockerId: 'shared-marsh:debt:incompatibility:shared-marsh:culture-marsh:bundle:guided-opening:timing',
          type: 'timing-local-pressure',
          reason: 'surveiller les relais savants et le rythme d’ouverture',
          nextSmallStep: 'stabiliser la pression locale avant retrait',
        },
        reason: 'lever timing-local-pressure pour rendre le retrait #2 lisible',
      },
      residualRiskAfterNextRetirement: {
        status: 'partial',
        principalResidualFragility: {
          type: 'regional-mediation',
          cause: 'risque restant: isolement du support',
          urgency: 'medium',
        },
        nextActionAfterRetirement: 'surveiller les relais savants et le rythme d’ouverture',
        reason: 'stabilisation partielle: surveiller risque restant: isolement du support',
      },
      residualCultureRiskNextAction: {
        status: 'optional',
        actionType: 'mediation',
        recommendedAction: 'ouvrir une médiation locale courte après le retrait suivant',
        reason: 'bon second pas: risque restant: isolement du support reste medium',
      },
      residualCultureActionPayoff: {
        status: 'partial',
        expectedEffect: 'réduction partielle attendue: risque restant: isolement du support',
        remainingFragility: {
          type: 'regional-mediation',
          cause: 'risque restant: isolement du support',
          urgency: 'medium',
        },
        nextDecision: 'réévaluer la médiation ou le support local au prochain tour',
      },
      residualCultureFollowUpWindow: {
        status: 'fragile-exploitable',
        limitingConstraint: 'médiation',
        windowSummary: 'fenêtre fragile mais exploitable: médiation limite encore le suivi',
        nextDecision: 'réévaluer la médiation ou le support local au prochain tour',
      },
      residualCultureWindowClosureThreat: {
        status: 'manageable',
        visibleConstraint: 'fatigue de médiation',
        threatSummary: 'fatigue de médiation peut refermer la fenêtre si le suivi tarde',
        recommendedGesture: 'borner la médiation avant le prochain suivi',
      },
      residualCultureSupportAllocationChoice: {
        recommendation: 'reinforce-now',
        dominantConstraint: 'fatigue de médiation',
        riskAvoided: 'évite de perdre une fenêtre encore exploitable sous fatigue de médiation',
        summary: 'renforcer maintenant: la fenêtre reste utile mais socialement coûteuse',
      },
      residualCulturePostAllocationStability: {
        status: 'useful-lull',
        dominantFactor: 'fatigue de médiation',
        stabilitySummary: 'accalmie utile: renforcer réduit le risque lié à fatigue de médiation',
        nextMicroDecision: null,
      },
      residualCultureReevaluationTrigger: {
        status: 'watch-signal',
        visibleTrigger: 'fatigue de médiation',
        triggerSummary: 'surveiller le signal: fatigue de médiation peut écourter l’accalmie',
        microDecision: 'revoir le support si fatigue de médiation remonte',
      },
      residualCultureReevaluationDelayCost: {
        status: 'manageable-cost',
        visibleConstraint: 'fatigue de médiation',
        delayConsequence: 'coût social gérable: fatigue de médiation peut réduire l’accalmie',
        microDecision: 'revoir le support si fatigue de médiation remonte',
      },
      residualCultureMinimalDelayedSupport: {
        status: 'light-support-enough',
        visibleConstraint: 'fatigue de médiation',
        recommendedSupport: 'support léger suffisant sur fatigue de médiation',
        microDecision: 'revoir le support si fatigue de médiation remonte',
      },
      residualCultureReliabilityUpgradeCondition: {
        status: 'upgrade-available',
        firstCondition: 'confirmer que fatigue de médiation reste borné après le support léger',
        guidance: 'fiabiliser: garder fatigue de médiation sous contrôle au prochain suivi',
        microDecision: 'revoir le support si fatigue de médiation remonte',
      },
      residualCultureStabilityWatchWindow: {
        status: 'short-watch',
        watchFactor: 'tension locale',
        watchWindow: 'surveillance courte recommandée: confirmer le prochain signal culturel',
        followUpAction: 'revoir le support si fatigue de médiation remonte',
      },
      residualCultureSupportRedeploymentCue: {
        status: 'careful-reduction',
        blockingFactor: 'tension locale',
        redeploymentCue: 'réduction prudente possible après le prochain signal confirmé',
        microAction: 'revoir le support si fatigue de médiation remonte',
      },
      residualCulturePrematureRedeploymentRisk: {
        status: 'watch-before-redeploy',
        culturalCost: 'coût possible: tension locale peut réduire la stabilité culturelle',
        alternative: 'attendre le signal de stabilité avant redéploiement complet',
      },
    },
    summary: 'amélioration partielle: isolement du support baisse, médiation à prévoir',
  });
  assert.deepEqual(stable.supportBundles, undefined);
  assert.deepEqual(stable.recommendedFirstBundle, undefined);
  assert.deepEqual(stable.riskChangePreview, {
    status: 'neutral',
    currentRisk: 0,
    expectedRisk: 0,
    delta: 0,
    monitoredRisk: 'aucun support recommandé',
    tradeoffToWatch: 'aucun',
    reason: 'aucun bundle recommandé: stabilité suffisante',
  });
  assert.deepEqual(stable.postBundleCumulativeRisk, {
    status: 'neutral',
    before: {
      score: 0,
      level: 'low',
    },
    after: {
      score: 0,
      level: 'low',
    },
    reducedRisk: 'aucun support recommandé',
    remainingPriority: 'aucun',
    fragileRegionId: null,
    fragileCultureId: null,
    nextAttention: 'aucune attention supplémentaire recommandée',
  });
  assert.equal(stable.nextSafeSupportBundle, null);
  assert.deepEqual(stable.cultureStabilizationSummary, {
    status: 'complete',
    beforeSecondBundle: {
      score: 0,
      level: 'low',
    },
    afterSecondBundle: {
      score: 0,
      level: 'low',
    },
    stableRegionIds: ['stable-market'],
    fragileRegionIds: [],
    mediationRegionIds: [],
    dependencies: [],
    incompatibilities: [],
    stabilizationDebtSummary: {
      status: 'neutral',
      count: 0,
      debts: [],
      dependencyRetirementRanking: [],
      recommendedFirstRetirement: null,
      topRetirementReadiness: {
        status: 'ready',
        blockers: [],
        nextSmallStep: 'aucune dépendance prioritaire à retirer',
      },
      topRetirementRecoveryPreview: {
        status: 'neutral',
        recoveryType: 'none',
        expectedRecovery: 'aucune récupération culturelle prioritaire',
        immediacy: 'immediate',
        closesLoop: 'aucune dépendance bloquante à lever',
      },
      nextDependencyRetirementPath: {
        status: 'none-safe',
        nextRetirement: null,
        recommendedRecoveryPath: 'aucune récupération culturelle prioritaire',
        mainRemainingBlocker: null,
        reason: 'aucune dette culturelle restante à convertir en retrait suivant',
      },
      residualRiskAfterNextRetirement: {
        status: 'complete',
        principalResidualFragility: null,
        nextActionAfterRetirement: 'aucune action culturelle supplémentaire prioritaire',
        reason: 'aucune dette résiduelle après stabilisation',
      },
      residualCultureRiskNextAction: {
        status: 'none-safe',
        actionType: 'none',
        recommendedAction: 'aucune action secondaire sûre requise',
        reason: 'aucune dette résiduelle après stabilisation',
      },
      residualCultureActionPayoff: {
        status: 'complete',
        expectedEffect: 'stabilisation complète: aucune fragilité résiduelle à traiter',
        remainingFragility: null,
        nextDecision: null,
      },
      residualCultureFollowUpWindow: {
        status: 'stable',
        limitingConstraint: 'aucune contrainte résiduelle',
        windowSummary: 'fenêtre stable: le payoff permet d’enchaîner sans nouvelle dette visible',
        nextDecision: 'enchaîner le suivi culturel léger au prochain tour',
      },
      residualCultureWindowClosureThreat: {
        status: 'none',
        visibleConstraint: 'aucune contrainte visible',
        threatSummary: 'aucune pression notable sur la fenêtre de suivi',
        recommendedGesture: null,
      },
      residualCultureSupportAllocationChoice: {
        recommendation: 'wait-neutral',
        dominantConstraint: 'aucune contrainte visible',
        riskAvoided: 'aucun coût notable évité par un renfort immédiat',
        summary: 'attendre sans coût notable: la fenêtre ne réclame pas de support dédié',
      },
      residualCulturePostAllocationStability: {
        status: 'durable',
        dominantFactor: 'aucune contrainte visible',
        stabilitySummary: 'stabilité durable: aucun support immédiat ne change la fenêtre visible',
        nextMicroDecision: null,
      },
      residualCultureReevaluationTrigger: {
        status: 'none-soon',
        visibleTrigger: 'aucune contrainte visible',
        triggerSummary: 'pas de réévaluation proche: stabilité durable visible',
        microDecision: null,
      },
      residualCultureReevaluationDelayCost: {
        status: 'neutral-wait',
        visibleConstraint: 'aucune contrainte visible',
        delayConsequence: 'attente neutre: aucun coût social visible à court terme',
        microDecision: null,
      },
      residualCultureMinimalDelayedSupport: {
        status: 'none-needed',
        visibleConstraint: 'aucune contrainte visible',
        recommendedSupport: 'aucun support minimal requis',
        microDecision: null,
      },
      residualCultureReliabilityUpgradeCondition: {
        status: 'already-reliable',
        firstCondition: 'aucune condition supplémentaire visible',
        guidance: 'stabilité déjà fiable après le soutien minimal',
        microDecision: null,
      },
      residualCultureStabilityWatchWindow: {
        status: 'durable-now',
        watchFactor: 'soutien restant',
        watchWindow: 'stabilité déjà durable: surveillance passive suffisante',
        followUpAction: null,
      },
      residualCultureSupportRedeploymentCue: {
        status: 'safe-redeploy',
        blockingFactor: 'soutien résiduel faible',
        redeploymentCue: 'redéploiement sûr: la stabilité tient sans soutien dédié',
        microAction: null,
      },
      residualCulturePrematureRedeploymentRisk: {
        status: 'safe',
        culturalCost: 'aucun coût culturel attendu: redéploiement acceptable',
        alternative: 'redéployer si la stabilité reste confirmée',
      },
    },
    summary: 'stabilisation complète: aucun second soutien requis',
  });
});

test('buildCultureMapOverlay can summarize overlapping culture clusters with discovery and event pins', () => {
  const overlay = buildCultureMapOverlay(
    {
      cultures: [
        {
          id: 'culture-harbor',
          name: 'Harbor Compact',
          archetype: 'maritime',
          primaryLanguage: 'harbor-cant',
          valueIds: ['trade'],
          traditionIds: ['pilots'],
          openness: 70,
          cohesion: 62,
          researchDrive: 76,
        },
        {
          id: 'culture-delta',
          name: 'Delta Scribes',
          archetype: 'scholarly',
          primaryLanguage: 'delta-script',
          valueIds: ['archives'],
          traditionIds: ['flood-books'],
          openness: 64,
          cohesion: 58,
          researchDrive: 72,
        },
      ],
      researchStates: [
        {
          id: 'research-harbor',
          cultureId: 'culture-harbor',
          topicId: 'tidal-ledgers',
          status: 'active',
          progress: 50,
          discoveredConceptIds: ['tidal-ledgers'],
        },
        {
          id: 'research-delta',
          cultureId: 'culture-delta',
          topicId: 'flood-archives',
          status: 'completed',
          progress: 100,
          completedAt: '2026-04-19T00:00:00.000Z',
          discoveredConceptIds: ['flood-archives'],
        },
      ],
      historicalEvents: [
        {
          id: 'event-harbor-forum',
          title: 'Harbor Forum',
          category: 'knowledge',
          summary: 'Pilots compare flood archive routes.',
          era: 'map-play',
          importance: 4,
          triggeredAt: '2026-04-20T00:00:00.000Z',
          affectedCultureIds: ['culture-harbor'],
          discoveryIds: ['tidal-ledgers'],
        },
      ],
    },
    {
      clusterSummaries: true,
      regionIdsByCulture: {
        'culture-harbor': ['shared-bay'],
        'culture-delta': ['shared-bay'],
      },
    },
  );

  assert.equal(overlay.length, 2);
  assert.deepEqual(overlay.map((entry) => entry.clusterSummary?.label), [
    '2 cultures · 2 découvertes',
    '2 cultures · 2 découvertes',
  ]);
  assert.deepEqual(overlay[0].clusterSummary, {
    clusterId: 'shared-bay:culture-cluster',
    regionId: 'shared-bay',
    cultureIds: ['culture-delta', 'culture-harbor'],
    cultureNames: ['Delta Scribes', 'Harbor Compact'],
    cultureCount: 2,
    discoveryIds: ['flood-archives', 'tidal-ledgers'],
    discoveryCount: 2,
    eventCount: 1,
    pins: [
      {
        pinId: 'shared-bay:culture-harbor:event:event-harbor-forum',
        kind: 'event',
        name: 'Harbor Forum',
        type: 'knowledge',
        regionId: 'shared-bay',
        cultureId: 'culture-harbor',
        cultureName: 'Harbor Compact',
        importance: 4,
      },
      {
        pinId: 'shared-bay:culture-delta:discovery:flood-archives',
        kind: 'discovery',
        name: 'flood-archives',
        type: 'Découverte',
        regionId: 'shared-bay',
        cultureId: 'culture-delta',
        cultureName: 'Delta Scribes',
        importance: null,
      },
      {
        pinId: 'shared-bay:culture-harbor:discovery:tidal-ledgers',
        kind: 'discovery',
        name: 'tidal-ledgers',
        type: 'Découverte',
        regionId: 'shared-bay',
        cultureId: 'culture-harbor',
        cultureName: 'Harbor Compact',
        importance: null,
      },
    ],
    label: '2 cultures · 2 découvertes',
    summary: 'Delta Scribes, Harbor Compact',
  });
});

test('buildCultureMapOverlay exposes atlas story layers and deterministic marker collisions', () => {
  const overlay = buildCultureMapOverlay(
    {
      cultures: [
        {
          id: 'culture-harbor',
          name: 'Harbor Compact',
          archetype: 'maritime',
          primaryLanguage: 'harbor-cant',
          valueIds: ['pilots'],
          traditionIds: ['forums'],
          openness: 80,
          cohesion: 58,
          researchDrive: 74,
        },
        {
          id: 'culture-delta',
          name: 'Delta Scribes',
          archetype: 'riverine',
          primaryLanguage: 'delta-script',
          valueIds: ['archives'],
          traditionIds: ['flood-oaths'],
          openness: 52,
          cohesion: 62,
          researchDrive: 64,
        },
      ],
      researchStates: [
        {
          id: 'research-harbor-ledgers',
          cultureId: 'culture-harbor',
          topicId: 'harbor-ledgers',
          status: 'active',
          progress: 50,
          discoveredConceptIds: ['tidal-ledgers'],
        },
        {
          id: 'research-delta-archives',
          cultureId: 'culture-delta',
          topicId: 'delta-archives',
          status: 'completed',
          progress: 100,
          completedAt: '2026-04-20T00:00:00.000Z',
          discoveredConceptIds: ['flood-archives'],
        },
      ],
      historicalEvents: [
        {
          id: 'event-harbor-forum',
          title: 'Harbor Forum',
          category: 'knowledge',
          summary: 'Pilots compare archive routes.',
          era: 'map-play',
          importance: 4,
          triggeredAt: '2026-04-20T00:00:00.000Z',
          affectedCultureIds: ['culture-harbor'],
          discoveryIds: ['tidal-ledgers'],
        },
      ],
    },
    {
      atlasStoryLayers: true,
      regionIdsByCulture: {
        'culture-harbor': ['shared-bay'],
        'culture-delta': ['shared-bay'],
      },
    },
  );

  assert.deepEqual(overlay.map((entry) => entry.markerCollisionCluster.priorityCultureId), [
    'culture-harbor',
    'culture-harbor',
  ]);
  assert.deepEqual(overlay[0].markerCollisionCluster, {
    clusterId: 'shared-bay:marker-collision',
    regionId: 'shared-bay',
    markerCount: 2,
    overflowCount: 1,
    strategy: 'stack-by-priority',
    priorityMarkerId: 'shared-bay:culture-harbor',
    priorityCultureId: 'culture-harbor',
    priorityReason: '1 événement',
    narrativePriority: {
      state: 'opportunity',
      label: 'opportunité',
      microAction: 'explorer',
      source: 'Harbor Forum',
      reason: 'Harbor Forum ouvre une action culturelle prioritaire.',
      priorityScore: 85,
      eventCount: 1,
      discoveryCount: 2,
      eventMarkers: [
        {
          eventId: 'event-harbor-forum',
          title: 'Harbor Forum',
          cultureId: 'culture-harbor',
          cultureName: 'Harbor Compact',
          importance: 4,
          discoveryIds: ['tidal-ledgers'],
          triggeredAt: '2026-04-20T00:00:00.000Z',
          priorityRank: 0,
          eventMarkerId: 'shared-bay:culture-harbor:event:event-harbor-forum',
        },
      ],
    },
    stack: [
      {
        markerId: 'shared-bay:culture-harbor',
        cultureId: 'culture-harbor',
        cultureName: 'Harbor Compact',
        priorityScore: 67,
        priorityReason: '1 événement',
        layerKinds: ['influence', 'discoveries', 'timeline'],
      },
      {
        markerId: 'shared-bay:culture-delta',
        cultureId: 'culture-delta',
        cultureName: 'Delta Scribes',
        priorityScore: 42,
        priorityReason: '1 découverte',
        layerKinds: ['influence', 'discoveries'],
      },
    ],
  });
  assert.deepEqual(overlay[0].atlasStoryLayers.map((layer) => [layer.kind, layer.markerCount, layer.enabled]), [
    ['influence', 2, true],
    ['discoveries', 2, true],
    ['timeline', 1, true],
  ]);
  assert.equal(overlay[0].narrativePriority.microAction, 'explorer');
  assert.match(overlay[0].narrativeSummary, /opportunité: Harbor Forum/);
  assert.deepEqual(overlay[0].atlasStoryLayers[2].markers, [
    {
      markerId: 'shared-bay:culture-harbor:timeline',
      regionId: 'shared-bay',
      cultureId: 'culture-harbor',
      cultureName: 'Harbor Compact',
      rank: 0,
      enabled: true,
      reason: "Harbor Compact compte maintenant: Harbor Forum donne un repère d'action immédiat.",
    },
  ]);
});

test('buildCultureMapOverlay assigns tension and completed narrative priority states', () => {
  const tensionOverlay = buildCultureMapOverlay(
    {
      cultures: [
        {
          id: 'culture-east',
          name: 'East Chorus',
          archetype: 'urban',
          primaryLanguage: 'east-song',
          valueIds: ['markets'],
          traditionIds: ['choirs'],
          openness: 55,
          cohesion: 55,
          researchDrive: 55,
        },
        {
          id: 'culture-west',
          name: 'West Loom',
          archetype: 'guild',
          primaryLanguage: 'west-thread',
          valueIds: ['craft'],
          traditionIds: ['looms'],
          openness: 54,
          cohesion: 56,
          researchDrive: 55,
        },
      ],
      researchStates: [
        {
          id: 'research-east-song',
          cultureId: 'culture-east',
          topicId: 'east-song',
          status: 'completed',
          progress: 100,
          completedAt: '2026-04-20T00:00:00.000Z',
          discoveredConceptIds: ['market-rhythm'],
        },
        {
          id: 'research-west-loom',
          cultureId: 'culture-west',
          topicId: 'west-loom',
          status: 'completed',
          progress: 100,
          completedAt: '2026-04-20T00:00:00.000Z',
          discoveredConceptIds: ['loom-code'],
        },
      ],
      historicalEvents: [],
    },
    {
      atlasStoryLayers: true,
      regionIdsByCulture: {
        'culture-east': ['shared-market'],
        'culture-west': ['shared-market'],
      },
    },
  );

  assert.equal(tensionOverlay[0].narrativePriority.state, 'tension');
  assert.equal(tensionOverlay[0].narrativePriority.microAction, 'apaiser');
  assert.match(tensionOverlay[0].narrativeSummary, /tension/);

  const completedOverlay = buildCultureMapOverlay(
    {
      cultures: [
        {
          id: 'culture-archive',
          name: 'Archive Circle',
          archetype: 'scholarly',
          primaryLanguage: 'archive-hand',
          valueIds: ['memory'],
          traditionIds: ['catalogues'],
          openness: 50,
          cohesion: 70,
          researchDrive: 45,
        },
      ],
      researchStates: [
        {
          id: 'research-catalogue',
          cultureId: 'culture-archive',
          topicId: 'catalogue',
          status: 'completed',
          progress: 100,
          completedAt: '2026-04-20T00:00:00.000Z',
          discoveredConceptIds: ['sealed-index'],
        },
      ],
      historicalEvents: [],
    },
    {
      atlasStoryLayers: true,
      regionIdsByCulture: { 'culture-archive': ['quiet-stacks'] },
    },
  );

  assert.equal(completedOverlay[0].narrativePriority.state, 'completed');
  assert.equal(completedOverlay[0].narrativePriority.label, 'suivi terminé');
  assert.equal(completedOverlay[0].narrativePriority.microAction, 'consolider');
});

test('buildResidualCultureActionPayoff covers complete, partial, and insufficient outcomes', () => {
  assert.deepEqual(
    buildResidualCultureActionPayoff(
      {
        status: 'complete',
        principalResidualFragility: null,
        reason: 'le retrait suivant absorbe la dernière dette culturelle visible',
      },
      {
        status: 'none-safe',
        actionType: 'none',
        recommendedAction: 'aucune action secondaire sûre requise',
        reason: 'le retrait suivant absorbe la dernière dette culturelle visible',
      },
    ),
    {
      status: 'complete',
      expectedEffect: 'stabilisation complète: aucune fragilité résiduelle à traiter',
      remainingFragility: null,
      nextDecision: null,
    },
  );

  assert.deepEqual(
    buildResidualCultureActionPayoff(
      {
        status: 'partial',
        principalResidualFragility: {
          type: 'regional-mediation',
          cause: 'risque restant: isolement du support',
          urgency: 'medium',
        },
        reason: 'stabilisation partielle: surveiller risque restant: isolement du support',
      },
      {
        status: 'optional',
        actionType: 'mediation',
        recommendedAction: 'ouvrir une médiation locale courte après le retrait suivant',
        reason: 'bon second pas: risque restant: isolement du support reste medium',
      },
    ),
    {
      status: 'partial',
      expectedEffect: 'réduction partielle attendue: risque restant: isolement du support',
      remainingFragility: {
        type: 'regional-mediation',
        cause: 'risque restant: isolement du support',
        urgency: 'medium',
      },
      nextDecision: 'réévaluer la médiation ou le support local au prochain tour',
    },
  );

  assert.deepEqual(
    buildResidualCultureActionPayoff(
      {
        status: 'important-fragility',
        principalResidualFragility: {
          type: 'missing-support',
          cause: 'aucun second soutien sûr disponible après le premier bundle',
          urgency: 'high',
        },
        reason: 'aucun retrait suivant sûr avant de confirmer la récupération prioritaire',
      },
      {
        status: 'recommended',
        actionType: 'local-support',
        recommendedAction: 'préparer un support local compatible avant nouvelle réduction de dette',
        reason: 'bon second pas: aucun second soutien sûr disponible après le premier bundle reste high',
      },
    ),
    {
      status: 'insufficient',
      expectedEffect: 'achat de temps: aucun second soutien sûr disponible après le premier bundle reste trop urgente',
      remainingFragility: {
        type: 'missing-support',
        cause: 'aucun second soutien sûr disponible après le premier bundle',
        urgency: 'high',
      },
      nextDecision: 'choisir entre support local immédiat ou pause de timing prolongée',
    },
  );
});

test('buildResidualCultureFollowUpWindow covers stable, fragile exploitable, and too-short windows', () => {
  assert.deepEqual(
    buildResidualCultureFollowUpWindow(
      {
        status: 'complete',
        expectedEffect: 'stabilisation complète: aucune fragilité résiduelle à traiter',
        remainingFragility: null,
        nextDecision: null,
      },
      { status: 'none-safe', actionType: 'none' },
    ),
    {
      status: 'stable',
      limitingConstraint: 'aucune contrainte résiduelle',
      windowSummary: 'fenêtre stable: le payoff permet d’enchaîner sans nouvelle dette visible',
      nextDecision: 'enchaîner le suivi culturel léger au prochain tour',
    },
  );

  assert.deepEqual(
    buildResidualCultureFollowUpWindow(
      {
        status: 'partial',
        expectedEffect: 'réduction partielle attendue: risque restant: isolement du support',
        remainingFragility: {
          type: 'regional-mediation',
          cause: 'risque restant: isolement du support',
          urgency: 'medium',
        },
        nextDecision: 'réévaluer la médiation ou le support local au prochain tour',
      },
      { status: 'optional', actionType: 'mediation' },
    ),
    {
      status: 'fragile-exploitable',
      limitingConstraint: 'médiation',
      windowSummary: 'fenêtre fragile mais exploitable: médiation limite encore le suivi',
      nextDecision: 'réévaluer la médiation ou le support local au prochain tour',
    },
  );

  assert.deepEqual(
    buildResidualCultureFollowUpWindow(
      {
        status: 'insufficient',
        expectedEffect: 'achat de temps: aucun second soutien sûr disponible après le premier bundle reste trop urgente',
        remainingFragility: {
          type: 'missing-support',
          cause: 'aucun second soutien sûr disponible après le premier bundle',
          urgency: 'high',
        },
        nextDecision: 'choisir entre support local immédiat ou pause de timing prolongée',
      },
      { status: 'recommended', actionType: 'local-support' },
    ),
    {
      status: 'too-short',
      limitingConstraint: 'support local',
      windowSummary: 'fenêtre trop courte: support local bloque un enchaînement sûr',
      nextDecision: null,
    },
  );
});

test('buildResidualCultureWindowClosureThreat covers absent, manageable, and likely closure pressure', () => {
  assert.deepEqual(
    buildResidualCultureWindowClosureThreat({
      status: 'stable',
      limitingConstraint: 'aucune contrainte résiduelle',
      windowSummary: 'fenêtre stable: le payoff permet d’enchaîner sans nouvelle dette visible',
      nextDecision: 'enchaîner le suivi culturel léger au prochain tour',
    }),
    {
      status: 'none',
      visibleConstraint: 'aucune contrainte visible',
      threatSummary: 'aucune pression notable sur la fenêtre de suivi',
      recommendedGesture: null,
    },
  );

  assert.deepEqual(
    buildResidualCultureWindowClosureThreat({
      status: 'fragile-exploitable',
      limitingConstraint: 'médiation',
      windowSummary: 'fenêtre fragile mais exploitable: médiation limite encore le suivi',
      nextDecision: 'réévaluer la médiation ou le support local au prochain tour',
    }),
    {
      status: 'manageable',
      visibleConstraint: 'fatigue de médiation',
      threatSummary: 'fatigue de médiation peut refermer la fenêtre si le suivi tarde',
      recommendedGesture: 'borner la médiation avant le prochain suivi',
    },
  );

  assert.deepEqual(
    buildResidualCultureWindowClosureThreat({
      status: 'too-short',
      limitingConstraint: 'support local',
      windowSummary: 'fenêtre trop courte: support local bloque un enchaînement sûr',
      nextDecision: null,
    }),
    {
      status: 'likely-close',
      visibleConstraint: 'support local',
      threatSummary: 'support local refermera probablement la fenêtre avant un suivi sûr',
      recommendedGesture: 'sécuriser un support local avant tout suivi',
    },
  );
});

test('buildResidualCultureSupportAllocationChoice compares reinforcing, keeping support, and neutral wait', () => {
  assert.deepEqual(
    buildResidualCultureSupportAllocationChoice(
      {
        status: 'manageable',
        visibleConstraint: 'fatigue de médiation',
        threatSummary: 'fatigue de médiation peut refermer la fenêtre si le suivi tarde',
        recommendedGesture: 'borner la médiation avant le prochain suivi',
      },
      { remainingPriority: 'isolement du support' },
    ),
    {
      recommendation: 'reinforce-now',
      dominantConstraint: 'fatigue de médiation',
      riskAvoided: 'évite de perdre une fenêtre encore exploitable sous fatigue de médiation',
      summary: 'renforcer maintenant: la fenêtre reste utile mais socialement coûteuse',
    },
  );

  assert.deepEqual(
    buildResidualCultureSupportAllocationChoice(
      {
        status: 'none',
        visibleConstraint: 'aucune contrainte visible',
        threatSummary: 'aucune pression notable sur la fenêtre de suivi',
        recommendedGesture: null,
      },
      { remainingPriority: 'pression frontalière' },
    ),
    {
      recommendation: 'keep-support',
      dominantConstraint: 'autre foyer visible',
      riskAvoided: 'évite de détourner le support du risque pression frontalière',
      summary: 'garder le support: la fenêtre résiduelle ne subit pas de pression notable',
    },
  );

  assert.deepEqual(
    buildResidualCultureSupportAllocationChoice(
      {
        status: 'none',
        visibleConstraint: 'aucune contrainte visible',
        threatSummary: 'aucune pression notable sur la fenêtre de suivi',
        recommendedGesture: null,
      },
      { remainingPriority: 'aucun' },
    ),
    {
      recommendation: 'wait-neutral',
      dominantConstraint: 'aucune contrainte visible',
      riskAvoided: 'aucun coût notable évité par un renfort immédiat',
      summary: 'attendre sans coût notable: la fenêtre ne réclame pas de support dédié',
    },
  );
});

test('buildResidualCulturePostAllocationStability covers durable, useful lull, and fragile outcomes', () => {
  assert.deepEqual(
    buildResidualCulturePostAllocationStability(
      {
        recommendation: 'wait-neutral',
        dominantConstraint: 'aucune contrainte visible',
        riskAvoided: 'aucun coût notable évité par un renfort immédiat',
        summary: 'attendre sans coût notable: la fenêtre ne réclame pas de support dédié',
      },
      { status: 'none', recommendedGesture: null },
    ),
    {
      status: 'durable',
      dominantFactor: 'aucune contrainte visible',
      stabilitySummary: 'stabilité durable: aucun support immédiat ne change la fenêtre visible',
      nextMicroDecision: null,
    },
  );

  assert.deepEqual(
    buildResidualCulturePostAllocationStability(
      {
        recommendation: 'keep-support',
        dominantConstraint: 'autre foyer visible',
        riskAvoided: 'évite de détourner le support du risque pression frontalière',
        summary: 'garder le support: la fenêtre résiduelle ne subit pas de pression notable',
      },
      { status: 'none', recommendedGesture: null },
    ),
    {
      status: 'useful-lull',
      dominantFactor: 'autre foyer visible',
      stabilitySummary: 'accalmie utile: le support reste disponible pour autre foyer visible',
      nextMicroDecision: null,
    },
  );

  assert.deepEqual(
    buildResidualCulturePostAllocationStability(
      {
        recommendation: 'reinforce-now',
        dominantConstraint: 'support local',
        riskAvoided: 'évite que support local ferme la fenêtre de suivi',
        summary: 'renforcer maintenant: la fenêtre reste utile mais socialement coûteuse',
      },
      {
        status: 'likely-close',
        recommendedGesture: 'sécuriser un support local avant tout suivi',
      },
    ),
    {
      status: 'fragile-after-action',
      dominantFactor: 'support local',
      stabilitySummary: 'fragile après action: support local peut encore rouvrir la dette culturelle',
      nextMicroDecision: 'sécuriser un support local avant tout suivi',
    },
  );
});

test('buildResidualCultureReevaluationTrigger covers none, watch, and urgent follow-up', () => {
  assert.deepEqual(
    buildResidualCultureReevaluationTrigger({
      status: 'durable',
      dominantFactor: 'aucune contrainte visible',
      stabilitySummary: 'stabilité durable: aucun support immédiat ne change la fenêtre visible',
      nextMicroDecision: null,
    }),
    {
      status: 'none-soon',
      visibleTrigger: 'aucune contrainte visible',
      triggerSummary: 'pas de réévaluation proche: stabilité durable visible',
      microDecision: null,
    },
  );

  assert.deepEqual(
    buildResidualCultureReevaluationTrigger({
      status: 'useful-lull',
      dominantFactor: 'fatigue de médiation',
      stabilitySummary: 'accalmie utile: renforcer réduit le risque lié à fatigue de médiation',
      nextMicroDecision: null,
    }),
    {
      status: 'watch-signal',
      visibleTrigger: 'fatigue de médiation',
      triggerSummary: 'surveiller le signal: fatigue de médiation peut écourter l’accalmie',
      microDecision: 'revoir le support si fatigue de médiation remonte',
    },
  );

  assert.deepEqual(
    buildResidualCultureReevaluationTrigger({
      status: 'fragile-after-action',
      dominantFactor: 'support local',
      stabilitySummary: 'fragile après action: support local peut encore rouvrir la dette culturelle',
      nextMicroDecision: 'sécuriser un support local avant tout suivi',
    }),
    {
      status: 'urgent',
      visibleTrigger: 'support local',
      triggerSummary: 'réévaluation urgente si support local réapparaît',
      microDecision: 'sécuriser un support local avant tout suivi',
    },
  );
});

test('buildResidualCultureReevaluationDelayCost covers neutral, manageable, and worsening delays', () => {
  assert.deepEqual(
    buildResidualCultureReevaluationDelayCost({
      status: 'none-soon',
      visibleTrigger: 'aucune contrainte visible',
      triggerSummary: 'pas de réévaluation proche: stabilité durable visible',
      microDecision: null,
    }),
    {
      status: 'neutral-wait',
      visibleConstraint: 'aucune contrainte visible',
      delayConsequence: 'attente neutre: aucun coût social visible à court terme',
      microDecision: null,
    },
  );

  assert.deepEqual(
    buildResidualCultureReevaluationDelayCost({
      status: 'watch-signal',
      visibleTrigger: 'fatigue de médiation',
      triggerSummary: 'surveiller le signal: fatigue de médiation peut écourter l’accalmie',
      microDecision: 'revoir le support si fatigue de médiation remonte',
    }),
    {
      status: 'manageable-cost',
      visibleConstraint: 'fatigue de médiation',
      delayConsequence: 'coût social gérable: fatigue de médiation peut réduire l’accalmie',
      microDecision: 'revoir le support si fatigue de médiation remonte',
    },
  );

  assert.deepEqual(
    buildResidualCultureReevaluationDelayCost({
      status: 'urgent',
      visibleTrigger: 'support local',
      triggerSummary: 'réévaluation urgente si support local réapparaît',
      microDecision: 'sécuriser un support local avant tout suivi',
    }),
    {
      status: 'worsening-fragility',
      visibleConstraint: 'support local',
      delayConsequence: 'fragilité qui s’aggrave: support local peut rouvrir la dette avant correction',
      microDecision: 'sécuriser un support local avant tout suivi',
    },
  );
});

test('buildResidualCultureMinimalDelayedSupport covers none, light, and immediate support', () => {
  assert.deepEqual(
    buildResidualCultureMinimalDelayedSupport({
      status: 'neutral-wait',
      visibleConstraint: 'aucune contrainte visible',
      delayConsequence: 'attente neutre: aucun coût social visible à court terme',
      microDecision: null,
    }),
    {
      status: 'none-needed',
      visibleConstraint: 'aucune contrainte visible',
      recommendedSupport: 'aucun support minimal requis',
      microDecision: null,
    },
  );

  assert.deepEqual(
    buildResidualCultureMinimalDelayedSupport({
      status: 'manageable-cost',
      visibleConstraint: 'fatigue de médiation',
      delayConsequence: 'coût social gérable: fatigue de médiation peut réduire l’accalmie',
      microDecision: 'revoir le support si fatigue de médiation remonte',
    }),
    {
      status: 'light-support-enough',
      visibleConstraint: 'fatigue de médiation',
      recommendedSupport: 'support léger suffisant sur fatigue de médiation',
      microDecision: 'revoir le support si fatigue de médiation remonte',
    },
  );

  assert.deepEqual(
    buildResidualCultureMinimalDelayedSupport({
      status: 'worsening-fragility',
      visibleConstraint: 'support local',
      delayConsequence: 'fragilité qui s’aggrave: support local peut rouvrir la dette avant correction',
      microDecision: 'sécuriser un support local avant tout suivi',
    }),
    {
      status: 'immediate-support-required',
      visibleConstraint: 'support local',
      recommendedSupport: 'soutien immédiat requis pour stabiliser support local',
      microDecision: 'sécuriser un support local avant tout suivi',
    },
  );
});

test('buildResidualCultureReliabilityUpgradeCondition shows first reliability upgrade condition', () => {
  assert.deepEqual(
    buildResidualCultureReliabilityUpgradeCondition({
      status: 'none-needed',
      visibleConstraint: 'aucune contrainte visible',
      recommendedSupport: 'aucun support minimal requis',
      microDecision: null,
    }),
    {
      status: 'already-reliable',
      firstCondition: 'aucune condition supplémentaire visible',
      guidance: 'stabilité déjà fiable après le soutien minimal',
      microDecision: null,
    },
  );

  assert.deepEqual(
    buildResidualCultureReliabilityUpgradeCondition({
      status: 'light-support-enough',
      visibleConstraint: 'fatigue de médiation',
      recommendedSupport: 'support léger suffisant sur fatigue de médiation',
      microDecision: 'revoir le support si fatigue de médiation remonte',
    }),
    {
      status: 'upgrade-available',
      firstCondition: 'confirmer que fatigue de médiation reste borné après le support léger',
      guidance: 'fiabiliser: garder fatigue de médiation sous contrôle au prochain suivi',
      microDecision: 'revoir le support si fatigue de médiation remonte',
    },
  );

  assert.deepEqual(
    buildResidualCultureReliabilityUpgradeCondition({
      status: 'immediate-support-required',
      visibleConstraint: 'support local',
      recommendedSupport: 'soutien immédiat requis pour stabiliser support local',
      microDecision: 'sécuriser un support local avant tout suivi',
    }),
    {
      status: 'blocked-until-support',
      firstCondition: 'appliquer le soutien immédiat sur support local',
      guidance: 'stabilité encore fragile tant que support local n’est pas stabilisé',
      microDecision: 'sécuriser un support local avant tout suivi',
    },
  );
});

test('buildResidualCultureStabilityWatchWindow covers durable, short, and extended watch', () => {
  assert.deepEqual(
    buildResidualCultureStabilityWatchWindow({
      status: 'already-reliable',
      firstCondition: 'aucune condition supplémentaire visible',
      guidance: 'stabilité déjà fiable après le soutien minimal',
      microDecision: null,
    }),
    {
      status: 'durable-now',
      watchFactor: 'soutien restant',
      watchWindow: 'stabilité déjà durable: surveillance passive suffisante',
      followUpAction: null,
    },
  );

  assert.deepEqual(
    buildResidualCultureStabilityWatchWindow({
      status: 'upgrade-available',
      firstCondition: 'confirmer que fatigue de médiation reste borné après le support léger',
      guidance: 'fiabiliser: garder fatigue de médiation sous contrôle au prochain suivi',
      microDecision: 'revoir le support si fatigue de médiation remonte',
    }),
    {
      status: 'short-watch',
      watchFactor: 'tension locale',
      watchWindow: 'surveillance courte recommandée: confirmer le prochain signal culturel',
      followUpAction: 'revoir le support si fatigue de médiation remonte',
    },
  );

  assert.deepEqual(
    buildResidualCultureStabilityWatchWindow({
      status: 'blocked-until-support',
      firstCondition: 'appliquer le soutien immédiat sur support local',
      guidance: 'stabilité encore fragile tant que support local n’est pas stabilisé',
      microDecision: 'sécuriser un support local avant tout suivi',
    }),
    {
      status: 'extended-watch',
      watchFactor: 'fragilité sociale résiduelle',
      watchWindow: 'surveillance prolongée requise: la stabilité reste conditionnelle',
      followUpAction: 'sécuriser un support local avant tout suivi',
    },
  );
});

test('buildResidualCultureSupportRedeploymentCue covers maintain, reduce, and redeploy states', () => {
  assert.deepEqual(
    buildResidualCultureSupportRedeploymentCue({
      status: 'extended-watch',
      watchFactor: 'fragilité sociale résiduelle',
      watchWindow: 'surveillance prolongée requise: la stabilité reste conditionnelle',
      followUpAction: 'sécuriser un support local avant tout suivi',
    }),
    {
      status: 'keep-support',
      blockingFactor: 'fragilité sociale voisine',
      redeploymentCue: 'soutien à maintenir: la stabilité retomberait sans consolidation',
      microAction: 'sécuriser un support local avant tout suivi',
    },
  );

  assert.deepEqual(
    buildResidualCultureSupportRedeploymentCue({
      status: 'short-watch',
      watchFactor: 'tension locale',
      watchWindow: 'surveillance courte recommandée: confirmer le prochain signal culturel',
      followUpAction: 'revoir le support si fatigue de médiation remonte',
    }),
    {
      status: 'careful-reduction',
      blockingFactor: 'tension locale',
      redeploymentCue: 'réduction prudente possible après le prochain signal confirmé',
      microAction: 'revoir le support si fatigue de médiation remonte',
    },
  );

  assert.deepEqual(
    buildResidualCultureSupportRedeploymentCue({
      status: 'durable-now',
      watchFactor: 'soutien restant',
      watchWindow: 'stabilité déjà durable: surveillance passive suffisante',
      followUpAction: null,
    }),
    {
      status: 'safe-redeploy',
      blockingFactor: 'soutien résiduel faible',
      redeploymentCue: 'redéploiement sûr: la stabilité tient sans soutien dédié',
      microAction: null,
    },
  );
});

test('buildResidualCulturePrematureRedeploymentRisk covers premature and safe redeployment', () => {
  assert.deepEqual(
    buildResidualCulturePrematureRedeploymentRisk({
      status: 'keep-support',
      blockingFactor: 'fragilité sociale voisine',
      redeploymentCue: 'soutien à maintenir: la stabilité retomberait sans consolidation',
      microAction: 'sécuriser un support local avant tout suivi',
    }),
    {
      status: 'premature',
      culturalCost: 'coût culturel probable: fragilité sociale voisine peut faire retomber la stabilité',
      alternative: 'attendre la stabilité avant de redéployer le soutien',
    },
  );

  assert.deepEqual(
    buildResidualCulturePrematureRedeploymentRisk({
      status: 'careful-reduction',
      blockingFactor: 'tension locale',
      redeploymentCue: 'réduction prudente possible après le prochain signal confirmé',
      microAction: 'revoir le support si fatigue de médiation remonte',
    }),
    {
      status: 'watch-before-redeploy',
      culturalCost: 'coût possible: tension locale peut réduire la stabilité culturelle',
      alternative: 'attendre le signal de stabilité avant redéploiement complet',
    },
  );

  assert.deepEqual(
    buildResidualCulturePrematureRedeploymentRisk({
      status: 'safe-redeploy',
      blockingFactor: 'soutien résiduel faible',
      redeploymentCue: 'redéploiement sûr: la stabilité tient sans soutien dédié',
      microAction: null,
    }),
    {
      status: 'safe',
      culturalCost: 'aucun coût culturel attendu: redéploiement acceptable',
      alternative: 'redéployer si la stabilité reste confirmée',
    },
  );
});

test('buildCultureMapOverlay rejects invalid inputs', () => {
  assert.throws(() => buildCultureMapOverlay(null), /payload must be an object/);
  assert.throws(
    () => buildCultureMapOverlay({ cultures: null, researchStates: [], historicalEvents: [] }),
    /payload\.cultures must be an array/,
  );
  assert.throws(
    () => buildCultureMapOverlay({ cultures: [null], researchStates: [], historicalEvents: [] }),
    /Culture instances or plain objects/,
  );
  assert.throws(
    () => buildCultureMapOverlay({ cultures: [], researchStates: [null], historicalEvents: [] }),
    /ResearchState instances or plain objects/,
  );
  assert.throws(
    () => buildCultureMapOverlay({ cultures: [], researchStates: [], historicalEvents: [] }, { regionIdsByCulture: [] }),
    /regionIdsByCulture must be an object/,
  );
});
