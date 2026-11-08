# GPT-Vis TanStack Charts

[GPT-Vis](https://github.com/antvis/GPT-Vis) 的 TanStack Charts 适配层。
模型仍然输出同一套 `vis` 语法，图表由
[@tanstack/charts](https://tanstack.com/charts) 绘制，不依赖 AntV 或 ECharts。

支持 26 种 GPT-Vis 图表：统计图、分布图、极坐标图、桑基图、层级图和常用
补充图都可使用同一套流式语法。

## 安装

```bash
npm install gptvis-tanstack-charts @tanstack/charts
```

React 用户还需要安装 `react` 和 `react-dom`。它们是可选 peer dependencies，
主入口和服务端解析入口不会加载 React。

## 快速开始

```ts
import { GPTVis } from 'gptvis-tanstack-charts';

const chart = new GPTVis({
  container: '#chart',
  theme: 'default',
  wrapper: true,
  locale: 'zh-CN',
});

chart.render(`vis line
title 月度销售额
axisXTitle 月份
axisYTitle 万元
data
  - time 1月
    value 128
    group 华东
  - time 2月
    value 142
    group 华东
  - time 3月
    value 136
    group 华东
`);

// 组件卸载时销毁 TanStack 图表实例和 wrapper 事件。
chart.destroy();
```

`render()` 还接受与 JSON 配置等价的普通对象：

```ts
chart.render({
  type: 'column',
  title: '渠道对比',
  data: [
    { category: '直销', value: 86 },
    { category: '伙伴', value: 54 },
    { category: '电商', value: 29 },
  ],
});
```

## React

```tsx
import { GPTVisChart } from 'gptvis-tanstack-charts/react';

export function SalesChart({ source }: { source: string }) {
  return (
    <GPTVisChart
      content={source}
      theme="default"
      wrapper
      locale="zh-CN"
      style={{ height: 420 }}
      onStatus={(status) => console.log(status.state, status.message)}
    />
  );
}
```

`GPTVisChart` 会随 `content` 更新图表，并在 React 卸载时清理 TanStack 图表。
外层容器必须有可计算的宽度和高度。

## 框架无关绑定

Vue、Svelte、Angular 或普通 DOM 生命周期可以复用 `bindGPTVis()`：

```ts
import { bindGPTVis } from 'gptvis-tanstack-charts';

const chart = bindGPTVis('#chart', {
  theme: 'dark',
  streaming: true,
});

chart.update(visSource);
chart.resize();
chart.zoomTo(1.2);
chart.destroy();
```

## 流式输出

把 `streaming` 设为 `true` 时，解析器会丢弃最后一条尚未写完的行，保留已经
完整的对象行。React 用户可通过同一个 `streaming` prop 更新：

```tsx
<GPTVisChart content={partialModelOutput} streaming />
```

等流结束后把 `streaming` 改回 `false`，最后一行的字段也会进入配置。

## 服务端解析

只做校验、存储或工具调用时，从 `syntax` 子入口导入解析器。这个入口不会加载
TanStack Charts、DOM 或 React：

```ts
import { isVisSyntax, parse, readConfig } from 'gptvis-tanstack-charts/syntax';

const config = readConfig(modelOutput, { streaming: true });
if (isVisSyntax(modelOutput)) {
  const parsed = parse(modelOutput);
  console.log(parsed.type);
}
```

## 图表覆盖

### TanStack 原生渲染

| type | 主要字段 | 说明 |
| --- | --- | --- |
| `line` | `time`, `value`, optional `group` | 折线趋势，按 `group` 分系列 |
| `area` | `time`, `value`, optional `group` | 面积趋势，`stack true` 时堆叠 |
| `column` | `category`, `value`, optional `group` | 纵向柱图，分组或堆叠 |
| `bar` | `category`, `value`, optional `group` | 横向条形图 |
| `pie` | `category`, `value` | 饼图；`innerRadius` 控制环形内径 |
| `scatter` | `x`, `y`, optional `group` | 两个数值字段的相关关系 |
| `radar` | `name`, `value`, optional `group` | 极坐标雷达图 |
| `waterfall` | `category`, `value`, `isTotal` | 增减贡献与累计合计 |
| `dual-axes` | `categories`, `series[]` | 柱线混合与左右双轴 |
| `histogram` | 数字数组, optional `binNumber` | 自动分箱的频数直方图 |
| `boxplot` | `category`, `value` | 由原始观测值计算箱线分布 |
| `violin` | `category`, `value` | 分布轮廓与中位数 |
| `sankey` | `source`, `target`, `value` | 节点分层的有权流向 |
| `treemap` | `name`, `value`, nested `children` | 带层级的面积占比 |
| `flow-diagram` | `source`, `target`, `value` | 复用桑基布局的有向流程 |
| `indented-tree` | `name`, nested `children` | 从左向右的缩进层级树 |
| `organization-chart` | `name`, nested `children` | 自上而下的组织结构树 |

### HTML / SVG 补充渲染

| type | 主要字段 | 说明 |
| --- | --- | --- |
| `funnel` | `category`, `value` | 阶段转化，可配置 `conversionRateLabel` |
| `network-graph` | `nodes[]`, `edges[]` | `layout` 支持 force、circular、grid、radial、concentric、dagre |
| `mindmap` | 根 `name`, nested `children` | `direction` 支持 both、LR、RL |
| `fishbone-diagram` | 根 `name`, nested `children` | 结果在右，原因分列上下两侧 |
| `venn` | `sets`, `value` or `label` | 支持二或三个集合 |
| `word-cloud` | `text`, `value` | 根据权重缩放词频 |
| `liquid` | `percent` | 进度水波图，支持 circle、rect、triangle、pin |
| `table` | 对象数组 | 键名自动生成列 |
| `summary` | 非 `vis` 开头正文 | T8 文本、实体标签和行内 sparkline |

补充渲染器只生成当前图表需要的 HTML/SVG，不引入第二套图表库。所有模型提供的
文本都会先转义，颜色只接受安全 CSS 颜色语法。

## 主题

内置主题为 `default`、`light`、`dark` 和 `academy`。`light` 与 `default`
共用浅色 token。

也可以传入 GPT-Vis 风格的 `ThemeSpec`：

```ts
chart.render({
  type: 'bar',
  theme: {
    id: 'brand',
    label: 'Brand',
    baseTheme: 'default',
    tokens: {
      colorBackground: '#ffffff',
      colorText: '#17201e',
      colorStroke: '#d8ddd9',
      category10: ['#0f6e64', '#d4652f', '#2f5d9f'],
    },
    style: {
      backgroundColor: '#ffffff',
      lineWidth: 2,
    },
  },
  data: [
    { category: 'A', value: 12 },
    { category: 'B', value: 9 },
  ],
});
```

单图配置里的 `theme` 优先于构造函数主题。模型提供的危险颜色（如
`url(...)` 或表达式）会回退到主题安全色。

## API

### `new GPTVis(options)`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `container` | `string \| HTMLElement` | 必填，CSS 选择器或 DOM 元素 |
| `width` / `height` | `number` | 可选像素尺寸；普通响应式场景留空 |
| `theme` | `VisualizationTheme` | 内置名称或 `ThemeSpec` |
| `streaming` | `boolean` | 开启流式截断处理 |
| `wrapper` | `boolean` | 图表/代码切换、复制、下载和缩放工具栏 |
| `locale` | `string` | wrapper 文案，支持 `zh-CN` 和 `en-US` |
| `ariaLabel` | `string` | 图表可访问名称 |
| `onStatus` | `(status) => void` | 接收 `pending`、`ready`、`unsupported`、`error` 状态 |

实例方法：

- `render(input)`：渲染语义配置或 vis 文本
- `resize()`：按当前容器尺寸重新布局原生图表
- `zoomTo(number)`：设置缩放比例，限制在 0.25–4
- `getZoom()`：读取当前缩放比例
- `destroy()`：销毁原生图表和 wrapper

### 图表构造函数

与 GPT-Vis 的常用 API 对齐：

```ts
import { Line, Pie, Treemap } from 'gptvis-tanstack-charts';

const line = Line({ container: '#one' });
line.render({
  title: '趋势',
  data: [{ time: '1月', value: 12 }],
});
line.destroy();
```

共有 26 个构造函数：`Line`、`Area`、`Column`、`Bar`、`Pie`、`Scatter`、
`Radar`、`Funnel`、`Waterfall`、`DualAxes`、`Histogram`、`Boxplot`、
`Violin`、`Venn`、`Sankey`、`Treemap`、`WordCloud`、`Liquid`、
`FlowDiagram`、`NetworkGraph`、`Mindmap`、`IndentedTree`、
`OrganizationChart`、`FishboneDiagram`、`Table`、`Summary`。

### 低层渲染

`buildView()` 返回 `tanstack`、`html`、`pending` 或 `error` 四种视图之一。
它适合自定义宿主、SSR 占位和测试；`definition` 是 TanStack 的静态图表定义。

```ts
import { buildView } from 'gptvis-tanstack-charts';

const view = buildView(visSource, { width: 800, height: 480 });
if (view.kind === 'tanstack') {
  // 将 view.definition 交给 @tanstack/charts/dom mountChart()
}
```

## 数据与语法约定

- 首行必须是 `vis <type>`；普通 Markdown 正文按 `summary` 渲染。
- 属性写作 `key value` 或 `key: value`，列表用缩进 `-`。
- 含空格的字符串用引号，数字、布尔值保持对应类型。
- 一个对象行是一组观测；多系列图中每行都要写 `group`。
- 连续原始样本用 `histogram`，多组分布比较用 `boxplot` 或 `violin`。
- 关系图只用于结构本身就是答案的场景；精确数据优先 `table`。

## 构建

```bash
npm install
npm run typecheck
npm test
npm run build
```

仓库里的 playground 位于上级目录的 `playground/`，运行 `npm run dev` 会先编译本包，
再启动 Vite。

## License

MIT
