import { useEffect, useMemo, useState } from "react";
import "./UserActivityPage.css";
import { readGlobalFilter, writeGlobalFilter } from "./adminUtils.js";

/**
 * Página "Movimentação dos Usuários"
 *
 * Espera as props:
 *   - apiRequest(path, options)  → mesmo helper usado em App.jsx (com Authorization)
 *   - currentUser { role, establishment, id }
 *
 * Não usa router próprio: é renderizada como aba dentro de /admin (ou /viacentral
 * para proprietarios, dependendo de como App.jsx encaminhar).
 */

const PERIOD_OPTIONS = [
  { value: "1", label: "Hoje" },
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
];

function formatDateTime(value) {
  if (!value) return "—";
  try {
    const dt = new Date(value);
    if (isNaN(dt.getTime())) return "—";
    return dt.toLocaleString("pt-BR", { hour12: false });
  } catch {
    return "—";
  }
}

function relativeFromNow(value) {
  if (!value) return "nunca";
  const dt = new Date(value);
  if (isNaN(dt.getTime())) return "—";
  const diff = Date.now() - dt.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours <= 0) return "agora";
    return `há ${hours}h`;
  }
  if (days === 1) return "há 1 dia";
  return `há ${days} dias`;
}

function describeAcao(modulo, acao) {
  const map = {
    "auth/login_success": "Entrou no sistema",
    "auth/login_failed": "Falha no login",
    "auth/login_blocked": "Login bloqueado",
    "auth/logout": "Saiu do sistema",
    "navegacao/page_view": "Acessou tela",
    "clientes/customer_created": "Cadastrou cliente",
    "clientes/customer_updated": "Editou cliente",
    "clientes/customer_deleted": "Excluiu cliente",
    "pets/pet_created": "Cadastrou pet",
    "pets/pet_updated": "Editou pet",
    "pets/pet_deleted": "Excluiu pet",
    "agenda/appointment_created": "Novo agendamento",
    "agenda/appointment_updated": "Editou agendamento",
    "agenda/appointment_deleted": "Excluiu agendamento",
    "financeiro/finance_created": "Lançamento financeiro",
    "financeiro/finance_updated": "Editou lançamento",
    "financeiro/finance_deleted": "Excluiu lançamento",
    "financeiro/payment_confirmed": "Confirmou pagamento",
    "financeiro/finance_status_changed": "Alterou status",
    "ui/client_error": "Erro na tela",
    "system/server_error": "Erro do servidor",
  };
  const key = `${modulo}/${acao}`;
  return map[key] || `${modulo} · ${acao}`;
}

function isErrorAction(acao) {
  return acao === "save_error" || acao === "client_error" || acao === "server_error";
}

function formatDayLabel(isoDay) {
  if (!isoDay) return "—";
  // Postgres devolve YYYY-MM-DD (string ou Date stringificado)
  const raw = typeof isoDay === "string" ? isoDay : new Date(isoDay).toISOString();
  const parts = raw.slice(0, 10).split("-");
  if (parts.length !== 3) return raw;
  return `${parts[2]}/${parts[1]}`;
}

