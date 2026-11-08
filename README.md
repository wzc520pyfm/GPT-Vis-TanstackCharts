# GPT-Vis TanStack Charts

[GPT-Vis](https://github.com/antvis/GPT-Vis) 的
[TanStack Charts](https://tanstack.com/charts) 适配层。模型继续写 `vis`
语法，图由 TanStack Charts 原生 marks、scales、polar、hierarchy 和 sankey
绘制；无法等价表达的关系图和文本视图由轻量 HTML/SVG 补齐。

当前覆盖 GPT-Vis 的全部 26 种图表类型。

```vis
vis line
title 月度销售额
axisXTitle 月份
data
  - time 1月
    value 128
  - time 2月
    value 142
  - time 3月
    value 136
```

## 包结构

- [`packages/gptvis-tanstack-charts`](packages/gptvis-tanstack-charts)：发布包，
  提供 `GPTVis`、`bindGPTVis`、26 个图表构造函数、解析器和 React 入口。
- [`playground`](playground)：Vite + React 演示站，包含 26 种图表样例、主题切换、
  流式模拟、解析检查、工具栏和响应式预览。
- [`packages/gptvis-tanstack-charts/skills/chart-visualization`](packages/gptvis-tanstack-charts/skills/chart-visualization)：
  给 LLM 的图表选型与 vis 输出技能。

## 安装

```bash
npm install gptvis-tanstack-charts @tanstack/charts
```

React 使用方式：

```tsx
import { GPTVisChart } from 'gptvis-tanstack-charts/react';

<GPTVisChart content={source} theme="default" wrapper locale="zh-CN" />
```

完整的 DOM、React、服务端解析和图表字段说明见
[包 README](packages/gptvis-tanstack-charts/README.md)。

## 本地开发

```bash
npm install
npm run dev
```

`npm run dev` 先编译库，再打开 http://127.0.0.1:4318。

验证命令：

```bash
npm run typecheck
npm test
npm run build
```

`npm test` 包含 26 种图表覆盖测试、解析器、主题、公共 API 和发布入口检查。

## 渲染策略

TanStack 原生链路：折线、面积、柱状、条形、饼图、散点、雷达、瀑布、
双轴、直方图、箱线图、小提琴、桑基、矩形树图、流程图、缩进树和组织架构。

HTML/SVG 补充链路：漏斗、网络图、思维导图、鱼骨图、韦恩图、词云、水波、
表格和摘要。

## License

MIT
