import { useEffect, useMemo, useState } from "react";
import "./AdminPages.css";
import { exportCsv } from "./adminUtils.js";

function brl(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatDate(value) {
  if (!value) return "—";
  try { return new Date(value).toLocaleDateString("pt-BR"); } catch { return "—"; }
}
function relativeFromNow(value) {
  if (!value) return "nunca";
  const dt = new Date(value);
  const diff = Date.now() - dt.getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  return `há ${days} dias`;
}

export default function AdminRankingPage({ apiRequest, onOpenClient }) {
  const [clients, setClients] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("revenue");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [clientsRes, activityRes] = await Promise.all([
        apiRequest("/admin/finance/clients"),
        apiRequest("/admin/user-activity/users?days=30"),
      ]);
      setClients(clientsRes?.data || []);
      setActivity(activityRes?.data || []);
    } catch (err) {
      setError(err?.message || "Falha ao carregar ranking");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ranks = useMemo(() => {
    const activityById = new Map(activity.map((u) => [u.id, u.eventsInPeriod || 0]));
    const enriched = clients.map((c) => ({
      ...c,
      events: activityById.get(c.user_id) || 0,
    }));

    const byRevenue = [...enriched].sort((a, b) => (b.monthlyTotal || 0) - (a.monthlyTotal || 0));
    const byActivity = [...enriched].sort((a, b) => (b.events || 0) - (a.events || 0));
    const byNewest = [...enriched].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    );
    const dormant = [...enriched]
      .filter((c) => !c.lastAccess || new Date(c.lastAccess) < Date.now() - 7 * 86400000)
      .sort((a, b) => new Date(a.lastAccess || 0) - new Date(b.lastAccess || 0));

    return { byRevenue, byActivity, byNewest, dormant };
  }, [clients, activity]);

  const tabs = [
    { id: "revenue", label: "Maior receita" },
    { id: "activity", label: "Mais ativos" },
    { id: "newest", label: "Mais novos" },
    { id: "dormant", label: "Dormentes" },
  ];

  const list = ranks[
    tab === "revenue" ? "byRevenue" : tab === "activity" ? "byActivity" : tab === "newest" ? "byNewest" : "dormant"
  ];

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h2>Ranking de Clientes</h2>
          <small>Comparativo de quem dá mais receita, mais ativo, mais novo e quem está dormindo.</small>
        </div>
        <div className="admin-page-actions">
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() =>
              exportCsv(
                `ranking-${tab}-${new Date().toISOString().slice(0, 10)}`,
                ["#", "Cliente", "Email", "Mensalidade", "Eventos 30d", "Cadastro", "Último acesso"],
                list.map((c, idx) => [
                  idx + 1,
                  c.name || "",
                  c.email || "",
                  Number(c.monthlyTotal || 0).toFixed(2),
                  c.events || 0,
                  c.createdAt || "",
                  c.lastAccess || "",
                ]),
              )
            }
          >
            Exportar CSV
          </button>
          <button type="button" className="admin-btn-secondary" onClick={load} disabled={loading}>
            {loading ? "Atualizando…" : "Atualizar"}
          </button>
        </div>
      </header>

      {error ? <div className="admin-error">{error}</div> : null}

      <section className="admin-table-card">
        <header className="admin-table-header">
          <div className="admin-rank-tabs">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`admin-rank-tab ${tab === t.id ? "active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <small>{list.length} clientes</small>
        </header>

        <div className="admin-table">
          <div className="admin-table-row admin-table-head admin-rank-row">
            <span>#</span>
            <span>Cliente</span>
            <span>Mensalidade</span>
            <span>Eventos 30d</span>
            <span>Cadastro</span>
            <span>Último acesso</span>
          </div>
          {list.map((c, idx) => (
            <button
              type="button"
              key={c.user_id}
              className="admin-table-row admin-table-row-clickable admin-rank-row"
              onClick={() => onOpenClient?.(c.user_id)}
            >
              <span className="admin-rank-pos">{idx + 1}</span>
              <span className="admin-cell-primary">
                <strong>{c.name}</strong>
                <small>{c.email}</small>
              </span>
              <span><strong>{brl(c.monthlyTotal)}</strong></span>
              <span>{c.events}</span>
              <span>{formatDate(c.createdAt)}</span>
              <span>{relativeFromNow(c.lastAccess)}</span>
            </button>
          ))}
          {!list.length ? <div className="admin-empty">Sem dados nesse recorte.</div> : null}
        </div>
      </section>
    </div>
  );
}
