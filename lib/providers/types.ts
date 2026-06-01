export type UpcomingSource = "the-odds-api" | "thesportsdb" | "real-test" | "fallback";

export type UpcomingOdd = {
  market: string;
  selection: string;
  price: number;
  bookmaker: string;
};

export type UpcomingGame = {
  externalId: string;
  sport: string;
  league: string;
  home: string;
  away: string;
  startTime: string;
  status: "scheduled";
  source: UpcomingSource;
  odds: UpcomingOdd[];
};

export type UpcomingFeed = {
  source: UpcomingSource;
  fetchedAt: string;
  configured: boolean;
  message: string;
  games: UpcomingGame[];
  diagnostics?: ProviderDiagnostic[];
};

export type ProviderDiagnostic = {
  provider: string;
  status: "ready" | "missing-config" | "error" | "disabled";
  message: string;
};
