import Link from "next/link";
import { ArrowRight, BarChart3, Building2, Clock, Layers, RefreshCcw } from "lucide-react";
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
    "basketball_nba"
  ];
  for (const key of preferred) {
    const found = flat.find((s) => s.key === key);
    if (found) return found;
  }
  return flat[0];
}

type Row = {
  externalId: string;
  match: string;
  startTime: string;
  market: string;
  selection: string;
  bookmakerPrices: Array<{ bookmaker: string; price: number }>;
  best: { bookmaker: string; price: number };
  worst: { bookmaker: string; price: number };
  spreadPct: number;
};

export default async function OddsPage({
  searchParams
}: {
  searchParams: Promise<{ liga?: string }>;
}) {
  const { liga } = await searchParams;
  const sports = await getSportsList();
  const requested = liga ? sports.flat.find((s) => s.key === liga) : undefined;
  const activeLeague = requested ?? pickDefaultLeague(sports.flat);

  const feed = activeLeague ? await getLeagueGames(activeLeague.key, activeLeague.title) : null;

  const rows: Row[] = [];
  if (feed) {
    for (const game of feed.games) {
      const byKey = new Map<string, Array<{ bookmaker: string; price: number }>>();
      for (const odd of game.odds) {
        const key = `${odd.market}|||${odd.selection}`;
        const arr = byKey.get(key) ?? [];
        arr.push({ bookmaker: odd.bookmaker, price: odd.price });
        byKey.set(key, arr);
      }
      for (const [key, prices] of byKey.entries()) {
        if (prices.length < 2) continue;
        const sorted = [...prices].sort((a, b) => b.price - a.price);
        const best = sorted[0];
        const worst = sorted[sorted.length - 1];
        const spreadPct = ((best.price - worst.price) / worst.price) * 100;
        const [market, selection] = key.split("|||");
        rows.push({
          externalId: game.externalId,
          match: `${game.home} x ${game.away}`,
          startTime: game.startTime,
          market,
          selection,
          bookmakerPrices: sorted,
          best,
          worst,
          spreadPct
        });
      }
    }
  }
  rows.sort((a, b) => b.spreadPct - a.spreadPct);
  const topRows = rows.slice(0, 60);

  const distinctBooks = Array.from(
    new Set(rows.flatMap((r) => r.bookmakerPrices.map((p) => p.bookmaker)))
  ).length;

  return (
    <Shell>
      <PageTitle
        eyebrow="Comparador de odds"
        title="Melhor preço por mercado, casa a casa"
        subtitle="O ViaBet lista todas as cotações de cada mercado e destaca onde está o maior valor antes da aposta. O usuário aposta sempre na casa autorizada da escolha dele."
      />

      <Panel className="mb-5">
        <form action="/odds" method="get" className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-electric">
            <Layers className="h-4 w-4" />
            <span className="text-sm font-bold uppercase tracking-[0.16em]">Liga ativa</span>
          </div>
          <select
            name="liga"
            defaultValue={activeLeague?.key ?? ""}
            className="min-w-[18rem] flex-1 rounded-md border border-white/10 bg-ink/60 px-3 py-2 text-sm text-white focus:border-neon focus:outline-none"
          >
            {sports.groups.map((group) => (
              <optgroup key={group.group} label={localizeGroup(group.group)}>
                {group.leagues.map((league) => (
                  <option key={league.key} value={league.key}>
                    {league.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md border border-neon/40 bg-neon/15 px-3 py-2 text-sm font-bold text-neon hover:bg-neon/25"
          >
            Comparar
          </button>
          <span className="ml-auto inline-flex items-center gap-2 text-xs text-slate-400">
            <Building2 className="h-4 w-4 text-electric" />
            {distinctBooks} casas no feed
          </span>
        </form>
      </Panel>

      {activeLeague && feed ? (
        <Panel className="mb-5" accent={feed.configured ? "border-neon/30" : "border-gold/30"}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-electric">
                {localizeGroup(activeLeague.group)}
              </p>
              <h2 className="text-2xl font-black text-white">{activeLeague.title}</h2>
              <p className="mt-1 text-sm text-slate-400">{feed.message}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2">
                <BarChart3 className="h-4 w-4 text-electric" />
                {rows.length} mercados comparados
              </span>
              <span className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2">
                <RefreshCcw className="h-4 w-4 text-electric" />
                {formatStart(feed.fetchedAt)}
              </span>
            </div>
          </div>
        </Panel>
      ) : null}

      <Panel>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white">Top mercados por spread</h2>
            <p className="text-sm text-slate-400">
              Mercados com a maior diferença entre a melhor e a pior cotação. Spread alto = oportunidade
              de pegar uma odd melhor do que a média.
            </p>
          </div>
          <BarChart3 className="h-6 w-6 text-neon" />
        </div>

        {topRows.length === 0 ? (
          <p className="text-sm text-slate-400">
            Nenhum mercado disponível para comparação nesta liga agora. Pode estar entre rodadas ou com
            apenas uma casa cotando — selecione outra liga para comparar.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr className="border-b border-white/10">
                  <th className="py-3">Jogo</th>
                  <th>Mercado</th>
                  <th>Seleção</th>
                  <th>Melhor</th>
                  <th>Pior</th>
                  <th>Spread</th>
                  <th>Casas</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {topRows.map((row, idx) => (
                  <tr
                    className="border-b border-white/5 align-top text-slate-300"
                    key={`${row.externalId}-${row.market}-${row.selection}-${idx}`}
                  >
                    <td className="py-3">
                      <div className="font-bold text-white">{row.match}</div>
                      <div className="text-xs text-slate-500">
                        <Clock className="mr-1 inline h-3 w-3" />
                        {formatStart(row.startTime)}
                      </div>
                    </td>
                    <td className="text-xs text-slate-300">{row.market}</td>
                    <td className="font-semibold text-white">{row.selection}</td>
                    <td>
                      <div className="font-black text-neon">{row.best.price.toFixed(2)}</div>
                      <div className="text-xs text-slate-500">{row.best.bookmaker}</div>
                    </td>
                    <td>
                      <div className="text-slate-400">{row.worst.price.toFixed(2)}</div>
                      <div className="text-xs text-slate-500">{row.worst.bookmaker}</div>
                    </td>
                    <td>
                      <StatusPill tone={row.spreadPct >= 5 ? "green" : row.spreadPct >= 2 ? "gold" : "blue"}>
                        +{row.spreadPct.toFixed(1)}%
                      </StatusPill>
                    </td>
                    <td className="text-xs text-slate-400">{row.bookmakerPrices.length}</td>
                    <td>
                      <Link
                        href={`/jogos/${row.externalId}?sport=${activeLeague?.key ?? ""}`}
                        className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-white/10"
                      >
                        Detalhe <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="mt-6">
        <ResponsibleNotice />
      </div>
    </Shell>
  );
}
