import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { HolderData } from '../types';

interface HolderChartProps {
  data: HolderData[];
}

const HolderChart: React.FC<HolderChartProps> = ({ data }) => {
  return (
    <div className="w-full h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-400 text-sm font-medium">持有人趋势图</h3>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          <XAxis 
            dataKey="timestamp" 
            stroke="#666" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            minTickGap={30} // 防止X轴文字挤在一起
          />
          <YAxis 
            stroke="#666" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']} // 自动缩放范围
            allowDecimals={false}     // 👈【关键修改】强制不显示小数
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
            itemStyle={{ color: '#fff' }}
            labelStyle={{ color: '#9ca3af' }}
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
