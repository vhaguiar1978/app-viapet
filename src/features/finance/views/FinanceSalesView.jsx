import { FinanceShell } from "../FinanceShell.jsx";
import { downloadRowsAsExcel } from "../../../utils/exportExcel.js";
import { FinanceDeleteDialog, TrashIcon, printSalesReport } from "../_shared.jsx";

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
