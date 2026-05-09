import { useEffect, useState } from "react";
import "./AdminPages.css";

function formatDateTime(v) {
  if (!v) return "—";
  try { return new Date(v).toLocaleString("pt-BR"); } catch { return "—"; }
}

const EMPTY_FORM = {
  id: null,
  name: "",
  kind: "high_value_overdue",
  channel: "in_app",
  recipient: "",
  active: true,
  cooldown_hours: 24,
  config: {},
};

const KIND_HINTS = {
  high_value_overdue: { label: "Cliente em atraso (valor alto)", helper: "Dispara quando algum cliente em aberto ultrapassa o valor mínimo (R$).", configFields: [{ key: "threshold", label: "Valor mínimo (R$)", type: "number", default: 100 }] },
  mrr_drop_pct: { label: "Queda de receita mensal", helper: "Dispara quando a receita do mês cai em relação ao anterior.", configFields: [{ key: "threshold_pct", label: "Queda mínima (%)", type: "number", default: 10 }] },
  client_cancelled: { label: "Cliente cancelou", helper: "Dispara quando alguém cancelou nas últimas N horas.", configFields: [{ key: "windowHours", label: "Janela (horas)", type: "number", default: 48 }] },
  no_login_days: { label: "Sem login há X dias", helper: "Dispara para clientes que ficaram inativos.", configFields: [{ key: "days", label: "Dias sem login", type: "number", default: 14 }] },
  new_client_no_data: { label: "Novo cliente sem cadastros", helper: "Cliente entrou recentemente e não cadastrou nada ainda.", configFields: [] },
};

