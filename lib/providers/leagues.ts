import type { ProviderDiagnostic, UpcomingFeed, UpcomingGame, UpcomingOdd } from "./types";
import { friendlyOddsApiError } from "./errors";
import { isDemoMode } from "@/lib/demo/config";
import { demoLeagueGames } from "@/lib/demo/fixtures";
import { demoEventOdds } from "@/lib/demo/events";

const ODDS_API_BASE = "https://api.the-odds-api.com/v4";

export type SportEntry = {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  hasOutrights: boolean;
};

export type LeaguesByGroup = {
  group: string;
  leagues: SportEntry[];
};

export type LeaguesResult = {
  configured: boolean;
  message: string;
  groups: LeaguesByGroup[];
  flat: SportEntry[];
  fetchedAt: string;
};

const GROUP_ORDER = [
  "Soccer",
  "Basketball",
  "American Football",
  "Baseball",
  "Tennis",
  "Ice Hockey",
  "Mixed Martial Arts",
  "Boxing",
  "Cricket",
  "Rugby League",
  "Rugby Union",
  "Aussie Rules",
  "Golf",
  "Lacrosse",
  "Politics"
];

const GROUP_LABELS: Record<string, string> = {
  Soccer: "Futebol",
  Basketball: "Basquete",
  "American Football": "Futebol Americano",
  Baseball: "Beisebol",
  Tennis: "Tênis",
  "Ice Hockey": "Hóquei no Gelo",
  "Mixed Martial Arts": "MMA",
  Boxing: "Boxe",
  Cricket: "Críquete",
  "Rugby League": "Rugby League",
  "Rugby Union": "Rugby Union",
  "Aussie Rules": "Futebol Australiano",
  Golf: "Golfe",
  Lacrosse: "Lacrosse",
  Politics: "Política"
};

export function localizeGroup(group: string) {
  return GROUP_LABELS[group] ?? group;
}

function emptyResult(message: string, configured: boolean): LeaguesResult {
  return {
    configured,
    message,
    groups: [],
    flat: [],
    fetchedAt: new Date().toISOString()
  };
}

const DEMO_LEAGUES: SportEntry[] = [
  { key: "soccer_brazil_campeonato", group: "Soccer", title: "Brasileirão Série A", description: "Demo: Brazilian top flight", active: true, hasOutrights: false },
  { key: "soccer_epl", group: "Soccer", title: "Premier League", description: "Demo: English Premier League", active: true, hasOutrights: false },
  { key: "soccer_uefa_champs_league", group: "Soccer", title: "UEFA Champions League", description: "Demo: Champions League", active: true, hasOutrights: false },
  { key: "soccer_fifa_world_cup", group: "Soccer", title: "FIFA World Cup", description: "Demo: World Cup 2026", active: true, hasOutrights: false },
  { key: "basketball_nba", group: "Basketball", title: "NBA", description: "Demo: National Basketball Association", active: true, hasOutrights: false },
  { key: "tennis_atp_aus_open_singles", group: "Tennis", title: "ATP Masters", description: "Demo: ATP tour", active: true, hasOutrights: false },
  { key: "mma_mixed_martial_arts", group: "Mixed Martial Arts", title: "UFC / MMA", description: "Demo: MMA fights", active: true, hasOutrights: false }
];

function demoSportsList(): LeaguesResult {
  const groups = new Map<string, SportEntry[]>();
  for (const l of DEMO_LEAGUES) {
    const arr = groups.get(l.group) ?? [];
    arr.push(l);
    groups.set(l.group, arr);
  }
  return {
    configured: true,
    message: `[DEMO] ${DEMO_LEAGUES.length} ligas fictícias para teste do sistema.`,
    groups: Array.from(groups.entries()).map(([group, leagues]) => ({ group, leagues })),
    flat: DEMO_LEAGUES,
    fetchedAt: new Date().toISOString()
  };
}

export async function getSportsList(): Promise<LeaguesResult> {
  if (isDemoMode()) return demoSportsList();
  const apiKey = process.env.THE_ODDS_API_KEY;
  if (!apiKey) {
    return emptyResult(
      "Configure THE_ODDS_API_KEY no .env.local para listar as ligas reais.",
      false
    );
  }

  try {
    const response = await fetch(`${ODDS_API_BASE}/sports?apiKey=${apiKey}&all=false`, {
      next: { revalidate: 3600 }
    });
    if (!response.ok) {
      const text = await response.text();
      return emptyResult(friendlyOddsApiError(response.status, text), true);
    }
    const sports = (await response.json()) as SportEntry[];
    const active = sports.filter((s) => s.active && !s.hasOutrights);

    const grouped = new Map<string, SportEntry[]>();
    for (const entry of active) {
      const arr = grouped.get(entry.group) ?? [];
      arr.push(entry);
      grouped.set(entry.group, arr);
    }

    const groups: LeaguesByGroup[] = Array.from(grouped.entries())
      .map(([group, leagues]) => ({
        group,
        leagues: leagues.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"))
      }))
      .sort((a, b) => {
        const ai = GROUP_ORDER.indexOf(a.group);
        const bi = GROUP_ORDER.indexOf(b.group);
        if (ai === -1 && bi === -1) return a.group.localeCompare(b.group);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });

    return {
      configured: true,
      message: `${active.length} ligas ativas em ${groups.length} esportes.`,
      groups,
      flat: active,
      fetchedAt: new Date().toISOString()
    };
  } catch (error) {
    return emptyResult(
      error instanceof Error ? error.message : "Erro desconhecido ao listar ligas.",
      true
    );
  }
}

function normalizeMarket(marketKey: string) {
  const names: Record<string, string> = {
    h2h: "Resultado final",
    totals: "Total de pontos/gols",
    spreads: "Handicap"
  };
  return names[marketKey] ?? marketKey;
}

