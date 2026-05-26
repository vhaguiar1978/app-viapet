import { useEffect, useState } from "react";
import { FinanceShell } from "../FinanceShell.jsx";
import { fmtBR } from "../_shared.jsx";

const ACCOUNT_TYPE_OPTIONS = [
  { value: "corrente", label: "Corrente" },
  { value: "poupanca", label: "Poupança" },
  { value: "pagamento", label: "Pagamento" },
  { value: "cartao", label: "Cartão" },
  { value: "outros", label: "Outros" },
];

function emptyBankAccountForm() {
  return {
    name: "",
    bank: "",
    agency: "",
    accountNumber: "",
    accountType: "corrente",
    pixKey: "",
    initialBalance: "",
    notes: "",
  };
}

export function FinanceContasView({ apiRequest }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [form, setForm] = useState(emptyBankAccountForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  async function reload() {
    if (!apiRequest) return;
    setLoading(true);
    try {
      const res = await apiRequest(`/bank-accounts?includeInactive=${showInactive}`, { method: "GET" });
      const data = res?.data || [];
      setRows(Array.isArray(data) ? data : []);
      setFeedback("");
    } catch (err) {
      setFeedback(err?.message || "Erro ao carregar contas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive]);

  function startEdit(row) {
    setEditingId(row.id);
    setForm({
      name: row.name || "",
      bank: row.bank || "",
      agency: row.agency || "",
      accountNumber: row.accountNumber || "",
      accountType: row.accountType || "corrente",
      pixKey: row.pixKey || "",
      initialBalance: row.initialBalance != null ? String(row.initialBalance) : "",
      notes: row.notes || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyBankAccountForm());
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setFeedback("Nome da conta é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        bank: form.bank.trim() || null,
        agency: form.agency.trim() || null,
        accountNumber: form.accountNumber.trim() || null,
        accountType: form.accountType,
        pixKey: form.pixKey.trim() || null,
        initialBalance: Number(String(form.initialBalance).replace(",", ".")) || 0,
        notes: form.notes.trim() || null,
      };
      if (editingId) {
        await apiRequest(`/bank-accounts/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setFeedback(`Conta "${payload.name}" atualizada.`);
      } else {
        await apiRequest("/bank-accounts", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setFeedback(`Conta "${payload.name}" criada.`);
      }
      cancelEdit();
      reload();
    } catch (err) {
      setFeedback(err?.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(row) {
    try {
      await apiRequest(`/bank-accounts/${row.id}/status`, { method: "PATCH" });
      reload();
    } catch (err) {
      setFeedback(err?.message || "Erro ao alternar status");
    }
  }

  return (
    <FinanceShell activeTab="Contas" originValue="Contas">
      <div style={{ padding: "16px 20px", maxWidth: 1100 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Contas bancárias</h2>
            <p style={{ margin: "4px 0 0", color: "#666", fontSize: 13 }}>
              Cada recebimento ou despesa pode ser vinculado a uma conta. Conta desativada não aparece nos seletores, mas mantém os lançamentos antigos.
            </p>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            Mostrar inativas
          </label>
        </header>

        {feedback ? <div className="registers-feedback" style={{ marginBottom: 12 }}>{feedback}</div> : null}

        <form
          onSubmit={submit}
          style={{
            background: "#fff",
            border: "1px solid #e8e8ee",
            borderRadius: 10,
            padding: 14,
            marginBottom: 16,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 10,
          }}
        >
          <div className="field-block" style={{ gridColumn: "1 / -1" }}>
            <label>{editingId ? "Editando conta" : "Nova conta"}</label>
            <input
              className="field-input"
              placeholder="Nome da conta (ex: Itaú principal)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </div>
          <div className="field-block">
            <label>Banco</label>
            <input className="field-input" value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} />
          </div>
          <div className="field-block">
            <label>Agência</label>
            <input className="field-input" value={form.agency} onChange={(e) => setForm({ ...form, agency: e.target.value })} />
          </div>
          <div className="field-block">
            <label>Conta</label>
            <input className="field-input" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
          </div>
          <div className="field-block">
            <label>Tipo</label>
            <select className="field-input" value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value })}>
              {ACCOUNT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="field-block">
            <label>Chave Pix</label>
            <input className="field-input" value={form.pixKey} onChange={(e) => setForm({ ...form, pixKey: e.target.value })} />
          </div>
          <div className="field-block">
            <label>Saldo inicial (R$)</label>
            <input
              className="field-input"
              type="number"
              step="0.01"
              value={form.initialBalance}
              onChange={(e) => setForm({ ...form, initialBalance: e.target.value })}
            />
          </div>
          <div className="field-block" style={{ gridColumn: "1 / -1" }}>
            <label>Observação</label>
            <input
              className="field-input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
            <button type="submit" className="footer-btn footer-btn-green" disabled={saving}>
              {saving ? "Salvando…" : editingId ? "Atualizar conta" : "Criar conta"}
            </button>
            {editingId ? (
              <button type="button" className="footer-btn patient-cancel-btn" onClick={cancelEdit}>
                Cancelar
              </button>
            ) : null}
          </div>
        </form>

        {loading ? <div>Carregando contas…</div> : (
          rows.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#888" }}>Nenhuma conta cadastrada ainda.</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.6fr 1.2fr 1fr 1fr 0.9fr 1fr 1.2fr",
                  gap: 8,
                  fontWeight: 600,
                  fontSize: 12,
                  color: "#555",
                  padding: "0 6px",
                }}
              >
                <div>Nome</div>
                <div>Banco</div>
                <div>Agência/Conta</div>
                <div>Tipo</div>
                <div style={{ textAlign: "right" }}>Saldo inicial</div>
                <div>Status</div>
                <div></div>
              </div>
              {rows.map((row) => (
                <div
                  key={row.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.6fr 1.2fr 1fr 1fr 0.9fr 1fr 1.2fr",
                    gap: 8,
                    alignItems: "center",
                    background: "#fff",
                    border: "1px solid #e8e8ee",
                    borderRadius: 8,
                    padding: 10,
                    opacity: row.active ? 1 : 0.5,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{row.name}</div>
                  <div>{row.bank || "—"}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    {row.agency ? `${row.agency} / ${row.accountNumber || "—"}` : row.accountNumber || "—"}
                  </div>
                  <div style={{ fontSize: 12 }}>{row.accountType}</div>
                  <div style={{ textAlign: "right" }}>R$ {fmtBR(row.initialBalance)}</div>
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleStatus(row)}
                      className={`finance-paid-chip ${row.active ? "is-paid" : "is-pending"}`}
                      title="Clique para alternar"
                    >
                      {row.active ? "Ativa" : "Inativa"}
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" className="soft-chip" onClick={() => startEdit(row)}>Editar</button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </FinanceShell>
  );
}
