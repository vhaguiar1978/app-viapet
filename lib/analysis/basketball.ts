import { devigMultiway, type Quote } from "./devig";
import type { AnalysisInput, AnalysisResult, ConsensusRow, Insight, Limitation, TopPick } from "./types";

function collect(input: AnalysisInput) {
  const h2h: Quote[] = [];
  const totals = new Map<number, { over: Quote[]; under: Quote[] }>();
  const spreads = new Map<number, { home: Quote[]; away: Quote[] }>();

  for (const book of input.bookmakers) {
    for (const market of book.markets) {
      for (const outcome of market.outcomes) {
        if (market.key === "h2h") {
          h2h.push({ selection: outcome.name, price: outcome.price, bookmaker: book.title });
        } else if (market.key === "totals" && outcome.point !== undefined) {
          const slot = totals.get(outcome.point) ?? { over: [], under: [] };
          (/over/i.test(outcome.name) ? slot.over : slot.under).push({
            selection: outcome.name,
            price: outcome.price,
            bookmaker: book.title
          });
          totals.set(outcome.point, slot);
        } else if (market.key === "spreads" && outcome.point !== undefined) {
          const slot = spreads.get(Math.abs(outcome.point)) ?? { home: [], away: [] };
          const target = outcome.name === input.home ? slot.home : slot.away;
          target.push({ selection: outcome.name, price: outcome.price, bookmaker: book.title });
          spreads.set(Math.abs(outcome.point), slot);
        }
      }
    }
  }
  return { h2h, totals, spreads };
}

function bestPer(quotes: Quote[]): Map<string, Quote> {
  const m = new Map<string, Quote>();
  for (const q of quotes) {
    const c = m.get(q.selection);
    if (!c || q.price > c.price) m.set(q.selection, q);
  }
  return m;
}

function pickBalanced(map: Map<number, { over?: Quote[]; under?: Quote[]; home?: Quote[]; away?: Quote[] }>) {
  let bestKey: number | null = null;
  let bestDelta = Infinity;
  let pick: { over?: Quote; under?: Quote; home?: Quote; away?: Quote; key: number } | null = null;

  for (const [key, slot] of map.entries()) {
    const a = slot.over ?? slot.home ?? [];
    const b = slot.under ?? slot.away ?? [];
    if (a.length === 0 || b.length === 0) continue;
    const ba = [...a].sort((x, y) => y.price - x.price)[0];
    const bb = [...b].sort((x, y) => y.price - x.price)[0];
    const probA = 1 / ba.price / (1 / ba.price + 1 / bb.price);
    const delta = Math.abs(probA - 0.5);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestKey = key;
      pick = slot.over !== undefined
        ? { over: ba, under: bb, key }
        : { home: ba, away: bb, key };
    }
  }
  return pick;
}

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

