import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lightbulb, BookOpen, Brain, Loader2, ArrowRight, ArrowLeft,
  X, FileText, CheckCircle, Sparkles, AlertTriangle,
  Search, Database, Globe, FlaskConical, Target, Quote,
} from 'lucide-react';
import { useResearchStore } from '@/stores/useResearchStore';
import { useExperimentStore } from '@/stores/useExperimentStore';
import { qwenService } from '@/services/QwenService';
import type { TopicAnalysisResult, LiteratureReviewResult, ResearchIdeasResult, ResearchFrameworkResult, ExperimentDesignResult } from '@/services/QwenService';
import { literatureService } from '@/services/mcp/LiteratureService';
import type { LiteratureReview, Reference, ExperimentDesign } from '@/types';

const STEP_LABELS = [
  { key: 'topic', label: '选题分析', icon: FileText },
  { key: 'search', label: '文献检索', icon: Search },
  { key: 'review', label: '文献综述', icon: BookOpen },
  { key: 'framework', label: '研究框架', icon: Target },
  { key: 'experiment', label: '实验设计', icon: FlaskConical },
];

export const ResearchTopicForm: React.FC = () => {
  const navigate = useNavigate();
  const { createProject, setLiteratureReview, updateProjectStatus } = useResearchStore();
  const { addExperiment } = useExperimentStore();

  // ── Step 1: 选题 ──
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [topicAnalysis, setTopicAnalysis] = useState<TopicAnalysisResult | null>(null);
  const [analyzingTopic, setAnalyzingTopic] = useState(false);

  // ── Step 2: 文献检索 ──
  const [litResults, setLitResults] = useState<Reference[]>([]);
  const [litTotal, setLitTotal] = useState(0);
  const [searchingLit, setSearchingLit] = useState(false);
  const [selectedRefs, setSelectedRefs] = useState<Set<string>>(new Set());
  const [litSearched, setLitSearched] = useState(false);

  // ── Step 3: 文献综述 ──
  const [review, setReview] = useState<LiteratureReviewResult | null>(null);
  const [generatingReview, setGeneratingReview] = useState(false);

  // ── Step 4: 研究框架 ──
  const [framework, setFramework] = useState<ResearchFrameworkResult | null>(null);
  const [generatingFramework, setGeneratingFramework] = useState(false);

  // ── Step 5: 实验设计 ──
  const [expDesign, setExpDesign] = useState<ExperimentDesignResult | null>(null);
  const [generatingExpDesign, setGeneratingExpDesign] = useState(false);

  // ── 共同状态 ──
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !keywords.includes(kw)) { setKeywords([...keywords, kw]); setKeywordInput(''); }
  };

  // ═══ Step 1: 选题分析 ═══
  const handleAnalyzeTopic = async () => {
    if (!title.trim()) return;
    setAnalyzingTopic(true); setError('');
    try {
      const result = await qwenService.analyzeTopic({ topic: title, description, keywords });
      if (result.mode === 'fallback') {
        setError('Qwen API 未配置');
      } else {
        setTopicAnalysis(result);
        if (result.suggested_keywords?.length) {
          setKeywords(prev => [...new Set([...prev, ...result.suggested_keywords])]);
        }
      }
    } catch (e: unknown) {
      setError(`分析失败: ${e instanceof Error ? e.message : '未知错误'}`);
    } finally { setAnalyzingTopic(false); }
  };

  const goStep2 = () => {
    if (!title.trim()) return;
    createProject(title, description, keywords);
    updateProjectStatus('planning');
    setStep(2);
  };

  // ═══ Step 2: 文献检索（含双向翻译）═══
  const handleSearchLiterature = async () => {
    setSearchingLit(true); setError('');
    try {
      const rawKeywords = keywords.length > 0 ? keywords : [title];

      // 1. 先调用 Qwen 进行中英双向翻译
      let zhKeywords: string[] = [];
      let enKeywords: string[] = [];

      try {
        const translation = await qwenService.translateKeywords({ keywords: rawKeywords });
        const translated: Record<string, string> = translation.translated || {};

        for (const kw of rawKeywords) {
          const tr = translated[kw];
          const isChinese = /[\u4e00-\u9fff]/.test(kw);
          if (isChinese) {
            zhKeywords.push(kw);
            if (tr && tr !== kw) enKeywords.push(tr);
          } else {
            enKeywords.push(kw);
            if (tr && tr !== kw) zhKeywords.push(tr);
          }
        }
      } catch {
        // 翻译失败时：按字符判断语言，直接使用
        for (const kw of rawKeywords) {
          if (/[\u4e00-\u9fff]/.test(kw)) {
            zhKeywords.push(kw);
          } else {
            enKeywords.push(kw);
          }
        }
      }

      // 确保至少有一个非空集合
      if (zhKeywords.length === 0) zhKeywords = [...enKeywords];
      if (enKeywords.length === 0) enKeywords = [...zhKeywords];

      // 2. 双语联合检索
      const result = await literatureService.searchAllBilingual(
        zhKeywords,
        enKeywords,
        30,
        { start: 2015, end: 2025 },
      );
      setLitResults(result.results);
      setLitTotal(result.total);
      setLitSearched(true);
    } catch (e: unknown) {
      setError(`文献检索失败: ${e instanceof Error ? e.message : '未知错误'}`);
    } finally { setSearchingLit(false); }
  };

  const toggleRef = (refId: string) => {
    setSelectedRefs(prev => {
      const next = new Set(prev);
      next.has(refId) ? next.delete(refId) : next.add(refId);
      return next;
    });
  };

  const selectAllRefs = () => {
    if (selectedRefs.size === litResults.length) {
      setSelectedRefs(new Set());
    } else {
      setSelectedRefs(new Set(litResults.map(r => r.id)));
    }
  };

  const goStep3 = () => {
    setStep(3);
  };

  // ═══ Step 3: 文献综述 ═══
  const handleGenerateReview = async () => {
    setGeneratingReview(true); setError('');
    try {
      const selectedPapers = litResults.filter(r => selectedRefs.has(r.id));
      const refsForQwen = selectedPapers.map(r => ({
        title: r.title, authors: r.authors, year: r.year, abstract: r.abstract?.slice(0, 200),
      }));
      const result = await qwenService.generateLiteratureReview({
        topic: title,
        references: refsForQwen,
        existingReview: topicAnalysis?.research_value || '',
      });
      if (result.mode === 'fallback') {
        setError('Qwen API 未配置');
      } else {
        setReview(result);
        const lr: LiteratureReview = {
          topic: title,
          summary: result.summary || '',
          keyFindings: result.key_findings || [],
          researchGaps: result.research_gaps || [],
          theoreticalFramework: result.theoretical_framework || '',
          references: selectedPapers,
        };
        setLiteratureReview(lr);
      }
    } catch (e: unknown) {
      setError(`综述生成失败: ${e instanceof Error ? e.message : '未知错误'}`);
    } finally { setGeneratingReview(false); }
  };

  const goStep4 = () => setStep(4);

  // ═══ Step 4: 研究框架 ═══
  const handleGenerateFramework = async () => {
    setGeneratingFramework(true); setError('');
    try {
      const result = await qwenService.generateResearchFramework({
        topic: title,
        reviewSummary: review?.summary || '',
        researchGaps: review?.research_gaps || [],
        keywords,
      });
      if (result.mode === 'fallback') {
        setError('Qwen API 未配置');
      } else {
        setFramework(result);
      }
    } catch (e: unknown) {
      setError(`框架生成失败: ${e instanceof Error ? e.message : '未知错误'}`);
    } finally { setGeneratingFramework(false); }
  };

  const goStep5 = () => setStep(5);

  // ═══ Step 5: 实验设计 ═══
  const handleGenerateExperiment = async () => {
    setGeneratingExpDesign(true); setError('');
    try {
      const result = await qwenService.generateExperimentDesign({
        topic: framework?.research_title || title,
        researchIdea: {
          title: framework?.research_title || title,
          methodology: framework?.methodology_overview || '',
        },
        datasetInfo: '待确定的语料库或数据集',
      });
      if (result.mode === 'fallback') {
        setError('Qwen API 未配置');
      } else {
        setExpDesign(result);
      }
    } catch (e: unknown) {
      setError(`实验设计生成失败: ${e instanceof Error ? e.message : '未知错误'}`);
    } finally { setGeneratingExpDesign(false); }
  };

  const handleFinish = () => {
    if (expDesign) {
      const design: ExperimentDesign = {
        type: (expDesign.experiment_type === 'quantitative' ? 'quantitative' :
               expDesign.experiment_type === 'mixed' ? 'mixed' : 'qualitative'),
        method: expDesign.title || '',
        variables: (expDesign.variables || []).map(v => ({
          name: v.name || '', type: (v.type === 'independent' ? 'independent' : v.type === 'dependent' ? 'dependent' : 'control') as 'independent' | 'dependent' | 'control',
          description: v.description || '', measurement: v.measurement || '',
        })),
        procedure: (expDesign.procedure || []).map(p => ({
          order: p.order || 1, title: p.title || '', description: p.description || '',
          duration: p.duration || '', expectedOutput: p.expected_output || '',
        })),
        tools: expDesign.tools || [],
      };
      addExperiment({
        id: `exp-${Date.now()}`,
        title: expDesign.title || framework?.research_title || title,
        objective: description,
        hypothesis: expDesign.hypothesis || '',
        design,
        status: 'designed',
        createdAt: new Date(),
      });
    }
    updateProjectStatus('experiment_design');
    navigate('/experiment');
  };

  const selectedCount = selectedRefs.size;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── 步骤指示器 ── */}
      <div className="flex items-center justify-between mb-8 p-4 bg-white rounded-xl shadow-sm border overflow-x-auto">
        {STEP_LABELS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1.5 flex-shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step > i + 1 ? 'bg-green-500 text-white' :
              step === i + 1 ? 'bg-primary-600 text-white ring-2 ring-primary-200' :
              'bg-gray-100 text-gray-400'
            }`}>
              {step > i + 1 ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs font-medium whitespace-nowrap ${
              step >= i + 1 ? 'text-gray-800' : 'text-gray-400'
            }`}>{s.label}</span>
            {i < 5 && <div className={`w-6 md:w-10 h-0.5 ${step > i + 1 ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />{error}
        </div>
      )}

      {/* ═══════════════════ Step 1: 选题分析 ═══════════════════ */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><FileText className="w-5 h-5" /></div>
              <div>
                <h2 className="text-lg font-semibold">研究选题分析</h2>
                <p className="text-sm text-gray-500">输入大致研究方向，通义千问大模型进行深度分析</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label-text">研究标题或方向 *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="如：基于语料库的现代文学研究 / 数字人文视角下的文化传播"
                  className="input-field" />
              </div>
              <div>
                <label className="label-text">研究背景（可选）</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="简述研究方向、关注的问题..."
                  rows={3} className="input-field resize-none" />
              </div>
              <div>
                <label className="label-text">初步关键词</label>
                <div className="flex gap-2">
                  <input type="text" value={keywordInput} onChange={e => setKeywordInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    placeholder="输入后按回车" className="input-field flex-1" />
                  <button onClick={addKeyword} className="btn-secondary">添加</button>
                </div>
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {keywords.map(kw => (
                      <span key={kw} className="badge-blue inline-flex items-center gap-1 text-xs">
                        {kw}<button onClick={() => setKeywords(keywords.filter(k => k !== kw))}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleAnalyzeTopic} disabled={analyzingTopic || !title.trim()}
                  className="btn-accent flex items-center gap-2">
                  {analyzingTopic ? <><Loader2 className="w-4 h-4 animate-spin" /> 通义千问分析中...</>
                    : <><Sparkles className="w-4 h-4" /> 大模型分析选题</>}
                </button>
                <button onClick={goStep2} disabled={!title.trim()} className="btn-primary flex items-center gap-2 ml-auto">
                  下一步：文献检索 <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {topicAnalysis && (
            <div className="card border-l-4 border-l-blue-500">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-blue-500" />大模型分析结果</h3>
              <div className="space-y-3 text-sm">
                <Field label="研究价值" value={topicAnalysis.research_value} />
                <Field label="可行性" value={topicAnalysis.feasibility} />
                <Field label="数字人文/语料库契合度" value={topicAnalysis.digital_humanities_fit} />
                {topicAnalysis.recommended_methods?.length > 0 && (
                  <div><span className="font-medium text-gray-700">推荐方法：</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {topicAnalysis.recommended_methods.map((m, i) => <span key={i} className="badge-blue text-xs">{m}</span>)}
                    </div>
                  </div>
                )}
                {topicAnalysis.potential_difficulties?.length > 0 && (
                  <div><span className="font-medium text-orange-700">潜在难点：</span>
                    <ul className="list-disc list-inside mt-1 text-gray-600">{topicAnalysis.potential_difficulties.map((d, i) => <li key={i} className="text-xs">{d}</li>)}</ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ Step 2: 文献检索 ═══════════════════ */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center"><Search className="w-5 h-5" /></div>
              <div>
                <h2 className="text-lg font-semibold">文献数据库检索</h2>
                <p className="text-sm text-gray-500">基于关键词自动检索 OpenAlex + Semantic Scholar，获取权威最新文献</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {keywords.map(kw => <span key={kw} className="badge-green text-xs">{kw}</span>)}
              {keywords.length === 0 && <span className="text-sm text-gray-400">使用研究标题作为检索词</span>}
            </div>
            <button onClick={handleSearchLiterature} disabled={searchingLit}
              className="btn-primary flex items-center gap-2">
              {searchingLit ? <><Loader2 className="w-4 h-4 animate-spin" /> 检索中...</>
                : <><Globe className="w-4 h-4" /> 检索文献数据库</>}
            </button>
          </div>

          {litSearched && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">检索结果：共 {litTotal} 篇 | 已选 {selectedCount} 篇</h3>
                <button onClick={selectAllRefs} className="btn-secondary text-xs">
                  {selectedRefs.size === litResults.length ? '取消全选' : '全选'}
                </button>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {litResults.length === 0 && !searchingLit && (
                  <p className="text-center py-8 text-gray-400">未检索到文献，请调整关键词后重试</p>
                )}
                {litResults.map(ref => {
                  const isSelected = selectedRefs.has(ref.id);
                  return (
                    <div key={ref.id}
                      onClick={() => toggleRef(ref.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex gap-3 ${
                        isSelected ? 'border-primary-400 bg-primary-50/30' : 'border-gray-100 hover:border-gray-200 bg-white'
                      }`}>
                      <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
                      }`}>
                        {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{ref.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{ref.authors?.join(', ') || '未知作者'} · {ref.year || 'N/A'} · {ref.journal || ref.source}</p>
                        <p className="text-xs text-gray-400 mt-0.5">引用: {ref.citations || 0}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> 上一步</button>
            <button onClick={goStep3} disabled={selectedCount === 0}
              className="btn-primary flex items-center gap-2">
              已选 {selectedCount} 篇 · 下一步：文献综述 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════ Step 3: 文献综述 ═══════════════════ */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><BookOpen className="w-5 h-5" /></div>
              <div>
                <h2 className="text-lg font-semibold">文献综述</h2>
                <p className="text-sm text-gray-500">基于已选 {selectedCount} 篇文献，通义千问大模型深度生成综述</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">已选文献：</p>
            <div className="flex flex-wrap gap-1 mb-4 max-h-24 overflow-y-auto">
              {litResults.filter(r => selectedRefs.has(r.id)).slice(0, 10).map(r => (
                <span key={r.id} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">{r.title?.slice(0, 40)}...</span>
              ))}
              {selectedCount > 10 && <span className="text-xs text-gray-400 self-center">+{selectedCount - 10} 篇</span>}
            </div>
            <button onClick={handleGenerateReview} disabled={generatingReview}
              className="btn-accent flex items-center gap-2">
              {generatingReview ? <><Loader2 className="w-4 h-4 animate-spin" /> Qwen 深度分析文献中...</>
                : <><Sparkles className="w-4 h-4" /> 通义千问生成文献综述</>}
            </button>
          </div>

          {review && (
            <div className="card border-l-4 border-l-purple-500">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-500" />综述结果</h3>
              <div className="space-y-4 text-sm">
                <div><span className="font-medium text-gray-700">研究现状：</span><p className="text-gray-600 mt-1 leading-relaxed">{review.summary?.slice(0, 600)}</p></div>
                {review.key_findings?.length > 0 && (
                  <div><span className="font-medium text-gray-700">已有研究发现：</span>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">{review.key_findings.map((f, i) => <li key={i} className="text-xs text-gray-600">{f}</li>)}</ul>
                  </div>
                )}
                {review.research_gaps?.length > 0 && (
                  <div><span className="font-medium text-orange-700">研究缺口：</span>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">{review.research_gaps.map((g, i) => <li key={i} className="text-xs text-orange-600">{g}</li>)}</ul>
                  </div>
                )}
                {review.theoretical_framework && <Field label="理论框架" value={review.theoretical_framework?.slice(0, 400)} />}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="btn-secondary flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> 上一步</button>
            <button onClick={goStep4} disabled={!review}
              className="btn-primary flex items-center gap-2">
              下一步：研究框架 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════ Step 4: 研究框架 ═══════════════════ */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center"><Target className="w-5 h-5" /></div>
              <div>
                <h2 className="text-lg font-semibold">研究框架设计</h2>
                <p className="text-sm text-gray-500">基于文献综述中的研究缺口，通义千问大模型设计研究框架</p>
              </div>
            </div>
            {review?.research_gaps && (
              <div className="mb-4 p-3 bg-orange-50 rounded-lg">
                <p className="text-xs font-medium text-orange-700 mb-1">待解决的研究缺口：</p>
                {review.research_gaps.map((g, i) => <p key={i} className="text-xs text-orange-600">{i + 1}. {g}</p>)}
              </div>
            )}
            <button onClick={handleGenerateFramework} disabled={generatingFramework}
              className="btn-accent flex items-center gap-2">
              {generatingFramework ? <><Loader2 className="w-4 h-4 animate-spin" /> Qwen 设计框架中...</>
                : <><Sparkles className="w-4 h-4" /> 通义千问设计研究框架</>}
            </button>
          </div>

          {framework && (
            <div className="card border-l-4 border-l-orange-500">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-orange-500" />研究框架</h3>
              <div className="space-y-3 text-sm">
                <div><span className="font-medium text-gray-700">精炼标题：</span><span className="text-gray-900">{framework.research_title}</span></div>
                {framework.research_questions?.length > 0 && (
                  <div><span className="font-medium text-gray-700">研究问题：</span>
                    <ul className="list-decimal list-inside mt-1 space-y-1">{framework.research_questions.map((q, i) => <li key={i} className="text-gray-800 text-xs">{q}</li>)}</ul>
                  </div>
                )}
                <Field label="理论模型/概念框架" value={framework.theoretical_model} />
                <Field label="研究方法论" value={framework.methodology_overview} />
                {framework.innovation_points?.length > 0 && (
                  <div><span className="font-medium text-green-700">创新点：</span>
                    <ul className="list-disc list-inside mt-1">{framework.innovation_points.map((ip, i) => <li key={i} className="text-xs text-green-600">{ip}</li>)}</ul>
                  </div>
                )}
                <Field label="预期学术贡献" value={framework.expected_academic_contribution} />
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep(3)} className="btn-secondary flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> 上一步</button>
            <button onClick={goStep5} disabled={!framework}
              className="btn-primary flex items-center gap-2">
              下一步：实验设计 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════ Step 5: 实验设计 ═══════════════════ */}
      {step === 5 && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"><FlaskConical className="w-5 h-5" /></div>
              <div>
                <h2 className="text-lg font-semibold">实验设计</h2>
                <p className="text-sm text-gray-500">基于研究框架，通义千问大模型生成完整实验方案</p>
              </div>
            </div>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
              <span className="font-medium">研究问题：</span>
              {framework?.research_questions?.map((q, i) => <span key={i} className="ml-2">{i + 1}. {q} </span>)}
            </div>
            <button onClick={handleGenerateExperiment} disabled={generatingExpDesign}
              className="btn-accent flex items-center gap-2">
              {generatingExpDesign ? <><Loader2 className="w-4 h-4 animate-spin" /> Qwen 设计实验中...</>
                : <><Sparkles className="w-4 h-4" /> 通义千问生成实验方案</>}
            </button>
          </div>

          {expDesign && (
            <div className="card border-l-4 border-l-red-500">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-red-500" />实验方案</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <span className="font-medium">研究假设：</span>
                  <p className="text-gray-700 mt-1 p-2 bg-gray-50 rounded">{expDesign.hypothesis}</p>
                </div>
                {expDesign.variables?.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">变量定义：</span>
                    <div className="grid gap-2 mt-1">
                      {expDesign.variables.map((v, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                          <span className={`badge text-xs flex-shrink-0 ${
                            v.type === 'independent' ? 'badge-blue' : v.type === 'dependent' ? 'badge-green' : 'badge-yellow'
                          }`}>{v.type === 'independent' ? '自变量' : v.type === 'dependent' ? '因变量' : '控制变量'}</span>
                          <div><span className="font-medium">{v.name}</span><p className="text-xs text-gray-500">{v.description} · 测量：{v.measurement}</p></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {expDesign.procedure?.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">实验步骤：</span>
                    <div className="space-y-2 mt-1">
                      {expDesign.procedure.map((p, i) => (
                        <div key={i} className="flex gap-2 p-2 bg-gray-50 rounded">
                          <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">{p.order}</div>
                          <div><span className="font-medium text-xs">{p.title}</span> <span className="text-xs text-gray-400">({p.duration})</span>
                            <p className="text-xs text-gray-600">{p.description}</p>
                            <p className="text-xs text-gray-400">→ {p.expected_output}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {expDesign.tools?.length > 0 && (
                  <div><span className="font-medium text-gray-700">使用工具：</span>
                    <div className="flex flex-wrap gap-1 mt-1">{expDesign.tools.map((t, i) => <span key={i} className="badge-blue text-xs">{t}</span>)}</div>
                  </div>
                )}
                {expDesign.statistical_methods?.length > 0 && (
                  <div><span className="font-medium text-gray-700">统计方法：</span>
                    <div className="flex flex-wrap gap-1 mt-1">{expDesign.statistical_methods.map((m, i) => <span key={i} className="badge-purple text-xs">{m}</span>)}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep(4)} className="btn-secondary flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> 上一步</button>
            <button onClick={handleFinish} disabled={!expDesign}
              className="btn-primary flex items-center gap-2">
              完成 · 进入实验执行 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── 小辅助组件 ──
const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div><span className="font-medium text-gray-700">{label}：</span><p className="text-gray-600 mt-0.5 text-xs leading-relaxed">{value}</p></div>
);
