import React, { useState } from 'react';
import {
  BarChart3, TrendingUp, FileText, Lightbulb, Download,
  CheckCircle, AlertCircle, Info, ChevronDown, ExternalLink,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { useExperimentStore } from '@/stores/useExperimentStore';
import type { Finding, Metric, Visualization } from '@/types';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export const ResultsAnalysis: React.FC = () => {
  const { currentExperiment, results, findings } = useExperimentStore();
  const [activeView, setActiveView] = useState<'metrics' | 'visualizations' | 'tests' | 'findings'>('metrics');

  if (!results && !findings.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <BarChart3 className="w-20 h-20 mx-auto mb-4 opacity-20" />
        <p className="text-lg font-medium">暂无实验结果</p>
        <p className="text-sm mt-1">请先执行实验以查看结果分析</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">结果分析</h2>
            <p className="text-sm text-gray-500">实验结果与研究发现</p>
          </div>
        </div>
        <button className="btn-secondary flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" /> 导出报告
        </button>
      </div>

      {/* 标签切换 */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        {[
          { id: 'metrics', label: '核心指标', icon: TrendingUp },
          { id: 'visualizations', label: '可视化', icon: BarChart3 },
          { id: 'tests', label: '统计检验', icon: FileText },
          { id: 'findings', label: '主要发现', icon: Lightbulb },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as typeof activeView)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeView === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      {activeView === 'metrics' && results && (
        <MetricsView metrics={results.metrics} />
      )}
      {activeView === 'visualizations' && results && (
        <VisualizationsView visualizations={results.visualizations} />
      )}
      {activeView === 'tests' && results && (
        <StatisticalTestsView tests={results.statisticalTests} />
      )}
      {activeView === 'findings' && (
        <FindingsView findings={findings} />
      )}
    </div>
  );
};

// ---------- 指标视图 ----------
const MetricsView: React.FC<{ metrics: Metric[] }> = ({ metrics }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <div key={metric.name} className="card text-center">
          <p className="text-3xl font-bold text-gray-900">
            {metric.value}
            <span className="text-sm text-gray-500 ml-1">{metric.unit}</span>
          </p>
          <p className="text-sm text-gray-600 mt-1">{metric.name}</p>
          {metric.baseline !== undefined && metric.improvement !== undefined && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                基线：{metric.baseline}
                <span className={`ml-2 font-medium ${metric.improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.improvement > 0 ? '+' : ''}{metric.improvement.toFixed(1)}%
                </span>
              </p>
            </div>
          )}
        </div>
      ))}
    </div>

    <div className="card">
      <h3 className="font-medium text-gray-800 mb-4">指标对比</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={metrics.map(m => ({ name: m.name, value: m.value, baseline: m.baseline }))}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" name="实验值" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="baseline" name="基线值" fill="#d1d5db" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// ---------- 可视化视图 ----------
const VisualizationsView: React.FC<{ visualizations: Visualization[] }> = ({ visualizations }) => (
  <div className="space-y-6">
    {visualizations.map((viz, i) => (
      <div key={i} className="card">
        <h3 className="font-medium text-gray-800 mb-4">{viz.title}</h3>
        <ResponsiveContainer width="100%" height={350}>
          {viz.type === 'bar' ? (
            <BarChart data={viz.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={viz.xKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {viz.yKeys.map((key: string, j: number) => (
                <Bar key={key} dataKey={key} fill={COLORS[j % COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          ) : viz.type === 'line' ? (
            <LineChart data={viz.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={viz.xKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {viz.yKeys.map((key: string, j: number) => (
                <Line key={key} type="monotone" dataKey={key} stroke={COLORS[j % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} />
              ))}
            </LineChart>
          ) : viz.type === 'pie' ? (
            <PieChart>
              <Pie data={viz.data} dataKey={viz.yKeys[0]} nameKey={viz.xKey} cx="50%" cy="50%" outerRadius={120} label>
                {viz.data.map((_: Record<string, unknown>, j: number) => (
                  <Cell key={j} fill={COLORS[j % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          ) : (
            <p className="text-center text-gray-400 py-10">图表类型：{viz.type}</p>
          )}
        </ResponsiveContainer>
      </div>
    ))}
  </div>
);

// ---------- 统计检验视图 ----------
const StatisticalTestsView: React.FC<{ tests: import('@/types').StatisticalTest[] }> = ({ tests }) => (
  <div className="space-y-4">
    {tests.map((test, i) => (
      <div key={i} className="card hover:border-primary-200">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            test.significance ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'
          }`}>
            {test.significance ? <CheckCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-gray-900">{test.name}</h4>
              <span className="badge-blue text-xs">{test.testType}</span>
              {test.significance && <span className="badge-green text-xs">显著</span>}
            </div>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div>
                <p className="text-xs text-gray-400">p值</p>
                <p className={`text-sm font-mono font-semibold ${test.pValue < 0.05 ? 'text-green-600' : 'text-gray-600'}`}>
                  {test.pValue.toFixed(4)}
                </p>
              </div>
              {test.effectSize !== undefined && (
                <div>
                  <p className="text-xs text-gray-400">效应量</p>
                  <p className="text-sm font-mono font-semibold text-gray-700">{test.effectSize.toFixed(2)}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400">显著性</p>
                <p className={`text-sm font-medium ${test.significance ? 'text-green-600' : 'text-gray-500'}`}>
                  {test.significance ? (test.pValue < 0.001 ? 'p < 0.001' : `p = ${test.pValue.toFixed(3)}`) : '不显著'}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg">{test.interpretation}</p>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ---------- 研究发现视图 ----------
const FindingsView: React.FC<{ findings: Finding[] }> = ({ findings }) => (
  <div className="space-y-4">
    {findings.length === 0 ? (
      <div className="text-center py-12 text-gray-400 card">
        <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>暂无研究发现</p>
      </div>
    ) : (
      findings.map(finding => (
        <div key={finding.id} className="card border-l-4 border-l-primary-500 hover:shadow-md">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold text-gray-900">{finding.title}</h3>
            </div>
            <span className={`badge ${
              finding.confidence === 'high' ? 'badge-green' :
              finding.confidence === 'medium' ? 'badge-yellow' : 'badge-red'
            }`}>
              置信度：{finding.confidence === 'high' ? '高' : finding.confidence === 'medium' ? '中' : '低'}
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-3">{finding.description}</p>
          {finding.supportingEvidence.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 mb-1.5">支撑证据</p>
              <div className="flex flex-wrap gap-1.5">
                {finding.supportingEvidence.map((ev, i) => (
                  <span key={i} className="badge-blue text-xs inline-flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {ev}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="bg-primary-50 rounded-lg p-3">
            <p className="text-xs font-medium text-primary-700 mb-1">研究启示</p>
            <p className="text-sm text-primary-900">{finding.implications}</p>
          </div>
        </div>
      ))
    )}
  </div>
);
