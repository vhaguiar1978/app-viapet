import { devigMultiway, deriveTotalsLambda, poissonPmf, type Quote } from "./devig";
import type { AnalysisInput, AnalysisResult, ConsensusRow, Insight, Limitation, ScorelineCell, TopPick } from "./types";

function collectQuotes(input: AnalysisInput) {
  const h2h: Quote[] = [];
  const totalsByPoint = new Map<number, { over: Quote[]; under: Quote[] }>();
  const spreadsByPoint = new Map<number, { home: Quote[]; away: Quote[] }>();

  for (const book of input.bookmakers) {
    for (const market of book.markets) {
      for (const outcome of market.outcomes) {
        if (market.key === "h2h") {
          h2h.push({ selection: outcome.name, price: outcome.price, bookmaker: book.title });
        } else if (market.key === "totals" && outcome.point !== undefined) {
          const slot = totalsByPoint.get(outcome.point) ?? { over: [], under: [] };
          const target = /over/i.test(outcome.name) ? slot.over : slot.under;
          target.push({ selection: outcome.name, price: outcome.price, bookmaker: book.title });
          totalsByPoint.set(outcome.point, slot);
        } else if (market.key === "spreads" && outcome.point !== undefined) {
          const slot = spreadsByPoint.get(Math.abs(outcome.point)) ?? { home: [], away: [] };
          if (outcome.name === input.home) slot.home.push({ selection: outcome.name, price: outcome.price, bookmaker: book.title });
          else slot.away.push({ selection: outcome.name, price: outcome.price, bookmaker: book.title });
          spreadsByPoint.set(Math.abs(outcome.point), slot);
        }
      }
    }
  }

  return { h2h, totalsByPoint, spreadsByPoint };
}

function bestByName(quotes: Quote[]): Map<string, Quote> {
  const best = new Map<string, Quote>();
  for (const q of quotes) {
    const cur = best.get(q.selection);
    if (!cur || q.price > cur.price) best.set(q.selection, q);
  }
  return best;
}

