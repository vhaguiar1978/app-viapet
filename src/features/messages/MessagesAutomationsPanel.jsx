import { useEffect, useState } from "react";

const AUTOMATION_DEFS = [
  {
    key: "confirmation",
    title: "Confirmacao de agendamento",
    description: "Envia uma mensagem de confirmacao logo apos o agendamento ser criado.",
    params: [],
  },
  {
    key: "reminder",
    title: "Lembrete antes do horario",
    description: "Avisa o cliente algumas horas antes do agendamento.",
    params: [
      { key: "hoursBeforeAppointment", label: "Horas antes do agendamento", min: 1, max: 48 },
    ],
  },
  {
    key: "ready",
    title: "Pet pronto para retirada",
    description: "Envia mensagem quando o agendamento for concluido (status Concluido / Pronto / Finalizado).",
    params: [],
  },
  {
    key: "return",
    title: "Retorno apos X dias",
    description: "Lembra clientes que nao voltam ha algum tempo.",
    params: [
      { key: "daysAfterService", label: "Dias apos o ultimo servico", min: 1, max: 365 },
    ],
  },
  {
    key: "overduePayment",
    title: "Cobranca de pagamento pendente",
    description: "Cobra agendamentos finalizados sem forma de pagamento registrada.",
    params: [
      { key: "daysAfterDue", label: "Dias apos o servico", min: 1, max: 60 },
    ],
  },
];

const TEMPLATE_VARIABLES = ["{customer}", "{pet}", "{date}", "{time}"];

export function MessagesAutomationsPanel({ open, onClose, apiRequest, auth }) {
  const authToken = String(auth?.token || "");
  const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setFeedback("");
    apiRequest("/crm-automations", { headers: authHeaders })
      .then((data) => {
        if (!active) return;
        setConfig(data?.data || null);
      })
      .catch((err) => {
        if (!active) return;
        setFeedback(err?.message || "Nao foi possivel carregar as automacoes.");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [open, authToken]);

  if (!open) return null;

  function updateGlobal(field, value) {
    setConfig((current) => ({ ...current, [field]: value }));
  }
  function updateAutomation(key, field, value) {
    setConfig((current) => ({
      ...current,
      [key]: { ...(current?.[key] || {}), [field]: value },
    }));
  }

  async function handleSave() {
    if (!config) return;
    try {
      setSaving(true);
      setFeedback("");
      const res = await apiRequest("/crm-automations", {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      setConfig(res?.data || config);
      setFeedback("Automacoes salvas.");
    } catch (err) {
      setFeedback(err?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRunNow() {
    try {
      setFeedback("Disparando rodada de teste...");
      const res = await apiRequest("/crm-automations/run", {
        method: "POST",
        headers: authHeaders,
      });
      const results = res?.data?.results || [];
      const sentTotal = results.reduce((acc, r) => acc + (r?.sent || 0), 0);
      setFeedback(`Rodada concluida. ${sentTotal} mensagens enviadas.`);
    } catch (err) {
      setFeedback(err?.message || "Erro ao rodar automacoes.");
    }
  }

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
            <h2>Automacoes de agenda</h2>
          </div>
          <button type="button" className="messages-ai-control-close" onClick={onClose}>
            Fechar
          </button>
        </div>

        <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {loading || !config ? (
            <div style={{ color: "#6b7280", fontSize: 14 }}>Carregando...</div>
          ) : (
            <>
              {/* Switch global */}
              <label
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                  border: "1px solid #e5e7eb", borderRadius: 10, background: "#f9fafb",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={Boolean(config.enabled)}
                  onChange={(e) => updateGlobal("enabled", e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 14 }}>Ativar automacoes</strong>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Master switch — quando desativado, nenhuma automacao roda.
                  </div>
                </div>
              </label>

              {/* Variaveis disponiveis */}
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Variaveis disponiveis nos templates:{" "}
                {TEMPLATE_VARIABLES.map((v) => (
                  <code key={v} style={{ background: "#f3f4f6", padding: "1px 4px", borderRadius: 4, marginRight: 4 }}>
                    {v}
                  </code>
                ))}
              </div>

              {/* Lista de automacoes */}
              {AUTOMATION_DEFS.map((def) => {
                const auto = config[def.key] || {};
                const enabled = Boolean(auto.enabled);
                return (
                  <section
                    key={def.key}
                    style={{
                      border: "1px solid #e5e7eb", borderRadius: 10, padding: 14,
                      background: enabled ? "#fff" : "#fafafa",
                      opacity: enabled ? 1 : 0.7,
                    }}
                  >
                    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => updateAutomation(def.key, "enabled", e.target.checked)}
                        style={{ width: 18, height: 18, marginTop: 2 }}
                      />
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: 14 }}>{def.title}</strong>
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                          {def.description}
                        </div>
                      </div>
                    </label>

                    {enabled && (
                      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                        {def.params.map((p) => (
                          <label key={p.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                            <span style={{ minWidth: 220 }}>{p.label}:</span>
                            <input
                              type="number"
                              min={p.min}
                              max={p.max}
                              value={auto[p.key] ?? ""}
                              onChange={(e) =>
                                updateAutomation(def.key, p.key, Number(e.target.value))
                              }
                              style={{
                                width: 90, padding: "4px 8px",
                                border: "1px solid #d1d5db", borderRadius: 6,
                              }}
                            />
                          </label>
                        ))}
                        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                          <span style={{ fontWeight: 600 }}>Mensagem:</span>
                          <textarea
                            value={auto.templateBody || ""}
                            onChange={(e) => updateAutomation(def.key, "templateBody", e.target.value)}
                            rows={3}
                            style={{
                              padding: "8px 10px", border: "1px solid #d1d5db",
                              borderRadius: 6, fontSize: 13, resize: "vertical",
                              fontFamily: "inherit",
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </section>
                );
              })}

              {feedback ? (
                <div
                  style={{
                    fontSize: 13, padding: "10px 12px", borderRadius: 6,
                    background: "#f3f4f6", color: "#374151",
                  }}
                >
                  {feedback}
                </div>
              ) : null}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="messages-ai-control-secondary-btn"
                  onClick={handleRunNow}
                  disabled={saving}
                >
                  Rodar agora (teste)
                </button>
                <button
                  type="button"
                  className="messages-ai-control-primary-btn"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Salvando..." : "Salvar automacoes"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
