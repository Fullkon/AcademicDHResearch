import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lightbulb, BookOpen, Target, Brain, Loader2, ArrowRight,
  Plus, X, FileText, CheckCircle, AlertTriangle,
} from 'lucide-react';
import { useResearchStore } from '@/stores/useResearchStore';
import { mockLiteratureReview } from '@/utils/mockData';
import type { ResearchIdea } from '@/types';

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
  const [step, setStep] = useState(1); // 1: 基本信息 2: 文献综述 3: 研究思路

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

  const handleGenerateLiteratureReview = () => {
    setGeneratingIdeas(true);
    setTimeout(() => {
      setLiteratureReview(mockLiteratureReview);
      setGeneratingIdeas(false);
    }, 1500);
  };

  const handleGenerateResearchIdeas = () => {
    setGeneratingDesign(true);
    setTimeout(() => {
      const ideas: ResearchIdea[] = [
        {
          id: 'idea-1',
          title: '基于语料库的主题建模与演变分析',
          description: '利用LDA等主题建模方法，从大规模语料中提取主题分布，分析特定领域或时期的主题演变趋势。',
          methodology: '1) 语料收集与预处理\n2) 词向量训练\n3) LDA主题建模\n4) 时序主题分布分析\n5) 统计检验',
          expectedOutcomes: '对比不同时期的主题分布，发现主题演变规律，为学术研究提供量化证据。',
          feasibility: 'high',
          relatedReferences: ['ref-1', 'ref-2'],
        },
        {
          id: 'idea-2',
          title: '基于搭配分析的语义变迁研究',
          description: '通过搭配分析和互信息统计，追踪关键词在不同时期的搭配模式变化，揭示语义变迁。',
          methodology: '1) 分时期语料划分\n2) 搭配词提取\n3) MI/T-score计算\n4) 语义变迁可视化\n5) 定性解读',
          expectedOutcomes: '识别关键词的语义范畴变化，构建语义变迁网络图谱。',
          feasibility: 'high',
          relatedReferences: ['ref-1', 'ref-5'],
        },
        {
          id: 'idea-3',
          title: '基于情感分析的态度倾向研究',
          description: '对特定领域的文本进行情感和态度分析，揭示不同主体或时期的观点倾向和态度变化。',
          methodology: '1) 情感词典构建/适配\n2) 文本情感标注\n3) 基于规则/ML的情感分类\n4) 态度倾向分析\n5) 因素关联分析',
          expectedOutcomes: '量化文本中的情感倾向和态度变化，为舆情研究和历史分析提供数据支撑。',
          feasibility: 'medium',
          relatedReferences: ['ref-4', 'ref-3'],
        },
      ];
      setResearchIdeas(ideas);
      setGeneratingDesign(false);
    }, 2000);
  };

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

      {/* Step 1: 研究选题 */}
      {step === 1 && (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">研究选题</h2>
              <p className="text-sm text-gray-500">输入您的研究主题和基本信息</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label-text">研究标题 *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="例如：基于语料库的中国现当代文学主题演变研究"
                className="input-field"
              />
            </div>

            <div>
              <label className="label-text">研究描述</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="请描述您的研究问题、研究目标和预期贡献..."
                rows={4}
                className="input-field resize-none"
              />
            </div>

            <div>
              <label className="label-text">关键词</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  placeholder="输入关键词后按回车添加"
                  className="input-field flex-1"
                />
                <button onClick={addKeyword} className="btn-secondary">添加</button>
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {keywords.map(kw => (
                    <span key={kw} className="badge-blue inline-flex items-center gap-1">
                      {kw}
                      <button onClick={() => removeKeyword(kw)} className="hover:text-blue-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="label-text">主要参考文献</label>
              <textarea
                value={mainRefs}
                onChange={e => setMainRefs(e.target.value)}
                placeholder="每行一条参考文献，格式：作者 (年份). 标题. 期刊."
                rows={4}
                className="input-field resize-none"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleCreateProject}
                disabled={!title.trim()}
                className="btn-primary flex items-center gap-2"
              >
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
                <p className="text-sm text-gray-500">输入您了解的已有研究综述，或由AI辅助生成</p>
              </div>
            </div>

            <textarea
              value={existingReview}
              onChange={e => setExistingReview(e.target.value)}
              placeholder="请输入您知道的已有研究综述，包括主要研究方向、重要发现、研究方法等..."
              rows={6}
              className="input-field resize-none"
            />

            <button
              onClick={handleGenerateLiteratureReview}
              disabled={isGeneratingIdeas}
              className="mt-4 btn-secondary flex items-center gap-2"
            >
              {isGeneratingIdeas ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 正在检索文献数据库...</>
              ) : (
                <><Brain className="w-4 h-4" /> AI辅助生成文献综述</>
              )}
            </button>
          </div>

          {/* 显示生成的文献综述 */}
          {useResearchStore.getState().literatureReview && (
            <div className="card border-l-4 border-l-primary-500">
              <h3 className="font-semibold text-gray-800 mb-3">AI生成的文献综述</h3>
              <div className="prose prose-sm max-w-none text-gray-600">
                <p className="mb-3">{useResearchStore.getState().literatureReview?.summary}</p>

                <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-2">主要发现</h4>
                <ul className="list-disc list-inside space-y-1">
                  {useResearchStore.getState().literatureReview?.keyFindings.map((f, i) => (
                    <li key={i} className="text-sm">{f}</li>
                  ))}
                </ul>

                <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-2">研究缺口</h4>
                <ul className="list-disc list-inside space-y-1">
                  {useResearchStore.getState().literatureReview?.researchGaps.map((g, i) => (
                    <li key={i} className="text-sm text-orange-600">{g}</li>
                  ))}
                </ul>

                <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-2">理论框架</h4>
                <p className="text-sm">{useResearchStore.getState().literatureReview?.theoreticalFramework}</p>
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
                <p className="text-sm text-gray-500">AI辅助生成研究思路，或自行输入</p>
              </div>
            </div>

            <button
              onClick={handleGenerateResearchIdeas}
              disabled={isGeneratingDesign}
              className="btn-secondary flex items-center gap-2 mb-6"
            >
              {isGeneratingDesign ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 正在生成研究思路...</>
              ) : (
                <><Brain className="w-4 h-4" /> AI辅助生成研究思路</>
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
            <button
              onClick={() => {
                updateProjectStatus('literature_review');
                navigate('/experiment');
              }}
              className="btn-primary flex items-center gap-2"
            >
              进入实验设计 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
