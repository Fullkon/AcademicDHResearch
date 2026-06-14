import React, { useState } from 'react';
import {
  Search, AlignJustify, Link2, Brain, Heart, Loader2,
  Database, BookOpen, Sparkles, Code2, Zap, FileText,
} from 'lucide-react';
import { ConcordanceView } from './ConcordanceView';
import { CollocationView } from './CollocationView';
import { SemanticView } from './SemanticView';
import { SentimentView } from './SentimentView';
import { corpusService } from '@/services/mcp/CorpusService';
import { qwenService } from '@/services/QwenService';
import type {
  CorpusSearchType, ConcordanceResult, CollocationResult,
  SemanticResult, SentimentResult,
} from '@/types';

type AnalysisTab = 'cqp' | 'concordance' | 'collocation' | 'semantic' | 'sentiment';

const tabs: { id: AnalysisTab; label: string; icon: React.FC<{ className?: string }>; desc: string }[] = [
  { id: 'cqp', label: 'CQP检索', icon: Code2, desc: '自然语言→CQP查询' },
  { id: 'concordance', label: '索引行', icon: AlignJustify, desc: 'KWIC索引行检索' },
  { id: 'collocation', label: '搭配分析', icon: Link2, desc: 'MI/T/LogDice搭配统计' },
  { id: 'semantic', label: '主题语义', icon: Brain, desc: 'LDA主题建模' },
  { id: 'sentiment', label: '情感态度', icon: Heart, desc: '情感极性分析' },
];

