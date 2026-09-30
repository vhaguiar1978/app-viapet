import { useEffect, useState } from "react";
import "./relationshipRadar.css";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const ACTIONS = { none: "Não contatar", observe: "Observar", offer_help: "Oferecer ajuda", evaluate_reactivation: "Avaliar reativação" };

export default function RelationshipRadarPanel({ apiRequest }) {
  const [rows, setRows] = useState([]);
  const [settings, setSettings] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function load(currentPage = page) {
    try {
      const response = await apiRequest(`/admin/relationship-radar?page=${currentPage}&limit=30`);
      setRows(response.data || []); setTotal(response.total || 0); setSettings(response.settings); setPage(currentPage); setFeedback("");
    } catch (error) { setFeedback(error.message || "Não foi possível carregar o Radar."); }
  }
  useEffect(() => { load(1); }, []);

  async function save(event) {
    event.preventDefault(); setSaving(true);
    try {
      await apiRequest("/admin/relationship-radar/settings", { method: "PUT", body: JSON.stringify(settings) });
      await load(1); setFeedback("Regras salvas. O Radar continua somente observando.");
    } catch (error) { setFeedback(error.message || "Não foi possível salvar."); }
    finally { setSaving(false); }
  }

  if (!settings) return <div className="seller-panel">Carregando Radar de clientes...</div>;
  const counts = rows.reduce((sum, row) => ({ ...sum, [row.state]: (sum[row.state] || 0) + 1 }), {});
  return <section className="relationship-radar">
    <header className="relationship-radar-head"><div><span>ASSISTENTE VIAPET</span><h3>Radar de relacionamento</h3><p>Acompanhe os sinais de uso e a próxima ação recomendada para cada cliente.</p></div><b>Somente observar</b></header>
    <div className="relationship-radar-metrics"><div><strong>{total}</strong><span>clientes</span></div><div><strong>{counts.possivel_dificuldade || 0}</strong><span>possível dificuldade nesta página</span></div><div><strong>{counts.inativo || 0}</strong><span>inativos nesta página</span></div><div><strong>{counts.assinante_ativo || 0}</strong><span>assinantes nesta página</span></div></div>
    {feedback && <p className="relationship-radar-feedback">{feedback}</p>}
    <div className="relationship-radar-list">{rows.map((row) => <article key={row.id}><div className="relationship-radar-person"><strong>{row.name}</strong><small>Último acesso: {row.lastAccess ? new Date(row.lastAccess).toLocaleDateString("pt-BR") : "ainda não acessou"} · {row.signals.inactiveOperationalDays} dias operacionais</small></div><div className="relationship-radar-score"><b>{row.healthScore}</b><small>saúde</small></div><div className="relationship-radar-decision"><span>{ACTIONS[row.nextAction] || row.nextAction}</span><small>{row.reason}</small></div></article>)}{!rows.length && <p>Nenhum cliente encontrado.</p>}</div>
    <div className="relationship-radar-pagination"><button type="button" disabled={page <= 1} onClick={() => load(page - 1)}>Anterior</button><span>Página {page} de {Math.max(1, Math.ceil(total / 30))}</span><button type="button" disabled={page * 30 >= total} onClick={() => load(page + 1)}>Próxima</button></div>
    <form className="relationship-radar-settings" onSubmit={save}><h3>Regras do Radar</h3><p>Estas regras afetam apenas a análise. Nenhum contato é enviado.</p><label>Dias sem acesso para avaliar reativação<input type="number" min="1" max="30" value={settings.inactivityThresholdDays} onChange={(event) => setSettings({ ...settings, inactivityThresholdDays: Number(event.target.value) })}/></label><fieldset><legend>Dias de funcionamento</legend>{WEEKDAYS.map((day, index) => <label key={day}><input type="checkbox" checked={settings.operationalDays.includes(index)} onChange={(event) => setSettings({ ...settings, operationalDays: event.target.checked ? [...settings.operationalDays, index] : settings.operationalDays.filter((value) => value !== index) })}/>{day}</label>)}</fieldset><label>Feriados (AAAA-MM-DD, separados por vírgula)<input value={(settings.holidays || []).join(", ")} onChange={(event) => setSettings({ ...settings, holidays: event.target.value.split(",").map((value) => value.trim()).filter(Boolean) })} placeholder="2026-12-25, 2027-01-01"/></label><label>Instruções para a Assistente<textarea rows="4" value={settings.instructions || ""} onChange={(event) => setSettings({ ...settings, instructions: event.target.value })} placeholder="Ajude primeiro, venda quando houver interesse..."/></label><button disabled={saving}>{saving ? "Salvando..." : "Salvar regras"}</button></form>
  </section>;
}
