
export interface HolderData {
  timestamp: string;
  count: number;
  change: number;
  fullDate: Date;
}

export interface InsightReport {
  sentiment: 'Bullish' | 'Neutral' | 'Bearish';
  summary: string;
  recommendation: string;
  keyObservation: string;
}

export interface Stats {
  currentHolders: number;
  change1h: number;
  change4h: number;
  change24h: number;
  change7d: number;
  ath: number;
}
