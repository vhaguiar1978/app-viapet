import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ASSISTANT_QUICK_PROMPTS,
  ASSISTANT_SCREEN_MAP,
  findAssistantTopicFromText,
  getAssistantScreenByPath,
  getAssistantTopicByKey,
} from "../data/assistantScreenMap.js";

const ASSISTANT_LOG_STORAGE_KEY = "viapet.assistant.logs";
const ASSISTANT_MAX_LOGS = 200;
const ASSISTANT_PENDING_ROUTE_EVENT = "viapet-assistant-route-ready";

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function buildAssistantMessage({ role = "assistant", text = "", topicKey = "", actions = [], tone = "default" }) {
  return {
    id: `assistant-message-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    topicKey,
    actions,
    tone,
    createdAt: new Date().toISOString(),
  };
}

function readAssistantLogs() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ASSISTANT_LOG_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAssistantLog(entry) {
  if (typeof window === "undefined") return;
  const current = readAssistantLogs();
  const next = [entry, ...current].slice(0, ASSISTANT_MAX_LOGS);
  window.localStorage.setItem(ASSISTANT_LOG_STORAGE_KEY, JSON.stringify(next));
}

function logAssistantAction({ type, user, screen, route, details = "" }) {
  writeAssistantLog({
    id: `assistant-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    userId: String(user?.id || ""),
    userName: String(user?.name || user?.email || "Usuario"),
    screen,
    route,
    details,
    createdAt: new Date().toISOString(),
  });
}

function formatDateTimeLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function findScreenDefinition(screenKey = "") {
  return ASSISTANT_SCREEN_MAP.find((screen) => screen.page === screenKey) || null;
}

function findScreenElementDefinition(screenKey = "", elementId = "") {
  const screen = findScreenDefinition(screenKey);
  return screen?.elements?.find((element) => element.id === elementId) || null;
}

function getContextualPromptOptions(currentScreen) {
  const screenActions = Array.isArray(currentScreen?.actions) ? currentScreen.actions : [];
  const contextualTopics = screenActions
    .map((topicKey) => getAssistantTopicByKey(topicKey))
    .filter(Boolean)
    .slice(0, 3)
    .map((topic) => `Ajuda com ${topic.title.toLowerCase()}`);

  return Array.from(new Set([...ASSISTANT_QUICK_PROMPTS, ...contextualTopics])).slice(0, 6);
}

function buildActionButtons(topic) {
  if (!topic) return [];

  return [
    { id: "explain", label: "Explicar passo a passo", level: 1 },
    { id: "show_path", label: "Me mostrar o caminho", level: 2 },
    { id: "navigate", label: "Me levar ate la", level: 3 },
    { id: "assist_fill", label: "Fazer comigo", level: 4 },
  ];
}

function buildTopicReply(topic, currentScreen) {
  if (!topic) {
    return buildAssistantMessage({
      text:
        "Posso te ajudar com agenda, financeiro, cadastros e navegacao dentro do sistema. Me diga o que voce quer fazer e eu te mostro o caminho certo.",
      actions: [],
    });
  }

  const currentScreenName = currentScreen?.name ? `Voce esta em ${currentScreen.name}. ` : "";
  return buildAssistantMessage({
    text: `${currentScreenName}${topic.summary}`,
    topicKey: topic.key,
    actions: buildActionButtons(topic),
  });
}

function buildExplainReply(topic) {
  if (!topic) return null;
  const stepLines = topic.steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
  return buildAssistantMessage({
    text: `${topic.title}\n${stepLines}`,
    topicKey: topic.key,
    actions: buildActionButtons(topic).filter((action) => action.id !== "explain"),
  });
}

function getGuideSteps(topic, mode = "path") {
  if (!topic) return [];
  return mode === "arrival" ? topic.arrivalGuide || topic.pathGuide || [] : topic.pathGuide || [];
}

function findElementsByText(tagNames = ["button", "a"], text = "") {
  const normalizedText = normalizeText(text);
  if (!normalizedText || typeof document === "undefined") return [];

  return Array.from(document.querySelectorAll(tagNames.join(","))).filter((element) =>
    normalizeText(element.textContent || "").includes(normalizedText),
  );
}

