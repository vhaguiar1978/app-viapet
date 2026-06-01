import Link from "next/link";
import { Clock, ExternalLink, Filter, Layers, RefreshCcw, Search, Trophy } from "lucide-react";
import { PageTitle, Panel, ResponsibleNotice, Shell, StatusPill } from "@/components/ui";
import { getLeagueGames, getSportsList, localizeGroup, type SportEntry } from "@/lib/providers/leagues";

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

function pickDefaultLeague(flat: SportEntry[]): SportEntry | null {
  if (flat.length === 0) return null;
  const preferred = [
    "soccer_brazil_campeonato",
    "soccer_fifa_world_cup",
    "soccer_epl",
    "soccer_uefa_champs_league",
    "basketball_nba"
  ];
  for (const key of preferred) {
    const found = flat.find((s) => s.key === key);
    if (found) return found;
  }
  return flat[0];
}

export default async function GamesPage({
  searchParams
}: {
  searchParams: Promise<{ liga?: string; q?: string }>;
}) {
  const params = await searchParams;
  const search = params.q?.trim().toLowerCase() ?? "";

  const sports = await getSportsList();
  const filteredFlat = search
    ? sports.flat.filter(
        (s) => s.title.toLowerCase().includes(search) || s.group.toLowerCase().includes(search)
      )
    : sports.flat;

  const requestedLeague = params.liga
    ? sports.flat.find((s) => s.key === params.liga)
    : undefined;
  const activeLeague = requestedLeague ?? pickDefaultLeague(sports.flat);

  const feed = activeLeague
    ? await getLeagueGames(activeLeague.key, activeLeague.title)
    : null;

  const sortedGames = feed
    ? [...feed.games].sort((a, b) => {
        const aT = new Date(a.startTime).getTime();
        const bT = new Date(b.startTime).getTime();
        return (Number.isNaN(aT) ? 0 : aT) - (Number.isNaN(bT) ? 0 : bT);
      })
    : [];

  const groupsToShow = search
    ? sports.groups
        .map((g) => ({ ...g, leagues: g.leagues.filter((l) => filteredFlat.includes(l)) }))
        .filter((g) => g.leagues.length > 0)
    : sports.groups;

  return (
    <Shell>
      <PageTitle
        eyebrow="Jogos por liga"
        title="Escolha a liga para analisar"
        subtitle="Selecione um campeonato e o ViaBet carrega os jogos com odds reais direto do provedor configurado."
      />

      <Panel className="mb-5">
        <form action="/jogos" method="get" className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-electric">
            <Search className="h-4 w-4" />
            <span className="text-sm font-bold uppercase tracking-[0.16em]">Buscar liga</span>
          </div>
          <input
            name="q"
            defaultValue={search}
            placeholder="Ex: Premier League, NBA, Brasileirão…"
            className="min-w-[16rem] flex-1 rounded-md border border-white/10 bg-ink/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-neon focus:outline-none"
          />
          {activeLeague ? (
            <input type="hidden" name="liga" value={activeLeague.key} />
          ) : null}
          <button
            type="submit"
            className="rounded-md border border-neon/40 bg-neon/15 px-3 py-2 text-sm font-bold text-neon hover:bg-neon/25"
          >
            Filtrar
          </button>
          {search ? (
            <Link
              href={activeLeague ? `/jogos?liga=${activeLeague.key}` : "/jogos"}
              className="rounded-md border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
            >
              Limpar
            </Link>
          ) : null}
          <span className="ml-auto inline-flex items-center gap-2 text-xs text-slate-400">
            <Layers className="h-4 w-4 text-electric" />
            {sports.flat.length} ligas · {sports.groups.length} esportes
          </span>
        </form>
      </Panel>

      {!sports.configured ? (
        <Panel accent="border-gold/30" className="mb-5">
          <div className="flex items-start gap-3">
            <Filter className="mt-1 h-5 w-5 text-gold" />
            <div>
              <h2 className="text-xl font-black text-white">Provider de ligas não configurado</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{sports.message}</p>
            </div>
          </div>
        </Panel>
      ) : null}

      <div className="mb-6 grid gap-4 lg:grid-cols-[22rem_1fr]">
        <Panel className="max-h-[34rem] overflow-y-auto">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-black text-white">Ligas disponíveis</h2>
            <StatusPill tone={sports.configured ? "green" : "gold"}>
              {sports.configured ? "Ao vivo" : "Sem provider"}
            </StatusPill>
          </div>
          {groupsToShow.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma liga corresponde à busca.</p>
          ) : (
            <div className="space-y-4">
              {groupsToShow.map((group) => (
                <div key={group.group}>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.16em] text-gold">
                    {localizeGroup(group.group)}
                  </p>
                  <div className="flex flex-col gap-1">
                    {group.leagues.map((league) => {
                      const isActive = activeLeague?.key === league.key;
                      const href = `/jogos?liga=${encodeURIComponent(league.key)}${
                        search ? `&q=${encodeURIComponent(search)}` : ""
                      }`;
                      return (
                        <Link
                          key={league.key}
                          href={href}
                          scroll={false}
                          className={
                            isActive
                              ? "flex items-center justify-between gap-2 rounded-md border border-neon/40 bg-neon/15 px-3 py-2 text-sm font-bold text-white"
                              : "flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2 text-sm text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
                          }
                        >
                          <span className="truncate">{league.title}</span>
                          {isActive ? <Trophy className="h-3.5 w-3.5 text-neon" /> : null}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel accent={activeLeague ? "border-neon/30" : "border-gold/30"}>
          {activeLeague && feed ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-electric">
                    {localizeGroup(activeLeague.group)}
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-white">{activeLeague.title}</h2>
                  <p className="mt-1 text-sm text-slate-400">{activeLeague.description}</p>
                </div>
                <StatusPill tone={feed.configured ? "green" : "gold"}>
                  {feed.configured ? "Provider ativo" : "Aguardando"}
                </StatusPill>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-300">
                <span className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2">
                  <Clock className="h-4 w-4 text-electric" />
                  {sortedGames.length} jogos no feed
                </span>
                <span className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2">
                  <RefreshCcw className="h-4 w-4 text-electric" />
                  {formatStart(feed.fetchedAt)}
                </span>
                <span className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 font-mono text-xs text-slate-400">
                  {activeLeague.key}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-400">{feed.message}</p>
            </>
          ) : (
            <div className="flex items-start gap-3">
              <Filter className="mt-1 h-5 w-5 text-gold" />
              <div>
                <h2 className="text-xl font-black text-white">Selecione uma liga ao lado</h2>
                <p className="mt-2 text-sm text-slate-400">
                  As partidas com odds reais aparecem aqui assim que você escolher a liga.
                </p>
              </div>
            </div>
          )}
        </Panel>
      </div>

      {activeLeague ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedGames.length === 0 ? (
            <Panel className="md:col-span-2 xl:col-span-3" accent="border-gold/30">
              <p className="text-sm leading-6 text-slate-400">
                Nenhum jogo no mercado desta liga agora. Costuma acontecer entre rodadas — selecione outra liga ou volte mais tarde.
              </p>
            </Panel>
          ) : null}

          {sortedGames.map((game) => {
            const bestOdd = game.odds.length
              ? [...game.odds].sort((a, b) => b.price - a.price)[0]
              : null;
            const detailHref = `/jogos/${encodeURIComponent(game.externalId)}?sport=${encodeURIComponent(activeLeague.key)}`;
            return (
              <Panel key={`${game.source}-${game.externalId}`} className="h-full">
                <Link href={detailHref} className="block">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <StatusPill tone="blue">{game.sport}</StatusPill>
                        <StatusPill tone="gold">Pré-jogo</StatusPill>
                      </div>
                      <h3 className="mt-4 text-xl font-black text-white">
                        {game.home} <span className="text-slate-500">x</span> {game.away}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">{game.league}</p>
                    </div>
                    <ExternalLink className="h-5 w-5 text-slate-500" />
                  </div>

                  <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      <Clock className="mr-1 inline h-3 w-3" /> Início
                    </p>
                    <p className="mt-1 font-bold text-white">{formatStart(game.startTime)}</p>
                  </div>

                  <div className="mt-3 rounded-lg border border-neon/20 bg-neon/5 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-neon">Melhor odd encontrada</p>
                    {bestOdd ? (
                      <div className="mt-1 flex items-end justify-between gap-3">
                        <div>
                          <p className="font-bold text-white">{bestOdd.selection}</p>
                          <p className="text-xs text-slate-400">
                            {bestOdd.market} · {bestOdd.bookmaker}
                          </p>
                        </div>
                        <p className="text-3xl font-black text-neon">{bestOdd.price.toFixed(2)}</p>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-slate-400">Mercado sem cotações no momento.</p>
                    )}
                  </div>
                </Link>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Link
                    href={detailHref}
                    className="rounded-lg border border-neon/30 bg-neon/10 px-3 py-3 text-center text-sm font-bold text-neon hover:bg-neon/20"
                  >
                    Ver mercados
                  </Link>
                  <button className="rounded-lg border border-white/10 px-3 py-3 text-sm font-bold text-white hover:bg-white/10">
                    Criar alerta
                  </button>
                </div>
              </Panel>
            );
          })}
        </div>
      ) : null}

      <div className="mt-6">
        <ResponsibleNotice />
      </div>
    </Shell>
  );
}
