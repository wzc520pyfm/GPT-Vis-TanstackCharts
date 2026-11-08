export interface CoverageExample {
  id: string;
  type: string;
  kind: 'tanstack' | 'html';
  source: string;
}

export const COVERAGE_EXAMPLES: CoverageExample[] = [
  {
    id: 'line',
    type: 'line',
    kind: 'tanstack',
    source: `vis line
title 月度销售趋势
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
  - time 1月
    value 96
    group 华南
  - time 2月
    value 108
    group 华南
  - time 3月
    value 121
    group 华南
`,
  },
  {
    id: 'area',
    type: 'area',
    kind: 'tanstack',
    source: `vis area
title 累计收入构成
stack true
data
  - time Q1
    value 68
    group 订阅
  - time Q2
    value 92
    group 订阅
  - time Q3
    value 113
    group 订阅
  - time Q1
    value 32
    group 服务
  - time Q2
    value 41
    group 服务
  - time Q3
    value 57
    group 服务
`,
  },
  {
    id: 'column',
    type: 'column',
    kind: 'tanstack',
    source: `vis column
title 各渠道签约额
data
  - category 直销
    value 86
    group 新签
  - category 伙伴
    value 54
    group 新签
  - category 电商
    value 29
    group 新签
  - category 直销
    value 42
    group 续约
  - category 伙伴
    value 37
    group 续约
  - category 电商
    value 18
    group 续约
`,
  },
  {
    id: 'bar',
    type: 'bar',
    kind: 'tanstack',
    source: `vis bar
title 区域收入
axisXTitle 万元
data
  - category 华东
    value 174
  - category 华南
    value 133
  - category 华北
    value 121
  - category 西部
    value 78
`,
  },
  {
    id: 'pie',
    type: 'pie',
    kind: 'tanstack',
    source: `vis pie
title 本季费用结构
innerRadius 0.58
data
  - category 人力
    value 46
  - category 投放
    value 22
  - category 云资源
    value 14
  - category 差旅
    value 8
  - category 其他
    value 10
`,
  },
  {
    id: 'scatter',
    type: 'scatter',
    kind: 'tanstack',
    source: `vis scatter
title 折扣与转化率
axisXTitle 折扣
axisYTitle 转化率
data
  - x 6
    y 18
    group 新客
  - x 8
    y 24
    group 新客
  - x 10
    y 31
    group 新客
  - x 12
    y 35
    group 老客
  - x 15
    y 39
    group 老客
  - x 18
    y 44
    group 老客
`,
  },
  {
    id: 'radar',
    type: 'radar',
    kind: 'tanstack',
    source: `vis radar
title 两个方案的能力画像
data
  - name 交付速度
    value 8
    group 方案 A
  - name 成本
    value 6
    group 方案 A
  - name 可扩展
    value 7
    group 方案 A
  - name 体验
    value 8
    group 方案 A
  - name 运行风险
    value 5
    group 方案 A
  - name 交付速度
    value 5
    group 方案 B
  - name 成本
    value 8
    group 方案 B
  - name 可扩展
    value 6
    group 方案 B
  - name 体验
    value 6
    group 方案 B
  - name 运行风险
    value 7
    group 方案 B
`,
  },
  {
    id: 'waterfall',
    type: 'waterfall',
    kind: 'tanstack',
    source: `vis waterfall
title 从收入到经营利润
axisYTitle 万元
data
  - category 营业收入
    value 860
    isTotal true
  - category 履约成本
    value -310
  - category 销售费用
    value -96
  - category 研发费用
    value -140
  - category 其他收益
    value 28
  - category 经营利润
    isTotal true
`,
  },
  {
    id: 'dual-axes',
    type: 'dual-axes',
    kind: 'tanstack',
    source: `vis dual-axes
title 收入与订单
axisXTitle 月份
categories
  - 1月
  - 2月
  - 3月
  - 4月
series
  - type column
    axisYTitle 收入（万元）
    data
      - 128
      - 116
      - 143
      - 151
  - type line
    axisYTitle 订单数
    data
      - 420
      - 388
      - 455
      - 470
`,
  },
  {
    id: 'histogram',
    type: 'histogram',
    kind: 'tanstack',
    source: `vis histogram
title 客单价分布
binNumber 8
axisXTitle 客单价
data
  - 38
  - 42
  - 45
  - 51
  - 53
  - 55
  - 59
  - 62
  - 64
  - 68
  - 71
  - 74
  - 78
  - 84
  - 88
  - 92
`,
  },
  {
    id: 'boxplot',
    type: 'boxplot',
    kind: 'tanstack',
    source: `vis boxplot
title 各区域客单价分布
data
  - category 华东
    value 38
  - category 华东
    value 45
  - category 华东
    value 52
  - category 华东
    value 61
  - category 华东
    value 88
  - category 华南
    value 32
  - category 华南
    value 41
  - category 华南
    value 48
  - category 华南
    value 56
  - category 华南
    value 73
`,
  },
  {
    id: 'violin',
    type: 'violin',
    kind: 'tanstack',
    source: `vis violin
title 方案时延分布
data
  - category 方案 A
    value 18
  - category 方案 A
    value 21
  - category 方案 A
    value 22
  - category 方案 A
    value 24
  - category 方案 A
    value 27
  - category 方案 A
    value 31
  - category 方案 B
    value 14
  - category 方案 B
    value 17
  - category 方案 B
    value 19
  - category 方案 B
    value 20
  - category 方案 B
    value 23
  - category 方案 B
    value 29
`,
  },
  {
    id: 'sankey',
    type: 'sankey',
    kind: 'tanstack',
    source: `vis sankey
title 投放流量去向
nodeAlign justify
data
  - source 信息流
    target 落地页
    value 4200
  - source 搜索
    target 落地页
    value 2600
  - source 落地页
    target 注册
    value 3900
  - source 落地页
    target 离开
    value 2900
  - source 注册
    target 试用
    value 1400
  - source 注册
    target 沉默
    value 2500
`,
  },
  {
    id: 'treemap',
    type: 'treemap',
    kind: 'tanstack',
    source: `vis treemap
title 产品收入构成
data
  - name 公司
    children
      - name 数据产品
        children
          - name 分析云
            value 42
          - name 数据平台
            value 28
      - name 行业方案
        children
          - name 零售
            value 24
          - name 制造
            value 18
          - name 金融
            value 16
`,
  },
  {
    id: 'flow-diagram',
    type: 'flow-diagram',
    kind: 'tanstack',
    source: `vis flow-diagram
title 订单处理流程
data
  - source 创建订单
    target 风控校验
    value 100
  - source 风控校验
    target 支付
    value 92
  - source 风控校验
    target 人工复核
    value 8
  - source 支付
    target 履约
    value 87
  - source 人工复核
    target 履约
    value 5
`,
  },
  {
    id: 'indented-tree',
    type: 'indented-tree',
    kind: 'tanstack',
    source: `vis indented-tree
title 产品目录
data
  name 数据平台
  children
    - name 数据接入
      children
        - name 实时同步
        - name 离线同步
    - name 数据治理
      children
        - name 资产目录
        - name 质量规则
    - name 数据服务
`,
  },
  {
    id: 'organization-chart',
    type: 'organization-chart',
    kind: 'tanstack',
    source: `vis organization-chart
title 项目组织
data
  - name 项目委员会
    children
      - name 产品组
        children
          - name 设计
          - name 增长
      - name 技术组
        children
          - name 前端
          - name 后端
      - name 运营组
`,
  },
  {
    id: 'funnel',
    type: 'funnel',
    kind: 'html',
    source: `vis funnel
title 官网线索转化
conversionRateLabel 转化率
data
  - category 访问
    value 18200
  - category 注册
    value 2460
  - category 试用
    value 980
  - category 商机
    value 310
  - category 成交
    value 86
`,
  },
  {
    id: 'network-graph',
    type: 'network-graph',
    kind: 'html',
    source: `vis network-graph
title 订单链路
layout force
data
  nodes
    - name 下单
    - name 支付
    - name 库存
    - name 发货
    - name 完成
  edges
    - source 下单
      target 支付
    - source 下单
      target 库存
    - source 支付
      target 发货
    - source 库存
      target 发货
    - source 发货
      target 完成
`,
  },
  {
    id: 'mindmap',
    type: 'mindmap',
    kind: 'html',
    source: `vis mindmap
title 销售额异常怎么拆
data
  - name 销售额下滑
    children
      - name 量
        children
          - name 线索减少
          - name 转化变差
      - name 价
        children
          - name 折扣加深
          - name 产品结构
      - name 结构
        children
          - name 大客户流失
          - name 区域不均
`,
  },
  {
    id: 'fishbone-diagram',
    type: 'fishbone-diagram',
    kind: 'html',
    source: `vis fishbone-diagram
title 转化率下降原因
data
  - name 转化率下降
    children
      - name 流量质量
        children
          - name 渠道错配
          - name 无效点击
      - name 页面体验
        children
          - name 首屏变慢
          - name 表单过长
      - name 产品供给
        children
          - name 库存不足
          - name 价格偏高
`,
  },
  {
    id: 'venn',
    type: 'venn',
    kind: 'html',
    source: `vis venn
title 用户能力覆盖
data
  - sets [产品, 技术]
    label 12
  - sets [产品]
    label 20
  - sets [技术]
    label 16
`,
  },
  {
    id: 'word-cloud',
    type: 'word-cloud',
    kind: 'html',
    source: `vis word-cloud
title 用户反馈关键词
data
  - text 稳定
    value 48
  - text 易用
    value 42
  - text 快速
    value 39
  - text 清晰
    value 31
  - text 报表
    value 27
  - text 协作
    value 24
  - text 权限
    value 18
  - text 移动端
    value 15
`,
  },
  {
    id: 'liquid',
    type: 'liquid',
    kind: 'html',
    source: `vis liquid
title 季度目标完成度
percent 0.73
shape circle
`,
  },
  {
    id: 'table',
    type: 'table',
    kind: 'html',
    source: `vis table
title 区域经营快照
data
  - 区域 华东
    收入 174
    订单 540
    毛利率 38%
  - 区域 华南
    收入 133
    订单 410
    毛利率 34%
  - 区域 华北
    收入 121
    订单 366
    毛利率 41%
`,
  },
  {
    id: 'summary',
    type: 'summary',
    kind: 'html',
    source: `# 6 月经营摘要

华东收入 [174 万](metric_value)，环比 [+7%](delta_value, status=increase)。

- 直销新签是主要增量
- 电商续约低于预期
- 研发投入继续扩大
`,
  },
];
