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

function normalizeConnectionErrorMessage(value = "") {
  const raw = String(value || "").trim();
  const lower = raw.toLowerCase();
  if (!raw) return "";
  if (lower.includes("connection failure") || lower.includes("code=405")) {
    return "Nao foi possivel abrir sessao QR neste servidor agora. Clique em 'Tentar novamente'.";
  }
  if (lower === "connection failure" || lower.includes("stream errored out")) {
    return "Falha na conexao com o WhatsApp. Clique em 'Tentar novamente' para gerar uma nova sessao.";
  }
  if (lower.includes("failed to initiate connection")) {
    return "Nao foi possivel iniciar a conexao com o WhatsApp agora. Tente novamente em alguns segundos.";
  }
  if (lower.includes("servidor inacess") || lower.includes("server inaccessible")) {
    return "Servidor temporariamente inacessivel. Aguarde alguns segundos e tente novamente.";
  }
  return raw;
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
  qrOnlyMode = false,
  autoStartQrToken = 0,
  oauthOnlyMode = false,
  apiRequest,
  auth,
  onClose,
  onSave,
  onTest,
  onOAuthConnect,
  onSelectPhone,
  onDisconnect,
  onActivateSimpleMode,
}) {
  const authToken = String(auth?.token || "");
  const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};
  const [draft, setDraft] = useState(() => buildDefaultConfig(config));
  const [showManual, setShowManual] = useState(false);
  const [disconnectConfirm, setDisconnectConfirm] = useState(false);
  const [baileysQr, setBaileysQr] = useState(null);
  const [baileysLoading, setBaileysLoading] = useState(false);
  const [baileysStatus, setBaileysStatus] = useState("disconnected");
  const [baileysConnectedPhone, setBaileysConnectedPhone] = useState(null);
  const [baileysPollingStart, setBaileysPollingStart] = useState(null);
  const [baileysErrorMsg, setBaileysErrorMsg] = useState(null);
  const [baileysFailCount, setBaileysFailCount] = useState(0);

  useEffect(() => {
    setDraft(buildDefaultConfig(config));
    setShowManual(false);
    setDisconnectConfirm(false);
  }, [config, open]);

  useEffect(() => {
    if (!open || oauthOnlyMode) return undefined;

    let active = true;
    async function bootstrapBaileysStatus() {
      try {
        const data = await apiRequest("/crm-baileys/status", { headers: authHeaders });
        if (!active || !data?.success) return;

        const snapshot = data.data || {};
        const nextStatus = snapshot.status || "disconnected";
        setBaileysStatus(nextStatus);
        setBaileysQr(snapshot.qrCode || null);
        setBaileysConnectedPhone(snapshot.connectedPhone || null);
        setBaileysFailCount(0);

        if (nextStatus === "error" && snapshot.lastError?.message) {
          setBaileysErrorMsg(normalizeConnectionErrorMessage(snapshot.lastError.message));
        } else {
          setBaileysErrorMsg(null);
        }
      } catch (_) {
        if (!active) return;
        setBaileysStatus("disconnected");
        setBaileysQr(null);
        setBaileysConnectedPhone(null);
      }
    }

    bootstrapBaileysStatus();
    return () => {
      active = false;
    };
  }, [open, authToken, oauthOnlyMode]);

  useEffect(() => {
    if (!open || !qrOnlyMode) return;
    if (baileysStatus !== "disconnected" && baileysStatus !== "error" && baileysStatus !== "banned") {
      return;
    }
    handleBaileysReset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, qrOnlyMode, autoStartQrToken]);

  // Poll Baileys status every 3s while connecting or scanning
  useEffect(() => {
    if (oauthOnlyMode) return;
    if (baileysStatus !== "scanning" && baileysStatus !== "connecting") return;
    let failCount = 0;
    const startTime = Date.now();

    const interval = setInterval(async () => {
      // Hard timeout after 90 seconds
      if (Date.now() - startTime > 90000) {
        setBaileysStatus("error");
        setBaileysErrorMsg("Tempo esgotado. O servidor não respondeu a tempo.");
        return;
      }
      try {
        const data = await apiRequest("/crm-baileys/status", { headers: authHeaders });
        failCount = 0;
        setBaileysFailCount(0);
        if (data.success) {
          const s = data.data.status;
          if (s) setBaileysStatus(s);
          if (data.data.qrCode) setBaileysQr(data.data.qrCode);
          if (data.data.connectedPhone) setBaileysConnectedPhone(data.data.connectedPhone);
          if (s === "connected") setBaileysQr(null);
          if (s === "error" && data.data.lastError?.message) {
            setBaileysErrorMsg(normalizeConnectionErrorMessage(data.data.lastError.message));
          }
        }
      } catch (_) {
        failCount += 1;
        setBaileysFailCount(failCount);
        // After 5 consecutive network failures, give up
        if (failCount >= 5) {
          setBaileysStatus("error");
          setBaileysErrorMsg("Servidor inacessível. Aguarde e tente novamente.");
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [baileysStatus, oauthOnlyMode]);

  async function handleBaileysConnect() {
    try {
      setBaileysLoading(true);
      setBaileysErrorMsg(null);
      setBaileysFailCount(0);
      const data = await apiRequest("/crm-baileys/connect", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ establishment: "default" }),
      });
      if (data.success) {
        setBaileysPollingStart(Date.now());
        setBaileysQr(data.data.qrCode || null);
        setBaileysStatus(data.data.status || (data.data.qrCode ? "scanning" : "connecting"));
        if (data.data.lastError?.message) {
          setBaileysErrorMsg(normalizeConnectionErrorMessage(data.data.lastError.message));
        }
      } else {
        setBaileysStatus("error");
        setBaileysErrorMsg(
          normalizeConnectionErrorMessage(data.error || data.message || "Erro desconhecido"),
        );
      }
    } catch (error) {
      setBaileysStatus("error");
      setBaileysErrorMsg("Servidor inacessível. Aguarde e tente novamente.");
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

  if (oauthOnlyMode) {
    return (
      <div className="messages-ai-control-overlay" onClick={onClose}>
        <div
          className="messages-ai-control-modal messages-whatsapp-config-modal"
          onClick={(event) => event.stopPropagation()}
          style={{ maxWidth: 520 }}
        >
          <div className="messages-ai-control-head">
            <div>
              <span>WhatsApp CRM</span>
              <h2>Conexao oficial</h2>
            </div>
            <button type="button" className="messages-ai-control-close" onClick={onClose}>
              Fechar
            </button>
          </div>

          <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 14, color: "#4b5563" }}>
              Fluxo simples: clique em conectar, autorize na Meta e volte para o sistema.
            </div>

            {!oauthAvailable ? (
              <div style={{ fontSize: 13, color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 12px" }}>
                Integracao oficial ainda nao ativada no servidor. Configure META_APP_ID e META_APP_SECRET.
              </div>
            ) : null}

            {hasTokenError ? (
              <div style={{ fontSize: 13, color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px" }}>
                {status?.tokenErrorMessage || "A conexao expirou. Clique em conectar novamente."}
              </div>
            ) : null}

            {feedback ? (
              <div style={{ fontSize: 13, color: "#374151", background: "#f3f4f6", borderRadius: 8, padding: "10px 12px" }}>
                {feedback}
              </div>
            ) : null}

            <button
              type="button"
              className="messages-ai-control-primary-btn"
              style={{ width: "100%", opacity: isOauthConnecting || !oauthAvailable ? 0.7 : 1 }}
              onClick={onOAuthConnect}
              disabled={isOauthConnecting || !oauthAvailable}
            >
              {isOauthConnecting ? "Abrindo Meta..." : "Conectar WhatsApp"}
            </button>

            {typeof onActivateSimpleMode === "function" ? (
              <button
                type="button"
                className="messages-ai-control-secondary-btn"
                style={{ width: "100%" }}
                onClick={onActivateSimpleMode}
                disabled={saving}
              >
                Usar modo simples agora
              </button>
            ) : null}

            {connectedViaOAuth && typeof onDisconnect === "function" ? (
              <button
                type="button"
                className="messages-ai-control-primary-btn"
                style={{ width: "100%", background: "#64748b" }}
                onClick={onDisconnect}
                disabled={saving}
              >
                Desconectar
              </button>
            ) : null}

            <div style={{ marginTop: 4, display: "grid", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <strong>Configurado</strong>
                <span>{isConnected ? "Sim" : "Nao"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <strong>Recebendo mensagens</strong>
                <span>{receivingMessages ? "Sim" : "Nao"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <strong>Ultimo webhook</strong>
                <span>{lastWebhookLabel}</span>
              </div>
            </div>

            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Se a Meta nao devolver um numero agora, voce ainda pode usar o CRM com WhatsApp simples por link e registrar o historico no sistema.
            </div>
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

          {/* DESCONECTADO → botão conectar */}
          {baileysStatus === "disconnected" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                type="button"
                className="messages-ai-control-primary-btn"
                style={{ width: "100%", opacity: baileysLoading ? 0.6 : 1 }}
                onClick={handleBaileysConnect}
                disabled={baileysLoading}
              >
                {baileysLoading ? "Aguarde..." : "Conectar por QR"}
              </button>
              {!qrOnlyMode && typeof onOAuthConnect === "function" && (
                <button
                  type="button"
                  className="messages-ai-control-primary-btn"
                  style={{
                    width: "100%",
                    background: "#16a34a",
                    opacity: isOauthConnecting ? 0.7 : 1,
                  }}
                  onClick={onOAuthConnect}
                  disabled={isOauthConnecting}
                >
                  {isOauthConnecting ? "Abrindo Meta..." : "Conectar pela Meta (sem QR)"}
                </button>
              )}
            </div>
          )}

          {/* ERRO ou BANIDO → mostrar motivo + botão reconectar */}
          {(baileysStatus === "error" || baileysStatus === "banned") && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {baileysErrorMsg && (
                <div style={{ fontSize: 12, color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "8px 12px" }}>
                  {baileysErrorMsg}
                </div>
              )}
              <button
                type="button"
                className="messages-ai-control-primary-btn"
                style={{ width: "100%", opacity: baileysLoading ? 0.6 : 1 }}
                onClick={handleBaileysReset}
                disabled={baileysLoading}
              >
                {baileysLoading ? "Aguarde..." : "Tentar novamente"}
              </button>
              {!qrOnlyMode && typeof onOAuthConnect === "function" && (
                <button
                  type="button"
                  className="messages-ai-control-primary-btn"
                  style={{
                    width: "100%",
                    background: "#16a34a",
                    opacity: isOauthConnecting ? 0.7 : 1,
                  }}
                  onClick={onOAuthConnect}
                  disabled={isOauthConnecting}
                >
                  {isOauthConnecting ? "Abrindo Meta..." : "Conectar pela Meta (sem QR)"}
                </button>
              )}
            </div>
          )}

          {/* CONECTANDO → aguardando QR */}
          {baileysStatus === "connecting" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={{ color: "#555", fontSize: 14 }}>⏳ Aguardando QR code...</span>
              {baileysFailCount > 0 && (
                <span style={{ fontSize: 12, color: "#b45309" }}>
                  Servidor acordando... ({baileysFailCount} tentativa{baileysFailCount > 1 ? "s" : ""})
                </span>
              )}
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
