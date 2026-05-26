import { FinanceShell } from "../FinanceShell.jsx";
import { downloadRowsAsExcel } from "../../../utils/exportExcel.js";
import { FinanceDeleteDialog, TrashIcon } from "../_shared.jsx";

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
