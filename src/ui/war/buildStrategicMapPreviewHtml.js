import { buildStrategicMapShell } from './StrategicMapShell.js';

function requireGeneratedMap(generatedMap) {
  if (generatedMap === null || typeof generatedMap !== 'object' || Array.isArray(generatedMap)) {
    throw new TypeError('StrategicMapPreview generatedMap must be an object.');
  }

  if (!Array.isArray(generatedMap.provinces)) {
    throw new TypeError('StrategicMapPreview generatedMap.provinces must be an array.');
  }

  return generatedMap;
}

function requireOptions(options) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('StrategicMapPreview options must be an object.');
  }

  return options;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getCenter(province) {
  const center = province.geometry.center;

  if (center) {
    return center;
  }

  const layout = province.geometry.layout;

  if (!layout) {
    return null;
  }

  return {
    x: layout.x + (layout.w / 2),
    y: layout.y + (layout.h / 2),
  };
}

function buildProvinceRelations(provinces) {
  const provinceById = new Map(provinces.map((province) => [province.provinceId, province]));
  const relations = new Map();

  for (const province of provinces) {
    for (const neighborId of province.neighborIds) {
      const relationId = [province.provinceId, neighborId].sort().join('::');

      if (relations.has(relationId)) {
        continue;
      }

      const neighbor = provinceById.get(neighborId);
      const origin = getCenter(province);
      const destination = neighbor ? getCenter(neighbor) : null;

      if (!neighbor || !origin || !destination) {
        continue;
      }

      relations.set(relationId, {
        relationId,
        origin,
        destination,
        contested: province.contested || neighbor.contested,
        occupied: province.occupied || neighbor.occupied,
      });
    }
  }

  return [...relations.values()];
}

function renderStats(shell, generatedMap) {
  const rows = [
    ['Seed', generatedMap.seed],
    ['Provinces', shell.stats.provinceCount],
    ['Fronts contestés', shell.stats.contestedCount],
    ['Occupations', shell.stats.occupiedCount],
    ['Loyauté moyenne', `${shell.stats.averageLoyalty}%`],
  ];

  return rows.map(([label, value]) => `
    <article class="stat-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `).join('');
}

function renderLegend(shell) {
  return shell.legend.factions.map((faction) => `
    <li>
      <span class="legend-swatch" style="--fill:${escapeHtml(faction.color)};--border:${escapeHtml(faction.border)}"></span>
      <span>${escapeHtml(faction.label)}</span>
    </li>
  `).join('');
}

function buildReadableRelationPath(relation, index) {
  const dx = relation.destination.x - relation.origin.x;
  const dy = relation.destination.y - relation.origin.y;
  const length = Math.hypot(dx, dy) || 1;
  const bend = ((index % 3) - 1) * 2.8;
  const controlX = ((relation.origin.x + relation.destination.x) / 2) - (dy / length) * bend;
  const controlY = ((relation.origin.y + relation.destination.y) / 2) + (dx / length) * bend;

  return `M ${relation.origin.x} ${relation.origin.y} Q ${controlX.toFixed(2)} ${controlY.toFixed(2)} ${relation.destination.x} ${relation.destination.y}`;
}

function renderRelationLines(shell) {
  return buildProvinceRelations(shell.provinces).map((relation, index) => {
    const pathD = buildReadableRelationPath(relation, index);

    return `
      <g class="relation-link">
        <path class="relation-line-casing" d="${pathD}"></path>
        <path class="relation-line ${relation.contested ? 'is-contested' : relation.occupied ? 'is-occupied' : ''}" d="${pathD}"></path>
      </g>
    `;
  }).join('');
}

function getLabelAnchorOffset(align) {
  if (align === 'start') {
    return { rectX: 0, textPadding: 1.2 };
  }

  if (align === 'end') {
    return { rectX: -19.2, textPadding: -1.2 };
  }

  return { rectX: -9.6, textPadding: 0 };
}

function getProvinceLabelModel(province) {
  const center = getCenter(province);
  const label = province.geometry.labelLayout ?? center;

  if (!label || !center) {
    return null;
  }

  const align = label.align ?? 'middle';
  const offset = getLabelAnchorOffset(align);

  return {
    ...label,
    align,
    center,
    leaderNeeded: Math.abs(label.x - center.x) > 4 || Math.abs(label.y - center.y) > 4,
    titleX: label.x + offset.textPadding,
    rectX: label.x + offset.rectX,
    rectY: label.y - 4.4,
    subtitleY: label.y + 4.25,
    width: 19.2,
    height: 7.8,
  };
}

