import React from 'react';
import { Smile, Frown, Meh, AlertTriangle } from 'lucide-react';
import type { SentimentResult } from '@/types';

interface SentimentViewProps {
  results: SentimentResult[];
  overallSentiment: { positive: number; negative: number; neutral: number; mixed: number };
  lexicon: string;
}

const SentimentIcon: React.FC<{ sentiment: string }> = ({ sentiment }) => {
  switch (sentiment) {
    case 'positive': return <Smile className="w-4 h-4 text-green-500" />;
    case 'negative': return <Frown className="w-4 h-4 text-red-500" />;
    case 'neutral': return <Meh className="w-4 h-4 text-gray-400" />;
    case 'mixed': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    default: return null;
  }
};

const SentimentColor: Record<string, string> = {
  positive: 'bg-green-100 text-green-800',
  negative: 'bg-red-100 text-red-800',
  neutral: 'bg-gray-100 text-gray-600',
  mixed: 'bg-yellow-100 text-yellow-800',
};

const SentimentLabel: Record<string, string> = {
  positive: '正面',
  negative: '负面',
  neutral: '中性',
  mixed: '混合',
};

export const SentimentView: React.FC<SentimentViewProps> = ({
  results, overallSentiment, lexicon,
}) => {
  const total = overallSentiment.positive + overallSentiment.negative + overallSentiment.neutral + overallSentiment.mixed;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-500">
          情感词典：<span className="font-semibold text-gray-700">{lexicon}</span>
          <span className="mx-2">|</span>
          分析文本数：{results.length}
        </div>
      </div>

      {/* 总体情感分布 */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { key: 'positive', label: '正面', count: overallSentiment.positive },
          { key: 'negative', label: '负面', count: overallSentiment.negative },
          { key: 'neutral', label: '中性', count: overallSentiment.neutral },
          { key: 'mixed', label: '混合', count: overallSentiment.mixed },
        ].map(item => (
          <div key={item.key} className="card p-4 text-center">
            <SentimentIcon sentiment={item.key} />
            <p className="text-2xl font-bold mt-1">{item.count}</p>
            <p className="text-xs text-gray-500">{item.label}</p>
            <div className="w-full h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  item.key === 'positive' ? 'bg-green-400' :
                  item.key === 'negative' ? 'bg-red-400' :
                  item.key === 'neutral' ? 'bg-gray-400' : 'bg-yellow-400'
                }`}
                style={{ width: `${(item.count / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 详细情感分析结果 */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-800">详细分析结果</h4>
        {results.map((item, i) => (
          <div key={i} className="card p-4 hover:border-primary-200">
            <div className="flex items-start gap-3">
              <div className={`px-2 py-1 rounded-lg ${SentimentColor[item.sentiment]}`}>
                <SentimentIcon sentiment={item.sentiment} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-800 mb-2">{item.text}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>情感分值：<span className={`font-semibold ${
                    item.score > 0 ? 'text-green-600' : item.score < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>{item.score.toFixed(2)}</span></span>
                  <span>置信度：{item.confidence.toFixed(2)}</span>
                </div>
                {item.aspects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {item.aspects.map((aspect, j) => (
                      <span key={j} className={`badge text-xs ${
                        aspect.sentiment === 'positive' ? 'badge-green' :
                        aspect.sentiment === 'negative' ? 'badge-red' :
                        'badge'
                      }`}>
                        {aspect.aspect} ({aspect.score.toFixed(1)})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
