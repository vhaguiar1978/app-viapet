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
  onClose,
  onSave,
  onTest,
}) {
  const [draft, setDraft] = useState(() => buildDefaultConfig(config));

  useEffect(() => {
    setDraft(buildDefaultConfig(config));
  }, [config, open]);

  const setupSteps = useMemo(
    () => [
      {
        label: "Phone Number ID",
        where: "Meta > WhatsApp Manager > API Setup > Phone number ID",
      },
      {
        label: "Business Account ID",
        where: "Meta > WhatsApp Manager > API Setup > WhatsApp Business Account ID",
      },
      {
        label: "Access Token",
        where: "Meta > API Setup > Permanent Access Token",
      },
      {
        label: "Verify Token",
        where: "Crie um texto seu e use o mesmo valor na configuracao do webhook da Meta",
      },
    ],
    [],
  );

  if (!open) return null;

  function updateField(field, nextValue) {
    setDraft((current) => ({
      ...current,
      [field]: nextValue,
    }));
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

  return (
    <div className="messages-ai-control-overlay" onClick={onClose}>
      <div
        className="messages-ai-control-modal messages-whatsapp-config-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="messages-ai-control-head">
          <div>
            <span>WhatsApp CRM</span>
            <h2>Conectar numero da Meta</h2>
          </div>
          <button
            type="button"
            className="messages-ai-control-close"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>

        {feedback ? (
          <div className="messages-ai-control-feedback">{feedback}</div>
        ) : null}

        <div className="messages-ai-control-grid messages-whatsapp-config-grid">
          <section className="messages-ai-control-card">
            <div className="messages-ai-control-section-head">
              <strong>Dados da Meta</strong>
              <span>Cole aqui as informacoes do WhatsApp Cloud API</span>
            </div>

            <div className="messages-ai-control-fields">
              <label>
                <span>Provider</span>
                <input value={draft.provider} onChange={(event) => updateField("provider", event.target.value)} />
              </label>
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
                  onChange={(event) => updateField("businessAccountId", event.target.value)}
                  placeholder="Ex.: 109876543210987"
                />
                <small>Meta &gt; API Setup &gt; WhatsApp Business Account ID</small>
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
                <small>Use exatamente o mesmo token no webhook da Meta</small>
              </label>
              <label>
                <span>Codigo do pais padrao</span>
                <input
                  value={draft.defaultCountryCode}
                  onChange={(event) => updateField("defaultCountryCode", event.target.value)}
                  placeholder="55"
                />
                <small>Brasil normalmente usa 55</small>
              </label>
            </div>

            <div className="messages-ai-control-fields">
              <label>
                <span>Access Token</span>
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
                  {draft.accessTokenPreview ? ` • atual: ${draft.accessTokenPreview}` : ""}
                </small>
              </label>
            </div>

            <div className="messages-whatsapp-config-webhook-box">
              <strong>Webhook que voce deve cadastrar na Meta</strong>
              <div>
                <span>URL</span>
                <code>{draft.webhookUrl || "Defina a URL publica do backend para receber mensagens"}</code>
              </div>
              <div>
                <span>Caminho</span>
                <code>{draft.webhookPath}</code>
              </div>
            </div>
          </section>

          <section className="messages-ai-control-card">
            <div className="messages-ai-control-section-head">
              <strong>Status da conexao</strong>
              <span>Teste antes de usar no CRM</span>
            </div>

            <div className="messages-whatsapp-config-status-grid">
              <article className="messages-whatsapp-status-card">
                <span>Configurado</span>
                <strong>{status?.configured ? "Sim" : "Nao"}</strong>
              </article>
              <article className="messages-whatsapp-status-card">
                <span>Webhook ativo</span>
                <strong>{status?.connected ? "Sim" : "Nao"}</strong>
              </article>
              <article className="messages-whatsapp-status-card">
                <span>Ultimo webhook</span>
                <strong>{formatDateTime(status?.lastWebhookAt)}</strong>
              </article>
              <article className="messages-whatsapp-status-card">
                <span>Mensagens 7 dias</span>
                <strong>{Number(status?.recentMessages || 0)}</strong>
              </article>
            </div>

            <div className="messages-whatsapp-config-help">
              <strong>Onde colar cada dado da Meta</strong>
              <ul>
                {setupSteps.map((item) => (
                  <li key={item.label}>
                    <span>{item.label}</span>
                    <small>{item.where}</small>
                  </li>
                ))}
              </ul>
            </div>

            {testResult ? (
              <div className="messages-ai-control-result">
                <strong>Teste da Meta concluido</strong>
                <ul>
                  <li>Numero reconhecido: {testResult.displayPhoneNumber || draft.phoneNumberId || "Nao informado"}</li>
                  <li>Nome verificado: {testResult.verifiedName || "Nao retornado"}</li>
                  <li>Qualidade: {testResult.qualityRating || "Nao informada"}</li>
                </ul>
              </div>
            ) : null}

            {loading ? (
              <div className="messages-redesign-detail-note">
                Carregando configuracao do WhatsApp...
              </div>
            ) : null}
          </section>
        </div>

        <div className="messages-ai-control-footer">
          <button
            type="button"
            className="messages-ai-control-secondary-btn"
            onClick={onTest}
            disabled={testing || loading}
          >
            {testing ? "Testando..." : "Testar conexao"}
          </button>
          <button
            type="button"
            className="messages-ai-control-primary-btn"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? "Salvando..." : "Salvar configuracao"}
          </button>
        </div>
      </div>
    </div>
  );
}

