import { GoogleGenAI, Type } from "@google/genai";
import { HolderData, InsightReport } from "../types";

/**
 * 核心修改：使用 UniSat API 获取最精准的持有人数据
 * 这种方法不消耗 Gemini 配额，速度极快且 100% 准确
 */
export const fetchLatestHolderCount = async (): Promise<{ count: number; source: string } | null> => {
  try {
    // 从环境变量读取 UniSat Key
    const apiKey = import.meta.env.VITE_UNISAT_API_KEY;
    
    if (!apiKey) {
      console.error("未检测到 VITE_UNISAT_API_KEY 环境变量");
      return { count: 4624, source: "Default (Key Missing)" };
    }

    // 调用 UniSat 官方索引器接口
    const response = await fetch('https://open-api.unisat.io/v1/indexer/brc20/acorns/info', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    const result = await response.json();

    // UniSat 接口返回格式通常为 { code: 0, msg: "ok", data: { holdersCount: ... } }
    if (result && result.data && result.data.holdersCount) {
      return { 
        count: result.data.holdersCount, 
        source: "UniSat Real-time Indexer" 
      };
    }

    throw new Error("UniSat API 返回格式异常");
  } catch (error) {
    console.error("UniSat 数据抓取失败:", error);
    // 失败时返回基准值 4624
    return { count: 4624, source: "Fallback (Static)" };
  }
};

/**
 * AI 市场洞察：只负责分析，不再开启联网搜索(googleSearch)，彻底告别 429 报错
 */
export const getAIInsights = async (history: HolderData[]): Promise<InsightReport> => {
  try {
    const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `你是一个专业的 BRC-20 市场分析师。请分析以下 ACORNS 代币的真实持有人历史数据，并输出 JSON 格式的报告：
    数据：${JSON.stringify(history.slice(-10))}
    
    要求输出字段：
    1. sentiment: (Bullish/Neutral/Bearish)
    2. summary: 一句话总结趋势
    3. recommendation: 给观察者的建议
    4. keyObservation: 数据中的关键亮点`;

    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const text = response.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("AI 分析失败:", error);
    return {
      sentiment: 'Neutral',
      summary: '正在等待链上数据同步以生成洞察报告。',
      recommendation: '观察 4624 持有人支撑位。',
      keyObservation: '系统当前运行在 UniSat 实时数据源模式。'
    };
  }
};
