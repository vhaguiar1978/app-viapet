import { Check, ChevronDown, Crown, Sparkles, Trophy, X, Zap } from "lucide-react";
import { PageTitle, Panel, ResponsibleNotice, Shell, StatusPill } from "@/components/ui";
import { PlanCTA } from "@/components/plan-cta";
import { PLANS, CONTACT } from "@/lib/planos/config";

const PLAN_ICONS = {
  free: Zap,
  pro: Sparkles,
  elite: Crown
};

const FAQ = [
  {
    q: "Vocês recebem aposta no site?",
    a: "Não. ViaBet é só análise. A aposta, se você quiser fazer, acontece sempre na casa autorizada que você escolher, fora da plataforma."
  },
  {
    q: "As análises garantem lucro?",
    a: "Nenhuma análise garante resultado. Mostramos probabilidades estatísticas e valor esperado com base no mercado. A decisão final é sua e o risco também."
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Quando os pagamentos abrirem, qualquer plano pode ser cancelado a qualquer momento sem multa. Você mantém acesso até o fim do período pago."
  },
  {
    q: "Como funciona o pré-cadastro?",
    a: "Por enquanto, deixe seu interesse via WhatsApp ou email. Quando abrirmos os pagamentos, os pré-cadastrados recebem aviso primeiro e condição especial de early access."
  },
  {
    q: "Que provedores de dados vocês usam?",
    a: "The Odds API para odds reais de 20+ casas e API-Football para escalações e estatísticas históricas dos times."
  },
  {
    q: "Tem versão grátis pra sempre?",
    a: "Sim. O plano Grátis fica disponível indefinidamente com jogos do dia e odds básicas. Sem cartão exigido."
  }
];

const COMPARISON = [
  ["Jogos do dia", true, true, true],
  ["Odds Resultado Final (1X2)", true, true, true],
  ["Comparador básico (top 5 mercados)", true, true, true],
  ["Comparador completo (todas as casas)", false, true, true],
  ["Análise Poisson + top placares", false, true, true],
  ["Estatísticas por tempo (1T / 2T)", false, true, true],
  ["Chutes e escanteios por jogo", false, true, true],
  ["Retrospecto do visitante", false, true, true],
  ["Histórico de análises salvas", "10 limite", "Ilimitado", "Ilimitado"],
  ["Alertas por email", false, true, true],
  ["Alertas WhatsApp + Telegram", false, false, true],
  ["Escalações confirmadas", false, false, true],
  ["Ligas internacionais (todas)", false, false, true],
  ["Acesso antecipado a novidades", false, false, true],
  ["Exportar histórico (CSV)", false, false, true],
  ["Acesso à API (B2B)", false, false, true],
  ["Suporte prioritário", false, false, true]
] as const;

function formatPrice(value: number) {
  if (value === 0) return "Grátis";
  return `R$ ${value}`;
}

