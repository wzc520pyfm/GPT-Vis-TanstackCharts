import { colorLegend, defineChart, type StaticChartDefinition } from '@tanstack/charts';
import { tooltip } from '@tanstack/charts/tooltip';
import type { ResolvedThemeTokens } from '../theme.js';
import { num, safeConfigRows, safePalette, styleOf, text } from './values.js';
import type { Row } from '../markup.js';

export type NativeDefinition = StaticChartDefinition<any, any, any, 'dom'>;

export interface NativeContext {
  theme: ResolvedThemeTokens;
  width?: number;
  height?: number;
}

export function chartTheme(theme: ResolvedThemeTokens) {
  return {
    foreground: theme.text,
    muted: theme.muted,
    grid: theme.grid,
    background: theme.background,
    palette: theme.palette,
  };
}

export function defineNative(spec: Record<string, unknown>): NativeDefinition {
  return defineChart({ ...spec, tooltip } as never) as unknown as NativeDefinition;
}

export function legendFor(labels: string[], label = '') {
  if (labels.length < 2) return undefined;
  return colorLegend({ label, itemWidth: 72 });
}

export function paletteFor(config: Record<string, unknown>, theme: ResolvedThemeTokens): string[] {
  return safePalette(styleOf(config).palette, theme.palette);
}

export function rowsOf(data: unknown): Row[] {
  return safeConfigRows(data);
}

export function readNumber(value: unknown): number | null {
  return num(value);
}

export function readText(value: unknown): string {
  return text(value);
}

export function seriesNames(rows: Row[]): string[] {
  const names: string[] = [];
  for (const row of rows) {
    const name = text(row.series);
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

export function finiteRows(rows: Row[], xKey: string, yKey: string): Row[] {
  return rows.filter((row) => row[xKey] != null && num(row[yKey]) != null);
}

export function titleOf(config: Record<string, unknown>): string {
  return text(config.title);
}

export function axisTitle(config: Record<string, unknown>, key: string, fallback = ''): string {
  return text(config[key]) || fallback;
}

export function styleLineWidth(config: Record<string, unknown>, theme: ResolvedThemeTokens): number {
  return num(styleOf(config).lineWidth) ?? theme.lineWidth;
}

export function titleHeight(config: Record<string, unknown>): number {
  return titleOf(config) ? 48 : 16;
}
