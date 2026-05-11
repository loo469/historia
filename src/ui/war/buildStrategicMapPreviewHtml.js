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

    return `
      <g class="province ${province.contested ? 'is-contested' : ''} ${province.occupied ? 'is-occupied' : ''}" style="--fill:${escapeHtml(province.style.fill)};--border:${escapeHtml(province.style.border)}">
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
