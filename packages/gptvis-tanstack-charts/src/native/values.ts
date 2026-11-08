import type { Row } from '../markup.js';

export function num(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function text(value: unknown): string {
  return value == null ? '' : String(value);
}

export function safeConfigRows(data: unknown): Row[] {
  if (!Array.isArray(data)) return [];
  return data.filter((item): item is Row => Boolean(item) && typeof item === 'object' && !Array.isArray(item));
}

export function styleOf(config: Record<string, unknown>): Record<string, unknown> {
  return config.style && typeof config.style === 'object' && !Array.isArray(config.style)
    ? (config.style as Record<string, unknown>)
    : {};
}

const COLOR = /^(?:#[0-9a-f]{3,8}|rgba?\([\d.%\s,/+-]+\)|hsla?\([\d.%\s,/+-]+\)|[a-z]{3,20})$/i;

export function safeColor(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const color = value.trim();
  return COLOR.test(color) ? color : undefined;
}

export function safePalette(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const colors = value.map(safeColor).filter((item): item is string => Boolean(item));
  return colors.length ? colors : fallback;
}
