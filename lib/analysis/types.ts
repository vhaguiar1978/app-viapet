export type AnalysisInput = {
  sportKey: string;
  sportTitle: string;
  home: string;
  away: string;
  startTime: string;
  bookmakers: Array<{
    title: string;
    markets: Array<{
      key: string;
      label: string;
      outcomes: Array<{ name: string; price: number; point?: number }>;
    }>;
  }>;
};

export type InsightTone = "neutral" | "positive" | "warning";

export type Insight = {
  label: string;
  value: string;
  detail?: string;
  tone?: InsightTone;
};

export type ConsensusRow = {
  market: string;
  selection: string;
  fairProb: number;
  fairOdd: number;
  bestPrice: number;
  bestBookmaker: string;
  edgePct: number;
};

export type ScorelineCell = { home: number; away: number; prob: number };

export type Limitation = { title: string; reason: string };

export type TopPick = {
  label: string;
  side: "home" | "draw" | "away" | "other";
  fairProb: number;
  bestPrice: number;
  bestBookmaker: string;
  edgePct: number;
};

export type AnalysisResult = {
  sportFamily: "soccer" | "basketball" | "tennis" | "mma" | "generic";
  generatedAt: string;
  bookmakerCount: number;
  consensus: ConsensusRow[];
  insights: Insight[];
  scorelineGrid?: ScorelineCell[];
  topScorelines?: Array<{ score: string; prob: number }>;
  setsDistribution?: Array<{ label: string; prob: number }>;
  halves?: Array<{ label: string; value: string; detail?: string }>;
  narrative: string[];
  limitations: Limitation[];
  topPick?: TopPick;
};
