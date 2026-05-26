// MessagesAiAssistantBar.jsx
// Barra de IA integrada acima do composer no chat.
// Cobre Fases 1-5 do CRM moderno:
//   - Sugestao de resposta
//   - Resumo automatico
//   - Badge de intencao
//   - Badge de temperatura (quente/morno/frio)
//   - Lista de proximas acoes

import { useCallback, useEffect, useMemo, useState } from "react";
import "./messagesAiAssistant.css";

const TONE_OPTIONS = [
  { id: "amigavel", label: "Amigavel" },
  { id: "profissional", label: "Profissional" },
  { id: "objetivo", label: "Objetivo" },
];

const TEMPERATURE_ICON = { hot: "🔥", warm: "☀️", cold: "❄️" };
const INTENT_ICON = {
  agendamento: "📅",
  compra: "🛒",
  duvida: "❓",
  reclamacao: "⚠️",
  cobranca: "💰",
  suporte: "🛠️",
  cliente_perdido: "👻",
};

export function MessagesAiAssistantBar({
  conversationId,
  apiRequest,
  authHeaders,
  onInsertReply,
  onMoveStage,
}) {
  const [expanded, setExpanded] = useState({
    suggestions: false,
    summary: false,
    actions: false,
  });
  const [tone, setTone] = useState("amigavel");

  const [suggestions, setSuggestions] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState(null);

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  const [intent, setIntent] = useState(null);
  const [temperature, setTemperature] = useState(null);
  const [actions, setActions] = useState(null);
  const [actionsLoading, setActionsLoading] = useState(false);

  const canRequest = useMemo(
    () => Boolean(conversationId) && typeof apiRequest === "function",
    [conversationId, apiRequest],
  );

  // Reseta tudo ao trocar de conversa
  useEffect(() => {
    setSuggestions(null);
    setSummary(null);
    setIntent(null);
    setTemperature(null);
    setActions(null);
    setExpanded({ suggestions: false, summary: false, actions: false });
  }, [conversationId]);

  // ============ Fase 3 + 4: intent + temperatura carregam silenciosamente ============
  useEffect(() => {
    let cancelled = false;
    if (!canRequest) return undefined;
    (async () => {
      try {
        // Le do cache (force=false): se nao tiver, gera; barato
        const intentRes = await apiRequest(
          `/api/crm-ai-assistant/${conversationId}/classify-intent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders },
            body: JSON.stringify({ force: false }),
          },
        );
        if (!cancelled) setIntent(intentRes?.data || null);
      } catch (err) {
        // Silencioso: nao incomoda a UI
        console.debug("[AiBar] intent error", err);
      }
      try {
        const tempRes = await apiRequest(
          `/api/crm-ai-assistant/${conversationId}/temperature`,
          { method: "GET", headers: authHeaders },
        );
        if (!cancelled) setTemperature(tempRes?.data || null);
      } catch (err) {
        console.debug("[AiBar] temperature error", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canRequest, conversationId, apiRequest, authHeaders]);

  // ============ Fase 1 ============
  const handleSuggest = useCallback(async () => {
    if (!canRequest) return;
    setSuggestionsLoading(true);
    setSuggestionsError(null);
    setExpanded((e) => ({ ...e, suggestions: true }));
    try {
      const res = await apiRequest(
        `/api/crm-ai-assistant/${conversationId}/suggest-replies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ tone, count: 3 }),
        },
      );
      setSuggestions(res?.data?.suggestions || []);
    } catch (err) {
      setSuggestionsError(err?.message || "Erro ao buscar sugestoes");
    } finally {
      setSuggestionsLoading(false);
    }
  }, [canRequest, conversationId, apiRequest, authHeaders, tone]);

  // ============ Fase 2 ============
  const handleSummary = useCallback(
    async (force = false) => {
      if (!canRequest) return;
      setSummaryLoading(true);
      setSummaryError(null);
      setExpanded((e) => ({ ...e, summary: true }));
      try {
        const res = await apiRequest(
          `/api/crm-ai-assistant/${conversationId}/summary`,
          {
            method: force ? "POST" : "GET",
            headers: force
              ? { "Content-Type": "application/json", ...authHeaders }
              : authHeaders,
            ...(force ? { body: JSON.stringify({}) } : {}),
          },
        );
        setSummary(res?.data || null);
      } catch (err) {
        setSummaryError(err?.message || "Erro ao gerar resumo");
      } finally {
        setSummaryLoading(false);
      }
    },
    [canRequest, conversationId, apiRequest, authHeaders],
  );

  // ============ Fase 5 ============
  const handleActions = useCallback(async () => {
    if (!canRequest) return;
    setActionsLoading(true);
    setExpanded((e) => ({ ...e, actions: true }));
    try {
      const res = await apiRequest(
        `/api/crm-ai-assistant/${conversationId}/next-actions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({}),
        },
      );
      setActions(res?.data?.actions || []);
    } catch (err) {
      setActions([]);
      console.error("[AiBar] actions error", err);
    } finally {
      setActionsLoading(false);
    }
  }, [canRequest, conversationId, apiRequest, authHeaders]);

  const handleExecuteAction = useCallback(
    async (action, index) => {
      if (!canRequest) return;
      try {
        if (action.type === "move_funnel" && action.payload?.targetStage) {
          await apiRequest(
            `/api/crm-ai-assistant/${conversationId}/execute-action`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json", ...authHeaders },
              body: JSON.stringify({
                actionType: "move_funnel",
                payload: action.payload,
              }),
            },
          );
          if (typeof onMoveStage === "function") {
            onMoveStage(action.payload.targetStage);
          }
          setActions((prev) =>
            (prev || []).filter((a) => a.type !== "move_funnel"),
          );
          return;
        }
        // Para os outros tipos so dismiss (UI dispara o fluxo real)
        await apiRequest(
          `/api/crm-ai-assistant/${conversationId}/execute-action`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders },
            body: JSON.stringify({
              actionType: "dismiss",
              payload: { index },
            }),
          },
        );
        setActions((prev) => (prev || []).filter((_, i) => i !== index));
      } catch (err) {
        console.error("[AiBar] execute-action error", err);
      }
    },
    [canRequest, conversationId, apiRequest, authHeaders, onMoveStage],
  );

  const handleDismissAction = useCallback(
    (index) => handleExecuteAction({ type: "dismiss" }, index),
    [handleExecuteAction],
  );

  if (!conversationId) return null;

  return (
    <div className="via-ai-bar">
      {/* Linha 1: badges + botoes */}
      <div className="via-ai-bar__row">
        {/* Badge de intencao (Fase 3) */}
        {intent ? (
          <span
            className="via-ai-badge"
            style={{ background: intent.color || "#64748b" }}
            title={intent.reason || ""}
          >
            <span>{INTENT_ICON[intent.intent] || "🏷️"}</span>
            {intent.label || intent.intent}
          </span>
        ) : (
          <span className="via-ai-badge via-ai-badge--ghost">Classificando...</span>
        )}

        {/* Badge de temperatura (Fase 4) */}
        {temperature ? (
          <span
            className="via-ai-badge"
            style={{ background: temperature.color || "#64748b" }}
            title={`Score ${temperature.score}/100`}
          >
            <span>{TEMPERATURE_ICON[temperature.bucket] || "🌡️"}</span>
            {temperature.label}
          </span>
        ) : (
          <span className="via-ai-badge via-ai-badge--ghost">Medindo...</span>
        )}

        <span style={{ flex: 1 }} />

        <button
          type="button"
          className="via-ai-btn via-ai-btn--primary"
          onClick={handleSuggest}
          disabled={suggestionsLoading}
        >
          {suggestionsLoading ? <span className="via-ai-spinner" /> : <span className="via-ai-btn__icon">✨</span>}
          Sugerir resposta
        </button>

        <button
          type="button"
          className="via-ai-btn"
          onClick={() => handleSummary(false)}
          disabled={summaryLoading}
        >
          {summaryLoading ? <span className="via-ai-spinner" /> : <span className="via-ai-btn__icon">📝</span>}
          Resumir
        </button>

        <button
          type="button"
          className="via-ai-btn via-ai-btn--ghost"
          onClick={handleActions}
          disabled={actionsLoading}
        >
          {actionsLoading ? <span className="via-ai-spinner" /> : <span className="via-ai-btn__icon">🎯</span>}
          Acoes
        </button>
      </div>

      {/* Sugestoes (Fase 1) */}
      {expanded.suggestions ? (
        <div className="via-ai-bar__row" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div className="via-ai-tone-tabs">
              {TONE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={tone === opt.id ? "via-ai-tone-tab active" : "via-ai-tone-tab"}
                  onClick={() => setTone(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="via-ai-btn via-ai-btn--ghost"
              onClick={handleSuggest}
              disabled={suggestionsLoading}
            >
              ↻ Regerar
            </button>
            <button
              type="button"
              className="via-ai-btn via-ai-btn--ghost"
              onClick={() => setExpanded((e) => ({ ...e, suggestions: false }))}
            >
              Fechar
            </button>
          </div>
          {suggestionsError ? (
            <div className="via-ai-error">{suggestionsError}</div>
          ) : null}
          {suggestionsLoading ? (
            <div className="via-ai-empty">Gerando sugestoes...</div>
          ) : null}
          {!suggestionsLoading && suggestions && suggestions.length === 0 ? (
            <div className="via-ai-empty">Sem sugestoes. Clique em regerar.</div>
          ) : null}
          <div className="via-ai-suggestions">
            {(suggestions || []).map((text, idx) => (
              <div className="via-ai-suggestion-card" key={`sug-${idx}`}>
                <div className="via-ai-suggestion-card__text">{text}</div>
                <div className="via-ai-suggestion-card__actions">
                  <button
                    type="button"
                    className="via-ai-suggestion-card__btn"
                    onClick={() => onInsertReply && onInsertReply(text, { send: false })}
                    title="Inserir no campo de mensagem"
                  >
                    Inserir
                  </button>
                  <button
                    type="button"
                    className="via-ai-suggestion-card__btn"
                    onClick={() => onInsertReply && onInsertReply(text, { send: true })}
                    title="Enviar direto"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Resumo (Fase 2) */}
      {expanded.summary ? (
        <div className="via-ai-bar__row" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <div className="via-ai-summary">
            <div className="via-ai-summary__title">
              <span>Resumo da conversa {summary?.cached ? "(cache)" : ""}</span>
              <span style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  className="via-ai-btn via-ai-btn--ghost"
                  onClick={() => handleSummary(true)}
                  disabled={summaryLoading}
                >
                  ↻ Atualizar
                </button>
                <button
                  type="button"
                  className="via-ai-btn via-ai-btn--ghost"
                  onClick={() => setExpanded((e) => ({ ...e, summary: false }))}
                >
                  Fechar
                </button>
              </span>
            </div>
            {summaryError ? <div className="via-ai-error">{summaryError}</div> : null}
            {summaryLoading ? <div className="via-ai-empty">Gerando resumo...</div> : null}
            {summary ? (
              <>
                <div className="via-ai-summary__body">{summary.summary}</div>
                {summary.keyPoints?.length ? (
                  <ul className="via-ai-summary__points">
                    {summary.keyPoints.map((kp, i) => (
                      <li key={i}>{kp}</li>
                    ))}
                  </ul>
                ) : null}
                {summary.pendingItems?.length ? (
                  <div className="via-ai-summary__pending">
                    <div className="via-ai-summary__pending-title">Pendencias</div>
                    <ul className="via-ai-summary__points">
                      {summary.pendingItems.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Proximas acoes (Fase 5) */}
      {expanded.actions ? (
        <div className="via-ai-bar__row" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <strong style={{ color: "#be185d", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Proximas acoes sugeridas
            </strong>
            <button
              type="button"
              className="via-ai-btn via-ai-btn--ghost"
              onClick={() => setExpanded((e) => ({ ...e, actions: false }))}
            >
              Fechar
            </button>
          </div>
          {actionsLoading ? <div className="via-ai-empty">Calculando acoes...</div> : null}
          {!actionsLoading && actions && actions.length === 0 ? (
            <div className="via-ai-empty">Nenhuma acao recomendada agora. Tudo em dia!</div>
          ) : null}
          <div className="via-ai-actions">
            {(actions || []).map((action, idx) => (
              <div
                className={`via-ai-action-card via-ai-action-card--${action.priority || "medium"}`}
                key={`action-${idx}`}
              >
                <div className="via-ai-action-card__body">
                  <div className="via-ai-action-card__title">{action.title}</div>
                  <div className="via-ai-action-card__desc">{action.description}</div>
                </div>
                <div className="via-ai-action-card__actions">
                  <button
                    type="button"
                    className="via-ai-btn via-ai-btn--primary"
                    onClick={() => handleExecuteAction(action, idx)}
                  >
                    Executar
                  </button>
                  <button
                    type="button"
                    className="via-ai-btn via-ai-btn--ghost"
                    onClick={() => handleDismissAction(idx)}
                  >
                    Ignorar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default MessagesAiAssistantBar;
