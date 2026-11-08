import { mountChart } from '@tanstack/charts/dom';
import { buildView, type View } from './build.js';
import { chartLabel } from './catalog.js';
import type { VisualizationTheme } from './theme.js';
import { copyText, downloadChart, mountVisShell, type VisShell } from './wrapper.js';

const ZOOMABLE = new Set([
  'flow-diagram',
  'network-graph',
  'mindmap',
  'indented-tree',
  'organization-chart',
  'fishbone-diagram',
]);

export interface GPTVisOptions {
  container: string | HTMLElement;
  width?: number;
  height?: number;
  theme?: VisualizationTheme;
  streaming?: boolean;
  wrapper?: boolean;
  locale?: string;
  ariaLabel?: string;
  onStatus?: (status: RenderStatus) => void;
}

export interface RenderStatus {
  state: 'pending' | 'ready' | 'unsupported' | 'error';
  message: string;
}

type NativeHost = ReturnType<typeof mountChart>;

export class GPTVis {
  private root: HTMLElement;
  private chartHost: HTMLDivElement;
  private chartTitle: HTMLDivElement;
  private chartSurface: HTMLDivElement;
  private fallback: HTMLDivElement;
  private host: NativeHost | null = null;
  private options: GPTVisOptions;
  private shell: VisShell | null = null;
  private sourceText = '';
  private zoom = 1;
  private lastView: View | null = null;

  constructor(options: GPTVisOptions) {
    this.options = options;
    const container = resolveContainer(options.container);
    container.replaceChildren();
    if (options.wrapper) {
      this.shell = mountVisShell(container, options.locale, {
        download: () => downloadChart('gptvis-tanstack', this.root),
        copy: () => {
          void copyText(this.sourceText);
        },
        zoomIn: () => this.zoomTo(this.getZoom() * 1.2),
        zoomOut: () => this.zoomTo(this.getZoom() / 1.2),
      });
    }
    this.root = document.createElement('div');
    this.root.className = 'gvtc-root';
    this.chartHost = document.createElement('div');
    this.chartHost.className = 'gvtc-chart';
    this.chartTitle = document.createElement('div');
    this.chartTitle.className = 'gvtc-chart-title';
    this.chartSurface = document.createElement('div');
    this.chartSurface.className = 'gvtc-chart-surface';
    this.chartHost.append(this.chartTitle, this.chartSurface);
    this.fallback = document.createElement('div');
    this.fallback.className = 'gvtc-fallback';
    this.fallback.hidden = true;
    this.root.append(this.chartHost, this.fallback);
    (this.shell?.chartSlot ?? container).append(this.root);
    ensureStyles();
  }

