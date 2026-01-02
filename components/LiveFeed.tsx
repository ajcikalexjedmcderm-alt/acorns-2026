
import React from 'react';
import { HolderData } from '../types';

interface Props {
  history: HolderData[];
}

const LiveFeed: React.FC<Props> = ({ history }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl h-full overflow-hidden">
      <h3 className="text-lg font-semibold text-slate-200 mb-4">Live Activity Logs</h3>
      <div className="space-y-3 overflow-y-auto max-h-[320px] pr-2 scrollbar-thin scrollbar-thumb-slate-700">
        {[...history].reverse().map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800 transition-colors">
            <div className="flex items-center space-x-3">
              <div className={`p-1.5 rounded-full ${item.change >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {item.change >= 0 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-200">
                  {item.change >= 0 ? 'Holder Milestone' : 'Supply Concentration'}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">{item.timestamp}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-200">{item.count}</div>
              <div className={`text-[10px] font-bold ${item.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {item.change > 0 ? `+${item.change}` : item.change}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveFeed;
