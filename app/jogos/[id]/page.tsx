import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bell, Building2, Clock, Heart, Layers, ShieldCheck } from "lucide-react";
import { PageTitle, Panel, ResponsibleNotice, Shell, StatusPill } from "@/components/ui";
import { AnalysisPanel } from "@/components/analysis-panel";
import { SaveAnalysisButton } from "@/components/save-analysis-button";
import { StatsPendingNotice, TeamStatsPanel } from "@/components/team-stats-panel";
import { getEventOdds } from "@/lib/providers/leagues";
import { analyzeEvent } from "@/lib/analysis";
import { getEnrichedStats, isConfigured as isStatsConfigured } from "@/lib/providers/stats";
import { sportKeyToLeagueId } from "@/lib/providers/stats/matcher";
import { isDemoMode } from "@/lib/demo/config";

export const dynamic = "force-dynamic";

function formatStart(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo"
  }).format(date);
}

type BestBySelection = {
  market: string;
  selection: string;
  best: { bookmaker: string; price: number };
  prices: Array<{ bookmaker: string; price: number }>;
  fairOdd: number | null;
};

export default async function MatchDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sport?: string }>;
}) {
  const { id } = await params;
  const { sport } = await searchParams;

  if (!sport) {
    return (
      <Shell>
        <Panel accent="border-gold/30">
          <h2 className="text-xl font-black text-white">Liga não informada</h2>
          <p className="mt-2 text-sm text-slate-400">
            O detalhe da partida precisa do parâmetro <code className="rounded bg-white/10 px-1">?sport=</code> para
            saber em qual liga buscar. Volte ao{" "}
            <Link href="/jogos" className="text-neon underline">
              filtro de jogos
            </Link>{" "}
            e clique numa partida pelo cartão.
          </p>
        </Panel>
      </Shell>
    );
  }

  const event = await getEventOdds(sport, id);
  if (!event) notFound();

  const analysis = analyzeEvent({
    sportKey: sport,
    sportTitle: event.sport,
    home: event.home,
    away: event.away,
    startTime: event.startTime,
    bookmakers: event.bookmakers
  });

  const demoActive = isDemoMode();
  const statsConfigured = isStatsConfigured();
  const statsSupported = sportKeyToLeagueId(sport) !== null;
  const enrichedStats = (demoActive || (statsConfigured && statsSupported))
    ? await getEnrichedStats({
        sportKey: sport,
        home: event.home,
        away: event.away,
        startTime: event.startTime
      })
    : null;

  let statsNotice: string | null = null;
  if (!statsConfigured) {
    statsNotice = "Configure API_FOOTBALL_KEY no .env para desbloquear escalações, médias da temporada (gols, cartões, escanteios) e confrontos diretos.";
  } else if (!statsSupported) {
    statsNotice = "A API-Football cobre principalmente futebol. Este esporte ainda não tem mapeamento de liga configurado.";
  } else if (!enrichedStats) {
    statsNotice = "Não consegui mapear este jogo no provedor de stats — pode ser um campeonato fora do plano gratuito ou nomes que não casaram. Outros jogos da mesma liga devem funcionar.";
  }

  const allMarkets = new Map<string, BestBySelection>();
  for (const book of event.bookmakers) {
    for (const market of book.markets) {
      for (const outcome of market.outcomes) {
        const key = `${market.label}|||${outcome.name}${outcome.point !== undefined ? `|${outcome.point}` : ""}`;
        const existing = allMarkets.get(key);
        const entry = {
          market: market.label + (outcome.point !== undefined ? ` (${outcome.point})` : ""),
          selection: outcome.name,
          best: { bookmaker: book.title, price: outcome.price },
          prices: [{ bookmaker: book.title, price: outcome.price }],
          fairOdd: null as number | null
        };
        if (!existing) {
          allMarkets.set(key, entry);
        } else {
          existing.prices.push({ bookmaker: book.title, price: outcome.price });
          if (outcome.price > existing.best.price) {
            existing.best = { bookmaker: book.title, price: outcome.price };
          }
        }
      }
    }
  }

  const sortedMarkets = Array.from(allMarkets.values()).sort((a, b) => {
    if (a.market !== b.market) return a.market.localeCompare(b.market);
    return b.best.price - a.best.price;
  });

  const h2hMarkets = sortedMarkets.filter((m) => /Resultado final|h2h/i.test(m.market));

  return (
    <Shell>
      <Link
        href={`/jogos?liga=${encodeURIComponent(sport)}`}
        className="mb-4 inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar para os jogos
      </Link>

      <PageTitle
        eyebrow={`${event.league} · ${event.sport}`}
        title={`${event.home} x ${event.away}`}
        subtitle={`${formatStart(event.startTime)} · ${event.bookmakers.length} casas cotando`}
      />

      <div className="mb-4">
        <AnalysisPanel analysis={analysis} />
      </div>

      {analysis.topPick ? (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <SaveAnalysisButton
            input={{
              matchId: event.externalId,
              sportKey: sport,
              sport: event.sport,
              league: event.league,
              home: event.home,
              away: event.away,
              startTime: event.startTime,
              pick: analysis.topPick
            }}
          />
          <p className="text-xs text-slate-400">
            Guarde o palpite agora e marque o resultado quando o jogo terminar pra ver sua taxa de acerto real.
          </p>
        </div>
      ) : null}

      <div className="mb-4">
        {enrichedStats ? (
          <TeamStatsPanel enriched={enrichedStats} />
        ) : statsNotice ? (
          <StatsPendingNotice reason={statsNotice} />
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Panel accent="border-neon/30">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone="blue">{event.sport}</StatusPill>
                  <StatusPill tone="gold">Pré-jogo</StatusPill>
                  {sport.includes("world_cup") ? <StatusPill tone="gold">Copa 2026</StatusPill> : null}
                </div>
                <h2 className="mt-3 text-2xl font-black text-white">Resultado final (1X2)</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Comparativo de odds entre todas as casas cobertas pelo provedor para o resultado final.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="grid h-11 w-11 place-items-center rounded-lg border border-white/10 text-slate-300 hover:bg-white/10"
                  title="Favoritar"
                >
                  <Heart className="h-5 w-5" />
                </button>
                <button
                  className="grid h-11 w-11 place-items-center rounded-lg border border-white/10 text-slate-300 hover:bg-white/10"
                  title="Criar alerta"
                >
                  <Bell className="h-5 w-5" />
                </button>
              </div>
            </div>

            {h2hMarkets.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">
                Ainda não há cotações de resultado final para este jogo.
              </p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {h2hMarkets.map((m) => (
                  <div key={`${m.market}-${m.selection}`} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{m.selection}</p>
                    <p className="mt-1 text-3xl font-black text-neon">{m.best.price.toFixed(2)}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {m.best.bookmaker} · {m.prices.length} casas
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-black text-white">Todos os mercados</h2>
              <span className="inline-flex items-center gap-2 text-xs text-slate-400">
                <Layers className="h-4 w-4 text-electric" />
                {sortedMarkets.length} linhas
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
                  <tr className="border-b border-white/10">
                    <th className="py-3">Mercado</th>
                    <th>Seleção</th>
                    <th>Melhor odd</th>
                    <th>Casa</th>
                    <th>Casas cotando</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMarkets.map((m, idx) => (
                    <tr
                      key={`${m.market}-${m.selection}-${idx}`}
                      className="border-b border-white/5 text-slate-300"
                    >
                      <td className="py-3 font-semibold text-white">{m.market}</td>
                      <td>{m.selection}</td>
                      <td className="font-black text-neon">{m.best.price.toFixed(2)}</td>
                      <td className="text-xs text-slate-400">{m.best.bookmaker}</td>
                      <td className="text-xs text-slate-400">{m.prices.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel>
            <div className="mb-3 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-electric" />
              <h2 className="text-xl font-black text-white">Casas cobrindo este jogo</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {event.bookmakers.map((b) => (
                <span
                  key={b.title}
                  className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300"
                >
                  {b.title}
                  <span className="rounded bg-white/10 px-1.5 font-bold text-white">
                    {b.markets.reduce((acc, m) => acc + m.outcomes.length, 0)}
                  </span>
                </span>
              ))}
            </div>
          </Panel>
        </div>

        <aside className="space-y-4">
          <Panel>
            <h2 className="text-xl font-black text-white">Quando começa</h2>
            <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                <Clock className="mr-1 inline h-3 w-3" /> Apito inicial
              </p>
              <p className="mt-1 font-bold text-white">{formatStart(event.startTime)}</p>
            </div>
            <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 font-mono text-xs text-slate-400">
              <p>sport_key: {sport}</p>
              <p className="mt-1 break-all">event_id: {event.externalId}</p>
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center gap-2 text-white">
              <ShieldCheck className="h-5 w-5 text-gold" />
              <h2 className="text-xl font-black">Como o modelo decide</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              O analisador remove a margem (vigorish) das casas, deriva probabilidades justas e aplica um
              modelo estatístico apropriado ao esporte (Poisson em futebol, pontos esperados em basquete,
              cadeia de sets em tênis, método/rounds em MMA). Tudo grounded em odds reais.
            </p>
          </Panel>

          <ResponsibleNotice />
        </aside>
      </div>
    </Shell>
  );
}
