import { useEffect, useState } from "react";
import "./AdminPages.css";

function brl(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const EMPTY_FORM = {
  id: null,
  key: "",
  name: "",
  description: "",
  default_amount: "",
  billing_cycle: "monthly",
  active: true,
  sort_order: 0,
};

export default function AdminAddonsPage({ apiRequest }) {
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [feedback, setFeedback] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest("/admin/addons");
      setAddons(res?.data || []);
    } catch (err) {
      setError(err?.message || "Falha ao carregar addons");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitForm(e) {
    e?.preventDefault();
    setFeedback("");
    setError("");
    try {
      const payload = {
        ...form,
        default_amount: Number(form.default_amount) || 0,
        sort_order: Number(form.sort_order) || 0,
      };
      if (form.id) {
        await apiRequest(`/admin/addons/${form.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setFeedback("Addon atualizado.");
      } else {
        await apiRequest("/admin/addons", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setFeedback("Addon cadastrado.");
      }
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err?.message || "Falha ao salvar");
    }
  }

  function startEdit(addon) {
    setForm({
      id: addon.id,
      key: addon.key,
      name: addon.name,
      description: addon.description || "",
      default_amount: addon.default_amount,
      billing_cycle: addon.billing_cycle || "monthly",
      active: addon.active,
      sort_order: addon.sort_order || 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleActive(addon) {
    try {
      await apiRequest(`/admin/addons/${addon.id}`, {
        method: "PUT",
        body: JSON.stringify({ active: !addon.active }),
      });
      await load();
    } catch (err) {
      setError(err?.message || "Falha ao alternar");
    }
  }

  async function deleteAddon(addon) {
    if (!window.confirm(`Excluir o addon "${addon.name}"?`)) return;
    try {
      await apiRequest(`/admin/addons/${addon.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err?.message || "Falha ao excluir");
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h2>Addons</h2>
          <small>Catálogo de módulos cobrados à parte (IA CRM e futuros).</small>
        </div>
      </header>

      {error ? <div className="admin-error">{error}</div> : null}
      {feedback ? <div className="admin-feedback">{feedback}</div> : null}

      <section className="admin-form-card">
        <h3>{form.id ? "Editar addon" : "Novo addon"}</h3>
        <form onSubmit={submitForm} className="admin-form-grid">
          <label className="admin-field">
            <span>Nome *</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex.: IA CRM, Driver Premium"
              className="admin-input"
            />
          </label>
          <label className="admin-field">
            <span>Chave (slug)</span>
            <input
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              placeholder="auto-gerado se vazio"
              className="admin-input"
              disabled={!!form.id}
            />
          </label>
          <label className="admin-field">
            <span>Valor padrão (R$) *</span>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={form.default_amount}
              onChange={(e) => setForm({ ...form, default_amount: e.target.value })}
              className="admin-input"
            />
          </label>
          <label className="admin-field">
            <span>Ciclo de cobrança</span>
            <select
              value={form.billing_cycle}
              onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })}
              className="admin-input"
            >
              <option value="monthly">Mensal</option>
              <option value="quarterly">Trimestral</option>
              <option value="yearly">Anual</option>
              <option value="onetime">Única</option>
            </select>
          </label>
          <label className="admin-field admin-field-grow">
            <span>Descrição</span>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Para que serve esse addon"
              className="admin-input"
            />
          </label>
          <label className="admin-field admin-field-checkbox">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            <span>Disponível para venda</span>
          </label>
          <div className="admin-form-actions">
            {form.id ? (
              <button type="button" className="admin-btn-secondary" onClick={() => setForm(EMPTY_FORM)}>
                Cancelar
              </button>
            ) : null}
            <button type="submit" className="admin-btn-primary">
              {form.id ? "Salvar alterações" : "Cadastrar addon"}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-table-card">
        <header className="admin-table-header">
          <h3>Catálogo ({addons.length})</h3>
          <button type="button" className="admin-btn-secondary" onClick={load} disabled={loading}>
            {loading ? "Atualizando…" : "Atualizar"}
          </button>
        </header>
        <div className="admin-addons-grid">
          {addons.map((a) => (
            <article key={a.id} className={`admin-addon-card ${a.active ? "" : "admin-addon-card-off"}`}>
              <header>
                <div>
                  <strong>{a.name}</strong>
                  <small>{a.key}</small>
                </div>
                <span className={`admin-pill ${a.active ? "admin-pill-ok" : "admin-pill-muted"}`}>
                  {a.active ? "Ativo" : "Off"}
                </span>
              </header>
              {a.description ? <p>{a.description}</p> : null}
              <dl>
                <div>
                  <dt>Valor padrão</dt>
                  <dd>{brl(a.default_amount)}</dd>
                </div>
                <div>
                  <dt>Ciclo</dt>
                  <dd>{a.billing_cycle}</dd>
                </div>
                <div>
                  <dt>Assinaturas ativas</dt>
                  <dd>{a.stats?.active ?? 0}</dd>
                </div>
                <div>
                  <dt>Total já vendidas</dt>
                  <dd>{a.stats?.total ?? 0}</dd>
                </div>
              </dl>
              <footer>
                <button type="button" className="admin-btn-secondary" onClick={() => startEdit(a)}>
                  Editar
                </button>
                <button type="button" className="admin-btn-secondary" onClick={() => toggleActive(a)}>
                  {a.active ? "Desativar" : "Reativar"}
                </button>
                <button type="button" className="admin-btn-danger" onClick={() => deleteAddon(a)}>
                  Excluir
                </button>
              </footer>
            </article>
          ))}
          {!addons.length ? (
            <div className="admin-empty">Nenhum addon cadastrado ainda.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
