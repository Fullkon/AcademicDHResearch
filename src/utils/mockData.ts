import type {
  Reference, ResearchProject, ConcordanceResult, CollocationResult,
  SemanticResult, SentimentResult, Dataset, StatisticalData, MapLayer,
  Experiment, Finding, LiteratureReview
} from '@/types';

// ============================================================
// 模拟文献数据
// ============================================================
export const mockReferences: Reference[] = [
  {
    id: 'ref-1',
    title: '基于语料库的现代汉语虚词搭配模式研究',
    authors: ['张明', '李华'],
    year: 2023,
    journal: '语言文字应用',
    source: 'cnki',
    abstract: '本研究基于大规模现代汉语语料库，运用搭配分析方法，系统考察了现代汉语虚词的搭配模式及其语义特征。',
    keywords: ['语料库', '虚词', '搭配', '语义分析'],
    citations: 45,
    doi: '10.1234/cnki.2023.001',
  },
  {
    id: 'ref-2',
    title: 'Corpus-based Analysis of Academic Discourse: A Cross-linguistic Study',
    authors: ['Smith, J.', 'Wang, L.'],
    year: 2022,
    journal: 'Journal of Corpus Linguistics',
    source: 'web_of_science',
    abstract: 'This study presents a cross-linguistic analysis of academic discourse patterns using parallel corpora of English and Chinese research articles.',
    keywords: ['corpus linguistics', 'academic discourse', 'cross-linguistic', 'register analysis'],
    citations: 78,
    doi: '10.5678/jcl.2022.003',
  },
  {
    id: 'ref-3',
    title: '数字人文视域下的古典文献文本挖掘方法研究',
    authors: ['王芳', '刘洋', '陈静'],
    year: 2024,
    journal: '数字人文研究',
    source: 'cnki',
    abstract: '本文探讨了数字人文研究中的文本挖掘方法，包括主题建模、情感分析、社会网络分析等技术在古典文献研究中的应用。',
    keywords: ['数字人文', '文本挖掘', '主题建模', '古典文献'],
    citations: 23,
    doi: '10.1234/dhr.2024.002',
  },
  {
    id: 'ref-4',
    title: 'Sentiment Analysis in Historical Texts: Challenges and Opportunities',
    authors: ['Brown, M.', 'Garcia, R.'],
    year: 2023,
    journal: 'Digital Scholarship in the Humanities',
    source: 'scopus',
    abstract: 'We examine the application of sentiment analysis techniques to historical texts, discussing methodological challenges and potential solutions.',
    keywords: ['sentiment analysis', 'historical texts', 'digital humanities', 'NLP'],
    citations: 56,
    doi: '10.5678/dsh.2023.015',
  },
  {
    id: 'ref-5',
    title: '基于语料库的中国文学英译风格研究',
    authors: ['赵明'],
    year: 2022,
    journal: '外语教学与研究',
    source: 'cnki',
    abstract: '利用平行语料库，对莫言小说的英译本进行风格量化分析，揭示翻译过程中的风格偏移现象。',
    keywords: ['平行语料库', '翻译风格', '文学翻译', '量化分析'],
    citations: 34,
    doi: '10.1234/fltr.2022.008',
  },
  {
    id: 'ref-6',
    title: 'Digital Humanities and the Future of Literary Studies',
    authors: ['Johnson, K.', 'Lee, S.'],
    year: 2024,
    journal: 'Literary and Linguistic Computing',
    source: 'web_of_science',
    abstract: 'A comprehensive review of how digital humanities methodologies are transforming traditional literary studies.',
    keywords: ['digital humanities', 'literary studies', 'computational methods', 'distant reading'],
    citations: 89,
    doi: '10.5678/llc.2024.001',
  },
];

// ============================================================
// 模拟语料库检索结果 - 索引行
// ============================================================
export const mockConcordanceResults: ConcordanceResult[] = [
  { node: '文化', leftContext: '中国传统', rightContext: '博大精深，源远流长', source: 'BCC语料库', line: 1, metadata: { genre: '新闻' } },
  { node: '文化', leftContext: '跨', rightContext: '交流日益频繁', source: 'BCC语料库', line: 2, metadata: { genre: '学术' } },
  { node: '文化', leftContext: '数字人文为传统', rightContext: '研究提供了新视角', source: '学术论文', line: 3, metadata: { genre: '学术' } },
  { node: '文化', leftContext: '语言与', rightContext: '之间存在着密切的关系', source: 'BCC语料库', line: 4, metadata: { genre: '教科书' } },
  { node: '文化', leftContext: '多元', rightContext: '融合是当代社会的重要特征', source: '人民日报', line: 5, metadata: { genre: '新闻' } },
  { node: '文化', leftContext: '非物质', rightContext: '遗产保护工作取得显著进展', source: '政府报告', line: 6, metadata: { genre: '官方' } },
  { node: '文化', leftContext: '儒家', rightContext: '对东亚社会产生了深远影响', source: '学术论文', line: 7, metadata: { genre: '学术' } },
  { node: '文化', leftContext: '大众', rightContext: '消费模式正在发生转变', source: 'BCC语料库', line: 8, metadata: { genre: '新闻' } },
  { node: '文化', leftContext: '网络', rightContext: '现象引起了学者的广泛关注', source: '社交媒体', line: 9, metadata: { genre: '网络' } },
  { node: '文化', leftContext: '地域', rightContext: '差异对语言使用有显著影响', source: '学术论文', line: 10, metadata: { genre: '学术' } },
];

