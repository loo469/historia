function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

const TONE_RANK = Object.freeze({ high: 3, medium: 2, low: 1 });

function getRouteTone(route, localTension) {
  if (!route.active || route.riskLevel >= 70 || localTension === 'high') {
    return 'high';
  }

  if (route.riskLevel >= 55 || route.totalCapacity >= 9 || localTension === 'medium') {
    return 'medium';
  }

  return 'low';
}

function getMainResource(route, resourceLabelById) {
  const resource = (route.resources ?? [])
    .slice()
    .sort((left, right) => right.capacity - left.capacity || left.resourceId.localeCompare(right.resourceId))[0] ?? null;

  if (!resource) {
    return { resourceId: 'reserve', label: 'capacité réservée', capacity: 0 };
  }

  return {
    ...resource,
    label: resourceLabelById[resource.resourceId] ?? resource.resourceId,
  };
}

function getRouteCause(route, localCity, localTension, mainResource) {
  if (!route.active) {
    return {
      label: 'route inactive',
      detail: `${route.routeName}: route interrompue vers ${localCity.cityName}, ${mainResource.label} doit attendre une réparation.`,
    };
  }

  if (route.riskLevel >= 70) {
    return {
      label: 'risque élevé',
      detail: `${route.routeName}: risque ${route.riskLevel} autour de ${localCity.cityName}, escorte requise pour sécuriser ${mainResource.label}.`,
    };
  }

  if (localTension === 'high') {
    return {
      label: 'stock critique',
      detail: `${localCity.cityName}: stock critique, ${route.routeName} doit prioriser ${mainResource.label}.`,
    };
  }

  if (route.totalCapacity >= 9) {
    return {
      label: 'capacité insuffisante',
      detail: `${route.routeName}: capacité ${route.totalCapacity} saturée, relais nécessaire avant surcharge de ${localCity.cityName}.`,
    };
  }

  if (route.riskLevel >= 55) {
    return {
      label: 'risque élevé',
      detail: `${route.routeName}: risque ${route.riskLevel} sur ${mainResource.label}, convoi à sécuriser.`,
    };
  }

  if (localTension === 'medium') {
    return {
      label: 'stock sous tension',
      detail: `${localCity.cityName}: stock sous tension, ${route.routeName} reste à surveiller.`,
    };
  }

  return {
    label: 'logistique stable',
    detail: `${route.routeName}: logistique stable vers ${localCity.cityName}, ${mainResource.label} couvert.`,
  };
}


function getNeighborContexts(route, localCity, cities, routes, tensionByCityId) {
  const cityById = new Map(cities.map((city) => [city.cityId, city]));
  const directNeighbors = route.cityIds
    .filter((cityId) => cityId !== localCity.cityId)
    .map((cityId) => ({ city: cityById.get(cityId), route }))
    .filter((context) => context.city);
  const hubNeighbors = routes
    .filter((candidate) => candidate.routeId !== route.routeId && candidate.cityIds.includes(localCity.cityId))
    .map((candidate) => {
      const neighborCityId = candidate.cityIds.find((cityId) => cityId !== localCity.cityId);
      return { city: cityById.get(neighborCityId), route: candidate };
    })
    .filter((context) => context.city);

  return [...directNeighbors, ...hubNeighbors]
    .map((context) => ({
      ...context,
      tension: tensionByCityId[context.city.cityId] ?? 'low',
      score: (context.route.riskLevel ?? 0) + (context.route.totalCapacity ?? 0) + (tensionByCityId[context.city.cityId] === 'high' ? 20 : tensionByCityId[context.city.cityId] === 'medium' ? 10 : 0),
    }))
    .sort((left, right) => right.score - left.score || left.city.cityName.localeCompare(right.city.cityName))
    .slice(0, 2);
}

function getNeighborEffect(choiceId, route, localCity, neighbor, mainResource) {
  const routeName = neighbor.route.routeName;
  const cityName = neighbor.city.cityName;

  if (choiceId === 'reroute') {
    const displaced = route.totalCapacity >= 9 || neighbor.route.totalCapacity >= 9;
    return {
      target: cityName,
      route: routeName,
      tone: displaced ? 'medium' : 'low',
      label: displaced ? 'congestion déplacée' : 'hub soulagé',
      detail: displaced
        ? `${cityName} peut récupérer une partie du trafic de ${localCity.cityName}; surveiller ${routeName}.`
        : `${routeName} partage mieux ${mainResource.label} et soulage le hub proche.`,
    };
  }

  if (choiceId === 'repair') {
    const fragile = !neighbor.route.active || neighbor.route.riskLevel >= 55;
    return {
      target: cityName,
      route: routeName,
      tone: fragile ? 'medium' : 'low',
      label: fragile ? 'route toujours fragile' : 'axe stabilisé',
      detail: fragile
        ? `${routeName} reste fragile près de ${cityName}; la réparation aide surtout ${localCity.cityName}.`
        : `${routeName} profite de l'axe réparé sans nouvelle surcharge visible.`,
    };
  }

  if (choiceId === 'stockpile') {
    const strained = neighbor.tension !== 'low';
    return {
      target: cityName,
      route: routeName,
      tone: strained ? 'medium' : 'low',
      label: 'stockpile consommé',
      detail: strained
        ? `${cityName} reste sous tension: le tampon protège ${localCity.cityName} mais ne diffuse pas assez.`
        : `${cityName} garde son flux; le stockpile absorbe surtout le choc local.`,
    };
  }

  const improvesNetwork = route.riskLevel >= 55 || route.totalCapacity >= 9 || neighbor.tension !== 'low';
  return {
    target: cityName,
    route: routeName,
    tone: improvesNetwork ? 'medium' : 'low',
    label: improvesNetwork ? 'hub priorisé' : 'effet réseau limité',
    detail: improvesNetwork
      ? `${cityName} bénéficie de la priorité sur ${mainResource.label}, mais ${routeName} reste à suivre.`
      : `${cityName} reçoit peu d'effet: correction surtout administrative pour ${localCity.cityName}.`,
  };
}



function inferRecoveryBottleneck(choice, route, localCity, localTension) {
  const neighborBottleneck = choice.neighborEffects.find((effect) => effect.tone !== 'low') ?? null;

  if (!route.active) {
    return {
      type: 'damage',
      label: 'dégâts route',
      detail: `${route.routeName} reste interrompue: réparation nécessaire avant gain visible.`,
      tone: 'high',
    };
  }

  if (route.totalCapacity >= 9) {
    return {
      type: 'capacity',
      label: 'capacité saturée',
      detail: `${route.routeName} porte ${route.totalCapacity} charges: le débit limite la récupération.`,
      tone: 'high',
    };
  }

  if (localTension === 'high') {
    return {
      type: 'unrest',
      label: 'stock critique',
      detail: `${localCity.cityName} absorbe le stock disponible avant que le réseau se normalise.`,
      tone: 'high',
    };
  }

  if (route.riskLevel >= 70) {
    return {
      type: 'climate-pressure',
      label: 'pression risque',
      detail: `Risque ${route.riskLevel} autour de ${route.routeName}: sécurisation lente avant stabilisation.`,
      tone: 'high',
    };
  }

  if (route.riskLevel >= 55) {
    return {
      type: 'distance',
      label: 'trajet exposé',
      detail: `${route.routeName} reste long ou exposé: escorte requise pour raccourcir le délai.`,
      tone: 'medium',
    };
  }

  if (neighborBottleneck) {
    return {
      type: 'neighbor-dependency',
      label: 'dépendance voisine',
      detail: `${neighborBottleneck.route} près de ${neighborBottleneck.target} peut encore retarder le gain.`,
      tone: neighborBottleneck.tone,
    };
  }

  if (localTension === 'medium') {
    return {
      type: 'unrest',
      label: 'stock sous tension',
      detail: `${localCity.cityName} demande un tampon local avant amélioration nette.`,
      tone: 'medium',
    };
  }

  return {
    type: 'none',
    label: 'aucun goulot clair',
    detail: 'Aucun ralentisseur dominant détecté pour cette projection.',
    tone: 'low',
  };
}

function buildRecoveryTimeline(choice, route, localCity, mainResource, localTension) {
  const firstBottleneck = choice.neighborEffects.find((effect) => effect.tone !== 'low') ?? choice.neighborEffects[0] ?? null;
  const nextTurnLabel = choice.choiceId === 'repair'
    ? (!route.active ? 'route rouverte' : 'fragilité réduite')
    : choice.choiceId === 'reroute'
      ? 'flux redistribué'
      : choice.choiceId === 'stockpile'
        ? 'tampon consommé'
        : 'priorité appliquée';
  const remainingRisk = choice.choiceId === 'repair'
    ? Math.max(5, route.riskLevel - (!route.active ? 24 : 16))
    : choice.choiceId === 'reroute'
      ? Math.max(5, route.riskLevel - 10)
      : choice.choiceId === 'stockpile'
        ? Math.max(5, route.riskLevel - 6)
        : Math.max(5, route.riskLevel - 8);
  const riskTone = remainingRisk >= 55 || firstBottleneck?.tone === 'medium' ? 'medium' : 'low';
  const bottleneck = inferRecoveryBottleneck(choice, route, localCity, localTension);

  return [
    {
      step: 'Effet immédiat',
      tone: choice.tone,
      detail: `${choice.label}: ${choice.benefit}`,
    },
    {
      step: 'Prochain tour',
      tone: firstBottleneck?.tone ?? 'low',
      detail: firstBottleneck
        ? `${nextTurnLabel}; ${firstBottleneck.label} sur ${firstBottleneck.route} près de ${firstBottleneck.target}.`
        : `${nextTurnLabel}; aucune route voisine critique détectée.`,
      bottleneck: bottleneck.type === 'neighbor-dependency' ? bottleneck : null,
    },
    {
      step: 'Risque restant',
      tone: riskTone,
      detail: `Risque estimé ${remainingRisk} sur ${route.routeName}; ${firstBottleneck ? `${firstBottleneck.route} reste le goulot à surveiller.` : `${localCity.cityName} garde ${mainResource.label} sous veille.`}`,
      bottleneck,
    },
  ];
}


