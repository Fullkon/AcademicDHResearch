import React, { useState } from 'react';
import {
  Search, AlignJustify, Link2, Brain, Heart, Loader2,
  Database, BookOpen,
} from 'lucide-react';
import { ConcordanceView } from './ConcordanceView';
import { CollocationView } from './CollocationView';
import { SemanticView } from './SemanticView';
import { SentimentView } from './SentimentView';
import { corpusService } from '@/services/mcp/CorpusService';
import type {
  CorpusSearchType, ConcordanceResult, CollocationResult,
  SemanticResult, SentimentResult,
} from '@/types';

type AnalysisTab = 'concordance' | 'collocation' | 'semantic' | 'sentiment';

const tabs: { id: AnalysisTab; label: string; icon: React.FC<{ className?: string }>; desc: string }[] = [
  { id: 'concordance', label: '索引行', icon: AlignJustify, desc: 'KWIC索引行检索' },
  { id: 'collocation', label: '搭配分析', icon: Link2, desc: 'MI/T/LogDice搭配统计' },
  { id: 'semantic', label: '主题语义', icon: Brain, desc: 'LDA主题建模' },
  { id: 'sentiment', label: '情感态度', icon: Heart, desc: '情感极性分析' },
];

export const CorpusSearch: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('concordance');
  const [query, setQuery] = useState('');
  const [corpus, setCorpus] = useState('bcc');
  const [windowSize, setWindowSize] = useState(5);
  const [isSearching, setIsSearching] = useState(false);

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
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);

    try {
      const searchQuery = { type: activeTab, query, corpus, windowSize };
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
      case 'concordance': return concordanceResults !== null;
      case 'collocation': return collocationResults !== null;
      case 'semantic': return semanticResults !== null;
      case 'sentiment': return sentimentResults !== null;
    }
  };

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
            <p className="text-sm text-gray-500">索引行 · 搭配分析 · 主题语义 · 情感态度</p>
          </div>
        </div>

        {/* 分析类型标签 */}
        <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-xl">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
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
              <label className="label-text">
                {activeTab === 'concordance' ? '检索词/短语' :
                 activeTab === 'collocation' ? '节点词' :
                 activeTab === 'semantic' ? '分析文本或主题关键词' :
                 '待分析文本'}
              </label>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder={
                  activeTab === 'concordance' ? '输入检索词，如"文化"' :
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
                {corpora.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
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

          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-400">
              {tabs.find(t => t.id === activeTab)?.desc}
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {isSearching ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 分析中...</>
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
          {activeTab === 'concordance' && concordanceResults && (
            <ConcordanceView {...concordanceResults} />
          )}
          {activeTab === 'collocation' && collocationResults && (
            <CollocationView {...collocationResults} />
          )}
          {activeTab === 'semantic' && semanticResults && (
            <SemanticView {...semanticResults} />
          )}
          {activeTab === 'sentiment' && sentimentResults && (
            <SentimentView {...sentimentResults} />
          )}
        </div>
      ) : !isSearching && (
        <div className="text-center py-16 text-gray-400">
          <Database className="w-20 h-20 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">
            {activeTab === 'concordance' ? '输入检索词查看索引行' :
             activeTab === 'collocation' ? '输入节点词查看搭配统计' :
             activeTab === 'semantic' ? '输入文本进行主题建模' :
             '输入文本分析情感倾向'}
          </p>
          <p className="text-sm mt-1">
            支持中文和英文语料库检索
          </p>
        </div>
      )}
    </div>
  );
};
