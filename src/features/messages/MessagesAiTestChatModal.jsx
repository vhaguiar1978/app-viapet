import { useEffect, useRef, useState } from "react";

function buildLocalTestReply(text) {
  const normalized = String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (/dor|sang|vomit|doente|urgente|emerg|machuc/.test(normalized)) {
    return "Sinto muito que seu pet nao esteja bem. Para seguranca dele, vou chamar um atendente agora para orientar voce direitinho.";
  }

  if (/preco|valor|quanto|custa|banho|tosa|pacote|pacotinho/.test(normalized)) {
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
      const replyText = String(result?.reply || "").trim();
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
          { role: "assistant", content: buildLocalTestReply(text), ts: Date.now() },
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