function renderProvinceShapes(shell) {
  return shell.provinces.map((province) => {
    const polygon = province.geometry.polygon;
    const label = getProvinceLabelModel(province);

    if (!polygon || !label) {
      return '';
    }

    const classes = [
      'province',
      province.contested ? 'is-contested' : '',
      province.occupied ? 'is-occupied' : '',
      province.selectionState.selected ? 'is-selected' : '',
      province.selectionState.focused ? 'is-focused' : '',
      province.selectionState.queued ? 'is-queued' : '',
      shell.afterActionMapRecap.affectedProvinceIds.includes(province.provinceId) ? 'is-recently-affected' : '',
    ].filter(Boolean).join(' ');

    return `
      <g class="${classes}" tabindex="0" aria-label="${escapeHtml(province.ariaLabel)}" style="--fill:${escapeHtml(province.style.fill)};--border:${escapeHtml(province.style.border)}">
        <polygon class="province-shape" points="${escapeHtml(polygon)}"></polygon>
        ${label.leaderNeeded ? `<path class="province-label-leader" d="M ${label.center.x} ${label.center.y} L ${label.x} ${label.y - 1.5}"></path>` : ''}
        <rect class="province-label-plate" x="${label.rectX}" y="${label.rectY}" width="${label.width}" height="${label.height}" rx="1.4" ry="1.4"></rect>
        <text class="province-label" x="${label.titleX}" y="${label.y}" text-anchor="${escapeHtml(label.align)}">${escapeHtml(province.label)}</text>
        <text class="province-meta" x="${label.titleX}" y="${label.subtitleY}" text-anchor="${escapeHtml(label.align)}">${escapeHtml(province.contested ? 'Front' : province.occupied ? 'Occupation' : `Valeur ${province.strategicValue}`)}</text>
      </g>
    `;
  }).join('');
}

function renderProvinceTable(shell) {
  return shell.provinces.map((province) => `
    <tr>
      <td>${escapeHtml(province.label)}</td>
      <td>${escapeHtml(province.controllingFactionId)}</td>
      <td>${escapeHtml(province.supplyLevel)}</td>
      <td>${province.loyalty}%</td>
      <td>${province.strategicValue}</td>
      <td>${province.contested ? 'oui' : 'non'}</td>
    </tr>
  `).join('');
}

function renderKeyboardActionPlanner(shell) {
  const preview = shell.keyboardActionPlanner.plannedActionPreview;
  const focusItems = shell.keyboardActionPlanner.focusOrder.map((item) => `
    <li class="planner-focus-item ${item.selected ? 'is-selected' : ''} ${item.focused ? 'is-focused' : ''} ${item.queued ? 'is-queued' : ''}">
      <span>${escapeHtml(item.label)}</span>
      <small>${escapeHtml(item.actionState)}${item.queued ? ' · queued' : ''}</small>
    </li>
  `).join('');

  return `
    <section class="action-planner" aria-label="Planificateur clavier d’action province">
      <h2>Action clavier</h2>
      <article class="planned-action planned-action--${escapeHtml(preview.actionStatus ?? 'empty')}">
        <span>Première action recommandée</span>
        <strong>${escapeHtml(preview.actionLabel)}</strong>
        <dl>
          <div><dt>Cible</dt><dd>${escapeHtml(preview.targetLabel)}</dd></div>
          <div><dt>Risque</dt><dd>${escapeHtml(preview.risk)}</dd></div>
          <div><dt>Effet attendu</dt><dd>${escapeHtml(preview.expectedEffect)}</dd></div>
          <div><dt>Raison tactique</dt><dd>${escapeHtml(preview.tacticalReason)}</dd></div>
        </dl>
      </article>
      <ol class="planner-focus-list">${focusItems}</ol>
    </section>
  `;
}


function renderAfterActionMapRecap(shell) {
  const recap = shell.afterActionMapRecap;
  const entries = recap.entries.map((entry) => `
    <li class="after-action-item after-action-item--${escapeHtml(entry.result)}">
      <span>${escapeHtml(entry.provinceLabel)} · ${escapeHtml(entry.actionLabel)}</span>
      <strong>${escapeHtml(entry.result)}</strong>
      <small>${escapeHtml(entry.explanation)}</small>
      <em>${escapeHtml(entry.frontEffect)} · ${escapeHtml(entry.affectedFront)}</em>
    </li>
  `).join('');

  return `
    <section class="after-action-recap" aria-label="Récapitulatif des ordres de province résolus">
      <h2>Après-action</h2>
      <p>${escapeHtml(recap.summary)}</p>
      ${recap.empty ? '<small class="after-action-empty">Aucun changement récent à surligner sur la carte.</small>' : `<ol>${entries}</ol>`}
    </section>
  `;
}


