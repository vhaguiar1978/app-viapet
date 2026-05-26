import { useEffect, useState } from "react";
import { FinanceShell } from "../FinanceShell.jsx";

export function FinanceTaxasView({ apiRequest }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [savingKey, setSavingKey] = useState("");

  async function reload() {
    if (!apiRequest) return;
    setLoading(true);
    try {
      const res = await apiRequest("/payment-method-fees", { method: "GET" });
      const data = res?.data || res?.body?.data || [];
      setRows(Array.isArray(data) ? data : []);
      setFeedback("");
    } catch (err) {
      setFeedback(err?.message || "Erro ao carregar taxas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateLocal(method, patch) {
    setRows((prev) => prev.map((r) => (r.method === method ? { ...r, ...patch } : r)));
  }

  async function saveRow(row) {
    setSavingKey(row.method);
    try {
      await apiRequest(`/payment-method-fees/${row.method}`, {
        method: "PUT",
        body: JSON.stringify({
          label: row.label,
          feePercent: Number(row.feePercent) || 0,
          feeFixed: Number(row.feeFixed) || 0,
          active: !!row.active,
        }),
      });
      setFeedback(`Taxa de ${row.label} atualizada.`);
      reload();
    } catch (err) {
      setFeedback(err?.message || "Erro ao salvar");
    } finally {
      setSavingKey("");
    }
  }

  async function resetDefaults() {
    if (!window.confirm("Restaurar taxas para o padrão (todas 0%)?")) return;
    try {
      await apiRequest("/payment-method-fees/reset", { method: "POST" });
      setFeedback("Taxas restauradas.");
      reload();
    } catch (err) {
      setFeedback(err?.message || "Erro ao restaurar");
    }
  }

  return (
    <FinanceShell activeTab="Taxas" originValue="Taxas">
      <div className="finance-fees-board" style={{ padding: "16px 20px", maxWidth: 980 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Taxas de maquininha por forma de pagamento</h2>
            <p style={{ margin: "4px 0 0", color: "#666", fontSize: 13 }}>
              Cada forma de pagamento tem uma taxa <strong>percentual</strong> e/ou uma <strong>taxa fixa</strong>.
              O sistema calcula automaticamente o valor líquido = bruto − (bruto × %) − fixa.
            </p>
          </div>
          <button type="button" className="soft-chip" onClick={resetDefaults}>Restaurar padrão</button>
        </header>

        {feedback ? <div className="registers-feedback" style={{ marginBottom: 12 }}>{feedback}</div> : null}

        {loading ? (
          <div>Carregando taxas…</div>
        ) : (
          <div className="finance-fees-table" style={{ display: "grid", gap: 8 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.6fr 0.9fr 1fr 0.7fr 0.9fr",
                gap: 8,
                fontWeight: 600,
                fontSize: 12,
                color: "#555",
                padding: "0 6px",
              }}
            >
              <div>Forma de pagamento</div>
              <div>Taxa %</div>
              <div>Taxa fixa (R$)</div>
              <div>Ativa</div>
              <div></div>
            </div>
            {rows.map((row) => (
              <div
                key={row.method}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.6fr 0.9fr 1fr 0.7fr 0.9fr",
                  gap: 8,
                  alignItems: "center",
                  background: "#fff",
                  border: "1px solid #e8e8ee",
                  borderRadius: 8,
                  padding: 10,
                }}
              >
                <input
                  className="field-input"
                  value={row.label}
                  onChange={(e) => updateLocal(row.method, { label: e.target.value })}
                />
                <input
                  className="field-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.feePercent}
                  onChange={(e) => updateLocal(row.method, { feePercent: e.target.value })}
                />
                <input
                  className="field-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.feeFixed}
                  onChange={(e) => updateLocal(row.method, { feeFixed: e.target.value })}
                />
                <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={!!row.active}
                    onChange={(e) => updateLocal(row.method, { active: e.target.checked })}
                  />
                  <span style={{ fontSize: 13 }}>{row.active ? "Sim" : "Não"}</span>
                </label>
                <button
                  type="button"
                  className="soft-chip active"
                  onClick={() => saveRow(row)}
                  disabled={savingKey === row.method}
                >
                  {savingKey === row.method ? "Salvando…" : "Salvar"}
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 16, padding: 12, background: "#f7f9fc", borderRadius: 8, fontSize: 13, color: "#555" }}>
          <strong>Como funciona:</strong> ao lançar uma venda ou recebimento, se você não preencher a taxa manualmente,
          o sistema busca aqui a configuração desta forma de pagamento e calcula automaticamente:
          <code style={{ display: "block", marginTop: 6, fontFamily: "monospace" }}>
            líquido = bruto − (bruto × % / 100) − taxa fixa
          </code>
        </div>
      </div>
    </FinanceShell>
  );
}
