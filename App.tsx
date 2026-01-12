import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import StatsOverview from './components/StatsOverview';
import HolderChart from './components/HolderChart';
import LiveFeed from './components/LiveFeed';
import GeminiAnalyst from './components/GeminiAnalyst';
import { HolderData, Stats } from './types';

const GITHUB_DATA_URL = 'https://raw.githubusercontent.com/ajcikalexjedmcderm-alt/acorns-2026/refs/heads/main/acorns_data.json';

// 定义时间筛选的选项
type TimeRange = '10m' | '1h' | '4h' | '24h' | '7d' | 'all';

const App: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [fullHistory, setFullHistory] = useState<HolderData[]>([]); // 存储所有数据
  const [filteredHistory, setFilteredHistory] = useState<HolderData[]>([]); // 存储筛选后的数据给图表用
  const [timeRange, setTimeRange] = useState<TimeRange>('24h'); // 默认显示24小时
  const [isSyncing, setIsSyncing] = useState(false);

  // 模拟数据（保持不变，略）
  const useMockData = () => { /* ...你之前的模拟数据代码... */ };

  // 核心逻辑：根据选中的时间段筛选数据
  const filterDataByTime = useCallback((data: HolderData[], range: TimeRange) => {
    if (data.length === 0) return [];
    if (range === 'all') return data;

    const now = new Date();
    const cutoff = new Date();

    // 计算截止时间
    switch (range) {
      case '10m': cutoff.setMinutes(now.getMinutes() - 10); break;
      case '1h':  cutoff.setHours(now.getHours() - 1); break;
      case '4h':  cutoff.setHours(now.getHours() - 4); break;
      case '24h': cutoff.setHours(now.getHours() - 24); break;
      case '7d':  cutoff.setDate(now.getDate() - 7); break;
    }

    // 筛选出大于截止时间的数据
    return data.filter(item => new Date(item.fullDate) >= cutoff);
  }, []);

  // 当 fullHistory 或 timeRange 改变时，自动重新筛选
  useEffect(() => {
    const filtered = filterDataByTime(fullHistory, timeRange);
    setFilteredHistory(filtered);
  }, [fullHistory, timeRange, filterDataByTime]);

  const fetchData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const response = await fetch(GITHUB_DATA_URL);
      if (!response.ok) throw new Error('Network error');
      const rawData = await response.json();

      if (Array.isArray(rawData) && rawData.length > 0) {
        const formattedHistory: HolderData[] = rawData.map((item: any) => ({
          timestamp: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          count: Number(item.holders),
          change: 0,
          fullDate: new Date(item.timestamp) // 必须保留完整日期对象以便筛选
        }));

        setFullHistory(formattedHistory);

        // 更新顶部统计卡片
        const latest = formattedHistory[formattedHistory.length - 1];
        const first = formattedHistory[0];
        setStats({
          currentHolders: latest.count,
          change1h: 0, 
          change4h: 0,
          change24h: latest.count - first.count,
          change7d: 0,
          ath: Math.max(...formattedHistory.map(h => h.count))
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // 按钮组件辅助函数
  const RangeButton = ({ range, label }: { range: TimeRange, label: string }) => (
    <button
      onClick={() => setTimeRange(range)}
      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
        timeRange === range 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <Header isSyncing={isSyncing} onRefresh={fetchData} />
      
      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <StatsOverview stats={stats} />
          
          <div className="bg-[#141414] rounded-2xl p-6 border border-white/5 h-[450px] relative flex flex-col">
             {/* 🔹 这里是新增的按钮组 */}
             <div className="absolute top-6 right-6 flex gap-2 z-10">
               <RangeButton range="10m" label="10分钟" />
               <RangeButton range="1h" label="1小时" />
               <RangeButton range="4h" label="4小时" />
               <RangeButton range="24h" label="1天" />
               <RangeButton range="7d" label="7天" />
               <RangeButton range="all" label="全部" />
             </div>

             {/* 传入筛选后的数据 filteredHistory */}
             <div className="flex-1 mt-8"> 
               {filteredHistory.length > 0 ? (
                 <HolderChart data={filteredHistory} />
               ) : (
                 <div className="flex h-full items-center justify-center text-gray-500 text-sm">
                   该时间段内暂无数据
                 </div>
               )}
             </div>
          </div>
          
          <LiveFeed />
        </div>
        <div className="lg:col-span-1">
          <GeminiAnalyst history={fullHistory} />
        </div>
      </main>
    </div>
  );
};

export default App;