function buildDownstreamShortages(choice, route, localCity, localTension, mainResource) {
  const pressureEffects = choice.neighborEffects.filter((effect) => effect.tone !== 'low').slice(0, 2);

  if (pressureEffects.length > 0) {
    return pressureEffects.map((effect) => {
      const aggravated = choice.choiceId === 'stockpile' || choice.bottleneck.type === 'capacity';
      const displaced = effect.label === 'congestion déplacée' || choice.choiceId === 'reroute' || choice.bottleneck.type === 'neighbor-dependency';
      const status = aggravated ? 'aggravée' : displaced ? 'déplacée' : 'inconnue';

      return {
        target: effect.target,
        route: effect.route,
        resource: mainResource.label,
        status,
        tone: aggravated ? 'high' : 'medium',
        detail: status === 'aggravée'
          ? `${effect.target} risque de manquer de ${mainResource.label}: ${effect.label} maintient la pression aval.`
          : status === 'déplacée'
            ? `${effect.target} récupère une partie de la pression de ${localCity.cityName}; ${effect.route} reste à surveiller.`
            : `${effect.target} manque de signal clair: ${effect.detail}`,
      };
    });
  }

  if (localTension !== 'low') {
    const resolved = choice.choiceId === 'stockpile' || choice.choiceId === 'economic-priority';

    return [{
      target: localCity.cityName,
      route: route.routeName,
      resource: mainResource.label,
      status: resolved ? 'résolue' : 'inconnue',
      tone: resolved ? 'low' : 'medium',
      detail: resolved
        ? `${mainResource.label} couvert localement; aucune pénurie aval nette détectée.`
        : `${localCity.cityName} reste sous tension: confirmer le stock aval après l'action.`,
    }];
  }

  if (choice.bottleneck.type === 'none') {
    return [{
      target: localCity.cityName,
      route: route.routeName,
      resource: mainResource.label,
      status: 'résolue',
      tone: 'low',
      detail: `${mainResource.label} reste couvert; aucune pénurie aval claire détectée.`,
    }];
  }

  return [{
    target: localCity.cityName,
    route: route.routeName,
    resource: mainResource.label,
    status: 'inconnue',
    tone: 'medium',
    detail: `Données aval insuffisantes: vérifier ${mainResource.label} après ${choice.label}.`,
  }];
}

function buildRecoveryChoices(route, localCity, localTension, mainResource, routeCause, neighborContexts = []) {
  const choices = [
    {
      choiceId: 'reroute',
      label: 'Reroute',
      tone: route.totalCapacity >= 9 || route.riskLevel >= 55 ? 'high' : 'medium',
      benefit: route.totalCapacity >= 9
        ? `Désature ${route.routeName} en répartissant ${mainResource.label} vers un relais voisin.`
        : `Contourne le risque ${route.riskLevel} et garde ${localCity.cityName} alimentée.`,
      blocker: route.totalCapacity >= 9 ? 'relais disponible' : 'route alternative sûre',
      rationale: `Répond à la cause: ${routeCause.label}.`,
      score: (route.totalCapacity >= 9 ? 34 : 22) + (route.riskLevel >= 55 ? 12 : 0),
    },
    {
      choiceId: 'repair',
      label: 'Repair',
      tone: !route.active ? 'high' : route.riskLevel >= 70 ? 'medium' : 'low',
      benefit: !route.active
        ? `Rouvre ${route.routeName} et restaure le flux de ${mainResource.label}.`
        : `Stabilise les points faibles de ${route.routeName} avant le prochain tour.`,
      blocker: !route.active ? 'équipe et stock outil' : 'fenêtre de maintenance',
      rationale: `Répond à la cause: ${routeCause.label}.`,
      score: (!route.active ? 44 : 14) + (route.riskLevel >= 70 ? 10 : 0),
    },
    {
      choiceId: 'stockpile',
      label: 'Stockpile',
      tone: localTension !== 'low' ? 'high' : 'low',
      benefit: `Ajoute un tampon local à ${localCity.cityName} pour absorber la tension sur ${mainResource.label}.`,
      blocker: 'stock disponible',
      rationale: `Répond à la cause: ${routeCause.label}.`,
      score: (localTension === 'high' ? 42 : localTension === 'medium' ? 28 : 8) + mainResource.capacity,
    },
    {
      choiceId: 'economic-priority',
      label: 'Priorité économie',
      tone: route.riskLevel >= 55 || route.totalCapacity >= 9 ? 'medium' : 'low',
      benefit: `Réserve ordres et budget pour ${mainResource.label} au lieu de disperser les flux.`,
      blocker: 'ordre économie disponible',
      rationale: `Répond à la cause: ${routeCause.label}.`,
      score: 16 + (route.riskLevel >= 55 ? 12 : 0) + (route.totalCapacity >= 9 ? 10 : 0),
    },
  ];

  const rankedChoices = choices.sort((left, right) => right.score - left.score || left.label.localeCompare(right.label));
  const topChoice = rankedChoices[0];

  return rankedChoices.map((choice, index) => {
    const neighborEffects = neighborContexts.map((neighbor) => getNeighborEffect(choice.choiceId, route, localCity, neighbor, mainResource));
    const bottleneck = inferRecoveryBottleneck({ ...choice, neighborEffects }, route, localCity, localTension);
    const enrichedChoice = { ...choice, neighborEffects, bottleneck };

    return {
      ...choice,
      recommended: index === 0,
      comparison: index === 0 ? 'meilleur levier immédiat' : `moins urgent: ${topChoice.blocker} prioritaire`,
      neighborEffects,
      bottleneck,
      timeline: buildRecoveryTimeline(enrichedChoice, route, localCity, mainResource, localTension),
      downstreamShortages: buildDownstreamShortages(enrichedChoice, route, localCity, localTension, mainResource),
    };
  });
}

function buildChoiceForRoute(route, localCity, localTension, resourceLabelById, context = {}) {
  const mainResource = getMainResource(route, resourceLabelById);
  const tone = getRouteTone(route, localTension);
  const routeCause = getRouteCause(route, localCity, localTension, mainResource);
  const overloaded = route.totalCapacity >= 9;
  const risky = route.riskLevel >= 55;
  const inactive = !route.active;
  const action = inactive
    ? 'Réparer route'
    : risky
      ? 'Sécuriser convoi'
      : overloaded
        ? 'Détourner flux'
        : localTension !== 'low'
          ? 'Stocker localement'
          : 'Maintenir veille';
  const cost = inactive
    ? '2 équipes · 1 stock outil'
    : risky
      ? '1 escorte · 1 ordre'
      : overloaded
        ? '1 relais · coordination routes'
        : '1 dépôt local';
  const delay = inactive ? '2 tours' : overloaded ? '1-2 tours' : '1 tour';
  const residualRisk = Math.max(5, route.riskLevel - (inactive ? 18 : risky ? 14 : overloaded ? 9 : 5));
  const impact = tone === 'high'
    ? `Réduit la tension ${localTension} et protège ${mainResource.label}.`
    : tone === 'medium'
      ? `Soulage ${mainResource.label} sans masquer le risque résiduel.`
      : `Maintient ${localCity.cityName} stable avec surveillance légère.`;
  const neighborContexts = getNeighborContexts(route, localCity, context.cities ?? [], context.routes ?? [], context.tensionByCityId ?? {});
  const recoveryChoices = buildRecoveryChoices(route, localCity, localTension, mainResource, routeCause, neighborContexts);

  return {
    routeId: route.routeId,
    action,
    tone,
    cost,
    delay,
    routes: [route.routeName],
    resources: [mainResource.label],
    affectedCity: localCity.cityName,
    causeLabel: routeCause.label,
    cause: routeCause.detail,
    recoveryChoices,
    residualRisk,
    impact,
    score: (TONE_RANK[tone] ?? 0) * 100 + route.riskLevel + route.totalCapacity + (localTension === 'high' ? 20 : localTension === 'medium' ? 10 : 0),
  };
}


function getDelayTurns(delay) {
  const match = String(delay ?? '').match(/\d+/);
  return match ? Number(match[0]) : 1;
}

