import { describe, expect, it } from 'vitest';
import { resolveTheme, safeColor, safePalette } from '../src/theme';

describe('theme resolution', () => {
  it('maps built-in themes', () => {
    expect(resolveTheme('dark').background).toBe('#14191a');
    expect(resolveTheme('academy').palette[0]).toBe('#4e79a7');
    expect(resolveTheme('light').name).toBe('default');
  });

  it('maps GPT-Vis ThemeSpec tokens', () => {
    const theme = resolveTheme({
      id: 'brand',
      label: 'Brand',
      baseTheme: 'dark',
      tokens: {
        colorBackground: '#ffffff',
        colorText: '#111111',
        colorStroke: '#dddddd',
        category10: ['#123456', '#abcdef'],
        colorPositive: '#008800',
      },
    });
    expect(theme.background).toBe('#ffffff');
    expect(theme.text).toBe('#111111');
    expect(theme.grid).toBe('#dddddd');
    expect(theme.palette).toEqual(['#123456', '#abcdef']);
    expect(theme.positive).toBe('#008800');
  });

  it('rejects unsafe colors', () => {
    expect(safeColor('url(javascript:alert(1))', '#000000')).toBe('#000000');
    expect(safeColor('#ff0000')).toBe('#ff0000');
    expect(safePalette(['red', 'url(x)'], ['#000'])).toEqual(['red']);
  });
});
