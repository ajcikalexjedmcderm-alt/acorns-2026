import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import StatsOverview from './components/StatsOverview';
import HolderChart from './components/HolderChart';
import LiveFeed from './components/LiveFeed';
import GeminiAnalyst from './components/GeminiAnalyst';
import { HolderData, Stats } from './types';

const App: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [holderHistory, setHolderHistory] = useState<HolderData[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // 模拟数据的函数：当 API 报错时调用
  const useMockData = () => {
    const mockStats: Stats = {
      currentHolders: 4624,
      change1h: 12,
      change4h: -5,
      change24h: 156,
      change7d: 890,
      ath: 5100
    };
    setStats(mockStats);
    
    // 生成过去几小时的模拟趋势
    const mockHistory: HolderData[] = Array.from({ length: 10 }).map((_, i) => ({
      timestamp: `${10 + i}:00`,
      count: 4500 + (i * 15),
      change: 2,
      fullDate: new Date()
    }));
    setHolderHistory(mockHistory);
  };

  const fetchData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('https://open-api.unisat.io/v1/indexer/brc20/ACORNS/info');
      const result = await response.json();
      
      if (result && result.code === 0 && result.data) {
        const raw = result.data;
        const newStats: Stats = {
          currentHolders: Number(raw.holdersCount || 0),
          change1h: Number(raw.change1h || 0),
          change4h: Number(raw.change4h || 0),
          change24h: Number(raw.change24h || 0),
          change7d: Number(raw.change7d || 0),
          ath: Number(raw.ath || 0)
        };
        setStats(newStats);
        setHolderHistory(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          count: newStats.currentHolders,
          change: newStats.change1h,
          fullDate: new Date()
        }].slice(-20));
      } else {
        console.warn("API 报错，启用模拟数据展示模式:", result.msg);
        if (holderHistory.length === 0) useMockData();
      }
    } catch (error) {
      console.error("请求失败，启用模拟数据:", error);
      if (holderHistory.length === 0) useMockData();
    } finally {
      setIsSyncing(false);
    }
  }, [holderHistory.length]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // 每分钟尝试刷新一次
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <Header isSyncing={isSyncing} onRefresh={fetchData} />
      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <StatsOverview stats={stats} />
          <div className="bg-[#141414] rounded-2xl p-6 border border-white/5 h-[450px]">
             <HolderChart data={holderHistory} />
          </div>
          <LiveFeed />
        </div>
        <div className="lg:col-span-1">
          {/* 确保传给 GeminiAnalyst 的属性名是 history */}
          <GeminiAnalyst history={holderHistory} />
        </div>
      </main>
    </div>
  );
};

export default App;
