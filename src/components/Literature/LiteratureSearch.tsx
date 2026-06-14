import React, { useState } from 'react';
import {
  Search, Database, Filter, Loader2, BookOpen, Globe,
  X, ExternalLink, ChevronDown,
} from 'lucide-react';
import { LiteratureCard } from './LiteratureCard';
import { literatureService } from '@/services/mcp/LiteratureService';
import { useResearchStore } from '@/stores/useResearchStore';
import type { LiteratureSearchQuery, LiteratureSearchResult, Reference } from '@/types';

const AVAILABLE_DATABASES = [
  { id: 'cnki', label: 'CNKI (中国知网)', icon: '📚' },
  { id: 'wos', label: 'Web of Science', icon: '🌐' },
  { id: 'scopus', label: 'Scopus', icon: '🔬' },
];

export const LiteratureSearch: React.FC = () => {
  const { currentProject, addReference } = useResearchStore();
  const addedRefIds = currentProject?.references.map(r => r.id) || [];

  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [selectedDBs, setSelectedDBs] = useState<string[]>(['cnki', 'wos', 'scopus']);
  const [dateStart, setDateStart] = useState(2018);
  const [dateEnd, setDateEnd] = useState(2024);
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'citations'>('relevance');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<LiteratureSearchResult | null>(null);
  const [error, setError] = useState('');

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (kw: string) => setKeywords(keywords.filter(k => k !== kw));

  const toggleDatabase = (db: string) => {
    setSelectedDBs(prev =>
      prev.includes(db) ? prev.filter(d => d !== db) : [...prev, db]
    );
  };

  const handleSearch = async () => {
    if (keywords.length === 0) {
      setError('请输入至少一个检索关键词');
      return;
    }
    setError('');
    setIsSearching(true);

    try {
      const query: LiteratureSearchQuery = {
        keywords,
        databases: selectedDBs,
        dateRange: { start: dateStart, end: dateEnd },
        languages: ['zh', 'en'],
        sortBy,
        limit: 50,
      };

      let result: LiteratureSearchResult;
      if (selectedDBs.length === 1) {
        switch (selectedDBs[0]) {
          case 'cnki': result = await literatureService.searchCNKI(query); break;
          case 'wos': result = await literatureService.searchWoS(query); break;
          case 'scopus': result = await literatureService.searchScopus(query); break;
          default: result = await literatureService.searchAll(query);
        }
      } else {
        result = await literatureService.searchAll(query);
      }
      setResults(result);
    } catch (err) {
      setError('检索失败，请稍后重试');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 检索区域 */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">文献数据库检索</h2>
            <p className="text-sm text-gray-500">支持CNKI、Web of Science、Scopus等主要学术数据库</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* 关键词输入 */}
          <div>
            <label className="label-text">检索关键词</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                placeholder="输入关键词，按回车添加"
                className="input-field flex-1"
              />
              <button onClick={addKeyword} className="btn-secondary">添加</button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {keywords.map(kw => (
                  <span key={kw} className="badge-blue inline-flex items-center gap-1">
                    {kw}
                    <button onClick={() => removeKeyword(kw)}>
                      <X className="w-3 h-3 hover:text-blue-700" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 数据库选择 */}
          <div>
            <label className="label-text">检索数据库</label>
            <div className="flex gap-2">
              {AVAILABLE_DATABASES.map(db => (
                <button
                  key={db.id}
                  onClick={() => toggleDatabase(db.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    selectedDBs.includes(db.id)
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-1">{db.icon}</span>
                  {db.label}
                </button>
              ))}
            </div>
          </div>

          {/* 年份和排序 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label-text">起始年份</label>
              <select
                value={dateStart}
                onChange={e => setDateStart(Number(e.target.value))}
                className="input-field"
              >
                {Array.from({ length: 25 }, (_, i) => 2000 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-text">结束年份</label>
              <select
                value={dateEnd}
                onChange={e => setDateEnd(Number(e.target.value))}
                className="input-field"
              >
                {Array.from({ length: 25 }, (_, i) => 2000 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-text">排序方式</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="input-field"
              >
                <option value="relevance">相关度</option>
                <option value="date">出版日期</option>
                <option value="citations">引用次数</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="btn-primary flex items-center gap-2"
            >
              {isSearching ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 检索中...</>
              ) : (
                <><Search className="w-4 h-4" /> 开始检索</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 检索结果 */}
      {results && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">
              检索结果：共 <span className="text-primary-600">{results.total}</span> 篇文献
            </h3>
            <div className="flex gap-2">
              {results.facets.map(facet => (
                <div key={facet.field} className="relative group">
                  <button className="btn-secondary text-xs flex items-center gap-1">
                    <Filter className="w-3 h-3" />
                    {facet.field === 'year' ? '年份' : facet.field === 'source' ? '来源' : facet.field}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {results.results.map(ref => (
              <LiteratureCard
                key={ref.id}
                reference={ref}
                onAdd={addReference}
                isAdded={addedRefIds.includes(ref.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 空状态提示 */}
      {!results && !isSearching && (
        <div className="text-center py-12 text-gray-400">
          <Database className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">输入关键词开始检索文献</p>
          <p className="text-sm mt-1">支持中文和英文检索，跨数据库联合查询</p>
        </div>
      )}
    </div>
  );
};
