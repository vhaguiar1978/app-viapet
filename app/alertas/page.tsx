import { Bell, Mail, MessageCircle, Smartphone } from "lucide-react";
import { PageTitle, Panel, ResponsibleNotice, Shell, StatusPill } from "@/components/ui";

const alertRules = [
  "Valor acima de 10%",
  "Odd caiu rápido",
  "Odd subiu rápido",
  "Tendência de gols",
  "Tendência de cartões",
  "Tendência de escanteios",
  "Apenas risco baixo",
  "Apenas jogos ao vivo"
];

export default function AlertsPage() {
  return (
    <Shell>
      <PageTitle
        eyebrow="Central de alertas"
        title="Critérios inteligentes para agir com calma"
        subtitle="Alertas no dashboard agora, com estrutura preparada para e-mail, Telegram, WhatsApp e push."
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <Panel>
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-neon" />
            <h2 className="text-xl font-black text-white">Regras ativas</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {alertRules.map((rule, index) => (
              <label className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-white" key={rule}>
                {rule}
                <input className="h-5 w-5 accent-[#36f49b]" defaultChecked={index < 5} type="checkbox" />
              </label>
            ))}
          </div>
        </Panel>
        <div className="space-y-4">
          <Panel>
            <h2 className="text-xl font-black text-white">Canais</h2>
            <div className="mt-4 space-y-3">
              {[
                ["Dashboard", Bell, "Ativo"],
                ["E-mail", Mail, "Próximo"],
                ["Telegram", MessageCircle, "Próximo"],
                ["WhatsApp", Smartphone, "Próximo"]
              ].map(([name, Icon, status]) => (
                <div className="flex items-center justify-between rounded-lg border border-white/10 p-3" key={String(name)}>
                  <div className="flex items-center gap-3 text-white">
                    <Icon className="h-4 w-4 text-electric" />
                    {String(name)}
                  </div>
                  <StatusPill tone={status === "Ativo" ? "green" : "blue"}>{String(status)}</StatusPill>
                </div>
              ))}
            </div>
          </Panel>
          <ResponsibleNotice />
        </div>
      </div>
    </Shell>
  );
}
