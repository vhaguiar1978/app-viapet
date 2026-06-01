import type { UpcomingFeed, UpcomingGame } from "../providers/types";
import { daysFromNow, DEMO_BOOKMAKERS } from "./config";

function spreadOdds(base: number, n = DEMO_BOOKMAKERS.length): Array<{ bookmaker: string; price: number }> {
  return DEMO_BOOKMAKERS.slice(0, n).map((bk, i) => ({
    bookmaker: bk,
    price: parseFloat((base + (i - n / 2) * 0.04 + (Math.random() - 0.5) * 0.02).toFixed(2))
  }));
}

function h2hOdds(home: string, away: string, pHome: number, pDraw: number): Array<{
  market: string;
  selection: string;
  price: number;
  bookmaker: string;
}> {
  const pAway = 1 - pHome - pDraw;
  const margin = 1.05;
  const baseHome = margin / pHome;
  const baseDraw = margin / pDraw;
  const baseAway = margin / pAway;
  const arr: Array<{ market: string; selection: string; price: number; bookmaker: string }> = [];
  for (const { bookmaker, price } of spreadOdds(baseHome)) {
    arr.push({ market: "Resultado final", selection: home, price, bookmaker });
  }
  for (const { bookmaker, price } of spreadOdds(baseDraw)) {
    arr.push({ market: "Resultado final", selection: "Draw", price, bookmaker });
  }
  for (const { bookmaker, price } of spreadOdds(baseAway)) {
    arr.push({ market: "Resultado final", selection: away, price, bookmaker });
  }
  return arr;
}

function totalsOdds(line: number, pOver: number): Array<{
  market: string;
  selection: string;
  price: number;
  bookmaker: string;
}> {
  const margin = 1.05;
  const baseOver = margin / pOver;
  const baseUnder = margin / (1 - pOver);
  const arr: Array<{ market: string; selection: string; price: number; bookmaker: string }> = [];
  for (const { bookmaker, price } of spreadOdds(baseOver)) {
    arr.push({ market: "Total de gols", selection: `Over ${line}`, price, bookmaker });
  }
  for (const { bookmaker, price } of spreadOdds(baseUnder)) {
    arr.push({ market: "Total de gols", selection: `Under ${line}`, price, bookmaker });
  }
  return arr;
}

function makeSoccerGame(
  externalId: string,
  league: string,
  home: string,
  away: string,
  startTime: string,
  pHome: number,
  pDraw: number,
  goalsLine: number,
  pOver: number
): UpcomingGame {
  return {
    externalId,
    sport: "Futebol",
    league,
    home,
    away,
    startTime,
    status: "scheduled",
    source: "the-odds-api",
    odds: [...h2hOdds(home, away, pHome, pDraw), ...totalsOdds(goalsLine, pOver)]
  };
}

function makeBasketballGame(
  externalId: string,
  league: string,
  home: string,
  away: string,
  startTime: string,
  pHome: number,
  pointsLine: number,
  pOver: number
): UpcomingGame {
  const arr: Array<{ market: string; selection: string; price: number; bookmaker: string }> = [];
  for (const { bookmaker, price } of spreadOdds(1.05 / pHome)) {
    arr.push({ market: "Resultado final", selection: home, price, bookmaker });
  }
  for (const { bookmaker, price } of spreadOdds(1.05 / (1 - pHome))) {
    arr.push({ market: "Resultado final", selection: away, price, bookmaker });
  }
  for (const { bookmaker, price } of spreadOdds(1.05 / pOver)) {
    arr.push({ market: "Total de pontos/gols", selection: `Over ${pointsLine}`, price, bookmaker });
  }
  for (const { bookmaker, price } of spreadOdds(1.05 / (1 - pOver))) {
    arr.push({ market: "Total de pontos/gols", selection: `Under ${pointsLine}`, price, bookmaker });
  }
  return {
    externalId,
    sport: "Basquete",
    league,
    home,
    away,
    startTime,
    status: "scheduled",
    source: "the-odds-api",
    odds: arr
  };
}

function makeTennisGame(externalId: string, league: string, home: string, away: string, startTime: string, pHome: number): UpcomingGame {
  const arr: Array<{ market: string; selection: string; price: number; bookmaker: string }> = [];
  for (const { bookmaker, price } of spreadOdds(1.05 / pHome)) {
    arr.push({ market: "Resultado final", selection: home, price, bookmaker });
  }
  for (const { bookmaker, price } of spreadOdds(1.05 / (1 - pHome))) {
    arr.push({ market: "Resultado final", selection: away, price, bookmaker });
  }
  return { externalId, sport: "Tênis", league, home, away, startTime, status: "scheduled", source: "the-odds-api", odds: arr };
}

