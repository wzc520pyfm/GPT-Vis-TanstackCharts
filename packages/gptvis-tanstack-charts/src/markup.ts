import { chartLabel } from './catalog.js';
import type { ResolvedThemeTokens } from './theme.js';
import { escapeHtml, renderSummary } from './text.js';

export interface Row {
  [key: string]: unknown;
}

export function num(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function text(value: unknown): string {
  if (value == null) return '';
  return String(value);
}

export function rowsOf(data: unknown): Row[] {
  if (!Array.isArray(data)) return [];
  return data.filter((item): item is Row => Boolean(item) && typeof item === 'object' && !Array.isArray(item));
}

export function treeOf(data: unknown): Row | null {
  if (Array.isArray(data)) {
    const nodes = rowsOf(data);
    if (nodes.length === 1) return nodes[0] ?? null;
    if (nodes.length > 1) return { name: '全部', children: nodes };
    return null;
  }
  if (data && typeof data === 'object') {
    const node = data as Row;
    if (node.name != null || node.children != null) return node;
  }
  return null;
}

export function setsOf(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => text(item).trim()).filter(Boolean);
  return text(value)
    .replace(/^\[|\]$/g, '')
    .split(/[,，、]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatPercent(value: number): string {
  const percent = value > 1 && value <= 100 ? value / 100 : value;
  const clamped = Math.max(0, Math.min(1, percent));
  return `${Math.round(clamped * 1000) / 10}%`.replace(/\.0%$/, '%');
}

function percentNumber(value: unknown): number | null {
  const parsed = num(value);
  if (parsed == null) return null;
  const ratio = parsed > 1 && parsed <= 100 ? parsed / 100 : parsed;
  return Math.max(0, Math.min(1, ratio));
}

let liquidSeq = 0;

export function renderLiquid(config: Record<string, unknown>, theme: ResolvedThemeTokens): string | null {
  const ratio = percentNumber(config.percent);
  if (ratio == null) return null;
  const title = text(config.title);
  const fill = theme.palette[0] ?? theme.total;
  const shape = config.shape === 'rect' || config.shape === 'pin' || config.shape === 'triangle' ? config.shape : 'circle';
  const id = `gvtc-liquid-${liquidSeq++}`;
  const level = 188 - ratio * 156;
  const wave = liquidWave(level);
  const clip =
    shape === 'rect'
      ? '<rect x="28" y="18" width="144" height="164" rx="10"/>'
      : shape === 'triangle'
        ? '<polygon points="100,14 186,186 14,186"/>'
        : shape === 'pin'
          ? '<path d="M100 12c34 0 58 26 58 58 0 46-58 112-58 112S42 116 42 70c0-32 24-58 58-58z"/>'
          : '<circle cx="100" cy="100" r="86"/>';
  return `
    <div class="gvtc-liquid">
      ${title ? `<h3>${escapeHtml(title)}</h3>` : ''}
      <svg class="gvtc-liquid-svg" viewBox="0 0 200 200" role="img" aria-label="${escapeHtml(title || '水波图')}">
        <defs><clipPath id="${id}">${clip}</clipPath></defs>
        <g clip-path="url(#${id})">
          <rect width="200" height="200" fill="${theme.grid}"/>
          <path d="${wave}" fill="${fill}" fill-opacity="0.9"/>
        </g>
        <text x="100" y="108" text-anchor="middle">${formatPercent(ratio)}</text>
      </svg>
    </div>`;
}

function liquidWave(level: number): string {
  const amplitude = 7;
  let path = `M -10 ${level + amplitude}`;
  for (let x = -10; x <= 220; x += 12) {
    const y = level + Math.sin((x / 200) * Math.PI * 4) * amplitude;
    path += ` L ${x} ${y.toFixed(1)}`;
  }
  return `${path} L 220 210 L -10 210 Z`;
}

export function renderTable(config: Record<string, unknown>, theme: ResolvedThemeTokens): string | null {
  const rows = rowsOf(config.data);
  if (!rows.length) return null;
  const columns: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!columns.includes(key)) columns.push(key);
    }
  }
  const title = text(config.title);
  const head = columns.map((key) => `<th>${escapeHtml(key)}</th>`).join('');
  const body = rows
    .map((row) => {
      const cells = columns
        .map((key) => `<td>${row[key] == null || row[key] === '' ? '—' : escapeHtml(text(row[key]))}</td>`)
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');
  return `
    <div class="gvtc-table" style="--ink:${theme.text};--muted:${theme.muted};--line:${theme.grid};--bg:${theme.background}">
      ${title ? `<h3>${escapeHtml(title)}</h3>` : ''}
      <div class="gvtc-table-scroll">
        <table>
          <thead><tr>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </div>`;
}

export function renderSummaryView(config: Record<string, unknown>, theme: ResolvedThemeTokens): string | null {
  const body = text(config.content || config.text || '');
  const title = text(config.title);
  if (!body.trim() && !title) return null;
  return `
    <article class="gvtc-summary" style="--ink:${theme.text};--muted:${theme.muted};--accent:${theme.palette[0] ?? theme.total};--bg:${theme.background}">
      ${title ? `<h3>${escapeHtml(title)}</h3>` : ''}
      ${renderSummary(body)}
    </article>`;
}

export function renderWordCloud(config: Record<string, unknown>, theme: ResolvedThemeTokens): string | null {
  const words = rowsOf(config.data)
    .map((row) => ({ text: text(row.text || row.name || row.word), value: num(row.value) ?? 0 }))
    .filter((word) => word.text)
    .sort((a, b) => b.value - a.value);
  if (!words.length) return null;
  const max = Math.max(...words.map((word) => word.value), 1);
  const placed = placeWords(
    words.map((word) => {
      const size = 14 + Math.round((Math.max(word.value, 0) / max) * 40);
      return { ...word, size, width: estimateTextWidth(word.text, size), height: size * 1.15 };
    }),
  );
  const title = text(config.title);
  const spans = placed
    .map((word, index) => {
      const color = theme.palette[index % theme.palette.length] ?? theme.total;
      return `<span style="left:${word.x}px;top:${word.y}px;font-size:${word.size}px;color:${color}">${escapeHtml(word.text)}</span>`;
    })
    .join('');
  return `
    <div class="gvtc-cloud" style="--ink:${theme.text}">
      ${title ? `<h3>${escapeHtml(title)}</h3>` : ''}
      <div class="gvtc-cloud-board">${spans}</div>
    </div>`;
}

function placeWords<T extends { width: number; height: number }>(words: T[]): (T & { x: number; y: number })[] {
  const board = { width: 640, height: 360 };
  const boxes: { x: number; y: number; width: number; height: number }[] = [];
  return words.map((word) => {
    const cx = board.width / 2;
    const cy = board.height / 2;
    let x = cx - word.width / 2;
    let y = cy - word.height / 2;
    for (let step = 0; step < 700; step += 1) {
      const angle = step * 0.45;
      const radius = step * 2.4;
      x = cx + Math.cos(angle) * radius - word.width / 2;
      y = cy + Math.sin(angle) * radius * 0.72 - word.height / 2;
      const box = { x, y, width: word.width, height: word.height };
      const inside = x >= 4 && y >= 4 && x + word.width <= board.width - 4 && y + word.height <= board.height - 4;
      if (inside && boxes.every((other) => !overlaps(box, other))) break;
    }
    boxes.push({ x, y, width: word.width, height: word.height });
    return { ...word, x: Math.round(x), y: Math.round(y) };
  });
}

function overlaps(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): boolean {
  const pad = 6;
  return a.x < b.x + b.width + pad && a.x + a.width + pad > b.x && a.y < b.y + b.height + pad && a.y + a.height + pad > b.y;
}

function estimateTextWidth(value: string, size: number): number {
  let units = 0;
  for (const character of value) {
    units += /[\u3000-\u9fff\uff00-\uffef]/u.test(character) ? 1 : 0.62;
  }
  return Math.max(size, units * size);
}

export function renderVenn(config: Record<string, unknown>, theme: ResolvedThemeTokens): string | null {
  const items = rowsOf(config.data)
    .map((row) => ({ sets: setsOf(row.sets ?? row.name), value: num(row.value) ?? 0, label: text(row.label) }))
    .filter((item) => item.sets.length);
  if (!items.length) return null;
  const names: string[] = [];
  for (const item of items) {
    for (const set of item.sets) if (!names.includes(set)) names.push(set);
  }
  if (names.length < 2) return null;
  if (names.length > 3) {
    return `<div class="gvtc-status" data-gvtc="limited"><p>韦恩图只画两个或三个集合。</p><span>这份数据有 ${names.length} 个集合。</span></div>`;
  }
  const find = (...sets: string[]) =>
    items.find((item) => item.sets.length === sets.length && sets.every((set) => item.sets.includes(set)));
  const title = text(config.title);
  const [a = '', b = '', c = ''] = names;
  const colors = theme.palette;
  const label = (sets: string[], x: number, y: number) => {
    const item = find(...sets);
    if (!item) return '';
    return `<text x="${x}" y="${y}" text-anchor="middle">${escapeHtml(item.label || String(item.value))}</text>`;
  };
  const circles =
    names.length === 2
      ? `
        <circle cx="250" cy="210" r="120" fill="${colors[0]}" fill-opacity="0.38" stroke="${colors[0]}"/>
        <circle cx="390" cy="210" r="120" fill="${colors[1]}" fill-opacity="0.38" stroke="${colors[1]}"/>
        <text class="gvtc-venn-name" x="180" y="78">${escapeHtml(a)}</text>
        <text class="gvtc-venn-name" x="460" y="78">${escapeHtml(b)}</text>
        ${label([a], 190, 214)}
        ${label([a, b], 320, 214)}
        ${label([b], 450, 214)}`
      : `
        <circle cx="300" cy="180" r="110" fill="${colors[0]}" fill-opacity="0.35" stroke="${colors[0]}"/>
        <circle cx="230" cy="290" r="110" fill="${colors[1]}" fill-opacity="0.35" stroke="${colors[1]}"/>
        <circle cx="370" cy="290" r="110" fill="${colors[2]}" fill-opacity="0.35" stroke="${colors[2]}"/>
        <text class="gvtc-venn-name" x="300" y="52">${escapeHtml(a)}</text>
        <text class="gvtc-venn-name" x="120" y="400">${escapeHtml(b)}</text>
        <text class="gvtc-venn-name" x="480" y="400">${escapeHtml(c)}</text>
        ${label([a], 300, 160)}
        ${label([b], 190, 310)}
        ${label([c], 410, 310)}
        ${label([a, b], 230, 230)}
        ${label([a, c], 370, 230)}
        ${label([b, c], 300, 320)}
        ${label([a, b, c], 300, 250)}`;
  return `
    <div class="gvtc-venn" style="--ink:${theme.text};--muted:${theme.muted}">
      ${title ? `<h3>${escapeHtml(title)}</h3>` : ''}
      <svg viewBox="0 0 640 440" role="img" aria-label="${escapeHtml(title || '韦恩图')}">${circles}</svg>
    </div>`;
}

export function renderFunnel(config: Record<string, unknown>, theme: ResolvedThemeTokens): string | null {
  const rows = rowsOf(config.data)
    .map((row) => ({ label: text(row.category || row.name), value: num(row.value) }))
    .filter((row): row is { label: string; value: number } => row.value != null && row.value >= 0);
  if (!rows.length) return null;
  const width = 760;
  const top = text(config.title) ? 44 : 16;
  const stageHeight = Math.max(42, Math.min(72, 360 / rows.length));
  const height = top + rows.length * (stageHeight + 10) + 18;
  const max = Math.max(...rows.map((row) => row.value), 1);
  const maxWidth = 560;
  const label = text(config.conversionRateLabel) || '转化率';
  const center = width / 2;
  const parts = rows.map((row, index) => {
    const y1 = top + index * (stageHeight + 10);
    const y2 = y1 + stageHeight;
    const next = rows[index + 1];
    const w1 = Math.max(40, (row.value / max) * maxWidth);
    const w2 = Math.max(40, ((next?.value ?? row.value * 0.86) / max) * maxWidth);
    const color = theme.palette[index % theme.palette.length] ?? theme.total;
    const previous = rows[index - 1];
    const conversion = previous && previous.value > 0 ? row.value / previous.value : null;
    const suffix =
      index > 0 && conversion != null
        ? ` · ${escapeHtml(label)} ${Math.round(conversion * 1000) / 10}%`
        : '';
    const labelText = `${row.label} · ${formatCompact(row.value)}${suffix}`;
    return `
      <polygon points="${center - w1 / 2},${y1} ${center + w1 / 2},${y1} ${center + w2 / 2},${y2} ${center - w2 / 2},${y2}" fill="${color}" fill-opacity="0.86"/>
      <text x="${center}" y="${y1 + stageHeight / 2 + 5}" text-anchor="middle" fill="${theme.tooltipText}" font-size="13" font-weight="600">${escapeHtml(labelText)}</text>`;
  });
  return `
    <div class="gvtc-svgchart" style="--ink:${theme.text};--muted:${theme.muted}">
      ${text(config.title) ? `<h3>${escapeHtml(text(config.title))}</h3>` : ''}
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(text(config.title) || '漏斗图')}">${parts.join('')}</svg>
    </div>`;
}

function formatCompact(value: number): string {
  return Math.abs(value) >= 1000 ? value.toLocaleString('zh-CN') : String(Math.round(value * 100) / 100);
}

interface NetworkNode {
  id: string;
  place?: { x: number; y: number };
}

interface NetworkEdge {
  source: string;
  target: string;
  label: string;
}

export function renderNetwork(
  config: Record<string, unknown>,
  theme: ResolvedThemeTokens,
  width = 760,
  height = 440,
): string | null {
  const { nodes, edges } = graphNodes(config.data);
  if (!nodes.length) return null;
  const layout = text(config.layout) || 'force';
  const titleHeight = text(config.title) ? 34 : 8;
  const positions = layoutNetwork(nodes, edges, layout, width, height - titleHeight, titleHeight);
  const drawEdges = edges
    .map((edge) => {
      const source = positions.get(edge.source);
      const target = positions.get(edge.target);
      if (!source || !target) return '';
      const label = edge.label
        ? `<text class="gvtc-edge-label" x="${(source.x + target.x) / 2}" y="${(source.y + target.y) / 2 - 5}" text-anchor="middle">${escapeHtml(edge.label)}</text>`
        : '';
      return `<line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" stroke="${theme.muted}" stroke-opacity="0.55" stroke-width="1.4"/>${label}`;
    })
    .join('');
  const drawNodes = nodes
    .map((node, index) => {
      const place = positions.get(node.id);
      if (!place) return '';
      const color = theme.palette[index % theme.palette.length] ?? theme.total;
      return `
        <g>
          <circle cx="${place.x}" cy="${place.y}" r="20" fill="${color}" fill-opacity="0.92"/>
          <circle cx="${place.x}" cy="${place.y}" r="20" fill="none" stroke="${theme.tooltipText}" stroke-opacity="0.2"/>
          <text x="${place.x}" y="${place.y + 4}" text-anchor="middle" fill="${theme.tooltipText}" font-size="11" font-weight="600">${escapeHtml(shortLabel(node.id))}</text>
          <text x="${place.x}" y="${place.y + 34}" text-anchor="middle" fill="${theme.text}" font-size="12">${escapeHtml(node.id)}</text>
        </g>`;
    })
    .join('');
  return `
    <div class="gvtc-svgchart gvtc-network" data-layout="${escapeHtml(layout)}" style="--ink:${theme.text};--muted:${theme.muted}">
      ${text(config.title) ? `<h3>${escapeHtml(text(config.title))}</h3>` : ''}
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(text(config.title) || '网络图')}">
        ${drawEdges}
        ${drawNodes}
      </svg>
    </div>`;
}

function shortLabel(value: string): string {
  const characters = [...value];
  return characters.length > 2 ? characters.slice(0, 2).join('') : value;
}

function graphNodes(data: unknown): { nodes: NetworkNode[]; edges: NetworkEdge[] } {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const record = data as Row;
    const nodes = rowsOf(record.nodes)
      .map((node) => text(node.name || node.id))
      .filter(Boolean)
      .map((id) => ({ id }));
    const edges = rowsOf(record.edges).map((edge) => ({
      source: text(edge.source),
      target: text(edge.target),
      label: text(edge.name ?? edge.label),
    }));
    return { nodes, edges };
  }
  const rows = rowsOf(data);
  const names = new Set<string>();
  const edges = rows.map((row) => {
    const source = text(row.source);
    const target = text(row.target);
    names.add(source);
    names.add(target);
    return { source, target, label: text(row.name ?? row.label) };
  });
  return { nodes: [...names].map((id) => ({ id })), edges };
}

