import { apiFootball, isConfigured } from "./client";
import { findFixture, type MatchedFixture } from "./matcher";
import { isDemoMode } from "@/lib/demo/config";
import { demoEnrichedStats } from "@/lib/demo/stats";

export { isConfigured, findFixture };
export type { MatchedFixture };

type RawTeamStats = {
  league: { id: number; name: string; season: number; logo?: string };
  team: { id: number; name: string; logo: string };
  form?: string;
  fixtures: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals: {
    for: {
      total: { home: number; away: number; total: number };
      average: { home: string; away: string; total: string };
      minute?: Record<string, { total: number | null; percentage: string | null }>;
    };
    against: {
      total: { home: number; away: number; total: number };
      average: { home: string; away: string; total: string };
      minute?: Record<string, { total: number | null; percentage: string | null }>;
    };
  };
  biggest?: {
    streak?: { wins: number; draws: number; loses: number };
    wins?: { home: string | null; away: string | null };
    loses?: { home: string | null; away: string | null };
    goals?: {
      for: { home: number; away: number };
      against: { home: number; away: number };
    };
  };
  clean_sheet?: { home: number; away: number; total: number };
  failed_to_score?: { home: number; away: number; total: number };
  penalty?: {
    scored: { total: number; percentage: string };
    missed: { total: number; percentage: string };
    total: number;
  };
  lineups?: Array<{ formation: string; played: number }>;
  cards?: {
    yellow: Record<string, { total: number | null; percentage: string | null }>;
    red: Record<string, { total: number | null; percentage: string | null }>;
  };
};

export type HalfBreakdown = {
  firstHalf: number;
  secondHalf: number;
  extraTime: number;
  firstHalfPct: number;
  secondHalfPct: number;
};

export type TeamSeasonStats = {
  team: { id: number; name: string; logo: string };
  league: { id: number; name: string; season: number };
  form?: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  avgGoalsScored: number;
  avgGoalsConceded: number;
  cleanSheets: number;
  failedToScore: number;
  yellowCardsPerGame: number;
  redCardsPerGame: number;
  preferredFormation: string | null;
  goalsByMinute: Array<{ window: string; count: number; pct: number }>;
  goalsScoredByHalf: HalfBreakdown;
  goalsConcededByHalf: HalfBreakdown;
  yellowCardsByHalf: HalfBreakdown;
};

function sumMinuteBucket(
  bucket: Record<string, { total: number | null; percentage: string | null }> | undefined
): Array<{ window: string; count: number; pct: number }> {
  if (!bucket) return [];
  const order = ["0-15", "16-30", "31-45", "46-60", "61-75", "76-90", "91-105", "106-120"];
  return order
    .filter((k) => k in bucket)
    .map((k) => ({
      window: k,
      count: bucket[k]?.total ?? 0,
      pct: parseFloat((bucket[k]?.percentage ?? "0%").replace("%", "")) || 0
    }));
}

function avgPerGame(bucket: Record<string, { total: number | null; percentage: string | null }> | undefined, played: number): number {
  if (!bucket || played === 0) return 0;
  let sum = 0;
  for (const k of Object.keys(bucket)) sum += bucket[k]?.total ?? 0;
  return sum / played;
}

const FIRST_HALF_WINDOWS = ["0-15", "16-30", "31-45"];
const SECOND_HALF_WINDOWS = ["46-60", "61-75", "76-90"];
const EXTRA_TIME_WINDOWS = ["91-105", "106-120"];

function halfBreakdown(
  bucket: Record<string, { total: number | null; percentage: string | null }> | undefined
): HalfBreakdown {
  const grab = (keys: string[]) =>
    keys.reduce((acc, k) => acc + (bucket?.[k]?.total ?? 0), 0);
  const firstHalf = grab(FIRST_HALF_WINDOWS);
  const secondHalf = grab(SECOND_HALF_WINDOWS);
  const extraTime = grab(EXTRA_TIME_WINDOWS);
  const total = firstHalf + secondHalf + extraTime;
  return {
    firstHalf,
    secondHalf,
    extraTime,
    firstHalfPct: total === 0 ? 0 : firstHalf / total,
    secondHalfPct: total === 0 ? 0 : secondHalf / total
  };
}