  render(input: string | Record<string, unknown>): void {
    this.sourceText = typeof input === 'string' ? input : JSON.stringify(input, null, 2);
    this.shell?.setSource(this.sourceText);
    const box = this.root.getBoundingClientRect();
    let view: View;
    try {
      view = buildView(input, {
        theme: this.options.theme,
        streaming: this.options.streaming,
        width: this.options.width || box.width || undefined,
        height: this.options.height || box.height || undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '图表渲染失败';
      this.showFallback(`<div class="gvtc-status"><p>${escapeHtml(message)}</p></div>`, 'transparent');
      this.options.onStatus?.({ state: 'error', message });
      return;
    }

    this.lastView = view;
    this.shell?.setZoomVisible(ZOOMABLE.has(readType(input)));
    this.root.style.background = view.background;
    this.root.style.color = view.foreground;
    this.root.style.setProperty('--gvtc-background', view.background);
    this.shell?.setForeground(view.foreground);

    if (view.kind === 'tanstack') {
      this.updateNative(view);
      this.options.onStatus?.({ state: 'ready', message: view.message });
      return;
    }

    this.destroyHost();
    this.showFallback(view.html, view.background);
    const state = view.kind === 'pending' ? 'pending' : view.kind === 'error' ? 'unsupported' : 'ready';
    this.options.onStatus?.({ state, message: view.message });
  }

  resize(): void {
    if (this.lastView?.kind === 'tanstack') this.updateNative(this.lastView);
  }

  zoomTo(zoom: number): void {
    if (!Number.isFinite(zoom)) return;
    this.zoom = Math.min(4, Math.max(0.25, zoom));
    this.applyZoom();
  }

  getZoom(): number {
    return this.zoom;
  }

  destroy(): void {
    this.destroyHost();
    if (this.shell) this.shell.destroy();
    else this.root.remove();
    this.shell = null;
  }

  private updateNative(view: Extract<View, { kind: 'tanstack' }>): void {
    this.fallback.hidden = true;
    this.fallback.innerHTML = '';
    this.chartHost.hidden = false;
    this.chartTitle.textContent = view.title;
    this.chartTitle.hidden = !view.title;
    const height = this.nativeHeight(Boolean(view.title));
    const width = this.options.width || undefined;
    const ariaLabel = this.options.ariaLabel || view.title || 'TanStack chart';
    const hostOptions = {
      definition: view.definition,
      height,
      initialWidth: width ?? Math.max(280, this.root.clientWidth || 640),
      ...(width ? { width } : {}),
      ariaLabel,
    };
    if (!this.host) {
      this.chartSurface.replaceChildren();
      this.host = mountChart(this.chartSurface, hostOptions);
    } else {
      this.host.update(hostOptions);
    }
    this.applyZoom();
  }

  private nativeHeight(hasTitle: boolean): number {
    const box = this.root.getBoundingClientRect();
    const explicit = this.options.height;
    if (explicit) return Math.max(180, explicit - (hasTitle ? 34 : 0));
    return Math.max(240, (box.height || 360) - (hasTitle ? 34 : 0));
  }

  private applyZoom(): void {
    const target = this.lastView?.kind === 'tanstack' ? this.chartSurface : this.fallback;
    target.style.transform = this.zoom === 1 ? '' : `scale(${this.zoom})`;
    target.style.transformOrigin = 'center top';
  }

  private showFallback(html: string, background: string): void {
    this.chartHost.hidden = true;
    this.fallback.hidden = false;
    this.fallback.style.background = background;
    this.fallback.innerHTML = html;
  }

  private destroyHost(): void {
    this.host?.destroy();
    this.host = null;
    this.chartSurface.replaceChildren();
    this.chartSurface.style.transform = '';
  }
}

function resolveContainer(container: string | HTMLElement): HTMLElement {
  if (typeof container !== 'string') return container;
  const element = document.querySelector(container);
  if (!(element instanceof HTMLElement)) throw new Error(`找不到容器：${container}`);
  return element;
}

function readType(input: string | Record<string, unknown>): string {
  if (typeof input !== 'string') return typeof input.type === 'string' ? input.type : '';
  const match = input.replace(/^\uFEFF/, '').match(/(?:^|\n)\s*vis\s+([\w-]+)/);
  return match?.[1] ?? '';
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);
}

const STYLE_ID = 'gvtc-styles';

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLES;
  document.head.append(style);
}