function layoutNetwork(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  layout: string,
  width: number,
  height: number,
  top: number,
): Map<string, { x: number; y: number }> {
  const names = nodes.map((node) => node.id);
  const positions = new Map<string, { x: number; y: number }>();
  if (layout === 'grid') {
    const columns = Math.max(1, Math.ceil(Math.sqrt(names.length)));
    const rows = Math.ceil(names.length / columns);
    names.forEach((name, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      positions.set(name, {
        x: ((column + 1) / (columns + 1)) * width,
        y: top + ((row + 1) / (rows + 1)) * height,
      });
    });
    return positions;
  }
  if (layout === 'circular') {
    const radius = Math.max(50, Math.min(width, height) * 0.35);
    names.forEach((name, index) => {
      const angle = (index / names.length) * Math.PI * 2 - Math.PI / 2;
      positions.set(name, {
        x: width / 2 + Math.cos(angle) * radius,
        y: top + height / 2 + Math.sin(angle) * radius,
      });
    });
    return positions;
  }
  if (layout === 'radial' || layout === 'concentric') {
    const degree = new Map(names.map((name) => [name, 0]));
    for (const edge of edges) {
      degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
      degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
    }
    const ordered = layout === 'concentric'
      ? [...names].sort((a, b) => (degree.get(b) ?? 0) - (degree.get(a) ?? 0))
      : names;
    const groups = new Map<number, string[]>();
    ordered.forEach((name, index) => {
      const layer = layout === 'radial' ? (index === 0 ? 0 : 1 + Math.floor((index - 1) / 6)) : Math.min(3, Math.floor(index / Math.max(1, Math.ceil(names.length / 4))));
      groups.set(layer, [...(groups.get(layer) ?? []), name]);
    });
    const maxLayer = Math.max(...groups.keys(), 1);
    for (const [layer, group] of groups) {
      const radius = layer === 0 ? 0 : (Math.min(width, height) / 2) * (0.25 + (0.62 * layer) / maxLayer);
      group.forEach((name, index) => {
        const angle = (index / group.length) * Math.PI * 2 - Math.PI / 2;
        positions.set(name, {
          x: width / 2 + Math.cos(angle) * radius,
          y: top + height / 2 + Math.sin(angle) * radius,
        });
      });
    }
    return positions;
  }
  if (layout === 'dagre') {
    return layeredPositions(names, edges, width, height, top);
  }
  return forcePositions(names, edges, width, height, top);
}

