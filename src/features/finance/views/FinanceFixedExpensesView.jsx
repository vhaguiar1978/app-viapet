import { NavLink } from "react-router-dom";
import { FinanceShell } from "../FinanceShell.jsx";
import { downloadRowsAsExcel } from "../../../utils/exportExcel.js";
import { FinanceDeleteDialog, FinanceFixedExpenseModal, PencilIcon, TrashIcon } from "../_shared.jsx";

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
