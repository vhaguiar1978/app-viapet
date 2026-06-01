import type { EventOdds } from "../providers/leagues";
import { demoLeagueGames } from "./fixtures";
import { demoWorldCupFeed } from "./fixtures";

function normalizeMarketLabel(key: string) {
  const names: Record<string, string> = {
    h2h: "Resultado final",
    totals: "Total de pontos/gols",
    spreads: "Handicap"
  };
  return names[key] ?? key;
}

export function demoEventOdds(sportKey: string, eventId: string): EventOdds | null {
  const pool = sportKey === "soccer_fifa_world_cup"
    ? demoWorldCupFeed().games
    : demoLeagueGames(sportKey);
  const game = pool.find((g) => g.externalId === eventId);
  if (!game) return null;

  const byBookmaker = new Map<string, { title: string; markets: Map<string, { key: string; label: string; outcomes: Array<{ name: string; price: number; point?: number }> }> }>();

  for (const odd of game.odds) {
    const marketKey = odd.market === "Resultado final" ? "h2h" : odd.market.includes("Total") ? "totals" : "spreads";
    const bookEntry = byBookmaker.get(odd.bookmaker) ?? {
      title: odd.bookmaker,
      markets: new Map()
    };
    const marketEntry = bookEntry.markets.get(marketKey) ?? {
      key: marketKey,
      label: normalizeMarketLabel(marketKey),
      outcomes: []
    };
    let point: number | undefined;
    let name = odd.selection;
    if (marketKey === "totals") {
      const match = odd.selection.match(/(Over|Under)\s+(\d+\.?\d*)/);
      if (match) {
        name = match[1];
        point = parseFloat(match[2]);
      }
    }
    marketEntry.outcomes.push({ name, price: odd.price, point });
    bookEntry.markets.set(marketKey, marketEntry);
    byBookmaker.set(odd.bookmaker, bookEntry);
  }

  const bookmakers = Array.from(byBookmaker.values()).map((b) => ({
    title: b.title,
    markets: Array.from(b.markets.values())
  }));

  return {
    externalId: game.externalId,
    sport: game.sport,
    league: game.league,
    home: game.home,
    away: game.away,
    startTime: game.startTime,
    bookmakers
  };
}
