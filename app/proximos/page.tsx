import { Clock, DatabaseZap, ExternalLink, KeyRound, RefreshCcw, ShieldCheck } from "lucide-react";
import { getUpcomingGames } from "@/lib/providers/upcoming";
import { PageTitle, Panel, ResponsibleNotice, Shell, StatusPill } from "@/components/ui";

export const dynamic = "force-dynamic";

function formatStart(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo"
  }).format(date);
}

export default async function UpcomingPage() {
  const feed = await getUpcomingGames();
  const sortedGames = [...feed.games].sort((a, b) => {
    const aTime = new Date(a.startTime).getTime();
    const bTime = new Date(b.startTime).getTime();
    return (Number.isNaN(aTime) ? 0 : aTime) - (Number.isNaN(bTime) ? 0 : bTime);
  });

  return (
    <Shell>
      <PageTitle
        eyebrow="Próximos jogos"
        title="Agenda real antes das apostas"
        subtitle="O sistema busca partidas futuras na internet, normaliza os dados e prepara a análise de odds, risco e valor antes do jogo começar."
      />

      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_22rem]">
        <Panel accent={feed.configured ? "border-neon/30" : "border-gold/30"}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <DatabaseZap className="h-6 w-6 text-neon" />
              <div>
                <h2 className="text-xl font-black text-white">Fonte: {feed.source}</h2>
                <p className="text-sm text-slate-400">{feed.message}</p>
              </div>
            </div>
            <StatusPill tone={feed.configured ? "green" : "gold"}>{feed.configured ? "Internet ativa" : "Configurar API"}</StatusPill>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-400">
            <span className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2">
              <RefreshCcw className="h-4 w-4 text-electric" />
              Atualizado: {formatStart(feed.fetchedAt)}
            </span>
            <span className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2">
              <Clock className="h-4 w-4 text-electric" />
              {sortedGames.length} jogos encontrados
            </span>
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-gold" />
            <h2 className="text-xl font-black text-white">Uso correto</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            O ViaBet mostra dados e oportunidades. A aposta, se o usuário decidir fazer, deve acontecer fora da plataforma e apenas em operador autorizado.
          </p>
        </Panel>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedGames.length === 0 ? (
          <Panel className="md:col-span-2 xl:col-span-3" accent="border-gold/30">
            <div className="flex flex-wrap items-start gap-4">
              <div className="grid h-11 w-11 place-items-center rounded-lg border border-gold/30 bg-gold/10 text-gold">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Modo real ativo, mas falta provider de odds</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                  Para aparecerem jogos e odds reais aqui, configure uma chave em THE_ODDS_API_KEY no arquivo .env.local e reinicie o servidor. Enquanto DATA_MODE=real estiver ativo, o sistema bloqueia dados simulados.
                </p>
              </div>
            </div>
          </Panel>
        ) : null}

        {sortedGames.map((game) => {
          const bestOdd = game.odds.length ? [...game.odds].sort((a, b) => b.price - a.price)[0] : null;
          return (
            <Panel key={`${game.source}-${game.externalId}`} className="h-full">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill tone="blue">{game.sport}</StatusPill>
                    <StatusPill tone="gold">Pré-jogo</StatusPill>
                  </div>
                  <h2 className="mt-4 text-xl font-black text-white">
                    {game.home} x {game.away}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">{game.league}</p>
                </div>
                <ExternalLink className="h-5 w-5 text-slate-500" />
              </div>

              <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs text-slate-500">Horário</p>
                <p className="mt-1 font-bold text-white">{formatStart(game.startTime)}</p>
              </div>

              <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs text-slate-500">Melhor odd encontrada</p>
                {bestOdd ? (
                  <div className="mt-1 flex items-end justify-between gap-3">
                    <div>
                      <p className="font-bold text-white">{bestOdd.selection}</p>
                      <p className="text-xs text-slate-400">
                        {bestOdd.market} · {bestOdd.bookmaker}
                      </p>
                    </div>
                    <p className="text-2xl font-black text-neon">{bestOdd.price.toFixed(2)}</p>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-slate-400">Agenda carregada sem odds. Configure The Odds API para odds reais.</p>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <button className="rounded-lg border border-neon/30 bg-neon/10 px-3 py-3 text-sm font-bold text-neon">Analisar IA</button>
                <button className="rounded-lg border border-white/10 px-3 py-3 text-sm font-bold text-white hover:bg-white/10">Criar alerta</button>
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="mt-6">
        <ResponsibleNotice />
      </div>
    </Shell>
  );
}
