import React from 'react';
import type { ConcordanceResult } from '@/types';

interface ConcordanceViewProps {
  results: ConcordanceResult[];
  nodeWord: string;
  metadata: { corpus: string; size: number; queryTime: string };
}

export const ConcordanceView: React.FC<ConcordanceViewProps> = ({
  results, nodeWord, metadata,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-500">
          检索词：<span className="font-semibold text-primary-600">"{nodeWord}"</span>
          <span className="mx-2">|</span>
          语料库：{metadata.corpus}
          <span className="mx-2">|</span>
          命中：{results.length} 条
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-3 py-2 text-gray-500 font-medium w-12">#</th>
              <th className="text-left px-3 py-2 text-gray-500 font-medium">左语境</th>
              <th className="text-center px-3 py-2 text-primary-600 font-medium bg-primary-50/50">节点词</th>
              <th className="text-left px-3 py-2 text-gray-500 font-medium">右语境</th>
              <th className="text-left px-3 py-2 text-gray-500 font-medium w-24">来源</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {results.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2.5 text-gray-400 text-xs">{row.line}</td>
                <td className="px-3 py-2.5 text-gray-700 font-mono text-xs">
                  {row.leftContext}
                </td>
                <td className="px-3 py-2.5 text-center font-semibold text-primary-700 bg-primary-50/30 font-mono text-xs">
                  {row.node}
                </td>
                <td className="px-3 py-2.5 text-gray-700 font-mono text-xs">
                  {row.rightContext}
                </td>
                <td className="px-3 py-2.5 text-gray-500 text-xs">
                  {row.source}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
