import { createChartScene } from '@tanstack/charts';
import { describe, expect, it } from 'vitest';
import { buildView } from '../src/build.js';
import { CHARTS } from '../src/catalog.js';
import { COVERAGE_EXAMPLES } from './fixtures.js';

describe('all 26 vis chart types', () => {
  it('keeps the public catalog and fixtures in sync', () => {
    expect(COVERAGE_EXAMPLES).toHaveLength(26);
    expect(COVERAGE_EXAMPLES.map((example) => example.type).sort()).toEqual(
      CHARTS.map((chart) => chart.type).sort(),
    );
  });

  for (const example of COVERAGE_EXAMPLES) {
    it(`renders ${example.type}`, () => {
      const view = buildView(example.source, { width: 960, height: 540 });
      expect(view.kind).toBe(example.kind);
      expect(view.kind).not.toBe('pending');
      expect(view.kind).not.toBe('error');

      if (view.kind === 'tanstack') {
        expect(view.definition.marks.length).toBeGreaterThan(0);
        expect(() =>
          createChartScene(view.definition, { width: 960, height: 540 }),
        ).not.toThrow();
      } else if (view.kind === 'html') {
        expect(view.html.length).toBeGreaterThan(20);
      }
    });
  }
});
