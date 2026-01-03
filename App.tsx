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
  // 1. 状态初始化
  const [stats, setStats] = useState<Stats | null>(null);
  const [holderHistory, setHolderHistory] = useState<HolderData[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // 2. 数据同步逻辑
  const fetchData = useCallback(async () => {
    setIsSyncing(true);
    console.log("正在发起 API 请求...");
    
    try {
      // 核心修正：尝试使用全大写的 ACORNS，这是 BRC-20 索引器的标准格式
      const response = await fetch('https://open-api.unisat.io/v1/indexer/brc20/ACORNS/info');
      const result = await response.json();
      
      console.log("API 原始返回结果:", result);

      // 只有当 code 为 0 且有数据时才进行解析
      if (result && result.code === 0 && result.data) {
        const raw = result.data;
        console.log("数据解析成功:", raw.ticker);
        
        const newStats: Stats = {
          currentHolders: Number(raw.holdersCount || raw.minted || 0),
          change1h: Number(raw.change1h || 0),
          change4h: Number(raw.change4h || 0),
          change24h: Number(raw.change24h || 0),
          change7d: Number(raw.change7d || 0),
          ath: Number(raw.ath || 0)
        };

        setStats(newStats);

        // 更新历史趋势图表数据
        const newPoint: HolderData = {
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          count: newStats.currentHolders,
          change: newStats.change1h,
          fullDate: new Date()
        };

        setHolderHistory(prev => {
          const updated = [...prev, newPoint];
          return updated.slice(-20); // 仅保留最近 20 条数据
        });
      } else {
        // 如果依然报错（如 ticker invalid），在控制台输出提示
        console.warn(`数据源异常: ${result.msg || '未知错误'}`);
      }
    } catch (error) {
      console.error("同步过程中发生网络错误:", error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // 3. 自动刷新逻辑
  useEffect(() => {
    fetchData();
    // 默认每 10 分钟自动刷新一次
    const interval = setInterval(fetchData, 600000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <Header isSyncing={isSyncing} onRefresh={fetchData} />
      
      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧：监控核心面板 */}
        <div className="lg:col-span-2 space-y-8">
          {/* 统计卡片区 */}
          <StatsOverview stats={stats} />
          
          {/* 持有人增长图表区 */}
          <div className="relative bg-[#141414] rounded-2xl p-6 border border-white/5 h-[450px]">
             <h3 className="text-sm font-medium text-gray-400 mb-6">持有人增长趋势 (实时监控)</h3>
             <div className="absolute left-6 right-6 bottom-6 top-16">
                <HolderChart data={holderHistory} />
             </div>
          </div>
          
          {/* 实时活动 Feed 区 */}
          <LiveFeed />
        </div>

        {/* 右侧：AI 智能分析面板 */}
        <div className="lg:col-span-1">
          {/* 核心修正：将 holderHistory 传递给 history 属性 */}
          <GeminiAnalyst 
            history={holderHistory} 
          />
        </div>
      </main>
    </div>
  );
};

export default App;
