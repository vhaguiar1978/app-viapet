export const modules = [
  "Agenda",
  "Cadastros",
  "Exames",
  "Fila",
  "Financeiro",
  "Internação",
  "Mensagens",
  "Pesquisa",
  "SuperVet",
  "Venda",
];

export const appMenu = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Agenda", path: "/agenda" },
  { label: "Exames", path: "/exames" },
  { label: "Fila", path: "/fila" },
  { label: "Financeiro", path: "/financeiro" },
  { label: "Cadastros", path: "/cadastros" },
  { label: "Admin", path: "/admin" },
];

export const agendaTabs = ["Estética", "Clínica", "Internação", "Fila"];

export const agendaEvents = [
  {
    id: "agd-1",
    hour: "09:00",
    pet: "Arena",
    owner: "Antonio Martins",
    breed: "Labrador",
    note: "Não pode perfume",
    tags: ["banho", "Venda 15586", "Pacote (3/4)"],
    debt: "R$413,00",
    status: "Entregue",
    payments: ["04.03.26 Transferência R$147,00", "04.03.26 Débito R$147,00"],
  },
  {
    id: "agd-2",
    hour: "10:00",
    pet: "Meg",
    owner: "Sheila Monteiro",
    breed: "Shih Tzu",
    note: "Finalização lilás clara",
    tags: ["banho", "Venda 15587"],
    debt: null,
    status: "Em atendimento",
    payments: ["18.03.26 Pix R$70,00"],
  },
];

export const driverAgendaList = [
  {
    id: "drv-1",
    hour: "08:30",
    tutor: "Amanda Lima",
    pet: "Belinha",
    address: "Rua das Flores, 120 - Centro",
    pickup: "08:10",
    delivery: "12:30",
  },
  {
    id: "drv-2",
    hour: "09:00",
    tutor: "Antonio Martins",
    pet: "Arena",
    address: "Av. Primeiro de Janeiro, 455 - Irece",
    pickup: "08:45",
    delivery: "13:10",
  },
  {
    id: "drv-3",
    hour: "10:15",
    tutor: "Sheila Monteiro",
    pet: "Meg",
    address: "Rua da Matriz, 88 - Lapao",
    pickup: "09:55",
    delivery: "14:20",
  },
];

export const bathAgendaList = [
  {
    id: "bath-1",
    hour: "09:00",
    pet: "Luna",
    service: "Banho",
    note: "Nao pode perfume",
  },
  {
    id: "bath-2",
    hour: "09:00",
    pet: "Serena",
    service: "Banho e tosa geral",
    note: "Tirou foto Jessica",
  },
  {
    id: "bath-3",
    hour: "10:00",
    pet: "Tico",
    service: "Banho e hidratacao",
    note: "Cego adaptador marrom",
  },
  {
    id: "bath-4",
    hour: "10:30",
    pet: "Belinha",
    service: "Banho premium",
    note: "Secagem leve e lacinho rosa",
  },
];

export const appointmentDraft = {
  title: "Estética",
  date: "18.03.2026",
  time: "16:00",
  endTime: "17:30",
  event: "Banho e Tosa",
  pet: "Belinha",
  weight: "8,4",
  seller: "Vitor Hugo",
  notes:
    "Banho com hidratação, perfume suave e observação de sensibilidade nas patas. Avisar a tutora quando estiver pronta.",
  saleItems: [
    { id: 1, quantity: 1, description: "Banho Premium", type: "Serviço", unit: "55,00", total: "55,00" },
    { id: 2, quantity: 1, description: "Tosa Higiênica", type: "Serviço", unit: "25,00", total: "25,00" },
    { id: 3, quantity: 1, description: "Hidratação Especial", type: "Produto", unit: "22,00", total: "20,00" },
  ],
  payments: [
    {
      id: 1,
      dueDate: "18.03.2026",
      method: "Pix",
      details: "Pago no balcão",
      fee: "0%",
      gross: "60,00",
      net: "60,00",
      status: "Pago",
    },
    {
      id: 2,
      dueDate: "25.03.2026",
      method: "Crédito",
      details: "Maquininha Stone",
      fee: "4,99%",
      gross: "40,00",
      net: "38,00",
      status: "Pendente",
    },
  ],
  summary: {
    sold: "100,00",
    receivedGross: "60,00",
    receivedNet: "60,00",
    openGross: "40,00",
    openNet: "38,00",
    totalNet: "98,00",
  },
};

