export const ASSISTANT_QUICK_PROMPTS = [
  "Como cadastrar uma despesa?",
  "Como agendar um banho?",
  "Como ver o financeiro?",
  "Como cadastrar um cliente?",
];

export const ASSISTANT_SCREEN_MAP = [
  {
    page: "dashboard",
    name: "Dashboard",
    route: "/dashboard",
    matchMode: "exact",
    elements: [
      {
        id: "tile_agenda",
        label: "Agenda",
        type: "button",
        action: "abrir_agenda",
        locator: { buttonText: "Agenda" },
      },
      {
        id: "tile_financeiro",
        label: "Financeiro",
        type: "button",
        action: "abrir_financeiro",
        locator: { buttonText: "Financeiro" },
      },
      {
        id: "tile_cadastros",
        label: "Cadastros",
        type: "button",
        action: "abrir_cadastros",
        locator: { buttonText: "Cadastros" },
      },
    ],
    actions: ["ver_financeiro", "cadastrar_despesa_fixa", "cadastrar_cliente", "cadastrar_pet", "agendar_banho"],
  },
  {
    page: "financeiro",
    name: "Financeiro",
    route: "/financeiro",
    matchMode: "prefix",
    elements: [
      {
        id: "tab_vendas",
        label: "Vendas",
        type: "tab",
        action: "abrir_vendas",
        locator: { href: "/financeiro" },
      },
      {
        id: "tab_compras",
        label: "Compras",
        type: "tab",
        action: "abrir_compras",
        locator: { href: "/financeiro/compras" },
      },
      {
        id: "tab_pagamentos",
        label: "Pagamentos",
        type: "tab",
        action: "abrir_pagamentos",
        locator: { href: "/financeiro/pagamentos" },
      },
      {
        id: "tab_despesas_fixas",
        label: "Despesas fixas",
        type: "tab",
        action: "abrir_despesas_fixas",
        locator: { href: "/financeiro/despesas-fixas" },
      },
    ],
    actions: ["ver_financeiro", "cadastrar_despesa_fixa"],
  },
  {
    page: "financeiro_despesas_fixas",
    name: "Despesas fixas",
    route: "/financeiro/despesas-fixas",
    matchMode: "exact",
    elements: [
      {
        id: "tab_despesas_fixas",
        label: "Despesas fixas",
        type: "tab",
        action: "abrir_despesas_fixas",
        locator: { href: "/financeiro/despesas-fixas" },
      },
      {
        id: "btn_nova_despesa_fixa",
        label: "Novo",
        type: "button",
        action: "abrir_formulario",
        locator: { href: "/financeiro/despesas-fixas/novo" },
      },
      {
        id: "lista_despesas_fixas",
        label: "Lista de despesas fixas",
        type: "list",
        action: "visualizar_lancamentos",
        locator: { selector: ".finance-fixed-expense-list" },
      },
    ],
    actions: ["cadastrar_despesa_fixa"],
  },
  {
    page: "financeiro_despesas_fixas_novo",
    name: "Nova despesa fixa",
    route: "/financeiro/despesas-fixas/novo",
    matchMode: "exact",
    elements: [
      { id: "field_lancamento", label: "Lancamento", type: "input", action: "preencher", locator: { label: "Lancamento", fieldType: "input" } },
      { id: "field_vencimento", label: "Vencimento", type: "input", action: "preencher", locator: { label: "Vencimento", fieldType: "input" } },
      { id: "field_valor", label: "Valor (R$)", type: "input", action: "preencher", locator: { label: "Valor (R$)", fieldType: "input" } },
      { id: "field_status", label: "Status", type: "select", action: "preencher", locator: { label: "Status", fieldType: "select" } },
      { id: "field_descricao", label: "Descricao", type: "input", action: "preencher", locator: { label: "Descricao", fieldType: "input" } },
      { id: "field_forma_pagamento", label: "Forma de pagamento", type: "select", action: "preencher", locator: { label: "Forma de pagamento", fieldType: "select" } },
      { id: "btn_salvar", label: "Salvar", type: "button", action: "confirmar", locator: { buttonText: "Salvar" } },
    ],
    actions: ["cadastrar_despesa_fixa"],
  },
  {
    page: "agenda_estetica",
    name: "Agenda Estetica",
    route: "/agenda",
    matchMode: "exact",
    elements: [
      {
        id: "timeline_agenda",
        label: "Grade da agenda",
        type: "board",
        action: "visualizar_horarios",
        locator: { selector: ".timeline" },
      },
      {
        id: "btn_banho_tosa",
        label: "Banho e tosa",
        type: "button",
        action: "abrir_banho_tosa",
        locator: { hrefPrefix: "/agenda/banho-tosa" },
      },
      {
        id: "contador_agenda",
        label: "Cadastros do dia",
        type: "counter",
        action: "visualizar_quantidade",
        locator: { selector: ".agenda-toolbar .soft-counter" },
      },
      {
        id: "btn_novo_cadastro",
        label: "Novo Cadastro",
        type: "button",
        action: "abrir_novo_cadastro",
        locator: { buttonText: "Novo Cadastro" },
      },
      {
        id: "btn_novo_evento",
        label: "Novo Evento",
        type: "button",
        action: "abrir_novo_cadastro",
        locator: { buttonText: "Novo Evento" },
      },
    ],
    actions: ["agendar_banho"],
  },
  {
    page: "cadastro_tutor",
    name: "Cadastro de tutor",
    route: "/cadastros/nova-pessoa",
    matchMode: "exact",
    elements: [
      { id: "field_nome", label: "Nome", type: "input", action: "preencher", locator: { label: "Nome", fieldType: "input" } },
      { id: "field_cpf", label: "CPF/CNPJ", type: "input", action: "preencher", locator: { label: "CPF/CNPJ", fieldType: "input" } },
      { id: "field_fone", label: "Fone", type: "input", action: "preencher", locator: { label: "Fone", fieldType: "input" } },
      { id: "field_email", label: "Email", type: "input", action: "preencher", locator: { label: "Email", fieldType: "input" } },
      { id: "field_endereco", label: "Endereco", type: "input", action: "preencher", locator: { label: "Endereco", fieldType: "input" } },
      { id: "btn_salvar", label: "Salvar", type: "button", action: "confirmar", locator: { buttonText: "Salvar" } },
    ],
    actions: ["cadastrar_cliente"],
  },
  {
    page: "cadastro_pet",
    name: "Cadastro de pet",
    route: "/cadastros/novo-paciente",
    matchMode: "exact",
    elements: [
      { id: "field_nome_pet", label: "Nome", type: "input", action: "preencher", locator: { label: "Nome", fieldType: "input" } },
      { id: "field_especie", label: "Especie", type: "select", action: "preencher", locator: { label: "Especie", fieldType: "select" } },
      { id: "field_responsavel", label: "Responsavel", type: "input", action: "preencher", locator: { label: "Responsavel", fieldType: "input" } },
      { id: "field_nascimento_pet", label: "Nascimento", type: "input", action: "preencher", locator: { label: "Nascimento", fieldType: "input" } },
      { id: "field_raca", label: "Raca predominante", type: "input", action: "preencher", locator: { label: "Raca predominante", fieldType: "input" } },
      { id: "btn_salvar", label: "Salvar", type: "button", action: "confirmar", locator: { buttonText: "Salvar" } },
    ],
    actions: ["cadastrar_pet"],
  },
];

