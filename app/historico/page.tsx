"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BookmarkPlus,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  History as HistoryIcon,
  RotateCcw,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
  XCircle
} from "lucide-react";
import { PageTitle, Panel, ResponsibleNotice, Shell, StatusPill } from "@/components/ui";
import {
  clearAll,
  computeMetrics,
  listSaved,
  removeAnalysis,
  updateOutcome,
  updateStake,
  type SavedAnalysis,
  type SavedOutcome
} from "@/lib/history/storage";

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo"
  }).format(d);
}

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

function unitsFmt(v: number) {
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}u`;
}

const OUTCOME_LABELS: Record<SavedOutcome, string> = {
  pending: "Pendente",
  win: "Acerto",
  loss: "Erro",
  push: "Push",
  void: "Anulado"
};

const OUTCOME_TONES: Record<SavedOutcome, "green" | "red" | "gold" | "blue"> = {
  pending: "gold",
  win: "green",
  loss: "red",
  push: "blue",
  void: "blue"
};

export default function HistoricoPage() {
  const [entries, setEntries] = useState<SavedAnalysis[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "settled">("all");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEntries(listSaved());
    setHydrated(true);
  }, []);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (filter === "pending" && e.outcome !== "pending") return false;
      if (filter === "settled" && e.outcome === "pending") return false;
      if (sportFilter !== "all" && e.sport !== sportFilter) return false;
      return true;
    });
  }, [entries, filter, sportFilter]);

  const sportsAvailable = useMemo(() => {
    const set = new Set(entries.map((e) => e.sport));
    return Array.from(set).sort();
  }, [entries]);

  const metrics = useMemo(() => computeMetrics(filtered), [filtered]);

  const handleOutcome = (id: string, outcome: SavedOutcome) => {
    updateOutcome(id, outcome);
    setEntries(listSaved());
  };
  const handleStake = (id: string, raw: string) => {
    const v = parseFloat(raw);
    if (Number.isNaN(v) || v <= 0) return;
    updateStake(id, v);
    setEntries(listSaved());
  };
  const handleRemove = (id: string) => {
    if (!window.confirm("Remover este registro do histórico?")) return;
    removeAnalysis(id);
    setEntries(listSaved());
  };
  const handleClearAll = () => {
    if (!window.confirm("Apagar TODO o histórico salvo? Isso não tem volta.")) return;
    clearAll();
    setEntries([]);
  };

  return (
    <Shell>
      <PageTitle
        eyebrow="Meu histórico"
        title="Avaliação real do sistema, jogo a jogo"
        subtitle="Salve as análises que te interessam, marque o resultado depois do apito final e veja sua taxa de acerto e ROI simulado se transformando ao longo do tempo."
      />

      {hydrated && entries.length === 0 ? (
        <Panel accent="border-gold/30">
          <div className="flex items-start gap-3">
            <BookmarkPlus className="h-6 w-6 text-gold" />
            <div>
              <h2 className="text-xl font-black text-white">Nenhuma análise salva ainda</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Entra em <Link className="text-neon hover:underline" href="/jogos">/jogos</Link>, abre o detalhe de qualquer
                jogo e clica em <span className="font-bold text-gold">&quot;Salvar análise no meu histórico&quot;</span>.
                A partir daí, o sistema acompanha quantos palpites do top pick acertaram e o ROI simulado da estratégia.
              </p>
              <p className="mt-3 text-xs text-slate-500">
                Dados ficam neste navegador (localStorage). Sem login ainda — quando o backend for ativado, importamos.
              </p>
            </div>
          </div>
        </Panel>
      ) : null}

      {hydrated && entries.length > 0 ? (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <Panel>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg border border-electric/30 bg-electric/10 text-electric">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Análises salvas</p>
                  <p className="text-2xl font-black text-white">{metrics.total}</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {metrics.pending} pendentes · {metrics.settled} resolvidos
              </p>
            </Panel>
            <Panel accent={metrics.hitRate >= 0.55 ? "border-neon/30" : "border-white/10"}>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg border border-neon/30 bg-neon/10 text-neon">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Taxa de acerto</p>
                  <p className="text-2xl font-black text-white">{pct(metrics.hitRate)}</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {metrics.wins}V {metrics.losses}D {metrics.pushes}P
              </p>
            </Panel>
            <Panel accent={metrics.unitsProfit > 0 ? "border-neon/30" : metrics.unitsProfit < 0 ? "border-red-400/30" : "border-white/10"}>
              <div className="flex items-center gap-3">
                <div className={`grid h-11 w-11 place-items-center rounded-lg border ${metrics.unitsProfit >= 0 ? "border-neon/30 bg-neon/10 text-neon" : "border-red-400/30 bg-red-400/10 text-red-300"}`}>
                  {metrics.unitsProfit >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm text-slate-400">Lucro simulado</p>
                  <p className={`text-2xl font-black ${metrics.unitsProfit >= 0 ? "text-white" : "text-red-200"}`}>
                    {unitsFmt(metrics.unitsProfit)}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {metrics.unitsStaked.toFixed(2)}u arriscados
              </p>
            </Panel>
            <Panel accent={metrics.roiPct >= 5 ? "border-gold/30" : "border-white/10"}>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg border border-gold/30 bg-gold/10 text-gold">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">ROI simulado</p>
                  <p className={`text-2xl font-black ${metrics.roiPct >= 0 ? "text-white" : "text-red-200"}`}>
                    {metrics.roiPct >= 0 ? "+" : ""}
                    {metrics.roiPct.toFixed(1)}%
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">Lucro ÷ unidades apostadas</p>
            </Panel>
          </div>

          <Panel className="mb-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-electric">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-bold uppercase tracking-[0.16em]">Filtros</span>
              </div>
              <div className="flex gap-1 rounded-md border border-white/10 bg-white/[0.03] p-1">
                {(["all", "pending", "settled"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={
                      filter === f
                        ? "rounded px-3 py-1.5 text-xs font-bold bg-neon/15 text-neon"
                        : "rounded px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
                    }
                  >
                    {f === "all" ? "Todos" : f === "pending" ? "Pendentes" : "Resolvidos"}
                  </button>
                ))}
              </div>
              {sportsAvailable.length > 1 ? (
                <select
                  value={sportFilter}
                  onChange={(e) => setSportFilter(e.target.value)}
                  className="rounded-md border border-white/10 bg-ink/60 px-3 py-1.5 text-sm text-white"
                >
                  <option value="all">Todos os esportes</option>
                  {sportsAvailable.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : null}
              <button
                onClick={handleClearAll}
                className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-red-400/30 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-400/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Limpar tudo
              </button>
            </div>
          </Panel>

          <div className="space-y-3">
            {filtered.map((entry) => (
              <Panel key={entry.id}>
                <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={OUTCOME_TONES[entry.outcome]}>{OUTCOME_LABELS[entry.outcome]}</StatusPill>
                      <StatusPill tone="blue">{entry.sport}</StatusPill>
                      <span className="text-xs text-slate-500">{entry.league}</span>
                    </div>
                    <Link
                      href={`/jogos/${encodeURIComponent(entry.matchId)}?sport=${encodeURIComponent(entry.sportKey)}`}
                      className="mt-2 inline-block text-xl font-black text-white hover:text-neon"
                    >
                      {entry.home} <span className="text-slate-500">x</span> {entry.away}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Jogo: {fmtDate(entry.startTime)}
                      </span>
                      <span>Salvo: {fmtDate(entry.savedAt)}</span>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-4 text-sm">
                      <div className="rounded-md border border-gold/30 bg-gold/10 p-2">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-gold">Palpite</p>
                        <p className="font-bold text-white">{entry.pick.label}</p>
                      </div>
                      <div className="rounded-md border border-white/10 bg-white/[0.03] p-2">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Prob. justa</p>
                        <p className="font-bold text-white">{pct(entry.pick.fairProb)}</p>
                      </div>
                      <div className="rounded-md border border-white/10 bg-white/[0.03] p-2">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Odd salva</p>
                        <p className="font-bold text-neon">{entry.pick.bestPrice.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400">{entry.pick.bestBookmaker}</p>
                      </div>
                      <div className="rounded-md border border-white/10 bg-white/[0.03] p-2">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Stake (u)</p>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          defaultValue={entry.stake}
                          onBlur={(e) => handleStake(entry.id, e.target.value)}
                          className="mt-0.5 w-full rounded border border-white/10 bg-ink/40 px-2 py-1 text-sm font-bold text-white focus:border-neon focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:min-w-[14rem]">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-electric">Resultado</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleOutcome(entry.id, "win")}
                        className={
                          entry.outcome === "win"
                            ? "inline-flex items-center justify-center gap-1 rounded-md border border-neon bg-neon/20 px-3 py-2 text-xs font-bold text-neon"
                            : "inline-flex items-center justify-center gap-1 rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:border-neon/40 hover:text-white"
                        }
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Acerto
                      </button>
                      <button
                        onClick={() => handleOutcome(entry.id, "loss")}
                        className={
                          entry.outcome === "loss"
                            ? "inline-flex items-center justify-center gap-1 rounded-md border border-red-400 bg-red-400/20 px-3 py-2 text-xs font-bold text-red-200"
                            : "inline-flex items-center justify-center gap-1 rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:border-red-400/40 hover:text-white"
                        }
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Erro
                      </button>
                      <button
                        onClick={() => handleOutcome(entry.id, "push")}
                        className={
                          entry.outcome === "push"
                            ? "inline-flex items-center justify-center gap-1 rounded-md border border-electric bg-electric/20 px-3 py-2 text-xs font-bold text-electric"
                            : "inline-flex items-center justify-center gap-1 rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:border-electric/40 hover:text-white"
                        }
                      >
                        Push
                      </button>
                      <button
                        onClick={() => handleOutcome(entry.id, "void")}
                        className={
                          entry.outcome === "void"
                            ? "inline-flex items-center justify-center gap-1 rounded-md border border-slate-400 bg-slate-400/20 px-3 py-2 text-xs font-bold text-slate-300"
                            : "inline-flex items-center justify-center gap-1 rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:border-slate-400/40 hover:text-white"
                        }
                      >
                        Anulado
                      </button>
                    </div>
                    {entry.outcome !== "pending" ? (
                      <button
                        onClick={() => handleOutcome(entry.id, "pending")}
                        className="text-[10px] text-slate-500 hover:text-slate-300"
                      >
                        Marcar como pendente
                      </button>
                    ) : null}
                    <button
                      onClick={() => handleRemove(entry.id)}
                      className="inline-flex items-center justify-center gap-1 rounded-md border border-white/10 px-3 py-1.5 text-[11px] text-slate-400 hover:border-red-400/40 hover:text-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remover
                    </button>
                  </div>
                </div>
              </Panel>
            ))}
            {filtered.length === 0 ? (
              <Panel className="text-center text-sm text-slate-400">
                Nenhuma análise corresponde aos filtros atuais.
              </Panel>
            ) : null}
          </div>
        </>
      ) : null}

      {!hydrated ? (
        <Panel>
          <p className="text-sm text-slate-400">Carregando histórico…</p>
        </Panel>
      ) : null}

      <div className="mt-6">
        <ResponsibleNotice />
      </div>
    </Shell>
  );
}
