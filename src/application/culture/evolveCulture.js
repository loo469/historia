import { Culture } from '../../domain/culture/Culture.js';
import { evaluateCulturalDrift } from './evaluateCulturalDrift.js';

function requireText(value, label) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new RangeError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizeUniqueTexts(values, label) {
  if (!Array.isArray(values)) {
    throw new TypeError(`${label} must be an array.`);
  }

  const normalizedValues = [...new Set(values.map((value) => requireText(value, label)))];
  return normalizedValues.sort();
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeEvolutionInputs(evolutionInputs) {
  if (!evolutionInputs || typeof evolutionInputs !== 'object' || Array.isArray(evolutionInputs)) {
    throw new TypeError('evolveCulture evolutionInputs must be an object.');
  }

  return {
    driftInputs: evolutionInputs.driftInputs ?? {},
    adoptedValueIds: normalizeUniqueTexts(
      evolutionInputs.adoptedValueIds ?? [],
      'evolveCulture evolutionInputs.adoptedValueIds',
    ),
    retiredTraditionIds: normalizeUniqueTexts(
      evolutionInputs.retiredTraditionIds ?? [],
      'evolveCulture evolutionInputs.retiredTraditionIds',
    ),
    emergentTraditionIds: normalizeUniqueTexts(
      evolutionInputs.emergentTraditionIds ?? [],
      'evolveCulture evolutionInputs.emergentTraditionIds',
    ),
    evolvedAt: evolutionInputs.evolvedAt ?? new Date(),
  };
}

function mergeValueIds(culture, adoptedValueIds, drift) {
  const merged = new Set(culture.valueIds);

  for (const valueId of adoptedValueIds) {
    merged.add(valueId);
  }

  if ((drift.values.openness ?? 0) >= 60) {
    merged.add('exchange');
  }

  if ((drift.values.researchDrive ?? 0) >= 60) {
    merged.add('innovation');
  }

  if ((drift.values.cohesion ?? 0) >= 60) {
    merged.add('continuity');
  }

  return [...merged].sort();
}

function evolveTraditions(culture, retiredTraditionIds, emergentTraditionIds) {
  const retired = new Set(retiredTraditionIds);
  const nextTraditions = culture.traditionIds.filter((traditionId) => !retired.has(traditionId));

  return [...new Set([...nextTraditions, ...emergentTraditionIds])].sort();
}

export function evolveCulture(cultureState, evolutionInputs) {
  const culture = cultureState instanceof Culture ? cultureState : new Culture(cultureState);
  const normalizedEvolutionInputs = normalizeEvolutionInputs(evolutionInputs);

  const drift = evaluateCulturalDrift(
    {
      id: `${culture.id}-drift`,
      cultureId: culture.id,
      stability: culture.cohesion,
      values: {
        openness: culture.openness,
        cohesion: culture.cohesion,
        researchDrive: culture.researchDrive,
      },
    },
    normalizedEvolutionInputs.driftInputs,
  );

  return culture.withEvolution({
    openness: clampScore(drift.values.openness ?? culture.openness),
    cohesion: clampScore(drift.stability),
    researchDrive: clampScore(drift.values.researchDrive ?? culture.researchDrive),
    valueIds: mergeValueIds(culture, normalizedEvolutionInputs.adoptedValueIds, drift),
    traditionIds: evolveTraditions(
      culture,
      normalizedEvolutionInputs.retiredTraditionIds,
      normalizedEvolutionInputs.emergentTraditionIds,
    ),
    lastEvolvedAt: normalizedEvolutionInputs.evolvedAt,
  });
}
