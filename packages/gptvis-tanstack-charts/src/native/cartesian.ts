import {
  areaY,
  barX,
  barY,
  colorLegend,
  dot,
  group,
  lineY,
  rect,
  ruleY,
  stack,
} from '@tanstack/charts';
import { scaleBand } from '@tanstack/charts/scales/band';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { scalePoint } from '@tanstack/charts/scales/point';
import type { ResolvedThemeTokens } from '../theme.js';
import type { Row } from '../markup.js';
import {
  axisTitle,
  chartTheme,
  defineNative,
  legendFor,
  paletteFor,
  styleLineWidth,
  type NativeDefinition,
} from './shared.js';
import { num, safeConfigRows, text } from './values.js';

interface SeriesRow {
  x: string | number;
  value: number;
  series: string;
}

interface CategoryRow {
  category: string;
  value: number;
  series: string;
}

export function buildLineArea(
  config: Record<string, unknown>,
  theme: ResolvedThemeTokens,
  kind: 'line' | 'area',
): NativeDefinition | null {
  const source = safeConfigRows(config.data);
  const grouped = config.group !== false;
  const rows: SeriesRow[] = source
    .map((row) => ({
      x: parseX(row.time),
      value: num(row.value) ?? Number.NaN,
      series: grouped ? text(row.group) || '数值' : '数值',
    }))
    .filter((row): row is SeriesRow => row.x != null && Number.isFinite(row.value));
  if (!rows.length) return null;
  const names = unique(rows.map((row) => row.series));
  const stacked = config.stack === true;
  const lineWidth = styleLineWidth(config, theme);
  const marks =
    kind === 'line'
      ? [
          lineY(rows, {
            x: 'x',
            y: 'value',
            z: 'series',
            color: 'series',
            strokeWidth: lineWidth,
            points: rows.length <= 48,
          }),
        ]
      : [
          areaY(rows, {
            x: 'x',
            y: stacked ? 'value' : undefined,
            y1: stacked ? undefined : 0,
            y2: stacked ? undefined : 'value',
            z: 'series',
            color: 'series',
            fillOpacity: stacked ? 0.62 : 0.18,
            layout: stacked ? stack() : undefined,
          }),
          ...(names.length === 1
            ? [
                lineY(rows, {
                  x: 'x',
                  y: 'value',
                  stroke: theme.palette[0],
                  strokeWidth: lineWidth,
                }),
              ]
            : []),
        ];
  const legend = legendFor(names);
  return defineNative({
    marks,
    scales: {
      x: {
        scale: () => scalePoint<string | number>().padding(0.16),
        axis: { label: axisTitle(config, 'axisXTitle') },
      },
      y: {
        scale: scaleLinear,
        nice: true,
        grid: true,
        axis: { label: axisTitle(config, 'axisYTitle') },
      },
    },
    ...(legend ? { color: { legend } } : {}),
    theme: chartTheme(theme),
  });
}

export function buildColumnBar(
  config: Record<string, unknown>,
  theme: ResolvedThemeTokens,
  kind: 'column' | 'bar',
): NativeDefinition | null {
  const grouped = config.group !== false;
  const rows: CategoryRow[] = safeConfigRows(config.data)
    .map((row) => ({
      category: text(row.category || row.name),
      value: num(row.value) ?? Number.NaN,
      series: grouped ? text(row.group) || '数值' : '数值',
    }))
    .filter((row): row is CategoryRow => Boolean(row.category) && Number.isFinite(row.value));
  if (!rows.length) return null;
  const names = unique(rows.map((row) => row.series));
  const stacked = config.stack === true;
  const layout = !stacked && names.length > 1 ? group({ padding: 0.12 }) : undefined;
  const common = {
    value: 'value',
    z: names.length > 1 ? 'series' : undefined,
    color: names.length > 1 ? 'series' : undefined,
    layout,
    inset: 2,
    radius: Math.max(0, Math.min(6, theme.radius / 2)),
  } as const;
  const marks =
    kind === 'column'
      ? [barY(rows, { ...common, x: 'category', y: 'value' })]
      : [barX(rows, { ...common, x: 'value', y: 'category' })];
  const categorical = {
    scale: () => scaleBand<string>().padding(0.18),
    axis: { label: axisTitle(config, kind === 'column' ? 'axisXTitle' : 'axisYTitle') },
  };
  const numeric = {
    scale: scaleLinear,
    nice: true,
    grid: true,
    axis: { label: axisTitle(config, kind === 'column' ? 'axisYTitle' : 'axisXTitle') },
  };
  const legend = legendFor(names);
  return defineNative({
    marks,
    scales: kind === 'column' ? { x: categorical, y: numeric } : { x: numeric, y: categorical },
    ...(legend ? { color: { legend } } : {}),
    theme: chartTheme(theme),
  });
}

