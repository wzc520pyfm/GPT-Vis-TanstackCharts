import {
  angleGrid,
  pie,
  polar,
  radialArc,
  radialArea,
  radialGrid,
  radialLine,
} from '@tanstack/charts/polar';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { scalePoint } from '@tanstack/charts/scales/point';
import type { ResolvedThemeTokens } from '../theme.js';
import {
  chartTheme,
  defineNative,
  legendFor,
  type NativeDefinition,
} from './shared.js';
import { num, safeConfigRows, text } from './values.js';

interface PieRow {
  category: string;
  value: number;
}

export function buildPie(config: Record<string, unknown>, theme: ResolvedThemeTokens): NativeDefinition | null {
  const rows: PieRow[] = safeConfigRows(config.data)
    .map((row) => ({ category: text(row.category || row.name), value: num(row.value) ?? Number.NaN }))
    .filter((row): row is PieRow => Boolean(row.category) && Number.isFinite(row.value) && row.value >= 0);
  if (!rows.length) return null;
  const inner = num(config.innerRadius) ?? 0;
  const ratio = Math.max(0, Math.min(0.85, inner > 1 ? inner / 100 : inner));
  const slices = pie(rows, { value: 'value' });
  const names = rows.map((row) => row.category);
  const legend = legendFor(names);
  return defineNative({
    marks: [
      polar({
        inset: 12,
        radiusRatio: 0.78,
        marks: [
          radialArc(slices, {
            innerRadius: ({ radius }) => radius * ratio,
            color: 'category',
            key: 'category',
            cornerRadius: 2,
            stroke: theme.background,
            strokeWidth: 1.5,
          }),
        ],
        scales: { angle: null, radius: null },
      }),
    ],
    scales: { x: null, y: null },
    ...(legend ? { color: { legend } } : {}),
    theme: chartTheme(theme),
  });
}

interface RadarRow {
  name: string;
  value: number;
  series: string;
}

export function buildRadar(config: Record<string, unknown>, theme: ResolvedThemeTokens): NativeDefinition | null {
  const grouped = config.group !== false;
  const rows: RadarRow[] = safeConfigRows(config.data)
    .map((row) => ({
      name: text(row.name || row.category),
      value: num(row.value) ?? Number.NaN,
      series: grouped ? text(row.group) || '数值' : '数值',
    }))
    .filter((row): row is RadarRow => Boolean(row.name) && Number.isFinite(row.value));
  if (!rows.length) return null;
  const names = unique(rows.map((row) => row.name));
  const series = unique(rows.map((row) => row.series));
  const max = Math.max(...rows.map((row) => row.value), 1);
  const legend = legendFor(series);
  return defineNative({
    marks: [
      polar({
        radiusRatio: 0.72,
        scales: {
          angle: { scale: scalePoint<string>().domain(names), wrap: true },
          radius: { scale: scaleLinear().domain([0, max]), nice: true },
        },
        guides: [
          radialGrid({ values: [0.25, 0.5, 0.75, 1], shape: 'polygon' }),
          angleGrid({ labels: true }),
        ],
        marks: [
          radialArea(rows, {
            angle: 'name',
            radius: 'value',
            z: 'series',
            color: 'series',
            fillOpacity: series.length > 1 ? 0.12 : 0.2,
          }),
          radialLine(rows, {
            angle: 'name',
            radius: 'value',
            z: 'series',
            color: 'series',
            strokeWidth: 2,
            points: true,
          }),
        ],
      }),
    ],
    scales: { x: null, y: null },
    ...(legend ? { color: { legend } } : {}),
    theme: chartTheme(theme),
  });
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
