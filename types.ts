export interface Stats {
  currentHolders: number;
  change1h: number;
  change4h: number;
  change24h: number;
  change7d: number;
  ath: number;
}

export interface HolderData {
  timestamp: string;
  count: number;
  change: number;
  fullDate: Date;
}

export interface InsightReport {
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  summary: string;
  recommendation: string;
  keyObservation: string;
}
