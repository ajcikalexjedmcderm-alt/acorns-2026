import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import StatsOverview from './components/StatsOverview';
import HolderChart from './components/HolderChart';
import LiveFeed from './components/LiveFeed';
import GeminiAnalyst from './components/GeminiAnalyst';
import { HolderData, Stats } from './types';

// 你的 GitHub 数据直链
const GITHUB_DATA_URL = 'https://raw.githubusercontent.com/ajcikalexjedmcderm-alt/acorns-2026/refs/heads/main/acorns_data.json';

// 定义时间筛选的选项
type TimeRange = '10m' | '1h' | '4h' | '24h' | '7d' | 'all';

const App: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [fullHistory, setFullHistory] = useState<HolderData[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HolderData[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [isSyncing, setIsSyncing] = useState(false);

  // 核心逻辑：根据选中的时间段筛选数据
  const filterDataByTime = useCallback((data: HolderData[], range: TimeRange) => {
    if (!data || data.length === 0) return [];
    if (range === 'all') return data;

    const now = new Date();
    // 注意：这里使用最后一个数据点的时间作为参考，防止数据断更时图表全空
    const lastDataPoint = data[data.length - 1]?.fullDate || new Date(); 
    const cutoff = new Date(lastDataPoint);

    switch (range) {
      case '10m': cutoff.setMinutes(cutoff.getMinutes() - 10); break;
      case '1h':  cutoff.setHours(cutoff.getHours() - 1); break;
      case '4h':  cutoff.setHours(cutoff.getHours() - 4); break;
      case '24h': cutoff.setHours(cutoff.getHours() - 24); break;
      case '7d':  cutoff.setDate(cutoff.getDate() - 7); break;
    }

    return data.filter(item => new Date(item.fullDate) >= cutoff);
  }, []);

  // 当 fullHistory 或 timeRange 改变时，自动重新筛选数据
  useEffect(() => {
    const filtered = filterDataByTime(fullHistory, timeRange);
    setFilteredHistory(filtered);
  }, [fullHistory, timeRange, filterDataByTime]);

  const fetchData = useCallback(async () => {
    setIsSyncing(true);
    try {
      // 🟢 修复 1: 添加时间戳参数，强制浏览器和 CDN 放弃缓存，获取最新数据
      const timestamp = new Date().getTime();
      const fetchUrl = `${GITHUB_DATA_URL}?t=${timestamp}`;
      
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error('无法连接到 GitHub 数据源');
      
      const rawData = await response.json();

      if (Array.isArray(rawData) && rawData.length > 0) {
        
        // 🟢 修复 2: Python 脚本保存的是 [最新, ..., 最旧]
        // 但图表需要 [最旧, ..., 最新] 从左到右画
        // 所以我们必须先 .slice() 复制一份，再 .reverse() 翻转数组
        const sortedData = rawData.slice().reverse();

        const formattedHistory: HolderData[] = sortedData.map((item: any) => ({
          timestamp: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          count: Number(item.holders),
          change: 0, // 可以根据需要计算
          fullDate: new Date(item.timestamp)
        }));

        setFullHistory(formattedHistory);

        // 现在数组是 [旧 -> 新]，所以最后一个是最新的
        const latest = formattedHistory[formattedHistory.length - 1];
        const first = formattedHistory[0];
        
        // 计算 24h 变化 (简单版：拿最新的减去列表里第一条，或者更严谨的查找)
        // 这里的 first.count 实际上是历史记录里最老的一条
        const change24h = latest.count - first.count;

        setStats({
          currentHolders: latest.count,
          change1h: 0, 
          change4h: 0,
          change24h: change24h,
          change7d: 0,
          ath: Math.max(...formattedHistory.map(h => h.count))
        });
      }
    } catch (error) {
      console.error("获取数据失败:", error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // 每 30 秒轮询一次（既然已经是自动化了，可以稍微频繁点）
    const interval = setInterval(fetchData, 30000); 
    return () => clearInterval(interval);
  }, [fetchData]);

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
             <div className="absolute top-6 right-6 flex gap-2 z-10">
               <RangeButton range="10m" label="10分钟" />
               <RangeButton range="1h"
