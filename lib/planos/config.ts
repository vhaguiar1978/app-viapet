export const CONTACT = {
  whatsapp: "5511999999999",
  email: "contato@viabet.com.br",
  whatsappDisplay: "(11) 99999-9999"
};

export type PlanFeature = { text: string; highlight?: boolean };

export type Plan = {
  key: "free" | "pro" | "elite";
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  features: PlanFeature[];
  notIncluded?: string[];
  highlighted: boolean;
  badge?: string;
};

export const PLANS: Plan[] = [
  {
    key: "free",
    name: "Grátis",
    description: "Conheça o sistema sem compromisso",
    priceMonthly: 0,
    priceAnnual: 0,
    highlighted: false,
    features: [
      { text: "Jogos do dia (todas as ligas básicas)" },
      { text: "Odds Resultado Final 1X2" },
      { text: "Comparador limitado (top 5 mercados)" },
      { text: "Análise IA básica" },
      { text: "Histórico até 10 análises salvas" }
    ],
    notIncluded: [
      "Análise Poisson completa",
      "Estatísticas por tempo (1T/2T)",
      "Escalações + retrospecto",
      "Alertas em tempo real"
    ]
  },
  {
    key: "pro",
    name: "Pro",
    description: "Pra quem analisa de verdade antes de apostar",
    priceMonthly: 39,
    priceAnnual: 390,
    highlighted: true,
    badge: "Mais escolhido",
    features: [
      { text: "Tudo do Grátis", highlight: false },
      { text: "Análise Poisson completa + top placares", highlight: true },
      { text: "Comparador completo entre todas as casas", highlight: true },
      { text: "Estatísticas por tempo (1T/2T)", highlight: true },
      { text: "Chutes + escanteios por jogo" },
      { text: "Retrospecto do visitante na casa do mandante" },
      { text: "Histórico ilimitado com taxa de acerto e ROI" },
      { text: "Alertas por email (valor positivo, movimento de odd)" },
      { text: "Acesso a 30+ ligas reais" }
    ],
    notIncluded: [
      "Escalações confirmadas",
      "Acesso antecipado a novidades",
      "Alertas no WhatsApp"
    ]
  },
  {
    key: "elite",
    name: "Elite",
    description: "Pra tipsters e bancas profissionais",
    priceMonthly: 99,
    priceAnnual: 990,
    highlighted: false,
    badge: "Profissional",
    features: [
      { text: "Tudo do Pro" },
      { text: "Escalações confirmadas em tempo real", highlight: true },
      { text: "Todas as ligas + competições internacionais" },
      { text: "Alertas no WhatsApp + Telegram", highlight: true },
      { text: "Acesso antecipado a novas features" },
      { text: "Histórico exportável (CSV)" },
      { text: "Multi-conta (uso compartilhado)" },
      { text: "Suporte prioritário direto" },
      { text: "Acesso à API (b2b)" }
    ]
  }
];

export function whatsappLink(plan: string): string {
  const text = encodeURIComponent(
    `Olá! Quero ser avisado quando o plano ${plan} do ViaBet abrir as assinaturas.`
  );
  return `https://wa.me/${CONTACT.whatsapp}?text=${text}`;
}

export function mailtoLink(plan: string): string {
  const subject = encodeURIComponent(`Quero assinar o plano ${plan} do ViaBet`);
  const body = encodeURIComponent(
    `Olá!\n\nQuero ser avisado quando o plano ${plan} do ViaBet abrir as assinaturas.\n\n` +
      `Pode me mandar mais informações sobre data de lançamento e condições especiais de early access.\n\nObrigado!`
  );
  return `mailto:${CONTACT.email}?subject=${subject}&body=${body}`;
}
