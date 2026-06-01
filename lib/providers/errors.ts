export function friendlyOddsApiError(status: number, rawBody: string): string {
  let parsed: { message?: string; error_code?: string } = {};
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    parsed = {};
  }
  const code = parsed.error_code;

  if (status === 401 && code === "OUT_OF_USAGE_CREDITS") {
    const reset = nextMonthFirstDayPtBr();
    return `Cota mensal grátis da The Odds API esgotada. Reseta automaticamente em ${reset}. Para destravar antes, faça upgrade do plano em the-odds-api.com.`;
  }
  if (status === 401) {
    return "Chave da The Odds API rejeitada (401). Confira THE_ODDS_API_KEY no .env.local.";
  }
  if (status === 429) {
    return "Limite de requisições por minuto atingido. Tente novamente em alguns segundos.";
  }
  if (status >= 500) {
    return "The Odds API está fora do ar agora. Tente novamente em instantes.";
  }
  const msg = parsed.message ? `: ${parsed.message}` : "";
  return `The Odds API respondeu ${status}${msg}`;
}

function nextMonthFirstDayPtBr(): string {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 12, 0, 0));
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo"
  }).format(next);
}
