import type { ResolvedThemeTokens } from '../theme.js';
import {
  buildColumnBar,
  buildDualAxes,
  buildHistogram,
  buildLineArea,
  buildScatter,
  buildWaterfall,
} from './cartesian.js';
import { buildBoxplot, buildViolin } from './distribution.js';
import { buildSankey, buildTree, buildTreemap } from './hierarchy.js';
import { buildPie, buildRadar } from './polar.js';
import type { NativeDefinition } from './shared.js';

export type { NativeDefinition } from './shared.js';

export interface NativeBuildContext {
  theme: ResolvedThemeTokens;
  width?: number;
  height?: number;
}

export function buildNativeChart(
  config: Record<string, unknown>,
  context: NativeBuildContext,
): NativeDefinition | null {
  const type = config.type;
  const theme = context.theme;
  switch (type) {
    case 'line':
    case 'area':
      return buildLineArea(config, theme, type);
    case 'column':
    case 'bar':
      return buildColumnBar(config, theme, type);
    case 'pie':
      return buildPie(config, theme);
    case 'scatter':
      return buildScatter(config, theme);
    case 'radar':
      return buildRadar(config, theme);
    case 'waterfall':
      return buildWaterfall(config, theme);
    case 'dual-axes':
      return buildDualAxes(config, theme);
    case 'histogram':
      return buildHistogram(config, theme);
    case 'boxplot':
      return buildBoxplot(config, theme);
    case 'violin':
      return buildViolin(config, theme);
    case 'sankey':
    case 'flow-diagram':
      return buildSankey(config, theme);
    case 'treemap':
      return buildTreemap(config, theme);
    case 'indented-tree':
    case 'organization-chart':
      return buildTree(config, theme, type);
    default:
      return null;
  }
}

export const MARKUP_TYPES = new Set([
  'funnel',
  'network-graph',
  'mindmap',
  'fishbone-diagram',
  'venn',
  'word-cloud',
  'liquid',
  'table',
  'summary',
]);
