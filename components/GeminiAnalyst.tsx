import React, { useState, useEffect, useRef } from 'react';
import { getAIInsights } from '../services/gemini';
import { HolderData, InsightReport } from '../types';

interface Props {
  // 这里的名称必须和 App.tsx 中传的一致
  history?: HolderData[];
}

const GeminiAnalyst: React.FC<Props> = ({ history = [] }) => {
  const [report, setReport] = useState<InsightReport | null>(null);
  const [loading, setLoading] = useState(false);
  const lastProcessedLength = useRef(0);

  const fetchAnalysis = async () => {
    // 增加多重保护：确保 history 存在且长度足够
    if (!history || !Array.isArray(history) || history.length < 2 || loading) return; 
    
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

  useEffect(() => {
    // 使用 Optional Chaining (?.) 确保即便 history 为空也不崩溃
    const currentLength = history?.length || 0;
    const minPoints = 5;

    if (currentLength >= minPoints && (lastProcessedLength.current === 0 || currentLength - lastProcessedLength.current >= 5)) {
      fetchAnalysis();
    }
  }, [history?.length]); // 这里的 ?. 很关键

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-200">AI 智能分析</h3>
        <button 
          onClick={fetchAnalysis}
          disabled={loading || !history || history.length < 2}
          className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-lg disabled:opacity-30"
        >
          {loading ? '思考中...' : '手动刷新'}
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-800 rounded w-3/4"></div>
          <div className="h-4 bg-slate-800 rounded"></div>
        </div>
      ) : report ? (
        <div className="space-y-4 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">市场情绪:</span>
            <span className={report.sentiment === 'Bullish' ? 'text-green-400' : 'text-red-400'}>{report.sentiment}</span>
          </div>
          <p className="text-slate-300 italic">"{report.summary}"</p>
          <p className="text-slate-400 pt-2 border-t border-slate-800">建议: {report.recommendation}</p>
        </div>
      ) : (
        <div className="py-10 text-center text-slate-500 text-xs">
          <p>等待数据积累中...</p>
          <p className="mt-2">当前进度: {history?.length || 0} / 5</p>
        </div>
      )}
    </div>
  );
};

export default GeminiAnalyst;
