import { useEffect, useRef, useState } from "react";

function normalizeTestText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getRecentUserText(messages = []) {
  return (Array.isArray(messages) ? messages : [])
    .filter((message) => message?.role === "user")
    .map((message) => String(message.content || "").trim())
    .filter(Boolean)
    .slice(-4)
    .join(" ");
}

function isBusinessHoursQuestion(text) {
  const normalized = normalizeTestText(text);
  return (
    /\b(abre|abrem|fecha|fecham|funciona|funcionamento)\b/.test(normalized) &&
    /\b(horario|horarios|hora|horas|atendimento|loja)\b/.test(normalized)
  );
}

function isAvailabilityQuestion(text, messages = []) {
  const normalized = normalizeTestText(`${getRecentUserText(messages)} ${text}`);
  if (isBusinessHoursQuestion(normalized)) return false;
  if (/\b(qual|quais|que)\s+horarios?\b/.test(normalized)) return true;
  if (/\btem\b/.test(normalized) && /\b(horario|horarios|vaga|vagas|encaixe)\b/.test(normalized)) return true;
  if (/\b(horario|horarios)\b/.test(normalized) && /\b(escolher|livre|livres|disponivel|disponiveis|disponibilidade|hoje|amanha|manha|tarde|noite)\b/.test(normalized)) return true;
  if (/\b(vaga|vagas|encaixe|disponibilidade|disponivel|disponiveis)\b/.test(normalized) && /\b(agenda|agendar|marcar|banho|tosa|horario|horarios)\b/.test(normalized)) return true;
  return false;
}

function extractDateLabel(text, messages = []) {
  const normalized = normalizeTestText(`${text} ${getRecentUserText(messages)}`);
  if (/\bhoje\b/.test(normalized)) return "hoje";
  if (/\bamanha\b/.test(normalized)) return "amanha";
  if (/\bsegunda\b/.test(normalized)) return "segunda-feira";
  if (/\bterca\b/.test(normalized)) return "terca-feira";
  if (/\bquarta\b/.test(normalized)) return "quarta-feira";
  if (/\bquinta\b/.test(normalized)) return "quinta-feira";
  if (/\bsexta\b/.test(normalized)) return "sexta-feira";
  if (/\bsabado\b/.test(normalized)) return "sabado";
  const match = normalized.match(/\b(\d{1,2}\/\d{1,2})(?:\/\d{2,4})?\b/);
  return match ? `dia ${match[1]}` : "";
}

function extractPeriodLabel(text, messages = []) {
  const normalized = normalizeTestText(`${text} ${getRecentUserText(messages)}`);
  if (/\bfim do dia\b|\bfinal do dia\b/.test(normalized)) return " no fim do dia";
  if (/\bmanha\b/.test(normalized)) return " de manha";
  if (/\btarde\b/.test(normalized)) return " a tarde";
  if (/\bnoite\b/.test(normalized)) return " a noite";
  return "";
}

function extractServiceLabel(text, messages = []) {
  const normalized = normalizeTestText(`${text} ${getRecentUserText(messages)}`);
  if (/\bbanho\b/.test(normalized) && /\btosa\b/.test(normalized)) return "banho e tosa";
  if (/\btosa\b/.test(normalized)) return "tosa";
  if (/\bbanho\b/.test(normalized)) return "banho";
  if (/\bhidrat/.test(normalized)) return "hidratacao";
  return "atendimento";
}

function isGenericAvailabilityReply(reply) {
  const normalized = normalizeTestText(reply);
  const hasConcreteTime = /\b\d{1,2}(?::\d{2})?\s*h\b|\b\d{1,2}:\d{2}\b/.test(normalized);
  const hasNoAvailability = /\bnao tenho\b|\bsem horario\b|\bagenda cheia\b|\bnao encontrei\b/.test(normalized);
  if (hasConcreteTime || hasNoAvailability) return false;

  return [
    /\bposso te ajudar com agendamento\b/,
    /\bme conta o que voce precisa\b/,
    /\bquer marcar um horario\b.*\bsaber (o )?preco\b/,
    /\bposso agendar\b.*\bvalores\b/,
    /\bqual horario te atende\b/,
    /\bqual horario fica melhor\b/,
    /\bqual dia e periodo\b/,
  ].some((pattern) => pattern.test(normalized));
}

