import React, { useState, useEffect, useRef } from 'react';
import { getAIInsights } from '../services/gemini';
import { HolderData, InsightReport } from '../types';

interface Props {
  // 必须与 App.tsx 中的属性名一致
  history: HolderData[];
}

const GeminiAnalyst: React.FC<Props> = ({ history = [] }) => {
  const [report, setReport] = useState<InsightReport | null>(null);
  const [loading, setLoading] = useState(false);
  const lastProcessedLength = useRef(0);

  const fetchAnalysis = async () => {
    // 防御：数据不足 2 个点无法分析趋势
    if (!history || history.length < 2 || loading) return; 
    
    setLoading(true);
    try {
      const result = await getAIInsights(history);
      setReport(result);
      lastProcessedLength.current = history.length;
    } catch (err) {
      console.error("AI Insights Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 数据达到 5 个点时自动触发第一次分析
    const minPoints = 5;
    if (history.length >= minPoints && lastProcessedLength.current === 0) {
      fetchAnalysis();
    }
    // 每增加 5 个新点重新分析一次
    if (history.length - lastProcessedLength.current >= 5) {
      fetchAnalysis();
    }
  }, [history.length]);

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="bg-indigo-500/10 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-200">AI 分析报告</h3>
        </div>
        <button 
          onClick={fetchAnalysis}
          disabled={loading || history.length < 2}
          className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-lg border border-indigo-500/20 disabled:opacity-30"
        >
          {loading ? '思考中...' : '刷新分析'}
        </button>
      </div>

      {loading && !report ? (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-800 rounded w-3/4"></div>
          <div className="h-4 bg-slate-800 rounded"></div>
        </div>
      ) : report ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 uppercase">情绪:</span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
              report.sentiment === 'Bullish' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {report.sentiment}
            </span>
          </div>
          <p className="text-slate-300 text-sm italic">"{report.summary}"</p>
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">建议操作</h4>
            <p className="text-slate-400 text-sm">{report.recommendation}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
          <p className="text-sm">等待更多数据进行 AI 趋势分析...</p>
          <p className="text-[10px] mt-1">(当前进度: {history.length}/5)</p>
        </div>
      )}
    </div>
  );
};

export default GeminiAnalyst;
