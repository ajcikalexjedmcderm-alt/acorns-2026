import React, { useMemo } from 'react';
import { HolderData } from '../types';

interface LiveFeedProps {
  data: HolderData[];
}

const LiveFeed: React.FC<LiveFeedProps> = ({ data }) => {
  const logs = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];

    const sorted = [...data].sort((a, b) => new Date(b.fullDate).getTime() - new Date(a.fullDate).getTime());

    return sorted.slice(0, 5).map((current, index) => {
      const previous = sorted[index + 1];
      const diff = previous ? current.count - previous.count : 0;

      return {
        ...current,
        diff,
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
              <span className={`px-2 py-0.5 rounded w-16 text-center font-medium ${
                log.status === 'Growth' ? 'bg-green-500/10 text-green-400' : 
                log.status === 'Decrease' ? 'bg-red-500/10 text-red-400' : 
                'bg-gray-700/30 text-gray-400'
              }`}>
                {log.status === 'Growth' ? 'UPDATE' : 'CHECK'}
              </span>
              
              <div className="flex flex-col">
                <span className="text-gray-300 font-mono">System Sync</span>
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
