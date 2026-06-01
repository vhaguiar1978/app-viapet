import { apiFootball } from "./client";

export const SPORT_KEY_TO_LEAGUE: Record<string, number> = {
  soccer_brazil_campeonato: 71,
  soccer_brazil_serie_b: 72,
  soccer_fifa_world_cup: 1,
  soccer_fifa_world_cup_qualifiers_conmebol: 34,
  soccer_epl: 39,
  soccer_efl_champ: 40,
  soccer_uefa_champs_league: 2,
  soccer_uefa_europa_league: 3,
  soccer_uefa_europa_conference_league: 848,
  soccer_spain_la_liga: 140,
  soccer_spain_segunda_division: 141,
  soccer_italy_serie_a: 135,
  soccer_italy_serie_b: 136,
  soccer_germany_bundesliga: 78,
  soccer_germany_bundesliga2: 79,
  soccer_france_ligue_one: 61,
  soccer_france_ligue_two: 62,
  soccer_portugal_primeira_liga: 94,
  soccer_netherlands_eredivisie: 88,
  soccer_argentina_primera_division: 128,
  soccer_mexico_ligamx: 262,
  soccer_usa_mls: 253,
  soccer_japan_j_league: 98,
  soccer_uefa_nations_league: 5,
  soccer_conmebol_copa_libertadores: 13,
  soccer_conmebol_copa_sudamericana: 11
};

export function sportKeyToLeagueId(sportKey: string): number | null {
  return SPORT_KEY_TO_LEAGUE[sportKey] ?? null;
}

export function detectSeason(sportKey: string, startTime: string): number {
  const date = new Date(startTime);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();

  if (
    sportKey === "soccer_brazil_campeonato" ||
    sportKey === "soccer_brazil_serie_b" ||
    sportKey === "soccer_argentina_primera_division" ||
    sportKey === "soccer_usa_mls" ||
    sportKey === "soccer_japan_j_league" ||
    sportKey === "soccer_conmebol_copa_libertadores" ||
    sportKey === "soccer_conmebol_copa_sudamericana"
  ) {
    return year;
  }

  if (sportKey === "soccer_fifa_world_cup") return year;

  return month >= 6 ? year : year - 1;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b(fc|cf|sc|club|de|do|da|aut|cd|ac|asl|ud|sk|spfc|ec)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;

  const aw = na.split(" ").filter((w) => w.length >= 3);
  const bw = nb.split(" ").filter((w) => w.length >= 3);
  if (aw.length === 0 || bw.length === 0) return 0;
  const matches = aw.filter((w) => bw.some((bw2) => bw2.includes(w) || w.includes(bw2)));
  return matches.length / Math.max(aw.length, bw.length);
}

type ApiFixtureResponse = Array<{
  fixture: { id: number; date: string };
  league: { id: number; name: string; season: number };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
}>;

export type MatchedFixture = {
  fixtureId: number;
  leagueId: number;
  season: number;
  homeTeam: { id: number; name: string; logo: string };
  awayTeam: { id: number; name: string; logo: string };
};

export async function findFixture(params: {
  sportKey: string;
  home: string;
  away: string;
  startTime: string;
}): Promise<MatchedFixture | null> {
  const leagueId = sportKeyToLeagueId(params.sportKey);
  if (!leagueId) return null;

  const season = detectSeason(params.sportKey, params.startTime);
  const date = params.startTime.split("T")[0];

  let fixtures = await apiFootball<ApiFixtureResponse>(
    `/fixtures?date=${date}&league=${leagueId}&season=${season}`,
    21600
  );

  if (!fixtures || fixtures.length === 0) {
    const dt = new Date(params.startTime);
    const prevDay = new Date(dt.getTime() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const nextDay = new Date(dt.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const wider = await apiFootball<ApiFixtureResponse>(
      `/fixtures?from=${prevDay}&to=${nextDay}&league=${leagueId}&season=${season}`,
      21600
    );
    if (wider) fixtures = wider;
  }

  if (!fixtures || fixtures.length === 0) return null;

  let bestScore = 0;
  let best: ApiFixtureResponse[0] | null = null;

  for (const fx of fixtures) {
    const homeScore = similarity(params.home, fx.teams.home.name);
    const awayScore = similarity(params.away, fx.teams.away.name);
    const combined = homeScore + awayScore;
    if (combined > bestScore) {
      bestScore = combined;
      best = fx;
    }
  }

  if (!best || bestScore < 0.9) return null;

  return {
    fixtureId: best.fixture.id,
    leagueId: best.league.id,
    season: best.league.season,
    homeTeam: best.teams.home,
    awayTeam: best.teams.away
  };
}
