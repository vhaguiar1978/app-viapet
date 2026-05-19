import { useEffect, useMemo, useState } from "react";

function brl(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

const PAYMENT_METHOD_LABELS = {
  account_money: "Saldo MP",
  ticket: "Boleto",
  bank_transfer: "Pix",
  atm: "Caixa eletrônico",
  credit_card: "Cartão crédito",
  debit_card: "Cartão débito",
  prepaid_card: "Cartão pré-pago",
  digital_currency: "Linha de crédito",
  voucher_card: "Voucher",
  crypto_transfer: "Cripto",
  pix: "Pix",
  boleto: "Boleto",
};

const PAYMENT_STATUS_LABELS = {
  approved: "Aprovado",
  pending: "Pendente",
  authorized: "Autorizado",
  in_process: "Em análise",
  in_mediation: "Em mediação",
  rejected: "Rejeitado",
  cancelled: "Cancelado",
  refunded: "Estornado",
  charged_back: "Chargeback",
};

const MODE_TITLES = {
  paying: "Pagantes ativos — detalhe",
  mrr: "MRR previsto — composição",
  received: "Recebimentos do mês",
  inadimplencia: "Inadimplência — clientes em aberto",
  series: "Receita 12 meses — por mês",
  forecast: "Forecast 90 dias — cobranças previstas",
  ltv: "LTV — total pago por cliente",
};

export default function AdminFinanceDetailModal({
  mode,
  month,
  snapshot,
  clients,
  apiRequest,
  onClose,
  onOpenClient,
}) {
  const [payments, setPayments] = useState(null);
  const [inadimplencia, setInadimplencia] = useState(null);
  const [allPayments, setAllPayments] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setError("");
      try {
        if (mode === "received") {
          setLoading(true);
          const res = await apiRequest(`/admin/finance/payments?month=${month}&limit=500`);
          if (!cancelled) setPayments(res?.data || []);
        } else if (mode === "inadimplencia") {
          setLoading(true);
          const res = await apiRequest(`/admin/finance/inadimplencia`);
          if (!cancelled) setInadimplencia(res?.data || { items: [], total: 0, count: 0 });
        } else if (mode === "ltv") {
          setLoading(true);
          const res = await apiRequest(`/admin/finance/payments?limit=500`);
          if (!cancelled) setAllPayments(res?.data || []);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "Falha ao carregar detalhe");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [mode, month, apiRequest]);

  const clientById = useMemo(() => {
    const map = new Map();
    for (const c of clients || []) map.set(c.user_id, c);
    return map;
  }, [clients]);

  function nameFor(userId) {
    const c = clientById.get(userId);
    if (!c) return userId?.slice(0, 8) || "—";
    return c.name || c.email || userId.slice(0, 8);
  }

  function emailFor(userId) {
    return clientById.get(userId)?.email || "—";
  }

  const title = MODE_TITLES[mode] || "Detalhe";

  let body = null;

  if (mode === "paying") {
    const paying = (clients || []).filter(
      (c) => c.subscription?.status === "active" && ["monthly", "promotional"].includes(c.subscription?.plan_type),
    );
    const trial = (clients || []).filter(
      (c) => c.subscription?.status === "active" && c.subscription?.plan_type === "trial",
    );
    body = (
      <>
        <div className="admin-fin-modal-summary">
          <div>
            <span>Pagantes</span>
            <strong>{paying.length}</strong>
          </div>
          <div>
            <span>Em trial</span>
            <strong>{trial.length}</strong>
          </div>
          <div>
            <span>Soma mensal pagantes</span>
            <strong>
              {brl(paying.reduce((s, c) => s + (Number(c.subscription?.amount) || 0), 0))}
            </strong>
          </div>
        </div>
        <DetailTable
          columns={["Cliente", "Plano", "Mensalidade", "Vence em"]}
          rows={[...paying, ...trial].map((c) => ({
            key: c.user_id,
            onClick: () => onOpenClient?.(c.user_id),
            cells: [
              <span className="admin-cell-primary">
                <strong>{c.name || "(sem nome)"}</strong>
                <small>{c.email}</small>
              </span>,
              c.subscription?.plan_type || "—",
              brl(c.subscription?.amount),
              formatDate(c.subscription?.next_billing_date),
            ],
          }))}
          empty="Nenhum cliente ativo."
        />
      </>
    );
  } else if (mode === "mrr") {
    const activePaying = (clients || []).filter(
      (c) => c.subscription?.status === "active" && ["monthly", "promotional"].includes(c.subscription?.plan_type),
    );
    const withAddons = (clients || []).filter(
      (c) => (c.addons || []).some((a) => a.status === "active"),
    );
    const allContributing = Array.from(
      new Map(
        [...activePaying, ...withAddons].map((c) => [c.user_id, c]),
      ).values(),
    );
    const breakdown = snapshot?.mrr?.breakdown || [];
    body = (
      <>
        <div className="admin-fin-modal-summary">
          <div>
            <span>Base (mensalidade)</span>
            <strong>{brl(snapshot?.mrr?.base)}</strong>
          </div>
          <div>
            <span>Addons</span>
            <strong>{brl(snapshot?.mrr?.addons)}</strong>
          </div>
        </div>

        {breakdown.length ? (
          <div className="admin-fin-modal-section">
            <h4>Por addon</h4>
            <DetailTable
              columns={["Addon", "Clientes", "MRR"]}
              rows={breakdown.map((b) => ({
                key: b.addon_key,
                cells: [b.addon_key, b.count, brl(b.mrr)],
              }))}
            />
          </div>
        ) : null}

        <div className="admin-fin-modal-section">
          <h4>Por cliente</h4>
          <DetailTable
            columns={["Cliente", "Plano", "Mensalidade", "Addons", "Total/mês"]}
            rows={allContributing.map((c) => {
              const sub = c.subscription;
              const isActive = sub?.status === "active" && ["monthly", "promotional"].includes(sub?.plan_type);
              const activeAddons = (c.addons || []).filter((a) => a.status === "active");
              const addonsSum = activeAddons.reduce((s, a) => s + (a.amount || 0), 0);
              return {
                key: c.user_id,
                onClick: () => onOpenClient?.(c.user_id),
                cells: [
                  <span className="admin-cell-primary">
                    <strong>{c.name || "(sem nome)"}</strong>
                    <small>{c.email}</small>
                  </span>,
                  sub?.plan_type || "—",
                  isActive ? brl(sub?.amount) : "—",
                  activeAddons.length
                    ? `${brl(addonsSum)} (${activeAddons.map((a) => a.addon_name).join(", ")})`
                    : "—",
                  <strong>{brl((isActive ? Number(sub?.amount) || 0 : 0) + addonsSum)}</strong>,
                ],
              };
            })}
            empty="Nenhuma assinatura ou addon ativo."
          />
        </div>
      </>
    );
  } else if (mode === "received") {
    const rows = payments || [];
    body = (
      <>
        <div className="admin-fin-modal-summary">
          <div>
            <span>Pagamentos no mês</span>
            <strong>{rows.length}</strong>
          </div>
          <div>
            <span>Total recebido</span>
            <strong>
              {brl(rows.filter((p) => p.status === "approved").reduce((s, p) => s + Number(p.amount), 0))}
            </strong>
          </div>
        </div>
        {loading ? (
          <div className="admin-empty">Carregando pagamentos…</div>
        ) : (
          <DetailTable
            columns={["Data", "Cliente", "Valor", "Método", "Status"]}
            rows={rows.map((p) => ({
              key: p.id,
              onClick: () => onOpenClient?.(p.user_id),
              cells: [
                formatDate(p.date_approved || p.date_created),
                <span className="admin-cell-primary">
                  <strong>{nameFor(p.user_id)}</strong>
                  <small>{emailFor(p.user_id)}</small>
                </span>,
                brl(p.amount),
                PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method || "—",
                <span
                  className={`admin-pill admin-pill-${p.status === "approved" ? "ok" : p.status === "pending" ? "warn" : "muted"}`}
                >
                  {PAYMENT_STATUS_LABELS[p.status] || p.status}
                </span>,
              ],
            }))}
            empty="Nenhum pagamento registrado neste mês."
          />
        )}
      </>
    );
  } else if (mode === "inadimplencia") {
    const data = inadimplencia || { items: [], total: 0, count: 0 };
    body = (
      <>
        <div className="admin-fin-modal-summary">
          <div>
            <span>Clientes em aberto</span>
            <strong>{data.count}</strong>
          </div>
          <div>
            <span>Total em aberto</span>
            <strong className="admin-text-danger">{brl(data.total)}</strong>
          </div>
        </div>
        {loading ? (
          <div className="admin-empty">Carregando inadimplência…</div>
        ) : (
          <DetailTable
            columns={["Cliente", "Vencido em", "Base", "Addons", "Total", "Itens"]}
            rows={data.items.map((it) => ({
              key: it.user_id,
              onClick: () => onOpenClient?.(it.user_id),
              cells: [
                <span className="admin-cell-primary">
                  <strong>{it.name || "(sem nome)"}</strong>
                  <small>{it.email}</small>
                </span>,
                formatDate(it.oldestDue),
                brl(it.baseAmount),
                brl(it.addonsAmount),
                <strong className="admin-text-danger">{brl(it.total)}</strong>,
                it.itemCount,
              ],
            }))}
            empty="Sem clientes inadimplentes."
          />
        )}
      </>
    );
  } else if (mode === "series") {
    const series = snapshot?.series || [];
    const total = series.reduce((s, m) => s + (m.total || 0), 0);
    const totalCount = series.reduce((s, m) => s + (m.count || 0), 0);
    body = (
      <>
        <div className="admin-fin-modal-summary">
          <div>
            <span>Meses</span>
            <strong>{series.length}</strong>
          </div>
          <div>
            <span>Total 12 meses</span>
            <strong>{brl(total)}</strong>
          </div>
          <div>
            <span>Pagamentos</span>
            <strong>{totalCount}</strong>
          </div>
        </div>
        <DetailTable
          columns={["Mês", "Pagamentos", "Total"]}
          rows={[...series].reverse().map((m) => ({
            key: m.label,
            cells: [m.label, m.count || 0, brl(m.total)],
          }))}
        />
      </>
    );
  } else if (mode === "forecast") {
    const now = new Date();
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 90);
    const guaranteed = [];
    const atRisk = [];
    for (const c of clients || []) {
      const sub = c.subscription;
      if (!sub?.next_billing_date) continue;
      const d = new Date(sub.next_billing_date);
      if (d < now || d > horizon) continue;
      const row = {
        user_id: c.user_id,
        name: c.name,
        email: c.email,
        plan: sub.plan_type,
        amount: Number(sub.amount) || 0,
        date: sub.next_billing_date,
        status: sub.status,
      };
      if (sub.status === "active") guaranteed.push(row);
      else if (["pending", "suspended", "expired"].includes(sub.status)) atRisk.push(row);
    }
    const renderRow = (r) => ({
      key: `${r.user_id}-${r.date}`,
      onClick: () => onOpenClient?.(r.user_id),
      cells: [
        <span className="admin-cell-primary">
          <strong>{r.name || "(sem nome)"}</strong>
          <small>{r.email}</small>
        </span>,
        r.plan,
        formatDate(r.date),
        brl(r.amount),
      ],
    });
    body = (
      <>
        <div className="admin-fin-modal-summary">
          <div>
            <span>Garantido</span>
            <strong>{brl(snapshot?.forecast?.guaranteed?.total)}</strong>
          </div>
          <div>
            <span>Em risco</span>
            <strong className="admin-text-danger">{brl(snapshot?.forecast?.atRisk?.total)}</strong>
          </div>
          <div>
            <span>Horizonte</span>
            <strong>90 dias</strong>
          </div>
        </div>
        <div className="admin-fin-modal-section">
          <h4>Garantido ({guaranteed.length})</h4>
          <DetailTable
            columns={["Cliente", "Plano", "Vence em", "Valor"]}
            rows={guaranteed.map(renderRow)}
            empty="Sem cobranças garantidas no horizonte."
          />
        </div>
        <div className="admin-fin-modal-section">
          <h4>Em risco ({atRisk.length})</h4>
          <DetailTable
            columns={["Cliente", "Plano", "Vence em", "Valor"]}
            rows={atRisk.map(renderRow)}
            empty="Sem cobranças em risco no horizonte."
          />
        </div>
      </>
    );
  } else if (mode === "ltv") {
    const totalsByUser = new Map();
    for (const p of allPayments || []) {
      if (p.status !== "approved") continue;
      const cur = totalsByUser.get(p.user_id) || 0;
      totalsByUser.set(p.user_id, cur + Number(p.amount));
    }
    const rows = Array.from(totalsByUser.entries())
      .map(([uid, total]) => ({ uid, total }))
      .sort((a, b) => b.total - a.total);
    const sum = rows.reduce((s, r) => s + r.total, 0);
    const avg = rows.length ? sum / rows.length : 0;
    body = (
      <>
        <div className="admin-fin-modal-summary">
          <div>
            <span>Clientes pagantes</span>
            <strong>{rows.length}</strong>
          </div>
          <div>
            <span>Soma total paga</span>
            <strong>{brl(sum)}</strong>
          </div>
          <div>
            <span>LTV médio</span>
            <strong>{brl(avg)}</strong>
          </div>
        </div>
        {loading ? (
          <div className="admin-empty">Carregando histórico…</div>
        ) : (
          <DetailTable
            columns={["Cliente", "Total pago"]}
            rows={rows.map((r) => ({
              key: r.uid,
              onClick: () => onOpenClient?.(r.uid),
              cells: [
                <span className="admin-cell-primary">
                  <strong>{nameFor(r.uid)}</strong>
                  <small>{emailFor(r.uid)}</small>
                </span>,
                <strong>{brl(r.total)}</strong>,
              ],
            }))}
            empty="Sem pagamentos aprovados no histórico."
          />
        )}
      </>
    );
  }

  return (
    <div
      className="admin-fin-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="admin-fin-modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="admin-fin-modal-header">
          <h3>{title}</h3>
          <button type="button" className="admin-fin-modal-close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>
        <div className="admin-fin-modal-body">
          {error ? <div className="admin-error">{error}</div> : null}
          {body}
        </div>
      </div>
    </div>
  );
}

function DetailTable({ columns, rows, empty }) {
  const cols = columns.length;
  const style = { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` };
  return (
    <div className="admin-fin-modal-table">
      <div className="admin-fin-modal-row admin-fin-modal-head" style={style}>
        {columns.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      {rows.length === 0 ? (
        <div className="admin-empty">{empty || "Sem dados."}</div>
      ) : (
        rows.map((r) =>
          r.onClick ? (
            <button
              key={r.key}
              type="button"
              className="admin-fin-modal-row admin-fin-modal-row-clickable"
              style={style}
              onClick={r.onClick}
            >
              {r.cells.map((cell, i) => (
                <span key={i}>{cell}</span>
              ))}
            </button>
          ) : (
            <div key={r.key} className="admin-fin-modal-row" style={style}>
              {r.cells.map((cell, i) => (
                <span key={i}>{cell}</span>
              ))}
            </div>
          ),
        )
      )}
    </div>
  );
}
