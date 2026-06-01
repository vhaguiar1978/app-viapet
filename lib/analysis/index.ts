import { analyzeSoccer } from "./soccer";
import { analyzeBasketball } from "./basketball";
import { analyzeTennis } from "./tennis";
import { analyzeMma } from "./mma";
import type { AnalysisInput, AnalysisResult } from "./types";

export type { AnalysisInput, AnalysisResult };

function detectFamily(sportKey: string): AnalysisResult["sportFamily"] {
  if (sportKey.startsWith("soccer_")) return "soccer";
  if (sportKey.startsWith("basketball_")) return "basketball";
  if (sportKey.startsWith("tennis_")) return "tennis";
  if (sportKey.startsWith("mma_") || sportKey === "boxing_boxing") return "mma";
  return "generic";
}

export function analyzeEvent(input: AnalysisInput): AnalysisResult {
  const family = detectFamily(input.sportKey);
  if (family === "soccer") return analyzeSoccer(input);
  if (family === "basketball") return analyzeBasketball(input);
  if (family === "tennis") {
    const isGrandSlamMens = /grand_slam/i.test(input.sportKey) || /atp/i.test(input.sportKey);
    return analyzeTennis(input, isGrandSlamMens);
  }
  if (family === "mma") return analyzeMma(input);

  return {
    sportFamily: "generic",
    generatedAt: new Date().toISOString(),
    bookmakerCount: input.bookmakers.length,
    consensus: [],
    insights: [],
    narrative: [
      "Esporte ainda sem modelo dedicado. Apenas o mercado bruto é exibido. Modelos específicos para futebol, basquete, tênis e MMA estão ativos."
    ],
    limitations: [
      {
        title: "Modelo dedicado pendente",
        reason: `Não há analisador específico para ${input.sportKey}. Use a tabela de odds para comparar mercados.`
      }
    ]
  };
}
