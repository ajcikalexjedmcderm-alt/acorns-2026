import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { HolderData } from '../types';

interface Props {
  // 确保数据可以是 null 或 undefined
  data: HolderData[] | null; 
}

const HolderChart: React.FC<Props> = ({ data }) => {
  // --- 修复点 1: 解决 "e is not iterable" 错误 ---
  // 如果 data 为空或不是数组，返回加载状态，防止 Recharts 崩溃
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900/50 rounded-2xl border border-slate-800">
        <div className="text-slate-500 text-sm animate-pulse">正在准备历史趋势图...</div>
      </div>
    );
  }

  return (
    // --- 修复点 2: 解决图表高度为 -1 的错误 ---
    // 必须在这里设置一个明确的 min-height 或固定高度
    <div className="w-full h-[400px] min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="timestamp" 
            stroke="#64748b" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toLocaleString()}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
            itemStyle={{ color: '#3b82f6', fontSize: '12px' }}
          />
          <Area 
            type="monotone" 
            dataKey="count" 
            stroke="#3b82f6" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorCount)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HolderChart;
