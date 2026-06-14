import type { Experiment, ExperimentDesign, ExperimentResult, Finding } from '@/types';
import { mockExperimentDesign, mockFindings } from '@/utils/mockData';

/**
 * 实验服务
 */
class ExperimentService {
  private mockDelay(ms: number = 1000): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateDesign(topic: string, references: string[]): Promise<ExperimentDesign> {
    await this.mockDelay(1500);
    return {
      ...mockExperimentDesign.design,
      method: `基于语料库的${topic}量化分析`,
      procedure: [
        { order: 1, title: '研究问题界定', description: `明确${topic}研究中的核心问题和假设`, duration: '0.5天', expectedOutput: '研究问题和假设列表' },
        { order: 2, title: '数据收集', description: '收集相关语料库和文献数据', duration: '1-2天', expectedOutput: '结构化数据集' },
        { order: 3, title: '数据预处理', description: '文本清洗、分词、标注等', duration: '1天', expectedOutput: '预处理后的语料' },
        { order: 4, title: '特征提取与分析', description: '提取语言学特征，进行统计分析', duration: '2天', expectedOutput: '特征矩阵和统计结果' },
        { order: 5, title: '结果验证', description: '通过多种方法验证分析结果的可靠性', duration: '1天', expectedOutput: '验证报告' },
        { order: 6, title: '撰写报告', description: '整合研究结果，撰写实验报告', duration: '1天', expectedOutput: '完整实验报告' },
      ],
      tools: ['Python 3.11', 'jieba分词', 'Gensim', 'Scikit-learn', 'Pandas', 'Matplotlib', 'Seaborn', 'NetworkX', 'SPSS'],
    };
  }

  async executeExperiment(experimentId: string): Promise<ExperimentResult> {
    await this.mockDelay(3000);
    return {
      metrics: [
        { name: '准确率', value: 0.87, unit: '%', baseline: 0.72, improvement: 20.8 },
        { name: 'F1值', value: 0.84, unit: '%', baseline: 0.68, improvement: 23.5 },
        { name: '处理速度', value: 1250, unit: 'docs/min' },
        { name: '覆盖率', value: 0.93, unit: '%', baseline: 0.85, improvement: 9.4 },
      ],
      visualizations: [
        {
          type: 'bar', title: '不同年代主题分布', data: [
            { year: '1950s', 集体: 0.45, 个人: 0.15, 社会: 0.25, 自然: 0.15 },
            { year: '1970s', 集体: 0.40, 个人: 0.18, 社会: 0.28, 自然: 0.14 },
            { year: '1990s', 集体: 0.22, 个人: 0.35, 社会: 0.28, 自然: 0.15 },
            { year: '2010s', 集体: 0.12, 个人: 0.42, 社会: 0.30, 自然: 0.16 },
          ], xKey: 'year', yKeys: ['集体', '个人', '社会', '自然'],
        },
        {
          type: 'line', title: '情感倾向时序变化', data: [
            { year: 1950, positive: 0.55, negative: 0.25, neutral: 0.20 },
            { year: 1970, positive: 0.50, negative: 0.30, neutral: 0.20 },
            { year: 1990, positive: 0.45, negative: 0.20, neutral: 0.35 },
            { year: 2010, positive: 0.48, negative: 0.18, neutral: 0.34 },
          ], xKey: 'year', yKeys: ['positive', 'negative', 'neutral'],
        },
      ],
      statisticalTests: [
        { name: '卡方检验', testType: 'chi-square', pValue: 0.0003, effectSize: 0.42, significance: true, interpretation: '不同年代间主题分布存在显著差异' },
        { name: '独立样本t检验', testType: 't-test', pValue: 0.012, effectSize: 0.35, significance: true, interpretation: '性别因素对主题选择有显著影响' },
        { name: 'ANOVA', testType: 'one-way ANOVA', pValue: 0.001, effectSize: 0.28, significance: true, interpretation: '文学体裁间存在显著差异' },
      ],
      findings: mockFindings,
    };
  }

  async getFindings(experimentId: string): Promise<Finding[]> {
    await this.mockDelay(500);
    return mockFindings;
  }
}

export const experimentService = new ExperimentService();
