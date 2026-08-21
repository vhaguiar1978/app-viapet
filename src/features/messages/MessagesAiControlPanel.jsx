import { useEffect, useMemo, useState } from "react";

const WEEK_DAYS = [
  { id: "sunday", label: "Dom" },
  { id: "monday", label: "Seg" },
  { id: "tuesday", label: "Ter" },
  { id: "wednesday", label: "Qua" },
  { id: "thursday", label: "Qui" },
  { id: "friday", label: "Sex" },
  { id: "saturday", label: "Sab" },
];

const AGENDA_TYPES = [
  { id: "estetica", label: "Estetica" },
  { id: "clinica", label: "Clinica" },
  { id: "internacao", label: "Internacao" },
];

const ACTION_OPTIONS = [
  { id: "reply_message", label: "Responder mensagem" },
  { id: "create_customer", label: "Cadastrar tutor" },
  { id: "create_pet", label: "Cadastrar pet" },
  { id: "schedule_appointment", label: "Agendar atendimento" },
  { id: "update_appointment", label: "Remarcar atendimento" },
  { id: "cancel_appointment", label: "Cancelar atendimento" },
];

const CALENDAR_PERMISSION_GROUPS = [
  {
    title: "Consultas",
    items: [
      ["consult_calendar", "Consultar agenda"],
      ["consult_available_slots", "Consultar horarios disponiveis"],
      ["consult_customer_appointments", "Consultar agendamentos do cliente"],
      ["consult_pet_history", "Consultar historico do pet"],
      ["consult_professional", "Consultar profissional"],
      ["consult_service", "Consultar servico"],
      ["consult_price", "Consultar preco"],
      ["consult_duration", "Consultar duracao"],
      ["consult_transport", "Consultar leva e traz"],
    ],
  },
  {
    title: "Alteracoes da agenda",
    items: [
      ["appointment_create", "Criar agendamento"],
      ["appointment_reschedule", "Remarcar agendamento"],
      ["appointment_cancel", "Cancelar agendamento"],
      ["appointment_change_service", "Alterar servico"],
      ["appointment_change_professional", "Alterar profissional"],
      ["appointment_add_service", "Adicionar servico"],
      ["appointment_remove_service", "Remover servico"],
      ["calendar_create_overbooking", "Criar encaixe"],
    ],
  },
  {
    title: "Acoes de risco",
    items: [
      ["calendar_block_slot", "Bloquear horario"],
      ["calendar_unblock_slot", "Desbloquear horario"],
      ["calendar_outside_business_hours", "Fora do expediente"],
      ["calendar_exceed_capacity", "Ultrapassar capacidade"],
      ["calendar_ignore_interval", "Ignorar intervalo"],
    ],
  },
];

const PERMISSION_MODE_OPTIONS = [
  ["automatic", "Automatico"],
  ["customer_confirmation", "Confirmacao do cliente"],
  ["human_approval", "Aprovacao humana"],
  ["denied", "Nao permitido"],
];

function parseCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildDefaultAiControl() {
  return {
    // MODO REAL por padrão: IA ligada, respondendo automaticamente e com
    // capabilities de agendamento/cadastro liberadas. O dono ainda pode
    // desligar manualmente no painel. autoExecute fica off por padrão pra
    // preservar opt-in em ações sem confirmação.
    enabled: true,
    autoReplyEnabled: true,
    autoExecuteEnabled: false,
    identifyAsAi: false,
    openaiApiKey: "",
    anthropicApiKey: "",
    anthropicModel: "claude-sonnet-5",
    groqApiKey: "",
    geminiApiKey: "",
    assistantName: "ViaPet IA",
    provider: "Anthropic Claude",
    instructions:
      "Responder com educacao, confirmar dados importantes e encaminhar para humano em caso de risco.",
    playbookMessages: [],
    escalationKeywords: ["urgente", "reclamacao", "cancelar"],
    capabilities: {
      replyToMessages: true,
      createCustomer: false,
      createPet: false,
      createAppointment: true,
      updateAppointment: true,
      cancelAppointment: true,
      viewFinancial: false,
    },
    scheduling: {
      requireHumanApproval: true,
      requireTutorConfirmation: true,
      allowNewCustomer: false,
      allowNewPet: false,
      allowOffGridTimes: true,
      minimumLeadMinutes: 30,
      slotMinutes: 10,
      maxDailyAppointments: 12,
      allowedAgendaTypes: ["estetica", "clinica", "internacao"],
      allowedServiceCategories: [
        "Banho",
        "Tosa",
        "Estetica",
        "Clinica",
        "Consultas",
        "Exames",
        "Vacinas",
        "Procedimentos",
        "Cirurgias",
        "Internacao",
      ],
      allowedDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
      allowedTimeStart: "08:00",
      allowedTimeEnd: "18:00",
      notes:
        "A IA so agenda automaticamente quando o tutor confirma e o horario obedece aos criterios.",
    },
  };
}

function normalizeControl(value) {
  const fallback = buildDefaultAiControl();
  if (!value || typeof value !== "object") return fallback;

  return {
    ...fallback,
    ...value,
    capabilities: {
      ...fallback.capabilities,
      ...(value.capabilities || {}),
    },
    playbookMessages: Array.isArray(value.playbookMessages)
      ? value.playbookMessages.filter((item) => item && item.text)
      : [],
    scheduling: {
      ...fallback.scheduling,
      ...(value.scheduling || {}),
    },
  };
}

function buildPlaybookAssistantReply(text) {
  const normalized = String(text || "").toLowerCase();
  const rules = [];

  if (normalized.includes("nao pode") || normalized.includes("não pode") || normalized.includes("nunca")) {
    rules.push("Vou tratar isso como uma proibicao da IA.");
  }
  if (
    normalized.includes("aprova") ||
    normalized.includes("confirm") ||
    normalized.includes("autoriza")
  ) {
    rules.push("Tambem vou marcar que essa acao precisa de aprovacao antes de executar.");
  }
  if (
    normalized.includes("agenda") ||
    normalized.includes("agendar") ||
    normalized.includes("remarcar")
  ) {
    rules.push("Essa orientacao entra nas regras da agenda automatica.");
  }

  return rules.length
    ? `Entendi. ${rules.join(" ")}`
    : "Entendi. Vou guardar essa orientacao como regra operacional da IA.";
}

