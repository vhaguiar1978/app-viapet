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

function parseCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildDefaultAiControl() {
  return {
    enabled: false,
    autoReplyEnabled: false,
    autoExecuteEnabled: false,
    assistantName: "ViaPet IA",
    provider: "OpenAI",
    instructions:
      "Responder com educacao, confirmar dados importantes e encaminhar para humano em caso de risco.",
    playbookMessages: [],
    escalationKeywords: ["urgente", "reclamacao", "cancelar"],
    capabilities: {
      replyToMessages: true,
      createCustomer: false,
      createPet: false,
      createAppointment: false,
      updateAppointment: false,
      cancelAppointment: false,
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
}) {
  const [draft, setDraft] = useState(() => normalizeControl(value));
  const [serviceCategoriesText, setServiceCategoriesText] = useState("");
  const [escalationKeywordsText, setEscalationKeywordsText] = useState("");
  const [testDraft, setTestDraft] = useState(() => buildDefaultTestDraft());
  const [testResult, setTestResult] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [playbookDraft, setPlaybookDraft] = useState("");

  useEffect(() => {
    const normalized = normalizeControl(value);
    setDraft(normalized);
    setServiceCategoriesText(
      (normalized.scheduling.allowedServiceCategories || []).join(", "),
    );
    setEscalationKeywordsText((normalized.escalationKeywords || []).join(", "));
    setPlaybookDraft("");
  }, [value, open]);

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
                <input
                  type="text"
                  value={draft.provider}
                  onChange={(event) => updateRoot("provider", event.target.value)}
                  disabled={!canEdit || loading}
                />
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
            </div>
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
