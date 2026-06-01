import { matches } from "@/lib/mock-data";
import type { ProviderDiagnostic, UpcomingFeed, UpcomingGame, UpcomingOdd } from "./types";
import { friendlyOddsApiError } from "./errors";
import { isDemoMode } from "@/lib/demo/config";
import { demoUpcomingFeed } from "@/lib/demo/fixtures";

const ODDS_API_BASE = "https://api.the-odds-api.com/v4";
const SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json";

function dataMode() {
  return process.env.DATA_MODE ?? (process.env.REAL_TEST_MODE === "true" ? "real-test" : "demo");
}

function asArray(value: string | undefined, fallback: string[]) {
  return value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : fallback;
}

export function getProviderDiagnostics(): ProviderDiagnostic[] {
  const mode = dataMode();

  return [
    {
      provider: "Data mode",
      status: mode === "real" ? "ready" : "disabled",
      message:
        mode === "real"
          ? "Modo real ativo. Dados simulados ficam bloqueados."
          : mode === "real-test"
            ? "Modo teste real ativo. Usa cenarios dinamicos quando faltar provider real."
            : "Modo demo ativo. Usa dados mockados."
    },
    {
      provider: "The Odds API",
      status: process.env.THE_ODDS_API_KEY ? "ready" : "missing-config",
      message: process.env.THE_ODDS_API_KEY
        ? "Chave configurada para jogos futuros com odds reais."
        : "Falta THE_ODDS_API_KEY para odds reais pre-jogo."
    },
    {
      provider: "TheSportsDB",
      status: process.env.SPORTSDB_API_KEY && process.env.SPORTSDB_LEAGUE_IDS ? "ready" : "missing-config",
      message:
        process.env.SPORTSDB_API_KEY && process.env.SPORTSDB_LEAGUE_IDS
          ? "Configurado para agenda real por ligas."
          : "Configure SPORTSDB_API_KEY e SPORTSDB_LEAGUE_IDS para agenda real alternativa."
    }
  ];
}

function fallbackFeed(message: string): UpcomingFeed {
  const mode = dataMode();

  if (mode === "real-test") return realTestFeed(message);

  if (mode === "real") {
    return {
      source: "fallback",
      fetchedAt: new Date().toISOString(),
      configured: false,
      message: `${message} Modo real ativo: dados simulados bloqueados.`,
      games: [],
      diagnostics: getProviderDiagnostics()
    };
  }

  return {
    source: "fallback",
    fetchedAt: new Date().toISOString(),
    configured: false,
    message,
    games: matches.map((match) => ({
      externalId: `mock-${match.id}`,
      sport: match.sport,
      league: match.league,
      home: match.home,
      away: match.away,
      startTime: match.startTime,
      status: "scheduled",
      source: "fallback",
      odds: match.markets.map((market) => ({
        market: market.name,
        selection: market.name,
        price: market.bestOdd,
        bookmaker: market.bookmaker
      }))
    })),
    diagnostics: getProviderDiagnostics()
  };
}