function renderFrontPressureReplay(shell) {
  const replay = shell.frontPressureReplay;
  const frames = replay.frames.map((frame) => {
    const adjacent = frame.adjacentPressure.length > 0
      ? frame.adjacentPressure.map((item) => `${item.label}: ${item.pressure}`).join(', ')
      : 'aucune pression adjacente';

    return `
    <li class="front-pressure-frame front-pressure-frame--${escapeHtml(frame.marker.type)} ${frame.frameIndex === replay.currentIndex ? 'is-active' : ''}">
      <span>${escapeHtml(frame.turnLabel)} · ${escapeHtml(frame.provinceLabel)}</span>
      <strong>${escapeHtml(frame.marker.label)} · ${escapeHtml(frame.changeLabel)}</strong>
      <small>${escapeHtml(frame.summary)}</small>
      <em>${escapeHtml(adjacent)}</em>
    </li>
  `;
  }).join('');

  return `
    <section class="front-pressure-replay" aria-label="Replay timeline de pression du front">
      <h2>Replay front</h2>
      <p>${escapeHtml(replay.fallbackMessage ?? replay.activeFrame?.summary ?? 'Timeline prête.')}</p>
      ${replay.controls ? `<label class="front-pressure-scrub"><span>${escapeHtml(replay.controls.label)}</span><input type="range" min="${replay.controls.min}" max="${replay.controls.max}" step="${replay.controls.step}" value="${replay.currentIndex}" aria-label="${escapeHtml(replay.controls.label)}"><small>${replay.currentIndex + 1}/${replay.frameCount}</small></label>` : ''}
      ${replay.beforeAfter ? `<article class="front-pressure-before-after"><span>Avant</span><strong>${escapeHtml(replay.beforeAfter.before)}</strong><span>Après</span><strong>${escapeHtml(replay.beforeAfter.after)}</strong><small>${escapeHtml(replay.beforeAfter.changeLabel)}</small></article>` : ''}
      ${replay.empty ? '<small class="front-pressure-empty">Aucun historique à rejouer pour cette province.</small>' : `<ol>${frames}</ol>`}
    </section>
  `;
}


function renderFrontRecoveryRecommendations(shell) {
  const recovery = shell.frontRecoveryRecommendations;
  const entries = recovery.recommendations.map((recommendation) => `
    <li class="front-recovery-item ${recommendation.safest ? 'is-safest' : ''} ${recommendation.opportunistic ? 'is-opportunistic' : ''}">
      <span>${escapeHtml(recommendation.label)} · ${escapeHtml(recommendation.stance)}</span>
      <strong>${recommendation.safest ? 'option la plus sûre' : recommendation.opportunistic ? 'option opportuniste' : 'option de reprise'}</strong>
      <small>${escapeHtml(recommendation.reason)}</small>
      <em>Risque: ${escapeHtml(recommendation.risk)}</em>
    </li>
  `).join('');

  return `
    <section class="front-recovery" aria-label="Recommandations de récupération après replay de pression">
      <h2>Reprise front</h2>
      <p>${escapeHtml(recovery.fallbackMessage ?? 'Actions proposées depuis le replay de pression.')}</p>
      ${recovery.empty ? '<small class="front-recovery-empty">Aucune recommandation disponible.</small>' : `<ol>${entries}</ol>`}
    </section>
  `;
}


function renderOperationalPrioritySummary(shell) {
  const summary = shell.operationalPrioritySummary;
  const orderItems = summary.actionOrder.map((entry) => `
    <li class="operational-priority-order operational-priority-order--${escapeHtml(entry.priority)}">
      <span>${entry.order}. ${escapeHtml(entry.provinceLabel)} · ${escapeHtml(entry.priority)}</span>
      <strong>${escapeHtml(entry.actionLabel)}</strong>
      <small>${escapeHtml(entry.marker)}</small>
    </li>
  `).join('');
  const conflicts = summary.conflicts.map((conflict) => `
    <li class="operational-priority-conflict">
      <span>${escapeHtml(conflict.provinceLabel)} · ${escapeHtml(conflict.type)}</span>
      <small>${escapeHtml(conflict.reason)}</small>
    </li>
  `).join('');

  return `
    <section class="operational-priority" aria-label="Synthèse de priorité opérationnelle des provinces contestées">
      <h2>Priorités opérationnelles</h2>
      <p>${escapeHtml(summary.fallbackMessage ?? summary.summary)}</p>
      ${summary.empty ? '<small class="operational-priority-empty">Aucune priorité à afficher.</small>' : `<ol>${orderItems}</ol>`}
      ${summary.conflicts.length > 0 ? `<div class="operational-priority-conflicts"><span>Conflits proches</span><ul>${conflicts}</ul></div>` : ''}
    </section>
  `;
}


function renderOperationalCommitmentChecklist(shell) {
  const checklist = shell.operationalCommitmentChecklist;
  const items = checklist.checklistItems.map((item) => `
    <li class="commitment-checklist-item commitment-checklist-item--${escapeHtml(item.status)}">
      <span>${item.order}. ${escapeHtml(item.provinceLabel)} · ${escapeHtml(item.priority)} · ${escapeHtml(item.status)}</span>
      <strong>${escapeHtml(item.actionLabel)}</strong>
      <small>${escapeHtml(item.risk)}</small>
      <em>${escapeHtml(item.decisionHint)}</em>
    </li>
  `).join('');
  const acceptedRisks = checklist.acceptedRisks.map((risk) => `
    <li><span>${escapeHtml(risk.provinceLabel)}</span><small>${escapeHtml(risk.risk)}</small></li>
  `).join('');
  const blockingRisks = checklist.blockingRisks.map((risk) => `
    <li><span>${escapeHtml(risk.provinceLabel)}</span><small>${escapeHtml(risk.prerequisite)}</small></li>
  `).join('');

  return `
    <section class="commitment-checklist" aria-label="Checklist de commitment opérationnel des provinces contestées">
      <h2>Checklist commitment</h2>
      <p>${escapeHtml(checklist.fallbackMessage ?? checklist.summary)}</p>
      <div class="commitment-checklist-counts"><span>${checklist.readyCount} prêt</span><span>${checklist.waitingCount} attente</span><span>${checklist.blockedCount} bloqué</span></div>
      ${checklist.empty ? '<small class="commitment-checklist-empty">Aucun engagement à vérifier.</small>' : `<ol>${items}</ol>`}
      <div class="commitment-risk-summary">
        <article><span>Risques acceptés</span>${acceptedRisks ? `<ul>${acceptedRisks}</ul>` : '<small>Aucun risque accepté.</small>'}</article>
        <article><span>Risques bloquants</span>${blockingRisks ? `<ul>${blockingRisks}</ul>` : '<small>Aucun blocage.</small>'}</article>
      </div>
    </section>
  `;
}


