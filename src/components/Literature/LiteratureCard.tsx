import React from 'react';
import type { Reference } from '@/types';
import { BookOpen, Quote, ExternalLink, Calendar, User } from 'lucide-react';

interface LiteratureCardProps {
  reference: Reference;
  onAdd?: (ref: Reference) => void;
  onView?: (ref: Reference) => void;
  isAdded?: boolean;
}

export const LiteratureCard: React.FC<LiteratureCardProps> = ({
  reference, onAdd, onView, isAdded,
}) => {
  const sourceLabels: Record<string, { label: string; color: string }> = {
    cnki: { label: 'CNKI', color: 'bg-red-100 text-red-700' },
    web_of_science: { label: 'WoS', color: 'bg-blue-100 text-blue-700' },
    scopus: { label: 'Scopus', color: 'bg-orange-100 text-orange-700' },
    google_scholar: { label: 'Google Scholar', color: 'bg-green-100 text-green-700' },
    openalex: { label: 'OpenAlex', color: 'bg-teal-100 text-teal-700' },
    semantic_scholar: { label: 'Semantic Scholar', color: 'bg-purple-100 text-purple-700' },
    manual: { label: '手动录入', color: 'bg-gray-100 text-gray-700' },
  };

  const source = sourceLabels[reference.source] || sourceLabels.manual;

  return (
    <div className="card p-4 hover:border-primary-200 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`badge text-xs ${source.color}`}>{source.label}</span>
            <span className="text-xs text-gray-400">{reference.year}</span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Quote className="w-3 h-3" /> {reference.citations}
            </span>
          </div>
          <h3 className="font-medium text-gray-900 text-sm leading-snug mb-1">
            {reference.title}
          </h3>
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
            <User className="w-3 h-3" />
            <span>{reference.authors.join(', ')}</span>
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {reference.journal}
            {reference.doi && <span className="ml-2 text-gray-400">DOI: {reference.doi}</span>}
          </p>
          <p className="text-xs text-gray-600 mt-2 line-clamp-2">{reference.abstract}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {reference.keywords.map(kw => (
              <span key={kw} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {kw}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          {onAdd && (
            <button
              onClick={() => onAdd(reference)}
              disabled={isAdded}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                isAdded
                  ? 'bg-green-50 text-green-600 border border-green-200'
                  : 'bg-primary-50 text-primary-600 hover:bg-primary-100 border border-primary-200'
              }`}
            >
              {isAdded ? '已添加' : '添加参考'}
            </button>
          )}
          {onView && (
            <button
              onClick={() => onView(reference)}
              className="px-3 py-1.5 text-xs rounded-lg font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" /> 详情
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
