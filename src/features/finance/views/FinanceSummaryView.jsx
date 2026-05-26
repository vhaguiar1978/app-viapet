import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FinanceShell } from "../FinanceShell.jsx";
import { FinanceDeleteDialog, fmtBR } from "../_shared.jsx";

export function FinanceDemonstrativoSection({ apiRequest, selectedDate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const monthRef = (() => {
    const iso = String(selectedDate || "").slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(iso)) {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth() + 1 };
    }
    const [y, m] = iso.split("-");
    return { year: Number(y), month: Number(m) };
  })();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!apiRequest) return;
      setLoading(true);
      setError("");
      try {
        const res = await apiRequest(
          `/finance/monthly-demonstrativo/${monthRef.year}/${monthRef.month}`,
          { method: "GET" },
        );
        if (cancelled) return;
        setData(res?.data || res?.body?.data || null);
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || "Erro ao carregar demonstrativo");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [apiRequest, monthRef.year, monthRef.month]);

  if (!apiRequest) return null;

  return (
    <section className="finance-chart-card" style={{ marginTop: 16 }}>
      <h3>
        Demonstrativo mensal por forma de pagamento — {String(monthRef.month).padStart(2, "0")}/{monthRef.year}
      </h3>
      <p className="finance-summary-note">
        Mostra exatamente quanto entrou bruto, quanto foi perdido em taxas, e o líquido real recebido por cada forma de pagamento.
      </p>

      {loading ? <div>Carregando demonstrativo…</div> : null}
      {error ? <div className="registers-feedback">{error}</div> : null}

      {data ? (
        <>
          <div
            className="finance-summary-cards"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, marginBottom: 12 }}
          >
            <div className="finance-summary-mini-card"><span>Total vendido bruto</span><strong>R$ {fmtBR(data.totals?.totalBruto)}</strong></div>
            <div className="finance-summary-mini-card"><span>Valor perdido em taxas</span><strong>R$ {fmtBR(data.totals?.totalTaxas)}</strong></div>
            <div className="finance-summary-mini-card"><span>Líquido real recebido</span><strong>R$ {fmtBR(data.totals?.totalLiquido)}</strong></div>
            <div className="finance-summary-mini-card"><span>Total de despesas</span><strong>R$ {fmtBR(data.totals?.totalDespesas)}</strong></div>
            <div className="finance-summary-mini-card"><span>Lucro líquido real</span><strong>R$ {fmtBR(data.totals?.lucroLiquidoReal)}</strong></div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 0.6fr 1fr 1fr 1fr 0.7fr",
              gap: 8,
              fontWeight: 600,
              fontSize: 12,
              color: "#555",
              padding: "0 6px 6px",
              borderBottom: "1px solid #e8e8ee",
            }}
          >
            <div>Forma de pagamento</div>
            <div style={{ textAlign: "right" }}>Qtde</div>
            <div style={{ textAlign: "right" }}>Bruto</div>
            <div style={{ textAlign: "right" }}>Taxa</div>
            <div style={{ textAlign: "right" }}>Líquido</div>
            <div style={{ textAlign: "right" }}>% do total</div>
          </div>
          {(data.byMethod || []).map((b) => (
            <div
              key={b.method}
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 0.6fr 1fr 1fr 1fr 0.7fr",
                gap: 8,
                padding: "8px 6px",
                borderBottom: "1px solid #f1f1f5",
                alignItems: "center",
                fontSize: 13,
                opacity: b.bruto === 0 ? 0.5 : 1,
              }}
            >
              <div>{b.label}</div>
              <div style={{ textAlign: "right" }}>{b.count}</div>
              <div style={{ textAlign: "right" }}>R$ {fmtBR(b.bruto)}</div>
              <div style={{ textAlign: "right", color: "#c0392b" }}>− R$ {fmtBR(b.taxa)}</div>
              <div style={{ textAlign: "right", fontWeight: 600 }}>R$ {fmtBR(b.liquido)}</div>
              <div style={{ textAlign: "right" }}>{fmtBR(b.share)}%</div>
            </div>
          ))}
        </>
      ) : null}
    </section>
  );
}

