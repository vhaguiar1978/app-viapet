import { useEffect, useState } from "react";
import { fmtBR } from "../_shared.jsx";

export function FinanceParcelasModal({ apiRequest, purchaseGroupId, open, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !purchaseGroupId || !apiRequest) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await apiRequest(`/finance/installments/${purchaseGroupId}`, { method: "GET" });
        if (cancelled) return;
        setData(res?.data || null);
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || "Erro ao carregar parcelas");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [open, purchaseGroupId, apiRequest]);

  async function markPaid(parcelId) {
    try {
      await apiRequest(`/finance/${parcelId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "pago" }),
      });
      // recarrega
      const res = await apiRequest(`/finance/installments/${purchaseGroupId}`, { method: "GET" });
      setData(res?.data || null);
    } catch (err) {
      setError(err?.message || "Erro ao marcar como pago");
    }
  }

  if (!open) return null;

  return (
    <div className="finance-modal-overlay" onClick={onClose}>
      <div
        className="finance-form-card finance-form-modal"
        style={{ maxWidth: 720 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="patient-form-head">
          <div>
            <span className="section-kicker">Compra parcelada</span>
            <h2>{data?.description || "Detalhes da compra"}</h2>
          </div>
          <button type="button" className="footer-btn patient-cancel-btn" onClick={onClose}>Fechar</button>
        </div>

        {loading ? <div style={{ padding: 16 }}>Carregando…</div> : null}
        {error ? <div className="registers-feedback">{error}</div> : null}

        {data ? (
          <>
            <div
              className="finance-summary-cards"
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, padding: "8px 0" }}
            >
              <div className="finance-summary-mini-card"><span>Valor total</span><strong>R$ {fmtBR(data.totalAmount)}</strong></div>
              <div className="finance-summary-mini-card"><span>Valor pago</span><strong>R$ {fmtBR(data.valorPago)}</strong></div>
              <div className="finance-summary-mini-card"><span>Saldo restante</span><strong>R$ {fmtBR(data.saldoRestante)}</strong></div>
              <div className="finance-summary-mini-card"><span>Pagas / abertas</span><strong>{data.parcelasPagas} / {data.parcelasEmAberto}</strong></div>
            </div>

            {data.vendor || data.costCenter ? (
              <div style={{ fontSize: 13, color: "#666", marginBottom: 8, padding: "0 4px" }}>
                {data.vendor ? <>Fornecedor: <strong>{data.vendor}</strong></> : null}
                {data.vendor && data.costCenter ? " · " : null}
                {data.costCenter ? <>Centro de custo: <strong>{data.costCenter}</strong></> : null}
              </div>
            ) : null}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "0.5fr 1fr 1fr 1fr 1.2fr",
                gap: 8,
                fontWeight: 600,
                fontSize: 12,
                color: "#555",
                padding: "0 6px 6px",
                borderBottom: "1px solid #e8e8ee",
              }}
            >
              <div>#</div>
              <div>Vencimento</div>
              <div style={{ textAlign: "right" }}>Valor</div>
              <div>Status</div>
              <div></div>
            </div>
            {(data.rows || []).map((r) => (
              <div
                key={r.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "0.5fr 1fr 1fr 1fr 1.2fr",
                  gap: 8,
                  padding: "8px 6px",
                  borderBottom: "1px solid #f1f1f5",
                  alignItems: "center",
                  fontSize: 13,
                }}
              >
                <div>{r.installmentIndex}/{data.installmentTotal}</div>
                <div>{r.dueDate ? new Date(r.dueDate).toLocaleDateString("pt-BR") : "—"}</div>
                <div style={{ textAlign: "right" }}>R$ {fmtBR(r.amount)}</div>
                <div>
                  <span className={`finance-paid-chip ${r.status === "pago" ? "is-paid" : "is-pending"}`}>
                    {r.status === "pago" ? "Pago" : r.status === "cancelado" ? "Cancelado" : "Pendente"}
                  </span>
                </div>
                <div>
                  {r.status !== "pago" && r.status !== "cancelado" ? (
                    <button type="button" className="soft-chip active" onClick={() => markPaid(r.id)}>Marcar pago</button>
                  ) : null}
                </div>
              </div>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}
