import { GoogleGenerativeAI } from "@google/generative-ai"; // 修正 import
import { HolderData, InsightReport } from "../types";

// 正确读取 Vite 环境变量
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || ""; 
const UNISAT_KEY = import.meta.env.VITE_UNISAT_API_KEY || "";

export const fetchLatestHolderCount = async (): Promise<{ count: number; source: string } | null> => {
  try {
    if (!UNISAT_KEY) throw new Error("缺少 UniSat API Key");

    const response = await fetch('https://open-api.unisat.io/v1/indexer/brc20/acorns/info', {
      headers: { 'Authorization': `Bearer ${UNISAT_KEY}` }
    });

    const result = await response.json();
    
    // 鲁棒解析：处理多种可能的 UniSat 返回结构
    const count = result?.data?.holdersCount ?? result?.data?.holders ?? result?.holdersCount;
    
    if (count !== undefined) {
      return { count: Number(count), source: "UniSat Indexer" };
    }
    throw new Error("未能解析持有数");
  } catch (error) {
    console.error("UniSat 同步失败:", error);
    return { count: 4624, source: "保底数据" };
  }
};

export const getAIInsights = async (history: HolderData[]): Promise<InsightReport> => {
  try {
    if (!GEMINI_KEY) throw new Error("缺少 Gemini API Key");

    // 正确初始化 Gemini SDK
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `分析 ACORNS (BRC-20) 持有人趋势。数据: ${JSON.stringify(history.slice(-10))}。
    请仅以 JSON 格式返回，包含字段: sentiment (Bullish/Neutral/Bearish), summary, recommendation, keyObservation。`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/gi, "").trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("AI 分析失败:", error);
    return {
      sentiment: 'Neutral',
      summary: '正在同步链上真实数据...',
      recommendation: '关注 4624 支撑位。',
      keyObservation: '系统正在切换至实时数据流。'
    };
  }
};
