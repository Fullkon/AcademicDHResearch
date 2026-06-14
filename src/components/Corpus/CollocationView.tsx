import React from 'react';
import { BarChart3 } from 'lucide-react';
import type { CollocationResult } from '@/types';

interface CollocationViewProps {
  results: CollocationResult[];
  nodeWord: string;
  corpusInfo: { name: string; tokens: number };
}

export const CollocationView: React.FC<CollocationViewProps> = ({
  results, nodeWord, corpusInfo,
}) => {
  const maxMI = Math.max(...results.map(r => r.mi));
  const maxFreq = Math.max(...results.map(r => r.frequency));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-500">
          节点词：<span className="font-semibold text-primary-600">"{nodeWord}"</span>
          <span className="mx-2">|</span>
          跨距：5L-5R
          <span className="mx-2">|</span>
          语料库：{corpusInfo.name}
        </div>
        <span className="text-xs text-gray-400">共 {results.length} 个显著搭配词</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-3 py-2 text-gray-500 font-medium">搭配词</th>
              <th className="text-right px-3 py-2 text-gray-500 font-medium">频次</th>
              <th className="text-right px-3 py-2 text-gray-500 font-medium">MI值</th>
              <th className="text-right px-3 py-2 text-gray-500 font-medium">T值</th>
              <th className="text-right px-3 py-2 text-gray-500 font-medium">Log Dice</th>
              <th className="text-center px-3 py-2 text-gray-500 font-medium">位置</th>
              <th className="text-right px-3 py-2 text-gray-500 font-medium">距离</th>
              <th className="px-3 py-2 text-gray-500 font-medium">强度</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {results.sort((a, b) => b.mi - a.mi).map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2.5 font-medium text-gray-800">{row.word}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{row.frequency}</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs font-semibold text-primary-600">
                  {row.mi.toFixed(2)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-xs text-gray-600">
                  {row.tScore.toFixed(1)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-xs text-gray-600">
                  {row.logDice.toFixed(1)}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`badge ${row.position === 'left' ? 'badge-blue' : 'badge-purple'}`}>
                    {row.position === 'left' ? '左' : '右'}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right text-gray-600">L{row.distance}</td>
                <td className="px-3 py-2.5">
                  <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-400 rounded-full"
                      style={{ width: `${(row.mi / maxMI) * 100}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
