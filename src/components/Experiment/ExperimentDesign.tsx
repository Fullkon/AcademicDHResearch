import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical, Brain, Loader2, Play, Plus, X, ArrowRight,
  Clock, CheckCircle, AlertCircle, ChevronRight, Layers,
} from 'lucide-react';
import { useResearchStore } from '@/stores/useResearchStore';
import { useExperimentStore } from '@/stores/useExperimentStore';
import { experimentService } from '@/services/ExperimentService';
import type { Experiment, ExperimentDesign as ExpDesign, ExperimentStep, Variable } from '@/types';

export const ExperimentDesign: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject, isGeneratingDesign, setGeneratingDesign } = useResearchStore();
  const { experiments, addExperiment, setCurrentExperiment, isExecuting, setExecuting, setExecutionProgress, setResults, setFindings, updateExperimentStatus } = useExperimentStore();

  const [showDesigner, setShowDesigner] = useState(false);
  const [design, setDesign] = useState<ExpDesign | null>(null);
  const [experimentTitle, setExperimentTitle] = useState('');

  const handleGenerateDesign = async () => {
    setGeneratingDesign(true);
    const expDesign = await experimentService.generateDesign(
      currentProject?.title || '语料库与数字人文研究',
      currentProject?.references.map(r => r.id) || []
    );
    setDesign(expDesign);
    setExperimentTitle(`${currentProject?.title || '研究'} - 实验`);
    setGeneratingDesign(false);
  };

  const handleCreateExperiment = () => {
    if (!design) return;
    const experiment: Experiment = {
      id: `exp-${Date.now()}`,
      title: experimentTitle || '新实验',
      objective: currentProject?.description || '',
      hypothesis: '待验证假设',
      design,
      status: 'designed',
      createdAt: new Date(),
    };
    addExperiment(experiment);
    setShowDesigner(false);
    setDesign(null);
  };

  const handleExecuteExperiment = async (expId: string) => {
    setExecuting(true);
    updateExperimentStatus(expId, 'running');

    // 模拟执行步骤
    const steps = ['初始化实验环境...', '加载数据集...', '数据预处理...', '特征提取...', '模型训练/分析...', '结果验证...', '生成报告...'];
    for (let i = 0; i < steps.length; i++) {
      setExecutionProgress(Math.round(((i + 1) / steps.length) * 100), steps[i]);
      await new Promise(r => setTimeout(r, 800));
    }

    const result = await experimentService.executeExperiment(expId);
    setResults(result);
    setFindings(result.findings);
    updateExperimentStatus(expId, 'completed');
    setExecuting(false);

    // Navigate to results
    navigate('/results');
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">实验设计</h2>
            <p className="text-sm text-gray-500">设计并执行学术实验全流程</p>
          </div>
        </div>
        <button
          onClick={() => setShowDesigner(true)}
          className="btn-accent flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> 新建实验
        </button>
      </div>

      {/* 实验设计器 */}
      {showDesigner && (
        <div className="card border-2 border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">实验设计器</h3>
            <button onClick={() => setShowDesigner(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {!design ? (
            <div className="text-center py-8">
              <Brain className="w-16 h-16 text-orange-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">基于您的研究主题，AI将自动生成实验设计方案</p>
              <button
                onClick={handleGenerateDesign}
                disabled={isGeneratingDesign}
                className="btn-primary flex items-center gap-2 mx-auto"
              >
                {isGeneratingDesign ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> 生成设计方案中...</>
                ) : (
                  <><Brain className="w-4 h-4" /> AI辅助生成实验设计</>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="label-text">实验标题</label>
                <input
                  type="text"
                  value={experimentTitle}
                  onChange={e => setExperimentTitle(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label-text">实验方法</label>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{design.method}</p>
              </div>

              <div>
                <label className="label-text">实验类型</label>
                <span className="badge-purple">{design.type === 'mixed' ? '混合方法' : design.type === 'quantitative' ? '定量研究' : '定性研究'}</span>
              </div>

              {/* 变量 */}
              <div>
                <label className="label-text">变量定义 ({design.variables.length})</label>
                <div className="space-y-2">
                  {design.variables.map((v, i) => (
                    <div key={i} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{v.name}</span>
                        <span className={`badge text-xs ${
                          v.type === 'independent' ? 'badge-blue' :
                          v.type === 'dependent' ? 'badge-green' : 'badge-yellow'
                        }`}>
                          {v.type === 'independent' ? '自变量' : v.type === 'dependent' ? '因变量' : '控制变量'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{v.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">测量：{v.measurement}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 实验步骤 */}
              <div>
                <label className="label-text">实验步骤</label>
                <div className="space-y-2">
                  {design.procedure.map((step, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {step.order}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{step.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{step.description}</p>
                        <div className="flex gap-3 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{step.duration}</span>
                          <span>→ {step.expectedOutput}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 工具 */}
              <div>
                <label className="label-text">使用工具</label>
                <div className="flex flex-wrap gap-1.5">
                  {design.tools.map(tool => (
                    <span key={tool} className="badge-blue text-xs">{tool}</span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setDesign(null)} className="btn-secondary">重新生成</button>
                <button onClick={handleCreateExperiment} className="btn-primary flex items-center gap-2">
                  确认并创建实验 <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 实验列表 */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">实验列表</h3>
        {experiments.length === 0 ? (
          <div className="text-center py-12 text-gray-400 card">
            <FlaskConical className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">暂无实验</p>
            <p className="text-sm mt-1">点击"新建实验"开始设计</p>
          </div>
        ) : (
          experiments.map(exp => (
            <div key={exp.id} className="card hover:border-orange-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    exp.status === 'completed' ? 'bg-green-50 text-green-600' :
                    exp.status === 'running' ? 'bg-blue-50 text-blue-600' :
                    exp.status === 'failed' ? 'bg-red-50 text-red-600' :
                    'bg-gray-50 text-gray-400'
                  }`}>
                    {exp.status === 'completed' ? <CheckCircle className="w-5 h-5" /> :
                     exp.status === 'running' ? <Loader2 className="w-5 h-5 animate-spin" /> :
                     exp.status === 'failed' ? <AlertCircle className="w-5 h-5" /> :
                     <FlaskConical className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{exp.title}</h4>
                    <p className="text-sm text-gray-500 mt-0.5">{exp.objective?.slice(0, 80)}...</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>{exp.design.method?.slice(0, 40)}</span>
                      <span>{exp.design.variables.length} 个变量</span>
                      <span>{exp.design.procedure.length} 个步骤</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <span className={`badge ${
                    exp.status === 'completed' ? 'badge-green' :
                    exp.status === 'running' ? 'badge-blue' :
                    exp.status === 'failed' ? 'badge-red' :
                    'badge-yellow'
                  }`}>
                    {exp.status === 'completed' ? '已完成' : exp.status === 'running' ? '执行中' :
                     exp.status === 'failed' ? '失败' : exp.status === 'preparing_data' ? '准备数据' : '已设计'}
                  </span>
                  {exp.status !== 'completed' && exp.status !== 'running' && (
                    <button
                      onClick={() => handleExecuteExperiment(exp.id)}
                      className="btn-primary text-xs flex items-center gap-1 py-1.5 px-3"
                    >
                      <Play className="w-3 h-3" /> 执行实验
                    </button>
                  )}
                  {exp.status === 'completed' && (
                    <button
                      onClick={() => navigate('/results')}
                      className="btn-secondary text-xs flex items-center gap-1 py-1.5 px-3"
                    >
                      查看结果 <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                  <span className="text-xs text-gray-400">
                    创建于 {exp.createdAt.toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 执行进度覆盖 */}
      {isExecuting && (
        <div className="card border-2 border-blue-200 bg-blue-50/50">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <h3 className="font-semibold text-gray-800">实验执行中...</h3>
          </div>
          <div className="w-full h-2.5 bg-blue-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${useExperimentStore.getState().executionProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{useExperimentStore.getState().executionStep}</span>
            <span className="text-blue-600 font-medium">{useExperimentStore.getState().executionProgress}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