export async function getTeamSeasonStats(
  teamId: number,
  leagueId: number,
  season: number
): Promise<TeamSeasonStats | null> {
  const raw = await apiFootball<RawTeamStats>(
    `/teams/statistics?team=${teamId}&league=${leagueId}&season=${season}`,
    86400
  );
  if (!raw) return null;

  const played = raw.fixtures?.played?.total ?? 0;
  const topFormation = raw.lineups && raw.lineups.length > 0
    ? [...raw.lineups].sort((a, b) => b.played - a.played)[0].formation
    : null;

  return {
    team: raw.team,
    league: raw.league,
    form: raw.form,
    played,
    wins: raw.fixtures?.wins?.total ?? 0,
    draws: raw.fixtures?.draws?.total ?? 0,
    losses: raw.fixtures?.loses?.total ?? 0,
    goalsScored: raw.goals?.for?.total?.total ?? 0,
    goalsConceded: raw.goals?.against?.total?.total ?? 0,
    avgGoalsScored: parseFloat(raw.goals?.for?.average?.total ?? "0") || 0,
    avgGoalsConceded: parseFloat(raw.goals?.against?.average?.total ?? "0") || 0,
    cleanSheets: raw.clean_sheet?.total ?? 0,
    failedToScore: raw.failed_to_score?.total ?? 0,
    yellowCardsPerGame: avgPerGame(raw.cards?.yellow, played),
    redCardsPerGame: avgPerGame(raw.cards?.red, played),
    preferredFormation: topFormation,
    goalsByMinute: sumMinuteBucket(raw.goals?.for?.minute),
    goalsScoredByHalf: halfBreakdown(raw.goals?.for?.minute),
    goalsConcededByHalf: halfBreakdown(raw.goals?.against?.minute),
    yellowCardsByHalf: halfBreakdown(raw.cards?.yellow)
  };
}

type RawLineup = Array<{
  team: { id: number; name: string; logo: string; colors?: unknown };
  formation: string;
  startXI: Array<{ player: { id: number; name: string; number: number; pos: string; grid: string | null } }>;
  substitutes: Array<{ player: { id: number; name: string; number: number; pos: string; grid: string | null } }>;
  coach: { id: number; name: string; photo: string };
}>;

export type FixtureLineup = {
  team: { id: number; name: string; logo: string };
  formation: string;
  coach: { name: string; photo: string };
  startXI: Array<{ id: number; name: string; number: number; pos: string }>;
  substitutes: Array<{ id: number; name: string; number: number; pos: string }>;
};

export async function getFixtureLineups(fixtureId: number): Promise<FixtureLineup[] | null> {
  const raw = await apiFootball<RawLineup>(`/fixtures/lineups?fixture=${fixtureId}`, 3600);
  if (!raw) return null;
  return raw.map((l) => ({
    team: l.team,
    formation: l.formation,
    coach: { name: l.coach.name, photo: l.coach.photo },
    startXI: l.startXI.map((p) => ({
      id: p.player.id,
      name: p.player.name,
      number: p.player.number,
      pos: p.player.pos
    })),
    substitutes: l.substitutes.map((p) => ({
      id: p.player.id,
      name: p.player.name,
      number: p.player.number,
      pos: p.player.pos
    }))
  }));
}

export type RecentFixturesAggregate = {
  sampleSize: number;
  avgShotsOnGoal: number;
  avgShotsTotal: number;
  avgCorners: number;
  estShotsFirstHalf: number;
  estShotsSecondHalf: number;
  estCornersFirstHalf: number;
  estCornersSecondHalf: number;
  note: string;
};