const STYLES = `
.gvtc-root, .gvtc-chart, .gvtc-chart-surface, .gvtc-fallback {
  width: 100%; height: 100%;
}
.gvtc-root [hidden], .gvtc-shell [hidden] { display: none !important; }
.gvtc-root { position: relative; min-height: 280px; overflow: hidden; color: var(--gvtc-ink, inherit); }
.gvtc-chart { display: flex; flex-direction: column; min-height: 280px; }
.gvtc-chart-title { flex: 0 0 34px; padding: 8px 10px 0; font-size: 15px; font-weight: 650; letter-spacing: 0; }
.gvtc-chart-surface { flex: 1; min-height: 220px; overflow: hidden; }
.gvtc-chart-surface > svg { display: block; }
.gvtc-fallback { overflow: auto; }
.gvtc-fallback h3, .gvtc-summary h3, .gvtc-table h3, .gvtc-cloud h3, .gvtc-venn h3, .gvtc-svgchart h3, .gvtc-liquid h3 {
  margin: 0; padding: 16px 18px 0; font-size: 16px; font-weight: 600; letter-spacing: 0;
}
.gvtc-status { min-height: 280px; display: grid; place-items: center; align-content: center; gap: 6px; padding: 28px; text-align: center; }
.gvtc-status p { margin: 0; font-size: 16px; }
.gvtc-status span { color: inherit; opacity: 0.72; font-size: 13px; }
.gvtc-table, .gvtc-summary, .gvtc-cloud, .gvtc-venn, .gvtc-svgchart, .gvtc-liquid { color: var(--ink); min-height: 100%; }
.gvtc-table-scroll { overflow: auto; padding: 12px 16px 18px; }
.gvtc-table table { width: 100%; border-collapse: collapse; font-size: 14px; }
.gvtc-table th, .gvtc-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--line); white-space: nowrap; }
.gvtc-table th { color: var(--muted); font-weight: 600; font-size: 12px; letter-spacing: 0.04em; }
.gvtc-table tbody tr:hover td { background: color-mix(in srgb, var(--line) 55%, transparent); }
.gvtc-summary { padding: 8px 20px 22px; line-height: 1.65; }
.gvtc-summary p, .gvtc-summary ul { margin: 10px 0; }
.gvtc-summary h3, .gvtc-summary h4, .gvtc-summary h5 { padding-left: 0; padding-right: 0; }
.gvtc-summary code { font-family: ui-monospace, monospace; font-size: 0.92em; }
.gvtc-chip { display: inline-flex; align-items: center; gap: 4px; margin: 0 2px; padding: 0 6px; border-radius: 999px; background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--accent); font-weight: 600; }
.gvtc-chip.pos, .gvtc-chip.delta { background: color-mix(in srgb, #2f7d4a 16%, transparent); color: #2f7d4a; }
.gvtc-chip.neg { background: color-mix(in srgb, #a33b32 16%, transparent); color: #a33b32; }
.gvtc-chip.eq, .gvtc-chip.meta { background: color-mix(in srgb, var(--muted) 18%, transparent); color: var(--ink); font-weight: 600; }
.gvtc-spark { display: inline-block; vertical-align: middle; }
.gvtc-cloud-board { position: relative; height: 360px; margin: 8px 12px 16px; }
.gvtc-cloud-board span { position: absolute; line-height: 1; font-weight: 600; white-space: nowrap; }
.gvtc-liquid { display: grid; justify-items: center; align-content: center; gap: 18px; min-height: 100%; padding: 24px; }
.gvtc-liquid h3 { padding: 0; }
.gvtc-liquid-svg { width: min(240px, 72%); height: auto; }
.gvtc-liquid-svg text { fill: var(--ink); font-size: 28px; font-weight: 600; }
.gvtc-shell { display: flex; flex-direction: column; width: 100%; height: 100%; min-height: 320px; border: 1px solid color-mix(in srgb, currentColor 12%, transparent); border-radius: 16px; overflow: hidden; background: inherit; }
.gvtc-shell-bar { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px 12px; align-items: center; padding: 8px 10px; border-bottom: 1px solid color-mix(in srgb, currentColor 8%, transparent); }
.gvtc-shell-tabs, .gvtc-shell-actions { display: flex; flex: 0 0 auto; gap: 6px; align-items: center; }
.gvtc-shell-tab, .gvtc-shell-icon { flex: 0 0 auto; border: 0; background: transparent; color: inherit; opacity: 0.72; border-radius: 999px; padding: 6px 8px; font-family: inherit; font-size: 13px; font-weight: 600; line-height: 1; white-space: nowrap; cursor: pointer; }
.gvtc-shell-tab.on { background: color-mix(in srgb, currentColor 14%, transparent); color: inherit; opacity: 1; }
.gvtc-shell-chart { flex: 1; min-height: 280px; }
.gvtc-shell-code { margin: 0; padding: 16px 18px; overflow: auto; flex: 1; white-space: pre-wrap; font: 13px/1.55 ui-monospace, monospace; }
.gvtc-venn svg, .gvtc-svgchart svg { width: 100%; height: auto; display: block; }
.gvtc-venn text, .gvtc-svgchart text { fill: var(--ink); font-size: 13px; }
.gvtc-venn-name, .gvtc-bone { font-weight: 600; }
.gvtc-head { font-size: 13px; font-weight: 600; }
.gvtc-edge-label { font-size: 11px; fill: var(--muted); }
`;
