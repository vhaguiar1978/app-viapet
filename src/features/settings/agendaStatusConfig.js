const AGENDA_STATUS_LABELS_STORAGE_KEY = "viapet.settings.agenda.status-labels";

export const AGENDA_STATUS_OPTIONS = [
  { key: "aguardando", label: "Aguardando", background: "#fff200", color: "#1d1d1d" },
  { key: "fazendo", label: "Fazendo", background: "#ff910d", color: "#ffffff" },
  { key: "secando", label: "Secando", background: "#33d12a", color: "#ffffff" },
  { key: "pronto", label: "Pronto", background: "#007a00", color: "#ffffff" },
  { key: "entregue", label: "Entregue", background: "#2c8ff1", color: "#ffffff" },
  { key: "refazer", label: "Refazer", background: "#1e17ff", color: "#ffffff" },
  { key: "atrasado", label: "Atrasado", background: "#fb1714", color: "#ffffff" },
  { key: "encaixe", label: "Encaixe", background: "#9f0300", color: "#ffffff" },
  { key: "atencao", label: "Atencao", background: "#000000", color: "#ffffff" },
];

const AGENDA_STATUS_ALIAS = {
  agendado: "aguardando",
  pendente: "aguardando",
  pago: "entregue",
  parcial: "fazendo",
};

function readStatusLabelsOverride() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = window.localStorage.getItem(AGENDA_STATUS_LABELS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function getAgendaStatusOptions() {
  const overrides = readStatusLabelsOverride();
  return AGENDA_STATUS_OPTIONS.map((item) => ({
    ...item,
    label: overrides?.[item.key] || item.label,
  }));
}

export function writeAgendaStatusLabelsOverride(labels) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(AGENDA_STATUS_LABELS_STORAGE_KEY, JSON.stringify(labels || {}));
  } catch {}
}

export function getAgendaStatusMeta(status) {
  const normalized = String(status || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  const resolvedKey = AGENDA_STATUS_ALIAS[normalized] || normalized || "aguardando";
  return getAgendaStatusOptions().find((item) => item.key === resolvedKey) || getAgendaStatusOptions()[0];
}
