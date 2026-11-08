import { dot, link, rect, text as label } from '@tanstack/charts';
import { treeLayout } from '@tanstack/charts/hierarchy/tree';
import { treemap } from '@tanstack/charts/hierarchy/treemap';
import { sankeyDiagram } from '@tanstack/charts/network/sankey';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import type { ResolvedThemeTokens } from '../theme.js';
import { chartTheme, defineNative, type NativeDefinition } from './shared.js';
import { num, safeConfigRows, text } from './values.js';
import { treeOf, type Row } from '../markup.js';

interface FlowNode {
  id: string;
  label: string;
}

interface FlowLink {
  source: string;
  target: string;
  value: number;
}

export function buildSankey(config: Record<string, unknown>, theme: ResolvedThemeTokens): NativeDefinition | null {
  const source = safeConfigRows(config.data);
  const links: FlowLink[] = source
    .map((row) => ({
      source: text(row.source),
      target: text(row.target),
      value: num(row.value) ?? 1,
    }))
    .filter((row) => Boolean(row.source && row.target) && row.value > 0);
  if (!links.length) return null;
  const names: string[] = [];
  for (const item of links) {
    if (!names.includes(item.source)) names.push(item.source);
    if (!names.includes(item.target)) names.push(item.target);
  }
  const nodes: FlowNode[] = names.map((name) => ({ id: name, label: name }));
  const requested = text(config.nodeAlign);
  const align = requested === 'left' || requested === 'right' || requested === 'justify' ? requested : 'justify';
  return defineNative({
    marks: [
      sankeyDiagram({
        nodes,
        links,
        nodeKey: 'id',
        source: 'source',
        target: 'target',
        value: 'value',
        align,
        nodeWidth: 13,
        nodePadding: 18,
        inset: { left: 14, right: 64, top: 16, bottom: 10 },
        marks: ({ nodes: layoutNodes, links: layoutLinks }) => [
          link(layoutLinks, {
            x1: 'x1',
            y1: 'y1',
            x2: 'x2',
            y2: 'y2',
            key: 'key',
            stroke: theme.muted,
            strokeOpacity: 0.32,
            strokeWidth: (flow) => Math.max(1, flow.width),
          }),
          rect(layoutNodes, {
            x1: 'x0',
            x2: 'x1',
            y1: 'y0',
            y2: 'y1',
            key: 'key',
            fill: theme.palette[0] ?? theme.total,
            inset: 0,
            radius: 2,
          }),
          label(layoutNodes, {
            x: 'x',
            y: (node) => node.y0 - 6,
            text: (node) => node.data.label,
            key: 'key',
            fill: theme.text,
            fontSize: 12,
            fontWeight: 600,
          }),
        ],
      }),
    ],
    scales: { x: null, y: null },
    guides: false,
    margin: 0,
    theme: chartTheme(theme),
  });
}

interface HierarchyRow {
  id: string;
  parentId: string | null;
  name: string;
  value: number;
  group: string;
  depth: number;
}

export function buildTreemap(config: Record<string, unknown>, theme: ResolvedThemeTokens): NativeDefinition | null {
  const rows = flattenTree(config.data);
  if (!rows.length) return null;
  const groups = unique(rows.filter((row) => row.depth === 1).map((row) => row.group));
  const colors = new Map(
    groups.map((group, index) => [group, theme.palette[index % theme.palette.length] ?? theme.total]),
  );
  return defineNative({
    marks: [
      treemap(rows, {
        nodeId: 'id',
        parentId: 'parentId',
        value: 'value',
        fill: (node) => colors.get(node.data?.group ?? '') ?? theme.palette[0] ?? theme.total,
        fillOpacity: 0.78,
        stroke: theme.background,
        strokeWidth: 1.5,
        paddingInner: 2,
        paddingOuter: 2,
        round: true,
        inset: 3,
        label: (node) => node.data?.name ?? node.name,
        labelFill: theme.tooltipText,
        labelFontSize: 12,
        labelFontWeight: 600,
      }),
    ],
    scales: { x: null, y: null },
    guides: false,
    margin: 0,
    theme: chartTheme(theme),
  });
}

export function buildTree(
  config: Record<string, unknown>,
  theme: ResolvedThemeTokens,
  kind: 'indented-tree' | 'organization-chart',
): NativeDefinition | null {
  const rows = flattenTree(config.data);
  if (!rows.length) return null;
  const orientation = kind === 'organization-chart' ? 'bottom' : 'left';
  const hierarchy = treeLayout(rows, {
    id: 'id',
    parentId: 'parentId',
    orientation,
    nodeSize: kind === 'organization-chart' ? [2.6, 1.6] : [1.5, 2.5],
  });
  const horizontal = kind === 'indented-tree';
  return defineNative({
    marks: [
      link(hierarchy.links, {
        x1: 'x1',
        y1: 'y1',
        x2: 'x2',
        y2: 'y2',
        key: 'id',
        stroke: theme.muted,
        strokeOpacity: 0.55,
        strokeWidth: 1.3,
      }),
      dot(hierarchy.nodes, {
        x: 'x',
        y: 'y',
        key: 'id',
        fill: theme.palette[0],
        r: 4,
      }),
      label(hierarchy.nodes, {
        x: 'x',
        y: 'y',
        text: (node) => node.data?.name ?? node.name,
        key: 'id',
        fill: theme.text,
        fontSize: 12,
        fontWeight: 600,
        anchor: horizontal ? 'start' : 'middle',
        dx: horizontal ? 9 : 0,
        dy: horizontal ? 4 : 17,
      }),
    ],
    scales: {
      x: { scale: scaleLinear },
      y: { scale: scaleLinear },
    },
    guides: false,
    margin: kind === 'organization-chart'
      ? { top: 20, right: 80, bottom: 52, left: 80 }
      : { top: 20, right: 120, bottom: 20, left: 60 },
    theme: chartTheme(theme),
  });
}

function flattenTree(input: unknown): HierarchyRow[] {
  const root = treeOf(input);
  if (!root) return [];
  const rows: HierarchyRow[] = [];
  let sequence = 0;
  const walk = (row: Row, parentId: string | null, depth: number, parentGroup: string): number => {
    const id = `node-${sequence++}`;
    const children = safeConfigRows(row.children);
    const name = text(row.name || row.category || '未命名');
    const group = depth <= 1 ? name : parentGroup;
    const own = num(row.value) ?? 0;
    const output: HierarchyRow = {
      id,
      parentId,
      name,
      value: children.length ? 0 : own,
      group,
      depth,
    };
    rows.push(output);
    for (const child of children) walk(child, id, depth + 1, group);
    return output.value;
  };
  walk(root, null, 0, '');
  return rows;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
