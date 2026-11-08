import { SUPPORTED, chartLabel } from './catalog.js';
import {
  renderFishbone,
  renderFunnel,
  renderLiquid,
  renderMindmap,
  renderNetwork,
  renderPending,
  renderSummaryView,
  renderTable,
  renderUnsupported,
  renderVenn,
  renderWordCloud,
} from './markup.js';
import { readConfig } from './parser.js';
import { resolveTheme, safeColor, type ResolvedThemeTokens, type VisualizationTheme } from './theme.js';
import { buildNativeChart, MARKUP_TYPES, type NativeDefinition } from './native/index.js';

export interface ViewContext {
  theme?: VisualizationTheme;
  streaming?: boolean;
  width?: number;
  height?: number;
}

export type View =
  | {
      kind: 'tanstack';
      definition: NativeDefinition;
      background: string;
      foreground: string;
      message: string;
      title: string;
    }
  | { kind: 'html'; html: string; background: string; foreground: string; message: string }
  | { kind: 'pending'; html: string; background: string; foreground: string; message: string }
  | { kind: 'error'; html: string; background: string; foreground: string; message: string };

export function buildView(input: unknown, context: ViewContext = {}): View {
  const config = readConfig(input, { streaming: context.streaming });
  const theme = resolveTheme(config.theme, context.theme ?? 'default');
  const background = safeColor(styleOf(config).backgroundColor, theme.background) ?? theme.background;
  const foreground = theme.text;

  if (!config.type) {
    return pending(
      context.streaming ? '正在等待 vis 语法…' : '写一行 vis line、vis bar 或其他图表类型。',
      background,
      foreground,
    );
  }
  if (!SUPPORTED.has(config.type)) {
    const stillTyping =
      context.streaming && typeof input === 'string' && !unwrapFirstLine(input).closed;
    if (stillTyping) return pending('正在识别图表类型…', background, foreground);
    return {
      kind: 'error',
      html: renderUnsupported(config.type),
      background,
      foreground,
      message: `不支持的类型 ${config.type}`,
    };
  }

  const html = markupFor(config, theme, context);
  if (html?.includes('data-gvtc="limited"')) {
    return { kind: 'error', html, background, foreground, message: '韦恩图只支持二到三个集合' };
  }
  if (html) {
    return { kind: 'html', html, background, foreground, message: `${chartLabel(config.type)} · 已渲染` };
  }
  if (MARKUP_TYPES.has(config.type)) {
    return pending(`${chartLabel(config.type)}还缺数据。`, background, foreground);
  }

  const definition = buildNativeChart(config, {
    theme,
    width: context.width,
    height: context.height,
  });
  if (!definition) return pending(`${chartLabel(config.type)}还缺可绘制的数据。`, background, foreground);
  return {
    kind: 'tanstack',
    definition,
    background,
    foreground,
    message: `${chartLabel(config.type)} · 已渲染`,
    title: typeof config.title === 'string' ? config.title : '',
  };
}

function pending(message: string, background: string, foreground: string): View {
  return { kind: 'pending', html: renderPending(message), background, foreground, message };
}

function unwrapFirstLine(input: string): { closed: boolean } {
  const body = input.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trimStart();
  const fenced = body.startsWith('```');
  const source = fenced ? body.slice(body.indexOf('\n') + 1) : body;
  const newline = source.indexOf('\n');
  return { closed: newline >= 0 };
}

function styleOf(config: Record<string, unknown>): Record<string, unknown> {
  return config.style && typeof config.style === 'object' && !Array.isArray(config.style)
    ? (config.style as Record<string, unknown>)
    : {};
}

function markupFor(
  config: Record<string, unknown>,
  theme: ResolvedThemeTokens,
  context: ViewContext,
): string | null {
  switch (config.type) {
    case 'liquid':
      return renderLiquid(config, theme);
    case 'table':
      return renderTable(config, theme);
    case 'summary':
      return renderSummaryView(config, theme);
    case 'word-cloud':
      return renderWordCloud(config, theme);
    case 'venn':
      return renderVenn(config, theme);
    case 'fishbone-diagram':
      return renderFishbone(config, theme);
    case 'funnel':
      return renderFunnel(config, theme);
    case 'network-graph':
      return renderNetwork(config, theme, context.width, context.height);
    case 'mindmap':
      return renderMindmap(config, theme, context.width, context.height);
    default:
      return null;
  }
}