function layeredPositions(
  names: string[],
  edges: NetworkEdge[],
  width: number,
  height: number,
  top: number,
): Map<string, { x: number; y: number }> {
  const layer = new Map<string, number>(names.map((name) => [name, 0]));
  for (let pass = 0; pass < names.length; pass += 1) {
    let changed = false;
    for (const edge of edges) {
      const source = layer.get(edge.source);
      if (source == null || !layer.has(edge.target)) continue;
      const next = source + 1;
      if ((layer.get(edge.target) ?? 0) < next) {
        layer.set(edge.target, next);
        changed = true;
      }
    }
    if (!changed) break;
  }
  const columns = new Map<number, string[]>();
  for (const name of names) {
    const index = layer.get(name) ?? 0;
    columns.set(index, [...(columns.get(index) ?? []), name]);
  }
  const max = Math.max(...columns.keys(), 0);
  const positions = new Map<string, { x: number; y: number }>();
  for (const [index, column] of columns) {
    column.forEach((name, row) => {
      positions.set(name, {
        x: max === 0 ? width / 2 : 70 + (index / max) * (width - 140),
        y: top + ((row + 1) / (column.length + 1)) * (height - 40),
      });
    });
  }
  return positions;
}

function forcePositions(
  names: string[],
  edges: NetworkEdge[],
  width: number,
  height: number,
  top: number,
): Map<string, { x: number; y: number }> {
  const centerX = width / 2;
  const centerY = top + height / 2;
  const points = names.map((name, index) => {
    const angle = (index / Math.max(names.length, 1)) * Math.PI * 2;
    const radius = Math.min(width, height) * 0.24;
    return { name, x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius };
  });
  const byName = new Map(points.map((point) => [point.name, point]));
  for (let pass = 0; pass < 140; pass += 1) {
    for (let left = 0; left < points.length; left += 1) {
      for (let right = left + 1; right < points.length; right += 1) {
        const a = points[left];
        const b = points[right];
        if (!a || !b) continue;
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const force = 900 / (distance * distance);
        dx /= distance;
        dy /= distance;
        a.x += dx * force;
        a.y += dy * force;
        b.x -= dx * force;
        b.y -= dy * force;
      }
    }
    for (const edge of edges) {
      const source = byName.get(edge.source);
      const target = byName.get(edge.target);
      if (!source || !target) continue;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const force = (distance - 118) * 0.018;
      source.x += (dx / distance) * force;
      source.y += (dy / distance) * force;
      target.x -= (dx / distance) * force;
      target.y -= (dy / distance) * force;
    }
    for (const point of points) {
      point.x += (centerX - point.x) * 0.012;
      point.y += (centerY - point.y) * 0.012;
      point.x = Math.max(34, Math.min(width - 34, point.x));
      point.y = Math.max(top + 34, Math.min(top + height - 34, point.y));
    }
  }
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const scale = Math.min(
    3.4,
    Math.max(1, Math.min((width - 150) / Math.max(1, maxX - minX), (height - 120) / Math.max(1, maxY - minY))),
  );
  const graphCenterX = (minX + maxX) / 2;
  const graphCenterY = (minY + maxY) / 2;
  for (const point of points) {
    point.x = width / 2 + (point.x - graphCenterX) * scale;
    point.y = top + height / 2 + (point.y - graphCenterY) * scale;
  }
  return new Map(points.map((point) => [point.name, { x: Math.round(point.x), y: Math.round(point.y) }]));
}

