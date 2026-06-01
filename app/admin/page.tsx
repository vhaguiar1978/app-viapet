import { Database, Layers, Settings, ShieldCheck, Trophy } from "lucide-react";
import Link from "next/link";
import { PageTitle, Panel, Shell, StatusPill } from "@/components/ui";
import { BackendPendingNotice, PendingMetric } from "@/components/backend-pending";
import { getSportsList } from "@/lib/providers/leagues";
import { getUpcomingGames } from "@/lib/providers/upcoming";
import { getWorldCupGames } from "@/lib/providers/worldcup";

export const dynamic = "force-dynamic";

const modules = [
  "Usuários",
  "Planos",
  "Esportes",
  "Ligas",
  "Jogos",
  "Odds",
  "Análises IA",
  "Alertas enviados",
  "Casas parceiras",
  "Afiliados",
  "Conteúdo automático",
  "Logs e auditoria",
  "Configurações de IA"
];

export default async function AdminPage() {
  const [sports, upcoming, worldCup] = await Promise.all([
    getSportsList(),
    getUpcomingGames(),
    getWorldCupGames()
  ]);

  return (
    <Shell>
      <PageTitle
        eyebrow="Painel admin"
        title="Operação, compliance e dados"
        subtitle="Status dos provedores reais conectados. Métricas operacionais (usuários, alertas enviados, planos) aparecem quando o Supabase for ligado."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Panel>
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg border border-neon/30 bg-neon/10 text-neon">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Ligas no provider</p>
              <p className="text-2xl font-black text-white">{sports.flat.length}</p>
            </div>
          </div>
        </Panel>
        <Panel>
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg border border-electric/30 bg-electric/10 text-electric">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Próximos jogos</p>
              <p className="text-2xl font-black text-white">{upcoming.games.length}</p>
            </div>
          </div>
        </Panel>
        <Panel accent="border-gold/30">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg border border-gold/30 bg-gold/10 text-gold">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gold">Copa 2026</p>
              <p className="text-2xl font-black text-white">{worldCup.games.length}</p>
            </div>
          </div>
        </Panel>
        <PendingMetric label="Usuários cadastrados" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_22rem]">
        <Panel>
          <h2 className="mb-4 text-xl font-black text-white">Módulos administrativos</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <button
                className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-left font-semibold text-white opacity-60 hover:border-electric/40"
                key={module}
                title="Aguardando backend Supabase"
                disabled
              >
                {module}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Os módulos abrem CRUDs reais quando o Supabase estiver conectado e o usuário admin logado.
          </p>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-electric" />
              <h2 className="text-xl font-black text-white">Schema preparado</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              23 tabelas em <code className="rounded bg-white/10 px-1">supabase/schema.sql</code>:
              profiles, subscriptions, sports, leagues, teams, players, matches, bookmakers, markets, odds,
              predictions, ai_analyses, alerts, favorites, rankings, affiliates, audit_logs, app_settings.
            </p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-md border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs font-bold text-gold">
              Schema escrito · não migrado
            </p>
          </Panel>

          <Panel>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-gold" />
              <h2 className="text-xl font-black text-white">Compliance</h2>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusPill tone="gold">18+</StatusPill>
              <StatusPill tone="gold">Sem promessa de lucro</StatusPill>
              <StatusPill tone="gold">Sem apostas diretas</StatusPill>
              <StatusPill tone="blue">Operadores autorizados</StatusPill>
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-neon" />
              <h2 className="text-xl font-black text-white">Provedores ativos</h2>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li>
                <StatusPill tone="green">The Odds API</StatusPill> odds + jogos
              </li>
              <li>
                <StatusPill tone="green">TheSportsDB</StatusPill> agenda alternativa
              </li>
              <li>
                <StatusPill tone="gold">Supabase</StatusPill> auth + db pendente
              </li>
            </ul>
            <Link
              href="/integracoes"
              className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-neon hover:underline"
            >
              Configurar provedores →
            </Link>
          </Panel>
        </div>
      </div>
    </Shell>
  );
}