function findFieldContainerByLabel(label = "") {
  const normalizedLabel = normalizeText(label);
  if (!normalizedLabel || typeof document === "undefined") return null;

  const directMatch = document.querySelector(`[data-field-label="${label}"]`);
  if (directMatch) {
    return directMatch;
  }

  return (
    Array.from(document.querySelectorAll(".field-block, .field-search"))
      .find((block) => {
        const labelElement = block.querySelector("label");
        return normalizeText(labelElement?.textContent || block.getAttribute("data-field-label") || "") === normalizedLabel;
      }) || null
  );
}

function findElementByLocator(locator = {}) {
  if (typeof document === "undefined" || !locator) return null;

  if (locator.selector) {
    return document.querySelector(locator.selector);
  }

  if (locator.href) {
    return document.querySelector(`a[href="${locator.href}"]`);
  }

  if (locator.hrefPrefix) {
    return document.querySelector(`a[href^="${locator.hrefPrefix}"]`);
  }

  if (locator.buttonText) {
    return findElementsByText(["button", "a"], locator.buttonText)[0] || null;
  }

  if (locator.label) {
    const container = findFieldContainerByLabel(locator.label);
    if (!container) return null;
    if (locator.fieldType === "select") return container.querySelector("select");
    if (locator.fieldType === "textarea") return container.querySelector("textarea");
    if (locator.fieldType === "button") return container.querySelector("button");
    return container.querySelector("input, textarea, select, button");
  }

  return null;
}

function scrollElementIntoView(target) {
  if (!target || typeof target.scrollIntoView !== "function") return;
  target.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
}

function getRectFromElement(target) {
  if (!target || typeof target.getBoundingClientRect !== "function") return null;
  const rect = target.getBoundingClientRect();
  if (!rect.width && !rect.height) return null;
  return rect;
}

function formatDraftValueByType(value, fieldType) {
  if (fieldType === "date") {
    const raw = String(value || "").trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
      const [day, month, year] = raw.split("/");
      return `${year}-${month}-${day}`;
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
      const [day, month, year] = raw.split("-");
      return `${year}-${month}-${day}`;
    }
    return raw;
  }

  return String(value ?? "");
}

function setNativeFieldValue(element, nextValue) {
  if (!element) return false;
  const tagName = String(element.tagName || "").toLowerCase();
  const normalizedValue = String(nextValue ?? "");

  if (tagName === "select") {
    const options = Array.from(element.options || []);
    const matchingOption =
      options.find((option) => normalizeText(option.value) === normalizeText(normalizedValue)) ||
      options.find((option) => normalizeText(option.textContent || "") === normalizeText(normalizedValue));
    if (matchingOption) {
      element.value = matchingOption.value;
      element.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
    return false;
  }

  if (tagName === "input" || tagName === "textarea") {
    const prototype = tagName === "textarea" ? window.HTMLTextAreaElement?.prototype : window.HTMLInputElement?.prototype;
    const descriptor = prototype ? Object.getOwnPropertyDescriptor(prototype, "value") : null;
    descriptor?.set?.call(element, normalizedValue);
    if (!descriptor?.set) {
      element.value = normalizedValue;
    }
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  return false;
}

function resolveGuideTarget(step) {
  if (!step) return null;
  const elementDefinition = findScreenElementDefinition(step.screenKey, step.elementId);
  if (!elementDefinition) return null;
  return findElementByLocator(elementDefinition.locator);
}

function AssistantChatIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12a8 8 0 0 1-8 8H6l-3 2 1.2-4.3A8 8 0 1 1 20 12Z" />
      <path d="M8.5 11.5h7" />
      <path d="M8.5 15h4.5" />
    </svg>
  );
}