function buildRecoveryPriorityActions(routeChoices) {
  const candidates = routeChoices
    .flatMap((option) => option.recoveryChoices.slice(0, 2).map((choice) => {
      const shortagesAvoided = choice.downstreamShortages.filter((shortage) => shortage.status === 'résolue').length;
      const displacedShortages = choice.downstreamShortages.filter((shortage) => shortage.status === 'déplacée').length;
      const aggravatedShortages = choice.downstreamShortages.filter((shortage) => shortage.status === 'aggravée').length;
      const delayTurns = getDelayTurns(option.delay);
      const structural = choice.bottleneck.tone === 'high' || choice.bottleneck.type === 'capacity' || choice.bottleneck.type === 'damage';
      const impactScore = shortagesAvoided * 40 + displacedShortages * 18 - aggravatedShortages * 32 + (structural ? 26 : 8) - delayTurns * 4 + (option.recommended ? 12 : 0);
      const tradeoff = delayTurns <= 1 && !structural
        ? 'rapide mais limitée'
        : structural
          ? 'plus lente mais structurante'
          : 'équilibrée';

      return {
        actionId: `${option.routeId}:${choice.choiceId}`,
        optionId: option.optionId,
        routeId: option.routeId,
        choiceId: choice.choiceId,
        action: `${choice.label} · ${option.routes[0]}`,
        route: option.routes[0],
        resource: option.resources[0],
        tone: impactScore >= 40 ? 'high' : impactScore >= 18 ? 'medium' : 'low',
        cost: option.cost,
        delay: option.delay,
        impact: choice.benefit,
        reason: `${choice.bottleneck.label}; ${choice.downstreamShortages[0]?.detail ?? 'aucune pénurie aval claire'}`,
        shortagesAvoided,
        downstreamStatus: choice.downstreamShortages[0]?.status ?? 'inconnue',
        tradeoff,
        impactScore,
      };
    }))
    .sort((left, right) => right.impactScore - left.impactScore || left.delay.localeCompare(right.delay) || left.action.localeCompare(right.action))
    .slice(0, 3)
    .map((candidate, index) => ({
      ...candidate,
      recommended: index === 0,
    }));

  return candidates;
}


function buildRecoveryLeverRanking(routeChoices, priorityActions, hasBlocker) {
  if (!hasBlocker || priorityActions.length === 0) {
    return {
      levers: [],
      summary: hasBlocker
        ? 'Aucun levier recovery utile: coûts ou risques évités trop incertains.'
        : 'Aucun levier recovery à classer: logistique stable ou signaux insuffisants.',
      empty: true,
    };
  }

  const optionByRouteId = new Map(routeChoices.map((option) => [option.routeId, option]));
  const candidates = priorityActions
    .map((action) => {
      const option = optionByRouteId.get(action.routeId) ?? null;
      const choice = option?.recoveryChoices.find((candidate) => candidate.choiceId === action.choiceId) ?? null;
      const unresolvedDebt = choice?.downstreamShortages.find((shortage) => shortage.status === 'aggravée' || shortage.status === 'déplacée' || shortage.status === 'inconnue') ?? null;
      const criticalAvoided = Math.max(
        action.shortagesAvoided,
        choice?.downstreamShortages.filter((shortage) => shortage.status === 'aggravée' || shortage.status === 'déplacée').length ?? 0,
      );
      const capacityKey = `${action.resource}:${choice?.blocker ?? option?.cost ?? action.cost}`;
      const capacityCostDetail = option
        ? `${action.cost} sur ${action.route} vers ${option.affectedCity}, délai ${action.delay}; capacité requise: ${choice?.blocker ?? action.resource}.`
        : `${action.cost}, délai ${action.delay}; capacité requise: ${choice?.blocker ?? action.resource}.`;
      const avoidedRisk = criticalAvoided > 0
        ? `${criticalAvoided} pénurie${criticalAvoided > 1 ? 's' : ''}/goulot${criticalAvoided > 1 ? 's' : ''} évité${criticalAvoided > 1 ? 's' : ''}`
        : choice?.bottleneck?.tone === 'high'
          ? `${choice.bottleneck.label} neutralisé avant rechute`
          : `${action.downstreamStatus} contenu avant prochain tour`;
      const debtWatch = unresolvedDebt
        ? `Dette à surveiller: ${unresolvedDebt.target} (${unresolvedDebt.status}) après ${action.route}.`
        : choice?.bottleneck?.tone === 'high'
          ? `Dette à surveiller: ${choice.bottleneck.label} peut rester active sur ${action.route}.`
          : 'Dette aval résiduelle faible après ce levier.';

      return {
        leverId: `lever:${action.actionId}`,
        label: action.action,
        route: action.route,
        resource: action.resource,
        tone: action.tone,
        primaryCost: action.cost,
        capacityCostDetail,
        avoidedRisk,
        debtWatch,
        tradeoff: action.tradeoff,
        blocker: choice?.blocker ?? 'capacité à confirmer',
        capacityKey,
        priorityScore: action.impactScore + criticalAvoided * 16,
      };
    })
    .sort((left, right) => right.priorityScore - left.priorityScore || left.label.localeCompare(right.label))
    .slice(0, 3);

  const capacityCounts = candidates.reduce((counts, lever) => counts.set(lever.capacityKey, (counts.get(lever.capacityKey) ?? 0) + 1), new Map());
  const levers = candidates.map((lever, index, ordered) => {
    const conflict = ordered.find((candidate, candidateIndex) => candidateIndex !== index && candidate.capacityKey === lever.capacityKey) ?? null;
    const nextLever = ordered[index + 1] ?? null;
    return {
      ...lever,
      rank: index + 1,
      recommended: index === 0,
      capacityComparison: nextLever
        ? `${nextLever.label} demande ${nextLever.primaryCost}; ${lever.label} garde le meilleur ratio capacité/risque.`
        : 'Aucun second levier assez utile pour comparer le coût de capacité.',
      mutualBlocker: conflict
        ? `Partage ${lever.resource}/${lever.blocker} avec ${conflict.label}: choisir l’un retarde l’autre.`
        : (capacityCounts.get(lever.capacityKey) ?? 0) > 1
          ? `Même capacité consommée par un autre levier ${lever.resource}.`
          : 'Pas de blocage mutuel majeur détecté.',
    };
  });

  return {
    levers,
    summary: levers.length > 0
      ? `${levers[0].label} d’abord: coût ${levers[0].primaryCost}, risque évité ${levers[0].avoidedRisk}.`
      : 'Aucun levier recovery utile: coûts ou risques évités trop incertains.',
    empty: levers.length === 0,
  };
}

function buildSelectedActionImpactPreview(priorityAction, routeChoices) {
  if (!priorityAction) {
    return {
      status: 'empty',
      summary: 'Aucune action candidate sélectionnée: impact à confirmer après choix logistique.',
      currentState: 'Données insuffisantes',
      projectedState: 'Projection indisponible',
      badges: [],
      criticalRemaining: false,
    };
  }

  const option = routeChoices.find((candidate) => candidate.routeId === priorityAction.routeId) ?? routeChoices[0] ?? null;
  const choice = option?.recoveryChoices.find((candidate) => candidate.choiceId === priorityAction.choiceId) ?? option?.recoveryChoices[0] ?? null;
  const shortages = choice?.downstreamShortages ?? [];
  const neighborEffects = choice?.neighborEffects ?? [];
  const criticalBefore = option?.recoveryChoices.flatMap((candidate) => candidate.downstreamShortages).filter((shortage) => shortage.status === 'aggravée').length ?? 0;
  const criticalAfter = shortages.filter((shortage) => shortage.status === 'aggravée').length;
  const reducedShortages = Math.max(priorityAction.shortagesAvoided, criticalBefore - criticalAfter, shortages.filter((shortage) => shortage.status === 'résolue').length);
  const relievedRoutes = new Set([
    priorityAction.route,
    ...neighborEffects.filter((effect) => effect.label === 'hub soulagé' || effect.label === 'axe stabilisé' || effect.tone === 'low').map((effect) => effect.route),
  ]).size;
  const delay = priorityAction.delay ?? option?.delay ?? '1 tour';
  const criticalRemaining = criticalAfter > 0 || choice?.bottleneck?.tone === 'high';

  return {
    status: criticalRemaining ? 'critical' : reducedShortages > 0 || relievedRoutes > 1 ? 'improved' : 'limited',
    summary: `${priorityAction.action}: ${reducedShortages} pénurie${reducedShortages > 1 ? 's' : ''} aval réduite${reducedShortages > 1 ? 's' : ''}, ${relievedRoutes} route${relievedRoutes > 1 ? 's' : ''}/province${relievedRoutes > 1 ? 's' : ''} soulagée${relievedRoutes > 1 ? 's' : ''}, délai ${delay}.`,
    currentState: criticalBefore > 0
      ? `Actuel: ${criticalBefore} pénurie${criticalBefore > 1 ? 's' : ''} critique${criticalBefore > 1 ? 's' : ''} ou déplacée${criticalBefore > 1 ? 's' : ''}.`
      : `Actuel: ${priorityAction.downstreamStatus} sur ${priorityAction.route}.`,
    projectedState: criticalRemaining
      ? `Projeté: pénurie critique encore possible (${choice?.bottleneck?.label ?? 'goulot restant'}).`
      : `Projeté: ${priorityAction.downstreamStatus} après ${priorityAction.action}.`,
    badges: [
      { label: 'Pénuries réduites', value: String(reducedShortages), tone: reducedShortages > 0 ? 'low' : 'medium' },
      { label: 'Axes soulagés', value: String(relievedRoutes), tone: relievedRoutes > 1 ? 'low' : 'medium' },
      { label: 'Délai', value: delay, tone: getDelayTurns(delay) > 1 ? 'medium' : 'low' },
    ],
    criticalRemaining,
  };
}



