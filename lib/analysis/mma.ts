import { devigMultiway, type Quote } from "./devig";
import type { AnalysisInput, AnalysisResult, ConsensusRow, Insight, Limitation, TopPick } from "./types";

function collect(input: AnalysisInput) {
  const h2h: Quote[] = [];
  const method: Quote[] = [];
  const rounds: Quote[] = [];

  for (const book of input.bookmakers) {
    for (const market of book.markets) {
      for (const outcome of market.outcomes) {
        if (market.key === "h2h") {
          h2h.push({ selection: outcome.name, price: outcome.price, bookmaker: book.title });
        } else if (/method|finish/i.test(market.key)) {
          method.push({
            selection: `${outcome.name}${outcome.point !== undefined ? ` ${outcome.point}` : ""}`,
            price: outcome.price,
            bookmaker: book.title
          });
        } else if (/round|totals/i.test(market.key) && outcome.point !== undefined) {
          rounds.push({
            selection: `${outcome.name} ${outcome.point}`,
            price: outcome.price,
            bookmaker: book.title
          });
        }
      }
    }
  }
  return { h2h, method, rounds };
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

export function analyzeMma(input: AnalysisInput): AnalysisResult {
  const { h2h, method, rounds } = collect(input);
  const consensus: ConsensusRow[] = [];
  const insights: Insight[] = [];
  const limitations: Limitation[] = [];
  const narrative: string[] = [];

  const h2hDevig = devigMultiway(bestPer(h2h));
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
    const favored = homeRow.fairImplied > awayRow.fairImplied ? input.home : input.away;
    const favoredProb = Math.max(homeRow.fairImplied, awayRow.fairImplied);
    insights.push(
      { label: "Vencedor (mercado)", value: pct(homeRow.fairImplied), detail: input.home },
      { label: "Vencedor (mercado)", value: pct(awayRow.fairImplied), detail: input.away },
      {
        label: "Favoritismo claro?",
        value: favoredProb >= 0.65 ? "Sim" : "Não",
        detail: `${favored} com ${pct(favoredProb)}`,
        tone: favoredProb >= 0.65 ? "positive" : "neutral"
      }
    );
    narrative.push(
      `O mercado projeta ${pct(homeRow.fairImplied)} para ${input.home} e ${pct(awayRow.fairImplied)} para ${input.away}.`,
      favoredProb >= 0.65
        ? `${favored} é favorito claro nesta luta segundo o consenso das casas.`
        : "A luta é considerada equilibrada pelo mercado — sem favorito dominante."
    );
  } else {
    limitations.push({
      title: "Mercado de vencedor indisponível",
      reason: "Sem h2h não dá para gerar análise."
    });
  }

  if (method.length > 0) {
    const methodDevig = devigMultiway(bestPer(method));
    for (const row of methodDevig) {
      consensus.push({
        market: "Método de vitória",
        selection: row.selection,
        fairProb: row.fairImplied,
        fairOdd: row.fairOdd,
        bestPrice: row.bestPrice,
        bestBookmaker: row.bestBookmaker,
        edgePct: row.edgePct
      });
    }
    narrative.push(
      `Mercado de método disponível: ${methodDevig.length} caminhos cotados.`
    );
  } else {
    limitations.push({
      title: "Método de vitória (KO/TKO/Submissão/Decisão)",
      reason:
        "Sua chave da The Odds API não cobre o mercado de método para este evento. Algumas lutas ou plataformas premium expõem esse mercado."
    });
  }

  if (rounds.length > 0) {
    const roundsDevig = devigMultiway(bestPer(rounds));
    for (const row of roundsDevig) {
      consensus.push({
        market: "Rounds",
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
      title: "Distância da luta (rounds)",
      reason:
        "Sem mercado de total de rounds, não dá para estimar se a luta vai longe ou termina cedo."
    });
  }

  limitations.push(
    {
      title: "Histórico do lutador, alcance, idade, peso, estilo",
      reason:
        "Essas variáveis são determinantes em MMA e exigem stats provider especializado (UFC Stats, Tapology, Sportradar MMA). Sem isso o modelo confia inteiramente no preço de mercado."
    },
    {
      title: "Acertos significativos por minuto, takedowns, defesa",
      reason:
        "Stats por lutador (SLpM, TD avg, FoF) não estão na chave atual da Odds API."
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
    sportFamily: "mma",
    generatedAt: new Date().toISOString(),
    bookmakerCount: input.bookmakers.length,
    consensus,
    insights,
    narrative,
    limitations,
    topPick
  };
}
