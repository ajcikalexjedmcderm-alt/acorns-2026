import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { HolderData } from '../types';

interface Props { data: HolderData[]; }

const HolderChart: React.FC<Props> = ({ data }) => {
  const filteredData = useMemo(() => data.slice(-24), [data]);

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl min-h-[450px]">
      <h3 className="text-lg font-semibold text-slate-200 mb-6">持有人增长历史 (实时)</h3>
      {/* 核心修复：外层 div 强制给定 350px 高度 */}
      <div style={{ width: '100%', height: '350px', position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
            <XAxis dataKey="timestamp" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
            <YAxis domain={['auto', 'auto']} orientation="right" tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
            <Area type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={3} fill="url(#colorCount)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HolderChart;
