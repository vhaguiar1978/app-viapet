import { CheckCircle2, KeyRound, PlugZap, XCircle } from "lucide-react";
import { getProviderDiagnostics } from "@/lib/providers/upcoming";
import { PageTitle, Panel, Shell, StatusPill } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function IntegrationsPage() {
  const diagnostics = getProviderDiagnostics();
  const allReady = diagnostics.every((item) => item.status === "ready" || item.provider === "TheSportsDB");

  return (
    <Shell>
      <PageTitle
        eyebrow="Integrações reais"
        title="Checklist para operar com dados 100% reais"
        subtitle="Aqui o sistema mostra quais fornecedores estão prontos e o que falta para substituir simulação por dados reais de jogos, odds e estatísticas."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
        <Panel accent={allReady ? "border-neon/30" : "border-gold/30"}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <PlugZap className="h-6 w-6 text-neon" />
              <h2 className="text-xl font-black text-white">Status dos providers</h2>
            </div>
            <StatusPill tone={allReady ? "green" : "gold"}>{allReady ? "Pronto" : "Falta configurar"}</StatusPill>
          </div>

          <div className="grid gap-3">
            {diagnostics.map((item) => (
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4" key={item.provider}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-white">{item.provider}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{item.message}</p>
                  </div>
                  {item.status === "ready" ? (
                    <CheckCircle2 className="h-5 w-5 text-neon" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gold" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-gold" />
            <h2 className="text-xl font-black text-white">Para ficar totalmente real</h2>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <p>1. Criar conta em um fornecedor de odds, como The Odds API.</p>
            <p>2. Copiar a chave da API.</p>
            <p>3. Colocar no arquivo <code className="rounded bg-white/10 px-1.5 py-0.5">.env.local</code>.</p>
            <p>4. Reiniciar o servidor.</p>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-slate-300">
{`DATA_MODE=real
THE_ODDS_API_KEY=sua_chave_aqui
THE_ODDS_API_REGIONS=us,eu
THE_ODDS_API_MARKETS=h2h,totals,spreads`}
          </pre>
        </Panel>
      </div>
    </Shell>
  );
}