function buildSecondaryBottleneckPreview(priorityAction, routeChoices) {
  if (!priorityAction) {
    return {
      state: 'empty',
      label: 'Aucun goulot secondaire',
      status: 'absorbable',
      route: null,
      city: null,
      resource: null,
      summary: 'Aucun levier recommandé: impossible de projeter le prochain goulot logistique.',
      detail: 'Attendre un signal recovery avant d’afficher une alerte aval.',
      nextRecommendation: {
        action: 'Aucune suite immédiate',
        target: '—',
        reason: 'aucun bottleneck secondaire pertinent après ce levier; garder une veille légère.',
      },
    };
  }

  const option = routeChoices.find((candidate) => candidate.routeId === priorityAction.routeId) ?? routeChoices[0] ?? null;
  const choice = option?.recoveryChoices.find((candidate) => candidate.choiceId === priorityAction.choiceId) ?? option?.recoveryChoices[0] ?? null;
  const shortage = choice?.downstreamShortages.find((candidate) => candidate.status !== 'résolue') ?? choice?.downstreamShortages[0] ?? null;
  const neighbor = choice?.neighborEffects.find((effect) => effect.tone !== 'low') ?? choice?.neighborEffects[0] ?? null;
  const bottleneck = choice?.bottleneck ?? null;
  const status = shortage?.status === 'aggravée' || bottleneck?.tone === 'high'
    ? 'bloquant'
    : shortage?.status === 'déplacée' || shortage?.status === 'inconnue' || bottleneck?.tone === 'medium'
      ? 'à surveiller'
      : 'absorbable';
  const route = shortage?.route ?? neighbor?.route ?? priorityAction.route;
  const city = shortage?.target ?? neighbor?.target ?? option?.affectedCity ?? 'ville liée';
  const resource = shortage?.resource ?? priorityAction.resource;
  const candidates = [
    ...(choice?.downstreamShortages ?? []).filter((candidate) => candidate.status !== 'résolue').map((candidate) => ({
      route: candidate.route,
      city: candidate.target,
      resource: candidate.resource,
      status: candidate.status,
      detail: candidate.detail,
      score: candidate.status === 'aggravée' ? 48 : candidate.status === 'déplacée' ? 34 : 20,
    })),
    ...(choice?.neighborEffects ?? []).filter((effect) => effect.tone !== 'low').map((effect) => ({
      route: effect.route,
      city: effect.target,
      resource,
      status: effect.tone === 'high' ? 'aggravée' : 'déplacée',
      detail: effect.detail,
      score: effect.tone === 'high' ? 42 : 28,
    })),
  ].sort((left, right) => right.score - left.score || left.route.localeCompare(right.route));
  const next = candidates[0] ?? null;
  const nextRecommendation = next
    ? {
        action: `Traiter ensuite ${next.route}`,
        target: `${next.city} · ${next.resource}`,
        reason: next.status === 'aggravée'
          ? `évite que ${next.city} manque de ${next.resource} au tour suivant.`
          : next.status === 'déplacée'
            ? `empêche le déplacement de pression de devenir le nouveau goulot.`
            : `clarifie la dette aval avant qu’elle bloque la reprise.`,
      }
    : {
        action: 'Aucune suite immédiate',
        target: `${route} · ${city}`,
        reason: 'aucun bottleneck secondaire pertinent après ce levier; garder une veille légère.',
      };

  return {
    state: status === 'bloquant' ? 'blocked' : status === 'à surveiller' ? 'watch' : 'absorbable',
    label: bottleneck?.label ?? shortage?.status ?? 'goulot aval',
    status,
    route,
    city,
    resource,
    summary: `${priorityAction.action} appliqué: prochain goulot ${status} sur ${route} près de ${city}.`,
    detail: shortage?.detail ?? bottleneck?.detail ?? `${resource} reste à suivre après ${priorityAction.action}.`,
    nextRecommendation,
  };
}


function buildPrimarySecondaryTradeoff(priorityAction, selectedActionPreview, secondaryBottleneckPreview) {
  if (!priorityAction || !secondaryBottleneckPreview || secondaryBottleneckPreview.state === 'empty') {
    return {
      state: 'empty',
      summary: 'Compromis principal/secondaire indisponible: aucun bottleneck secondaire chiffrable.',
      opportunityCost: 'Coût d’opportunité non chiffrable avec les signaux actuels.',
      secondaryBetter: false,
    };
  }

  const secondaryBlocking = secondaryBottleneckPreview.state === 'blocked';
  const secondaryBetter = secondaryBlocking && selectedActionPreview?.criticalRemaining;
  const primaryEffect = selectedActionPreview?.summary ?? priorityAction.impact;
  const secondaryEffect = secondaryBottleneckPreview.nextRecommendation?.reason ?? secondaryBottleneckPreview.detail;

  return {
    state: secondaryBetter ? 'secondary' : secondaryBottleneckPreview.state === 'watch' ? 'balanced' : 'primary',
    summary: `Principal: ${primaryEffect} Secondaire: ${secondaryEffect}`,
    opportunityCost: secondaryBetter
      ? `Coût d’opportunité: continuer ${priorityAction.action} consomme ${priorityAction.cost} pendant que ${secondaryBottleneckPreview.route} peut bloquer.`
      : `Coût d’opportunité: traiter ${secondaryBottleneckPreview.route} maintenant retarde ${priorityAction.action} (${priorityAction.cost}).`,
    secondaryBetter,
  };
}


function buildSecondaryChoiceRelapsePreview(priorityAction, selectedActionPreview, secondaryBottleneckPreview, primarySecondaryTradeoff) {
  if (!priorityAction || !secondaryBottleneckPreview || secondaryBottleneckPreview.state === 'empty') {
    return {
      state: 'unknown',
      summary: 'Rechute non chiffrable: aucun choix secondaire exploitable pour comparer la marge du levier principal.',
      factor: 'projection insuffisante',
      guardAction: 'Attendre un signal secondaire ou garder le levier principal en veille.',
      safeSecondary: false,
    };
  }

  const secondaryBetter = primarySecondaryTradeoff?.secondaryBetter ?? false;
  const criticalRemaining = selectedActionPreview?.criticalRemaining ?? false;
  const state = secondaryBetter
    ? 'fragile'
    : criticalRemaining || secondaryBottleneckPreview.state === 'blocked'
      ? 'relapse-risk'
      : secondaryBottleneckPreview.state === 'watch'
        ? 'fragile'
        : 'stable';
  const factor = criticalRemaining
    ? `dette logistique encore critique sur ${priorityAction.route}`
    : secondaryBottleneckPreview.state === 'blocked'
      ? `route critique ${secondaryBottleneckPreview.route} peut absorber la capacité avant stabilisation`
      : secondaryBottleneckPreview.state === 'watch'
        ? `momentum insuffisant si ${secondaryBottleneckPreview.route} reste sous surveillance`
        : `marge suffisante après ${priorityAction.action}`;
  const safeSecondary = state === 'stable';

  return {
    state,
    summary: safeSecondary
      ? `Choix secondaire sûr: le levier principal reste stable, ${factor}.`
      : `Choix secondaire risqué: le levier principal devient ${state === 'relapse-risk' ? 'en rechute probable' : 'fragile'}, facteur clé: ${factor}.`,
    factor,
    guardAction: safeSecondary
      ? `Action minimale: garder ${priorityAction.route} en veille pendant le traitement secondaire.`
      : `Action minimale: sécuriser ${priorityAction.route} avec ${priorityAction.cost} avant de traiter ${secondaryBottleneckPreview.route}.`,
    safeSecondary,
  };
}


function buildLocalRecoveryCapacityConflictWarning(priorityAction, routeChoices) {
  if (!priorityAction) {
    return {
      state: 'empty',
      route: null,
      summary: 'Aucun conflit transversal: aucune récupération locale recommandée.',
      detail: 'Aucune capacité critique à comparer.',
    };
  }

  const selectedOption = routeChoices.find((option) => option.routeId === priorityAction.routeId) ?? null;
  const selectedScore = (selectedOption?.residualRisk ?? 0) + (selectedOption?.recoveryChoices[0]?.bottleneck?.tone === 'high' ? 12 : 0);
  const candidates = routeChoices
    .filter((option) => option.routeId !== priorityAction.routeId && option.resources.includes(priorityAction.resource))
    .map((option) => {
      const routeStress = option.residualRisk + (option.tone === 'high' ? 18 : option.tone === 'medium' ? 8 : 0);
      const sharedCapacity = option.recoveryChoices.some((choice) => choice.blocker === selectedOption?.recoveryChoices[0]?.blocker || choice.blocker === priorityAction.resource);
      return {
        route: option.routes[0],
        city: option.affectedCity,
        resource: priorityAction.resource,
        routeStress,
        sharedCapacity,
        delay: option.delay,
      };
    })
    .filter((candidate) => candidate.sharedCapacity && candidate.routeStress >= 54 && candidate.routeStress >= selectedScore - 12)
    .sort((left, right) => right.routeStress - left.routeStress || left.route.localeCompare(right.route));
  const conflict = candidates[0] ?? null;

  if (!conflict) {
    return {
      state: 'empty',
      route: null,
      summary: 'Aucun conflit transversal concret: le levier local ne retarde pas une route plus fragile.',
      detail: 'Capacité partagée sous le seuil critique.',
    };
  }

  return {
    state: conflict.routeStress >= 72 ? 'critical' : 'warning',
    route: conflict.route,
    city: conflict.city,
    resource: conflict.resource,
    summary: `Attention: ce choix retarde aussi ${conflict.route}, route critique vers ${conflict.city}.`,
    detail: `${priorityAction.action} consomme ${priorityAction.cost}; ${conflict.route} partage ${conflict.resource} et peut perdre ${conflict.delay}.`,
  };
}


