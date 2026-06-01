import type { ProviderDiagnostic, UpcomingFeed, UpcomingGame, UpcomingOdd } from "./types";
import { friendlyOddsApiError } from "./errors";
import { isDemoMode } from "@/lib/demo/config";
import { demoWorldCupFeed } from "@/lib/demo/fixtures";

const ODDS_API_BASE = "https://api.the-odds-api.com/v4";
const SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json";
const WORLD_CUP_SPORT_KEY = "soccer_fifa_world_cup";
const WORLD_CUP_LEAGUE_ID = "4429";

function dataMode() {
  return process.env.DATA_MODE ?? (process.env.REAL_TEST_MODE === "true" ? "real-test" : "demo");
}

export function getWorldCupDiagnostics(): ProviderDiagnostic[] {
  const mode = dataMode();
  return [
    {
      provider: "Data mode",
      status: mode === "real" ? "ready" : "disabled",
      message:
        mode === "real"
          ? "Modo real ativo para a Copa. Apenas dados reais."
          : mode === "real-test"
            ? "Modo teste real ativo. Mostra agenda dinâmica enquanto The Odds API ainda não devolve jogos da Copa."
            : "Modo demo. Use real para a Copa."
    },
    {
      provider: "The Odds API · Copa do Mundo",
      status: process.env.THE_ODDS_API_KEY ? "ready" : "missing-config",
      message: process.env.THE_ODDS_API_KEY
        ? `Buscando ${WORLD_CUP_SPORT_KEY} com odds reais.`
        : "Falta THE_ODDS_API_KEY para odds reais da Copa."
    },
    {
      provider: "TheSportsDB · Liga 4429 (FIFA World Cup)",
      status: process.env.SPORTSDB_API_KEY ? "ready" : "missing-config",
      message: process.env.SPORTSDB_API_KEY
        ? "Agenda alternativa por TheSportsDB ativa."
        : "Configure SPORTSDB_API_KEY para agenda da Copa via TheSportsDB."
    }
  ];
}