function makeMmaGame(externalId: string, league: string, home: string, away: string, startTime: string, pHome: number): UpcomingGame {
  const arr: Array<{ market: string; selection: string; price: number; bookmaker: string }> = [];
  for (const { bookmaker, price } of spreadOdds(1.05 / pHome)) {
    arr.push({ market: "Resultado final", selection: home, price, bookmaker });
  }
  for (const { bookmaker, price } of spreadOdds(1.05 / (1 - pHome))) {
    arr.push({ market: "Resultado final", selection: away, price, bookmaker });
  }
  return { externalId, sport: "MMA", league, home, away, startTime, status: "scheduled", source: "the-odds-api", odds: arr };
}

export function demoWorldCupFeed(): UpcomingFeed {
  const games: UpcomingGame[] = [
    makeSoccerGame("demo-wc-01", "FIFA World Cup · Grupo A", "Mexico", "South Africa", daysFromNow(14, 23, 0), 0.55, 0.25, 2.5, 0.58),
    makeSoccerGame("demo-wc-02", "FIFA World Cup · Grupo C", "Brasil", "Marrocos", daysFromNow(15, 20, 0), 0.62, 0.22, 2.5, 0.6),
    makeSoccerGame("demo-wc-03", "FIFA World Cup · Grupo A", "Argentina", "Holanda", daysFromNow(16, 22, 30), 0.42, 0.28, 2.5, 0.55),
    makeSoccerGame("demo-wc-04", "FIFA World Cup · Grupo D", "França", "Alemanha", daysFromNow(17, 19, 0), 0.48, 0.27, 2.5, 0.62),
    makeSoccerGame("demo-wc-05", "FIFA World Cup · Grupo E", "Portugal", "Uruguai", daysFromNow(18, 21, 0), 0.53, 0.26, 2.5, 0.51),
    makeSoccerGame("demo-wc-06", "FIFA World Cup · Grupo F", "Espanha", "Bélgica", daysFromNow(19, 18, 30), 0.58, 0.23, 2.5, 0.59),
    makeSoccerGame("demo-wc-07", "FIFA World Cup · Grupo G", "Inglaterra", "Croácia", daysFromNow(20, 20, 0), 0.5, 0.27, 2.5, 0.56),
    makeSoccerGame("demo-wc-08", "FIFA World Cup · Grupo H", "Itália", "Colômbia", daysFromNow(21, 22, 0), 0.46, 0.28, 2.5, 0.53)
  ];
  return {
    source: "the-odds-api",
    fetchedAt: new Date().toISOString(),
    configured: true,
    message: `[DEMO] Copa do Mundo 2026: ${games.length} jogos com odds fictícias para teste do sistema.`,
    games,
    diagnostics: [
      { provider: "Modo Demo", status: "ready", message: "Dados simulados para desenvolvimento. DEMO_MODE=true." }
    ]
  };
}

