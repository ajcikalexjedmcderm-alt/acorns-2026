import React from 'react';
import { Stats } from '../types';

interface Props {
  // 允许 stats 为 null，以配合 App.tsx 的初始状态
  stats: Stats | null; 
}

const StatsOverview: React.FC<Props> = ({ stats }) => {
  // --- 修复点 1: 增加加载中保护 ---
  // 如果 stats 还是 null，显示占位 UI，防止读取属性时崩溃
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 opacity-50">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl animate-pulse">
            <div className="h-2 w-12 bg-slate-700 mb-4 rounded"></div>
            <div className="h-6 w-20 bg-slate-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  // --- 修复点 2: 使用可选链 (?.) 确保万无一失 ---
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      <StatCard 
        label="Total Holders" 
        value={stats.currentHolders?.toLocaleString() || "0"} 
        subText="Live count"
        icon={<path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
        color="text-blue-400"
      />
      <StatCard 
        label="1h Change" 
        value={`${(stats.change1h || 0) > 0 ? '+' : ''}${stats.change1h || 0}`} 
        subText="Last 60 mins"
        icon={<path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
        color={(stats.change1h || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}
      />
      <StatCard 
        label="4h Change" 
        value={`${(stats.change4h || 0) > 0 ? '+' : ''}${stats.change4h || 0}`} 
        subText="Recent block window"
        icon={<path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
        color={(stats.change4h || 0) >= 0 ? "text-teal-400" : "text-orange-400"}
      />
      <StatCard 
        label="24h Change" 
        value={`${(stats.change24h || 0) > 0 ? '+' : ''}${stats.change24h || 0}`} 
        subText="Daily velocity"
        icon={<path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />}
        color={(stats.change24h || 0) >= 0 ? "text-green-400" : "text-red-400"}
      />
      <StatCard 
        label="7d Trend" 
        value={`${(stats.change7d || 0) > 0 ? '+' : ''}${stats.change7d || 0}`} 
        subText="Weekly net"
        icon={<path d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />}
        color="text-amber-400"
      />
      <StatCard 
        label="All-Time High" 
        value={stats.ath?.toLocaleString() || "0"} 
        subText="Peak distribution"
        icon={<path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />}
        color="text-purple-400"
      />
    </div>
  );
};

const StatCard = ({ label, value, subText, icon, color }: any) => (
  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
    <div className="flex justify-between items-start mb-3">
      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{label}</span>
      <svg className={`h-4 w-4 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {icon}
      </svg>
    </div>
    <div className="text-xl font-bold mb-0.5 tracking-tight">{value}</div>
    <div className="text-[10px] text-slate-500 font-medium">{subText}</div>
  </div>
);

export default StatsOverview;