export function buildScatter(config: Record<string, unknown>, theme: ResolvedThemeTokens): NativeDefinition | null {
  const rows = safeConfigRows(config.data)
    .map((row) => ({
      x: num(row.x) ?? Number.NaN,
      y: num(row.y) ?? Number.NaN,
      series: text(row.group) || '样本',
    }))
    .filter((row): row is { x: number; y: number; series: string } => Number.isFinite(row.x) && Number.isFinite(row.y));
  if (!rows.length) return null;
  const names = unique(rows.map((row) => row.series));
  const legend = legendFor(names);
  return defineNative({
    marks: [dot(rows, { x: 'x', y: 'y', color: 'series', z: 'series', r: 4.5 })],
    scales: {
      x: {
        scale: scaleLinear,
        nice: true,
        grid: true,
        axis: { label: axisTitle(config, 'axisXTitle') },
      },
      y: {
        scale: scaleLinear,
        nice: true,
        grid: true,
        axis: { label: axisTitle(config, 'axisYTitle') },
      },
    },
    ...(legend ? { color: { legend } } : {}),
    theme: chartTheme(theme),
  });
}

interface DualRow {
  category: string;
  value: number;
  series: string;
  axis: 'left' | 'right';
  kind: 'line' | 'column';
}

export function buildDualAxes(config: Record<string, unknown>, theme: ResolvedThemeTokens): NativeDefinition | null {
  const categories = Array.isArray(config.categories) ? config.categories.map(text) : [];
  const series = safeConfigRows(config.series);
  if (!categories.length || !series.length) return null;
  const rows: DualRow[] = [];
  series.forEach((entry, index) => {
    const values = Array.isArray(entry.data) ? entry.data : [];
    const axis = index === 0 ? 'left' : 'right';
    const name = text(entry.name || entry.axisYTitle) || `系列 ${index + 1}`;
    const kind = entry.type === 'line' ? 'line' : 'column';
    categories.forEach((category, categoryIndex) => {
      const value = num(values[categoryIndex]);
      if (value == null) return;
      rows.push({ category, value, series: name, axis, kind });
    });
  });
  if (!rows.length) return null;
  const names = unique(rows.map((row) => row.series));
  const columns = rows.filter((row) => row.kind === 'column');
  const lines = rows.filter((row) => row.kind === 'line');
  const barMarks = (['left', 'right'] as const).flatMap((axis) => {
    const axisRows = columns.filter((row) => row.axis === axis);
    if (!axisRows.length) return [];
    return [
      barY(axisRows, {
        x: 'category',
        y: 'value',
        z: 'series',
        color: 'series',
        yScale: axis === 'left' ? 'yLeft' : 'yRight',
        layout: group({ padding: 0.14 }),
        inset: 2,
      }),
    ];
  });
  const lineMarks = (['left', 'right'] as const).flatMap((axis) => {
    const axisRows = lines.filter((row) => row.axis === axis);
    if (!axisRows.length) return [];
    return [
      lineY(axisRows, {
        x: 'category',
        y: 'value',
        z: 'series',
        color: 'series',
        yScale: axis === 'left' ? 'yLeft' : 'yRight',
        points: true,
        strokeWidth: 2,
      }),
    ];
  });
  const firstLeft = series[0];
  const firstRight = series[1];
  const legend = legendFor(names);
  return defineNative({
    marks: [...barMarks, ...lineMarks],
    scales: {
      x: {
        scale: () => scaleBand<string>().padding(0.2),
        channel: 'x',
        axis: { label: axisTitle(config, 'axisXTitle') },
      },
      y: null,
      yLeft: {
        scale: scaleLinear,
        channel: 'y',
        nice: true,
        side: 'left',
        grid: true,
        axis: { label: text(firstLeft?.axisYTitle) || axisTitle(config, 'axisYTitle') },
      },
      yRight: {
        scale: scaleLinear,
        channel: 'y',
        nice: true,
        side: 'right',
        axis: { label: text(firstRight?.axisYTitle) || '' },
      },
    },
    ...(legend ? { color: { legend } } : {}),
    theme: chartTheme(theme),
  });
}

