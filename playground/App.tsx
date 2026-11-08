import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CHARTS,
  readConfig,
  type RenderStatus,
  type ThemeName,
} from 'gptvis-tanstack-charts';
import { GPTVisChart } from 'gptvis-tanstack-charts/react';
import { EXAMPLES, GROUPS, type Example, type ExampleGroup } from './examples';

const THEMES: { id: ThemeName; label: string }[] = [
  { id: 'default', label: '默认' },
  { id: 'light', label: '浅色' },
  { id: 'academy', label: '学院' },
  { id: 'dark', label: '深色' },
];

const REPO_URL = 'https://github.com/wzc520pyfm/GPT-Vis-TanstackCharts';

type Viewport = 'fluid' | 'tablet' | 'phone';

interface StreamState {
  full: string;
  cursor: number;
}

export function App() {
  const first = EXAMPLES[0]!;
  const [source, setSource] = useState(first.source);
  const [activeId, setActiveId] = useState(first.id);
  const [group, setGroup] = useState<'全部' | ExampleGroup>('全部');
  const [theme, setTheme] = useState<ThemeName>('default');
  const [stream, setStream] = useState<StreamState | null>(null);
  const [status, setStatus] = useState<RenderStatus | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [wrapper, setWrapper] = useState(true);
  const [viewport, setViewport] = useState<Viewport>('fluid');
  const timer = useRef<number | null>(null);
  const active = EXAMPLES.find((item) => item.id === activeId);
  const filtered = group === '全部' ? EXAMPLES : EXAMPLES.filter((item) => item.group === group);
  const content = stream ? stream.full.slice(0, stream.cursor) : source;

  useEffect(() => {
    if (!stream) return;
    if (stream.cursor >= stream.full.length) {
      setStream(null);
      return;
    }
    const step = Math.max(2, Math.round(stream.full.length / 150));
    timer.current = window.setTimeout(() => {
      setStream((current) =>
        current ? { ...current, cursor: Math.min(current.full.length, current.cursor + step) } : null,
      );
    }, 26);
    return () => {
      if (timer.current != null) window.clearTimeout(timer.current);
    };
  }, [stream]);

  const parsed = useMemo(() => {
    try {
      return JSON.stringify(readConfig(content, { streaming: Boolean(stream) }), null, 2);
    } catch (error) {
      return error instanceof Error ? error.message : '无法解析';
    }
  }, [content, stream]);

  function choose(example: Example) {
    setStream(null);
    setActiveId(example.id);
    setSource(example.source);
    setStatus(null);
  }

  function play() {
    if (stream) {
      setStream(null);
      return;
    }
    const full = active?.source ?? source;
    setSource(full);
    setStream({ full, cursor: 0 });
  }

  function reset() {
    if (!active) return;
    setStream(null);
    setSource(active.source);
  }

  return (
    <div className="app-shell">
      <header className="masthead">
        <div>
          <p className="kicker">
            GPT-Vis
            <span className="cross">×</span>
            TanStack Charts
          </p>
          <h1>同一套 vis 语法，<br />换一颗原生图表引擎。</h1>
        </div>
        <div className="masthead-copy">
          <a className="repo-link" href={REPO_URL} target="_blank" rel="noreferrer">
            GitHub 仓库
            <span aria-hidden="true">↗</span>
          </a>
          <p>
            面向 LLM 输出的流式可视化适配层。解析与容错保持独立，统计图由
            TanStack Charts 原生 marks 和 scales 绘制。
          </p>
          <div className="headline-stats" aria-label="实现概览">
            <span><strong>26</strong> 图表类型</span>
            <span><strong>17</strong> 原生渲染</span>
            <span><strong>9</strong> HTML/SVG 补充</span>
          </div>
        </div>
      </header>

      <main className="workspace">
        <section className="control-card" aria-label="编辑与样例">
          <div className="section-head">
            <div>
              <p className="section-index">01 / 编写</p>
              <h2>vis 输入</h2>
            </div>
            <span className="char-count">{content.length.toLocaleString()} chars</span>
          </div>

          <div className="group-tabs" role="tablist" aria-label="图表分组">
            {GROUPS.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={group === item}
                className={group === item ? 'group-tab on' : 'group-tab'}
                onClick={() => setGroup(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="example-grid">
            {filtered.map((example) => (
              <button
                key={example.id}
                type="button"
                className={example.id === activeId ? 'example on' : 'example'}
                aria-pressed={example.id === activeId}
                onClick={() => choose(example)}
              >
                <span>{example.label}</span>
                <small>{example.type}</small>
              </button>
            ))}
          </div>

          <div className="active-note">
            <span className={active?.native ? 'mode-badge native' : 'mode-badge html'}>
              {active?.native ? 'TanStack native' : 'HTML / SVG'}
            </span>
            <p>{active?.note ?? '直接编辑下方 vis 语法。'}</p>
          </div>

          <label className="editor-label" htmlFor="vis-source">
            <span>Vis syntax</span>
            <span>支持流式截断</span>
          </label>
          <textarea
            id="vis-source"
            spellCheck={false}
            aria-label="vis 语法编辑器"
            value={content}
            onChange={(event) => {
              setStream(null);
              setActiveId('');
              setSource(event.target.value);
            }}
          />

          <div className="action-row">
            <button type="button" className="primary-action" onClick={play}>
              <span className={stream ? 'stop-icon' : 'play-icon'} aria-hidden="true" />
              {stream ? '停止流式' : '模拟流式输出'}
            </button>
            <button type="button" className="quiet-action" onClick={reset} disabled={!active}>
              恢复样例
            </button>
            <button
              type="button"
              className={showConfig ? 'quiet-action on' : 'quiet-action'}
              onClick={() => setShowConfig((value) => !value)}
              aria-expanded={showConfig}
            >
              {showConfig ? '收起解析' : '查看解析'}
            </button>
          </div>

          {showConfig ? <pre className="config-panel">{parsed}</pre> : null}
        </section>

        <section className="preview-card" aria-label="图表预览">
          <div className="section-head preview-head">
            <div>
              <p className="section-index">02 / 预览</p>
              <h2>{active?.label ?? '实时预览'}</h2>
            </div>
            <div className="render-state" aria-live="polite">
              <span className={status ? `status-dot ${status.state}` : 'status-dot'} />
              <span>{status?.message ?? '等待渲染'}</span>
            </div>
          </div>

          <div className="view-toolbar">
            <div className="segmented" role="group" aria-label="主题">
              {THEMES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={theme === item.id ? 'on' : ''}
                  onClick={() => setTheme(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="toolbar-cluster">
              <div className="segmented compact" role="group" aria-label="预览宽度">
                {(['fluid', 'tablet', 'phone'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={viewport === item ? 'on' : ''}
                    aria-label={item === 'fluid' ? '自适应宽度' : item === 'tablet' ? '平板宽度' : '手机宽度'}
                    onClick={() => setViewport(item)}
                  >
                    {item === 'fluid' ? '自适应' : item === 'tablet' ? '平板' : '手机'}
                  </button>
                ))}
              </div>
              <label className="switch-label">
                <input
                  type="checkbox"
                  checked={wrapper}
                  onChange={(event) => setWrapper(event.target.checked)}
                />
                <span className="switch" aria-hidden="true" />
                工具栏
              </label>
            </div>
          </div>

          <div className={`stage-bed ${viewport}`}>
            <div className={`stage-frame theme-${theme}`}>
              <GPTVisChart
                content={content}
                theme={theme}
                streaming={Boolean(stream)}
                wrapper={wrapper}
                locale="zh-CN"
                ariaLabel={active?.label || 'GPT-Vis 图表'}
                onStatus={setStatus}
              />
            </div>
          </div>

          <div className="preview-foot">
            <div>
              <span>engine</span>
              <strong>@tanstack/charts</strong>
            </div>
            <div>
              <span>syntax</span>
              <strong>vis {active?.type ?? (readConfig(content).type || '…')}</strong>
            </div>
            <div>
              <span>rendering</span>
              <strong>{active?.native === false ? 'HTML / SVG' : 'Native marks'}</strong>
            </div>
          </div>
        </section>
      </main>

      <section className="catalog-section">
        <div className="catalog-title">
          <p className="section-index">03 / 能力范围</p>
          <h2>从常用统计图到复杂关系图</h2>
          <p>
            能由 TanStack marks、scales、polar、hierarchy 与 sankey 表达的图表走原生链路；
            其余类型由轻量 HTML/SVG 渲染器补齐，不引入第二套图表库。
          </p>
        </div>
        <div className="catalog-grid">
          {CHARTS.map((chart, index) => (
            <article key={chart.type}>
              <span className="catalog-number">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <header>
                  <strong>{chart.label}</strong>
                  <code>{chart.type}</code>
                </header>
                <p>{chart.note}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="site-foot">
        <span>GPT-Vis syntax · TanStack Charts rendering</span>
        <span>
          MIT · gptvis-tanstack-charts ·{' '}
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </span>
      </footer>
    </div>
  );
}
