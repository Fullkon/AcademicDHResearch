import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Search, Database, FlaskConical, BarChart3,
  TrendingUp, Map, ArrowRight, Plus, Clock, CheckCircle,
  AlertCircle, ChevronRight,
} from 'lucide-react';
import { useResearchStore } from '@/stores/useResearchStore';
import { useExperimentStore } from '@/stores/useExperimentStore';

const quickActions = [
  { icon: BookOpen, label: '文献检索', desc: '检索CNKI、WoS等数据库', to: '/literature', color: 'bg-blue-50 text-blue-600' },
  { icon: Search, label: '语料库检索', desc: '索引行、搭配、语义分析', to: '/corpus', color: 'bg-purple-50 text-purple-600' },
  { icon: Database, label: '数据集管理', desc: '查找或构建数据集', to: '/dataset', color: 'bg-green-50 text-green-600' },
  { icon: FlaskConical, label: '实验设计', desc: '设计实验全流程', to: '/experiment', color: 'bg-orange-50 text-orange-600' },
  { icon: BarChart3, label: '结果分析', desc: '可视化和研究发现', to: '/results', color: 'bg-red-50 text-red-600' },
  { icon: TrendingUp, label: '统计年鉴', desc: '查询统计数据', to: '/statistics', color: 'bg-teal-50 text-teal-600' },
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentProject = useResearchStore(s => s.currentProject);
  const projects = useResearchStore(s => s.projects);
  const experiments = useExperimentStore(s => s.experiments);

  const statusIcons: Record<string, React.ReactNode> = {
    completed: <CheckCircle className="w-4 h-4 text-green-500" />,
    executing: <Clock className="w-4 h-4 text-blue-500 animate-spin" />,
  };

  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="bg-gradient-to-r from-academic-navy to-primary-800 rounded-2xl p-8 text-white">
        <h1 className="text-2xl font-bold mb-2">
          语料库与数字人文 · 学术研究智能体
        </h1>
        <p className="text-white/80 max-w-2xl">
          集成语料库检索、文献数据库查询、统计分析、实验设计与执行的全流程学术研究辅助平台。
          支持索引行分析、搭配统计、主题语义建模、情感态度分析等多种语料库研究方法。
        </p>
        {!currentProject && (
          <button
            onClick={() => navigate('/research-topic')}
            className="mt-4 btn-accent inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            创建新研究项目
          </button>
        )}
      </div>

      {/* 快捷操作 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">快捷操作</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.to}
              onClick={() => navigate(action.to)}
              className="card p-4 text-left hover:border-primary-200 hover:shadow-md group transition-all"
            >
              <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-5 h-5" />
              </div>
              <h3 className="font-medium text-sm text-gray-800">{action.label}</h3>
              <p className="text-xs text-gray-500 mt-1">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 当前项目和研究进展 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 当前项目 */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">当前项目</h2>
            <button
              onClick={() => navigate('/research-topic')}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {currentProject ? (
            <div className="space-y-3">
              <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{currentProject.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{currentProject.description}</p>
                  </div>
                  <span className="badge-purple text-xs">{currentProject.status}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  {currentProject.keywords.map(kw => (
                    <span key={kw} className="badge-blue">{kw}</span>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-primary-100 flex justify-between text-xs text-gray-500">
                  <span>参考文献: {currentProject.references.length}篇</span>
                  <span>实验: {currentProject.experiments.length}个</span>
                  <span>创建于: {currentProject.createdAt.toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无研究项目</p>
              <button
                onClick={() => navigate('/research-topic')}
                className="mt-3 btn-primary text-sm inline-flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> 创建项目
              </button>
            </div>
          )}
        </div>

        {/* 实验进展 */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">实验进展</h2>
            <button
              onClick={() => navigate('/experiment')}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              实验设计 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {experiments.length > 0 ? (
            <div className="space-y-3">
              {experiments.slice(0, 3).map((exp) => (
                <div key={exp.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${
                    exp.status === 'completed' ? 'bg-green-500' :
                    exp.status === 'running' ? 'bg-blue-500 animate-pulse' :
                    'bg-gray-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{exp.title}</p>
                    <p className="text-xs text-gray-500">{exp.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无实验记录</p>
              <p className="text-xs mt-1">完成研究选题后可开始实验设计</p>
            </div>
          )}
        </div>
      </div>

      {/* 研究统计数据 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '研究项目', value: projects.length, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
          { label: '参考文献', value: currentProject?.references.length || 0, icon: Search, color: 'text-purple-600 bg-purple-50' },
          { label: '实验次数', value: experiments.length, icon: FlaskConical, color: 'text-orange-600 bg-orange-50' },
          { label: '研究发现', value: experiments.filter(e => e.results).length, icon: BarChart3, color: 'text-green-600 bg-green-50' },
        ].map((stat) => (
          <div key={stat.label} className="card flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
