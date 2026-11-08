import { describe, expect, it } from 'vitest';
import * as api from '../src/index';

const CONSTRUCTORS = [
  'GPTVis',
  'bindGPTVis',
  'parse',
  'isVisSyntax',
  'Area',
  'Bar',
  'Boxplot',
  'Column',
  'DualAxes',
  'FishboneDiagram',
  'FlowDiagram',
  'Funnel',
  'Histogram',
  'IndentedTree',
  'Line',
  'Liquid',
  'Mindmap',
  'NetworkGraph',
  'OrganizationChart',
  'Pie',
  'Radar',
  'Sankey',
  'Scatter',
  'Summary',
  'Table',
  'Treemap',
  'Venn',
  'Violin',
  'Waterfall',
  'WordCloud',
];

describe('GPT-Vis TanStack entry', () => {
  it('exports the same constructors without leaking React into the main entry', () => {
    const surface = api as unknown as Record<string, unknown>;
    for (const name of CONSTRUCTORS) expect(typeof surface[name]).toBe('function');
    expect(api.CHARTS).toHaveLength(26);
    expect('GPTVisChart' in surface).toBe(false);
  });
});