type RawFixtureList = Array<{ fixture: { id: number; status: { short: string } } }>;
type RawFixtureStats = Array<{
  team: { id: number; name: string };
  statistics: Array<{ type: string; value: number | string | null }>;
}>;

function parseStat(stats: Array<{ type: string; value: number | string | null }>, type: string): number {
  const found = stats.find((s) => s.type === type);
  if (!found || found.value === null || found.value === undefined) return 0;
  if (typeof found.value === "number") return found.value;
  const cleaned = String(found.value).replace("%", "").trim();
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export async function getRecentFixturesAggregate(
  teamId: number,
  leagueId: number,
  season: number,
  goalsFirstHalfPct: number,
  sampleSize = 5
): Promise<RecentFixturesAggregate | null> {
  const finished = await apiFootball<RawFixtureList>(
    `/fixtures?team=${teamId}&league=${leagueId}&season=${season}&last=${sampleSize}&status=FT`,
    86400
  );
  if (!finished || finished.length === 0) return null;

  let totalShotsOnGoal = 0;
  let totalShotsTotal = 0;
  let totalCorners = 0;
  let counted = 0;

  for (const fx of finished) {
    const stats = await apiFootball<RawFixtureStats>(
      `/fixtures/statistics?fixture=${fx.fixture.id}&team=${teamId}`,
      86400 * 30
    );
    if (!stats || stats.length === 0) continue;
    const s = stats[0].statistics;
    totalShotsOnGoal += parseStat(s, "Shots on Goal");
    totalShotsTotal += parseStat(s, "Total Shots");
    totalCorners += parseStat(s, "Corner Kicks");
    counted++;
  }

  if (counted === 0) return null;

  const avgShotsOnGoal = totalShotsOnGoal / counted;
  const avgShotsTotal = totalShotsTotal / counted;
  const avgCorners = totalCorners / counted;

  const firstHalfShare = goalsFirstHalfPct > 0 && goalsFirstHalfPct < 1 ? goalsFirstHalfPct : 0.45;
  const secondHalfShare = 1 - firstHalfShare;

  return {
    sampleSize: counted,
    avgShotsOnGoal,
    avgShotsTotal,
    avgCorners,
    estShotsFirstHalf: avgShotsOnGoal * firstHalfShare,
    estShotsSecondHalf: avgShotsOnGoal * secondHalfShare,
    estCornersFirstHalf: avgCorners * firstHalfShare,
    estCornersSecondHalf: avgCorners * secondHalfShare,
    note:
      "Chutes e escanteios são médias da partida inteira (provedor não expõe por tempo). Divisão 1T/2T é estimada usando a distribuição de gols por tempo do mesmo time."
  };
}

export type HeadToHeadFixture = {
  date: string;
  league: string;
  homeName: string;
  awayName: string;
  homeGoals: number | null;
  awayGoals: number | null;
};

type RawH2H = Array<{
  fixture: { date: string };
  league: { name: string };
  teams: {
    home: { id: number; name: string; winner?: boolean | null };
    away: { id: number; name: string; winner?: boolean | null };
  };
  goals: { home: number | null; away: number | null };
}>;

export async function getHeadToHead(homeId: number, awayId: number, limit = 20): Promise<HeadToHeadFixture[] | null> {
  const raw = await apiFootball<RawH2H>(`/fixtures/headtohead?h2h=${homeId}-${awayId}&last=${limit}`, 86400);
  if (!raw) return null;
  return raw.map((f) => ({
    date: f.fixture.date,
    league: f.league.name,
    homeName: f.teams.home.name,
    awayName: f.teams.away.name,
    homeGoals: f.goals.home,
    awayGoals: f.goals.away
  }));
}

export type AwayAtHostRecord = {
  totalConfrontations: number;
  awayPlayedAsAwayAtHost: number;
  awayWinsAtHost: number;
  awayDrawsAtHost: number;
  awayLossesAtHost: number;
  awayGoalsScoredAtHost: number;
  awayGoalsConcededAtHost: number;
  hostWinsAtHome: number;
  lastVisitorWinAtHost: { date: string; score: string } | null;
};

export async function getAwayAtHostRecord(
  hostId: number,
  visitorId: number,
  limit = 30
): Promise<AwayAtHostRecord | null> {
  const raw = await apiFootball<RawH2H>(`/fixtures/headtohead?h2h=${hostId}-${visitorId}&last=${limit}`, 86400);
  if (!raw) return null;

  const record: AwayAtHostRecord = {
    totalConfrontations: raw.length,
    awayPlayedAsAwayAtHost: 0,
    awayWinsAtHost: 0,
    awayDrawsAtHost: 0,
    awayLossesAtHost: 0,
    awayGoalsScoredAtHost: 0,
    awayGoalsConcededAtHost: 0,
    hostWinsAtHome: 0,
    lastVisitorWinAtHost: null
  };

  for (const f of raw) {
    const isHostHomeMatch = f.teams.home.id === hostId && f.teams.away.id === visitorId;
    if (!isHostHomeMatch) continue;
    record.awayPlayedAsAwayAtHost += 1;
    const hg = f.goals.home ?? 0;
    const ag = f.goals.away ?? 0;
    record.awayGoalsScoredAtHost += ag;
    record.awayGoalsConcededAtHost += hg;
    if (f.goals.home === null || f.goals.away === null) continue;
    if (ag > hg) {
      record.awayWinsAtHost += 1;
      if (!record.lastVisitorWinAtHost) {
        record.lastVisitorWinAtHost = {
          date: f.fixture.date,
          score: `${hg}-${ag}`
        };
      }
    } else if (ag === hg) {
      record.awayDrawsAtHost += 1;
    } else {
      record.awayLossesAtHost += 1;
      record.hostWinsAtHome += 1;
    }
  }

  return record;
}

export type EnrichedStats = {
  fixture: MatchedFixture;
  home: TeamSeasonStats | null;
  away: TeamSeasonStats | null;
  lineups: FixtureLineup[] | null;
  h2h: HeadToHeadFixture[] | null;
  awayRecord: AwayAtHostRecord | null;
  homeRecent: RecentFixturesAggregate | null;
  awayRecent: RecentFixturesAggregate | null;
};

export async function getEnrichedStats(input: {
  sportKey: string;
  home: string;
  away: string;
  startTime: string;
}): Promise<EnrichedStats | null> {
  if (isDemoMode()) {
    if (!input.sportKey.startsWith("soccer_")) return null;
    return demoEnrichedStats(input.home, input.away, "Demo League");
  }
  if (!isConfigured()) return null;
  const fixture = await findFixture(input);
  if (!fixture) return null;

  const [home, away, lineups, h2h, awayRecord] = await Promise.all([
    getTeamSeasonStats(fixture.homeTeam.id, fixture.leagueId, fixture.season),
    getTeamSeasonStats(fixture.awayTeam.id, fixture.leagueId, fixture.season),
    getFixtureLineups(fixture.fixtureId),
    getHeadToHead(fixture.homeTeam.id, fixture.awayTeam.id, 20),
    getAwayAtHostRecord(fixture.homeTeam.id, fixture.awayTeam.id, 30)
  ]);

  const homeFirstHalfPct = home?.goalsScoredByHalf.firstHalfPct ?? 0.45;
  const awayFirstHalfPct = away?.goalsScoredByHalf.firstHalfPct ?? 0.45;

  const [homeRecent, awayRecent] = await Promise.all([
    getRecentFixturesAggregate(fixture.homeTeam.id, fixture.leagueId, fixture.season, homeFirstHalfPct, 5),
    getRecentFixturesAggregate(fixture.awayTeam.id, fixture.leagueId, fixture.season, awayFirstHalfPct, 5)
  ]);

  return { fixture, home, away, lineups, h2h, awayRecord, homeRecent, awayRecent };
}
