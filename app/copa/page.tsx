import { Clock, Flag, Globe2, RefreshCcw, Sparkles, Trophy } from "lucide-react";
import { getWorldCupGames, WORLD_CUP_KICKOFF } from "@/lib/providers/worldcup";
import { PageTitle, Panel, ResponsibleNotice, Shell, StatusPill } from "@/components/ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatStart(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo"
  }).format(date);
}

function daysUntilKickoff() {
  const kickoff = new Date(WORLD_CUP_KICKOFF).getTime();
  const now = Date.now();
  const diff = kickoff - now;
  if (diff <= 0) return null;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function groupByLeague(games: { league: string }[]) {
  const map = new Map<string, number>();
  for (const game of games) {
    map.set(game.league, (map.get(game.league) ?? 0) + 1);
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

export default async function CopaPage() {
  const feed = await getWorldCupGames();
  const sortedGames = [...feed.games].sort((a, b) => {
    const aTime = new Date(a.startTime).getTime();
    const bTime = new Date(b.startTime).getTime();
    return (Number.isNaN(aTime) ? 0 : aTime) - (Number.isNaN(bTime) ? 0 : bTime);
  });
  const countdown = daysUntilKickoff();
  const buckets = groupByLeague(sortedGames);

  return (
    <Shell>
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/15 via-neon/5 to-electric/15 p-6 shadow-glow sm:p-10">
        <div className="absolute -top-12 -right-12 hidden h-48 w-48 rotate-12 rounded-full bg-gold/20 blur-3xl sm:block" />
        <div className="absolute -bottom-16 -left-16 hidden h-56 w-56 rounded-full bg-neon/20 blur-3xl sm:block" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-gold/40 bg-gold/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-gold">
            <Trophy className="h-3.5 w-3.5" />
            Edição Especial Copa do Mundo 2026
          </div>
          <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-6xl">
            EUA · Canadá · México 2026
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200 sm:text-lg">
            Aba dedicada ao maior torneio do planeta. A IA filtra apenas jogos da Copa, lê odds em tempo real e prioriza valor estatístico antes do apito inicial.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-ink/40 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-gold">
                <Flag className="h-3.5 w-3.5" /> Abertura
              </div>
              <p className="mt-2 text-2xl font-black text-white">
                {countdown !== null ? `${countdown} dias` : "Em andamento"}
              </p>
              <p className="mt-1 text-xs text-slate-400">11 jun · México 20h ET</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-ink/40 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-electric">
                <Globe2 className="h-3.5 w-3.5" /> Seleções
              </div>
              <p className="mt-2 text-2xl font-black text-white">48</p>
              <p className="mt-1 text-xs text-slate-400">12 grupos · primeira Copa expandida</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-ink/40 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-neon">
                <Sparkles className="h-3.5 w-3.5" /> Jogos no feed
              </div>
              <p className="mt-2 text-2xl font-black text-white">{sortedGames.length}</p>
              <p className="mt-1 text-xs text-slate-400">{feed.source}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-ink/40 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-300">
                <RefreshCcw className="h-3.5 w-3.5" /> Atualizado
              </div>
              <p className="mt-2 text-base font-bold text-white">{formatStart(feed.fetchedAt)}</p>
              <p className="mt-1 text-xs text-slate-400">Cache desligado · live feed</p>
            </div>
          </div>
        </div>
      </div>

      <PageTitle
        eyebrow="Calendário Oficial"
        title="Jogos da Copa com odds reais"
        subtitle="Tudo o que aparece aqui vem direto dos provedores configurados. Quando a The Odds API publicar o calendário oficial, os jogos populam automaticamente."
      />

      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_22rem]">
        <Panel accent={feed.configured ? "border-neon/30" : "border-gold/30"}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-white">Status do feed</h2>
              <p className="text-sm text-slate-400">{feed.message}</p>
            </div>
            <StatusPill tone={feed.configured ? "green" : "gold"}>
              {feed.configured ? "Provider ativo" : "Aguardando provider"}
            </StatusPill>
          </div>
          {buckets.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {buckets.map(([league, count]) => (
                <span
                  key={league}
                  className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  {league}
                  <span className="rounded bg-white/10 px-1.5 font-bold text-white">{count}</span>
                </span>
              ))}
            </div>
          ) : null}
        </Panel>

        <Panel>
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-gold" />
            <h2 className="text-xl font-black text-white">Como ler os jogos</h2>
          </div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-400">
            <li>· Melhor odd é o maior preço encontrado entre as casas autorizadas.</li>
            <li>· A IA do ViaBet calcula odd justa e flag de valor antes do jogo.</li>
            <li>· Aposta, se feita, deve ocorrer sempre em casa autorizada.</li>
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedGames.length === 0 ? (
          <Panel className="md:col-span-2 xl:col-span-3" accent="border-gold/30">
            <div className="flex flex-wrap items-start gap-4">
              <div className="grid h-11 w-11 place-items-center rounded-lg border border-gold/30 bg-gold/10 text-gold">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">
                  Calendário oficial ainda não disponível no provider
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                  A The Odds API libera o mercado da Copa em janelas próximas do jogo. Quando o calendário oficial entrar, as partidas aparecem aqui automaticamente — sem precisar atualizar o código. Enquanto isso, ative DATA_MODE=real-test para visualizar a tela com agenda simulada.
                </p>
              </div>
            </div>
          </Panel>
        ) : null}

        {sortedGames.map((game) => {
          const bestOdd = game.odds.length ? [...game.odds].sort((a, b) => b.price - a.price)[0] : null;
          const drawOdd = game.odds.find((o) => /empate|draw/i.test(o.selection));
          return (
            <Panel key={`${game.source}-${game.externalId}`} className="h-full" accent="border-gold/20">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill tone="gold">Copa 2026</StatusPill>
                    <StatusPill tone="blue">Pré-jogo</StatusPill>
                  </div>
                  <h2 className="mt-4 text-xl font-black text-white">
                    {game.home} <span className="text-slate-500">x</span> {game.away}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">{game.league}</p>
                </div>
                <Trophy className="h-5 w-5 text-gold/70" />
              </div>

              <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  <Clock className="mr-1 inline h-3 w-3" /> Apito inicial
                </p>
                <p className="mt-1 font-bold text-white">{formatStart(game.startTime)}</p>
              </div>

              <div className="mt-3 rounded-lg border border-gold/20 bg-gold/5 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-gold">Melhor odd encontrada</p>
                {bestOdd ? (
                  <div className="mt-1 flex items-end justify-between gap-3">
                    <div>
                      <p className="font-bold text-white">{bestOdd.selection}</p>
                      <p className="text-xs text-slate-400">
                        {bestOdd.market} · {bestOdd.bookmaker}
                      </p>
                    </div>
                    <p className="text-3xl font-black text-gold">{bestOdd.price.toFixed(2)}</p>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-slate-400">
                    Sem cotações no momento. Aparecerão assim que o mercado abrir.
                  </p>
                )}
              </div>

              {drawOdd ? (
                <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300">
                  Empate atual: <span className="font-bold text-white">{drawOdd.price.toFixed(2)}</span>
                  <span className="text-slate-500"> · {drawOdd.bookmaker}</span>
                </div>
              ) : null}

              <div className="mt-3 grid grid-cols-2 gap-3">
                <button className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-3 text-sm font-bold text-gold">
                  Analisar com IA
                </button>
                <button className="rounded-lg border border-white/10 px-3 py-3 text-sm font-bold text-white hover:bg-white/10">
                  Criar alerta
                </button>
              </div>
            </Panel>
          );
        })}
      </div>

      {feed.diagnostics && feed.diagnostics.length > 0 ? (
        <div className="mt-6">
          <Panel>
            <h2 className="text-lg font-black text-white">Diagnóstico dos provedores</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {feed.diagnostics.map((diag) => (
                <div key={diag.provider} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-white">{diag.provider}</p>
                    <StatusPill
                      tone={
                        diag.status === "ready"
                          ? "green"
                          : diag.status === "missing-config"
                            ? "gold"
                            : diag.status === "error"
                              ? "red"
                              : "blue"
                      }
                    >
                      {diag.status}
                    </StatusPill>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{diag.message}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      ) : null}

      <div className="mt-6">
        <ResponsibleNotice />
      </div>
    </Shell>
  );
}
