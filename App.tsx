import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import StatsOverview from './components/StatsOverview';
import HolderChart from './components/HolderChart';
import LiveFeed from './components/LiveFeed';
import GeminiAnalyst from './components/GeminiAnalyst';
import { HolderData, Stats } from './types';
// 导入最新的 Google AI SDK
import { GoogleGenerativeAI } from "@google/generative-ai";

// 配置区域
const API_KEY = "AIzaSyATO9LQyQpMvAeBUy3s8Wa2pTXmPSbVb78"; 
const DEFAULT_START_COUNT = 4624;

const App: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [holderHistory, setHolderHistory] = useState<HolderData[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. 修复数据抓取逻辑
  const fetchData = useCallback(async () => {
    setIsSyncing(true);
    try {
      // 这里替换为你真实的 UniSat 或后端 API 地址
      const response = await fetch('https://open-api.unisat.io/v1/indexer/brc20/acorns/info');
      const result = await response.json();
      
      if (result && result.data) {
        setStats(result.data);
        // 更新历史数据用于图表
      }
    } catch (error) {
      console.error("数据抓取失败:", error);
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
          <StatsOverview stats={stats} />
          
          {/* 修复点：确保容器有高度，防止图表报错 */}
          <div className="bg-[#141414] rounded-2xl p-6 border border-white/5 h-[400px]">
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
