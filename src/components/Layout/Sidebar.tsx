import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Search, Database, FlaskConical,
  BarChart3, Map, Globe, ChevronLeft, ChevronRight, TrendingUp,
  FileText, GraduationCap,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '研究概览', exact: true },
  { to: '/research-topic', icon: FileText, label: '研究选题' },
  { to: '/literature', icon: BookOpen, label: '文献检索' },
  { to: '/corpus', icon: Search, label: '语料库检索' },
  { to: '/dataset', icon: Database, label: '数据集管理' },
  { to: '/experiment', icon: FlaskConical, label: '实验设计' },
  { to: '/results', icon: BarChart3, label: '结果分析' },
  { to: '/statistics', icon: TrendingUp, label: '统计年鉴' },
  { to: '/map', icon: Map, label: '地图检索' },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-academic-navy text-white flex flex-col transition-all duration-300 z-30 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/10">
        <GraduationCap className="w-7 h-7 text-academic-gold flex-shrink-0" />
        {!collapsed && (
          <span className="ml-3 font-semibold text-sm leading-tight">
            学术研究<br />智能体
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
              isActive(item.to, item.exact)
                ? 'bg-white/15 text-white font-medium'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <item.icon className={`w-5 h-5 flex-shrink-0 ${
              isActive(item.to, item.exact) ? 'text-academic-gold' : 'text-gray-400 group-hover:text-gray-200'
            }`} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-12 border-t border-white/10 text-gray-400 hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        {!collapsed && <span className="ml-2 text-xs">收起菜单</span>}
      </button>
    </aside>
  );
};
