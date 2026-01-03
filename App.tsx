import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import StatsOverview from './components/StatsOverview';
import HolderChart from './components/HolderChart';
import LiveFeed from './components/LiveFeed';
import GeminiAnalyst from './components/GeminiAnalyst';
import { HolderData, Stats } from './types';

// 配置区域
const API_KEY = "AIzaSyATO9LQyQpMvAeBUy3s8Wa2pTXmPSbVb78"; 

const App: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [holderHistory, setHolderHistory] = useState<HolderData[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchData = useCallback(async () => {
    setIsSyncing(true);
    console.log("正在尝试获取 UniSat 数据...");
    try {
      // 获取 ACORNS BRC-20 信息
      const response = await fetch('https://open-api.unisat.io/v1/indexer/brc20/acorns/info');
      const result = await response.json();
      
      if (result && result.data) {
        const raw = result.data;
        console.log("获取数据成功:", raw);
        
        const newStats: Stats = {
          currentHolders: Number(raw.holdersCount || raw.minted || 4624),
          change1h: Number(raw.change1h || 0),
          change4h: Number(raw.change4h || 0),
          change24h: Number(raw.change24h || 0),
          change7d: Number(raw.change7d || 0),
          ath: Number(raw.ath || 4624)
        };

        setStats(newStats);

        // 更新历史趋势数组
        const newPoint: HolderData = {
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          count: newStats.currentHolders,
          change: newStats.change1h,
          fullDate: new Date()
        };

        setHolderHistory(prev => {
          const updated = [...prev, newPoint];
          return updated.slice(-20); // 保留最近 20 个数据点
        });
      }
    } catch (error) {
      console.error("API 同步失败:", error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 600000); // 10分钟刷新一次
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <Header isSyncing={isSyncing} onRefresh={fetchData} />
      
      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧主要内容 */}
        <div className="lg:col-span-2 space-y-8">
          <StatsOverview stats={stats} />
          
          <div className="relative bg-[#141414] rounded-2xl p-6 border border-white/5 h-[450px]">
             <h3 className="text-sm font-medium text-gray-400 mb-6">持有人增长趋势 (实时监控)</h3>
             <div className="absolute left-6 right-6 bottom-6 top-16">
                <HolderChart data={holderHistory} />
             </div>
          </div>
          
          <LiveFeed />
        </div>

        {/* 右侧 AI 分析 - 传入正确的 history 属性 */}
        <div className="lg:col-span-1">
          <GeminiAnalyst history={holderHistory} />
        </div>
      </main>
    </div>
  );
};

export default App;
