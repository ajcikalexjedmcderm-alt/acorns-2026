import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { HolderData } from '../types';

interface Props {
  data: HolderData[];
}

type TimeRange = '1h' | '4h' | '1D' | '1W' | '1M';

const HolderChart: React.FC<Props> = ({ data }) => {
  const [range, setRange] = useState<TimeRange>('1D');

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const now = new Date().getTime();
    let cutoff = 0;
    
    switch (range) {
      case '1h': cutoff = now - (60 * 60 * 1000); break;
      case '4h': cutoff = now - (4 * 60 * 60 * 1000); break;
      case '1D': cutoff = now - (24 * 60 * 60 * 1000); break;
      case '1W': cutoff = now - (7 * 24 * 60 * 60 * 1000); break;
      case '1M': cutoff = now - (30 * 24 * 60 * 60 * 1000); break;
      default: return data;
    }

    const filtered = data.filter(d => d.fullDate && d.fullDate.getTime() > cutoff);
    return filtered.length > 1 ? filtered : data.slice(-20);
  }, [data, range]);

  const rangeButtons: TimeRange[] = ['1h', '4h', '1D', '1W', '1M'];

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-slate-200">Holder Growth History</h3>
        <div className="flex space-x-1 bg-slate-800 p-1 rounded-xl">
          {rangeButtons.map((btn) => (
            <button
              key={btn}
              onClick={() => setRange(btn)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                range === btn 
                  ? 'bg-amber-500 text-slate-900 shadow-lg' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {btn}
            </button>
          ))}
        </div>
      </div>

      {/* 修复关键点：
          将原来的 flex-1 改为明确的 h-[320px]。
          这解决了 "width(-1) and height(-1)" 的渲染报错。
      */}
      <div className="w-full h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
            <XAxis 
              dataKey="timestamp" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
              dy={10}
              interval="preserveStartEnd"
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
              domain={['auto', 'auto']}
              orientation="right"
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
              itemStyle={{ color: '#f59e0b' }}
              labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '4px' }}
            />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke="#f59e0b" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorCount)" 
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HolderChart;