function renderOperationalCommitmentConflictResolver(shell) {
  const resolver = shell.operationalCommitmentConflictResolver;
  const decisions = resolver.decisions.map((decision) => {
    const related = decision.relatedItems.map((item) => `${item.source}: ${item.label} (${item.status})`).join(' · ');
    return `
      <li class="commitment-resolver-decision commitment-resolver-decision--${escapeHtml(decision.decision)}">
        <span>${escapeHtml(decision.provinceLabel)} · ${escapeHtml(decision.conflictType)} · ${decision.signalCount} signaux</span>
        <strong>${escapeHtml(decision.decision)} — ${escapeHtml(decision.recommendedAction)}</strong>
        <small>${escapeHtml(decision.tacticalReason)}</small>
        <em>${escapeHtml(decision.remainingRisk)}</em>
        <kbd>${escapeHtml(decision.keyboardHint)}</kbd>
        <small>${escapeHtml(related)}</small>
      </li>
    `;
  }).join('');

  return `
    <section class="commitment-resolver" aria-label="Résolveur de conflits des engagements de province">
      <h2>Résolveur commitment</h2>
      <p>${escapeHtml(resolver.fallbackMessage ?? resolver.summary)}</p>
      ${resolver.empty ? '<small class="commitment-resolver-empty">Aucun conflit d’engagement détecté.</small>' : `<ol>${decisions}</ol>`}
    </section>
  `;
}

function renderProvinceActionQueueValidation(shell) {
  const validation = shell.keyboardActionPlanner.actionQueueValidation;
  const entries = validation.entries.map((entry) => {
    const preview = entry.conflictAwarePreview;
    const blockers = preview.blockers.length > 0 ? preview.blockers.join(', ') : 'aucun blocage';
    const exclusive = preview.mutuallyExclusiveWith
      ? `Exclusif avec ${preview.mutuallyExclusiveWith.queueId}: ${preview.mutuallyExclusiveWith.reason}`
      : 'pas d’exclusion';

    return `
    <li class="queue-validation-item queue-validation-item--${escapeHtml(entry.status)}">
      <span>${escapeHtml(entry.provinceLabel)} · ${escapeHtml(entry.actionLabel)}</span>
      <small>${escapeHtml(entry.status)} — ${escapeHtml(entry.reason)}</small>
      <div class="conflict-aware-preview">
        <b>${escapeHtml(preview.frontEffect)}</b>
        <small>Blocage: ${escapeHtml(blockers)}</small>
        <small>${escapeHtml(exclusive)}</small>
        <em>${escapeHtml(preview.confirmationHint)}</em>
      </div>
    </li>
  `;
  }).join('');

  return `
    <section class="queue-validation" aria-label="Validation de file d’actions province">
      <h2>Validation file</h2>
      <p>${validation.empty ? 'Aucun ordre en file.' : `${validation.summary.readyCount} prêt · ${validation.summary.riskyCount} risqué · ${validation.summary.blockedCount} bloqué · ${validation.summary.conflictCount} conflit`}</p>
      ${validation.nextSafeAction ? `<article class="next-safe-action"><span>Prochaine action sûre</span><strong>${escapeHtml(validation.nextSafeAction.label)}</strong><small>${escapeHtml(validation.nextSafeAction.reason)}</small></article>` : ''}
      <ol>${entries}</ol>
    </section>
  `;
}

