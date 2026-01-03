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
  // 1. 状态初始化：确保 holderHistory 永远是一个数组 []，防止 "e is not iterable" 报错
  const [stats, setStats] = useState<Stats | null>(null);
  const [holderHistory, setHolderHistory] = useState<HolderData[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // 2. 数据同步逻辑
  const fetchData = useCallback(async () => {
    setIsSyncing(true);
    try {
      // 这里的 API 地址请确保在生产环境下能正常访问
      const response = await fetch('https://open-api.unisat.io/v1/indexer/brc20/acorns/info');
      const result = await response.json();
      
      if (result && result.data) {
        const raw = result.data;
        
        // --- 核心修正：映射 UniSat 原始数据到本地 Stats 类型 ---
        const newStats: Stats = {
          currentHolders: Number(raw.holdersCount || raw.minted || 4624),
          change1h: Number(raw.change1h || 0),
          change4h: Number(raw.change4h || 0),
          change24h: Number(raw.change24h || 0),
          change7d: Number(raw.change7d || 0),
          ath: Number(raw.ath || 4624)
        };

        setStats(newStats);

        // --- 核心改进：生成新的图表数据点 ---
        const newPoint: HolderData = {
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          count: newStats.currentHolders,
          change: newStats.change1h, // 对应 types.ts 中的 change 字段
          fullDate: new Date()
        };

        setHolderHistory(prev => {
          // 只有当持有人数发生变化或历史为空时才推入，防止重复点
          const updated = [...prev, newPoint];
          return updated.slice(-20); // 只保留最近 20 条记录，保证性能
        });
      }
    } catch (error) {
      console.error("同步失败:", error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // 10 分钟自动刷新
    const interval = setInterval(fetchData, 600000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <Header isSyncing={isSyncing} onRefresh={fetchData} />
      
      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* 只有 stats 有值时才渲染这个组件 */}
          {stats ? <StatsOverview stats={stats} /> : <div className="p-8 text-center text-gray-500">正在加载数据...</div>}
          
          <div className="relative bg-[#141414] rounded-2xl p-6 border border-white/5 h-[450px]">
             <h3 className="text-sm font-medium text-gray-400 mb-6">持有人增长趋势 (实时监控)</h3>
             <div className="absolute left-6 right-6 bottom-6 top-16">
                {/* 确保有历史数据再渲染图表 */}
                {holderHistory.length > 0 ? <HolderChart data={holderHistory} /> : <div className="text-center py-20 text-gray-600">等待趋势数据...</div>}
             </div>
          </div>
          
          {/* 这里很有可能是崩溃点，我们可以暂时注释掉它来测试 */}
          <LiveFeed /> 
        </div>

        <div className="lg:col-span-1">
          <GeminiAnalyst 
            apiKey={API_KEY} 
            currentData={stats} 
          />
        </div>
      </main>
    </div>
  );
};

export default App;
