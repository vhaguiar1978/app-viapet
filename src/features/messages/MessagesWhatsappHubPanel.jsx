import { useEffect, useMemo, useState } from "react";

const TAB_ITEMS = [
  { id: "config", label: "Configuracao" },
  { id: "templates", label: "Modelos de mensagem" },
  { id: "conversations", label: "Conversas" },
];

const DEFAULT_CONNECTION = {
  integrationMode: "simple",
  status: "ready",
  businessId: "",
  businessName: "",
  wabaId: "",
  phoneNumberId: "",
  businessPhone: "",
  verifyToken: "genius",
  accessTokenConfigured: false,
  webhookVerified: false,
  lastEventAt: null,
  lastError: "",
  connectedAt: null,
};

const DEFAULT_TEMPLATE_DRAFT = {
  id: "",
  title: "",
  templateName: "",
  category: "",
  body: "",
  active: true,
};

function formatDateTime(value) {
  if (!value) return "Ainda nao registrado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Ainda nao registrado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function buildTemplateSlug(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function originLabel(value = "") {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "link") return "WhatsApp simples";
  if (normalized === "api") return "WhatsApp API";
  return "CRM";
}

export function MessagesWhatsappHubPanel({
  apiRequest,
  auth,
  onConnectOfficial,
}) {
  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${auth?.token || ""}`,
    }),
    [auth?.token],
  );
  const [activeTab, setActiveTab] = useState("config");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [connection, setConnection] = useState(DEFAULT_CONNECTION);
  const [draft, setDraft] = useState(DEFAULT_CONNECTION);
  const [templates, setTemplates] = useState([]);
  const [activity, setActivity] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [logs, setLogs] = useState([]);
  const [templateDraft, setTemplateDraft] = useState(DEFAULT_TEMPLATE_DRAFT);

  async function loadOverview() {
    if (!auth?.token || typeof apiRequest !== "function") {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest("/api/whatsapp-hub/overview", {
        headers: authHeaders,
      });
      const nextConnection = {
        ...DEFAULT_CONNECTION,
        ...(response?.data?.connection || {}),
      };
      setConnection(nextConnection);
      setDraft(nextConnection);
      setTemplates(Array.isArray(response?.data?.templates) ? response.data.templates : []);
      setActivity(Array.isArray(response?.data?.activity) ? response.data.activity : []);
      setInbox(Array.isArray(response?.data?.inbox) ? response.data.inbox : []);
      setLogs(Array.isArray(response?.data?.logs) ? response.data.logs : []);
      setFeedback("");
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel carregar a central do WhatsApp.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.token]);

  async function handleSaveConfig() {
    try {
      setSaving(true);
      const payload = {
        integrationMode: draft.integrationMode,
        businessId: draft.businessId,
        businessName: draft.businessName,
        wabaId: draft.wabaId,
        phoneNumberId: draft.phoneNumberId,
        businessPhone: draft.businessPhone,
        verifyToken: draft.verifyToken,
      };

      if (draft.accessToken) {
        payload.accessToken = draft.accessToken;
      }

      const response = await apiRequest("/api/whatsapp-hub/config", {
        method: "PUT",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      setConnection({
        ...DEFAULT_CONNECTION,
        ...(response?.data || response?.data?.data || response?.data?.connection || response?.data || {}),
      });
      setFeedback("Configuracao do WhatsApp salva com sucesso.");
      await loadOverview();
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel salvar a configuracao.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    try {
      setSaving(true);
      await apiRequest("/api/whatsapp-hub/config/disconnect", {
        method: "POST",
        headers: authHeaders,
      });
      setFeedback("WhatsApp desconectado com sucesso.");
      await loadOverview();
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel desconectar o WhatsApp.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveTemplate() {
    const nextTitle = String(templateDraft.title || "").trim();
    const nextBody = String(templateDraft.body || "").trim();
    if (!nextTitle || !nextBody) {
      setFeedback("Preencha pelo menos o titulo e a mensagem do modelo.");
      return;
    }

    try {
      setSaving(true);
      await apiRequest("/api/whatsapp-hub/templates", {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: templateDraft.id || undefined,
          title: nextTitle,
          templateName: buildTemplateSlug(templateDraft.templateName || nextTitle),
          category: templateDraft.category,
          body: nextBody,
          active: templateDraft.active,
          variables: [
            "{nome_cliente}",
            "{nome_pet}",
            "{data_agendamento}",
            "{hora_agendamento}",
            "{valor}",
            "{nome_empresa}",
          ],
        }),
      });
      setTemplateDraft(DEFAULT_TEMPLATE_DRAFT);
      setFeedback("Modelo salvo com sucesso.");
      await loadOverview();
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel salvar o modelo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTemplate(templateId) {
    try {
      setSaving(true);
      await apiRequest(`/api/whatsapp-hub/templates/${templateId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      setFeedback("Modelo removido com sucesso.");
      if (String(templateDraft.id) === String(templateId)) {
        setTemplateDraft(DEFAULT_TEMPLATE_DRAFT);
      }
      await loadOverview();
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel remover o modelo.");
    } finally {
      setSaving(false);
    }
  }

  function renderConfigTab() {
    const isSimple = draft.integrationMode === "simple";
    const isApi = draft.integrationMode === "api";
    return (
      <div className="messages-redesign-module-grid two">
        <section className="messages-redesign-module-card">
          <div className="messages-redesign-module-card-head">
            <strong>Modo de uso</strong>
          </div>
          <div className="messages-redesign-filter-chips">
            <button
              type="button"
              className={isSimple ? "messages-redesign-filter-chip active" : "messages-redesign-filter-chip"}
              onClick={() => setDraft((current) => ({ ...current, integrationMode: "simple" }))}
            >
              WhatsApp simples
            </button>
            <button
              type="button"
              className={isApi ? "messages-redesign-filter-chip active" : "messages-redesign-filter-chip"}
              onClick={() => setDraft((current) => ({ ...current, integrationMode: "api" }))}
            >
              WhatsApp Business API
            </button>
          </div>
          <div className="messages-redesign-module-list">
            <div className="messages-redesign-module-statline">
              <strong>Status atual</strong>
              <span>{connection.status || "ready"}</span>
            </div>
            <div className="messages-redesign-module-statline">
              <strong>Recebendo mensagens</strong>
              <span>{connection.webhookVerified ? "Sim" : "Nao"}</span>
            </div>
            <div className="messages-redesign-module-statline">
              <strong>Ultima atividade</strong>
              <span>{formatDateTime(connection.lastEventAt)}</span>
            </div>
          </div>
          <div className="messages-redesign-detail-note">
            {isSimple
              ? "Modo padrao para qualquer usuario. O sistema abre o WhatsApp por link, registra a acao e nao exige API."
              : "Modo profissional com envio e recebimento interno pelo CRM usando a Cloud API oficial da Meta."}
          </div>
          <div className="messages-redesign-module-actions stack">
            <button
              type="button"
              className="messages-redesign-detail-btn"
              onClick={handleSaveConfig}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar configuracao"}
            </button>
            {isApi ? (
              <button
                type="button"
                className="messages-redesign-detail-btn"
                onClick={onConnectOfficial}
              >
                Conectar pela Meta
              </button>
            ) : null}
            {connection.phoneNumberId || connection.accessTokenConfigured ? (
              <button
                type="button"
                className="messages-redesign-detail-btn"
                onClick={handleDisconnect}
                disabled={saving}
              >
                Desconectar
              </button>
            ) : null}
          </div>
        </section>

        <section className="messages-redesign-module-card">
          <div className="messages-redesign-module-card-head">
            <strong>Dados da integracao</strong>
          </div>
          <div className="messages-redesign-home-form">
            <label>
              <span>Business ID</span>
              <input
                type="text"
                value={draft.businessId || ""}
                onChange={(event) => setDraft((current) => ({ ...current, businessId: event.target.value }))}
                placeholder="ID do negocio na Meta"
              />
            </label>
            <label>
              <span>Nome do negocio</span>
              <input
                type="text"
                value={draft.businessName || ""}
                onChange={(event) => setDraft((current) => ({ ...current, businessName: event.target.value }))}
                placeholder="Ex.: Pet Shop Dog House"
              />
            </label>
            <label>
              <span>WABA ID</span>
              <input
                type="text"
                value={draft.wabaId || ""}
                onChange={(event) => setDraft((current) => ({ ...current, wabaId: event.target.value }))}
                placeholder="WhatsApp Business Account ID"
                disabled={isSimple}
              />
            </label>
            <label>
              <span>Phone Number ID</span>
              <input
                type="text"
                value={draft.phoneNumberId || ""}
                onChange={(event) => setDraft((current) => ({ ...current, phoneNumberId: event.target.value }))}
                placeholder="ID oficial do numero"
                disabled={isSimple}
              />
            </label>
            <label>
              <span>Numero do negocio</span>
              <input
                type="text"
                value={draft.businessPhone || ""}
                onChange={(event) => setDraft((current) => ({ ...current, businessPhone: event.target.value }))}
                placeholder="5511999999999"
                disabled={isSimple}
              />
            </label>
            <label>
              <span>Verify Token</span>
              <input
                type="text"
                value={draft.verifyToken || ""}
                onChange={(event) => setDraft((current) => ({ ...current, verifyToken: event.target.value }))}
                placeholder="Token do webhook"
                disabled={isSimple}
              />
            </label>
            {isApi ? (
              <label>
                <span>Access Token</span>
                <input
                  type="password"
                  value={draft.accessToken || ""}
                  onChange={(event) => setDraft((current) => ({ ...current, accessToken: event.target.value }))}
                  placeholder={connection.accessTokenConfigured ? "Token salvo. Preencha so para trocar." : "Cole o token permanente aqui"}
                />
              </label>
            ) : null}
          </div>
          {isApi && !draft.phoneNumberId ? (
            <div className="messages-redesign-detail-note">
              Enquanto o Phone Number ID nao estiver configurado, o CRM continua funcionando com fallback visual e sem quebrar as outras areas do sistema.
            </div>
          ) : null}
        </section>
      </div>
    );
  }

  function renderTemplatesTab() {
    return (
      <div className="messages-redesign-module-grid two">
        <section className="messages-redesign-module-card">
          <div className="messages-redesign-module-card-head">
            <strong>Novo modelo</strong>
          </div>
          <div className="messages-redesign-home-form">
            <label>
              <span>Titulo</span>
              <input
                type="text"
                value={templateDraft.title}
                onChange={(event) => setTemplateDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder="Ex.: Confirmacao de horario"
              />
            </label>
            <label>
              <span>Nome tecnico</span>
              <input
                type="text"
                value={templateDraft.templateName}
                onChange={(event) => setTemplateDraft((current) => ({ ...current, templateName: event.target.value }))}
                placeholder="confirmacao_horario"
              />
            </label>
            <label>
              <span>Categoria</span>
              <input
                type="text"
                value={templateDraft.category}
                onChange={(event) => setTemplateDraft((current) => ({ ...current, category: event.target.value }))}
                placeholder="agenda, financeiro, relacionamento..."
              />
            </label>
            <label>
              <span>Mensagem</span>
              <textarea
                rows={6}
                value={templateDraft.body}
                onChange={(event) => setTemplateDraft((current) => ({ ...current, body: event.target.value }))}
                placeholder="Use variaveis como {nome_cliente}, {nome_pet}, {data_agendamento}, {hora_agendamento}, {valor}, {nome_empresa}"
              />
            </label>
          </div>
          <div className="messages-redesign-filter-chips">
            <button
              type="button"
              className={templateDraft.active ? "messages-redesign-filter-chip active" : "messages-redesign-filter-chip"}
              onClick={() => setTemplateDraft((current) => ({ ...current, active: !current.active }))}
            >
              {templateDraft.active ? "Modelo ativo" : "Modelo inativo"}
            </button>
          </div>
          <div className="messages-redesign-module-actions stack">
            <button type="button" className="messages-redesign-detail-btn" onClick={handleSaveTemplate} disabled={saving}>
              {saving ? "Salvando..." : "Salvar modelo"}
            </button>
            {templateDraft.id ? (
              <button
                type="button"
                className="messages-redesign-detail-btn"
                onClick={() => setTemplateDraft(DEFAULT_TEMPLATE_DRAFT)}
              >
                Limpar edicao
              </button>
            ) : null}
          </div>
        </section>

        <section className="messages-redesign-module-card">
          <div className="messages-redesign-module-card-head">
            <strong>Modelos disponiveis</strong>
          </div>
          <div className="messages-redesign-thread-list" style={{ maxHeight: 520 }}>
            {templates.map((template) => (
              <article
                key={template.id}
                className="messages-redesign-thread-card"
                style={{ alignItems: "flex-start", cursor: "default" }}
              >
                <div className="messages-redesign-thread-bodycopy">
                  <div className="messages-redesign-thread-topline">
                    <strong>{template.title}</strong>
                    <span>{template.active ? "Ativo" : "Inativo"}</span>
                  </div>
                  <p>{template.body}</p>
                  <div className="messages-redesign-thread-meta">
                    <span className="messages-redesign-channel-pill">{template.category || "geral"}</span>
                    <span>{template.templateName}</span>
                  </div>
                </div>
                <div className="messages-redesign-detail-actions">
                  <button
                    type="button"
                    className="messages-redesign-detail-btn"
                    onClick={() =>
                      setTemplateDraft({
                        id: template.id,
                        title: template.title || "",
                        templateName: template.templateName || "",
                        category: template.category || "",
                        body: template.body || "",
                        active: template.active !== false,
                      })
                    }
                  >
                    Editar
                  </button>
                  {!template.isSystem ? (
                    <button
                      type="button"
                      className="messages-redesign-detail-btn"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      Excluir
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  }

  function renderConversationsTab() {
    const isSimple = connection.integrationMode === "simple";
    return (
      <div className="messages-redesign-module-grid two">
        <section className="messages-redesign-module-card">
          <div className="messages-redesign-module-card-head">
            <strong>{isSimple ? "Historico do modo simples" : "Inbox oficial do CRM"}</strong>
          </div>
          <div className="messages-redesign-thread-list" style={{ maxHeight: 520 }}>
            {(isSimple ? activity : inbox).map((item) => (
              <article
                key={item.id}
                className="messages-redesign-thread-card"
                style={{ alignItems: "flex-start", cursor: "default" }}
              >
                <div className="messages-redesign-thread-bodycopy">
                  <div className="messages-redesign-thread-topline">
                    <strong>{item.customerName || item.title}</strong>
                    <span>{formatDateTime(item.lastAt || item.lastMessageAt)}</span>
                  </div>
                  <p>{item.message || item.lastMessagePreview || "Sem mensagem registrada."}</p>
                  <div className="messages-redesign-thread-meta">
                    <span className="messages-redesign-channel-pill">{originLabel(item.origin || item.source)}</span>
                    <span>{item.phone || "Sem telefone"}</span>
                    <span>{item.status || "pendente"}</span>
                  </div>
                </div>
              </article>
            ))}
            {!(isSimple ? activity : inbox).length ? (
              <div className="messages-redesign-empty">
                {isSimple
                  ? "Nenhuma acao registrada ainda no WhatsApp simples."
                  : "Nenhuma conversa oficial registrada ainda."}
              </div>
            ) : null}
          </div>
          {isSimple ? (
            <div className="messages-redesign-detail-note">
              No modo simples, o sistema registra o inicio da conversa e abre o WhatsApp pelo link. O recebimento interno so aparece no modo oficial com API.
            </div>
          ) : null}
        </section>

        <section className="messages-redesign-module-card">
          <div className="messages-redesign-module-card-head">
            <strong>Logs tecnicos</strong>
          </div>
          <div className="messages-redesign-thread-list" style={{ maxHeight: 520 }}>
            {logs.map((item) => (
              <article
                key={item.id}
                className="messages-redesign-thread-card"
                style={{ alignItems: "flex-start", cursor: "default" }}
              >
                <div className="messages-redesign-thread-bodycopy">
                  <div className="messages-redesign-thread-topline">
                    <strong>{item.type}</strong>
                    <span>{formatDateTime(item.createdAt)}</span>
                  </div>
                  <p>{item.description || item.errorMessage || "Evento registrado."}</p>
                  <div className="messages-redesign-thread-meta">
                    <span className="messages-redesign-channel-pill">{item.processed ? "Processado" : "Pendente"}</span>
                    <span>{item.eventType}</span>
                  </div>
                </div>
              </article>
            ))}
            {!logs.length ? <div className="messages-redesign-empty">Nenhum log tecnico registrado ainda.</div> : null}
          </div>
        </section>
      </div>
    );
  }

  return (
    <section className="messages-redesign-home">
      <div className="messages-redesign-home-grid">
        <section className="messages-redesign-home-card wide">
          <div className="messages-redesign-home-hero">
            <div>
              <span className="messages-redesign-kicker">Central oficial</span>
              <h2>WhatsApp do CRM</h2>
              <p>
                Escolha entre WhatsApp simples por link ou WhatsApp Business API oficial,
                sem mexer no restante do sistema.
              </p>
            </div>
            <div className="messages-redesign-module-actions stack">
              <button type="button" className="messages-redesign-detail-btn" onClick={loadOverview}>
                Atualizar central
              </button>
              <button type="button" className="messages-redesign-detail-btn" onClick={onConnectOfficial}>
                Conectar pela Meta
              </button>
            </div>
          </div>
          {feedback ? <div className="messages-redesign-detail-note">{feedback}</div> : null}
        </section>
      </div>

      <div className="messages-redesign-status-grid">
        {TAB_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === activeTab ? "messages-redesign-status-card active" : "messages-redesign-status-card"}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="messages-redesign-status-badge">
              {item.id === "templates"
                ? templates.length
                : item.id === "conversations"
                  ? (connection.integrationMode === "simple" ? activity.length : inbox.length)
                  : connection.integrationMode === "api"
                    ? "API"
                    : "Link"}
            </span>
            <strong>{item.label}</strong>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="messages-redesign-empty">Carregando central do WhatsApp...</div>
      ) : activeTab === "config" ? (
        renderConfigTab()
      ) : activeTab === "templates" ? (
        renderTemplatesTab()
      ) : (
        renderConversationsTab()
      )}
    </section>
  );
}
