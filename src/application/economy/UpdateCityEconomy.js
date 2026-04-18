import { produceResources } from './ProduceResources.js';
import { consumeNeeds } from './ConsumeNeeds.js';

function requireObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function normalizeCity(city) {
  const normalizedCity = requireObject(city, 'UpdateCityEconomy city');

  if (typeof normalizedCity.id !== 'string' || normalizedCity.id.trim().length === 0) {
    throw new RangeError('UpdateCityEconomy city.id is required.');
  }

  return {
    ...normalizedCity,
    id: normalizedCity.id.trim(),
    stockByResource: requireObject(
      normalizedCity.stockByResource ?? {},
      'UpdateCityEconomy city.stockByResource',
    ),
  };
}

function normalizeProductionRules(rules) {
  if (!Array.isArray(rules)) {
    throw new TypeError('UpdateCityEconomy productionRules must be an array.');
  }

  return rules.map((rule, index) => ({
    ...requireObject(rule, `UpdateCityEconomy productionRules[${index}]`),
  }));
}

function normalizeNeeds(needs) {
  if (!Array.isArray(needs)) {
    throw new TypeError('UpdateCityEconomy needs must be an array.');
  }

  return needs.map((need, index) => ({
    ...requireObject(need, `UpdateCityEconomy needs[${index}]`),
  }));
}

export function updateCityEconomy({ city, productionRules = [], needs = [] }) {
  const normalizedCity = normalizeCity(city);
  const normalizedProductionRules = normalizeProductionRules(productionRules);
  const normalizedNeeds = normalizeNeeds(needs);

  let currentCity = {
    ...normalizedCity,
    stockByResource: { ...normalizedCity.stockByResource },
  };
  let totalWorkforceUsed = 0;
  const productionResults = [];

  for (const rule of normalizedProductionRules) {
    const productionResult = produceResources({
      city: currentCity,
      rule,
      stockByResource: currentCity.stockByResource,
    });

    productionResults.push({
      ruleId: rule.id ?? null,
      ...productionResult,
    });

    currentCity = {
      ...currentCity,
      workforce: Math.max(0, (currentCity.workforce ?? 0) - productionResult.workforceUsed),
      stockByResource: { ...productionResult.nextStockByResource },
    };
    totalWorkforceUsed += productionResult.workforceUsed;
  }

  const consumptionResult = consumeNeeds(currentCity, normalizedNeeds);

  return {
    city: consumptionResult.city,
    productionResults,
    consumption: consumptionResult.consumption,
    shortages: consumptionResult.shortages,
    producedByResource: productionResults.reduce((summary, result) => {
      for (const [resourceId, quantity] of Object.entries(result.producedByResource ?? {})) {
        summary[resourceId] = (summary[resourceId] ?? 0) + quantity;
      }
      return summary;
    }, {}),
    consumedByResource: consumptionResult.consumption.reduce((summary, entry) => {
      summary[entry.resourceId] = (summary[entry.resourceId] ?? 0) + entry.consumedQuantity;
      return summary;
    }, {}),
    workforceUsed: totalWorkforceUsed,
    workforceRemaining: currentCity.workforce ?? 0,
    executedProductionRuleCount: productionResults.filter((result) => result.executed).length,
    shortageCount: consumptionResult.shortageCount,
  };
}
