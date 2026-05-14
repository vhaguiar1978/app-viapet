import { NavLink } from "react-router-dom";
import { EditableField } from "../../components/fields.jsx";
import { FinanceShell } from "./FinanceShell.jsx";
import { downloadRowsAsExcel } from "../../utils/exportExcel.js";
import { openPrintWindow } from "../../utils/windowPlacement.js";
import { Component, useEffect, useState } from "react";

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
  bankAccountOptions = [],
  onOpenParcelas,
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
                  {row.purchaseGroupId ? (
                    <button
                      type="button"
                      className="soft-chip"
                      onClick={() => onOpenParcelas?.(row.purchaseGroupId)}
                      title="Ver todas as parcelas desta compra"
                      style={{ fontSize: 11, padding: "2px 8px" }}
                    >
                      Parcelas
                    </button>
                  ) : null}
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
          bankAccountOptions={bankAccountOptions}
          showInstallments
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
          bankAccountOptions={bankAccountOptions}
        />
      </div>
    </FinanceShell>
  );
}

export function FinancePersonalExpensesView({
  showModal,
  financeData,
  createLink,
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
            <NavLink to={createLink || "/financeiro/despesas-pessoais/novo"} className="registers-new-btn registers-link-btn">
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
          showInstallments
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
  paymentMethodOptions = [],
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
                <div className="field-block">
                  <label>Forma de pagamento</label>
                  <select
                    className="field-input"
                    value={form.paymentMethod || ""}
                    onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))}
                  >
                    <option value="">Selecione</option>
                    {paymentMethodOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
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
                <div className="field-block">
                  <label>Forma de pagamento</label>
                  <select
                    className="field-input"
                    value={editForm.paymentMethod || ""}
                    onChange={(event) => setEditForm((current) => ({ ...current, paymentMethod: event.target.value }))}
                  >
                    <option value="">Selecione</option>
                    {paymentMethodOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
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

function formatPaidCurrencyBr(value) {
  const number = Number(value || 0) || 0;
  return `R$ ${number.toFixed(2).replace(".", ",")}`;
}

function isPaidStatus(status) {
  return String(status || "").toLowerCase() === "pago";
}

function buildPaidCategoryGroups(financeData) {
  const paymentRows = (financeData.paymentRows || []).filter((row) => isPaidStatus(row.status) || !row.status);
  const salesRows = financeData.salesRows || [];
  const purchasesPaid = (financeData.purchasesRows || []).filter((row) => isPaidStatus(row.status));
  const personalPaid = (financeData.personalExpensesRows || []).filter((row) => isPaidStatus(row.status));
  const employeePaid = (financeData.employeeRows || []).filter((row) => isPaidStatus(row.status));
  const freelancePaid = (financeData.freelanceRows || []).filter((row) => isPaidStatus(row.status));
  const fixedPaid = (financeData.fixedExpensesRows || []).filter((row) => isPaidStatus(row.status));
  const commissionRows = financeData.commissionRows || [];

  const sumNet = (rows) => rows.reduce((sum, row) => sum + Number(row.netAmount ?? row.amount ?? 0), 0);

  return [
    {
      key: "recebimentos",
      label: "Recebimentos avulsos",
      tone: "entrada",
      rows: paymentRows.map((row) => ({
        id: row.id,
        date: row.date,
        description: row.description,
        valueDisplay: row.netDisplay || row.value,
        amount: Number(row.netAmount ?? row.amount ?? 0),
        onEdit: () => financeData.onOpenPaymentEditor?.(row),
        onDelete: () => financeData.onDeletePayment?.(row),
      })),
      subtotal: sumNet(paymentRows),
    },
    {
      key: "vendas",
      label: "Vendas (PDV e Agenda)",
      tone: "entrada",
      rows: salesRows.map((row) => ({
        id: row.id,
        date: row.date,
        description: `${row.sale || ""}${row.customer ? ` - ${row.customer}` : ""}`.trim() || row.customer || row.sale || "Venda",
        valueDisplay: row.netDisplay || `R$ ${row.value || "0,00"}`,
        amount: Number(row.netAmount ?? 0),
      })),
      subtotal: sumNet(salesRows),
    },
    {
      key: "despesas-variaveis",
      label: "Despesas variaveis (compras)",
      tone: "saida",
      rows: purchasesPaid.map((row) => ({
        id: row.id,
        date: row.date,
        description: row.description,
        valueDisplay: `R$ ${row.value}`,
        amount: Number(row.amount ?? 0),
      })),
      subtotal: sumNet(purchasesPaid),
    },
    {
      key: "despesas-fixas",
      label: "Despesas fixas",
      tone: "saida",
      rows: fixedPaid.map((row) => ({
        id: row.id,
        date: row.date,
        description: row.description,
        valueDisplay: `R$ ${row.value}`,
        amount: Number(row.amount ?? 0),
        onEdit: () => financeData.onOpenFixedExpenseEditor?.(row),
      })),
      subtotal: sumNet(fixedPaid),
    },
    {
      key: "despesas-pessoais",
      label: "Despesas pessoais",
      tone: "saida",
      rows: personalPaid.map((row) => ({
        id: row.id,
        date: row.date,
        description: row.description,
        valueDisplay: `R$ ${row.value}`,
        amount: Number(row.amount ?? 0),
      })),
      subtotal: sumNet(personalPaid),
    },
    {
      key: "funcionarios",
      label: "Funcionarios",
      tone: "saida",
      rows: employeePaid.map((row) => ({
        id: row.id,
        date: row.date,
        description: row.employeeName ? `${row.employeeName}${row.observation ? ` - ${row.observation}` : ""}` : row.description,
        valueDisplay: `R$ ${row.value}`,
        amount: Number(row.amount ?? 0),
      })),
      subtotal: sumNet(employeePaid),
    },
    {
      key: "free-lance",
      label: "Free lance",
      tone: "saida",
      rows: freelancePaid.map((row) => ({
        id: row.id,
        date: row.date,
        description: row.name ? `${row.name}${row.observation ? ` - ${row.observation}` : ""}` : row.description,
        valueDisplay: `R$ ${row.value}`,
        amount: Number(row.amount ?? 0),
      })),
      subtotal: sumNet(freelancePaid),
    },
    {
      key: "comissoes",
      label: "Comissoes",
      tone: "saida",
      rows: commissionRows.map((row) => ({
        id: row.id,
        date: row.date,
        description: row.description,
        valueDisplay: `R$ ${row.value}`,
        amount: Number(row.amount ?? 0),
      })),
      subtotal: sumNet(commissionRows),
    },
  ];
}

export function FinancePaymentsView({ financeData }) {
  const paidCategories = buildPaidCategoryGroups(financeData);
  const visibleCategories = paidCategories.filter((category) => category.rows.length > 0);
  const grandTotalEntradas = paidCategories
    .filter((c) => c.tone === "entrada")
    .reduce((sum, c) => sum + c.subtotal, 0);
  const grandTotalSaidas = paidCategories
    .filter((c) => c.tone === "saida")
    .reduce((sum, c) => sum + c.subtotal, 0);

  const excelRows = visibleCategories.flatMap((category) => [
    [category.label, "", `Subtotal ${formatPaidCurrencyBr(category.subtotal)}`],
    ...category.rows.map((row) => [row.date, row.description, row.valueDisplay]),
    ["", "", ""],
  ]);

  return (
    <FinanceShell
      activeTab="Pagamentos"
      originValue="Pagamentos"
      onPrint={() => window.print()}
      onExport={() =>
        downloadRowsAsExcel(
          "financeiro-pagamentos.xls",
          "Pagamentos pagos por categoria",
          ["Data", "Descricao", "Valor"],
          excelRows,
        )
      }
    >
      <div className="finance-board">
        <div className="finance-toolbar">
          <div className="toolbar-group">
            <button className="soft-btn" onClick={financeData.onOpenPaymentModal}>Pagamento</button>
          </div>
          <div className="toolbar-group">
            <div className="soft-counter finance-total-chip">
              {`Entradas ${formatPaidCurrencyBr(grandTotalEntradas)} | Saidas ${formatPaidCurrencyBr(grandTotalSaidas)}`}
            </div>
            <button className="registers-icon-btn" onClick={() => window.print()}>Imprimir</button>
            <button
              className="registers-icon-btn"
              onClick={() =>
                downloadRowsAsExcel(
                  "financeiro-pagamentos.xls",
                  "Pagamentos pagos por categoria",
                  ["Data", "Descricao", "Valor"],
                  excelRows,
                )
              }
            >
              Excel
            </button>
          </div>
        </div>

        {financeData.feedback ? <div className="registers-feedback">{financeData.feedback}</div> : null}

        {financeData.loading ? <div className="registers-row">Carregando pagamentos...</div> : null}

        {!financeData.loading && !visibleCategories.length ? (
          <div className="registers-row">Nenhum pagamento pago encontrado neste periodo.</div>
        ) : null}

        {!financeData.loading &&
          visibleCategories.map((category) => (
            <section
              key={category.key}
              className={`finance-paid-category finance-paid-category-${category.tone}`}
            >
              <header className="finance-paid-category-head">
                <div className="finance-paid-category-title">
                  <strong>{category.label}</strong>
                  <span className="finance-paid-category-count">
                    {category.rows.length} {category.rows.length === 1 ? "lancamento" : "lancamentos"}
                  </span>
                </div>
                <span className="finance-paid-category-subtotal">
                  {formatPaidCurrencyBr(category.subtotal)}
                </span>
              </header>
              <div className="finance-paid-category-rows">
                {category.rows.map((row) => {
                  const hasActions = Boolean(row.onEdit || row.onDelete);
                  return (
                    <div
                      key={row.id || `${category.key}-${row.date}-${row.description}-${row.valueDisplay}`}
                      className={`finance-paid-row${hasActions ? " finance-paid-row-actions" : ""}`}
                    >
                      <div className="finance-paid-row-date">{row.date}</div>
                      <div className="finance-paid-row-desc">{row.description}</div>
                      <div className="finance-paid-row-value">{row.valueDisplay}</div>
                      {hasActions ? (
                        <div className="finance-row-action">
                          {row.onEdit ? (
                            <button
                              type="button"
                              className="registers-edit-inline"
                              onClick={row.onEdit}
                              aria-label={`Editar ${row.description || "lancamento"}`}
                              title="Editar"
                            >
                              <PencilIcon />
                            </button>
                          ) : null}
                          {row.onDelete ? (
                            <button
                              type="button"
                              className="registers-delete-inline"
                              onClick={row.onDelete}
                              aria-label={`Excluir ${row.description || "lancamento"}`}
                              title="Excluir"
                            >
                              <TrashIcon />
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

        <FinanceDeleteDialog financeData={financeData} />

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
  // Lucro líquido real = receita líquida (já descontada de taxas) menos TODAS as saídas (despesas + comissões)
  const lucroLiquidoReal = salesNet - costsTotal - commissionsTotal;
  const lucroBruto = salesGross - costsTotal - commissionsTotal;
  const enhancedCards = [
    { label: "Faturamento bruto", value: `R$ ${salesGross.toFixed(2).replace(".", ",")}` },
    { label: "Valor perdido em taxas", value: `− R$ ${salesFees.toFixed(2).replace(".", ",")}`, tone: "negative" },
    { label: "Valor líquido recebido", value: `R$ ${salesNet.toFixed(2).replace(".", ",")}`, highlight: true },
    { label: "Despesas variáveis", value: `R$ ${purchasesTotal.toFixed(2).replace(".", ",")}` },
    { label: "Despesas fixas", value: `R$ ${fixedExpensesTotal.toFixed(2).replace(".", ",")}` },
    { label: "Comissões", value: `R$ ${commissionsTotal.toFixed(2).replace(".", ",")}` },
    { label: "Lucro líquido real", value: `R$ ${lucroLiquidoReal.toFixed(2).replace(".", ",")}`, highlight: true, tone: lucroLiquidoReal >= 0 ? "positive" : "negative" },
    { label: "Lançamentos pagos", value: String(paymentCount) },
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
            <div
              key={card.label}
              className={`finance-summary-mini-card${card.highlight ? " finance-summary-mini-card-highlight" : ""}`}
              style={
                card.tone === "negative"
                  ? { color: "#c0392b" }
                  : card.tone === "positive"
                    ? { color: "#067a35" }
                    : undefined
              }
            >
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
          ))}
        </div>

        <div className="finance-summary-grid">
          <section className="finance-chart-card finance-chart-left">
            <h3>Demonstrativo mensal</h3>
            <p className="finance-summary-note">
              O ViaPET trabalha com <strong>dois valores</strong>: bruto (o que foi vendido/lançado) e líquido (o que entra de fato após taxas e custos financeiros).
              Este painel prioriza o líquido para mostrar o lucro real do negócio.
            </p>
            <div className="finance-summary-stats">
              <div className="finance-summary-stat-line">
                <span>Total vendido bruto</span>
                <strong>{`R$ ${salesGross.toFixed(2).replace(".", ",")}`}</strong>
              </div>
              <div className="finance-summary-stat-line" style={{ color: "#c0392b" }}>
                <span>Valor perdido em taxas</span>
                <strong>{`− R$ ${salesFees.toFixed(2).replace(".", ",")}`}</strong>
              </div>
              <div className="finance-summary-stat-line">
                <span>Valor líquido recebido</span>
                <strong>{`R$ ${salesNet.toFixed(2).replace(".", ",")}`}</strong>
              </div>
              <div className="finance-summary-stat-line">
                <span>Total de despesas</span>
                <strong>{`− R$ ${costsTotal.toFixed(2).replace(".", ",")}`}</strong>
              </div>
              <div className="finance-summary-stat-line">
                <span>Despesas fixas</span>
                <strong>{`R$ ${fixedExpensesTotal.toFixed(2).replace(".", ",")}`}</strong>
              </div>
              <div className="finance-summary-stat-line">
                <span>Comissões</span>
                <strong>{`− R$ ${commissionsTotal.toFixed(2).replace(".", ",")}`}</strong>
              </div>
              <div
                className="finance-summary-stat-line finance-summary-stat-line-accent"
                style={{ color: lucroLiquidoReal >= 0 ? "#067a35" : "#c0392b" }}
              >
                <span>Lucro líquido real</span>
                <strong>{`R$ ${lucroLiquidoReal.toFixed(2).replace(".", ",")}`}</strong>
              </div>
              <div className="finance-summary-stat-line" style={{ opacity: 0.7, fontSize: "0.92em" }}>
                <span>(Lucro bruto, sem taxas)</span>
                <strong>{`R$ ${lucroBruto.toFixed(2).replace(".", ",")}`}</strong>
              </div>
            </div>
            <div className="finance-legend finance-legend-spread">
              <div>
                <strong>Diferença bruto × líquido</strong>
                <p>{`R$ ${salesFees.toFixed(2).replace(".", ",")}`}</p>
              </div>
              <div>
                <strong>Vendas no período</strong>
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

        <FinanceDemonstrativoSection
          apiRequest={financeData.apiRequest}
          selectedDate={financeData.selectedDate}
        />
      </div>
    </FinanceShell>
  );
}

function fmtBR(value) {
  const n = Number(value) || 0;
  return n.toFixed(2).replace(".", ",");
}

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

export function FinanceDemonstrativoSection({ apiRequest, selectedDate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const monthRef = (() => {
    const iso = String(selectedDate || "").slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(iso)) {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth() + 1 };
    }
    const [y, m] = iso.split("-");
    return { year: Number(y), month: Number(m) };
  })();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!apiRequest) return;
      setLoading(true);
      setError("");
      try {
        const res = await apiRequest(
          `/finance/monthly-demonstrativo/${monthRef.year}/${monthRef.month}`,
          { method: "GET" },
        );
        if (cancelled) return;
        setData(res?.data || res?.body?.data || null);
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || "Erro ao carregar demonstrativo");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [apiRequest, monthRef.year, monthRef.month]);

  if (!apiRequest) return null;

  return (
    <section className="finance-chart-card" style={{ marginTop: 16 }}>
      <h3>
        Demonstrativo mensal por forma de pagamento — {String(monthRef.month).padStart(2, "0")}/{monthRef.year}
      </h3>
      <p className="finance-summary-note">
        Mostra exatamente quanto entrou bruto, quanto foi perdido em taxas, e o líquido real recebido por cada forma de pagamento.
      </p>

      {loading ? <div>Carregando demonstrativo…</div> : null}
      {error ? <div className="registers-feedback">{error}</div> : null}

      {data ? (
        <>
          <div
            className="finance-summary-cards"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, marginBottom: 12 }}
          >
            <div className="finance-summary-mini-card"><span>Total vendido bruto</span><strong>R$ {fmtBR(data.totals?.totalBruto)}</strong></div>
            <div className="finance-summary-mini-card"><span>Valor perdido em taxas</span><strong>R$ {fmtBR(data.totals?.totalTaxas)}</strong></div>
            <div className="finance-summary-mini-card"><span>Líquido real recebido</span><strong>R$ {fmtBR(data.totals?.totalLiquido)}</strong></div>
            <div className="finance-summary-mini-card"><span>Total de despesas</span><strong>R$ {fmtBR(data.totals?.totalDespesas)}</strong></div>
            <div className="finance-summary-mini-card"><span>Lucro líquido real</span><strong>R$ {fmtBR(data.totals?.lucroLiquidoReal)}</strong></div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 0.6fr 1fr 1fr 1fr 0.7fr",
              gap: 8,
              fontWeight: 600,
              fontSize: 12,
              color: "#555",
              padding: "0 6px 6px",
              borderBottom: "1px solid #e8e8ee",
            }}
          >
            <div>Forma de pagamento</div>
            <div style={{ textAlign: "right" }}>Qtde</div>
            <div style={{ textAlign: "right" }}>Bruto</div>
            <div style={{ textAlign: "right" }}>Taxa</div>
            <div style={{ textAlign: "right" }}>Líquido</div>
            <div style={{ textAlign: "right" }}>% do total</div>
          </div>
          {(data.byMethod || []).map((b) => (
            <div
              key={b.method}
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 0.6fr 1fr 1fr 1fr 0.7fr",
                gap: 8,
                padding: "8px 6px",
                borderBottom: "1px solid #f1f1f5",
                alignItems: "center",
                fontSize: 13,
                opacity: b.bruto === 0 ? 0.5 : 1,
              }}
            >
              <div>{b.label}</div>
              <div style={{ textAlign: "right" }}>{b.count}</div>
              <div style={{ textAlign: "right" }}>R$ {fmtBR(b.bruto)}</div>
              <div style={{ textAlign: "right", color: "#c0392b" }}>− R$ {fmtBR(b.taxa)}</div>
              <div style={{ textAlign: "right", fontWeight: 600 }}>R$ {fmtBR(b.liquido)}</div>
              <div style={{ textAlign: "right" }}>{fmtBR(b.share)}%</div>
            </div>
          ))}
        </>
      ) : null}
    </section>
  );
}

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

const ENTRY_STATUS_OPTIONS = [
  { value: "pending", label: "Pendente" },
  { value: "suggested", label: "Sugestão" },
  { value: "matched", label: "Conciliado" },
  { value: "ignored", label: "Ignorado" },
];

const STATUS_COLORS = {
  pending: { bg: "#fff7e6", color: "#8a5a00" },
  suggested: { bg: "#e6f3ff", color: "#0050c0" },
  matched: { bg: "#e6fff0", color: "#067a35" },
  ignored: { bg: "#f0f0f4", color: "#666" },
};

export function FinanceConciliacaoView({ apiRequest }) {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [statements, setStatements] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedStatementId, setSelectedStatementId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadAccount, setUploadAccount] = useState("");
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [lastImport, setLastImport] = useState(null);

  // Carrega contas + extratos no mount
  useEffect(() => {
    if (!apiRequest) return;
    apiRequest("/bank-accounts", { method: "GET" })
      .then((r) => setBankAccounts(r?.data || []))
      .catch(() => {});
    refreshStatements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshStatements() {
    try {
      const r = await apiRequest("/bank-reconciliation/statements", { method: "GET" });
      setStatements(r?.data || []);
    } catch {}
  }

  async function loadEntries() {
    setLoadingEntries(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatementId) params.set("statementId", selectedStatementId);
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", "200");
      const r = await apiRequest(`/bank-reconciliation/entries?${params.toString()}`, { method: "GET" });
      setEntries(r?.data || []);
    } catch (err) {
      setFeedback(err?.message || "Erro ao carregar lançamentos");
    } finally {
      setLoadingEntries(false);
    }
  }

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatementId, statusFilter]);

  async function handleUpload(e) {
    e.preventDefault();
    if (!uploadFile) {
      setFeedback("Selecione um arquivo CSV, XLSX ou OFX.");
      return;
    }
    setUploading(true);
    setFeedback("");
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      if (uploadAccount) fd.append("bankAccountId", uploadAccount);
      fd.append("autoReconcile", "true");

      const json = await apiRequest("/bank-reconciliation/import", {
        method: "POST",
        body: fd,
      });

      setLastImport(json?.data);
      const r = json?.data?.reconcileResults;
      setFeedback(
        `Importado: ${json?.data?.imported} lançamentos${json?.data?.skippedDuplicates ? ` (${json.data.skippedDuplicates} duplicados ignorados)` : ""}.` +
          (r ? ` Conciliação automática: ${r.auto} conciliados, ${r.suggested} sugestões, ${r.pending} pendentes.` : ""),
      );
      setUploadFile(null);
      refreshStatements();
      loadEntries();
    } catch (err) {
      setFeedback(err?.message || "Erro ao importar extrato");
    } finally {
      setUploading(false);
    }
  }

  async function confirmEntry(entry) {
    try {
      await apiRequest(`/bank-reconciliation/entries/${entry.id}/confirm`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      loadEntries();
    } catch (err) {
      setFeedback(err?.message || "Erro ao confirmar");
    }
  }

  async function ignoreEntry(entry) {
    try {
      await apiRequest(`/bank-reconciliation/entries/${entry.id}/ignore`, { method: "POST" });
      loadEntries();
    } catch (err) {
      setFeedback(err?.message || "Erro ao ignorar");
    }
  }

  async function rematchEntry(entry) {
    try {
      await apiRequest(`/bank-reconciliation/entries/${entry.id}/match`, { method: "POST" });
      loadEntries();
    } catch (err) {
      setFeedback(err?.message || "Erro ao re-conciliar");
    }
  }

  const accountById = useMemo(() => {
    const map = new Map();
    bankAccounts.forEach((a) => map.set(a.id, a));
    return map;
  }, [bankAccounts]);

  return (
    <FinanceShell activeTab="Conciliacao" originValue="Conciliacao">
      <div style={{ padding: "16px 20px", maxWidth: 1200 }}>
        <header style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Conciliação bancária</h2>
          <p style={{ margin: "4px 0 0", color: "#666", fontSize: 13 }}>
            Importe extratos em CSV, Excel ou OFX. O sistema procura matches entre os lançamentos do extrato e despesas/pagamentos pendentes no ViaPET — e dá baixa automaticamente quando há alta confiança (valor + data + nome batendo).
          </p>
        </header>

        {feedback ? <div className="registers-feedback" style={{ marginBottom: 12 }}>{feedback}</div> : null}

        <form
          onSubmit={handleUpload}
          style={{
            background: "#fff",
            border: "1px solid #e8e8ee",
            borderRadius: 10,
            padding: 14,
            marginBottom: 16,
            display: "grid",
            gridTemplateColumns: "1fr 1fr auto",
            gap: 10,
            alignItems: "end",
          }}
        >
          <div className="field-block">
            <label>Arquivo (CSV, XLSX ou OFX)</label>
            <input
              className="field-input"
              type="file"
              accept=".csv,.xlsx,.xls,.ofx"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="field-block">
            <label>Conta bancária (opcional)</label>
            <select
              className="field-input"
              value={uploadAccount}
              onChange={(e) => setUploadAccount(e.target.value)}
            >
              <option value="">Sem conta vinculada</option>
              {bankAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}{a.bank ? ` — ${a.bank}` : ""}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="footer-btn footer-btn-green" disabled={uploading}>
            {uploading ? "Importando…" : "Importar e conciliar"}
          </button>
        </form>

        {/* Filtros */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div className="field-block" style={{ minWidth: 220 }}>
            <label>Extrato</label>
            <select
              className="field-input"
              value={selectedStatementId}
              onChange={(e) => setSelectedStatementId(e.target.value)}
            >
              <option value="">Todos os extratos</option>
              {statements.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fileName || s.sourceType} ({s.totalEntries} lanç. — {new Date(s.createdAt).toLocaleDateString("pt-BR")})
                </option>
              ))}
            </select>
          </div>
          <div className="field-block" style={{ minWidth: 160 }}>
            <label>Status</label>
            <select
              className="field-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos</option>
              {ENTRY_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <button type="button" className="soft-chip" onClick={loadEntries}>Atualizar</button>
        </div>

        {/* Tabela de entries */}
        {loadingEntries ? <div>Carregando lançamentos…</div> : (
          entries.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#888" }}>
              Nenhum lançamento encontrado.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 6 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "90px 80px 110px 1.6fr 1fr 110px 220px",
                  gap: 8,
                  fontWeight: 600,
                  fontSize: 11,
                  color: "#555",
                  padding: "0 6px",
                  textTransform: "uppercase",
                }}
              >
                <div>Data</div>
                <div>Tipo</div>
                <div style={{ textAlign: "right" }}>Valor</div>
                <div>Descrição</div>
                <div>Pagador</div>
                <div>Status</div>
                <div>Ações</div>
              </div>
              {entries.map((entry) => {
                const acc = entry.bankAccountId ? accountById.get(entry.bankAccountId) : null;
                const colors = STATUS_COLORS[entry.matchStatus] || STATUS_COLORS.pending;
                return (
                  <div
                    key={entry.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "90px 80px 110px 1.6fr 1fr 110px 220px",
                      gap: 8,
                      alignItems: "center",
                      background: "#fff",
                      border: "1px solid #e8e8ee",
                      borderRadius: 8,
                      padding: 8,
                      fontSize: 13,
                    }}
                  >
                    <div>{new Date(entry.entryDate).toLocaleDateString("pt-BR")}</div>
                    <div style={{ color: entry.direction === "credit" ? "#067a35" : "#c0392b", fontWeight: 600 }}>
                      {entry.direction === "credit" ? "Entrada" : "Saída"}
                    </div>
                    <div style={{ textAlign: "right", fontWeight: 600 }}>
                      R$ {fmtBR(entry.amount)}
                    </div>
                    <div style={{ fontSize: 12 }}>
                      <div>{entry.description || "—"}</div>
                      {entry.paymentMethodHint ? (
                        <div style={{ color: "#888", fontSize: 11 }}>{entry.paymentMethodHint}</div>
                      ) : null}
                      {acc ? (
                        <div style={{ color: "#888", fontSize: 11 }}>→ {acc.name}</div>
                      ) : null}
                    </div>
                    <div style={{ fontSize: 12 }}>
                      <div>{entry.payerName || "—"}</div>
                      {entry.payerDocument ? (
                        <div style={{ color: "#888", fontSize: 11 }}>{entry.payerDocument}</div>
                      ) : null}
                    </div>
                    <div>
                      <span
                        style={{
                          background: colors.bg,
                          color: colors.color,
                          padding: "3px 8px",
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {ENTRY_STATUS_OPTIONS.find((o) => o.value === entry.matchStatus)?.label || entry.matchStatus}
                      </span>
                      {entry.matchConfidence != null ? (
                        <span style={{ marginLeft: 6, fontSize: 11, color: "#888" }}>
                          {Math.round(Number(entry.matchConfidence) * 100)}%
                        </span>
                      ) : null}
                    </div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {entry.matchStatus === "suggested" ? (
                        <>
                          <button type="button" className="soft-chip active" onClick={() => confirmEntry(entry)} style={{ fontSize: 11 }}>
                            Aceitar
                          </button>
                          <button type="button" className="soft-chip" onClick={() => ignoreEntry(entry)} style={{ fontSize: 11 }}>
                            Ignorar
                          </button>
                        </>
                      ) : entry.matchStatus === "pending" ? (
                        <>
                          <button type="button" className="soft-chip" onClick={() => rematchEntry(entry)} style={{ fontSize: 11 }}>
                            Buscar match
                          </button>
                          <button type="button" className="soft-chip" onClick={() => ignoreEntry(entry)} style={{ fontSize: 11 }}>
                            Ignorar
                          </button>
                        </>
                      ) : entry.matchStatus === "matched" ? (
                        <span style={{ fontSize: 11, color: "#067a35" }}>✓ Baixa aplicada</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {lastImport ? (
          <details style={{ marginTop: 24, fontSize: 12, color: "#888" }}>
            <summary>Detalhes da última importação</summary>
            <pre style={{ background: "#f8f8fa", padding: 10, borderRadius: 6, overflow: "auto" }}>
              {JSON.stringify(lastImport, null, 2)}
            </pre>
          </details>
        ) : null}
      </div>
    </FinanceShell>
  );
}

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
