import type {
  CorpusSearchQuery, ConcordanceResult, CollocationResult,
  SemanticResult, SentimentResult,
} from '@/types';
import {
  mockConcordanceResults, mockCollocationResults,
  mockSemanticResults, mockSentimentResults,
} from '@/utils/mockData';

/**
 * 语料库检索服务 - 模拟MCP调用语料库工具
 * 支持：索引行、搭配、主题语义、情感态度分析
 */
class CorpusService {
  private mockDelay(ms: number = 600): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async searchConcordance(query: CorpusSearchQuery): Promise<{
    results: ConcordanceResult[];
    total: number;
    nodeWord: string;
    metadata: { corpus: string; size: number; queryTime: string };
  }> {
    await this.mockDelay();
    const filtered = mockConcordanceResults.filter(r =>
      r.node.includes(query.query) ||
      r.leftContext.includes(query.query) ||
      r.rightContext.includes(query.query)
    );
    return {
      results: filtered.length > 0 ? filtered : mockConcordanceResults,
      total: filtered.length > 0 ? filtered.length : mockConcordanceResults.length,
      nodeWord: query.query,
      metadata: {
        corpus: query.corpus || 'BCC现代汉语语料库',
        size: 15000000000,
        queryTime: new Date().toISOString(),
      },
    };
  }

  async searchCollocation(query: CorpusSearchQuery): Promise<{
    results: CollocationResult[];
    nodeWord: string;
    spanInfo: { left: number; right: number };
    corpusInfo: { name: string; tokens: number };
  }> {
    await this.mockDelay();
    return {
      results: mockCollocationResults,
      nodeWord: query.query,
      spanInfo: { left: query.windowSize || 5, right: query.windowSize || 5 },
      corpusInfo: { name: query.corpus || 'BCC现代汉语语料库', tokens: 15000000000 },
    };
  }

  async analyzeSemantic(query: CorpusSearchQuery): Promise<{
    results: SemanticResult[];
    method: string;
    parameters: Record<string, unknown>;
  }> {
    await this.mockDelay(1000);
    return {
      results: mockSemanticResults,
      method: 'LDA Topic Modeling',
      parameters: {
        numTopics: 6,
        alpha: 0.1,
        beta: 0.01,
        iterations: 1000,
        coherence: 'c_v',
      },
    };
  }

  async analyzeSentiment(query: CorpusSearchQuery): Promise<{
    results: SentimentResult[];
    overallSentiment: { positive: number; negative: number; neutral: number; mixed: number };
    lexicon: string;
  }> {
    await this.mockDelay(800);
    const results = mockSentimentResults;
    const pos = results.filter(r => r.sentiment === 'positive').length;
    const neg = results.filter(r => r.sentiment === 'negative').length;
    const neu = results.filter(r => r.sentiment === 'neutral').length;
    const mix = results.filter(r => r.sentiment === 'mixed').length;
    return {
      results,
      overallSentiment: { positive: pos, negative: neg, neutral: neu, mixed: mix },
      lexicon: 'HowNet扩展中文情感词典',
    };
  }

  async getAvailableCorpora(): Promise<{ id: string; name: string; size: string; language: string; description: string }[]> {
    await this.mockDelay(300);
    return [
      { id: 'bcc', name: 'BCC现代汉语语料库', size: '150亿字', language: '中文', description: '北京语言大学大规模现代汉语语料库' },
      { id: 'ccl', name: 'CCL语料库', size: '7.8亿字', language: '中文', description: '北京大学中国语言学研究中心语料库' },
      { id: 'bnc', name: 'BNC英国国家语料库', size: '1亿词', language: '英文', description: '英国国家语料库，包含口语和书面语' },
      { id: 'coca', name: 'COCA美国当代英语语料库', size: '10亿词', language: '英文', description: '美国当代英语语料库' },
      { id: 'zh_tencent', name: '中文词向量语料库', size: '800万文档', language: '中文', description: '腾讯AI Lab开放的中文词向量训练语料' },
    ];
  }
}

export const corpusService = new CorpusService();