function buildAdjacentRouteSpilloverRisk(priorityAction, routeChoices) {
  if (!priorityAction) {
    return {
      state: 'empty',
      criticalRoute: null,
      secondaryRoutes: [],
      summary: 'Aucun spillover logistique: aucune récupération locale sélectionnée.',
      dependencyTrace: 'Dépendance inconnue: aucun levier local ne permet de tracer la source du spillover.',
      guardAction: { label: 'Garde indisponible', reason: 'Aucune chaîne de spillover à réduire pour l’instant.', fallback: true },
      guardComparison: { state: 'fallback', candidates: [], summary: 'Comparaison impossible: aucune garde concrète à classer.' },
      guardSequencing: { state: 'unknown', phrase: 'enchaînement inconnu', reason: 'Capacité de garde indisponible sans récupération locale.' },
      guardOpportunityCost: { state: 'fallback', summary: 'Coût d’opportunité indisponible: aucune chaîne de garde à prolonger.', stopChain: false, residualExposure: { state: 'unknown', exposedRoutes: [], benefit: 'Bénéfice du fallback non calculable sans chaîne de garde.', residualRisk: 'Exposition restante non traçable précisément avec les signaux actuels.' } },
      guardDecisionSummary: { state: 'unknown', action: 'wait-for-signals', label: 'Comparer au prochain signal', summary: 'Exposition restante non traçable précisément avec les signaux actuels.', reason: 'Bénéfice du fallback non calculable sans chaîne de garde.', fallbackJustification: { state: 'unavailable', label: 'Aucun fallback sûr', protectedMargin: 'Marge protégée non calculable sans fallback confirmé.', limitingResource: 'Ressource limitante non identifiée par les signaux actuels.', residualExposure: 'Exposition restante non traçable précisément avec les signaux actuels.', ignoredRisk: 'Attendre un signal comparable avant de rouvrir la chaîne de garde.' } },
    };
  }

  const option = routeChoices.find((candidate) => candidate.routeId === priorityAction.routeId) ?? null;
  const choice = option?.recoveryChoices.find((candidate) => candidate.choiceId === priorityAction.choiceId) ?? option?.recoveryChoices[0] ?? null;
  const signals = [
    ...(choice?.downstreamShortages ?? []).filter((shortage) => shortage.status !== 'résolue').map((shortage) => ({
      route: shortage.route,
      city: shortage.target,
      resource: shortage.resource,
      tone: shortage.status === 'aggravée' ? 'high' : 'medium',
      detail: shortage.detail,
      score: shortage.status === 'aggravée' ? 50 : shortage.status === 'déplacée' ? 36 : 24,
    })),
    ...(choice?.neighborEffects ?? []).filter((effect) => effect.tone !== 'low').map((effect) => ({
      route: effect.route,
      city: effect.target,
      resource: priorityAction.resource,
      tone: effect.tone,
      detail: effect.detail,
      score: effect.tone === 'high' ? 44 : 30,
    })),
  ].filter((signal) => signal.route && signal.route !== priorityAction.route)
    .sort((left, right) => right.score - left.score || left.route.localeCompare(right.route));

  const deduped = [];
  for (const signal of signals) {
    if (!deduped.some((entry) => entry.route === signal.route)) {
      deduped.push(signal);
    }
  }

  const criticalRoute = deduped[0] ?? null;
  const secondaryRoutes = deduped.slice(1, 3);

  if (!criticalRoute) {
    return {
      state: 'empty',
      criticalRoute: null,
      secondaryRoutes: [],
      summary: 'Aucun spillover logistique voisin concret après cette récupération locale.',
      dependencyTrace: 'Dépendance inconnue: aucune route voisine exposée ne confirme la chaîne source → route affectée → conséquence.',
      guardAction: { label: 'Garde indisponible', reason: 'Aucun relais voisin confirmé; surveiller la route après résolution locale.', fallback: true },
      guardComparison: { state: 'fallback', candidates: [], summary: 'Comparaison impossible: coût de garde non comparable sans route exposée.' },
      guardSequencing: { state: 'unknown', phrase: 'enchaînement inconnu', reason: 'Aucune route exposée ne permet de comparer la capacité de garde.' },
      guardOpportunityCost: { state: 'fallback', summary: 'Coût d’opportunité indisponible: aucune route adjacente exposée à comparer.', stopChain: false, residualExposure: { state: 'unknown', exposedRoutes: [], benefit: 'Bénéfice du fallback non calculable sans route exposée.', residualRisk: 'Exposition restante non traçable précisément avec les signaux actuels.' } },
      guardDecisionSummary: { state: 'unknown', action: 'wait-for-signals', label: 'Comparer au prochain signal', summary: 'Exposition restante non traçable précisément avec les signaux actuels.', reason: 'Bénéfice du fallback non calculable sans route exposée.', fallbackJustification: { state: 'unavailable', label: 'Aucun fallback sûr', protectedMargin: 'Marge protégée non calculable sans fallback confirmé.', limitingResource: priorityAction.resource ? `${priorityAction.resource} reste la ressource limitante, mais aucun relais sûr n’est classé.` : 'Ressource limitante non identifiée par les signaux actuels.', residualExposure: 'Exposition restante non traçable précisément avec les signaux actuels.', ignoredRisk: 'Attendre un signal comparable avant de rouvrir la chaîne de garde.' } },
    };
  }

  const source = choice?.bottleneck?.label ?? option?.causeLabel ?? 'source inconnue';
  const consequence = criticalRoute.detail ?? `${criticalRoute.route} peut récupérer la pression déplacée.`;
  const guardCandidates = [criticalRoute, ...secondaryRoutes]
    .map((route, index) => ({
      route: route.route,
      city: route.city,
      tone: route.tone,
      label: index === 0 ? `Sécuriser ${route.route} juste après ${priorityAction.route}` : `Garder ${route.route} en relais léger`,
      reason: index === 0
        ? `${route.city} absorbe la pression déplacée si ${priorityAction.cost} reste le seul levier engagé.`
        : `Protège ${route.city} avec moins de capacité consommée que la route critique.`,
      tradeoff: `${route.route} protégée vs ${route.tone === 'high' ? 'capacité forte consommée' : 'capacité légère consommée'}`,
      disruption: (route.tone === 'high' ? 3 : 2) + index,
      expectedBenefit: Math.max(1, route.tone === 'high' ? 3 - index : 2 - index),
      criticalDelay: route.tone === 'high',
      fallback: false,
    }))
    .sort((left, right) => left.disruption - right.disruption || left.route.localeCompare(right.route));

  const guardAction = guardCandidates[0] ?? {
    label: 'Garde indisponible',
    reason: 'Comparaison des coûts de garde impossible avec les signaux actuels.',
    fallback: true,
  };
  const guardComparison = guardCandidates.length > 1
    ? {
      state: 'compare',
      candidates: guardCandidates,
      summary: `${guardAction.label} est le moins disruptif: ${guardAction.tradeoff}.`,
    }
    : guardCandidates.length === 1
      ? {
        state: 'single',
        candidates: guardCandidates,
        summary: 'Une seule garde concrète identifiée; comportement inchangé.',
      }
      : {
        state: 'fallback',
        candidates: [],
        summary: 'Comparaison impossible: coût de garde non comparable avec les signaux actuels.',
      };
  const guardSequencing = guardAction.fallback
    ? {
      state: 'unknown',
      phrase: 'enchaînement inconnu',
      reason: 'Capacité de garde indisponible avec les signaux actuels.',
    }
    : guardComparison.state === 'single' && guardAction.route === criticalRoute.route && criticalRoute.resource === priorityAction.resource
      ? {
        state: 'competing',
        phrase: 'choisir la garde au lieu de la récupération ce tour',
        reason: `${guardAction.route} partage ${priorityAction.resource} avec ${priorityAction.route}; la capacité ne couvre pas les deux sans délai.`,
      }
      : {
        state: 'chainable',
        phrase: 'enchaîner après la récupération',
        reason: `${guardAction.route} reste assez léger pour suivre ${priorityAction.route} sans remplacer l’action locale.`,
      };
  const nextGuardCost = guardComparison.candidates.find((candidate) => candidate.route !== guardAction.route) ?? null;
  const buildGuardStopMarker = (nextGuard) => {
    if (!nextGuard || guardAction.fallback) {
      return null;
    }
    const cumulativeCost = guardAction.disruption + nextGuard.disruption;
    const expectedBenefit = guardAction.expectedBenefit + nextGuard.expectedBenefit;
    const exceedsBenefit = cumulativeCost > expectedBenefit;
    const criticalDelayed = nextGuard.criticalDelay === true;
    return {
      route: nextGuard.route,
      city: nextGuard.city,
      cumulativeCost,
      expectedBenefit,
      exceedsBenefit,
      criticalDelayed,
      label: exceedsBenefit
        ? `Point d’arrêt: avant ${nextGuard.route}`
        : `Continuation possible vers ${nextGuard.route}`,
      decisionLabel: exceedsBenefit
        ? `Arrêter ici protège ${guardAction.route} sans retarder ${nextGuard.route}.`
        : `Continuer vers ${nextGuard.route} reste acceptable: aucune route critique retardée.`,
      reason: exceedsBenefit
        ? `${nextGuard.route} est le premier segment où le coût cumulé ${cumulativeCost} dépasse le bénéfice attendu ${expectedBenefit}.`
        : `Le coût cumulé ${cumulativeCost} reste couvert par le bénéfice attendu ${expectedBenefit}.`,
    };
  };
  const guardStopMarker = buildGuardStopMarker(nextGuardCost);
  const buildFallbackExposure = (stopMarker, blockedGuard) => {
    if (!stopMarker?.exceedsBenefit) {
      return {
        state: 'unknown',
        exposedRoutes: [],
        benefit: 'Bénéfice du fallback non calculable sans point d’arrêt confirmé.',
        residualRisk: 'Exposition restante non traçable précisément avec les signaux actuels.',
      };
    }
    const exposedRoutes = [blockedGuard, ...secondaryRoutes]
      .filter((route) => route?.route && route.route !== guardAction.route)
      .filter((route, index, list) => list.findIndex((entry) => entry.route === route.route) === index)
      .slice(0, 2)
      .map((route) => ({
        route: route.route,
        city: route.city,
        tone: route.tone ?? 'medium',
        reason: route.route === blockedGuard?.route
          ? `${route.route} reste au-delà du point d’arrêt et ne reçoit pas de garde chaînée.`
          : `${route.route} garde un signal spillover secondaire après le repli.`,
      }));

    return exposedRoutes.length > 0
      ? {
        state: 'traced',
        exposedRoutes,
        benefit: `Le fallback protège ${guardAction.route} et garde le bénéfice principal lisible.`,
        residualRisk: `${exposedRoutes.map((route) => `${route.route}/${route.city}`).join(', ')} reste exposé après ce repli.`,
      }
      : {
        state: 'unknown',
        exposedRoutes: [],
        benefit: `Le fallback protège ${guardAction.route}, mais la suite de chaîne n’est pas assez tracée.`,
        residualRisk: 'Exposition restante non traçable précisément avec les signaux actuels.',
      };
  };
  const buildStopFallbackAction = (stopMarker, blockedGuard) => {
    if (!stopMarker?.exceedsBenefit || guardAction.fallback) {
      return null;
    }
    const protectedTarget = guardAction.city ?? criticalRoute.city;
    const blockedRoute = blockedGuard?.route ?? stopMarker.route;
    const routeDelay = blockedGuard?.criticalDelay ? `${blockedRoute} est critique et resterait retardée.` : `${blockedRoute} dépasse le bénéfice attendu.`;
    const residualExposure = buildFallbackExposure(stopMarker, blockedGuard);

    if (guardAction.tone === 'high') {
      return {
        state: 'recommended',
        action: 'fortify-key-segment',
        label: `Fortifier ${guardAction.route}`,
        target: guardAction.route,
        reason: `Préserve ${protectedTarget} sur le segment le plus rentable sans relancer la chaîne.`,
        opportunityCost: `${routeDelay} Coût limité à ${guardAction.tradeoff}.`,
        residualExposure,
      };
    }

    if (choice?.choiceId === 'reroute' || criticalRoute.tone === 'medium') {
      return {
        state: 'recommended',
        action: 'reroute-flow',
        label: `Rediriger un flux vers ${guardAction.route}`,
        target: guardAction.route,
        reason: `Conserve le bénéfice principal sur ${protectedTarget} avec un relais non-chaîné.`,
        opportunityCost: `${routeDelay} Pas de garde ajoutée au-delà de ${stopMarker.label}.`,
        residualExposure,
      };
    }

    return {
      state: 'recommended',
      action: 'protect-profitable-city',
      label: `Protéger ${protectedTarget}`,
      target: protectedTarget,
      reason: `Cible la ville ou route la plus rentable déjà identifiée par le spillover.`,
      opportunityCost: `${routeDelay} La chaîne reste arrêtée avant ${blockedRoute}.`,
      residualExposure,
    };
  };
  const guardOpportunityCost = guardSequencing.state === 'chainable' && nextGuardCost
    ? {
      state: guardStopMarker?.exceedsBenefit ? 'stop' : 'continue',
      protectedRoute: guardAction.route,
      delayedRoute: nextGuardCost.route,
      summary: guardStopMarker?.decisionLabel ?? `Protège ${guardAction.route}, retarde ${nextGuardCost.route}.`,
      stopChain: guardStopMarker?.exceedsBenefit === true,
      stopReason: guardStopMarker?.exceedsBenefit
        ? `Arrêter la chaîne après ${guardAction.route}: ${nextGuardCost.route} consommerait plus de capacité que le bénéfice attendu.`
        : `La chaîne peut continuer vers ${nextGuardCost.route} sans surcoût dominant.`,
      stopMarker: guardStopMarker,
      fallbackAction: buildStopFallbackAction(guardStopMarker, nextGuardCost),
      canContinueWithoutCriticalDelay: guardStopMarker ? !guardStopMarker.exceedsBenefit && !guardStopMarker.criticalDelayed : false,
    }
    : guardSequencing.state === 'chainable'
      ? {
        state: 'single',
        protectedRoute: guardAction.route,
        delayedRoute: priorityAction.route,
        summary: `Protège ${guardAction.route}, surveille ${priorityAction.route}.`,
        stopChain: false,
        stopReason: 'Aucune deuxième garde adjacente ne justifie d’arrêter la chaîne.',
        stopMarker: null,
        fallbackAction: null,
        canContinueWithoutCriticalDelay: true,
      }
      : guardSequencing.state === 'competing'
        ? {
          state: 'competing',
          protectedRoute: guardAction.route,
          delayedRoute: priorityAction.route,
          summary: `Protège ${guardAction.route}, retarde ${priorityAction.route}.`,
          stopChain: true,
          stopReason: `Ne pas prolonger: la garde remplace déjà la récupération sur ${priorityAction.route} ce tour.`,
          stopMarker: {
            route: priorityAction.route,
            city: option?.affectedCity ?? null,
            label: `Point d’arrêt: avant ${priorityAction.route}`,
            decisionLabel: `Arrêter ici protège ${guardAction.route} sans retarder ${priorityAction.route}.`,
            reason: `${guardAction.route} consomme déjà la capacité partagée avec ${priorityAction.route}.`,
            exceedsBenefit: true,
            criticalDelayed: true,
          },
          fallbackAction: {
            state: 'recommended',
            action: 'defer-chain',
            label: `Différer ${priorityAction.route}`,
            target: priorityAction.route,
            reason: `La garde protège déjà ${guardAction.route}; remplacer la récupération préserverait moins bien le bénéfice principal.`,
            opportunityCost: `Ne pas rouvrir la chaîne: ${priorityAction.route} reste retardée ce tour.`,
            residualExposure: {
              state: 'traced',
              exposedRoutes: [{ route: priorityAction.route, city: option?.affectedCity ?? null, tone: 'high', reason: `${priorityAction.route} reste retardée si la garde remplace la récupération.` }],
              benefit: `Le repli évite de surpayer la chaîne et protège ${guardAction.route}.`,
              residualRisk: `${priorityAction.route} reste exposée tant que la récupération locale est différée.`,
            },
          },
          canContinueWithoutCriticalDelay: false,
        }
        : {
          state: 'fallback',
          summary: 'Coût d’opportunité indisponible: enchaînement de garde non comparable.',
          stopChain: false,
          stopMarker: null,
          fallbackAction: null,
          residualExposure: {
            state: 'unknown',
            exposedRoutes: [],
            benefit: 'Bénéfice du fallback non calculable sans point d’arrêt confirmé.',
            residualRisk: 'Exposition restante non traçable précisément avec les signaux actuels.',
          },
          canContinueWithoutCriticalDelay: false,
        };
  const buildGuardNextChoiceTrigger = (opportunityCost) => {
    const fallbackAction = opportunityCost?.fallbackAction ?? null;
    if (!fallbackAction) {
      return null;
    }

    const exposure = fallbackAction.residualExposure ?? opportunityCost?.residualExposure ?? null;
    const exposedRoute = exposure?.exposedRoutes?.[0] ?? null;
    const stopMarker = opportunityCost?.stopMarker ?? null;

    if (stopMarker?.cumulativeCost && stopMarker?.expectedBenefit) {
      const missingBenefit = Math.max(1, stopMarker.cumulativeCost - stopMarker.expectedBenefit);
      return {
        state: exposedRoute?.tone === 'high' ? 'urgent' : 'watch',
        label: `Surveiller ${stopMarker.route}`,
        trigger: `Changer de garde si le bénéfice attendu de ${stopMarker.route} gagne ${missingBenefit} ou si son coût descend sous ${stopMarker.expectedBenefit}.`,
        reason: `${stopMarker.route} reste le premier seuil écarté: coût ${stopMarker.cumulativeCost} contre bénéfice ${stopMarker.expectedBenefit}.`,
      };
    }

    if (opportunityCost?.state === 'competing') {
      return {
        state: 'resource',
        label: `Surveiller ${opportunityCost.delayedRoute}`,
        trigger: priorityAction.resource
          ? `Changer de garde si ${priorityAction.resource} n’est plus limitant sur ${priorityAction.route} ou si ${opportunityCost.delayedRoute} devient le risque critique visible.`
          : `Changer de garde si ${opportunityCost.delayedRoute} devient le risque critique visible sans partager la capacité locale.`,
        reason: `Le choix actuel protège ${opportunityCost.protectedRoute}; ${opportunityCost.delayedRoute} reste le premier candidat à reprendre après le fallback.`,
      };
    }

    if (exposedRoute) {
      return {
        state: exposedRoute.tone === 'high' ? 'urgent' : 'watch',
        label: `Surveiller ${exposedRoute.route}`,
        trigger: `Changer de garde si ${exposedRoute.route} passe en exposition critique ou devient plus rentable que ${opportunityCost.protectedRoute ?? guardAction.route}.`,
        reason: exposure.residualRisk,
      };
    }

    return null;
  };
  const buildGuardPrimaryReturnSignal = (opportunityCost, nextChoiceTrigger) => {
    const fallbackAction = opportunityCost?.fallbackAction ?? null;
    if (!fallbackAction || !nextChoiceTrigger) {
      return null;
    }

    if (opportunityCost?.state === 'competing') {
      return {
        state: 'stay-fallback',
        label: 'Rester en fallback',
        summary: priorityAction.resource
          ? `Retour vers ${opportunityCost.delayedRoute} possible quand ${priorityAction.resource} n’est plus la ressource limitante de ${priorityAction.route}.`
          : `Retour vers ${opportunityCost.delayedRoute} possible quand la route principale ne partage plus la capacité locale.`,
        reason: nextChoiceTrigger.trigger,
      };
    }

    const stopMarker = opportunityCost?.stopMarker ?? null;
    if (stopMarker?.cumulativeCost && stopMarker?.expectedBenefit) {
      const margin = stopMarker.expectedBenefit - stopMarker.cumulativeCost;
      return margin >= 0
        ? {
          state: 'return-possible',
          label: 'Retour possible',
          summary: `${stopMarker.route} redevient sûre: bénéfice ${stopMarker.expectedBenefit} couvre coût ${stopMarker.cumulativeCost}.`,
          reason: nextChoiceTrigger.trigger,
        }
        : {
          state: 'stay-fallback',
          label: 'Rester en fallback',
          summary: `Retour vers ${stopMarker.route} après ${Math.abs(margin)} point${Math.abs(margin) > 1 ? 's' : ''} de marge de garde récupéré${Math.abs(margin) > 1 ? 's' : ''}.`,
          reason: nextChoiceTrigger.trigger,
        };
    }

    return null;
  };
  const buildGuardFallbackJustification = (opportunityCost) => {
    const fallbackAction = opportunityCost?.fallbackAction ?? null;
    const exposure = fallbackAction?.residualExposure ?? opportunityCost?.residualExposure ?? null;
    const exposedRoutes = exposure?.exposedRoutes ?? [];
    const firstExposedRoute = exposedRoutes[0] ?? null;
    const nextChoiceTrigger = buildGuardNextChoiceTrigger(opportunityCost);
    const primaryReturnSignal = buildGuardPrimaryReturnSignal(opportunityCost, nextChoiceTrigger);

    if (!fallbackAction) {
      return {
        state: 'unavailable',
        label: 'Aucun fallback sûr',
        protectedMargin: 'Marge protégée non calculable sans fallback confirmé.',
        limitingResource: priorityAction.resource ? `${priorityAction.resource} reste la ressource limitante, mais aucun relais sûr n’est classé.` : 'Ressource limitante non identifiée par les signaux actuels.',
        residualExposure: exposure?.residualRisk ?? 'Exposition restante non comparable avec les signaux actuels.',
        ignoredRisk: 'Attendre un signal comparable avant de rouvrir la chaîne de garde.',
      };
    }

    const protectedTarget = fallbackAction.target ?? opportunityCost?.protectedRoute ?? guardAction.route ?? criticalRoute.city;
    const protectedRoute = opportunityCost?.protectedRoute ?? guardAction.route ?? protectedTarget;
    const exposedLabel = firstExposedRoute ? `${firstExposedRoute.route}/${firstExposedRoute.city}` : opportunityCost?.delayedRoute ?? 'la route suivante';

    return {
      state: 'available',
      label: `Pourquoi ${fallbackAction.label}`,
      protectedMargin: `${protectedTarget} garde la marge utile via ${protectedRoute} sans rouvrir toute la chaîne.`,
      limitingResource: priorityAction.resource ? `${priorityAction.resource} reste la ressource limitante; ${fallbackAction.label} évite de la consommer au-delà du premier relais.` : 'Ressource limitante non identifiée par les signaux actuels.',
      residualExposure: exposure?.residualRisk ?? `${exposedLabel} reste à surveiller après ce repli.`,
      ignoredRisk: firstExposedRoute?.tone === 'high'
        ? `Ignorer ce repli laisse ${exposedLabel} critique et peut retarder le bénéfice principal.`
        : `Ignorer ce repli risque de relancer une garde moins rentable sur ${exposedLabel}.`,
      nextChoiceTrigger,
      primaryReturnSignal,
    };
  };
  if (guardOpportunityCost.fallbackAction) {
    guardOpportunityCost.fallbackAction.fallbackJustification = buildGuardFallbackJustification(guardOpportunityCost);
  }
  const buildGuardDecisionSummary = (opportunityCost) => {
    const fallbackJustification = buildGuardFallbackJustification(opportunityCost);
    if (!opportunityCost) {
      return {
        state: 'unknown',
        action: 'wait-for-signals',
        label: 'Décision garde inconnue',
        summary: 'Synthèse indisponible: les signaux de garde ne sont pas comparables.',
        reason: 'Aucun coût d’opportunité exploitable.',
        fallbackJustification,
      };
    }

    if (opportunityCost.canContinueWithoutCriticalDelay || opportunityCost.state === 'continue') {
      return {
        state: 'continue',
        action: 'continue-guard',
        label: 'Continuer la garde',
        summary: `Continuer vers ${opportunityCost.delayedRoute ?? 'le segment suivant'}: aucune route critique retardée.`,
        reason: opportunityCost.stopReason ?? 'Le coût reste couvert par le bénéfice attendu.',
        fallbackJustification,
      };
    }

    const exposure = opportunityCost.fallbackAction?.residualExposure ?? opportunityCost.residualExposure ?? null;
    const exposedRoutes = exposure?.exposedRoutes ?? [];
    const comparableExposure = exposure?.state === 'traced' && exposedRoutes.length > 0;
    const urgentExposure = comparableExposure && exposedRoutes.some((route) => route.tone === 'high');

    if (opportunityCost.fallbackAction && urgentExposure) {
      return {
        state: 'fallback',
        action: 'use-fallback',
        label: 'Basculer sur le fallback',
        summary: `${opportunityCost.fallbackAction.label}: réduit le risque principal sans rouvrir la chaîne.`,
        reason: exposure.residualRisk,
        fallbackJustification,
      };
    }

    if (comparableExposure) {
      return {
        state: 'watch',
        action: 'accept-exposure',
        label: 'Accepter l’exposition ce tour',
        summary: `${exposedRoutes.map((route) => route.route).join(', ')} reste à surveiller après le bénéfice principal.`,
        reason: exposure.benefit,
        fallbackJustification,
      };
    }

    return {
      state: 'watch',
      action: 'accept-exposure',
      label: 'Accepter l’exposition à surveiller',
      summary: exposure?.residualRisk ?? 'Exposition restante non comparable avec les signaux actuels.',
      reason: exposure?.benefit ?? 'Fallback neutre: aucune route restante traçable précisément.',
      fallbackJustification,
    };
  };
  const guardDecisionSummary = buildGuardDecisionSummary(guardOpportunityCost);

  return {
    state: secondaryRoutes.length > 0 ? 'chain' : 'single',
    criticalRoute,
    secondaryRoutes,
    summary: `${criticalRoute.route} est la route voisine critique; ${secondaryRoutes.length > 0 ? `${secondaryRoutes.length} route${secondaryRoutes.length > 1 ? 's' : ''} secondaire${secondaryRoutes.length > 1 ? 's' : ''} exposée${secondaryRoutes.length > 1 ? 's' : ''}.` : 'aucune autre route secondaire exposée.'}`,
    dependencyTrace: `${source} → ${criticalRoute.route}/${criticalRoute.city} → ${consequence}`,
    guardAction,
    guardComparison,
    guardSequencing,
    guardOpportunityCost,
    guardDecisionSummary,
  };
}

