import { AlertTriangle, BrainCircuit, Crown, Gauge, Sparkles, Target } from "lucide-react";
import { Panel, StatusPill } from "@/components/ui";
import type { AnalysisResult } from "@/lib/analysis";

const FAMILY_LABELS: Record<AnalysisResult["sportFamily"], string> = {
  soccer: "Futebol · modelo Poisson",
  basketball: "Basquete · pontos esperados",
  tennis: "Tênis · cadeia de sets",
  mma: "MMA · método e rounds",
  generic: "Esporte genérico"
};

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

function toneClass(tone?: "positive" | "warning" | "neutral") {
  if (tone === "positive") return "border-neon/30 bg-neon/5";
  if (tone === "warning") return "border-gold/30 bg-gold/5";
  return "border-white/10 bg-white/[0.03]";
}

export function AnalysisPanel({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="space-y-4">
      {analysis.topPick ? (
        <Panel accent="border-gold/40" className="shadow-glow">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-gold/40 bg-gold/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-gold">
                <Crown className="h-3.5 w-3.5" />
                Maior chance de vitória
              </div>
              <h2 className="text-3xl font-black text-white sm:text-4xl">{analysis.topPick.label}</h2>
              <p className="mt-2 text-sm text-slate-400">
                Lado favorito segundo o consenso do mercado, com a margem das casas já removida.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center sm:min-w-[22rem]">
              <div className="rounded-lg border border-gold/30 bg-gold/10 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-gold">Prob. justa</p>
                <p className="mt-1 text-2xl font-black text-white">{pct(analysis.topPick.fairProb)}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-electric">Melhor odd</p>
                <p className="mt-1 text-2xl font-black text-neon">{analysis.topPick.bestPrice.toFixed(2)}</p>
                <p className="mt-1 text-[10px] text-slate-400">{analysis.topPick.bestBookmaker}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Edge</p>
                <p className={`mt-1 text-2xl font-black ${analysis.topPick.edgePct >= 3 ? "text-neon" : analysis.topPick.edgePct >= 0 ? "text-gold" : "text-red-300"}`}>
                  {analysis.topPick.edgePct >= 0 ? "+" : ""}
                  {analysis.topPick.edgePct.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </Panel>
      ) : null}

      <Panel accent="border-neon/30">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-neon/30 bg-neon/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-neon">
              <BrainCircuit className="h-3.5 w-3.5" />
              Análise IA · {FAMILY_LABELS[analysis.sportFamily]}
            </div>
            <h2 className="text-2xl font-black text-white">Leitura estatística do jogo</h2>
            <p className="mt-1 text-sm text-slate-400">
              Combinação do consenso de {analysis.bookmakerCount} casas com modelo probabilístico
              específico do esporte.
            </p>
          </div>
          <Sparkles className="h-7 w-7 text-neon" />
        </div>
        <div className="mt-4 space-y-3">
          {analysis.narrative.map((line, idx) => (
            <p key={idx} className="text-sm leading-7 text-slate-300">
              {line}
            </p>
          ))}
        </div>
      </Panel>

      {analysis.insights.length > 0 ? (
        <Panel>
          <div className="mb-3 flex items-center gap-2">
            <Gauge className="h-5 w-5 text-electric" />
            <h3 className="text-lg font-black text-white">Métricas calculadas</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {analysis.insights.map((insight, idx) => (
              <div
                key={`${insight.label}-${idx}`}
                className={`rounded-lg border p-3 ${toneClass(insight.tone)}`}
              >
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{insight.label}</p>
                <p className="mt-1 text-2xl font-black text-white">{insight.value}</p>
                {insight.detail ? (
                  <p className="mt-1 text-xs text-slate-400">{insight.detail}</p>
                ) : null}
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      {analysis.halves && analysis.halves.length > 0 ? (
        <Panel>
          <h3 className="mb-3 text-lg font-black text-white">Expectativa por tempo</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {analysis.halves.map((h, idx) => (
              <div key={`${h.label}-${idx}`} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{h.label}</p>
                <p className="mt-1 text-xl font-black text-white">{h.value}</p>
                {h.detail ? <p className="mt-1 text-xs text-slate-400">{h.detail}</p> : null}
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      {analysis.topScorelines && analysis.topScorelines.length > 0 ? (
        <Panel>
          <div className="mb-3 flex items-center gap-2">
            <Target className="h-5 w-5 text-gold" />
            <h3 className="text-lg font-black text-white">Top placares (modelo Poisson)</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
            {analysis.topScorelines.map((s) => (
              <div
                key={s.score}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3"
              >
                <span className="text-lg font-black text-white">{s.score}</span>
                <span className="text-sm font-bold text-neon">{pct(s.prob)}</span>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      {analysis.setsDistribution && analysis.setsDistribution.length > 0 ? (
        <Panel>
          <h3 className="mb-3 text-lg font-black text-white">Distribuição por placar de sets</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {analysis.setsDistribution.map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3"
              >
                <span className="text-sm font-bold text-white">{s.label}</span>
                <span className="text-sm font-bold text-neon">{pct(s.prob)}</span>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      {analysis.consensus.length > 0 ? (
        <Panel>
          <h3 className="mb-3 text-lg font-black text-white">Consenso de mercado (devigged)</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr className="border-b border-white/10">
                  <th className="py-3">Mercado</th>
                  <th>Seleção</th>
                  <th>Prob. justa</th>
                  <th>Odd justa</th>
                  <th>Melhor odd</th>
                  <th>Casa</th>
                  <th>Edge</th>
                </tr>
              </thead>
              <tbody>
                {analysis.consensus.map((row, idx) => (
                  <tr key={`${row.market}-${row.selection}-${idx}`} className="border-b border-white/5 text-slate-300">
                    <td className="py-3 font-semibold text-white">{row.market}</td>
                    <td>{row.selection}</td>
                    <td>{pct(row.fairProb)}</td>
                    <td>{row.fairOdd.toFixed(2)}</td>
                    <td className="font-black text-neon">{row.bestPrice.toFixed(2)}</td>
                    <td className="text-xs text-slate-400">{row.bestBookmaker}</td>
                    <td>
                      <StatusPill tone={row.edgePct >= 3 ? "green" : row.edgePct >= 0 ? "gold" : "red"}>
                        {row.edgePct >= 0 ? "+" : ""}
                        {row.edgePct.toFixed(1)}%
                      </StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}

      {analysis.limitations.length > 0 ? (
        <Panel accent="border-gold/30">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-gold" />
            <h3 className="text-lg font-black text-white">O que o modelo não cobre hoje</h3>
          </div>
          <p className="mb-3 text-sm leading-6 text-slate-400">
            Transparência sobre os limites da chave atual da The Odds API. Os itens abaixo serão
            preenchidos quando um stats provider (API-Football, Sportmonks ou similar) for plugado.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {analysis.limitations.map((lim) => (
              <div key={lim.title} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-sm font-bold text-white">{lim.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{lim.reason}</p>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
