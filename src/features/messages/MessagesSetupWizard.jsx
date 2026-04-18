function formatCurrencyBRL(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function MessagesSetupWizard({
  open,
  whatsappStatus,
  pendingPhones = [],
  isOauthConnecting = false,
  isWhatsappSaving = false,
  canUseCrmAi = false,
  crmAiPlan = null,
  crmAiStatusLabel = "",
  isCrmAiCheckoutLoading = false,
  aiControl = null,
  onClose,
  onConnectWhatsapp,
  onSelectPhone,
  onBuyCrmAi,
  onOpenAiControl,
  onOpenWhatsappConfig,
}) {
  if (!open) return null;

  const whatsappConnected = Boolean(
    whatsappStatus?.configured || whatsappStatus?.phoneNumberId || whatsappStatus?.connected,
  );
  const oauthAvailable = Boolean(whatsappStatus?.oauthAvailable);
  const hasPendingNumberSelection = pendingPhones.length > 0;
  const connectedNumberLabel =
    whatsappStatus?.accessNumber ||
    whatsappStatus?.phoneNumberId ||
    "Numero conectado";
  const completedSteps = [
    whatsappConnected,
    whatsappConnected && !hasPendingNumberSelection,
    canUseCrmAi,
  ].filter(Boolean).length;

  return (
    <div className="messages-ai-control-overlay" onClick={onClose}>
      <div
        className="messages-ai-control-modal messages-setup-wizard-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="messages-ai-control-head">
          <div>
            <span>Primeira configuracao</span>
            <h2>Conectar WhatsApp, escolher o numero e ativar a IA</h2>
          </div>
          <button type="button" className="messages-ai-control-close" onClick={onClose}>
            Fechar
          </button>
        </div>

        <section className="messages-setup-wizard-summary">
          <div>
            <strong>{completedSteps}/3 etapas concluidas</strong>
            <span>Esse fluxo deixa o CRM pronto para conversas, agenda e automacoes.</span>
          </div>
          <button type="button" className="messages-redesign-detail-btn" onClick={onOpenWhatsappConfig}>
            Abrir configuracao completa
          </button>
        </section>

        <div className="messages-setup-wizard-steps">
          <section className={`messages-setup-wizard-step ${whatsappConnected ? "is-done" : ""}`}>
            <div className="messages-setup-wizard-index">{whatsappConnected ? "OK" : "1"}</div>
            <div className="messages-setup-wizard-body">
              <div className="messages-setup-wizard-head">
                <strong>Conectar WhatsApp</strong>
                <span>
                  {whatsappConnected
                    ? `Conectado em ${connectedNumberLabel}.`
                    : "Entre com a Meta e conecte o WhatsApp Business oficial da conta."}
                </span>
              </div>
              <div className="messages-setup-wizard-actions">
                <button
                  type="button"
                  className="messages-ai-control-primary-btn"
                  onClick={oauthAvailable ? onConnectWhatsapp : onOpenWhatsappConfig}
                  disabled={isOauthConnecting}
                >
                  {isOauthConnecting
                    ? "Abrindo Meta..."
                    : whatsappConnected
                      ? "Reconectar WhatsApp"
                      : oauthAvailable
                        ? "Conectar WhatsApp"
                        : "Abrir configuracao manual"}
                </button>
              </div>
            </div>
          </section>

          <section
            className={`messages-setup-wizard-step ${whatsappConnected && !hasPendingNumberSelection ? "is-done" : ""}`}
          >
            <div className="messages-setup-wizard-index">
              {whatsappConnected && !hasPendingNumberSelection ? "OK" : "2"}
            </div>
            <div className="messages-setup-wizard-body">
              <div className="messages-setup-wizard-head">
                <strong>Escolher o numero</strong>
                <span>
                  {hasPendingNumberSelection
                    ? "Escolha qual numero desse negocio vai responder no CRM."
                    : whatsappConnected
                      ? "O sistema ja ficou com o numero certo salvo para este estabelecimento."
                      : "Conecte o WhatsApp primeiro para liberar a escolha do numero."}
                </span>
              </div>
              {hasPendingNumberSelection ? (
                <div className="messages-setup-wizard-phone-list">
                  {pendingPhones.map((phone) => (
                    <button
                      key={phone.phoneNumberId}
                      type="button"
                      className="messages-setup-wizard-phone-btn"
                      onClick={() => onSelectPhone(phone.phoneNumberId)}
                      disabled={isWhatsappSaving}
                    >
                      <strong>{phone.displayPhone || phone.phoneNumberId}</strong>
                      <span>{phone.verifiedName || phone.businessName || "Numero do WhatsApp Business"}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="messages-setup-wizard-note">
                  {whatsappConnected
                    ? "Etapa concluida. Se houver mais de um numero no futuro, o assistente vai pedir essa escolha."
                    : "Aguardando a conexao inicial do WhatsApp."}
                </div>
              )}
            </div>
          </section>

          <section className={`messages-setup-wizard-step ${canUseCrmAi ? "is-done" : ""}`}>
            <div className="messages-setup-wizard-index">{canUseCrmAi ? "OK" : "3"}</div>
            <div className="messages-setup-wizard-body">
              <div className="messages-setup-wizard-head">
                <strong>Ativar IA CRM</strong>
                <span>
                  {canUseCrmAi
                    ? `IA liberada. Status atual: ${crmAiStatusLabel || "ativa"}.`
                    : "Libere a assinatura para automatizar resposta, triagem e agenda com regras controladas."}
                </span>
              </div>
              <div className="messages-setup-wizard-plan">
                <div>
                  <strong>{crmAiPlan?.name || "IA CRM Premium"}</strong>
                  <span>{formatCurrencyBRL(crmAiPlan?.price || 49.9)} por mes</span>
                </div>
                <div>
                  <strong>Agenda</strong>
                  <span>
                    {(aiControl?.scheduling?.allowedAgendaTypes || []).join(", ") || "Nao definida"}
                  </span>
                </div>
              </div>
              <div className="messages-setup-wizard-actions">
                <button
                  type="button"
                  className="messages-ai-control-primary-btn"
                  onClick={canUseCrmAi ? onOpenAiControl : onBuyCrmAi}
                  disabled={isCrmAiCheckoutLoading}
                >
                  {isCrmAiCheckoutLoading
                    ? "Abrindo checkout..."
                    : canUseCrmAi
                      ? "Abrir controle da IA"
                      : "Ativar IA CRM"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
