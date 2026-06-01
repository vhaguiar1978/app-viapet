import { devigMultiway, type Quote } from "./devig";
import type { AnalysisInput, AnalysisResult, ConsensusRow, Insight, Limitation, TopPick } from "./types";

function collectH2H(input: AnalysisInput): Quote[] {
  const h2h: Quote[] = [];
  for (const book of input.bookmakers) {
    for (const market of book.markets) {
      if (market.key !== "h2h") continue;
      for (const outcome of market.outcomes) {
        h2h.push({ selection: outcome.name, price: outcome.price, bookmaker: book.title });
      }
    }
  }
  return h2h;
}

function bestPer(quotes: Quote[]): Map<string, Quote> {
  const m = new Map<string, Quote>();
  for (const q of quotes) {
    const c = m.get(q.selection);
    if (!c || q.price > c.price) m.set(q.selection, q);
  }
  return m;
}

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

export function analyzeTennis(input: AnalysisInput, isBestOfFive = false): AnalysisResult {
  const h2h = collectH2H(input);
  const h2hBest = bestPer(h2h);
  const h2hDevig = devigMultiway(h2hBest);
  const consensus: ConsensusRow[] = [];
  const insights: Insight[] = [];
  const limitations: Limitation[] = [];
  const narrative: string[] = [];
  const setsDistribution: Array<{ label: string; prob: number }> = [];

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

  if (homeRow && awayRow) {
    const setsNeeded = isBestOfFive ? 3 : 2;
    const setProbHome = Math.pow(homeRow.fairImplied, 1 / (setsNeeded === 2 ? 1.65 : 2.5));
    const setProbAway = 1 - setProbHome;

    let probStraightHome = 0;
    let probStraightAway = 0;
    let probDeciderHome = 0;
    let probDeciderAway = 0;

    if (setsNeeded === 2) {
      probStraightHome = setProbHome * setProbHome;
      probStraightAway = setProbAway * setProbAway;
      probDeciderHome = 2 * setProbHome * setProbAway * setProbHome;
      probDeciderAway = 2 * setProbHome * setProbAway * setProbAway;
    } else {
      probStraightHome = Math.pow(setProbHome, 3);
      probStraightAway = Math.pow(setProbAway, 3);
      const p4Home = 3 * setProbHome * setProbHome * setProbAway * setProbHome;
      const p4Away = 3 * setProbAway * setProbAway * setProbHome * setProbAway;
      const p5Home = 6 * Math.pow(setProbHome * setProbAway, 2) * setProbHome;
      const p5Away = 6 * Math.pow(setProbHome * setProbAway, 2) * setProbAway;
      probDeciderHome = p4Home + p5Home;
      probDeciderAway = p4Away + p5Away;
    }

    const probHomeWin = probStraightHome + probDeciderHome;
    const probAwayWin = probStraightAway + probDeciderAway;

    insights.push(
      { label: "Probabilidade por set (mandante)", value: pct(setProbHome) },
      { label: "Probabilidade por set (visitante)", value: pct(setProbAway) },
      {
        label: `Straight sets ${input.home}`,
        value: pct(probStraightHome),
        tone: probStraightHome >= 0.4 ? "positive" : "neutral"
      },
      {
        label: `Straight sets ${input.away}`,
        value: pct(probStraightAway)
      },
      {
        label: "Set decisivo",
        value: pct(1 - probStraightHome - probStraightAway),
        detail: isBestOfFive ? "Até 5 sets" : "Até 3 sets"
      },
      {
        label: "Probabilidade total mandante",
        value: pct(probHomeWin),
        detail: `Mercado: ${pct(homeRow.fairImplied)}`
      },
      {
        label: "Probabilidade total visitante",
        value: pct(probAwayWin),
        detail: `Mercado: ${pct(awayRow.fairImplied)}`
      }
    );

    if (isBestOfFive) {
      setsDistribution.push(
        { label: `${input.home} 3-0`, prob: probStraightHome },
        { label: `${input.home} 3-1`, prob: 3 * setProbHome * setProbHome * setProbAway * setProbHome },
        { label: `${input.home} 3-2`, prob: 6 * Math.pow(setProbHome * setProbAway, 2) * setProbHome },
        { label: `${input.away} 3-2`, prob: 6 * Math.pow(setProbHome * setProbAway, 2) * setProbAway },
        { label: `${input.away} 3-1`, prob: 3 * setProbAway * setProbAway * setProbHome * setProbAway },
        { label: `${input.away} 3-0`, prob: probStraightAway }
      );
    } else {
      setsDistribution.push(
        { label: `${input.home} 2-0`, prob: probStraightHome },
        { label: `${input.home} 2-1`, prob: probDeciderHome },
        { label: `${input.away} 2-1`, prob: probDeciderAway },
        { label: `${input.away} 2-0`, prob: probStraightAway }
      );
    }

    narrative.push(
      `O mercado dá ${pct(homeRow.fairImplied)} para ${input.home} e ${pct(awayRow.fairImplied)} para ${input.away}.`,
      `Derivando para set a set: cada set tem ${pct(setProbHome)} de chance para o mandante.`,
      `Straight sets do mandante: ${pct(probStraightHome)}. Straight sets do visitante: ${pct(probStraightAway)}. ${isBestOfFive ? "Até 5 sets" : "Até 3 sets"} no decisivo: ${pct(1 - probStraightHome - probStraightAway)}.`
    );
  } else {
    limitations.push({
      title: "Mercado de vencedor indisponível",
      reason: "Sem h2h não dá para derivar probabilidades por set."
    });
  }

  limitations.push(
    {
      title: "Quebras de saque · winners · erros não forçados",
      reason:
        "Estatísticas detalhadas de saque, fundo de quadra e por jogador exigem stats provider de tênis (Sportradar/Sportmonks). Sem isso o modelo opera só na prob. de vitória."
    },
    {
      title: "Superfície e head-to-head histórico",
      reason:
        "Saibro, grama, hard, indoor e o histórico direto entre os atletas mudam muito a probabilidade real. Esse refinamento depende de um provedor de estatísticas."
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
    sportFamily: "tennis",
    generatedAt: new Date().toISOString(),
    bookmakerCount: input.bookmakers.length,
    consensus,
    insights,
    setsDistribution,
    narrative,
    limitations,
    topPick
  };
}