export const ASSISTANT_HELP_TOPICS = [
  {
    key: "cadastrar_despesa_fixa",
    title: "Cadastrar despesa fixa",
    route: "/financeiro/despesas-fixas/novo",
    screenKey: "financeiro_despesas_fixas_novo",
    autonomyLevel: 4,
    keywords: ["despesa fixa", "despesa", "conta a pagar", "agua", "luz", "aluguel", "fixa"],
    summary:
      "Eu posso te orientar, mostrar o caminho, te levar ate a tela certa e preparar o formulario de despesa fixa para voce revisar.",
    steps: [
      "Abra o modulo Financeiro.",
      "Entre na aba Despesas fixas.",
      "Clique em Novo.",
      "Preencha lancamento, vencimento, valor, descricao e forma de pagamento.",
      "Revise o formulario e confirme o salvamento manualmente.",
    ],
    pathGuide: [
      { screenKey: "dashboard", elementId: "tile_financeiro", instruction: "Abra o modulo Financeiro." },
      { screenKey: "financeiro_despesas_fixas", elementId: "tab_despesas_fixas", instruction: "Entre na aba Despesas fixas." },
      { screenKey: "financeiro_despesas_fixas", elementId: "btn_nova_despesa_fixa", instruction: "Clique em Novo para abrir o formulario." },
    ],
    arrivalGuide: [
      { screenKey: "financeiro_despesas_fixas_novo", elementId: "field_lancamento", instruction: "Informe a data do lancamento." },
      { screenKey: "financeiro_despesas_fixas_novo", elementId: "field_valor", instruction: "Digite o valor em reais." },
      { screenKey: "financeiro_despesas_fixas_novo", elementId: "field_descricao", instruction: "Descreva a despesa para facilitar a consulta." },
      { screenKey: "financeiro_despesas_fixas_novo", elementId: "btn_salvar", instruction: "Revise e salve somente quando estiver tudo certo." },
    ],
    fillFields: [
      { key: "date", label: "Lancamento", targetElementId: "field_lancamento", placeholder: "dd/mm/aaaa", type: "date" },
      { key: "dueDate", label: "Vencimento", targetElementId: "field_vencimento", placeholder: "dd/mm/aaaa", type: "date" },
      { key: "value", label: "Valor", targetElementId: "field_valor", placeholder: "0,00", type: "currency" },
      { key: "description", label: "Descricao", targetElementId: "field_descricao", placeholder: "Ex.: Agua", type: "text" },
      { key: "paymentMethod", label: "Forma de pagamento", targetElementId: "field_forma_pagamento", placeholder: "Pix, Dinheiro...", type: "select" },
    ],
  },
  {
    key: "agendar_banho",
    title: "Agendar banho",
    route: "/agenda",
    screenKey: "agenda_estetica",
    autonomyLevel: 4,
    keywords: ["agendar banho", "banho", "tosa", "banho e tosa", "agendar tosa", "agenda"],
    summary:
      "Eu consigo te guiar pela agenda, te levar ate a tela certa e abrir o ponto de cadastro para voce continuar com seguranca.",
    steps: [
      "Abra a Agenda da estetica.",
      "Escolha a data e o horario desejados.",
      "Clique em Novo Cadastro no horario livre.",
      "Informe tutor, pet, servico e observacoes.",
      "Revise o pagamento e confirme o cadastro manualmente.",
    ],
    pathGuide: [
      { screenKey: "dashboard", elementId: "tile_agenda", instruction: "Abra a Agenda." },
      { screenKey: "agenda_estetica", elementId: "timeline_agenda", instruction: "Escolha a data e o horario na grade." },
      { screenKey: "agenda_estetica", elementId: "btn_novo_cadastro", instruction: "Clique em Novo Cadastro no horario desejado." },
    ],
    arrivalGuide: [
      { screenKey: "agenda_estetica", elementId: "timeline_agenda", instruction: "Voce ja esta na agenda certa para escolher o horario." },
      { screenKey: "agenda_estetica", elementId: "btn_novo_cadastro", instruction: "Use o botao Novo Cadastro no horario livre." },
    ],
    fillFields: [
      { key: "date", label: "Data", placeholder: "dd/mm/aaaa", type: "date" },
      { key: "time", label: "Hora", placeholder: "09:00", type: "time" },
      { key: "customerName", label: "Tutor", placeholder: "Nome do tutor", type: "text" },
      { key: "petName", label: "Pet", placeholder: "Nome do pet", type: "text" },
      { key: "serviceName", label: "Servico", placeholder: "Banho, tosa...", type: "text" },
    ],
    openWorkflow: "agenda-create",
  },
  {
    key: "ver_financeiro",
    title: "Ver financeiro",
    route: "/financeiro",
    screenKey: "financeiro",
    autonomyLevel: 3,
    keywords: ["financeiro", "ver financeiro", "caixa", "pagamentos", "vendas", "resumo financeiro"],
    summary:
      "Eu posso te mostrar o caminho do financeiro, abrir a tela certa e destacar a aba mais adequada para a sua duvida.",
    steps: [
      "Abra o modulo Financeiro.",
      "Escolha a aba desejada: Vendas, Compras, Pagamentos, Comissoes, Resumo ou Despesas fixas.",
      "Use os filtros da lateral para ajustar data, periodo e origem.",
    ],
    pathGuide: [
      { screenKey: "dashboard", elementId: "tile_financeiro", instruction: "Abra o modulo Financeiro." },
      { screenKey: "financeiro", elementId: "tab_pagamentos", instruction: "As abas no topo mudam o tipo de consulta." },
      { screenKey: "financeiro", elementId: "tab_despesas_fixas", instruction: "Use Despesas fixas para contas recorrentes." },
    ],
    arrivalGuide: [
      { screenKey: "financeiro", elementId: "tab_vendas", instruction: "Aqui ficam as vendas do periodo." },
      { screenKey: "financeiro", elementId: "tab_pagamentos", instruction: "Pagamentos mostra recebimentos e despesas atualizadas." },
      { screenKey: "financeiro", elementId: "tab_despesas_fixas", instruction: "Despesas fixas centraliza os lancamentos recorrentes." },
    ],
  },
  {
    key: "cadastrar_cliente",
    title: "Cadastrar tutor",
    route: "/cadastros/nova-pessoa",
    screenKey: "cadastro_tutor",
    autonomyLevel: 4,
    keywords: ["cadastrar cliente", "cadastrar tutor", "novo tutor", "nova pessoa", "cliente", "responsavel"],
    summary:
      "Eu posso te orientar no cadastro do tutor, abrir a tela correta e preencher os campos principais para voce revisar antes de salvar.",
    steps: [
      "Abra o modulo Cadastros.",
      "Entre em Nova Pessoa.",
      "Preencha nome, telefone, email e endereco.",
      "Revise os dados e salve somente apos a conferencia.",
    ],
    pathGuide: [
      { screenKey: "dashboard", elementId: "tile_cadastros", instruction: "Abra o modulo Cadastros." },
    ],
    arrivalGuide: [
      { screenKey: "cadastro_tutor", elementId: "field_nome", instruction: "Comece pelo nome do tutor." },
      { screenKey: "cadastro_tutor", elementId: "field_fone", instruction: "Informe o telefone principal para contato." },
      { screenKey: "cadastro_tutor", elementId: "btn_salvar", instruction: "Revise o cadastro antes de salvar." },
    ],
    fillFields: [
      { key: "name", label: "Nome", targetElementId: "field_nome", placeholder: "Nome completo", type: "text" },
      { key: "phone", label: "Fone", targetElementId: "field_fone", placeholder: "(00) 00000-0000", type: "text" },
      { key: "email", label: "Email", targetElementId: "field_email", placeholder: "email@dominio.com", type: "text" },
      { key: "cpf", label: "CPF/CNPJ", targetElementId: "field_cpf", placeholder: "CPF ou CNPJ", type: "text" },
      { key: "address", label: "Endereco", targetElementId: "field_endereco", placeholder: "Rua e numero", type: "text" },
    ],
  },
  {
    key: "cadastrar_pet",
    title: "Cadastrar pet",
    route: "/cadastros/novo-paciente",
    screenKey: "cadastro_pet",
    autonomyLevel: 4,
    keywords: ["cadastrar pet", "novo pet", "cadastrar paciente", "pet", "paciente"],
    summary:
      "Eu posso te levar ate o cadastro do pet, destacar os campos principais e adiantar o preenchimento sem salvar nada sozinho.",
    steps: [
      "Abra o modulo Cadastros.",
      "Entre em Novo Pet.",
      "Preencha nome, especie, responsavel e nascimento.",
      "Complete raca, porte e observacoes se precisar.",
      "Revise e salve manualmente quando estiver tudo certo.",
    ],
    pathGuide: [
      { screenKey: "dashboard", elementId: "tile_cadastros", instruction: "Abra o modulo Cadastros." },
    ],
    arrivalGuide: [
      { screenKey: "cadastro_pet", elementId: "field_nome_pet", instruction: "Comece pelo nome do pet." },
      { screenKey: "cadastro_pet", elementId: "field_responsavel", instruction: "Associe o tutor para o pet ficar vinculado corretamente." },
      { screenKey: "cadastro_pet", elementId: "btn_salvar", instruction: "Revise o cadastro antes de salvar." },
    ],
    fillFields: [
      { key: "name", label: "Nome do pet", targetElementId: "field_nome_pet", placeholder: "Nome do pet", type: "text" },
      { key: "species", label: "Especie", targetElementId: "field_especie", placeholder: "Canina, Felina...", type: "select" },
      { key: "customerName", label: "Responsavel", targetElementId: "field_responsavel", placeholder: "Nome do tutor", type: "text" },
      { key: "birthdate", label: "Nascimento", targetElementId: "field_nascimento_pet", placeholder: "dd/mm/aaaa", type: "date" },
      { key: "breed", label: "Raca predominante", targetElementId: "field_raca", placeholder: "Raca principal", type: "text" },
    ],
  },
];

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function getAssistantScreenByPath(pathname = "") {
  const normalizedPath = String(pathname || "").trim();
  const orderedScreens = [...ASSISTANT_SCREEN_MAP].sort((left, right) => right.route.length - left.route.length);
  return (
    orderedScreens.find((screen) =>
      screen.matchMode === "prefix"
        ? normalizedPath.startsWith(screen.route)
        : normalizedPath === screen.route,
    ) || null
  );
}

export function getAssistantTopicByKey(topicKey = "") {
  return ASSISTANT_HELP_TOPICS.find((topic) => topic.key === topicKey) || null;
}

export function findAssistantTopicFromText(text = "") {
  const normalizedText = normalizeText(text);
  if (!normalizedText) return null;

  return (
    ASSISTANT_HELP_TOPICS.find((topic) =>
      topic.keywords.some((keyword) => normalizedText.includes(normalizeText(keyword))),
    ) || null
  );
}
