import Link from "next/link";
import { ArrowRight, BarChart3, Bell, BrainCircuit, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { Panel, ResponsibleNotice, Shell, StatusPill } from "@/components/ui";
import { getWorldCupGames } from "@/lib/providers/worldcup";

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

export default async function HomePage() {
  const worldCup = await getWorldCupGames();
  const firstGame = worldCup.games[0];
  const bestOdd = firstGame && firstGame.odds.length
    ? [...firstGame.odds].sort((a, b) => b.price - a.price)[0]
    : null;

  return (
    <Shell>
      <section className="grid min-h-[calc(100vh-7rem)] items-center gap-8 lg:grid-cols-[1.02fr_0.98fr]">
        <div>
          <StatusPill tone="green">ViaBet Analytics · Modo real</StatusPill>
          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-normal text-white sm:text-6xl">
            Analise como profissional. Aposte com consciência.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Inteligência esportiva com IA para analisar jogos, comparar odds em tempo real e identificar
            oportunidades estatísticas antes do mercado fechar.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center gap-2 rounded-lg bg-neon px-5 py-3 font-black text-ink transition hover:brightness-110"
              href="/jogos"
            >
              Escolher liga
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-lg border border-gold/40 bg-gold/15 px-5 py-3 font-black text-gold transition hover:bg-gold/25"
              href="/copa"
            >
              <Trophy className="h-4 w-4" />
              Copa 2026
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 font-bold text-white transition hover:bg-white/10"
              href="/odds"
            >
              Comparador de odds
            </Link>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              ["Probabilidades IA", BrainCircuit],
              ["Comparador de odds", BarChart3],
              ["Alertas inteligentes", Bell]
            ].map(([label, Icon]) => (
              <Panel key={String(label)}>
                <Icon className="h-5 w-5 text-electric" />
                <p className="mt-3 font-bold text-white">{String(label)}</p>
              </Panel>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Panel accent="border-gold/30" className="shadow-glow">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gold">Destaque da Copa 2026</p>
                <h2 className="text-2xl font-black text-white">
                  {firstGame ? `${firstGame.home} x ${firstGame.away}` : "Aguardando feed"}
                </h2>
                <p className="text-xs text-slate-400">
                  {firstGame ? `${firstGame.league} · ${formatStart(firstGame.startTime)}` : worldCup.message}
                </p>
              </div>
              <Sparkles className="h-7 w-7 text-gold" />
            </div>
            {bestOdd ? (
              <div className="rounded-lg border border-gold/20 bg-gold/5 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-gold">Melhor odd encontrada</p>
                <div className="mt-1 flex items-end justify-between gap-3">
                  <div>
                    <p className="font-bold text-white">{bestOdd.selection}</p>
                    <p className="text-xs text-slate-400">
                      {bestOdd.market} · {bestOdd.bookmaker}
                    </p>
                  </div>
                  <p className="text-3xl font-black text-gold">{bestOdd.price.toFixed(2)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Os jogos da Copa aparecem aqui assim que entram no provider.</p>
            )}
            <Link
              href="/copa"
              className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-gold hover:underline"
            >
              Ver todos da Copa <ArrowRight className="h-3 w-3" />
            </Link>
          </Panel>
          <ResponsibleNotice />
        </div>
      </section>
      <section className="py-8">
        <Link href="/planos" className="block">
          <Panel accent="border-neon/30" className="transition hover:-translate-y-0.5 hover:bg-panel">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <StatusPill tone="green">Lançamento limitado</StatusPill>
                <h2 className="mt-2 text-2xl font-black text-white">3 planos. Comece grátis, evolua quando quiser.</h2>
                <p className="mt-1 text-sm text-slate-300">
                  Grátis pra conhecer · Pro a R$ 39/mês · Elite a R$ 99/mês · Primeiros 100 assinantes pagam R$ 29 pra sempre.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-lg bg-neon px-4 py-3 font-black text-ink">
                Ver planos <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Panel>
        </Link>
      </section>
    </Shell>
  );
}
