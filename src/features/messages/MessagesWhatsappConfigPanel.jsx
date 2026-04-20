import { useEffect, useMemo, useState } from "react";

function buildDefaultConfig(value = {}) {
  return {
    provider: value.provider || "WhatsApp Cloud API",
    phoneNumberId: value.phoneNumberId || "",
    businessAccountId: value.businessAccountId || "",
    verifyToken: value.verifyToken || "genius",
    accessToken: "",
    accessTokenConfigured: Boolean(value.accessTokenConfigured),
    accessTokenPreview: value.accessTokenPreview || "",
    defaultCountryCode: value.defaultCountryCode || "55",
    webhookPath: value.webhookPath || "/webhook",
    webhookUrl: value.webhookUrl || "",
    status: value.status || "pending",
  };
}

function formatDateTime(value) {
  if (!value) return "Ainda nao recebido";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Ainda nao recebido";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function MessagesWhatsappConfigPanel({
  open,
  config,
  status,
  loading = false,
  saving = false,
  testing = false,
  feedback = "",
  testResult = null,
  pendingPhones = [],
  isOauthConnecting = false,
  apiRequest,
  auth,
  onClose,
  onSave,
  onTest,
  onOAuthConnect,
  onSelectPhone,
  onDisconnect,
}) {
  const authHeaders = auth?.token ? { Authorization: `Bearer ${auth.token}` } : {};
  const [draft, setDraft] = useState(() => buildDefaultConfig(config));
  const [showManual, setShowManual] = useState(false);
  const [disconnectConfirm, setDisconnectConfirm] = useState(false);
  const [baileysQr, setBaileysQr] = useState(null);
  const [baileysLoading, setBaileysLoading] = useState(false);
  const [baileysStatus, setBaileysStatus] = useState("disconnected");
  const [baileysConnectedPhone, setBaileysConnectedPhone] = useState(null);
  const [baileysPollingStart, setBaileysPollingStart] = useState(null);

  useEffect(() => {
    setDraft(buildDefaultConfig(config));
    setShowManual(false);
    setDisconnectConfirm(false);
  }, [config, open]);

  // Poll Baileys status every 3 seconds while connecting or scanning (up to 2 min)
  useEffect(() => {
    if (baileysStatus !== "scanning" && baileysStatus !== "connecting") return;

    const interval = setInterval(async () => {
      // Timeout after 2 minutes
      if (baileysPollingStart && Date.now() - baileysPollingStart > 120000) {
        setBaileysStatus("error");
        return;
      }
      try {
        const data = await apiRequest("/crm-baileys/status", { headers: authHeaders });
        if (data.success) {
          setBaileysStatus(data.data.status);
          if (data.data.qrCode) {
            setBaileysQr(data.data.qrCode);
          }
          if (data.data.connectedPhone) {
            setBaileysConnectedPhone(data.data.connectedPhone);
          }
          if (data.data.status === "connected") {
            setBaileysQr(null);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar status:", error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [baileysStatus, apiRequest]);

  async function handleBaileysConnect() {
    try {
      setBaileysLoading(true);
      const data = await apiRequest("/crm-baileys/connect", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ establishment: "default" }),
      });
      if (data.success) {
        setBaileysPollingStart(Date.now());
        setBaileysQr(data.data.qrCode || null);
        setBaileysStatus(data.data.qrCode ? "scanning" : "connecting");
      } else {
        alert("Erro ao conectar: " + (data.error || data.message || "Erro desconhecido"));
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao conectar: " + error.message);
    } finally {
      setBaileysLoading(false);
    }
  }

  async function handleBaileysDisconnect() {
    try {
      const data = await apiRequest("/crm-baileys/disconnect", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ establishment: "default" }),
      });
      if (data.success) {
        setBaileysStatus("disconnected");
        setBaileysQr(null);
        setBaileysConnectedPhone(null);
      }
    } catch (error) {
      console.error("Erro ao desconectar:", error);
      alert("Erro ao desconectar: " + error.message);
    }
  }

  async function handleBaileysReset() {
    try {
      setBaileysLoading(true);
      setBaileysQr(null);
      setBaileysConnectedPhone(null);
      // Reset clears DB auth state and singleton instance
      await apiRequest("/crm-baileys/reset", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ establishment: "default" }),
      });
      setBaileysStatus("disconnected");
    } catch (error) {
      console.error("Erro ao resetar:", error);
      setBaileysStatus("disconnected");
    } finally {
      setBaileysLoading(false);
    }
    // Connect fresh after short pause
    setTimeout(() => handleBaileysConnect(), 500);
  }

  const hasTokenError = Boolean(status?.tokenInvalid);
  const isConnected = Boolean(
    status?.configured && status?.accessNumberOrConnected !== false && !hasTokenError,
  );
  const oauthAvailable = Boolean(status?.oauthAvailable);
  const oauthConnectedAt = status?.oauthConnectedAt || config?.oauthConnectedAt || null;
  const connectedViaOAuth = Boolean(oauthConnectedAt);
  const lastWebhookLabel = formatDateTime(status?.lastWebhookAt);
  const receivingMessages = Boolean(status?.connected);
  const showAdvancedSection = !oauthAvailable || showManual;

  const onboardingSteps = useMemo(
    () => [
      {
        key: "meta",
        title: "1. Conta da Meta",
        done: Boolean(draft.phoneNumberId && draft.businessAccountId),
      },
      {
        key: "token",
        title: "2. Acesso liberado",
        done: Boolean(draft.accessTokenConfigured),
      },
      {
        key: "webhook",
        title: "3. Recebendo mensagens",
        done: receivingMessages,
      },
    ],
    [
      draft.phoneNumberId,
      draft.businessAccountId,
      draft.accessTokenConfigured,
      receivingMessages,
    ],
  );

  if (!open) return null;

  function updateField(field, nextValue) {
    setDraft((current) => ({ ...current, [field]: nextValue }));
  }

  async function handleSave() {
    await onSave({
      provider: draft.provider,
      phoneNumberId: draft.phoneNumberId,
      businessAccountId: draft.businessAccountId,
      verifyToken: draft.verifyToken,
      accessToken: draft.accessToken,
      accessTokenConfigured:
        Boolean(draft.accessTokenConfigured) || Boolean(draft.accessToken),
      defaultCountryCode: draft.defaultCountryCode,
    });
  }

  if (pendingPhones.length > 0) {
    return (
      <div className="messages-ai-control-overlay" onClick={onClose}>
        <div
          className="messages-ai-control-modal messages-whatsapp-config-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="messages-ai-control-head">
            <div>
              <span>WhatsApp CRM</span>
              <h2>Escolher o numero</h2>
            </div>
            <button type="button" className="messages-ai-control-close" onClick={onClose}>
              Fechar
            </button>
          </div>
          <p style={{ padding: "0 24px", color: "#666", fontSize: 14 }}>
            Encontramos mais de um numero na sua conta Meta. Escolha qual deles vai
            responder neste estabelecimento.
          </p>
          <div
            style={{
              padding: "12px 24px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {pendingPhones.map((phone) => (
              <button
                key={phone.phoneNumberId}
                type="button"
                className="messages-ai-control-primary-btn"
                style={{ justifyContent: "flex-start", textAlign: "left", padding: "14px 18px" }}
                onClick={() => onSelectPhone(phone.phoneNumberId)}
                disabled={saving}
              >
                <strong style={{ display: "block" }}>
                  {phone.displayPhone || phone.phoneNumberId}
                </strong>
                <span style={{ fontWeight: 400, fontSize: 13 }}>
                  {phone.verifiedName ? `${phone.verifiedName} · ` : ""}
                  {phone.businessName || ""}
                  {phone.qualityRating && phone.qualityRating !== "UNKNOWN"
                    ? ` · Qualidade: ${phone.qualityRating}`
                    : ""}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-ai-control-overlay" onClick={onClose}>
      <div
        className="messages-ai-control-modal messages-whatsapp-config-modal"
        onClick={(event) => event.stopPropagation()}
        style={{ maxWidth: 480 }}
      >
        <div className="messages-ai-control-head">
          <div>
            <span>WhatsApp CRM</span>
            <h2>Conexão WhatsApp</h2>
          </div>
          <button type="button" className="messages-ai-control-close" onClick={onClose}>
            Fechar
          </button>
        </div>

        <div style={{ padding: "20px 24px 24px" }}>

          {/* DESCONECTADO ou ERRO → botão principal */}
          {(baileysStatus === "disconnected" || baileysStatus === "error" || baileysStatus === "banned") && (
            <button
              type="button"
              className="messages-ai-control-primary-btn"
              style={{ width: "100%", opacity: baileysLoading ? 0.6 : 1 }}
              onClick={baileysStatus === "disconnected" ? handleBaileysConnect : handleBaileysReset}
              disabled={baileysLoading}
            >
              {baileysLoading ? "Aguarde..." : baileysStatus === "disconnected" ? "Conectar WhatsApp" : "Reconectar WhatsApp"}
            </button>
          )}

          {/* CONECTANDO → aguardando QR */}
          {baileysStatus === "connecting" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={{ color: "#555", fontSize: 14 }}>⏳ Aguardando QR code...</span>
              <button
                type="button"
                style={{ background: "none", border: "none", color: "#7c3aed", fontSize: 13, cursor: "pointer", textDecoration: "underline", textAlign: "left", padding: 0 }}
                onClick={handleBaileysReset}
                disabled={baileysLoading}
              >
                Demorou? Clique para reiniciar
              </button>
            </div>
          )}

          {/* SCANNING → mostrar QR */}
          {baileysStatus === "scanning" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
              {baileysQr ? (
                <img
                  src={baileysQr}
                  alt="QR Code WhatsApp"
                  style={{ width: 220, height: 220, borderRadius: 10, border: "3px solid #e9d5ff" }}
                />
              ) : (
                <span style={{ color: "#666", fontSize: 14 }}>⏳ Gerando QR code...</span>
              )}
              <span style={{ fontSize: 13, color: "#555" }}>
                Abra o WhatsApp → <strong>Dispositivos conectados</strong> → <strong>Conectar dispositivo</strong>
              </span>
              <button
                type="button"
                style={{ background: "none", border: "none", color: "#7c3aed", fontSize: 12, cursor: "pointer", textDecoration: "underline", padding: 0 }}
                onClick={handleBaileysReset}
                disabled={baileysLoading}
              >
                Não funcionou? Gerar novo QR
              </button>
            </div>
          )}

          {/* CONECTADO */}
          {baileysStatus === "connected" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 28 }}>✅</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#166534" }}>WhatsApp Conectado</div>
                  {baileysConnectedPhone && (
                    <div style={{ fontSize: 13, color: "#555" }}>+{baileysConnectedPhone}</div>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="messages-ai-control-primary-btn"
                style={{ backgroundColor: "#dc3545" }}
                onClick={handleBaileysDisconnect}
              >
                Desconectar
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
