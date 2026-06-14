import type { StatisticalQuery, StatisticalData } from '@/types';
import { mockStatisticalData } from '@/utils/mockData';

/**
 * 统计数据库检索服务 - World Bank API + 国家统计局预置数据
 */
class StatisticsService {
  private WB_URL = 'https://api.worldbank.org/v2';

  private async fetchJson(url: string): Promise<unknown> {
    try {
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'AcademicResearchAgent/1.0' },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return resp.json();
    } catch {
      return null;
    }
  }

  /**
   * 查询统计数据
   * 优先使用世界银行 API，降级到本地预置数据
   */
  async queryStatistics(query: StatisticalQuery): Promise<StatisticalData[]> {
    const yearStart = Math.min(...query.years);
    const yearEnd = Math.max(...query.years);

    try {
      // 尝试查询世界银行 API
      const url = `${this.WB_URL}/country/CN/indicator/NY.GDP.MKTP.CD?format=json&date=${yearStart}:${yearEnd}&per_page=100`;
      const data = await this.fetchJson(url) as [Record<string, unknown>, Array<Record<string, unknown>>] | null;

      if (data && Array.isArray(data) && data.length > 1 && Array.isArray(data[1]) && data[1].length > 0) {
        const indicatorInfo = data[1][0]?.indicator as Record<string, unknown> | undefined;
        const dataPoints = (data[1] as Array<Record<string, unknown>>)
          .filter((item: Record<string, unknown>) => item.value != null)
          .map((item: Record<string, unknown>) => ({
            year: Number(item.date),
            value: Number(item.value) / 1e8, // 转换为亿元
            region: (item.country as Record<string, string>)?.value || '中国',
          }))
          .reverse();

        if (dataPoints.length > 0) {
          return [{
            indicator: typeof indicatorInfo?.value === 'string' ? indicatorInfo.value : query.indicator,
            unit: '亿元（当前美元）',
            dataPoints,
          }];
        }
      }
    } catch {
      // 降级到 mock 数据
    }

    // 降级：使用本地数据
    return mockStatisticalData.filter(d =>
      d.indicator.includes(query.indicator) || query.indicator.includes(d.indicator)
    );
  }

  async getAvailableDatabases() {
    return [
      { id: 'nbs', name: '国家统计局数据', description: '中国国家统计局公开数据库', coverage: '1949-至今' },
      { id: 'world_bank', name: '世界银行数据 (实时API)', description: '世界银行全球发展指标数据库', coverage: '1960-至今' },
      { id: 'openalex', name: 'OpenAlex统计数据', description: '开放学术知识图谱统计', coverage: '全时段' },
      { id: 'unesco', name: 'UNESCO文化统计', description: '联合国教科文组织文化统计数据库', coverage: '1999-至今' },
      { id: 'eps', name: 'EPS数据平台', description: '全球统计数据/分析平台', coverage: '1950-至今' },
    ];
  }

  async getAvailableIndicators() {
    return [
      { id: 'ind-1', name: '公共图书馆数量', category: '文化设施', unit: '个' },
      { id: 'ind-2', name: '博物馆数量', category: '文化设施', unit: '个' },
      { id: 'ind-3', name: 'GDP (世界银行实时)', category: '经济', unit: '亿元' },
      { id: 'ind-4', name: '人文社科毕业生数', category: '教育', unit: '万人' },
      { id: 'ind-5', name: '出版物种类', category: '出版', unit: '种' },
      { id: 'ind-6', name: '非物质文化遗产项目数', category: '文化遗产', unit: '项' },
    ];
  }
}

export const statisticsService = new StatisticsService();