function buildDefaultTestDraft() {
  const nextDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const isoValue = new Date(nextDate.getTime() - nextDate.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return {
    actionType: "schedule_appointment",
    agendaType: "estetica",
    serviceCategory: "Banho",
    appointmentAt: isoValue,
    tutorConfirmed: true,
    isNewCustomer: false,
    isNewPet: false,
  };
}

export function MessagesAiControlPanel({
  open,
  value,
  loading = false,
  saving = false,
  canEdit = false,
  feedback = "",
  onClose,
  onSave,
  onEvaluate,
  onTestReply,
  apiRequest,
  authHeaders,
  isDemo = false,
}) {
  const [draft, setDraft] = useState(() => normalizeControl(value));
  const [serviceCategoriesText, setServiceCategoriesText] = useState("");
  const [escalationKeywordsText, setEscalationKeywordsText] = useState("");
  const [testDraft, setTestDraft] = useState(() => buildDefaultTestDraft());
  const [testResult, setTestResult] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [playbookDraft, setPlaybookDraft] = useState("");
  // Chat de teste: simula uma conversa com a IA sem mexer no WhatsApp real
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState("");
  // Camada 3.1: base de conhecimento (manual da loja em texto livre)
  const [kbEntries, setKbEntries] = useState([]);
  const [isKbLoading, setIsKbLoading] = useState(false);
  const [kbTitleDraft, setKbTitleDraft] = useState("");
  const [kbContentDraft, setKbContentDraft] = useState("");
  const [kbSaving, setKbSaving] = useState(false);
  const [kbError, setKbError] = useState("");
  const [qualityLoading, setQualityLoading] = useState(false);
  const [qualityError, setQualityError] = useState("");
  const [qualityReport, setQualityReport] = useState(null);
  const [calendarPermissions, setCalendarPermissions] = useState([]);
  const [calendarPermissionsLoading, setCalendarPermissionsLoading] = useState(false);
  const [calendarWritesPaused, setCalendarWritesPaused] = useState(false);
  const [calendarApprovals, setCalendarApprovals] = useState([]);
  const [calendarRules, setCalendarRules] = useState(null);
  const [editingApprovalId, setEditingApprovalId] = useState("");
  const [approvalEdit, setApprovalEdit] = useState({ date: "", time: "", reason: "" });
  const [entityRules, setEntityRules] = useState([]);
  const [entityCatalogs, setEntityCatalogs] = useState({ service: [], professional: [], customer: [], pet: [] });
  const [entityRuleDraft, setEntityRuleDraft] = useState({ entityType: "service", entityId: "", permissionMode: "customer_confirmation", requiresHumanValidation: false });
  const [protectedSlotDraft, setProtectedSlotDraft] = useState({ date: "", time: "" });

  useEffect(() => {
    const normalized = normalizeControl(value);
    setDraft(normalized);
    setServiceCategoriesText(
      (normalized.scheduling.allowedServiceCategories || []).join(", "),
    );
    setEscalationKeywordsText((normalized.escalationKeywords || []).join(", "));
    setPlaybookDraft("");
    setChatMessages([]);
    setChatInput("");
    setChatError("");
    setKbTitleDraft("");
    setKbContentDraft("");
    setKbError("");
    setQualityError("");
    setQualityReport(null);
  }, [value, open]);

  // Carrega base de conhecimento quando o painel abre
  useEffect(() => {
    if (!open || !apiRequest || isDemo) return undefined;
    let active = true;
    async function loadKb() {
      try {
        setIsKbLoading(true);
        const response = await apiRequest("/api/crm-ai/knowledge-base", { headers: authHeaders });
        if (!active) return;
        setKbEntries(Array.isArray(response?.data) ? response.data : []);
      } catch (_) {
        if (active) setKbEntries([]);
      } finally {
        if (active) setIsKbLoading(false);
      }
    }
    loadKb();
    return () => { active = false; };
  }, [open, apiRequest, authHeaders, isDemo]);

  useEffect(() => {
    if (!open || !apiRequest || isDemo) return undefined;
    let active = true;
    async function loadCalendarPermissions() {
      try {
        setCalendarPermissionsLoading(true);
        const [permissionsResponse, settingsResponse, approvalsResponse, rulesResponse, entityRulesResponse, servicesResponse, employeesResponse, customersResponse, petsResponse] = await Promise.all([
          apiRequest("/api/crm-ai/operational/calendar-permissions", { headers: authHeaders }),
          apiRequest("/api/crm-ai/operational/settings", { headers: authHeaders }),
          apiRequest("/api/crm-ai/operational/approvals?status=pending", { headers: authHeaders }),
          apiRequest("/api/crm-ai/operational/calendar-rules", { headers: authHeaders }),
          apiRequest("/api/crm-ai/operational/entity-rules", { headers: authHeaders }),
          apiRequest("/services", { headers: authHeaders }),
          apiRequest("/employees", { headers: authHeaders }),
          apiRequest("/customers", { headers: authHeaders }),
          apiRequest("/pets", { headers: authHeaders }),
        ]);
        if (!active) return;
        setCalendarPermissions(Array.isArray(permissionsResponse?.data) ? permissionsResponse.data : []);
        setCalendarWritesPaused(Boolean(settingsResponse?.data?.settings?.calendarWritesPaused));
        setCalendarApprovals(Array.isArray(approvalsResponse?.data) ? approvalsResponse.data : []);
        setCalendarRules(rulesResponse?.data || null);
        setEntityRules(Array.isArray(entityRulesResponse?.data) ? entityRulesResponse.data : []);
        const asList=(response)=>Array.isArray(response)?response:Array.isArray(response?.data)?response.data:Array.isArray(response?.data?.data)?response.data.data:[];
        setEntityCatalogs({service:asList(servicesResponse),professional:asList(employeesResponse),customer:asList(customersResponse),pet:asList(petsResponse)});
      } catch (_) {
        if (active) setCalendarPermissions([]);
      } finally {
        if (active) setCalendarPermissionsLoading(false);
      }
    }
    loadCalendarPermissions();
    return () => { active = false; };
  }, [open, apiRequest, authHeaders, isDemo]);

  async function addKbEntry() {
    const title = String(kbTitleDraft || "").trim();
    const content = String(kbContentDraft || "").trim();
    if (!title || !content) {
      setKbError("Preencha titulo e conteudo.");
      return;
    }
    setKbError("");
    if (isDemo || !apiRequest) {
      setKbEntries((prev) => [
        { id: `demo-${Date.now()}`, title, content, pinned: false, createdAt: new Date().toISOString() },
        ...prev,
      ]);
      setKbTitleDraft("");
      setKbContentDraft("");
      return;
    }
    try {
      setKbSaving(true);
      const response = await apiRequest("/api/crm-ai/knowledge-base", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ title, content }),
      });
      if (response?.data) {
        setKbEntries((prev) => [response.data, ...prev]);
        setKbTitleDraft("");
        setKbContentDraft("");
      } else if (response?.error) {
        setKbError(response.error);
      }
    } catch (err) {
      setKbError(err?.message || "Erro ao salvar entrada");
    } finally {
      setKbSaving(false);
    }
  }

  async function removeKbEntry(entryId) {
    if (isDemo || !apiRequest) {
      setKbEntries((prev) => prev.filter((e) => e.id !== entryId));
      return;
    }
    try {
      await apiRequest(`/api/crm-ai/knowledge-base/${encodeURIComponent(entryId)}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      setKbEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch (_) {}
  }

  async function toggleKbPinned(entry) {
    if (isDemo || !apiRequest) {
      setKbEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, pinned: !e.pinned } : e)));
      return;
    }
    try {
      const response = await apiRequest(`/api/crm-ai/knowledge-base/${encodeURIComponent(entry.id)}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ pinned: !entry.pinned }),
      });
      if (response?.data) {
        setKbEntries((prev) => prev.map((e) => (e.id === entry.id ? response.data : e)));
      }
    } catch (_) {}
  }

  const capabilityRows = useMemo(
    () => [
      { id: "replyToMessages", label: "Responder mensagens" },
      { id: "createCustomer", label: "Cadastrar tutor" },
      { id: "createPet", label: "Cadastrar pet" },
      { id: "createAppointment", label: "Agendar atendimento" },
      { id: "updateAppointment", label: "Remarcar atendimento" },
      { id: "cancelAppointment", label: "Cancelar atendimento" },
      { id: "viewFinancial", label: "Consultar financeiro" },
    ],
    [],
  );

  if (!open) return null;

  function updateRoot(field, nextValue) {
    setDraft((current) => ({
      ...current,
      [field]: nextValue,
    }));
  }

  function updateCapabilities(field, nextValue) {
    setDraft((current) => ({
      ...current,
      capabilities: {
        ...current.capabilities,
        [field]: nextValue,
      },
    }));
  }

  function updateScheduling(field, nextValue) {
    setDraft((current) => ({
      ...current,
      scheduling: {
        ...current.scheduling,
        [field]: nextValue,
      },
    }));
  }

  function toggleDay(dayId) {
    const currentDays = draft.scheduling.allowedDays || [];
    updateScheduling(
      "allowedDays",
      currentDays.includes(dayId)
        ? currentDays.filter((item) => item !== dayId)
        : [...currentDays, dayId],
    );
  }

  function toggleAgendaType(typeId) {
    const currentTypes = draft.scheduling.allowedAgendaTypes || [];
    updateScheduling(
      "allowedAgendaTypes",
      currentTypes.includes(typeId)
        ? currentTypes.filter((item) => item !== typeId)
        : [...currentTypes, typeId],
    );
  }

  async function handleSave() {
    const payload = {
      ...draft,
      escalationKeywords: parseCsv(escalationKeywordsText),
      scheduling: {
        ...draft.scheduling,
        allowedServiceCategories: parseCsv(serviceCategoriesText),
      },
    };

    setDraft(payload);
    await onSave(payload);
    if (!isDemo && apiRequest && calendarPermissions.length) {
      await apiRequest("/api/crm-ai/operational/calendar-permissions", {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ permissions: calendarPermissions }),
      });
      if (calendarRules) await apiRequest("/api/crm-ai/operational/calendar-rules", { method:"PUT", headers:authHeaders, body:JSON.stringify(calendarRules) });
    }
  }

  function updateCalendarPermission(action, permissionMode) {
    setCalendarPermissions((current) => current.map((item) =>
      item.action === action ? { ...item, permissionMode, active: true, inherited: false } : item,
    ));
  }

  function updateCalendarRule(field, value) { setCalendarRules((current) => ({ ...(current || {}), [field]: value })); }
  function updateAutonomyDay(dayId, field, value) { setCalendarRules((current)=>({...current,schedule:{...(current?.schedule||{}),[dayId]:{enabled:true,start:"08:00",end:"18:00",...(current?.schedule?.[dayId]||{}),[field]:value}}})); }
  function addProtectedSlot() { if(!protectedSlotDraft.date||!protectedSlotDraft.time)return;setCalendarRules((current)=>({...current,settings:{...(current?.settings||{}),protectedSlots:[...(current?.settings?.protectedSlots||[]),{...protectedSlotDraft,allowAiBooking:false}]}}));setProtectedSlotDraft({date:"",time:""}); }
  async function saveEntityRule() {
    if (!entityRuleDraft.entityId || !apiRequest) return;
    const response=await apiRequest("/api/crm-ai/operational/entity-rules",{method:"PUT",headers:authHeaders,body:JSON.stringify(entityRuleDraft)});
    if(response?.data)setEntityRules((current)=>[response.data,...current.filter((item)=>!(item.entityType===response.data.entityType&&item.entityId===response.data.entityId))]);
  }
  async function removeEntityRule(ruleId) {
    if (!apiRequest || !canEdit) return;
    await apiRequest(`/api/crm-ai/operational/entity-rules/${encodeURIComponent(ruleId)}`, { method:"DELETE", headers:authHeaders });
    setEntityRules((current)=>current.filter((item)=>item.id!==ruleId));
  }

  async function toggleCalendarPause() {
    const paused = !calendarWritesPaused;
    if (!isDemo && apiRequest) {
      await apiRequest("/api/crm-ai/operational/calendar-automation-pause", {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ paused }),
      });
    }
    setCalendarWritesPaused(paused);
  }

  async function decideCalendarApproval(approvalId, decision, payload = null) {
    if (!apiRequest || isDemo) return;
    const response = await apiRequest(`/api/crm-ai/operational/approvals/${encodeURIComponent(approvalId)}/decision`, {
      method: "POST", headers: authHeaders, body: JSON.stringify({ decision, ...(payload ? { payload } : {}) }),
    });
    if (response?.success || decision === "reject") { setCalendarApprovals((current) => current.filter((item) => item.id !== approvalId)); setEditingApprovalId(""); }
  }

  async function handleEvaluate() {
    setIsEvaluating(true);
    setTestResult(null);

    try {
      const result = await onEvaluate({
        actionType: testDraft.actionType,
        payload: {
          agendaType: testDraft.agendaType,
          serviceCategory: testDraft.serviceCategory,
          appointmentAt: testDraft.appointmentAt,
          tutorConfirmed: testDraft.tutorConfirmed,
          isNewCustomer: testDraft.isNewCustomer,
          isNewPet: testDraft.isNewPet,
        },
      });
      setTestResult(result);
    } finally {
      setIsEvaluating(false);
    }
  }

  async function handleSendChat() {
    const text = String(chatInput || "").trim();
    if (!text || chatSending) return;
    if (typeof onTestReply !== "function") {
      setChatError("Chat de teste indisponivel — backend nao conectado.");
      return;
    }

    setChatError("");
    const userMsg = { role: "user", content: text, ts: Date.now() };
    const nextHistory = [...chatMessages, userMsg];
    setChatMessages(nextHistory);
    setChatInput("");
    setChatSending(true);

    try {
      const apiHistory = nextHistory.map((m) => ({ role: m.role, content: m.content }));
      const result = await onTestReply({ messages: apiHistory });
      const replyText = String(result?.reply || "").trim();
      if (!replyText) {
        setChatError("A IA nao retornou texto. Verifique a configuracao do provedor no painel.");
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: replyText, ts: Date.now() },
        ]);
      }
    } catch (err) {
      setChatError(err?.message || "Falha ao gerar resposta da IA.");
    } finally {
      setChatSending(false);
    }
  }

  async function runQualityTests() {
    setQualityError("");
    setQualityReport(null);

    if (isDemo || !apiRequest) {
      setQualityReport({
        ok: true,
        passed: 2,
        failed: 0,
        total: 2,
        averageScore: 92,
        durationMs: 320,
        results: [
          {
            id: "demo_agenda",
            title: "Horario para banho hoje",
            passed: true,
            score: 95,
            reply: "Para hoje eu tenho 10h, 13h30 ou 16h para banho. Qual fica melhor?",
            issues: [],
          },
          {
            id: "demo_comprovante",
            title: "Comprovante de pagamento",
            passed: true,
            score: 90,
            reply: "Recebi o comprovante e vou conferir o pagamento no agendamento.",
            issues: [],
          },
        ],
      });
      return;
    }

    try {
      setQualityLoading(true);
      const response = await apiRequest("/api/crm-ai/control/quality-tests", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({}),
      });

      if (!response?.success) {
        throw new Error(response?.error || "Nao foi possivel rodar os testes da IA.");
      }

      setQualityReport(response.data || null);
    } catch (err) {
      setQualityError(err?.message || "Falha ao rodar testes de qualidade da IA.");
    } finally {
      setQualityLoading(false);
    }
  }

  function handleResetChat() {
    setChatMessages([]);
    setChatInput("");
    setChatError("");
  }

  function appendPlaybookMessage() {
    const content = String(playbookDraft || "").trim();
    if (!content) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: content,
      createdAt: new Date().toISOString(),
    };
    const assistantMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      text: buildPlaybookAssistantReply(content),
      createdAt: new Date().toISOString(),
    };

    setDraft((current) => ({
      ...current,
      instructions: `${String(current.instructions || "").trim()}\n- ${content}`.trim(),
      playbookMessages: [...(current.playbookMessages || []), userMessage, assistantMessage].slice(-40),
    }));

    setPlaybookDraft("");
  }

  return (
    <div className="messages-ai-control-overlay" onClick={onClose}>
      <div
        className="messages-ai-control-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="messages-ai-control-head">
          <div>
            <span>Controle da IA</span>
            <h2>Permissoes, limites e criterios de agenda</h2>
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

        <div className="messages-ai-control-grid">
          <section className="messages-ai-control-card">
            <div className="messages-ai-control-section-head">
              <strong>Operacao</strong>
              <span>{loading ? "Carregando..." : "Base da automacao"}</span>
            </div>
            <div className="messages-ai-control-fields">
              <label>
                <span>Nome da assistente</span>
                <input
                  type="text"
                  value={draft.assistantName}
                  onChange={(event) => updateRoot("assistantName", event.target.value)}
                  disabled={!canEdit || loading}
                />
              </label>
              <label>
                <span>Provedor</span>
                <select
                  value={draft.provider}
                  onChange={(event) => updateRoot("provider", event.target.value)}
                  disabled={!canEdit || loading}
                >
                  <option value="OpenAI GPT-5.5">OpenAI GPT-5.5 (premium)</option>
                  <option value="Anthropic Claude">Anthropic Claude (recomendado)</option>
                  <option value="Groq">Groq (economico)</option>
                  <option value="Google Gemini">Google Gemini (reserva)</option>
                </select>
              </label>
            </div>
            <div className="messages-ai-control-toggles">
              <label>
                <input
                  type="checkbox"
                  checked={draft.enabled}
                  onChange={(event) => updateRoot("enabled", event.target.checked)}
                  disabled={!canEdit || loading}
                />
                <span>IA ativa no atendimento</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={draft.autoReplyEnabled}
                  onChange={(event) => updateRoot("autoReplyEnabled", event.target.checked)}
                  disabled={!canEdit || loading}
                />
                <span>Responder mensagens automaticamente</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={draft.autoExecuteEnabled}
                  onChange={(event) => updateRoot("autoExecuteEnabled", event.target.checked)}
                  disabled={!canEdit || loading}
                />
                <span>Executar acoes sem clicar em salvar</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={Boolean(draft.identifyAsAi)}
                  onChange={(event) => updateRoot("identifyAsAi", event.target.checked)}
                  disabled={!canEdit || loading}
                />
                <span>Identificar como IA nas mensagens (desligado = mais humanizada)</span>
              </label>
            </div>
            <label className="messages-ai-control-textarea" style={{ marginTop: 8 }}>
              <span>Chave Anthropic Claude <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" style={{ fontSize:12,color:"#6d5df6" }}>pegar chave</a></span>
              <input type="password" value={draft.anthropicApiKey || ""} onChange={(event)=>updateRoot("anthropicApiKey",event.target.value)} disabled={!canEdit||loading} placeholder="sk-ant-..." style={{padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:6,fontSize:13,width:"100%",fontFamily:"monospace"}} />
              <select value={draft.anthropicModel || "claude-sonnet-5"} onChange={(event)=>updateRoot("anthropicModel",event.target.value)} disabled={!canEdit||loading}>
                <option value="claude-sonnet-5">Claude Sonnet 5 — equilibrio recomendado</option>
                <option value="claude-haiku-4-5">Claude Haiku 4.5 — mais economico</option>
                <option value="claude-opus-5">Claude Opus 5 — máxima qualidade</option>
              </select>
              <span style={{fontSize:11,color:"#6b7280",marginTop:4}}>A chave fica isolada nesta empresa. O Claude interpreta; as permissões do ViaPet autorizam cada ação.</span>
            </label>
            <label className="messages-ai-control-textarea" style={{ marginTop: 8 }}>
              <span>
                Chave OpenAI premium{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: "#6d5df6" }}
                >
                  pegar chave
                </a>
              </span>
              <input
                type="password"
                value={draft.openaiApiKey || ""}
                onChange={(event) => updateRoot("openaiApiKey", event.target.value)}
                disabled={!canEdit || loading}
                placeholder="sk-..."
                style={{
                  padding: "8px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                  width: "100%",
                  fontFamily: "monospace",
                }}
              />
              <span style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                Recomendado para a melhor IA do CRM. Usa o modelo premium primeiro
                e tenta os provedores reserva antes do modo simples.
              </span>
            </label>
            <label className="messages-ai-control-textarea" style={{ marginTop: 8 }}>
              <span>
                🤖 Chave da IA Groq (gratuita){" "}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: "#6d5df6" }}
                >
                  pegue aqui
                </a>
              </span>
              <input
                type="password"
                value={draft.groqApiKey || ""}
                onChange={(event) => updateRoot("groqApiKey", event.target.value)}
                disabled={!canEdit || loading}
                placeholder="gsk_..."
                style={{
                  padding: "8px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                  width: "100%",
                  fontFamily: "monospace",
                }}
              />
              <span style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                Cole a chave que comeca com <code>gsk_</code>. Sem ela a IA usa
                respostas por palavras-chave (modo simples). Com a chave, vira
                IA real (Llama 3.1) — gratuita ate 14.400 msgs/dia.
              </span>
            </label>
            <label className="messages-ai-control-textarea" style={{ marginTop: 8 }}>
              <span>
                Chave Gemini reserva{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: "#6d5df6" }}
                >
                  pegar chave
                </a>
              </span>
              <input
                type="password"
                value={draft.geminiApiKey || ""}
                onChange={(event) => updateRoot("geminiApiKey", event.target.value)}
                disabled={!canEdit || loading}
                placeholder="AIza..."
                style={{
                  padding: "8px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                  width: "100%",
                  fontFamily: "monospace",
                }}
              />
              <span style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                Reserva para manter o atendimento inteligente se o premium ou o
                economico ficarem indisponiveis.
              </span>
            </label>
            <label className="messages-ai-control-textarea">
              <span>O que a IA pode e nao pode fazer</span>
              <textarea
                value={draft.instructions}
                onChange={(event) => updateRoot("instructions", event.target.value)}
                disabled={!canEdit || loading}
                placeholder="Explique o que a IA pode fazer sozinha, o que precisa de aprovacao e o que nunca deve executar."
              />
            </label>
            <label className="messages-ai-control-textarea">
              <span>Palavras que devem escalar para humano</span>
              <textarea
                value={escalationKeywordsText}
                onChange={(event) => setEscalationKeywordsText(event.target.value)}
                disabled={!canEdit || loading}
                placeholder="urgente, reclamacao, cancelar, emergencia"
              />
            </label>
          </section>

          <section className="messages-ai-control-card">
            <div className="messages-ai-control-section-head">
              <strong>Conversa com a IA</strong>
              <span>Explique o que ela pode, nao pode ou quando deve pedir aprovacao</span>
            </div>
            <div className="messages-ai-playbook-log">
              {(draft.playbookMessages || []).length ? (
                draft.playbookMessages.map((message) => (
                  <article
                    key={message.id}
                    className={
                      message.role === "assistant"
                        ? "messages-ai-playbook-item assistant"
                        : "messages-ai-playbook-item"
                    }
                  >
                    <strong>{message.role === "assistant" ? draft.assistantName || "IA" : "Voce"}</strong>
                    <p>{message.text}</p>
                  </article>
                ))
              ) : (
                <div className="messages-ai-playbook-empty">
                  Ainda nao ha orientacoes conversadas. Escreva abaixo como a IA deve agir.
                </div>
              )}
            </div>
            <div className="messages-ai-playbook-compose">
              <textarea
                value={playbookDraft}
                onChange={(event) => setPlaybookDraft(event.target.value)}
                disabled={!canEdit || loading}
                placeholder="Ex.: A IA nunca pode confirmar banho sem o tutor aprovar. Quando falar de dor, deve chamar humano."
              />
              <div className="messages-ai-playbook-actions">
                <button
                  type="button"
                  className="messages-ai-control-secondary-btn"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      playbookMessages: [],
                    }))
                  }
                  disabled={!canEdit || loading || !(draft.playbookMessages || []).length}
                >
                  Limpar conversa
                </button>
                <button
                  type="button"
                  className="messages-ai-control-primary-btn"
                  onClick={appendPlaybookMessage}
                  disabled={!canEdit || loading || !String(playbookDraft || "").trim()}
                >
                  Adicionar orientacao
                </button>
              </div>
            </div>
          </section>

          <section className="messages-ai-control-card">
            <div className="messages-ai-control-section-head">
              <strong>📚 Base de conhecimento da loja</strong>
              <span>
                Manual da loja em texto livre. A IA usa essas informacoes como VERDADE ABSOLUTA nas respostas
                (ex: "Pacote mensal custa R$ 300", "Sabado fechamos 15h", "Aceitamos PIX, cartao e dinheiro"). Maximo 30 entradas.
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {isKbLoading ? (
                <div style={{ fontSize: 12, color: "#94a3b8", padding: 8 }}>Carregando...</div>
              ) : kbEntries.length === 0 ? (
                <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", padding: 8 }}>
                  Nenhuma entrada ainda. Adicione informacoes que a IA precisa lembrar — preco de pacote, regras de horario, formas de pagamento, etc.
                </div>
              ) : (
                kbEntries.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      background: entry.pinned ? "#fefce8" : "#f8fafc",
                      border: entry.pinned ? "1px solid #fde68a" : "1px solid #e2e8f0",
                      borderRadius: 8,
                      padding: 10,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "space-between" }}>
                      <strong style={{ fontSize: 13, color: "#0f172a", flex: 1 }}>
                        {entry.pinned ? "📌 " : ""}{entry.title}
                      </strong>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          type="button"
                          onClick={() => toggleKbPinned(entry)}
                          disabled={!canEdit}
                          title={entry.pinned ? "Desafixar" : "Fixar no topo"}
                          style={{
                            background: "transparent",
                            border: "1px solid #e2e8f0",
                            borderRadius: 6,
                            padding: "2px 6px",
                            fontSize: 11,
                            cursor: canEdit ? "pointer" : "not-allowed",
                          }}
                        >
                          {entry.pinned ? "Desafixar" : "Fixar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeKbEntry(entry.id)}
                          disabled={!canEdit}
                          title="Remover entrada"
                          style={{
                            background: "transparent",
                            border: "1px solid #fecaca",
                            color: "#dc2626",
                            borderRadius: 6,
                            padding: "2px 6px",
                            fontSize: 11,
                            cursor: canEdit ? "pointer" : "not-allowed",
                          }}
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: "#475569", whiteSpace: "pre-wrap", margin: 0 }}>
                      {entry.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div
              style={{
                marginTop: 10,
                paddingTop: 10,
                borderTop: "1px dashed #e2e8f0",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <input
                type="text"
                value={kbTitleDraft}
                onChange={(e) => setKbTitleDraft(e.target.value)}
                disabled={!canEdit || kbSaving || isDemo}
                placeholder="Titulo curto (ex: Pacote mensal)"
                style={{
                  padding: "6px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                }}
              />
              <textarea
                value={kbContentDraft}
                onChange={(e) => setKbContentDraft(e.target.value)}
                disabled={!canEdit || kbSaving || isDemo}
                placeholder="Conteudo detalhado (ex: O pacote mensal e R$ 300, inclui 4 banhos + corte de unha + escovacao. Renova todo dia 1.)"
                rows={3}
                style={{
                  padding: "6px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
              {kbError ? (
                <span style={{ fontSize: 11, color: "#dc2626" }}>{kbError}</span>
              ) : null}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="messages-ai-control-primary-btn"
                  onClick={addKbEntry}
                  disabled={
                    !canEdit ||
                    kbSaving ||
                    !String(kbTitleDraft || "").trim() ||
                    !String(kbContentDraft || "").trim()
                  }
                >
                  {kbSaving ? "Salvando..." : "Adicionar entrada"}
                </button>
              </div>
            </div>
          </section>

          <section className="messages-ai-control-card">
            <div className="messages-ai-control-section-head">
              <strong>Permissoes</strong>
              <span>O que a IA pode fazer</span>
            </div>
            <div className="messages-ai-control-toggles">
              {capabilityRows.map((capability) => (
                <label key={capability.id}>
                  <input
                    type="checkbox"
                    checked={Boolean(draft.capabilities[capability.id])}
                    onChange={(event) =>
                      updateCapabilities(capability.id, event.target.checked)
                    }
                    disabled={!canEdit || loading}
                  />
                  <span>{capability.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="messages-ai-control-card messages-ai-calendar-permissions-card">
            <div className="messages-ai-control-section-head">
              <strong>Permissoes da agenda</strong>
              <span>Claude interpreta. O ViaPet autoriza e executa.</span>
            </div>
            <div className={`messages-ai-emergency-control${calendarWritesPaused ? " paused" : ""}`}>
              <div>
                <strong>{calendarWritesPaused ? "Automacoes pausadas" : "Automacoes liberadas pelas regras"}</strong>
                <span>A IA continua respondendo; a pausa bloqueia somente alteracoes no sistema.</span>
              </div>
              <button type="button" onClick={toggleCalendarPause} disabled={!canEdit || calendarPermissionsLoading}>
                {calendarWritesPaused ? "Retomar automacoes" : "Pausar automacoes"}
              </button>
            </div>
            {calendarPermissionsLoading ? <div className="messages-ai-control-feedback">Carregando permissoes...</div> : null}
            <div className="messages-ai-permission-groups">
              {CALENDAR_PERMISSION_GROUPS.map((group) => (
                <div className="messages-ai-permission-group" key={group.title}>
                  <strong>{group.title}</strong>
                  {group.items.map(([action, label]) => {
                    const permission = calendarPermissions.find((item) => item.action === action);
                    return (
                      <label key={action}>
                        <span>{label}</span>
                        <select
                          value={permission?.permissionMode || "denied"}
                          onChange={(event) => updateCalendarPermission(action, event.target.value)}
                          disabled={!canEdit || calendarPermissionsLoading}
                        >
                          {PERMISSION_MODE_OPTIONS.map(([value, optionLabel]) => (
                            <option key={value} value={value}>{optionLabel}</option>
                          ))}
                        </select>
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>

          <section className="messages-ai-control-card">
            <div className="messages-ai-control-section-head"><strong>Regras de seguranca da agenda</strong><span>Validadas pelo ViaPet antes de qualquer alteracao</span></div>
            {calendarRules ? <div className="messages-ai-control-fields three">
              {[["minimumNoticeMinutes","Antecedencia para agendar (min)"],["maximumAdvanceDays","Antecedencia maxima (dias)"],["minimumCancellationMinutes","Prazo para cancelar (min)"],["minimumRescheduleMinutes","Prazo para remarcar (min)"],["dailyLimitPerCustomer","Limite diario por tutor"],["dailyLimitPerPet","Limite diario por pet"],["intervalMinutes","Intervalo entre servicos (min)"],["maximumOverbookingsPerDay","Encaixes por dia"],["maxAutomaticTransactionValue","Valor maximo automatico (R$)"]].map(([field,label])=><label key={field}><span>{label}</span><input type="number" min="0" value={calendarRules[field] ?? ""} onChange={(event)=>updateCalendarRule(field,event.target.value===""?null:Number(event.target.value))} disabled={!canEdit}/></label>)}
            </div> : <div className="messages-ai-control-feedback">Carregando regras...</div>}
            {calendarRules ? <div className="messages-ai-autonomy-week"><strong>Autonomia por dia e horario</strong>{WEEK_DAYS.map((day)=>{const rule=calendarRules.schedule?.[day.id]||{enabled:false,start:"08:00",end:"18:00"};return <div key={day.id}><label><input type="checkbox" checked={Boolean(rule.enabled)} onChange={(event)=>updateAutonomyDay(day.id,"enabled",event.target.checked)} disabled={!canEdit}/><span>{day.label}</span></label><input type="time" value={rule.start||"08:00"} onChange={(event)=>updateAutonomyDay(day.id,"start",event.target.value)} disabled={!canEdit||!rule.enabled}/><input type="time" value={rule.end||"18:00"} onChange={(event)=>updateAutonomyDay(day.id,"end",event.target.value)} disabled={!canEdit||!rule.enabled}/></div>})}</div> : null}
            {calendarRules ? <div className="messages-ai-calendar-options"><label><input type="checkbox" checked={Boolean(calendarRules.settings?.requireCancellationReason)} onChange={(event)=>setCalendarRules((current)=>({...current,settings:{...(current.settings||{}),requireCancellationReason:event.target.checked}}))}/><span>Exigir motivo do cancelamento</span></label><label><input type="checkbox" checked={Boolean(calendarRules.settings?.autoNotifyWaitlist)} onChange={(event)=>setCalendarRules((current)=>({...current,settings:{...(current.settings||{}),autoNotifyWaitlist:event.target.checked}}))}/><span>Avisar automaticamente a lista de espera quando surgir vaga</span></label></div> : null}
            {calendarRules ? <div className="messages-ai-protected-slots"><strong>Horarios protegidos</strong><div><input type="date" value={protectedSlotDraft.date} onChange={(event)=>setProtectedSlotDraft((current)=>({...current,date:event.target.value}))}/><input type="time" value={protectedSlotDraft.time} onChange={(event)=>setProtectedSlotDraft((current)=>({...current,time:event.target.value}))}/><button type="button" onClick={addProtectedSlot} disabled={!canEdit}>Proteger horario</button></div><div>{(calendarRules.settings?.protectedSlots||[]).map((slot,index)=><span key={`${slot.date}-${slot.time}-${index}`}>{slot.date} · {slot.time}<button type="button" onClick={()=>setCalendarRules((current)=>({...current,settings:{...(current.settings||{}),protectedSlots:(current.settings?.protectedSlots||[]).filter((_,itemIndex)=>itemIndex!==index)}}))}>×</button></span>)}</div></div> : null}
          </section>

          <section className="messages-ai-control-card">
            <div className="messages-ai-control-section-head"><strong>Regras especificas</strong><span>Servico, profissional, tutor ou pet</span></div>
            <div className="messages-ai-entity-rule-form">
              <select value={entityRuleDraft.entityType} onChange={(event)=>setEntityRuleDraft((current)=>({...current,entityType:event.target.value,entityId:""}))}><option value="service">Servico</option><option value="professional">Profissional</option><option value="customer">Tutor</option><option value="pet">Pet</option></select>
              <select value={entityRuleDraft.entityId} onChange={(event)=>setEntityRuleDraft((current)=>({...current,entityId:event.target.value}))}><option value="">Selecione...</option>{(entityCatalogs[entityRuleDraft.entityType]||[]).map((item)=><option key={item.id} value={item.id}>{item.name||item.storeName||item.email||item.id}</option>)}</select>
              <select value={entityRuleDraft.permissionMode} onChange={(event)=>setEntityRuleDraft((current)=>({...current,permissionMode:event.target.value}))}>{PERMISSION_MODE_OPTIONS.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
              <label><input type="checkbox" checked={entityRuleDraft.requiresHumanValidation} onChange={(event)=>setEntityRuleDraft((current)=>({...current,requiresHumanValidation:event.target.checked}))}/><span>Sempre validar com humano</span></label>
              <button type="button" onClick={saveEntityRule} disabled={!canEdit||!entityRuleDraft.entityId}>Adicionar regra</button>
            </div>
            <div className="messages-ai-entity-rule-list">{entityRules.map((rule)=>{const item=(entityCatalogs[rule.entityType]||[]).find((entry)=>String(entry.id)===String(rule.entityId));return <span key={rule.id}><strong>{item?.name||rule.entityId}</strong> · {rule.permissionMode?.replaceAll("_"," ")}{rule.requiresHumanValidation?" · validacao humana":""}<button type="button" title="Remover regra" aria-label={`Remover regra de ${item?.name||rule.entityId}`} onClick={()=>removeEntityRule(rule.id)} disabled={!canEdit}>×</button></span>})}</div>
          </section>

          <section className="messages-ai-control-card">
            <div className="messages-ai-control-section-head">
              <strong>Aprovacoes da IA</strong>
              <span>{calendarApprovals.length} solicitacao(oes) aguardando decisao</span>
            </div>
            <div className="messages-ai-approval-list">
              {calendarApprovals.length ? calendarApprovals.map((approval) => (
                <article key={approval.id}>
                  <div><strong>{String(approval.action || "Acao da agenda").replaceAll("_", " ")}</strong><span>{approval.payload?.date || approval.payload?.appointmentDate || ""} {approval.payload?.time || ""}</span></div>
                  <p>{approval.payload?.reason || approval.payload?.motivo || "Solicitacao preparada pela ViaPet IA."}</p>
                  {editingApprovalId === approval.id ? <div className="messages-ai-approval-edit">
                    <label><span>Nova data</span><input type="date" value={approvalEdit.date} onChange={(event)=>setApprovalEdit((current)=>({...current,date:event.target.value}))}/></label>
                    <label><span>Novo horario</span><input type="time" value={approvalEdit.time} onChange={(event)=>setApprovalEdit((current)=>({...current,time:event.target.value}))}/></label>
                    <label><span>Motivo</span><input type="text" value={approvalEdit.reason} onChange={(event)=>setApprovalEdit((current)=>({...current,reason:event.target.value}))}/></label>
                  </div> : null}
                  <div className="messages-ai-approval-actions">
                    <button type="button" className="reject" onClick={() => decideCalendarApproval(approval.id, "reject")} disabled={!canEdit}>Recusar</button>
                    <button type="button" className="edit" onClick={() => { setEditingApprovalId(approval.id); setApprovalEdit({date:approval.payload?.date||"",time:String(approval.payload?.time||"").slice(0,5),reason:approval.payload?.reason||approval.payload?.motivo||""}); }} disabled={!canEdit}>Editar</button>
                    {editingApprovalId === approval.id ? <button type="button" onClick={() => decideCalendarApproval(approval.id, "approve", approvalEdit)} disabled={!canEdit}>Editar e aprovar</button> : null}
                    <button type="button" onClick={() => decideCalendarApproval(approval.id, "approve")} disabled={!canEdit}>Aprovar</button>
                  </div>
                </article>
              )) : <div className="messages-ai-control-feedback">Nenhuma aprovacao pendente.</div>}
            </div>
          </section>

          <section className="messages-ai-control-card">
            <div className="messages-ai-control-section-head">
              <strong>Criterios de agenda</strong>
              <span>Como a IA pode agendar</span>
            </div>
            <div className="messages-ai-control-toggles compact">
              <label>
                <input
                  type="checkbox"
                  checked={draft.scheduling.requireHumanApproval}
                  onChange={(event) =>
                    updateScheduling("requireHumanApproval", event.target.checked)
                  }
                  disabled={!canEdit || loading}
                />
                <span>Exigir aprovacao humana</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={draft.scheduling.requireTutorConfirmation}
                  onChange={(event) =>
                    updateScheduling("requireTutorConfirmation", event.target.checked)
                  }
                  disabled={!canEdit || loading}
                />
                <span>Exigir confirmacao do tutor</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={draft.scheduling.allowNewCustomer}
                  onChange={(event) =>
                    updateScheduling("allowNewCustomer", event.target.checked)
                  }
                  disabled={!canEdit || loading}
                />
                <span>Pode criar tutor novo</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={draft.scheduling.allowNewPet}
                  onChange={(event) =>
                    updateScheduling("allowNewPet", event.target.checked)
                  }
                  disabled={!canEdit || loading}
                />
                <span>Pode criar pet novo</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={draft.scheduling.allowOffGridTimes}
                  onChange={(event) =>
                    updateScheduling("allowOffGridTimes", event.target.checked)
                  }
                  disabled={!canEdit || loading}
                />
                <span>Aceitar horarios quebrados</span>
              </label>
            </div>

            <div className="messages-ai-control-fields three">
              <label>
                <span>Inicio</span>
                <input
                  type="time"
                  value={draft.scheduling.allowedTimeStart}
                  onChange={(event) =>
                    updateScheduling("allowedTimeStart", event.target.value)
                  }
                  disabled={!canEdit || loading}
                />
              </label>
              <label>
                <span>Fim</span>
                <input
                  type="time"
                  value={draft.scheduling.allowedTimeEnd}
                  onChange={(event) =>
                    updateScheduling("allowedTimeEnd", event.target.value)
                  }
                  disabled={!canEdit || loading}
                />
              </label>
              <label>
                <span>Antecedencia minima (min)</span>
                <input
                  type="number"
                  min="0"
                  value={draft.scheduling.minimumLeadMinutes}
                  onChange={(event) =>
                    updateScheduling("minimumLeadMinutes", Number(event.target.value || 0))
                  }
                  disabled={!canEdit || loading}
                />
              </label>
              <label>
                <span>Intervalo base (min)</span>
                <input
                  type="number"
                  min="0"
                  value={draft.scheduling.slotMinutes}
                  onChange={(event) =>
                    updateScheduling("slotMinutes", Number(event.target.value || 0))
                  }
                  disabled={!canEdit || loading}
                />
              </label>
              <label>
                <span>Maximo por dia</span>
                <input
                  type="number"
                  min="0"
                  value={draft.scheduling.maxDailyAppointments}
                  onChange={(event) =>
                    updateScheduling("maxDailyAppointments", Number(event.target.value || 0))
                  }
                  disabled={!canEdit || loading}
                />
              </label>
            </div>

            <div className="messages-ai-control-option-group">
              <span>Tipos de agenda permitidos</span>
              <div className="messages-ai-control-chip-row">
                {AGENDA_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    className={
                      (draft.scheduling.allowedAgendaTypes || []).includes(type.id)
                        ? "messages-ai-control-chip active"
                        : "messages-ai-control-chip"
                    }
                    onClick={() => toggleAgendaType(type.id)}
                    disabled={!canEdit || loading}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="messages-ai-control-option-group">
              <span>Dias permitidos</span>
              <div className="messages-ai-control-chip-row">
                {WEEK_DAYS.map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    className={
                      (draft.scheduling.allowedDays || []).includes(day.id)
                        ? "messages-ai-control-chip active"
                        : "messages-ai-control-chip"
                    }
                    onClick={() => toggleDay(day.id)}
                    disabled={!canEdit || loading}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="messages-ai-control-textarea">
              <span>Categorias de servico permitidas</span>
              <textarea
                value={serviceCategoriesText}
                onChange={(event) => setServiceCategoriesText(event.target.value)}
                disabled={!canEdit || loading}
                placeholder="Banho, Tosa, Estetica"
              />
            </label>
            <label className="messages-ai-control-textarea">
              <span>Observacoes de agenda</span>
              <textarea
                value={draft.scheduling.notes}
                onChange={(event) => updateScheduling("notes", event.target.value)}
                disabled={!canEdit || loading}
              />
            </label>
          </section>

          <section className="messages-ai-control-card">
            <div className="messages-ai-control-section-head">
              <strong>Qualidade da IA</strong>
              <span>
                Roda perguntas reais do CRM e aponta resposta generica, fora do assunto
                ou com data errada antes de chegar no cliente.
              </span>
            </div>

            <div className="messages-ai-control-footer">
              <button
                type="button"
                className="messages-ai-control-primary-btn"
                onClick={runQualityTests}
                disabled={loading || qualityLoading}
              >
                {qualityLoading ? "Testando IA..." : "Rodar testes da IA"}
              </button>
            </div>

            {qualityError ? (
              <div className="messages-ai-control-result messages-ai-control-warnings">
                {qualityError}
              </div>
            ) : null}

            {qualityReport ? (
              <div className="messages-ai-control-result">
                <strong>
                  Nota media: {qualityReport.averageScore || 0}/100 -{" "}
                  {qualityReport.passed || 0} de {qualityReport.total || 0} testes passaram
                </strong>
                <p style={{ margin: "6px 0 0", fontSize: 12, color: "#64748b" }}>
                  {qualityReport.failed
                    ? `${qualityReport.failed} ponto(s) precisam de ajuste.`
                    : "Tudo certo nos principais cenarios de atendimento."}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                  {(qualityReport.results || []).map((item) => (
                    <article
                      key={item.id}
                      style={{
                        border: `1px solid ${item.passed ? "#bbf7d0" : "#fecaca"}`,
                        background: item.passed ? "#f0fdf4" : "#fef2f2",
                        borderRadius: 10,
                        padding: 10,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <strong style={{ fontSize: 13, color: "#0f172a" }}>
                          {item.passed ? "OK" : "Ajustar"} - {item.title}
                        </strong>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>
                          {item.score}/100
                        </span>
                      </div>
                      <p style={{ margin: "6px 0 0", fontSize: 12, color: "#475569" }}>
                        Cliente: {item.question}
                      </p>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#334155" }}>
                        IA: {item.reply}
                      </p>
                      {item.issues?.length ? (
                        <ul style={{ margin: "6px 0 0", paddingLeft: 16, fontSize: 12, color: "#991b1b" }}>
                          {item.issues.slice(0, 3).map((issue) => (
                            <li key={`${item.id}-${issue.code}`}>{issue.message}</li>
                          ))}
                        </ul>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className="messages-ai-control-card">
            <div className="messages-ai-control-section-head">
              <strong>Teste rapido</strong>
              <span>Ver se a regra aprova a acao</span>
            </div>
            <div className="messages-ai-control-fields three">
              <label>
                <span>Acao</span>
                <select
                  value={testDraft.actionType}
                  onChange={(event) =>
                    setTestDraft((current) => ({
                      ...current,
                      actionType: event.target.value,
                    }))
                  }
                >
                  {ACTION_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Agenda</span>
                <select
                  value={testDraft.agendaType}
                  onChange={(event) =>
                    setTestDraft((current) => ({
                      ...current,
                      agendaType: event.target.value,
                    }))
                  }
                >
                  {AGENDA_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Servico</span>
                <input
                  type="text"
                  value={testDraft.serviceCategory}
                  onChange={(event) =>
                    setTestDraft((current) => ({
                      ...current,
                      serviceCategory: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>Data e hora</span>
                <input
                  type="datetime-local"
                  value={testDraft.appointmentAt}
                  onChange={(event) =>
                    setTestDraft((current) => ({
                      ...current,
                      appointmentAt: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <div className="messages-ai-control-toggles compact">
              <label>
                <input
                  type="checkbox"
                  checked={testDraft.tutorConfirmed}
                  onChange={(event) =>
                    setTestDraft((current) => ({
                      ...current,
                      tutorConfirmed: event.target.checked,
                    }))
                  }
                />
                <span>Tutor confirmou</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={testDraft.isNewCustomer}
                  onChange={(event) =>
                    setTestDraft((current) => ({
                      ...current,
                      isNewCustomer: event.target.checked,
                    }))
                  }
                />
                <span>Precisa criar tutor</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={testDraft.isNewPet}
                  onChange={(event) =>
                    setTestDraft((current) => ({
                      ...current,
                      isNewPet: event.target.checked,
                    }))
                  }
                />
                <span>Precisa criar pet</span>
              </label>
            </div>
            <div className="messages-ai-control-footer">
              <button
                type="button"
                className="messages-ai-control-secondary-btn"
                onClick={handleEvaluate}
                disabled={loading || isEvaluating}
              >
                {isEvaluating ? "Validando..." : "Testar regra"}
              </button>
            </div>
            {testResult ? (
              <div className="messages-ai-control-result">
                <strong>
                  Resultado:{" "}
                  {testResult.executionMode === "automatic"
                    ? "Executaria automatico"
                    : testResult.executionMode === "approval"
                      ? "Pediria aprovacao"
                      : "Bloquearia a acao"}
                </strong>
                {testResult.reasons?.length ? (
                  <ul>
                    {testResult.reasons.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
                {testResult.warnings?.length ? (
                  <ul className="messages-ai-control-warnings">
                    {testResult.warnings.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="messages-ai-control-card">
            <div className="messages-ai-control-section-head">
              <strong>Chat de teste com a IA 🐾</strong>
              <span>
                Converse aqui sem precisar conectar o WhatsApp. Usa o mesmo prompt e os
                mesmos servicos da sua loja, mas nao salva mensagem nem cria agendamento.
              </span>
            </div>

            <div className="messages-ai-control-chat">
              {chatMessages.length === 0 ? (
                <div className="messages-ai-control-chat-empty">
                  Comece digitando uma mensagem como se fosse um cliente.
                  Tente: <em>"oi, quanto fica banho de cachorro pequeno?"</em>
                </div>
              ) : (
                chatMessages.map((m, idx) => (
                  <div
                    key={`${m.role}-${idx}-${m.ts}`}
                    className={
                      m.role === "user"
                        ? "messages-ai-control-chat-msg user"
                        : "messages-ai-control-chat-msg assistant"
                    }
                  >
                    <span className="messages-ai-control-chat-role">
                      {m.role === "user" ? "Cliente" : "IA"}
                    </span>
                    <p>{m.content}</p>
                  </div>
                ))
              )}
              {chatSending ? (
                <div className="messages-ai-control-chat-msg assistant typing">
                  <span className="messages-ai-control-chat-role">IA</span>
                  <p>digitando...</p>
                </div>
              ) : null}
            </div>

            {chatError ? (
              <div className="messages-ai-control-result messages-ai-control-warnings">
                {chatError}
              </div>
            ) : null}

            <div className="messages-ai-control-chat-input-row">
              <input
                type="text"
                className="messages-ai-control-chat-input"
                value={chatInput}
                placeholder="Digite uma mensagem como cliente..."
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSendChat();
                  }
                }}
                disabled={chatSending}
              />
              <button
                type="button"
                className="messages-ai-control-primary-btn"
                onClick={handleSendChat}
                disabled={chatSending || !chatInput.trim()}
              >
                {chatSending ? "Enviando..." : "Enviar"}
              </button>
              <button
                type="button"
                className="messages-ai-control-secondary-btn"
                onClick={handleResetChat}
                disabled={chatSending || chatMessages.length === 0}
              >
                Limpar
              </button>
            </div>
          </section>
        </div>

        <div className="messages-ai-control-footer">
          <button
            type="button"
            className="messages-ai-control-secondary-btn"
            onClick={onClose}
          >
            Fechar painel
          </button>
          <button
            type="button"
            className="messages-ai-control-primary-btn"
            onClick={handleSave}
            disabled={!canEdit || loading || saving}
          >
            {saving ? "Salvando..." : "Salvar regras"}
          </button>
        </div>
      </div>
    </div>
  );
}
