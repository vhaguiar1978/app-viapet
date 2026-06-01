import {
  calculateEdge,
  calculateHitRate,
  calculateSimulatedRoi,
  classifyRisk,
  classifyValue,
  fairOdd,
  generateAnalysisText,
  generateConfidenceScore,
  impliedProbability,
  type DataQuality
} from "./analytics";

export type Sport = "Futebol" | "Basquete" | "Tênis" | "Vôlei";
export type MatchStatus = "Pré-jogo" | "Ao vivo" | "Encerrado";

export type Market = {
  name: string;
  modelProbability: number;
  bestOdd: number;
  bookmaker: string;
  movement: "up" | "down" | "stable";
};

export type Match = {
  id: string;
  sport: Sport;
  league: string;
  home: string;
  away: string;
  startTime: string;
  status: MatchStatus;
  score?: string;
  minute?: string;
  dataQuality: DataQuality;
  volatility: number;
  stats: {
    expectedGoals?: number;
    expectedCorners?: number;
    expectedCards?: number;
    expectedPoints?: number;
    expectedGames?: number;
    expectedSets?: string;
    formHome: string;
    formAway: string;
    pressure: number;
  };
  markets: Market[];
  drivers: string[];
};

const baseMatches: Match[] = [
  {
    id: "palmeiras-flamengo",
    sport: "Futebol",
    league: "Brasileirão Série A",
    home: "Palmeiras",
    away: "Flamengo",
    startTime: "Hoje, 20:30",
    status: "Pré-jogo",
    dataQuality: "fortes",
    volatility: 0.48,
    stats: {
      expectedGoals: 2.7,
      expectedCorners: 10.4,
      expectedCards: 5.6,
      formHome: "V V E V D",
      formAway: "V E V D V",
      pressure: 78
    },
    markets: [
      { name: "+4.5 cartões", modelProbability: 0.67, bestOdd: 1.72, bookmaker: "Operador A", movement: "down" },
      { name: "+2.5 gols", modelProbability: 0.61, bestOdd: 2.05, bookmaker: "Operador C", movement: "up" },
      { name: "+9.5 escanteios", modelProbability: 0.54, bestOdd: 1.92, bookmaker: "Operador B", movement: "stable" }
    ],
    drivers: [
      "Os dois times têm média elevada de faltas e duelos físicos.",
      "O árbitro apresenta histórico acima da média em cartões.",
      "A odd disponível está acima da odd justa calculada."
    ]
  },
  {
    id: "corinthians-santos",
    sport: "Futebol",
    league: "Copa do Brasil",
    home: "Corinthians",
    away: "Santos",
    startTime: "Ao vivo, 34'",
    status: "Ao vivo",
    score: "1 - 0",
    minute: "34'",
    dataQuality: "médios",
    volatility: 0.62,
    stats: {
      expectedGoals: 2.1,
      expectedCorners: 8.8,
      expectedCards: 4.7,
      formHome: "E V D V E",
      formAway: "D E V D V",
      pressure: 71
    },
    markets: [
      { name: "+8.5 escanteios ao vivo", modelProbability: 0.64, bestOdd: 1.9, bookmaker: "Operador B", movement: "down" },
      { name: "Ambas marcam", modelProbability: 0.49, bestOdd: 2.26, bookmaker: "Operador D", movement: "up" }
    ],
    drivers: [
      "O ritmo de finalizações subiu nos últimos dez minutos.",
      "Os ataques perigosos estão acima do esperado para o minuto atual.",
      "A linha de escanteios ainda não corrigiu totalmente a pressão ofensiva."
    ]
  },
  {
    id: "lakers-celtics",
    sport: "Basquete",
    league: "NBA",
    home: "Lakers",
    away: "Celtics",
    startTime: "Hoje, 23:00",
    status: "Pré-jogo",
    dataQuality: "fortes",
    volatility: 0.44,
    stats: {
      expectedPoints: 225.5,
      formHome: "V D V V E",
      formAway: "V V D V V",
      pressure: 74
    },
    markets: [
      { name: "+221.5 pontos", modelProbability: 0.59, bestOdd: 1.98, bookmaker: "Operador A", movement: "up" },
      { name: "Celtics -3.5", modelProbability: 0.56, bestOdd: 1.94, bookmaker: "Operador C", movement: "stable" }
    ],
    drivers: [
      "O pace recente dos dois times está acima da média da liga.",
      "A eficiência ofensiva dos titulares se manteve estável nas últimas partidas.",
      "O mercado abriu conservador para total de pontos."
    ]
  },
  {
    id: "alcaraz-sinner",
    sport: "Tênis",
    league: "ATP Masters",
    home: "Alcaraz",
    away: "Sinner",
    startTime: "Amanhã, 11:00",
    status: "Pré-jogo",
    dataQuality: "fortes",
    volatility: 0.53,
    stats: {
      expectedGames: 24.5,
      expectedSets: "2-1",
      formHome: "V V V D V",
      formAway: "V V E V D",
      pressure: 69
    },
    markets: [
      { name: "+22.5 games", modelProbability: 0.62, bestOdd: 1.88, bookmaker: "Operador E", movement: "down" },
      { name: "Tie-break na partida", modelProbability: 0.43, bestOdd: 2.55, bookmaker: "Operador C", movement: "up" }
    ],
    drivers: [
      "Os dois atletas sustentam alto aproveitamento de saque no piso.",
      "O confronto direto recente indica sets longos.",
      "A linha de games oferece margem positiva contra a projeção do modelo."
    ]
  },
  {
    id: "sesi-cruzeiro",
    sport: "Vôlei",
    league: "Superliga Masculina",
    home: "Sesi",
    away: "Cruzeiro",
    startTime: "Hoje, 19:00",
    status: "Pré-jogo",
    dataQuality: "médios",
    volatility: 0.58,
    stats: {
      expectedSets: "3-2",
      expectedPoints: 181.5,
      formHome: "V E V D V",
      formAway: "V V V E D",
      pressure: 66
    },
    markets: [
      { name: "+3.5 sets", modelProbability: 0.65, bestOdd: 1.76, bookmaker: "Operador B", movement: "stable" },
      { name: "+179.5 pontos", modelProbability: 0.57, bestOdd: 2.02, bookmaker: "Operador A", movement: "up" }
    ],
    drivers: [
      "As equipes apresentam eficiência de ataque próxima.",
      "A recepção recente indica baixa chance de domínio unilateral.",
      "O mercado de sets ainda paga acima da odd justa estimada."
    ]
  }
];