export default function UserActivityPage({ apiRequest, currentUser }) {
  const [days, setDaysState] = useState(() => readGlobalFilter().period || "7");
  const setDays = (value) => {
    setDaysState(value);
    writeGlobalFilter({ period: value });
  };
  // Sincroniza quando outra página altera o filtro
  useEffect(() => {
    const handler = () => {
      const next = readGlobalFilter().period;
      if (next && next !== days) setDaysState(next);
    };
    window.addEventListener("viapet:adminFilterChanged", handler);
    return () => window.removeEventListener("viapet:adminFilterChanged", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);
  const [moduloFilter, setModuloFilter] = useState("");
  const [acaoFilter, setAcaoFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState({ items: [], total: 0 });
  const [alerts, setAlerts] = useState(null);
  const [filters, setFilters] = useState({ modulos: [], acoes: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const queryParams = useMemo(() => {
    const p = new URLSearchParams();
    if (days) p.set("days", days);
    if (moduloFilter) p.set("modulo", moduloFilter);
    if (acaoFilter) p.set("acao", acaoFilter);
    if (userFilter) p.set("userId", userFilter);
    return p.toString();
  }, [days, moduloFilter, acaoFilter, userFilter]);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const qs = queryParams ? `?${queryParams}` : "";
      const [dashRes, usersRes, logsRes, alertsRes, filtersRes] = await Promise.all([
        apiRequest(`/admin/user-activity/dashboard${qs}`),
        apiRequest(`/admin/user-activity/users${qs}`),
        apiRequest(`/admin/user-activity/logs${qs}&limit=100`),
        apiRequest(`/admin/user-activity/alerts${qs}`),
        apiRequest(`/admin/user-activity/filters${qs}`),
      ]);
      setDashboard(dashRes?.data || null);
      setUsers(usersRes?.data || []);
      setLogs(logsRes?.data || { items: [], total: 0 });
      setAlerts(alertsRes?.data || null);
      setFilters(filtersRes?.data || { modulos: [], acoes: [] });
    } catch (err) {
      console.error("[UserActivity] erro ao carregar", err);
      setError(err?.message || "Falha ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  async function openTimeline(user) {
    setSelectedUser(user);
    setTimeline(null);
    setTimelineLoading(true);
    try {
      const qs = queryParams ? `?${queryParams}&limit=200` : "?limit=200";
      const res = await apiRequest(`/admin/user-activity/users/${user.id}/timeline${qs}`);
      setTimeline(res?.data || null);
    } catch (err) {
      console.error("[UserActivity] timeline error", err);
      setTimeline({ user, items: [], total: 0 });
    } finally {
      setTimelineLoading(false);
    }
  }

  function closeTimeline() {
    setSelectedUser(null);
    setTimeline(null);
  }

  const filteredLogs = useMemo(() => {
    const list = logs?.items || [];
    if (!searchText.trim()) return list;
    const term = searchText.toLowerCase();
    return list.filter((log) => {
      return (
        (log.descricao || "").toLowerCase().includes(term) ||
        (log.nome_usuario || "").toLowerCase().includes(term) ||
        (log.modulo || "").toLowerCase().includes(term) ||
        (log.acao || "").toLowerCase().includes(term)
      );
    });
  }, [logs, searchText]);

  return (
    <div className="user-activity-page">
      <header className="user-activity-header">
        <div>
          <h2>Movimentação dos Usuários</h2>
          <p className="user-activity-sub">
            Acompanhe quem está usando o sistema, quais telas acessam e onde podem estar
            travando. Dados protegidos por mascaramento de informações sensíveis.
          </p>
        </div>
      </header>

      <section className="user-activity-filters">
        <label className="ua-field">
          <span>Período</span>
          <select value={days} onChange={(e) => setDays(e.target.value)}>
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>

        <label className="ua-field">
          <span>Módulo</span>
          <select value={moduloFilter} onChange={(e) => setModuloFilter(e.target.value)}>
            <option value="">Todos</option>
            {(filters.modulos || []).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>

        <label className="ua-field">
          <span>Ação</span>
          <select value={acaoFilter} onChange={(e) => setAcaoFilter(e.target.value)}>
            <option value="">Todas</option>
            {(filters.acoes || []).map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>

        <label className="ua-field">
          <span>Usuário</span>
          <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
            <option value="">Todos</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name || u.email}</option>
            ))}
          </select>
        </label>

        <label className="ua-field ua-field-grow">
          <span>Buscar</span>
          <input
            type="search"
            placeholder="Buscar em descrições / usuários / módulos…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </label>

        <button
          type="button"
          className="ua-refresh"
          onClick={loadAll}
          disabled={loading}
        >
          {loading ? "Atualizando…" : "Atualizar"}
        </button>
      </section>

      {error ? <div className="ua-error">{error}</div> : null}

      <section className="ua-cards-grid">
        <article className="ua-card ua-card-primary">
          <span className="ua-card-kicker">Hoje</span>
          <h3>Usuários ativos</h3>
          <strong>{dashboard?.activeToday ?? "—"}</strong>
          <small>distintos no dia</small>
        </article>

        <article className="ua-card ua-card-warn">
          <span className="ua-card-kicker">Inatividade</span>
          <h3>Sem acesso há…</h3>
          <div className="ua-inactive-grid">
            <div><strong>{dashboard?.inactive?.d3 ?? 0}</strong><span>3+ dias</span></div>
            <div><strong>{dashboard?.inactive?.d7 ?? 0}</strong><span>7+ dias</span></div>
            <div><strong>{dashboard?.inactive?.d15 ?? 0}</strong><span>15+ dias</span></div>
          </div>
        </article>

        <article className="ua-card">
          <span className="ua-card-kicker">Mais acessadas</span>
          <h3>Top telas</h3>
          <ul className="ua-rank-list">
            {(dashboard?.topPages || []).slice(0, 6).map((row) => (
              <li key={row.entidade_id}>
                <span className="ua-rank-label" title={row.entidade_id}>{row.entidade_id}</span>
                <strong>{row.total}</strong>
              </li>
            ))}
            {!dashboard?.topPages?.length ? <li className="ua-empty">Sem registros no período</li> : null}
          </ul>
        </article>

        <article className="ua-card">
          <span className="ua-card-kicker">Mais usadas</span>
          <h3>Top ações</h3>
          <ul className="ua-rank-list">
            {(dashboard?.topActions || []).slice(0, 6).map((row, idx) => (
              <li key={`${row.modulo}-${row.acao}-${idx}`}>
                <span className="ua-rank-label">{describeAcao(row.modulo, row.acao)}</span>
                <strong>{row.total}</strong>
              </li>
            ))}
            {!dashboard?.topActions?.length ? <li className="ua-empty">Sem registros no período</li> : null}
          </ul>
        </article>
      </section>

      <section className="ua-summary-grid">
        <article className="ua-card ua-card-primary">
          <span className="ua-card-kicker">No período</span>
          <h3>Eventos registrados</h3>
          <strong>{dashboard?.eventsTotal ?? "—"}</strong>
          <small>todos os tipos de ação</small>
        </article>

        <article className="ua-card">
          <span className="ua-card-kicker">Volume diário</span>
          <h3>Eventos por dia</h3>
          <ul className="ua-rank-list">
            {(dashboard?.eventsByDay || []).slice(-7).map((r) => (
              <li key={r.dia}>
                <span className="ua-rank-label">{formatDayLabel(r.dia)}</span>
                <strong>{r.total}</strong>
              </li>
            ))}
            {!dashboard?.eventsByDay?.length ? <li className="ua-empty">Sem registros no período</li> : null}
          </ul>
        </article>

        <article className="ua-card">
          <span className="ua-card-kicker">Distribuição</span>
          <h3>Eventos por módulo</h3>
          <ul className="ua-rank-list">
            {(dashboard?.eventsByModule || []).slice(0, 8).map((r) => (
              <li key={r.modulo}>
                <span className="ua-rank-label">{r.modulo}</span>
                <strong>{r.total}</strong>
              </li>
            ))}
            {!dashboard?.eventsByModule?.length ? <li className="ua-empty">Sem registros no período</li> : null}
          </ul>
        </article>

        {currentUser?.role === "admin" && (dashboard?.tenantsActive?.length ?? 0) > 0 ? (
          <article className="ua-card ua-card-wide">
            <span className="ua-card-kicker">Quem está usando</span>
            <h3>Empresas ativas no período</h3>
            <ul className="ua-rank-list ua-rank-list-rich">
              {dashboard.tenantsActive.slice(0, 10).map((t) => (
                <li key={t.tenantId}>
                  <div className="ua-tenant-info">
                    <span className="ua-rank-label" title={t.tenantId}>{t.name}</span>
                    {t.email ? <small>{t.email}</small> : null}
                  </div>
                  <div className="ua-tenant-meta">
                    <strong>{t.total}</strong>
                    <small>{t.usersDistinct} usuário{t.usersDistinct === 1 ? "" : "s"}</small>
                    <small>último: {relativeFromNow(t.lastEvent)}</small>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ) : null}
      </section>

      <section className="ua-alerts-grid">
        <article className="ua-alert ua-alert-info">
          <header>
            <h4>Usuários novos sem cadastros</h4>
            <span>{alerts?.newUsersWithoutData?.length || 0}</span>
          </header>
          <ul>
            {(alerts?.newUsersWithoutData || []).slice(0, 5).map((u) => (
              <li key={u.userId}>
                <button type="button" className="ua-link-btn" onClick={() => openTimeline({ id: u.userId, name: u.name, email: u.email })}>
                  {u.name || u.email}
                </button>
                <small>desde {formatDateTime(u.createdAt)}</small>
              </li>
            ))}
            {!alerts?.newUsersWithoutData?.length ? <li className="ua-empty">Sem alertas</li> : null}
          </ul>
        </article>

        <article className="ua-alert ua-alert-warn">
          <header>
            <h4>Travaram na agenda (24h)</h4>
            <span>{alerts?.stuckOnAgenda?.length || 0}</span>
          </header>
          <ul>
            {(alerts?.stuckOnAgenda || []).slice(0, 5).map((u) => (
              <li key={u.userId}>
                <button type="button" className="ua-link-btn" onClick={() => openTimeline(u)}>
                  {u.name || u.email}
                </button>
                <small>visitou agenda mas não criou agendamento</small>
              </li>
            ))}
            {!alerts?.stuckOnAgenda?.length ? <li className="ua-empty">Sem alertas</li> : null}
          </ul>
        </article>

        <article className="ua-alert ua-alert-muted">
          <header>
            <h4>Inativos 7+ dias</h4>
            <span>{alerts?.inactiveUsers?.length || 0}</span>
          </header>
          <ul>
            {(alerts?.inactiveUsers || []).slice(0, 5).map((u) => (
              <li key={u.id}>
                <button type="button" className="ua-link-btn" onClick={() => openTimeline(u)}>
                  {u.name || u.email}
                </button>
                <small>{u.lastAccess ? `último: ${relativeFromNow(u.lastAccess)}` : "nunca acessou"}</small>
              </li>
            ))}
            {!alerts?.inactiveUsers?.length ? <li className="ua-empty">Todos ativos</li> : null}
          </ul>
        </article>

        <article className="ua-alert ua-alert-danger">
          <header>
            <h4>Erros recorrentes (24h)</h4>
            <span>{alerts?.repeatedErrors?.length || 0}</span>
          </header>
          <ul>
            {(alerts?.repeatedErrors || []).slice(0, 5).map((row, idx) => (
              <li key={`${row.entidade_id}-${idx}`}>
                <span className="ua-rank-label" title={row.descricao}>{row.entidade_id || "(sem tela)"}</span>
                <small>{row.descricao} · {row.total}×</small>
              </li>
            ))}
            {!alerts?.repeatedErrors?.length ? <li className="ua-empty">Sem erros recorrentes</li> : null}
          </ul>
        </article>
      </section>

      <section className="ua-section">
        <header className="ua-section-header">
          <h3>Usuários do período</h3>
          <small>{users.length} usuários · clique para abrir a linha do tempo</small>
        </header>
        <div className="ua-users-grid">
          {users.map((u) => (
            <button
              type="button"
              key={u.id}
              className={`ua-user-row ${u.lastAccess ? "" : "ua-user-row-cold"}`}
              onClick={() => openTimeline(u)}
            >
              <div>
                <strong>{u.name || u.email}</strong>
                <span>{u.email}</span>
              </div>
              <div className="ua-user-meta">
                <span>{u.eventsInPeriod} eventos</span>
                <small>{u.lastAccess ? `acessou ${relativeFromNow(u.lastAccess)}` : "nunca acessou"}</small>
                {u.lastAccess ? (
                  <small className="ua-user-exact" title="Último acesso (data e hora exatas)">
                    {formatDateTime(u.lastAccess)}
                  </small>
                ) : null}
              </div>
            </button>
          ))}
          {!users.length ? <div className="ua-empty">Sem usuários no período</div> : null}
        </div>
      </section>

      <section className="ua-section">
        <header className="ua-section-header">
          <h3>Eventos recentes</h3>
          <small>{filteredLogs.length} de {logs.total} totais</small>
        </header>
        <div className="ua-logs-table">
          <div className="ua-logs-row ua-logs-head">
            <span>Quando</span>
            <span>Usuário</span>
            <span>Módulo · Ação</span>
            <span>Descrição</span>
            <span>IP</span>
          </div>
          {filteredLogs.slice(0, 200).map((log) => (
            <div
              key={log.id}
              className={`ua-logs-row ${isErrorAction(log.acao) ? "ua-logs-row-error" : ""}`}
            >
              <span title={formatDateTime(log.created_at)}>{relativeFromNow(log.created_at)}</span>
              <span>
                <button
                  type="button"
                  className="ua-link-btn"
                  onClick={() =>
                    openTimeline({
                      id: log.user_id,
                      name: log.nome_usuario,
                      email: "",
                    })
                  }
                  disabled={!log.user_id}
                >
                  {log.nome_usuario || "—"}
                </button>
              </span>
              <span>{describeAcao(log.modulo, log.acao)}</span>
              <span title={log.descricao}>{log.descricao || "—"}</span>
              <span className="ua-mono">{log.ip || "—"}</span>
            </div>
          ))}
          {!filteredLogs.length ? <div className="ua-empty">Nenhum evento no período</div> : null}
        </div>
      </section>

      {selectedUser ? (
        <div className="ua-modal-backdrop" onClick={closeTimeline}>
          <div className="ua-modal" onClick={(e) => e.stopPropagation()}>
            <header>
              <div>
                <h3>{selectedUser.name || selectedUser.email}</h3>
                <small>{selectedUser.email}</small>
              </div>
              <button type="button" className="ua-modal-close" onClick={closeTimeline}>×</button>
            </header>

            {timelineLoading ? (
              <div className="ua-empty">Carregando linha do tempo…</div>
            ) : (
              <>
                <div className="ua-modal-meta">
                  <div>
                    <strong>Último acesso</strong>
                    <span>{timeline?.user?.lastAccess ? formatDateTime(timeline.user.lastAccess) : "nunca"}</span>
                  </div>
                  <div>
                    <strong>Cadastro</strong>
                    <span>{timeline?.user?.createdAt ? formatDateTime(timeline.user.createdAt) : "—"}</span>
                  </div>
                  <div>
                    <strong>Total de eventos</strong>
                    <span>{timeline?.total ?? 0}</span>
                  </div>
                </div>

                <div className="ua-timeline">
                  {(timeline?.items || []).map((item) => (
                    <article
                      key={item.id}
                      className={`ua-timeline-item ${isErrorAction(item.acao) ? "ua-timeline-item-error" : ""}`}
                    >
                      <span className="ua-timeline-time">{formatDateTime(item.created_at)}</span>
                      <strong>{describeAcao(item.modulo, item.acao)}</strong>
                      {item.descricao ? <p>{item.descricao}</p> : null}
                      {item.entidade_tipo ? (
                        <small>{item.entidade_tipo}: {item.entidade_id}</small>
                      ) : null}
                    </article>
                  ))}
                  {!timeline?.items?.length ? <div className="ua-empty">Sem eventos registrados</div> : null}
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
