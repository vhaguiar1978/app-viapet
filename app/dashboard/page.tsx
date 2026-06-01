import { ArrowRight, BarChart3, Bell, CalendarDays, Layers, Trophy } from "lucide-react";
import Link from "next/link";
import { PageTitle, Panel, ResponsibleNotice, Shell, StatusPill } from "@/components/ui";
import { BackendPendingNotice, PendingMetric } from "@/components/backend-pending";
import { getSportsList } from "@/lib/providers/leagues";
import { getUpcomingGames } from "@/lib/providers/upcoming";
import { getWorldCupGames } from "@/lib/providers/worldcup";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [sports, upcoming, worldCup] = await Promise.all([
    getSportsList(),
    getUpcomingGames(),
    getWorldCupGames()
  ]);

  return (
    <Shell>
      <PageTitle
        eyebrow="Dashboard principal"
        title="Central de inteligência esportiva"
        subtitle="Visão operacional sobre os feeds reais conectados. Métricas de usuário (acerto, ROI, ranking) aparecem após o Supabase ser ligado."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">Ligas ativas no provider</p>
              <p className="mt-1 text-2xl font-black text-white">{sports.flat.length}</p>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-lg border border-neon/30 bg-neon/10 text-neon">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">{sports.groups.length} esportes</p>
        </Panel>
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">Próximos jogos (geral)</p>
              <p className="mt-1 text-2xl font-black text-white">{upcoming.games.length}</p>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-lg border border-electric/30 bg-electric/10 text-electric">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">Fonte: {upcoming.source}</p>
        </Panel>
        <Panel accent="border-gold/30">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gold">Copa do Mundo 2026</p>
              <p className="mt-1 text-2xl font-black text-white">{worldCup.games.length}</p>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-lg border border-gold/30 bg-gold/10 text-gold">
              <Trophy className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">Jogos com odds</p>
        </Panel>
        <PendingMetric label="Alertas do usuário" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Panel>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white">Status dos provedores</h2>
              <p className="text-sm text-slate-400">{sports.message}</p>
            </div>
            <BarChart3 className="h-6 w-6 text-neon" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/jogos"
              className="rounded-lg border border-white/10 bg-white/[0.03] p-3 transition hover:border-neon/40 hover:bg-white/[0.06]"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-electric">Jogos por liga</p>
              <p className="mt-1 font-bold text-white">Selecionar liga →</p>
              <p className="mt-1 text-xs text-slate-400">Brasileirão, NBA, Champions e mais</p>
            </Link>
            <Link
              href="/copa"
              className="rounded-lg border border-gold/30 bg-gold/10 p-3 transition hover:bg-gold/20"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-gold">Edição especial</p>
              <p className="mt-1 font-bold text-white">Copa do Mundo 2026 →</p>
              <p className="mt-1 text-xs text-slate-300">{worldCup.games.length} jogos com odds</p>
            </Link>
            <Link
              href="/odds"
              className="rounded-lg border border-white/10 bg-white/[0.03] p-3 transition hover:border-neon/40 hover:bg-white/[0.06]"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-electric">Comparador</p>
              <p className="mt-1 font-bold text-white">Melhor preço por mercado →</p>
              <p className="mt-1 text-xs text-slate-400">Casa a casa</p>
            </Link>
            <Link
              href="/proximos"
              className="rounded-lg border border-white/10 bg-white/[0.03] p-3 transition hover:border-neon/40 hover:bg-white/[0.06]"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-electric">Agenda</p>
              <p className="mt-1 font-bold text-white">Próximos jogos →</p>
              <p className="mt-1 text-xs text-slate-400">{upcoming.games.length} no feed agora</p>
            </Link>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel accent="border-gold/30">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-gold" />
              <h2 className="text-xl font-black text-white">Métricas do usuário</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Taxa de acerto, ROI simulado, ranking e alertas dependem de login + banco de dados. Estas
              métricas só serão preenchidas quando o Supabase for ligado, para evitar mostrar números
              falsos.
            </p>
            <Link
              href="/desempenho"
              className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-gold hover:underline"
            >
              Ver detalhe <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Panel>
          <Panel>
            <h2 className="text-xl font-black text-white">Modo ativo</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusPill tone="green">DATA_MODE=real</StatusPill>
              <StatusPill tone="green">The Odds API</StatusPill>
              <StatusPill tone="gold">Supabase pendente</StatusPill>
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-6">
        <ResponsibleNotice />
      </div>
    </Shell>
  );
}
