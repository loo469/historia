function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function getChoiceCostUnits(choice) {
  if (choice.action === 'Réparer route') {
    return 4;
  }

  if (choice.action === 'Sécuriser convoi') {
    return 3;
  }

  if (choice.action === 'Détourner flux') {
    return 2;
  }

  if (choice.action === 'Stocker localement') {
    return 2;
  }

  return 1;
}

function getBudgetStatus({ availableStock, costUnits, residualRisk, tensionLevel, actionStatus }) {
  if (actionStatus === 'blocked' || availableStock < costUnits) {
    return 'blocked';
  }

  if (actionStatus === 'risky' || residualRisk >= 55 || tensionLevel === 'high' || availableStock - costUnits <= 2) {
    return 'risky';
  }

  return 'ready';
}

function getStatusTone(status) {
  return status === 'blocked' ? 'danger' : status === 'risky' ? 'warning' : 'success';
}

function getResourceStock(city, resourceLabel) {
  const resourceKey = String(resourceLabel ?? '').toLowerCase();
  const entry = (city.resources?.entries ?? []).find((candidate) => {
    const candidateKey = String(candidate.resourceId ?? '').toLowerCase();
    return candidateKey === resourceKey || resourceKey.includes(candidateKey) || candidateKey.includes(resourceKey);
  });

  return entry?.quantity ?? city.resources?.totalStock ?? 0;
}

export function buildProvinceEconomyBudgetPreview(province, economyView, options = {}) {
  const normalizedOptions = requireObject(options, 'ProvinceEconomyBudgetPreview options');
  const actionQueue = Array.isArray(normalizedOptions.actionQueue) ? normalizedOptions.actionQueue : [];
  const logisticsChoices = Array.isArray(normalizedOptions.logisticsChoices) ? normalizedOptions.logisticsChoices : [];

  if (!province || !economyView) {
    return {
      status: 'empty',
      summary: 'Aucun budget économie disponible pour ce plan de province.',
      totalCost: 0,
      plans: [],
    };
  }

  const cities = economyView.overlay?.cities ?? [];
  const tensionRows = economyView.comparison?.rows ?? [];
  const provinceCities = cities.filter((city) => city.regionId === province.provinceId);
  const fallbackCity = provinceCities[0] ?? null;
  const tensionByCityId = Object.fromEntries(tensionRows.map((row) => [row.cityId, row.tensionLevel ?? 'low']));
  const choices = logisticsChoices.length > 0 ? logisticsChoices : [];

  const plans = choices.slice(0, 4).map((choice, index) => {
    const action = actionQueue[index] ?? actionQueue[0] ?? { label: choice.action, status: 'ready' };
    const hub = provinceCities.find((city) => city.cityName === choice.affectedCity) ?? fallbackCity;
    const resourceLabel = choice.resources?.[0] ?? 'réserve locale';
    const availableStock = hub ? getResourceStock(hub, resourceLabel) : 0;
    const costUnits = getChoiceCostUnits(choice);
    const tensionLevel = hub ? tensionByCityId[hub.cityId] ?? 'low' : 'low';
    const status = getBudgetStatus({
      availableStock,
      costUnits,
      residualRisk: choice.residualRisk ?? 0,
      tensionLevel,
      actionStatus: action.status,
    });
    const remainingStock = Math.max(0, availableStock - costUnits);
    const surplusOrShortage = availableStock >= costUnits
      ? `${remainingStock} unité${remainingStock > 1 ? 's' : ''} restante${remainingStock > 1 ? 's' : ''}`
      : `${costUnits - availableStock} unité${costUnits - availableStock > 1 ? 's' : ''} manquante${costUnits - availableStock > 1 ? 's' : ''}`;

    return {
      planId: `${province.provinceId}:budget:${choice.optionId ?? index}`,
      actionCode: action.actionCode ?? null,
      actionLabel: action.label ?? choice.action,
      logisticsAction: choice.action,
      status,
      tone: getStatusTone(status),
      costUnits,
      consumedResources: [{ label: resourceLabel, quantity: costUnits }],
      routeNames: choice.routes ?? [],
      hubName: hub?.cityName ?? choice.affectedCity ?? 'hub local',
      availableStock,
      surplusOrShortage,
      effect: status === 'blocked'
        ? `${resourceLabel}: budget insuffisant, action impossible sans stock ou relais.`
        : status === 'risky'
          ? `${resourceLabel}: action possible mais risque de pénurie/surcharge sur ${hub?.cityName ?? 'le hub'}.`
          : `${resourceLabel}: coût absorbable, surplus conservé pour le prochain tour.`,
      risk: choice.residualRisk ?? 0,
    };
  });

  if (plans.length === 0) {
    return {
      status: 'empty',
      summary: `Aucun coût économie/logistique à budgéter sur ${province.label ?? province.provinceId}.`,
      totalCost: 0,
      plans: [],
    };
  }

  const blockedCount = plans.filter((plan) => plan.status === 'blocked').length;
  const riskyCount = plans.filter((plan) => plan.status === 'risky').length;
  const totalCost = plans.reduce((sum, plan) => sum + plan.costUnits, 0);
  const status = blockedCount > 0 ? 'blocked' : riskyCount > 0 ? 'risky' : 'ready';
  const lead = plans[0];

  return {
    status,
    summary: blockedCount > 0
      ? `${blockedCount} action économie impossible: renforcer les stocks avant de lancer le tour.`
      : riskyCount > 0
        ? `${riskyCount} action${riskyCount > 1 ? 's' : ''} à risque: ${lead.logisticsAction} consomme ${lead.costUnits} ${lead.consumedResources[0].label}.`
        : `Budget soutenable: ${totalCost} unités engagées, ${lead.hubName} conserve un surplus lisible.`,
    totalCost,
    plans,
  };
}
