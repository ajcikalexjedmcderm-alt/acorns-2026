import React, { useState, useEffect, useRef } from 'react';
import { getAIInsights } from '../services/gemini';
import { HolderData, InsightReport } from '../types';

interface Props {
  // 允许 history 为空，增加组件健壮性
  history?: HolderData[];
}

const GeminiAnalyst: React.FC<Props> = ({ history = [] }) => {
  const [report, setReport] = useState<InsightReport | null>(null);
  const [loading, setLoading] = useState(false);
  const lastProcessedLength = useRef(0);

  // 1. 获取分析的函数
  const fetchAnalysis = async () => {
    // 防御逻辑：如果没有 history 或长度不足，不执行
    if (!history || history.length < 2 || loading) return; 
    
    setLoading(true);
    try {
      const result = await getAIInsights(history);
      setReport(result);
      lastProcessedLength.current = history.length;
    } catch (err) {
      console.error("AI 分析失败:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. 自动触发分析逻辑
  useEffect(() => {
    if (!history) return;

    const minDataPointsForAnalysis = 5;
    const updateFrequency = 5;

    const hasEnoughData = history.length >= minDataPointsForAnalysis;
    const isInitialLoad = lastProcessedLength.current === 0 && hasEnoughData;
    const hasSignificantGrowth = history.length - lastProcessedLength.current >= updateFrequency;
    
    if (hasEnoughData && (isInitialLoad || hasSignificantGrowth)) {
      fetchAnalysis();
    }
  }, [history?.length]); // 使用可选链

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="bg-indigo-500/10 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-200">AI Market Insight</h3>
        </div>
        <button 
          onClick={fetchAnalysis}
          disabled={loading || !history || history.length < 2}
          className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-lg border border-indigo-500/20 transition-all active:scale-95 disabled:opacity-30"
        >
          {loading ? 'Thinking...' : 'Refresh AI'}
        </button>
      </div>

      {loading && !report ? (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-800 rounded w-3/4"></div>
          <div className="h-4 bg-slate-800 rounded"></div>
          <div className="h-4 bg-slate-800 rounded w-5/6"></div>
        </div>
      ) : report ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sentiment:</span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
              report.sentiment === 'Bullish' ? 'bg-green-500/20 text-green-400' : 
              report.sentiment === 'Bearish' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300'
            }`}>
              {report.sentiment}
            </span>
          </div>
          <div>
            <p className="text-slate-300 text-sm leading-relaxed italic">
              "{report.summary}"
            </p>
          </div>
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Recommendation</h4>
            <p className="text-slate-400 text-sm leading-snug">{report.recommendation}</p>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Key Observation</h4>
            <p className="text-slate-300 text-sm font-medium">{report.keyObservation}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <svg className="w-12 h-12 text-slate-800 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-slate-500 text-sm">Waiting for more data points ({history?.length || 0}/5)...</p>
        </div>
      )}
    </div>
  );
};

export default GeminiAnalyst;
