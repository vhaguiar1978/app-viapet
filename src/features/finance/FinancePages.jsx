import { NavLink } from "react-router-dom";
import { EditableField } from "../../components/fields.jsx";
import { FinanceShell } from "./FinanceShell.jsx";
import { downloadRowsAsExcel } from "../../utils/exportExcel.js";
import { openPrintWindow } from "../../utils/windowPlacement.js";
import { Component } from "react";

class ErrorBoundary extends Component {
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

function TrashIcon() {
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

function PencilIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function FinanceDeleteDialog({ financeData }) {
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function printSalesReport(financeData) {
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

export function FinanceSalesView({ financeData }) {
  return (
    <FinanceShell
      activeTab="Vendas"
      onPrint={() => printSalesReport(financeData)}
      onExport={() =>
        downloadRowsAsExcel(
          "financeiro-vendas.xls",
          "Vendas",
          ["Data", "Descricao", "Bruto", "Taxa", "Liquido"],
          (financeData.salesRows || []).map((row) => [
            row.date,
            `${row.customer} | ${row.lines.join(" | ")}`,
            row.grossDisplay || row.value,
            row.feeDisplay || "R$ 0,00",
            row.netDisplay || row.value,
          ]),
        )
      }
    >
      <div className="finance-board">
        <div className="finance-toolbar">
          <div className="finance-toolbar-spacer" />
          <div className="toolbar-group">
            <div className="soft-counter finance-total-chip">{financeData.salesTotal}</div>
            <button className="registers-icon-btn" onClick={() => printSalesReport(financeData)}>Imprimir</button>
            <button
              className="registers-icon-btn"
              onClick={() =>
                downloadRowsAsExcel(
                  "financeiro-vendas.xls",
                  "Vendas",
                  ["Data", "Descricao", "Bruto", "Taxa", "Liquido"],
                  (financeData.salesRows || []).map((row) => [
                    row.date,
                    `${row.customer} | ${row.lines.join(" | ")}`,
                    row.grossDisplay || row.value,
                    row.feeDisplay || "R$ 0,00",
                    row.netDisplay || row.value,
                  ]),
                )
              }
            >
              Excel
            </button>
          </div>
        </div>

        {financeData.feedback ? <div className="registers-feedback">{financeData.feedback}</div> : null}

        <div className="finance-sales-head finance-sales-head-actions">
          <div>Data</div>
          <div>Descricao</div>
          <div>Valor</div>
          <div>Acao</div>
        </div>

        <div className="finance-sales-body">
          {financeData.loading ? <div className="registers-row">Carregando vendas...</div> : null}
          {!financeData.loading &&
            (financeData.salesRows || []).map((row) => (
              <div key={row.id || `${row.sale}-${row.customer}`} className="finance-sale-row finance-sale-row-actions">
                <div className="finance-sale-date">{row.date}</div>
                <div className="finance-sale-desc">
                  <div className="event-line">
                    <span className="badge badge-orange">{row.sale}</span>
                    <span className="finance-sale-customer">{row.customer}</span>
                    <span className="queue-search-icon">Q</span>
                  </div>
                  <div className="payment-lines">
                    {row.lines.map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                    <div className="finance-breakdown-line">
                      <span>Bruto {row.grossDisplay || row.value}</span>
                      <span>Taxa {row.feeDisplay || "R$ 0,00"}</span>
                      <strong>Liquido {row.netDisplay || row.value}</strong>
                    </div>
                  </div>
                </div>
                <div className="finance-sale-value">
                  <strong>{row.netDisplay || row.value}</strong>
                  <small>{row.paymentMethodLabel || ""}</small>
                </div>
                <div className="finance-row-action">
                  <button
                    type="button"
                    className="registers-delete-inline"
                    onClick={() => financeData.onRequestDeleteSale?.(row)}
                    aria-label={`Excluir ${row.sale || "venda"}`}
                    title="Excluir venda"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
        </div>
        <FinanceDeleteDialog financeData={financeData} />
      </div>
    </FinanceShell>
  );
}

export function FinancePurchasesView({
  showModal,
  financeData,
  feedback,
  isSubmitting,
  form,
  setForm,
  onValueChange,
  onValueFocus,
  onValueBlur,
  showEditModal,
  editForm,
  setEditForm,
  editFeedback,
  editSubmitting,
  onCloseEditModal,
  onCloseCreateModal,
  handlePurchaseSubmit,
  handleEditPurchaseSubmit,
  onEditValueChange,
  onEditValueFocus,
  onEditValueBlur,
  paymentMethodOptions = [],
}) {
  return (
    <FinanceShell
      activeTab="Despesas"
      originValue="Despesas"
      onPrint={() => window.print()}
      onExport={() =>
        downloadRowsAsExcel(
          "financeiro-despesas.xls",
          "Despesas",
          ["Lancamento", "Despesa", "Valor", "Vencimento", "Forma", "Status"],
          (financeData.purchasesRows || []).map((row) => [
            row.date,
            row.description,
            row.value,
            row.paymentDate || "",
            row.paymentMethod || "",
            row.status || "",
          ]),
        )
      }
    >
      <div className="finance-board">
        <div className="finance-toolbar">
          <div className="toolbar-group">
            <NavLink to="/financeiro/despesas/novo" className="registers-new-btn registers-link-btn">
              Novo
            </NavLink>
          </div>
          <div className="toolbar-group">
            <div className="soft-counter finance-total-chip">{financeData.purchasesTotal}</div>
            <button className="registers-icon-btn" onClick={() => window.print()}>Imprimir</button>
            <button
              className="registers-icon-btn"
              onClick={() =>
                downloadRowsAsExcel(
                  "financeiro-despesas.xls",
                  "Despesas",
                  ["Lancamento", "Despesa", "Valor", "Vencimento", "Forma", "Status"],
                  (financeData.purchasesRows || []).map((row) => [
                    row.date,
                    row.description,
                    row.value,
                    row.paymentDate || "",
                    row.paymentMethod || "",
                    row.status || "",
                  ]),
                )
              }
            >
              Excel
            </button>
          </div>
        </div>

        {financeData.feedback ? <div className="registers-feedback">{financeData.feedback}</div> : null}
        {!showModal && feedback ? <div className="registers-feedback">{feedback}</div> : null}

        <div className="finance-fixed-expense-head finance-fixed-expense-head-list">
          <div>Lancamento</div>
          <div>Despesa</div>
          <div>Valor</div>
          <div>Vencimento</div>
          <div>Forma</div>
          <div>Status</div>
          <div>Acao</div>
        </div>

        <div className="finance-fixed-expense-list">
          {financeData.loading ? <div className="registers-row">Carregando despesas...</div> : null}
          {!financeData.loading &&
            (financeData.purchasesRows || []).map((row) => (
              <div key={row.id || `${row.date}-${row.description}`} className="finance-fixed-expense-list-row">
                <div>{row.date}</div>
                <div>
                  <button
                    type="button"
                    className="registers-open-inline"
                    onClick={() => financeData.onOpenEditPurchase?.(row)}
                  >
                    {row.description}
                  </button>
                </div>
                <div>{row.value}</div>
                <div>{row.paymentDate || "-"}</div>
                <div>{row.paymentMethod || "-"}</div>
                <div>
                  <button
                    type="button"
                    className={`finance-paid-chip finance-paid-chip-toggle ${row.status === "pago" ? "is-paid" : "is-pending"}`}
                    onClick={() => financeData.onToggleStatusPurchase?.(row)}
                    title="Clique para alternar status"
                  >
                    {row.status === "pago" ? "Pago" : "Pendente"}
                  </button>
                </div>
                <div className="finance-row-action">
                  <button
                    type="button"
                    className="registers-edit-inline"
                    onClick={() => financeData.onOpenEditPurchase?.(row)}
                    aria-label={`Editar ${row.description || "despesa"}`}
                    title="Editar despesa"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    type="button"
                    className="registers-delete-inline"
                    onClick={() => financeData.onRequestDeletePurchase?.(row)}
                    aria-label={`Excluir ${row.description || "despesa"}`}
                    title="Excluir despesa"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
        </div>
        <FinanceDeleteDialog financeData={financeData} />

        <FinanceFixedExpenseModal
          open={showModal}
          titleKicker="Nova despesa"
          title="Lancamento de despesa"
          form={form}
          setForm={setForm}
          onValueChange={onValueChange}
          onValueFocus={onValueFocus}
          onValueBlur={onValueBlur}
          onSubmit={handlePurchaseSubmit}
          onClose={onCloseCreateModal}
          isSubmitting={isSubmitting}
          feedback={feedback}
          paymentMethodOptions={paymentMethodOptions}
        />
        <FinanceFixedExpenseModal
          open={showEditModal}
          titleKicker="Editar despesa"
          title="Atualizar despesa"
          form={editForm}
          setForm={setEditForm}
          onValueChange={onEditValueChange}
          onValueFocus={onEditValueFocus}
          onValueBlur={onEditValueBlur}
          onSubmit={handleEditPurchaseSubmit}
          onClose={onCloseEditModal}
          isSubmitting={editSubmitting}
          feedback={editFeedback}
          paymentMethodOptions={paymentMethodOptions}
        />
      </div>
    </FinanceShell>
  );
}

export function FinancePersonalExpensesView({
  showModal,
  financeData,
  feedback,
  isSubmitting,
  form,
  setForm,
  onValueChange,
  onValueFocus,
  onValueBlur,
  editForm,
  setEditForm,
  editFeedback,
  editSubmitting,
  showEditModal,
  onCloseEditModal,
  onCloseCreateModal,
  handlePersonalExpenseSubmit,
  handleEditPersonalExpenseSubmit,
  onEditValueChange,
  onEditValueFocus,
  onEditValueBlur,
  paymentMethodOptions = [],
}) {
  return (
    <ErrorBoundary>
    <FinanceShell
      activeTab="Despesas Pessoais"
      originValue="Despesas Pessoais"
      onPrint={() => window.print()}
      onExport={() =>
        downloadRowsAsExcel(
          "financeiro-despesas-pessoais.xls",
          "Despesas Pessoais",
          ["Lancamento", "Despesa", "Valor", "Vencimento", "Forma", "Status"],
          (financeData.personalExpensesRows || []).map((row) => [
            row.date,
            row.description,
            row.value,
            row.paymentDate || "",
            row.paymentMethod || "",
            row.status || "",
          ]),
        )
      }
    >
      <div className="finance-board">
        <div className="finance-toolbar">
          <div className="toolbar-group">
            <NavLink to="/financeiro/despesas-pessoais/novo" className="registers-new-btn registers-link-btn">
              Novo
            </NavLink>
          </div>
          <div className="toolbar-group">
            <div className="soft-counter finance-total-chip">{financeData.personalExpensesTotal}</div>
            <button className="registers-icon-btn" onClick={() => window.print()}>Imprimir</button>
            <button
              className="registers-icon-btn"
              onClick={() =>
                downloadRowsAsExcel(
                  "financeiro-despesas-pessoais.xls",
                  "Despesas Pessoais",
                  ["Lancamento", "Despesa", "Valor", "Vencimento", "Forma", "Status"],
                  (financeData.personalExpensesRows || []).map((row) => [
                    row.date,
                    row.description,
                    row.value,
                    row.paymentDate || "",
                    row.paymentMethod || "",
                    row.status || "",
                  ]),
                )
              }
            >
              Excel
            </button>
          </div>
        </div>

        {financeData.feedback ? <div className="registers-feedback">{financeData.feedback}</div> : null}
        {!showModal && feedback ? <div className="registers-feedback">{feedback}</div> : null}

        <div className="finance-fixed-expense-head finance-fixed-expense-head-list">
          <div>Lancamento</div>
          <div>Despesa</div>
          <div>Valor</div>
          <div>Vencimento</div>
          <div>Forma</div>
          <div>Status</div>
          <div>Acao</div>
        </div>

        <div className="finance-fixed-expense-list">
          {financeData.loading ? <div className="registers-row">Carregando despesas pessoais...</div> : null}
          {!financeData.loading &&
            (financeData.personalExpensesRows || []).map((row) => (
              <div key={row.id || `${row.date}-${row.description}`} className="finance-fixed-expense-list-row">
                <div>{row.date}</div>
                <div>
                  <button
                    type="button"
                    className="registers-open-inline"
                    onClick={() => financeData.onOpenEditPersonalExpense?.(row)}
                  >
                    {row.description}
                  </button>
                </div>
                <div>{row.value}</div>
                <div>{row.paymentDate || "-"}</div>
                <div>{row.paymentMethod || "-"}</div>
                <div>
                  <button
                    type="button"
                    className={`finance-paid-chip finance-paid-chip-toggle ${
                      row.status === "pago" ? "is-paid" : "is-pending"
                    }`}
                    onClick={() => financeData.onToggleStatusPersonalExpense?.(row)}
                    title="Clique para alternar status"
                  >
                    {row.status === "pago" ? "Pago" : "Pendente"}
                  </button>
                </div>
                <div className="finance-row-action">
                  <button
                    type="button"
                    className="registers-edit-inline"
                    onClick={() => financeData.onOpenEditPersonalExpense?.(row)}
                    aria-label={`Editar ${row.description || "despesa pessoal"}`}
                    title="Editar despesa pessoal"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    type="button"
                    className="registers-delete-inline"
                    onClick={() => financeData.onRequestDeletePersonalExpense?.(row)}
                    aria-label={`Excluir ${row.description || "despesa pessoal"}`}
                    title="Excluir despesa pessoal"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
        </div>
        <FinanceDeleteDialog financeData={financeData} />

        <FinanceFixedExpenseModal
          open={showModal}
          titleKicker="Nova despesa pessoal"
          title="Lancamento de despesa pessoal"
          form={form}
          setForm={setForm}
          onValueChange={onValueChange}
          onValueFocus={onValueFocus}
          onValueBlur={onValueBlur}
          onSubmit={handlePersonalExpenseSubmit}
          onClose={onCloseCreateModal}
          isSubmitting={isSubmitting}
          feedback={feedback}
          paymentMethodOptions={paymentMethodOptions}
        />

        <FinanceFixedExpenseModal
          open={showEditModal}
          titleKicker="Editar despesa pessoal"
          title="Atualizar despesa pessoal"
          form={editForm}
          setForm={setEditForm}
          onValueChange={onEditValueChange}
          onValueFocus={onEditValueFocus}
          onValueBlur={onEditValueBlur}
          onSubmit={handleEditPersonalExpenseSubmit}
          onClose={onCloseEditModal}
          isSubmitting={editSubmitting}
          feedback={editFeedback}
          paymentMethodOptions={paymentMethodOptions}
        />
      </div>
    </FinanceShell>
    </ErrorBoundary>
  );
}

export function FinanceEmployeesView({
  showModal,
  financeData,
  feedback,
  isSubmitting,
  form,
  setForm,
  showEditModal,
  editForm,
  setEditForm,
  editFeedback,
  editSubmitting,
  onCloseEditModal,
  handleEmployeeSubmit,
  handleEditEmployeeSubmit,
}) {
  return (
    <FinanceShell
      activeTab="Funcionarios"
      originValue="Funcionarios"
      onPrint={() => window.print()}
      onExport={() =>
        downloadRowsAsExcel(
          "financeiro-funcionarios.xls",
          "Funcionarios",
          ["Lancamento", "Funcionario", "Observacao", "Salario", "Vencimento", "Pago", "Automatico", "Meses futuros"],
          (financeData.employeeRows || []).map((row) => [
            row.date,
            row.employeeName,
            row.observation || "-",
            row.value,
            row.dueDate,
            row.status === "pago" ? "Sim" : "Nao",
            row.autoRepeatLabel,
            row.monthsForwardLabel,
          ]),
        )
      }
    >
      <div className="finance-board">
        <div className="finance-toolbar">
          <div className="toolbar-group">
            <NavLink to="/financeiro/funcionarios/novo" className="registers-new-btn registers-link-btn">
              Novo
            </NavLink>
          </div>
          <div className="toolbar-group">
            <div className="soft-counter finance-total-chip">{financeData.employeesTotal}</div>
            <button className="registers-icon-btn" onClick={() => window.print()}>Imprimir</button>
            <button
              className="registers-icon-btn"
              onClick={() =>
                downloadRowsAsExcel(
                  "financeiro-funcionarios.xls",
                  "Funcionarios",
                  ["Lancamento", "Funcionario", "Observacao", "Salario", "Vencimento", "Pago", "Automatico", "Meses futuros"],
                  (financeData.employeeRows || []).map((row) => [
                    row.date,
                    row.employeeName,
                    row.observation || "-",
                    row.value,
                    row.dueDate,
                    row.status === "pago" ? "Sim" : "Nao",
                    row.autoRepeatLabel,
                    row.monthsForwardLabel,
                  ]),
                )
              }
            >
              Excel
            </button>
          </div>
        </div>

        {financeData.feedback ? <div className="registers-feedback">{financeData.feedback}</div> : null}
        {feedback ? <div className="registers-feedback">{feedback}</div> : null}

        <div className="finance-fixed-expense-head finance-fixed-expense-head-list finance-employees-head">
          <div>Lancamento</div>
          <div>Funcionario</div>
          <div>Observacao</div>
          <div>Salario</div>
          <div>Vencimento</div>
          <div>Pago</div>
          <div>Automatico</div>
          <div>Meses</div>
          <div>Acao</div>
        </div>

        <div className="finance-fixed-expense-list">
          {financeData.loading ? <div className="registers-row">Carregando funcionarios...</div> : null}
          {!financeData.loading &&
            (financeData.employeeRows || []).map((row) => (
              <div key={row.id || `${row.date}-${row.employeeName}`} className="finance-fixed-expense-list-row finance-employees-row">
                <div>{row.date}</div>
                <div>
                  <button
                    type="button"
                    className="registers-open-inline"
                    onClick={() => financeData.onOpenEditEmployee?.(row)}
                  >
                    {row.employeeName}
                  </button>
                </div>
                <div>{row.observation || "-"}</div>
                <div>{row.value}</div>
                <div>{row.dueDate}</div>
                <div>
                  <button
                    type="button"
                    className={`finance-paid-chip finance-paid-chip-toggle ${row.status === "pago" ? "is-paid" : "is-pending"}`}
                    onClick={() => financeData.onToggleStatusEmployee?.(row)}
                    title="Clique para alternar status"
                  >
                    {row.status === "pago" ? "Pago" : "Pendente"}
                  </button>
                </div>
                <div>{row.autoRepeatLabel}</div>
                <div>{row.monthsForwardLabel}</div>
                <div className="finance-row-action">
                  <button
                    type="button"
                    className="registers-edit-inline"
                    onClick={() => financeData.onOpenEditEmployee?.(row)}
                    aria-label={`Editar ${row.employeeName || "funcionario"}`}
                    title="Editar funcionario"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    type="button"
                    className="registers-delete-inline"
                    onClick={() => financeData.onRequestDeleteEmployee?.(row)}
                    aria-label={`Excluir ${row.employeeName || "funcionario"}`}
                    title="Excluir funcionario"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
        </div>
        <FinanceDeleteDialog financeData={financeData} />

        {showModal ? (
          <div className="finance-modal-overlay">
            <form className="finance-form-card finance-form-modal" onSubmit={handleEmployeeSubmit}>
              <div className="patient-form-head">
                <div>
                  <span className="section-kicker">Novo funcionario</span>
                  <h2>Lancamento de salario</h2>
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
                  label="Salario (R$)"
                  value={form.value}
                  onChange={(value) => setForm((current) => ({ ...current, value }))}
                  placeholder="0,00"
                  inputMode="decimal"
                />
              </div>

              <EditableField
                label="Funcionario"
                value={form.employeeName}
                onChange={(value) => setForm((current) => ({ ...current, employeeName: value }))}
              />

              <div className="patient-grid finance-form-grid">
                <label className="finance-paid-checkbox field-block">
                  <input
                    type="checkbox"
                    checked={Boolean(form.paid)}
                    onChange={(event) => setForm((current) => ({ ...current, paid: event.target.checked }))}
                  />
                  <span>Pago</span>
                </label>
                <div className="field-block">
                  <label>Lancar automatico</label>
                  <select
                    className="field-input"
                    value={form.autoRepeat ? "sim" : "nao"}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, autoRepeat: event.target.value === "sim" }))
                    }
                  >
                    <option value="nao">Nao</option>
                    <option value="sim">Sim</option>
                  </select>
                </div>
                <EditableField
                  label="Meses futuros"
                  value={form.monthsForward}
                  onChange={(value) => setForm((current) => ({ ...current, monthsForward: value }))}
                  placeholder="0"
                  inputMode="numeric"
                />
              </div>

              <EditableField
                label="Observacao"
                value={form.description}
                onChange={(value) => setForm((current) => ({ ...current, description: value }))}
              />

              {feedback ? <div className="registers-feedback">{feedback}</div> : null}

              <div className="patient-form-footer patient-form-footer-right">
                <div className="patient-form-actions">
                  <button type="submit" className="footer-btn footer-btn-green" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : "Salvar"}
                  </button>
                  <NavLink to="/financeiro/funcionarios" className="footer-btn patient-cancel-btn toolbar-link">
                    Cancelar
                  </NavLink>
                </div>
              </div>
            </form>
          </div>
        ) : null}
        {showEditModal ? (
          <div className="finance-modal-overlay">
            <form className="finance-form-card finance-form-modal" onSubmit={handleEditEmployeeSubmit}>
              <div className="patient-form-head">
                <div>
                  <span className="section-kicker">Editar funcionario</span>
                  <h2>Atualizar salario</h2>
                </div>
              </div>

              <div className="patient-grid finance-form-grid">
                <EditableField
                  label="Lancamento"
                  type="date"
                  value={editForm.date}
                  onChange={(value) => setEditForm((current) => ({ ...current, date: value }))}
                />
                <EditableField
                  label="Vencimento"
                  type="date"
                  value={editForm.dueDate}
                  onChange={(value) => setEditForm((current) => ({ ...current, dueDate: value }))}
                />
                <EditableField
                  label="Salario (R$)"
                  value={editForm.value}
                  onChange={(value) => setEditForm((current) => ({ ...current, value }))}
                />
              </div>

              <EditableField
                label="Funcionario"
                value={editForm.employeeName}
                onChange={(value) => setEditForm((current) => ({ ...current, employeeName: value }))}
              />

              <div className="patient-grid finance-form-grid">
                <label className="finance-paid-checkbox field-block">
                  <input
                    type="checkbox"
                    checked={Boolean(editForm.paid)}
                    onChange={(event) => setEditForm((current) => ({ ...current, paid: event.target.checked }))}
                  />
                  <span>Pago</span>
                </label>
                <div className="field-block">
                  <label>Lancar automatico</label>
                  <select
                    className="field-input"
                    value={editForm.autoRepeat ? "sim" : "nao"}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, autoRepeat: event.target.value === "sim" }))
                    }
                  >
                    <option value="nao">Nao</option>
                    <option value="sim">Sim</option>
                  </select>
                </div>
                <EditableField
                  label="Meses futuros"
                  value={editForm.monthsForward}
                  onChange={(value) => setEditForm((current) => ({ ...current, monthsForward: value }))}
                />
              </div>

              <EditableField
                label="Observacao"
                value={editForm.description}
                onChange={(value) => setEditForm((current) => ({ ...current, description: value }))}
              />

              {editFeedback ? <div className="registers-feedback">{editFeedback}</div> : null}

              <div className="patient-form-footer patient-form-footer-right">
                <div className="patient-form-actions">
                  <button type="submit" className="footer-btn footer-btn-green" disabled={editSubmitting}>
                    {editSubmitting ? "Atualizando..." : "Atualizar"}
                  </button>
                  <button type="button" className="footer-btn patient-cancel-btn" onClick={onCloseEditModal} disabled={editSubmitting}>
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </FinanceShell>
  );
}

export function FinanceFreelanceView({
  showModal,
  financeData,
  feedback,
  isSubmitting,
  form,
  setForm,
  showEditModal,
  editForm,
  setEditForm,
  editFeedback,
  editSubmitting,
  onCloseEditModal,
  handleFreelanceSubmit,
  handleEditFreelanceSubmit,
}) {
  return (
    <FinanceShell
      activeTab="Free lance"
      originValue="Free lance"
      onPrint={() => window.print()}
      onExport={() =>
        downloadRowsAsExcel(
          "financeiro-free-lance.xls",
          "Free lance",
          ["Lancamento", "Nome", "Valor pago", "Observacao"],
          (financeData.freelanceRows || []).map((row) => [row.date, row.name, row.value, row.observation || row.description]),
        )
      }
    >
      <div className="finance-board">
        <div className="finance-toolbar">
          <div className="toolbar-group">
            <NavLink to="/financeiro/free-lance/novo" className="registers-new-btn registers-link-btn">
              Novo
            </NavLink>
          </div>
          <div className="toolbar-group">
            <div className="soft-counter finance-total-chip">{financeData.freelanceTotal}</div>
            <button className="registers-icon-btn" onClick={() => window.print()}>Imprimir</button>
            <button
              className="registers-icon-btn"
              onClick={() =>
                downloadRowsAsExcel(
                  "financeiro-free-lance.xls",
                  "Free lance",
                  ["Lancamento", "Nome", "Valor pago", "Observacao"],
                  (financeData.freelanceRows || []).map((row) => [row.date, row.name, row.value, row.observation || row.description]),
                )
              }
            >
              Excel
            </button>
          </div>
        </div>

        {financeData.feedback ? <div className="registers-feedback">{financeData.feedback}</div> : null}
        {feedback ? <div className="registers-feedback">{feedback}</div> : null}

        <div className="finance-simple-head finance-simple-row-freelance finance-simple-row-freelance-status">
          <div>Data</div>
          <div>Nome</div>
          <div>Observacao</div>
          <div>Valor pago</div>
          <div>Status</div>
          <div>Acao</div>
        </div>

        <div className="finance-simple-body">
          {financeData.loading ? <div className="registers-row">Carregando free lance...</div> : null}
          {!financeData.loading &&
            (financeData.freelanceRows || []).map((row) => (
              <div key={row.id || `${row.date}-${row.name}`} className="finance-simple-row finance-simple-row-freelance finance-simple-row-freelance-status">
                <div>{row.date}</div>
                <div>
                  <button
                    type="button"
                    className="registers-open-inline"
                    onClick={() => financeData.onOpenEditFreelance?.(row)}
                  >
                    {row.name}
                  </button>
                </div>
                <div>{row.observation || "-"}</div>
                <div>{row.value}</div>
                <div>
                  <button
                    type="button"
                    className={`finance-paid-chip finance-paid-chip-toggle ${row.status === "pago" ? "is-paid" : "is-pending"}`}
                    onClick={() => financeData.onToggleStatusFreelance?.(row)}
                    title="Clique para alternar status"
                  >
                    {row.status === "pago" ? "Pago" : "Pendente"}
                  </button>
                </div>
                <div className="finance-row-action">
                  <button
                    type="button"
                    className="registers-edit-inline"
                    onClick={() => financeData.onOpenEditFreelance?.(row)}
                    aria-label={`Editar ${row.name || "free lance"}`}
                    title="Editar free lance"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    type="button"
                    className="registers-delete-inline"
                    onClick={() => financeData.onRequestDeleteFreelance?.(row)}
                    aria-label={`Excluir ${row.name || "free lance"}`}
                    title="Excluir free lance"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
        </div>
        <FinanceDeleteDialog financeData={financeData} />

        {showModal ? (
          <div className="finance-modal-overlay">
            <form className="finance-form-card finance-form-modal" onSubmit={handleFreelanceSubmit}>
              <div className="patient-form-head">
                <div>
                  <span className="section-kicker">Novo free lance</span>
                  <h2>Lancamento de free lance</h2>
                </div>
              </div>

              <div className="patient-grid finance-form-grid">
                <EditableField
                  label="Data"
                  type="date"
                  value={form.date}
                  onChange={(value) => setForm((current) => ({ ...current, date: value }))}
                />
                <EditableField
                  label="Valor pago (R$)"
                  value={form.value}
                  onChange={(value) => setForm((current) => ({ ...current, value }))}
                  placeholder="0,00"
                  inputMode="decimal"
                />
                <div className="field-block">
                  <label>Status</label>
                  <select
                    className="field-input"
                    value={form.status || "pendente"}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago</option>
                  </select>
                </div>
              </div>

              <EditableField
                label="Nome do free lance"
                value={form.name}
                onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              />

              <EditableField
                label="Observacao"
                value={form.description}
                onChange={(value) => setForm((current) => ({ ...current, description: value }))}
              />

              {feedback ? <div className="registers-feedback">{feedback}</div> : null}

              <div className="patient-form-footer patient-form-footer-right">
                <div className="patient-form-actions">
                  <button type="submit" className="footer-btn footer-btn-green" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : "Salvar"}
                  </button>
                  <NavLink to="/financeiro/free-lance" className="footer-btn patient-cancel-btn toolbar-link">
                    Cancelar
                  </NavLink>
                </div>
              </div>
            </form>
          </div>
        ) : null}
        {showEditModal ? (
          <div className="finance-modal-overlay">
            <form className="finance-form-card finance-form-modal" onSubmit={handleEditFreelanceSubmit}>
              <div className="patient-form-head">
                <div>
                  <span className="section-kicker">Editar free lance</span>
                  <h2>Atualizar lancamento de free lance</h2>
                </div>
              </div>

              <div className="patient-grid finance-form-grid">
                <EditableField
                  label="Data"
                  type="date"
                  value={editForm.date}
                  onChange={(value) => setEditForm((current) => ({ ...current, date: value }))}
                />
                <EditableField
                  label="Valor pago (R$)"
                  value={editForm.value}
                  onChange={(value) => setEditForm((current) => ({ ...current, value }))}
                />
                <div className="field-block">
                  <label>Status</label>
                  <select
                    className="field-input"
                    value={editForm.status || "pendente"}
                    onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value }))}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago</option>
                  </select>
                </div>
              </div>

              <EditableField
                label="Nome do free lance"
                value={editForm.name}
                onChange={(value) => setEditForm((current) => ({ ...current, name: value }))}
              />

              <EditableField
                label="Observacao"
                value={editForm.description}
                onChange={(value) => setEditForm((current) => ({ ...current, description: value }))}
              />

              {editFeedback ? <div className="registers-feedback">{editFeedback}</div> : null}

              <div className="patient-form-footer patient-form-footer-right">
                <div className="patient-form-actions">
                  <button type="submit" className="footer-btn footer-btn-green" disabled={editSubmitting}>
                    {editSubmitting ? "Atualizando..." : "Atualizar"}
                  </button>
                  <button type="button" className="footer-btn patient-cancel-btn" onClick={onCloseEditModal} disabled={editSubmitting}>
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </FinanceShell>
  );
}

function FinanceFixedExpenseModal({
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
}) {
  if (!open) return null;

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
            label="Valor (R$)"
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

        <EditableField
          label="Descricao"
          value={form.description}
          onChange={(value) => setForm((current) => ({ ...current, description: value }))}
        />

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

export function FinanceFixedExpensesView({
  showModal,
  financeData,
  feedback,
  isSubmitting,
  form,
  setForm,
  onValueChange,
  onValueFocus,
  onValueBlur,
  handleFixedExpenseSubmit,
  onCloseCreateModal,
  showEditModal,
  editForm,
  setEditForm,
  editFeedback,
  editSubmitting,
  onEditValueChange,
  onEditValueFocus,
  onEditValueBlur,
  handleEditFixedExpenseSubmit,
  onCloseEditModal,
  paymentMethodOptions = [],
}) {
  return (
    <FinanceShell
      activeTab="Despesas Fixas"
      originValue="Despesas Fixas"
      onPrint={() => window.print()}
      onExport={() =>
        downloadRowsAsExcel(
          "financeiro-despesas-fixas.xls",
          "Despesas Fixas",
          ["Lancamento", "Despesa", "Valor", "Vencimento", "Forma", "Status"],
          (financeData.fixedExpensesRows || []).map((row) => [
            row.date,
            row.description,
            row.value,
            row.paymentDate || "",
            row.paymentMethod || "",
            row.status || "",
          ]),
        )
      }
    >
      <div className="finance-board">
        <div className="finance-toolbar">
          <div className="toolbar-group">
            <NavLink to="/financeiro/despesas-fixas/novo" className="registers-new-btn registers-link-btn">
              Novo
            </NavLink>
          </div>
          <div className="toolbar-group">
            <div className="soft-counter finance-total-chip">{financeData.fixedExpensesTotal}</div>
            <button className="registers-icon-btn" onClick={() => window.print()}>Imprimir</button>
            <button
              className="registers-icon-btn"
              onClick={() =>
                downloadRowsAsExcel(
                  "financeiro-despesas-fixas.xls",
                  "Despesas Fixas",
                  ["Lancamento", "Despesa", "Valor", "Vencimento", "Forma", "Status"],
                  (financeData.fixedExpensesRows || []).map((row) => [
                    row.date,
                    row.description,
                    row.value,
                    row.paymentDate || "",
                    row.paymentMethod || "",
                    row.status || "",
                  ]),
                )
              }
            >
              Excel
            </button>
          </div>
        </div>

        {financeData.feedback ? <div className="registers-feedback">{financeData.feedback}</div> : null}
        {feedback ? <div className="registers-feedback">{feedback}</div> : null}

        <div className="finance-fixed-expense-head finance-fixed-expense-head-list">
          <div>Lancamento</div>
          <div>Despesa</div>
          <div>Valor</div>
          <div>Vencimento</div>
          <div>Forma</div>
          <div>Status</div>
          <div>Acao</div>
        </div>

        <div className="finance-fixed-expense-list">
          {financeData.loading ? <div className="registers-row">Carregando despesas fixas...</div> : null}
          {!financeData.loading &&
            (financeData.fixedExpensesRows || []).map((row) => (
              <div key={row.id || `${row.date}-${row.description}`} className="finance-fixed-expense-list-row">
                <div>{row.date}</div>
                <div>
                  <button
                    type="button"
                    className="registers-open-inline"
                    onClick={() => financeData.onOpenEditFixedExpense?.(row)}
                  >
                    {row.description}
                  </button>
                </div>
                <div>{row.value}</div>
                <div>{row.paymentDate || "-"}</div>
                <div>{row.paymentMethod || "-"}</div>
                <div>
                  <button
                    type="button"
                    className={`finance-paid-chip finance-paid-chip-toggle ${row.status === "pago" ? "is-paid" : "is-pending"}`}
                    onClick={() => financeData.onToggleStatusFixedExpense?.(row)}
                    title="Clique para alternar status"
                  >
                    {row.status === "pago" ? "Pago" : "Pendente"}
                  </button>
                </div>
                <div className="finance-row-action">
                  <button
                    type="button"
                    className="registers-edit-inline"
                    onClick={() => financeData.onOpenEditFixedExpense?.(row)}
                    aria-label={`Editar ${row.description || "despesa fixa"}`}
                    title="Editar despesa fixa"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    type="button"
                    className="registers-delete-inline"
                    onClick={() => financeData.onRequestDeleteFixedExpense?.(row)}
                    aria-label={`Excluir ${row.description || "despesa fixa"}`}
                    title="Excluir despesa fixa"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
        </div>
        <FinanceDeleteDialog financeData={financeData} />

        <FinanceFixedExpenseModal
          open={showModal}
          titleKicker="Nova despesa fixa"
          title="Lancamento de despesa fixa"
          form={form}
          setForm={setForm}
          onValueChange={onValueChange}
          onValueFocus={onValueFocus}
          onValueBlur={onValueBlur}
          onSubmit={handleFixedExpenseSubmit}
          onClose={onCloseCreateModal}
          isSubmitting={isSubmitting}
          feedback={feedback}
          paymentMethodOptions={paymentMethodOptions}
        />
        <FinanceFixedExpenseModal
          open={showEditModal}
          titleKicker="Editar despesa fixa"
          title="Atualizar despesa fixa"
          form={editForm}
          setForm={setEditForm}
          onValueChange={onEditValueChange}
          onValueFocus={onEditValueFocus}
          onValueBlur={onEditValueBlur}
          onSubmit={handleEditFixedExpenseSubmit}
          onClose={onCloseEditModal}
          isSubmitting={editSubmitting}
          feedback={editFeedback}
          paymentMethodOptions={paymentMethodOptions}
        />
      </div>
    </FinanceShell>
  );
}

export function FinancePaymentsView({ financeData }) {
  return (
    <FinanceShell
      activeTab="Pagamentos"
      originValue="Pagamentos"
      onPrint={() => window.print()}
      onExport={() =>
        downloadRowsAsExcel(
          "financeiro-pagamentos.xls",
          "Pagamentos",
          ["Data", "Descricao", "Bruto", "Taxa", "Liquido"],
          (financeData.paymentRows || []).map((row) => [
            row.date,
            row.description,
            row.grossDisplay || row.value,
            row.feeDisplay || "R$ 0,00",
            row.netDisplay || row.value,
          ]),
        )
      }
    >
      <div className="finance-board">
        <div className="finance-toolbar">
          <div className="toolbar-group">
            <button className="soft-btn" onClick={financeData.onOpenPaymentModal}>Pagamento</button>
          </div>
          <div className="toolbar-group">
            <div className="soft-counter finance-total-chip">{financeData.paymentsTotals}</div>
            <button className="registers-icon-btn" onClick={() => window.print()}>Imprimir</button>
            <button
              className="registers-icon-btn"
              onClick={() =>
                downloadRowsAsExcel(
                  "financeiro-pagamentos.xls",
                  "Pagamentos",
                  ["Data", "Descricao", "Bruto", "Taxa", "Liquido"],
                  (financeData.paymentRows || []).map((row) => [
                    row.date,
                    row.description,
                    row.grossDisplay || row.value,
                    row.feeDisplay || "R$ 0,00",
                    row.netDisplay || row.value,
                  ]),
                )
              }
            >
              Excel
            </button>
          </div>
        </div>

        {financeData.feedback ? <div className="registers-feedback">{financeData.feedback}</div> : null}

        <div className="finance-simple-head finance-simple-head-actions">
          <div>Data</div>
          <div>Descricao</div>
          <div>Valor</div>
          <div>Acao</div>
        </div>

        {financeData.paymentRows.length ? (
          <div className="finance-simple-body">
            {financeData.loading ? <div className="registers-row">Carregando pagamentos...</div> : null}
            {!financeData.loading &&
              (financeData.paymentRows || []).map((row) => (
                <div key={row.id || `${row.date}-${row.description}-${row.value}`} className="finance-simple-row finance-simple-row-actions">
                  <div>{row.date}</div>
                  <div>
                    <button
                      type="button"
                      className="registers-open-inline"
                      onClick={() => financeData.onOpenPaymentEditor?.(row)}
                    >
                      {row.description}
                    </button>
                    <div className="finance-breakdown-line">
                      <span>Bruto {row.grossDisplay || row.value}</span>
                      <span>Taxa {row.feeDisplay || "R$ 0,00"}</span>
                      <strong>Liquido {row.netDisplay || row.value}</strong>
                    </div>
                  </div>
                  <div>{row.netDisplay || row.value}</div>
                  <div className="finance-row-action">
                    <button
                      type="button"
                      className="registers-edit-inline"
                      onClick={() => financeData.onOpenPaymentEditor?.(row)}
                      aria-label={`Editar ${row.description || "pagamento"}`}
                      title="Editar pagamento"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      type="button"
                      className="registers-delete-inline"
                      onClick={() => financeData.onDeletePayment?.(row)}
                      aria-label={`Excluir ${row.description || "pagamento"}`}
                      title="Excluir pagamento"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        ) : null}

        <div className="finance-section-caption">
          <div className="soft-counter finance-total-chip">Despesas fixas do periodo</div>
        </div>

        <div className="finance-fixed-expense-head finance-fixed-expense-head-list">
          <div>Lancamento</div>
          <div>Despesa</div>
          <div>Valor</div>
          <div>Vencimento</div>
          <div>Forma</div>
          <div>Status</div>
          <div>Acao</div>
        </div>

        <div className="finance-fixed-expense-list">
          {financeData.loading ? <div className="registers-row">Carregando despesas fixas...</div> : null}
          {!financeData.loading && !financeData.fixedExpensesRows.length ? (
            <div className="registers-row">Nenhuma despesa fixa encontrada para este periodo.</div>
          ) : null}
          {!financeData.loading &&
            (financeData.fixedExpensesRows || []).map((row) => (
              <div key={row.id || `${row.date}-${row.description}`} className="finance-fixed-expense-list-row">
                <div>{row.date}</div>
                <div>
                  <button
                    type="button"
                    className="registers-open-inline"
                    onClick={() => financeData.onOpenFixedExpenseEditor?.(row)}
                  >
                    {row.description}
                  </button>
                </div>
                <div>{row.value}</div>
                <div>{row.paymentDate || "-"}</div>
                <div>{row.paymentMethod || "-"}</div>
                <div>{row.status || "-"}</div>
                <div className="finance-row-action">
                  <button
                    type="button"
                    className="registers-edit-inline"
                    onClick={() => financeData.onOpenFixedExpenseEditor?.(row)}
                    aria-label={`Abrir ${row.description || "despesa fixa"}`}
                    title="Atualizar pagamento da despesa fixa"
                  >
                    <PencilIcon />
                  </button>
                </div>
              </div>
            ))}
        </div>
        <FinanceDeleteDialog financeData={financeData} />

        <div
          className="finance-empty-stage"
          style={financeData.paymentRows.length || financeData.fixedExpensesRows.length ? { display: "none" } : undefined}
        >
          <div className="finance-balance-pill">Saldo do Periodo</div>
          <strong>0,00</strong>
        </div>

        {financeData.showPaymentModal ? (
          <div className="finance-modal-overlay">
            <form className="finance-form-card finance-form-modal" onSubmit={financeData.onSubmitPayment}>
              <div className="patient-form-head">
                <div>
                  <span className="section-kicker">Novo pagamento</span>
                  <h2>Lancamento de pagamento</h2>
                </div>
              </div>

              <div className="patient-grid finance-form-grid">
                <EditableField label="Data" type="date" value={financeData.paymentForm.date} onChange={(value) => financeData.setPaymentForm((current) => ({ ...current, date: value }))} />
                <EditableField label="Valor" value={financeData.paymentForm.value} onChange={(value) => financeData.setPaymentForm((current) => ({ ...current, value: value }))} />
              </div>
              <EditableField
                label="Descricao"
                value={financeData.paymentForm.description}
                onChange={(value) => financeData.setPaymentForm((current) => ({ ...current, description: value }))}
              />
              <EditableField
                label="Meio de pagamento"
                value={financeData.paymentForm.paymentMethod}
                onChange={(value) => financeData.setPaymentForm((current) => ({ ...current, paymentMethod: value }))}
              />

              {financeData.paymentFeedback ? <div className="registers-feedback">{financeData.paymentFeedback}</div> : null}

              <div className="patient-form-footer patient-form-footer-right">
                <div className="patient-form-actions">
                  <button type="submit" className="footer-btn footer-btn-green" disabled={financeData.paymentSubmitting}>
                    {financeData.paymentSubmitting ? "Salvando..." : "Salvar"}
                  </button>
                  <button type="button" className="footer-btn patient-cancel-btn" onClick={financeData.onClosePaymentModal}>
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : null}
        {financeData.showPaymentEditModal ? (
          <div className="finance-modal-overlay">
            <form className="finance-form-card finance-form-modal" onSubmit={financeData.onSubmitPaymentEdit}>
              <div className="patient-form-head">
                <div>
                  <span className="section-kicker">Editar pagamento</span>
                  <h2>Atualizar lancamento de pagamento</h2>
                </div>
              </div>

              <div className="patient-grid finance-form-grid">
                <EditableField
                  label="Data"
                  type="date"
                  value={financeData.paymentEditForm.date}
                  onChange={(value) => financeData.setPaymentEditForm((current) => ({ ...current, date: value }))}
                />
                <EditableField
                  label="Valor"
                  value={financeData.paymentEditForm.value}
                  onChange={(value) => financeData.setPaymentEditForm((current) => ({ ...current, value }))}
                />
              </div>
              <EditableField
                label="Descricao"
                value={financeData.paymentEditForm.description}
                onChange={(value) => financeData.setPaymentEditForm((current) => ({ ...current, description: value }))}
              />
              <EditableField
                label="Meio de pagamento"
                value={financeData.paymentEditForm.paymentMethod}
                onChange={(value) => financeData.setPaymentEditForm((current) => ({ ...current, paymentMethod: value }))}
              />

              {financeData.paymentEditFeedback ? <div className="registers-feedback">{financeData.paymentEditFeedback}</div> : null}

              <div className="patient-form-footer patient-form-footer-right">
                <div className="patient-form-actions">
                  <button type="submit" className="footer-btn footer-btn-green" disabled={financeData.paymentEditSubmitting}>
                    {financeData.paymentEditSubmitting ? "Atualizando..." : "Atualizar"}
                  </button>
                  <button type="button" className="footer-btn patient-cancel-btn" onClick={financeData.onClosePaymentEditor}>
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : null}
        <FinanceFixedExpenseModal
          open={financeData.showFixedExpenseModal}
          titleKicker="Pagamento da despesa fixa"
          title="Atualizar despesa fixa"
          form={financeData.fixedExpenseForm}
          setForm={financeData.setFixedExpenseForm}
          onValueChange={financeData.onFixedExpenseValueChange}
          onValueFocus={financeData.onFixedExpenseValueFocus}
          onValueBlur={financeData.onFixedExpenseValueBlur}
          onSubmit={financeData.onSubmitFixedExpense}
          onClose={financeData.onCloseFixedExpenseEditor}
          isSubmitting={financeData.fixedExpenseSubmitting}
          feedback={financeData.fixedExpenseFeedback}
          paymentMethodOptions={financeData.paymentMethodOptions}
        />
      </div>
    </FinanceShell>
  );
}

export function FinanceCommissionsView({ financeData }) {
  return (
    <FinanceShell
      activeTab="Comissoes"
      originValue="Comissoes"
      onPrint={() => window.print()}
      onExport={() =>
        downloadRowsAsExcel(
          "financeiro-comissoes.xls",
          "Comissoes",
          ["Data", "Descricao", "Valor"],
          (financeData.commissionRows || []).map((row) => [row.date, row.description, row.value]),
        )
      }
    >
      <div className="finance-board">
        <div className="finance-toolbar">
          <div className="finance-toolbar-spacer" />
          <div className="toolbar-group">
            <div className="soft-counter finance-total-chip">{financeData.commissionsTotal}</div>
            <button className="registers-icon-btn" onClick={() => window.print()}>Imprimir</button>
            <button
              className="registers-icon-btn"
              onClick={() =>
                downloadRowsAsExcel(
                  "financeiro-comissoes.xls",
                  "Comissoes",
                  ["Data", "Descricao", "Valor"],
                  (financeData.commissionRows || []).map((row) => [row.date, row.description, row.value]),
                )
              }
            >
              Excel
            </button>
          </div>
        </div>

        {financeData.feedback ? <div className="registers-feedback">{financeData.feedback}</div> : null}

        <div className="finance-simple-head finance-simple-head-actions">
          <div>Data</div>
          <div>Descricao</div>
          <div>Valor</div>
          <div>Acao</div>
        </div>

        <div className="finance-simple-body finance-large-empty">
          {financeData.loading ? <div className="registers-row">Carregando comissoes...</div> : null}
          {!financeData.loading &&
            (financeData.commissionRows || []).map((row) => (
              <div key={row.id || `${row.date}-${row.description}-${row.value}`} className="finance-simple-row finance-simple-row-actions">
                <div>{row.date}</div>
                <div>{row.description}</div>
                <div>{row.value}</div>
                <div className="finance-row-action">
                  <button
                    type="button"
                    className="registers-delete-inline"
                    onClick={() => financeData.onRequestDeleteCommission?.(row)}
                    aria-label={`Excluir ${row.description || "comissao"}`}
                    title="Excluir comissao"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
        </div>
        <FinanceDeleteDialog financeData={financeData} />
      </div>
    </FinanceShell>
  );
}

export function FinanceSummaryView({ financeData }) {
  const salesGross = financeData.summaryMetrics?.salesGross || 0;
  const salesNet = financeData.summaryMetrics?.salesNet || 0;
  const salesFees = financeData.summaryMetrics?.salesFees || 0;
  const purchasesTotal = financeData.summaryMetrics?.purchasesTotal || 0;
  const fixedExpensesTotal = financeData.summaryMetrics?.fixedExpensesTotal || 0;
  const costsTotal = financeData.summaryMetrics?.costsTotal || 0;
  const paymentsGross = financeData.summaryMetrics?.paymentsGross || 0;
  const paymentsNet = financeData.summaryMetrics?.paymentsNet || 0;
  const paymentFees = financeData.summaryMetrics?.paymentFees || 0;
  const commissionsTotal = financeData.summaryMetrics?.commissionsTotal || 0;
  const paymentCount = financeData.paymentRows.length;
  const balance = salesNet - costsTotal - commissionsTotal;
  const enhancedCards = [
    { label: "Faturamento bruto", value: `R$ ${salesGross.toFixed(2).replace(".", ",")}` },
    { label: "Taxas financeiras", value: `R$ ${salesFees.toFixed(2).replace(".", ",")}` },
    { label: "Faturamento liquido", value: `R$ ${salesNet.toFixed(2).replace(".", ",")}` },
      { label: "Despesas variaveis", value: `R$ ${purchasesTotal.toFixed(2).replace(".", ",")}` },
    { label: "Despesas fixas", value: `R$ ${fixedExpensesTotal.toFixed(2).replace(".", ",")}` },
    { label: "Comissoes", value: `R$ ${commissionsTotal.toFixed(2).replace(".", ",")}` },
    { label: "Lancamentos pagos", value: String(paymentCount) },
  ];

  return (
    <FinanceShell activeTab="Resumo" originValue="Resumo" onPrint={() => window.print()}>
      <div className="finance-summary-board">
        <div className="finance-summary-topbar">
          <div className="soft-counter finance-total-chip finance-summary-chip">{financeData.summaryTotals}</div>
        </div>

        {financeData.feedback ? <div className="registers-feedback">{financeData.feedback}</div> : null}

        <div className="finance-summary-cards">
          {enhancedCards.map((card) => (
            <div key={card.label} className="finance-summary-mini-card">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
          ))}
        </div>

        <div className="finance-summary-grid">
          <section className="finance-chart-card finance-chart-left">
            <h3>Visao completa do pet shop</h3>
            <p className="finance-summary-note">Painel gerencial para enxergar bruto, taxas, liquido e resultado real.</p>
            <div className="finance-summary-stats">
              <div className="finance-summary-stat-line">
                <span>Vendido bruto</span>
                <strong>{`R$ ${salesGross.toFixed(2).replace(".", ",")}`}</strong>
              </div>
              <div className="finance-summary-stat-line">
                <span>Taxas da maquininha</span>
                <strong>{`R$ ${salesFees.toFixed(2).replace(".", ",")}`}</strong>
              </div>
              <div className="finance-summary-stat-line">
                <span>Receita liquida</span>
                <strong>{`R$ ${salesNet.toFixed(2).replace(".", ",")}`}</strong>
              </div>
              <div className="finance-summary-stat-line">
                <span>Despesas e custos</span>
                <strong>{`R$ ${costsTotal.toFixed(2).replace(".", ",")}`}</strong>
              </div>
              <div className="finance-summary-stat-line">
                <span>Despesas fixas</span>
                <strong>{`R$ ${fixedExpensesTotal.toFixed(2).replace(".", ",")}`}</strong>
              </div>
              <div className="finance-summary-stat-line">
                <span>Comissoes</span>
                <strong>{`R$ ${commissionsTotal.toFixed(2).replace(".", ",")}`}</strong>
              </div>
              <div className="finance-summary-stat-line finance-summary-stat-line-accent">
                <span>Lucro estimado</span>
                <strong>{`R$ ${balance.toFixed(2).replace(".", ",")}`}</strong>
              </div>
            </div>
            <div className="finance-legend finance-legend-spread">
              <div>
                <strong>Diferenca bruto x liquido</strong>
                <p>{`R$ ${salesFees.toFixed(2).replace(".", ",")}`}</p>
              </div>
              <div>
                <strong>Vendas no periodo</strong>
                <p>{financeData.salesRows.length}</p>
              </div>
            </div>
          </section>

          <section className="finance-chart-card finance-chart-right">
            <h3>Leitura dos recebimentos</h3>
            <p className="finance-summary-note">Aqui voce enxerga o que entrou bruto, o custo financeiro e o liquido real.</p>
            <div className="finance-summary-stats">
              <div className="finance-summary-stat-line">
                <span>Recebido bruto</span>
                <strong>{`R$ ${paymentsGross.toFixed(2).replace(".", ",")}`}</strong>
              </div>
              <div className="finance-summary-stat-line">
                <span>Taxas sobre recebimentos</span>
                <strong>{`R$ ${paymentFees.toFixed(2).replace(".", ",")}`}</strong>
              </div>
              <div className="finance-summary-stat-line">
                <span>Recebido liquido</span>
                <strong>{`R$ ${paymentsNet.toFixed(2).replace(".", ",")}`}</strong>
              </div>
              <div className="finance-summary-stat-line">
                <span>Caixa liquido apos custos</span>
                <strong>{`R$ ${(paymentsNet - costsTotal - commissionsTotal).toFixed(2).replace(".", ",")}`}</strong>
              </div>
            </div>
          </section>
        </div>
      </div>
    </FinanceShell>
  );
}