function hasAvailabilityDateConflict(text, reply, messages = []) {
  const question = normalizeTestText(`${text} ${getRecentUserText(messages)}`);
  const answer = normalizeTestText(reply);
  const askedToday = /\bhoje\b/.test(question);
  const askedTomorrow = /\bamanha\b/.test(question);
  const answeredToday = /\bhoje\b/.test(answer);
  const answeredTomorrow = /\bamanha\b/.test(answer);

  if (askedToday && answeredTomorrow && !answeredToday) return true;
  if (askedTomorrow && answeredToday && !answeredTomorrow) return true;
  return false;
}

function buildAvailabilitySafetyReply(text, messages = [], isDemo = false) {
  const service = extractServiceLabel(text, messages);
  const dateLabel = extractDateLabel(text, messages);
  const periodLabel = extractPeriodLabel(text, messages);
  const when = dateLabel ? `${dateLabel}${periodLabel}` : "";

  if (isDemo && when) {
    return `Para ${service} ${when}, no teste eu mostraria os horarios livres da agenda aqui. Exemplo: 14h, 15h30 ou 17h. Qual voce prefere?`;
  }

  if (when) {
    return `Consigo verificar os horarios para ${service} ${when}. Vou consultar a agenda real e te passo as opcoes livres; se esse periodo estiver cheio, ja vejo o proximo melhor horario para voce.`;
  }

  return `Consigo ver os horarios para ${service}. Para qual dia voce prefere: hoje, amanha ou outro dia?`;
}

function makeReplyCoherentForTest({ requestText, replyText, messages, isDemo }) {
  if (!isAvailabilityQuestion(requestText, messages)) return replyText;
  if (hasAvailabilityDateConflict(requestText, replyText, messages)) {
    return buildAvailabilitySafetyReply(requestText, messages, isDemo);
  }
  if (!isGenericAvailabilityReply(replyText)) return replyText;
  return buildAvailabilitySafetyReply(requestText, messages, isDemo);
}

function buildLocalTestReply(text, messages = [], isDemo = false) {
  const normalized = normalizeTestText(text);

  if (/dor|sang|vomit|doente|urgente|emerg|machuc/.test(normalized)) {
    return "Sinto muito que seu pet nao esteja bem. Para seguranca dele, vou chamar um atendente agora para orientar voce direitinho.";
  }

  if (isBusinessHoursQuestion(text)) {
    return "Nosso horario de funcionamento segue o cadastro da loja. Se voce quiser marcar um atendimento, tambem posso consultar os horarios livres da agenda.";
  }

  if (isAvailabilityQuestion(text, messages)) {
    return buildAvailabilitySafetyReply(text, messages, isDemo);
  }

  if (/preco|valor|quanto|custa|pacote|pacotinho/.test(normalized)) {
    return "Claro. Me diga o porte do pet e se voce quer banho, tosa ou banho e tosa para eu passar a melhor opcao.";
  }

  if (/agenda|agendar|horario|amanh|hoje|marcar/.test(normalized)) {
    return "Consigo te ajudar a marcar. Qual dia e periodo ficam melhor para voce: manha, tarde ou fim do dia?";
  }

  if (/busca|entrega|leva|buscar|bairro/.test(normalized)) {
    return "Temos busca e entrega conforme a regiao. Pode me informar seu bairro para eu verificar a disponibilidade?";
  }

  return "Ola! Posso ajudar com banho, tosa, horarios, valores e duvidas sobre o atendimento do seu pet.";
}

