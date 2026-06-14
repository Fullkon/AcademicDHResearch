// ============================================================
// 核心类型定义 - 学术研究智能体
// ============================================================

// ---- 研究项目 ----
export interface ResearchProject {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  discipline: string;
  status: ResearchStatus;
  createdAt: Date;
  updatedAt: Date;
  references: Reference[];
  literatureReview: string;
  researchIdeas: ResearchIdea[];
  experiments: Experiment[];
}

export type ResearchStatus = 'planning' | 'literature_review' | 'experiment_design' | 'executing' | 'completed';

// ---- 参考文献 ----
export interface Reference {
  id: string;
  title: string;
  authors: string[];
  year: number;
  journal: string;
  doi?: string;
  abstract: string;
  keywords: string[];
  source: 'cnki' | 'web_of_science' | 'scopus' | 'google_scholar' | 'manual' | 'openalex' | 'semantic_scholar';
  citations: number;
  url?: string;
}

// ---- 研究思路 ----
export interface ResearchIdea {
  id: string;
  title: string;
  description: string;
  methodology: string;
  expectedOutcomes: string;
  feasibility: 'high' | 'medium' | 'low';
  relatedReferences: string[];
}

// ---- 实验 ----
export interface Experiment {
  id: string;
  title: string;
  objective: string;
  hypothesis: string;
  design: ExperimentDesign;
  status: ExperimentStatus;
  datasetId?: string;
  results?: ExperimentResult;
  createdAt: Date;
  completedAt?: Date;
}

export interface ExperimentDesign {
  type: 'quantitative' | 'qualitative' | 'mixed';
  method: string;
  variables: Variable[];
  procedure: ExperimentStep[];
  tools: string[];
}

export interface Variable {
  name: string;
  type: 'independent' | 'dependent' | 'control';
  description: string;
  measurement: string;
}

export interface ExperimentStep {
  order: number;
  title: string;
  description: string;
  duration: string;
  expectedOutput: string;
}

export interface ExperimentResult {
  metrics: Metric[];
  visualizations: Visualization[];
  statisticalTests: StatisticalTest[];
  findings: Finding[];
}

export interface Metric {
  name: string;
  value: number;
  unit: string;
  baseline?: number;
  improvement?: number;
}

export interface Visualization {
  type: 'bar' | 'line' | 'scatter' | 'pie' | 'heatmap' | 'network';
  title: string;
  data: Record<string, unknown>[];
  xKey: string;
  yKeys: string[];
}

export interface StatisticalTest {
  name: string;
  testType: string;
  pValue: number;
  effectSize?: number;
  significance: boolean;
  interpretation: string;
}

export interface Finding {
  id: string;
  title: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  supportingEvidence: string[];
  implications: string;
}

export type ExperimentStatus = 'designed' | 'preparing_data' | 'running' | 'completed' | 'failed';

// ---- 文献检索 ----
export interface LiteratureSearchQuery {
  keywords: string[];
  databases: string[];
  dateRange: { start: number; end: number };
  languages: string[];
  sortBy: 'relevance' | 'date' | 'citations';
  limit: number;
}

export interface LiteratureSearchResult {
  total: number;
  results: Reference[];
  facets: SearchFacet[];
}

export interface SearchFacet {
  field: string;
  values: { label: string; count: number }[];
}

// ---- 语料库检索 ----
export type CorpusSearchType = 'concordance' | 'collocation' | 'semantic' | 'sentiment';

export interface CorpusSearchQuery {
  type: CorpusSearchType;
  query: string;
  corpus: string;
  windowSize?: number;
  filters?: CorpusFilter[];
}

export interface CorpusFilter {
  field: string;
  value: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'regex';
}

export interface ConcordanceResult {
  node: string;
  leftContext: string;
  rightContext: string;
  source: string;
  line: number;
  metadata: Record<string, string>;
}

export interface CollocationResult {
  word: string;
  frequency: number;
  mi: number;       // Mutual Information
  tScore: number;
  logDice: number;
  position: 'left' | 'right';
  distance: number;
}

export interface SemanticResult {
  topic: string;
  keywords: string[];
  weight: number;
  coherence: number;
  documents: number;
}

export interface SentimentResult {
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  score: number;
  aspects: { aspect: string; sentiment: string; score: number }[];
  confidence: number;
}

// ---- 数据集 ----
export interface Dataset {
  id: string;
  name: string;
  description: string;
  type: 'text' | 'numerical' | 'mixed' | 'image' | 'geospatial';
  source: 'existing' | 'constructed';
  size: number;
  format: string;
  fields: DatasetField[];
  license?: string;
  url?: string;
  createdAt: Date;
}

export interface DatasetField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'text' | 'category';
  description: string;
  stats?: { min?: number; max?: number; mean?: number; unique?: number };
}

// ---- 地图与统计 ----
export interface MapSearchQuery {
  region: string;
  layerType: 'administrative' | 'topographic' | 'thematic' | 'historical';
  theme?: string;
  year?: number;
}

export interface MapLayer {
  id: string;
  name: string;
  type: string;
  url: string;
  metadata: Record<string, string>;
}

export interface StatisticalQuery {
  database: string;
  indicator: string;
  region: string;
  years: number[];
}

export interface StatisticalData {
  indicator: string;
  unit: string;
  dataPoints: { year: number; value: number; region: string }[];
}

// ---- 文献综述 ----
export interface LiteratureReview {
  topic: string;
  summary: string;
  keyFindings: string[];
  researchGaps: string[];
  theoreticalFramework: string;
  references: Reference[];
}
