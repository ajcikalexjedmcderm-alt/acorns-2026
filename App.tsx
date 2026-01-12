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
  const [fullHistory, setFullHistory] = useState<HolderData[]>([]); // 存储所有完整数据
  const [filteredHistory, setFilteredHistory] = useState<HolderData[]>([]); // 存储筛选后给图表用的数据
  const [timeRange, setTimeRange] = useState<TimeRange>('24h'); // 默认显示24小时
  const [isSyncing, setIsSyncing] = useState(false);

  // 核心逻辑：根据选中的时间段筛选数据
  const filterDataByTime = useCallback((data: HolderData[], range: TimeRange) => {
    if (!data || data.length === 0) return [];
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

  // 当 fullHistory 或 timeRange 改变时，自动重新筛选数据传给图表
  useEffect(() => {
    const filtered = filterDataByTime(fullHistory, timeRange);
    setFilteredHistory(filtered);
  }, [fullHistory, timeRange, filterDataByTime]);

  const fetchData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const response = await fetch(GITHUB_DATA_URL);
      if (!response.ok) throw new Error('无法连接到 GitHub 数据源');
      
      const rawData = await response.json();

      if (Array.isArray(rawData) && rawData.length > 0) {
        // 格式化数据
        const formattedHistory: HolderData[] = rawData.map((item: any) => ({
          timestamp: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          count: Number(item.holders), // 确保是数字
          change: 0,
          fullDate: new Date(item.timestamp) // 保留完整日期对象
        }));

        setFullHistory(formattedHistory);

        // 更新顶部统计卡片 (Stats)
        const latest = formattedHistory[formattedHistory.length - 1];
        const first = formattedHistory[0]; // 获取整个数据集的第一条，用于计算总变化
        
        // 这里的 change24h 暂时计算为“当前显示数据的总变化量”
        // 如果数据积累多了，可以精确计算24小时前的对比
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
      console.error("获取数据失败:", error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // 页面加载和定时刷新
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // 每5分钟刷新一次网页显示
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