export function FinanceSummaryView({ financeData }) {
  const navigate = useNavigate();
  const salesGross = financeData.summaryMetrics?.salesGross || 0;
  const salesNet = financeData.summaryMetrics?.salesNet || 0;
  const salesFees = financeData.summaryMetrics?.salesFees || 0;
  const purchasesTotal = financeData.summaryMetrics?.purchasesTotal || 0;
  const fixedExpensesTotal = financeData.summaryMetrics?.fixedExpensesTotal || 0;
  const personalExpensesTotal = financeData.summaryMetrics?.personalExpensesTotal || 0;
  const employeesTotal = financeData.summaryMetrics?.employeesTotal || 0;
  const freelanceTotal = financeData.summaryMetrics?.freelanceTotal || 0;
  const costsTotal = financeData.summaryMetrics?.costsTotal || 0;
  const paymentsGross = financeData.summaryMetrics?.paymentsGross || 0;
  const paymentsNet = financeData.summaryMetrics?.paymentsNet || 0;
  const paymentFees = financeData.summaryMetrics?.paymentFees || 0;
  const commissionsTotal = financeData.summaryMetrics?.commissionsTotal || 0;
  const paymentCount = financeData.paymentRows.length;
  // Lucro líquido real = receita líquida (já descontada de taxas) menos TODAS as saídas (despesas + comissões)
  const lucroLiquidoReal = salesNet - costsTotal - commissionsTotal;
  const lucroBruto = salesGross - costsTotal - commissionsTotal;
  const fmt = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
  const enhancedCards = [
    { label: "Faturamento bruto", value: fmt(salesGross), path: "/financeiro" },
    { label: "Valor perdido em taxas", value: `− ${fmt(salesFees)}`, tone: "negative" },
    { label: "Valor líquido recebido", value: fmt(salesNet), highlight: true, path: "/financeiro" },
    { label: "Despesas variáveis", value: fmt(purchasesTotal), path: "/financeiro/despesas" },
    { label: "Despesas fixas", value: fmt(fixedExpensesTotal), path: "/financeiro/despesas-fixas" },
    { label: "Despesas pessoais", value: fmt(personalExpensesTotal), path: "/financeiro/despesas-pessoais" },
    { label: "Funcionários", value: fmt(employeesTotal), path: "/financeiro/funcionarios" },
    { label: "Free lance", value: fmt(freelanceTotal), path: "/financeiro/free-lance" },
    { label: "Pagamentos avulsos", value: fmt(paymentsNet), path: "/financeiro/pagamentos" },
    { label: "Comissões", value: fmt(commissionsTotal), path: "/financeiro/comissoes" },
    { label: "Lucro líquido real", value: fmt(lucroLiquidoReal), highlight: true, tone: lucroLiquidoReal >= 0 ? "positive" : "negative" },
    { label: "Lançamentos pagos", value: String(paymentCount), path: "/financeiro/pagamentos" },
  ];

  return (
    <FinanceShell activeTab="Resumo" originValue="Resumo" onPrint={() => window.print()}>
      <div className="finance-summary-board">
        <div className="finance-summary-topbar">
          <div className="soft-counter finance-total-chip finance-summary-chip">{financeData.summaryTotals}</div>
        </div>

        {financeData.feedback ? <div className="registers-feedback">{financeData.feedback}</div> : null}

        <div className="finance-summary-cards">
          {enhancedCards.map((card) => {
            const className = `finance-summary-mini-card${card.highlight ? " finance-summary-mini-card-highlight" : ""}${card.path ? " finance-summary-mini-card-link" : ""}`;
            const styleProp =
              card.tone === "negative"
                ? { color: "#c0392b" }
                : card.tone === "positive"
                  ? { color: "#067a35" }
                  : undefined;
            if (card.path) {
              return (
                <button
                  key={card.label}
                  type="button"
                  className={className}
                  style={styleProp}
                  onClick={() => navigate(card.path)}
                  title={`Abrir ${card.label}`}
                >
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </button>
              );
            }
            return (
              <div key={card.label} className={className} style={styleProp}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </div>
            );
          })}
        </div>

        <div className="finance-summary-grid">
          <section className="finance-chart-card finance-chart-left">
            <h3>Demonstrativo mensal</h3>
            <p className="finance-summary-note">
              O ViaPET trabalha com <strong>dois valores</strong>: bruto (o que foi vendido/lançado) e líquido (o que entra de fato após taxas e custos financeiros).
              Este painel prioriza o líquido para mostrar o lucro real do negócio.
            </p>
            <div className="finance-summary-stats">
              <div className="finance-summary-stat-line">
                <span>Total vendido bruto</span>
                <strong>{fmt(salesGross)}</strong>
              </div>
              <div className="finance-summary-stat-line" style={{ color: "#c0392b" }}>
                <span>Valor perdido em taxas</span>
                <strong>{`− ${fmt(salesFees)}`}</strong>
              </div>
              <div className="finance-summary-stat-line">
                <span>Valor líquido recebido</span>
                <strong>{fmt(salesNet)}</strong>
              </div>
              <div className="finance-summary-stat-line finance-summary-stat-line-divider">
                <span>Despesas variáveis (compras)</span>
                <strong>{`− ${fmt(purchasesTotal)}`}</strong>
              </div>
              <div className="finance-summary-stat-line">
                <span>Despesas fixas</span>
                <strong>{`− ${fmt(fixedExpensesTotal)}`}</strong>
              </div>
              <div className="finance-summary-stat-line">
                <span>Despesas pessoais</span>
                <strong>{`− ${fmt(personalExpensesTotal)}`}</strong>
              </div>
              <div className="finance-summary-stat-line">
                <span>Funcionários</span>
                <strong>{`− ${fmt(employeesTotal)}`}</strong>
              </div>
              <div className="finance-summary-stat-line">
                <span>Free lance</span>
                <strong>{`− ${fmt(freelanceTotal)}`}</strong>
              </div>
              <div className="finance-summary-stat-line" style={{ fontWeight: 600 }}>
                <span>Total de despesas</span>
                <strong>{`− ${fmt(costsTotal)}`}</strong>
              </div>
              <div className="finance-summary-stat-line">
                <span>Comissões</span>
                <strong>{`− ${fmt(commissionsTotal)}`}</strong>
              </div>
              <div
                className="finance-summary-stat-line finance-summary-stat-line-accent"
                style={{ color: lucroLiquidoReal >= 0 ? "#067a35" : "#c0392b" }}
              >
                <span>Lucro líquido real</span>
                <strong>{fmt(lucroLiquidoReal)}</strong>
              </div>
              <div className="finance-summary-stat-line" style={{ opacity: 0.7, fontSize: "0.92em" }}>
                <span>(Lucro bruto, sem taxas)</span>
                <strong>{fmt(lucroBruto)}</strong>
              </div>
            </div>
            <div className="finance-legend finance-legend-spread">
              <div>
                <strong>Diferença bruto × líquido</strong>
                <p>{`R$ ${salesFees.toFixed(2).replace(".", ",")}`}</p>
              </div>
              <div>
                <strong>Vendas no período</strong>
                <p>{financeData.salesRows.length}</p>
              </div>
            </div>
          </section>

          <section className="finance-chart-card finance-chart-right">
            <h3>Leitura dos recebimentos</h3>
            <p className="finance-summary-note">Aqui voce enxerga o que entrou bruto, o custo financeiro e o liquido real.</p>
            <div className="finance-summary-stats">
              <div className="finance-summary-stat-line">
                <span>Recebido bruto</span>
                <strong>{`R$ ${paymentsGross.toFixed(2).replace(".", ",")}`}</strong>
              </div>
              <div className="finance-summary-stat-line">
                <span>Taxas sobre recebimentos</span>
                <strong>{`R$ ${paymentFees.toFixed(2).replace(".", ",")}`}</strong>
              </div>
              <div className="finance-summary-stat-line">
                <span>Recebido liquido</span>
                <strong>{`R$ ${paymentsNet.toFixed(2).replace(".", ",")}`}</strong>
              </div>
              <div className="finance-summary-stat-line">
                <span>Caixa liquido apos custos</span>
                <strong>{`R$ ${(paymentsNet - costsTotal - commissionsTotal).toFixed(2).replace(".", ",")}`}</strong>
              </div>
            </div>
          </section>
        </div>

        <FinanceDemonstrativoSection
          apiRequest={financeData.apiRequest}
          selectedDate={financeData.selectedDate}
        />
        <FinanceDeleteDialog financeData={financeData} />
      </div>
    </FinanceShell>
  );
}
