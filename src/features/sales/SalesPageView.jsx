import { EditableField, EditableSearchSelectField, EditableSelectField, EditableTextArea } from "../../components/fields.jsx";

export function SalesPageView({
  financeData,
  activeModal,
  salesHistoryClient,
  customerFilter,
  feedback,
  isSubmitting,
  customerOptions,
  productOptions,
  saleForm,
  paymentForm,
  setActiveModal,
  setSaleForm,
  setPaymentForm,
  handleProductChange,
  handleSaleSubmit,
  handlePaymentSubmit,
  handleCloseCash,
  closeModal,
  openSalesHistory,
  closeSalesHistory,
  rows,
  saleBreakdown,
  paymentBreakdown,
}) {
  return (
    <div className="sales-main-layout">
      <div className="sales-titlebar">
        <strong>PDV</strong>
      </div>

      <div className="sales-date-box">
        <small>Data</small>
        <span>26.03.2026</span>
      </div>

      <section className="sales-board">
        <div className="sales-toolbar">
          <div className="toolbar-group">
            <button className="soft-btn" onClick={() => setActiveModal("sale")}>Venda</button>
            <button className="soft-btn" onClick={() => setActiveModal("payment")}>Pagamento</button>
            <button className="soft-btn" onClick={() => setActiveModal("close")}>Fechar Caixa</button>
            <span className="sales-warning">Caixa aberto em 25.09.2020</span>
          </div>
          <div className="toolbar-group">
            <div className="soft-counter finance-total-chip">{financeData.paymentsTotals} | {financeData.salesTotal}</div>
          </div>
        </div>

        {financeData.feedback ? <div className="registers-feedback">{financeData.feedback}</div> : null}
        {feedback ? <div className="registers-feedback">{feedback}</div> : null}
        {customerFilter ? <div className="registers-feedback">Historico filtrado para: {customerFilter}</div> : null}

        <div className="sales-head">
          <div>Clientes</div>
          <div>Descrição</div>
          <div>Valor</div>
        </div>

        <div className="sales-body">
          {financeData.loading ? <div className="registers-row">Carregando vendas...</div> : null}
          {!financeData.loading && rows.map((row) => (
            <div key={row.badge} className="sales-row">
              <div className="sales-client">
                <span>{row.clientTop}</span>
                <strong>{row.clientBottom}</strong>
                <button type="button" className="queue-search-icon sales-history-btn" onClick={() => openSalesHistory(row)} title={`Histórico de ${row.customer || row.clientTop || "cliente"}`}>
                  🔍
                </button>
              </div>
              <div className="sales-desc">
                <span className="badge badge-orange">{row.badge}</span>
                <div className="payment-lines">
                  {row.lines.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
              </div>
              <div className="sales-value">{row.value}</div>
            </div>
          ))}
        </div>
      </section>

      {activeModal === "sale" ? (
        <div className="finance-modal-overlay">
          <form className="finance-form-card finance-form-modal" onSubmit={handleSaleSubmit}>
            <div className="patient-form-head">
              <div>
                <span className="section-kicker">PDV</span>
                <h2>Nova venda</h2>
              </div>
            </div>

            <div className="patient-grid finance-form-grid">
              <EditableSelectField label="Clientes" value={saleForm.customerId} onChange={(value) => setSaleForm((current) => ({ ...current, customerId: value }))} options={customerOptions} />
              <EditableSearchSelectField
                label="Produto"
                value={saleForm.productId}
                onChange={handleProductChange}
                options={productOptions}
                placeholder="Digite o nome do item"
              />
            </div>

            <div className="patient-grid finance-form-grid">
              <EditableField label="Quantidade" value={saleForm.quantity} onChange={(value) => setSaleForm((current) => ({ ...current, quantity: value }))} />
              <EditableField label="Valor" value={saleForm.price} onChange={(value) => setSaleForm((current) => ({ ...current, price: value }))} />
            </div>

            <div className="patient-grid finance-form-grid">
              <EditableSelectField
                label="Meio de pagamento"
                value={saleForm.paymentMethod}
                onChange={(value) => setSaleForm((current) => ({ ...current, paymentMethod: value }))}
                options={[
                  { value: "pix", label: "Pix" },
                  { value: "pix pela maquina", label: "Pix pela maquina" },
                  { value: "dinheiro", label: "Dinheiro" },
                  { value: "debito", label: "Debito" },
                  { value: "credito", label: "Credito" },
                  { value: "credito parcelado", label: "Credito parcelado" },
                  { value: "transferencia", label: "Transferencia" },
                ]}
              />
            </div>

            <div className="finance-summary-cards">
              <div className="finance-summary-mini-card">
                <span>Valor cheio</span>
                <strong>R$ {saleBreakdown.grossDisplay}</strong>
              </div>
              <div className="finance-summary-mini-card">
                <span>Taxa</span>
                <strong>R$ {saleBreakdown.feeDisplay}</strong>
              </div>
              <div className="finance-summary-mini-card finance-summary-mini-card-highlight">
                <span>Valor líquido</span>
                <strong>R$ {saleBreakdown.netDisplay}</strong>
              </div>
            </div>

            <EditableTextArea label="Observação" value={saleForm.observation} onChange={(value) => setSaleForm((current) => ({ ...current, observation: value }))} />

            <div className="patient-form-footer patient-form-footer-right">
              <div className="patient-form-actions">
                <button type="submit" className="footer-btn footer-btn-green" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </button>
                <button type="button" className="footer-btn patient-cancel-btn" onClick={closeModal}>
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}

      {activeModal === "payment" ? (
        <div className="finance-modal-overlay">
          <form className="finance-form-card finance-form-modal" onSubmit={handlePaymentSubmit}>
            <div className="patient-form-head">
              <div>
                <span className="section-kicker">PDV</span>
                <h2>Pagamento</h2>
              </div>
            </div>

            <div className="patient-grid finance-form-grid">
              <EditableField label="Data" value={paymentForm.date} onChange={(value) => setPaymentForm((current) => ({ ...current, date: value }))} />
              <EditableField label="Valor" value={paymentForm.value} onChange={(value) => setPaymentForm((current) => ({ ...current, value }))} />
            </div>

            <div className="patient-grid finance-form-grid">
              <EditableSelectField
                label="Meio de pagamento"
                value={paymentForm.paymentMethod}
                onChange={(value) => setPaymentForm((current) => ({ ...current, paymentMethod: value }))}
                options={[
                  { value: "pix", label: "Pix" },
                  { value: "pix pela maquina", label: "Pix pela maquina" },
                  { value: "dinheiro", label: "Dinheiro" },
                  { value: "debito", label: "Debito" },
                  { value: "credito", label: "Credito" },
                  { value: "credito parcelado", label: "Credito parcelado" },
                  { value: "transferencia", label: "Transferencia" },
                ]}
              />
            </div>

            <div className="finance-summary-cards">
              <div className="finance-summary-mini-card">
                <span>Valor cheio</span>
                <strong>R$ {paymentBreakdown.grossDisplay}</strong>
              </div>
              <div className="finance-summary-mini-card">
                <span>Taxa</span>
                <strong>R$ {paymentBreakdown.feeDisplay}</strong>
              </div>
              <div className="finance-summary-mini-card finance-summary-mini-card-highlight">
                <span>Valor líquido</span>
                <strong>R$ {paymentBreakdown.netDisplay}</strong>
              </div>
            </div>

            <EditableTextArea label="Descrição" value={paymentForm.description} onChange={(value) => setPaymentForm((current) => ({ ...current, description: value }))} />

            <div className="patient-form-footer patient-form-footer-right">
              <div className="patient-form-actions">
                <button type="submit" className="footer-btn footer-btn-green" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </button>
                <button type="button" className="footer-btn patient-cancel-btn" onClick={closeModal}>
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}

      {activeModal === "close" ? (
        <div className="finance-modal-overlay">
          <div className="finance-form-card finance-form-modal">
            <div className="patient-form-head">
              <div>
                <span className="section-kicker">PDV</span>
                <h2>Fechar caixa</h2>
              </div>
            </div>

            <div className="finance-summary-cards">
              <div className="finance-summary-mini-card">
                <span>Vendas</span>
                <strong>{financeData.salesTotal}</strong>
              </div>
              <div className="finance-summary-mini-card">
                <span>Pagamentos</span>
                <strong>{financeData.paymentsTotals}</strong>
              </div>
            </div>

            <p className="finance-summary-note">O fluxo de fechamento fica pronto para confirmação agora e depois podemos ligar ao endpoint específico de caixa.</p>

            <div className="patient-form-footer patient-form-footer-right">
              <div className="patient-form-actions">
                <button type="button" className="footer-btn footer-btn-green" onClick={handleCloseCash} disabled={isSubmitting}>
                  {isSubmitting ? "Fechando..." : "Confirmar"}
                </button>
                <button type="button" className="footer-btn patient-cancel-btn" onClick={closeModal}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {salesHistoryClient ? (
        <div className="finance-modal-overlay" onClick={closeSalesHistory}>
          <div className="finance-form-card finance-form-modal sales-history-modal" onClick={(event) => event.stopPropagation()}>
            <div className="patient-form-head">
              <div>
                <span className="section-kicker">PDV</span>
                <h2>Histórico do cliente</h2>
                <p>{salesHistoryClient.customerName || "Cliente"}</p>
              </div>
            </div>

            <div className="finance-summary-cards sales-history-summary">
              <div className="finance-summary-mini-card">
                <span>Telefone</span>
                <strong>{salesHistoryClient.phone || "Não informado"}</strong>
              </div>
              <div className="finance-summary-mini-card">
                <span>Última compra</span>
                <strong>{salesHistoryClient.latestPurchaseDate || "Sem registro"}</strong>
              </div>
              <div className="finance-summary-mini-card">
                <span>Total gasto no período</span>
                <strong>R$ {Number(salesHistoryClient.totalSpent || 0).toFixed(2).replace(".", ",")}</strong>
              </div>
              <div className={`finance-summary-mini-card ${Number(salesHistoryClient.outstandingAmount || 0) > 0 ? "sales-history-debt-card" : ""}`}>
                <span>Débito em aberto</span>
                <strong>
                  {Number(salesHistoryClient.outstandingAmount || 0) > 0
                    ? `R$ ${Number(salesHistoryClient.outstandingAmount || 0).toFixed(2).replace(".", ",")}`
                    : "Sem débito"}
                </strong>
              </div>
            </div>

            <div className="sales-history-list">
              {salesHistoryClient.rows.map((row) => (
                <div key={`${row.badge}-${row.date}`} className="sales-history-entry">
                  <div className="sales-history-entry-head">
                    <strong>{row.sale || row.badge}</strong>
                    <span>{row.date}</span>
                  </div>
                  <div className="payment-lines">
                    {row.lines.map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </div>
                  <div className="sales-history-entry-value">{row.value}</div>
                </div>
              ))}
              {!salesHistoryClient.rows.length ? <div className="search-empty-state">Nenhum histórico encontrado para este cliente.</div> : null}
            </div>

            <div className="patient-form-footer patient-form-footer-right">
              <div className="patient-form-actions">
                <button type="button" className="footer-btn patient-cancel-btn" onClick={closeSalesHistory}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
