import { Medal, Users } from "lucide-react";
import { PageTitle, Panel, Shell } from "@/components/ui";
import { BackendPendingNotice } from "@/components/backend-pending";

export default function RankingPage() {
  return (
    <Shell>
      <PageTitle
        eyebrow="Comunidade"
        title="Ranking de palpites simulados"
        subtitle="Tipsters da comunidade ranqueados por taxa de acerto e ROI simulado, sem promessa de resultado futuro. Precisa de login + persistência."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <BackendPendingNotice
          title="Ranking precisa de usuários e palpites salvos"
          description="O ranking é montado a partir de palpites simulados gravados por usuários logados. Sem auth + tabela rankings populada, não tem como mostrar posições reais. Quando o Supabase estiver conectado, este painel preenche com taxa de acerto, ROI simulado e badge por esporte."
        />
        <Panel>
          <div className="mb-3 flex items-center gap-3">
            <Medal className="h-5 w-5 text-gold" />
            <h2 className="text-xl font-black text-white">O que será exibido</h2>
          </div>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <Users className="h-4 w-4 text-electric" /> Top tipsters do mês
            </li>
            <li className="flex items-center gap-2">
              <Users className="h-4 w-4 text-electric" /> Ranking por esporte
            </li>
            <li className="flex items-center gap-2">
              <Users className="h-4 w-4 text-electric" /> Taxa de acerto e ROI simulado
            </li>
          </ul>
        </Panel>
      </div>
    </Shell>
  );
}
