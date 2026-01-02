import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { HolderData } from '../types';

interface Props { data: HolderData[]; }

const HolderChart: React.FC<Props> = ({ data }) => {
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.slice(-24); // 显示最近24个点
  }, [data]);

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
      <h3 className="text-lg font-semibold text-slate-200 mb-6">Holder Growth History (Live)</h3>
      
      {/* 终极修复：使用硬编码 style 确保高度在任何情况下都不为 0 */}
      <div style={{ width: '100%', height: '350px', position: 'relative', display: 'block' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
            <XAxis dataKey="timestamp" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} domain={['auto', 'auto']} orientation="right" />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
            <Area type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={3} fill="url(#colorCount)" animationDuration={300} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HolderChart;
