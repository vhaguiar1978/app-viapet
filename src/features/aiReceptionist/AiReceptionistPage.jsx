import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import "./aiReceptionist.css";

const STORAGE_KEY = "viapet.aiReceptionist.module.v1";
const DEMO_AGENDA_STORAGE_KEY = "viapet.demo.agenda";
const DEMO_CUSTOMERS_STORAGE_KEY = "viapet.demo.customers";
const DEMO_PETS_STORAGE_KEY = "viapet.demo.pets";
const CRM_DATA_UPDATED_EVENT = "viapet:crm-data-updated";

const tabs = [
  { id: "config", label: "Configuracao" },
  { id: "knowledge", label: "Base" },
  { id: "flows", label: "Fluxos" },
  { id: "ops", label: "Agenda e cadastro" },
  { id: "conversations", label: "Conversas" },
  { id: "training", label: "Metricas e treino" },
];

const defaultConfig = {
  assistantName: "Bia Recepcionista",
  tone: "Simpatico, rapido, objetivo e acolhedor",
  businessHours: "Segunda a sabado, 08:00 as 18:00",
  openingMessage:
    "Oi, tudo bem? Sou a Bia, recepcionista do pet shop. Me fala o nome do seu pet e o que voce precisa hoje.",
  afterHoursMessage:
    "Oi! Agora estamos fora do horario de atendimento. Ja deixei sua mensagem registrada e respondo assim que a loja abrir.",
  services: "Banho, tosa higienica, tosa geral, hidratacao, corte de unha, pacotinho mensal, busca e leva",
  priceTable:
    "Banho pequeno pelo curto: R$ 55 | Banho medio: R$ 70 | Banho grande: R$ 95 | Tosa higienica: +R$ 25 | Hidratacao: +R$ 35",
  delayRules: "Tolerancia de 15 minutos. Apos isso, confirmar novo encaixe com humano.",
  cancelRules: "Cancelamentos com menos de 2 horas devem ser remarcados conforme disponibilidade.",
  paymentMethods: "Pix, dinheiro, debito, credito e link de pagamento",
  pickupRegions: "Centro, Jardim America, Vila Nova e bairros ate 6 km da loja",
  discountRules: "Desconto maximo de 10% apenas em pacotinho mensal ou clientes recorrentes autorizados.",
  packageRules: "Pacotinho mensal com 4 banhos, validade de 30 dias e reagendamento com 24 horas.",
  humanHandoff:
    "Reclamacao, emergencia, saude do pet, pedido de desconto fora da regra, agressividade grave, duvida sem resposta ou cliente irritado.",
};

const defaultKnowledge = [
  {
    id: "kb-1",
    title: "Como informar preco",
    category: "Precos",
    content:
      "A IA deve perguntar porte, raca, tipo de pelo e servico antes de confirmar preco. Se faltar dado, informar faixa aproximada.",
  },
  {
    id: "kb-2",
    title: "Politica de saude",
    category: "Seguranca",
    content:
      "A IA nunca da diagnostico veterinario. Em vomito, sangramento, dor, convulsao ou emergencia, chamar humano imediatamente.",
  },
  {
    id: "kb-3",
    title: "Pacotinho mensal",
    category: "Vendas",
    content:
      "Oferecer pacotinho para clientes que perguntam preco, fazem banho recorrente ou querem economia mensal.",
  },
];

