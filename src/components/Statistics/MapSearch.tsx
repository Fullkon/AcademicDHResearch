import React, { useState } from 'react';
import { Map, Layers, Search, Loader2, Compass, Globe } from 'lucide-react';
import { mapService } from '@/services/mcp/MapService';
import type { MapLayer, MapSearchQuery } from '@/types';

const LAYER_TYPES = [
  { id: 'administrative', label: '行政区划', icon: '🗺️' },
  { id: 'topographic', label: '地形地貌', icon: '⛰️' },
  { id: 'thematic', label: '专题地图', icon: '📊' },
  { id: 'historical', label: '历史地图', icon: '📜' },
] as const;

export const MapSearch: React.FC = () => {
  const [region, setRegion] = useState('');
  const [layerType, setLayerType] = useState<MapSearchQuery['layerType']>('thematic');
  const [theme, setTheme] = useState('');
  const [year, setYear] = useState(2024);
  const [isSearching, setIsSearching] = useState(false);
  const [layers, setLayers] = useState<MapLayer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<MapLayer | null>(null);

  const handleSearch = async () => {
    setIsSearching(true);
    const result = await mapService.searchMaps({ region, layerType, theme, year });
    setLayers(result.layers);
    setIsSearching(false);
  };

  const handleSearchLocation = async () => {
    if (!region.trim()) return;
    setIsSearching(true);
    const loc = await mapService.searchLocation(region);
    setIsSearching(false);
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
          <Map className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800">地图检索</h2>
          <p className="text-sm text-gray-500">查询行政区划、专题、历史地图图层</p>
        </div>
      </div>

      {/* 检索表单 */}
      <div className="card">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-text">地区</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  placeholder="如：北京、丝绸之路沿线..."
                  className="input-field flex-1"
                />
                <button onClick={handleSearchLocation} className="btn-secondary flex items-center gap-1">
                  <Compass className="w-4 h-4" /> 定位
                </button>
              </div>
            </div>
            <div>
              <label className="label-text">年份</label>
              <input
                type="number"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                min={1000}
                max={2024}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="label-text">地图类型</label>
            <div className="flex gap-2">
              {LAYER_TYPES.map(lt => (
                <button
                  key={lt.id}
                  onClick={() => setLayerType(lt.id as typeof layerType)}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    layerType === lt.id
                      ? 'bg-teal-50 border-teal-300 text-teal-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-1">{lt.icon}</span>
                  {lt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-text">专题（可选）</label>
            <input
              type="text"
              value={theme}
              onChange={e => setTheme(e.target.value)}
              placeholder="如：语言分布、文化遗产、历史路线..."
              className="input-field"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="btn-primary flex items-center gap-2"
            >
              {isSearching ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 检索中...</>
              ) : (
                <><Search className="w-4 h-4" /> 检索地图</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 地图图层 */}
      {layers.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">地图图层 ({layers.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {layers.map(layer => (
              <div
                key={layer.id}
                onClick={() => setSelectedLayer(layer)}
                className={`card cursor-pointer transition-all ${
                  selectedLayer?.id === layer.id
                    ? 'border-2 border-teal-400 shadow-md'
                    : 'hover:border-teal-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{layer.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="badge-blue text-xs">{layer.type}</span>
                      {layer.metadata.projection && (
                        <span className="text-xs text-gray-400">{layer.metadata.projection}</span>
                      )}
                    </div>
                    {layer.metadata.source && (
                      <p className="text-xs text-gray-500 mt-1">来源：{layer.metadata.source}</p>
                    )}
                    {layer.metadata.period && (
                      <p className="text-xs text-gray-500">时期：{layer.metadata.period}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 地图预览区域 */}
      {selectedLayer && (
        <div className="card border-2 border-teal-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">{selectedLayer.name}</h3>
            <span className="text-xs text-gray-400">{selectedLayer.url}</span>
          </div>
          <div className="aspect-[16/9] bg-gray-100 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <Globe className="w-16 h-16 text-teal-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">地图预览区域</p>
              <p className="text-sm text-gray-400 mt-1">
                {selectedLayer.type === 'thematic' ? '专题地图图层' :
                 selectedLayer.type === 'historical' ? '历史地图图层' :
                 selectedLayer.type === 'administrative' ? '行政区划图层' : '地形图层'}
              </p>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left text-xs text-gray-600 space-y-1 inline-block">
                {Object.entries(selectedLayer.metadata).map(([k, v]) => (
                  <p key={k}><span className="font-medium">{k}:</span> {v}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!isSearching && layers.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Map className="w-20 h-20 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">输入地区或选择地图类型开始检索</p>
          <p className="text-sm mt-1">支持行政区划、专题、历史等多种地图图层</p>
        </div>
      )}
    </div>
  );
};
