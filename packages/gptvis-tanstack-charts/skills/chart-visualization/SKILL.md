---
name: chart-visualization
description: Choose a chart and write GPT-Vis syntax for the TanStack Charts adapter in this repo. Use when a user asks to visualize data, select a chart, emit a vis block, or render GPT-Vis syntax with TanStack Charts.
---

# Chart visualization

Write a GPT-Vis `vis` block. Do not write a TanStack `defineChart()` call,
JavaScript, or chart-library options. The runtime parses the block, keeps the
last complete observation during streaming, and renders with TanStack Charts.

## Output

Put the block in a `vis` fence. The first line is `vis <type>`.
Properties are `key value` or `key: value`. Quote values containing spaces.
Quoted values remain strings.

```vis
vis line
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
```

`theme` is `default`, `light`, `academy`, or `dark`. Colors belong under
`style`, using actual CSS colors only:

```vis
vis bar
style
  palette
    - #0f6e6b
    - #d4652f
```

## Which chart

| Question | type | Data |
| --- | --- | --- |
| Time trend | `line` or `area` | `time`, `value`, optional `group`; use `stack true` on area |
| Category comparison | `column` or `bar` | `category`, `value`, optional `group`; use `stack true` to stack |
| Composition | `pie` | `category`, `value`; `innerRadius 0.6` for a donut |
| Two numeric variables | `scatter` | `x`, `y`, optional `group` |
| Multi-metric score | `radar` | `name`, `value`, optional `group` |
| Stage conversion | `funnel` | `category`, `value` |
| Running contribution | `waterfall` | `category`, `value`; mark totals with `isTotal true` |
| Two units | `dual-axes` | `categories`, then `series` of `type line` or `type column`, each with `data` and `axisYTitle` |
| Numeric frequency | `histogram` | a list of numbers, optional `binNumber` |
| Distribution | `boxplot` or `violin` | repeated `category` / `value` rows |
| Two or three set overlap | `venn` | `sets` plus `value` or `label` |
| Weighted flow | `sankey` | `source`, `target`, `value` |
| Hierarchical area | `treemap` | `name`, `value`, nested `children` |
| Word frequency | `word-cloud` | `text`, `value` |
| One percentage | `liquid` | `percent` from 0 to 1; optional `shape` |
| Dependencies | `flow-diagram` | `source`, `target`, `value` |
| Relationship network | `network-graph` | `nodes` (`name`), `edges` (`source`, `target`) |
| Root-cause tree | `mindmap` or `fishbone-diagram` | one root `name` and nested `children` |
| Directory hierarchy | `indented-tree` | root `name` and nested `children` |
| Reporting hierarchy | `organization-chart` | root `name` and nested `children` |
| Exact lookup | `table` | one object per row; keys become columns |
| Narrative conclusion | plain Markdown, no `vis` line | headings, lists, bold, entity tags |

Prefer `line`, `column`, `bar`, `pie`, `dual-axes`, `waterfall`, or `table` for
business questions. Use a relationship chart only when the structure itself is
the answer.

## Rules

- Keep the field names above. `time` is for line and area. `category` is for
  column, bar, pie, funnel, waterfall, boxplot, and violin.
- One object row is one observation. Repeat `group` on every row of a multi-series
  chart.
- Numbers are bare. Quote a year or code only when it must stay text, for example
  `"2026-01"`. Do not use `"35%"` or `"1,200"` as numeric values.
- Column and bar multi-series charts choose either grouping or stacking, not both.
- A `waterfall` total row sets the running height. A following total without
  `value` uses the running sum.
- A mind map opens to both sides unless `direction` is `LR` or `RL`. A fishbone
  places the result on the right and causes on both sides.
- Venn diagrams support two or three sets. Do not invent a fourth set.
- Network `layout` accepts `force`, `circular`, `grid`, `radial`, `concentric`,
  or `dagre`.
- Do not invent a chart type outside the table. There is no `heatmap`.
- Do not emit scripts, URLs, or event handlers inside labels. Labels are text.

## Renderer boundary

These types are drawn by TanStack native marks/scales:

`line`, `area`, `column`, `bar`, `pie`, `scatter`, `radar`, `waterfall`,
`dual-axes`, `histogram`, `boxplot`, `violin`, `sankey`, `treemap`,
`flow-diagram`, `indented-tree`, `organization-chart`.

These types use the adapter's HTML/SVG layer:

`funnel`, `network-graph`, `mindmap`, `fishbone-diagram`, `venn`,
`word-cloud`, `liquid`, `table`, `summary`.

The renderer boundary does not change the syntax. Do not tell users that they
must write TanStack code for native charts.

## Integration

```ts
import { GPTVis } from 'gptvis-tanstack-charts';

const chart = new GPTVis({
  container: '#chart',
  theme: 'default',
  wrapper: true,
  locale: 'zh-CN',
});

chart.render(visSource);
chart.destroy();
```

React:

```tsx
import { GPTVisChart } from 'gptvis-tanstack-charts/react';

<GPTVisChart content={visSource} theme="default" wrapper />
```

Parser-only code should import from `gptvis-tanstack-charts/syntax`; it does not
load TanStack Charts or React.

## Delivery checks

- The chart type matches the question and the supplied data structure.
- Every numeric series is finite; categorical fields are strings.
- Multi-series rows repeat `group`; grouping and stacking are not both selected.
- Dual-axis series lengths line up with `categories`.
- Sankey and flow edges reference real nodes and use positive values.
- Hierarchical data starts from one root and nests through `children`.
- JSON is parseable and syntax is renderable. Summary uses plain Markdown.
