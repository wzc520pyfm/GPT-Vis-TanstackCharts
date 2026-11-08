import { COVERAGE_EXAMPLES } from '../packages/gptvis-tanstack-charts/tests/fixtures';

export type ExampleGroup = '统计' | '关系' | '文本';

interface ExampleMeta {
  id: string;
  label: string;
  note: string;
  group: ExampleGroup;
}

const META: ExampleMeta[] = [
  { id: 'line', label: '折线图', note: '时间趋势与多系列折线', group: '统计' },
  { id: 'area', label: '面积图', note: '趋势面积，支持堆叠', group: '统计' },
  { id: 'column', label: '柱状图', note: '纵向比较，支持分组与堆叠', group: '统计' },
  { id: 'bar', label: '条形图', note: '横向排名，类别从上到下', group: '统计' },
  { id: 'pie', label: '饼图', note: '占比与环形图', group: '统计' },
  { id: 'scatter', label: '散点图', note: '两个数值字段的相关关系', group: '统计' },
  { id: 'radar', label: '雷达图', note: '同一组指标下的多方案对比', group: '统计' },
  { id: 'waterfall', label: '瀑布图', note: '增减贡献与阶段合计', group: '统计' },
  { id: 'dual-axes', label: '双轴图', note: '柱线组合与左右独立单位', group: '统计' },
  { id: 'histogram', label: '直方图', note: '一列数值自动分箱', group: '统计' },
  { id: 'boxplot', label: '箱线图', note: '原始观测值的四分位分布', group: '统计' },
  { id: 'violin', label: '小提琴图', note: '分布密度轮廓与中位数', group: '统计' },
  { id: 'sankey', label: '桑基图', note: '带权流向与节点分层', group: '统计' },
  { id: 'treemap', label: '矩形树图', note: '层级数据的面积占比', group: '统计' },
  { id: 'flow-diagram', label: '流程图', note: '复用桑基布局展示有向流程', group: '关系' },
  { id: 'indented-tree', label: '缩进树', note: '由左向右展开的层级名单', group: '关系' },
  { id: 'organization-chart', label: '组织架构', note: '自上而下的组织结构', group: '关系' },
  { id: 'funnel', label: '漏斗图', note: '阶段转化与环比转化率', group: '统计' },
  { id: 'network-graph', label: '网络图', note: '力导向关系网络', group: '关系' },
  { id: 'mindmap', label: '思维导图', note: '中心主题向两侧展开', group: '关系' },
  { id: 'fishbone-diagram', label: '鱼骨图', note: '结果与两侧原因分类', group: '关系' },
  { id: 'venn', label: '韦恩图', note: '二至三个集合的交集', group: '统计' },
  { id: 'word-cloud', label: '词云', note: '按权重缩放的反馈关键词', group: '文本' },
  { id: 'liquid', label: '水波图', note: '单个百分比的达成度', group: '统计' },
  { id: 'table', label: '表格', note: '对象行自动生成列', group: '文本' },
  { id: 'summary', label: '摘要', note: '带实体标签与 Sparkline 的正文', group: '文本' },
];

export interface Example extends ExampleMeta {
  type: string;
  source: string;
  native: boolean;
}

const HTML_TYPES = new Set([
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

export const EXAMPLES: Example[] = META.map((meta) => {
  const fixture = COVERAGE_EXAMPLES.find((item) => item.id === meta.id);
  if (!fixture) throw new Error(`Missing coverage fixture: ${meta.id}`);
  return {
    ...meta,
    type: fixture.type,
    source: fixture.source,
    native: !HTML_TYPES.has(fixture.type),
  };
});

export const GROUPS: Array<'全部' | ExampleGroup> = ['全部', '统计', '关系', '文本'];