function AssistantGuideOverlay({ guideState, onNext, onPrevious, onStop }) {
  const step = guideState?.steps?.[guideState.stepIndex] || null;
  const [targetRect, setTargetRect] = useState(null);

  useEffect(() => {
    function refreshRect() {
      const target = resolveGuideTarget(step);
      if (target) {
        scrollElementIntoView(target);
      }
      setTargetRect(getRectFromElement(target));
    }

    refreshRect();
    window.addEventListener("resize", refreshRect);
    window.addEventListener("scroll", refreshRect, true);
    return () => {
      window.removeEventListener("resize", refreshRect);
      window.removeEventListener("scroll", refreshRect, true);
    };
  }, [step]);

  if (!guideState?.steps?.length || !step) return null;

  const tooltipStyle = targetRect
    ? {
        top: Math.min(window.innerHeight - 220, targetRect.bottom + 16),
        left: Math.max(16, Math.min(window.innerWidth - 336, targetRect.left)),
      }
    : {
        top: 96,
        right: 24,
      };

  const frameStyle = targetRect
    ? {
        top: Math.max(8, targetRect.top - 8),
        left: Math.max(8, targetRect.left - 8),
        width: targetRect.width + 16,
        height: targetRect.height + 16,
      }
    : null;

  return (
    <div className="assistant-guide-overlay">
      {frameStyle ? <div className="assistant-guide-highlight" style={frameStyle} /> : null}
      <div className="assistant-guide-tooltip" style={tooltipStyle}>
        <div className="assistant-guide-kicker">
          <span>{guideState.mode === "arrival" ? "Voce esta no lugar certo" : "Mostrar o caminho"}</span>
          <strong>
            Passo {guideState.stepIndex + 1} de {guideState.steps.length}
          </strong>
        </div>
        <p>{step.instruction}</p>
        {!targetRect ? <small>Se o item nao estiver visivel, role a tela ou use "Me levar ate la".</small> : null}
        <div className="assistant-guide-actions">
          <button type="button" className="assistant-mini-btn" onClick={onPrevious} disabled={guideState.stepIndex === 0}>
            Voltar
          </button>
          <button type="button" className="assistant-mini-btn assistant-mini-btn-muted" onClick={onStop}>
            Parar assistente
          </button>
          <button type="button" className="assistant-mini-btn assistant-mini-btn-primary" onClick={onNext}>
            {guideState.stepIndex >= guideState.steps.length - 1 ? "Concluir" : "Proximo"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SystemAssistant({ currentUser }) {
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const currentScreen = useMemo(() => getAssistantScreenByPath(location.pathname), [location.pathname]);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState(() => [
    buildAssistantMessage({
      text: "Assistente IA online. Eu posso explicar, mostrar o caminho, te levar ate a tela certa e preparar campos para confirmacao.",
    }),
  ]);
  const [guideState, setGuideState] = useState(null);
  const [fillState, setFillState] = useState(null);
  const [confirmationState, setConfirmationState] = useState(null);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  const promptOptions = useMemo(() => getContextualPromptOptions(currentScreen), [currentScreen]);
  const recentLog = useMemo(() => readAssistantLogs()[0] || null, [messages.length, location.pathname]);
  const autonomyLevel = confirmationState
    ? 5
    : fillState
      ? 4
      : pendingNavigation
        ? 3
        : guideState
          ? 2
          : 1;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isOpen]);

  useEffect(() => {
    if (!pendingNavigation) return;

    const topic = getAssistantTopicByKey(pendingNavigation.topicKey);
    if (!topic) {
      setPendingNavigation(null);
      return;
    }

    if (location.pathname !== topic.route) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (pendingNavigation.openWorkflow === "agenda-create") {
        window.dispatchEvent(
          new CustomEvent(ASSISTANT_PENDING_ROUTE_EVENT, {
            detail: {
              workflow: "agenda-create",
              date: pendingNavigation.draft?.date || "",
              time: pendingNavigation.draft?.time || "08:00",
              customerName: pendingNavigation.draft?.customerName || "",
              petName: pendingNavigation.draft?.petName || "",
              serviceName: pendingNavigation.draft?.serviceName || "",
            },
          }),
        );
      }

      setMessages((current) => [
        ...current,
        buildAssistantMessage({
          text: "Pronto, voce esta na tela correta.",
          topicKey: topic.key,
          actions: buildActionButtons(topic).filter((action) => action.id !== "navigate"),
        }),
      ]);

      const nextGuideSteps = getGuideSteps(topic, "arrival");
      if (nextGuideSteps.length) {
        setGuideState({
          topicKey: topic.key,
          mode: "arrival",
          steps: nextGuideSteps,
          stepIndex: 0,
        });
      }

      if (pendingNavigation.mode === "fill" && topic.fillFields?.length) {
        setFillState({
          topicKey: topic.key,
          values: pendingNavigation.draft || Object.fromEntries(topic.fillFields.map((field) => [field.key, ""])),
        });
      }

      logAssistantAction({
        type: "navigate",
        user: currentUser,
        screen: currentScreen?.page || "",
        route: topic.route,
        details: topic.title,
      });
      setPendingNavigation(null);
    }, pendingNavigation.openWorkflow === "agenda-create" ? 250 : 120);

    return () => window.clearTimeout(timer);
  }, [currentScreen?.page, currentUser, location.pathname, pendingNavigation]);

  function appendUserMessage(text) {
    setMessages((current) => [...current, buildAssistantMessage({ role: "user", text })]);
  }

  function appendAssistantMessage(message) {
    setMessages((current) => [...current, message]);
  }

  function handlePrompt(promptText) {
    appendUserMessage(promptText);
    const topic = findAssistantTopicFromText(promptText);
    appendAssistantMessage(buildTopicReply(topic, currentScreen));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setInputValue("");
    handlePrompt(trimmed);
  }

  function stopAssistant() {
    setGuideState(null);
    setFillState(null);
    setConfirmationState(null);
    setPendingNavigation(null);
    logAssistantAction({
      type: "stop",
      user: currentUser,
      screen: currentScreen?.page || "",
      route: location.pathname,
      details: "Parar assistente",
    });
  }

  function startGuide(topic, mode = "path") {
    const steps = getGuideSteps(topic, mode);
    if (!steps.length) {
      appendAssistantMessage(
        buildAssistantMessage({
          text: "Eu nao encontrei um roteiro visual para essa acao ainda, mas posso te levar ate a tela correta.",
          topicKey: topic?.key || "",
          actions: buildActionButtons(topic).filter((action) => action.id !== "show_path"),
        }),
      );
      return;
    }

    setGuideState({
      topicKey: topic.key,
      mode,
      steps,
      stepIndex: 0,
    });
    logAssistantAction({
      type: "guide",
      user: currentUser,
      screen: currentScreen?.page || "",
      route: location.pathname,
      details: topic.title,
    });
  }

  function navigateToTopic(topic, mode = "navigate", draft = null) {
    if (!topic) return;
    setPendingNavigation({
      topicKey: topic.key,
      mode,
      draft,
      openWorkflow: topic.openWorkflow || "",
    });
    navigate(topic.route);
  }

  function openFillFlow(topic) {
    if (!topic?.fillFields?.length) {
      appendAssistantMessage(
        buildAssistantMessage({
          text: "Para esse fluxo eu consigo te levar ate a tela certa e te mostrar o caminho, mas ainda nao tenho um rascunho de preenchimento pronto.",
          topicKey: topic?.key || "",
          actions: buildActionButtons(topic).filter((action) => action.id !== "assist_fill"),
        }),
      );
      return;
    }

    setFillState({
      topicKey: topic.key,
      values: Object.fromEntries(topic.fillFields.map((field) => [field.key, ""])),
    });
    setIsOpen(true);
  }

  function handleMessageAction(topicKey, actionId) {
    const topic = getAssistantTopicByKey(topicKey);
    if (!topic) return;

    if (actionId === "explain") {
      appendAssistantMessage(buildExplainReply(topic));
      return;
    }

    if (actionId === "show_path") {
      startGuide(topic, location.pathname === topic.route ? "arrival" : "path");
      return;
    }

    if (actionId === "navigate") {
      navigateToTopic(topic, "navigate");
      return;
    }

    if (actionId === "assist_fill") {
      openFillFlow(topic);
    }
  }

  function updateFillValue(fieldKey, value) {
    setFillState((current) =>
      current
        ? {
            ...current,
            values: {
              ...current.values,
              [fieldKey]: value,
            },
          }
        : current,
    );
  }

  function resolveFillTargetElement(topic, field) {
    const screen = findScreenDefinition(topic.screenKey);
    const targetElement =
      screen?.elements?.find((element) => element.id === field.targetElementId) ||
      screen?.elements?.find((element) => normalizeText(element.label) === normalizeText(field.label));
    return targetElement ? findElementByLocator(targetElement.locator) : null;
  }

  function confirmAssistPreparation() {
    const topic = getAssistantTopicByKey(fillState?.topicKey || "");
    if (!topic || !fillState) return;

    const performApply = () => {
      const normalizedDraft = topic.fillFields.reduce((accumulator, field) => {
        accumulator[field.key] = formatDraftValueByType(fillState.values[field.key], field.type);
        return accumulator;
      }, {});

      if (topic.openWorkflow === "agenda-create") {
        if (location.pathname !== topic.route) {
          navigateToTopic(topic, "fill", normalizedDraft);
          return;
        }

        window.dispatchEvent(
          new CustomEvent(ASSISTANT_PENDING_ROUTE_EVENT, {
            detail: {
              workflow: "agenda-create",
              date: normalizedDraft.date || "",
              time: normalizedDraft.time || "08:00",
              customerName: normalizedDraft.customerName || "",
              petName: normalizedDraft.petName || "",
              serviceName: normalizedDraft.serviceName || "",
            },
          }),
        );

        appendAssistantMessage(
          buildAssistantMessage({
            text: "Abri o ponto de cadastro na agenda. Agora voce pode revisar tutor, pet, servico e confirmar manualmente.",
            topicKey: topic.key,
            actions: buildActionButtons(topic).filter((action) => action.id !== "assist_fill"),
          }),
        );

        logAssistantAction({
          type: "fill",
          user: currentUser,
          screen: currentScreen?.page || "",
          route: location.pathname,
          details: topic.title,
        });
        setFillState(null);
        return;
      }

      if (location.pathname !== topic.route) {
        navigateToTopic(topic, "fill", normalizedDraft);
        return;
      }

      const missingFields = [];
      topic.fillFields.forEach((field) => {
        const targetElement = resolveFillTargetElement(topic, field);
        const nextValue = normalizedDraft[field.key];
        if (!targetElement || !nextValue) {
          if (nextValue) {
            missingFields.push(field.label);
          }
          return;
        }
        setNativeFieldValue(targetElement, nextValue);
      });

      const nextGuideSteps = getGuideSteps(topic, "arrival");
      if (nextGuideSteps.length) {
        setGuideState({
          topicKey: topic.key,
          mode: "arrival",
          steps: nextGuideSteps,
          stepIndex: 0,
        });
      }

      appendAssistantMessage(
        buildAssistantMessage({
          text: missingFields.length
            ? `Deixei o formulario preparado e destaquei os proximos passos. Alguns campos precisam de ajuste manual: ${missingFields.join(", ")}.`
            : "Deixei o formulario preparado para voce revisar. Nada foi salvo automaticamente.",
          topicKey: topic.key,
          actions: buildActionButtons(topic).filter((action) => action.id !== "assist_fill"),
        }),
      );

      logAssistantAction({
        type: "fill",
        user: currentUser,
        screen: currentScreen?.page || "",
        route: location.pathname,
        details: topic.title,
      });
      setFillState(null);
    };

    setConfirmationState({
      title: "Deseja confirmar esta acao?",
      description: "O assistente vai apenas preparar os campos para revisao. Nenhum dado sera salvo automaticamente.",
      onConfirm: () => {
        setConfirmationState(null);
        performApply();
      },
    });
  }

  const activeTopic = getAssistantTopicByKey(fillState?.topicKey || guideState?.topicKey || "");

  return (
    <>
      <button
        type="button"
        className={isOpen ? "assistant-floating-btn active" : "assistant-floating-btn"}
        onClick={() => setIsOpen((current) => !current)}
        title="Assistente IA"
        aria-label="Assistente IA"
      >
        <AssistantChatIcon />
      </button>

      {isOpen ? (
        <div className="assistant-shell">
          <button type="button" className="assistant-overlay" onClick={() => setIsOpen(false)} aria-label="Fechar assistente" />
          <aside className="assistant-panel">
            <header className="assistant-panel-head">
              <div>
                <span className="assistant-status-line">
                  <span className="assistant-status-dot" />
                  online
                </span>
                <h2>Assistente IA</h2>
                <small>Nivel {autonomyLevel} ativo</small>
              </div>
              <button type="button" className="assistant-close-btn" onClick={() => setIsOpen(false)}>
                Fechar
              </button>
            </header>

            <div className="assistant-panel-meta">
              <span>{currentScreen?.name || "Ajuda geral do sistema"}</span>
              {recentLog ? <span>Ultima acao: {recentLog.type} em {formatDateTimeLabel(recentLog.createdAt)}</span> : null}
            </div>

            <div className="assistant-messages">
              {messages.map((message) => (
                <article key={message.id} className={message.role === "user" ? "assistant-message assistant-message-user" : "assistant-message"}>
                  <div className="assistant-message-role">{message.role === "user" ? "Voce" : "Assistente IA"}</div>
                  <p>{message.text}</p>
                  {message.actions?.length ? (
                    <div className="assistant-message-actions">
                      {message.actions.map((action) => (
                        <button
                          key={`${message.id}-${action.id}`}
                          type="button"
                          className="assistant-action-chip"
                          onClick={() => handleMessageAction(message.topicKey, action.id)}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {fillState ? (
              <section className="assistant-task-card">
                <div className="assistant-task-head">
                  <div>
                    <strong>{activeTopic?.title || "Preenchimento assistido"}</strong>
                    <small>Eu preparo os campos e voce confirma depois.</small>
                  </div>
                  <button type="button" className="assistant-text-btn" onClick={() => setFillState(null)}>
                    Cancelar
                  </button>
                </div>
                <div className="assistant-task-grid">
                  {(activeTopic?.fillFields || []).map((field) => (
                    <label key={field.key} className="assistant-draft-field">
                      <span>{field.label}</span>
                      <input
                        type={field.type === "time" ? "time" : "text"}
                        value={fillState.values[field.key] || ""}
                        placeholder={field.placeholder || ""}
                        onChange={(event) => updateFillValue(field.key, event.target.value)}
                      />
                    </label>
                  ))}
                </div>
                <div className="assistant-task-actions">
                  <button type="button" className="assistant-mini-btn assistant-mini-btn-muted" onClick={stopAssistant}>
                    Parar assistente
                  </button>
                  <button type="button" className="assistant-mini-btn assistant-mini-btn-primary" onClick={confirmAssistPreparation}>
                    Preparar tela
                  </button>
                </div>
              </section>
            ) : null}

            {confirmationState ? (
              <section className="assistant-confirm-card">
                <strong>{confirmationState.title}</strong>
                <p>{confirmationState.description}</p>
                <div className="assistant-task-actions">
                  <button type="button" className="assistant-mini-btn assistant-mini-btn-muted" onClick={() => setConfirmationState(null)}>
                    Cancelar
                  </button>
                  <button type="button" className="assistant-mini-btn assistant-mini-btn-primary" onClick={confirmationState.onConfirm}>
                    Confirmar
                  </button>
                </div>
              </section>
            ) : null}

            <div className="assistant-quick-prompts">
              {promptOptions.map((prompt) => (
                <button key={prompt} type="button" className="assistant-prompt-chip" onClick={() => handlePrompt(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>

            <form className="assistant-composer" onSubmit={handleSubmit}>
              <input
                type="text"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Digite sua duvida aqui"
              />
              <div className="assistant-composer-actions">
                <button type="button" className="assistant-text-btn" onClick={stopAssistant}>
                  Parar assistente
                </button>
                <button type="submit" className="assistant-send-btn">
                  Enviar
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}

      <AssistantGuideOverlay
        guideState={guideState}
        onPrevious={() =>
          setGuideState((current) =>
            current
              ? {
                  ...current,
                  stepIndex: Math.max(current.stepIndex - 1, 0),
                }
              : current,
          )
        }
        onNext={() =>
          setGuideState((current) => {
            if (!current) return current;
            if (current.stepIndex >= current.steps.length - 1) {
              return null;
            }
            return {
              ...current,
              stepIndex: current.stepIndex + 1,
            };
          })
        }
        onStop={stopAssistant}
      />
    </>
  );
}
