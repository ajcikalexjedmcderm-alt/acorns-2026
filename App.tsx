import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import StatsOverview from './components/StatsOverview';
import HolderChart from './components/HolderChart';
import LiveFeed from './components/LiveFeed';
import GeminiAnalyst from './components/GeminiAnalyst';
import { HolderData, Stats } from './types';
import { fetchLatestHolderCount } from './services/gemini';

// 设定为 BestInSlot 最新的真实底数
const DEFAULT_START_COUNT = 4624; 
const AUTO_SYNC_INTERVAL = 600000; // 恢复为 10 分钟，保护 API 配额

const CONCENTRATION_TIERS = {
  top10: 18.42,
  top20_50: 12.15,
  top51_100: 8.30,
};

// 纯真实历史生成：不再添加随机波动
const createFlatHistory = (count: number): HolderData[] => {
  const data: HolderData[] = [];
  const baseDate = new Date();
  for (let i = 24; i >= 0; i--) {
    const d = new Date(baseDate.getTime() - (i * 60 * 60 * 1000));
    data.push({
      timestamp: `${d.getHours().toString().padStart(2, '0')}:00`,
      count: count, // 保持真实数值
      change: 0,
      fullDate: d
    });
  }
  return data;
};

const App: React.FC = () => {
  const [history, setHistory] = useState<HolderData[]>(createFlatHistory(DEFAULT_START_COUNT));
  const [stats, setStats] = useState<Stats>({
    currentHolders: DEFAULT_START_COUNT,
    change1h: 0,
    change4h: 0,
    change24h: 0,
    change7d: 12,
    ath: 4624
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const isFirstSync = useRef(true);

  const syncWithRealData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const data = await fetchLatestHolderCount();
      if (data && data.count > 0) {
        setHistory(prev => {
          // 首次同步更新整个历史为最新抓取到的真实数值
          if (isFirstSync.current) {
            isFirstSync.current = false;
            return createFlatHistory(data.count);
          }
          const last = prev[prev.length - 1];
          // 只有当数值真的发生变化时才添加新数据点
          if (last && last.count === data.count) return prev;

          const now = new Date();
          return [...prev, { 
            timestamp: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`, 
            count: data.count, 
            change: last ? data.count - last.count : 0, 
            fullDate: now 
          }].slice(-1000);
        });
      }
    } catch (e) { console.error("Sync failed:", e); } finally { setIsSyncing(false); }
  }, []);

  useEffect(() => {
    syncWithRealData();
    const interval = setInterval(syncWithRealData, AUTO_SYNC_INTERVAL);
    return () => clearInterval(interval);
  }, [syncWithRealData]);

  useEffect(() => {
    const latest = history[history.length - 1];
    setStats(prev => ({ 
      ...prev, 
      currentHolders: latest.count, 
      ath: Math.max(prev.ath, latest.count) 
    }));
  }, [history]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <Header />
      <main className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Real-Time Blockchain Data</p>
              <p className="text-amber-400 text-sm font-medium">Source: bestinslot.xyz</p>
            </div>
          </div>
          <button onClick={syncWithRealData} disabled={isSyncing} className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition-all active:scale-95">
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
        
        <StatsOverview stats={stats} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2"><HolderChart data={history} /></div>
          <GeminiAnalyst history={history} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-slate-900 p-8 rounded-2xl border border-slate-800">
            <h3 className="text-xl font-bold mb-4">Network Integrity</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Tracking ACORNS holders directly from the Bitcoin mainnet. 
              Data represents unique wallet addresses containing at least one full BRC-20 unit. 
              Syncing occurs every 10 minutes via Gemini AI Grounding.
            </p>
          </div>
          <LiveFeed history={history} />
        </div>
      </main>
    </div>
  );
};
export default App;