function pickBalancedTotals(totalsByPoint: Map<number, { over: Quote[]; under: Quote[] }>) {
  let bestPoint: number | null = null;
  let bestImbalance = Infinity;
  let bestOver: Quote | null = null;
  let bestUnder: Quote | null = null;
  for (const [point, slot] of totalsByPoint.entries()) {
    if (slot.over.length === 0 || slot.under.length === 0) continue;
    const overBest = [...slot.over].sort((a, b) => b.price - a.price)[0];
    const underBest = [...slot.under].sort((a, b) => b.price - a.price)[0];
    const probOver = 1 / overBest.price / (1 / overBest.price + 1 / underBest.price);
    const imbalance = Math.abs(probOver - 0.5);
    if (imbalance < bestImbalance) {
      bestImbalance = imbalance;
      bestPoint = point;
      bestOver = overBest;
      bestUnder = underBest;
    }
  }
  return bestPoint !== null && bestOver && bestUnder ? { point: bestPoint, over: bestOver, under: bestUnder } : null;
}

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function analyzeSoccer(input: AnalysisInput): AnalysisResult {
  const { h2h, totalsByPoint } = collectQuotes(input);
  const consensus: ConsensusRow[] = [];
  const insights: Insight[] = [];
  const limitations: Limitation[] = [];
  const narrative: string[] = [];

  const h2hBest = bestByName(h2h);
  const h2hDevig = devigMultiway(h2hBest);

  const homeRow = h2hDevig.find((r) => r.selection === input.home);
  const awayRow = h2hDevig.find((r) => r.selection === input.away);
  const drawRow = h2hDevig.find((r) => /draw|empate/i.test(r.selection));

  if (h2hDevig.length > 0) {
    for (const row of h2hDevig) {
      consensus.push({
        market: "Resultado final",
        selection: row.selection,
        fairProb: row.fairImplied,
        fairOdd: row.fairOdd,
        bestPrice: row.bestPrice,
        bestBookmaker: row.bestBookmaker,
        edgePct: row.edgePct
      });
    }
  } else {
    limitations.push({
      title: "Mercado 1X2 indisponível",
      reason: "Nenhuma casa cotou o resultado final neste momento."
    });
  }

  let lambdaTotal: number | null = null;
  let lambdaHome: number | null = null;
  let lambdaAway: number | null = null;

  const totals = pickBalancedTotals(totalsByPoint);
  if (totals) {
    lambdaTotal = deriveTotalsLambda(totals.point, totals.over.price, totals.under.price);

    const probHome = homeRow?.fairImplied ?? 0.4;
    const probAway = awayRow?.fairImplied ?? 0.35;
    const probDraw = drawRow?.fairImplied ?? Math.max(0, 1 - probHome - probAway);
    const homeShare = (probHome + probDraw * 0.5) / (probHome + probAway + probDraw);
    lambdaHome = lambdaTotal * Math.max(0.1, Math.min(0.9, homeShare));
    lambdaAway = lambdaTotal - lambdaHome;

    consensus.push({
      market: `Total ${totals.point}`,
      selection: "Mais de",
      fairProb: 1 / totals.over.price / (1 / totals.over.price + 1 / totals.under.price),
      fairOdd:
        (1 / totals.over.price + 1 / totals.under.price) / (1 / totals.over.price),
      bestPrice: totals.over.price,
      bestBookmaker: totals.over.bookmaker,
      edgePct: 0
    });
    consensus.push({
      market: `Total ${totals.point}`,
      selection: "Menos de",
      fairProb: 1 / totals.under.price / (1 / totals.over.price + 1 / totals.under.price),
      fairOdd:
        (1 / totals.over.price + 1 / totals.under.price) / (1 / totals.under.price),
      bestPrice: totals.under.price,
      bestBookmaker: totals.under.bookmaker,
      edgePct: 0
    });
  } else {
    limitations.push({
      title: "Mercado de gols (Over/Under) indisponível",
      reason: "Sem linha de gols nenhuma estimativa de placar pode ser construída."
    });
  }

  const scorelineGrid: ScorelineCell[] = [];
  let topScorelines: Array<{ score: string; prob: number }> = [];

  if (lambdaTotal !== null && lambdaHome !== null && lambdaAway !== null) {
    const MAX = 6;
    let probBtts = 0;
    let probCleanSheetHome = 0;
    let probCleanSheetAway = 0;
    let probHomeWin = 0;
    let probDraw = 0;
    let probAwayWin = 0;
    let probOver15 = 0;
    let probOver25 = 0;
    let probOver35 = 0;

    for (let h = 0; h <= MAX; h++) {
      for (let a = 0; a <= MAX; a++) {
        const p = poissonPmf(lambdaHome, h) * poissonPmf(lambdaAway, a);
        scorelineGrid.push({ home: h, away: a, prob: p });
        if (h > 0 && a > 0) probBtts += p;
        if (a === 0) probCleanSheetHome += p;
        if (h === 0) probCleanSheetAway += p;
        if (h > a) probHomeWin += p;
        else if (h === a) probDraw += p;
        else probAwayWin += p;
        if (h + a >= 2) probOver15 += p;
        if (h + a >= 3) probOver25 += p;
        if (h + a >= 4) probOver35 += p;
      }
    }

    topScorelines = [...scorelineGrid]
      .sort((a, b) => b.prob - a.prob)
      .slice(0, 8)
      .map((c) => ({ score: `${c.home}-${c.away}`, prob: c.prob }));

    insights.push(
      {
        label: "Total esperado (λ)",
        value: lambdaTotal.toFixed(2),
        detail: `Distribuição: ${lambdaHome.toFixed(2)} ${input.home} + ${lambdaAway.toFixed(2)} ${input.away}`
      },
      {
        label: "Vitória do mandante",
        value: pct(probHomeWin),
        detail: homeRow ? `Mercado: ${pct(homeRow.fairImplied)}` : undefined,
        tone: homeRow && Math.abs(probHomeWin - homeRow.fairImplied) > 0.05 ? "warning" : "positive"
      },
      {
        label: "Empate",
        value: pct(probDraw),
        detail: drawRow ? `Mercado: ${pct(drawRow.fairImplied)}` : undefined
      },
      {
        label: "Vitória do visitante",
        value: pct(probAwayWin),
        detail: awayRow ? `Mercado: ${pct(awayRow.fairImplied)}` : undefined
      },
      {
        label: "Ambas marcam (BTTS)",
        value: pct(probBtts),
        tone: probBtts >= 0.55 ? "positive" : "neutral"
      },
      {
        label: "Clean sheet mandante",
        value: pct(probCleanSheetHome),
        detail: `${input.home} sem sofrer gol`
      },
      {
        label: "Clean sheet visitante",
        value: pct(probCleanSheetAway),
        detail: `${input.away} sem sofrer gol`
      },
      {
        label: "Over 1.5 gols",
        value: pct(probOver15)
      },
      {
        label: "Over 2.5 gols",
        value: pct(probOver25)
      },
      {
        label: "Over 3.5 gols",
        value: pct(probOver35)
      }
    );

    narrative.push(
      `O mercado precifica ${lambdaTotal.toFixed(2)} gols esperados, com ${lambdaHome.toFixed(2)} para ${input.home} e ${lambdaAway.toFixed(2)} para ${input.away}.`,
      `O modelo Poisson distribui essa expectativa entre os placares e estima ${pct(probHomeWin)} para vitória do mandante, ${pct(probDraw)} para empate e ${pct(probAwayWin)} para o visitante.`,
      `Ambas marcam aparece em ${pct(probBtts)} dos cenários, com clean sheet do mandante em ${pct(probCleanSheetHome)} e do visitante em ${pct(probCleanSheetAway)}.`
    );

    if (topScorelines[0]) {
      narrative.push(
        `O placar mais provável segundo o modelo é ${topScorelines[0].score} (${pct(topScorelines[0].prob)}), seguido de ${topScorelines[1]?.score ?? "—"} (${topScorelines[1] ? pct(topScorelines[1].prob) : "—"}).`
      );
    }
  } else {
    narrative.push(
      "Sem linha de gols disponível, o modelo Poisson não pode estimar distribuição de placares. Apenas o mercado de resultado final é exibido."
    );
  }

  limitations.push(
    {
      title: "Escanteios por tempo · cartões · chutes a gol",
      reason:
        "Esses mercados não estão na sua chave da The Odds API (precisam do plano Pro ou de um stats provider como API-Football/Sportmonks). Quando esse provedor for plugado, esta seção mostra média histórica do time, projeção por tempo e probabilidade por jogador."
    },
    {
      title: "Escalações e atletas confirmados",
      reason:
        "Lineups, lesionados e suspensos exigem um stats provider dedicado. Sem isso o modelo trata os times como entidades agregadas."
    }
  );

  let topPick: TopPick | undefined;
  if (h2hDevig.length > 0) {
    const ranked = [...h2hDevig].sort((a, b) => b.fairImplied - a.fairImplied)[0];
    let side: TopPick["side"] = "other";
    if (ranked.selection === input.home) side = "home";
    else if (ranked.selection === input.away) side = "away";
    else if (/draw|empate/i.test(ranked.selection)) side = "draw";
    topPick = {
      label: ranked.selection,
      side,
      fairProb: ranked.fairImplied,
      bestPrice: ranked.bestPrice,
      bestBookmaker: ranked.bestBookmaker,
      edgePct: ranked.edgePct
    };
  }

  return {
    sportFamily: "soccer",
    generatedAt: new Date().toISOString(),
    bookmakerCount: input.bookmakers.length,
    consensus,
    insights,
    scorelineGrid,
    topScorelines,
    narrative,
    limitations,
    topPick
  };
}