export const matches = baseMatches.map((match) => {
  const topMarket = match.markets[0];
  const implied = impliedProbability(topMarket.bestOdd);
  const edge = calculateEdge(topMarket.modelProbability, topMarket.bestOdd);
  const confidence = generateConfidenceScore({
    dataQuality: match.dataQuality,
    historicalVolume: match.dataQuality === "fortes" ? 0.92 : 0.62,
    marketStability: 1 - match.volatility,
    modelMarketDivergence: Math.abs(topMarket.modelProbability - implied),
    recency: match.status === "Ao vivo" ? 0.92 : 0.78
  });
  const risk = classifyRisk(confidence, match.volatility, match.dataQuality);

  return {
    ...match,
    topMarket,
    impliedProbability: implied,
    fairOdd: fairOdd(topMarket.modelProbability),
    edge,
    confidence,
    risk,
    value: classifyValue(edge, match.dataQuality),
    analysis: generateAnalysisText({
      sport: match.sport,
      market: topMarket.name,
      home: match.home,
      away: match.away,
      modelProbability: topMarket.modelProbability,
      confidence,
      risk,
      dataQuality: match.dataQuality,
      drivers: match.drivers
    })
  };
});

export type EnrichedMatch = (typeof matches)[number];

export const rankings = [
  { name: "Ana OddsLab", sport: "Futebol", hitRate: "64%", roi: "+12.4%", badge: "Analista verificada" },
  { name: "Scout BR", sport: "Basquete", hitRate: "59%", roi: "+8.1%", badge: "Comunidade Pro" },
  { name: "Linha Verde", sport: "Tênis", hitRate: "61%", roi: "+6.8%", badge: "Histórico auditado" }
];

export const adminStats = [
  { label: "Usuários ativos", value: "1.284" },
  { label: "Análises geradas", value: "8.912" },
  { label: "Alertas enviados", value: "3.477" },
  { label: "Casas parceiras", value: "6" }
];

export type PredictionResult = "win" | "loss" | "push" | "pending";

export type SettledPick = {
  id: string;
  match: string;
  sport: Sport;
  league: string;
  date: string;
  market: string;
  recommendation: string;
  modelProbability: number;
  fairOdd: number;
  takenOdd: number;
  confidence: number;
  risk: string;
  finalScore: string;
  actualOutcome: string;
  result: PredictionResult;
  simulatedStake: number;
  simulatedProfit: number;
  lesson: string;
  adjustment: string;
};