export default function PlanosPage() {
  return (
    <Shell>
      <PageTitle
        eyebrow="Assinaturas"
        title="Escolha seu plano e analise como profissional"
        subtitle="Ferramenta de análise esportiva com inteligência estatística. Sem promessa de lucro. Pré-cadastro aberto com vaga limitada para early access."
      />

      <div className="mb-4 flex flex-wrap items-center justify-center gap-3 rounded-lg border border-gold/30 bg-gold/10 p-3 text-sm text-gold">
        <Sparkles className="h-4 w-4" />
        <span className="font-bold">Lançamento em breve</span>
        <span className="text-slate-300">— Deixe seu pré-cadastro e ganhe condição especial</span>
      </div>

      <div className="mb-10 grid gap-5 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const Icon = PLAN_ICONS[plan.key];
          return (
            <div
              key={plan.key}
              className={
                plan.highlighted
                  ? "relative rounded-2xl border-2 border-neon bg-panel/80 p-6 shadow-glow"
                  : "relative rounded-2xl border border-white/10 bg-panel/60 p-6"
              }
            >
              {plan.badge ? (
                <div
                  className={
                    plan.highlighted
                      ? "absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-neon bg-neon px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-ink"
                      : "absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-gold/40 bg-gold/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-gold"
                  }
                >
                  {plan.badge}
                </div>
              ) : null}

              <div className="mb-4 flex items-center gap-3">
                <div
                  className={
                    plan.key === "elite"
                      ? "grid h-11 w-11 place-items-center rounded-lg border border-gold/30 bg-gold/10 text-gold"
                      : plan.key === "pro"
                        ? "grid h-11 w-11 place-items-center rounded-lg border border-neon/30 bg-neon/10 text-neon"
                        : "grid h-11 w-11 place-items-center rounded-lg border border-electric/30 bg-electric/10 text-electric"
                  }
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400">{plan.description}</p>
                </div>
              </div>

              <div className="mb-5">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-white">{formatPrice(plan.priceMonthly)}</span>
                  {plan.priceMonthly > 0 ? (
                    <span className="mb-1 text-sm text-slate-400">/mês</span>
                  ) : null}
                </div>
                {plan.priceAnnual > 0 ? (
                  <p className="mt-1 text-xs text-slate-400">
                    Anual: R$ {plan.priceAnnual} <span className="text-neon">(2 meses grátis)</span>
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">Para sempre · sem cartão</p>
                )}
              </div>

              <ul className="mb-6 space-y-2.5 text-sm">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check
                      className={
                        f.highlight
                          ? "mt-0.5 h-4 w-4 shrink-0 text-neon"
                          : "mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                      }
                    />
                    <span className={f.highlight ? "text-white" : "text-slate-300"}>{f.text}</span>
                  </li>
                ))}
                {plan.notIncluded?.map((f, i) => (
                  <li key={`x-${i}`} className="flex items-start gap-2 opacity-50">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    <span className="text-slate-500 line-through">{f}</span>
                  </li>
                ))}
              </ul>

              <PlanCTA plan={plan.key} planName={plan.name} />
            </div>
          );
        })}
      </div>

      <Panel className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-gold" />
          <h2 className="text-xl font-black text-white">Comparativo detalhado</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr className="border-b border-white/10">
                <th className="py-3">Recurso</th>
                <th className="text-center">Grátis</th>
                <th className="text-center text-neon">Pro</th>
                <th className="text-center text-gold">Elite</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(([feature, free, pro, elite]) => (
                <tr key={String(feature)} className="border-b border-white/5 text-slate-300">
                  <td className="py-3 font-semibold text-white">{String(feature)}</td>
                  <td className="text-center">
                    {typeof free === "boolean" ? (
                      free ? (
                        <Check className="mx-auto h-4 w-4 text-neon" />
                      ) : (
                        <X className="mx-auto h-4 w-4 text-slate-600" />
                      )
                    ) : (
                      <span className="text-xs text-slate-400">{free}</span>
                    )}
                  </td>
                  <td className="text-center">
                    {typeof pro === "boolean" ? (
                      pro ? (
                        <Check className="mx-auto h-4 w-4 text-neon" />
                      ) : (
                        <X className="mx-auto h-4 w-4 text-slate-600" />
                      )
                    ) : (
                      <span className="text-xs text-neon">{pro}</span>
                    )}
                  </td>
                  <td className="text-center">
                    {typeof elite === "boolean" ? (
                      elite ? (
                        <Check className="mx-auto h-4 w-4 text-gold" />
                      ) : (
                        <X className="mx-auto h-4 w-4 text-slate-600" />
                      )
                    ) : (
                      <span className="text-xs text-gold">{elite}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <ChevronDown className="h-5 w-5 text-electric" />
          <h2 className="text-xl font-black text-white">Perguntas frequentes</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {FAQ.map((item) => (
            <div key={item.q} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <p className="font-bold text-white">{item.q}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.a}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel accent="border-neon/30" className="mb-8">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <StatusPill tone="green">Lançamento limitado</StatusPill>
            <h2 className="mt-2 text-2xl font-black text-white">Primeiros 100 assinantes Pro</h2>
            <p className="mt-2 text-sm text-slate-300">
              Pagam R$ 29/mês para sempre (em vez de R$ 39) enquanto mantiverem a assinatura ativa.
              Deixe seu pré-cadastro agora pra garantir a vaga.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:min-w-[16rem]">
            <a
              href={`https://wa.me/${CONTACT.whatsapp}?text=Quero%20garantir%20vaga%20no%20early%20access%20do%20ViaBet`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-neon px-4 py-3 font-black text-ink hover:brightness-110"
            >
              Quero vaga no early access
            </a>
            <p className="text-center text-xs text-slate-400">
              WhatsApp direto · resposta em até 24h
            </p>
          </div>
        </div>
      </Panel>

      <ResponsibleNotice />
    </Shell>
  );
}