export default function AdminAlertsPage({ apiRequest }) {
  const [rules, setRules] = useState([]);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [running, setRunning] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [rulesRes, eventsRes] = await Promise.all([
        apiRequest("/admin/alert-rules"),
        apiRequest("/admin/alert-events?limit=50"),
      ]);
      setRules(rulesRes?.data || []);
      setEvents(eventsRes?.data || []);
    } catch (err) {
      setError(err?.message || "Falha ao carregar alertas");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function submitForm(e) {
    e?.preventDefault();
    setFeedback("");
    setError("");
    try {
      const payload = {
        name: form.name,
        kind: form.kind,
        channel: form.channel,
        recipient: form.recipient || null,
        active: form.active,
        cooldown_hours: Number(form.cooldown_hours) || 24,
        config_json: form.config || {},
      };
      if (form.id) {
        await apiRequest(`/admin/alert-rules/${form.id}`, { method: "PUT", body: JSON.stringify(payload) });
        setFeedback("Regra atualizada.");
      } else {
        await apiRequest("/admin/alert-rules", { method: "POST", body: JSON.stringify(payload) });
        setFeedback("Regra criada.");
      }
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err?.message || "Falha ao salvar regra");
    }
  }

  async function toggleActive(rule) {
    try {
      await apiRequest(`/admin/alert-rules/${rule.id}`, {
        method: "PUT",
        body: JSON.stringify({ active: !rule.active }),
      });
      await load();
    } catch (err) {
      setError(err?.message || "Falha ao alternar");
    }
  }

  async function deleteRule(rule) {
    if (!window.confirm(`Apagar a regra "${rule.name}"?`)) return;
    try {
      await apiRequest(`/admin/alert-rules/${rule.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err?.message || "Falha ao apagar");
    }
  }

  async function runNow() {
    setRunning(true);
    setFeedback("");
    try {
      const res = await apiRequest("/admin/alert-rules/run", { method: "POST" });
      setFeedback(`Engine executou: ${res?.data?.fired || 0} alerta(s) disparado(s) de ${res?.data?.processed || 0} regras.`);
      await load();
    } catch (err) {
      setError(err?.message || "Falha ao rodar engine");
    } finally {
      setRunning(false);
    }
  }

  async function ackEvent(event) {
    try {
      await apiRequest(`/admin/alert-events/${event.id}/ack`, { method: "POST" });
      await load();
    } catch (err) {
      setError(err?.message || "Falha ao confirmar");
    }
  }

  function startEdit(rule) {
    setForm({
      id: rule.id,
      name: rule.name,
      kind: rule.kind,
      channel: rule.channel,
      recipient: rule.recipient || "",
      active: rule.active,
      cooldown_hours: rule.cooldown_hours || 24,
      config: rule.config_json || {},
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const hint = KIND_HINTS[form.kind] || { configFields: [] };

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h2>Alertas Configuráveis</h2>
          <small>
            Regras automáticas que checam o estado do sistema e te avisam. O engine roda a cada 30
            minutos automaticamente.
          </small>
        </div>
        <div className="admin-page-actions">
          <button type="button" className="admin-btn-secondary" onClick={runNow} disabled={running}>
            {running ? "Verificando…" : "Verificar agora"}
          </button>
          <button type="button" className="admin-btn-secondary" onClick={load} disabled={loading}>
            Atualizar
          </button>
        </div>
      </header>

      {error ? <div className="admin-error">{error}</div> : null}
      {feedback ? <div className="admin-feedback">{feedback}</div> : null}

      <section className="admin-form-card">
        <h3>{form.id ? "Editar regra" : "Nova regra"}</h3>
        <form onSubmit={submitForm} className="admin-form-grid">
          <label className="admin-field admin-field-grow">
            <span>Nome *</span>
            <input
              required
              className="admin-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex.: Cliente premium em atraso"
            />
          </label>

          <label className="admin-field">
            <span>Tipo de regra</span>
            <select
              className="admin-input"
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value, config: {} })}
            >
              {Object.entries(KIND_HINTS).map(([id, info]) => (
                <option key={id} value={id}>{info.label}</option>
              ))}
            </select>
          </label>

          {hint.configFields?.map((field) => (
            <label className="admin-field" key={field.key}>
              <span>{field.label}</span>
              <input
                type={field.type}
                className="admin-input"
                value={form.config[field.key] ?? ""}
                placeholder={String(field.default)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    config: { ...form.config, [field.key]: Number(e.target.value) || 0 },
                  })
                }
              />
            </label>
          ))}

          <label className="admin-field">
            <span>Canal</span>
            <select
              className="admin-input"
              value={form.channel}
              onChange={(e) => setForm({ ...form, channel: e.target.value })}
            >
              <option value="in_app">No painel (sino/notificação)</option>
              <option value="email">E-mail</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </label>

          {form.channel !== "in_app" ? (
            <label className="admin-field">
              <span>Destinatário</span>
              <input
                className="admin-input"
                value={form.recipient}
                onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                placeholder={form.channel === "email" ? "email@dominio.com" : "+55119..."}
              />
            </label>
          ) : null}

          <label className="admin-field">
            <span>Cooldown (horas)</span>
            <input
              type="number"
              min="1"
              className="admin-input"
              value={form.cooldown_hours}
              onChange={(e) => setForm({ ...form, cooldown_hours: e.target.value })}
            />
          </label>

          <label className="admin-field admin-field-checkbox">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            <span>Ativa</span>
          </label>

          {hint.helper ? (
            <div className="admin-form-hint">{hint.helper}</div>
          ) : null}

          <div className="admin-form-actions">
            {form.id ? (
              <button type="button" className="admin-btn-secondary" onClick={() => setForm(EMPTY_FORM)}>
                Cancelar
              </button>
            ) : null}
            <button type="submit" className="admin-btn-primary">
              {form.id ? "Salvar alterações" : "Criar regra"}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-table-card">
        <header className="admin-table-header">
          <h3>Regras ({rules.length})</h3>
        </header>
        <div className="admin-rules-grid">
          {rules.map((r) => {
            const info = KIND_HINTS[r.kind];
            return (
              <article key={r.id} className={`admin-rule-card ${r.active ? "" : "admin-rule-card-off"}`}>
                <header>
                  <div>
                    <strong>{r.name}</strong>
                    <small>{info?.label || r.kind}</small>
                  </div>
                  <span className={`admin-pill admin-pill-${r.active ? "ok" : "muted"}`}>
                    {r.active ? "Ativa" : "Off"}
                  </span>
                </header>
                <dl>
                  <div><dt>Canal</dt><dd>{r.channel}</dd></div>
                  <div><dt>Cooldown</dt><dd>{r.cooldown_hours}h</dd></div>
                  <div><dt>Última verificação</dt><dd>{formatDateTime(r.last_check_at)}</dd></div>
                  <div><dt>Último disparo</dt><dd>{formatDateTime(r.last_triggered_at)}</dd></div>
                </dl>
                <footer>
                  <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => startEdit(r)}>Editar</button>
                  <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => toggleActive(r)}>
                    {r.active ? "Desativar" : "Ativar"}
                  </button>
                  <button type="button" className="admin-btn-danger admin-btn-sm" onClick={() => deleteRule(r)}>Apagar</button>
                </footer>
              </article>
            );
          })}
          {!rules.length ? <div className="admin-empty">Nenhuma regra criada ainda.</div> : null}
        </div>
      </section>

      <section className="admin-table-card">
        <header className="admin-table-header">
          <h3>Eventos disparados ({events.length})</h3>
        </header>
        <div className="admin-activity-list">
          {events.map((evt) => (
            <div
              key={evt.id}
              className={`admin-activity-row admin-event-row admin-event-${evt.severity}`}
            >
              <span className="admin-activity-time">{formatDateTime(evt.created_at)}</span>
              <strong>{evt.title}</strong>
              <small>{evt.message}</small>
              {!evt.acknowledged_at ? (
                <button
                  type="button"
                  className="admin-btn-secondary admin-btn-sm admin-event-ack"
                  onClick={() => ackEvent(evt)}
                >
                  Marcar como visto
                </button>
              ) : null}
            </div>
          ))}
          {!events.length ? <div className="admin-empty">Nenhum alerta disparado ainda.</div> : null}
        </div>
      </section>
    </div>
  );
}
