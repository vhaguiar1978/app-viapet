import { useEffect, useMemo, useState } from "react";

/**
 * Modal para baixa em lote de pendências de um cliente.
 *
 * Fluxo:
 *  1) Ao abrir, busca GET /customers/:id/pending-finances
 *  2) Mostra cada pendência com checkbox (todas marcadas por padrão)
 *  3) User escolhe método de pagamento + data + observação
 *  4) Click em "Baixar selecionados" → POST /customers/:id/settle-finances
 *  5) onSettled callback dispara refresh da tela de pesquisa
 *
 * Props:
 *  - open: boolean
 *  - customerId: string
 *  - customerName: string
 *  - apiRequest: função compatível com a apiRequest do App.jsx (já com auth)
 *  - onClose: fn
 *  - onSettled: fn(result) — chamado após sucesso pra que o caller possa refresh
 */
export default function BulkSettleDebtModal({
  open,
  customerId,
  customerName,
  apiRequest,
  onClose,
  onSettled,
}) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [paymentMethod, setPaymentMethod] = useState("Dinheiro");
  const [paidAt, setPaidAt] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Carrega pendências quando abre
  useEffect(() => {
    if (!open || !customerId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setSuccessMsg("");
    apiRequest(`/customers/${customerId}/pending-finances`)
      .then((res) => {
        if (cancelled) return;
        const list = res?.data?.items || [];
        setItems(list);
        // Por padrão TUDO selecionado
        setSelectedIds(new Set(list.map((i) => i.financeId)));
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Falha ao carregar pendências");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, customerId, apiRequest]);

  const totalSelected = useMemo(() => {
    return items
      .filter((i) => selectedIds.has(i.financeId))
      .reduce((s, i) => s + Number(i.grossAmount || 0), 0);
  }, [items, selectedIds]);

  function toggle(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function selectAll() {
    setSelectedIds(new Set(items.map((i) => i.financeId)));
  }
  function selectNone() {
    setSelectedIds(new Set());
  }

  async function handleSubmit() {
    if (selectedIds.size === 0) {
      setError("Selecione ao menos uma pendência");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await apiRequest(`/customers/${customerId}/settle-finances`, {
        method: "POST",
        body: JSON.stringify({
          financeIds: [...selectedIds],
          paymentMethod,
          paidAt: paidAt ? `${paidAt}T12:00:00` : null,
          notes: notes || "",
        }),
      });
      const result = res?.data || {};
      setSuccessMsg(
        `Baixadas ${result.settledCount || 0} pendência(s), total R$ ${Number(
          result.settledAmount || 0,
        ).toFixed(2)}.`,
      );
      onSettled?.(result);
      // Recarrega a lista (deve vir vazia ou bem menor)
      setTimeout(() => {
        onClose?.();
      }, 1200);
    } catch (e) {
      setError(e?.message || "Falha ao baixar pagamentos");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="bulk-settle-overlay" onClick={onClose}>
      <div
        className="bulk-settle-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-settle-title"
      >
        <header className="bulk-settle-header">
          <div>
            <h2 id="bulk-settle-title">Baixar pendências em lote</h2>
            <p className="bulk-settle-subtitle">{customerName || "Cliente"}</p>
          </div>
          <button
            type="button"
            className="bulk-settle-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </header>

        <div className="bulk-settle-body">
          {loading ? (
            <p className="bulk-settle-empty">Carregando pendências…</p>
          ) : items.length === 0 ? (
            <p className="bulk-settle-empty">Sem pendências em aberto para este cliente. 🎉</p>
          ) : (
            <>
              <div className="bulk-settle-toolbar">
                <button type="button" onClick={selectAll}>
                  Selecionar tudo
                </button>
                <button type="button" onClick={selectNone}>
                  Limpar seleção
                </button>
                <span className="bulk-settle-counter">
                  {selectedIds.size}/{items.length} selecionadas
                </span>
              </div>

              <div className="bulk-settle-list">
                <table>
                  <thead>
                    <tr>
                      <th aria-label="Selecionar"></th>
                      <th>Data</th>
                      <th>Tipo</th>
                      <th>Descrição</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.financeId}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(it.financeId)}
                            onChange={() => toggle(it.financeId)}
                            aria-label={`Selecionar pendência ${it.financeId}`}
                          />
                        </td>
                        <td>{formatBR(it.dueDate)}</td>
                        <td>{labelKind(it.kind)}</td>
                        <td title={it.description}>{truncate(it.description, 50)}</td>
                        <td className="bulk-settle-amount">
                          R$ {Number(it.grossAmount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bulk-settle-form">
                <div className="bulk-settle-field">
                  <label htmlFor="bulk-pm">Método de pagamento</label>
                  <select
                    id="bulk-pm"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option>Dinheiro</option>
                    <option>Pix</option>
                    <option>Cartão de Débito</option>
                    <option>Cartão de Crédito</option>
                    <option>Transferência</option>
                    <option>Outro</option>
                  </select>
                </div>
                <div className="bulk-settle-field">
                  <label htmlFor="bulk-date">Data do pagamento</label>
                  <input
                    id="bulk-date"
                    type="date"
                    value={paidAt}
                    onChange={(e) => setPaidAt(e.target.value)}
                  />
                </div>
                <div className="bulk-settle-field bulk-settle-field-wide">
                  <label htmlFor="bulk-notes">Observação (opcional)</label>
                  <input
                    id="bulk-notes"
                    type="text"
                    placeholder="ex: cliente quitou em dinheiro hoje"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {error && <div className="bulk-settle-error">{error}</div>}
          {successMsg && <div className="bulk-settle-success">{successMsg}</div>}
        </div>

        <footer className="bulk-settle-footer">
          <button type="button" className="bulk-settle-cancel" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button
            type="button"
            className="bulk-settle-submit"
            onClick={handleSubmit}
            disabled={submitting || loading || items.length === 0 || selectedIds.size === 0}
          >
            {submitting
              ? "Baixando…"
              : `Baixar ${selectedIds.size} pendência(s) — R$ ${totalSelected.toFixed(2)}`}
          </button>
        </footer>
      </div>
    </div>
  );
}

function formatBR(dateStr) {
  if (!dateStr) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateStr));
  if (!m) return String(dateStr).slice(0, 10);
  return `${m[3]}/${m[2]}/${m[1]}`;
}
function labelKind(k) {
  if (k === "appointment_payment") return "Parcela";
  if (k === "appointment_balance") return "Saldo agend.";
  if (k === "appointment_free") return "Cortesia";
  if (k === "sale") return "Venda";
  return k || "—";
}
function truncate(s, n) {
  const str = String(s || "");
  if (str.length <= n) return str;
  return str.slice(0, n - 1) + "…";
}
