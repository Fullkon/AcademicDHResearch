import React from 'react';
import { Bell, User, Settings } from 'lucide-react';
import { useResearchStore } from '@/stores/useResearchStore';

export const Header: React.FC = () => {
  const currentProject = useResearchStore(s => s.currentProject);

  const statusLabels: Record<string, string> = {
    planning: '规划中',
    literature_review: '文献综述',
    experiment_design: '实验设计',
    executing: '执行中',
    completed: '已完成',
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {currentProject?.title || '学术研究智能体'}
          </h1>
          {currentProject && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`inline-block w-2 h-2 rounded-full ${
                currentProject.status === 'completed' ? 'bg-green-500' :
                currentProject.status === 'executing' ? 'bg-blue-500 animate-pulse' :
                'bg-yellow-500'
              }`} />
              <span className="text-xs text-gray-500">
                {statusLabels[currentProject.status] || currentProject.status}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        <div className="ml-2 flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="w-4 h-4 text-primary-600" />
          </div>
          <span className="text-sm text-gray-700 font-medium hidden sm:block">研究者</span>
        </div>
      </div>
    </header>
  );
};
