import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./crm-inteligente.css";

/* ================================================================== */
/*  Helpers                                                             */
/* ================================================================== */
function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 1) return "Ontem";
  if (diff < 7)  return d.toLocaleDateString("pt-BR", { weekday: "short" });
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function initials(name = "") {
  const parts = name.trim().split(" ").filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = ["c-purple", "c-teal", "c-blue", "c-amber", "c-red"];
function pickColor(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

const PET_EMOJI = { cao: "🐶", gato: "🐱", coelho: "🐰", passaro: "🐦", outro: "🐾" };
function petEmoji(species = "") {
  const s = species.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (s.includes("cao") || s.includes("canino") || s.includes("dog")) return "🐶";
  if (s.includes("gato") || s.includes("felino") || s.includes("cat")) return "🐱";
  if (s.includes("coelho")) return "🐰";
  if (s.includes("passaro") || s.includes("ave")) return "🐦";
  return "🐾";
}

const STATUS_FILTER = [
  { key: "all",      label: "Todas" },
  { key: "pending",  label: "Pendentes" },
  { key: "attending",label: "Atendendo" },
  { key: "closed",   label: "Fechado" },
];

/* ================================================================== */
/*  Componentes de UI                                                   */
/* ================================================================== */
function Avatar({ name, color, size = "md" }) {
  return (
    <div className={`crmi-avatar ${size} ${color || pickColor(name)}`}>
      {initials(name)}
    </div>
  );
}

function Btn({ children, variant = "", size = "", onClick, disabled, style, title }) {
  return (
    <button
      className={`crmi-btn ${variant} ${size}`.trim()}
      onClick={onClick}
      disabled={disabled}
      style={style}
      title={title}
    >
      {children}
    </button>
  );
}

function Alert({ type, ico, title, text }) {
  if (!title) return null;
  return (
    <div className={`crmi-alert ${type}`}>
      <div className="crmi-alert-ico">{ico}</div>
      <div>
        <strong>{title}</strong>
        {text && <p>{text}</p>}
      </div>
    </div>
  );
}

function Spinner() {
  return <span style={{ opacity: .5 }}>⟳</span>;
}

/* ================================================================== */
/*  Modal genérico                                                      */
/* ================================================================== */
function Modal({ show, onClose, title, subtitle, children, footer, wide }) {
  if (!show) return null;
  return (
    <div className="crmi-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`crmi-modal${wide ? " wide" : ""}`}>
        <div className="crmi-modal-head">
          <div>
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="crmi-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="crmi-modal-body">{children}</div>
        {footer && <div className="crmi-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Painel col 3                                                        */
/* ================================================================== */
function SidePanel({ thread, appointments, aiSuggestions, onUseSuggestion, onSchedule, onRegister, loadingAppointments }) {
  const [tab, setTab] = useState("Detalhes");
  const customer = thread?.customer || null;
  const pet      = thread?.pet      || null;

  return (
    <aside className="crmi-panel crmi-side">
      <div className="crmi-side-tabs">
        {["Detalhes", "Sugestões IA", "Histórico"].map(t => (
          <button
            key={t}
            className={`crmi-side-tab${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ---- TAB DETALHES ---- */}
      {tab === "Detalhes" && (
        <>
          {customer ? (
            <>
              <div className="crmi-side-section">
                <h4>Tutor <span className="action">Ver cadastro</span></h4>
                <div className="crmi-tutor-id">
                  <Avatar name={customer.name} size="lg" />
                  <div>
                    <strong>{customer.name}</strong>
                    <span className="meta">{customer.phone}</span>
                  </div>
                </div>
                {customer.email  && <div className="crmi-info-row"><span>E-mail</span><span>{customer.email}</span></div>}
                {customer.city   && <div className="crmi-info-row"><span>Cidade</span><span>{customer.city}</span></div>}
                {customer.address && <div className="crmi-info-row"><span>Endereço</span><span>{customer.address}</span></div>}
              </div>

              {pet && (
                <div className="crmi-side-section">
                  <h4>Pet selecionado</h4>
                  <div className="crmi-pet-list">
                    <div className="crmi-pet-card selected">
                      <div className="crmi-pet-emoji">{petEmoji(pet.species || "")}</div>
                      <div className="crmi-pet-info">
                        <strong>{pet.name}</strong>
                        <small>{[pet.breed, pet.sex, pet.color].filter(Boolean).join(" · ")}</small>
                      </div>
                      <div className="crmi-pet-check">✓</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="crmi-side-section">
                <h4>Agendamentos recentes</h4>
                {loadingAppointments ? (
                  <p style={{ fontSize: 12, color: "var(--ci-text-3)" }}>Carregando...</p>
                ) : appointments.length === 0 ? (
                  <p style={{ fontSize: 12, color: "var(--ci-text-3)" }}>Nenhum agendamento encontrado.</p>
                ) : (
                  appointments.slice(0, 5).map((a, i) => (
                    <div key={i} className="crmi-linked-chip">
                      <div className="lico">✂️</div>
                      <div>
                        <strong>{a.Service?.name || a.service?.name || "Serviço"}</strong>
                        <small>{a.date} · {a.time?.substring(0, 5)} · {a.status}</small>
                      </div>
                      <span className="arrow">↗</span>
                    </div>
                  ))
                )}
                <Btn variant="brand" size="sm" style={{ marginTop: 8, width: "100%" }} onClick={onSchedule}>
                  📅 Novo agendamento
                </Btn>
              </div>
            </>
          ) : (
            <div className="crmi-empty">
              <div className="crmi-empty-ico">⚠</div>
              <strong>Sem cadastro</strong>
              <p>Número não encontrado no sistema.</p>
              <Btn variant="pulse" style={{ margin: "0 auto" }} onClick={onRegister}>
                ⚠ Iniciar cadastro
              </Btn>
            </div>
          )}
        </>
      )}

      {/* ---- TAB SUGESTÕES IA ---- */}
      {tab === "Sugestões IA" && (
        <div className="crmi-side-section">
          <h4>Sugestões proativas</h4>
          {aiSuggestions.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--ci-text-3)" }}>Nenhuma sugestão disponível para esta conversa.</p>
          ) : (
            aiSuggestions.map((s, i) => (
              <div key={i} className="crmi-ai-suggestion">
                <div className="crmi-ai-suggestion-head">
                  <div className="crmi-ai-ico sm">✨</div>
                  <small>SUGESTÃO IA</small>
                </div>
                <p>{s}</p>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn variant="brand" size="sm" onClick={() => onUseSuggestion(s)}>Usar</Btn>
                  <Btn variant="ghost" size="sm">Ignorar</Btn>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ---- TAB HISTÓRICO ---- */}
      {tab === "Histórico" && (
        <div className="crmi-side-section">
          <h4>Agendamentos anteriores</h4>
          {appointments.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--ci-text-3)" }}>Nenhum histórico.</p>
          ) : (
            <div className="crmi-timeline">
              {appointments.slice(0, 10).map((a, i) => (
                <div key={i} className={`crmi-timeline-item ${a.status === "Entregue" || a.status === "Finalizado" ? "success" : "brand"}`}>
                  <span className="crmi-timeline-date">{a.date}</span>
                  <strong>{a.Service?.name || a.service?.name || "Serviço"} · {thread?.petName || thread?.pet?.name || ""}</strong>
                  <small>{a.status} · {a.time?.substring(0, 5)}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

/* ================================================================== */
/*  Página principal                                                    */
/* ================================================================== */
export default function CrmInteligentePage({ auth, apiRequest }) {
  const navigate = useNavigate();
  /* ---- Estado ---- */
  const [threads,         setThreads]         = useState([]);
  const [loadingThreads,  setLoadingThreads]  = useState(true);
  const [filterStatus,    setFilterStatus]    = useState("all");
  const [searchQuery,     setSearchQuery]     = useState("");
  const [selectedId,      setSelectedId]      = useState(null);
  const [messages,        setMessages]        = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draftMsg,        setDraftMsg]        = useState("");
  const [sendingMsg,      setSendingMsg]      = useState(false);
  const [appointments,    setAppointments]    = useState([]);
  const [loadingAppts,    setLoadingAppts]    = useState(false);
  const [aiSuggestion,    setAiSuggestion]    = useState("");
  const [loadingAi,       setLoadingAi]       = useState(false);
  const [aiSuggestions,   setAiSuggestions]   = useState([]);
  const [modal,           setModal]           = useState(null); // null | "summary" | "schedule" | "register"
  const [modalSummary,    setModalSummary]    = useState("");
  const [loadingSummary,  setLoadingSummary]  = useState(false);
  const [toast,           setToast]           = useState(null);
  const [dark,            setDark]            = useState(false);
  const [summary,         setSummary]         = useState(null);
  const [summaryLoaded,   setSummaryLoaded]   = useState(false);

  /* Formulário de agendamento */
  const [schedForm, setSchedForm] = useState({ service: "", date: "", time: "", notes: "" });
  const [schedLoading, setSchedLoading] = useState(false);

  const bubblesRef = useRef(null);

  /* ---- Thread selecionada ---- */
  const selectedThread = threads.find(t => t.id === selectedId) || null;
  const customer       = selectedThread?.customer || null;
  const pet            = selectedThread?.pet      || null;

  /* ---- Helpers de API ---- */
  const api = useCallback(async (path, opts = {}) => {
    // Sempre injeta o token, independente de usar apiRequest ou fetch direto
    const token = auth?.token || localStorage.getItem("viapet.auth.token");
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
    const mergedOpts = {
      ...opts,
      headers: { ...authHeader, ...(opts.headers || {}) },
    };
    if (apiRequest) return apiRequest(path, mergedOpts);
    const base = import.meta.env.VITE_API_URL || "https://api.viapet.app";
    const res = await fetch(`${base}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
        ...(opts.headers || {}),
      },
      ...opts,
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }, [apiRequest, auth]);

  /* ---- Carregar conversas ---- */
  const loadThreads = useCallback(async (silent = false) => {
    if (!silent) setLoadingThreads(true);
    try {
      const params = new URLSearchParams({ limit: "80" });
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      const data = await api(`/crm-conversations?${params}`);
      const list = Array.isArray(data) ? data : (data?.data || []);
      setThreads(list);
    } catch (e) {
      if (!silent) console.error("Erro ao carregar conversas", e);
    } finally {
      if (!silent) setLoadingThreads(false);
    }
  }, [api, filterStatus, searchQuery]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  /* Polling silencioso a cada 8s */
  useEffect(() => {
    const id = setInterval(() => loadThreads(true), 8000);
    return () => clearInterval(id);
  }, [loadThreads]);

  /* ---- Carregar mensagens ---- */
  const loadMessages = useCallback(async (convId, silent = false) => {
    if (!convId) return;
    if (!silent) setLoadingMessages(true);
    try {
      const data = await api(`/crm-conversations/${convId}/messages?limit=200`);
      const list = Array.isArray(data) ? data : (data?.data || data?.messages || []);
      setMessages(list);
      setTimeout(() => {
        if (bubblesRef.current) bubblesRef.current.scrollTop = bubblesRef.current.scrollHeight;
      }, 100);
    } catch (e) {
      if (!silent) console.error("Erro ao carregar mensagens", e);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, [api]);

  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }
    loadMessages(selectedId);
    const id = setInterval(() => loadMessages(selectedId, true), 5000);
    return () => clearInterval(id);
  }, [selectedId, loadMessages]);

  /* ---- Carregar agendamentos ---- */
  useEffect(() => {
    if (!customer?.id) { setAppointments([]); return; }
    setLoadingAppts(true);
    api(`/appointments/customer/${customer.id}`)
      .then(d => setAppointments(Array.isArray(d) ? d : (d?.data || [])))
      .catch(() => setAppointments([]))
      .finally(() => setLoadingAppts(false));
  }, [customer?.id, api]);

  /* ---- Carregar sugestões IA ---- */
  useEffect(() => {
    if (!selectedId) { setAiSuggestions([]); return; }
    api(`/api/crm-ai-assistant/${selectedId}/suggest-replies`, { method: "POST", body: JSON.stringify({}) })
      .then(d => {
        const reps = d?.replies || d?.suggestions || d?.data || [];
        setAiSuggestions(Array.isArray(reps) ? reps.map(r => typeof r === "string" ? r : r?.text || r?.reply || "") : []);
      })
      .catch(() => setAiSuggestions([]));
  }, [selectedId, api]);

  /* ---- Selecionar thread ---- */
  const selectThread = async (id) => {
    setSelectedId(id);
    setAiSuggestion("");
    setSummary(null);
    setSummaryLoaded(false);
    setSchedForm({ service: "", date: "", time: "", notes: "" });
    /* marcar como lida */
    api(`/crm-conversations/${id}/read`, { method: "POST", body: JSON.stringify({}) }).catch(() => {});
  };

  /* ---- Enviar mensagem ---- */
  const sendMessage = async () => {
    const body = draftMsg.trim();
    if (!body || !selectedId) return;
    setSendingMsg(true);
    try {
      await api(`/crm-conversations/${selectedId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body, direction: "outbound", sendNow: true }),
      });
      setDraftMsg("");
      setAiSuggestion("");
      await loadMessages(selectedId, true);
    } catch (e) {
      alert("Erro ao enviar mensagem: " + e.message);
    } finally {
      setSendingMsg(false);
    }
  };

  /* ---- Sugestão IA no composer ---- */
  const suggestReply = async () => {
    if (!selectedId || loadingAi) return;
    setLoadingAi(true);
    try {
      const data = await api(`/api/crm-ai-assistant/${selectedId}/suggest-replies`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      const reps = data?.replies || data?.suggestions || data?.data || [];
      const first = Array.isArray(reps) ? (typeof reps[0] === "string" ? reps[0] : reps[0]?.text || reps[0]?.reply || "") : "";
      setAiSuggestion(first || "Não foi possível gerar sugestão.");
    } catch (e) {
      setAiSuggestion("Erro ao gerar sugestão.");
    } finally {
      setLoadingAi(false);
    }
  };

  /* ---- Resumo da conversa ---- */
  const openSummary = async () => {
    setModal("summary");
    if (summaryLoaded) return;
    setLoadingSummary(true);
    try {
      const data = await api(`/api/crm-ai-assistant/${selectedId}/summary`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setSummary(data?.summary || data?.content || data?.text || JSON.stringify(data));
      setSummaryLoaded(true);
    } catch (e) {
      setSummary("Erro ao gerar resumo: " + e.message);
    } finally {
      setLoadingSummary(false);
    }
  };

  /* ---- Criar agendamento ---- */
  const createAppointment = async () => {
    if (!selectedId) return;
    setSchedLoading(true);
    try {
      await api(`/api/crm-ai/assistant/schedule-appointment`, {
        method: "POST",
        body: JSON.stringify({
          conversationId: selectedId,
          customerId: customer?.id,
          petId: pet?.id,
          serviceQuery: schedForm.service,
          appointmentAt: schedForm.date && schedForm.time ? `${schedForm.date}T${schedForm.time}:00` : undefined,
          execute: true,
          humanApproved: true,
          tutorConfirmed: true,
          notes: schedForm.notes,
        }),
      });
      setModal(null);
      setToast({ msg: `Agendamento criado para ${customer?.name || "cliente"}!`, type: "success" });
      setTimeout(() => setToast(null), 5000);
      /* recarrega agendamentos */
      if (customer?.id) {
        api(`/appointments/customer/${customer.id}`)
          .then(d => setAppointments(Array.isArray(d) ? d : (d?.data || [])))
          .catch(() => {});
      }
    } catch (e) {
      alert("Erro ao criar agendamento: " + e.message);
    } finally {
      setSchedLoading(false);
    }
  };

  /* ---- Iniciar cadastro de cliente ---- */
  const registerContact = async () => {
    if (!selectedId) return;
    try {
      const data = await api(`/api/crm-ai/assistant/upsert-contact`, {
        method: "POST",
        body: JSON.stringify({
          conversationId: selectedId,
          execute: false, // apenas proposta
        }),
      });
      setToast({ msg: "Dados extraídos pela IA — revise e confirme no cadastro.", type: "info" });
      setTimeout(() => setToast(null), 5000);
    } catch (e) {
      alert("Erro: " + e.message);
    }
  };

  /* ---- Filtro de status ---- */
  const filteredThreads = threads.filter(t => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    return true;
  });

  /* ---- Alertas da conversa ---- */
  const getAlert = () => {
    if (!selectedThread) return null;
    if (customer) {
      if (pet) return { type: "success", ico: "✓", title: "Cliente identificado pelo telefone", text: `${pet.name} pré-selecionado.` };
      return { type: "success", ico: "✓", title: "Cliente identificado", text: customer.name };
    }
    const phone = selectedThread.phone || selectedThread.handle;
    return { type: "warning", ico: "!", title: "Cliente não encontrado no cadastro", text: `Número: ${phone || "desconhecido"}. Inicie o cadastro para vincular.` };
  };

  const alert = selectedThread ? getAlert() : null;

  /* ---- Render ---- */
  return (
    <div className={`crmi-root${dark ? " dark" : ""}`}>

      {/* ---- TOPBAR ---- */}
      <div className="crmi-topbar">
        <button className="crmi-back-btn" onClick={() => navigate("/dashboard")} title="Voltar ao sistema">
          ← Voltar
        </button>
        <div className="crmi-topbar-divider" />
        <h1>CRM</h1>
        <span className="crumb">/ Conversas WhatsApp</span>
        <div className="crmi-search" style={{ marginLeft: 16 }}>
          <span>🔍</span>
          <input
            placeholder="Buscar conversas, tutores, pets..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && loadThreads()}
          />
        </div>
        <div className="crmi-topbar-right">
          <button className="crmi-theme-btn" onClick={() => setDark(d => !d)}>{dark ? "☀️" : "🌙"}</button>
          <Btn variant="ghost" size="sm" onClick={() => loadThreads()}>↺ Atualizar</Btn>
          {auth?.user?.name && (
            <div className={`crmi-avatar xs ${pickColor(auth.user.name)}`} style={{ marginLeft: 4 }}>
              {initials(auth.user.name)}
            </div>
          )}
        </div>
      </div>

      {/* ---- LAYOUT 3 COLUNAS ---- */}
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex" }}>

        {/* ---- COL 1: Lista de conversas ---- */}
        <aside className="crmi-panel" style={{ width: 300, flexShrink: 0 }}>
          <div className="crmi-threads-header">
            <h2>
              Conversas
              {!loadingThreads && <span className="crmi-count">{filteredThreads.length}</span>}
            </h2>
            <div className="crmi-filters">
              {STATUS_FILTER.map(f => (
                <button
                  key={f.key}
                  className={`crmi-chip${filterStatus === f.key ? " on" : ""}`}
                  onClick={() => setFilterStatus(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="crmi-threads-list">
            {loadingThreads ? (
              <p style={{ padding: "20px 12px", color: "var(--ci-text-3)", fontSize: 13 }}>Carregando conversas...</p>
            ) : filteredThreads.length === 0 ? (
              <p style={{ padding: "20px 12px", color: "var(--ci-text-3)", fontSize: 13 }}>Nenhuma conversa encontrada.</p>
            ) : (
              filteredThreads.map(t => {
                const name = t.customerName || t.customer?.name || t.name || t.handle || t.phone || "Desconhecido";
                const preview = t.preview || t.lastMessage || t.title || "";
                const time = fmtDate(t.lastMessageAt || t.updatedAt || t.createdAt);
                const unread = t.unreadCount || 0;
                const hasCustomer = !!t.customer;
                return (
                  <div
                    key={t.id}
                    className={`crmi-thread${t.id === selectedId ? " active" : ""}`}
                    onClick={() => selectThread(t.id)}
                  >
                    <Avatar name={name} />
                    <div className="crmi-thread-info">
                      <div className="crmi-thread-top">
                        <strong>{name}</strong>
                        <time>{time}</time>
                      </div>
                      <p>{preview}</p>
                      <div className="crmi-thread-tags">
                        {!hasCustomer && <span className="crmi-tag warning">sem cadastro</span>}
                        {t.status === "pending"   && <span className="crmi-tag warning">pendente</span>}
                        {t.status === "attending" && <span className="crmi-tag success">atendendo</span>}
                        {t.status === "closed"    && <span className="crmi-tag">fechado</span>}
                        {t.metadata?.aiPaused && <span className="crmi-tag info">IA pausada</span>}
                        {t.petName && <span className="crmi-tag primary">{t.petName}</span>}
                        {(t.metadata?.tags || t.tags || []).map(tg => (
                          <span key={tg} className="crmi-tag">{tg}</span>
                        ))}
                      </div>
                    </div>
                    <div className="crmi-thread-meta">
                      {unread > 0 && <span className="crmi-badge">{unread > 99 ? "99+" : unread}</span>}
                      {!hasCustomer && !unread && <span className="crmi-badge danger">!</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ---- COL 2: Conversa ---- */}
        <main className="crmi-panel" style={{ flex: 1, minWidth: 0 }}>
          {!selectedThread ? (
            <div className="crmi-empty" style={{ margin: "auto" }}>
              <div className="crmi-empty-ico">💬</div>
              <strong>Selecione uma conversa</strong>
              <p>Clique em um contato na lista para ver as mensagens.</p>
            </div>
          ) : (
            <>
              {/* Cabeçalho */}
              <div className="crmi-conv-header">
                <Avatar name={customer?.name || selectedThread.customerName || selectedThread.handle || "?"} size="lg" />
                <div className="crmi-conv-who">
                  <h3>
                    {customer?.name || selectedThread.customerName || selectedThread.handle || "Sem cadastro"}
                    {selectedThread.status === "attending" && <span className="crmi-pill-online">online</span>}
                  </h3>
                  <p style={{ fontFamily: "var(--ci-font-mono)", fontSize: 11, color: "var(--ci-text-3)" }}>
                    {selectedThread.phone || customer?.phone || selectedThread.handle}
                    {customer ? ` · cliente cadastrado` : " · sem cadastro"}
                  </p>
                </div>
                <div className="crmi-conv-actions">
                  <Btn size="sm" onClick={openSummary} disabled={!selectedId}>📋 Resumir</Btn>
                  {customer && <Btn size="sm" onClick={() => setModal("schedule")}>Cadastro</Btn>}
                  <Btn variant="brand" size="sm" onClick={() => setModal("schedule")}>📅 Agendar</Btn>
                </div>
              </div>

              {/* Banner de alerta */}
              {alert && <Alert type={alert.type} ico={alert.ico} title={alert.title} text={alert.text} />}

              {/* Mensagens */}
              <div className="crmi-messages" ref={bubblesRef}>
                {loadingMessages ? (
                  <p style={{ alignSelf: "center", color: "var(--ci-text-3)", fontSize: 13 }}>Carregando mensagens...</p>
                ) : messages.length === 0 ? (
                  <p style={{ alignSelf: "center", color: "var(--ci-text-3)", fontSize: 13 }}>Nenhuma mensagem ainda.</p>
                ) : (
                  messages.map((m, i) => {
                    const isOut = m.direction === "outbound" || m.fromAI;
                    const body  = m.body || m.text || m.content || "";
                    const time  = fmtTime(m.createdAt || m.sentAt || m.timestamp);
                    return (
                      <div key={m.id || i} className={`crmi-msg ${isOut ? "out" : "in"}`}>
                        {body}
                        {time && <time>{time}</time>}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Área composer */}
              <div className="crmi-composer-area">
                {aiSuggestion && (
                  <div className="crmi-composer-suggestion">
                    <div className="crmi-ai-ico sm">✨</div>
                    <div className="text">"{aiSuggestion}"</div>
                    <Btn size="sm" onClick={() => { setDraftMsg(aiSuggestion); setAiSuggestion(""); }}>Usar</Btn>
                    <Btn variant="ghost" size="sm" onClick={() => setAiSuggestion("")}>✕</Btn>
                  </div>
                )}
                <div className="crmi-composer">
                  <input
                    className="crmi-composer-input"
                    placeholder="Digite uma mensagem..."
                    value={draftMsg}
                    onChange={e => setDraftMsg(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  />
                  <Btn
                    variant="ghost"
                    title="Sugerir resposta com IA"
                    onClick={suggestReply}
                    disabled={loadingAi}
                  >
                    {loadingAi ? <Spinner /> : "✨"}
                  </Btn>
                  <Btn variant="brand" onClick={sendMessage} disabled={sendingMsg || !draftMsg.trim()}>
                    {sendingMsg ? <Spinner /> : "➤"}
                  </Btn>
                </div>
              </div>
            </>
          )}
        </main>

        {/* ---- COL 3: Painel do cliente ---- */}
        <div style={{ width: 320, flexShrink: 0, overflow: "hidden", display: "flex", flexDirection: "column", borderLeft: "1px solid var(--ci-border)", background: "var(--ci-surface)" }}>
          {selectedThread ? (
            <SidePanel
              thread={selectedThread}
              appointments={appointments}
              aiSuggestions={aiSuggestions}
              loadingAppointments={loadingAppts}
              onUseSuggestion={s => { setDraftMsg(s); setAiSuggestion(""); }}
              onSchedule={() => setModal("schedule")}
              onRegister={registerContact}
            />
          ) : (
            <div className="crmi-empty" style={{ marginTop: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
              <strong>Nenhuma conversa aberta</strong>
              <p>Selecione um contato para ver os detalhes.</p>
            </div>
          )}
        </div>
      </div>

      {/* ---- MODAL RESUMO ---- */}
      <Modal
        show={modal === "summary"}
        onClose={() => setModal(null)}
        title="📋 Resumo da conversa"
        subtitle="Gerado pela IA com base nas mensagens."
        footer={
          <Btn variant="ghost" onClick={() => setModal(null)}>Fechar</Btn>
        }
      >
        {loadingSummary ? (
          <p style={{ padding: "20px 0", textAlign: "center", color: "var(--ci-text-3)" }}>Gerando resumo com IA...</p>
        ) : (
          <div className="crmi-ai-card" style={{ marginTop: 8 }}>
            <div className="crmi-ai-ico">✨</div>
            <div className="crmi-ai-body">
              <small>RESUMO IA</small>
              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{summary || "Nenhum resumo disponível."}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* ---- MODAL AGENDAR ---- */}
      <Modal
        show={modal === "schedule"}
        onClose={() => setModal(null)}
        title="📅 Novo agendamento"
        subtitle={customer ? `Para: ${customer.name}${pet ? ` · ${pet.name}` : ""}` : "Sem cliente vinculado"}
        wide
        footer={<>
          <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
          <Btn variant="brand" onClick={createAppointment} disabled={schedLoading}>
            {schedLoading ? "Criando..." : "✓ Criar agendamento"}
          </Btn>
        </>}
      >
        <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
          <div className="crmi-field-row">
            <label>Cliente</label>
            <span className="value">{customer?.name || "Sem cadastro"}</span>
          </div>
          <div className="crmi-field-row">
            <label>Pet</label>
            <span className="value">{pet?.name || "—"}</span>
          </div>
          <div className="crmi-field-row">
            <label>Serviço</label>
            <input
              style={{ border: "1px solid var(--ci-border)", borderRadius: 8, padding: "6px 10px", fontFamily: "inherit", fontSize: 13, width: "100%" }}
              placeholder="Ex: Banho e tosa"
              value={schedForm.service}
              onChange={e => setSchedForm(f => ({ ...f, service: e.target.value }))}
            />
          </div>
          <div className="crmi-field-row">
            <label>Data</label>
            <input
              type="date"
              style={{ border: "1px solid var(--ci-border)", borderRadius: 8, padding: "6px 10px", fontFamily: "inherit", fontSize: 13, width: "100%" }}
              value={schedForm.date}
              onChange={e => setSchedForm(f => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div className="crmi-field-row">
            <label>Horário</label>
            <input
              type="time"
              style={{ border: "1px solid var(--ci-border)", borderRadius: 8, padding: "6px 10px", fontFamily: "inherit", fontSize: 13, width: "100%" }}
              value={schedForm.time}
              onChange={e => setSchedForm(f => ({ ...f, time: e.target.value }))}
            />
          </div>
          <div className="crmi-field-row">
            <label>Observação</label>
            <input
              style={{ border: "1px solid var(--ci-border)", borderRadius: 8, padding: "6px 10px", fontFamily: "inherit", fontSize: 13, width: "100%" }}
              placeholder="Opcional"
              value={schedForm.notes}
              onChange={e => setSchedForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
          {!customer && (
            <div className="crmi-alert warning" style={{ margin: 0 }}>
              <div className="crmi-alert-ico">!</div>
              <div>
                <strong>Cliente sem cadastro</strong>
                <p>O agendamento será criado com cadastro pendente.</p>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ---- TOAST ---- */}
      {toast && (
        <div className="crmi-toast">
          <div className="crmi-toast-head">
            <div className="crmi-toast-check">{toast.type === "success" ? "✓" : "i"}</div>
            <strong>{toast.msg}</strong>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <Btn variant="ghost" size="sm" onClick={() => setToast(null)}>Fechar</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
