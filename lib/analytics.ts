export type RiskLevel = "Baixo" | "Médio" | "Alto" | "Mercado instável" | "Dados insuficientes";
export type ValueLevel = "Valor alto" | "Valor moderado" | "Valor leve" | "Sem valor" | "Dados insuficientes";
export type DataQuality = "fortes" | "médios" | "fracos";

export function impliedProbability(odd: number) {
  if (odd <= 1) return 0;
  return 1 / odd;
}

export function fairOdd(probability: number) {
  if (probability <= 0) return 0;
  return 1 / probability;
}

export function calculateEdge(modelProbability: number, marketOdd: number) {
  return modelProbability * marketOdd - 1;
}

export function classifyValue(edge: number, dataQuality: DataQuality): ValueLevel {
  if (dataQuality === "fracos") return "Dados insuficientes";
  if (edge >= 0.18) return "Valor alto";
  if (edge >= 0.1) return "Valor moderado";
  if (edge >= 0.04) return "Valor leve";
  return "Sem valor";
}

export function classifyRisk(confidence: number, volatility: number, dataQuality: DataQuality): RiskLevel {
  if (dataQuality === "fracos") return "Dados insuficientes";
  if (volatility > 0.75) return "Mercado instável";
  if (confidence >= 78 && volatility < 0.42) return "Baixo";
  if (confidence >= 58) return "Médio";
  return "Alto";
}

export function generateConfidenceScore(params: {
  dataQuality: DataQuality;
  historicalVolume: number;
  marketStability: number;
  modelMarketDivergence: number;
  recency: number;
}) {
  const quality = params.dataQuality === "fortes" ? 24 : params.dataQuality === "médios" ? 16 : 8;
  const raw =
    quality +
    params.historicalVolume * 20 +
    params.marketStability * 18 +
    params.recency * 16 +
    Math.min(params.modelMarketDivergence, 0.22) * 100;
  return Math.max(24, Math.min(94, Math.round(raw)));
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function calculateHitRate(total: number, wins: number) {
  if (total === 0) return 0;
  return wins / total;
}

export function calculateSimulatedRoi(totalStake: number, profit: number) {
  if (totalStake === 0) return 0;
  return profit / totalStake;
}

export function generateAnalysisText(params: {
  sport: string;
  market: string;
  home: string;
  away: string;
  modelProbability: number;
  confidence: number;
  risk: RiskLevel;
  dataQuality: DataQuality;
  drivers: string[];
}) {
  const subject =
    params.sport === "Tênis" || params.sport === "Vôlei"
      ? `${params.home} x ${params.away}`
      : `${params.home} contra ${params.away}`;

  return `A IA encontrou leitura favorável para ${params.market} em ${subject}. ${params.drivers.join(
    " "
  )} A probabilidade estimada é de ${formatPercent(params.modelProbability)}, com confiança ${params.confidence}/100 e risco ${params.risk.toLowerCase()}. Dados ${params.dataQuality}. Nenhuma análise garante resultado; use como apoio estatístico e aposte com responsabilidade.`;
}
