import { useEffect, useState } from "react";

const PLAN_LABELS = {
  trial: "Trial",
  promotional: "Promocional",
  monthly: "Mensal",
};

export function MessagesPlanStatusPanel({ open, onClose, apiRequest, auth }) {
  const authHeaders = auth?.token ? { Authorization: `Bearer ${auth.token}` } : {};
  const [status, setStatus] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    Promise.all([
      apiRequest("/crm-plan-status", { headers: authHeaders }),
      apiRequest("/crm-plan-status/catalog", { headers: authHeaders }),
    ])
      .then(([s, c]) => {
        if (!active) return;
        setStatus(s?.data || null);
        setCatalog(c?.data || null);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [open, auth?.token]);

  if (!open) return null;

  const planKey = status?.planKey || "trial";
  const usagePct = status?.usage?.messagesPercent || 0;
  const barColor = usagePct >= 90 ? "#dc2626" : usagePct >= 70 ? "#f59e0b" : "#16a34a";

  return (
    <div className="messages-ai-control-overlay" onClick={onClose}>
      <div
        className="messages-ai-control-modal messages-whatsapp-config-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 720, maxHeight: "85vh", overflowY: "auto" }}
      >
        <div className="messages-ai-control-head">
          <div>
            <span>WhatsApp CRM</span>
            <h2>Meu plano</h2>
          </div>
          <button type="button" className="messages-ai-control-close" onClick={onClose}>Fechar</button>
        </div>

        <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {loading || !status ? (
            <div style={{ color: "#6b7280", fontSize: 14 }}>Carregando...</div>
          ) : (
            <>
              {/* Plano atual */}
              <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 12, color: "#075985", fontWeight: 600 }}>PLANO ATUAL</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#0c4a6e", marginTop: 2 }}>
                  {PLAN_LABELS[planKey] || planKey}
                </div>
                <div style={{ fontSize: 13, color: "#0369a1" }}>
                  {status.plan?.label} — {status.plan?.price}
                </div>
              </div>

              {/* Uso de mensagens */}
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <strong style={{ fontSize: 14 }}>Mensagens este mes</strong>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>
                    {status.usage.messagesThisMonth} / {status.usage.messagesLimit}
                  </span>
                </div>
                <div style={{ height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${Math.min(100, usagePct)}%`,
                      height: "100%",
                      background: barColor,
                      transition: "width 0.3s",
                    }}
                  />
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                  {status.usage.messagesRemaining} mensagens restantes este mes
                </div>
              </div>

              {/* Recursos do plano */}
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 14 }}>
                <strong style={{ fontSize: 14, display: "block", marginBottom: 10 }}>Recursos inclusos</strong>
                <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
                  <Feature label="Atendentes simultaneos" value={status.features.attendants} />
                  <Feature label="Inteligencia artificial" yes={status.features.aiEnabled} />
                  <Feature label="Automacoes de agenda" yes={status.features.automationsEnabled} />
                </div>
              </div>

              {/* Comparativo de planos */}
              {catalog && (
                <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 14 }}>
                  <strong style={{ fontSize: 14, display: "block", marginBottom: 10 }}>
                    Outros planos disponiveis
                  </strong>
                  <div style={{ display: "grid", gap: 8 }}>
                    {Object.entries(catalog).map(([key, plan]) => {
                      const isCurrent = key === planKey;
                      return (
                        <div
                          key={key}
                          style={{
                            border: isCurrent ? "2px solid #0ea5e9" : "1px solid #e5e7eb",
                            borderRadius: 8,
                            padding: "10px 12px",
                            background: isCurrent ? "#f0f9ff" : "#fff",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong style={{ fontSize: 14 }}>
                              {plan.label} {isCurrent && <span style={{ fontSize: 11, color: "#0ea5e9", marginLeft: 6 }}>(atual)</span>}
                            </strong>
                            <span style={{ fontSize: 13, color: "#6b7280" }}>{plan.price}</span>
                          </div>
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                            {plan.messagesPerMonth.toLocaleString("pt-BR")} msgs/mes ·{" "}
                            {plan.attendants} atendentes ·{" "}
                            {plan.aiEnabled ? "IA inclusa" : "Sem IA"} ·{" "}
                            {plan.automationsEnabled ? "Automacoes inclusas" : "Sem automacoes"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Feature({ label, value, yes }) {
  const display = value !== undefined ? String(value) : (yes ? "Incluso" : "Nao incluso");
  const color = value !== undefined ? "#0c4a6e" : (yes ? "#16a34a" : "#dc2626");
  const icon = value !== undefined ? "•" : (yes ? "✓" : "✕");
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ color: "#374151" }}>{label}</span>
      <span style={{ color, fontWeight: 600 }}>
        {icon} {display}
      </span>
    </div>
  );
}
