import { NavLink } from "react-router-dom";
import { EditableField } from "../../../components/fields.jsx";
import { FinanceShell } from "../FinanceShell.jsx";
import { downloadRowsAsExcel } from "../../../utils/exportExcel.js";
import { FinanceDeleteDialog, PencilIcon, TrashIcon } from "../_shared.jsx";

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
