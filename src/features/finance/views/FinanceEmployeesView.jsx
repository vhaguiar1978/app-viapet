import { NavLink } from "react-router-dom";
import { EditableField } from "../../../components/fields.jsx";
import { FinanceShell } from "../FinanceShell.jsx";
import { downloadRowsAsExcel } from "../../../utils/exportExcel.js";
import { FinanceDeleteDialog, PencilIcon, TrashIcon } from "../_shared.jsx";

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
        <section className="employee-invite-panel">
          <div><span className="employee-invite-kicker">ACESSO À SUA LOJA</span><h2>Convide um vendedor</h2><p>Ele preenche o cadastro e cria a própria senha. O acesso fica vinculado à sua empresa.</p></div>
          <form onSubmit={financeData.onCreateEmployeeInvitation}>
            <label>Nome do vendedor<input required value={financeData.employeeInvite.name} onChange={e=>financeData.setEmployeeInvite(current=>({...current,name:e.target.value}))}/></label>
            <label>E-mail do vendedor<input required type="email" value={financeData.employeeInvite.email} onChange={e=>financeData.setEmployeeInvite(current=>({...current,email:e.target.value}))}/></label>
            <button type="submit" disabled={financeData.employeeInvite.loading}>{financeData.employeeInvite.loading?"Gerando link...":"Gerar link de cadastro"}</button>
          </form>
          {financeData.employeeInvite.link&&<div className="employee-invite-link"><input aria-label="Link de cadastro do vendedor" readOnly value={financeData.employeeInvite.link}/><button type="button" onClick={financeData.onCopyEmployeeInvitation}>Copiar link</button><a target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`Olá ${financeData.employeeInvite.name}, faça seu cadastro para acessar a loja: ${financeData.employeeInvite.link}`)}`}>Enviar pelo WhatsApp</a><small>O link vale por 7 dias e só pode ser usado uma vez.</small></div>}
          {financeData.employeeInvite.feedback&&<div className="employee-invite-feedback" role="status">{financeData.employeeInvite.feedback}</div>}
        </section>
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
