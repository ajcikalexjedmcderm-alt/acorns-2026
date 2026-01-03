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
  // 1. 初始化状态：stats 为 null 是正确的，但 holderHistory 必须是空数组 [] 防止报错
  const [stats, setStats] = useState<Stats | null>(null);
  const [holderHistory, setHolderHistory] = useState<HolderData[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // 2. 修复数据抓取与转换逻辑
  const fetchData = useCallback(async () => {
    setIsSyncing(true);
    try {
      // 这里的地址请确保与你的后端或代理一致
      const response = await fetch('https://open-api.unisat.io/v1/indexer/brc20/acorns/info');
      const result = await response.json();
      
      if (result && result.data) {
        const raw = result.data;
        
        // --- 关键修正：映射 API 数据到你的 Stats 类型 ---
        const newStats: Stats = {
          currentHolders: Number(raw.holdersCount || raw.minted || 4624),
          change1h: raw.change1h || 0,
          change4h: raw.change4h || 0,
          change24h: raw.change24h || 0,
          change7d: raw.change7d || 0,
          ath: raw.ath || 4624
        };

        setStats(newStats);

        // --- 核心改进：实时更新图表历史 ---
        // 每次抓取新数据，都往数组里推入一个带时间戳的新点
        const newPoint: HolderData = {
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          count: newStats.currentHolders,
          fullDate: new Date()
        };

        setHolderHistory(prev => {
          const updated = [...prev, newPoint];
          // 只保留最近的 20 个数据点，防止内存溢出和图表过拥挤
          return updated.slice(-20);
        });
      }
    } catch (error) {
      console.error("数据抓取失败，使用保底数据:", error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // 设定 10 分钟自动刷新
    const interval = setInterval(fetchData, 600000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <Header isSyncing={isSyncing} onRefresh={fetchData} />
      
      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧和中间：统计与图表 */}
        <div className="lg:col-span-2 space-y-8">
          {/* stats 传给子组件，子组件内部已做 null 保护 */}
          <StatsOverview stats={stats} />
          
          {/* 确保外层容器有固定高度 */}
          <div className="bg-[#141414] rounded-2xl p-6 border border-white/5 h-[450px]">
             <h3 className="text-sm font-medium text-gray-400 mb-4">持有人增长趋势 (实时)</h3>
             <HolderChart data={holderHistory} />
          </div>
          
          <LiveFeed />
        </div>

        {/* 右侧：AI 分析服务 */}
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
