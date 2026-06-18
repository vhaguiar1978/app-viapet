import { useEffect, useMemo, useState } from "react";
import "./AdminPages.css";
import "./AdminWhatsappIaPage.css";

const TABS = [
  { id: "overview", label: "Visao geral" },
  { id: "conversations", label: "Conversas" },
  { id: "inactive", label: "Usuarios inativos" },
  { id: "knowledge", label: "Conhecimento da IA" },
  { id: "settings", label: "Configuracoes" },
];

const KNOWLEDGE_CATEGORIES = [
  "Primeiros passos",
  "Tutores",
  "Pets",
  "Servicos",
  "Agenda",
  "Pacotinhos",
  "CRM",
  "Financeiro",
  "Caixa",
  "Estoque",
  "Funcionarios",
  "Relatorios",
  "WhatsApp",
  "Planos",
  "Assinaturas",
  "Erros conhecidos",
  "Perguntas frequentes",
];

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

function StatusPill({ tone = "muted", children }) {
  return <span className={`admin-pill admin-pill-${tone}`}>{children}</span>;
}

export default function AdminWhatsappIaPage({ apiRequest }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [period, setPeriod] = useState("30d");
  const [dashboard, setDashboard] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [inactiveUsers, setInactiveUsers] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [config, setConfig] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [aiTest, setAiTest] = useState({ input: "", reply: "" });
  const [knowledgeForm, setKnowledgeForm] = useState({
    title: "",
    category: "Primeiros passos",
    questions: "",
    content: "",
    instructions: "",
    internalLink: "",
    videoLink: "",
    keywords: "",
    relatedPlan: "",
    status: "draft",
  });

  const metrics = dashboard?.metrics || {};
  const connection = dashboard?.connection || {};
  const settings = dashboard?.settings || config?.settings || {};

  async function loadAll() {
    setLoading(true);
    try {
      const [dash, conv, inactive, know, cfg] = await Promise.all([
        apiRequest(`/admin/whatsapp-ia/dashboard?period=${period}`),
        apiRequest("/admin/whatsapp-ia/conversations"),
        apiRequest("/admin/whatsapp-ia/inactive-users"),
        apiRequest("/admin/whatsapp-ia/knowledge"),
        apiRequest("/admin/whatsapp-ia/config"),
      ]);
      setDashboard(dash?.data || null);
      setConversations(conv?.data || []);
      setInactiveUsers(inactive?.data || []);
      setKnowledge(know?.data || []);
      setConfig(cfg?.data || null);
      setFeedback("");
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel carregar o WhatsApp IA.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [period]);

  const filteredInactive = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return inactiveUsers;
    return inactiveUsers.filter((item) =>
      [item.name, item.petshop, item.phone, item.email, item.plan, item.status].some((value) =>
        String(value || "").toLowerCase().includes(term),
      ),
    );
  }, [inactiveUsers, search]);

  async function loadConversation(id) {
    if (!id) return;
    try {
      const response = await apiRequest(`/admin/whatsapp-ia/conversations/${id}`);
      setSelectedConversation(response?.data || null);
      setActiveTab("conversations");
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel abrir a conversa.");
    }
  }

  async function runConversationAction(id, action, payload = {}) {
    try {
      await apiRequest(`/admin/whatsapp-ia/conversations/${id}/action`, {
        method: "POST",
        body: JSON.stringify({ action, ...payload }),
      });
      setFeedback("Conversa atualizada.");
      await loadAll();
      await loadConversation(id);
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel atualizar a conversa.");
    }
  }

  async function scanInactive() {
    try {
      const response = await apiRequest("/admin/whatsapp-ia/inactive-users/scan", {
        method: "POST",
        body: JSON.stringify({ days: settings.inactivityDays || 10 }),
      });
      setFeedback(response?.message || "Usuarios inativos atualizados.");
      await loadAll();
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel verificar inativos.");
    }
  }

  async function startConversation(userId) {
    try {
      await apiRequest(`/admin/whatsapp-ia/consents/${userId}`, {
        method: "POST",
        body: JSON.stringify({ consentStatus: "granted", source: "admin_manual" }),
      });
      await apiRequest(`/admin/whatsapp-ia/inactive-users/${userId}/start`, { method: "POST" });
      setFeedback("Conversa iniciada pelo WhatsApp oficial.");
      await loadAll();
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel iniciar conversa.");
    }
  }

  async function saveKnowledge(event) {
    event.preventDefault();
    try {
      await apiRequest("/admin/whatsapp-ia/knowledge", {
        method: "POST",
        body: JSON.stringify(knowledgeForm),
      });
      setKnowledgeForm((current) => ({ ...current, title: "", questions: "", content: "", instructions: "", internalLink: "", videoLink: "", keywords: "" }));
      setFeedback("Conhecimento salvo.");
      const response = await apiRequest("/admin/whatsapp-ia/knowledge");
      setKnowledge(response?.data || []);
    } catch (error) {
      setFeedback(error.message || "Nao foi possivel salvar conhecimento.");
    }
  }

  async function testAi() {
    if (!aiTest.input.trim()) return;
    setAiTest((current) => ({ ...current, reply: "Pensando..." }));
    try {
      const response = await apiRequest("/admin/whatsapp-ia/test-ai", {
        method: "POST",
        body: JSON.stringify({ message: aiTest.input }),
      });
      setAiTest((current) => ({ ...current, reply: response?.data?.reply || "Sem resposta." }));
    } catch (error) {
      setAiTest((current) => ({ ...current, reply: error.message || "Nao foi possivel testar a IA." }));
    }
  }

  return (
    <section className="admin-page admin-waia">
      <header className="admin-page-header">
        <div>
          <h2>WhatsApp IA</h2>
          <small>Recuperacao simples de usuarios inativos com WhatsApp oficial, IA e atendimento humano.</small>
        </div>
        <div className="admin-page-actions">
          <select className="admin-input" value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option value="today">Hoje</option>
            <option value="7d">Ultimos 7 dias</option>
            <option value="30d">Ultimos 30 dias</option>
          </select>
          <button type="button" className="admin-btn-secondary" onClick={loadAll} disabled={loading}>
            Atualizar
          </button>
        </div>
      </header>

      {feedback ? <div className="admin-feedback">{feedback}</div> : null}

      <div className="admin-waia-tabs" role="tablist">
        {TABS.map((tab) => (
          <button key={tab.id} type="button" className={activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <>
          <div className="admin-cards-row">
            <article className="admin-stat-card admin-stat-ok">
              <span className="admin-stat-kicker">WhatsApp</span>
              <strong>{connection.status === "connected" ? "Conectado" : "Desconectado"}</strong>
              <small>{connection.phoneNumber || "Numero nao configurado"}</small>
            </article>
            <article className="admin-stat-card admin-stat-info">
              <span className="admin-stat-kicker">IA</span>
              <strong>{dashboard?.aiEnabled ? "Ligada" : "Desligada"}</strong>
              <small>Modelo: {settings.model || "-"}</small>
            </article>
            <article className="admin-stat-card admin-stat-warn">
              <span className="admin-stat-kicker">Inativos</span>
              <strong>{metrics.inactiveUsers || 0}</strong>
              <small>{settings.inactivityDays || 10}+ dias sem acesso</small>
            </article>
            <article className="admin-stat-card admin-stat-primary">
              <span className="admin-stat-kicker">Respostas</span>
              <strong>{metrics.inbound || 0}</strong>
              <small>{metrics.sent || 0} mensagens enviadas</small>
            </article>
          </div>

          <div className="admin-waia-metrics">
            {[
              ["Entregues", metrics.delivered],
              ["Voltaram ao sistema", metrics.returned],
              ["Receberam ajuda", metrics.helped],
              ["Links enviados", metrics.subscriptionLinks],
              ["Assinaturas", metrics.conversions],
              ["Transferidas", metrics.transferred],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value || 0}</strong>
              </div>
            ))}
          </div>

          <div className="admin-waia-quick">
            <button type="button" className="admin-btn-primary" onClick={() => setActiveTab("settings")}>Conectar WhatsApp</button>
            <button type="button" className="admin-btn-secondary" onClick={() => setActiveTab("conversations")}>Ver conversas</button>
            <button type="button" className="admin-btn-secondary" onClick={() => setActiveTab("inactive")}>Ver inativos</button>
            <button type="button" className="admin-btn-secondary" onClick={() => setActiveTab("knowledge")}>Conhecimento</button>
            <button type="button" className="admin-btn-danger" onClick={() => setFeedback("Para pausar envios reais, defina WHATSAPP_IA_AUTOMATION_ENABLED=false no ambiente.")}>Pausar automacao</button>
          </div>
        </>
      ) : null}

      {activeTab === "conversations" ? (
        <div className="admin-waia-inbox">
          <aside className="admin-waia-list">
            {conversations.map((item) => (
              <button key={item.id} type="button" className="admin-waia-thread" onClick={() => loadConversation(item.id)}>
                <strong>{item.name}</strong>
                <span>{item.phone || item.email}</span>
                <small>{item.lastMessage || "Sem previa"} · {formatDate(item.lastMessageAt)}</small>
                <StatusPill tone={item.attendanceMode === "human" ? "info" : "ok"}>{item.attendanceMode === "human" ? "Humano" : "IA"}</StatusPill>
              </button>
            ))}
            {!conversations.length ? <div className="admin-empty">Nenhuma conversa registrada ainda.</div> : null}
          </aside>
          <main className="admin-waia-chat">
            {selectedConversation ? (
              <>
                <div className="admin-waia-chat-head">
                  <div>
                    <strong>{selectedConversation.user?.name || "Contato"}</strong>
                    <small>{selectedConversation.user?.phone || selectedConversation.conversation?.phoneNumber}</small>
                  </div>
                  <div className="admin-waia-chat-actions">
                    <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => runConversationAction(selectedConversation.conversation.id, "assume")}>Assumir</button>
                    <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => runConversationAction(selectedConversation.conversation.id, "activate_ai")}>Ativar IA</button>
                    <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => runConversationAction(selectedConversation.conversation.id, "subscription_link")}>Link assinatura</button>
                    <button type="button" className="admin-btn-primary admin-btn-sm" onClick={() => runConversationAction(selectedConversation.conversation.id, "resolve")}>Resolver</button>
                  </div>
                </div>
                <div className="admin-waia-messages">
                  {selectedConversation.messages.map((message) => (
                    <div key={message.id} className={`admin-waia-message ${message.direction === "inbound" ? "in" : "out"}`}>
                      <p>{message.content}</p>
                      <small>{message.senderType} · {message.status} · {formatDate(message.sentAt)}</small>
                    </div>
                  ))}
                  {!selectedConversation.messages.length ? <div className="admin-empty">Historico vazio.</div> : null}
                </div>
                <aside className="admin-waia-profile">
                  <div><span>E-mail</span><strong>{selectedConversation.user?.email || "-"}</strong></div>
                  <div><span>Ultimo acesso</span><strong>{formatDate(selectedConversation.user?.lastAccess)}</strong></div>
                  <div><span>Dias sem acesso</span><strong>{selectedConversation.user?.inactivityDays ?? "-"}</strong></div>
                  <div><span>Plano</span><strong>{selectedConversation.user?.plan || "-"}</strong></div>
                  <div><span>Pets</span><strong>{selectedConversation.user?.counts?.pets || 0}</strong></div>
                  <div><span>Tutores</span><strong>{selectedConversation.user?.counts?.tutors || 0}</strong></div>
                  <div><span>Servicos</span><strong>{selectedConversation.user?.counts?.services || 0}</strong></div>
                  <div><span>Agendamentos</span><strong>{selectedConversation.user?.counts?.appointments || 0}</strong></div>
                </aside>
              </>
            ) : (
              <div className="admin-empty">Selecione uma conversa para ver o historico.</div>
            )}
          </main>
        </div>
      ) : null}

      {activeTab === "inactive" ? (
        <article className="admin-table-card">
          <div className="admin-table-header">
            <h3>Usuarios inativos</h3>
            <div className="admin-table-filters">
              <input className="admin-input" placeholder="Buscar usuario, telefone ou plano" value={search} onChange={(event) => setSearch(event.target.value)} />
              <button type="button" className="admin-btn-secondary" onClick={scanInactive}>Verificar agora</button>
            </div>
          </div>
          <div className="admin-table admin-waia-inactive-table">
            <div className="admin-table-row admin-table-head">
              <span>Usuario</span><span>Telefone</span><span>Ultimo acesso</span><span>Dias</span><span>Plano</span><span>Status</span><span>Acoes</span>
            </div>
            {filteredInactive.map((item) => (
              <div key={item.id} className="admin-table-row">
                <div className="admin-cell-primary"><strong>{item.name}</strong><small>{item.email}</small></div>
                <span>{item.phone || "-"}</span>
                <span>{formatDate(item.lastAccess)}</span>
                <strong>{item.inactivityDays}</strong>
                <span>{item.plan}</span>
                <StatusPill tone={item.consentStatus === "granted" ? "ok" : "warn"}>{item.status}</StatusPill>
                <button type="button" className="admin-btn-primary admin-btn-sm" onClick={() => startConversation(item.id)}>Iniciar</button>
              </div>
            ))}
            {!filteredInactive.length ? <div className="admin-empty">Nenhum usuario inativo encontrado.</div> : null}
          </div>
        </article>
      ) : null}

      {activeTab === "knowledge" ? (
        <div className="admin-waia-knowledge">
          <form className="admin-form-card" onSubmit={saveKnowledge}>
            <h3>Novo conteudo</h3>
            <div className="admin-form-grid">
              <label className="admin-field"><span>Titulo</span><input className="admin-input" value={knowledgeForm.title} onChange={(event) => setKnowledgeForm((c) => ({ ...c, title: event.target.value }))} /></label>
              <label className="admin-field"><span>Categoria</span><select className="admin-input" value={knowledgeForm.category} onChange={(event) => setKnowledgeForm((c) => ({ ...c, category: event.target.value }))}>{KNOWLEDGE_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="admin-field admin-field-grow"><span>Perguntas relacionadas</span><input className="admin-input" value={knowledgeForm.questions} onChange={(event) => setKnowledgeForm((c) => ({ ...c, questions: event.target.value }))} /></label>
              <label className="admin-field admin-field-grow"><span>Resposta</span><textarea className="admin-input admin-textarea" value={knowledgeForm.content} onChange={(event) => setKnowledgeForm((c) => ({ ...c, content: event.target.value }))} /></label>
              <label className="admin-field"><span>Link interno</span><input className="admin-input" value={knowledgeForm.internalLink} onChange={(event) => setKnowledgeForm((c) => ({ ...c, internalLink: event.target.value }))} /></label>
              <label className="admin-field"><span>Palavras-chave</span><input className="admin-input" value={knowledgeForm.keywords} onChange={(event) => setKnowledgeForm((c) => ({ ...c, keywords: event.target.value }))} /></label>
              <label className="admin-field"><span>Status</span><select className="admin-input" value={knowledgeForm.status} onChange={(event) => setKnowledgeForm((c) => ({ ...c, status: event.target.value }))}><option value="draft">Rascunho</option><option value="published">Publicado</option></select></label>
              <div className="admin-form-actions"><button className="admin-btn-primary" type="submit">Salvar conhecimento</button></div>
            </div>
          </form>
          <div className="admin-addons-grid">
            {knowledge.map((item) => (
              <article key={item.id} className="admin-addon-card">
                <header><strong>{item.title}</strong><StatusPill tone={item.status === "published" ? "ok" : "muted"}>{item.status}</StatusPill></header>
                <p>{item.content}</p>
                <small>{item.category} · v{item.version}</small>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "settings" ? (
        <div className="admin-waia-settings">
          <article className="admin-form-card">
            <h3>Conexao oficial Meta</h3>
            <div className="admin-waia-config-grid">
              <div><span>Status</span><strong>{connection.status || "disconnected"}</strong></div>
              <div><span>Numero</span><strong>{connection.phoneNumber || "-"}</strong></div>
              <div><span>Phone Number ID</span><strong>{connection.phoneNumberId || "-"}</strong></div>
              <div><span>Conta WhatsApp</span><strong>{connection.businessAccountId || "-"}</strong></div>
              <div><span>Webhook</span><strong>{connection.webhookVerified ? "Verificado" : "Pendente"}</strong></div>
              <div><span>Token</span><strong>{connection.tokenConfigured ? "Configurado" : "Ausente"}</strong></div>
            </div>
          </article>
          <article className="admin-form-card">
            <h3>Automacao e IA</h3>
            <div className="admin-waia-config-grid">
              <div><span>IA</span><strong>{settings.aiEnabled ? "Ligada" : "Desligada"}</strong></div>
              <div><span>Automacao</span><strong>{settings.automationEnabled ? "Ligada" : "Desligada"}</strong></div>
              <div><span>Inatividade</span><strong>{settings.inactivityDays || 10} dias</strong></div>
              <div><span>Horario</span><strong>{settings.contactStart} - {settings.contactEnd}</strong></div>
              <div><span>Tentativas</span><strong>{settings.maxAttempts || 4}</strong></div>
              <div><span>Suporte</span><strong>{settings.supportPhone || "-"}</strong></div>
            </div>
          </article>
          <article className="admin-form-card">
            <h3>Testar IA</h3>
            <div className="admin-waia-test">
              <textarea className="admin-input admin-textarea" value={aiTest.input} onChange={(event) => setAiTest((current) => ({ ...current, input: event.target.value }))} placeholder="Digite uma duvida sobre o ViaPet" />
              <button type="button" className="admin-btn-primary" onClick={testAi}>Testar IA</button>
              {aiTest.reply ? <div className="admin-waia-ai-reply">{aiTest.reply}</div> : null}
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
