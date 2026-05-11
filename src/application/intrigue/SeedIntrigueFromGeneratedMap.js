import { Cellule } from '../../domain/intrigue/Cellule.js';
import { OperationClandestine } from '../../domain/intrigue/OperationClandestine.js';
import { NiveauAlerte } from '../../domain/intrigue/NiveauAlerte.js';
import {
  clampInteger,
  extractGeneratedMapProvinces,
  normalizeGeneratedMapProvince,
  requirePlainObject,
  requireText,
} from '../war/strategicMapContract.js';

const DEFAULT_NETWORK_FACTION_ID = 'shadow-network';
const DEFAULT_OPERATION_TYPE = 'sabotage';
const PRESENCE_THRESHOLD = 45;
const SABOTAGE_THRESHOLD = 65;

const SUPPLY_RISK_BY_LEVEL = Object.freeze({
  abundant: 0,
  secure: 0,
  stable: 0,
  strained: 8,
  disrupted: 12,
  low: 12,
  critical: 18,
  collapsed: 18,
  depleted: 18,
});

const requireObject = requirePlainObject;

function slugify(value) {
  return requireText(value, 'SeedIntrigueFromGeneratedMap slug value')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'province';
}

function normalizeProvince(province) {
  const normalizedProvince = normalizeGeneratedMapProvince(
    province,
    'SeedIntrigueFromGeneratedMap province',
    { requireOwner: true },
  );

  return {
    ...normalizedProvince,
    ownerFactionId: requireText(normalizedProvince.ownerFactionId, 'SeedIntrigueFromGeneratedMap province ownerFactionId'),
    controllingFactionId: requireText(
      normalizedProvince.controllingFactionId ?? normalizedProvince.ownerFactionId,
      'SeedIntrigueFromGeneratedMap province controllingFactionId',
    ),
  };
}

function computeSabotageRiskScore(province) {
  const strategicPressure = province.strategicValue * 6;
  const loyaltyPressure = (100 - province.loyalty) * 0.35;
  const contestPressure = province.contested ? 22 : 0;
  const occupationPressure = province.ownerFactionId !== province.controllingFactionId ? 15 : 0;
  const supplyPressure = SUPPLY_RISK_BY_LEVEL[province.supplyLevel] ?? 6;

  return clampInteger(strategicPressure + loyaltyPressure + contestPressure + occupationPressure + supplyPressure, 0, 100);
}

function buildPresenceLevel(score) {
  if (score >= SABOTAGE_THRESHOLD) {
    return 'active-presence';
  }

  if (score >= PRESENCE_THRESHOLD) {
    return 'sleeper-presence';
  }

  return 'no-presence';
}

function buildRiskLevel(score) {
  if (score >= 80) {
    return 'critical';
  }

  if (score >= SABOTAGE_THRESHOLD) {
    return 'high';
  }

  if (score >= PRESENCE_THRESHOLD) {
    return 'watch';
  }

  return 'latent';
}

function buildAlertLevel(maxRiskScore) {
  if (maxRiskScore >= 85) {
    return new NiveauAlerte(4);
  }

  if (maxRiskScore >= 70) {
    return new NiveauAlerte(3);
  }

  if (maxRiskScore >= 50) {
    return new NiveauAlerte(2);
  }

  if (maxRiskScore > 0) {
    return new NiveauAlerte(1);
  }

  return NiveauAlerte.minimum();
}

function buildCellule({ province, riskScore, networkFactionId }) {
  const slug = slugify(province.id);
  const sleeper = riskScore < SABOTAGE_THRESHOLD;

  return new Cellule({
    id: `cell-${slug}`,
    factionId: networkFactionId,
    codename: `Réseau ${province.name}`,
    locationId: province.id,
    memberIds: [`agent-${slug}`],
    assetIds: [`asset-${slug}`],
    secrecy: clampInteger(82 - riskScore / 3, 25, 90),
    loyalty: clampInteger(42 + province.strategicValue * 4, 35, 88),
    exposure: clampInteger(riskScore - 25, 0, 85),
    status: sleeper ? 'dormant' : 'active',
    sleeper,
  });
}

