export const ASSISTANT_QUICK_PROMPTS = [
  "Como cadastrar uma despesa?",
  "Como agendar um banho?",
  "Como ver o financeiro?",
  "Como cadastrar um cliente?",
  "Como abrir o CRM?",
  "Como conectar o WhatsApp?",
  "Como registrar uma venda?",
  "Como ver o ViaCentral?",
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
      {
        id: "tile_mensagens",
        label: "Mensagens",
        type: "button",
        action: "abrir_mensagens",
        locator: { buttonText: "Mensagens" },
      },
      {
        id: "tile_venda",
        label: "Venda (PDV)",
        type: "button",
        action: "abrir_venda",
        locator: { buttonText: "Venda" },
      },
      {
        id: "tile_viacentral",
        label: "ViaCentral",
        type: "button",
        action: "abrir_viacentral",
        locator: { buttonText: "ViaCentral" },
      },
      {
        id: "tile_configurar",
        label: "Configurar",
        type: "button",
        action: "abrir_configuracoes",
        locator: { buttonText: "Configurar" },
      },
    ],
    actions: [
      "ver_financeiro",
      "cadastrar_despesa_fixa",
      "cadastrar_cliente",
      "cadastrar_pet",
      "agendar_banho",
      "agendar_consulta_clinica",
      "acompanhar_internacao",
      "abrir_crm",
      "conectar_whatsapp_crm",
      "configurar_ia_crm",
      "registrar_venda_pdv",
      "registrar_pagamento_pdv",
      "ver_viacentral",
      "configurar_conta_sistema",
    ],
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
    page: "agenda_clinica",
    name: "Agenda Clinica",
    route: "/agenda/clinica",
    matchMode: "exact",
    elements: [
      {
        id: "timeline_clinica",
        label: "Grade da agenda",
        type: "board",
        action: "visualizar_horarios",
        locator: { selector: ".timeline" },
      },
      {
        id: "tab_clinica",
        label: "Clinica",
        type: "tab",
        action: "abrir_clinica",
        locator: { buttonText: "Clinica" },
      },
      {
        id: "btn_novo_cadastro_clinica",
        label: "Novo Cadastro",
        type: "button",
        action: "abrir_novo_cadastro",
        locator: { buttonText: "Novo Cadastro" },
      },
    ],
    actions: ["agendar_consulta_clinica"],
  },
  {
    page: "agenda_internacao",
    name: "Agenda Internacao",
    route: "/agenda/internacao",
    matchMode: "exact",
    elements: [
      {
        id: "timeline_internacao",
        label: "Grade da agenda",
        type: "board",
        action: "visualizar_horarios",
        locator: { selector: ".timeline" },
      },
      {
        id: "tab_internacao",
        label: "Internacao",
        type: "tab",
        action: "abrir_internacao",
        locator: { buttonText: "Internacao" },
      },
      {
        id: "btn_novo_cadastro_internacao",
        label: "Novo Cadastro",
        type: "button",
        action: "abrir_novo_cadastro",
        locator: { buttonText: "Novo Cadastro" },
      },
    ],
    actions: ["acompanhar_internacao"],
  },
  {
    page: "mensagens",
    name: "Mensagens CRM",
    route: "/mensagens",
    matchMode: "prefix",
    elements: [
      {
        id: "menu_crm",
        label: "CRM",
        type: "button",
        action: "abrir_crm",
        locator: { buttonText: "CRM" },
      },
      {
        id: "menu_ai",
        label: "IA",
        type: "button",
        action: "abrir_ia",
        locator: { buttonText: "IA" },
      },
      {
        id: "btn_setup_wizard",
        label: "Primeira configuracao",
        type: "button",
        action: "abrir_wizard",
        locator: { buttonText: "Primeira configuracao" },
      },
      {
        id: "btn_whatsapp_connect",
        label: "Conectar WhatsApp",
        type: "button",
        action: "conectar_whatsapp",
        locator: { buttonText: "Conectar WhatsApp" },
      },
      {
        id: "btn_configurar_ia",
        label: "Configurar IA",
        type: "button",
        action: "abrir_controle_ia",
        locator: { buttonText: "Configurar IA" },
      },
    ],
    actions: ["abrir_crm", "conectar_whatsapp_crm", "configurar_ia_crm"],
  },
  {
    page: "venda_pdv",
    name: "Venda PDV",
    route: "/venda",
    matchMode: "exact",
    elements: [
      {
        id: "btn_venda",
        label: "Venda",
        type: "button",
        action: "abrir_venda",
        locator: { buttonText: "Venda" },
      },
      {
        id: "btn_pagamento_pdv",
        label: "Pagamento",
        type: "button",
        action: "abrir_pagamento",
        locator: { buttonText: "Pagamento" },
      },
      {
        id: "btn_fechar_caixa_pdv",
        label: "Fechar Caixa",
        type: "button",
        action: "abrir_fechamento",
        locator: { buttonText: "Fechar Caixa" },
      },
    ],
    actions: ["registrar_venda_pdv", "registrar_pagamento_pdv"],
  },
  {
    page: "viacentral",
    name: "ViaCentral",
    route: "/viacentral",
    matchMode: "exact",
    elements: [
      {
        id: "tab_faturamento",
        label: "Faturamento",
        type: "tab",
        action: "abrir_faturamento",
        locator: { buttonText: "Faturamento" },
      },
      {
        id: "tab_servicos",
        label: "Servicos",
        type: "tab",
        action: "abrir_servicos",
        locator: { buttonText: "Servicos" },
      },
      {
        id: "tab_valores",
        label: "Valores",
        type: "tab",
        action: "abrir_valores",
        locator: { buttonText: "Valores" },
      },
      {
        id: "tab_pacotinhos",
        label: "Pacotinhos",
        type: "tab",
        action: "abrir_pacotinhos",
        locator: { buttonText: "Pacotinhos" },
      },
      {
        id: "tab_caixa",
        label: "Caixa",
        type: "tab",
        action: "abrir_caixa",
        locator: { buttonText: "Caixa" },
      },
    ],
    actions: ["ver_viacentral"],
  },
  {
    page: "configuracao",
    name: "Configuracoes",
    route: "/configuracao",
    matchMode: "prefix",
    elements: [
      {
        id: "tab_perfil",
        label: "Perfil",
        type: "tab",
        action: "abrir_perfil",
        locator: { href: "/configuracao" },
      },
      {
        id: "tab_recursos",
        label: "Recursos",
        type: "tab",
        action: "abrir_recursos",
        locator: { href: "/configuracao/recursos" },
      },
      {
        id: "tab_agenda_config",
        label: "Agenda",
        type: "tab",
        action: "abrir_agenda_config",
        locator: { href: "/configuracao/agenda" },
      },
      {
        id: "tab_taxas",
        label: "Taxas",
        type: "tab",
        action: "abrir_taxas",
        locator: { href: "/configuracao/taxas" },
      },
      {
        id: "tab_conta",
        label: "Conta",
        type: "tab",
        action: "abrir_conta",
        locator: { href: "/configuracao/conta" },
      },
    ],
    actions: ["configurar_conta_sistema"],
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
    key: "agendar_consulta_clinica",
    title: "Agendar consulta na clinica",
    route: "/agenda/clinica",
    screenKey: "agenda_clinica",
    autonomyLevel: 3,
    keywords: ["consulta clinica", "agendar consulta", "clinica", "consulta", "atendimento clinico"],
    summary:
      "Eu posso te levar ate a agenda da clinica, mostrar o caminho certo e destacar onde iniciar um novo atendimento.",
    steps: [
      "Abra a Agenda da clinica.",
      "Confira a data e o horario desejados.",
      "Use Novo Cadastro no horario livre.",
      "Complete tutor, pet, servico e observacoes clinicas.",
      "Revise o atendimento antes de salvar.",
    ],
    pathGuide: [
      { screenKey: "dashboard", elementId: "tile_agenda", instruction: "Abra a Agenda pelo painel principal." },
      { screenKey: "agenda_clinica", elementId: "tab_clinica", instruction: "Confirme que voce esta na aba Clinica." },
      { screenKey: "agenda_clinica", elementId: "btn_novo_cadastro_clinica", instruction: "Use Novo Cadastro para iniciar a consulta." },
    ],
    arrivalGuide: [
      { screenKey: "agenda_clinica", elementId: "timeline_clinica", instruction: "Escolha o horario livre diretamente na grade." },
      { screenKey: "agenda_clinica", elementId: "btn_novo_cadastro_clinica", instruction: "Depois abra o cadastro do atendimento na clinica." },
    ],
  },
  {
    key: "acompanhar_internacao",
    title: "Abrir internacao",
    route: "/agenda/internacao",
    screenKey: "agenda_internacao",
    autonomyLevel: 3,
    keywords: ["internacao", "abrir internacao", "acompanhar internacao", "paciente internado", "leito"],
    summary:
      "Eu consigo te levar ate a tela de internacao, destacar a grade e mostrar onde abrir ou revisar um atendimento internado.",
    steps: [
      "Abra a Agenda da internacao.",
      "Veja a grade ou o paciente que precisa de acompanhamento.",
      "Use Novo Cadastro quando quiser registrar uma nova internacao.",
      "Revise observacoes, responsavel e lancamentos antes de salvar.",
    ],
    pathGuide: [
      { screenKey: "dashboard", elementId: "tile_agenda", instruction: "Abra a Agenda a partir do dashboard." },
      { screenKey: "agenda_internacao", elementId: "tab_internacao", instruction: "Confirme que voce esta na aba Internacao." },
      { screenKey: "agenda_internacao", elementId: "btn_novo_cadastro_internacao", instruction: "Use Novo Cadastro para abrir um novo atendimento internado." },
    ],
    arrivalGuide: [
      { screenKey: "agenda_internacao", elementId: "timeline_internacao", instruction: "Aqui voce acompanha os horarios e registros da internacao." },
      { screenKey: "agenda_internacao", elementId: "btn_novo_cadastro_internacao", instruction: "Abra um novo cadastro apenas quando precisar registrar outra internacao." },
    ],
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
    key: "abrir_crm",
    title: "Abrir CRM",
    route: "/mensagens",
    screenKey: "mensagens",
    autonomyLevel: 3,
    keywords: ["crm", "abrir crm", "mensagens", "conversas", "funil", "quadro crm"],
    summary:
      "Eu posso te levar direto para o CRM em Mensagens e destacar a aba certa para organizar conversas, contatos e colunas.",
    steps: [
      "Abra o modulo Mensagens.",
      "Entre na aba CRM.",
      "Escolha a coluna do funil ou mova o contato para a etapa correta.",
      "Abra a conversa ou o card do cliente para continuar o atendimento.",
    ],
    pathGuide: [
      { screenKey: "dashboard", elementId: "tile_mensagens", instruction: "Abra o modulo Mensagens." },
      { screenKey: "mensagens", elementId: "menu_crm", instruction: "Entre na area CRM para visualizar o quadro." },
    ],
    arrivalGuide: [
      { screenKey: "mensagens", elementId: "menu_crm", instruction: "Esta aba concentra o quadro do CRM e as colunas do funil." },
    ],
  },
  {
    key: "conectar_whatsapp_crm",
    title: "Conectar WhatsApp do CRM",
    route: "/mensagens",
    screenKey: "mensagens",
    autonomyLevel: 3,
    keywords: ["conectar whatsapp", "whatsapp crm", "ligar whatsapp", "integrar whatsapp", "meta"],
    summary:
      "Eu posso te levar para a configuracao do WhatsApp do CRM e mostrar o caminho do wizard oficial da Meta.",
    steps: [
      "Abra o modulo Mensagens.",
      "Use Primeira configuracao ou Conectar WhatsApp.",
      "Entre com a conta Meta no popup oficial.",
      "Se houver mais de um numero, escolha qual numero deseja usar.",
      "Volte para o sistema e confirme se a conexao ficou ativa.",
    ],
    pathGuide: [
      { screenKey: "dashboard", elementId: "tile_mensagens", instruction: "Abra o modulo Mensagens." },
      { screenKey: "mensagens", elementId: "btn_setup_wizard", instruction: "Use Primeira configuracao para seguir o passo a passo." },
      { screenKey: "mensagens", elementId: "btn_whatsapp_connect", instruction: "Ou clique em Conectar WhatsApp para iniciar o login da Meta." },
    ],
    arrivalGuide: [
      { screenKey: "mensagens", elementId: "btn_whatsapp_connect", instruction: "Este botao inicia a conexao oficial do WhatsApp Business." },
    ],
  },
  {
    key: "configurar_ia_crm",
    title: "Configurar IA do CRM",
    route: "/mensagens",
    screenKey: "mensagens",
    autonomyLevel: 3,
    keywords: ["configurar ia", "ia crm", "ia mensagens", "controle da ia", "playbook da ia"],
    summary:
      "Eu consigo te levar ate a aba de IA do CRM para revisar regras, limites e o que a assistente pode ou nao pode fazer.",
    steps: [
      "Abra o modulo Mensagens.",
      "Entre na aba IA.",
      "Revise as permissoes, aprovacoes humanas e instrucoes da assistente.",
      "Ajuste as regras e salve quando estiver seguro.",
    ],
    pathGuide: [
      { screenKey: "dashboard", elementId: "tile_mensagens", instruction: "Abra o modulo Mensagens." },
      { screenKey: "mensagens", elementId: "menu_ai", instruction: "Entre na aba IA." },
      { screenKey: "mensagens", elementId: "btn_configurar_ia", instruction: "Abra o painel de configuracao da IA." },
    ],
    arrivalGuide: [
      { screenKey: "mensagens", elementId: "menu_ai", instruction: "Aqui ficam as regras, limites e permissoes da IA no CRM." },
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
  {
    key: "registrar_venda_pdv",
    title: "Registrar venda no PDV",
    route: "/venda",
    screenKey: "venda_pdv",
    autonomyLevel: 3,
    keywords: ["registrar venda", "nova venda", "pdv", "venda pdv", "vender produto"],
    summary:
      "Eu posso te levar ao PDV e mostrar onde abrir a venda para registrar produtos, valores e meio de pagamento.",
    steps: [
      "Abra o modulo Venda (PDV).",
      "Clique em Venda.",
      "Escolha cliente, produto, quantidade e valor.",
      "Defina o meio de pagamento e revise os totais.",
      "Confirme o salvamento manualmente.",
    ],
    pathGuide: [
      { screenKey: "dashboard", elementId: "tile_venda", instruction: "Abra o modulo Venda (PDV)." },
      { screenKey: "venda_pdv", elementId: "btn_venda", instruction: "Clique em Venda para abrir o formulario." },
    ],
    arrivalGuide: [
      { screenKey: "venda_pdv", elementId: "btn_venda", instruction: "Este botao abre a tela de nova venda no PDV." },
    ],
  },
  {
    key: "registrar_pagamento_pdv",
    title: "Registrar pagamento no PDV",
    route: "/venda",
    screenKey: "venda_pdv",
    autonomyLevel: 3,
    keywords: ["registrar pagamento", "pagamento pdv", "recebimento pdv", "baixar pagamento"],
    summary:
      "Eu consigo te levar ao PDV e mostrar onde registrar um pagamento manual com data, valor e meio de pagamento.",
    steps: [
      "Abra o modulo Venda (PDV).",
      "Clique em Pagamento.",
      "Informe a data, o valor e o meio de pagamento.",
      "Revise a descricao e confirme o lancamento manualmente.",
    ],
    pathGuide: [
      { screenKey: "dashboard", elementId: "tile_venda", instruction: "Abra o modulo Venda (PDV)." },
      { screenKey: "venda_pdv", elementId: "btn_pagamento_pdv", instruction: "Clique em Pagamento para abrir o formulario." },
    ],
    arrivalGuide: [
      { screenKey: "venda_pdv", elementId: "btn_pagamento_pdv", instruction: "Aqui voce registra os recebimentos manuais do PDV." },
    ],
  },
  {
    key: "ver_viacentral",
    title: "Abrir ViaCentral",
    route: "/viacentral",
    screenKey: "viacentral",
    autonomyLevel: 3,
    keywords: ["viacentral", "supervet", "painel", "faturamento", "servicos do mes", "valores do mes"],
    summary:
      "Eu posso te levar ate o ViaCentral e mostrar onde consultar faturamento, servicos, valores, pacotinhos e caixa.",
    steps: [
      "Abra o ViaCentral pelo painel principal.",
      "Escolha o periodo e, se quiser, o vendedor.",
      "Troque entre Faturamento, Servicos, Valores, Pacotinhos e Caixa.",
      "Use os cards e graficos para conferir os numeros do periodo.",
    ],
    pathGuide: [
      { screenKey: "dashboard", elementId: "tile_viacentral", instruction: "Abra o ViaCentral." },
      { screenKey: "viacentral", elementId: "tab_faturamento", instruction: "Comece por Faturamento para ver o consolidado geral." },
      { screenKey: "viacentral", elementId: "tab_servicos", instruction: "Depois use Servicos para ver quantidade e distribuicao." },
    ],
    arrivalGuide: [
      { screenKey: "viacentral", elementId: "tab_valores", instruction: "A aba Valores ajuda a comparar bruto, liquido e custos." },
      { screenKey: "viacentral", elementId: "tab_pacotinhos", instruction: "Pacotinhos mostra o comportamento dos pacotes no periodo." },
    ],
  },
  {
    key: "configurar_conta_sistema",
    title: "Configurar conta e assinatura",
    route: "/configuracao/conta",
    screenKey: "configuracao",
    autonomyLevel: 3,
    keywords: ["configurar conta", "assinatura", "validade", "conta", "configuracao da conta", "renovar plano"],
    summary:
      "Eu posso te levar ate a aba Conta nas configuracoes para revisar validade, dados da conta e pontos ligados a assinatura.",
    steps: [
      "Abra Configurar no painel principal.",
      "Entre na aba Conta.",
      "Revise os dados da conta, validade e informacoes ligadas ao acesso.",
      "Use a cobranca PIX quando precisar renovar a assinatura.",
    ],
    pathGuide: [
      { screenKey: "dashboard", elementId: "tile_configurar", instruction: "Abra o modulo Configurar." },
      { screenKey: "configuracao", elementId: "tab_conta", instruction: "Entre na aba Conta para revisar assinatura e dados da conta." },
    ],
    arrivalGuide: [
      { screenKey: "configuracao", elementId: "tab_conta", instruction: "Aqui voce revisa os dados da conta e a parte de assinatura." },
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
