import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import StatsOverview from './components/StatsOverview';
import HolderChart from './components/HolderChart';
import LiveFeed from './components/LiveFeed';
import GeminiAnalyst from './components/GeminiAnalyst';
import { HolderData, Stats } from './types';

// 你的 GitHub 数据直链
const GITHUB_DATA_URL = 'https://raw.githubusercontent.com/ajcikalexjedmcderm-alt/acorns-2026/refs/heads/main/acorns_data.json';

const App: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [holderHistory, setHolderHistory] = useState<HolderData[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // 模拟数据的函数：当 GitHub 数据还没生成或读取失败时调用
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
    
    // 生成模拟趋势
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
      // 1. 从 GitHub 获取 JSON 文件
      const response = await fetch(GITHUB_DATA_URL);
      
      // 检查请求是否成功
      if (!response.ok) {
        throw new Error('无法连接到 GitHub 数据源');
      }

      const rawData = await response.json();
      
      // 2. 检查数据格式 (假设爬虫保存的是一个数组)
      if (Array.isArray(rawData) && rawData.length > 0) {
        
        // 3. 转换数据格式以适配图表
        // 注意：这里假设你的 JSON 里的字段是 'holders' 和 'timestamp'
        // 如果你的爬虫存的字段名不一样（比如叫 count），请在这里修改
        const formattedHistory: HolderData[] = rawData.map((item: any) => ({
          timestamp: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          count: Number(item.holders), // 确保是数字
          change: 0, // 历史数据的单次变化暂时设为0，或者你可以计算 item.holders - prev.holders
          fullDate: new Date(item.timestamp)
        }));

        setHolderHistory(formattedHistory);

        // 4. 计算统计数据 (Stats)
        const latest = formattedHistory[formattedHistory.length - 1]; // 最新一条
        const first = formattedHistory[0]; // 最早一条 (用来粗略计算涨幅)

        // 简单的计算逻辑：对比最新和最早的数据
        const totalChange = latest.count - first.count;

        const newStats: Stats = {
          currentHolders: latest.count,
          change1h: 0,   // 如果数据够多，可以算出1小时前的对比
          change4h: 0,
          change24h: totalChange, // 暂时显示总变化量
          change7d: 0,
          ath: Math.max(...formattedHistory.map(h => h.count)) // 自动算出历史最高
        };
        
        setStats(newStats);
        console.log("成功加载 GitHub 数据:", formattedHistory.length, "条记录");

      } else {
        console.warn("GitHub 数据为空或格式不对，使用模拟数据");
        useMockData();
      }

    } catch (error) {
      console.error("请求 GitHub 失败，启用模拟数据:", error);
      useMockData();
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // GitHub 的更新频率没那么高，可以改成 5 分钟刷新一次
    const interval = setInterval(fetchData, 300000); 
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <Header isSyncing={isSyncing} onRefresh={fetchData} />
      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <StatsOverview stats={stats} />
          <div className="bg-[#141414] rounded-2xl p-6 border border-white/5 h-[450px]">
             {/* 传入完整的历史数据给图表 */}
             <HolderChart data={holderHistory} />
          </div>
          <LiveFeed />
        </div>
        <div className="lg:col-span-1">
          <GeminiAnalyst history={holderHistory} />
        </div>
      </main>
    </div>
  );
};

export default App;