function buildSabotageOperation({ province, riskScore, celluleId }) {
  const slug = slugify(province.id);

  return new OperationClandestine({
    id: `op-sabotage-${slug}`,
    celluleId,
    targetFactionId: province.controllingFactionId,
    type: DEFAULT_OPERATION_TYPE,
    objective: `Déstabiliser ${province.name}`,
    theaterId: province.id,
    assignedAgentIds: [`agent-${slug}`],
    requiredAssetIds: [`asset-${slug}`],
    difficulty: clampInteger(30 + province.strategicValue * 4 + (province.contested ? 10 : 0), 0, 100),
    detectionRisk: clampInteger(20 + riskScore / 2 + (province.contested ? 8 : 0), 0, 100),
    progress: clampInteger(riskScore - 30, 0, 85),
    phase: province.contested || riskScore >= 80 ? 'infiltration' : 'planning',
    heat: clampInteger(riskScore - 20, 0, 90),
  });
}

export function seedIntrigueFromGeneratedMap(generatedMap, options = {}) {
  const normalizedMap = requireObject(generatedMap, 'SeedIntrigueFromGeneratedMap generatedMap');
  const normalizedOptions = requireObject(options, 'SeedIntrigueFromGeneratedMap options');
  const provinces = extractGeneratedMapProvinces(normalizedMap, 'SeedIntrigueFromGeneratedMap generatedMap')
    .map(normalizeProvince)
    .sort((left, right) => left.id.localeCompare(right.id));
  const networkFactionId = requireText(
    normalizedOptions.networkFactionId ?? DEFAULT_NETWORK_FACTION_ID,
    'SeedIntrigueFromGeneratedMap networkFactionId',
  );

  const riskProfiles = provinces.map((province) => {
    const sabotageRiskScore = computeSabotageRiskScore(province);

    return {
      provinceId: province.id,
      provinceName: province.name,
      controllingFactionId: province.controllingFactionId,
      sabotageRiskScore,
      riskLevel: buildRiskLevel(sabotageRiskScore),
      presenceScore: sabotageRiskScore,
      presenceLevel: buildPresenceLevel(sabotageRiskScore),
      drivers: [
        province.strategicValue >= 7 ? 'strategic-value' : null,
        province.loyalty <= 45 ? 'low-loyalty' : null,
        province.contested ? 'contested' : null,
        province.ownerFactionId !== province.controllingFactionId ? 'occupied' : null,
        (SUPPLY_RISK_BY_LEVEL[province.supplyLevel] ?? 0) >= 12 ? 'supply-stress' : null,
      ].filter(Boolean),
    };
  });

  const cellules = [];
  const operations = [];

  for (const riskProfile of riskProfiles) {
    if (riskProfile.sabotageRiskScore < PRESENCE_THRESHOLD) {
      continue;
    }

    const province = provinces.find((candidate) => candidate.id === riskProfile.provinceId);
    const cellule = buildCellule({ province, riskScore: riskProfile.sabotageRiskScore, networkFactionId });
    cellules.push(cellule);

    if (riskProfile.sabotageRiskScore >= SABOTAGE_THRESHOLD) {
      operations.push(buildSabotageOperation({
        province,
        riskScore: riskProfile.sabotageRiskScore,
        celluleId: cellule.id,
      }));
    }
  }

  const maxRiskScore = riskProfiles.reduce(
    (maximum, profile) => Math.max(maximum, profile.sabotageRiskScore),
    0,
  );
  const alertLevel = buildAlertLevel(maxRiskScore);

  return {
    cellules,
    operations,
    alertLevel,
    riskProfiles,
    summary: {
      provinceCount: provinces.length,
      seededCelluleCount: cellules.length,
      seededPresenceCount: cellules.length,
      seededSabotageOperationCount: operations.length,
      maxSabotageRiskScore: maxRiskScore,
      alertCode: alertLevel.code,
    },
  };
}
