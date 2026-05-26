import { useEffect, useMemo, useState } from "react";
import { FinanceShell } from "../FinanceShell.jsx";
import { fmtBR } from "../_shared.jsx";

const ENTRY_STATUS_OPTIONS = [
  { value: "pending", label: "Pendente" },
  { value: "suggested", label: "Sugestão" },
  { value: "matched", label: "Conciliado" },
  { value: "ignored", label: "Ignorado" },
];

const STATUS_COLORS = {
  pending: { bg: "#fff7e6", color: "#8a5a00" },
  suggested: { bg: "#e6f3ff", color: "#0050c0" },
  matched: { bg: "#e6fff0", color: "#067a35" },
  ignored: { bg: "#f0f0f4", color: "#666" },
};

export function FinanceConciliacaoView({ apiRequest }) {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [statements, setStatements] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedStatementId, setSelectedStatementId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadAccount, setUploadAccount] = useState("");
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [lastImport, setLastImport] = useState(null);

  // Carrega contas + extratos no mount
  useEffect(() => {
    if (!apiRequest) return;
    apiRequest("/bank-accounts", { method: "GET" })
      .then((r) => setBankAccounts(r?.data || []))
      .catch(() => {});
    refreshStatements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshStatements() {
    try {
      const r = await apiRequest("/bank-reconciliation/statements", { method: "GET" });
      setStatements(r?.data || []);
    } catch {}
  }

  async function loadEntries() {
    setLoadingEntries(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatementId) params.set("statementId", selectedStatementId);
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", "200");
      const r = await apiRequest(`/bank-reconciliation/entries?${params.toString()}`, { method: "GET" });
      setEntries(r?.data || []);
    } catch (err) {
      setFeedback(err?.message || "Erro ao carregar lançamentos");
    } finally {
      setLoadingEntries(false);
    }
  }

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatementId, statusFilter]);

  async function handleUpload(e) {
    e.preventDefault();
    if (!uploadFile) {
      setFeedback("Selecione um arquivo CSV, XLSX ou OFX.");
      return;
    }
    setUploading(true);
    setFeedback("");
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      if (uploadAccount) fd.append("bankAccountId", uploadAccount);
      fd.append("autoReconcile", "true");

      const json = await apiRequest("/bank-reconciliation/import", {
        method: "POST",
        body: fd,
      });

      setLastImport(json?.data);
      const r = json?.data?.reconcileResults;
      setFeedback(
        `Importado: ${json?.data?.imported} lançamentos${json?.data?.skippedDuplicates ? ` (${json.data.skippedDuplicates} duplicados ignorados)` : ""}.` +
          (r ? ` Conciliação automática: ${r.auto} conciliados, ${r.suggested} sugestões, ${r.pending} pendentes.` : ""),
      );
      setUploadFile(null);
      refreshStatements();
      loadEntries();
    } catch (err) {
      setFeedback(err?.message || "Erro ao importar extrato");
    } finally {
      setUploading(false);
    }
  }

  async function confirmEntry(entry) {
    try {
      await apiRequest(`/bank-reconciliation/entries/${entry.id}/confirm`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      loadEntries();
    } catch (err) {
      setFeedback(err?.message || "Erro ao confirmar");
    }
  }

  async function ignoreEntry(entry) {
    try {
      await apiRequest(`/bank-reconciliation/entries/${entry.id}/ignore`, { method: "POST" });
      loadEntries();
    } catch (err) {
      setFeedback(err?.message || "Erro ao ignorar");
    }
  }

  async function rematchEntry(entry) {
    try {
      await apiRequest(`/bank-reconciliation/entries/${entry.id}/match`, { method: "POST" });
      loadEntries();
    } catch (err) {
      setFeedback(err?.message || "Erro ao re-conciliar");
    }
  }

  const accountById = useMemo(() => {
    const map = new Map();
    bankAccounts.forEach((a) => map.set(a.id, a));
    return map;
  }, [bankAccounts]);

  return (
    <FinanceShell activeTab="Conciliacao" originValue="Conciliacao">
      <div style={{ padding: "16px 20px", maxWidth: 1200 }}>
        <header style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Conciliação bancária</h2>
          <p style={{ margin: "4px 0 0", color: "#666", fontSize: 13 }}>
            Importe extratos em CSV, Excel ou OFX. O sistema procura matches entre os lançamentos do extrato e despesas/pagamentos pendentes no ViaPET — e dá baixa automaticamente quando há alta confiança (valor + data + nome batendo).
          </p>
        </header>

        {feedback ? <div className="registers-feedback" style={{ marginBottom: 12 }}>{feedback}</div> : null}

        <form
          onSubmit={handleUpload}
          style={{
            background: "#fff",
            border: "1px solid #e8e8ee",
            borderRadius: 10,
            padding: 14,
            marginBottom: 16,
            display: "grid",
            gridTemplateColumns: "1fr 1fr auto",
            gap: 10,
            alignItems: "end",
          }}
        >
          <div className="field-block">
            <label>Arquivo (CSV, XLSX ou OFX)</label>
            <input
              className="field-input"
              type="file"
              accept=".csv,.xlsx,.xls,.ofx"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="field-block">
            <label>Conta bancária (opcional)</label>
            <select
              className="field-input"
              value={uploadAccount}
              onChange={(e) => setUploadAccount(e.target.value)}
            >
              <option value="">Sem conta vinculada</option>
              {bankAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}{a.bank ? ` — ${a.bank}` : ""}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="footer-btn footer-btn-green" disabled={uploading}>
            {uploading ? "Importando…" : "Importar e conciliar"}
          </button>
        </form>

        {/* Filtros */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div className="field-block" style={{ minWidth: 220 }}>
            <label>Extrato</label>
            <select
              className="field-input"
              value={selectedStatementId}
              onChange={(e) => setSelectedStatementId(e.target.value)}
            >
              <option value="">Todos os extratos</option>
              {statements.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fileName || s.sourceType} ({s.totalEntries} lanç. — {new Date(s.createdAt).toLocaleDateString("pt-BR")})
                </option>
              ))}
            </select>
          </div>
          <div className="field-block" style={{ minWidth: 160 }}>
            <label>Status</label>
            <select
              className="field-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos</option>
              {ENTRY_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <button type="button" className="soft-chip" onClick={loadEntries}>Atualizar</button>
        </div>

        {/* Tabela de entries */}
        {loadingEntries ? <div>Carregando lançamentos…</div> : (
          entries.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#888" }}>
              Nenhum lançamento encontrado.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 6 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "90px 80px 110px 1.6fr 1fr 110px 220px",
                  gap: 8,
                  fontWeight: 600,
                  fontSize: 11,
                  color: "#555",
                  padding: "0 6px",
                  textTransform: "uppercase",
                }}
              >
                <div>Data</div>
                <div>Tipo</div>
                <div style={{ textAlign: "right" }}>Valor</div>
                <div>Descrição</div>
                <div>Pagador</div>
                <div>Status</div>
                <div>Ações</div>
              </div>
              {entries.map((entry) => {
                const acc = entry.bankAccountId ? accountById.get(entry.bankAccountId) : null;
                const colors = STATUS_COLORS[entry.matchStatus] || STATUS_COLORS.pending;
                return (
                  <div
                    key={entry.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "90px 80px 110px 1.6fr 1fr 110px 220px",
                      gap: 8,
                      alignItems: "center",
                      background: "#fff",
                      border: "1px solid #e8e8ee",
                      borderRadius: 8,
                      padding: 8,
                      fontSize: 13,
                    }}
                  >
                    <div>{new Date(entry.entryDate).toLocaleDateString("pt-BR")}</div>
                    <div style={{ color: entry.direction === "credit" ? "#067a35" : "#c0392b", fontWeight: 600 }}>
                      {entry.direction === "credit" ? "Entrada" : "Saída"}
                    </div>
                    <div style={{ textAlign: "right", fontWeight: 600 }}>
                      R$ {fmtBR(entry.amount)}
                    </div>
                    <div style={{ fontSize: 12 }}>
                      <div>{entry.description || "—"}</div>
                      {entry.paymentMethodHint ? (
                        <div style={{ color: "#888", fontSize: 11 }}>{entry.paymentMethodHint}</div>
                      ) : null}
                      {acc ? (
                        <div style={{ color: "#888", fontSize: 11 }}>→ {acc.name}</div>
                      ) : null}
                    </div>
                    <div style={{ fontSize: 12 }}>
                      <div>{entry.payerName || "—"}</div>
                      {entry.payerDocument ? (
                        <div style={{ color: "#888", fontSize: 11 }}>{entry.payerDocument}</div>
                      ) : null}
                    </div>
                    <div>
                      <span
                        style={{
                          background: colors.bg,
                          color: colors.color,
                          padding: "3px 8px",
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {ENTRY_STATUS_OPTIONS.find((o) => o.value === entry.matchStatus)?.label || entry.matchStatus}
                      </span>
                      {entry.matchConfidence != null ? (
                        <span style={{ marginLeft: 6, fontSize: 11, color: "#888" }}>
                          {Math.round(Number(entry.matchConfidence) * 100)}%
                        </span>
                      ) : null}
                    </div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {entry.matchStatus === "suggested" ? (
                        <>
                          <button type="button" className="soft-chip active" onClick={() => confirmEntry(entry)} style={{ fontSize: 11 }}>
                            Aceitar
                          </button>
                          <button type="button" className="soft-chip" onClick={() => ignoreEntry(entry)} style={{ fontSize: 11 }}>
                            Ignorar
                          </button>
                        </>
                      ) : entry.matchStatus === "pending" ? (
                        <>
                          <button type="button" className="soft-chip" onClick={() => rematchEntry(entry)} style={{ fontSize: 11 }}>
                            Buscar match
                          </button>
                          <button type="button" className="soft-chip" onClick={() => ignoreEntry(entry)} style={{ fontSize: 11 }}>
                            Ignorar
                          </button>
                        </>
                      ) : entry.matchStatus === "matched" ? (
                        <span style={{ fontSize: 11, color: "#067a35" }}>✓ Baixa aplicada</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {lastImport ? (
          <details style={{ marginTop: 24, fontSize: 12, color: "#888" }}>
            <summary>Detalhes da última importação</summary>
            <pre style={{ background: "#f8f8fa", padding: 10, borderRadius: 6, overflow: "auto" }}>
              {JSON.stringify(lastImport, null, 2)}
            </pre>
          </details>
        ) : null}
      </div>
    </FinanceShell>
  );
}