// ============================================================
// 模拟语料库检索结果 - 搭配
// ============================================================
export const mockCollocationResults: CollocationResult[] = [
  { word: '传统', frequency: 234, mi: 4.56, tScore: 12.3, logDice: 8.2, position: 'left', distance: 1 },
  { word: '交流', frequency: 187, mi: 3.89, tScore: 10.1, logDice: 7.8, position: 'right', distance: 1 },
  { word: '遗产', frequency: 145, mi: 5.12, tScore: 9.8, logDice: 9.1, position: 'right', distance: 1 },
  { word: '差异', frequency: 132, mi: 3.45, tScore: 8.7, logDice: 7.2, position: 'right', distance: 2 },
  { word: '传播', frequency: 198, mi: 4.23, tScore: 11.4, logDice: 8.5, position: 'right', distance: 1 },
  { word: '传承', frequency: 167, mi: 4.89, tScore: 10.6, logDice: 8.9, position: 'right', distance: 1 },
  { word: '融合', frequency: 156, mi: 3.78, tScore: 9.5, logDice: 7.6, position: 'right', distance: 1 },
  { word: '创新', frequency: 123, mi: 3.12, tScore: 8.2, logDice: 6.8, position: 'right', distance: 2 },
];

// ============================================================
// 模拟主题语义分析
// ============================================================
export const mockSemanticResults: SemanticResult[] = [
  { topic: '传统文化传承', keywords: ['传统', '传承', '遗产', '保护', '非遗'], weight: 0.85, coherence: 0.72, documents: 156 },
  { topic: '跨文化交流', keywords: ['交流', '传播', '国际', '跨文化', '翻译'], weight: 0.78, coherence: 0.68, documents: 132 },
  { topic: '数字人文方法', keywords: ['数字', '技术', '计算', '数据', '文本挖掘'], weight: 0.92, coherence: 0.81, documents: 89 },
  { topic: '文化政策与治理', keywords: ['政策', '治理', '管理', '发展', '规划'], weight: 0.71, coherence: 0.65, documents: 78 },
  { topic: '文化产业经济', keywords: ['产业', '经济', '消费', '市场', '创意'], weight: 0.68, coherence: 0.61, documents: 95 },
  { topic: '语言与文化认同', keywords: ['语言', '认同', '身份', '方言', '民族'], weight: 0.74, coherence: 0.69, documents: 67 },
];

// ============================================================
// 模拟情感分析
// ============================================================
export const mockSentimentResults: SentimentResult[] = [
  { text: '数字人文为传统文化研究提供了新的方法和视角，具有重要的学术价值。', sentiment: 'positive', score: 0.82, aspects: [{ aspect: '方法论', sentiment: 'positive', score: 0.85 }, { aspect: '学术价值', sentiment: 'positive', score: 0.90 }], confidence: 0.88 },
  { text: '然而，当前数字人文研究仍面临数据质量不高、方法不统一等挑战。', sentiment: 'negative', score: -0.45, aspects: [{ aspect: '数据质量', sentiment: 'negative', score: -0.60 }, { aspect: '方法统一性', sentiment: 'negative', score: -0.55 }], confidence: 0.79 },
  { text: '语料库方法能够有效揭示大规模文本中的语言使用规律。', sentiment: 'positive', score: 0.76, aspects: [{ aspect: '有效性', sentiment: 'positive', score: 0.80 }], confidence: 0.85 },
  { text: '机器翻译在文学作品中仍无法完全替代人工翻译的精确性。', sentiment: 'mixed', score: -0.12, aspects: [{ aspect: '机器翻译', sentiment: 'negative', score: -0.40 }, { aspect: '文学作品', sentiment: 'neutral', score: 0.05 }], confidence: 0.72 },
];

