import { Activity, ArrowRight, Clock, Crosshair, Flag, History, Plane, ShieldCheck, Users } from "lucide-react";
import { Panel, StatusPill } from "@/components/ui";
import type {
  EnrichedStats,
  FixtureLineup,
  HeadToHeadFixture,
  TeamSeasonStats
} from "@/lib/providers/stats";

function num(n: number, decimals = 2) {
  return Number.isFinite(n) ? n.toFixed(decimals) : "—";
}

function formChip(letter: string) {
  const tone =
    letter === "W" ? "text-neon" : letter === "L" ? "text-red-300" : "text-gold";
  return `inline-flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-white/[0.05] text-xs font-black ${tone}`;
}

function StatRow({
  label,
  home,
  away,
  highlight = false
}: {
  label: string;
  home: string;
  away: string;
  highlight?: boolean;
}) {
  return (
    <div className={`grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg border border-white/10 ${highlight ? "bg-neon/5" : "bg-white/[0.03]"} px-3 py-2`}>
      <p className="text-left text-base font-black text-white">{home}</p>
      <p className="text-center text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="text-right text-base font-black text-white">{away}</p>
    </div>
  );
}

function TeamCard({ stats, label }: { stats: TeamSeasonStats; label: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs uppercase tracking-[0.16em] text-electric">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={stats.team.logo} alt={stats.team.name} className="h-8 w-8" />
        <p className="text-lg font-black text-white">{stats.team.name}</p>
      </div>
      {stats.form ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {stats.form
            .slice(-10)
            .split("")
            .map((c, i) => (
              <span key={i} className={formChip(c)}>
                {c}
              </span>
            ))}
        </div>
      ) : null}
      <p className="mt-2 text-xs text-slate-400">
        {stats.played} jogos · {stats.wins}V {stats.draws}E {stats.losses}D
      </p>
      {stats.preferredFormation ? (
        <p className="mt-1 text-xs text-slate-400">
          Esquema preferido: <span className="font-bold text-white">{stats.preferredFormation}</span>
        </p>
      ) : null}
    </div>
  );
}

