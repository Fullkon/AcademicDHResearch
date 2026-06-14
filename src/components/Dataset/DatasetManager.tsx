import React, { useState, useEffect } from 'react';
import {
  Database, Search, Plus, Download, Eye, Loader2,
  FileText, Files, BarChart3, CheckCircle, X,
} from 'lucide-react';
import { datasetService } from '@/services/DatasetService';
import type { Dataset } from '@/types';

export const DatasetManager: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    setIsLoading(true);
    const data = searchKeyword
      ? await datasetService.searchDatasets(searchKeyword)
      : await datasetService.getAllDatasets();
    setDatasets(data);
    setIsLoading(false);
  };

  const handleViewPreview = async (dataset: Dataset) => {
    setSelectedDataset(dataset);
    const preview = await datasetService.getDatasetPreview(dataset.id);
    setPreviewData(preview);
  };

  const typeIcons: Record<string, React.ReactNode> = {
    text: <FileText className="w-4 h-4" />,
    numerical: <BarChart3 className="w-4 h-4" />,
    mixed: <Files className="w-4 h-4" />,
    image: <FileText className="w-4 h-4" />,
    geospatial: <BarChart3 className="w-4 h-4" />,
  };

  const typeLabels: Record<string, string> = {
    text: '文本',
    numerical: '数值',
    mixed: '混合',
    image: '图像',
    geospatial: '地理',
  };

  const sourceLabels: Record<string, { label: string; color: string }> = {
    existing: { label: '现有数据集', color: 'badge-green' },
    constructed: { label: '自定义构建', color: 'badge-purple' },
  };

  const formatSize = (size: number): string => {
    if (size >= 1000000) return `${(size / 1000000).toFixed(1)}M`;
    if (size >= 1000) return `${(size / 1000).toFixed(1)}K`;
    return size.toString();
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">数据集管理</h2>
            <p className="text-sm text-gray-500">查找现有数据集或构建自定义数据集</p>
          </div>
        </div>
        <button
          onClick={() => setShowBuilder(!showBuilder)}
          className="btn-accent flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> 构建数据集
        </button>
      </div>

      {/* 检索栏 */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadDatasets()}
            placeholder="搜索数据集..."
            className="input-field pl-10"
          />
        </div>
        <button onClick={loadDatasets} className="btn-secondary">
          搜索
        </button>
      </div>

      {/* 数据集列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-2 text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-500" />
          </div>
        ) : datasets.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-gray-400">
            <Database className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>暂无数据集</p>
          </div>
        ) : (
          datasets.map(ds => (
            <div key={ds.id} className="card hover:border-green-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${ds.type === 'text' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'} flex items-center justify-center`}>
                    {typeIcons[ds.type]}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{ds.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`badge text-xs ${sourceLabels[ds.source]?.color}`}>
                        {sourceLabels[ds.source]?.label}
                      </span>
                      <span className="text-xs text-gray-400">{typeLabels[ds.type]}</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{formatSize(ds.size)} {ds.format}</span>
              </div>

              <p className="text-xs text-gray-600 mb-3 line-clamp-2">{ds.description}</p>

              <div className="flex flex-wrap gap-1 mb-3">
                {ds.fields.slice(0, 4).map(field => (
                  <span key={field.name} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {field.name}
                    {field.stats?.unique && ` (${field.stats.unique})`}
                  </span>
                ))}
                {ds.fields.length > 4 && (
                  <span className="text-xs text-gray-400">+{ds.fields.length - 4} more</span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleViewPreview(ds)}
                  className="btn-secondary text-xs flex items-center gap-1 py-1.5"
                >
                  <Eye className="w-3 h-3" /> 预览
                </button>
                {ds.license && (
                  <span className="text-xs text-gray-400 self-center">{ds.license}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 预览弹窗 */}
      {selectedDataset && (
        <div className="card border-2 border-primary-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">
              数据预览：{selectedDataset.name}
            </h3>
            <button onClick={() => setSelectedDataset(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {selectedDataset.fields.map(f => (
                    <th key={f.name} className="text-left px-3 py-2 text-gray-500 font-medium whitespace-nowrap">
                      {f.name}
                      <span className="text-xs text-gray-400 ml-1">({f.type})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {previewData.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {selectedDataset.fields.map(f => (
                      <td key={f.name} className="px-3 py-2 text-xs text-gray-700 max-w-[200px] truncate">
                        {String(row[f.name] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {previewData.length === 0 && (
            <p className="text-center py-8 text-gray-400 text-sm">暂无预览数据</p>
          )}
        </div>
      )}

      {/* 数据集构建器 */}
      {showBuilder && <DatasetBuilder onClose={() => setShowBuilder(false)} />}
    </div>
  );
};

// ---------- Dataset Builder ----------
const DatasetBuilder: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'text' | 'numerical' | 'mixed'>('text');
  const [sourceInput, setSourceInput] = useState('');
  const [sources, setSources] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [built, setBuilt] = useState(false);

  const addSource = () => {
    if (sourceInput.trim()) {
      setSources([...sources, sourceInput.trim()]);
      setSourceInput('');
    }
  };

  const handleBuild = async () => {
    setIsBuilding(true);
    await datasetService.buildDataset({
      name, description, type, sources, filters: {},
    });
    setIsBuilding(false);
    setBuilt(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="card border-2 border-green-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">构建自定义数据集</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      {built ? (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-lg font-medium text-gray-800">数据集构建成功！</p>
          <p className="text-sm text-gray-500 mt-1">即将回到列表...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="label-text">数据集名称</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="如：中文文学作品情感标注数据集" />
          </div>
          <div>
            <label className="label-text">描述</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="input-field resize-none" placeholder="描述数据集的内容和用途..." />
          </div>
          <div>
            <label className="label-text">数据类型</label>
            <div className="flex gap-2">
              {(['text', 'numerical', 'mixed'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    type === t ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-600'
                  }`}
                >
                  {t === 'text' ? '文本' : t === 'numerical' ? '数值' : '混合'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label-text">数据来源</label>
            <div className="flex gap-2">
              <input type="text" value={sourceInput} onChange={e => setSourceInput(e.target.value)} placeholder="数据来源URL或描述" className="input-field flex-1" />
              <button onClick={addSource} className="btn-secondary">添加</button>
            </div>
            {sources.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {sources.map((s, i) => (
                  <span key={i} className="badge-blue inline-flex items-center gap-1 text-xs">
                    {s}
                    <button onClick={() => setSources(sources.filter((_, j) => j !== i))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary">取消</button>
            <button onClick={handleBuild} disabled={isBuilding || !name} className="btn-primary flex items-center gap-2">
              {isBuilding ? <><Loader2 className="w-4 h-4 animate-spin" /> 构建中...</> : '开始构建'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