interface MindNode {
  id: string;
  name: string;
  depth: number;
  side: -1 | 0 | 1;
  order: number;
  parent: string | null;
  children: string[];
}

export function renderMindmap(
  config: Record<string, unknown>,
  theme: ResolvedThemeTokens,
  width = 820,
  height = 480,
): string | null {
  const root = treeOf(config.data);
  if (!root || !text(root.name)) return null;
  const direction = text(config.direction).toUpperCase();
  const nodes: MindNode[] = [];
  const byId = new Map<string, MindNode>();
  let sequence = 0;
  let order = 0;
  const add = (row: Row, depth: number, side: -1 | 0 | 1, parent: string | null): string => {
    if (depth > 18) return parent ?? '';
    const id = `n${sequence++}`;
    const node: MindNode = {
      id,
      name: text(row.name || row.category || '未命名'),
      depth,
      side,
      order: order++,
      parent,
      children: [],
    };
    nodes.push(node);
    byId.set(id, node);
    if (parent) byId.get(parent)?.children.push(id);
    const children = rowsOf(row.children);
    children.forEach((child, index) => {
      const childSide: -1 | 0 | 1 =
        direction === 'LR'
          ? 1
          : direction === 'RL'
            ? -1
            : side === 0
              ? (index % 2 === 0 ? 1 : -1)
              : side;
      add(child, depth + 1, childSide, id);
    });
    return id;
  };
  add(root, 0, 0, null);

  const gap = 46;
  const columns = 168;
  const rootNode = nodes[0];
  if (!rootNode) return null;
  const measure = (node: MindNode): number => {
    if (!node.children.length) return gap;
    return node.children.reduce((sum, id) => {
      const child = byId.get(id);
      return sum + (child ? measure(child) : 0);
    }, 0);
  };
  const place = (node: MindNode, top: number): void => {
    const block = measure(node);
    (node as MindNode & { y?: number }).y = top + block / 2;
    let cursor = top;
    for (const id of node.children) {
      const child = byId.get(id);
      if (!child) continue;
      const childBlock = measure(child);
      place(child, cursor);
      cursor += childBlock;
    }
  };
  const right = rootNode.children.filter((id) => byId.get(id)?.side === 1);
  const left = rootNode.children.filter((id) => byId.get(id)?.side === -1);
  const rightHeight = right.reduce((sum, id) => sum + measure(byId.get(id) as MindNode), 0);
  const leftHeight = left.reduce((sum, id) => sum + measure(byId.get(id) as MindNode), 0);
  const maxColumns = Math.max(...nodes.map((node) => node.depth), 1);
  const top = (height - 60) / 2 - Math.max(rightHeight, leftHeight) / 2 + 30;
  (rootNode as MindNode & { y?: number }).y = height / 2;
  let cursor = top;
  for (const id of right) {
    const child = byId.get(id);
    if (!child) continue;
    place(child, cursor);
    cursor += measure(child);
  }
  cursor = top;
  for (const id of left) {
    const child = byId.get(id);
    if (!child) continue;
    place(child, cursor);
    cursor += measure(child);
  }
  const positions = new Map<string, { x: number; y: number }>();
  const maxX = Math.max(...nodes.map((node) => node.depth * columns));
  const xScale = Math.min(1, Math.max(0.1, (width / 2 - 120) / Math.max(maxX, 1)));
  for (const node of nodes) {
    const y = (node as MindNode & { y?: number }).y ?? height / 2;
    const x = node.side === 0 ? width / 2 : width / 2 + node.side * node.depth * columns * xScale;
    positions.set(node.id, { x, y });
  }
  const links = nodes
    .filter((node) => node.parent)
    .map((node) => {
      const start = positions.get(node.parent ?? '');
      const end = positions.get(node.id);
      if (!start || !end) return '';
      const middle = (start.x + end.x) / 2;
      return `<path d="M ${start.x} ${start.y} C ${middle} ${start.y}, ${middle} ${end.y}, ${end.x} ${end.y}" fill="none" stroke="${theme.muted}" stroke-opacity="0.6" stroke-width="1.4"/>`;
    })
    .join('');
  const drawNodes = nodes
    .map((node) => {
      const place = positions.get(node.id);
      if (!place) return '';
      const color = theme.palette[Math.min(node.depth, theme.palette.length - 1)] ?? theme.total;
      const radius = node.side === 0 ? 9 : 5;
      const anchor = node.side < 0 ? 'end' : node.side > 0 ? 'start' : 'middle';
      const dx = node.side < 0 ? -13 : node.side > 0 ? 13 : 0;
      const dy = node.side === 0 ? -16 : 4;
      return `
        <circle cx="${place.x}" cy="${place.y}" r="${radius}" fill="${color}"/>
        <text x="${place.x + dx}" y="${place.y + dy}" text-anchor="${anchor}" fill="${theme.text}" font-size="${node.side === 0 ? 14 : 12}" font-weight="${node.side === 0 ? 700 : 550}">${escapeHtml(node.name)}</text>`;
    })
    .join('');
  return `
    <div class="gvtc-svgchart gvtc-mindmap" data-direction="${escapeHtml(direction || 'both')}" style="--ink:${theme.text};--muted:${theme.muted}">
      ${text(config.title) ? `<h3>${escapeHtml(text(config.title))}</h3>` : ''}
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(text(config.title) || '思维导图')}">
        ${links}
        ${drawNodes}
      </svg>
    </div>`;
}

