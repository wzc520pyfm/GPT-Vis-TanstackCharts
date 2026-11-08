import { boxY, dot, tickY, violinY } from '@tanstack/charts';
import { scaleBand } from '@tanstack/charts/scales/band';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { scalePoint } from '@tanstack/charts/scales/point';
import type { ResolvedThemeTokens } from '../theme.js';
import {
  axisTitle,
  chartTheme,
  defineNative,
  legendFor,
  type NativeDefinition,
} from './shared.js';
import { num, safeConfigRows, text } from './values.js';

interface DistributionRow {
  category: string;
  value: number;
  group: string;
}

export function buildBoxplot(config: Record<string, unknown>, theme: ResolvedThemeTokens): NativeDefinition | null {
  const grouped = config.group !== false;
  const rows: DistributionRow[] = safeConfigRows(config.data)
    .map((row) => ({
      category: text(row.category || row.name || '全部'),
      value: num(row.value) ?? Number.NaN,
      group: grouped ? text(row.group) : '',
    }))
    .filter((row): row is DistributionRow => Boolean(row.category) && Number.isFinite(row.value));
  if (!rows.length) return null;
  const display = rows.map((row) => ({
    ...row,
    x: row.group ? `${row.category} · ${row.group}` : row.category,
  }));
  const categories = unique(display.map((row) => row.x));
  const startAtZero = styleStartAtZero(config);
  return defineNative({
    marks: [
      boxY(display, {
        x: 'x',
        y: 'value',
        fill: theme.palette[0],
        stroke: theme.palette[2] ?? theme.total,
        strokeWidth: 1.4,
        inset: 4,
        r: 3,
      }),
    ],
    scales: {
      x: {
        scale: () => scaleBand<string>().domain(categories).padding(0.22),
        axis: { label: axisTitle(config, 'axisXTitle') },
      },
      y: {
        scale: startAtZero ? scaleLinear().domain([0, 1]) : scaleLinear,
        nice: true,
        grid: true,
        axis: { label: axisTitle(config, 'axisYTitle') },
      },
    },
    theme: chartTheme(theme),
  });
}

interface ViolinProfile {
  category: string;
  y: number;
  width: number;
}

interface ViolinSummary {
  category: string;
  median: number;
}

export function buildViolin(config: Record<string, unknown>, theme: ResolvedThemeTokens): NativeDefinition | null {
  const grouped = config.group !== false;
  const rows: DistributionRow[] = safeConfigRows(config.data)
    .map((row) => ({
      category: text(row.category || row.name || '全部'),
      value: num(row.value) ?? Number.NaN,
      group: grouped ? text(row.group) : '',
    }))
    .filter((row): row is DistributionRow => Boolean(row.category) && Number.isFinite(row.value));
  if (!rows.length) return null;
  const groups = new Map<string, number[]>();
  for (const row of rows) {
    const key = row.group ? `${row.category} · ${row.group}` : row.category;
    groups.set(key, [...(groups.get(key) ?? []), row.value]);
  }
  const bins = 18;
  const profile: ViolinProfile[] = [];
  const summaries: ViolinSummary[] = [];
  for (const [category, values] of groups) {
    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0] ?? 0;
    const max = sorted[sorted.length - 1] ?? 0;
    const span = max - min || 1;
    const counts = Array.from({ length: bins }, () => 0);
    for (const value of sorted) {
      const index = Math.min(bins - 1, Math.max(0, Math.floor(((value - min) / span) * (bins - 1))));
      counts[index] = (counts[index] ?? 0) + 1;
    }
    const peak = Math.max(...counts, 1);
    counts.forEach((count, index) => {
      profile.push({
        category,
        y: min + ((index + 0.5) / bins) * span,
        width: count / peak,
      });
    });
    const median = sorted[Math.floor(sorted.length / 2)] ?? min;
    summaries.push({ category, median });
  }
  const categories = [...groups.keys()];
  const legend = legendFor(categories);
  return defineNative({
    marks: [
      violinY(profile, {
        x: 'category',
        y: 'y',
        width: 'width',
        color: 'category',
        fillOpacity: 0.6,
        span: 0.82,
      }),
      tickY(summaries, {
        x: 'category',
        y: 'median',
        span: 0.34,
        stroke: theme.text,
        strokeWidth: 1.5,
      }),
      dot(summaries, {
        x: 'category',
        y: 'median',
        fill: theme.text,
        r: 2.8,
      }),
    ],
    scales: {
      x: {
        scale: () => scalePoint<string>().domain(categories).padding(0.5),
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

function styleStartAtZero(config: Record<string, unknown>): boolean {
  return Boolean(
    config.style &&
      typeof config.style === 'object' &&
      (config.style as Record<string, unknown>).startAtZero === true,
  );
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
