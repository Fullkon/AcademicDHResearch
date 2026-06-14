import React from 'react';
import type { SemanticResult } from '@/types';

interface SemanticViewProps {
  results: SemanticResult[];
  method: string;
  parameters: Record<string, unknown>;
}

const TOPIC_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500',
  'bg-orange-500', 'bg-pink-500', 'bg-teal-500',
];

export const SemanticView: React.FC<SemanticViewProps> = ({
  results, method, parameters,
}) => {
  const maxWeight = Math.max(...results.map(r => r.weight));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-500">
          方法：<span className="font-semibold text-gray-700">{method}</span>
          <span className="mx-2">|</span>
          主题数：{String(parameters.numTopics)}
          <span className="mx-2">|</span>
          一致性指标：c_v
        </div>
      </div>

      {/* 主题气泡图 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {results.map((topic, i) => (
          <div key={i} className="card p-4 hover:border-primary-200">
            <div className="flex items-start gap-3">
              <div
                className={`w-12 h-12 rounded-xl ${TOPIC_COLORS[i % TOPIC_COLORS.length]} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}
                style={{ opacity: 0.3 + (topic.weight / maxWeight) * 0.7 }}
              >
                T{i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-900">{topic.topic}</h4>
                  <span className="badge-blue">{topic.documents} docs</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {topic.keywords.map(kw => (
                    <span key={kw} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {kw}
                    </span>
                  ))}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>权重</span>
                    <span>{(topic.weight * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${TOPIC_COLORS[i % TOPIC_COLORS.length]} rounded-full`}
                      style={{ width: `${(topic.weight / maxWeight) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>一致性</span>
                    <span>{topic.coherence.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400 rounded-full"
                      style={{ width: `${topic.coherence * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 主题-关键词矩阵 */}
      <div className="card">
        <h4 className="font-medium text-gray-800 mb-3">主题-关键词矩阵</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-3 py-2 text-gray-500 font-medium">主题</th>
                <th className="text-left px-3 py-2 text-gray-500 font-medium">核心关键词</th>
                <th className="text-right px-3 py-2 text-gray-500 font-medium">文档数</th>
                <th className="text-right px-3 py-2 text-gray-500 font-medium">一致性</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.map((topic, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-3 py-2.5">
                    <span className="font-medium text-gray-800">{topic.topic}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {topic.keywords.map(kw => (
                        <span key={kw} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-700">{topic.documents}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={`font-mono text-xs ${topic.coherence > 0.7 ? 'text-green-600' : topic.coherence > 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {topic.coherence.toFixed(3)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
