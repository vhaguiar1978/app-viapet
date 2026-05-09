import { useEffect, useMemo, useState } from "react";
import "./AdminPages.css";
import { exportCsv, readGlobalFilter, writeGlobalFilter } from "./adminUtils.js";

function formatDateTime(v) {
  if (!v) return "—";
  try { return new Date(v).toLocaleString("pt-BR"); } catch { return "—"; }
}
function relativeFromNow(v) {
  if (!v) return "—";
  const dt = new Date(v);
  const diff = Date.now() - dt.getTime();
  if (diff < 60000) return "agora";
  if (diff < 3600000) return `há ${Math.floor(diff / 60000)}min`;
  if (diff < 86400000) return `há ${Math.floor(diff / 3600000)}h`;
  return `há ${Math.floor(diff / 86400000)} dias`;
}

const ACTION_LABELS = {
  client_renew_plan: "Renovou plano",
  client_renew: "Renovou plano",
  client_update: "Editou cliente",
  client_delete: "Excluiu cliente",
  client_suspend: "Suspendeu cliente",
  client_reset_password: "Resetou senha",
  client_first_access: "Liberou primeiro acesso",
  addon_create: "Criou addon",
  addon_update: "Atualizou addon",
  addon_delete: "Apagou addon",
  addon_assign: "Atribuiu addon",
  addon_unassign: "Cancelou addon",
};

export default function AdminAuditPage({ apiRequest }) {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDaysState] = useState(() => readGlobalFilter().period || "30");
  const setDays = (value) => {
    setDaysState(value);
    writeGlobalFilter({ period: value });
  };
  useEffect(() => {
    const handler = () => {
      const next = readGlobalFilter().period;
      if (next && next !== days) setDaysState(next);
    };
    window.addEventListener("viapet:adminFilterChanged", handler);
    return () => window.removeEventListener("viapet:adminFilterChanged", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);
  const [actionFilter, setActionFilter] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ days, limit: "200" });
      if (actionFilter) qs.set("action", actionFilter);
      const [logsRes, summaryRes] = await Promise.all([
        apiRequest(`/admin/audit?${qs.toString()}`),
        apiRequest(`/admin/audit/summary?days=${days}`),
      ]);
      setLogs(logsRes?.data?.items || []);
      setSummary(summaryRes?.data || null);
    } catch (err) {
      setError(err?.message || "Falha ao carregar audit log");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, actionFilter]);

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.action))).sort();
  }, [logs]);

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h2>Auditoria do Admin</h2>
          <small>Toda ação que você executa neste painel fica registrada aqui.</small>
        </div>
        <div className="admin-page-actions">
          <select className="admin-input" value={days} onChange={(e) => setDays(e.target.value)}>
            <option value="1">Hoje</option>
            <option value="7">7 dias</option>
            <option value="30">30 dias</option>
            <option value="90">90 dias</option>
          </select>
          <select
            className="admin-input"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">Todas ações</option>
            {uniqueActions.map((a) => (
              <option key={a} value={a}>{ACTION_LABELS[a] || a}</option>
            ))}
          </select>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() =>
              exportCsv(
                `audit-${days}d-${new Date().toISOString().slice(0, 10)}`,
                ["Quando", "Admin", "Ação", "Método", "Path", "Alvo", "Status"],
                logs.map((l) => [
                  formatDateTime(l.created_at),
                  l.admin_name || "",
                  ACTION_LABELS[l.action] || l.action,
                  l.method || "",
                  l.path || "",
                  l.target_id ? `${l.target_type}/${l.target_id}` : "",
                  l.status_code || "",
                ]),
              )
            }
          >
            Exportar CSV
          </button>
          <button type="button" className="admin-btn-secondary" onClick={load} disabled={loading}>
            Atualizar
          </button>
        </div>
      </header>

      {error ? <div className="admin-error">{error}</div> : null}

      <section className="admin-cards-row">
        <article className="admin-stat-card admin-stat-primary">
          <span className="admin-stat-kicker">Ações registradas</span>
          <strong>{logs.length}</strong>
          <small>nos últimos {days} dia(s)</small>
        </article>
        <article className="admin-stat-card admin-stat-info">
          <span className="admin-stat-kicker">Tipos distintos</span>
          <strong>{(summary?.byAction || []).length}</strong>
        </article>
        <article className="admin-stat-card admin-stat-warn">
          <span className="admin-stat-kicker">Admins ativos</span>
          <strong>{(summary?.byAdmin || []).length}</strong>
        </article>
      </section>

      <section className="admin-detail-grid">
        <article className="admin-table-card">
          <header className="admin-table-header">
            <h3>Ações mais frequentes</h3>
          </header>
          <ul className="admin-rank-list">
            {(summary?.byAction || []).map((row) => (
              <li key={row.action}>
                <span>{ACTION_LABELS[row.action] || row.action}</span>
                <strong>{row.count}</strong>
              </li>
            ))}
            {!summary?.byAction?.length ? <li className="admin-empty">Sem ações no período.</li> : null}
          </ul>
        </article>

        <article className="admin-table-card">
          <header className="admin-table-header">
            <h3>Por administrador</h3>
          </header>
          <ul className="admin-rank-list">
            {(summary?.byAdmin || []).map((row) => (
              <li key={row.admin_user_id || "unknown"}>
                <span>{row.admin_name || "(sem nome)"}</span>
                <strong>{row.count}</strong>
              </li>
            ))}
            {!summary?.byAdmin?.length ? <li className="admin-empty">Sem registros.</li> : null}
          </ul>
        </article>
      </section>

      <section className="admin-table-card">
        <header className="admin-table-header">
          <h3>Linha do tempo</h3>
        </header>
        <div className="admin-activity-list">
          {logs.map((log) => (
            <div key={log.id} className="admin-activity-row">
              <span className="admin-activity-time">
                {formatDateTime(log.created_at)} · {relativeFromNow(log.created_at)}
              </span>
              <strong>{ACTION_LABELS[log.action] || log.action}</strong>
              <small>
                {log.admin_name || "—"} · {log.method} {log.path}
                {log.target_id ? ` · alvo: ${log.target_type}/${log.target_id}` : ""}
              </small>
            </div>
          ))}
          {!logs.length ? <div className="admin-empty">Nenhum log registrado ainda.</div> : null}
        </div>
      </section>
    </div>
  );
}
