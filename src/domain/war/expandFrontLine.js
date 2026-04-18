import { Province } from './Province.js';

function requireProvince(province) {
  if (!(province instanceof Province)) {
    throw new TypeError('expandFrontLine province must be a Province instance.');
  }

  return province;
}

function requireSegment(segment) {
  if (!segment || typeof segment !== 'object' || Array.isArray(segment)) {
    throw new TypeError('expandFrontLine segment must be an object.');
  }

  const provinceAId = String(segment.provinceAId ?? '').trim();
  const provinceBId = String(segment.provinceBId ?? '').trim();

  if (!provinceAId || !provinceBId) {
    throw new RangeError('expandFrontLine segment must define provinceAId and provinceBId.');
  }

  return {
    ...segment,
    provinceAId,
    provinceBId,
  };
}

export function expandFrontLine({ attackerFactionId, targetProvince, segment, pressureDelta = 0 }) {
  const normalizedAttackerFactionId = String(attackerFactionId ?? '').trim();

  if (!normalizedAttackerFactionId) {
    throw new RangeError('expandFrontLine attackerFactionId is required.');
  }

  const province = requireProvince(targetProvince);
  const normalizedSegment = requireSegment(segment);

  if (!Number.isInteger(pressureDelta)) {
    throw new RangeError('expandFrontLine pressureDelta must be an integer.');
  }

  if (
    normalizedSegment.provinceAId !== province.id &&
    normalizedSegment.provinceBId !== province.id
  ) {
    return {
      expanded: false,
      reason: 'segment-mismatch',
      province,
    };
  }

  if (province.controllingFactionId === normalizedAttackerFactionId) {
    return {
      expanded: false,
      reason: 'already-controlled',
      province,
    };
  }

  if (pressureDelta <= 0) {
    return {
      expanded: false,
      reason: 'insufficient-pressure',
      province,
    };
  }

  const expandedProvince = province.withControllingFaction(normalizedAttackerFactionId);

  return {
    expanded: true,
    reason: 'expanded',
    province: expandedProvince,
  };
}
