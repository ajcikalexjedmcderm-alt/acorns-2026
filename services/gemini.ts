
import { GoogleGenAI, Type } from "@google/genai";
import { HolderData, InsightReport } from "../types";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 2000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const status = error?.status || error?.error?.status;
      const message = error?.message || error?.error?.message || "";
      
      // If it's a rate limit error (429) or a temporary server error (500), retry
      if (status === "RESOURCE_EXHAUSTED" || status === 429 || status === "UNKNOWN" || status === 500 || message.includes("quota")) {
        const waitTime = initialDelay * Math.pow(2, i);
        console.warn(`API Error (${status}). Retrying in ${waitTime}ms... (Attempt ${i + 1}/${maxRetries})`);
        await delay(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const getAIInsights = async (history: HolderData[]): Promise<InsightReport> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Analyze the following ACORNS token holder history and provide a JSON report.
    Data: ${JSON.stringify(history.slice(-10))}
    
    The report should include:
    1. Sentiment (Bullish, Neutral, or Bearish)
    2. A brief summary of the trend.
    3. A strategic recommendation for observers.
    4. A key observation from the data patterns.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING },
            summary: { type: Type.STRING },
            recommendation: { type: Type.STRING },
            keyObservation: { type: Type.STRING }
          },
          required: ["sentiment", "summary", "recommendation", "keyObservation"]
        }
      }
    });

    return JSON.parse(response.text.trim());
  }).catch(error => {
    console.error("AI Insights failed after retries:", error);
    return {
      sentiment: 'Neutral',
      summary: 'Market analysis is currently recalibrating due to high demand.',
      recommendation: 'Observe the holder count trend manually.',
      keyObservation: 'System is protecting API quotas.'
    };
  });
};

/**
 * Uses Google Search grounding to fetch the absolute latest holder count 
 * from bestinslot.xyz for the ACORNS token.
 */
export const fetchLatestHolderCount = async (): Promise<{ count: number; source: string } | null> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = "What is the current number of holders for the ACORNS BRC-20 token? Check the latest data on https://bestinslot.xyz/brc2.0/acorns. Return ONLY the integer number of holders.";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "";
    const match = text.match(/\d+/g);
    if (match) {
      const numbers = match.map(num => parseInt(num.replace(/,/g, ''), 10));
      const holderCount = Math.max(...numbers);
      const sourceUrl = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.[0]?.web?.uri || "https://bestinslot.xyz/brc2.0/acorns";
      return { count: holderCount, source: sourceUrl };
    }
    return null;
  }).catch(error => {
    console.error("Fetch holder count failed after retries:", error);
    return null;
  });
};
