/**
 * Helpers reutilizáveis das páginas admin: export CSV e filtro global persistido.
 */

export function exportCsv(filename, headers, rows) {
  const safe = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(safe).join(";"), ...rows.map((r) => r.map(safe).join(";"))].join("\r\n");
  // BOM para Excel reconhecer UTF-8
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const GLOBAL_FILTER_KEY = "viapet.admin.globalFilter";

export function readGlobalFilter() {
  if (typeof window === "undefined") return { period: "30" };
  try {
    const raw = window.localStorage.getItem(GLOBAL_FILTER_KEY);
    if (!raw) return { period: "30" };
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return { period: "30" };
    return { period: String(parsed.period || "30"), ...parsed };
  } catch {
    return { period: "30" };
  }
}

export function writeGlobalFilter(next) {
  if (typeof window === "undefined") return;
  try {
    const current = readGlobalFilter();
    window.localStorage.setItem(GLOBAL_FILTER_KEY, JSON.stringify({ ...current, ...next }));
    window.dispatchEvent(new CustomEvent("viapet:adminFilterChanged"));
  } catch {
    // ignore
  }
}

export function brl(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
