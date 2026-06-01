import { BrainCircuit, CheckCircle2, Target, TrendingUp } from "lucide-react";
import { PageTitle, Panel, Shell } from "@/components/ui";
import { BackendPendingNotice, PendingMetric } from "@/components/backend-pending";

export default function PerformancePage() {
  return (
    <Shell>
      <PageTitle
        eyebrow="Desempenho da IA"
        title="Resultado real contra indicação do sistema"
        subtitle="Quando o backend Supabase estiver conectado, esta tela compara cada indicação registrada com o resultado real e calcula ROI auditável."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <PendingMetric label="Indicações avaliadas" />
        <PendingMetric label="Taxa de acerto" />
        <PendingMetric label="ROI simulado" />
        <PendingMetric label="Confiança média" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_22rem]">
        <BackendPendingNotice
          title="Histórico auditável depende de banco"
          description="Cada indicação salva no banco vira uma linha aqui: jogo, mercado, odd aceita, resultado real, lucro simulado e lição aprendida pelo modelo. Sem persistência não dá para construir esse histórico — por isso a tabela só aparecerá quando o Supabase estiver conectado."
        />
        <div className="space-y-4">
          <Panel>
            <div className="mb-3 flex items-center gap-3">
              <BrainCircuit className="h-5 w-5 text-neon" />
              <h2 className="text-xl font-black text-white">O que será calculado</h2>
            </div>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <Target className="h-4 w-4 text-electric" /> Acertos vs. erros por mercado
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-electric" /> Taxa de acerto por liga e esporte
              </li>
              <li className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-electric" /> ROI simulado em unidades
              </li>
              <li className="flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-electric" /> Sinais de calibração do modelo
              </li>
            </ul>
          </Panel>
        </div>
      </div>
    </Shell>
  );
}