// ============================================================
// 模拟数据集
// ============================================================
export const mockDatasets: Dataset[] = [
  {
    id: 'ds-1',
    name: 'BCC现代汉语语料库（子集）',
    description: '北京语言大学BCC语料库的现代汉语子集，包含新闻、文学、学术等领域的文本。',
    type: 'text',
    source: 'existing',
    size: 15000000,
    format: 'JSONL',
    fields: [
      { name: 'text', type: 'text', description: '文本内容', stats: { unique: 15000000 } },
      { name: 'genre', type: 'category', description: '体裁分类', stats: { unique: 8 } },
      { name: 'year', type: 'number', description: '年份', stats: { min: 2000, max: 2024 } },
    ],
    license: 'CC BY-NC-SA 4.0',
    createdAt: new Date('2023-01-15'),
  },
  {
    id: 'ds-2',
    name: '中国学术论文摘要数据集',
    description: '包含2010-2024年中国知网收录的人文社科类学术论文摘要。',
    type: 'text',
    source: 'existing',
    size: 500000,
    format: 'CSV',
    fields: [
      { name: 'title', type: 'text', description: '论文标题' },
      { name: 'abstract', type: 'text', description: '摘要' },
      { name: 'keywords', type: 'text', description: '关键词' },
      { name: 'discipline', type: 'category', description: '学科分类', stats: { unique: 24 } },
      { name: 'year', type: 'number', description: '发表年份', stats: { min: 2010, max: 2024, mean: 2019.5 } },
    ],
    license: '学术用途',
    createdAt: new Date('2023-06-20'),
  },
  {
    id: 'ds-3',
    name: '中文情感词典（HowNet扩展版）',
    description: '基于HowNet情感词典扩展的中文情感词汇库，包含正面/负面情感词及强度标注。',
    type: 'mixed',
    source: 'existing',
    size: 12000,
    format: 'JSON',
    fields: [
      { name: 'word', type: 'string', description: '词汇' },
      { name: 'sentiment', type: 'category', description: '情感极性', stats: { unique: 3 } },
      { name: 'intensity', type: 'number', description: '情感强度', stats: { min: 1, max: 9, mean: 5.2 } },
      { name: 'category', type: 'category', description: '情感类别', stats: { unique: 7 } },
    ],
    createdAt: new Date('2024-03-10'),
  },
];

// ============================================================
// 模拟地图图层
// ============================================================
export const mockMapLayers: MapLayer[] = [
  { id: 'map-1', name: '中国省级行政区划', type: 'administrative', url: '/maps/china_provinces.geojson', metadata: { projection: 'WGS84', year: '2024' } },
  { id: 'map-2', name: '中国语言分布图', type: 'thematic', url: '/maps/language_distribution.geojson', metadata: { theme: '语言', source: '中国社会科学院' } },
  { id: 'map-3', name: '丝绸之路历史路线', type: 'historical', url: '/maps/silk_road.geojson', metadata: { period: '汉-明', source: '历史地理研究所' } },
  { id: 'map-4', name: '中国方言分区', type: 'thematic', url: '/maps/dialect_regions.geojson', metadata: { theme: '方言', source: '语言资源保护中心' } },
];

// ============================================================
// 模拟统计数据
// ============================================================
export const mockStatisticalData: StatisticalData[] = [
  {
    indicator: '公共图书馆数量',
    unit: '个',
    dataPoints: [
      { year: 2018, value: 3176, region: '全国' },
      { year: 2019, value: 3196, region: '全国' },
      { year: 2020, value: 3212, region: '全国' },
      { year: 2021, value: 3215, region: '全国' },
      { year: 2022, value: 3303, region: '全国' },
      { year: 2023, value: 3246, region: '全国' },
    ],
  },
  {
    indicator: '博物馆数量',
    unit: '个',
    dataPoints: [
      { year: 2018, value: 5354, region: '全国' },
      { year: 2019, value: 5535, region: '全国' },
      { year: 2020, value: 5788, region: '全国' },
      { year: 2021, value: 6183, region: '全国' },
      { year: 2022, value: 6565, region: '全国' },
      { year: 2023, value: 6833, region: '全国' },
    ],
  },
  {
    indicator: '文化产业增加值',
    unit: '亿元',
    dataPoints: [
      { year: 2018, value: 38737, region: '全国' },
      { year: 2019, value: 44363, region: '全国' },
      { year: 2020, value: 44945, region: '全国' },
      { year: 2021, value: 52385, region: '全国' },
      { year: 2022, value: 53782, region: '全国' },
      { year: 2023, value: 57829, region: '全国' },
    ],
  },
  {
    indicator: '普通高等学校人文社科毕业生数',
    unit: '万人',
    dataPoints: [
      { year: 2018, value: 58.4, region: '全国' },
      { year: 2019, value: 60.2, region: '全国' },
      { year: 2020, value: 62.8, region: '全国' },
      { year: 2021, value: 64.5, region: '全国' },
      { year: 2022, value: 66.1, region: '全国' },
      { year: 2023, value: 68.3, region: '全国' },
    ],
  },
];

