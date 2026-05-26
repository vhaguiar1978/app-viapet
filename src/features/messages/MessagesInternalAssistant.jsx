// MessagesInternalAssistant.jsx
// Fase 6: Assistente interno do CRM em drawer flutuante.
// Botao flutuante (FAB) sempre visivel; ao clicar abre painel onde
// o dono pode perguntar em linguagem natural.

import { useCallback, useEffect, useRef, useState } from "react";
import "./messagesAiAssistant.css";

const SHORTCUTS = [
  "Clientes sem resposta",
  "Clientes parados ha 30 dias",
  "Agenda de amanha",
  "Cobrancas pendentes",
  "Resumir ultimo atendimento",
  "Criar campanha para clientes parados",
];

function ResultBlock({ result }) {
  if (!result) return null;
  const { kind } = result;

  if (kind === "error") {
    return <div className="via-ai-error">{result.message}</div>;
  }

  if (kind === "empty" || kind === "text") {
    return (
      <div className="via-assistant-result-card">
        <div className="via-assistant-result-card__title">{result.title || "Resposta"}</div>
        <div className="via-assistant-result-empty">{result.message || result.reply || "Sem dados."}</div>
      </div>
    );
  }

  if (kind === "list_conversations") {
    return (
      <div className="via-assistant-result-card">
        <div className="via-assistant-result-card__title">{result.title}</div>
        {result.items?.length ? (
          <ul className="via-assistant-result-list">
            {result.items.map((item) => (
              <li key={item.id}>
                <span>
                  <strong>{item.customerName}</strong>
                  {item.phone ? ` · ${item.phone}` : ""}
                  {item.stage ? ` · ${item.stage}` : ""}
                </span>
                {item.lastInboundAt ? (
                  <span style={{ color: "#94a3b8", fontSize: 11 }}>
                    {new Date(item.lastInboundAt).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <div className="via-assistant-result-empty">Nada encontrado.</div>
        )}
      </div>
    );
  }

  if (kind === "list_appointments") {
    return (
      <div className="via-assistant-result-card">
        <div className="via-assistant-result-card__title">{result.title}</div>
        {result.items?.length ? (
          <ul className="via-assistant-result-list">
            {result.items.map((item) => (
              <li key={item.id}>
                <span>
                  <strong>{item.petName || "Pet"}</strong>
                  {item.customerName ? ` (${item.customerName})` : ""}
                  {item.service ? ` · ${item.service}` : ""}
                </span>
                <span style={{ color: "#94a3b8", fontSize: 11 }}>{item.time || ""}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="via-assistant-result-empty">Nenhum agendamento amanha.</div>
        )}
      </div>
    );
  }

  if (kind === "list_finance") {
    return (
      <div className="via-assistant-result-card">
        <div className="via-assistant-result-card__title">{result.title}</div>
        {result.items?.length ? (
          <ul className="via-assistant-result-list">
            {result.items.map((item) => (
              <li key={item.id}>
                <span>
                  <strong>{item.description || "Cobranca"}</strong>
                  {item.customerName ? ` · ${item.customerName}` : ""}
                </span>
                <span style={{ color: "#dc2626", fontWeight: 700 }}>
                  R$ {Number(item.amount || 0).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="via-assistant-result-empty">Nada pendente.</div>
        )}
      </div>
    );
  }

  if (kind === "conversation_summary") {
    return (
      <div className="via-assistant-result-card">
        <div className="via-assistant-result-card__title">{result.title}</div>
        <div style={{ fontSize: 13, color: "#334155", marginBottom: 8 }}>{result.summary}</div>
        {result.keyPoints?.length ? (
          <ul className="via-assistant-result-list">
            {result.keyPoints.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  if (kind === "draft_message") {
    return (
      <div className="via-assistant-result-card">
        <div className="via-assistant-result-card__title">{result.title}</div>
        <div
          style={{
            fontSize: 13,
            background: "#fdf2f8",
            padding: 10,
            borderRadius: 8,
            color: "#334155",
          }}
        >
          {result.message}
        </div>
      </div>
    );
  }

  if (kind === "campaign_draft") {
    return (
      <div className="via-assistant-result-card">
        <div className="via-assistant-result-card__title">{result.title}</div>
        {result.objetivo ? (
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 6 }}>
            <strong>Objetivo:</strong> {result.objetivo}
          </div>
        ) : null}
        {result.publico_alvo ? (
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 6 }}>
            <strong>Publico:</strong> {result.publico_alvo}
          </div>
        ) : null}
        {result.mensagem_modelo ? (
          <div
            style={{
              fontSize: 13,
              background: "#fdf2f8",
              padding: 10,
              borderRadius: 8,
              color: "#334155",
              marginTop: 8,
            }}
          >
            {result.mensagem_modelo}
          </div>
        ) : null}
        {result.dica ? (
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 8, fontStyle: "italic" }}>
            💡 {result.dica}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="via-assistant-result-card">
      <div className="via-assistant-result-card__title">{result.title || "Resultado"}</div>
      <pre style={{ fontSize: 11, color: "#475569", whiteSpace: "pre-wrap" }}>
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}

export function MessagesInternalAssistant({ apiRequest, authHeaders }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (open && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [history, open]);

  const send = useCallback(
    async (query) => {
      const text = String(query || "").trim();
      if (!text || typeof apiRequest !== "function") return;
      setLoading(true);
      setHistory((h) => [...h, { role: "user", text }]);
      try {
        const res = await apiRequest("/api/crm-ai-assistant/assistant/query", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ query: text }),
        });
        const data = res?.data || { kind: "text", message: "Sem resposta." };
        setHistory((h) => [...h, { role: "ai", result: data }]);
      } catch (err) {
        setHistory((h) => [
          ...h,
          { role: "ai", result: { kind: "error", message: err?.message || "Erro" } },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [apiRequest, authHeaders],
  );

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!input.trim()) return;
      const text = input;
      setInput("");
      send(text);
    },
    [input, send],
  );

  return (
    <>
      <button
        type="button"
        className="via-assistant-fab"
        onClick={() => setOpen(true)}
        title="Assistente do CRM"
        aria-label="Abrir assistente do CRM"
      >
        🤖
      </button>

      {open ? (
        <>
          <div
            className="via-assistant-drawer-overlay"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="via-assistant-drawer" role="dialog" aria-label="Assistente do CRM">
            <header className="via-assistant-drawer__header">
              <div className="via-assistant-drawer__title">
                <span>🤖</span> Assistente do CRM
              </div>
              <button
                type="button"
                className="via-assistant-drawer__close"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
              >
                ×
              </button>
            </header>

            <div className="via-assistant-drawer__body" ref={bodyRef}>
              {history.length === 0 ? (
                <>
                  <div className="via-assistant-msg via-assistant-msg--ai">
                    Oi! Eu sou seu assistente do CRM. Posso buscar clientes, ver agenda,
                    listar cobrancas, criar mensagens e campanhas. Como posso ajudar?
                  </div>
                  <div className="via-assistant-drawer__shortcuts">
                    {SHORTCUTS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="via-assistant-shortcut"
                        onClick={() => send(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                history.map((item, i) => {
                  if (item.role === "user") {
                    return (
                      <div key={i} className="via-assistant-msg via-assistant-msg--user">
                        {item.text}
                      </div>
                    );
                  }
                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {item.result?.reply ? (
                        <div className="via-assistant-msg via-assistant-msg--ai">
                          {item.result.reply}
                        </div>
                      ) : null}
                      <ResultBlock result={item.result} />
                    </div>
                  );
                })
              )}
              {loading ? (
                <div className="via-assistant-msg via-assistant-msg--ai">
                  <span className="via-ai-spinner" /> Pensando...
                </div>
              ) : null}
            </div>

            <footer className="via-assistant-drawer__footer">
              <form className="via-assistant-input-row" onSubmit={handleSubmit}>
                <input
                  type="text"
                  className="via-assistant-input"
                  placeholder="Pergunte algo... ex: clientes sem resposta"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="via-assistant-send"
                  disabled={loading || !input.trim()}
                  aria-label="Enviar"
                >
                  ➤
                </button>
              </form>
            </footer>
          </aside>
        </>
      ) : null}
    </>
  );
}

export default MessagesInternalAssistant;