const defaultFlows = [
  ["cliente_novo", "Cliente novo", "Coletar nome, telefone, pet, raca, porte, idade, comportamento e servico desejado."],
  ["cliente_recorrente", "Cliente recorrente", "Reconhecer tutor e pet, confirmar preferencias e sugerir horarios proximos."],
  ["preco", "Pedido de preco", "Perguntar dados do pet, aplicar tabela, mostrar faixa e oferecer pacotinho quando fizer sentido."],
  ["agendamento", "Agendamento", "Consultar horarios, sugerir 3 opcoes, reservar apos confirmacao e registrar na agenda."],
  ["remarcacao", "Remarcacao", "Localizar horario atual, validar regra de cancelamento e sugerir novo horario."],
  ["cancelamento", "Cancelamento", "Confirmar decisao, registrar motivo e oferecer remarcacao quando adequado."],
  ["confirmacao", "Confirmacao", "Enviar lembrete curto com pet, servico, horario, endereco e politica de atraso."],
  ["pacotinho", "Pacotinho mensal", "Explicar beneficios, validade, economia e condicoes de uso sem prometer desconto indevido."],
  ["busca_leva", "Busca e leva", "Validar regiao, endereco, janela de retirada e taxa antes de confirmar."],
  ["reclamacao", "Reclamacao", "Acolher, pedir desculpas, registrar contexto e chamar humano imediatamente."],
  ["pos_venda", "Pos-venda", "Perguntar como o pet ficou, pedir avaliacao e registrar preferencia para proxima visita."],
  ["reativacao", "Reativacao", "Chamar cliente inativo com mensagem curta, saudosa e oferta permitida."],
].map(([id, title, description]) => ({ id, title, description, active: true }));

const defaultConversations = [
  {
    id: "conv-1",
    tutor: "Amanda Lima",
    pet: "Belinha",
    channel: "WhatsApp",
    status: "agendamento criado",
    intent: "Banho premium",
    value: 90,
    lastMessage: "Perfeito, deixei a Belinha para sexta as 10:30.",
    needsHuman: false,
  },
  {
    id: "conv-2",
    tutor: "Ricardo Alves",
    pet: "Thor",
    channel: "Sistema",
    status: "precisa de humano",
    intent: "Reclamacao",
    value: 0,
    lastMessage: "Entendi sua preocupacao. Vou chamar uma pessoa da equipe agora.",
    needsHuman: true,
  },
  {
    id: "conv-3",
    tutor: "Sheila Monteiro",
    pet: "Meg",
    channel: "WhatsApp",
    status: "aguardando cliente",
    intent: "Pacotinho mensal",
    value: 300,
    lastMessage: "Posso montar o pacotinho da Meg com 4 banhos por mes?",
    needsHuman: false,
  },
];

const defaultTraining = [
  {
    id: "tr-1",
    original: "Seu pet pode estar com alergia.",
    corrected:
      "Nao consigo avaliar saude por mensagem. Vou chamar uma pessoa da equipe para te orientar com cuidado.",
    tag: "Seguranca veterinaria",
    saved: true,
  },
];

const statusLabels = {
  "em atendimento": "Em atendimento",
  "agendamento criado": "Agendamento criado",
  "aguardando cliente": "Aguardando cliente",
  "precisa de humano": "Precisa de humano",
  finalizado: "Finalizado",
  "convertido em venda": "Convertido em venda",
};