export function demoLeagueGames(sportKey: string): UpcomingGame[] {
  if (sportKey === "soccer_brazil_campeonato") {
    return [
      makeSoccerGame("demo-bra-01", "Brasileirão Série A", "Flamengo", "Palmeiras", daysFromNow(2, 19, 0), 0.42, 0.28, 2.5, 0.55),
      makeSoccerGame("demo-bra-02", "Brasileirão Série A", "Corinthians", "São Paulo", daysFromNow(3, 21, 30), 0.45, 0.28, 2.5, 0.49),
      makeSoccerGame("demo-bra-03", "Brasileirão Série A", "Santos", "Botafogo", daysFromNow(4, 19, 0), 0.38, 0.29, 2.5, 0.52),
      makeSoccerGame("demo-bra-04", "Brasileirão Série A", "Atlético-MG", "Grêmio", daysFromNow(5, 20, 0), 0.5, 0.27, 2.5, 0.56),
      makeSoccerGame("demo-bra-05", "Brasileirão Série A", "Internacional", "Cruzeiro", daysFromNow(6, 18, 30), 0.48, 0.27, 2.5, 0.53),
      makeSoccerGame("demo-bra-06", "Brasileirão Série A", "Vasco", "Fluminense", daysFromNow(7, 19, 0), 0.36, 0.3, 2.5, 0.5)
    ];
  }
  if (sportKey === "soccer_epl") {
    return [
      makeSoccerGame("demo-epl-01", "Premier League", "Manchester City", "Arsenal", daysFromNow(2, 16, 30), 0.5, 0.25, 2.5, 0.6),
      makeSoccerGame("demo-epl-02", "Premier League", "Liverpool", "Tottenham", daysFromNow(3, 14, 0), 0.55, 0.23, 2.5, 0.62),
      makeSoccerGame("demo-epl-03", "Premier League", "Chelsea", "Newcastle", daysFromNow(4, 16, 30), 0.48, 0.27, 2.5, 0.58),
      makeSoccerGame("demo-epl-04", "Premier League", "Manchester United", "Aston Villa", daysFromNow(5, 14, 0), 0.46, 0.28, 2.5, 0.55)
    ];
  }
  if (sportKey === "soccer_uefa_champs_league") {
    return [
      makeSoccerGame("demo-ucl-01", "Champions League", "Real Madrid", "Bayern Munich", daysFromNow(8, 21, 0), 0.42, 0.28, 2.5, 0.6),
      makeSoccerGame("demo-ucl-02", "Champions League", "Manchester City", "PSG", daysFromNow(9, 21, 0), 0.51, 0.25, 2.5, 0.62),
      makeSoccerGame("demo-ucl-03", "Champions League", "Inter Milan", "Borussia Dortmund", daysFromNow(10, 21, 0), 0.45, 0.27, 2.5, 0.56)
    ];
  }
  if (sportKey === "basketball_nba") {
    return [
      makeBasketballGame("demo-nba-01", "NBA", "Los Angeles Lakers", "Boston Celtics", daysFromNow(1, 23, 30), 0.42, 224.5, 0.52),
      makeBasketballGame("demo-nba-02", "NBA", "Golden State Warriors", "Brooklyn Nets", daysFromNow(2, 23, 0), 0.58, 232.5, 0.51),
      makeBasketballGame("demo-nba-03", "NBA", "Miami Heat", "New York Knicks", daysFromNow(2, 0, 30), 0.46, 215.5, 0.5),
      makeBasketballGame("demo-nba-04", "NBA", "Denver Nuggets", "Phoenix Suns", daysFromNow(3, 3, 0), 0.62, 228.5, 0.53),
      makeBasketballGame("demo-nba-05", "NBA", "Milwaukee Bucks", "Philadelphia 76ers", daysFromNow(3, 0, 30), 0.55, 226.5, 0.51)
    ];
  }
  if (sportKey.startsWith("tennis_")) {
    return [
      makeTennisGame("demo-ten-01", "ATP Masters", "Carlos Alcaraz", "Jannik Sinner", daysFromNow(2, 14, 0), 0.52),
      makeTennisGame("demo-ten-02", "ATP Masters", "Novak Djokovic", "Daniil Medvedev", daysFromNow(3, 11, 30), 0.6),
      makeTennisGame("demo-ten-03", "WTA 1000", "Iga Swiatek", "Aryna Sabalenka", daysFromNow(4, 15, 0), 0.55)
    ];
  }
  if (sportKey.startsWith("mma_")) {
    return [
      makeMmaGame("demo-ufc-01", "UFC 305", "Islam Makhachev", "Charles Oliveira", daysFromNow(5, 1, 0), 0.62),
      makeMmaGame("demo-ufc-02", "UFC 305", "Alex Pereira", "Jiri Prochazka", daysFromNow(5, 2, 0), 0.55),
      makeMmaGame("demo-ufc-03", "UFC Fight Night", "Sean O'Malley", "Merab Dvalishvili", daysFromNow(6, 1, 0), 0.48)
    ];
  }
  return [];
}

export function demoUpcomingFeed(): UpcomingFeed {
  const games = [
    ...demoLeagueGames("soccer_brazil_campeonato").slice(0, 3),
    ...demoLeagueGames("basketball_nba").slice(0, 2),
    ...demoLeagueGames("soccer_uefa_champs_league").slice(0, 2)
  ];
  return {
    source: "the-odds-api",
    fetchedAt: new Date().toISOString(),
    configured: true,
    message: `[DEMO] ${games.length} próximos jogos com odds fictícias.`,
    games,
    diagnostics: [
      { provider: "Modo Demo", status: "ready", message: "Dados simulados para desenvolvimento." }
    ]
  };
}