export function renderFishbone(config: Record<string, unknown>, theme: ResolvedThemeTokens): string | null {
  const root = treeOf(config.data);
  if (!root) return null;
  const causes = rowsOf(root.children).slice(0, 8);
  if (!causes.length && !text(root.name)) return null;
  const width = 860;
  const height = 460;
  const spineY = 230;
  const headX = 760;
  const tailX = 48;
  const color = theme.palette[0] ?? theme.total;
  const ribs = causes.map((cause, index) => {
    const upward = index % 2 === 0;
    const x = tailX + 70 + index * 78;
    const y = upward ? 78 : 382;
    const kids = rowsOf(cause.children)
      .slice(0, 4)
      .map((child, childIndex) => {
        const along = 0.28 + childIndex * 0.16;
        const cx = x + (headX - 80 - x) * along * 0.15 + (upward ? -8 : 8);
        const cy = spineY + (y - spineY) * along;
        return `<text x="${cx}" y="${cy}" text-anchor="${upward ? 'end' : 'start'}">${escapeHtml(text(child.name))}</text>`;
      })
      .join('');
    return `
      <line x1="${x}" y1="${spineY}" x2="${x + 36}" y2="${y}" stroke="${theme.palette[(index + 1) % theme.palette.length] ?? theme.total}" stroke-width="2"/>
      <text class="gvtc-bone" x="${x + 42}" y="${y + (upward ? -8 : 16)}" text-anchor="start">${escapeHtml(text(cause.name))}</text>
      ${kids}`;
  });
  const title = text(config.title);
  return `
    <div class="gvtc-svgchart" style="--ink:${theme.text};--muted:${theme.muted}">
      ${title ? `<h3>${escapeHtml(title)}</h3>` : ''}
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(title || '鱼骨图')}">
        <line x1="${tailX}" y1="${spineY}" x2="${headX - 20}" y2="${spineY}" stroke="${color}" stroke-width="3"/>
        ${ribs.join('')}
        <rect x="${headX - 16}" y="${spineY - 28}" width="84" height="56" rx="28" fill="${color}"/>
        <text class="gvtc-head" x="${headX + 26}" y="${spineY + 5}" text-anchor="middle" fill="${theme.tooltipText}">${escapeHtml(text(root.name) || '结果')}</text>
      </svg>
    </div>`;
}

export function renderPending(message: string): string {
  return `<div class="gvtc-status"><p>${escapeHtml(message)}</p></div>`;
}

export function renderUnsupported(type: string): string {
  const label = chartLabel(type);
  return `<div class="gvtc-status"><p>还不能画「${escapeHtml(label)}」。</p><span>类型标识是 ${escapeHtml(type)}。换一种已支持的 vis 类型，或补全它需要的数据字段。</span></div>`;
}
