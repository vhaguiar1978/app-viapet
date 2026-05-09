import { useEffect, useMemo, useState } from "react";
import "./AdminPages.css";
import { Sparkline, MiniBarChart } from "./AdminCharts.jsx";

function brl(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

function describeStatus(status) {
  switch (status) {
    case "em_dia":
      return { label: "Em dia", tone: "ok" };
    case "trial":
      return { label: "Trial", tone: "info" };
    case "atrasado":
      return { label: "Atrasado", tone: "danger" };
    case "sem_plano":
      return { label: "Sem plano", tone: "muted" };
    case "active":
      return { label: "Ativo", tone: "ok" };
    case "cancelled":
      return { label: "Cancelado", tone: "muted" };
    case "suspended":
      return { label: "Suspenso", tone: "warn" };
    case "pending":
      return { label: "Pendente", tone: "warn" };
    default:
      return { label: status || "—", tone: "muted" };
  }
}

export default function AdminFinancePage({ apiRequest, onOpenClient }) {
  const [snapshot, setSnapshot] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(() => {
    const dt = new Date();
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
  });
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [snap, list] = await Promise.all([
        apiRequest(`/admin/finance/snapshot?month=${month}`),
        apiRequest(`/admin/finance/clients`),
      ]);
      setSnapshot(snap?.data || null);
      setClients(list?.data || []);
    } catch (err) {
      console.error("[AdminFinance]", err);
      setError(err?.message || "Falha ao carregar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const filteredClients = useMemo(() => {
    let list = clients;
    if (filterStatus) list = list.filter((c) => c.derivedStatus === filterStatus);
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(term) ||
          (c.email || "").toLowerCase().includes(term),
      );
    }
    return list;
  }, [clients, filterStatus, search]);

  const totalsFooter = useMemo(() => {
    const sumActive = filteredClients
      .filter((c) => c.subscription?.status === "active")
      .reduce((s, c) => s + (c.monthlyTotal || 0), 0);
    return { count: filteredClients.length, monthlyTotal: sumActive };
  }, [filteredClients]);

  function exportCsv() {
    const header = [
      "Cliente",
      "Email",
      "Plano",
      "Mensalidade ViaPet",
      "Addons (R$)",
      "Total mensal",
      "Próx. vencimento",
      "Status",
    ];
    const rows = filteredClients.map((c) => {
      const sub = c.subscription;
      const addonsTotal = (c.addons || [])
        .filter((a) => a.status === "active")
        .reduce((s, a) => s + (a.amount || 0), 0);
      return [
        c.name || "",
        c.email || "",
        sub?.plan_type || "—",
        sub ? Number(sub.amount).toFixed(2) : "0.00",
        addonsTotal.toFixed(2),
        Number(c.monthlyTotal || 0).toFixed(2),
        sub?.next_billing_date ? formatDate(sub.next_billing_date) : "—",
        describeStatus(c.derivedStatus).label,
      ];
    });
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financeiro-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h2>Financeiro</h2>
          <small>Receita prevista, recebida, inadimplência e detalhe por cliente.</small>
        </div>
        <div className="admin-page-actions">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="admin-input"
          />
          <button type="button" className="admin-btn-secondary" onClick={load} disabled={loading}>
            {loading ? "Atualizando…" : "Atualizar"}
          </button>
          <button type="button" className="admin-btn-secondary" onClick={exportCsv}>
            Exportar CSV
          </button>
        </div>
      </header>

      {error ? <div className="admin-error">{error}</div> : null}

      <section className="admin-cards-row">
        <article className="admin-stat-card admin-stat-primary">
          <span className="admin-stat-kicker">Pagantes ativos</span>
          <strong>{snapshot?.activeUsers?.paying ?? 0}</strong>
          <small>+ {snapshot?.activeUsers?.trial ?? 0} em trial</small>
        </article>
        <article className="admin-stat-card admin-stat-info">
          <span className="admin-stat-kicker">MRR previsto</span>
          <strong>{brl(snapshot?.mrr?.total)}</strong>
          <small>
            base {brl(snapshot?.mrr?.base)} · addons {brl(snapshot?.mrr?.addons)}
          </small>
        </article>
        <article className="admin-stat-card admin-stat-ok">
          <span className="admin-stat-kicker">Recebido em {snapshot?.period?.label || month}</span>
          <strong>{brl(snapshot?.received?.total)}</strong>
          <small>{snapshot?.received?.count ?? 0} pagamentos</small>
        </article>
        <article className="admin-stat-card admin-stat-danger">
          <span className="admin-stat-kicker">Inadimplência</span>
          <strong>{brl(snapshot?.inadimplencia?.total)}</strong>
          <small>{snapshot?.inadimplencia?.count ?? 0} clientes em aberto</small>
        </article>
      </section>

      <section className="admin-cards-row">
        <article className="admin-chart-card">
          <header>
            <span className="admin-stat-kicker">Receita 12 meses</span>
            <strong>{brl((snapshot?.series || []).reduce((s, m) => s + (m.total || 0), 0))}</strong>
          </header>
          <MiniBarChart
            data={(snapshot?.series || []).map((m) => ({ label: m.label, value: m.total }))}
            height={120}
          />
        </article>
        <article className="admin-chart-card">
          <header>
            <span className="admin-stat-kicker">Forecast 90 dias</span>
            <strong>{brl((snapshot?.forecast?.guaranteed?.total || 0) + (snapshot?.forecast?.atRisk?.total || 0))}</strong>
          </header>
          <div className="admin-forecast-grid">
            <div>
              <span>Garantido</span>
              <strong>{brl(snapshot?.forecast?.guaranteed?.total)}</strong>
              <small>{snapshot?.forecast?.guaranteed?.count ?? 0} cobranças</small>
            </div>
            <div>
              <span>Em risco</span>
              <strong className="admin-text-danger">{brl(snapshot?.forecast?.atRisk?.total)}</strong>
              <small>{snapshot?.forecast?.atRisk?.count ?? 0} cobranças</small>
            </div>
          </div>
        </article>
        <article className="admin-chart-card">
          <header>
            <span className="admin-stat-kicker">LTV médio</span>
            <strong>{brl(snapshot?.ltv?.ltv)}</strong>
          </header>
          <small className="admin-chart-foot">{snapshot?.ltv?.payingUsers ?? 0} clientes pagantes históricos</small>
          <div className="admin-cohort-grid">
            {(snapshot?.cohorts || []).map((c) => (
              <div key={c.label} className="admin-cohort-cell" title={`${c.stillActive}/${c.total} ativos`}>
                <span>{c.label}</span>
                <div className="admin-cohort-bar">
                  <div style={{ width: `${Math.round(c.retention * 100)}%` }} />
                </div>
                <small>{Math.round(c.retention * 100)}%</small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="admin-table-card">
        <header className="admin-table-header">
          <h3>Clientes — visão financeira</h3>
          <div className="admin-table-filters">
            <input
              type="search"
              placeholder="Buscar por nome ou email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-input"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="admin-input"
            >
              <option value="">Todos status</option>
              <option value="em_dia">Em dia</option>
              <option value="trial">Trial</option>
              <option value="atrasado">Atrasado</option>
              <option value="sem_plano">Sem plano</option>
            </select>
          </div>
        </header>

        <div className="admin-table">
          <div className="admin-table-row admin-table-head">
            <span>Cliente</span>
            <span>Plano</span>
            <span>Mensalidade</span>
            <span>Addons</span>
            <span>Total/mês</span>
            <span>Vence em</span>
            <span>Status</span>
          </div>
          {filteredClients.map((c) => {
            const sub = c.subscription;
            const addonsActive = (c.addons || []).filter((a) => a.status === "active");
            const addonsTotal = addonsActive.reduce((s, a) => s + (a.amount || 0), 0);
            const status = describeStatus(c.derivedStatus);
            return (
              <button
                type="button"
                key={c.user_id}
                className="admin-table-row admin-table-row-clickable"
                onClick={() => onOpenClient?.(c.user_id)}
              >
                <span className="admin-cell-primary">
                  <strong>{c.name || "(sem nome)"}</strong>
                  <small>{c.email}</small>
                </span>
                <span>{sub?.plan_type || "—"}</span>
                <span>{sub ? brl(sub.amount) : "—"}</span>
                <span>
                  {addonsActive.length > 0 ? (
                    <span title={addonsActive.map((a) => `${a.addon_name}: ${brl(a.amount)}`).join("\n")}>
                      {brl(addonsTotal)} <small>({addonsActive.length})</small>
                    </span>
                  ) : (
                    "—"
                  )}
                </span>
                <span><strong>{brl(c.monthlyTotal)}</strong></span>
                <span>{sub?.next_billing_date ? formatDate(sub.next_billing_date) : "—"}</span>
                <span className={`admin-pill admin-pill-${status.tone}`}>{status.label}</span>
              </button>
            );
          })}
          {!filteredClients.length ? (
            <div className="admin-empty">Nenhum cliente encontrado nesse filtro.</div>
          ) : null}
        </div>

        <footer className="admin-table-footer">
          <span>{totalsFooter.count} cliente{totalsFooter.count !== 1 ? "s" : ""}</span>
          <strong>Soma mensalidades ativas: {brl(totalsFooter.monthlyTotal)}</strong>
        </footer>
      </section>
    </div>
  );
}