// Chat isolado para testar respostas sem enviar mensagens ou executar acoes.
export function MessagesAiTestChatModal({ open, onClose, onTestReply, isDemo = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open) {
      setMessages([]);
      setInput("");
      setError("");
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  if (!open) return null;

  async function handleSend() {
    const text = String(input || "").trim();
    if (!text || sending) return;
    if (typeof onTestReply !== "function") {
      setError("Chat indisponivel: backend nao conectado.");
      return;
    }

    setError("");
    const userMsg = { role: "user", content: text, ts: Date.now() };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setSending(true);

    try {
      const apiHistory = nextHistory.map((message) => ({
        role: message.role,
        content: message.content,
      }));
      const result = await onTestReply({ messages: apiHistory });
      const replyText = makeReplyCoherentForTest({
        requestText: text,
        replyText: String(result?.reply || "").trim(),
        messages: nextHistory,
        isDemo,
      });
      if (!replyText) {
        setError("A IA nao retornou texto. Verifique a configuracao no painel.");
      } else {
        setMessages((current) => [
          ...current,
          { role: "assistant", content: replyText, ts: Date.now() },
        ]);
      }
    } catch (err) {
      const message = String(err?.message || "");
      const canUseBasicMode = /groq|gemini|api key|GROQ_API_KEY|configurad/i.test(message);
      if (canUseBasicMode) {
        setMessages((current) => [
          ...current,
          { role: "assistant", content: buildLocalTestReply(text, nextHistory, isDemo), ts: Date.now() },
        ]);
        setError("Teste em modo basico: configure Groq ou Gemini para respostas completas da IA.");
      } else {
        setError(message || "Falha ao gerar resposta da IA.");
      }
    } finally {
      setSending(false);
    }
  }

  function handleReset() {
    setMessages([]);
    setInput("");
    setError("");
  }

  return (
    <div className="messages-ai-testchat-overlay" onClick={onClose}>
      <div
        className="messages-ai-testchat-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="messages-ai-testchat-header">
          <div>
            <strong>Bate-papo de teste com a IA</strong>
            <span>
              {isDemo
                ? "Simulacao de demonstracao: nao envia WhatsApp, nao salva mensagens e nao cria agendamentos."
                : "Converse sem mexer no WhatsApp real. Usa as regras e servicos da sua loja, sem salvar mensagens ou criar agendamentos."}
            </span>
          </div>
          <button
            type="button"
            className="messages-ai-testchat-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            X
          </button>
        </header>

        <div className="messages-ai-testchat-body" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="messages-ai-testchat-empty">
              <p>Digite uma mensagem como se voce fosse um cliente.</p>
              <p className="messages-ai-testchat-hint">
                Sugestoes: <em>"quanto fica o banho da Mel?"</em> ·{" "}
                <em>"queria agendar para amanha"</em> ·{" "}
                <em>"voces fazem busca e entrega?"</em>
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.role}-${index}-${message.ts}`}
                className={
                  message.role === "user"
                    ? "messages-ai-testchat-msg user"
                    : "messages-ai-testchat-msg assistant"
                }
              >
                <span className="messages-ai-testchat-role">
                  {message.role === "user" ? "Voce (cliente)" : "IA"}
                </span>
                <p>{message.content}</p>
              </div>
            ))
          )}
          {sending ? (
            <div className="messages-ai-testchat-msg assistant typing">
              <span className="messages-ai-testchat-role">IA</span>
              <p>digitando...</p>
            </div>
          ) : null}
        </div>

        {error ? <div className="messages-ai-testchat-error">{error}</div> : null}

        <footer className="messages-ai-testchat-footer">
          <input
            type="text"
            className="messages-ai-testchat-input"
            value={input}
            placeholder="Digite uma mensagem como cliente..."
            autoFocus
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            disabled={sending}
          />
          <button
            type="button"
            className="messages-ai-testchat-send"
            onClick={handleSend}
            disabled={sending || !input.trim()}
          >
            {sending ? "Enviando..." : "Enviar"}
          </button>
          <button
            type="button"
            className="messages-ai-testchat-reset"
            onClick={handleReset}
            disabled={sending || messages.length === 0}
            title="Limpar conversa"
          >
            Limpar
          </button>
        </footer>
      </div>
    </div>
  );
}