// ============================================================
// 模拟实验设计
// ============================================================
export const mockExperimentDesign: Experiment = {
  id: 'exp-1',
  title: '基于语料库的中国文学作品主题演变分析',
  objective: '利用语料库方法，分析20世纪以来中国文学作品中的主题演变趋势',
  hypothesis: '中国现当代文学作品的主题呈现出从集体叙事向个体叙事转变的趋势',
  design: {
    type: 'mixed',
    method: '基于大规模语料库的主题建模与量化分析',
    variables: [
      { name: '作品年代', type: 'independent', description: '作品的创作或出版年代', measurement: '年份分组（以10年为周期）' },
      { name: '主题分布', type: 'dependent', description: 'LDA主题模型提取的主题分布', measurement: '主题权重与频率' },
      { name: '作者性别', type: 'control', description: '作者的性别', measurement: '男/女分类' },
      { name: '文学体裁', type: 'control', description: '作品的文学体裁', measurement: '小说/诗歌/散文/戏剧' },
    ],
    procedure: [
      { order: 1, title: '数据收集与预处理', description: '收集文学文本，进行分词、去停用词、词性标注等预处理', duration: '2天', expectedOutput: '预处理后的语料库' },
      { order: 2, title: '主题建模', description: '使用LDA模型提取主题，确定最优主题数', duration: '1天', expectedOutput: '主题-词汇分布矩阵' },
      { order: 3, title: '时序分析', description: '分析不同年代文学作品的主题分布变化', duration: '1天', expectedOutput: '主题演变趋势图' },
      { order: 4, title: '统计分析', description: '使用卡方检验、ANOVA等统计方法检验主题差异的显著性', duration: '1天', expectedOutput: '统计检验结果' },
      { order: 5, title: '结果解读与可视化', description: '对分析结果进行解读，制作可视化图表', duration: '1天', expectedOutput: '完整实验报告' },
    ],
    tools: ['Python', 'jieba', 'Gensim', 'Scikit-learn', 'Matplotlib', 'SPSS'],
  },
  status: 'designed',
  createdAt: new Date('2024-06-01'),
};

// ============================================================
// 模拟研究发现
// ============================================================
export const mockFindings: Finding[] = [
  {
    id: 'find-1',
    title: '主题从集体向个体转变的趋势显著',
    description: '分析结果显示，20世纪50-70年代的作品主要围绕集体主义、革命等主题，而80年代之后，个人情感、都市生活等主题显著增加。',
    confidence: 'high',
    supportingEvidence: ['LDA主题模型权重变化', '卡方检验 p<0.001', '词频统计分析'],
    implications: '这一发现支持了文学史研究中关于中国文学现代化转型的理论。',
  },
  {
    id: 'find-2',
    title: '性别因素对主题选择有显著影响',
    description: '女性作家的作品中，"家庭""情感"等主题的权重显著高于男性作家，而男性作家更倾向于"社会""历史"等宏大叙事主题。',
    confidence: 'medium',
    supportingEvidence: ['独立样本t检验 p=0.003', '主题分布可视化对比'],
    implications: '提示在研究文学主题演变时需要考虑性别维度的影响。',
  },
  {
    id: 'find-3',
    title: '文学体裁对主题表达的影响',
    description: '诗歌和散文的主题分布与小说有显著差异，诗歌更多涉及自然、哲理主题，而小说则以社会叙事为主。',
    confidence: 'high',
    supportingEvidence: ['ANOVA分析 p<0.001', '多维尺度分析'],
    implications: '未来研究应区分不同文学体裁进行主题分析。',
  },
];

// ============================================================
// 模拟文献综述
// ============================================================
export const mockLiteratureReview: LiteratureReview = {
  topic: '语料库方法与数字人文研究',
  summary: '近年来，语料库方法在数字人文研究中得到了广泛应用。研究者利用大规模语料库进行文本挖掘、主题建模、情感分析等，为人文研究提供了量化分析的新视角。现有研究表明，语料库方法能够有效揭示文本中的潜在模式和规律，但也面临数据质量、方法标准化等挑战。',
  keyFindings: [
    '语料库方法可实现大规模文本的量化分析',
    '主题建模技术在文学研究中的应用日益成熟',
    '情感分析和语义分析为文本解读提供新维度',
    '跨学科方法整合是数字人文研究的趋势',
  ],
  researchGaps: [
    '中国文学作品的大规模语料库构建尚不完善',
    '小语种和方言文本的分析方法有待开发',
    '语料库方法与传统人文研究范式的融合仍有挑战',
    '领域特定的NLP工具和资源相对匮乏',
  ],
  theoreticalFramework: '本研究基于语料库语言学理论和数字人文方法论，结合计算语言学的量化分析方法，构建了一个"数据驱动的人文研究"框架。该框架强调：1) 从大规模语料中获取经验证据；2) 结合定性和定量分析方法；3) 重视研究结果的人文阐释。',
  references: mockReferences.slice(0, 4),
};