type OddsApiEvent = {
  id: string;
  sport_title?: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: Array<{
    title: string;
    markets?: Array<{
      key: string;
      outcomes?: Array<{ name: string; price: number }>;
    }>;
  }>;
};

export type EventOdds = {
  externalId: string;
  sport: string;
  league: string;
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

export async function getEventOdds(sportKey: string, eventId: string): Promise<EventOdds | null> {
  if (isDemoMode()) return demoEventOdds(sportKey, eventId);
  const apiKey = process.env.THE_ODDS_API_KEY;
  if (!apiKey) return null;
  const regions = process.env.THE_ODDS_API_REGIONS ?? "us,eu,uk";
  const markets = process.env.THE_ODDS_API_MARKETS ?? "h2h,totals,spreads";
  const params = new URLSearchParams({
    apiKey,
    regions,
    markets,
    oddsFormat: "decimal",
    dateFormat: "iso"
  });

  try {
    const response = await fetch(
      `${ODDS_API_BASE}/sports/${encodeURIComponent(sportKey)}/events/${encodeURIComponent(eventId)}/odds?${params.toString()}`,
      { cache: "no-store", next: { revalidate: 0 } }
    );
    if (!response.ok) return null;
    const data = (await response.json()) as {
      id: string;
      sport_title?: string;
      commence_time: string;
      home_team: string;
      away_team: string;
      bookmakers?: Array<{
        title: string;
        markets?: Array<{
          key: string;
          outcomes?: Array<{ name: string; price: number; point?: number }>;
        }>;
      }>;
    };
    return {
      externalId: data.id,
      sport: data.sport_title ?? sportKey,
      league: data.sport_title ?? sportKey,
      home: data.home_team,
      away: data.away_team,
      startTime: data.commence_time,
      bookmakers: (data.bookmakers ?? []).map((b) => ({
        title: b.title,
        markets: (b.markets ?? []).map((m) => ({
          key: m.key,
          label: normalizeMarket(m.key),
          outcomes: m.outcomes ?? []
        }))
      }))
    };
  } catch {
    return null;
  }
}

export async function getLeagueGames(
  sportKey: string,
  sportTitle?: string
): Promise<UpcomingFeed> {
  if (isDemoMode()) {
    const games = demoLeagueGames(sportKey);
    return {
      source: "the-odds-api",
      fetchedAt: new Date().toISOString(),
      configured: true,
      message: games.length > 0
        ? `[DEMO] ${games.length} jogos fictícios para teste.`
        : "[DEMO] Esta liga não tem amostra demo. Tente Brasileirão, Premier League, Champions League, NBA, ATP ou UFC.",
      games,
      diagnostics: [
        { provider: "Modo Demo", status: "ready", message: "Dados simulados para desenvolvimento." }
      ]
    };
  }
  const apiKey = process.env.THE_ODDS_API_KEY;
  const diagnostics: ProviderDiagnostic[] = [
    {
      provider: "The Odds API",
      status: apiKey ? "ready" : "missing-config",
      message: apiKey
        ? `Buscando jogos de ${sportKey}.`
        : "Falta THE_ODDS_API_KEY no .env.local."
    }
  ];

  if (!apiKey) {
    return {
      source: "fallback",
      fetchedAt: new Date().toISOString(),
      configured: false,
      message: "Configure THE_ODDS_API_KEY no .env.local para ver jogos reais desta liga.",
      games: [],
      diagnostics
    };
  }

  const regions = process.env.THE_ODDS_API_REGIONS ?? "us,eu,uk";
  const markets = process.env.THE_ODDS_API_MARKETS ?? "h2h,totals,spreads";
  const params = new URLSearchParams({
    apiKey,
    regions,
    markets,
    oddsFormat: "decimal",
    dateFormat: "iso"
  });

  try {
    const response = await fetch(
      `${ODDS_API_BASE}/sports/${encodeURIComponent(sportKey)}/odds?${params.toString()}`,
      { cache: "no-store", next: { revalidate: 0 } }
    );

    if (!response.ok) {
      const text = await response.text();
      return {
        source: "the-odds-api",
        fetchedAt: new Date().toISOString(),
        configured: true,
        message: friendlyOddsApiError(response.status, text),
        games: [],
        diagnostics
      };
    }

    const events = (await response.json()) as OddsApiEvent[];
    const games: UpcomingGame[] = events.map((event) => {
      const odds: UpcomingOdd[] =
        event.bookmakers?.flatMap((bookmaker) =>
          bookmaker.markets?.flatMap((market) =>
            market.outcomes?.map((outcome) => ({
              market: normalizeMarket(market.key),
              selection: outcome.name,
              price: outcome.price,
              bookmaker: bookmaker.title
            })) ?? []
          ) ?? []
        ) ?? [];

      return {
        externalId: event.id,
        sport: event.sport_title ?? sportTitle ?? "Esporte",
        league: event.sport_title ?? sportTitle ?? sportKey,
        home: event.home_team,
        away: event.away_team,
        startTime: event.commence_time,
        status: "scheduled",
        source: "the-odds-api",
        odds
      };
    });

    return {
      source: "the-odds-api",
      fetchedAt: new Date().toISOString(),
      configured: true,
      message:
        games.length > 0
          ? `${games.length} jogos com odds reais.`
          : "Liga sem jogos abertos no momento. Mercado pode estar fechado entre rodadas.",
      games,
      diagnostics
    };
  } catch (error) {
    return {
      source: "fallback",
      fetchedAt: new Date().toISOString(),
      configured: true,
      message: error instanceof Error ? error.message : "Erro ao buscar jogos da liga.",
      games: [],
      diagnostics
    };
  }
}
