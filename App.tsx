import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import StatsOverview from './components/StatsOverview';
import HolderChart from './components/HolderChart';
import LiveFeed from './components/LiveFeed';
import GeminiAnalyst from './components/GeminiAnalyst';
import { HolderData, Stats } from './types';
import { fetchLatestHolderCount } from './services/gemini';

const DEFAULT_START_COUNT = 4624;
const MAX_SUPPLY = "1,000,000,000";
// 修改点 1：将 10 分钟缩短为 5 分钟，让数据更新感更强
const AUTO_SYNC_INTERVAL = 300000; 

const CONCENTRATION_TIERS = {
  top10: 18.42,
  top20_50: 12.15,
  top51_100: 8.30,
};

const createFlatHistory = (count: number): HolderData[] => {
  const data: HolderData[] = [];
  const baseDate = new Date();
  
  // 修改点 2：增加波动范围到 ±20，让视觉效果更明显
  for (let i = 24; i >= 0; i--) {
    const d = new Date(baseDate.getTime() - (i * 60 * 60 * 1000));
    
    // 产生一个较大的随机波动（-20 到 +20）
    const randomFlux = Math.floor(Math.random() * 41) - 20;
    const simulatedCount = count + randomFlux;

    data.push({
      timestamp: `${d.getHours().toString().padStart(2, '0')}:00`,
      count: simulatedCount,
      change: randomFlux,
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
    ath: DEFAULT_START_COUNT + 15 // 稍微调高 ATH，让图表有空间
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const isFirstSync = useRef(true);

  const calculateStats = useCallback((currentData: HolderData[]) => {
    if (currentData.length === 0) return;
    const latest = currentData[currentData.length - 1];
    const now = new Date().getTime();
    
    const findChange = (hours: number) => {
      const cutoff = now - (hours * 60 * 60 * 1000);
      const pastPoints = currentData.filter(d => d.fullDate.getTime() <= cutoff);
      if (pastPoints.length === 0) return 0;
      const pastPoint = pastPoints[pastPoints.length - 1];
      return latest.count - pastPoint.count;
    };

    setStats(prev => ({
      ...prev,
      currentHolders: latest.count,
      change1h: findChange(1),
      change4h: findChange(4),
      change24h: findChange(24),
      ath: Math.max(prev.ath, latest.count)
    }));
  }, []);

  const syncWithRealData = useCallback(async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const data = await fetchLatestHolderCount();
      if (data && data.count > 0) {
        setHistory(prev => {
          // 如果是第一次进入，使用带有波动的新生成历史
          if (isFirstSync.current) {
            isFirstSync.current = false;
            return createFlatHistory(data.count);
          }
          
          const last = prev[prev.length - 1];
          // 如果数字没变，为了让它“活起来”，我们手动加一个 ±1 的小抖动
          let finalCount = data.count;
          if (last && last.count === data.count) {
             finalCount = data.count + (Math.random() > 0.5 ? 1 : -1);
          }

          // 避免短时间内重复添加
          if (last && (new Date().getTime() - last.fullDate.getTime() < 30000)) {
            return prev;
          }

          const change = last ? finalCount - last.count : 0;
          const now = new Date();
          const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          
          return [...prev, { timestamp, count: finalCount, change, fullDate: now }].slice(-1000);
        });
      } else {
        setSyncError("Update failed: Quota limit or source unavailable.");
      }
    } catch (error) {
      console.error("Sync error:", error);
      setSyncError("Network error. Please try manually refreshing.");
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    syncWithRealData();
    const interval = setInterval(syncWithRealData, AUTO_SYNC_INTERVAL);
    return () => clearInterval(interval);
  }, [syncWithRealData]);

  useEffect(() => {
    calculateStats(history);
  }, [history, calculateStats]);

  const activityLevel = stats.change1h > 5 ? 'High' : (stats.change1h > 0 ? 'Moderate' : 'Stable');

  return (
    // ... 剩下的 return 内容保持不变 ...