interface WaterfallRow {
  category: string;
  start: number;
  end: number;
  delta: number;
  kind: 'positive' | 'negative' | 'total';
}

export function buildWaterfall(config: Record<string, unknown>, theme: ResolvedThemeTokens): NativeDefinition | null {
  const source = safeConfigRows(config.data);
  const rows: WaterfallRow[] = [];
  let cursor = 0;
  for (const row of source) {
    const category = text(row.category || row.name);
    if (!category) continue;
    const total = row.isTotal === true || row.isIntermediateTotal === true;
    const value = num(row.value);
    if (total) {
      const end = value ?? cursor;
      rows.push({ category, start: 0, end, delta: end, kind: 'total' });
      cursor = end;
      continue;
    }
    if (value == null) continue;
    const start = cursor;
    const end = start + value;
    rows.push({ category, start, end, delta: value, kind: value < 0 ? 'negative' : 'positive' });
    cursor = end;
  }
  if (!rows.length) return null;
  const marks = [
    ruleY([0], { stroke: theme.muted, strokeOpacity: 0.6, strokeWidth: 1 }),
    barY(rows, {
      x: 'category',
      y1: 'start',
      y2: 'end',
      fill: (row: WaterfallRow) =>
        row.kind === 'total' ? theme.total : row.kind === 'negative' ? theme.negative : theme.positive,
      inset: 2,
      radius: 2,
    }),
  ];
  return defineNative({
    marks,
    scales: {
      x: {
        scale: () => scaleBand<string>().padding(0.2),
        axis: { label: axisTitle(config, 'axisXTitle') },
      },
      y: {
        scale: scaleLinear,
        nice: true,
        grid: true,
        axis: { label: axisTitle(config, 'axisYTitle') },
      },
    },
    theme: chartTheme(theme),
  });
}

export function buildHistogram(config: Record<string, unknown>, theme: ResolvedThemeTokens): NativeDefinition | null {
  const values = Array.isArray(config.data)
    ? config.data.map(num).filter((value): value is number => value != null)
    : [];
  if (!values.length) return null;
  const binNumber = Math.max(1, Math.min(40, Math.round(num(config.binNumber) ?? 8)));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = (max - min || 1) / binNumber;
  const bins = Array.from({ length: binNumber }, (_, index) => ({
    x1: min + index * step,
    x2: min + (index + 1) * step,
    count: 0,
  }));
  for (const value of values) {
    const index = Math.min(binNumber - 1, Math.max(0, Math.floor((value - min) / step)));
    const bin = bins[index];
    if (bin) bin.count += 1;
  }
  return defineNative({
    marks: [
      rect(bins, {
        x1: 'x1',
        x2: 'x2',
        y1: () => 0,
        y2: 'count',
        fill: theme.palette[0],
        inset: 1.2,
        radius: 1,
      }),
    ],
    scales: {
      x: {
        scale: scaleLinear,
        nice: true,
        axis: { label: axisTitle(config, 'axisXTitle') },
      },
      y: {
        scale: scaleLinear,
        nice: true,
        grid: true,
        axis: { label: axisTitle(config, 'axisYTitle', '频数') },
      },
    },
    theme: chartTheme(theme),
  });
}

function parseX(value: unknown): string | number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) return value;
  return null;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