export const settledPicks: SettledPick[] = [
  {
    id: "hist-001",
    match: "Palmeiras 2 x 1 Flamengo",
    sport: "Futebol",
    league: "Brasileirão Série A",
    date: "27/05/2026",
    market: "+4.5 cartões",
    recommendation: "Entrada recomendada pela IA",
    modelProbability: 0.67,
    fairOdd: 1.49,
    takenOdd: 1.72,
    confidence: 82,
    risk: "Médio",
    finalScore: "2 - 1",
    actualOutcome: "6 cartões",
    result: "win",
    simulatedStake: 1,
    simulatedProfit: 0.72,
    lesson: "Clássicos com árbitro rigoroso confirmaram alta aderência ao mercado de cartões.",
    adjustment: "Aumentar peso do perfil do árbitro em jogos de rivalidade."
  },
  {
    id: "hist-002",
    match: "Corinthians 1 x 0 Santos",
    sport: "Futebol",
    league: "Copa do Brasil",
    date: "26/05/2026",
    market: "+8.5 escanteios",
    recommendation: "Valor moderado",
    modelProbability: 0.64,
    fairOdd: 1.56,
    takenOdd: 1.9,
    confidence: 68,
    risk: "Médio",
    finalScore: "1 - 0",
    actualOutcome: "7 escanteios",
    result: "loss",
    simulatedStake: 1,
    simulatedProfit: -1,
    lesson: "Gol cedo reduziu o ritmo ofensivo e derrubou a projeção de escanteios.",
    adjustment: "Penalizar linhas de escanteios quando um favorito pode administrar vantagem cedo."
  },
  {
    id: "hist-003",
    match: "Lakers 118 x 112 Celtics",
    sport: "Basquete",
    league: "NBA",
    date: "25/05/2026",
    market: "+221.5 pontos",
    recommendation: "Valor leve",
    modelProbability: 0.59,
    fairOdd: 1.69,
    takenOdd: 1.98,
    confidence: 76,
    risk: "Médio",
    finalScore: "118 - 112",
    actualOutcome: "230 pontos",
    result: "win",
    simulatedStake: 1,
    simulatedProfit: 0.98,
    lesson: "Pace recente e eficiência dos titulares foram bons sinais para totais.",
    adjustment: "Manter peso alto para pace em sequências sem desfalques relevantes."
  },
  {
    id: "hist-004",
    match: "Alcaraz 2 x 0 Sinner",
    sport: "Tênis",
    league: "ATP Masters",
    date: "24/05/2026",
    market: "+22.5 games",
    recommendation: "Valor moderado",
    modelProbability: 0.62,
    fairOdd: 1.61,
    takenOdd: 1.88,
    confidence: 79,
    risk: "Médio",
    finalScore: "6-4 6-3",
    actualOutcome: "19 games",
    result: "loss",
    simulatedStake: 1,
    simulatedProfit: -1,
    lesson: "A condição física de um atleta teve impacto maior que o histórico no piso.",
    adjustment: "Aumentar peso de desgaste físico e notícias de treino antes de mercados de games."
  },
  {
    id: "hist-005",
    match: "Sesi 3 x 2 Cruzeiro",
    sport: "Vôlei",
    league: "Superliga Masculina",
    date: "23/05/2026",
    market: "+3.5 sets",
    recommendation: "Valor alto",
    modelProbability: 0.65,
    fairOdd: 1.54,
    takenOdd: 1.76,
    confidence: 71,
    risk: "Médio",
    finalScore: "3 - 2",
    actualOutcome: "5 sets",
    result: "win",
    simulatedStake: 1,
    simulatedProfit: 0.76,
    lesson: "Equilíbrio entre ataque e recepção indicou jogo longo com boa precisão.",
    adjustment: "Reforçar comparação de eficiência ataque/recepção em linhas de sets."
  },
  {
    id: "hist-006",
    match: "Grêmio 0 x 0 Bahia",
    sport: "Futebol",
    league: "Brasileirão Série A",
    date: "22/05/2026",
    market: "+2.5 gols",
    recommendation: "Valor leve",
    modelProbability: 0.57,
    fairOdd: 1.75,
    takenOdd: 2.02,
    confidence: 61,
    risk: "Alto",
    finalScore: "0 - 0",
    actualOutcome: "0 gols",
    result: "loss",
    simulatedStake: 1,
    simulatedProfit: -1,
    lesson: "Volume de finalizações sem qualidade inflou a projeção de gols.",
    adjustment: "Separar finalizações totais de xG real antes de recomendar over gols."
  }
];

const settled = settledPicks.filter((pick) => pick.result !== "pending");
const wins = settled.filter((pick) => pick.result === "win").length;
const totalStake = settled.reduce((sum, pick) => sum + pick.simulatedStake, 0);
const totalProfit = settled.reduce((sum, pick) => sum + pick.simulatedProfit, 0);

export const performanceSummary = {
  totalPicks: settled.length,
  wins,
  losses: settled.filter((pick) => pick.result === "loss").length,
  hitRate: calculateHitRate(settled.length, wins),
  simulatedProfit: totalProfit,
  simulatedRoi: calculateSimulatedRoi(totalStake, totalProfit),
  averageConfidence: Math.round(settled.reduce((sum, pick) => sum + pick.confidence, 0) / settled.length),
  strongestMarket: "Cartões e totais de pontos",
  weakestMarket: "Over gols sem xG alto"
};

export const learningSignals = [
  {
    title: "Cartões em clássicos",
    status: "Reforçar",
    description: "Árbitro, rivalidade e média de faltas tiveram alta precisão nas partidas recentes."
  },
  {
    title: "Escanteios após gol cedo",
    status: "Corrigir",
    description: "Quando o favorito abre vantagem cedo, o modelo deve reduzir projeções de pressão contínua."
  },
  {
    title: "Games no tênis",
    status: "Calibrar",
    description: "Histórico no piso precisa ser combinado com desgaste físico e notícias pré-jogo."
  },
  {
    title: "Over gols",
    status: "Exigir xG",
    description: "Finalização total sem qualidade não deve gerar recomendação forte para gols."
  }
];
