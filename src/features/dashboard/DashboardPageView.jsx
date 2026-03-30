import { NavLink } from "react-router-dom";
import { dashboardQuickTiles } from "../../data/mockAgenda.js";

export function DashboardPageView({
  displayName,
  saldoLabel,
  feedback,
  birthdayRows,
  payablesRows,
  cashValue,
  cashStatusLabel,
  cashFeedback,
  onCashValueChange,
  onOpenCash,
  onCloseCash,
  onNewPet,
  onNewPerson,
  onPayableClick,
  onTileClick,
  isTileVisible,
  resolveTileRoute,
}) {
  const tileOrder = [
    "Agenda",
    "Cadastros",
    "Financeiro",
    "Exames",
    "Fila",
    "Pesquisa",
    "Venda (PDV)",
    "SuperVet",
    "Mensagens",
    "Internacao",
    "Configurar",
    "Sair",
  ];

  const orderedTiles = [...dashboardQuickTiles]
    .filter((tile) => (isTileVisible ? isTileVisible(tile.title) : true))
    .sort((left, right) => {
    const leftIndex = tileOrder.indexOf(left.title);
    const rightIndex = tileOrder.indexOf(right.title);
    return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
  });

  return (
    <div className="page-grid dashboard-page">
      <section className="dashboard-stage">
        <div className="dashboard-left-zone">
          <div className="welcome-block dashboard-welcome">
            <h1 className="hero-title">Boa tarde, {displayName}!</h1>
          </div>

          <div className="dashboard-entry-row">
            <div className="dashboard-action-stack">
              <button className="dashboard-cta-card dashboard-cta-button" onClick={onNewPet}>
                <strong>Novo Pet</strong>
                <span>Cadastro rapido</span>
              </button>
              <button className="dashboard-cta-card secondary dashboard-cta-button" onClick={onNewPerson}>
                <strong>Novo Responsavel</strong>
                <span>Cadastro rapido</span>
              </button>
            </div>
          </div>

          <div className="dashboard-lower-left">
            <div className="dashboard-cash-card">
              <div className="dashboard-cash-head">
                <div>
                  <span className="section-kicker">Caixa</span>
                  <h2>{cashStatusLabel}</h2>
                </div>
                <strong className="dashboard-cash-fixed">{cashValue || "0,00"}</strong>
              </div>

              <div className="dashboard-cash-inline">
                <label className="dashboard-cash-label" htmlFor="dashboard-cash-value">
                  Valor
                </label>
                <input
                  id="dashboard-cash-value"
                  className="dashboard-cash-input"
                  type="text"
                  value={cashValue}
                  onChange={(event) => onCashValueChange(event.target.value)}
                  placeholder="0,00"
                />
              </div>

              <div className="dashboard-cash-actions">
                <button className="dashboard-cash-btn dashboard-cash-btn-open" type="button" onClick={onOpenCash}>
                  Abertura
                </button>
                <button className="dashboard-cash-btn dashboard-cash-btn-close" type="button" onClick={onCloseCash}>
                  Fechamento
                </button>
              </div>

              {cashFeedback ? <div className="dashboard-cash-feedback">{cashFeedback}</div> : null}
            </div>
          </div>
        </div>

        <div className="dashboard-center-zone">
          <div className="dashboard-birthday-panel">
            <div className="section-head dashboard-inline-head">
              <div>
                <span className="section-kicker">Aniversariantes</span>
                <h2>Todos do dia</h2>
              </div>
            </div>

            {feedback ? <div className="registers-feedback search-feedback">{feedback}</div> : null}

            <div className="birthday-board birthday-board-list">
              {birthdayRows.length ? (
                birthdayRows.map((entry) => (
                  <article key={`${entry.type}-${entry.name}`} className={`birthday-card birthday-row birthday-${entry.tone}`}>
                    <div className="birthday-row-main">
                      <div className="birthday-type">{entry.type}</div>
                      <div className="birthday-text">
                        <strong>{entry.name}</strong>
                        <p>{entry.owner}</p>
                      </div>
                      <span className="birthday-when">{entry.when}</span>
                    </div>
                    <a
                      className="birthday-whatsapp"
                      href={`https://wa.me/${String(entry.phone || "5511994167999").replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={entry.whatsappLabel || "WhatsApp"}
                    >
                      WhatsApp
                    </a>
                  </article>
                ))
              ) : (
                <div className="registers-row">Nenhum aniversariante hoje.</div>
              )}
            </div>
          </div>

          <div className="dashboard-payables-card">
            <div className="payables-panel">
              <div className="payables-head">
                <div>
                  <span className="section-kicker">Contas a pagar</span>
                  <h2>Financeiro do dia</h2>
                </div>
                <span className="chip chip-warn">{payablesRows.length} contas</span>
              </div>
              <div className="dashboard-payables-balance">{saldoLabel}</div>

              <div className="payables-list">
                {payablesRows.length ? (
                  payablesRows.map((item) => (
                    <button key={`${item.title}-${item.due}`} className="payable-card payable-card-button" onClick={onPayableClick}>
                      <div>
                        <strong>{item.title}</strong>
                        <p>Vencimento {item.due}</p>
                      </div>
                      <div className="payable-side">
                        <span>{item.amount}</span>
                        <small>{item.status}</small>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="registers-row">Nenhuma conta pendente no momento.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-right-zone">
          <div className="dashboard-tiles dashboard-tiles-stage">
            {orderedTiles.map((tile) => (
              resolveTileRoute?.(tile.title) ? (
                <NavLink
                  key={tile.title}
                  to={resolveTileRoute(tile.title)}
                  className={`quick-tile quick-tile-button ${tile.tone} ${tile.size === "sm" ? "quick-tile-sm" : ""}`}
                  onClick={() => onTileClick(tile.title)}
                >
                  <strong>{tile.title === "SuperVet" ? "ViaCentral" : tile.title}</strong>
                </NavLink>
              ) : (
                <button
                  key={tile.title}
                  className={`quick-tile quick-tile-button ${tile.tone} ${tile.size === "sm" ? "quick-tile-sm" : ""}`}
                  onClick={() => onTileClick(tile.title)}
                >
                  <strong>{tile.title === "SuperVet" ? "ViaCentral" : tile.title}</strong>
                </button>
              )
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
