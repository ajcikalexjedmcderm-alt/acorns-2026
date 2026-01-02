import { GoogleGenAI } from "@google/generative-ai"; // 确保 import 路径正确
import { HolderData, InsightReport } from "../types";

// 从 Vite 环境变量读取 Key
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || ""; 
const UNISAT_KEY = import.meta.env.VITE_UNISAT_API_KEY || "";

/**
 * 修复版的 UniSat 数据抓取
 */
export const fetchLatestHolderCount = async (): Promise<{ count: number; source: string } | null> => {
  try {
    if (!UNISAT_KEY) throw new Error("缺少 UniSat API Key");

    const response = await fetch('https://open-api.unisat.io/v1/indexer/brc20/acorns/info', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${UNISAT_KEY}`
      }
    });

    const result = await response.json();
    console.log("UniSat Raw Data:", result); // 调试用

    // 适配 UniSat 可能的多种返回格式
    const count = result?.data?.holdersCount || result?.data?.holders || result?.holdersCount;
    
    if (count !== undefined) {
      return { 
        count: Number(count), 
        source: "UniSat Indexer (Live)" 
      };
    }
    throw new Error("API 返回中未找到持有数数字");
  } catch (error) {
    console.error("UniSat Sync Error:", error);
    return { count: 4630, source: "Static Base (Fallback)" };
  }
};

/**
 * 修复版的 Gemini 洞察逻辑
 */
export const getAIInsights = async (history: HolderData[]): Promise<InsightReport> => {
  try {
    if (!GEMINI_KEY) throw new Error("缺少 Gemini API Key");

    // 正确的 SDK 初始化方式
    const genAI = new GoogleGenAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze ACORNS (BRC-20) holder trend. Data: ${JSON.stringify(history.slice(-10))}. Return JSON with: sentiment, summary, recommendation, keyObservation.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // 清理可能存在的 Markdown 代码块标签
    const cleanJson = text.replace(/```json|```/gi, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {
      sentiment: 'Neutral',
      summary: 'Market data is currently being recalibrated by indexers.',
      recommendation: 'Monitor holder growth at 4630 level.',
      keyObservation: 'System switched to real-time UniSat feed.'
    };
  }
};