function normalizeMarket(marketKey: string) {
  const names: Record<string, string> = {
    h2h: "Resultado final",
    totals: "Total de gols",
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

async function fetchOddsApiWorldCup(): Promise<UpcomingFeed | null> {
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

  const response = await fetch(
    `${ODDS_API_BASE}/sports/${WORLD_CUP_SPORT_KEY}/odds?${params.toString()}`,
    { cache: "no-store", next: { revalidate: 0 } }
  );

  if (!response.ok) {
    const details = await response.text();
    return {
      source: "the-odds-api",
      fetchedAt: new Date().toISOString(),
      configured: true,
      message: friendlyOddsApiError(response.status, details),
      games: [],
      diagnostics: getWorldCupDiagnostics()
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
      sport: "Futebol",
      league: event.sport_title ?? "Copa do Mundo FIFA",
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
        ? `Copa do Mundo: ${games.length} jogos com odds reais via The Odds API.`
        : "The Odds API ainda não publicou jogos da Copa. Tentando TheSportsDB para agenda.",
    games,
    diagnostics: getWorldCupDiagnostics()
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

async function fetchSportsDbWorldCup(): Promise<UpcomingFeed | null> {
  const key = process.env.SPORTSDB_API_KEY;
  if (!key) return null;

  const response = await fetch(
    `${SPORTSDB_BASE}/${key}/eventsnextleague.php?id=${WORLD_CUP_LEAGUE_ID}`,
    { cache: "no-store", next: { revalidate: 0 } }
  );
  if (!response.ok) return null;

  const payload = (await response.json()) as { events?: SportsDbEvent[] };
  const events = payload.events ?? [];
  if (events.length === 0) return null;

  return {
    source: "thesportsdb",
    fetchedAt: new Date().toISOString(),
    configured: true,
    message: `Copa do Mundo: ${events.length} jogos via TheSportsDB. Odds reais exigem The Odds API.`,
    games: events.map((event) => ({
      externalId: event.idEvent,
      sport: "Futebol",
      league: event.strLeague ?? "FIFA World Cup",
      home: event.strHomeTeam ?? "Mandante",
      away: event.strAwayTeam ?? "Visitante",
      startTime: `${event.dateEvent ?? ""}${event.strTime ? `T${event.strTime}` : ""}`.trim(),
      status: "scheduled",
      source: "thesportsdb",
      odds: []
    })),
    diagnostics: getWorldCupDiagnostics()
  };
}

function daysFromNow(days: number, hour: number, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function realTestWorldCupFeed(reason: string): UpcomingFeed {
  return {
    source: "real-test",
    fetchedAt: new Date().toISOString(),
    configured: true,
    message: `Modo Teste Real. ${reason} Mostrando agenda fictícia da Copa 2026 para validar a tela.`,
    diagnostics: getWorldCupDiagnostics(),
    games: [
      {
        externalId: "wc-test-bra-mar",
        sport: "Futebol",
        league: "Copa do Mundo FIFA 2026 · Grupo C",
        home: "Brasil",
        away: "Marrocos",
        startTime: daysFromNow(2, 17, 0),
        status: "scheduled",
        source: "real-test",
        odds: [
          { market: "Resultado final", selection: "Brasil", price: 1.62, bookmaker: "Simulação Mercado" },
          { market: "Resultado final", selection: "Empate", price: 4.1, bookmaker: "Simulação Mercado" },
          { market: "Resultado final", selection: "Marrocos", price: 5.5, bookmaker: "Simulação Mercado" },
          { market: "Total de gols", selection: "+2.5 gols", price: 2.1, bookmaker: "Simulação Mercado" }
        ]
      },
      {
        externalId: "wc-test-arg-ned",
        sport: "Futebol",
        league: "Copa do Mundo FIFA 2026 · Grupo A",
        home: "Argentina",
        away: "Holanda",
        startTime: daysFromNow(3, 20, 0),
        status: "scheduled",
        source: "real-test",
        odds: [
          { market: "Resultado final", selection: "Argentina", price: 2.4, bookmaker: "Simulação Mercado" },
          { market: "Resultado final", selection: "Empate", price: 3.2, bookmaker: "Simulação Mercado" },
          { market: "Resultado final", selection: "Holanda", price: 2.9, bookmaker: "Simulação Mercado" },
          { market: "Ambas marcam", selection: "Sim", price: 1.78, bookmaker: "Simulação Mercado" }
        ]
      },
      {
        externalId: "wc-test-fra-ger",
        sport: "Futebol",
        league: "Copa do Mundo FIFA 2026 · Grupo D",
        home: "França",
        away: "Alemanha",
        startTime: daysFromNow(4, 16, 0),
        status: "scheduled",
        source: "real-test",
        odds: [
          { market: "Resultado final", selection: "França", price: 2.1, bookmaker: "Simulação Mercado" },
          { market: "Resultado final", selection: "Empate", price: 3.4, bookmaker: "Simulação Mercado" },
          { market: "Resultado final", selection: "Alemanha", price: 3.2, bookmaker: "Simulação Mercado" },
          { market: "Total de gols", selection: "+2.5 gols", price: 1.95, bookmaker: "Simulação Mercado" }
        ]
      },
      {
        externalId: "wc-test-por-uru",
        sport: "Futebol",
        league: "Copa do Mundo FIFA 2026 · Grupo E",
        home: "Portugal",
        away: "Uruguai",
        startTime: daysFromNow(5, 18, 0),
        status: "scheduled",
        source: "real-test",
        odds: [
          { market: "Resultado final", selection: "Portugal", price: 1.88, bookmaker: "Simulação Mercado" },
          { market: "Resultado final", selection: "Empate", price: 3.5, bookmaker: "Simulação Mercado" },
          { market: "Resultado final", selection: "Uruguai", price: 3.9, bookmaker: "Simulação Mercado" },
          { market: "Cartões", selection: "+4.5 cartões", price: 1.72, bookmaker: "Simulação Mercado" }
        ]
      }
    ]
  };
}

export async function getWorldCupGames(): Promise<UpcomingFeed> {
  if (isDemoMode()) return demoWorldCupFeed();
  const mode = dataMode();
  try {
    const odds = await fetchOddsApiWorldCup();
    if (odds && odds.games.length > 0) return odds;

    const sportsDb = await fetchSportsDbWorldCup();
    if (sportsDb && sportsDb.games.length > 0) return sportsDb;

    if (mode === "real-test") {
      return realTestWorldCupFeed("Provedores não devolveram jogos da Copa.");
    }

    return (
      odds ?? {
        source: "fallback",
        fetchedAt: new Date().toISOString(),
        configured: Boolean(process.env.THE_ODDS_API_KEY),
        message:
          "Nenhum provedor devolveu jogos da Copa neste momento. Os jogos aparecem aqui assim que o calendário oficial entra na The Odds API.",
        games: [],
        diagnostics: getWorldCupDiagnostics()
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao buscar jogos da Copa.";
    if (mode === "real-test") return realTestWorldCupFeed(message);
    return {
      source: "fallback",
      fetchedAt: new Date().toISOString(),
      configured: false,
      message,
      games: [],
      diagnostics: getWorldCupDiagnostics()
    };
  }
}

export const WORLD_CUP_KICKOFF = "2026-06-11T20:00:00-04:00";
