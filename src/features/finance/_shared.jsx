import { Component } from "react";
import { EditableField } from "../../components/fields.jsx";
import { openPrintWindow } from "../../utils/windowPlacement.js";
import "./finance.css";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("FinancePages Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div style={{ padding: "20px", color: "red" }}>Erro ao carregar financeiro: {this.state.error?.message}</div>;
    }
    return this.props.children;
  }
}

export function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export function PencilIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function FinanceDeleteDialog({ financeData }) {
  if (!financeData?.deleteDialog?.open) return null;

  return (
    <div className="user-modal-overlay">
      <div className="confirm-modal">
        <h3>Confirmar exclusao</h3>
        <p>
          Deseja realmente excluir <strong>{financeData.deleteTargetType || "este registro"}</strong>?
        </p>
        <p>{financeData.deleteTargetLabel || "Este registro sera removido do financeiro."}</p>
        <div className="confirm-modal-actions">
          <button type="button" className="footer-btn footer-btn-green" onClick={financeData.onConfirmDelete} disabled={financeData.deleteSubmitting}>
            {financeData.deleteSubmitting ? "Excluindo..." : "OK"}
          </button>
          <button type="button" className="footer-btn patient-cancel-btn" onClick={financeData.onCancelDelete} disabled={financeData.deleteSubmitting}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function printSalesReport(financeData) {
  const printWindow = openPrintWindow();
  if (!printWindow) {
    window.print();
    return;
  }

  const rowsMarkup = (financeData.salesRows || [])
    .map((row) => {
      const lines = row.lines.map((line) => `<div>${escapeHtml(line)}</div>`).join("");
      return `
        <tr>
          <td>${escapeHtml(row.date)}</td>
          <td>
            <strong>${escapeHtml(row.customer)}</strong>
            <div>${escapeHtml(row.sale)}</div>
            <div>${lines}</div>
          </td>
          <td>${escapeHtml(row.grossDisplay || row.value)}</td>
          <td>${escapeHtml(row.feeDisplay || "R$ 0,00")}</td>
          <td>${escapeHtml(row.netDisplay || row.value)}</td>
        </tr>
      `;
    })
    .join("");

  printWindow.document.write(`
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Relatorio de vendas</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #1f2937; }
          h1 { margin: 0 0 8px; font-size: 24px; }
          p { margin: 0 0 16px; color: #4b5563; }
          .totals { margin-bottom: 20px; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #d1d5db; padding: 10px; vertical-align: top; text-align: left; }
          th { background: #f3f4f6; }
          td strong { display: block; margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <h1>Relatorio de vendas</h1>
        <p>Financeiro > Vendas</p>
        <div class="totals">${escapeHtml(financeData.salesTotal)}</div>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descricao</th>
              <th>Bruto</th>
              <th>Taxa</th>
              <th>Total com taxas</th>
            </tr>
          </thead>
          <tbody>
            ${rowsMarkup || '<tr><td colspan="5">Nenhuma venda encontrada.</td></tr>'}
          </tbody>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export function fmtBR(value) {
  const n = Number(value) || 0;
  return n.toFixed(2).replace(".", ",");
}

export function FinanceFixedExpenseModal({
  open,
  titleKicker,
  title,
  form,
  setForm,
  onValueChange,
  onValueFocus,
  onValueBlur,
  onSubmit,
  onClose,
  isSubmitting,
  feedback,
  paymentMethodOptions = [],
  showInstallments = false,
  bankAccountOptions = [],
}) {
  if (!open) return null;

  const isInstallmentMode = showInstallments && Boolean(form.isInstallment);
  const installmentsCount = isInstallmentMode
    ? Math.max(1, Math.min(360, Math.floor(Number(form.installments) || 1)))
    : 1;
  const totalAmount = (() => {
    const raw = String(form.value || "").trim();
    if (!raw) return 0;
    const cleaned = raw.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
  })();
  const installmentValue = installmentsCount > 0 ? totalAmount / installmentsCount : 0;
  const formatBR = (n) => `R$ ${(Number(n) || 0).toFixed(2).replace(".", ",")}`;

  return (
    <div className="finance-modal-overlay">
      <form className="finance-form-card finance-form-modal" onSubmit={onSubmit}>
        <div className="patient-form-head">
          <div>
            <span className="section-kicker">{titleKicker}</span>
            <h2>{title}</h2>
          </div>
        </div>

        <div className="patient-grid finance-form-grid">
          <EditableField
            label="Lancamento"
            type="date"
            value={form.date}
            onChange={(value) => setForm((current) => ({ ...current, date: value }))}
          />
          <EditableField
            label="Vencimento"
            type="date"
            value={form.dueDate}
            onChange={(value) => setForm((current) => ({ ...current, dueDate: value }))}
          />
          <EditableField
            label="Valor total (R$)"
            value={form.value}
            onChange={onValueChange}
            onFocus={onValueFocus}
            onBlur={onValueBlur}
            placeholder="0,00"
            inputMode="decimal"
          />
          <div className="field-block">
            <label>Status</label>
            <select
              className="field-input"
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
            </select>
          </div>
        </div>

        {showInstallments ? (
          <label className="product-inline-check" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 4px" }}>
            <input
              type="checkbox"
              checked={!!form.isInstallment}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isInstallment: event.target.checked,
                  installments: event.target.checked ? current.installments || "2" : "1",
                }))
              }
            />
            <span>Essa despesa foi parcelada?</span>
          </label>
        ) : null}

        {isInstallmentMode ? (
          <div className="patient-grid finance-form-grid">
            <div className="field-block">
              <label>Número de parcelas</label>
              <input
                className="field-input"
                type="number"
                min="2"
                max="360"
                step="1"
                value={form.installments ?? "2"}
                onChange={(event) =>
                  setForm((current) => ({ ...current, installments: event.target.value }))
                }
              />
            </div>
            <div className="field-block">
              <label>Valor de cada parcela</label>
              <div className="field-input field-input-readonly">
                {installmentsCount > 1
                  ? `${installmentsCount}x de ${formatBR(installmentValue)}`
                  : "À vista"}
              </div>
            </div>
            <EditableField
              label="Data da 1ª parcela"
              type="date"
              value={form.firstInstallmentDate || form.dueDate}
              onChange={(value) => setForm((current) => ({ ...current, firstInstallmentDate: value }))}
            />
          </div>
        ) : null}

        <EditableField
          label="Descricao"
          value={form.description}
          onChange={(value) => setForm((current) => ({ ...current, description: value }))}
        />

        <div className="patient-grid finance-form-grid">
          <div className="field-block">
            <label>Forma de pagamento</label>
            <select
              className="field-input"
              value={form.paymentMethod}
              onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))}
            >
              <option value="">Nao informado</option>
              {paymentMethodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field-block">
            <label>Conta bancária / cartão</label>
            <select
              className="field-input"
              value={form.bankAccountId || ""}
              onChange={(event) => setForm((current) => ({ ...current, bankAccountId: event.target.value || null }))}
            >
              <option value="">Não informado</option>
              {bankAccountOptions.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}{acc.bank ? ` — ${acc.bank}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="patient-grid finance-form-grid">
          <EditableField
            label="Fornecedor"
            value={form.vendor || ""}
            onChange={(value) => setForm((current) => ({ ...current, vendor: value }))}
          />
          <EditableField
            label="Centro de custo"
            value={form.costCenter || ""}
            onChange={(value) => setForm((current) => ({ ...current, costCenter: value }))}
          />
        </div>

        <div className="field-block">
          <label>Observação</label>
          <textarea
            className="field-input"
            rows={2}
            value={form.notes || ""}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          />
        </div>

        {isInstallmentMode && installmentsCount > 1 ? (
          <div className="registers-feedback registers-feedback-info">
            O sistema vai criar {installmentsCount} lançamentos mensais a partir da data informada,
            mantendo todas as parcelas vinculadas à mesma compra.
            {totalAmount > 0 && (Math.round(totalAmount * 100) % installmentsCount !== 0)
              ? " A diferença de centavos será ajustada na última parcela."
              : ""}
          </div>
        ) : null}

        {feedback ? <div className="registers-feedback">{feedback}</div> : null}

        <div className="patient-form-footer patient-form-footer-right">
          <div className="patient-form-actions">
            <button type="submit" className="footer-btn footer-btn-green" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
            <button type="button" className="footer-btn patient-cancel-btn" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
