import { GoogleGenerativeAI } from "@google/generative-ai"; 
import { HolderData, InsightReport } from "../types";

// 优先读取环境变量，如果没有，则使用你提供的备用 Key
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyATO9LQyQpMvAeBUy3s8Wa2pTXmPSbVb78"; 
const UNISAT_KEY = import.meta.env.VITE_UNISAT_API_KEY || "";

/**
 * 【新增功能】读取 GitHub Action 生成的日志文件
 * 🟢 关键修复：添加 ?t=时间戳，强制浏览器不使用缓存，获取最新数据
 */
export const fetchMonitorData = async (): Promise<any[]> => {
  try {
    // adding a timestamp query param to bypass cache
    const timestamp = new Date().getTime();
    const response = await fetch(`./acorns_data.json?t=${timestamp}`);
    
    if (!response.ok) {
      throw new Error("无法读取数据文件");
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("读取本地日志失败:", error);
    return [];
  }
};

/**
 * 从 UniSat 抓取最新的持有人数据
 */
export const fetchLatestHolderCount = async (): Promise<{ count: number; source: string } | null> => {
  try {
    // 如果没有配置 UniSat Key，跳过抓取使用保底数据
    if (!UNISAT_KEY) {
      console.warn("未检测到 VITE_UNISAT_API_KEY，使用模拟数据");
      return { count: 4624, source: "保底数据" };
    }

    const response = await fetch('https://open-api.unisat.io/v1/indexer/brc20/acorns/info', {
      headers: { 
        'Authorization': `Bearer ${UNISAT_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`UniSat 响应错误: ${response.status}`);

    const result = await response.json();
    
    // 深度解析：适配 UniSat 可能的多种返回格式
    const count = result?.data?.holdersCount ?? result?.data?.holders ?? result?.holdersCount ?? result?.data?.minted;
    
    if (count !== undefined && count !== null) {
      return { count: Number(count), source: "UniSat Indexer" };
    }
    
    throw new Error("UniSat 返回数据中未包含有效持有数");
  } catch (error) {
    console.error("UniSat 同步失败:", error);
    // 返回一个默认值，防止前端 UI 崩溃
    return { count: 4624, source: "保底数据 (同步异常)" };
  }
};

/**
 * 调用 Gemini 获取 AI 投研见解
 */
export const getAIInsights = async (history: HolderData[]): Promise<InsightReport> => {
  try {
    if (!GEMINI_KEY) throw new Error("缺少 Gemini API Key");

    // 初始化 Gemini 实例
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    // 使用稳定版模型
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 截取最近 15 条数据进行分析，避免 Token 超限
    const recentHistory = history.slice(0, 15);

    const prompt = `你是一个专业的 Web3 投研专家。
    分析以下 ACORNS (BRC-20) 资产的持有人波动趋势数据: ${JSON.stringify(recentHistory)}。
    
    请严格按照以下 JSON 格式回复（不要包含任何解释性文字）：
    {
      "sentiment": "Bullish" | "Neutral" | "Bearish",
      "summary": "一句话概括趋势",
      "recommendation": "投资操作建议",
      "keyObservation": "最关键的一个发现"
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // 强化版 JSON 提取逻辑：去除 AI 可能添加的 Markdown 标签
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("AI 分析服务异常:", error);
    // 发生错误时返回默认结构，确保页面不白屏
    return {
      sentiment: 'Neutral',
      summary: '由于链上数据同步中，AI 暂时无法给出深度见解。',
      recommendation: '建议观察 4624 持有人支撑位。',
      keyObservation: '当前系统正处于数据冷启动阶段。'
    };
  }
};
