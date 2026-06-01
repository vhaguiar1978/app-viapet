import { SlidersHorizontal } from "lucide-react";
import { OpportunityTable, PageTitle, Panel, Shell } from "@/components/ui";

export default function RadarPage() {
  return (
    <Shell>
      <PageTitle
        eyebrow="Radar de oportunidades"
        title="Mercados com possível valor"
        subtitle="Classificação por esporte, risco, odd, confiança, mercado e qualidade dos dados."
      />
      <Panel className="mb-5">
        <div className="mb-3 flex items-center gap-2 font-bold text-white">
          <SlidersHorizontal className="h-4 w-4 text-electric" />
          Filtros avançados
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {["Esporte", "Mercado", "Odd mínima", "Confiança mínima", "Risco", "Data", "Ao vivo", "Valor positivo"].map((item) => (
            <button className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3 text-left text-sm text-slate-300 hover:border-neon/40" key={item}>
              {item}
            </button>
          ))}
        </div>
      </Panel>
      <OpportunityTable />
    </Shell>
  );
}