function daysFromNow(days: number, hour: number, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function realTestFeed(reason: string): UpcomingFeed {
  return {
    source: "real-test",
    fetchedAt: new Date().toISOString(),
    configured: true,
    message: `Modo Teste Real ativo. ${reason} Usando agenda dinamica com odds simuladas para validar operacao antes de conectar provider pago.`,
    diagnostics: getProviderDiagnostics(),
    games: [
      {
        externalId: "real-test-bra-001",
        sport: "Futebol",
        league: "Brasileirao Serie A",
        home: "Palmeiras",
        away: "Flamengo",
        startTime: daysFromNow(0, 20, 30),
        status: "scheduled",
        source: "real-test",
        odds: [
          { market: "Resultado final", selection: "Palmeiras", price: 2.28, bookmaker: "Simulacao Mercado" },
          { market: "Total de gols", selection: "+2.5 gols", price: 2.04, bookmaker: "Simulacao Mercado" },
          { market: "Cartoes", selection: "+4.5 cartoes", price: 1.74, bookmaker: "Simulacao Mercado" }
        ]
      },
      {
        externalId: "real-test-bra-002",
        sport: "Futebol",
        league: "Copa do Brasil",
        home: "Corinthians",
        away: "Santos",
        startTime: daysFromNow(1, 21, 0),
        status: "scheduled",
        source: "real-test",
        odds: [
          { market: "Resultado final", selection: "Corinthians", price: 1.96, bookmaker: "Simulacao Mercado" },
          { market: "Escanteios", selection: "+9.5 escanteios", price: 1.91, bookmaker: "Simulacao Mercado" },
          { market: "Ambas marcam", selection: "Sim", price: 2.12, bookmaker: "Simulacao Mercado" }
        ]
      },
      {
        externalId: "real-test-nba-001",
        sport: "Basquete",
        league: "NBA",
        home: "Lakers",
        away: "Celtics",
        startTime: daysFromNow(0, 23, 10),
        status: "scheduled",
        source: "real-test",
        odds: [
          { market: "Vencedor", selection: "Celtics", price: 1.88, bookmaker: "Simulacao Mercado" },
          { market: "Total de pontos", selection: "+221.5 pontos", price: 1.98, bookmaker: "Simulacao Mercado" },
          { market: "Handicap", selection: "Lakers +3.5", price: 1.92, bookmaker: "Simulacao Mercado" }
        ]
      },
      {
        externalId: "real-test-tennis-001",
        sport: "Tenis",
        league: "ATP Masters",
        home: "Alcaraz",
        away: "Sinner",
        startTime: daysFromNow(1, 11, 30),
        status: "scheduled",
        source: "real-test",
        odds: [
          { market: "Vencedor", selection: "Alcaraz", price: 1.82, bookmaker: "Simulacao Mercado" },
          { market: "Total de games", selection: "+22.5 games", price: 1.9, bookmaker: "Simulacao Mercado" },
          { market: "Tie-break", selection: "Sim", price: 2.5, bookmaker: "Simulacao Mercado" }
        ]
      }
    ]
  };
}

function normalizeOddsApiMarket(marketKey: string) {
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

async function fetchTheOddsApi(): Promise<UpcomingFeed | null> {
  const apiKey = process.env.THE_ODDS_API_KEY;
  if (!apiKey) return null;

  const regions = process.env.THE_ODDS_API_REGIONS ?? "us,eu";
  const markets = process.env.THE_ODDS_API_MARKETS ?? "h2h,totals,spreads";
  const params = new URLSearchParams({
    apiKey,
    regions,
    markets,
    oddsFormat: "decimal",
    dateFormat: "iso"
  });

  const response = await fetch(`${ODDS_API_BASE}/sports/upcoming/odds?${params.toString()}`, {
    cache: "no-store",
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    const details = await response.text();
    return fallbackFeed(friendlyOddsApiError(response.status, details));
  }

  const events = (await response.json()) as OddsApiEvent[];
  const games: UpcomingGame[] = events.map((event) => {
    const odds: UpcomingOdd[] =
      event.bookmakers?.flatMap((bookmaker) =>
        bookmaker.markets?.flatMap((market) =>
          market.outcomes?.map((outcome) => ({
            market: normalizeOddsApiMarket(market.key),
            selection: outcome.name,
            price: outcome.price,
            bookmaker: bookmaker.title
          })) ?? []
        ) ?? []
      ) ?? [];

    return {
      externalId: event.id,
      sport: event.sport_title ?? "Esporte",
      league: event.sport_title ?? "Proximos eventos",
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
    message: "Jogos futuros e odds carregados da internet via The Odds API.",
    games,
    diagnostics: getProviderDiagnostics()
  };
}

type SportsDbEvent = {
  idEvent: string;
  strSport?: string;
  strLeague?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  dateEvent?: string;
  strTime?: string;
};

async function fetchTheSportsDb(): Promise<UpcomingFeed | null> {
  const key = process.env.SPORTSDB_API_KEY;
  const leagueIds = asArray(process.env.SPORTSDB_LEAGUE_IDS, []);
  if (!key || leagueIds.length === 0) return null;

  const responses = await Promise.allSettled(
    leagueIds.map(async (leagueId) => {
      const response = await fetch(`${SPORTSDB_BASE}/${key}/eventsnextleague.php?id=${leagueId}`, {
        cache: "no-store",
        next: { revalidate: 0 }
      });
      if (!response.ok) return [];
      const payload = (await response.json()) as { events?: SportsDbEvent[] };
      return payload.events ?? [];
    })
  );

  const events = responses.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  if (events.length === 0) return null;

  return {
    source: "thesportsdb",
    fetchedAt: new Date().toISOString(),
    configured: true,
    message: "Jogos futuros carregados da internet via TheSportsDB. Odds exigem provider especifico como The Odds API.",
    games: events.map((event) => ({
      externalId: event.idEvent,
      sport: event.strSport ?? "Esporte",
      league: event.strLeague ?? "Liga",
      home: event.strHomeTeam ?? "Mandante",
      away: event.strAwayTeam ?? "Visitante",
      startTime: `${event.dateEvent ?? ""} ${event.strTime ?? ""}`.trim(),
      status: "scheduled",
      source: "thesportsdb",
      odds: []
    })),
    diagnostics: getProviderDiagnostics()
  };
}

export async function getUpcomingGames(): Promise<UpcomingFeed> {
  if (isDemoMode()) return demoUpcomingFeed();
  try {
    const oddsFeed = await fetchTheOddsApi();
    if (oddsFeed) return oddsFeed;

    const sportsDbFeed = await fetchTheSportsDb();
    if (sportsDbFeed) return sportsDbFeed;

    return fallbackFeed("Configure THE_ODDS_API_KEY para buscar jogos futuros com odds reais.");
  } catch (error) {
    const cause =
      error instanceof Error && "cause" in error && error.cause instanceof Error
        ? ` Causa: ${error.cause.message}`
        : "";
    return fallbackFeed(
      error instanceof Error ? `${error.message}.${cause}` : "Nao foi possivel buscar jogos futuros agora."
    );
  }
}
