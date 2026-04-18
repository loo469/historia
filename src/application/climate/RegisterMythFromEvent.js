import { Catastrophe } from '../../domain/climate/Catastrophe.js';
import { Myth } from '../../domain/climate/Myth.js';

function normalizeEvent(event) {
  if (event instanceof Catastrophe) {
    return event;
  }

  if (event === null || typeof event !== 'object' || Array.isArray(event)) {
    throw new RangeError('RegisterMythFromEvent event must be an object or Catastrophe.');
  }

  return new Catastrophe(event);
}

function normalizeCreatedAt(createdAt) {
  return createdAt ?? new Date();
}

function pickCategory(event) {
  if (event.type === 'drought' || event.type === 'flood') {
    return 'catastrophe';
  }

  return 'omen';
}

function pickTitle(event) {
  const titles = {
    drought: 'The Withering Season',
    flood: 'The River Without Mercy',
    heatwave: 'The Burning Sky',
  };

  return titles[event.type] ?? `The Sign of ${event.type}`;
}

function buildSummary(event) {
  const regionList = event.regionIds.join(', ');
  return `${event.type} struck ${regionList} with ${event.severity} force.`;
}

function deriveCredibility(event) {
  const base = {
    minor: 35,
    major: 58,
    critical: 76,
  }[event.severity] ?? 40;

  return Math.max(0, Math.min(100, base + (event.isResolved ? -6 : 8)));
}

export class RegisterMythFromEvent {
  execute({ event, createdAt = new Date() } = {}) {
    const normalizedEvent = normalizeEvent(event);
    const mythCreatedAt = normalizeCreatedAt(createdAt);

    const myth = new Myth({
      id: `myth-${normalizedEvent.id}`,
      title: pickTitle(normalizedEvent),
      category: pickCategory(normalizedEvent),
      originEventIds: [normalizedEvent.id],
      summary: buildSummary(normalizedEvent),
      credibility: deriveCredibility(normalizedEvent),
      regions: normalizedEvent.regionIds,
      tags: [normalizedEvent.type, normalizedEvent.severity, normalizedEvent.status],
      createdAt: mythCreatedAt,
    });

    return {
      myth,
      sourceEvent: normalizedEvent,
    };
  }
}
