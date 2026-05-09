import { useEffect, useMemo, useState } from "react";
import "./AdminPages.css";

function brl(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("pt-BR");
  } catch {
    return "—";
  }
}

export default function AdminClientDetailPage({ apiRequest, clientId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addonsCatalog, setAddonsCatalog] = useState([]);
  const [feedback, setFeedback] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [detail, catalog] = await Promise.all([
        apiRequest(`/admin/clients/${clientId}/detail`),
        apiRequest(`/admin/addons`),
      ]);
      setData(detail?.data || null);
      setAddonsCatalog(catalog?.data || []);
    } catch (err) {
      setError(err?.message || "Falha ao carregar cliente");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (clientId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function assignAddon(addonId) {
    setFeedback("");
    try {
      await apiRequest(`/admin/addons/${addonId}/assign`, {
        method: "POST",
        body: JSON.stringify({ client_user_id: clientId, status: "active" }),
      });
      setFeedback("Addon atribuído.");
      await load();
    } catch (err) {
      setError(err?.message || "Falha ao atribuir addon");
    }
  }

  async function cancelAddon(addonId) {
    setFeedback("");
    try {
      await apiRequest(`/admin/addons/${addonId}/assign/${clientId}`, {
        method: "DELETE",
      });
      setFeedback("Addon cancelado.");
      await load();
    } catch (err) {
      setError(err?.message || "Falha ao cancelar");
    }
  }

  const availableAddons = useMemo(() => {
    if (!data) return [];
    const active = new Set(
      (data.addons || [])
        .filter((a) => a.status === "active")
        .map((a) => a.addon_id),
    );
    return addonsCatalog.filter((a) => a.active && !active.has(a.id));
  }, [data, addonsCatalog]);

  if (loading) {
    return (
      <div className="admin-page">
        <header className="admin-page-header">
          <button type="button" className="admin-btn-secondary" onClick={onBack}>← Voltar</button>
          <h2>Carregando cliente…</h2>
        </header>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="admin-page">
        <header className="admin-page-header">
          <button type="button" className="admin-btn-secondary" onClick={onBack}>← Voltar</button>
          <h2>Cliente não encontrado</h2>
        </header>
        {error ? <div className="admin-error">{error}</div> : null}
      </div>
    );
  }

  const { user, subscription, addons = [], payments = [], recentActivity = [], recentLogins = [], counters, ltv } = data;
  const approvedPayments = payments.filter((p) => p.status === "approved");

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div className="admin-header-back">
          <button type="button" className="admin-btn-secondary" onClick={onBack}>← Voltar</button>
          <div>
            <h2>{user.name}</h2>
            <small>{user.email} · {user.phone || "sem telefone"}</small>
          </div>
        </div>
        <div className="admin-page-actions">
          <button type="button" className="admin-btn-secondary" onClick={load}>Atualizar</button>
        </div>
      </header>

      {error ? <div className="admin-error">{error}</div> : null}
      {feedback ? <div className="admin-feedback">{feedback}</div> : null}

      <section className="admin-cards-row">
        <article className="admin-stat-card admin-stat-primary">
          <span className="admin-stat-kicker">Plano atual</span>
          <strong>{subscription?.plan_type || "Sem plano"}</strong>
          <small>
            {subscription?.status || "—"} · {subscription?.amount ? brl(subscription.amount) : "—"}
          </small>
        </article>
        <article className="admin-stat-card admin-stat-info">
          <span className="admin-stat-kicker">LTV histórico</span>
          <strong>{brl(ltv)}</strong>
          <small>{approvedPayments.length} pagamentos aprovados</small>
        </article>
        <article className="admin-stat-card admin-stat-ok">
          <span className="admin-stat-kicker">Volume operacional</span>
          <strong>{counters?.appointments ?? 0}</strong>
          <small>
            {counters?.customers ?? 0} clientes · {counters?.pets ?? 0} pets
          </small>
        </article>
        <article className="admin-stat-card admin-stat-warn">
          <span className="admin-stat-kicker">Próximo vencimento</span>
          <strong>
            {subscription?.next_billing_date ? formatDate(subscription.next_billing_date) : "—"}
          </strong>
          <small>último acesso: {user.lastAccess ? formatDate(user.lastAccess) : "nunca"}</small>
        </article>
      </section>

      <section className="admin-detail-grid">
        <article className="admin-table-card">
          <header className="admin-table-header">
            <h3>Addons ativos ({addons.filter((a) => a.status === "active").length})</h3>
          </header>
          <div className="admin-addon-list">
            {addons.length === 0 ? (
              <div className="admin-empty">Nenhum addon atribuído ainda.</div>
            ) : (
              addons.map((a) => (
                <div key={a.id} className="admin-addon-row">
                  <div>
                    <strong>{a.addon?.name || a.addon_key}</strong>
                    <small>
                      {brl(a.amount_override ?? a.addon?.default_amount)} ·{" "}
                      {a.next_billing_date ? `vence ${formatDate(a.next_billing_date)}` : "sem vencimento"}
                    </small>
                  </div>
                  <div className="admin-addon-actions">
                    <span className={`admin-pill admin-pill-${a.status === "active" ? "ok" : "muted"}`}>
                      {a.status}
                    </span>
                    {a.status === "active" ? (
                      <button
                        type="button"
                        className="admin-btn-danger admin-btn-sm"
                        onClick={() => cancelAddon(a.addon_id)}
                      >
                        Cancelar
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>

          {availableAddons.length > 0 ? (
            <footer className="admin-table-footer admin-addon-add">
              <span>Atribuir addon disponível:</span>
              <div className="admin-addon-add-buttons">
                {availableAddons.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="admin-btn-secondary admin-btn-sm"
                    onClick={() => assignAddon(a.id)}
                  >
                    + {a.name} ({brl(a.default_amount)})
                  </button>
                ))}
              </div>
            </footer>
          ) : null}
        </article>

        <article className="admin-table-card">
          <header className="admin-table-header">
            <h3>Pagamentos recentes</h3>
            <small>{payments.length} registros</small>
          </header>
          <div className="admin-table">
            <div className="admin-table-row admin-table-head admin-payments-row">
              <span>Quando</span>
              <span>Status</span>
              <span>Valor</span>
              <span>Método</span>
            </div>
            {payments.slice(0, 15).map((p) => (
              <div key={p.id} className="admin-table-row admin-payments-row">
                <span>{formatDate(p.date_created)}</span>
                <span className={`admin-pill admin-pill-${p.status === "approved" ? "ok" : "muted"}`}>
                  {p.status}
                </span>
                <span>{brl(p.amount)}</span>
                <span>{p.payment_method || "—"}</span>
              </div>
            ))}
            {!payments.length ? <div className="admin-empty">Sem pagamentos registrados.</div> : null}
          </div>
        </article>
      </section>

      <section className="admin-detail-grid">
        <article className="admin-table-card">
          <header className="admin-table-header">
            <h3>Atividade recente (30)</h3>
          </header>
          <div className="admin-activity-list">
            {recentActivity.map((evt) => (
              <div key={evt.id} className="admin-activity-row">
                <span className="admin-activity-time">{formatDate(evt.created_at)}</span>
                <strong>{evt.modulo} · {evt.acao}</strong>
                <small>{evt.descricao || ""}</small>
              </div>
            ))}
            {!recentActivity.length ? <div className="admin-empty">Sem atividade.</div> : null}
          </div>
        </article>

        <article className="admin-table-card">
          <header className="admin-table-header">
            <h3>Últimos acessos</h3>
          </header>
          <div className="admin-activity-list">
            {recentLogins.map((l) => (
              <div key={l.id} className="admin-activity-row">
                <span className="admin-activity-time">{formatDate(l.createdAt)}</span>
                <strong>{l.status === "success" ? "Login OK" : "Falhou"}</strong>
                <small>{l.ip || "—"} · {l.device || "—"}</small>
              </div>
            ))}
            {!recentLogins.length ? <div className="admin-empty">Sem logins registrados.</div> : null}
          </div>
        </article>
      </section>
    </div>
  );
}
