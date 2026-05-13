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
  if (isNaN(dt.getTime())) return "—";
  // Compara por DIA do calendário (não por horas decorridas),
  // para que algo "ontem às 23h" não vire "hoje" só porque <24h se passaram.
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(new Date()) - startOfDay(dt)) / 86400000);
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  return `há ${days} dias`;
}

function normalizeWhatsappNumber(phone) {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return "";
  // Adiciona DDI Brasil (55) se ainda não estiver presente.
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export default function AdminRankingPage({ apiRequest, onOpenClient }) {
  const [clients, setClients] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("activity");

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
    { id: "activity", label: "Mais ativos" },
    { id: "revenue", label: "Maior receita" },
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
            <span>WhatsApp</span>
            <span>Mensalidade</span>
            <span>Eventos 30d</span>
            <span>Cadastro</span>
            <span>Último acesso</span>
          </div>
          {list.map((c, idx) => {
            const waNumber = normalizeWhatsappNumber(c.phone);
            return (
              <div
                role="button"
                tabIndex={0}
                key={c.user_id}
                className="admin-table-row admin-table-row-clickable admin-rank-row"
                onClick={() => onOpenClient?.(c.user_id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpenClient?.(c.user_id);
                  }
                }}
              >
                <span className="admin-rank-pos">{idx + 1}</span>
                <span className="admin-cell-primary">
                  <strong>{c.name}</strong>
                  <small>{c.email}</small>
                </span>
                <span>
                  {waNumber ? (
                    <a
                      href={`https://wa.me/${waNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-wa-btn"
                      title={`Abrir WhatsApp de ${c.name || "cliente"}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M19.05 4.91A10 10 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01zm-7.01 15.24h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.21 8.21 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.17.25-.64.8-.79.97-.15.17-.29.19-.54.06-.25-.12-1.04-.38-1.99-1.22-.74-.66-1.23-1.47-1.37-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.83-.2-.48-.4-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.02 2.57.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.11-.23-.17-.48-.29z"
                        />
                      </svg>
                    </a>
                  ) : (
                    <span className="admin-wa-empty" title="Cliente sem telefone">—</span>
                  )}
                </span>
                <span><strong>{brl(c.monthlyTotal)}</strong></span>
                <span>{c.events}</span>
                <span>{formatDate(c.createdAt)}</span>
                <span>{relativeFromNow(c.lastAccess)}</span>
              </div>
            );
          })}
          {!list.length ? <div className="admin-empty">Sem dados nesse recorte.</div> : null}
        </div>
      </section>
    </div>
  );
}
