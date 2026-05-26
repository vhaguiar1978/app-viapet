import { EditableField } from "../../../components/fields.jsx";
import { FinanceShell } from "../FinanceShell.jsx";
import { downloadRowsAsExcel } from "../../../utils/exportExcel.js";
import { FinanceDeleteDialog, FinanceFixedExpenseModal, PencilIcon, TrashIcon } from "../_shared.jsx";

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