function LineupBlock({ lineup }: { lineup: FixtureLineup }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={lineup.team.logo} alt={lineup.team.name} className="h-7 w-7" />
        <div>
          <p className="text-sm font-black text-white">{lineup.team.name}</p>
          <p className="text-xs text-slate-400">
            {lineup.formation} · {lineup.coach.name}
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="mb-1 font-bold uppercase tracking-[0.16em] text-electric">Titulares</p>
          <ul className="space-y-1 text-slate-300">
            {lineup.startXI.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <span className="inline-flex h-5 w-7 items-center justify-center rounded bg-white/10 text-[10px] font-bold text-white">
                  {p.pos}
                </span>
                <span className="truncate">
                  #{p.number} {p.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1 font-bold uppercase tracking-[0.16em] text-slate-400">Reservas</p>
          <ul className="space-y-1 text-slate-400">
            {lineup.substitutes.slice(0, 8).map((p) => (
              <li key={p.id} className="truncate text-[11px]">
                #{p.number} {p.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function H2HRow({ fx }: { fx: HeadToHeadFixture }) {
  const date = new Date(fx.date);
  const formatted = Number.isNaN(date.getTime())
    ? fx.date
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" }).format(date);
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
      <p className="truncate text-right text-white">{fx.homeName}</p>
      <p className="text-center font-black text-neon">
        {fx.homeGoals ?? "?"} <span className="text-slate-500">x</span> {fx.awayGoals ?? "?"}
      </p>
      <p className="truncate text-left text-white">{fx.awayName}</p>
      <p className="col-span-3 text-center text-[11px] text-slate-500">
        {formatted} · {fx.league}
      </p>
    </div>
  );
}

export function TeamStatsPanel({ enriched }: { enriched: EnrichedStats }) {
  const { home, away, lineups, h2h, awayRecord, homeRecent, awayRecent } = enriched;

  return (
    <div className="space-y-4">
      {home && away ? (
        <Panel accent="border-electric/30">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-5 w-5 text-electric" />
            <h3 className="text-lg font-black text-white">Médias da temporada</h3>
            <StatusPill tone="blue">API-Football</StatusPill>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TeamCard stats={home} label="Mandante" />
            <TeamCard stats={away} label="Visitante" />
          </div>

          <div className="mt-4 space-y-2">
            <StatRow
              label="Gols marcados / jogo"
              home={num(home.avgGoalsScored)}
              away={num(away.avgGoalsScored)}
              highlight
            />
            <StatRow
              label="Gols sofridos / jogo"
              home={num(home.avgGoalsConceded)}
              away={num(away.avgGoalsConceded)}
            />
            <StatRow
              label="Cartões amarelos / jogo"
              home={num(home.yellowCardsPerGame)}
              away={num(away.yellowCardsPerGame)}
            />
            <StatRow
              label="Cartões vermelhos / jogo"
              home={num(home.redCardsPerGame, 3)}
              away={num(away.redCardsPerGame, 3)}
            />
            <StatRow
              label="Clean sheets (campanha)"
              home={String(home.cleanSheets)}
              away={String(away.cleanSheets)}
            />
            <StatRow
              label="Não marcou (campanha)"
              home={String(home.failedToScore)}
              away={String(away.failedToScore)}
            />
          </div>

          {home.goalsByMinute.length > 0 || away.goalsByMinute.length > 0 ? (
            <div className="mt-4">
              <div className="mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-electric" />
                <p className="text-sm font-bold text-white">Gols por faixa de minuto</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-left text-xs">
                  <thead className="text-slate-500">
                    <tr>
                      <th className="py-1">Janela</th>
                      <th>{home.team.name}</th>
                      <th>{away.team.name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {home.goalsByMinute.map((row, idx) => {
                      const awayRow = away.goalsByMinute[idx];
                      return (
                        <tr key={row.window} className="border-t border-white/5 text-slate-300">
                          <td className="py-1.5 font-bold text-white">{row.window}</td>
                          <td>
                            {row.count} <span className="text-slate-500">({row.pct.toFixed(0)}%)</span>
                          </td>
                          <td>
                            {awayRow ? `${awayRow.count}` : "—"}{" "}
                            <span className="text-slate-500">({awayRow?.pct.toFixed(0) ?? "—"}%)</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </Panel>
      ) : null}

      {home && away ? (
        <Panel accent="border-neon/20">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-electric" />
            <h3 className="text-lg font-black text-white">Distribuição por tempo (média da temporada)</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs font-bold text-electric">{home.team.name}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-slate-400">Gols feitos 1T</p>
                  <p className="text-base font-black text-white">{home.goalsScoredByHalf.firstHalf}<span className="ml-1 text-[10px] text-slate-500">({(home.goalsScoredByHalf.firstHalfPct * 100).toFixed(0)}%)</span></p>
                </div>
                <div>
                  <p className="text-slate-400">Gols feitos 2T</p>
                  <p className="text-base font-black text-white">{home.goalsScoredByHalf.secondHalf}<span className="ml-1 text-[10px] text-slate-500">({(home.goalsScoredByHalf.secondHalfPct * 100).toFixed(0)}%)</span></p>
                </div>
                <div>
                  <p className="text-slate-400">Gols sofridos 1T</p>
                  <p className="text-base font-black text-white">{home.goalsConcededByHalf.firstHalf}</p>
                </div>
                <div>
                  <p className="text-slate-400">Gols sofridos 2T</p>
                  <p className="text-base font-black text-white">{home.goalsConcededByHalf.secondHalf}</p>
                </div>
                <div>
                  <p className="text-slate-400">Cartões 1T</p>
                  <p className="text-base font-black text-white">{home.yellowCardsByHalf.firstHalf}</p>
                </div>
                <div>
                  <p className="text-slate-400">Cartões 2T</p>
                  <p className="text-base font-black text-white">{home.yellowCardsByHalf.secondHalf}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs font-bold text-electric">{away.team.name}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-slate-400">Gols feitos 1T</p>
                  <p className="text-base font-black text-white">{away.goalsScoredByHalf.firstHalf}<span className="ml-1 text-[10px] text-slate-500">({(away.goalsScoredByHalf.firstHalfPct * 100).toFixed(0)}%)</span></p>
                </div>
                <div>
                  <p className="text-slate-400">Gols feitos 2T</p>
                  <p className="text-base font-black text-white">{away.goalsScoredByHalf.secondHalf}<span className="ml-1 text-[10px] text-slate-500">({(away.goalsScoredByHalf.secondHalfPct * 100).toFixed(0)}%)</span></p>
                </div>
                <div>
                  <p className="text-slate-400">Gols sofridos 1T</p>
                  <p className="text-base font-black text-white">{away.goalsConcededByHalf.firstHalf}</p>
                </div>
                <div>
                  <p className="text-slate-400">Gols sofridos 2T</p>
                  <p className="text-base font-black text-white">{away.goalsConcededByHalf.secondHalf}</p>
                </div>
                <div>
                  <p className="text-slate-400">Cartões 1T</p>
                  <p className="text-base font-black text-white">{away.yellowCardsByHalf.firstHalf}</p>
                </div>
                <div>
                  <p className="text-slate-400">Cartões 2T</p>
                  <p className="text-base font-black text-white">{away.yellowCardsByHalf.secondHalf}</p>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      ) : null}

      {homeRecent || awayRecent ? (
        <Panel accent="border-electric/20">
          <div className="mb-3 flex items-center gap-2">
            <Crosshair className="h-5 w-5 text-electric" />
            <h3 className="text-lg font-black text-white">Chutes e escanteios (últimos 5 jogos)</h3>
            <StatusPill tone="blue">média</StatusPill>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: home?.team.name ?? "Mandante", agg: homeRecent },
              { label: away?.team.name ?? "Visitante", agg: awayRecent }
            ].map(({ label, agg }) =>
              agg ? (
                <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-xs font-bold text-electric">
                    {label}
                    <span className="ml-2 text-[10px] font-normal text-slate-500">amostra: {agg.sampleSize} jogos</span>
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-400">Chutes a gol/jogo</p>
                      <p className="text-base font-black text-white">{agg.avgShotsOnGoal.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Chutes totais/jogo</p>
                      <p className="text-base font-black text-white">{agg.avgShotsTotal.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Escanteios/jogo</p>
                      <p className="text-base font-black text-neon">{agg.avgCorners.toFixed(1)}</p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-md border border-gold/20 bg-gold/5 p-2 text-[11px] text-gold">
                    Estimativa por tempo (proporcional à distribuição de gols)
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-400">Chutes 1T ~</p>
                      <p className="text-sm font-black text-white">{agg.estShotsFirstHalf.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Chutes 2T ~</p>
                      <p className="text-sm font-black text-white">{agg.estShotsSecondHalf.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Escanteios 1T ~</p>
                      <p className="text-sm font-black text-white">{agg.estCornersFirstHalf.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Escanteios 2T ~</p>
                      <p className="text-sm font-black text-white">{agg.estCornersSecondHalf.toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-400">
                  Sem amostra recente disponível pra {label}.
                </div>
              )
            )}
          </div>
        </Panel>
      ) : null}

      {awayRecord && awayRecord.awayPlayedAsAwayAtHost > 0 ? (
        <Panel accent="border-gold/30">
          <div className="mb-3 flex items-center gap-2">
            <Plane className="h-5 w-5 text-gold" />
            <h3 className="text-lg font-black text-white">
              Retrospecto do visitante na casa do mandante
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-gold/20 bg-gold/5 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-gold">Jogos</p>
              <p className="mt-1 text-2xl font-black text-white">{awayRecord.awayPlayedAsAwayAtHost}</p>
            </div>
            <div className="rounded-lg border border-neon/30 bg-neon/10 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-neon">Vitórias do visitante</p>
              <p className="mt-1 text-2xl font-black text-white">{awayRecord.awayWinsAtHost}</p>
              <p className="mt-1 text-[10px] text-slate-400">
                {awayRecord.awayPlayedAsAwayAtHost > 0
                  ? `${((awayRecord.awayWinsAtHost / awayRecord.awayPlayedAsAwayAtHost) * 100).toFixed(0)}%`
                  : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Empates</p>
              <p className="mt-1 text-2xl font-black text-white">{awayRecord.awayDrawsAtHost}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Derrotas</p>
              <p className="mt-1 text-2xl font-black text-white">{awayRecord.awayLossesAtHost}</p>
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3 text-xs">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-slate-400">Gols marcados como visitante</p>
              <p className="mt-1 text-base font-black text-white">
                {awayRecord.awayGoalsScoredAtHost}{" "}
                <span className="text-[10px] text-slate-500">
                  ({(awayRecord.awayGoalsScoredAtHost / Math.max(1, awayRecord.awayPlayedAsAwayAtHost)).toFixed(2)}/jogo)
                </span>
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-slate-400">Gols sofridos como visitante</p>
              <p className="mt-1 text-base font-black text-white">
                {awayRecord.awayGoalsConcededAtHost}{" "}
                <span className="text-[10px] text-slate-500">
                  ({(awayRecord.awayGoalsConcededAtHost / Math.max(1, awayRecord.awayPlayedAsAwayAtHost)).toFixed(2)}/jogo)
                </span>
              </p>
            </div>
            {awayRecord.lastVisitorWinAtHost ? (
              <div className="rounded-lg border border-neon/20 bg-neon/5 p-3">
                <p className="text-neon">Última vitória do visitante na casa</p>
                <p className="mt-1 text-base font-black text-white">
                  {awayRecord.lastVisitorWinAtHost.score}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">{awayRecord.lastVisitorWinAtHost.date.split("T")[0]}</p>
              </div>
            ) : (
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-slate-400">
                Visitante nunca venceu nesta casa no histórico amostrado.
              </div>
            )}
          </div>
        </Panel>
      ) : awayRecord ? (
        <Panel accent="border-gold/30">
          <div className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-gold" />
            <h3 className="text-base font-black text-white">
              Sem histórico do visitante na casa do mandante
            </h3>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            O provedor não tem confrontos diretos amostrados nessa configuração mandante/visitante.
          </p>
        </Panel>
      ) : null}

      {lineups && lineups.length > 0 ? (
        <Panel>
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-neon" />
            <h3 className="text-lg font-black text-white">Escalações confirmadas</h3>
            <StatusPill tone="green">Lineup</StatusPill>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {lineups.map((l) => (
              <LineupBlock key={l.team.id} lineup={l} />
            ))}
          </div>
        </Panel>
      ) : lineups === null || (lineups && lineups.length === 0) ? (
        <Panel accent="border-gold/30">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gold" />
            <h3 className="text-base font-black text-white">Escalações ainda não publicadas</h3>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            A API-Football só libera escalações quando os times oficializam (em geral 30-60 min antes do jogo).
          </p>
        </Panel>
      ) : null}

      {h2h && h2h.length > 0 ? (
        <Panel>
          <div className="mb-3 flex items-center gap-2">
            <History className="h-5 w-5 text-gold" />
            <h3 className="text-lg font-black text-white">Confrontos diretos (últimos {h2h.length})</h3>
          </div>
          <div className="space-y-2">
            {h2h.map((fx, idx) => (
              <H2HRow key={`${fx.date}-${idx}`} fx={fx} />
            ))}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

export function StatsPendingNotice({ reason }: { reason: string }) {
  return (
    <Panel accent="border-gold/30">
      <div className="flex items-start gap-3">
        <Activity className="h-5 w-5 text-gold" />
        <div>
          <h3 className="text-base font-black text-white">Stats avançados indisponíveis para este jogo</h3>
          <p className="mt-1 text-sm text-slate-400">{reason}</p>
        </div>
      </div>
    </Panel>
  );
}
