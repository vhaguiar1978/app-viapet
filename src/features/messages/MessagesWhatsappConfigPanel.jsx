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
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setDraft(buildDefaultConfig(config));
    setShowAdvanced(false);
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

  const onboardingSteps = useMemo(
    () => [
      {
        key: "meta",
        title: "1. Dados da Meta",
        description: "Preencha Phone Number ID, Business Account ID e o token do numero.",
        done: Boolean(draft.phoneNumberId && draft.businessAccountId),
      },
      {
        key: "save",
        title: "2. Salvar no ViaPet",
        description: draft.accessTokenConfigured
          ? "Token salvo com seguranca no servidor. So preencha de novo se quiser trocar."
          : "Cole o Access Token e clique em Salvar configuracao.",
        done: Boolean(draft.accessTokenConfigured),
      },
      {
        key: "webhook",
        title: "3. Confirmar webhook da Meta",
        description: status?.connected
          ? "Webhook validado e recebendo eventos."
          : "Na Meta, use a URL do webhook abaixo e assine o campo messages.",
        done: Boolean(status?.connected),
      },
    ],
    [
      draft.phoneNumberId,
      draft.businessAccountId,
      draft.accessTokenConfigured,
      status?.connected,
    ],
  );

  const completedSteps = onboardingSteps.filter((step) => step.done).length;
  const webhookReady = Boolean(draft.verifyToken && draft.webhookUrl && status?.configured);
  const lastWebhookLabel = status?.lastWebhookAt
    ? formatDateTime(status?.lastWebhookAt)
    : "Aguardando primeiro evento";

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

        <section className="messages-whatsapp-onboarding-card">
          <div className="messages-whatsapp-onboarding-head">
            <div>
              <strong>Primeira configuracao do CRM</strong>
              <span>O caminho principal hoje e conectar pela Meta. O QR entra como segunda etapa depois.</span>
            </div>
            <div className="messages-whatsapp-onboarding-progress">
              <strong>{completedSteps}/3</strong>
              <span>etapas prontas</span>
            </div>
          </div>
          <div className="messages-whatsapp-connection-modes">
            <article className="messages-whatsapp-mode-card active">
              <strong>Meta oficial</strong>
              <p>Mais estavel para producao e para vender para clientes.</p>
            </article>
            <article className="messages-whatsapp-mode-card">
              <strong>Modo QR</strong>
              <p>Vai entrar depois como conexao rapida, usando este CRM como espelho.</p>
            </article>
          </div>
          <div className="messages-whatsapp-onboarding-list">
            {onboardingSteps.map((step) => (
              <article
                key={step.key}
                className={`messages-whatsapp-onboarding-step${step.done ? " is-done" : ""}`}
              >
                <div className="messages-whatsapp-onboarding-check" aria-hidden="true">
                  {step.done ? "OK" : step.key === "save" ? "2" : step.key === "webhook" ? "3" : "1"}
                </div>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="messages-ai-control-grid messages-whatsapp-config-grid">
          <section className="messages-ai-control-card">
            <div className="messages-ai-control-section-head">
              <strong>Conectar WhatsApp</strong>
              <span>Preencha so o necessario para ligar o numero e comecar a usar</span>
            </div>

            <div className="messages-whatsapp-simple-intro">
              <div className="messages-whatsapp-simple-badge">
                <strong>Modo simples</strong>
                <span>Deixe os campos tecnicos escondidos para o usuario final.</span>
              </div>
              <button
                type="button"
                className="messages-whatsapp-advanced-toggle"
                onClick={() => setShowAdvanced((current) => !current)}
              >
                {showAdvanced ? "Ocultar campos tecnicos" : "Mostrar campos tecnicos"}
              </button>
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
                    Token salvo no servidor. O campo fica vazio depois de salvar por seguranca.
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
                  {draft.accessTokenPreview ? ` • atual: ${draft.accessTokenPreview}` : ""}
                </small>
              </label>
            </div>

            {showAdvanced ? (
              <>
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
                    <span>Provider</span>
                    <input value={draft.provider} onChange={(event) => updateField("provider", event.target.value)} />
                  </label>
                </div>
              </>
            ) : (
              <div className="messages-whatsapp-simple-meta">
                <div>
                  <span>Verify Token</span>
                  <strong>{draft.verifyToken || "genius"}</strong>
                </div>
                <div>
                  <span>Codigo do pais</span>
                  <strong>{draft.defaultCountryCode || "55"}</strong>
                </div>
                <div>
                  <span>Provider</span>
                  <strong>{draft.provider || "WhatsApp Cloud API"}</strong>
                </div>
              </div>
            )}

            <div className="messages-whatsapp-config-webhook-box">
              <strong>Webhook que voce deve cadastrar na Meta</strong>
              <p className="messages-whatsapp-config-webhook-note">
                Use o mesmo Verify Token no ViaPet e na Meta. Depois assine o campo <code>messages</code>.
              </p>
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
                <span>Webhook pronto</span>
                <strong>{webhookReady ? "Sim" : "Nao"}</strong>
              </article>
              <article className="messages-whatsapp-status-card">
                <span>Ultimo webhook recebido</span>
                <strong>{lastWebhookLabel}</strong>
              </article>
              <article className="messages-whatsapp-status-card">
                <span>Mensagens 7 dias</span>
                <strong>{Number(status?.recentMessages || 0)}</strong>
              </article>
            </div>

            <div className="messages-whatsapp-config-help">
              <strong>Onde colar cada dado da Meta</strong>
              <p className="messages-whatsapp-config-help-note">
                Se o webhook estiver pronto mas ainda sem data, isso so significa que a Meta ainda nao enviou o primeiro evento para este numero.
              </p>
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
