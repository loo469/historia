function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function requireArray(value, label) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${label} must be an array.`);
  }

  return value;
}

const STATUS_RANK = Object.freeze({ blocked: 3, risky: 2, ready: 1, empty: 0 });

function getWarningTone(status) {
  return status === 'blocked' ? 'critical' : status === 'risky' ? 'warning' : 'stable';
}

function buildPlanWarning(province, plan, budgetStatus) {
  const resource = plan.consumedResources?.[0] ?? { label: 'ressource', quantity: plan.costUnits ?? 0 };
  const route = plan.routeNames?.[0] ?? 'route locale';
  const status = plan.status === 'blocked' ? 'blocked' : plan.status === 'risky' ? 'risky' : budgetStatus;

  return {
    tone: getWarningTone(status),
    status,
    provinceId: province.provinceId,
    provinceLabel: province.label ?? province.provinceId,
    label: status === 'blocked' ? 'Blocage budget' : status === 'risky' ? 'Compromis logistique' : 'Capacité sécurisée',
    detail: `${province.label ?? province.provinceId}: ${plan.logisticsAction} sollicite ${resource.quantity} ${resource.label} via ${route}; ${plan.surplusOrShortage}.`,
    routeName: route,
    resourceLabel: resource.label,
    score: (STATUS_RANK[status] ?? 0) * 100 + (plan.risk ?? 0) + (plan.costUnits ?? 0),
  };
}

function buildChoiceWarning(province, choice) {
  const status = choice.tone === 'high' ? 'risky' : 'ready';
  const resource = choice.resources?.[0] ?? 'ressource';
  const route = choice.routes?.[0] ?? 'route locale';

  return {
    tone: getWarningTone(status),
    status,
    provinceId: province.provinceId,
    provinceLabel: province.label ?? province.provinceId,
    label: choice.tone === 'high' ? 'Route sous stress' : 'Route surveillée',
    detail: `${province.label ?? province.provinceId}: ${route} garde un risque ${choice.residualRisk ?? 0} sur ${resource}.`,
    routeName: route,
    resourceLabel: resource,
    score: (choice.tone === 'high' ? 180 : 80) + (choice.residualRisk ?? 0),
  };
}

export function buildEconomyReadinessWarnings(provinces, options = {}) {
  const normalizedProvinces = requireArray(provinces, 'EconomyReadinessWarnings provinces');
  const normalizedOptions = requireObject(options, 'EconomyReadinessWarnings options');
  const budgetByProvinceId = requireObject(normalizedOptions.budgetByProvinceId ?? {}, 'EconomyReadinessWarnings budgetByProvinceId');
  const logisticsByProvinceId = requireObject(normalizedOptions.logisticsByProvinceId ?? {}, 'EconomyReadinessWarnings logisticsByProvinceId');
  const maxWarnings = Number.isInteger(normalizedOptions.maxWarnings) && normalizedOptions.maxWarnings > 0 ? normalizedOptions.maxWarnings : 3;

  const warnings = normalizedProvinces.flatMap((province) => {
    const budget = budgetByProvinceId[province.provinceId] ?? null;
    const logistics = logisticsByProvinceId[province.provinceId] ?? null;
    const planWarnings = (budget?.plans ?? [])
      .filter((plan) => ['blocked', 'risky'].includes(plan.status) || budget.status === 'blocked')
      .map((plan) => buildPlanWarning(province, plan, budget.status));

    if (planWarnings.length > 0) {
      return planWarnings;
    }

    const topChoice = logistics?.options?.[0] ?? null;
    return topChoice && topChoice.tone === 'high' ? [buildChoiceWarning(province, topChoice)] : [];
  })
    .sort((left, right) => right.score - left.score || left.provinceLabel.localeCompare(right.provinceLabel))
    .slice(0, maxWarnings);

  if (warnings.length === 0) {
    return {
      status: 'ready',
      summary: 'Capacités économie/logistique lisibles: aucun blocage majeur avant validation du tour.',
      warnings: [],
    };
  }

  const blockedCount = warnings.filter((warning) => warning.status === 'blocked').length;
  const riskyCount = warnings.filter((warning) => warning.status === 'risky').length;

  return {
    status: blockedCount > 0 ? 'blocked' : 'risky',
    summary: blockedCount > 0
      ? `${blockedCount} blocage${blockedCount > 1 ? 's' : ''} économie/logistique à lever avant fin de tour.`
      : `${riskyCount} compromis économie/logistique à confirmer avant fin de tour.`,
    warnings,
  };
}