function buildDefaultState() {
  return {
    config: defaultConfig,
    knowledge: defaultKnowledge,
    flows: defaultFlows,
    conversations: defaultConversations,
    training: defaultTraining,
    draft: {
      tutorName: "Camila Souza",
      phone: "(74) 99999-4000",
      petName: "Luna",
      breed: "Spitz",
      size: "Pequeno",
      age: "3 anos",
      behavior: "Docil, assusta com secador",
      service: "Banho premium",
      date: new Date().toISOString().slice(0, 10),
      time: "14:30",
      price: "85",
    },
  };
}

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function readModuleState() {
  const fallback = buildDefaultState();
  const stored = readJson(STORAGE_KEY, null);
  if (!stored || typeof stored !== "object") return fallback;
  return {
    ...fallback,
    ...stored,
    config: { ...fallback.config, ...(stored.config || {}) },
    draft: { ...fallback.draft, ...(stored.draft || {}) },
    knowledge: Array.isArray(stored.knowledge) ? stored.knowledge : fallback.knowledge,
    flows: Array.isArray(stored.flows) ? stored.flows : fallback.flows,
    conversations: Array.isArray(stored.conversations) ? stored.conversations : fallback.conversations,
    training: Array.isArray(stored.training) ? stored.training : fallback.training,
  };
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function addDemoCustomerAndPet(draft) {
  const customers = readJson(DEMO_CUSTOMERS_STORAGE_KEY, []);
  const pets = readJson(DEMO_PETS_STORAGE_KEY, []);
  const customerId = `ai-customer-${Date.now()}`;
  const petId = `ai-pet-${Date.now()}`;
  const customer = {
    id: customerId,
    name: draft.tutorName,
    phone: draft.phone,
    whatsapp: normalizePhone(draft.phone),
    city: "",
    address: "",
    source: "IA Recepcionista",
  };
  const pet = {
    id: petId,
    name: draft.petName,
    species: "Cao",
    breed: draft.breed,
    customerId,
    customerName: draft.tutorName,
    customerPhone: draft.phone,
    observation: [
      draft.size ? `Porte: ${draft.size}` : "",
      draft.age ? `Idade: ${draft.age}` : "",
      draft.behavior ? `Comportamento: ${draft.behavior}` : "",
      draft.service ? `Servico preferido: ${draft.service}` : "",
    ]
      .filter(Boolean)
      .join(" | "),
  };

  writeJson(DEMO_CUSTOMERS_STORAGE_KEY, [customer, ...customers]);
  writeJson(DEMO_PETS_STORAGE_KEY, [pet, ...pets]);
  window.dispatchEvent(new CustomEvent(CRM_DATA_UPDATED_EVENT));
  return { customer, pet };
}

function addDemoAppointment(draft, customer, pet) {
  const items = readJson(DEMO_AGENDA_STORAGE_KEY, []);
  const price = Number(String(draft.price || "0").replace(",", ".")) || 0;
  const appointment = {
    id: `ai-agenda-${Date.now()}`,
    date: draft.date,
    hour: draft.time,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pet: pet.name,
    owner: customer.name,
    breed: pet.breed,
    phone: customer.phone,
    note: `Criado pela IA Recepcionista. ${draft.behavior || ""}`.trim(),
    tags: [draft.service || "Banho e tosa", "IA Recepcionista"],
    saleLines: [{ description: draft.service || "Servico", quantity: 1, unitPrice: price, total: price }],
    payments: [],
    status: "agendado",
    type: "estetica",
    appointmentType: "estetica",
    financeStatus: "pendente",
    customerId: customer.id,
    petId: pet.id,
    amount: price,
    paidAmount: 0,
    outstandingAmount: price,
  };
  writeJson(DEMO_AGENDA_STORAGE_KEY, [appointment, ...items]);
  return appointment;
}

export function AiReceptionistPage({ auth, isDemo = false }) {
  const [state, setState] = useState(() => readModuleState());
  const [activeTab, setActiveTab] = useState("config");
  const [feedback, setFeedback] = useState("");
  const [knowledgeDraft, setKnowledgeDraft] = useState({ title: "", category: "Servicos", content: "" });
  const [trainingDraft, setTrainingDraft] = useState({ original: "", corrected: "", tag: "Atendimento" });

  function persist(nextState, message = "") {
    setState(nextState);
    writeJson(STORAGE_KEY, nextState);
    if (message) setFeedback(message);
  }

  function updateConfig(field, value) {
    persist({ ...state, config: { ...state.config, [field]: value } });
  }

  function updateDraft(field, value) {
    persist({ ...state, draft: { ...state.draft, [field]: value } });
  }

  function addKnowledge() {
    const title = knowledgeDraft.title.trim();
    const content = knowledgeDraft.content.trim();
    if (!title || !content) {
      setFeedback("Preencha titulo e conteudo para salvar na base da IA.");
      return;
    }
    const next = {
      ...state,
      knowledge: [{ ...knowledgeDraft, id: `kb-${Date.now()}` }, ...state.knowledge],
    };
    setKnowledgeDraft({ title: "", category: "Servicos", content: "" });
    persist(next, "Entrada adicionada a base de conhecimento.");
  }

  function removeKnowledge(id) {
    persist({ ...state, knowledge: state.knowledge.filter((item) => item.id !== id) }, "Entrada removida.");
  }

  function toggleFlow(id) {
    persist({
      ...state,
      flows: state.flows.map((flow) => (flow.id === id ? { ...flow, active: !flow.active } : flow)),
    });
  }

  function updateConversationStatus(id, status) {
    persist({
      ...state,
      conversations: state.conversations.map((item) =>
        item.id === id ? { ...item, status, needsHuman: status === "precisa de humano" } : item,
      ),
    });
  }

  function createDemoRecords() {
    const { customer, pet } = addDemoCustomerAndPet(state.draft);
    const appointment = addDemoAppointment(state.draft, customer, pet);
    const nextConversation = {
      id: `conv-${Date.now()}`,
      tutor: customer.name,
      pet: pet.name,
      channel: "WhatsApp",
      status: "agendamento criado",
      intent: state.draft.service,
      value: appointment.amount,
      lastMessage: `Horario reservado para ${pet.name} em ${state.draft.date} as ${state.draft.time}.`,
      needsHuman: false,
    };
    persist(
      { ...state, conversations: [nextConversation, ...state.conversations] },
      "Tutor, pet e agendamento foram criados no modo demonstracao.",
    );
  }

  function addTrainingExample() {
    if (!trainingDraft.original.trim() || !trainingDraft.corrected.trim()) {
      setFeedback("Preencha a resposta original e a correcao.");
      return;
    }
    const next = {
      ...state,
      training: [{ ...trainingDraft, id: `tr-${Date.now()}`, saved: true }, ...state.training],
    };
    setTrainingDraft({ original: "", corrected: "", tag: "Atendimento" });
    persist(next, "Exemplo salvo no modo treinamento.");
  }

  const metrics = useMemo(() => {
    const conversations = state.conversations.length;
    const scheduled = state.conversations.filter((item) => item.status === "agendamento criado").length;
    const converted = state.conversations.filter((item) => item.status === "convertido em venda" || item.value > 0).length;
    const revenue = state.conversations.reduce((sum, item) => sum + Number(item.value || 0), 0);
    const handoff = state.conversations.filter((item) => item.needsHuman).length;
    const packageOffers = state.conversations.filter((item) => /pacot/i.test(item.intent || item.lastMessage || "")).length;
    return {
      conversations,
      scheduled,
      conversion: conversations ? Math.round((converted / conversations) * 100) : 0,
      reactivated: 8,
      revenue,
      extras: 14,
      packageOffers,
      packageClosed: Math.max(packageOffers - 1, 0),
      handoff,
    };
  }, [state.conversations]);

  const activeFlows = state.flows.filter((flow) => flow.active).length;

  return (
    <section className="ai-receptionist-page">
      <header className="ai-receptionist-hero">
        <div className="ai-receptionist-hero-copy">
          <span className="ai-receptionist-kicker">IA Recepcionista Pet Shop</span>
          <h1>Atendimento, agenda e vendas com uma recepcionista treinada para banho e tosa.</h1>
          <p>
            Configure a IA para responder clientes, consultar horarios, cadastrar tutor e pet,
            criar agendamentos, oferecer pacotinhos e chamar humano nos momentos certos.
          </p>
        </div>
        <div className="ai-receptionist-hero-panel">
          <div>
            <span>IA ativa</span>
            <strong>{state.config.assistantName}</strong>
          </div>
          <div>
            <span>Fluxos ligados</span>
            <strong>{activeFlows}/{state.flows.length}</strong>
          </div>
          <div>
            <span>Modo atual</span>
            <strong>{isDemo || !auth?.token ? "Demonstracao" : "Conta conectada"}</strong>
          </div>
        </div>
      </header>

      {feedback ? (
        <div className="ai-receptionist-feedback">
          <span>{feedback}</span>
          <button type="button" onClick={() => setFeedback("")}>Fechar</button>
        </div>
      ) : null}

      <nav className="ai-receptionist-tabs" aria-label="Abas da IA Recepcionista">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "config" ? (
        <div className="ai-receptionist-grid config">
          <ConfigField label="Nome da IA" value={state.config.assistantName} onChange={(value) => updateConfig("assistantName", value)} />
          <ConfigField label="Tom de voz" value={state.config.tone} onChange={(value) => updateConfig("tone", value)} />
          <ConfigField label="Horario de funcionamento" value={state.config.businessHours} onChange={(value) => updateConfig("businessHours", value)} />
          <ConfigField label="Formas de pagamento" value={state.config.paymentMethods} onChange={(value) => updateConfig("paymentMethods", value)} />
          <ConfigField area label="Mensagem inicial" value={state.config.openingMessage} onChange={(value) => updateConfig("openingMessage", value)} />
          <ConfigField area label="Mensagem fora do horario" value={state.config.afterHoursMessage} onChange={(value) => updateConfig("afterHoursMessage", value)} />
          <ConfigField area label="Servicos disponiveis" value={state.config.services} onChange={(value) => updateConfig("services", value)} />
          <ConfigField area label="Tabela de precos por porte, raca, pelo e servico" value={state.config.priceTable} onChange={(value) => updateConfig("priceTable", value)} />
          <ConfigField area label="Regras de atraso" value={state.config.delayRules} onChange={(value) => updateConfig("delayRules", value)} />
          <ConfigField area label="Regras de cancelamento" value={state.config.cancelRules} onChange={(value) => updateConfig("cancelRules", value)} />
          <ConfigField area label="Regioes de busca e leva" value={state.config.pickupRegions} onChange={(value) => updateConfig("pickupRegions", value)} />
          <ConfigField area label="Regras de desconto e pacotinho" value={`${state.config.discountRules}\n${state.config.packageRules}`} onChange={(value) => {
            const [discountRules, ...packageLines] = value.split("\n");
            persist({ ...state, config: { ...state.config, discountRules, packageRules: packageLines.join("\n") } });
          }} />
          <ConfigField area wide label="Quando chamar atendimento humano" value={state.config.humanHandoff} onChange={(value) => updateConfig("humanHandoff", value)} />
          <SafetyCard />
        </div>
      ) : null}

      {activeTab === "knowledge" ? (
        <div className="ai-receptionist-two-col">
          <section className="ai-receptionist-card">
            <div className="ai-receptionist-card-head">
              <strong>Nova informacao para a IA</strong>
              <span>Perguntas, respostas, politicas, servicos e instrucoes internas.</span>
            </div>
            <div className="ai-receptionist-form">
              <input value={knowledgeDraft.title} onChange={(event) => setKnowledgeDraft({ ...knowledgeDraft, title: event.target.value })} placeholder="Titulo curto" />
              <select value={knowledgeDraft.category} onChange={(event) => setKnowledgeDraft({ ...knowledgeDraft, category: event.target.value })}>
                <option>Servicos</option>
                <option>Precos</option>
                <option>Politicas</option>
                <option>Pacotinhos</option>
                <option>Instrucoes internas</option>
                <option>Seguranca</option>
              </select>
              <textarea value={knowledgeDraft.content} onChange={(event) => setKnowledgeDraft({ ...knowledgeDraft, content: event.target.value })} placeholder="Escreva exatamente o que a IA precisa saber." />
              <button type="button" className="ai-receptionist-primary" onClick={addKnowledge}>Adicionar na base</button>
            </div>
          </section>
          <section className="ai-receptionist-list">
            {state.knowledge.map((item) => (
              <article key={item.id} className="ai-receptionist-knowledge-item">
                <div>
                  <span>{item.category}</span>
                  <strong>{item.title}</strong>
                </div>
                <p>{item.content}</p>
                <button type="button" onClick={() => removeKnowledge(item.id)}>Remover</button>
              </article>
            ))}
          </section>
        </div>
      ) : null}

      {activeTab === "flows" ? (
        <div className="ai-receptionist-flow-grid">
          {state.flows.map((flow) => (
            <article key={flow.id} className={flow.active ? "ai-receptionist-flow-card active" : "ai-receptionist-flow-card"}>
              <div className="ai-receptionist-flow-top">
                <strong>{flow.title}</strong>
                <button type="button" onClick={() => toggleFlow(flow.id)}>{flow.active ? "Ligado" : "Desligado"}</button>
              </div>
              <p>{flow.description}</p>
            </article>
          ))}
        </div>
      ) : null}

      {activeTab === "ops" ? (
        <div className="ai-receptionist-two-col ops">
          <section className="ai-receptionist-card">
            <div className="ai-receptionist-card-head">
              <strong>Teste de atendimento completo</strong>
              <span>Simula cliente novo, cadastro de tutor, cadastro de pet e reserva na agenda.</span>
            </div>
            <div className="ai-receptionist-form two">
              <input value={state.draft.tutorName} onChange={(event) => updateDraft("tutorName", event.target.value)} placeholder="Nome do tutor" />
              <input value={state.draft.phone} onChange={(event) => updateDraft("phone", event.target.value)} placeholder="Telefone" />
              <input value={state.draft.petName} onChange={(event) => updateDraft("petName", event.target.value)} placeholder="Nome do pet" />
              <input value={state.draft.breed} onChange={(event) => updateDraft("breed", event.target.value)} placeholder="Raca" />
              <input value={state.draft.size} onChange={(event) => updateDraft("size", event.target.value)} placeholder="Porte" />
              <input value={state.draft.age} onChange={(event) => updateDraft("age", event.target.value)} placeholder="Idade" />
              <input value={state.draft.service} onChange={(event) => updateDraft("service", event.target.value)} placeholder="Servico" />
              <input value={state.draft.price} onChange={(event) => updateDraft("price", event.target.value)} placeholder="Valor" />
              <input type="date" value={state.draft.date} onChange={(event) => updateDraft("date", event.target.value)} />
              <input type="time" value={state.draft.time} onChange={(event) => updateDraft("time", event.target.value)} />
              <textarea value={state.draft.behavior} onChange={(event) => updateDraft("behavior", event.target.value)} placeholder="Observacoes, comportamento e preferencias" />
            </div>
            <div className="ai-receptionist-actions">
              <button type="button" className="ai-receptionist-primary" onClick={createDemoRecords}>Criar cadastro e agendamento</button>
              <NavLink className="ai-receptionist-secondary" to="/agenda">Ver agenda</NavLink>
              <NavLink className="ai-receptionist-secondary" to="/cadastros">Ver cadastros</NavLink>
            </div>
          </section>
          <section className="ai-receptionist-card">
            <div className="ai-receptionist-card-head">
              <strong>Regras de operacao segura</strong>
              <span>Limites que protegem a loja e deixam o atendimento profissional.</span>
            </div>
            <ul className="ai-receptionist-checklist">
              <li>Consulta horarios livres antes de prometer agenda.</li>
              <li>Reserva somente depois de confirmacao do tutor.</li>
              <li>Nao confirma preco sem porte, raca, pelo e servico.</li>
              <li>Salva tutor, pet, observacoes, comportamento e servicos preferidos.</li>
              <li>Chama humano em reclamacao, emergencia ou saude do pet.</li>
            </ul>
          </section>
        </div>
      ) : null}

      {activeTab === "conversations" ? (
        <div className="ai-receptionist-conversations">
          <div className="ai-receptionist-status-row">
            {Object.entries(statusLabels).map(([status, label]) => (
              <span key={status} className={`ai-receptionist-status-pill ${status.replaceAll(" ", "-")}`}>
                {label}: {state.conversations.filter((item) => item.status === status).length}
              </span>
            ))}
          </div>
          <div className="ai-receptionist-table-wrap">
            <table className="ai-receptionist-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Pet</th>
                  <th>Canal</th>
                  <th>Status</th>
                  <th>Intencao</th>
                  <th>Valor</th>
                  <th>Acao</th>
                </tr>
              </thead>
              <tbody>
                {state.conversations.map((conversation) => (
                  <tr key={conversation.id}>
                    <td>{conversation.tutor}</td>
                    <td>{conversation.pet}</td>
                    <td>{conversation.channel}</td>
                    <td><span className={`ai-receptionist-status-pill ${conversation.status.replaceAll(" ", "-")}`}>{statusLabels[conversation.status]}</span></td>
                    <td>{conversation.intent}</td>
                    <td>{formatCurrency(conversation.value)}</td>
                    <td>
                      <select value={conversation.status} onChange={(event) => updateConversationStatus(conversation.id, event.target.value)}>
                        {Object.keys(statusLabels).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {activeTab === "training" ? (
        <div className="ai-receptionist-two-col">
          <section className="ai-receptionist-metrics">
            <Metric label="Conversas atendidas" value={metrics.conversations} />
            <Metric label="Agendamentos criados" value={metrics.scheduled} />
            <Metric label="Taxa de conversao" value={`${metrics.conversion}%`} />
            <Metric label="Clientes reativados" value={metrics.reactivated} />
            <Metric label="Faturamento gerado" value={formatCurrency(metrics.revenue)} />
            <Metric label="Servicos extras vendidos" value={metrics.extras} />
            <Metric label="Pacotinhos oferecidos" value={metrics.packageOffers} />
            <Metric label="Pacotinhos fechados" value={metrics.packageClosed} />
            <Metric label="Transferidos para humano" value={metrics.handoff} />
          </section>
          <section className="ai-receptionist-card">
            <div className="ai-receptionist-card-head">
              <strong>Modo treinamento</strong>
              <span>Corrija respostas e salve exemplos para proximos atendimentos.</span>
            </div>
            <div className="ai-receptionist-form">
              <textarea value={trainingDraft.original} onChange={(event) => setTrainingDraft({ ...trainingDraft, original: event.target.value })} placeholder="Resposta que a IA deu" />
              <textarea value={trainingDraft.corrected} onChange={(event) => setTrainingDraft({ ...trainingDraft, corrected: event.target.value })} placeholder="Como a IA deveria responder" />
              <input value={trainingDraft.tag} onChange={(event) => setTrainingDraft({ ...trainingDraft, tag: event.target.value })} placeholder="Etiqueta" />
              <button type="button" className="ai-receptionist-primary" onClick={addTrainingExample}>Salvar exemplo</button>
            </div>
            <div className="ai-receptionist-training-list">
              {state.training.map((item) => (
                <article key={item.id}>
                  <span>{item.tag}</span>
                  <p><strong>Antes:</strong> {item.original}</p>
                  <p><strong>Depois:</strong> {item.corrected}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function ConfigField({ label, value, onChange, area = false, wide = false }) {
  return (
    <label className={wide ? "ai-receptionist-field wide" : "ai-receptionist-field"}>
      <span>{label}</span>
      {area ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function SafetyCard() {
  return (
    <article className="ai-receptionist-safety-card">
      <strong>Regras de seguranca obrigatorias</strong>
      <p>A IA nunca da diagnostico veterinario, nunca promete preco sem dados suficientes e nunca oferece desconto fora da regra.</p>
      <p>Em saude do pet, emergencia, reclamacao ou duvida sem resposta, ela pausa e chama atendimento humano.</p>
    </article>
  );
}

function Metric({ label, value }) {
  return (
    <article className="ai-receptionist-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
