import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { financeSummary } from "../../data/mockAgenda.js";

export function FinanceShell({ activeTab, children, originValue = "Vendas", onPrint, onExport }) {
  const location = useLocation();
  const navigate = useNavigate();
  const financeTabPaths = {
    Vendas: "/financeiro",
    Compras: "/financeiro/compras",
    Pagamentos: "/financeiro/pagamentos",
    Comissoes: "/financeiro/comissoes",
    Resumo: "/financeiro/resumo",
  };
  const searchParams = new URLSearchParams(location.search);
  const period = searchParams.get("period") || "dia";
  const origin = searchParams.get("origin") || originValue;
  const vendor = searchParams.get("vendor") || "";
  const productService = searchParams.get("productService") || "";
  const petPerson = searchParams.get("petPerson") || "";
  const typeOnly = searchParams.get("type") === "1";

  function updateParam(key, value) {
    const params = new URLSearchParams(location.search);
    if (value === "" || value == null || value === false) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
    navigate(`${location.pathname}${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="agenda-layout">
      <aside className="left-panel">
        <div className="panel-header finance-panel-header">
          <strong>Financeiro</strong>
        </div>
        <div className="panel-body">
          <div className="calendar-header">
            <span>Marco</span>
            <span>2026</span>
            <span>Hoje</span>
          </div>
          <div className="calendar-grid">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
              <div key={day} className="weekday">
                {day}
              </div>
            ))}
            {Array.from({ length: 31 }, (_, index) => {
              const day = index + 1;
              return (
                <div key={day} className={day === 26 ? "day day-active" : "day"}>
                  {day}
                </div>
              );
            })}
          </div>

          <div className="filters">
            <h3>Filtros</h3>
            <div className="radio-line">
              <button type="button" className={period === "dia" ? "soft-chip active" : "soft-chip"} onClick={() => updateParam("period", "dia")}>
                Dia
              </button>
              <button type="button" className={period === "mes" ? "soft-chip active" : "soft-chip"} onClick={() => updateParam("period", "mes")}>
                Mes
              </button>
              <button type="button" className={period === "faixa" ? "soft-chip active" : "soft-chip"} onClick={() => updateParam("period", "faixa")}>
                Faixa
              </button>
            </div>
            <div className="field-block">
              <label>Origem</label>
              <select className="field-input" value={origin} onChange={(event) => updateParam("origin", event.target.value)}>
                <option value="Vendas">Vendas</option>
                <option value="Compras">Compras</option>
                <option value="Pagamentos">Pagamentos</option>
                <option value="Comissoes">Comissoes</option>
              </select>
            </div>
            <div className="field-block">
              <label>Vendedor</label>
              <input className="field-input" value={vendor} onChange={(event) => updateParam("vendor", event.target.value)} />
            </div>
            <div className="finance-filter-row">
              <div className="finance-filter-grow">
                <div className="field-block">
                  <label>Produto/Servico</label>
                  <input className="field-input" value={productService} onChange={(event) => updateParam("productService", event.target.value)} />
                </div>
              </div>
              <label className="product-inline-check finance-type-check">
                <input type="checkbox" checked={typeOnly} onChange={(event) => updateParam("type", event.target.checked ? "1" : "")} />
                <span>Tipo</span>
              </label>
            </div>
            <div className="field-block">
              <label>Pet/Pessoa</label>
              <input className="field-input" value={petPerson} onChange={(event) => updateParam("petPerson", event.target.value)} />
            </div>
          </div>
        </div>
      </aside>

      <main className="center-panel">
        <div className="tabbar">
          {financeSummary.tabs.map((tab) => (
            <NavLink
              key={tab}
              to={`${financeTabPaths[tab] || "/financeiro"}${location.search || ""}`}
              className={tab === activeTab ? "tab active" : "tab"}
            >
              {tab}
            </NavLink>
          ))}
        </div>
        {children}
      </main>
    </div>
  );
}
