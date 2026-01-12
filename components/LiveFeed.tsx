import React, { useMemo } from 'react';
import { HolderData } from '../types';

interface LiveFeedProps {
  data: HolderData[]; // 接收真实的历史数据
}

const LiveFeed: React.FC<LiveFeedProps> = ({ data }) => {
  // --- 数据处理逻辑 ---
  // 我们需要把数据倒序排列（最新的在上面），并计算和上一次的差值
  const logs = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];

    // 1. 复制一份数据并倒序 (Newest -> Oldest)
    const sorted = [...data].sort((a, b) => new Date(b.fullDate).getTime() - new Date(a.fullDate).getTime());

    // 2. 只取最近的 5 条记录展示
    return sorted.slice(0, 5).map((current, index) => {
      // 找到它的“前一次”记录（在倒序数组里，就是 index + 1）
      const previous = sorted[index + 1];
      
      // 计算变化量 (如果是最后一条数据，就没有前一次，变化量为0)
      const diff = previous ? current.count - previous.count : 0;

      return {
        ...current,
        diff, // 把变化量存起来
        status: diff > 0 ? 'Growth' : diff < 0 ? 'Decrease' : 'Stable'
      };
    });
  }, [data]);

  if (logs.length === 0) {
    return (
      <div className="bg-[#141414] rounded-2xl p-6 border border-white/5">
         <div className="text-gray-500 text-xs text-center">等待首次同步...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#141414] rounded-2xl p-6 border border-white/5">
      <h3 className="text-sm font-medium text-gray-400 mb-6 flex items-center justify-between">
        <div className="flex items-center">
            <span className="relative flex h-2 w-2 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Data Sync Log
        </div>
        <span className="text-[10px] text-gray-600 bg-gray-900 px-2 py-1 rounded border border-gray-800">
            Source: GitHub
        </span>
      </h3>
      
      <div className="space-y-4">
        {logs.map((log, index) => (
          <div key={index} className="flex justify-between items-center text-xs py-2 border-b border-white/5 last:border-0">
            <div className="flex items-center space-x-3">
              {/* 根据变化显示不同的标签颜色 */}
              <span className={`px-2 py-0.5 rounded w-16 text-center font-medium ${
                log.status === 'Growth' ? 'bg-green-500/10 text-green-400' : 
                log.status === 'Decrease' ? 'bg-red-500/10 text-red-400' : 
                'bg-gray-700/30 text-gray-400'
              }`}>
                {log.status === 'Growth' ? 'UPDATE' : 'CHECK'}
              </span>
              
              <div className="flex flex-col">
                <span className="text-gray-300 font-mono">System Sync</span>
                {/* 如果有变化，显示绿色+号 */}
                {log.diff !== 0 && (
                    <span className={`text-[10px] ${log.diff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {log.diff > 0 ? `+${log.diff} New Holders` : `${log.diff} Left`}
                    </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-gray-200 font-bold tabular-nums">
                {log.count.toLocaleString()} <span className="text-gray-600 font-normal">Holders</span>
              </div>
              <div className="text-gray-500 text-[10px]">{log.timestamp}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveFeed;