export const CorpusSearch: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('cqp');
  const [query, setQuery] = useState('');
  const [corpus, setCorpus] = useState('');
  const [windowSize, setWindowSize] = useState(5);
  const [isSearching, setIsSearching] = useState(false);

  // CQP 状态
  const [cqpHint, setCqpHint] = useState('');     // LLM 解释
  const [cqping, setCqping] = useState(false);     // LLM 转换中
  const [cqpCorpora, setCqpCorpora] = useState<{ id: string; name: string; size: string }[]>([]);

  // Results state
  const [concordanceResults, setConcordanceResults] = useState<{
    results: ConcordanceResult[];
    nodeWord: string;
    metadata: { corpus: string; size: number; queryTime: string };
  } | null>(null);
  const [collocationResults, setCollocationResults] = useState<{
    results: CollocationResult[];
    nodeWord: string;
    spanInfo: { left: number; right: number };
    corpusInfo: { name: string; tokens: number };
  } | null>(null);
  const [semanticResults, setSemanticResults] = useState<{
    results: SemanticResult[];
    method: string;
    parameters: Record<string, unknown>;
  } | null>(null);
  const [sentimentResults, setSentimentResults] = useState<{
    results: SentimentResult[];
    overallSentiment: { positive: number; negative: number; neutral: number; mixed: number };
    lexicon: string;
  } | null>(null);

  const [corpora, setCorpora] = useState<{ id: string; name: string; size: string; language: string; description: string }[]>([]);

  // Load corpora list
  React.useEffect(() => {
    corpusService.getAvailableCorpora().then(setCorpora);
    corpusService.getCqpCorpora().then(list => {
      setCqpCorpora(list.map(c => ({ id: c.name, name: c.name, size: c.size })));
    });
  }, []);

  // ═══ CQP 检索：自然语言 → Qwen转换 → CQP查询 ═══
  const handleCqpSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true); setCqping(true); setCqpHint('');
    setConcordanceResults(null); setCollocationResults(null);

    try {
      // Step 1: Qwen 将自然语言转换为 CQP 查询参数
      const cqpResult = await qwenService.nlToCqp({ query });
      setCqping(false);

      if (cqpResult.mode === 'fallback') {
        setConcordanceResults(null);
        setCqpHint('⚠ Qwen API 未配置，请直接在下方使用传统检索模式');
        return;
      }

      setCqpHint(`Qwen: ${cqpResult.explanation || ''} → 查询类型: ${cqpResult.searchType}, 查询词: "${cqpResult.query}"`);

      // Step 2: 执行 CQP 查询
      if (cqpResult.searchType === 'collocation') {
        const collResult = await corpusService.cqpCollocation({
          query: cqpResult.query,
          windowSize: cqpResult.contextSize || 5,
          maxResults: 50,
          corpus: corpus || undefined,
        });
        if (collResult) {
          setCollocationResults({
            results: collResult.results || [],
            nodeWord: collResult.nodeWord || cqpResult.query,
            spanInfo: collResult.spanInfo || { left: 5, right: 5 },
            corpusInfo: collResult.corpusInfo || { name: '本地语料库', tokens: 0 },
          });
        }
      } else {
        const cqpData = await corpusService.cqpSearch({
          query: cqpResult.query,
          searchType: cqpResult.searchType || 'word',
          contextSize: cqpResult.contextSize || 30,
          maxResults: 100,
          corpus: corpus || undefined,
        });
        if (cqpData) {
          setConcordanceResults({
            results: cqpData.results || [],
            nodeWord: cqpData.nodeWord || cqpResult.query,
            metadata: cqpData.metadata || {
              corpus: '本地语料库',
              size: 0,
              queryTime: new Date().toISOString(),
            },
          });
        }
      }
    } catch (e: unknown) {
      console.error('CQP search failed:', e);
      setCqpHint(`检索失败: ${e instanceof Error ? e.message : '未知错误'}`);
    } finally {
      setIsSearching(false); setCqping(false);
    }
  };

  // 传统检索
  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true); setCqpHint('');
    setConcordanceResults(null); setCollocationResults(null);

    try {
      const searchQuery = { type: activeTab as CorpusSearchType, query, corpus, windowSize };
      switch (activeTab) {
        case 'concordance':
          setConcordanceResults(await corpusService.searchConcordance(searchQuery));
          break;
        case 'collocation':
          setCollocationResults(await corpusService.searchCollocation(searchQuery));
          break;
        case 'semantic':
          setSemanticResults(await corpusService.analyzeSemantic(searchQuery));
          break;
        case 'sentiment':
          setSentimentResults(await corpusService.analyzeSentiment(searchQuery));
          break;
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const hasResults = () => {
    switch (activeTab) {
      case 'cqp': return concordanceResults !== null || collocationResults !== null;
      case 'concordance': return concordanceResults !== null;
      case 'collocation': return collocationResults !== null;
      case 'semantic': return semanticResults !== null;
      case 'sentiment': return sentimentResults !== null;
    }
  };

  const showCollocation = activeTab === 'collocation' || (activeTab === 'cqp' && collocationResults);
  const showConcordance = activeTab !== 'collocation' && activeTab !== 'semantic' && activeTab !== 'sentiment';

  return (
    <div className="space-y-6">
      {/* 检索区域 */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">语料库检索</h2>
            <p className="text-sm text-gray-500">CQP自然语言查询 · 索引行 · 搭配分析 · 主题语义 · 情感态度</p>
          </div>
        </div>

        {/* 分析类型标签 */}
        <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-xl overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[70px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 检索表单 */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="label-text flex items-center gap-2">
                {activeTab === 'cqp' ? (
                  <><Sparkles className="w-3.5 h-3.5 text-purple-500" /> 自然语言查询（Qwen 自动转换为 CQP 语句）</>
                ) : activeTab === 'concordance' ? '检索词/短语' :
                 activeTab === 'collocation' ? '节点词' :
                 activeTab === 'semantic' ? '分析文本或主题关键词' :
                 '待分析文本'}
              </label>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (activeTab === 'cqp' ? handleCqpSearch() : handleSearch())}
                placeholder={
                  activeTab === 'cqp'
                    ? '如："找出所有提到孙悟空的句子"、"分析八戒的搭配词"、"查找师徒和妖怪同时出现的段落"'
                    : activeTab === 'concordance' ? '输入检索词，如"文化"' :
                    activeTab === 'collocation' ? '输入节点词，如"文化"' :
                    activeTab === 'semantic' ? '输入领域关键词或粘贴文本' :
                    '输入待分析文本'
                }
                className="input-field"
              />
            </div>
            <div className="w-48">
              <label className="label-text">语料库</label>
              <select
                value={corpus}
                onChange={e => setCorpus(e.target.value)}
                className="input-field"
              >
                <option value="">全部语料</option>
                {cqpCorpora.length > 0
                  ? cqpCorpora.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.size})</option>
                    ))
                  : corpora.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))
                }
              </select>
            </div>
            {(activeTab === 'concordance' || activeTab === 'collocation') && (
              <div className="w-24">
                <label className="label-text">跨距</label>
                <select
                  value={windowSize}
                  onChange={e => setWindowSize(Number(e.target.value))}
                  className="input-field"
                >
                  {[3, 5, 7, 10].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Qwen 转换提示 */}
          {cqpHint && (
            <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg text-xs text-purple-700">
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-purple-500" />
              <span>{cqpHint}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {activeTab === 'cqp' && (
                <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> 语料: {cqpCorpora.length || '...'} 部</span>
              )}
              {tabs.find(t => t.id === activeTab)?.desc}
            </div>
            <button
              onClick={activeTab === 'cqp' ? handleCqpSearch : handleSearch}
              disabled={isSearching || !query.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {isSearching ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {cqping ? 'Qwen 分析中...' : '检索中...'}</>
              ) : (
                <><Search className="w-4 h-4" /> 开始检索</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 结果区域 */}
      {hasResults() ? (
        <div className="card">
          {showCollocation && collocationResults && (
            <CollocationView {...collocationResults} />
          )}
          {showConcordance && concordanceResults && (
            <ConcordanceView {...concordanceResults} />
          )}
          {activeTab === 'semantic' && semanticResults && (
            <SemanticView {...semanticResults} />
          )}
          {activeTab === 'sentiment' && sentimentResults && (
            <SentimentView {...sentimentResults} />
          )}
          {/* CQP 有结果但类型分离时显示总计 */}
          {activeTab === 'cqp' && concordanceResults && (
            <div className="text-xs text-gray-400 mt-2 pt-2 border-t">
              共找到 {concordanceResults.results?.length || 0} 条匹配结果
            </div>
          )}
          {activeTab === 'cqp' && collocationResults && (
            <div className="text-xs text-gray-400 mt-2 pt-2 border-t">
              共分析 {collocationResults.results?.length || 0} 个搭配词
            </div>
          )}
        </div>
      ) : !isSearching && (
        <div className="text-center py-16 text-gray-400">
          <Database className="w-20 h-20 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">
            {activeTab === 'cqp' ? '输入自然语言查询，Qwen 自动转换为 CQP 语句' :
             activeTab === 'concordance' ? '输入检索词查看索引行' :
             activeTab === 'collocation' ? '输入节点词查看搭配统计' :
             activeTab === 'semantic' ? '输入文本进行主题建模' :
             '输入文本分析情感倾向'}
          </p>
          <p className="text-sm mt-1">
            {activeTab === 'cqp'
              ? '例如："找孙悟空出现的句子"、"分析唐僧的搭配词"'
              : '支持中文和英文语料库检索'}
          </p>
        </div>
      )}
    </div>
  );
};
