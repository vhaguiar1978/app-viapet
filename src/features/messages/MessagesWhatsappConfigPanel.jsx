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
      >
        <div className="messages-ai-control-head">
          <div>
            <span>WhatsApp CRM</span>
            <h2>{isConnected ? "Numero conectado" : "Conectar WhatsApp"}</h2>
          </div>
          <button type="button" className="messages-ai-control-close" onClick={onClose}>
            Fechar
          </button>
        </div>

        {feedback ? <div className="messages-ai-control-feedback">{feedback}</div> : null}
        {hasTokenError ? (
          <div className="messages-ai-control-feedback">
            {status?.tokenErrorMessage ||
              "A conexao com a Meta expirou. Reconecte o WhatsApp para voltar a receber mensagens."}
          </div>
        ) : null}

        <div className="messages-ai-control-grid messages-whatsapp-config-grid">
          <section className="messages-ai-control-card">
            {isConnected ? (
              <div className="messages-whatsapp-connected-state">
                <div className="messages-whatsapp-connected-badge">
                  <span className="messages-whatsapp-connected-dot" />
                  <strong>Conectado</strong>
                </div>
                <div className="messages-whatsapp-connected-info">
                  <div>
                    <span>Numero</span>
                    <strong>{status?.phoneNumberId || config?.phoneNumberId || "-"}</strong>
                  </div>
                  <div>
                    <span>Metodo</span>
                    <strong>{connectedViaOAuth ? "Meta automatica" : "Configuracao manual"}</strong>
                  </div>
                  {oauthConnectedAt ? (
                    <div>
                      <span>Conectado em</span>
                      <strong>{formatDateTime(oauthConnectedAt)}</strong>
                    </div>
                  ) : null}
                </div>

                {oauthAvailable ? (
                  <button
                    type="button"
                    className="messages-whatsapp-oauth-btn"
                    onClick={onOAuthConnect}
                    disabled={isOauthConnecting}
                  >
                    {isOauthConnecting ? "Abrindo Meta..." : "Trocar numero"}
                  </button>
                ) : null}

                {disconnectConfirm ? (
                  <div className="messages-whatsapp-disconnect-confirm">
                    <p>Tem certeza? O estabelecimento vai parar de receber mensagens.</p>
                    <div>
                      <button
                        type="button"
                        className="messages-ai-control-secondary-btn"
                        onClick={() => setDisconnectConfirm(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="messages-whatsapp-disconnect-btn"
                        onClick={() => {
                          setDisconnectConfirm(false);
                          onDisconnect();
                        }}
                      >
                        Sim, desconectar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="messages-whatsapp-disconnect-link"
                    onClick={() => setDisconnectConfirm(true)}
                  >
                    Desconectar WhatsApp
                  </button>
                )}
              </div>
            ) : (
              <>
                {hasTokenError ? (
                  <div className="messages-whatsapp-oauth-block">
                    <div className="messages-ai-control-section-head">
                      <strong>Reconectar com a Meta</strong>
                      <span>
                        Sua conexao antiga expirou. Clique abaixo para entrar novamente na Meta e escolher o numero.
                      </span>
                    </div>
                    <button
                      type="button"
                      className="messages-whatsapp-oauth-btn messages-whatsapp-oauth-btn--primary"
                      onClick={onOAuthConnect}
                      disabled={isOauthConnecting || loading}
                    >
                      {isOauthConnecting ? "Abrindo Meta..." : "Reconectar com WhatsApp Business"}
                    </button>
                  </div>
                ) : null}

                {oauthAvailable && !hasTokenError ? (
                  <div className="messages-whatsapp-oauth-block">
                    <div className="messages-ai-control-section-head">
                      <strong>Conectar com a Meta</strong>
                      <span>
                        Faca login, escolha o negocio e selecione o numero. O sistema faz a
                        conexao principal para voce.
                      </span>
                    </div>
                    <button
                      type="button"
                      className="messages-whatsapp-oauth-btn messages-whatsapp-oauth-btn--primary"
                      onClick={onOAuthConnect}
                      disabled={isOauthConnecting || loading}
                    >
                      {isOauthConnecting
                        ? "Aguardando login na Meta..."
                        : "Conectar com WhatsApp Business"}
                    </button>
                    <p className="messages-whatsapp-oauth-hint">
                      Vai abrir uma janela da Meta. Entre com sua conta, escolha seu negocio e
                      confirme o numero.
                    </p>
                  </div>
                ) : (
                  <div className="messages-whatsapp-simple-badge" style={{ marginBottom: 16 }}>
                    <strong>Configuracao manual</strong>
                    <span>Preencha os dados abaixo para conectar via Meta Cloud API.</span>
                  </div>
                )}

                {oauthAvailable ? (
                  <div className="messages-whatsapp-manual-toggle-row">
                    <div className="messages-whatsapp-simple-intro">
                      <div className="messages-whatsapp-simple-badge">
                        <strong>Modo simples</strong>
                        <span>
                          Para a maioria dos usuarios, basta conectar pela Meta e escolher o
                          numero.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="messages-whatsapp-advanced-toggle"
                      onClick={() => setShowManual((value) => !value)}
                    >
                      {showManual
                        ? "Ocultar configuracao tecnica"
                        : "Mostrar configuracao tecnica (suporte)"}
                    </button>
                  </div>
                ) : null}

                {showAdvancedSection ? (
                  <>
                    <div className="messages-whatsapp-advanced-warning">
                      <strong>Area tecnica</strong>
                      <span>
                        Use esta parte apenas se a conexao automatica da Meta nao resolver ou
                        se o suporte pedir.
                      </span>
                    </div>

                    <div className="messages-whatsapp-onboarding-list" style={{ marginBottom: 16 }}>
                      {onboardingSteps.map((step) => (
                        <article
                          key={step.key}
                          className={`messages-whatsapp-onboarding-step${step.done ? " is-done" : ""}`}
                        >
                          <div className="messages-whatsapp-onboarding-check" aria-hidden="true">
                            {step.done ? "OK" : step.key === "token" ? "2" : step.key === "webhook" ? "3" : "1"}
                          </div>
                          <div>
                            <strong>{step.title}</strong>
                          </div>
                        </article>
                      ))}
                    </div>

                    <div className="messages-ai-control-fields two messages-whatsapp-config-fields">
                      <label>
                        <span>Phone Number ID</span>
                        <input
                          value={draft.phoneNumberId}
                          onChange={(event) => updateField("phoneNumberId", event.target.value)}
                          placeholder="Ex.: 123456789012345"
                        />
                        <small>Meta &gt; API Setup &gt; Phone number ID</small>
                      </label>
                      <label>
                        <span>Business Account ID</span>
                        <input
                          value={draft.businessAccountId}
                          onChange={(event) =>
                            updateField("businessAccountId", event.target.value)
                          }
                          placeholder="Ex.: 109876543210987"
                        />
                        <small>Meta &gt; API Setup &gt; WhatsApp Business Account ID</small>
                      </label>
                    </div>

                    <div className="messages-ai-control-fields">
                      <label>
                        <span className="messages-whatsapp-token-label">
                          <span>Access Token</span>
                          {draft.accessTokenConfigured ? (
                            <strong className="messages-whatsapp-token-saved">Token salvo</strong>
                          ) : null}
                        </span>
                        {draft.accessTokenConfigured ? (
                          <small className="messages-whatsapp-token-hint">
                            Token salvo no servidor. Preencha so se quiser trocar.
                          </small>
                        ) : null}
                        <input
                          type="password"
                          value={draft.accessToken}
                          onChange={(event) => updateField("accessToken", event.target.value)}
                          placeholder={
                            draft.accessTokenConfigured
                              ? "Ja existe token salvo. Preencha so se quiser trocar."
                              : "Cole aqui o token permanente da Meta"
                          }
                        />
                        <small>
                          Meta &gt; API Setup &gt; Permanent Access Token
                          {draft.accessTokenPreview ? ` · atual: ${draft.accessTokenPreview}` : ""}
                        </small>
                      </label>
                    </div>

                    <div className="messages-ai-control-fields two messages-whatsapp-config-fields">
                      <label>
                        <span>Verify Token</span>
                        <input
                          value={draft.verifyToken}
                          onChange={(event) => updateField("verifyToken", event.target.value)}
                          placeholder="Crie um token seu"
                        />
                        <small>Use o mesmo valor no webhook da Meta</small>
                      </label>
                      <label>
                        <span>Codigo do pais padrao</span>
                        <input
                          value={draft.defaultCountryCode}
                          onChange={(event) =>
                            updateField("defaultCountryCode", event.target.value)
                          }
                          placeholder="55"
                        />
                        <small>Brasil usa 55</small>
                      </label>
                    </div>

                    <div className="messages-whatsapp-config-webhook-box">
                      <strong>URL do webhook - cadastre na Meta</strong>
                      <p className="messages-whatsapp-config-webhook-note">
                        Use o mesmo Verify Token no ViaPet e na Meta. Depois assine o campo{" "}
                        <code>messages</code>.
                      </p>
                      <div>
                        <span>URL</span>
                        <code>
                          {draft.webhookUrl || "Defina a URL publica do backend na variavel URL"}
                        </code>
                      </div>
                    </div>
                  </>
                ) : null}
              </>
            )}
          </section>

          <section className="messages-ai-control-card" style={{ backgroundColor: "#f9f5ff", borderLeft: "4px solid #7c3aed" }}>
            <h3 style={{ color: "#7c3aed", marginBottom: 12 }}>🔗 Baileys WhatsApp (BETA)</h3>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>Conecte via QR Code — sem precisar de conta Meta Business. Máximo 60 mensagens/hora.</p>

            {baileysStatus === "disconnected" ? (
              <button
                type="button"
                style={{
                  backgroundColor: "#7c3aed",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: 6,
                  cursor: baileysLoading ? "not-allowed" : "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  opacity: baileysLoading ? 0.6 : 1,
                }}
                onClick={handleBaileysConnect}
                disabled={baileysLoading}
              >
                {baileysLoading ? "⏳ Iniciando conexão..." : "📱 Conectar WhatsApp"}
              </button>
            ) : baileysStatus === "scanning" ? (
              <div style={{ textAlign: "center" }}>
                {baileysQr ? (
                  <>
                    <img
                      src={baileysQr}
                      alt="QR Code WhatsApp"
                      style={{ width: 220, height: 220, marginBottom: 10, border: "2px solid #e9d5ff", borderRadius: 8 }}
                    />
                    <p style={{ color: "#555", fontSize: 13, marginBottom: 8 }}>
                      📱 Abra o WhatsApp no celular &rarr; <strong>Dispositivos conectados</strong> &rarr; <strong>Conectar dispositivo</strong>
                    </p>
                  </>
                ) : (
                  <div style={{ color: "#666", fontSize: 13, padding: "16px 0" }}>
                    ⏳ Gerando QR code...
                  </div>
                )}
                <button
                  type="button"
                  style={{ background: "none", border: "none", color: "#7c3aed", fontSize: 12, cursor: "pointer", textDecoration: "underline", marginTop: 4 }}
                  onClick={handleBaileysReset}
                  disabled={baileysLoading}
                >
                  Problemas? Resetar e tentar novamente
                </button>
              </div>
            ) : baileysStatus === "connecting" ? (
              <div style={{ color: "#666", fontSize: 13 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>⏳</span>
                  <strong>Conectando ao WhatsApp...</strong>
                </div>
                <div style={{ fontSize: 12, color: "#999", marginBottom: 12 }}>O QR code vai aparecer aqui em até 30 segundos.</div>
                <button
                  type="button"
                  style={{ background: "none", border: "none", color: "#7c3aed", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
                  onClick={handleBaileysReset}
                  disabled={baileysLoading}
                >
                  Demorou demais? Clique para resetar e reconectar
                </button>
              </div>
            ) : baileysStatus === "connected" ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>✅</span>
                  <strong style={{ color: "#166534" }}>WhatsApp Conectado</strong>
                </div>
                {baileysConnectedPhone && (
                  <p style={{ fontSize: 13, color: "#555", marginBottom: 14 }}>
                    Número: <strong>+{baileysConnectedPhone}</strong>
                  </p>
                )}
                <button
                  type="button"
                  style={{
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                  onClick={handleBaileysDisconnect}
                >
                  Desconectar
                </button>
              </div>
            ) : baileysStatus === "banned" ? (
              <div style={{ fontSize: 13 }}>
                <div style={{ color: "#dc3545", marginBottom: 8 }}>🚨 <strong>Conta banida ou suspeita</strong></div>
                <p style={{ color: "#666", marginBottom: 12 }}>
                  O número pode estar temporariamente bloqueado pelo WhatsApp. Aguarde 24h antes de tentar novamente.
                </p>
                <button
                  type="button"
                  style={{
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                  onClick={handleBaileysReset}
                >
                  Resetar conexão
                </button>
              </div>
            ) : baileysStatus === "error" ? (
              <div style={{ fontSize: 13 }}>
                <div style={{ color: "#dc3545", marginBottom: 8 }}>❌ <strong>Falha na conexão</strong></div>
                <p style={{ color: "#666", marginBottom: 12 }}>
                  Não foi possível conectar. Clique em "Resetar e Conectar" para limpar o estado e tentar do zero.
                </p>
                <button
                  type="button"
                  style={{
                    backgroundColor: "#7c3aed",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: 6,
                    cursor: baileysLoading ? "not-allowed" : "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    opacity: baileysLoading ? 0.6 : 1,
                  }}
                  onClick={handleBaileysReset}
                  disabled={baileysLoading}
                >
                  {baileysLoading ? "⏳ Resetando..." : "🔄 Resetar e Conectar"}
                </button>
              </div>
            ) : null}
          </section>

          <section className="messages-ai-control-card">
            <div className="messages-ai-control-section-head">
              <strong>Status da conexao</strong>
              <span>Verifique antes de usar</span>
            </div>

            <div className="messages-whatsapp-config-status-grid">
              <article className="messages-whatsapp-status-card">
                <span>Configurado</span>
                <strong>{status?.configured ? "Sim" : "Nao"}</strong>
              </article>
              <article className="messages-whatsapp-status-card">
                <span>Recebendo mensagens</span>
                <strong>{receivingMessages ? "Sim" : "Nao"}</strong>
              </article>
              <article className="messages-whatsapp-status-card">
                <span>Ultima atividade</span>
                <strong>{lastWebhookLabel}</strong>
              </article>
              <article className="messages-whatsapp-status-card">
                <span>Mensagens (7 dias)</span>
                <strong>{Number(status?.recentMessages || 0)}</strong>
              </article>
            </div>

            {testResult ? (
              <div className="messages-ai-control-result">
                <strong>Teste da Meta concluido</strong>
                <ul>
                  <li>Numero: {testResult.displayPhoneNumber || "-"}</li>
                  <li>Nome verificado: {testResult.verifiedName || "-"}</li>
                  <li>Qualidade: {testResult.qualityRating || "-"}</li>
                </ul>
              </div>
            ) : null}

            {loading ? (
              <div className="messages-redesign-detail-note">Carregando configuracao...</div>
            ) : null}

            {(!oauthAvailable || showManual || (isConnected && !connectedViaOAuth)) ? (
              <button
                type="button"
                className="messages-ai-control-secondary-btn"
                style={{ marginTop: 12 }}
                onClick={onTest}
                disabled={testing || loading}
              >
                {testing ? "Testando..." : "Testar conexao com a Meta"}
              </button>
            ) : null}
          </section>
        </div>

        {showAdvancedSection && !isConnected ? (
          <div className="messages-ai-control-footer">
            <button
              type="button"
              className="messages-ai-control-primary-btn"
              onClick={handleSave}
              disabled={saving || loading}
            >
              {saving ? "Salvando..." : "Salvar configuracao"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