export const dashboardHighlights = [
  { label: "Faturamento líquido do mês", value: "R$ 18.420,00", tone: "green" },
  { label: "Serviços realizados", value: "312", tone: "purple" },
  { label: "Banhos com maior lucro", value: "Banho Premium", tone: "orange" },
  { label: "Saldo em aberto", value: "R$ 2.184,00", tone: "blue" },
];

export const dashboardModules = [
  {
    title: "Agenda operacional",
    description: "Controle de estética, clínica, fila e internação com visão por dia ou semana.",
  },
  {
    title: "Comanda integrada",
    description: "Venda, pagamento, maquininha e custo operacional no mesmo fluxo do atendimento.",
  },
  {
    title: "Financeiro inteligente",
    description: "Exibe valor bruto, taxa da maquininha e valor líquido real que cai na conta.",
  },
];

export const dashboardQuickTiles = [
  { title: "Agenda", tone: "tile-orange", size: "lg" },
  { title: "Pesquisa", tone: "tile-salmon", size: "lg" },
  { title: "Cadastros", tone: "tile-brown", size: "lg" },
  { title: "Financeiro", tone: "tile-gold", size: "lg" },
  { title: "Venda (PDV)", tone: "tile-teal", size: "lg" },
  { title: "SuperVet", tone: "tile-green", size: "lg" },
  { title: "Exames", tone: "tile-purple", size: "lg" },
  { title: "Mensagens", tone: "tile-magenta", size: "lg" },
  { title: "Fila", tone: "tile-blue", size: "sm" },
  { title: "Internacao", tone: "tile-mint", size: "sm" },
  { title: "Configurar", tone: "tile-slate", size: "sm" },
  { title: "Sair", tone: "tile-slate-dark", size: "sm" },
];

export const dashboardHelperLinks = ["Videos tutoriais", "Dicas de uso", "Acesso rapido ao suporte"];

export const dashboardBirthdayBoard = [
  {
    type: "Pet",
    name: "Belinha",
    owner: "Amanda Lima",
    when: "Hoje",
    tone: "pet",
    phone: "5574999991000",
    whatsappLabel: "WhatsApp Amanda",
  },
  {
    type: "Tutor",
    name: "Antonio Martins",
    owner: "Tutor da Arena",
    when: "Hoje",
    tone: "owner",
    phone: "5574999992000",
    whatsappLabel: "WhatsApp Antonio",
  },
  {
    type: "Pet",
    name: "Meg",
    owner: "Sheila Monteiro",
    when: "Hoje",
    tone: "pet",
    phone: "5574999993000",
    whatsappLabel: "WhatsApp Sheila",
  },
  {
    type: "Tutor",
    name: "Camila Souza",
    owner: "Tutora da Luna",
    when: "Hoje",
    tone: "owner",
    phone: "5574999994000",
    whatsappLabel: "WhatsApp Camila",
  },
  {
    type: "Pet",
    name: "Thor",
    owner: "Ricardo Alves",
    when: "Hoje",
    tone: "pet",
    phone: "5574999995000",
    whatsappLabel: "WhatsApp Ricardo",
  },
];

export const dashboardPayables = [
  { title: "Fornecedor de shampoo", due: "Hoje", amount: "R$ 184,00", status: "Urgente" },
  { title: "Conta de energia", due: "22/03", amount: "R$ 426,00", status: "Proxima" },
  { title: "Internet da loja", due: "25/03", amount: "R$ 139,90", status: "Programada" },
];

export const dashboardAdminBanner = {
  slides: [
    {
      title: "Controle ADM ViaPet",
      description: "Espaco para anuncios do sistema, novidades do painel administrativo e comunicados internos.",
      cta: "Gerenciar banner",
      accent: "primary",
    },
    {
      title: "Campanha do Mes",
      description: "Divulgue banho premium, vacinas, consultas e servicos especiais em um mesmo destaque rotativo.",
      cta: "Criar campanha",
      accent: "secondary",
    },
    {
      title: "Parceiro em Destaque",
      description: "Reserve um slide para anunciante, clinica parceira ou marca de produto com promocao ativa.",
      cta: "Editar slide",
      accent: "tertiary",
    },
  ],
};