function buildPrimaryLogisticsQueueAction(priorityAction, selectedActionPreview, queuedLogisticsActions = []) {
  if (!priorityAction) {
    return {
      actionId: null,
      label: 'Aucune action logistique à engager',
      status: 'empty',
      disabled: true,
      cost: '—',
      delay: '—',
      gain: 'Projection insuffisante',
      downstreamImpact: 'Aucune pénurie aval claire détectée.',
      queueWarning: 'Sélectionnez une route logistique ou attendez plus de données.',
    };
  }

  const sameRoute = queuedLogisticsActions.find((entry) => entry.routeId === priorityAction.routeId) ?? null;
  const sameAction = queuedLogisticsActions.find((entry) => entry.actionId === priorityAction.actionId || (entry.routeId === priorityAction.routeId && entry.choiceId === priorityAction.choiceId)) ?? null;
  const status = sameAction ? 'redundant' : sameRoute ? 'conflict' : selectedActionPreview.criticalRemaining ? 'risky' : 'ready';
  const queueWarning = sameAction
    ? 'Action déjà en file: confirmer ajouterait un doublon.'
    : sameRoute
      ? `Conflit potentiel avec ${sameRoute.label ?? sameRoute.actionId}: même route déjà planifiée.`
      : status === 'risky'
        ? 'Action engageable, mais une pénurie critique peut rester après résolution.'
        : 'Prêt à engager depuis la carte.';

  return {
    actionId: priorityAction.actionId,
    routeId: priorityAction.routeId,
    choiceId: priorityAction.choiceId,
    label: priorityAction.action,
    status,
    disabled: status === 'redundant' || status === 'conflict',
    cost: priorityAction.cost,
    delay: priorityAction.delay,
    gain: priorityAction.impact,
    downstreamImpact: selectedActionPreview.summary,
    target: priorityAction.route,
    bottleneckRelieved: priorityAction.reason.split(';')[0] ?? 'goulot logistique',
    downstreamEffect: selectedActionPreview.projectedState,
    queueWarning,
  };
}

