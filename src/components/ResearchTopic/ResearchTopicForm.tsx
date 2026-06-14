import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lightbulb, BookOpen, Brain, Loader2, ArrowRight,
  Plus, X, FileText, CheckCircle, Sparkles, AlertTriangle,
} from 'lucide-react';
import { useResearchStore } from '@/stores/useResearchStore';
import { qwenService } from '@/services/QwenService';
import type { ResearchIdea, LiteratureReview } from '@/types';

export const ResearchTopicForm: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentProject, createProject, setLiteratureReview,
    isGeneratingIdeas, setGeneratingIdeas,
    isGeneratingDesign, setGeneratingDesign,
    updateProjectStatus,
  } = useResearchStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [mainRefs, setMainRefs] = useState('');
  const [existingReview, setExistingReview] = useState('');
  const [researchIdeas, setResearchIdeas] = useState<ResearchIdea[]>([]);
  const [step, setStep] = useState(1);
  const [qwenError, setQwenError] = useState('');

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter(k => k !== kw));
  };

  const handleCreateProject = () => {
    if (!title.trim()) return;
    createProject(title, description, keywords);
    updateProjectStatus('planning');
    setStep(2);
  };

  // ═══ Qwen 大模型：生成文献综述 ═══
  const handleGenerateLiteratureReview = async () => {
    if (!title.trim()) return;
    setGeneratingIdeas(true);
    setQwenError('');

    try {
      const result = await qwenService.generateLiteratureReview({
        topic: title,
        existingReview,
        references: [],
      });

      if (result.mode === 'fallback') {
        setQwenError(result.raw_text || 'Qwen API 未配置，请设置 DASHSCOPE_API_KEY 环境变量');
      } else {
        const review: LiteratureReview = {
          topic: title,
          summary: result.summary || '',
          keyFindings: result.key_findings || [],
          researchGaps: result.research_gaps || [],
          theoreticalFramework: result.theoretical_framework || '',
          references: [],
        };
        if (result.methodological_trends?.length) {
          review.theoreticalFramework += '\n\n方法趋势：' + result.methodological_trends.join('；');
        }
        setLiteratureReview(review);
      }
    } catch (e: unknown) {
      setQwenError(`Qwen 调用失败: ${e instanceof Error ? e.message : '未知错误'}`);
    } finally {
      setGeneratingIdeas(false);
    }
  };

  // ═══ Qwen 大模型：生成研究思路 ═══
  const handleGenerateResearchIdeas = async () => {
    if (!title.trim()) return;
    setGeneratingDesign(true);
    setQwenError('');

    try {
      const store = useResearchStore.getState();
      const result = await qwenService.generateResearchIdeas({
        topic: title,
        keywords,
        literatureReview: (store.literatureReview ?? {}) as Record<string, unknown>,
      });

      if (result.mode === 'fallback') {
        setQwenError('Qwen API 未配置，请设置 DASHSCOPE_API_KEY');
      } else {
        const ideas: ResearchIdea[] = (result.ideas || []).map((idea, index) => ({
          id: `qwen-idea-${index + 1}`,
          title: idea.title || `研究思路 ${index + 1}`,
          description: idea.description || '',
          methodology: idea.methodology || '',
          expectedOutcomes: idea.expected_outcomes || '',
          feasibility: (idea.feasibility === 'high' || idea.feasibility === 'medium'
            ? idea.feasibility : 'medium') as 'high' | 'medium' | 'low',
          relatedReferences: [],
        }));
        setResearchIdeas(ideas);
      }
    } catch (e: unknown) {
      setQwenError(`Qwen 调用失败: ${e instanceof Error ? e.message : '未知错误'}`);
    } finally {
      setGeneratingDesign(false);
    }
  };

  const review = useResearchStore.getState().literatureReview;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 步骤指示器 */}
      <div className="flex items-center gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {step > s ? <CheckCircle className="w-5 h-5" /> : s}
            </div>
            <span className={`text-sm ${step >= s ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
              {s === 1 ? '研究选题' : s === 2 ? '文献综述' : '研究思路'}
            </span>
            {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-primary-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Qwen 错误提示 */}
      {qwenError && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{qwenError}</span>
        </div>
      )}

      {/* Step 1: 研究选题 */}
      {step === 1 && (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">研究选题</h2>
              <p className="text-sm text-gray-500">输入您的研究主题，Qwen 大模型将辅助分析</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label-text">研究标题 *</label>
              <input
                type="text" value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="例如：基于语料库的中国现当代文学主题演变研究"
                className="input-field"
              />
            </div>
            <div>
              <label className="label-text">研究描述</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="请描述您的研究问题、研究目标和预期贡献..."
                rows={4} className="input-field resize-none"
              />
            </div>
            <div>
              <label className="label-text">关键词</label>
              <div className="flex gap-2">
                <input type="text" value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  placeholder="输入关键词后按回车添加" className="input-field flex-1"
                />
                <button onClick={addKeyword} className="btn-secondary">添加</button>
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {keywords.map(kw => (
                    <span key={kw} className="badge-blue inline-flex items-center gap-1">
                      {kw}
                      <button onClick={() => removeKeyword(kw)}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="label-text">主要参考文献</label>
              <textarea value={mainRefs} onChange={e => setMainRefs(e.target.value)}
                placeholder="每行一条参考文献，格式：作者 (年份). 标题. 期刊."
                rows={4} className="input-field resize-none"
              />
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={handleCreateProject} disabled={!title.trim()}
                className="btn-primary flex items-center gap-2">
                下一步：文献综述 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: 文献综述 */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">已有研究综述</h2>
                <p className="text-sm text-gray-500">输入您了解的已有研究，由通义千问大模型深度分析生成综述</p>
              </div>
            </div>

            <textarea value={existingReview} onChange={e => setExistingReview(e.target.value)}
              placeholder="请输入您知道的已有研究综述..."
              rows={6} className="input-field resize-none"
            />

            <button onClick={handleGenerateLiteratureReview} disabled={isGeneratingIdeas}
              className="mt-4 btn-secondary flex items-center gap-2">
              {isGeneratingIdeas ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Qwen 正在深度分析文献...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> 通义千问大模型生成文献综述</>
              )}
            </button>
          </div>

          {review && (
            <div className="card border-l-4 border-l-primary-500">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                通义千问(大模型) 生成的文献综述
              </h3>
              <div className="prose prose-sm max-w-none text-gray-600">
                <p className="mb-3">{review.summary}</p>
                <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-2">主要发现</h4>
                <ul className="list-disc list-inside space-y-1">
                  {review.keyFindings.map((f, i) => <li key={i} className="text-sm">{f}</li>)}
                </ul>
                <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-2">研究缺口</h4>
                <ul className="list-disc list-inside space-y-1">
                  {review.researchGaps.map((g, i) => <li key={i} className="text-sm text-orange-600">{g}</li>)}
                </ul>
                <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-2">理论框架</h4>
                <p className="text-sm">{review.theoreticalFramework}</p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(1)} className="btn-secondary">上一步</button>
            <button onClick={() => setStep(3)} className="btn-primary flex items-center gap-2">
              下一步：研究思路 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: 研究思路 */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">研究思路</h2>
                <p className="text-sm text-gray-500">通义千问大模型基于文献综述深度设计研究思路</p>
              </div>
            </div>

            <button onClick={handleGenerateResearchIdeas} disabled={isGeneratingDesign}
              className="btn-secondary flex items-center gap-2 mb-6">
              {isGeneratingDesign ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Qwen 正在设计研究思路...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> 通义千问大模型设计研究思路</>
              )}
            </button>

            {researchIdeas.length > 0 && (
              <div className="space-y-4">
                {researchIdeas.map((idea) => (
                  <div key={idea.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{idea.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{idea.description}</p>
                      </div>
                      <span className={`badge ${
                        idea.feasibility === 'high' ? 'badge-green' :
                        idea.feasibility === 'medium' ? 'badge-yellow' : 'badge-red'
                      }`}>
                        可行性: {idea.feasibility === 'high' ? '高' : idea.feasibility === 'medium' ? '中' : '低'}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-500 mb-1">研究方法</p>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{idea.methodology}</p>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-500 mb-1">预期成果</p>
                      <p className="text-sm text-gray-700">{idea.expectedOutcomes}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(2)} className="btn-secondary">上一步</button>
            <button onClick={() => { updateProjectStatus('literature_review'); navigate('/experiment'); }}
              className="btn-primary flex items-center gap-2">
              进入实验设计 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