export function analyzeBasketball(input: AnalysisInput): AnalysisResult {
  const { h2h, totals, spreads } = collect(input);
  const consensus: ConsensusRow[] = [];
  const insights: Insight[] = [];
  const limitations: Limitation[] = [];
  const narrative: string[] = [];
  const halves: Array<{ label: string; value: string; detail?: string }> = [];

  const h2hBest = bestPer(h2h);
  const h2hDevig = devigMultiway(h2hBest);
  const homeRow = h2hDevig.find((r) => r.selection === input.home);
  const awayRow = h2hDevig.find((r) => r.selection === input.away);

  for (const row of h2hDevig) {
    consensus.push({
      market: "Vencedor",
      selection: row.selection,
      fairProb: row.fairImplied,
      fairOdd: row.fairOdd,
      bestPrice: row.bestPrice,
      bestBookmaker: row.bestBookmaker,
      edgePct: row.edgePct
    });
  }

  const totalsPick = pickBalanced(totals);
  const spreadsPick = pickBalanced(spreads);

  let expectedTotal: number | null = null;
  let expectedMargin: number | null = null;
  let expectedHome: number | null = null;
  let expectedAway: number | null = null;

  if (totalsPick && totalsPick.over && totalsPick.under) {
    expectedTotal = totalsPick.key;
    consensus.push({
      market: `Total ${totalsPick.key}`,
      selection: "Mais de",
      fairProb: 1 / totalsPick.over.price / (1 / totalsPick.over.price + 1 / totalsPick.under.price),
      fairOdd: (1 / totalsPick.over.price + 1 / totalsPick.under.price) / (1 / totalsPick.over.price),
      bestPrice: totalsPick.over.price,
      bestBookmaker: totalsPick.over.bookmaker,
      edgePct: 0
    });
    consensus.push({
      market: `Total ${totalsPick.key}`,
      selection: "Menos de",
      fairProb: 1 / totalsPick.under.price / (1 / totalsPick.over.price + 1 / totalsPick.under.price),
      fairOdd: (1 / totalsPick.over.price + 1 / totalsPick.under.price) / (1 / totalsPick.under.price),
      bestPrice: totalsPick.under.price,
      bestBookmaker: totalsPick.under.bookmaker,
      edgePct: 0
    });
  } else {
    limitations.push({
      title: "Linha de total de pontos indisponível",
      reason: "Sem linha de O/U, expectativa de pontos não pode ser inferida."
    });
  }

  if (spreadsPick && spreadsPick.home && spreadsPick.away) {
    expectedMargin = spreadsPick.key;
    if (homeRow && awayRow) {
      const favorsHome = homeRow.fairImplied > awayRow.fairImplied;
      expectedMargin = favorsHome ? spreadsPick.key : -spreadsPick.key;
    }
  }

  if (expectedTotal !== null && expectedMargin !== null) {
    expectedHome = (expectedTotal + expectedMargin) / 2;
    expectedAway = (expectedTotal - expectedMargin) / 2;

    insights.push(
      { label: "Total esperado", value: `${expectedTotal.toFixed(1)} pts` },
      {
        label: `Pontos ${input.home}`,
        value: expectedHome.toFixed(1),
        detail: "Estimado a partir do handicap"
      },
      {
        label: `Pontos ${input.away}`,
        value: expectedAway.toFixed(1),
        detail: "Estimado a partir do handicap"
      },
      {
        label: "Margem esperada",
        value: `${expectedMargin > 0 ? "+" : ""}${expectedMargin.toFixed(1)} ${expectedMargin > 0 ? input.home : input.away}`
      }
    );

    const half = expectedTotal / 2;
    const homeHalf = expectedHome / 2;
    const awayHalf = expectedAway / 2;
    halves.push(
      { label: "1º tempo · total esperado", value: `${half.toFixed(1)} pts`, detail: "Aprox. 50% do total" },
      { label: "1º tempo · mandante", value: homeHalf.toFixed(1) },
      { label: "1º tempo · visitante", value: awayHalf.toFixed(1) },
      { label: "2º tempo · total esperado", value: `${half.toFixed(1)} pts`, detail: "Aprox. 50% do total" }
    );

    narrative.push(
      `O mercado projeta total de ${expectedTotal.toFixed(1)} pontos com margem de ${Math.abs(expectedMargin).toFixed(1)} a favor de ${expectedMargin > 0 ? input.home : input.away}.`,
      `Distribuído pelo handicap: ${input.home} cerca de ${expectedHome.toFixed(1)} pontos e ${input.away} cerca de ${expectedAway.toFixed(1)}.`,
      `Aproximação por tempo (50/50): cada metade fica em torno de ${half.toFixed(1)} pontos.`
    );
  }

  if (homeRow && awayRow) {
    insights.unshift({
      label: "Vencedor (modelo)",
      value: pct(Math.max(homeRow.fairImplied, awayRow.fairImplied)),
      detail: homeRow.fairImplied > awayRow.fairImplied ? input.home : input.away
    });
  }

  limitations.push(
    {
      title: "Pontos por jogador · rebotes · 3 pontos",
      reason:
        "Estatísticas individuais (Lebron, Curry, etc.) e mercados como player props exigem stats provider como NBA Stats API ou Sportradar. Sem isso o modelo opera apenas no nível de time."
    },
    {
      title: "Quartos individuais (Q1, Q2, Q3, Q4)",
      reason:
        "A Odds API plano padrão não retorna mercados de quarto. Aprox. uniforme (25% por quarto) é só estimativa grosseira."
    }
  );

  let topPick: TopPick | undefined;
  if (h2hDevig.length > 0) {
    const ranked = [...h2hDevig].sort((a, b) => b.fairImplied - a.fairImplied)[0];
    topPick = {
      label: ranked.selection,
      side: ranked.selection === input.home ? "home" : ranked.selection === input.away ? "away" : "other",
      fairProb: ranked.fairImplied,
      bestPrice: ranked.bestPrice,
      bestBookmaker: ranked.bestBookmaker,
      edgePct: ranked.edgePct
    };
  }

  return {
    sportFamily: "basketball",
    generatedAt: new Date().toISOString(),
    bookmakerCount: input.bookmakers.length,
    consensus,
    insights,
    halves,
    narrative,
    limitations,
    topPick
  };
}