export function buildProvinceLogisticsChoicePreview(province, economyView, options = {}) {
  const normalizedOptions = requireObject(options, 'ProvinceLogisticsChoicePreview options');
  const resourceLabelById = requireObject(normalizedOptions.resourceLabelById ?? {}, 'ProvinceLogisticsChoicePreview resourceLabelById');
  const queuedLogisticsActions = Array.isArray(normalizedOptions.queuedLogisticsActions) ? normalizedOptions.queuedLogisticsActions : [];

  if (!province || !economyView) {
    return { recommendedOptionId: null, timelineStatus: 'empty', timelineSummary: 'Aucune action route/logistique en file: timeline vide.', downstreamStatus: 'neutre', downstreamSummary: 'Aucune pénurie aval claire détectée.', priorityActions: [], prioritySummary: 'Aucune action logistique prioritaire disponible.', recoveryLeverRanking: buildRecoveryLeverRanking([], [], false), selectedActionPreview: buildSelectedActionImpactPreview(null, []), secondaryBottleneckPreview: buildSecondaryBottleneckPreview(null, []), primarySecondaryTradeoff: buildPrimarySecondaryTradeoff(null, buildSelectedActionImpactPreview(null, []), buildSecondaryBottleneckPreview(null, [])), secondaryChoiceRelapsePreview: buildSecondaryChoiceRelapsePreview(null, buildSelectedActionImpactPreview(null, []), buildSecondaryBottleneckPreview(null, []), null), localRecoveryCapacityConflictWarning: buildLocalRecoveryCapacityConflictWarning(null, []), adjacentRouteSpilloverRisk: buildAdjacentRouteSpilloverRisk(null, []), primaryLogisticsAction: buildPrimaryLogisticsQueueAction(null, buildSelectedActionImpactPreview(null, []), queuedLogisticsActions), status: 'stable', summary: 'Aucune donnée logistique disponible.', options: [] };
  }

  const cities = economyView.overlay?.cities ?? [];
  const routes = economyView.overlay?.routes ?? [];
  const tensionByCityId = Object.fromEntries((economyView.comparison?.rows ?? []).map((row) => [row.cityId, row.tensionLevel ?? 'low']));
  const provinceCities = cities.filter((city) => city.regionId === province.provinceId);
  const provinceCityIds = new Set(provinceCities.map((city) => city.cityId));

  const routeChoices = routes
    .filter((route) => route.cityIds.some((cityId) => provinceCityIds.has(cityId)))
    .map((route) => {
      const localCityId = route.cityIds.find((cityId) => provinceCityIds.has(cityId));
      const localCity = provinceCities.find((city) => city.cityId === localCityId) ?? provinceCities[0];
      const localTension = tensionByCityId[localCity?.cityId] ?? 'low';
      return localCity ? buildChoiceForRoute(route, localCity, localTension, resourceLabelById, { cities, routes, tensionByCityId }) : null;
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score || left.action.localeCompare(right.action))
    .slice(0, 4)
    .map((choice, index) => ({
      ...choice,
      optionId: `${province.provinceId}:${choice.routeId}:${index}`,
      recommended: index === 0,
    }));

  if (routeChoices.length === 0) {
    return {
      recommendedOptionId: null,
      timelineStatus: 'empty',
      timelineSummary: 'Aucune action route/logistique en file: timeline vide.',
      downstreamStatus: 'neutre',
      downstreamSummary: 'Aucune pénurie aval claire détectée.',
      priorityActions: [],
      prioritySummary: 'Aucune action logistique prioritaire disponible.',
      recoveryLeverRanking: buildRecoveryLeverRanking([], [], false),
      selectedActionPreview: buildSelectedActionImpactPreview(null, []),
      secondaryBottleneckPreview: buildSecondaryBottleneckPreview(null, []),
      primarySecondaryTradeoff: buildPrimarySecondaryTradeoff(null, buildSelectedActionImpactPreview(null, []), buildSecondaryBottleneckPreview(null, [])),
      secondaryChoiceRelapsePreview: buildSecondaryChoiceRelapsePreview(null, buildSelectedActionImpactPreview(null, []), buildSecondaryBottleneckPreview(null, []), null),
      localRecoveryCapacityConflictWarning: buildLocalRecoveryCapacityConflictWarning(null, []),
      adjacentRouteSpilloverRisk: buildAdjacentRouteSpilloverRisk(null, []),
      primaryLogisticsAction: buildPrimaryLogisticsQueueAction(null, buildSelectedActionImpactPreview(null, []), queuedLogisticsActions),
      status: 'stable',
      summary: 'Logistique stable: aucune route liée à la province sélectionnée.',
      options: [],
    };
  }

  const recommended = routeChoices[0];
  const hasBlocker = routeChoices.some((choice) => choice.tone === 'high' || choice.tone === 'medium');
  const priorityActions = buildRecoveryPriorityActions(routeChoices);
  const recommendedPriority = priorityActions[0] ?? null;
  const recoveryLeverRanking = buildRecoveryLeverRanking(routeChoices, priorityActions, hasBlocker);
  const selectedActionPreview = buildSelectedActionImpactPreview(recommendedPriority, routeChoices);
  const secondaryBottleneckPreview = buildSecondaryBottleneckPreview(recommendedPriority, routeChoices);
  const primarySecondaryTradeoff = buildPrimarySecondaryTradeoff(recommendedPriority, selectedActionPreview, secondaryBottleneckPreview);
  const secondaryChoiceRelapsePreview = buildSecondaryChoiceRelapsePreview(recommendedPriority, selectedActionPreview, secondaryBottleneckPreview, primarySecondaryTradeoff);
  const localRecoveryCapacityConflictWarning = buildLocalRecoveryCapacityConflictWarning(recommendedPriority, routeChoices);
  const adjacentRouteSpilloverRisk = buildAdjacentRouteSpilloverRisk(recommendedPriority, routeChoices);
  const primaryLogisticsAction = buildPrimaryLogisticsQueueAction(recommendedPriority, selectedActionPreview, queuedLogisticsActions);

  return {
    recommendedOptionId: recommended.optionId,
    recoveryChoiceCount: recommended.recoveryChoices.length,
    timelineStatus: hasBlocker ? 'queued' : 'empty',
    timelineSummary: hasBlocker
      ? `${recommended.recoveryChoices[0].label}: amélioration visible au prochain tour; goulot ${recommended.recoveryChoices[0].bottleneck.label}. ${recommended.recoveryChoices[0].timeline[2].detail}`
      : 'Aucune action route/logistique en file: timeline vide.',
    downstreamStatus: hasBlocker ? recommended.recoveryChoices[0].downstreamShortages[0]?.status ?? 'inconnue' : 'neutre',
    downstreamSummary: hasBlocker
      ? `${recommended.recoveryChoices[0].downstreamShortages[0]?.status ?? 'inconnue'}: ${recommended.recoveryChoices[0].downstreamShortages[0]?.detail ?? 'Aucune pénurie aval claire détectée.'}`
      : 'Aucune pénurie aval claire détectée.',
    priorityActions,
    prioritySummary: recommendedPriority
      ? `${recommendedPriority.action} recommandée: ${recommendedPriority.reason} (${recommendedPriority.tradeoff}, ${recommendedPriority.delay}).`
      : 'Aucune action logistique prioritaire disponible.',
    recoveryLeverRanking,
    selectedActionPreview,
    secondaryBottleneckPreview,
    primarySecondaryTradeoff,
    secondaryChoiceRelapsePreview,
    localRecoveryCapacityConflictWarning,
    adjacentRouteSpilloverRisk,
    primaryLogisticsAction,
    status: hasBlocker ? recommended.tone : 'stable',
    summary: hasBlocker
      ? `${recommended.action} recommandé sur ${recommended.routes[0]}: ${recommended.cause} ${recommended.recoveryChoices[0].label} est prioritaire car ${recommended.recoveryChoices[0].benefit}`
      : `Logistique stable: ${recommended.routes[0]} et ${recommended.affectedCity} restent couverts.`,
    options: routeChoices,
  };
}
