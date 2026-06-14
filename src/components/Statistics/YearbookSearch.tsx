import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Database, Search, Loader2, BarChart3, Download,
  ChevronDown,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { statisticsService } from '@/services/mcp/StatisticsService';
import type { StatisticalData } from '@/types';

export const YearbookSearch: React.FC = () => {
  const [databases, setDatabases] = useState<{ id: string; name: string; description: string }[]>([]);
  const [indicators, setIndicators] = useState<{ id: string; name: string; category: string; unit: string }[]>([]);
  const [selectedDB, setSelectedDB] = useState('nbs');
  const [selectedIndicator, setSelectedIndicator] = useState('');
  const [region, setRegion] = useState('全国');
  const [yearStart, setYearStart] = useState(2018);
  const [yearEnd, setYearEnd] = useState(2023);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<StatisticalData[]>([]);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  useEffect(() => {
    statisticsService.getAvailableDatabases().then(setDatabases);
  }, []);

  useEffect(() => {
    statisticsService.getAvailableIndicators().then(setIndicators);
  }, [selectedDB]);

  const handleSearch = async () => {
    if (!selectedIndicator) return;
    setIsSearching(true);
    const years = Array.from(
      { length: yearEnd - yearStart + 1 },
      (_, i) => yearStart + i
    );
    const data = await statisticsService.queryStatistics({
      database: selectedDB,
      indicator: selectedIndicator,
      region,
      years,
    });
    setResults(data);
    setIsSearching(false);
  };

  const prepareChartData = () => {
    if (results.length === 0) return [];
    const indicator = results[0];
    return indicator.dataPoints
      .filter(d => d.region === region)
      .map(d => ({ year: d.year, value: d.value }));
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800">统计年鉴检索</h2>
          <p className="text-sm text-gray-500">查询国家统计局、世界银行等统计数据库</p>
        </div>
      </div>

      {/* 检索表单 */}
      <div className="card">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-text">数据库</label>
              <select
                value={selectedDB}
                onChange={e => {
                  setSelectedDB(e.target.value);
                  setSelectedIndicator('');
                }}
                className="input-field"
              >
                {databases.map(db => (
                  <option key={db.id} value={db.id}>{db.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-text">指标</label>
              <select
                value={selectedIndicator}
                onChange={e => setSelectedIndicator(e.target.value)}
                className="input-field"
              >
                <option value="">请选择指标</option>
                {indicators.map(ind => (
                  <option key={ind.id} value={ind.name}>{ind.name} ({ind.unit})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label-text">地区</label>
              <select value={region} onChange={e => setRegion(e.target.value)} className="input-field">
                <option value="全国">全国</option>
                <option value="北京">北京</option>
                <option value="上海">上海</option>
                <option value="广东">广东</option>
                <option value="浙江">浙江</option>
                <option value="江苏">江苏</option>
              </select>
            </div>
            <div>
              <label className="label-text">起始年份</label>
              <select value={yearStart} onChange={e => setYearStart(Number(e.target.value))} className="input-field">
                {Array.from({ length: 30 }, (_, i) => 2000 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-text">结束年份</label>
              <select value={yearEnd} onChange={e => setYearEnd(Number(e.target.value))} className="input-field">
                {Array.from({ length: 30 }, (_, i) => 2000 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSearch}
              disabled={isSearching || !selectedIndicator}
              className="btn-primary flex items-center gap-2"
            >
              {isSearching ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 查询中...</>
              ) : (
                <><Search className="w-4 h-4" /> 查询数据</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 数据结果 */}
      {results.length > 0 && (
        <div className="space-y-4">
          {/* 数据表格 */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">
                {results[0].indicator} <span className="text-sm text-gray-400">({results[0].unit})</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setChartType('line')}
                  className={`px-3 py-1 text-xs rounded ${chartType === 'line' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  折线图
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1 text-xs rounded ${chartType === 'bar' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  柱状图
                </button>
                <button className="btn-secondary text-xs flex items-center gap-1">
                  <Download className="w-3 h-3" /> 导出
                </button>
              </div>
            </div>

            {/* 图表 */}
            <ResponsiveContainer width="100%" height={350}>
              {chartType === 'line' ? (
                <LineChart data={prepareChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString()} ${results[0]?.unit || ''}`, results[0]?.indicator]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={results[0]?.indicator}
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: '#3b82f6' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={prepareChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString()} ${results[0]?.unit || ''}`, results[0]?.indicator]}
                  />
                  <Legend />
                  <Bar
                    dataKey="value"
                    name={results[0]?.indicator}
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>

            {/* 数据表格 */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">年份</th>
                    <th className="text-right px-3 py-2 text-gray-500 font-medium">数值</th>
                    <th className="text-right px-3 py-2 text-gray-500 font-medium">同比变化</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {prepareChartData().map((d, i, arr) => {
                    const prev = i > 0 ? arr[i - 1].value : null;
                    const change = prev ? ((d.value - prev) / prev * 100) : null;
                    return (
                      <tr key={d.year} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 text-gray-700">{d.year}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-gray-800">
                          {d.value.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs">
                          {change !== null && (
                            <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!isSearching && results.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Database className="w-20 h-20 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">选择数据库和指标开始查询</p>
          <p className="text-sm mt-1">支持国家统计局、世界银行等多个统计数据库</p>

          {/* 可用数据库 */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {databases.map(db => (
              <div key={db.id} className="p-3 bg-gray-50 rounded-lg text-left">
                <p className="text-sm font-medium text-gray-700">{db.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{db.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
