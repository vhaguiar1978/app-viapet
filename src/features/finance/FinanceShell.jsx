import { useEffect, useMemo, useRef, useState } from "react";
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
    () => ["Vendas", "Despesas", "Despesas Pessoais", "Despesas Fixas", "Funcionarios", "Free lance", "Pagamentos", "Comissoes", "Resumo"],
    [],
  );
  const financeTabPaths = {
    Vendas: "/financeiro",
    Despesas: "/financeiro/despesas",
    "Despesas Pessoais": "/financeiro/despesas-pessoais",
    Funcionarios: "/financeiro/funcionarios",
    "Free lance": "/financeiro/free-lance",
    "Despesas Fixas": "/financeiro/despesas-fixas",
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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tabbarRef = useRef(null);
  const shouldLockOriginToTab = activeTab && activeTab !== "Resumo";

  useEffect(() => {
    setVisibleMonth(`${selectedDate.slice(0, 7)}-01`);
  }, [selectedDate]);

  useEffect(() => {
    function checkTabScroll() {
      const el = tabbarRef.current;
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 2);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    }
    checkTabScroll();
    const el = tabbarRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkTabScroll);
    window.addEventListener("resize", checkTabScroll);
    return () => {
      el.removeEventListener("scroll", checkTabScroll);
      window.removeEventListener("resize", checkTabScroll);
    };
  }, []);

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

  let visibleCalendarDate, visibleYear, visibleMonthIndex, visibleCalendarMonth;

  try {
    visibleCalendarDate = new Date(`${visibleMonth}T12:00:00`);
    if (isNaN(visibleCalendarDate.getTime())) {
      throw new Error("Invalid date");
    }
    visibleYear = visibleCalendarDate.getFullYear();
    visibleMonthIndex = visibleCalendarDate.getMonth();
    visibleCalendarMonth = {
      key: `${visibleYear}-${String(visibleMonthIndex + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(visibleCalendarDate),
      year: visibleYear,
      monthIndex: visibleMonthIndex,
      totalDays: new Date(visibleYear, visibleMonthIndex + 1, 0).getDate(),
      leadingBlanks: visibleCalendarDate.getDay(),
    };
  } catch (e) {
    const now = new Date();
    visibleYear = now.getFullYear();
    visibleMonthIndex = now.getMonth();
    visibleCalendarDate = now;
    visibleCalendarMonth = {
      key: `${visibleYear}-${String(visibleMonthIndex + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(now),
      year: visibleYear,
      monthIndex: visibleMonthIndex,
      totalDays: new Date(visibleYear, visibleMonthIndex + 1, 0).getDate(),
      leadingBlanks: now.getDay(),
    };
  }
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
                <option value="Despesas">Despesas</option>
                <option value="Despesas Pessoais">Despesas Pessoais</option>
                <option value="Funcionarios">Funcionarios</option>
                <option value="Free lance">Free lance</option>
                <option value="Despesas Fixas">Despesas Fixas</option>
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
        <div className="tabbar-wrapper">
          {canScrollLeft ? (
            <button
              type="button"
              className="tabbar-scroll-btn tabbar-scroll-left"
              onClick={() => tabbarRef.current?.scrollBy({ left: -160, behavior: "smooth" })}
              aria-label="Abas anteriores"
            >
              &#8249;
            </button>
          ) : null}
          <div className="tabbar" ref={tabbarRef}>
            {financeTabs.map((tab) => (
              <NavLink
                key={tab}
                to={buildFinanceTabHref(tab)}
                className={["tab", tab === activeTab ? "active" : ""].filter(Boolean).join(" ")}
              >
                {tab}
              </NavLink>
            ))}
          </div>
          {canScrollRight ? (
            <button
              type="button"
              className="tabbar-scroll-btn tabbar-scroll-right"
              onClick={() => tabbarRef.current?.scrollBy({ left: 160, behavior: "smooth" })}
              aria-label="Proximas abas"
            >
              &#8250;
            </button>
          ) : null}
        </div>
        <FinanceMonthPicker
          period={period}
          selectedDate={selectedDate}
          onSelectMonth={(monthIso) => {
            const params = new URLSearchParams(location.search);
            params.set("period", "mes");
            params.set("date", monthIso);
            navigate(`${location.pathname}${params.toString() ? `?${params.toString()}` : ""}`);
          }}
          onClearMonth={() => {
            const params = new URLSearchParams(location.search);
            params.set("period", "dia");
            params.set("date", today);
            navigate(`${location.pathname}${params.toString() ? `?${params.toString()}` : ""}`);
          }}
        />
        {children}
      </main>
    </div>
  );
}

function FinanceMonthPicker({ period, selectedDate, onSelectMonth, onClearMonth }) {
  const monthsOptions = useMemo(() => {
    const options = [];
    const reference = new Date();
    for (let offset = -12; offset <= 12; offset += 1) {
      const date = new Date(reference.getFullYear(), reference.getMonth() + offset, 1);
      const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
      const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
      options.push({ value: iso, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return options;
  }, []);

  const currentMonthIso = `${selectedDate.slice(0, 7)}-01`;
  const isMonthMode = period === "mes";

  return (
    <div className="finance-month-picker">
      <label className="finance-month-picker-label">Pesquisar por mês</label>
      <select
        className="finance-month-picker-select"
        value={isMonthMode ? currentMonthIso : ""}
        onChange={(event) => {
          const next = event.target.value;
          if (!next) {
            onClearMonth?.();
            return;
          }
          onSelectMonth?.(next);
        }}
      >
        <option value="">Selecionar mês…</option>
        {monthsOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {isMonthMode ? (
        <button
          type="button"
          className="finance-month-picker-clear"
          onClick={() => onClearMonth?.()}
          title="Voltar ao filtro de dia"
        >
          Limpar
        </button>
      ) : null}
    </div>
  );
}
