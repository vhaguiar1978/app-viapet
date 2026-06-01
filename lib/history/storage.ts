export type SavedOutcome = "pending" | "win" | "loss" | "push" | "void";

export type SavedAnalysis = {
  id: string;
  savedAt: string;
  matchId: string;
  sportKey: string;
  sport: string;
  league: string;
  home: string;
  away: string;
  startTime: string;
  pick: {
    label: string;
    side: "home" | "draw" | "away" | "other";
    fairProb: number;
    bestPrice: number;
    bestBookmaker: string;
    edgePct: number;
  };
  stake: number;
  outcome: SavedOutcome;
  outcomeSetAt?: string;
  notes?: string;
};

const STORAGE_KEY = "viabet_history_v1";

function safeWindow(): Window | null {
  return typeof window === "undefined" ? null : window;
}

function readAll(): SavedAnalysis[] {
  const win = safeWindow();
  if (!win) return [];
  try {
    const raw = win.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e) => e && typeof e === "object" && typeof e.id === "string");
  } catch {
    return [];
  }
}

function writeAll(entries: SavedAnalysis[]): void {
  const win = safeWindow();
  if (!win) return;
  win.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function listSaved(): SavedAnalysis[] {
  return readAll().sort((a, b) => (b.savedAt > a.savedAt ? 1 : -1));
}

export function saveAnalysis(entry: Omit<SavedAnalysis, "id" | "savedAt" | "outcome">): SavedAnalysis {
  const existing = readAll();
  const duplicate = existing.find((e) => e.matchId === entry.matchId && e.pick.label === entry.pick.label);
  if (duplicate) return duplicate;
  const created: SavedAnalysis = {
    ...entry,
    id: uid(),
    savedAt: new Date().toISOString(),
    outcome: "pending"
  };
  writeAll([created, ...existing]);
  return created;
}

export function updateOutcome(id: string, outcome: SavedOutcome): SavedAnalysis | null {
  const existing = readAll();
  const idx = existing.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  existing[idx] = {
    ...existing[idx],
    outcome,
    outcomeSetAt: outcome === "pending" ? undefined : new Date().toISOString()
  };
  writeAll(existing);
  return existing[idx];
}

export function updateStake(id: string, stake: number): void {
  const existing = readAll();
  const idx = existing.findIndex((e) => e.id === id);
  if (idx === -1) return;
  existing[idx] = { ...existing[idx], stake };
  writeAll(existing);
}

export function removeAnalysis(id: string): void {
  const existing = readAll();
  writeAll(existing.filter((e) => e.id !== id));
}

export function clearAll(): void {
  writeAll([]);
}

export type AggregatedMetrics = {
  total: number;
  pending: number;
  settled: number;
  wins: number;
  losses: number;
  pushes: number;
  voids: number;
  hitRate: number;
  unitsStaked: number;
  unitsReturned: number;
  unitsProfit: number;
  roiPct: number;
};

export function computeMetrics(entries: SavedAnalysis[]): AggregatedMetrics {
  const total = entries.length;
  let pending = 0,
    wins = 0,
    losses = 0,
    pushes = 0,
    voids = 0;
  let unitsStaked = 0,
    unitsReturned = 0;

  for (const e of entries) {
    if (e.outcome === "pending") {
      pending++;
      continue;
    }
    if (e.outcome === "void") {
      voids++;
      continue;
    }
    unitsStaked += e.stake;
    if (e.outcome === "win") {
      wins++;
      unitsReturned += e.stake * e.pick.bestPrice;
    } else if (e.outcome === "loss") {
      losses++;
    } else if (e.outcome === "push") {
      pushes++;
      unitsReturned += e.stake;
    }
  }

  const settled = wins + losses + pushes;
  const decisionGames = wins + losses;
  const hitRate = decisionGames > 0 ? wins / decisionGames : 0;
  const unitsProfit = unitsReturned - unitsStaked;
  const roiPct = unitsStaked > 0 ? (unitsProfit / unitsStaked) * 100 : 0;

  return {
    total,
    pending,
    settled,
    wins,
    losses,
    pushes,
    voids,
    hitRate,
    unitsStaked,
    unitsReturned,
    unitsProfit,
    roiPct
  };
}