export const financeSummary = {
  tabs: ["Vendas", "Compras", "Pagamentos", "Comissoes", "Resumo"],
  salesTotal: "Vendas 342,00",
  purchasesTotal: "Compras 339,50",
  paymentsTotals: "Recebido 0,00 | Pago Compras 0,00 | Despesas 0,00",
  commissionsTotal: "Comissões 0,00",
  summaryTotals: "Vendas 342,00 | Custos 0,00 | Comissões 0,00 | Despesas 0,00 | Lucro 342,00",
  salesRows: [
    {
      date: "26 Mar 2026",
      sale: "Venda 15829",
      customer: "Liza (marcia regina) Maltês",
      lines: ["Banho e Tosa Higiênica R$70,00", "Taxi Dog R$7,00", "Hidratação R$30,00", "Escovação Dentaria R$10,00"],
      value: "117,00",
    },
    {
      date: "",
      sale: "Venda 15830",
      customer: "Tobby (Erica Baby e tobby) York shire",
      lines: ["Banho Tosa Geral R$95,00"],
      value: "95,00",
    },
    {
      date: "",
      sale: "Venda 15831",
      customer: "Chloe (Eugênica) Shitzu",
      lines: ["banho tosa tesoura R$130,00"],
      value: "130,00",
    },
  ],
  purchasesRows: [
    { date: "26 Mar 2026", description: "Compra de shampoos e hidratação", value: "184,00" },
    { date: "25 Mar 2026", description: "Compra de laços e acessórios", value: "92,50" },
    { date: "24 Mar 2026", description: "Reposição de materiais de limpeza", value: "63,00" },
  ],
  paymentRows: [],
  commissionRows: [],
  cards: [
    { label: "Entrada bruta", value: "R$ 12.840,00" },
    { label: "Taxas de maquininha", value: "R$ 648,30" },
    { label: "Entrada líquida", value: "R$ 12.191,70" },
    { label: "Custos operacionais", value: "R$ 4.322,00" },
  ],
  entries: [
    {
      origin: "Agenda Estética",
      method: "Crédito",
      gross: "R$ 140,00",
      fee: "4,99%",
      net: "R$ 133,01",
      status: "Pago",
    },
    {
      origin: "Agenda Estética",
      method: "Pix",
      gross: "R$ 70,00",
      fee: "0%",
      net: "R$ 70,00",
      status: "Pago",
    },
    {
      origin: "Clínica",
      method: "Débito",
      gross: "R$ 220,00",
      fee: "2,49%",
      net: "R$ 214,52",
      status: "Pendente",
    },
  ],
};

export const examsOverview = {
  filterLabel: "Ultimos 7 dias",
  items: [
    { pet: "Belinha", exam: "Hemograma completo" },
    { pet: "Arena", exam: "Ultrassonografia abdominal" },
    { pet: "Meg", exam: "Citologia otologica" },
    { pet: "Luna", exam: "Raio-X torax" },
  ],
};

export const queueOverview = {
  total: "2 pacientes",
  items: [
    {
      id: "fila-1",
      position: "1",
      entry: "15:36:40",
      patient: "Teddy (Nicollas Smid) Lhasa Apso",
      status: "Encaminhado",
      veterinarian: "VH",
    },
    {
      id: "fila-2",
      position: "2",
      entry: "21:01:21",
      patient: "Sofia (Ana Carolina e Ricardo) Shitzu",
      status: "Encaminhado",
      veterinarian: "VH",
    },
  ],
};

export const registersPreview = {
  mainTabs: ["Pacientes", "Pessoas", "Produtos", "Servicos", "Exames", "Vacinas"],
  vaccineTabs: ["Vacinas", "Planos Vacinais"],
  vaccinePlans: [
    "Canino Adulto",
    "Canino Filhote",
    "Canino Jovem (4 meses ou mais)",
    "Felino Adulto",
    "Felino Filhote",
    "Felino Jovem",
  ],
  patients: [
    "Abelardo (Tamara Lins)",
    "Acsa (Lucas Felipe S Silva ou Fernanda)",
    "Adolf (Mariane Brach Romera)",
    "Afrodite (Jose Ricardo de Oliveira)",
    "Airon (Samanta Ramos)",
    "Akamaru (Elisangela Alves)",
    "Akira (Jack)",
    "Akyra (Roseli Paiva)",
    "Aladin (Daniela Cabral de Andrade)",
    "Amora (Vitor Hugo)",
    "Apolo (Jessica Ribeiro)",
    "Arena (Antonio Martins)",
  ],
  customers: [
    { name: "Amanda Silva", phone: "(74) 99999-1000", pets: 2, city: "Irecê" },
    { name: "Antonio Martins", phone: "(74) 99999-2000", pets: 1, city: "Irecê" },
    { name: "Sheila Monteiro", phone: "(74) 99999-3000", pets: 3, city: "Lapão" },
  ],
  services: [
    { name: "Banho Premium", category: "Estética", price: "R$ 55,00" },
    { name: "Tosa Higiênica", category: "Estética", price: "R$ 25,00" },
    { name: "Consulta Clínica", category: "Clínica", price: "R$ 120,00" },
  ],
};
