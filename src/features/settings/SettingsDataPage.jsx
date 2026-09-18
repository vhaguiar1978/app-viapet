import { useEffect, useState } from "react";
import { SettingsShell } from "./SettingsShell.jsx";

const STATUS_LABELS = { REQUESTED: "Solicitado", QUEUED: "Na fila", PROCESSING: "Processando", GENERATING_FILE: "Gerando arquivo", READY: "Pronto", FAILED: "Falhou", EXPIRED: "Expirado" };
const formatBytes = (value) => !value ? "—" : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(Number(value) / 1048576) + " MB";
const formatDateTime = (value) => value ? new Date(value).toLocaleString("pt-BR") : "—";

export function SettingsDataPage({ auth, apiRequest, onDownload }) {
  const [jobs, setJobs] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  async function loadJobs(silent = false) {
    if (!silent) setLoading(true);
    try {
      const response = await apiRequest("/data-exports", { headers: { Authorization: `Bearer ${auth.token}` } });
      setJobs(response?.data || []);
    } catch (error) { setFeedback(error.message || "Não foi possível carregar o histórico."); }
    finally { if (!silent) setLoading(false); }
  }

  useEffect(() => { loadJobs(); }, [auth.token]);
  useEffect(() => {
    if (!jobs.some((job) => ["REQUESTED", "QUEUED", "PROCESSING", "GENERATING_FILE"].includes(job.status))) return undefined;
    const timer = setInterval(() => loadJobs(true), 4000);
    return () => clearInterval(timer);
  }, [jobs]);

  async function requestExport() {
    if (!window.confirm("Gerar uma cópia dos dados da sua empresa em Excel?")) return;
    setRequesting(true); setFeedback("");
    try {
      const response = await apiRequest("/data-exports", { method: "POST", headers: { Authorization: `Bearer ${auth.token}` } });
      setFeedback(response?.message || "Preparando seus dados…");
      await loadJobs(true);
    } catch (error) { setFeedback(error.message || "Não foi possível solicitar a exportação."); }
    finally { setRequesting(false); }
  }

  async function downloadExport(job) {
    setFeedback("");
    try { await onDownload(job); setFeedback("Download iniciado com segurança."); }
    catch (error) { setFeedback(error.message || "Não foi possível baixar o arquivo."); }
  }

  return <SettingsShell activeTab="Dados e Segurança">
    <div className="settings-data-stack">
      <section className="settings-data-hero">
        <div>
          <span className="settings-data-kicker">Dados e Segurança</span>
          <h2>Baixar meus dados</h2>
          <p>Baixe uma cópia das informações da sua empresa armazenadas no ViaPet.</p>
          <small>Este processo não altera nem exclui nenhuma informação do ViaPet.</small>
        </div>
        <button type="button" className="footer-btn footer-btn-green settings-data-generate" onClick={requestExport} disabled={requesting || jobs.some((job) => ["REQUESTED", "QUEUED", "PROCESSING", "GENERATING_FILE"].includes(job.status))}>
          {requesting ? "Enviando…" : "Gerar arquivo Excel"}
        </button>
      </section>

      {feedback ? <div className="registers-feedback">{feedback}</div> : null}
      <section className="settings-data-history">
        <div className="settings-data-history-head"><div><span className="settings-data-kicker">Meus Dados</span><h3>Histórico de exportações</h3></div><button type="button" className="soft-btn" onClick={() => loadJobs()}>Atualizar</button></div>
        {loading ? <div className="registers-row">Carregando exportações…</div> : jobs.length ? jobs.map((job) => <article className="settings-data-job" key={job.id}>
          <div className="settings-data-job-main"><strong>{formatDateTime(job.createdAt)}</strong><span>Excel · {Number(job.recordCount || 0).toLocaleString("pt-BR")} registros · {formatBytes(job.fileSize)}</span><small>{job.status === "READY" ? `Disponível até ${formatDateTime(job.expiresAt)}` : ["REQUESTED", "QUEUED", "PROCESSING", "GENERATING_FILE"].includes(job.status) ? "Preparando seus dados…" : "O arquivo não está disponível."}</small></div>
          <div className="settings-data-job-action"><span className={`settings-data-status is-${job.status.toLowerCase()}`}>{STATUS_LABELS[job.status] || job.status}</span>{job.status === "READY" ? <button type="button" className="footer-btn footer-btn-green" onClick={() => downloadExport(job)}>Baixar Excel</button> : null}</div>
        </article>) : <div className="registers-row">Nenhuma exportação solicitada.</div>}
      </section>
      <p className="settings-data-trust">No ViaPet, os dados do seu negócio continuam sendo seus.</p>
    </div>
  </SettingsShell>;
}
