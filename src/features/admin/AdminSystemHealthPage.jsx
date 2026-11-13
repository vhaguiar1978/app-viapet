import { useEffect, useState } from "react";
import "./AdminPages.css";

function formatDateTime(value) {
  if (!value) return "Ainda não registrado";
  try { return new Date(value).toLocaleString("pt-BR"); } catch { return "Ainda não registrado"; }
}

function StatusPill({ healthy, children }) {
  return <span className={`guardian-pill ${healthy ? "is-healthy" : "is-unhealthy"}`}>{children}</span>;
}

export default function AdminSystemHealthPage({ apiRequest }) {
  const [guardian, setGuardian] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  async function load({ force = false } = {}) {
    force ? setChecking(true) : setLoading(true);
    setError("");
    try {
      const response = await apiRequest(force ? "/admin/system-health/check" : "/admin/system-health", {
        ...(force ? { method: "POST" } : {}),
      });
      setGuardian(response?.guardian || response || null);
    } catch (requestError) {
      setError(requestError?.message || "Não foi possível consultar a saúde do sistema.");
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(() => load(), 60000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const healthy = guardian?.status === "healthy" && guardian?.database === "healthy";

  return (
    <section className="admin-page guardian-page">
      <header className="admin-page-header guardian-header">
        <div>
          <span className="guardian-kicker">GUARDIÃO VIAPET</span>
          <h2>Saúde do sistema</h2>
          <p>Monitoramento contínuo da API, banco, login e Agenda, com recuperação automática segura.</p>
        </div>
        <button className="admin-primary-btn" type="button" disabled={checking} onClick={() => load({ force: true })}>
          {checking ? "Verificando..." : "Verificar agora"}
        </button>
      </header>

      {error ? <div className="guardian-alert"><strong>Atenção</strong><span>{error}</span></div> : null}

      {loading && !guardian ? (
        <div className="guardian-loading">Consultando os serviços...</div>
      ) : (
        <>
          <div className="guardian-hero-card">
            <div className={`guardian-orb ${healthy ? "is-healthy" : "is-unhealthy"}`} aria-hidden="true" />
            <div>
              <StatusPill healthy={healthy}>{healthy ? "Sistema operacional" : "Atenção necessária"}</StatusPill>
              <h3>{healthy ? "O ViaPet está funcionando normalmente" : "O Guardião detectou instabilidade"}</h3>
              <p>{healthy ? "Banco e API responderam ao último teste." : "A recuperação automática está acompanhando a falha."}</p>
            </div>
          </div>

          <div className="guardian-metrics">
            <article><span>Banco de dados</span><strong>{guardian?.database === "healthy" ? "Online" : "Instável"}</strong><small>Última resposta: {guardian?.lastLatencyMs ?? "—"} ms</small></article>
            <article><span>Falhas seguidas</span><strong>{guardian?.consecutiveFailures ?? 0}</strong><small>Reinício após o limite seguro</small></article>
            <article><span>Recuperações</span><strong>{guardian?.recoveryCount ?? 0}</strong><small>Desde o último deploy</small></article>
            <article><span>API ativa</span><strong>{Math.floor((guardian?.uptimeSeconds || 0) / 60)} min</strong><small>Tempo desta instância</small></article>
          </div>

          <div className="guardian-details-card">
            <div><span>Última verificação</span><strong>{formatDateTime(guardian?.lastCheckAt)}</strong></div>
            <div><span>Último sucesso</span><strong>{formatDateTime(guardian?.lastSuccessAt)}</strong></div>
            <div><span>Última falha</span><strong>{formatDateTime(guardian?.lastFailureAt)}</strong></div>
            <div><span>Última recuperação</span><strong>{formatDateTime(guardian?.lastRecoveryAt)}</strong></div>
          </div>

          {guardian?.lastError ? <div className="guardian-technical"><strong>Diagnóstico protegido</strong><code>{guardian.lastError}</code></div> : null}
          <p className="guardian-footnote">O Guardião pode renovar conexões, reiniciar a API e solicitar um redeploy. Dados de clientes, agenda e financeiro nunca são modificados automaticamente.</p>
        </>
      )}
    </section>
  );
}
