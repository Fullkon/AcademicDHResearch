import type { Dataset } from '@/types';
import { mockDatasets } from '@/utils/mockData';

/**
 * 数据集管理服务
 */
class DatasetService {
  private mockDelay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async searchDatasets(keyword: string): Promise<Dataset[]> {
    await this.mockDelay();
    return mockDatasets.filter(d =>
      d.name.includes(keyword) || d.description.includes(keyword)
    );
  }

  async getAllDatasets(): Promise<Dataset[]> {
    await this.mockDelay();
    return mockDatasets;
  }

  async getDatasetById(id: string): Promise<Dataset | null> {
    await this.mockDelay(300);
    return mockDatasets.find(d => d.id === id) || null;
  }

  async buildDataset(config: {
    name: string;
    description: string;
    type: 'text' | 'numerical' | 'mixed';
    sources: string[];
    filters: Record<string, string>;
  }): Promise<Dataset> {
    await this.mockDelay(2000);
    return {
      id: `ds-custom-${Date.now()}`,
      name: config.name,
      description: config.description,
      type: config.type,
      source: 'constructed',
      size: Math.floor(Math.random() * 100000) + 1000,
      format: 'CSV',
      fields: [
        { name: 'text', type: 'text', description: '文本内容' },
        { name: 'label', type: 'category', description: '标签' },
      ],
      createdAt: new Date(),
    };
  }

  async getDatasetPreview(id: string, limit: number = 10): Promise<Record<string, unknown>[]> {
    await this.mockDelay(400);
    // 模拟数据预览
    const dataset = mockDatasets.find(d => d.id === id);
    if (!dataset) return [];
    return Array.from({ length: limit }, (_, i) => ({
      id: i + 1,
      ...Object.fromEntries(dataset.fields.map(f => [f.name, `sample_${i}_${f.name}`])),
    }));
  }
}

export const datasetService = new DatasetService();
