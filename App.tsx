
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import StatsOverview from './components/StatsOverview';
import HolderChart from './components/HolderChart';
import LiveFeed from './components/LiveFeed';
import GeminiAnalyst from './components/GeminiAnalyst';
import { HolderData, Stats } from './types';
import { fetchLatestHolderCount } from './services/gemini';

const DEFAULT_START_COUNT = 3345;
const MAX_SUPPLY = "1,000,000,000";
const AUTO_SYNC_INTERVAL = 600000; // 10 minutes in milliseconds

const CONCENTRATION_TIERS = {
  top10: 18.42,
  top20_50: 12.15,
  top51_100: 8.30,
};

const createFlatHistory = (count: number): HolderData[] => {
  const data: HolderData[] = [];
  const baseDate = new Date();
  for (let i = 24; i >= 0; i--) {
    const d = new Date(baseDate.getTime() - (i * 60 * 60 * 1000));
    data.push({
      timestamp: `${d.getHours().toString().padStart(2, '0')}:00`,
      count: count,
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
    ath: DEFAULT_START_COUNT
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
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      const data = await fetchLatestHolderCount();
      if (data && data.count > 0) {
        setHistory(prev => {
          if (isFirstSync.current) {
            isFirstSync.current = false;
            return createFlatHistory(data.count);
          }
          const last = prev[prev.length - 1];
          // Prevent duplicate entries if the count hasn't changed or it's too soon
          if (last && last.count === data.count && (new Date().getTime() - last.fullDate.getTime() < 30000)) {
            return prev;
          }
          const change = last ? data.count - last.count : 0;
          const now = new Date();
          const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          return [...prev, { timestamp, count: data.count, change, fullDate: now }].slice(-1000);
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
  }, [isSyncing]);

  // Initial fetch on mount and then auto-sync every 10 minutes
  useEffect(() => {
    syncWithRealData();
    const interval = setInterval(syncWithRealData, AUTO_SYNC_INTERVAL);
    return () => clearInterval(interval);
  }, [syncWithRealData]);

  useEffect(() => {
    calculateStats(history);
  }, [history, calculateStats]);

  const activityLevel = stats.change1h !== 0 ? 'High' : (stats.change4h !== 0 ? 'Moderate' : 'Stable');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500/30">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-slate-800 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.75a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 100-2h-1a1 1 0 100 2h1zM5.05 6.457a1 1 0 00-1.414-1.414l-.707.707a1 1 0 101.414 1.414l.707-.707zM5 10a1 1 0 100-2H4a1 1 0 100 2h1zM8 16v-1a1 1 0 10-2 0v1a1 1 0 102 0zM13.414 14.15a1 1 0 10-1.414-1.414l-.707.707a1 1 0 101.414 1.414l.707-.707zM11 15v1a1 1 0 102 0v-1a1 1 0 10-2 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Auto-Sync (10 min)</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-amber-400 font-medium">ACORNS (BRC-20)</span>
                {syncError && (
                  <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1 animate-pulse">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    {syncError}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={syncWithRealData}
              disabled={isSyncing}
              className={`flex items-center space-x-2 px-6 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 text-slate-900 font-bold rounded-lg transition-all shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-95 ${isSyncing ? 'animate-pulse cursor-wait' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isSyncing ? 'Updating...' : 'Fetch New Data'}</span>
            </button>
          </div>
        </div>

        <StatsOverview stats={stats} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <HolderChart data={history} />
          </div>
          <div>
            <GeminiAnalyst history={history} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
             <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/50">
                  <h3 className="text-xl font-bold text-slate-100 flex items-center gap-3">
                    <span className="p-2 bg-amber-500/10 rounded-lg">
                      <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </span>
                    Token Intelligence Hub
                  </h3>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    activityLevel === 'High' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    activityLevel === 'Moderate' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {activityLevel} Activity
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Supply Concentration Analysis</h4>
                      
                      <div className="space-y-6">
                        <section>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-300 font-medium">Tier 1: Top 10 Holders</span>
                            <span className="text-amber-400 text-sm font-bold">{CONCENTRATION_TIERS.top10}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full transition-all duration-1000" 
                              style={{ width: `${CONCENTRATION_TIERS.top10}%` }}
                            />
                          </div>
                        </section>

                        <section>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-300 font-medium">Tier 2: Top 20-50 Holders</span>
                            <span className="text-blue-400 text-sm font-bold">{CONCENTRATION_TIERS.top20_50}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full transition-all duration-1000" 
                              style={{ width: `${CONCENTRATION_TIERS.top20_50}%` }}
                            />
                          </div>
                        </section>

                        <section>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-300 font-medium">Tier 3: Top 51-100 Holders</span>
                            <span className="text-teal-400 text-sm font-bold">{CONCENTRATION_TIERS.top51_100}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-teal-600 to-teal-400 h-full rounded-full transition-all duration-1000" 
                              style={{ width: `${CONCENTRATION_TIERS.top51_100}%` }}
                            />
                          </div>
                        </section>
                      </div>
                      <div className="mt-6 p-3 bg-slate-800/40 rounded-xl border border-slate-800/50">
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          The <span className="text-slate-200">Combined Top 100</span> control approx. <strong>{(CONCENTRATION_TIERS.top10 + CONCENTRATION_TIERS.top20_50 + CONCENTRATION_TIERS.top51_100).toFixed(2)}%</strong> of the supply. This indicates a fairly decentralized community base.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <section>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Network Statistics</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Max Supply</p>
                          <p className="text-base font-bold text-slate-200">{MAX_SUPPLY}</p>
                        </div>
                        <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Mint Status</p>
                          <p className="text-base font-bold text-green-400">100% Minted</p>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Ecosystem Access</h4>
                      <div className="grid grid-cols-1 gap-2">
                        <a href="https://bestinslot.xyz/brc2.0/acorns" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-slate-800/40 hover:bg-slate-800 rounded-xl border border-slate-800 transition-all group">
                          <div className="flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            <span className="text-xs text-slate-300">BestInSlot (Scraper)</span>
                          </div>
                          <svg className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                        <a href="https://magiceden.io/ordinals/marketplace/acorns" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-slate-800/40 hover:bg-slate-800 rounded-xl border border-slate-800 transition-all group">
                          <div className="flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                            <span className="text-xs text-slate-300">Magic Eden Marketplace</span>
                          </div>
                          <svg className="w-3.5 h-3.5 text-slate-500 group-hover:text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                        <a href="https://unisat.io/brc20/acorns" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-slate-800/40 hover:bg-slate-800 rounded-xl border border-slate-800 transition-all group">
                          <div className="flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                            <span className="text-xs text-slate-300">UniSat Explorer</span>
                          </div>
                          <svg className="w-3.5 h-3.5 text-slate-500 group-hover:text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                      </div>
                    </section>
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-[10px]">
                  <div className="flex items-center space-x-4">
                    <span className="text-slate-500 uppercase font-bold">Standard: <span className="text-slate-300">BRC-20</span></span>
                    <span className="text-slate-500 uppercase font-bold">Network: <span className="text-slate-300">Bitcoin Mainnet</span></span>
                    <span className="text-slate-500 uppercase font-bold">Health: <span className="text-green-400">Optimal</span></span>
                  </div>
                  <div className="text-slate-600 italic flex items-center gap-2">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                    Real-time data calibration active via Gemini Grounding
                  </div>
                </div>
             </div>
          </div>
          
          <div>
            <LiveFeed history={history} />
          </div>
        </div>
      </main>
      
      <footer className="mt-12 border-t border-slate-900 bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm font-medium">
          ACORNS Intelligence Monitor • Independent Tracking of Bitcoin Native Assets
        </div>
      </footer>
    </div>
  );
};

export default App;
