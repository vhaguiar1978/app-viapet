import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BrainCircuit,
  CalendarDays,
  Crown,
  Gauge,
  Heart,
  LineChart,
  Lock,
  Medal,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users
} from "lucide-react";
import { matches, type EnrichedMatch } from "@/lib/mock-data";
import { formatPercent } from "@/lib/analytics";

export const navItems = [
  { href: "/", label: "Início" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/copa", label: "Copa 2026", highlight: true },
  { href: "/planos", label: "Planos" },
  { href: "/proximos", label: "Próximos" },
  { href: "/integracoes", label: "Integrações" },
  { href: "/jogos", label: "Jogos" },
  { href: "/radar", label: "Radar" },
  { href: "/odds", label: "Odds" },
  { href: "/historico", label: "Histórico" },
  { href: "/desempenho", label: "Desempenho" },
  { href: "/alertas", label: "Alertas" },
  { href: "/ranking", label: "Ranking" },
  { href: "/admin", label: "Admin" }
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/82 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-neon/40 bg-neon/12 shadow-glow">
              <BarChart3 className="h-5 w-5 text-neon" />
            </div>
            <div>
              <div className="text-base font-bold tracking-normal text-white">ViaBet Analytics</div>
              <div className="text-xs text-slate-400">Inteligência Esportiva com IA</div>
            </div>
          </Link>
          <nav className="flex max-w-full gap-1 overflow-x-auto rounded-lg border border-white/10 bg-white/[0.03] p-1">
            {navItems.map((item) => {
              const highlight = "highlight" in item && item.highlight;
              const className = highlight
                ? "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-gold/40 bg-gold/15 px-3 py-2 text-sm font-bold text-gold shadow-glow transition hover:bg-gold/25"
                : "whitespace-nowrap rounded-md px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white";
              return (
                <Link className={className} href={item.href} key={item.href}>
                  {highlight ? <Trophy className="h-3.5 w-3.5" /> : null}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
    </div>
  );
}

export function Panel({
  children,
  className = "",
  accent = "border-white/10"
}: {
  children: React.ReactNode;
  className?: string;
  accent?: string;
}) {
  return <section className={`rounded-lg border ${accent} bg-panel/78 p-4 shadow-blue backdrop-blur ${className}`}>{children}</section>;
}

export function PageTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mb-6 max-w-4xl">
      <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-neon/30 bg-neon/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-neon">
        <Sparkles className="h-3.5 w-3.5" />
        {eyebrow}
      </div>
      <h1 className="text-3xl font-black tracking-normal text-white sm:text-5xl">{title}</h1>
      <p className="mt-3 text-base leading-7 text-slate-300 sm:text-lg">{subtitle}</p>
    </div>
  );
}

export function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Panel>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-black text-white">{value}</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-lg border border-electric/30 bg-electric/10 text-electric">{icon}</div>
      </div>
    </Panel>
  );
}

export function StatusPill({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "blue" | "gold" | "red" }) {
  const tones = {
    green: "border-neon/30 bg-neon/10 text-neon",
    blue: "border-electric/30 bg-electric/10 text-electric",
    gold: "border-gold/30 bg-gold/10 text-gold",
    red: "border-red-400/30 bg-red-400/10 text-red-200"
  };
  return <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}

export function MatchCard({ match }: { match: EnrichedMatch }) {
  const movement = match.topMarket.movement;
  return (
    <Link href={`/jogos/${match.id}`}>
      <Panel className="h-full transition hover:-translate-y-0.5 hover:border-neon/40 hover:bg-panel">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap gap-2">
              <StatusPill tone={match.status === "Ao vivo" ? "red" : "blue"}>{match.status}</StatusPill>
              <StatusPill tone="gold">{match.sport}</StatusPill>
            </div>
            <h3 className="mt-4 text-xl font-black text-white">
              {match.home} x {match.away}
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              {match.league} · {match.startTime}
            </p>
          </div>
          <Heart className="h-5 w-5 text-slate-500" />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <MiniStat label="Prob. IA" value={formatPercent(match.topMarket.modelProbability)} />
          <MiniStat label="Odd justa" value={match.fairOdd.toFixed(2)} />
          <MiniStat label="Confiança" value={`${match.confidence}/100`} />
        </div>
        <div className={`mt-4 rounded-lg border border-white/10 p-3 ${movement === "up" ? "tick-up" : movement === "down" ? "tick-down" : ""}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">Melhor oportunidade</p>
              <p className="font-bold text-white">{match.topMarket.name}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-lg font-black text-neon">
                {match.topMarket.bestOdd.toFixed(2)}
                {movement === "up" ? <ArrowUpRight className="h-4 w-4" /> : movement === "down" ? <ArrowDownRight className="h-4 w-4" /> : null}
              </div>
              <p className="text-xs text-slate-400">{match.value}</p>
            </div>
          </div>
        </div>
      </Panel>
    </Link>
  );
}

export function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-base font-black text-white">{value}</p>
    </div>
  );
}

export function OpportunityTable({ compact = false }: { compact?: boolean }) {
  return (
    <Panel>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">Radar de oportunidades</h2>
          <p className="text-sm text-slate-400">Mercados com diferença positiva entre modelo e mercado.</p>
        </div>
        <Gauge className="h-6 w-6 text-neon" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr className="border-b border-white/10">
              <th className="py-3">Jogo</th>
              <th>Mercado</th>
              <th>Prob. IA</th>
              <th>Odd justa</th>
              <th>Melhor odd</th>
              <th>Valor</th>
              <th>Risco</th>
            </tr>
          </thead>
          <tbody>
            {matches.slice(0, compact ? 4 : matches.length).map((match) => (
              <tr className="border-b border-white/5 text-slate-300" key={match.id}>
                <td className="py-4 font-semibold text-white">{match.home} x {match.away}</td>
                <td>{match.topMarket.name}</td>
                <td>{formatPercent(match.topMarket.modelProbability)}</td>
                <td>{match.fairOdd.toFixed(2)}</td>
                <td className="font-bold text-neon">{match.topMarket.bestOdd.toFixed(2)}</td>
                <td><StatusPill tone={match.value.includes("alto") ? "green" : "gold"}>{match.value}</StatusPill></td>
                <td>{match.risk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function ResponsibleNotice() {
  return (
    <div className="rounded-lg border border-gold/30 bg-gold/10 p-4 text-sm leading-6 text-gold">
      <div className="mb-1 flex items-center gap-2 font-bold text-white">
        <ShieldCheck className="h-4 w-4 text-gold" />
        18+ · Jogo responsável
      </div>
      As análises do ViaBet Analytics são estimativas estatísticas e informativas. Nenhuma análise garante resultado. A plataforma não recebe apostas diretamente.
    </div>
  );
}

export const icons = {
  Activity,
  AlertTriangle,
  Bell,
  BrainCircuit,
  CalendarDays,
  Crown,
  LineChart,
  Lock,
  Medal,
  Trophy,
  Users
};
