// Catalogo central de etiquetas (tags) usadas nas conversas do CRM.
// Slug e a chave salva em metadata.tags (lowercase, sem acento).

export const CONVERSATION_TAGS = [
  { slug: "novo-lead",     label: "Novo lead",     color: "#2563eb", bg: "#dbeafe" },
  { slug: "banho-marcado", label: "Banho marcado", color: "#16a34a", bg: "#dcfce7" },
  { slug: "cobranca",      label: "Cobranca",      color: "#b45309", bg: "#fef3c7" },
  { slug: "pacotinho",     label: "Pacotinho",     color: "#7c3aed", bg: "#ede9fe" },
  { slug: "retorno",       label: "Retorno",       color: "#0e7490", bg: "#cffafe" },
  { slug: "urgente",       label: "Urgente",       color: "#dc2626", bg: "#fee2e2" },
];

const TAG_BY_SLUG = new Map(CONVERSATION_TAGS.map((tag) => [tag.slug, tag]));

export function getTagBySlug(slug) {
  return TAG_BY_SLUG.get(String(slug || "").toLowerCase()) || null;
}

export function normalizeTagSlugs(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((value) => String(value || "").toLowerCase())
    .filter((slug) => TAG_BY_SLUG.has(slug));
}
