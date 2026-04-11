import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

function isFinanceDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());
}

function getTodayFinanceDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function FinanceShell({ activeTab, children, originValue = "Vendas", onPrint, onExport }) {
  const location = useLocation();
  const navigate = useNavigate();
  const financeTabs = useMemo(
    () => ["Vendas", "Compras", "Pagamentos", "Comissoes", "Resumo", "Despesas fixas"],
    [],
  );
  const financeTabPaths = {
    Vendas: "/financeiro",
    Compras: "/financeiro/compras",
    "Despesas fixas": "/financeiro/despesas-fixas",
    Pagamentos: "/financeiro/pagamentos",
    Comissoes: "/financeiro/comissoes",
    Resumo: "/financeiro/resumo",
  };
  const searchParams = new URLSearchParams(location.search);
  const selectedDate = isFinanceDateString(searchParams.get("date"))
    ? searchParams.get("date")
    : getTodayFinanceDate();
  const period = searchParams.get("period") || "dia";
  const origin = searchParams.get("origin") || originValue;
  const vendor = searchParams.get("vendor") || "";
  const productService = searchParams.get("productService") || "";
  const petPerson = searchParams.get("petPerson") || "";
  const typeOnly = searchParams.get("type") === "1";
  const [visibleMonth, setVisibleMonth] = useState(`${selectedDate.slice(0, 7)}-01`);
  const shouldLockOriginToTab = activeTab && activeTab !== "Resumo";

  useEffect(() => {
    setVisibleMonth(`${selectedDate.slice(0, 7)}-01`);
  }, [selectedDate]);

  useEffect(() => {
    if (!shouldLockOriginToTab) {
      return;
    }

    if (String(origin || "").trim() === String(activeTab || "").trim()) {
      return;
    }

    const params = new URLSearchParams(location.search);
    params.set("origin", activeTab);
    navigate(`${location.pathname}${params.toString() ? `?${params.toString()}` : ""}`, { replace: true });
  }, [activeTab, location.pathname, location.search, navigate, origin, shouldLockOriginToTab]);

  const visibleCalendarDate = new Date(`${visibleMonth}T12:00:00`);
  const visibleYear = visibleCalendarDate.getFullYear();
  const visibleMonthIndex = visibleCalendarDate.getMonth();
  const visibleCalendarMonth = {
    key: `${visibleYear}-${String(visibleMonthIndex + 1).padStart(2, "0")}`,
    label: new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(visibleCalendarDate),
    year: visibleYear,
    monthIndex: visibleMonthIndex,
    totalDays: new Date(visibleYear, visibleMonthIndex + 1, 0).getDate(),
    leadingBlanks: visibleCalendarDate.getDay(),
  };
  const today = getTodayFinanceDate();

  function updateParam(key, value) {
    const params = new URLSearchParams(location.search);
    if (value === "" || value == null || value === false) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
    navigate(`${location.pathname}${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function buildFinanceTabHref(tab) {
    const params = new URLSearchParams(location.search);
    if (tab && tab !== "Resumo") {
      params.set("origin", tab);
    }
    return `${financeTabPaths[tab] || "/financeiro"}${params.toString() ? `?${params.toString()}` : ""}`;
  }

  function handleOriginChange(nextOrigin) {
    const normalizedOrigin = String(nextOrigin || "").trim();
    if (financeTabPaths[normalizedOrigin]) {
      navigate(buildFinanceTabHref(normalizedOrigin));
      return;
    }
    updateParam("origin", normalizedOrigin);
  }

  function moveFinanceCalendarMonth(direction) {
    const nextBase = new Date(visibleYear, visibleMonthIndex + direction, 1);
    setVisibleMonth(`${nextBase.getFullYear()}-${String(nextBase.getMonth() + 1).padStart(2, "0")}-01`);
  }

  function selectFinanceCalendarDate(nextDate) {
    updateParam("date", nextDate);
    setVisibleMonth(`${nextDate.slice(0, 7)}-01`);
  }

  function resetFinanceCalendarToToday() {
    updateParam("date", today);
    setVisibleMonth(`${today.slice(0, 7)}-01`);
  }

  return (
    <div className="agenda-layout">
      <aside className="left-panel">
        <div className="panel-header finance-panel-header">
          <strong>Financeiro</strong>
        </div>
        <div className="panel-body">
          <div className="calendar-header">
            <button type="button" className="calendar-nav-btn" onClick={() => moveFinanceCalendarMonth(-1)}>
              {"<"}
            </button>
            <span className="calendar-header-main">{visibleCalendarMonth.label} {visibleCalendarMonth.year}</span>
            <button type="button" className="calendar-nav-btn" onClick={() => moveFinanceCalendarMonth(1)}>
              {">"}
            </button>
            <button type="button" className="calendar-today-btn" onClick={resetFinanceCalendarToToday}>
              Hoje
            </button>
          </div>
          <div className="calendar-month-block">
            <div className="calendar-grid">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
                <div key={`${visibleCalendarMonth.key}-${day}`} className="weekday">
                  {day}
                </div>
              ))}
              {Array.from({ length: visibleCalendarMonth.leadingBlanks }, (_, index) => (
                <div key={`${visibleCalendarMonth.key}-blank-${index}`} className="day day-empty" />
              ))}
              {Array.from({ length: visibleCalendarMonth.totalDays }, (_, index) => {
                const day = index + 1;
                const monthDate = `${visibleCalendarMonth.year}-${String(visibleCalendarMonth.monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isSelected = monthDate === selectedDate;
                const isToday = monthDate === today;
                const dayClassName = ["day", isSelected ? "day-active" : "", isToday ? "day-today" : ""]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <button
                    key={`${visibleCalendarMonth.key}-${day}`}
                    type="button"
                    className={dayClassName}
                    onClick={() => selectFinanceCalendarDate(monthDate)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
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
              <select className="field-input" value={origin} onChange={(event) => handleOriginChange(event.target.value)}>
                <option value="Vendas">Vendas</option>
                <option value="Compras">Compras</option>
                <option value="Despesas fixas">Despesas fixas</option>
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
          {financeTabs.map((tab) => (
            <NavLink
              key={tab}
              to={buildFinanceTabHref(tab)}
              className={[
                "tab",
                tab === activeTab ? "active" : "",
                tab === "Despesas fixas" ? "finance-tab-fixed-expenses" : "",
              ]
                .filter(Boolean)
                .join(" ")}
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
