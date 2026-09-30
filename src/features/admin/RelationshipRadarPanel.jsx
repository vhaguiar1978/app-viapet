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
  const [selected, setSelected] = useState([]);
  const [mission, setMission] = useState({ name: "", instruction: "" });
  const [missions, setMissions] = useState([]);
  const [creatingMission, setCreatingMission] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  const [testUserId, setTestUserId] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  async function load(currentPage = page) {
    try {
      const [response, missionResponse] = await Promise.all([apiRequest(`/admin/relationship-radar?page=${currentPage}&limit=30`), apiRequest("/admin/relationship-radar/missions")]);
      setRows(response.data || []); setTotal(response.total || 0); setSettings(response.settings); setPage(currentPage); setFeedback("");
      setMissions(missionResponse.data || []);
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

  function toggleSelected(id) {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : current.length < 25 ? [...current, id] : current);
  }

  async function createMission(event) {
    event.preventDefault(); setCreatingMission(true);
    try {
      const response = await apiRequest("/admin/relationship-radar/missions", { method: "POST", body: JSON.stringify({ ...mission, userIds: selected }) });
      setMission({ name: "", instruction: "" }); setSelected([]); await load(page);
      setFeedback(`Missão analisada: ${response.data.results.length} cliente(s), sem envio de mensagens.`);
    } catch (error) { setFeedback(error.message || "Não foi possível criar a missão."); }
    finally { setCreatingMission(false); }
  }

  async function testAssistant(event) {
    event.preventDefault(); setTesting(true); setTestResult(null);
    try {
      const response = await apiRequest("/admin/relationship-radar/simulate", { method: "POST", body: JSON.stringify({ message: testMessage, userId: testUserId || null }) });
      setTestResult(response.data); setFeedback("");
    } catch (error) { setFeedback(error.message || "Não foi possível testar a Assistente."); }
    finally { setTesting(false); }
  }

  if (!settings) return <div className="seller-panel">Carregando Radar de clientes...</div>;
  const counts = rows.reduce((sum, row) => ({ ...sum, [row.state]: (sum[row.state] || 0) + 1 }), {});
  return <section className="relationship-radar">
    <header className="relationship-radar-head"><div><span>ASSISTENTE VIAPET</span><h3>Radar de relacionamento</h3><p>Acompanhe os sinais de uso e a próxima ação recomendada para cada cliente.</p></div><b>Somente observar</b></header>
    <div className="relationship-radar-metrics"><div><strong>{total}</strong><span>clientes</span></div><div><strong>{counts.possivel_dificuldade || 0}</strong><span>possível dificuldade nesta página</span></div><div><strong>{counts.inativo || 0}</strong><span>inativos nesta página</span></div><div><strong>{counts.assinante_ativo || 0}</strong><span>assinantes nesta página</span></div></div>
    {feedback && <p className="relationship-radar-feedback">{feedback}</p>}
    <div className="relationship-radar-list">{rows.map((row) => <article key={row.id}><label className="relationship-radar-select"><input type="checkbox" checked={selected.includes(row.id)} onChange={() => toggleSelected(row.id)} aria-label={`Selecionar ${row.name}`}/></label><div className="relationship-radar-person"><strong>{row.name}</strong><small>Último acesso: {row.lastAccess ? new Date(row.lastAccess).toLocaleDateString("pt-BR") : "ainda não acessou"} · {row.signals.inactiveOperationalDays} dias operacionais</small></div><div className="relationship-radar-score"><b>{row.healthScore}</b><small>saúde</small></div><div className="relationship-radar-decision"><span>{ACTIONS[row.nextAction] || row.nextAction}</span><small>{row.reason}</small></div></article>)}{!rows.length && <p>Nenhum cliente encontrado.</p>}</div>
    <div className="relationship-radar-pagination"><button type="button" disabled={page <= 1} onClick={() => load(page - 1)}>Anterior</button><span>Página {page} de {Math.max(1, Math.ceil(total / 30))}</span><button type="button" disabled={page * 30 >= total} onClick={() => load(page + 1)}>Próxima</button></div>
    <form className="relationship-radar-settings" onSubmit={createMission}><h3>Nova missão</h3><p>{selected.length}/25 clientes selecionados. A Assistente analisará cada caso e guardará o resultado.</p><label>Nome da missão<input required maxLength="160" value={mission.name} onChange={(event) => setMission({ ...mission, name: event.target.value })} placeholder="Ex.: Ajudar clientes novos"/></label><label>Instrução para a Assistente<textarea required rows="3" maxLength="4000" value={mission.instruction} onChange={(event) => setMission({ ...mission, instruction: event.target.value })} placeholder="Avalie por que estes clientes usam pouco o ViaPet..."/></label><button disabled={!selected.length || creatingMission}>{creatingMission ? "Analisando..." : "Analisar selecionados"}</button></form>
    <div className="relationship-radar-settings"><h3>Missões recentes</h3>{missions.length ? missions.slice(0, 8).map((item) => <details key={item.id}><summary>{item.name} · {item.results?.length || 0} analisados · {new Date(item.createdAt).toLocaleDateString("pt-BR")}</summary><div className="relationship-radar-mission-results">{(item.results || []).map((result) => <p key={result.id}><strong>{result.name}</strong> — {ACTIONS[result.nextAction] || result.nextAction}. {result.reason}</p>)}</div></details>) : <p>Nenhuma missão registrada.</p>}</div>
    <form className="relationship-radar-settings" onSubmit={testAssistant}><h3>Testar Assistente</h3><p>Simule uma conversa. O teste não envia WhatsApp nem altera o cliente.</p><label>Cliente (opcional)<select value={testUserId} onChange={(event) => setTestUserId(event.target.value)}><option value="">Sem cliente específico</option>{rows.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label><label>Mensagem do cliente<textarea required rows="3" maxLength="1500" value={testMessage} onChange={(event) => setTestMessage(event.target.value)} placeholder="Ex.: Já paguei; Como crio um pacotinho?"/></label><button disabled={testing}>{testing ? "Analisando..." : "Simular resposta"}</button>{testResult && <div className="relationship-radar-test-result"><strong>Resposta sugerida</strong><p>{testResult.reply}</p><small>Modo: {testResult.mode} · Próxima ação: {testResult.nextAction} · IA especialista: {testResult.specialistConsulted ? "consultada" : "não necessária"} · Fonte: {testResult.source || "regra interna"} · Humano: {testResult.humanHandoff ? "sim" : "não"}</small></div>}</form>
    <form className="relationship-radar-settings" onSubmit={save}><h3>Regras do Radar</h3><p>Estas regras afetam apenas a análise. Nenhum contato é enviado.</p><label>Dias sem acesso para avaliar reativação<input type="number" min="1" max="30" value={settings.inactivityThresholdDays} onChange={(event) => setSettings({ ...settings, inactivityThresholdDays: Number(event.target.value) })}/></label><fieldset><legend>Dias de funcionamento</legend>{WEEKDAYS.map((day, index) => <label key={day}><input type="checkbox" checked={settings.operationalDays.includes(index)} onChange={(event) => setSettings({ ...settings, operationalDays: event.target.checked ? [...settings.operationalDays, index] : settings.operationalDays.filter((value) => value !== index) })}/>{day}</label>)}</fieldset><label>Feriados (AAAA-MM-DD, separados por vírgula)<input value={(settings.holidays || []).join(", ")} onChange={(event) => setSettings({ ...settings, holidays: event.target.value.split(",").map((value) => value.trim()).filter(Boolean) })} placeholder="2026-12-25, 2027-01-01"/></label><label>Instruções para a Assistente<textarea rows="4" value={settings.instructions || ""} onChange={(event) => setSettings({ ...settings, instructions: event.target.value })} placeholder="Ajude primeiro, venda quando houver interesse..."/></label><button disabled={saving}>{saving ? "Salvando..." : "Salvar regras"}</button></form>
  </section>;
}
