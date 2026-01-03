import React from 'react';

const LiveFeed: React.FC = () => {
  // 模拟数据，实际开发中可以从 Props 传入
  const events = [
    { id: 1, type: 'Mint', user: 'bc1p...3x9z', amount: '1,000', time: '2 mins ago' },
    { id: 2, type: 'Transfer', user: 'bc1q...7v2w', amount: '500', time: '5 mins ago' },
  ];

  // --- 关键修复：增加空值保护 ---
  // 如果 events 不是数组或为空，显示提示而不是崩溃
  if (!events || !Array.isArray(events)) {
    return <div className="p-4 text-gray-500">正在等待实时链上数据...</div>;
  }

  return (
    <div className="bg-[#141414] rounded-2xl p-6 border border-white/5">
      <h3 className="text-sm font-medium text-gray-400 mb-6 flex items-center">
        <span className="relative flex h-2 w-2 mr-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        Live Activity Feed
      </h3>
      
      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="flex justify-between items-center text-xs py-2 border-b border-white/5 last:border-0">
            <div className="flex items-center space-x-3">
              <span className={`px-2 py-0.5 rounded ${event.type === 'Mint' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
                {event.type}
              </span>
              <span className="text-gray-300 font-mono">{event.user}</span>
            </div>
            <div className="text-right">
              <div className="text-gray-200 font-bold">{event.amount} ACORNS</div>
              <div className="text-gray-500 text-[10px]">{event.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveFeed;
