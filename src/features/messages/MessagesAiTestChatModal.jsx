import { useEffect, useRef, useState } from "react";

// Modal dedicado de bate-papo de teste com a IA. Abre direto no chat —
// nao mistura com o painel de configuracoes. Usa o mesmo endpoint
// /api/crm-ai/control/test-reply que o painel usa.
export function MessagesAiTestChatModal({ open, onClose, onTestReply }) {
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
      setError("Chat indisponivel — backend nao conectado.");
      return;
    }

    setError("");
    const userMsg = { role: "user", content: text, ts: Date.now() };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setSending(true);

    try {
      const apiHistory = nextHistory.map((m) => ({ role: m.role, content: m.content }));
      const result = await onTestReply({ messages: apiHistory });
      const replyText = String(result?.reply || "").trim();
      if (!replyText) {
        setError("A IA nao retornou texto. Verifique a chave Groq no painel.");
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: replyText, ts: Date.now() },
        ]);
      }
    } catch (err) {
      setError(err?.message || "Falha ao gerar resposta da IA.");
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
            <strong>Bate-papo de teste com a IA 🐾</strong>
            <span>
              Converse aqui sem mexer no WhatsApp real. Usa o mesmo prompt e
              servicos da sua loja. Nao salva mensagem nem cria agendamento.
            </span>
          </div>
          <button
            type="button"
            className="messages-ai-testchat-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </header>

        <div className="messages-ai-testchat-body" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="messages-ai-testchat-empty">
              <p>👋 Comece digitando uma mensagem como se fosse um cliente.</p>
              <p className="messages-ai-testchat-hint">
                Sugestoes: <em>"oi, quanto fica banho de cachorro pequeno?"</em> · <em>"queria
                agendar pro Thor amanha"</em> · <em>"voces fazem busca e entrega?"</em>
              </p>
            </div>
          ) : (
            messages.map((m, idx) => (
              <div
                key={`${m.role}-${idx}-${m.ts}`}
                className={
                  m.role === "user"
                    ? "messages-ai-testchat-msg user"
                    : "messages-ai-testchat-msg assistant"
                }
              >
                <span className="messages-ai-testchat-role">
                  {m.role === "user" ? "Voce (cliente)" : "IA"}
                </span>
                <p>{m.content}</p>
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

        {error ? (
          <div className="messages-ai-testchat-error">{error}</div>
        ) : null}

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
