import type {
  ResearchIdea, ExperimentDesign, Finding, LiteratureReview,
  ExperimentResult, SentimentResult, SemanticResult,
} from '@/types';

/**
 * Qwen 大模型服务 - 前端调用 Flask 后端
 *
 * 后端地址：部署到阿里云服务器时为 http://8.219.110.163:5000
 * 本地开发时可设置 VITE_QWEN_URL=http://localhost:5000
 *
 * 注意：首次调用可能较慢（Qwen API 响应时间 3-15秒），第二次起可启用缓存
 */

const BASE_URL = import.meta.env.VITE_QWEN_URL || 'http://localhost:5000';

// ── 通用请求 ──
async function postQwen<T>(endpoint: string, data: Record<string, unknown>): Promise<T> {
  try {
    const resp = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Qwen API ${resp.status}: ${errText.slice(0, 200)}`);
    }

    return resp.json();
  } catch (e) {
    console.warn(`[QwenService] ${endpoint} 调用失败:`, e);
    throw e;
  }
}

// ── 健康检查 ──
async function checkHealth(): Promise<{ status: string; model: string; apiConfigured: boolean }> {
  return postQwen('/api/health', {});
}


// ═══════════════════════════════════════
// 核心分析服务
// ═══════════════════════════════════════

export interface TopicAnalysisResult {
  research_value: string;
  feasibility: string;
  digital_humanities_fit: string;
  recommended_methods: string[];
  suggested_keywords: string[];
  potential_difficulties: string[];
  expected_contributions: string[];
  mode?: string;
  raw_text?: string;
}

export interface LiteratureReviewResult {
  summary: string;
  key_findings: string[];
  research_gaps: string[];
  theoretical_framework: string;
  methodological_trends: string[];
  key_scholars: string[];
  mode?: string;
  raw_text?: string;
}

export interface ResearchIdeasResult {
  ideas: Array<{
    title: string;
    description: string;
    methodology: string;
    expected_outcomes: string;
    feasibility: string;
    innovation: string;
    data_requirements: string;
  }>;
  raw?: Record<string, unknown>;
  mode?: string;
}

export interface ExperimentDesignResult {
  experiment_type: string;
  title: string;
  hypothesis: string;
  variables: Array<{
    name: string;
    type: string;
    description: string;
    measurement: string;
  }>;
  procedure: Array<{
    order: number;
    title: string;
    description: string;
    duration: string;
    expected_output: string;
  }>;
  tools: string[];
  statistical_methods: string[];
  validation_strategy: string;
  expected_results: string;
  mode?: string;
}

export interface ResultsAnalysisResult {
  overall_assessment: string;
  metrics_interpretation: Array<{
    metric: string;
    value: string;
    significance: string;
  }>;
  findings: Array<{
    title: string;
    description: string;
    confidence: string;
    evidence: string[];
    implications: string;
  }>;
  limitations: string[];
  future_work: string[];
  mode?: string;
  raw_text?: string;
}

export interface QwenService {
  // 健康检查
  checkHealth: () => Promise<{ status: string; model: string; apiConfigured: boolean }>;

  // 研究选题分析
  analyzeTopic: (params: {
    topic: string;
    description: string;
    keywords: string[];
    references?: Array<{ title: string; authors: string[]; year: number }>;
  }) => Promise<TopicAnalysisResult>;

  // 生成文献综述
  generateLiteratureReview: (params: {
    topic: string;
    references?: Array<{ title: string; authors?: string[]; year?: number; abstract?: string }>;
    existingReview?: string;
  }) => Promise<LiteratureReviewResult>;

  // 生成研究思路
  generateResearchIdeas: (params: {
    topic: string;
    keywords: string[];
    literatureReview?: Record<string, unknown>;
  }) => Promise<ResearchIdeasResult>;

  // 生成实验设计
  generateExperimentDesign: (params: {
    topic: string;
    researchIdea?: Record<string, unknown>;
    datasetInfo?: string;
  }) => Promise<ExperimentDesignResult>;

  // 深度分析实验结果
  analyzeResults: (params: {
    experimentTitle: string;
    metrics?: Array<{ name: string; value: number; unit: string }>;
    testResults?: Array<{ name: string; pValue: number; significance: boolean }>;
    visualInsights?: string;
  }) => Promise<ResultsAnalysisResult>;

  // 深度情感分析
  analyzeSentiment: (params: {
    texts: string[];
    context?: string;
  }) => Promise<Record<string, unknown>>;

  // 深度语义分析
  analyzeSemantic: (params: {
    texts: string[];
    topicCount?: number;
  }) => Promise<Record<string, unknown>>;
}

// ── 实现 ──
export const qwenService: QwenService = {
  checkHealth,

  async analyzeTopic(params) {
    return postQwen<TopicAnalysisResult>('/api/analyze-topic', params as Record<string, unknown>);
  },

  async generateLiteratureReview(params) {
    return postQwen<LiteratureReviewResult>('/api/generate-literature-review', params as Record<string, unknown>);
  },

  async generateResearchIdeas(params) {
    return postQwen<ResearchIdeasResult>('/api/generate-research-ideas', params as Record<string, unknown>);
  },

  async generateExperimentDesign(params) {
    return postQwen<ExperimentDesignResult>('/api/generate-experiment-design', params as Record<string, unknown>);
  },

  async analyzeResults(params) {
    return postQwen<ResultsAnalysisResult>('/api/analyze-results', params as Record<string, unknown>);
  },

  async analyzeSentiment(params) {
    return postQwen('/api/deep-sentiment-analysis', params as Record<string, unknown>);
  },

  async analyzeSemantic(params) {
    return postQwen('/api/deep-semantic-analysis', params as Record<string, unknown>);
  },
};

export default qwenService;