export function buildStrategicMapPreviewHtml(generatedMap, options = {}) {
  const map = requireGeneratedMap(generatedMap);
  const normalizedOptions = requireOptions(options);
  const generatedAt = normalizedOptions.generatedAt ?? new Date().toISOString();
  const title = String(normalizedOptions.title ?? 'Historia strategic map preview').trim() || 'Historia strategic map preview';
  const shell = buildStrategicMapShell(map.provinces, {
    title: 'Carte stratégique Historia',
    subtitle: 'Preview QA exportable depuis le vrai générateur de carte',
    paletteByFaction: map.paletteByFaction,
    factionMetaById: map.factionMetaById,
    provinceGeometryById: map.provinceGeometryById,
    selectedProvinceId: normalizedOptions.selectedProvinceId ?? 'river-gate',
    focusedProvinceId: normalizedOptions.focusedProvinceId ?? 'crown-heart',
    queuedProvinceId: normalizedOptions.queuedProvinceId ?? normalizedOptions.selectedProvinceId ?? 'river-gate',
    provinceActionQueue: normalizedOptions.provinceActionQueue ?? [
      { queueId: 'preview-main', provinceId: normalizedOptions.selectedProvinceId ?? 'river-gate', label: 'Ordre principal' },
      { queueId: 'preview-support', provinceId: normalizedOptions.focusedProvinceId ?? 'crown-heart', label: 'Appui suivant', requiresSupport: true },
    ],
    resolvedProvinceOrders: normalizedOptions.resolvedProvinceOrders ?? [
      { resolutionId: 'preview-success', queueId: 'preview-main', provinceId: normalizedOptions.selectedProvinceId ?? 'river-gate', result: 'success', label: 'Ordre principal résolu' },
      { resolutionId: 'preview-deferred', queueId: 'preview-support', provinceId: normalizedOptions.focusedProvinceId ?? 'crown-heart', result: 'deferred', label: 'Appui reporté' },
    ],
    frontPressureReplayIndex: normalizedOptions.frontPressureReplayIndex ?? 1,
    frontPressureTimeline: normalizedOptions.frontPressureTimeline ?? [
      { frameId: 'preview-pressure-before', provinceId: normalizedOptions.selectedProvinceId ?? 'river-gate', turnLabel: 'Avant ordre', previousPressure: 'critical', pressure: 'high', marker: 'gain', reason: 'renforts stabilisent la province contestée', adjacentPressure: [{ provinceId: normalizedOptions.focusedProvinceId ?? 'crown-heart', label: 'Voisin ciblé', pressure: 'high' }] },
      { frameId: 'preview-pressure-after', provinceId: normalizedOptions.selectedProvinceId ?? 'river-gate', turnLabel: 'Après résolution', previousPressure: 'high', pressure: 'critical', marker: 'loss', reason: 'la pression adjacente remonte après le report du soutien', adjacentPressure: [{ provinceId: normalizedOptions.focusedProvinceId ?? 'crown-heart', label: 'Voisin ciblé', pressure: 'critical' }] },
      { frameId: 'preview-pressure-blocked', provinceId: normalizedOptions.selectedProvinceId ?? 'river-gate', turnLabel: 'Ordre bloqué', previousPressure: 'critical', pressure: 'critical', marker: 'blocked', result: 'blocked', reason: 'le ravitaillement empêche la bascule du front' },
    ],
  });

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:#06111f; color:#e5edf7; }
    body { margin:0; min-height:100vh; background:radial-gradient(circle at top left, #16345f 0, transparent 34rem), linear-gradient(135deg, #07111e, #0f172a 52%, #111827); }
    main { width:min(1180px, calc(100vw - 48px)); margin:0 auto; padding:32px 0 40px; }
    header { display:flex; justify-content:space-between; gap:24px; align-items:flex-end; margin-bottom:22px; }
    h1 { margin:0; font-size:clamp(30px, 4vw, 52px); letter-spacing:-0.04em; }
    .subtitle { margin:8px 0 0; color:#a7b5c8; }
    .stamp { text-align:right; color:#93a4bb; font-size:13px; }
    .grid { display:grid; grid-template-columns:minmax(0, 1.8fr) minmax(300px, 0.8fr); gap:22px; align-items:start; }
    .panel { background:rgba(15, 23, 42, 0.72); border:1px solid rgba(148, 163, 184, 0.22); border-radius:24px; box-shadow:0 28px 90px rgba(0,0,0,0.32); backdrop-filter:blur(14px); }
    .map-panel { padding:18px; }
    svg { width:100%; height:auto; display:block; border-radius:18px; background:linear-gradient(160deg, rgba(15,35,60,0.96), rgba(8,13,25,0.98)); border:1px solid rgba(125, 211, 252, 0.14); }
    .grid-line { stroke:rgba(148,163,184,0.10); stroke-width:0.22; }
    .relation-line, .relation-line-casing { fill:none; stroke-linecap:round; stroke-linejoin:round; }
    .relation-line-casing { stroke:rgba(5, 10, 20, 0.78); stroke-width:1.7; opacity:0.9; }
    .relation-line { stroke:rgba(148, 163, 184, 0.48); stroke-width:0.56; stroke-dasharray:1.3 1.15; }
    .relation-line.is-contested { stroke:#f59e0b; stroke-width:0.82; }
    .relation-line.is-occupied { stroke:#38bdf8; }
    .province-shape { fill:var(--fill); stroke:var(--border); stroke-width:1.18; filter:drop-shadow(0 0 0.7px rgba(255,255,255,0.32)); opacity:0.88; }
    .province.is-contested .province-shape { stroke:#fbbf24; stroke-width:1.45; stroke-dasharray:2 1.2; }
    .province.is-occupied .province-shape { opacity:0.76; }
    .province.is-focused .province-shape { filter:drop-shadow(0 0 2px rgba(103,232,249,0.78)); }
    .province.is-selected .province-shape { stroke:#67e8f9; stroke-width:1.72; }
    .province.is-queued .province-shape { stroke:#22c55e; stroke-width:1.62; }
    .province.is-recently-affected .province-shape { stroke:#f0abfc; stroke-width:2.05; filter:drop-shadow(0 0 5px rgba(240,171,252,0.6)); }
    .province-label-leader { fill:none; stroke:rgba(226, 232, 240, 0.36); stroke-width:0.28; stroke-dasharray:0.7 0.85; }
    .province-label-plate { fill:rgba(5,10,20,0.74); stroke:rgba(226,232,240,0.18); stroke-width:0.22; }
    .province-label { fill:#f8fafc; font-size:2.75px; font-weight:900; paint-order:stroke; stroke:#020617; stroke-width:0.7; stroke-linejoin:round; letter-spacing:0.04em; }
    .province-meta { fill:#cbd5e1; font-size:1.65px; font-weight:700; paint-order:stroke; stroke:#020617; stroke-width:0.46; letter-spacing:0.05em; }
    .side { padding:18px; display:grid; gap:18px; }
    .stats { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:10px; }
    .stat-card { background:rgba(8, 13, 25, 0.76); border:1px solid rgba(148, 163, 184, 0.16); border-radius:16px; padding:12px; }
    .stat-card span { display:block; color:#93a4bb; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; }
    .stat-card strong { display:block; margin-top:4px; font-size:20px; }
    h2 { margin:0 0 10px; font-size:15px; text-transform:uppercase; letter-spacing:0.12em; color:#bfdbfe; }
    ul { list-style:none; padding:0; margin:0; display:grid; gap:8px; }
    li { display:flex; align-items:center; gap:9px; color:#d7e1ee; }
    .legend-swatch { width:18px; height:18px; border-radius:7px; background:var(--fill); border:2px solid var(--border); box-shadow:0 0 20px color-mix(in srgb, var(--fill), transparent 50%); }
    .action-planner { display:grid; gap:12px; }
    .planned-action { background:rgba(8,13,25,0.78); border:1px solid rgba(74,222,128,0.26); border-radius:16px; padding:12px; }
    .planned-action span { color:#93a4bb; font-size:11px; text-transform:uppercase; letter-spacing:0.09em; }
    .planned-action strong { display:block; margin-top:4px; color:#bbf7d0; }
    .planned-action dl { display:grid; gap:6px; margin:10px 0 0; }
    .planned-action div { display:grid; grid-template-columns:86px 1fr; gap:8px; }
    .planned-action dt { color:#93c5fd; font-size:11px; text-transform:uppercase; }
    .planned-action dd { margin:0; color:#dbeafe; font-size:12px; }
    .planner-focus-list { counter-reset:item; display:grid; gap:6px; margin:0; padding:0; }
    .planner-focus-item { display:flex; justify-content:space-between; border:1px solid rgba(148,163,184,0.16); border-radius:12px; padding:7px 9px; }
    .planner-focus-item.is-focused { border-color:rgba(103,232,249,0.48); }
    .planner-focus-item.is-selected { color:#fef3c7; }
    .planner-focus-item.is-queued { border-color:rgba(74,222,128,0.48); }
    .queue-validation { display:grid; gap:10px; }
    .queue-validation p { margin:0; color:#cbd5e1; font-size:12px; }
    .queue-validation ol { display:grid; gap:6px; margin:0; padding:0; }
    .queue-validation-item { display:grid; gap:2px; border:1px solid rgba(148,163,184,0.16); border-radius:12px; padding:7px 9px; }
    .queue-validation-item--ready { border-color:rgba(74,222,128,0.34); }
    .queue-validation-item--risky { border-color:rgba(251,191,36,0.44); }
    .queue-validation-item--blocked,
    .queue-validation-item--conflict { border-color:rgba(248,113,113,0.48); }
    .queue-validation-item small,
    .next-safe-action small { color:#cbd5e1; }
    .conflict-aware-preview { display:grid; gap:2px; margin-top:5px; padding-top:5px; border-top:1px solid rgba(148,163,184,0.12); }
    .conflict-aware-preview b { color:#e0f2fe; font-size:12px; }
    .conflict-aware-preview em { color:#fde68a; font-size:11px; font-style:normal; }
    .next-safe-action { display:grid; gap:3px; border:1px solid rgba(74,222,128,0.34); border-radius:14px; padding:9px; background:rgba(22,101,52,0.14); }
    .next-safe-action span { color:#93a4bb; font-size:11px; text-transform:uppercase; letter-spacing:0.09em; }
    .next-safe-action strong { color:#bbf7d0; }
    .after-action-recap { display:grid; gap:10px; }
    .after-action-recap p, .after-action-empty { margin:0; color:#cbd5e1; font-size:12px; }
    .after-action-recap ol { display:grid; gap:6px; margin:0; padding:0; }
    .after-action-item { display:grid; gap:3px; align-items:start; border:1px solid rgba(148,163,184,0.18); border-radius:12px; padding:7px 9px; }
    .after-action-item--success { border-color:rgba(74,222,128,0.4); }
    .after-action-item--blocked, .after-action-item--conflict { border-color:rgba(251,191,36,0.48); }
    .after-action-item--cancelled { border-color:rgba(148,163,184,0.28); opacity:0.86; }
    .after-action-item strong { color:#f0abfc; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; }
    .after-action-item small { color:#dbeafe; }
    .after-action-item em { color:#bae6fd; font-size:11px; font-style:normal; }
    .front-pressure-replay { display:grid; gap:10px; }
    .front-pressure-replay p, .front-pressure-empty { margin:0; color:#cbd5e1; font-size:12px; }
    .front-pressure-scrub { display:grid; grid-template-columns:1fr auto; gap:6px 10px; align-items:center; color:#bfdbfe; font-size:12px; }
    .front-pressure-scrub input { grid-column:1 / -1; width:100%; accent-color:#f0abfc; }
    .front-pressure-before-after { display:grid; grid-template-columns:auto 1fr auto 1fr; gap:5px 8px; border:1px solid rgba(240,171,252,0.28); border-radius:12px; padding:8px; background:rgba(88,28,135,0.14); }
    .front-pressure-before-after span, .front-pressure-before-after small { color:#c4b5fd; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; }
    .front-pressure-before-after small { grid-column:1 / -1; text-transform:none; letter-spacing:0; }
    .front-pressure-replay ol { display:grid; gap:6px; margin:0; padding:0; }
    .front-pressure-frame { display:grid; gap:3px; border:1px solid rgba(148,163,184,0.18); border-radius:12px; padding:7px 9px; }
    .front-pressure-frame.is-active { border-color:rgba(240,171,252,0.58); box-shadow:0 0 0 1px rgba(240,171,252,0.16) inset; }
    .front-pressure-frame--gain { border-color:rgba(74,222,128,0.36); }
    .front-pressure-frame--loss { border-color:rgba(248,113,113,0.44); }
    .front-pressure-frame--blocked { border-color:rgba(251,191,36,0.48); }
    .front-pressure-frame strong { color:#f5d0fe; font-size:12px; }
    .front-pressure-frame small { color:#dbeafe; }
    .front-pressure-frame em { color:#bae6fd; font-size:11px; font-style:normal; }
    .front-recovery { display:grid; gap:10px; }
    .front-recovery p, .front-recovery-empty { margin:0; color:#cbd5e1; font-size:12px; }
    .front-recovery ol { display:grid; gap:6px; margin:0; padding:0; }
    .front-recovery-item { display:grid; gap:3px; border:1px solid rgba(148,163,184,0.18); border-radius:12px; padding:7px 9px; }
    .front-recovery-item.is-safest { border-color:rgba(74,222,128,0.44); background:rgba(22,101,52,0.12); }
    .front-recovery-item.is-opportunistic { border-color:rgba(251,191,36,0.48); background:rgba(120,53,15,0.12); }
    .front-recovery-item strong { color:#bbf7d0; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; }
    .front-recovery-item.is-opportunistic strong { color:#fde68a; }
    .front-recovery-item small { color:#dbeafe; }
    .front-recovery-item em { color:#bae6fd; font-size:11px; font-style:normal; }
    .operational-priority { display:grid; gap:10px; }
    .operational-priority p, .operational-priority-empty { margin:0; color:#cbd5e1; font-size:12px; }
    .operational-priority ol, .operational-priority ul { display:grid; gap:6px; margin:0; padding:0; }
    .operational-priority-order, .operational-priority-conflict { display:grid; gap:3px; border:1px solid rgba(148,163,184,0.18); border-radius:12px; padding:7px 9px; }
    .operational-priority-order--renforcer { border-color:rgba(74,222,128,0.42); }
    .operational-priority-order--tenir { border-color:rgba(96,165,250,0.42); }
    .operational-priority-order--exploiter { border-color:rgba(251,191,36,0.48); }
    .operational-priority-order--surveiller, .operational-priority-order--différer { border-color:rgba(148,163,184,0.32); }
    .operational-priority-order strong { color:#bfdbfe; font-size:12px; }
    .operational-priority-order small, .operational-priority-conflict small { color:#cbd5e1; }
    .operational-priority-conflicts { display:grid; gap:6px; border-top:1px solid rgba(148,163,184,0.14); padding-top:7px; }
    .operational-priority-conflicts > span { color:#fca5a5; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; }
    .operational-priority-conflict { border-color:rgba(248,113,113,0.36); }
    .commitment-checklist { display:grid; gap:10px; }
    .commitment-checklist p, .commitment-checklist-empty { margin:0; color:#cbd5e1; font-size:12px; }
    .commitment-checklist ol, .commitment-checklist ul { display:grid; gap:6px; margin:0; padding:0; }
    .commitment-checklist-counts { display:flex; flex-wrap:wrap; gap:6px; }
    .commitment-checklist-counts span { border:1px solid rgba(148,163,184,0.22); border-radius:999px; padding:3px 8px; color:#dbeafe; font-size:11px; }
    .commitment-checklist-item { display:grid; gap:3px; border:1px solid rgba(148,163,184,0.18); border-radius:12px; padding:7px 9px; }
    .commitment-checklist-item--engageable, .commitment-checklist-item--tenir { border-color:rgba(74,222,128,0.44); background:rgba(22,101,52,0.10); }
    .commitment-checklist-item--attente { border-color:rgba(251,191,36,0.42); background:rgba(120,53,15,0.10); }
    .commitment-checklist-item--bloqué { border-color:rgba(248,113,113,0.42); background:rgba(127,29,29,0.10); }
    .commitment-checklist-item strong { color:#bfdbfe; font-size:12px; }
    .commitment-checklist-item small { color:#cbd5e1; }
    .commitment-checklist-item em { color:#bae6fd; font-size:11px; font-style:normal; }
    .commitment-risk-summary { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .commitment-risk-summary article { display:grid; gap:5px; border-top:1px solid rgba(148,163,184,0.14); padding-top:7px; }
    .commitment-risk-summary article > span { color:#93c5fd; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; }
    .commitment-risk-summary li { display:grid; gap:2px; border:1px solid rgba(148,163,184,0.16); border-radius:10px; padding:6px 8px; }
    .commitment-risk-summary small { color:#cbd5e1; }
    .commitment-resolver { display:grid; gap:10px; }
    .commitment-resolver p, .commitment-resolver-empty { margin:0; color:#cbd5e1; font-size:12px; }
    .commitment-resolver ol { display:grid; gap:6px; margin:0; padding:0; }
    .commitment-resolver-decision { display:grid; gap:4px; border:1px solid rgba(148,163,184,0.18); border-radius:12px; padding:8px 10px; }
    .commitment-resolver-decision--exécuter { border-color:rgba(74,222,128,0.44); background:rgba(22,101,52,0.10); }
    .commitment-resolver-decision--différer { border-color:rgba(251,191,36,0.42); background:rgba(120,53,15,0.10); }
    .commitment-resolver-decision--remplacer { border-color:rgba(96,165,250,0.44); background:rgba(30,64,175,0.10); }
    .commitment-resolver-decision--bloquer { border-color:rgba(248,113,113,0.44); background:rgba(127,29,29,0.10); }
    .commitment-resolver-decision strong { color:#bfdbfe; font-size:12px; }
    .commitment-resolver-decision small, .commitment-resolver-decision em { color:#cbd5e1; font-size:11px; }
    .commitment-resolver-decision em { font-style:normal; color:#bae6fd; }
    .commitment-resolver-decision kbd { justify-self:start; border:1px solid rgba(148,163,184,0.24); border-radius:8px; padding:3px 6px; color:#fde68a; background:rgba(15,23,42,0.52); font-size:11px; }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    th, td { padding:10px 8px; border-bottom:1px solid rgba(148, 163, 184, 0.14); text-align:left; }
    th { color:#93c5fd; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; }
    .table-panel { margin-top:22px; overflow:hidden; }
    .table-panel-inner { overflow:auto; }
    @media (max-width: 860px) { .grid { grid-template-columns:1fr; } header { display:block; } .stamp { text-align:left; margin-top:12px; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>${escapeHtml(shell.title)}</h1>
        <p class="subtitle">${escapeHtml(shell.subtitle)} — générée par <code>GenerateStrategicMap</code>, rendue via <code>buildStrategicMapShell</code>.</p>
      </div>
      <div class="stamp">Seed: ${escapeHtml(map.seed)}<br>Export: ${escapeHtml(generatedAt)}</div>
    </header>

    <section class="grid">
      <article class="panel map-panel" aria-label="Carte stratégique exportée">
        <svg viewBox="0 0 ${escapeHtml(map.width ?? 100)} ${escapeHtml(map.height ?? 100)}" role="img" aria-label="Preview visuelle de la carte stratégique Historia">
          <defs>
            <pattern id="qa-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path class="grid-line" d="M 10 0 L 0 0 0 10" fill="none"></path>
            </pattern>
          </defs>
          <rect x="0" y="0" width="100" height="100" fill="url(#qa-grid)"></rect>
          <path d="M4,78 C20,70 32,74 44,67 C62,57 73,59 96,47" fill="none" stroke="rgba(56,189,248,0.24)" stroke-width="2.4"></path>
          ${renderRelationLines(shell)}
          ${renderProvinceShapes(shell)}
        </svg>
      </article>

      <aside class="panel side">
        <section>
          <h2>Résumé QA</h2>
          <div class="stats">${renderStats(shell, map)}</div>
        </section>
        <section>
          <h2>Factions</h2>
          <ul>${renderLegend(shell)}</ul>
        </section>
        ${renderKeyboardActionPlanner(shell)}
        ${renderProvinceActionQueueValidation(shell)}
        ${renderAfterActionMapRecap(shell)}
        ${renderFrontPressureReplay(shell)}
        ${renderFrontRecoveryRecommendations(shell)}
        ${renderOperationalPrioritySummary(shell)}
        ${renderOperationalCommitmentChecklist(shell)}
        ${renderOperationalCommitmentConflictResolver(shell)}
        <section>
          <h2>Lecture</h2>
          <ul>
            <li>Contour pointillé: province contestée</li>
            <li>Ligne ambre: voisinage touchant un front</li>
            <li>Labels et polygones viennent du contrat généré</li>
          </ul>
        </section>
      </aside>
    </section>

    <section class="panel table-panel">
      <div class="side table-panel-inner">
        <h2>Provinces générées</h2>
        <table>
          <thead><tr><th>Province</th><th>Contrôle</th><th>Supply</th><th>Loyauté</th><th>Valeur</th><th>Contestée</th></tr></thead>
          <tbody>${renderProvinceTable(shell)}</tbody>
        </table>
      </div>
    </section>
  </main>
</body>
</html>
`;
}
